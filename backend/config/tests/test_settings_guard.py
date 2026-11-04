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


def run_settings(probe=PROBE, **overrides):
    env = {k: v for k, v in os.environ.items() if k not in PROD_ENV}
    env.update(PROD_ENV)
    for key, value in overrides.items():
        if value is None:
            env.pop(key, None)
        else:
            env[key] = value
    env["DJANGO_SETTINGS_MODULE"] = "config.settings"
    return subprocess.run([sys.executable, "-c", probe], cwd=BACKEND, env=env, capture_output=True, text=True)


def test_complete_production_env_starts_hardened():
    r = run_settings()
    assert r.returncode == 0, r.stderr
    assert "True True ('HTTP_X_FORWARDED_PROTO', 'https') 31536000 ['https://nom.example']" in r.stdout
    assert "BrowsableAPIRenderer" not in r.stdout and "JSONRenderer" in r.stdout


@pytest.mark.parametrize(
    ("overrides", "message"),
    [
        ({"SECRET_KEY": None}, "SECRET_KEY"),
        ({"SECRET_KEY": ""}, "SECRET_KEY"),
        ({"SECRET_KEY": "dev-insecure-key-change-me"}, "SECRET_KEY"),
        ({"ALLOWED_HOSTS": None}, "ALLOWED_HOSTS"),
        ({"ALLOWED_HOSTS": "*"}, "ALLOWED_HOSTS"),
        ({"ALLOWED_HOSTS": "nom.example,*"}, "ALLOWED_HOSTS"),
        ({"DEMO_MODE": None}, "DEMO_MODE"),
        ({"DEMO_MODE": ""}, "DEMO_MODE"),
        ({"CSRF_TRUSTED_ORIGINS": None}, "CSRF_TRUSTED_ORIGINS"),
        ({"CSRF_TRUSTED_ORIGINS": ""}, "CSRF_TRUSTED_ORIGINS"),
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


def test_debug_treats_blank_values_as_unset():
    # The .env template leaves prod-only keys blank in dev.
    probe = (
        "import django; django.setup(); from django.conf import settings as s; "
        "print(s.SECRET_KEY, s.CSRF_TRUSTED_ORIGINS[0])"
    )
    blank = dict.fromkeys(("SECRET_KEY", "ALLOWED_HOSTS", "DEMO_MODE", "CSRF_TRUSTED_ORIGINS"), "")
    r = run_settings(probe, DEBUG="true", **blank)
    assert r.returncode == 0, r.stderr
    assert r.stdout.strip() == "dev-insecure-key-change-me http://localhost:3000"


STATIC_PROBE = "import django; django.setup(); from django.conf import settings as s; print(s.STATIC_ROOT)"


def test_static_root_is_defined():
    r = run_settings(STATIC_PROBE)
    assert r.returncode == 0, r.stderr
    assert r.stdout.strip().endswith("staticfiles")


HOST_PROBE = (
    "import django; django.setup(); from django.test import RequestFactory; f = RequestFactory(); "
    "print(f.get('/', HTTP_HOST='nom.example').get_host(), f.get('/', HTTP_HOST='backend:8000').get_host())"
)


def test_production_accepts_backend_host_next_to_domain():
    # Next server-side rendering calls Django with the "backend" host.
    r = run_settings(HOST_PROBE, ALLOWED_HOSTS="nom.example,backend")
    assert r.returncode == 0, r.stderr
    assert r.stdout.strip() == "nom.example backend:8000"
