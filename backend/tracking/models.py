from django.db import models
from django.utils import timezone


class TrackEvent(models.Model):
    project = models.ForeignKey("projects.Project", on_delete=models.CASCADE, related_name="events")
    invitation = models.ForeignKey(
        "campaigns.Invitation", on_delete=models.CASCADE, null=True, blank=True, related_name="events"
    )
    url = models.CharField(max_length=500)
    created_at = models.DateTimeField(default=timezone.now, db_index=True)

    def __str__(self):
        return f"{self.project} {self.url}"
