from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils import timezone
from django.utils.html import format_html

from .models import TesterProfile, User


@admin.register(User)
class CadevUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (("FirstFan", {"fields": ("role",)}),)
    list_display = ("username", "email", "role", "is_staff")


@admin.register(TesterProfile)
class TesterProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "profession", "city", "verification", "proof_link", "linkedin_link")
    list_filter = ("verification", "profession")
    actions = ["mark_verified", "reject"]

    @admin.display(description="Justificatif")
    def proof_link(self, profile):
        if not profile.proof:
            return "-"
        return format_html('<a href="/api/tester/profile/proof/?user={}">Ouvrir</a>', profile.user_id)

    @admin.display(description="LinkedIn")
    def linkedin_link(self, profile):
        if not profile.linkedin_url:
            return "-"
        return format_html('<a href="{0}" target="_blank" rel="noopener">{0}</a>', profile.linkedin_url)

    @admin.action(description="Marquer comme vérifié")
    def mark_verified(self, request, queryset):
        queryset.update(verification=TesterProfile.Verification.VERIFIED, verified_at=timezone.now())

    @admin.action(description="Refuser")
    def reject(self, request, queryset):
        queryset.update(verification=TesterProfile.Verification.REJECTED, verified_at=None)
