from django.contrib import admin

from core.admin import ReadOnlyAdmin

from .models import Earning, Payment, Withdrawal


@admin.register(Payment)
class PaymentAdmin(ReadOnlyAdmin):
    list_display = ("reference", "campaign", "amount_xof", "status", "created_at")
    list_filter = ("status",)


@admin.register(Earning)
class EarningAdmin(ReadOnlyAdmin):
    list_display = ("tester", "invitation", "amount_xof", "created_at")


@admin.register(Withdrawal)
class WithdrawalAdmin(ReadOnlyAdmin):
    list_display = ("reference", "tester", "amount_xof", "status", "created_at")
    list_filter = ("status",)
    actions = ["mark_failed"]

    @admin.action(description="Marquer comme échoué")
    def mark_failed(self, request, queryset):
        # A failed withdrawal no longer counts in the balance, so the money comes back.
        count = queryset.filter(status=Withdrawal.Status.PENDING).update(status=Withdrawal.Status.FAILED)
        self.message_user(request, f"{count} retrait(s) marqué(s) comme échoué(s).")
