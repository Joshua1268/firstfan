from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from core.uploads import validate_upload

from .models import ProfessionCheck, TesterProfile, User
from .professions import PROFESSIONS, documents_for


class MeSerializer(serializers.ModelSerializer):
    profile_complete = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "email", "first_name", "role", "profile_complete"]

    def get_profile_complete(self, user: User) -> bool:
        if user.role != User.Role.TESTER:
            return True
        profile = getattr(user, "tester_profile", None)
        return bool(profile and profile.is_complete)


class RegisterSerializer(serializers.Serializer):
    # The email is also the username, capped at 150 characters.
    email = serializers.EmailField(max_length=150)
    password = serializers.CharField(write_only=True)
    first_name = serializers.CharField(max_length=150)
    role = serializers.ChoiceField(choices=[User.Role.DEV, User.Role.TESTER])
    consent = serializers.BooleanField(default=False)

    def validate(self, data):
        candidate = User(username=data["email"], email=data["email"], first_name=data["first_name"])
        try:
            validate_password(data["password"], candidate)
        except DjangoValidationError as e:
            raise serializers.ValidationError({"password": e.messages}) from e
        return data


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()


class TesterProfileSerializer(serializers.ModelSerializer):
    rating_avg = serializers.DecimalField(
        max_digits=3, decimal_places=2, read_only=True, coerce_to_string=False
    )

    class Meta:
        model = TesterProfile
        fields = ["profession", "company", "city", "linkedin_url", "momo_number", "available", "rating_avg"]

    def validate_profession(self, value):
        if value not in PROFESSIONS:
            raise serializers.ValidationError("Choisis un métier de la liste.")
        return value


class ProfessionCheckSerializer(serializers.ModelSerializer):
    document_label = serializers.CharField(source="get_document_type_display")

    class Meta:
        model = ProfessionCheck
        fields = [
            "id",
            "profession",
            "document_type",
            "document_label",
            "status",
            "reject_reason",
            "created_at",
            "expires_at",
        ]


class CheckInputSerializer(serializers.Serializer):
    document_type = serializers.ChoiceField(choices=ProfessionCheck.Document.choices)
    document = serializers.FileField()
    sponsor_email = serializers.EmailField(required=False, default="")
    consent = serializers.BooleanField(default=False)

    def validate_document(self, f):
        try:
            validate_upload(f, allow_pdf=True)
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.messages) from e
        return f


def document_choices(profession: str) -> list[dict]:
    labels = dict(ProfessionCheck.Document.choices)
    return [{"value": value, "label": labels[value]} for value in documents_for(profession)]
