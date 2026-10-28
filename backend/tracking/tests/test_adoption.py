from datetime import timedelta

import pytest
from django.utils import timezone
from django.utils.dateparse import parse_datetime

from campaigns.models import Campaign, Invitation, TestSession
from conftest import make_tester
from tracking.models import TrackEvent
from tracking.services import adoption_rows, last_event_by_invitation


@pytest.fixture
def session_started_10_days_ago(campaign, tester_user):
    campaign.status = Campaign.Status.OPEN
    campaign.save()
    invitation = Invitation.objects.create(
        campaign=campaign, tester=tester_user, status=Invitation.Status.VALIDATED
    )
    return TestSession.objects.create(invitation=invitation, started_at=timezone.now() - timedelta(days=10))


def add_event(session, delta):
    invitation = session.invitation
    return TrackEvent.objects.create(
        project=invitation.campaign.project,
        invitation=invitation,
        url="https://compta.example",
        created_at=session.started_at + delta,
    )


def test_adoption_windows(db, session_started_10_days_ago):
    session = session_started_10_days_ago
    add_event(session, timedelta(hours=1))
    add_event(session, timedelta(days=8))
    [row] = adoption_rows(session.invitation.campaign.project, timezone.now())
    assert row["invitation_id"] == session.invitation.pk
    assert row["tester_first_name"] == "Awa" and row["profession"] == "Comptable"
    assert row["started_at"] == session.started_at
    assert (row["d1"], row["d7"], row["d30"]) == (False, True, None)


def test_adoption_day_one_return(db, session_started_10_days_ago):
    session = session_started_10_days_ago
    add_event(session, timedelta(days=2))
    [row] = adoption_rows(session.invitation.campaign.project, timezone.now())
    assert (row["d1"], row["d7"], row["d30"]) == (True, False, None)


def test_adoption_ignores_invitations_without_session(db, session_started_10_days_ago, campaign):
    Invitation.objects.create(campaign=campaign, tester=make_tester("idle@x.ci"))
    assert len(adoption_rows(campaign.project, timezone.now())) == 1


def test_last_event_by_invitation(db, session_started_10_days_ago):
    session = session_started_10_days_ago
    add_event(session, timedelta(hours=1))
    last = add_event(session, timedelta(days=3))
    assert last_event_by_invitation([session.invitation.pk]) == {session.invitation.pk: last.created_at}
    assert last_event_by_invitation([]) == {}


def test_adoption_api(dev_client, session_started_10_days_ago, campaign):
    add_event(session_started_10_days_ago, timedelta(days=8))
    data = dev_client.get(f"/api/projects/{campaign.project.pk}/adoption/").json()
    assert data["demo"] is False
    assert [(r["d1"], r["d7"], r["d30"]) for r in data["rows"]] == [(False, True, None)]
    Campaign.objects.filter(pk=campaign.pk).update(is_demo=True)
    assert dev_client.get(f"/api/projects/{campaign.project.pk}/adoption/").json()["demo"] is True


def test_adoption_other_dev_404(other_dev_client, campaign):
    assert other_dev_client.get(f"/api/projects/{campaign.project.pk}/adoption/").status_code == 404


def test_live_row_has_last_event(dev_client, session_started_10_days_ago, campaign):
    event = add_event(session_started_10_days_ago, timedelta(days=3))
    row = dev_client.get(f"/api/campaigns/{campaign.pk}/live/").json()[0]
    assert parse_datetime(row["last_event_at"]) == event.created_at
