import os
import subprocess
import sys
from pathlib import Path

import pytest

BACKEND = Path(__file__).resolve().parents[2]

PROD_ENV = {
    "DEBUG": "false",
    "SECRET_KEY": "une-cle-de-test-longue-et-aleatoire-0123456789abcdef",
    "ALLOWED_HOSTS": "nom.example",
    "CSRF_TRUSTED_ORIGINS": "https://nom.example",
    "DEMO_MODE": "true",
}

PROBE = (
    "import django; django.setup(); from django.conf import settings as s; "
    "print(s.SESSION_COOKIE_SECURE, s.CSRF_COOKIE_SECURE, s.SECURE_PROXY_SSL_HEADER, s.SECURE_HSTS_SECONDS, "
    "s.CSRF_TRUSTED_ORIGINS, s.REST_FRAMEWORK['DEFAULT_RENDERER_CLASSES'])"
)


def run_settings(**overrides):
    env = {k: v for k, v in os.environ.items() if k not in PROD_ENV}
    env.update(PROD_ENV)
    for key, value in overrides.items():
        if value is None:
            env.pop(key, None)
        else:
            env[key] = value
    env["DJANGO_SETTINGS_MODULE"] = "config.settings"
    return subprocess.run([sys.executable, "-c", PROBE], cwd=BACKEND, env=env, capture_output=True, text=True)


def test_complete_production_env_starts_hardened():
    r = run_settings()
    assert r.returncode == 0, r.stderr
    assert "True True ('HTTP_X_FORWARDED_PROTO', 'https') 31536000 ['https://nom.example']" in r.stdout
    assert "BrowsableAPIRenderer" not in r.stdout and "JSONRenderer" in r.stdout


@pytest.mark.parametrize(
    ("overrides", "message"),
    [
        ({"SECRET_KEY": None}, "SECRET_KEY"),
        ({"SECRET_KEY": "dev-insecure-key-change-me"}, "SECRET_KEY"),
        ({"ALLOWED_HOSTS": None}, "ALLOWED_HOSTS"),
        ({"ALLOWED_HOSTS": "*"}, "ALLOWED_HOSTS"),
        ({"ALLOWED_HOSTS": "nom.example,*"}, "ALLOWED_HOSTS"),
        ({"DEMO_MODE": None}, "DEMO_MODE"),
        ({"CSRF_TRUSTED_ORIGINS": None}, "CSRF_TRUSTED_ORIGINS"),
    ],
)
def test_incomplete_production_env_refuses_to_start(overrides, message):
    r = run_settings(**overrides)
    assert r.returncode != 0
    assert "ImproperlyConfigured" in r.stderr and message in r.stderr


def test_debug_keeps_dev_defaults():
    r = run_settings(
        DEBUG="true", SECRET_KEY=None, ALLOWED_HOSTS=None, DEMO_MODE=None, CSRF_TRUSTED_ORIGINS=None
    )
    assert r.returncode == 0, r.stderr
    assert "BrowsableAPIRenderer" in r.stdout
