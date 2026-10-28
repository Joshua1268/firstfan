from decimal import Decimal

import pytest
from django.utils import timezone

from accounts.models import TesterProfile
from campaigns.models import Campaign, Feedback, Invitation, Rating, StepProof, TestSession
from conftest import make_tester
from payments.models import Earning


@pytest.fixture(autouse=True)
def _reward(settings):
    settings.TESTER_REWARD_XOF = 3500


def make_submitted(campaign, tester):
    invitation = Invitation.objects.create(
        campaign=campaign, tester=tester, status=Invitation.Status.SUBMITTED, nda_accepted_at=timezone.now()
    )
    session = TestSession.objects.create(invitation=invitation, submitted_at=timezone.now())
    StepProof.objects.create(session=session, step=campaign.steps.get(order=1), answer="ok", capture="x.png")
    Feedback.objects.create(session=session, usefulness=4, blockers="Rien", would_pay="yes")
    Rating.objects.create(session=session, rater=tester, ratee=campaign.project.owner, score=5)
    return invitation


@pytest.fixture
def submitted(campaign, tester_user):
    campaign.status = Campaign.Status.OPEN
    campaign.save()
    return make_submitted(campaign, tester_user)


def validate(client, invitation, decision="validated", score=5, comment="Top"):
    body = {"decision": decision, "score": score, "comment": comment}
    return client.post(f"/api/invitations/{invitation.pk}/validate/", body, content_type="application/json")


def test_validate_twice_single_earning(dev_client, submitted):
    assert validate(dev_client, submitted).status_code == 200
    assert validate(dev_client, submitted).status_code == 409
    submitted.refresh_from_db()
    assert submitted.status == Invitation.Status.VALIDATED
    assert Earning.objects.filter(invitation=submitted, amount_xof=3500).count() == 1
    assert (
        Rating.objects.filter(session__invitation=submitted, rater=submitted.campaign.project.owner).count()
        == 1
    )


def test_validate_only_submitted(dev_client, submitted):
    Invitation.objects.filter(pk=submitted.pk).update(status=Invitation.Status.ACCEPTED)
    assert validate(dev_client, submitted).status_code == 409
    assert not Earning.objects.exists()
    assert not Rating.objects.filter(rater=submitted.campaign.project.owner).exists()


def test_rejected_has_no_earning(dev_client, submitted):
    assert validate(dev_client, submitted, decision="rejected", score=2).status_code == 200
    submitted.refresh_from_db()
    assert submitted.status == Invitation.Status.REJECTED
    assert not Earning.objects.exists()


def test_validate_rejects_bad_input(dev_client, submitted):
    assert validate(dev_client, submitted, decision="submitted").status_code == 400
    assert validate(dev_client, submitted, score=6).status_code == 400


def test_rating_avg_updated(dev_client, submitted, campaign, tester_user):
    validate(dev_client, submitted, score=5)
    other_campaign = Campaign.objects.create(
        project=campaign.project, target_profession="Comptable", testers_wanted=1
    )
    other_campaign.steps.create(order=1, instruction="Ouvre l'app")
    second = make_submitted(other_campaign, tester_user)
    validate(dev_client, second, decision="rejected", score=2)
    third_campaign = Campaign.objects.create(
        project=campaign.project, target_profession="Comptable", testers_wanted=1
    )
    third_campaign.steps.create(order=1, instruction="Ouvre l'app")
    validate(dev_client, make_submitted(third_campaign, tester_user), score=4)
    profile = TesterProfile.objects.get(user=tester_user)
    assert profile.rating_avg == Decimal("3.67")


def test_validate_other_dev_404(other_dev_client, submitted):
    assert validate(other_dev_client, submitted).status_code == 404
    assert not Earning.objects.exists()


def test_tester_cannot_validate(tester_client, submitted):
    assert validate(tester_client, submitted).status_code == 403


def test_live_rows(dev_client, submitted, campaign):
    Invitation.objects.create(campaign=campaign, tester=make_tester("sel@x.ci"))
    rows = dev_client.get(f"/api/campaigns/{campaign.pk}/live/").json()
    assert len(rows) == 1
    row = rows[0]
    proof = StepProof.objects.get()
    assert row["invitation_id"] == submitted.pk
    assert row["tester"] == {"first_name": "Awa", "profession": "Comptable", "rating_avg": None}
    assert row["status"] == "submitted"
    assert row["last_event_at"] is None
    assert row["proofs"] == [
        {
            "id": proof.pk,
            "step_order": 1,
            "answer": "ok",
            "capture_url": f"/api/proofs/{proof.pk}/capture/",
            "updated_at": row["proofs"][0]["updated_at"],
        }
    ]
    assert row["feedback"]["would_pay"] == "yes"
    assert row["dev_rating"] is None
    validate(dev_client, submitted, score=4, comment="Bien")
    row = dev_client.get(f"/api/campaigns/{campaign.pk}/live/").json()[0]
    assert row["dev_rating"] == {"score": 4, "comment": "Bien"}
    assert row["tester"]["rating_avg"] == 4.0


def test_live_other_dev_404(other_dev_client, campaign):
    assert other_dev_client.get(f"/api/campaigns/{campaign.pk}/live/").status_code == 404
