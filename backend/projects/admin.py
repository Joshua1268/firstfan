from django.contrib import admin

from .models import Project, ProjectCapture


class CaptureInline(admin.TabularInline):
    model = ProjectCapture
    extra = 0
    readonly_fields = ("file", "sha256", "order")


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("name", "owner", "created_at")
    readonly_fields = ("public_key", "fingerprint", "fingerprinted_at", "script_seen_at")
    inlines = [CaptureInline]
