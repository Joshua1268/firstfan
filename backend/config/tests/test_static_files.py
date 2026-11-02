from django.core.management import call_command
from django.test import Client


def test_admin_css_is_served_without_debug(settings, tmp_path):
    settings.DEBUG = False
    settings.STATIC_ROOT = tmp_path
    call_command("collectstatic", interactive=False, verbosity=0)

    response = Client().get("/static/admin/css/base.css")

    assert response.status_code == 200
    assert response["Content-Type"].startswith("text/css")
