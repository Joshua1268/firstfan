import pytest
from django.core.management import CommandError, call_command

from accounts.models import ProfessionCheck, User
from accounts.services import check_status


def test_e2e_tester_creates_verified_tester(db, settings):
    settings.DEBUG = True
    call_command(
        "e2e_tester", "--email", "awa@x.ci", "--profession", "Comptable", "--password", "Sol1de-pass!"
    )
    call_command("e2e_tester", "--email", "awa@x.ci", "--profession", "Pharmacienne")
    user = User.objects.get(email="awa@x.ci")
    assert user.role == User.Role.TESTER and user.check_password("Sol1de-pass!")
    profile = user.tester_profile
    assert profile.profession == "Pharmacienne" and profile.available and profile.momo_number
    assert profile.is_complete
    assert check_status(user, "Pharmacienne") == ProfessionCheck.Status.VERIFIED


def test_e2e_tester_rejects_unknown_profession(db, settings):
    settings.DEBUG = True
    with pytest.raises(CommandError):
        call_command("e2e_tester", "--email", "awa@x.ci", "--profession", "Astronaute")
    assert not User.objects.exists()


def test_e2e_tester_refuses_in_prod(db, settings):
    settings.DEBUG = False
    with pytest.raises(CommandError):
        call_command("e2e_tester", "--email", "awa@x.ci", "--profession", "Comptable")
    assert not User.objects.exists()
