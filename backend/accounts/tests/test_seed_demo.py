from datetime import timedelta
from io import StringIO

import pytest
from django.core.management import CommandError, call_command
from django.utils import timezone

from accounts.management.commands.seed_demo import DEMO_TESTERS
from accounts.models import ProfessionCheck, TesterProfile, User
from campaigns.models import Campaign, Feedback, Invitation, Rating, StepProof
from campaigns.services import eligible_testers
from payments.models import Earning
from projects.models import Project
from public.services import get_public_stats
from tracking.models import TrackEvent
from tracking.services import adoption_rows

VERIFIED = sum(1 for t in DEMO_TESTERS if t[4])
DEV_EMAIL = "demo-dev@firstfan.demo"
TESTER_EMAIL = "demo-testeur@firstfan.demo"
PASSWORD = "Demo-pass-2026!"


@pytest.fixture(autouse=True)
def _media(settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path


def test_seed_demo_makes_public_stats_non_zero_and_is_idempotent(db, settings):
    settings.DEMO_MODE = True
    call_command("seed_demo")
    call_command("seed_demo")
    assert User.objects.filter(username__startswith="demo-testeur-").count() == len(DEMO_TESTERS)
    assert TesterProfile.objects.count() == len(DEMO_TESTERS) + 1
    stats = get_public_stats()
    assert stats["verified_testers"] == VERIFIED + 1
    assert stats["tests_in_progress"] == 1 and stats["apps_tested"] == 1
    assert not User.objects.get(username="demo-testeur-01").has_usable_password()


def test_seed_demo_refuses_outside_demo_mode(db, settings):
    settings.DEMO_MODE = False
    with pytest.raises(CommandError):
        call_command("seed_demo")
    assert not User.objects.exists()
    call_command("seed_demo", "--force")
    verified = ProfessionCheck.objects.filter(status=ProfessionCheck.Status.VERIFIED)
    assert verified.values("tester").distinct().count() == VERIFIED + 1


def test_seed_demo_profiles_have_momo_and_are_available(db, settings):
    settings.DEMO_MODE = True
    call_command("seed_demo")
    first = TesterProfile.objects.get(user__username="demo-testeur-01")
    assert first.momo_number == "0700000001" and first.available
    assert TesterProfile.objects.filter(momo_number="", available=True).count() == 0


def test_seed_demo_scenario_idempotent(db, settings):
    settings.DEMO_MODE = True
    settings.DEMO_PASSWORD = PASSWORD
    call_command("seed_demo")
    events = TrackEvent.objects.count()
    out = StringIO()
    call_command("seed_demo", stdout=out)
    assert "0 créés" in out.getvalue()
    assert Project.objects.count() == 1 and Campaign.objects.count() == 3
    drafts = Campaign.objects.filter(status=Campaign.Status.DRAFT, is_demo=False)
    assert sorted(drafts.values_list("target_profession", flat=True)) == ["", "Comptable"]
    assert TrackEvent.objects.count() == events > 0
    dev = User.objects.get(username=DEV_EMAIL)
    assert dev.email == DEV_EMAIL and dev.check_password(PASSWORD)
    project = Project.objects.get()
    assert project.owner == dev and project.name == "Compta Express (démo)"
    campaign = Campaign.objects.get(is_demo=True)
    assert campaign.target_profession == "Comptable"
    assert campaign.steps.count() == 3
    statuses = sorted(campaign.invitations.values_list("status", flat=True))
    assert statuses == [Invitation.Status.ACCEPTED, Invitation.Status.SUBMITTED, Invitation.Status.VALIDATED]
    assert StepProof.objects.count() == 8 and Feedback.objects.count() == 2
    assert Rating.objects.count() == 3 and Earning.objects.count() == 1
    assert StepProof.objects.first().capture.read().startswith(b"\x89PNG")


def test_seed_demo_has_exactly_one_test_to_validate(db, settings):
    settings.DEMO_MODE = True
    call_command("seed_demo")
    call_command("seed_demo")
    campaign = Campaign.objects.get(is_demo=True)
    assert campaign.invitations.filter(status=Invitation.Status.SUBMITTED).count() == 1
    in_progress = campaign.invitations.get(status=Invitation.Status.ACCEPTED)
    assert 0 < in_progress.session.proofs.count() < campaign.steps.count()


def test_seed_demo_dates_come_before_the_tests(db, settings):
    settings.DEMO_MODE = True
    call_command("seed_demo")
    project = Project.objects.get()
    sessions = [i.session for i in Invitation.objects.select_related("session")]
    first_start = min(s.started_at for s in sessions)
    assert project.created_at < first_start and project.fingerprinted_at < first_start
    for session in sessions:
        for proof in session.proofs.all():
            assert session.started_at < proof.created_at < session.started_at + timedelta(hours=1)
    assert len({p.capture.read() for p in StepProof.objects.all()}) == 3


@pytest.mark.parametrize("email", [DEV_EMAIL, TESTER_EMAIL])
def test_seed_demo_accounts_can_log_in(client, db, settings, email):
    settings.DEMO_MODE = True
    settings.DEMO_PASSWORD = PASSWORD
    call_command("seed_demo")
    call_command("seed_demo")
    r = client.post(
        "/api/auth/login/", {"email": email, "password": PASSWORD}, content_type="application/json"
    )
    assert r.status_code == 200


def test_seed_demo_tester_is_eligible_for_accountant_campaigns(db, settings, campaign):
    settings.DEMO_MODE = True
    call_command("seed_demo")
    tester = User.objects.get(username=TESTER_EMAIL)
    profile = tester.tester_profile
    assert profile.is_complete and profile.momo_number
    assert eligible_testers(campaign).filter(pk=tester.pk).exists()


def test_seed_demo_repairs_legacy_dev_username(client, db, settings):
    settings.DEMO_MODE = True
    settings.DEMO_PASSWORD = PASSWORD
    User.objects.create_user("demo-dev", DEV_EMAIL, "old", role=User.Role.DEV)
    call_command("seed_demo")
    assert not User.objects.filter(username="demo-dev").exists()
    assert User.objects.filter(email=DEV_EMAIL).count() == 1
    r = client.post(
        "/api/auth/login/", {"email": DEV_EMAIL, "password": PASSWORD}, content_type="application/json"
    )
    assert r.status_code == 200


def test_seed_demo_prints_generated_password_once(db, settings):
    settings.DEMO_MODE = True
    settings.DEMO_PASSWORD = ""
    first, second = StringIO(), StringIO()
    call_command("seed_demo", stdout=first)
    call_command("seed_demo", stdout=second)
    password = first.getvalue().split("une seule fois) : ")[1].split()[0]
    for output in (first.getvalue(), second.getvalue()):
        assert DEV_EMAIL in output and TESTER_EMAIL in output
    assert password not in second.getvalue()
    for email in (DEV_EMAIL, TESTER_EMAIL):
        assert User.objects.get(username=email).check_password(password)


def test_seed_demo_adoption_mixed(db, settings):
    settings.DEMO_MODE = True
    call_command("seed_demo")
    rows = adoption_rows(Project.objects.get(), timezone.now())
    assert len(rows) == 3
    values = {row[window] for row in rows for window in ("d1", "d7", "d30")}
    assert {True, False, None} <= values
    ages = sorted((timezone.now() - row["started_at"]).days for row in rows)
    assert ages == [3, 12, 35]
