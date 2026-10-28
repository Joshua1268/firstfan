import pytest
from django.contrib.admin.models import LogEntry
from django.core.files.base import ContentFile
from django.utils import timezone

from accounts.models import TesterProfile, User
from campaigns.models import Invitation, Rating, TestSession
from conftest import client_for, make_tester
from payments.models import Withdrawal
from tracking.models import TrackEvent

PROOF_URL = "/api/tester/profile/proof/"


@pytest.fixture(autouse=True)
def _media(settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path


@pytest.fixture
def staff_client(db):
    return client_for(User.objects.create_superuser("staff@x.ci", "staff@x.ci", "Sol1de-pass!"))


def run_action(client, url, action, pk):
    return client.post(url, {"action": action, "_selected_action": [pk]})


def test_reject_action(staff_client):
    tester = make_tester("yao@x.ci")
    r = run_action(staff_client, "/admin/accounts/testerprofile/", "reject", tester.tester_profile.pk)
    assert r.status_code == 302
    profile = TesterProfile.objects.get(user=tester)
    assert profile.verification == TesterProfile.Verification.REJECTED
    assert profile.verified_at is None


def test_proof_link_staff_only(staff_client, dev_client, tester_user):
    profile = tester_user.tester_profile
    profile.proof.save("diplome.pdf", ContentFile(b"%PDF-1.7\n"))
    link = f"{PROOF_URL}?user={tester_user.id}"
    page = staff_client.get("/admin/accounts/testerprofile/").content.decode()
    assert link in page and profile.linkedin_url in page
    assert staff_client.get(link).status_code == 200
    assert dev_client.get(link).status_code == 404
    assert dev_client.get("/admin/accounts/testerprofile/").status_code == 302


@pytest.fixture
def validated_invitation(campaign, tester_user):
    invitation = Invitation.objects.create(
        campaign=campaign, tester=tester_user, status=Invitation.Status.VALIDATED
    )
    session = TestSession.objects.create(invitation=invitation, submitted_at=timezone.now())
    Rating.objects.create(session=session, rater=campaign.project.owner, ratee=tester_user, score=2)
    tester_user.tester_profile.rating_avg = 2
    tester_user.tester_profile.save()
    return invitation


def test_dispute_action(staff_client, validated_invitation):
    url = "/admin/campaigns/invitation/"
    assert run_action(staff_client, url, "open_dispute", validated_invitation.pk).status_code == 302
    validated_invitation.refresh_from_db()
    assert validated_invitation.status == Invitation.Status.SUBMITTED
    # The dev decides again, so the previous rating of the tester is dropped.
    assert not Rating.objects.filter(ratee=validated_invitation.tester).exists()
    assert TesterProfile.objects.get(user=validated_invitation.tester).rating_avg is None
    entry = LogEntry.objects.get(object_id=str(validated_invitation.pk))
    assert "litige" in entry.get_change_message().lower()


def test_dispute_action_skips_untested(staff_client, campaign, tester_user):
    invitation = Invitation.objects.create(campaign=campaign, tester=tester_user, status="sent")
    run_action(staff_client, "/admin/campaigns/invitation/", "open_dispute", invitation.pk)
    invitation.refresh_from_db()
    assert invitation.status == Invitation.Status.SENT
    assert not LogEntry.objects.exists()


def test_money_and_events_are_read_only(staff_client, campaign, tester_user):
    withdrawal = Withdrawal.objects.create(
        tester=tester_user, amount_xof=1000, momo_number="0700000001", provider="simule"
    )
    event = TrackEvent.objects.create(project=campaign.project, url="https://compta.example")
    for url in [
        "/admin/payments/payment/add/",
        "/admin/payments/earning/add/",
        "/admin/payments/withdrawal/add/",
        "/admin/tracking/trackevent/add/",
    ]:
        assert staff_client.get(url).status_code == 403
    r = staff_client.post(f"/admin/payments/withdrawal/{withdrawal.pk}/change/", {"amount_xof": 1})
    assert r.status_code == 403
    assert staff_client.post(f"/admin/tracking/trackevent/{event.pk}/delete/", {"post": "yes"}).status_code == 403
    withdrawal.refresh_from_db()
    assert withdrawal.amount_xof == 1000
