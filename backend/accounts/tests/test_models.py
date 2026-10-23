from accounts.models import TesterProfile, User


def test_user_default_role_is_dev(db):
    u = User.objects.create_user("awa", "awa@x.ci", "pw-123456")
    assert u.role == User.Role.DEV


def test_tester_profile_starts_pending(db):
    u = User.objects.create_user("koffi", "k@x.ci", "pw-123456", role=User.Role.TESTER)
    p = TesterProfile.objects.create(user=u, profession="Comptable")
    assert p.verification == TesterProfile.Verification.PENDING and p.verified_at is None
