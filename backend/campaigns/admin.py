from django.contrib import admin

from .models import Campaign, Feedback, Invitation, Rating, ScenarioStep, StepProof, TestSession


class StepInline(admin.TabularInline):
    model = ScenarioStep
    extra = 0


@admin.register(Campaign)
class CampaignAdmin(admin.ModelAdmin):
    list_display = ("project", "target_profession", "testers_wanted", "status", "is_demo")
    list_filter = ("status", "is_demo")
    inlines = [StepInline]


admin.site.register([Invitation, TestSession, StepProof, Feedback, Rating])
