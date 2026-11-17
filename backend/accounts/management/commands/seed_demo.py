import secrets
from datetime import timedelta

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from accounts.demo_data import (
    DEMO_CAPTURES,
    DEMO_DEV,
    DEMO_PROFESSION,
    DEMO_PROJECT,
    DEMO_STEPS,
    DEMO_TESTER,
    DEMO_TESTERS,
    DEMO_TESTS,
    LEGACY_DEV_USERNAME,
    RECRUITING_STEPS,
)
from accounts.models import TesterProfile, User
from accounts.services import grant_check
from campaigns.models import Campaign, Invitation, StepProof
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
        self.generated_password = ""
        created = self.seed_testers()
        dev, dev_created = self.seed_dev()
        tester_created = self.seed_demo_tester()
        created += dev_created + tester_created
        if not Project.objects.filter(owner=dev, name=DEMO_PROJECT["name"]).exists():
            self.seed_scenario(dev)
            created += 1
        self.seed_recruiting(dev)
        verified_count = sum(1 for t in DEMO_TESTERS if t[4])
        self.stdout.write(
            self.style.SUCCESS(
                f"Démo : {len(DEMO_TESTERS)} testeurs ({verified_count} vérifiés), "
                f"{created} créés à cette exécution."
            )
        )
        self.print_logins()

    def print_logins(self) -> None:
        self.stdout.write(f"Compte dev de démo : {DEMO_DEV['email']}")
        self.stdout.write(f"Compte testeur de démo : {DEMO_TESTER['email']}")
        if self.generated_password:
            self.stdout.write(f"Mot de passe généré (affiché une seule fois) : {self.generated_password}")
        elif settings.DEMO_PASSWORD:
            self.stdout.write("Mot de passe : la valeur de DEMO_PASSWORD.")
        else:
            self.stdout.write("Mot de passe : celui affiché au premier amorçage.")

    def set_demo_password(self, user: User, created: bool) -> None:
        # Without DEMO_PASSWORD, existing accounts keep the password shown at their creation.
        password = settings.DEMO_PASSWORD
        if not password and not created:
            return
        if not password:
            self.generated_password = self.generated_password or secrets.token_urlsafe(12)
            password = self.generated_password
        user.set_password(password)
        user.save(update_fields=["password"])

    def seed_testers(self) -> int:
        created = 0
        for i, (first, initial, profession, city, verified, rating) in enumerate(DEMO_TESTERS, start=1):
            user, was_created = User.objects.get_or_create(
                username=f"demo-testeur-{i:02d}",
                defaults={"first_name": first, "last_name": f"{initial}.", "role": User.Role.TESTER},
            )
            if was_created:
                user.set_unusable_password()
                user.save(update_fields=["password"])
                created += 1
            profile, _ = TesterProfile.objects.get_or_create(user=user, defaults={"profession": profession})
            profile.profession = profession
            profile.city = city
            profile.momo_number = f"07000000{i:02d}"
            profile.available = True
            profile.rating_avg = rating
            profile.save()
            if verified:
                grant_check(user, profession)
        return created

    def seed_dev(self) -> tuple[User, bool]:
        email = DEMO_DEV["email"]
        # Login authenticates with username=email, as register_user creates it.
        if not User.objects.filter(username=email).exists():
            User.objects.filter(username=LEGACY_DEV_USERNAME).update(username=email)
        dev, created = User.objects.get_or_create(
            username=email,
            defaults={"email": email, "first_name": DEMO_DEV["first_name"], "role": User.Role.DEV},
        )
        self.set_demo_password(dev, created)
        return dev, created

    def seed_demo_tester(self) -> bool:
        email = DEMO_TESTER["email"]
        tester, created = User.objects.get_or_create(
            username=email,
            defaults={
                "email": email,
                "first_name": DEMO_TESTER["first_name"],
                "last_name": DEMO_TESTER["last_name"],
                "role": User.Role.TESTER,
            },
        )
        self.set_demo_password(tester, created)
        now = timezone.now()
        profile, _ = TesterProfile.objects.get_or_create(user=tester)
        profile.profession = DEMO_TESTER["profession"]
        profile.city = DEMO_TESTER["city"]
        profile.momo_number = DEMO_TESTER["momo_number"]
        profile.linkedin_url = DEMO_TESTER["linkedin_url"]
        profile.available = True
        profile.consent_at = profile.consent_at or now
        profile.save()
        grant_check(tester, profile.profession)
        return created

    def seed_scenario(self, dev: User) -> None:
        project = create_project(owner=dev, captures=[], **DEMO_PROJECT)
        campaign = create_campaign(
            project=project,
            target_profession=DEMO_PROFESSION,
            testers_wanted=len(DEMO_TESTS),
            steps=DEMO_STEPS,
        )
        testers = eligible_testers(campaign).filter(username__startswith="demo-testeur-")[: len(DEMO_TESTS)]
        testers = list(testers)
        select_testers(campaign, [t.pk for t in testers])
        confirm_payment(start_checkout(campaign))
        for tester, test in zip(testers, DEMO_TESTS, strict=True):
            self.play_test(campaign.invitations.get(tester=tester), test)
        # Backdated so the certificate date makes sense.
        first_start = timezone.now() - timedelta(days=max(t["started_days_ago"] for t in DEMO_TESTS))
        created_at = first_start - timedelta(days=2)
        Project.objects.filter(pk=project.pk).update(created_at=created_at, fingerprinted_at=created_at)
        opened_at = first_start - timedelta(days=1)
        Campaign.objects.filter(pk=campaign.pk).update(
            is_demo=True, created_at=opened_at, opened_at=opened_at
        )
        campaign.invitations.update(created_at=opened_at)

    def seed_recruiting(self, dev: User) -> None:
        # Two campaigns still choosing testers, so a new tester account has something to apply to.
        project = Project.objects.get(owner=dev, name=DEMO_PROJECT["name"])
        drafts = project.campaigns.filter(status=Campaign.Status.DRAFT)
        for profession in (DEMO_PROFESSION, ""):
            if not drafts.filter(target_profession=profession).exists():
                create_campaign(
                    project=project, target_profession=profession, testers_wanted=3, steps=RECRUITING_STEPS
                )

    def play_test(self, invitation: Invitation, test: dict) -> None:
        session = accept_invitation(invitation, nda=True)
        for order, answer in enumerate(test["answers"], start=1):
            path = DEMO_CAPTURES[order - 1]
            capture = ContentFile(path.read_bytes(), name=path.name)
            save_step_proof(invitation, order, answer=answer, capture=capture)
        if test["status"] != Invitation.Status.ACCEPTED:
            submit_test(invitation, feedback=test["feedback"], dev_score=test["dev_score"], dev_comment="")
        if test["status"] == Invitation.Status.VALIDATED:
            validate_test(
                invitation,
                decision=Invitation.Status.VALIDATED,
                score=test["tester_score"],
                comment="Merci !",
            )
        # Backdate the test so the adoption table has history to show.
        started = timezone.now() - timedelta(days=test["started_days_ago"])
        session.started_at = started
        if session.submitted_at:
            session.submitted_at = started + timedelta(hours=1)
        session.save(update_fields=["started_at", "submitted_at"])
        Invitation.objects.filter(pk=invitation.pk).update(nda_accepted_at=started)
        for proof in session.proofs.select_related("step"):
            proof_at = started + timedelta(minutes=5 * proof.step.order)
            StepProof.objects.filter(pk=proof.pk).update(created_at=proof_at, updated_at=proof_at)
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
