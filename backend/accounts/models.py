from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        DEV = "dev", "Developpeur"
        TESTER = "tester", "Testeur"
        ADMIN = "admin", "Administrateur"

    role = models.CharField(max_length=10, choices=Role.choices, default=Role.DEV)


class TesterProfile(models.Model):
    class Verification(models.TextChoices):
        PENDING = "pending", "En attente"
        VERIFIED = "verified", "Verifie"
        REJECTED = "rejected", "Refuse"

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="tester_profile")
    profession = models.CharField(max_length=120)
    city = models.CharField(max_length=80, blank=True)
    linkedin_url = models.URLField(blank=True)
    proof = models.FileField(upload_to="proofs/", blank=True)
    verification = models.CharField(
        max_length=10, choices=Verification.choices, default=Verification.PENDING
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    rating_avg = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True)

    def __str__(self):
        return f"{self.user} ({self.profession})"
