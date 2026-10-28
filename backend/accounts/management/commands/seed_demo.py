import secrets
from datetime import timedelta

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from accounts.demo_data import (
    DEMO_CAPTURE,
    DEMO_DEV,
    DEMO_PROFESSION,
    DEMO_PROJECT,
    DEMO_STEPS,
    DEMO_TESTERS,
    DEMO_TESTS,
)
from accounts.models import TesterProfile, User
from campaigns.models import Campaign, Invitation
from campaigns.services import (
    accept_invitation,
    create_campaign,
    eligible_testers,
    save_step_proof,
    select_testers,
    submit_test,
    validate_test,
)
from payments.services import confirm_payment, start_checkout
from projects.models import Project
from projects.services import create_project
from tracking.models import TrackEvent


class Command(BaseCommand):
    help = "Amorce les données de démonstration (idempotent). Réservé au mode démo."

    def add_arguments(self, parser):
        parser.add_argument("--force", action="store_true", help="Autoriser l'amorçage hors DEMO_MODE.")

    @transaction.atomic
    def handle(self, *args, force=False, **options):
        if not settings.DEMO_MODE and not force:
            raise CommandError("DEMO_MODE est désactivé : relancer avec --force pour amorcer quand même.")
        created = self.seed_testers()
        dev, dev_created = self.seed_dev()
        created += dev_created
        if not Project.objects.filter(owner=dev, name=DEMO_PROJECT["name"]).exists():
            self.seed_scenario(dev)
            created += 1
        verified_count = sum(1 for t in DEMO_TESTERS if t[4])
        self.stdout.write(
            self.style.SUCCESS(
                f"Démo : {len(DEMO_TESTERS)} testeurs ({verified_count} vérifiés), "
                f"{created} créés à cette exécution."
            )
        )

    def seed_testers(self) -> int:
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
            profile.momo_number = f"07000000{i:02d}"
            profile.available = True
            profile.verification = state
            profile.verified_at = (profile.verified_at or now) if verified else None
            profile.rating_avg = rating
            profile.save()
        return created

    def seed_dev(self) -> tuple[User, bool]:
        dev, created = User.objects.get_or_create(
            username=DEMO_DEV["username"],
            defaults={
                "email": DEMO_DEV["email"],
                "first_name": DEMO_DEV["first_name"],
                "role": User.Role.DEV,
            },
        )
        password = settings.DEMO_PASSWORD
        if created and not password:
            password = secrets.token_urlsafe(12)
            self.stdout.write(f"Compte dev de démo : {dev.email}. Mot de passe : {password}")
        if password:
            dev.set_password(password)
            dev.save(update_fields=["password"])
        return dev, created

    def seed_scenario(self, dev: User) -> None:
        project = create_project(owner=dev, captures=[], **DEMO_PROJECT)
        campaign = create_campaign(
            project=project,
            target_profession=DEMO_PROFESSION,
            testers_wanted=len(DEMO_TESTS),
            steps=DEMO_STEPS,
        )
        Campaign.objects.filter(pk=campaign.pk).update(is_demo=True)
        testers = eligible_testers(campaign).filter(username__startswith="demo-testeur-")[: len(DEMO_TESTS)]
        testers = list(testers)
        select_testers(campaign, [t.pk for t in testers])
        confirm_payment(start_checkout(campaign))
        for tester, test in zip(testers, DEMO_TESTS, strict=True):
            self.play_test(campaign.invitations.get(tester=tester), test)

    def play_test(self, invitation: Invitation, test: dict) -> None:
        session = accept_invitation(invitation, nda=True)
        for order, answer in enumerate(test["answers"], start=1):
            capture = ContentFile(DEMO_CAPTURE, name="preuve.png")
            save_step_proof(invitation, order, answer=answer, capture=capture)
        submit_test(invitation, feedback=test["feedback"], dev_score=test["dev_score"], dev_comment="")
        validate_test(
            invitation, decision=Invitation.Status.VALIDATED, score=test["tester_score"], comment="Merci !"
        )
        # Backdate the test so the adoption table has history to show.
        started = timezone.now() - timedelta(days=test["started_days_ago"])
        session.started_at = started
        session.submitted_at = started + timedelta(hours=1)
        session.save(update_fields=["started_at", "submitted_at"])
        project = invitation.campaign.project
        TrackEvent.objects.bulk_create(
            TrackEvent(
                project=project,
                invitation=invitation,
                url=project.url,
                created_at=started + timedelta(days=d),
            )
            for d in test["return_days"]
        )
