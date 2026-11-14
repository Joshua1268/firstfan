import json

import httpx
import pytest

from campaigns import matching
from campaigns.matching import MatchPick, rank_testers
from campaigns.models import Campaign, Invitation
from conftest import make_tester


@pytest.fixture
def testers(campaign):
    first = make_tester("a@x.ci", rating_avg="4.80", city="Plateau")
    second = make_tester("b@x.ci", rating_avg="4.20")
    third = make_tester("c@x.ci")
    past = Campaign.objects.create(project=campaign.project, target_profession="Comptable", testers_wanted=1)
    for tester in (first, second):
        Invitation.objects.create(campaign=past, tester=tester, status=Invitation.Status.VALIDATED)
    return [first, second, third]


@pytest.fixture
def page(monkeypatch):
    monkeypatch.setattr(matching, "read_page_text", lambda url: "Factures en 2 clics")


def answer(*picks) -> str:
    return json.dumps({"picks": [{"tester_id": pk, "reason": reason} for pk, reason in picks]})


def fail(prompt):
    raise httpx.ReadTimeout("slow")


def test_rules_fallback_without_key(monkeypatch, campaign, testers):
    monkeypatch.setattr(matching, "read_page_text", fail)
    result = rank_testers(campaign)
    assert result.source == "rules"
    assert result.picks == [
        MatchPick(testers[0].pk, "Métier Comptable vérifié, note 4,8, 1 test validé"),
        MatchPick(testers[1].pk, "Métier Comptable vérifié, note 4,2, 1 test validé"),
        MatchPick(testers[2].pk, "Métier Comptable vérifié, pas encore noté, aucun test validé"),
    ]


def test_ai_order_and_reasons_used(settings, monkeypatch, page, campaign, testers):
    settings.GROQ_API_KEY = "test-key"
    first, second, third = testers
    reply = answer((third.pk, "Habite près du client"), (first.pk, "Très bien notée"), (second.pk, "Fiable"))
    monkeypatch.setattr(matching, "_ask_groq", lambda prompt: reply)
    result = rank_testers(campaign)
    assert result.source == "groq"
    assert result.picks == [
        MatchPick(third.pk, "Habite près du client"),
        MatchPick(first.pk, "Très bien notée"),
        MatchPick(second.pk, "Fiable"),
    ]


def test_mistral_used_when_groq_fails(settings, monkeypatch, page, campaign, testers):
    settings.GROQ_API_KEY = "test-key"
    settings.MISTRAL_API_KEY = "test-key"
    monkeypatch.setattr(matching, "_ask_groq", fail)
    reply = answer(*((t.pk, "Bon profil") for t in reversed(testers)))
    monkeypatch.setattr(matching, "_ask_mistral", lambda prompt: reply)
    result = rank_testers(campaign)
    assert result.source == "mistral"
    assert [p.tester_id for p in result.picks] == [t.pk for t in reversed(testers)]


def test_ai_unknown_ids_dropped_and_missing_appended(settings, monkeypatch, page, campaign, testers):
    settings.GROQ_API_KEY = "test-key"
    first, second, third = testers
    long_reason = "x" * 300
    reply = answer((999999, "Inconnu"), (str(second.pk), long_reason), (second.pk, "Doublon"))
    monkeypatch.setattr(matching, "_ask_groq", lambda prompt: reply)
    result = rank_testers(campaign)
    assert result.source == "groq"
    assert [p.tester_id for p in result.picks] == [second.pk, first.pk, third.pk]
    assert result.picks[0].reason == "x" * 140
    assert result.picks[1].reason == "Métier Comptable vérifié, note 4,8, 1 test validé"


@pytest.mark.parametrize("reply", ["pas du json", '{"picks": [{"tester_id": 999999, "reason": "?"}]}', "[]"])
def test_ai_bad_answer_falls_back(settings, monkeypatch, page, campaign, testers, reply):
    settings.GROQ_API_KEY = "test-key"
    monkeypatch.setattr(matching, "_ask_groq", lambda prompt: reply)
    assert rank_testers(campaign).source == "rules"


def test_ai_timeout_falls_back(settings, monkeypatch, page, campaign, testers):
    settings.GROQ_API_KEY = "test-key"
    settings.MISTRAL_API_KEY = "test-key"
    monkeypatch.setattr(matching, "_ask_groq", fail)
    monkeypatch.setattr(matching, "_ask_mistral", fail)
    result = rank_testers(campaign)
    assert result.source == "rules"
    assert [p.tester_id for p in result.picks] == [t.pk for t in testers]


def test_prompt_has_no_personal_data(settings, monkeypatch, page, campaign, testers):
    settings.GROQ_API_KEY = "test-key"
    tester = testers[0]
    tester.first_name, tester.last_name = "Mariam", "Kouassi"
    tester.save()
    prompts = []

    def ask(prompt):
        prompts.append(prompt)
        return answer((tester.pk, "Bon profil"))

    monkeypatch.setattr(matching, "_ask_groq", ask)
    rank_testers(campaign)
    prompt = prompts[0]
    for private in ("Mariam", "Kouassi", "a@x.ci", "0700000009"):
        assert private not in prompt
    for shared in ("Compta Express", "https://compta.example", "Crée une facture", "Factures en 2 clics"):
        assert shared in prompt
    assert f'"id": {tester.pk}' in prompt
    assert '"city": "Plateau"' in prompt


def test_result_cached_until_eligibles_change(settings, monkeypatch, page, campaign, testers):
    settings.GROQ_API_KEY = "test-key"
    calls = []

    def ask(prompt):
        calls.append(prompt)
        return answer(*((t.pk, "Bon profil") for t in testers))

    monkeypatch.setattr(matching, "_ask_groq", ask)
    rank_testers(campaign)
    rank_testers(campaign)
    assert len(calls) == 1
    newcomer = make_tester("d@x.ci")
    picks = rank_testers(campaign).picks
    assert len(calls) == 2
    assert picks[-1].tester_id == newcomer.pk


def test_testers_endpoint_shape(dev_client, campaign, testers):
    Invitation.objects.create(campaign=campaign, tester=testers[2])
    body = dev_client.get(f"/api/campaigns/{campaign.pk}/testers/").json()
    assert body["source"] == "rules"
    assert [c["id"] for c in body["candidates"]] == [t.pk for t in testers]
    assert body["candidates"][0] == {
        "id": testers[0].pk,
        "first_name": "Test",
        "last_initial": "",
        "profession": "Comptable",
        "city": "Plateau",
        "rating_avg": 4.8,
        "completed_tests": 1,
        "applied": False,
        "recommended": True,
        "selected": False,
        "reason": "Métier Comptable vérifié, note 4,8, 1 test validé",
    }
    flags = [(c["recommended"], c["selected"]) for c in body["candidates"]]
    assert flags == [(True, False), (True, False), (False, True)]


def test_testers_endpoint_uses_ai_order(settings, monkeypatch, page, dev_client, campaign, testers):
    settings.GROQ_API_KEY = "test-key"
    first, second, third = testers
    reply = answer((third.pk, "Idéal"), (second.pk, "Bien"), (first.pk, "Correct"))
    monkeypatch.setattr(matching, "_ask_groq", lambda prompt: reply)
    body = dev_client.get(f"/api/campaigns/{campaign.pk}/testers/").json()
    assert body["source"] == "groq"
    assert [(c["id"], c["recommended"], c["reason"]) for c in body["candidates"]] == [
        (third.pk, True, "Idéal"),
        (second.pk, True, "Bien"),
        (first.pk, False, "Correct"),
    ]
