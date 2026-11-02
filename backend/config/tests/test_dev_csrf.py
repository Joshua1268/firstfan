import pytest
from django.test import Client

LOGIN = {"email": "nobody@x.ci", "password": "wrong-pass-123"}


def post_login_with_origin(origin):
    client = Client(enforce_csrf_checks=True)
    client.get("/api/auth/csrf/")
    token = client.cookies["csrftoken"].value
    return client.post(
        "/api/auth/login/",
        LOGIN,
        content_type="application/json",
        HTTP_HOST="127.0.0.1:8010",
        HTTP_ORIGIN=origin,
        HTTP_X_CSRFTOKEN=token,
    )


@pytest.mark.parametrize("origin", ["http://localhost:3000", "http://127.0.0.1:3000"])
def test_next_dev_origin_passes_csrf(db, origin):
    assert post_login_with_origin(origin).status_code == 400


def test_unknown_origin_is_rejected(db):
    assert post_login_with_origin("http://evil.example").status_code == 403
