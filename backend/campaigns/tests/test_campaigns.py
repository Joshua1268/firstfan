import pytest

from accounts.models import User
from campaigns.models import Campaign, Invitation, ScenarioStep, StepProof, TestSession
from projects.models import Project


@pytest.fixture
def project(dev_user):
    return Project.objects.create(
        owner=dev_user,
        name="Compta Express",
        url="https://compta.example",
        description="Suivi des factures",
        fingerprint="0" * 64,
        fingerprinted_at="2026-10-27T10:00:00Z",
    )


def post_campaign(client, project_id, **data):
    body = {"target_profession": "Comptable", "testers_wanted": 3, "steps": ["Crée une facture", "Envoie-la"]}
    return client.post(f"/api/projects/{project_id}/campaigns/", body | data, content_type="application/json")


def test_create_campaign(dev_client, project):
    r = post_campaign(dev_client, project.pk)
    assert r.status_code == 201
    body = r.json()
    assert body["project"] == {"id": project.pk, "name": "Compta Express", "url": "https://compta.example"}
    assert body["status"] == "draft" and body["is_demo"] is False
    assert body["steps"] == [
        {"order": 1, "instruction": "Crée une facture"},
        {"order": 2, "instruction": "Envoie-la"},
    ]
    assert body["payment"] is None and body["invitations"] == []
    rows = dev_client.get(f"/api/projects/{project.pk}/campaigns/").json()
    assert rows == [
        {
            "id": body["id"],
            "target_profession": "Comptable",
            "testers_wanted": 3,
            "status": "draft",
            "created_at": rows[0]["created_at"],
        }
    ]


def test_campaign_validation(dev_client, project):
    r = post_campaign(dev_client, project.pk, steps=[])
    assert r.status_code == 400 and "steps" in r.json()
    r = post_campaign(dev_client, project.pk, steps=[f"Étape {i}" for i in range(11)])
    assert r.status_code == 400 and "steps" in r.json()
    r = post_campaign(dev_client, project.pk, target_profession="Astronaute")
    assert r.status_code == 400 and "target_profession" in r.json()
    for wanted in (0, 11):
        r = post_campaign(dev_client, project.pk, testers_wanted=wanted)
        assert r.status_code == 400 and "testers_wanted" in r.json()
    r = post_campaign(dev_client, project.pk, steps=["x" * 501])
    assert r.status_code == 400
    assert not Campaign.objects.exists()


def test_campaign_total(dev_client, project, settings):
    settings.PRICE_PER_TESTER_XOF = 5000
    body = post_campaign(dev_client, project.pk, testers_wanted=3).json()
    assert body["price_per_tester_xof"] == 5000
    assert body["total_xof"] == 15000


def test_campaign_invitation_rows(dev_client, project, tester_user):
    campaign_id = post_campaign(dev_client, project.pk).json()["id"]
    campaign = Campaign.objects.get(pk=campaign_id)
    invitation = Invitation.objects.create(campaign=campaign, tester=tester_user)
    session = TestSession.objects.create(invitation=invitation)
    StepProof.objects.create(session=session, step=ScenarioStep.objects.get(campaign=campaign, order=1))
    rows = dev_client.get(f"/api/campaigns/{campaign_id}/").json()["invitations"]
    assert rows == [
        {
            "id": invitation.pk,
            "tester": {"id": tester_user.pk, "first_name": "Awa", "profession": "Comptable"},
            "status": "selected",
            "steps_done": 1,
            "steps_total": 2,
        }
    ]


def test_other_dev_gets_404(dev_client, other_dev_client, project):
    campaign_id = post_campaign(dev_client, project.pk).json()["id"]
    assert other_dev_client.get(f"/api/projects/{project.pk}/campaigns/").status_code == 404
    assert post_campaign(other_dev_client, project.pk).status_code == 404
    assert other_dev_client.get(f"/api/campaigns/{campaign_id}/").status_code == 404
    assert Campaign.objects.count() == 1


def test_tester_cannot_open_campaigns(tester_client, project):
    assert tester_client.get(f"/api/projects/{project.pk}/campaigns/").status_code == 403
    assert post_campaign(tester_client, project.pk).status_code == 403


def test_invitation_token_is_unique(project, tester_user):
    campaign = Campaign.objects.create(project=project, target_profession="Comptable", testers_wanted=1)
    other = User.objects.create_user("t2@x.ci", "t2@x.ci", "Sol1de-pass!", role=User.Role.TESTER)
    first = Invitation.objects.create(campaign=campaign, tester=tester_user)
    second = Invitation.objects.create(campaign=campaign, tester=other)
    assert first.token and first.token != second.token
