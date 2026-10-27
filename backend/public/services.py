from django.conf import settings

from accounts.models import TesterProfile


def get_public_stats() -> dict[str, int | bool]:
    # Campaigns do not exist yet: in-progress and tested counters stay at 0.
    return {
        "tests_in_progress": 0,
        "verified_testers": TesterProfile.objects.filter(
            verification=TesterProfile.Verification.VERIFIED
        ).count(),
        "apps_tested": 0,
        "demo": settings.DEMO_MODE,
    }
