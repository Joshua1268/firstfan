from io import StringIO

import pytest
from django.core.management import CommandError, call_command
from django.utils import timezone

from accounts.management.commands.seed_demo import DEMO_TESTERS
from accounts.models import TesterProfile, User
from campaigns.models import Campaign, Feedback, Invitation, Rating, StepProof
from payments.models import Earning
from projects.models import Project
from public.services import get_public_stats
from tracking.models import TrackEvent
from tracking.services import adoption_rows

VERIFIED = sum(1 for t in DEMO_TESTERS if t[4])


@pytest.fixture(autouse=True)
def _media(settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path


def test_seed_demo_makes_public_stats_non_zero_and_is_idempotent(db, settings):
    settings.DEMO_MODE = True
    call_command("seed_demo")
    call_command("seed_demo")
    assert User.objects.filter(username__startswith="demo-testeur-").count() == len(DEMO_TESTERS)
    assert TesterProfile.objects.count() == len(DEMO_TESTERS)
    stats = get_public_stats()
    assert stats["verified_testers"] == VERIFIED > 0
    assert stats["tests_in_progress"] == 0 and stats["apps_tested"] == 1
    assert not User.objects.get(username="demo-testeur-01").has_usable_password()


def test_seed_demo_refuses_outside_demo_mode(db, settings):
    settings.DEMO_MODE = False
    with pytest.raises(CommandError):
        call_command("seed_demo")
    assert not User.objects.exists()
    call_command("seed_demo", "--force")
    assert TesterProfile.objects.filter(verification=TesterProfile.Verification.VERIFIED).count() == VERIFIED


def test_seed_demo_profiles_have_momo_and_are_available(db, settings):
    settings.DEMO_MODE = True
    call_command("seed_demo")
    first = TesterProfile.objects.get(user__username="demo-testeur-01")
    assert first.momo_number == "0700000001" and first.available
    assert TesterProfile.objects.filter(momo_number="", available=True).count() == 0


def test_seed_demo_scenario_idempotent(db, settings):
    settings.DEMO_MODE = True
    settings.DEMO_PASSWORD = "Demo-pass-2026!"
    call_command("seed_demo")
    events = TrackEvent.objects.count()
    out = StringIO()
    call_command("seed_demo", stdout=out)
    assert "0 créés" in out.getvalue()
    assert Project.objects.count() == 1 and Campaign.objects.count() == 1
    assert TrackEvent.objects.count() == events > 0
    dev = User.objects.get(username="demo-dev")
    assert dev.email == "demo-dev@firstfan.demo" and dev.check_password("Demo-pass-2026!")
    project = Project.objects.get()
    assert project.owner == dev and project.name == "Compta Express (démo)"
    campaign = Campaign.objects.get()
    assert campaign.is_demo and campaign.target_profession == "Comptable"
    assert campaign.steps.count() == 3
    assert campaign.invitations.filter(status=Invitation.Status.VALIDATED).count() == 3
    assert StepProof.objects.count() == 9 and Feedback.objects.count() == 3
    assert Rating.objects.count() == 6 and Earning.objects.count() == 3
    assert StepProof.objects.first().capture.read().startswith(b"\x89PNG")


def test_seed_demo_prints_generated_password_once(db, settings):
    settings.DEMO_MODE = True
    settings.DEMO_PASSWORD = ""
    first, second = StringIO(), StringIO()
    call_command("seed_demo", stdout=first)
    call_command("seed_demo", stdout=second)
    assert "demo-dev@firstfan.demo" in first.getvalue()
    assert "Mot de passe" in first.getvalue() and "Mot de passe" not in second.getvalue()
    assert User.objects.get(username="demo-dev").has_usable_password()


def test_seed_demo_adoption_mixed(db, settings):
    settings.DEMO_MODE = True
    call_command("seed_demo")
    rows = adoption_rows(Project.objects.get(), timezone.now())
    assert len(rows) == 3
    values = {row[window] for row in rows for window in ("d1", "d7", "d30")}
    assert {True, False, None} <= values
    ages = sorted((timezone.now() - row["started_at"]).days for row in rows)
    assert ages == [3, 12, 35]
