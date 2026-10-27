import secrets

from django.conf import settings
from django.db import models

from core.uploads import private_upload_path


def new_public_key() -> str:
    return secrets.token_hex(16)


class Project(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="projects")
    name = models.CharField(max_length=120)
    url = models.URLField()
    description = models.TextField()
    public_key = models.CharField(max_length=32, unique=True, default=new_public_key)
    fingerprint = models.CharField(max_length=64)
    fingerprinted_at = models.DateTimeField()
    script_seen_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class ProjectCapture(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="captures")
    file = models.FileField(upload_to=private_upload_path("captures"))
    sha256 = models.CharField(max_length=64)
    order = models.PositiveSmallIntegerField()

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"{self.project} #{self.order}"
