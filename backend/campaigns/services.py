from django.db import transaction
from django.db.models import Count, F, Q, QuerySet
from rest_framework.exceptions import ValidationError

from accounts.models import TesterProfile, User
from core.exceptions import Conflict
from projects.models import Project

from .models import Campaign, Invitation, ScenarioStep


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


def eligible_testers(campaign: Campaign) -> QuerySet[User]:
    return (
        User.objects.filter(
            role=User.Role.TESTER,
            tester_profile__verification=TesterProfile.Verification.VERIFIED,
            tester_profile__available=True,
            tester_profile__profession=campaign.target_profession,
        )
        .exclude(pk=campaign.project.owner_id)
        .select_related("tester_profile")
        .annotate(
            completed_tests=Count("invitations", filter=Q(invitations__status=Invitation.Status.VALIDATED))
        )
        .order_by(
            F("tester_profile__rating_avg").desc(nulls_last=True),
            "-completed_tests",
            "tester_profile__verified_at",
            "pk",
        )
    )


def select_testers(campaign: Campaign, tester_ids: list[int]) -> None:
    ids = set(tester_ids)
    with transaction.atomic():
        campaign = Campaign.objects.select_for_update().get(pk=campaign.pk)
        if campaign.status != Campaign.Status.DRAFT:
            raise Conflict("La campagne n'est plus en brouillon.")
        if not ids:
            raise ValidationError({"tester_ids": ["Choisis au moins un testeur."]})
        if len(ids) > campaign.testers_wanted:
            raise ValidationError({"tester_ids": [f"{campaign.testers_wanted} testeurs au maximum."]})
        if eligible_testers(campaign).filter(pk__in=ids).count() != len(ids):
            raise ValidationError({"tester_ids": ["Testeur non disponible pour cette campagne."]})
        campaign.invitations.filter(status=Invitation.Status.SELECTED).delete()
        Invitation.objects.bulk_create(Invitation(campaign=campaign, tester_id=pk) for pk in sorted(ids))
