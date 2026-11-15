from accounts.management.commands.seed_demo import DEMO_TESTERS
from accounts.models import ProfessionCheck, TesterProfile, User
from accounts.professions import PROFESSIONS, documents_for
from core.uploads import private_upload_path


def test_user_default_role_is_dev(db):
    u = User.objects.create_user("awa", "awa@x.ci", "pw-123456")
    assert u.role == User.Role.DEV


def test_tester_profile_is_complete(db):
    u = User.objects.create_user("yao", "y@x.ci", "pw-123456", role=User.Role.TESTER)
    p = TesterProfile.objects.create(user=u)
    assert p.available and p.consent_at is None and not p.is_complete
    p.profession = "Comptable"
    assert not p.is_complete
    p.momo_number = "0700000001"
    assert p.is_complete


def test_professions_cover_demo_testers():
    assert {t[2] for t in DEMO_TESTERS} <= set(PROFESSIONS)
    assert "Développeur web" in PROFESSIONS
    assert len(PROFESSIONS) == len(set(PROFESSIONS)) == 16


def test_check_document_gets_random_name():
    field = ProfessionCheck._meta.get_field("document")
    assert field.upload_to == private_upload_path("profession_checks")


def test_every_profession_accepts_a_workplace_photo():
    for profession in PROFESSIONS:
        assert ProfessionCheck.Document.WORKPLACE_PHOTO in documents_for(profession)
    assert documents_for("Médecin")[:2] == [
        ProfessionCheck.Document.ORDER_CARD,
        ProfessionCheck.Document.PRO_CARD,
    ]
