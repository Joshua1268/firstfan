from decimal import Decimal

from django.core.files import File
from django.db import transaction
from django.db.models import Avg, Count, F, Q, QuerySet
from django.utils import timezone
from rest_framework.exceptions import NotFound, ValidationError

from accounts.models import TesterProfile, User
from core.exceptions import Conflict
from payments.services import credit_tester
from projects.models import Project

from .models import Campaign, Feedback, Invitation, Rating, ScenarioStep, StepProof, TestSession


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


def _lock(invitation: Invitation) -> Invitation:
    return Invitation.objects.select_for_update().get(pk=invitation.pk)


def accept_invitation(invitation: Invitation, *, nda: bool) -> TestSession:
    if not nda:
        raise ValidationError({"nda": ["Tu dois accepter l'engagement de confidentialité."]})
    with transaction.atomic():
        invitation = _lock(invitation)
        if invitation.status == Invitation.Status.ACCEPTED:
            return invitation.session
        if invitation.status != Invitation.Status.SENT:
            raise Conflict("Cette invitation ne peut plus être acceptée.")
        invitation.status = Invitation.Status.ACCEPTED
        invitation.nda_accepted_at = timezone.now()
        invitation.save(update_fields=["status", "nda_accepted_at"])
        return TestSession.objects.create(invitation=invitation)


def decline_invitation(invitation: Invitation) -> None:
    with transaction.atomic():
        invitation = _lock(invitation)
        if invitation.status == Invitation.Status.DECLINED:
            return
        if invitation.status != Invitation.Status.SENT:
            raise Conflict("Cette invitation ne peut plus être refusée.")
        invitation.status = Invitation.Status.DECLINED
        invitation.save(update_fields=["status"])


def save_step_proof(invitation: Invitation, order: int, *, answer: str, capture: File | None) -> StepProof:
    with transaction.atomic():
        invitation = _lock(invitation)
        if invitation.status != Invitation.Status.ACCEPTED:
            raise Conflict("Le test n'est pas en cours.")
        step = invitation.campaign.steps.filter(order=order).first()
        if step is None:
            raise NotFound("Étape introuvable.")
        proof = StepProof.objects.filter(session=invitation.session, step=step).first()
        if proof is None:
            if capture is None:
                raise ValidationError({"capture": ["Ajoute une capture d'écran."]})
            proof = StepProof(session=invitation.session, step=step)
        proof.answer = answer
        if capture is not None:
            proof.capture = capture
        proof.save()
    return proof


def submit_test(invitation: Invitation, *, feedback: dict, dev_score: int, dev_comment: str) -> None:
    with transaction.atomic():
        invitation = _lock(invitation)
        if invitation.status != Invitation.Status.ACCEPTED:
            raise Conflict("Ce test n'est plus modifiable.")
        session = invitation.session
        if session.proofs.count() < invitation.campaign.steps.count():
            raise ValidationError({"detail": "Il reste des étapes sans preuve."})
        Feedback.objects.create(session=session, **feedback)
        Rating.objects.create(
            session=session,
            rater=invitation.tester,
            ratee=invitation.campaign.project.owner,
            score=dev_score,
            comment=dev_comment,
        )
        session.submitted_at = timezone.now()
        session.save(update_fields=["submitted_at"])
        invitation.status = Invitation.Status.SUBMITTED
        invitation.save(update_fields=["status"])


def update_rating_avg(tester: User) -> None:
    avg = Rating.objects.filter(ratee=tester).aggregate(avg=Avg("score"))["avg"]
    rating = Decimal(avg).quantize(Decimal("0.01")) if avg is not None else None
    TesterProfile.objects.filter(user=tester).update(rating_avg=rating)


def validate_test(invitation: Invitation, *, decision: str, score: int, comment: str) -> None:
    with transaction.atomic():
        invitation = _lock(invitation)
        if invitation.status != Invitation.Status.SUBMITTED:
            raise Conflict("Ce test n'attend pas de validation.")
        invitation.status = decision
        invitation.save(update_fields=["status"])
        Rating.objects.create(
            session=invitation.session,
            rater=invitation.campaign.project.owner,
            ratee=invitation.tester,
            score=score,
            comment=comment,
        )
        if decision == Invitation.Status.VALIDATED:
            credit_tester(invitation)
        update_rating_avg(invitation.tester)
