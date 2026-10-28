from django.contrib import admin, messages

from core.exceptions import Conflict

from .models import Campaign, Feedback, Invitation, Rating, ScenarioStep, StepProof, TestSession
from .services import reopen_test


class StepInline(admin.TabularInline):
    model = ScenarioStep
    extra = 0


class InvitationInline(admin.TabularInline):
    model = Invitation
    extra = 0
    fields = ("tester", "status", "nda_accepted_at")
    readonly_fields = ("nda_accepted_at",)


@admin.register(Campaign)
class CampaignAdmin(admin.ModelAdmin):
    list_display = ("project", "target_profession", "testers_wanted", "status", "is_demo")
    list_filter = ("status", "is_demo")
    inlines = [StepInline, InvitationInline]


@admin.register(Invitation)
class InvitationAdmin(admin.ModelAdmin):
    list_display = ("tester", "campaign", "status", "created_at")
    list_filter = ("status",)
    readonly_fields = ("token",)
    actions = ["open_dispute"]

    @admin.action(description="Ouvrir un litige")
    def open_dispute(self, request, queryset):
        opened = 0
        for invitation in queryset:
            try:
                reopen_test(invitation)
            except Conflict:
                continue
            self.log_change(request, invitation, "Litige ouvert : test renvoyé au dev.")
            opened += 1
        self.message_user(request, f"{opened} litige(s) ouvert(s).", messages.SUCCESS)


admin.site.register([TestSession, StepProof, Feedback, Rating])
