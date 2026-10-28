from django.contrib import admin

from .models import TrackEvent


@admin.register(TrackEvent)
class TrackEventAdmin(admin.ModelAdmin):
    list_display = ("project", "invitation", "url", "created_at")
    list_filter = ("project",)
