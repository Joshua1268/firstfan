from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from core.uploads import validate_upload

from .models import TesterProfile, User
from .professions import PROFESSIONS


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
    proof = serializers.FileField(write_only=True, required=False)
    has_proof = serializers.SerializerMethodField()
    rating_avg = serializers.DecimalField(
        max_digits=3, decimal_places=2, read_only=True, coerce_to_string=False
    )

    class Meta:
        model = TesterProfile
        fields = [
            "profession",
            "company",
            "city",
            "linkedin_url",
            "momo_number",
            "available",
            "verification",
            "has_proof",
            "rating_avg",
            "proof",
        ]
        read_only_fields = ["verification"]

    def get_has_proof(self, profile: TesterProfile) -> bool:
        return bool(profile.proof)

    def validate_profession(self, value):
        if value not in PROFESSIONS:
            raise serializers.ValidationError("Choisis un métier de la liste.")
        return value

    def validate_proof(self, f):
        try:
            validate_upload(f, allow_pdf=True)
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.messages) from e
        return f

    def update(self, profile, validated_data):
        old = profile.proof.name if "proof" in validated_data else None
        profile = super().update(profile, validated_data)
        if old and old != profile.proof.name:
            profile.proof.storage.delete(old)
        return profile
