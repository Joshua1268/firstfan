from django.contrib import admin

from .models import Earning, Payment, Withdrawal


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("reference", "campaign", "amount_xof", "status", "created_at")
    list_filter = ("status",)


admin.site.register([Earning, Withdrawal])
