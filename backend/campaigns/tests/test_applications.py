from datetime import timedelta

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone

from accounts.models import ProfessionCheck
from campaigns.models import Application, Campaign
from conftest import client_for, make_tester

PDF = b"%PDF-1.7\n" + b"\x00" * 32
CHECKS_URL = "/api/tester/checks/"


@pytest.fixture(autouse=True)
def _media(settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path


def post_form(client, url, data):
    return client.post(url, data)


def piece(**extra):
    return {
        "document_type": "work_certificate",
        "document": SimpleUploadedFile("attestation.pdf", PDF),
        "consent": "true",
    } | extra


def apply(client, campaign, data=None):
    return post_form(client, f"/api/tester/campaigns/{campaign.pk}/apply/", data or {})


@pytest.fixture
def newcomer(db):
    return make_tester("newcomer@x.ci", verified=False)


@pytest.fixture
def newcomer_client(newcomer):
    return client_for(newcomer)


def test_checks_list_documents_of_my_profession(newcomer_client):
    body = newcomer_client.get(CHECKS_URL).json()
    assert body["profession"] == "Comptable" and body["status"] is None and body["checks"] == []
    values = [d["value"] for d in body["documents"]]
    assert values == ["order_card", "work_certificate", "payslip", "workplace_photo"]


def test_submit_check(newcomer_client, newcomer):
    r = post_form(newcomer_client, CHECKS_URL, piece(sponsor_email="awa@x.ci"))
    assert r.status_code == 201 and r.json()["status"] == "pending"
    check = newcomer.profession_checks.get()
    assert check.profession == "Comptable" and check.sponsor_email == "awa@x.ci"
    assert check.document.name.startswith("profession_checks/") and "attestation" not in check.document.name
    assert newcomer_client.get(CHECKS_URL).json()["status"] == "pending"
    assert post_form(newcomer_client, CHECKS_URL, piece()).status_code == 409


@pytest.mark.parametrize(
    "extra, field",
    [
        ({"consent": "false"}, "consent"),
        ({"document_type": "bar_card"}, "document_type"),
        ({"document": SimpleUploadedFile("faux.pdf", b"not a pdf at all")}, "document"),
    ],
)
def test_submit_check_refusals(newcomer_client, newcomer, extra, field):
    r = post_form(newcomer_client, CHECKS_URL, piece(**extra))
    assert r.status_code == 400 and field in r.json()
    assert not newcomer.profession_checks.exists()


def test_recruiting_campaigns(newcomer_client, campaign):
    open_to_all = Campaign.objects.create(project=campaign.project, target_profession="", testers_wanted=1)
    Campaign.objects.create(project=campaign.project, target_profession="Médecin", testers_wanted=1)
    Campaign.objects.create(
        project=campaign.project, target_profession="Comptable", testers_wanted=1, status="open"
    )
    stale = Campaign.objects.create(project=campaign.project, target_profession="", testers_wanted=1)
    Campaign.objects.filter(pk=stale.pk).update(created_at=timezone.now() - timedelta(days=31))
    rows = newcomer_client.get("/api/tester/campaigns/").json()
    assert [r["id"] for r in rows] == [open_to_all.pk, campaign.pk]
    assert rows[1]["project"] == {"name": "Compta Express", "description": "Suivi des factures"}
    assert rows[1]["applied"] is False and rows[1]["steps_total"] == campaign.steps.count()


def test_open_campaign_needs_no_piece(newcomer_client, newcomer, campaign):
    campaign.target_profession = ""
    campaign.save()
    assert apply(newcomer_client, campaign).status_code == 204
    assert apply(newcomer_client, campaign).status_code == 204
    assert Application.objects.filter(campaign=campaign, tester=newcomer).count() == 1
    assert not newcomer.profession_checks.exists()


def test_targeted_campaign_asks_for_a_piece(newcomer_client, newcomer, campaign, dev_client):
    r = apply(newcomer_client, campaign)
    assert r.status_code == 400 and "document" in r.json()
    assert apply(newcomer_client, campaign, piece()).status_code == 204
    assert newcomer.profession_checks.get().status == ProfessionCheck.Status.PENDING
    body = dev_client.get(f"/api/campaigns/{campaign.pk}/testers/").json()
    assert newcomer.pk not in [c["id"] for c in body["candidates"]]
    assert [a["id"] for a in body["awaiting_check"]] == [newcomer.pk]
    r = dev_client.post(
        f"/api/campaigns/{campaign.pk}/selection/",
        {"tester_ids": [newcomer.pk]},
        content_type="application/json",
    )
    assert r.status_code == 400


def test_verified_applicant_comes_first(tester_client, tester_user, campaign, dev_client):
    make_tester("top@x.ci", rating_avg="5.00")
    assert apply(tester_client, campaign).status_code == 204
    rows = dev_client.get(f"/api/campaigns/{campaign.pk}/testers/").json()["candidates"]
    assert rows[0]["id"] == tester_user.pk and rows[0]["applied"] is True
    assert rows[0]["reason"].startswith("A postulé, ")


def test_cannot_apply_elsewhere(newcomer_client, campaign):
    campaign.target_profession = "Médecin"
    campaign.save()
    assert apply(newcomer_client, campaign, piece()).status_code == 404
    campaign.target_profession = ""
    campaign.status = Campaign.Status.OPEN
    campaign.save()
    assert apply(newcomer_client, campaign).status_code == 404


def test_incomplete_profile_cannot_apply(campaign):
    client = client_for(make_tester("nomomo@x.ci", momo_number="", verified=False))
    r = apply(client, campaign, piece())
    assert r.status_code == 400 and "Complète ton profil" in r.json()["detail"]


def test_dev_cannot_apply(dev_client, campaign):
    assert apply(dev_client, campaign).status_code == 403
