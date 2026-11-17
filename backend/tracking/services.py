from datetime import datetime, timedelta
from typing import TypedDict

from django.db.models import Max
from django.utils import timezone

from campaigns.models import Invitation
from projects.models import Project

from .models import TrackEvent

# J1: days 1 to 6, J7: days 7 to 29, J30: day 30 on.
WINDOWS = {"d1": (1, 7), "d7": (7, 30), "d30": (30, None)}


class AdoptionRow(TypedDict):
    invitation_id: int
    tester_first_name: str
    profession: str
    started_at: datetime
    d1: bool | None
    d7: bool | None
    d30: bool | None


def record_event(*, key: str, token: str | None, url: str) -> None:
    project = Project.objects.filter(public_key=key).first()
    if project is None:
        return
    invitation = None
    if token:
        invitation = Invitation.objects.filter(token=token, campaign__project=project).first()
    TrackEvent.objects.create(project=project, invitation=invitation, url=url[:500])
    Project.objects.filter(pk=project.pk, script_seen_at__isnull=True).update(script_seen_at=timezone.now())


def script_status(project: Project) -> dict:
    since = timezone.now() - timedelta(hours=24)
    return {
        "script_seen_at": project.script_seen_at,
        "events_last_24h": project.events.filter(created_at__gte=since).count(),
    }


def last_event_by_invitation(invitation_ids: list[int]) -> dict[int, datetime]:
    rows = (
        TrackEvent.objects.filter(invitation_id__in=invitation_ids)
        .values("invitation_id")
        .annotate(last=Max("created_at"))
    )
    return {row["invitation_id"]: row["last"] for row in rows}


def returned_in_window(started_at: datetime, events: list[datetime], now: datetime, window) -> bool | None:
    start_day, end_day = window
    start = started_at + timedelta(days=start_day)
    if now < start:
        return None
    end = started_at + timedelta(days=end_day) if end_day else None
    return any(start <= e and (end is None or e < end) for e in events)


def adoption_rows(project: Project, now: datetime) -> list[AdoptionRow]:
    invitations = (
        Invitation.objects.filter(campaign__project=project, session__isnull=False)
        .select_related("session", "tester__tester_profile")
        .order_by("session__started_at", "pk")
    )
    events: dict[int, list[datetime]] = {}
    for invitation_id, created_at in TrackEvent.objects.filter(invitation__in=invitations).values_list(
        "invitation_id", "created_at"
    ):
        events.setdefault(invitation_id, []).append(created_at)

    rows = []
    for invitation in invitations:
        started_at = invitation.session.started_at
        own_events = events.get(invitation.pk, [])
        row = {
            "invitation_id": invitation.pk,
            "tester_first_name": invitation.tester.first_name,
            "profession": invitation.tester.tester_profile.profession,
            "started_at": started_at,
        }
        for name, window in WINDOWS.items():
            row[name] = returned_in_window(started_at, own_events, now, window)
        rows.append(row)
    return rows
