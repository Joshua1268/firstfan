from django.conf import settings

from accounts.models import TesterProfile
from campaigns.models import Invitation
from projects.models import Project


def get_public_stats() -> dict[str, int | bool]:
    return {
        "tests_in_progress": Invitation.objects.filter(status=Invitation.Status.ACCEPTED).count(),
        "verified_testers": TesterProfile.objects.filter(
            verification=TesterProfile.Verification.VERIFIED
        ).count(),
        "apps_tested": Project.objects.filter(campaigns__invitations__status=Invitation.Status.VALIDATED)
        .distinct()
        .count(),
        "demo": settings.DEMO_MODE,
    }
