from django.conf import settings
from rest_framework import serializers

from accounts.models import User
from accounts.professions import PROFESSIONS
from projects.models import Project

from .models import Campaign, Invitation, ScenarioStep

MAX_STEPS = 10


class CampaignSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Campaign
        fields = ["id", "target_profession", "testers_wanted", "status", "created_at"]


class CampaignCreateSerializer(serializers.Serializer):
    target_profession = serializers.CharField(max_length=120)
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
        if value not in PROFESSIONS:
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
            "recommended",
            "selected",
            "reason",
        ]

    def get_last_initial(self, user: User) -> str:
        return user.last_name[:1]

    def get_rating_avg(self, user: User) -> float | None:
        rating = user.tester_profile.rating_avg
        return float(rating) if rating is not None else None


class SelectionSerializer(serializers.Serializer):
    tester_ids = serializers.ListField(child=serializers.IntegerField())
