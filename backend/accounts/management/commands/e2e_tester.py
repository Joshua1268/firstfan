from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from accounts.models import TesterProfile, User
from accounts.professions import PROFESSIONS
from accounts.services import grant_check


class Command(BaseCommand):
    help = "Crée ou met à jour un testeur vérifié pour les tests de bout en bout. Réservé à DEBUG."

    def add_arguments(self, parser):
        parser.add_argument("--email", required=True)
        parser.add_argument("--profession", required=True)
        parser.add_argument("--password")

    @transaction.atomic
    def handle(self, *args, email, profession, password=None, **options):
        if not settings.DEBUG:
            raise CommandError("Commande réservée au développement (DEBUG faux).")
        if profession not in PROFESSIONS:
            raise CommandError(f"Métier inconnu : {profession}")
        user, created = User.objects.get_or_create(
            username=email,
            defaults={"email": email, "first_name": email.split("@")[0].title(), "role": User.Role.TESTER},
        )
        if password:
            user.set_password(password)
        elif created:
            user.set_unusable_password()
        user.role = User.Role.TESTER
        user.save()
        profile, _ = TesterProfile.objects.get_or_create(user=user)
        profile.profession = profession
        profile.momo_number = profile.momo_number or "0700000099"
        profile.linkedin_url = profile.linkedin_url or "https://www.linkedin.com/in/e2e"
        profile.available = True
        profile.consent_at = profile.consent_at or timezone.now()
        profile.save()
        grant_check(user, profession)
        self.stdout.write(self.style.SUCCESS(f"Testeur {email} prêt ({profession})."))
