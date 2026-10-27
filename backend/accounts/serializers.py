from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from .models import User


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
