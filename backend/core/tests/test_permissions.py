from types import SimpleNamespace

from django.contrib.auth.models import AnonymousUser

from accounts.models import User
from core.permissions import IsDev, IsTester


def request_for(user):
    return SimpleNamespace(user=user)


def test_is_dev():
    assert IsDev().has_permission(request_for(User(role=User.Role.DEV)), None)
    assert not IsDev().has_permission(request_for(User(role=User.Role.TESTER)), None)


def test_is_tester():
    assert IsTester().has_permission(request_for(User(role=User.Role.TESTER)), None)
    assert not IsTester().has_permission(request_for(User(role=User.Role.DEV)), None)


def test_anonymous_is_refused():
    assert not IsDev().has_permission(request_for(AnonymousUser()), None)
    assert not IsTester().has_permission(request_for(AnonymousUser()), None)
