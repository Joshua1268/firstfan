import hashlib

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile

from projects.certificate import compute_fingerprint
from projects.models import Project

URL = "/api/projects/"
PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 32


@pytest.fixture(autouse=True)
def _media(settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path
    settings.SITE_URL = "https://firstfan.example"


def png(name="ecran.png", extra=b""):
    return SimpleUploadedFile(name, PNG + extra, content_type="image/png")


def create(client, captures=()):
    data = {"name": "Compta Express", "url": "https://compta.example", "description": "Suivi des factures"}
    if captures:
        data["captures"] = list(captures)
    return client.post(URL, data)


def test_create_project_returns_fingerprint(dev_client, dev_user):
    r = create(dev_client, [png(), png("b.png", b"b")])
    assert r.status_code == 201
    body = r.json()
    hashes = [hashlib.sha256(PNG).hexdigest(), hashlib.sha256(PNG + b"b").hexdigest()]
    assert body["captures"] == [{"sha256": h} for h in hashes]
    assert body["fingerprint"] == compute_fingerprint(
        "Compta Express", "https://compta.example", "Suivi des factures", hashes
    )
    project = Project.objects.get(pk=body["id"])
    assert project.owner == dev_user and project.fingerprinted_at is not None
    assert len(body["public_key"]) == 32
    assert body["script_snippet"] == (
        f'<script src="https://firstfan.example/t.js" data-project="{body["public_key"]}" defer></script>'
    )
    assert body["script_seen_at"] is None
    assert set(body) == {
        "id",
        "name",
        "url",
        "description",
        "fingerprint",
        "fingerprinted_at",
        "public_key",
        "script_snippet",
        "script_seen_at",
        "captures",
    }


def test_list_and_detail(dev_client):
    project_id = create(dev_client).json()["id"]
    rows = dev_client.get(URL).json()
    assert [set(row) for row in rows] == [{"id", "name", "url", "created_at"}]
    assert rows[0]["id"] == project_id
    r = dev_client.get(f"{URL}{project_id}/")
    assert r.status_code == 200 and r.json()["captures"] == []


def test_certificate_download(dev_client):
    body = create(dev_client, [png()]).json()
    r = dev_client.get(f"{URL}{body['id']}/certificate/")
    assert r.status_code == 200
    assert r["Content-Type"] == "text/plain; charset=utf-8"
    assert r["Content-Disposition"] == f'attachment; filename="certificat-{body["id"]}.txt"'
    text = r.content.decode()
    assert body["fingerprint"] in text
    assert hashlib.sha256(PNG).hexdigest() in text
    assert "Compta Express" in text and "dev@x.ci" in text and "FirstFan" in text


def test_other_dev_gets_404(dev_client, other_dev_client):
    project_id = create(dev_client).json()["id"]
    assert other_dev_client.get(URL).json() == []
    assert other_dev_client.get(f"{URL}{project_id}/").status_code == 404
    assert other_dev_client.get(f"{URL}{project_id}/certificate/").status_code == 404


def test_tester_cannot_create_project(tester_client):
    assert create(tester_client).status_code == 403
    assert tester_client.get(URL).status_code == 403
    assert not Project.objects.exists()


def test_anonymous_gets_403(client, db):
    assert client.get(URL).status_code == 403


def test_more_than_three_captures_rejected(dev_client):
    r = create(dev_client, [png(f"{i}.png") for i in range(4)])
    assert r.status_code == 400 and "captures" in r.json()
    assert not Project.objects.exists()


def test_fake_capture_rejected(dev_client):
    fake = SimpleUploadedFile("ecran.png", b"%PDF-1.7 not an image")
    r = create(dev_client, [fake])
    assert r.status_code == 400 and "Format refusé" in str(r.json()["captures"])


def test_project_fields_required(dev_client):
    r = dev_client.post(URL, {"name": "", "url": "pas-une-url"})
    assert r.status_code == 400
    assert {"name", "url", "description"} <= set(r.json())
