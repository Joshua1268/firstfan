import base64
import json
import time
from urllib.parse import parse_qs, urlsplit

import pytest

from accounts import google
from accounts.models import TesterProfile, User

CLIENT_ID = "client-123.apps.googleusercontent.com"


@pytest.fixture(autouse=True)
def google_keys(settings, db):
    settings.GOOGLE_CLIENT_ID = CLIENT_ID
    settings.GOOGLE_CLIENT_SECRET = "secret"
    settings.SITE_URL = "https://site.test"


def id_token(**claims) -> str:
    body = {
        "iss": "https://accounts.google.com",
        "aud": CLIENT_ID,
        "exp": time.time() + 300,
        "email": "Kofi@Gmail.com",
        "email_verified": True,
        "given_name": "Kofi",
    } | claims
    payload = base64.urlsafe_b64encode(json.dumps(body).encode()).rstrip(b"=").decode()
    return f"header.{payload}.signature"


@pytest.fixture
def google_returns(monkeypatch):
    def set_claims(**claims):
        token = id_token(**claims)
        monkeypatch.setattr(google, "exchange_code", lambda code: {"id_token": token})

    set_claims()
    return set_claims


def start(client, **params):
    query = {"intent": "login"} | params
    return client.get("/api/auth/google/start/", query)


def callback(client, **params):
    response = start(client, **params)
    state = parse_qs(urlsplit(response["Location"]).query)["state"][0]
    return client.get("/api/auth/google/callback/", {"code": "abc", "state": state})


def test_status_reports_enabled(client, settings):
    assert client.get("/api/auth/google/").json() == {"enabled": True}
    settings.GOOGLE_CLIENT_SECRET = ""
    assert client.get("/api/auth/google/").json() == {"enabled": False}


def test_start_disabled_redirects_back(client, settings):
    settings.GOOGLE_CLIENT_ID = ""
    r = start(client)
    assert r.status_code == 302 and r["Location"] == "/connexion?google=indisponible"


def test_start_redirects_to_google_with_state(client):
    r = start(client, next="/dev/projets")
    url = urlsplit(r["Location"])
    params = parse_qs(url.query)
    assert r.status_code == 302 and url.netloc == "accounts.google.com"
    assert params["client_id"] == [CLIENT_ID]
    assert params["redirect_uri"] == ["https://site.test/api/auth/google/callback/"]
    assert params["scope"] == ["openid email profile"]
    assert params["prompt"] == ["select_account"]
    assert client.session[google.SESSION_KEY]["state"] == params["state"][0]
    assert client.session[google.SESSION_KEY]["next"] == "/dev/projets"


def test_start_rejects_bad_intent_and_role(client):
    assert start(client, intent="admin")["Location"] == "/connexion?google=invalide"
    assert start(client, intent="signup", role="admin")["Location"] == "/connexion?google=invalide"


def test_callback_rejects_wrong_state(client, google_returns, dev_user):
    start(client)
    r = client.get("/api/auth/google/callback/", {"code": "abc", "state": "forged"})
    assert r["Location"] == "/connexion?google=invalide"
    assert "_auth_user_id" not in client.session


def test_state_is_single_use(client, google_returns, dev_user):
    r = start(client)
    state = parse_qs(urlsplit(r["Location"]).query)["state"][0]
    google_returns(email="dev@x.ci")
    first = client.get("/api/auth/google/callback/", {"code": "abc", "state": state})
    client.logout()
    second = client.get("/api/auth/google/callback/", {"code": "abc", "state": state})
    assert first["Location"] == "/dev" and second["Location"] == "/connexion?google=invalide"


def test_callback_cancelled(client):
    start(client)
    r = client.get("/api/auth/google/callback/", {"error": "access_denied"})
    assert r["Location"] == "/connexion?google=annule"


def test_signup_dev(client, google_returns):
    r = callback(client, intent="signup", role="dev")
    assert r.status_code == 302 and r["Location"] == "/dev"
    user = User.objects.get(username="kofi@gmail.com")
    assert user.role == "dev" and user.first_name == "Kofi" and not user.has_usable_password()
    assert client.get("/api/auth/me/").json()["email"] == "kofi@gmail.com"


def test_signup_tester_with_consent(client, google_returns):
    r = callback(client, intent="signup", role="tester", consent="1")
    assert r["Location"] == "/testeur/profil"
    profile = TesterProfile.objects.get(user__username="kofi@gmail.com")
    assert profile.consent_at is not None and profile.user.role == "tester"


def test_signup_tester_without_consent_refused(client):
    r = start(client, intent="signup", role="tester")
    assert r["Location"] == "/inscription?google=consentement"
    assert google.SESSION_KEY not in client.session


def test_login_existing_account(client, google_returns, tester_user):
    google_returns(email="Tester@X.ci")
    r = callback(client, next="/testeur/missions")
    assert r["Location"] == "/testeur/missions"
    assert client.get("/api/auth/me/").json()["email"] == "tester@x.ci"


def test_signup_with_existing_email_logs_in(client, google_returns, dev_user):
    google_returns(email="dev@x.ci")
    r = callback(client, intent="signup", role="tester", consent="1")
    assert r["Location"] == "/dev"
    assert User.objects.get(username="dev@x.ci").role == "dev"


def test_login_unknown_email(client, google_returns):
    r = callback(client)
    assert r["Location"] == "/inscription?google=inconnu"
    assert not User.objects.exists()


def test_unverified_email_refused(client, google_returns, dev_user):
    google_returns(email="dev@x.ci", email_verified=False)
    r = callback(client)
    assert r["Location"] == "/connexion?google=refuse"
    assert "_auth_user_id" not in client.session


@pytest.mark.parametrize(
    "claims",
    [{"aud": "someone-else"}, {"iss": "https://evil.com"}, {"exp": time.time() - 10}],
)
def test_invalid_token_refused(client, google_returns, dev_user, claims):
    google_returns(email="dev@x.ci", **claims)
    r = callback(client)
    assert r["Location"] == "/connexion?google=invalide"
    assert "_auth_user_id" not in client.session


@pytest.mark.parametrize("next_path", ["//evil.com", "https://evil.com", "/\\evil.com", "dev"])
def test_external_next_ignored(client, google_returns, dev_user, next_path):
    google_returns(email="dev@x.ci")
    assert callback(client, next=next_path)["Location"] == "/dev"
