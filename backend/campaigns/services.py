from django.db import transaction

from projects.models import Project

from .models import Campaign, ScenarioStep


def create_campaign(
    *, project: Project, target_profession: str, testers_wanted: int, steps: list[str]
) -> Campaign:
    with transaction.atomic():
        campaign = Campaign.objects.create(
            project=project, target_profession=target_profession, testers_wanted=testers_wanted
        )
        ScenarioStep.objects.bulk_create(
            ScenarioStep(campaign=campaign, order=order, instruction=instruction)
            for order, instruction in enumerate(steps, start=1)
        )
    return campaign
