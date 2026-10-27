import pytest
from django.core.cache import cache
from django.test import Client
from django.utils import timezone

from accounts.models import TesterProfile, User
from campaigns.models import Campaign, ScenarioStep
from projects.models import Project


@pytest.fixture(autouse=True)
def _clear_throttle_cache():
    # DRF throttle counters live in the cache.
    cache.clear()
    yield
    cache.clear()


@pytest.fixture(autouse=True)
def _fast_password_hasher(settings):
    settings.PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]


def client_for(user: User) -> Client:
    c = Client()
    c.force_login(user)
    return c


@pytest.fixture
def dev_user(db):
    return User.objects.create_user(
        "dev@x.ci", "dev@x.ci", "Sol1de-pass!", first_name="Ama", role=User.Role.DEV
    )


@pytest.fixture
def dev_client(dev_user):
    return client_for(dev_user)


@pytest.fixture
def other_dev_client(db):
    other = User.objects.create_user("other@x.ci", "other@x.ci", "Sol1de-pass!", role=User.Role.DEV)
    return client_for(other)


@pytest.fixture
def tester_user(db):
    user = User.objects.create_user(
        "tester@x.ci", "tester@x.ci", "Sol1de-pass!", first_name="Awa", role=User.Role.TESTER
    )
    TesterProfile.objects.create(
        user=user,
        profession="Comptable",
        city="Plateau",
        linkedin_url="https://www.linkedin.com/in/awa",
        momo_number="0700000001",
        verification=TesterProfile.Verification.VERIFIED,
    )
    return user


@pytest.fixture
def tester_client(tester_user):
    return client_for(tester_user)


def make_tester(email: str, profession: str = "Comptable", last_name: str = "", **profile) -> User:
    user = User.objects.create_user(
        email, email, "Sol1de-pass!", first_name="Test", last_name=last_name, role=User.Role.TESTER
    )
    fields = {
        "profession": profession,
        "momo_number": "0700000009",
        "verification": TesterProfile.Verification.VERIFIED,
        "verified_at": timezone.now(),
    }
    TesterProfile.objects.create(user=user, **(fields | profile))
    return user


@pytest.fixture
def campaign(dev_user):
    project = Project.objects.create(
        owner=dev_user,
        name="Compta Express",
        url="https://compta.example",
        description="Suivi des factures",
        fingerprint="0" * 64,
        fingerprinted_at=timezone.now(),
    )
    campaign = Campaign.objects.create(project=project, target_profession="Comptable", testers_wanted=2)
    ScenarioStep.objects.create(campaign=campaign, order=1, instruction="Crée une facture")
    return campaign
