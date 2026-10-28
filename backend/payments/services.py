from django.conf import settings
from django.db import transaction
from django.utils import timezone

from campaigns.models import Campaign, Invitation
from core.exceptions import Conflict

from .models import Earning, Payment
from .providers import get_provider


def start_checkout(campaign: Campaign) -> Payment:
    with transaction.atomic():
        campaign = Campaign.objects.select_for_update().get(pk=campaign.pk)
        if campaign.status != Campaign.Status.DRAFT:
            raise Conflict("Cette campagne est déjà payée.")
        selected = campaign.invitations.filter(status=Invitation.Status.SELECTED).count()
        if not selected:
            raise Conflict("Choisis au moins un testeur avant de payer.")
        amount = selected * settings.PRICE_PER_TESTER_XOF
        payment = campaign.payments.filter(status=Payment.Status.PENDING).first()
        if payment is None:
            payment = Payment.objects.create(
                campaign=campaign, provider=get_provider().name, amount_xof=amount
            )
        elif payment.amount_xof != amount:
            payment.amount_xof = amount
            payment.save(update_fields=["amount_xof"])
    return payment


def confirm_payment(payment: Payment) -> None:
    with transaction.atomic():
        payment = Payment.objects.select_for_update().get(pk=payment.pk)
        if payment.status == Payment.Status.PAID:
            return
        if payment.status != Payment.Status.PENDING:
            raise Conflict("Ce paiement a échoué : relance le paiement depuis la campagne.")
        campaign = Campaign.objects.select_for_update().get(pk=payment.campaign_id)
        if campaign.status != Campaign.Status.DRAFT:
            raise Conflict("Cette campagne est déjà payée.")
        selected = campaign.invitations.filter(status=Invitation.Status.SELECTED)
        if payment.amount_xof != selected.count() * settings.PRICE_PER_TESTER_XOF:
            raise Conflict("La sélection a changé : relance le paiement depuis la campagne.")
        now = timezone.now()
        payment.status = Payment.Status.PAID
        payment.paid_at = now
        payment.save(update_fields=["status", "paid_at"])
        campaign.status = Campaign.Status.OPEN
        campaign.opened_at = now
        campaign.save(update_fields=["status", "opened_at"])
        selected.update(status=Invitation.Status.SENT)


def fail_payment(payment: Payment) -> None:
    with transaction.atomic():
        payment = Payment.objects.select_for_update().get(pk=payment.pk)
        if payment.status == Payment.Status.PAID:
            raise Conflict("Ce paiement est déjà confirmé.")
        payment.status = Payment.Status.FAILED
        payment.save(update_fields=["status"])


def credit_tester(invitation: Invitation) -> Earning:
    # The tester withdraws later: no money leaves here.
    earning, _ = Earning.objects.get_or_create(
        invitation=invitation,
        defaults={"tester_id": invitation.tester_id, "amount_xof": settings.TESTER_REWARD_XOF},
    )
    return earning
