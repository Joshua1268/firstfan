from datetime import datetime

from django.conf import settings
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from accounts.models import ProfessionCheck, User
from accounts.professions import PROFESSIONS
from core.uploads import validate_upload
from projects.models import Project

from .models import Campaign, Feedback, Invitation, ScenarioStep, StepProof

MAX_STEPS = 10


class CampaignSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Campaign
        fields = ["id", "target_profession", "testers_wanted", "status", "created_at"]


class CampaignCreateSerializer(serializers.Serializer):
    target_profession = serializers.CharField(max_length=120, allow_blank=True)
    testers_wanted = serializers.IntegerField(min_value=1, max_value=10)
    steps = serializers.ListField(
        child=serializers.CharField(max_length=500),
        min_length=1,
        max_length=MAX_STEPS,
        error_messages={
            "min_length": "Ajoute au moins une étape.",
            "max_length": f"{MAX_STEPS} étapes au maximum.",
        },
    )

    def validate_target_profession(self, value):
        if value and value not in PROFESSIONS:
            raise serializers.ValidationError("Choisis un métier de la liste.")
        return value


class ProjectRefSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ["id", "name", "url"]


class StepSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScenarioStep
        fields = ["order", "instruction"]


class TesterRefSerializer(serializers.ModelSerializer):
    profession = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "first_name", "profession"]

    def get_profession(self, user: User) -> str:
        profile = getattr(user, "tester_profile", None)
        return profile.profession if profile else ""


class InvitationRowSerializer(serializers.ModelSerializer):
    tester = TesterRefSerializer(read_only=True)
    steps_done = serializers.SerializerMethodField()
    steps_total = serializers.SerializerMethodField()

    class Meta:
        model = Invitation
        fields = ["id", "tester", "status", "steps_done", "steps_total"]

    def get_steps_done(self, invitation: Invitation) -> int:
        session = getattr(invitation, "session", None)
        return len(session.proofs.all()) if session else 0

    def get_steps_total(self, invitation: Invitation) -> int:
        return len(invitation.campaign.steps.all())


class CampaignDetailSerializer(serializers.ModelSerializer):
    project = ProjectRefSerializer(read_only=True)
    steps = StepSerializer(many=True, read_only=True)
    price_per_tester_xof = serializers.SerializerMethodField()
    total_xof = serializers.IntegerField(read_only=True)
    payment = serializers.SerializerMethodField()
    invitations = InvitationRowSerializer(many=True, read_only=True)

    class Meta:
        model = Campaign
        fields = [
            "id",
            "project",
            "target_profession",
            "testers_wanted",
            "status",
            "is_demo",
            "steps",
            "price_per_tester_xof",
            "total_xof",
            "payment",
            "invitations",
        ]

    def get_price_per_tester_xof(self, campaign: Campaign) -> int:
        return settings.PRICE_PER_TESTER_XOF

    def get_payment(self, campaign: Campaign) -> dict | None:
        payment = campaign.payments.order_by("-created_at", "-pk").first()
        return {"reference": payment.reference, "status": payment.status} if payment else None


class TesterCandidateSerializer(serializers.ModelSerializer):
    last_initial = serializers.SerializerMethodField()
    profession = serializers.CharField(source="tester_profile.profession")
    city = serializers.CharField(source="tester_profile.city")
    rating_avg = serializers.SerializerMethodField()
    completed_tests = serializers.IntegerField()
    applied = serializers.BooleanField(read_only=True)
    recommended = serializers.BooleanField(read_only=True)
    selected = serializers.BooleanField(read_only=True)
    reason = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "first_name",
            "last_initial",
            "profession",
            "city",
            "rating_avg",
            "completed_tests",
            "applied",
            "recommended",
            "selected",
            "reason",
        ]

    def get_last_initial(self, user: User) -> str:
        return user.last_name[:1]

    def get_rating_avg(self, user: User) -> float | None:
        rating = user.tester_profile.rating_avg
        return float(rating) if rating is not None else None


class AwaitingCheckSerializer(serializers.ModelSerializer):
    last_initial = serializers.SerializerMethodField()
    city = serializers.CharField(source="tester_profile.city")

    class Meta:
        model = User
        fields = ["id", "first_name", "last_initial", "city"]

    def get_last_initial(self, user: User) -> str:
        return user.last_name[:1]


class RecruitingCampaignSerializer(serializers.ModelSerializer):
    project = serializers.SerializerMethodField()
    steps_total = serializers.IntegerField()
    applied = serializers.BooleanField()
    reward_xof = serializers.SerializerMethodField()

    class Meta:
        model = Campaign
        fields = ["id", "project", "target_profession", "steps_total", "applied", "reward_xof", "created_at"]

    def get_project(self, campaign: Campaign) -> dict:
        project = campaign.project
        return {"name": project.name, "description": project.description}

    def get_reward_xof(self, campaign: Campaign) -> int:
        return settings.TESTER_REWARD_XOF


class ApplyInputSerializer(serializers.Serializer):
    document_type = serializers.ChoiceField(choices=ProfessionCheck.Document.choices, required=False)
    document = serializers.FileField(required=False)
    sponsor_email = serializers.EmailField(required=False, default="")
    consent = serializers.BooleanField(default=False)

    def validate_document(self, f):
        try:
            validate_upload(f, allow_pdf=True)
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.messages) from e
        return f

    def check_data(self) -> dict | None:
        data = self.validated_data
        if "document" not in data:
            return None
        if "document_type" not in data:
            raise serializers.ValidationError({"document_type": ["Choisis le type de pièce."]})
        return data


class SelectionSerializer(serializers.Serializer):
    tester_ids = serializers.ListField(child=serializers.IntegerField())


class ProofSerializer(serializers.ModelSerializer):
    capture_url = serializers.SerializerMethodField()

    class Meta:
        model = StepProof
        fields = ["id", "answer", "capture_url", "updated_at"]

    def get_capture_url(self, proof: StepProof) -> str:
        return f"/api/proofs/{proof.pk}/capture/"


class FeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = ["usefulness", "blockers", "would_pay", "comment"]


class TesterInvitationSummarySerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source="campaign.project.name")
    target_profession = serializers.CharField(source="campaign.target_profession")
    steps_total = serializers.SerializerMethodField()
    steps_done = serializers.SerializerMethodField()
    reward_xof = serializers.SerializerMethodField()

    class Meta:
        model = Invitation
        fields = [
            "id",
            "project_name",
            "target_profession",
            "steps_total",
            "steps_done",
            "status",
            "reward_xof",
            "created_at",
        ]

    def get_steps_total(self, invitation: Invitation) -> int:
        return len(invitation.campaign.steps.all())

    def get_steps_done(self, invitation: Invitation) -> int:
        session = getattr(invitation, "session", None)
        return len(session.proofs.all()) if session else 0

    def get_reward_xof(self, invitation: Invitation) -> int:
        return settings.TESTER_REWARD_XOF


class TesterInvitationDetailSerializer(TesterInvitationSummarySerializer):
    project_description = serializers.CharField(source="campaign.project.description")
    steps = serializers.SerializerMethodField()
    feedback = serializers.SerializerMethodField()

    class Meta(TesterInvitationSummarySerializer.Meta):
        fields = [
            *TesterInvitationSummarySerializer.Meta.fields,
            "project_description",
            "nda_accepted_at",
            "test_url",
            "steps",
            "feedback",
        ]

    def get_steps(self, invitation: Invitation) -> list[dict]:
        session = getattr(invitation, "session", None)
        proofs = {proof.step_id: proof for proof in session.proofs.all()} if session else {}
        return [
            {
                "order": step.order,
                "instruction": step.instruction,
                "proof": ProofSerializer(proofs[step.pk]).data if step.pk in proofs else None,
            }
            for step in invitation.campaign.steps.all()
        ]

    def get_feedback(self, invitation: Invitation) -> dict | None:
        feedback = getattr(getattr(invitation, "session", None), "feedback", None)
        return FeedbackSerializer(feedback).data if feedback else None


class AcceptSerializer(serializers.Serializer):
    nda = serializers.BooleanField(default=False)


class StepProofInputSerializer(serializers.Serializer):
    answer = serializers.CharField(max_length=2000, allow_blank=True, default="")
    capture = serializers.FileField(required=False, default=None)

    def validate_capture(self, f):
        if f is None:
            return f
        try:
            validate_upload(f)
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.messages) from e
        return f


class SubmitSerializer(serializers.Serializer):
    usefulness = serializers.IntegerField(min_value=1, max_value=5)
    blockers = serializers.CharField(allow_blank=True)
    would_pay = serializers.ChoiceField(choices=Feedback.WouldPay.choices)
    comment = serializers.CharField(allow_blank=True, default="")
    dev_score = serializers.IntegerField(min_value=1, max_value=5)
    dev_comment = serializers.CharField(allow_blank=True, default="")


class ValidateSerializer(serializers.Serializer):
    decision = serializers.ChoiceField(choices=[Invitation.Status.VALIDATED, Invitation.Status.REJECTED])
    score = serializers.IntegerField(min_value=1, max_value=5)
    comment = serializers.CharField(allow_blank=True, default="")


class LiveProofSerializer(ProofSerializer):
    step_order = serializers.IntegerField(source="step.order")

    class Meta(ProofSerializer.Meta):
        fields = ["id", "step_order", "answer", "capture_url", "updated_at"]


class LiveRowSerializer(serializers.ModelSerializer):
    invitation_id = serializers.IntegerField(source="pk")
    tester = serializers.SerializerMethodField()
    started_at = serializers.DateTimeField(source="session.started_at", default=None)
    submitted_at = serializers.DateTimeField(source="session.submitted_at", default=None)
    last_event_at = serializers.SerializerMethodField()
    proofs = serializers.SerializerMethodField()
    feedback = serializers.SerializerMethodField()
    dev_rating = serializers.SerializerMethodField()

    class Meta:
        model = Invitation
        fields = [
            "invitation_id",
            "tester",
            "status",
            "nda_accepted_at",
            "started_at",
            "submitted_at",
            "last_event_at",
            "proofs",
            "feedback",
            "dev_rating",
        ]

    def get_tester(self, invitation: Invitation) -> dict:
        profile = invitation.tester.tester_profile
        rating = profile.rating_avg
        return {
            "first_name": invitation.tester.first_name,
            "profession": profile.profession,
            "rating_avg": float(rating) if rating is not None else None,
        }

    def get_last_event_at(self, invitation: Invitation) -> datetime | None:
        return self.context.get("last_events", {}).get(invitation.pk)

    def get_proofs(self, invitation: Invitation) -> list[dict]:
        session = getattr(invitation, "session", None)
        proofs = sorted(session.proofs.all(), key=lambda p: p.step.order) if session else []
        return LiveProofSerializer(proofs, many=True).data

    def get_feedback(self, invitation: Invitation) -> dict | None:
        feedback = getattr(getattr(invitation, "session", None), "feedback", None)
        return FeedbackSerializer(feedback).data if feedback else None

    def get_dev_rating(self, invitation: Invitation) -> dict | None:
        session = getattr(invitation, "session", None)
        if session is None:
            return None
        owner_id = invitation.campaign.project.owner_id
        rating = next((r for r in session.ratings.all() if r.rater_id == owner_id), None)
        return {"score": rating.score, "comment": rating.comment} if rating else None
