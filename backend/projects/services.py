import hashlib

from django.db import transaction
from django.utils import timezone

from accounts.models import User

from .certificate import compute_fingerprint
from .models import Project, ProjectCapture


def _sha256(f) -> str:
    digest = hashlib.sha256()
    for chunk in f.chunks():
        digest.update(chunk)
    f.seek(0)
    return digest.hexdigest()


def create_project(*, owner: User, name: str, url: str, description: str, captures: list) -> Project:
    hashes = [_sha256(f) for f in captures]
    with transaction.atomic():
        project = Project.objects.create(
            owner=owner,
            name=name,
            url=url,
            description=description,
            fingerprint=compute_fingerprint(name, url, description, hashes),
            fingerprinted_at=timezone.now(),
        )
        for order, (f, sha256) in enumerate(zip(captures, hashes, strict=True), start=1):
            ProjectCapture.objects.create(project=project, file=f, sha256=sha256, order=order)
    return project
