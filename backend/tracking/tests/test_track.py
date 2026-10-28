from datetime import timedelta

import pytest
from django.test import Client
from django.utils import timezone

from campaigns.models import Campaign, Invitation
from conftest import client_for, make_tester
from projects.models import Project
from tracking.models import TrackEvent


def track(client, body):
    return client.post("/api/track/", data=body, content_type="text/plain")


@pytest.fixture
def open_campaign(campaign, tester_user):
    campaign.status = Campaign.Status.OPEN
    campaign.save()
    Invitation.objects.create(campaign=campaign, tester=tester_user, status=Invitation.Status.ACCEPTED)
    return campaign


@pytest.fixture
def other_project(open_campaign):
    owner = make_tester("owner2@x.ci")
    return Project.objects.create(
        owner=owner,
        name="Autre",
        url="https://autre.example",
        description="x",
        fingerprint="1" * 64,
        fingerprinted_at=timezone.now(),
    )


def test_track_unknown_key_204(client, db):
    r = client.post("/api/track/", data='{"k":"nope","u":"https://x"}', content_type="text/plain")
    assert r.status_code == 204 and TrackEvent.objects.count() == 0


def test_track_links_invitation_and_marks_script(db, open_campaign):
    project = open_campaign.project
    invitation = open_campaign.invitations.get()
    client = Client(enforce_csrf_checks=True)
    body = f'{{"k":"{project.public_key}","t":"{invitation.token}","u":"https://compta.example/a"}}'
    assert track(client, body).status_code == 204
    event = TrackEvent.objects.get()
    assert event.project == project and event.invitation == invitation
    assert event.url == "https://compta.example/a"
    project.refresh_from_db()
    seen = project.script_seen_at
    assert seen is not None
    assert track(client, body).status_code == 204
    project.refresh_from_db()
    assert project.script_seen_at == seen


def test_track_ignores_token_of_other_project(client, db, open_campaign, other_project):
    invitation = open_campaign.invitations.get()
    body = f'{{"k":"{other_project.public_key}","t":"{invitation.token}","u":"https://autre.example"}}'
    assert track(client, body).status_code == 204
    event = TrackEvent.objects.get()
    assert event.project == other_project and event.invitation is None


def test_track_without_token(client, db, open_campaign):
    body = f'{{"k":"{open_campaign.project.public_key}","u":"https://compta.example"}}'
    assert track(client, body).status_code == 204
    assert TrackEvent.objects.get().invitation is None


def test_track_truncates_long_url(client, db, open_campaign):
    body = f'{{"k":"{open_campaign.project.public_key}","u":"https://x/{"a" * 900}"}}'
    assert track(client, body).status_code == 204
    assert len(TrackEvent.objects.get().url) == 500


@pytest.mark.parametrize(
    "body", ["", "not json", "[1, 2]", '{"k": 12}', '{"k": null, "u": "x"}', '{"u": "x"}', b"\xff\xfe"]
)
def test_track_garbage_body_204(client, db, body):
    assert track(client, body).status_code == 204
    assert TrackEvent.objects.count() == 0


def test_track_is_throttled(client, db):
    codes = [track(client, "{}").status_code for _ in range(121)]
    assert codes[:120] == [204] * 120 and codes[120] == 429


def test_script_served(client, db):
    r = client.get("/t.js")
    assert r.status_code == 200
    assert r["Content-Type"].startswith("application/javascript")
    assert r["Cache-Control"] == "public, max-age=300"
    assert len(r.content) <= 1536
    assert b"data-project" in r.content and b"/api/track/" in r.content


def test_script_status(dev_client, open_campaign):
    project = open_campaign.project
    url = f"/api/projects/{project.pk}/script-status/"
    assert dev_client.get(url).json() == {"script_seen_at": None, "events_last_24h": 0}
    track(dev_client, f'{{"k":"{project.public_key}","u":"https://compta.example"}}')
    TrackEvent.objects.create(project=project, url="old", created_at=timezone.now() - timedelta(days=2))
    data = dev_client.get(url).json()
    assert data["script_seen_at"] is not None and data["events_last_24h"] == 1


def test_script_status_other_dev_404(other_dev_client, tester_user, open_campaign):
    pk = open_campaign.project.pk
    assert other_dev_client.get(f"/api/projects/{pk}/script-status/").status_code == 404
    assert client_for(tester_user).get(f"/api/projects/{pk}/script-status/").status_code == 403
