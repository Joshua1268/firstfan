from django.contrib.auth.models import AbstractUser
from django.db import models

from core.uploads import private_upload_path


class User(AbstractUser):
    class Role(models.TextChoices):
        DEV = "dev", "Developpeur"
        TESTER = "tester", "Testeur"
        ADMIN = "admin", "Administrateur"

    role = models.CharField(max_length=10, choices=Role.choices, default=Role.DEV)


class TesterProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="tester_profile")
    profession = models.CharField(max_length=120, blank=True)
    company = models.CharField(max_length=120, blank=True)
    city = models.CharField(max_length=80, blank=True)
    linkedin_url = models.URLField(blank=True)
    momo_number = models.CharField(max_length=20, blank=True)
    available = models.BooleanField(default=True)
    consent_at = models.DateTimeField(null=True, blank=True)
    rating_avg = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True)

    def __str__(self):
        return f"{self.user} ({self.profession})"

    @property
    def is_complete(self) -> bool:
        return bool(self.profession and self.momo_number)


class ProfessionCheck(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "En attente"
        VERIFIED = "verified", "Vérifié"
        REJECTED = "rejected", "Refusé"

    class Document(models.TextChoices):
        ORDER_CARD = "order_card", "Carte ou attestation d'inscription à l'Ordre"
        BAR_CARD = "bar_card", "Carte du Barreau"
        PRO_CARD = "pro_card", "Carte professionnelle ou badge d'établissement"
        BUSINESS_REGISTRY = "business_registry", "RCCM ou patente"
        DELIVERY_PROFILE = "delivery_profile", "Capture de ton profil sur l'app de livraison ou de VTC"
        DRIVING_LICENCE = "driving_licence", "Permis de conduire"
        WORK_CERTIFICATE = "work_certificate", "Attestation de travail"
        PAYSLIP = "payslip", "Bulletin de paie, montants masqués"
        WORKPLACE_PHOTO = "workplace_photo", "Photo de toi sur ton lieu de travail"
        PROFILE_PROOF = "profile_proof", "Justificatif déposé avec le profil"

    tester = models.ForeignKey(User, on_delete=models.CASCADE, related_name="profession_checks")
    profession = models.CharField(max_length=120)
    document_type = models.CharField(max_length=20, choices=Document.choices)
    # Deleted as soon as an admin decides: only the type, the date and the admin are kept.
    document = models.FileField(upload_to=private_upload_path("profession_checks"), blank=True)
    sponsor_email = models.EmailField(blank=True)
    consent_at = models.DateTimeField()
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    reject_reason = models.CharField(max_length=300, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    decided_at = models.DateTimeField(null=True, blank=True)
    decided_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="+")
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "vérification de métier"
        verbose_name_plural = "vérifications de métier"

    def __str__(self):
        return f"{self.tester} - {self.profession}"
