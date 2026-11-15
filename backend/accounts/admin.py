from django import forms
from django.contrib import admin, messages
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html

from core.exceptions import Conflict

from .models import ProfessionCheck, TesterProfile, User
from .services import decide_check


@admin.register(User)
class CadevUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (("FirstFan", {"fields": ("role",)}),)
    list_display = ("username", "email", "role", "is_staff")


@admin.register(TesterProfile)
class TesterProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "profession", "city", "linkedin_link")
    list_filter = ("profession",)

    @admin.display(description="LinkedIn")
    def linkedin_link(self, profile):
        if not profile.linkedin_url:
            return "-"
        return format_html('<a href="{0}" target="_blank" rel="noopener">{0}</a>', profile.linkedin_url)


class DecisionForm(forms.ModelForm):
    class Meta:
        model = ProfessionCheck
        fields = ["status", "reject_reason"]

    def clean(self):
        data = super().clean()
        if (
            data.get("status") == ProfessionCheck.Status.REJECTED
            and not data.get("reject_reason", "").strip()
        ):
            self.add_error("reject_reason", "Indique le motif du refus : le testeur le verra.")
        return data


@admin.register(ProfessionCheck)
class ProfessionCheckAdmin(admin.ModelAdmin):
    form = DecisionForm
    list_display = ("tester", "profession", "document_type", "status", "created_at", "expires_at")
    list_filter = ("status", "profession")
    readonly_fields = (
        "tester",
        "profession",
        "document_type",
        "document_link",
        "sponsor",
        "consent_at",
        "created_at",
        "decided_at",
        "decided_by",
        "expires_at",
    )
    fields = readonly_fields + ("status", "reject_reason")
    actions = ["approve"]

    def has_add_permission(self, request):
        return False

    @admin.display(description="Pièce")
    def document_link(self, check):
        if not check.document:
            return "Supprimée après décision" if check.decided_at else "-"
        return format_html('<a href="/api/checks/{}/document/">Ouvrir la pièce</a>', check.pk)

    @admin.display(description="Parrain")
    def sponsor(self, check):
        if not check.sponsor_email:
            return "-"
        sponsor = User.objects.filter(email__iexact=check.sponsor_email).first()
        if sponsor is None:
            return f"{check.sponsor_email} (aucun compte)"
        verified = sponsor.profession_checks.filter(
            profession=check.profession, status=ProfessionCheck.Status.VERIFIED
        ).exists()
        state = "vérifié pour ce métier" if verified else "non vérifié pour ce métier"
        return f"{check.sponsor_email} ({state})"

    def save_model(self, request, check, form, change):
        if "status" not in form.changed_data or check.status == ProfessionCheck.Status.PENDING:
            return
        try:
            decide_check(
                check,
                approve=check.status == ProfessionCheck.Status.VERIFIED,
                reason=check.reject_reason,
                admin=request.user,
            )
        except Conflict as e:
            messages.error(request, str(e.detail))

    @admin.action(description="Valider les vérifications choisies")
    def approve(self, request, queryset):
        done = 0
        for check in queryset.filter(status=ProfessionCheck.Status.PENDING):
            decide_check(check, approve=True, reason="", admin=request.user)
            done += 1
        messages.success(request, f"{done} vérification(s) validée(s).")
