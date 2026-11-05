from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from .models import TesterProfile, User

EMAIL_TAKEN = "Un compte existe déjà avec cet email."


def register_user(*, email: str, password: str | None, first_name: str, role: str, consent: bool) -> User:
    email = email.lower()
    if role == User.Role.TESTER and not consent:
        raise ValidationError({"consent": ["Ton accord est nécessaire pour devenir testeur."]})
    if User.objects.filter(username=email).exists():
        raise ValidationError({"email": [EMAIL_TAKEN]})
    try:
        with transaction.atomic():
            user = User.objects.create_user(
                username=email, email=email, password=password, first_name=first_name, role=role
            )
            if role == User.Role.TESTER:
                TesterProfile.objects.create(user=user, consent_at=timezone.now())
    except IntegrityError as e:
        # Two sign-ups with the same email at the same time.
        raise ValidationError({"email": [EMAIL_TAKEN]}) from e
    return user
