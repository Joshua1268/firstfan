import pytest
from django.core.management import CommandError, call_command

from accounts.management.commands.seed_demo import DEMO_TESTERS
from accounts.models import TesterProfile, User
from public.services import get_public_stats

VERIFIED = sum(1 for t in DEMO_TESTERS if t[4])


def test_seed_demo_makes_public_stats_non_zero_and_is_idempotent(db, settings):
    settings.DEMO_MODE = True
    call_command("seed_demo")
    call_command("seed_demo")
    assert User.objects.filter(username__startswith="demo-testeur-").count() == len(DEMO_TESTERS)
    assert TesterProfile.objects.count() == len(DEMO_TESTERS)
    stats = get_public_stats()
    assert stats["verified_testers"] == VERIFIED > 0
    assert stats["tests_in_progress"] == 0 and stats["apps_tested"] == 0
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
