from django.conf import settings
from django.utils import timezone

from accounts.models import ProfessionCheck
from campaigns.models import Invitation
from projects.models import Project


def get_public_stats() -> dict[str, int | bool]:
    return {
        "tests_in_progress": Invitation.objects.filter(status=Invitation.Status.ACCEPTED).count(),
        "verified_testers": ProfessionCheck.objects.filter(
            status=ProfessionCheck.Status.VERIFIED, expires_at__gt=timezone.now()
        )
        .values("tester")
        .distinct()
        .count(),
        "apps_tested": Project.objects.filter(campaigns__invitations__status=Invitation.Status.VALIDATED)
        .distinct()
        .count(),
        "demo": settings.DEMO_MODE,
    }
