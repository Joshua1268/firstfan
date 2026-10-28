import secrets

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone

from core.uploads import private_upload_path

ONE_TO_FIVE = [MinValueValidator(1), MaxValueValidator(5)]


def new_invitation_token() -> str:
    return secrets.token_urlsafe(16)


class Campaign(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Brouillon"
        OPEN = "open", "Ouverte"
        CLOSED = "closed", "Terminée"

    project = models.ForeignKey("projects.Project", on_delete=models.CASCADE, related_name="campaigns")
    target_profession = models.CharField(max_length=120)
    testers_wanted = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(10)]
    )
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.DRAFT)
    is_demo = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    opened_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.project} - {self.target_profession}"

    @property
    def total_xof(self) -> int:
        return self.testers_wanted * settings.PRICE_PER_TESTER_XOF


class ScenarioStep(models.Model):
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name="steps")
    order = models.PositiveSmallIntegerField()
    instruction = models.CharField(max_length=500)

    class Meta:
        ordering = ["order"]
        constraints = [models.UniqueConstraint(fields=["campaign", "order"], name="unique_step_order")]

    def __str__(self):
        return f"{self.order}. {self.instruction}"


class Invitation(models.Model):
    class Status(models.TextChoices):
        SELECTED = "selected", "Sélectionné"
        SENT = "sent", "Envoyée"
        ACCEPTED = "accepted", "Acceptée"
        DECLINED = "declined", "Refusée"
        SUBMITTED = "submitted", "Test envoyé"
        VALIDATED = "validated", "Validé"
        REJECTED = "rejected", "Rejeté"

    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name="invitations")
    tester = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="invitations")
    token = models.CharField(max_length=32, unique=True, default=new_invitation_token)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.SELECTED)
    nda_accepted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["campaign", "tester"], name="unique_campaign_tester")]

    def __str__(self):
        return f"{self.tester} - {self.campaign}"

    @property
    def test_url(self) -> str | None:
        if self.nda_accepted_at is None:
            return None
        url = self.campaign.project.url
        return f"{url}{'&' if '?' in url else '?'}ff_t={self.token}"


class TestSession(models.Model):
    invitation = models.OneToOneField(Invitation, on_delete=models.CASCADE, related_name="session")
    started_at = models.DateTimeField(default=timezone.now)
    submitted_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Session {self.invitation}"


class StepProof(models.Model):
    session = models.ForeignKey(TestSession, on_delete=models.CASCADE, related_name="proofs")
    step = models.ForeignKey(ScenarioStep, on_delete=models.CASCADE, related_name="proofs")
    answer = models.TextField(max_length=2000, blank=True)
    capture = models.FileField(upload_to=private_upload_path("step_captures"), blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["session", "step"], name="unique_session_step")]

    def __str__(self):
        return f"{self.session} - {self.step.order}"


class Feedback(models.Model):
    class WouldPay(models.TextChoices):
        YES = "yes", "Oui"
        MAYBE = "maybe", "Peut-être"
        NO = "no", "Non"

    session = models.OneToOneField(TestSession, on_delete=models.CASCADE, related_name="feedback")
    usefulness = models.PositiveSmallIntegerField(validators=ONE_TO_FIVE)
    blockers = models.TextField()
    would_pay = models.CharField(max_length=5, choices=WouldPay.choices)
    comment = models.TextField(blank=True)

    def __str__(self):
        return f"Avis {self.session}"


class Rating(models.Model):
    session = models.ForeignKey(TestSession, on_delete=models.CASCADE, related_name="ratings")
    rater = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="ratings_given"
    )
    ratee = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="ratings_received"
    )
    score = models.PositiveSmallIntegerField(validators=ONE_TO_FIVE)
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["session", "rater"], name="unique_session_rater")]

    def __str__(self):
        return f"{self.rater} -> {self.ratee} : {self.score}"
