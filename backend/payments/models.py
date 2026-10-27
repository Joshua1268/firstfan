import secrets

from django.conf import settings
from django.db import models


def new_reference() -> str:
    return secrets.token_hex(8).upper()


class PayoutStatus(models.TextChoices):
    PENDING = "pending", "En attente"
    PAID = "paid", "Payé"
    FAILED = "failed", "Échoué"


class Payment(models.Model):
    Status = PayoutStatus

    campaign = models.ForeignKey("campaigns.Campaign", on_delete=models.PROTECT, related_name="payments")
    provider = models.CharField(max_length=20)
    reference = models.CharField(max_length=32, unique=True, default=new_reference)
    amount_xof = models.PositiveIntegerField()
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    paid_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.reference} ({self.amount_xof} XOF)"


class Earning(models.Model):
    invitation = models.OneToOneField(
        "campaigns.Invitation", on_delete=models.PROTECT, related_name="earning"
    )
    tester = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="earnings")
    amount_xof = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.tester} +{self.amount_xof} XOF"


class Withdrawal(models.Model):
    Status = PayoutStatus

    tester = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="withdrawals")
    amount_xof = models.PositiveIntegerField()
    momo_number = models.CharField(max_length=20)
    provider = models.CharField(max_length=20)
    reference = models.CharField(max_length=32, unique=True, default=new_reference)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    paid_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.tester} -{self.amount_xof} XOF"
