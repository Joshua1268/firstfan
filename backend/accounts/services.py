from datetime import timedelta

from django.core.files import File
from django.db import IntegrityError, transaction
from django.db.models import Exists, OuterRef
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from core.exceptions import Conflict

from .models import ProfessionCheck, TesterProfile, User
from .professions import documents_for

CHECK_VALIDITY = timedelta(days=365)

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


def valid_checks(profession: str):
    return ProfessionCheck.objects.filter(
        profession=profession, status=ProfessionCheck.Status.VERIFIED, expires_at__gt=timezone.now()
    )


def holds_valid_check(profession: str) -> Exists:
    """User queryset filter: a valid check for this profession."""
    return Exists(valid_checks(profession).filter(tester=OuterRef("pk")))


def check_status(user: User, profession: str) -> str | None:
    """verified, pending, rejected or None, from the most useful check of the user."""
    checks = user.profession_checks.filter(profession=profession)
    if valid_checks(profession).filter(tester=user).exists():
        return ProfessionCheck.Status.VERIFIED
    if checks.filter(status=ProfessionCheck.Status.PENDING).exists():
        return ProfessionCheck.Status.PENDING
    if checks.filter(status=ProfessionCheck.Status.REJECTED).exists():
        return ProfessionCheck.Status.REJECTED
    return None


def submit_check(
    user: User, *, document_type: str, document: File, sponsor_email: str = "", consent: bool
) -> ProfessionCheck:
    profession = user.tester_profile.profession
    if not profession:
        raise ValidationError({"detail": "Indique d'abord ton métier dans ton profil."})
    if not consent:
        raise ValidationError({"consent": ["Ton accord est nécessaire pour envoyer cette pièce."]})
    if document_type not in documents_for(profession):
        raise ValidationError({"document_type": ["Cette pièce n'est pas acceptée pour ton métier."]})
    if check_status(user, profession) in (ProfessionCheck.Status.VERIFIED, ProfessionCheck.Status.PENDING):
        raise Conflict("Une vérification est déjà en cours ou valide pour ce métier.")
    return ProfessionCheck.objects.create(
        tester=user,
        profession=profession,
        document_type=document_type,
        document=document,
        sponsor_email=sponsor_email,
        consent_at=timezone.now(),
    )


def decide_check(check: ProfessionCheck, *, approve: bool, reason: str, admin: User | None) -> None:
    with transaction.atomic():
        check = ProfessionCheck.objects.select_for_update().get(pk=check.pk)
        if check.status != ProfessionCheck.Status.PENDING:
            raise Conflict("Cette vérification a déjà été traitée.")
        if not approve and not reason.strip():
            raise ValidationError({"reject_reason": ["Indique le motif du refus."]})
        now = timezone.now()
        check.status = ProfessionCheck.Status.VERIFIED if approve else ProfessionCheck.Status.REJECTED
        check.reject_reason = "" if approve else reason.strip()
        check.decided_at = now
        check.decided_by = admin
        check.expires_at = now + CHECK_VALIDITY if approve else None
        if check.document:
            check.document.delete(save=False)
        check.save()


def grant_check(user: User, profession: str) -> ProfessionCheck:
    """A verified check without a document, for demo and test accounts."""
    now = timezone.now()
    check, _ = ProfessionCheck.objects.update_or_create(
        tester=user,
        profession=profession,
        status=ProfessionCheck.Status.VERIFIED,
        defaults={
            "document_type": ProfessionCheck.Document.WORK_CERTIFICATE,
            "consent_at": now,
            "decided_at": now,
            "expires_at": now + CHECK_VALIDITY,
        },
    )
    return check
