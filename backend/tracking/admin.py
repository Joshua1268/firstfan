from django.contrib import admin

from core.admin import ReadOnlyAdmin

from .models import TrackEvent


@admin.register(TrackEvent)
class TrackEventAdmin(ReadOnlyAdmin):
    list_display = ("project", "invitation", "url", "created_at")
    list_filter = ("project",)
