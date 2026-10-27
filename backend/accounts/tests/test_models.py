from accounts.management.commands.seed_demo import DEMO_TESTERS
from accounts.models import TesterProfile, User
from accounts.professions import PROFESSIONS
from core.uploads import private_upload_path


def test_user_default_role_is_dev(db):
    u = User.objects.create_user("awa", "awa@x.ci", "pw-123456")
    assert u.role == User.Role.DEV


def test_tester_profile_starts_pending(db):
    u = User.objects.create_user("koffi", "k@x.ci", "pw-123456", role=User.Role.TESTER)
    p = TesterProfile.objects.create(user=u, profession="Comptable")
    assert p.verification == TesterProfile.Verification.PENDING and p.verified_at is None


def test_tester_profile_is_complete(db):
    u = User.objects.create_user("yao", "y@x.ci", "pw-123456", role=User.Role.TESTER)
    p = TesterProfile.objects.create(user=u)
    assert p.available and p.consent_at is None and not p.is_complete
    p.profession = "Comptable"
    p.momo_number = "0700000001"
    assert not p.is_complete
    p.linkedin_url = "https://www.linkedin.com/in/yao"
    assert p.is_complete


def test_professions_cover_demo_testers():
    assert {t[2] for t in DEMO_TESTERS} <= set(PROFESSIONS)
    assert "Développeur web" in PROFESSIONS
    assert len(PROFESSIONS) == len(set(PROFESSIONS)) == 13


def test_proof_gets_random_name(db):
    assert TesterProfile._meta.get_field("proof").upload_to == private_upload_path("proofs")
