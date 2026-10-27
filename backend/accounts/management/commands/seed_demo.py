"""Amorce une base de démonstration : testeurs vérifiés plausibles, pour que les compteurs publics ne soient pas à zéro.

Idempotent : chaque testeur de démo a un identifiant fixe (`demo-testeur-NN`), relancer la commande ne crée rien de plus
et remet les profils dans leur état de démo. Refuse de tourner hors mode démo (DEMO_MODE) sans `--force`.
Aucune campagne n'existe encore dans le modèle : « tests en cours » et « apps testées » restent à 0, rien n'est simulé.
"""

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from accounts.models import TesterProfile, User

# (prénom, initiale, métier, commune, vérifié, note moyenne)
DEMO_TESTERS = [
    ("Awa", "K", "Comptable", "Plateau", True, "4.90"),
    ("Koffi", "A", "Gérant de maquis", "Yopougon", True, "4.70"),
    ("Grâce", "T", "Restauratrice", "Cocody", True, "4.80"),
    ("Mariam", "D", "Pharmacienne", "Marcory", True, "4.60"),
    ("Yao", "B", "Transitaire", "Treichville", True, "4.50"),
    ("Fatou", "S", "Couturière", "Abobo", True, "4.70"),
    ("Serge", "N", "Agent immobilier", "Cocody", True, "4.40"),
    ("Adjoua", "M", "Commerçante", "Adjamé", True, "4.80"),
    ("Ibrahim", "C", "Chauffeur VTC", "Koumassi", True, "4.60"),
    ("Esther", "G", "Infirmière", "Bouaké", True, "4.90"),
    ("Didier", "O", "Enseignant", "Port-Bouët", False, None),
    ("Salimata", "F", "Coiffeuse", "Yopougon", False, None),
]


class Command(BaseCommand):
    help = "Amorce des testeurs de démonstration (idempotent). Réservé au mode démo."

    def add_arguments(self, parser):
        parser.add_argument("--force", action="store_true", help="Autoriser l'amorçage hors DEMO_MODE.")

    @transaction.atomic
    def handle(self, *args, force=False, **options):
        if not settings.DEMO_MODE and not force:
            raise CommandError("DEMO_MODE est désactivé : relancer avec --force pour amorcer quand même.")
        created = 0
        now = timezone.now()
        for i, (first, initial, profession, city, verified, rating) in enumerate(DEMO_TESTERS, start=1):
            user, was_created = User.objects.get_or_create(
                username=f"demo-testeur-{i:02d}",
                defaults={"first_name": first, "last_name": f"{initial}.", "role": User.Role.TESTER},
            )
            if was_created:
                user.set_unusable_password()
                user.save(update_fields=["password"])
                created += 1
            state = TesterProfile.Verification.VERIFIED if verified else TesterProfile.Verification.PENDING
            profile, _ = TesterProfile.objects.get_or_create(user=user, defaults={"profession": profession})
            profile.profession = profession
            profile.city = city
            profile.verification = state
            profile.verified_at = (profile.verified_at or now) if verified else None
            profile.rating_avg = rating
            profile.save()
        verified_count = sum(1 for t in DEMO_TESTERS if t[4])
        self.stdout.write(
            self.style.SUCCESS(
                f"Démo : {len(DEMO_TESTERS)} testeurs ({verified_count} vérifiés), {created} créés à cette exécution."
            )
        )
