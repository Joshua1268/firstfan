from django.test import override_settings

from accounts.models import TesterProfile, User
from campaigns.models import Invitation
from conftest import make_tester as make_campaign_tester


def make_tester(username, verification):
    user = User.objects.create_user(username=username, password="x", role=User.Role.TESTER)
    return TesterProfile.objects.create(user=user, profession="QA", verification=verification)


@override_settings(DEMO_MODE=True)
def test_stats_counts_only_verified_testers(client, db):
    make_tester("a", TesterProfile.Verification.VERIFIED)
    make_tester("b", TesterProfile.Verification.PENDING)
    r = client.get("/api/public/stats/")
    assert r.status_code == 200
    assert r.json() == {"tests_in_progress": 0, "verified_testers": 1, "apps_tested": 0, "demo": True}
    assert "max-age=15" in r["Cache-Control"]


@override_settings(DEMO_MODE=False)
def test_stats_demo_flag_off(client, db):
    assert client.get("/api/public/stats/").json()["demo"] is False


def test_stats_counts_accepted_and_validated(client, campaign):
    statuses = [
        Invitation.Status.ACCEPTED,
        Invitation.Status.ACCEPTED,
        Invitation.Status.SUBMITTED,
        Invitation.Status.VALIDATED,
        Invitation.Status.VALIDATED,
    ]
    for n, status in enumerate(statuses):
        Invitation.objects.create(campaign=campaign, tester=make_campaign_tester(f"t{n}@x.ci"), status=status)
    body = client.get("/api/public/stats/").json()
    assert body["tests_in_progress"] == 2
    assert body["apps_tested"] == 1


def test_stats_never_exposes_amounts(client, db):
    assert not any(k for k in client.get("/api/public/stats/").json() if "amount" in k or "fcfa" in k)
