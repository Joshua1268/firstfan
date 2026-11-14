import pytest

from accounts.models import TesterProfile
from accounts.services import grant_check
from campaigns.models import Application, Campaign, Invitation
from campaigns.services import eligible_testers
from conftest import make_tester


def select(client, campaign, ids):
    return client.post(
        f"/api/campaigns/{campaign.pk}/selection/", {"tester_ids": ids}, content_type="application/json"
    )


def test_eligible_order(campaign):
    low = make_tester("low@x.ci", rating_avg="4.10")
    unrated = make_tester("unrated@x.ci")
    first_top = make_tester("first@x.ci", rating_avg="4.80")
    second_top = make_tester("second@x.ci", rating_avg="4.80")
    busy_top = make_tester("busy@x.ci", rating_avg="4.80")
    applicant = make_tester("applicant@x.ci", rating_avg="3.00")
    Application.objects.create(campaign=campaign, tester=applicant)
    past = Campaign.objects.create(project=campaign.project, target_profession="Comptable", testers_wanted=1)
    Invitation.objects.create(campaign=past, tester=busy_top, status=Invitation.Status.VALIDATED)
    assert list(eligible_testers(campaign)) == [applicant, busy_top, first_top, second_top, low, unrated]


def test_owner_is_never_eligible(campaign, dev_user):
    TesterProfile.objects.create(user=dev_user, profession="Comptable", momo_number="0700000009")
    grant_check(dev_user, "Comptable")
    assert dev_user not in eligible_testers(campaign)


def test_open_campaign_takes_any_tester_without_check(campaign):
    campaign.target_profession = ""
    campaign.save()
    unchecked = make_tester("unchecked@x.ci", profession="Couturière", verified=False)
    no_momo = make_tester("nomomo@x.ci", momo_number="", verified=False)
    assert list(eligible_testers(campaign)) == [unchecked]
    assert no_momo not in eligible_testers(campaign)


def test_testers_endpoint(dev_client, campaign):
    first = make_tester("a@x.ci", rating_avg="4.90", city="Plateau", last_name="Kone")
    second = make_tester("b@x.ci", rating_avg="4.50")
    third = make_tester("c@x.ci")
    Invitation.objects.create(campaign=campaign, tester=third)
    rows = dev_client.get(f"/api/campaigns/{campaign.pk}/testers/").json()["candidates"]
    assert [r["id"] for r in rows] == [first.pk, second.pk, third.pk]
    assert rows[0] == {
        "id": first.pk,
        "first_name": "Test",
        "last_initial": "K",
        "profession": "Comptable",
        "city": "Plateau",
        "rating_avg": 4.9,
        "completed_tests": 0,
        "applied": False,
        "recommended": True,
        "selected": False,
        "reason": "Métier Comptable vérifié, note 4,9, aucun test validé",
    }
    assert [(r["recommended"], r["selected"]) for r in rows[1:]] == [(True, False), (False, True)]
    assert rows[2]["rating_avg"] is None


def test_select_testers_replaces_selection(dev_client, campaign):
    a, b, c = (make_tester(f"{n}@x.ci") for n in "abc")
    assert select(dev_client, campaign, [a.pk, b.pk]).status_code == 204
    assert select(dev_client, campaign, [c.pk]).status_code == 204
    assert list(campaign.invitations.values_list("tester_id", "status")) == [(c.pk, "selected")]


@pytest.mark.parametrize(
    "profile",
    [
        {"verified": False},
        {"available": False},
        {"profession": "Pharmacienne"},
    ],
)
def test_cannot_invite_unverified(dev_client, campaign, profile):
    tester = make_tester("t@x.ci", **profile)
    r = select(dev_client, campaign, [tester.pk])
    assert r.status_code == 400
    assert r.json() == {"tester_ids": ["Testeur non disponible pour cette campagne."]}
    assert not campaign.invitations.exists()


def test_selection_size(dev_client, campaign):
    ids = [make_tester(f"{n}@x.ci").pk for n in "abc"]
    assert select(dev_client, campaign, []).status_code == 400
    assert select(dev_client, campaign, ids).status_code == 400
    assert not campaign.invitations.exists()


def test_selection_only_in_draft(dev_client, campaign):
    tester = make_tester("t@x.ci")
    campaign.status = Campaign.Status.OPEN
    campaign.save()
    assert select(dev_client, campaign, [tester.pk]).status_code == 409


def test_selection_of_other_dev_404(other_dev_client, tester_client, campaign):
    tester = make_tester("t@x.ci")
    assert other_dev_client.get(f"/api/campaigns/{campaign.pk}/testers/").status_code == 404
    assert select(other_dev_client, campaign, [tester.pk]).status_code == 404
    assert select(tester_client, campaign, [tester.pk]).status_code == 403
    assert not campaign.invitations.exists()
