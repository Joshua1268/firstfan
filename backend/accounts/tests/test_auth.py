from django.test import Client

from accounts.models import TesterProfile, User

PASSWORD = "Sol1de-pass!"


def register(client, **data):
    body = {"email": "awa@x.ci", "password": PASSWORD, "first_name": "Awa", "role": "dev"} | data
    return client.post("/api/auth/register/", body, content_type="application/json")


def login(client, email, password):
    return client.post(
        "/api/auth/login/", {"email": email, "password": password}, content_type="application/json"
    )


def test_register_dev_logs_in(client, db):
    r = register(client, email="Awa@X.ci")
    assert r.status_code == 201 and r.json()["role"] == "dev"
    me = client.get("/api/auth/me/").json()
    assert me["email"] == "awa@x.ci" and me["profile_complete"] is True
    assert set(me) == {"id", "email", "first_name", "role", "profile_complete"}
    assert User.objects.get(username="awa@x.ci").check_password(PASSWORD)


def test_register_tester_requires_consent(client, db):
    r = register(client, role="tester")
    assert r.status_code == 400 and "consent" in r.json()
    assert not User.objects.exists()
    r = register(client, role="tester", consent=True)
    assert r.status_code == 201
    assert r.json()["role"] == "tester" and r.json()["profile_complete"] is False
    profile = TesterProfile.objects.get(user__username="awa@x.ci")
    assert profile.consent_at is not None
    assert not profile.user.profession_checks.exists()


def test_register_rejects_admin_role(client, db):
    assert register(client, role="admin").status_code == 400
    assert not User.objects.exists()


def test_register_rejects_weak_password(client, db):
    r = register(client, password="123")
    assert r.status_code == 400 and "password" in r.json()


def test_register_duplicate_email(client, dev_user):
    r = register(client, email="DEV@x.ci")
    assert r.status_code == 400
    assert r.json() == {"email": ["Un compte existe déjà avec cet email."]}


def test_login_ok(client, dev_user):
    r = login(client, "Dev@X.ci", PASSWORD)
    assert r.status_code == 200 and r.json()["email"] == "dev@x.ci"
    assert client.get("/api/auth/me/").status_code == 200


def test_login_wrong_password(client, dev_user):
    r = login(client, "dev@x.ci", "nope")
    assert r.status_code == 400
    assert r.json() == {"detail": "Email ou mot de passe incorrect."}


def test_login_is_throttled(client, dev_user):
    codes = [login(client, "dev@x.ci", "nope").status_code for _ in range(11)]
    assert codes[:10] == [400] * 10 and codes[10] == 429


def test_logout(dev_client):
    assert dev_client.post("/api/auth/logout/").status_code == 204
    assert dev_client.get("/api/auth/me/").status_code == 403


def test_logout_anonymous(client, db):
    assert client.post("/api/auth/logout/").status_code == 204


def test_me_anonymous_403(client, db):
    assert client.get("/api/auth/me/").status_code == 403


def test_me_tester_profile_complete(tester_client):
    assert tester_client.get("/api/auth/me/").json()["profile_complete"] is True


def test_csrf_enforced_on_login(dev_user):
    c = Client(enforce_csrf_checks=True)
    assert login(c, "dev@x.ci", PASSWORD).status_code == 403
    r = c.get("/api/auth/csrf/")
    assert r.status_code == 204
    token = r.cookies["csrftoken"].value
    r = c.post(
        "/api/auth/login/",
        {"email": "dev@x.ci", "password": PASSWORD},
        content_type="application/json",
        HTTP_X_CSRFTOKEN=token,
    )
    assert r.status_code == 200


def test_csrf_enforced_on_register(db):
    c = Client(enforce_csrf_checks=True)
    assert register(c).status_code == 403


def test_professions_public(client, db):
    r = client.get("/api/professions/")
    assert r.status_code == 200
    assert "Comptable" in r.json() and "Développeur web" in r.json()
