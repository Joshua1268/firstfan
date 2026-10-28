from typing import Protocol

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.utils import timezone

from .models import Payment, Withdrawal


class PaymentProvider(Protocol):
    name: str

    def start_checkout(self, payment: Payment) -> str: ...

    def send_withdrawal(self, withdrawal: Withdrawal) -> None: ...


class SimulatedProvider:
    # No money moves: the dev confirms on a fake checkout page.
    name = "simule"

    def start_checkout(self, payment: Payment) -> str:
        return f"/paiement/simule/{payment.reference}"

    def send_withdrawal(self, withdrawal: Withdrawal) -> None:
        withdrawal.status = Withdrawal.Status.PAID
        withdrawal.paid_at = timezone.now()
        withdrawal.save(update_fields=["status", "paid_at"])


PROVIDERS = {SimulatedProvider.name: SimulatedProvider}


def get_provider() -> PaymentProvider:
    try:
        return PROVIDERS[settings.PAYMENT_PROVIDER]()
    except KeyError as e:
        raise ImproperlyConfigured(f"PAYMENT_PROVIDER inconnu : {settings.PAYMENT_PROVIDER}") from e
