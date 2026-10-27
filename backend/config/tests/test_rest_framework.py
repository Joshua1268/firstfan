from rest_framework.response import Response
from rest_framework.test import APIRequestFactory
from rest_framework.views import APIView


class DefaultView(APIView):
    def get(self, request):
        return Response({"ok": True})


def test_view_without_explicit_permission_requires_authentication(db):
    r = DefaultView.as_view()(APIRequestFactory().get("/x/"))
    assert r.status_code == 403


def test_basic_auth_is_not_accepted_by_default(db):
    r = DefaultView.as_view()(APIRequestFactory().get("/x/", HTTP_AUTHORIZATION="Basic YTpi"))
    assert r.status_code == 403


def test_public_stats_stays_open_to_anonymous_json_clients(client, db):
    r = client.get("/api/public/stats/", HTTP_ACCEPT="application/json")
    assert r.status_code == 200
    assert r["Content-Type"].startswith("application/json")
    assert set(r.json()) == {"tests_in_progress", "verified_testers", "apps_tested", "demo"}


def test_public_stats_ignores_session_and_csrf(client, db, django_user_model):
    user = django_user_model.objects.create_user(username="u", password="x")
    client.force_login(user)
    assert client.get("/api/public/stats/").status_code == 200


def test_public_stats_is_throttled_generously(client, db):
    from rest_framework.settings import api_settings

    rates = api_settings.DEFAULT_THROTTLE_RATES
    assert rates["anon"] and rates["user"] and rates["public_stats"]
    for _ in range(20):
        assert client.get("/api/public/stats/").status_code == 200
