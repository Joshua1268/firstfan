import os
from collections.abc import Callable
from uuid import uuid4

from django.core.exceptions import ValidationError
from django.db.models import Model
from django.utils.deconstruct import deconstructible

MAX_UPLOAD_BYTES = 5 * 1024 * 1024


def _is_image(head: bytes) -> bool:
    return (
        head.startswith(b"\xff\xd8\xff")
        or head.startswith(b"\x89PNG")
        or (head[:4] == b"RIFF" and head[8:12] == b"WEBP")
    )


def validate_upload(f, *, allow_pdf: bool = False) -> None:
    if f.size == 0:
        raise ValidationError("Fichier vide.")
    if f.size > MAX_UPLOAD_BYTES:
        raise ValidationError("Fichier trop lourd (5 Mo maximum).")
    f.seek(0)
    head = f.read(12)
    f.seek(0)
    if _is_image(head) or (allow_pdf and head.startswith(b"%PDF")):
        return
    if allow_pdf:
        raise ValidationError("Format refusé : envoie une image JPEG, PNG ou WebP, ou un PDF.")
    raise ValidationError("Format refusé : envoie une image JPEG, PNG ou WebP.")


@deconstructible
class RandomUploadPath:
    def __init__(self, prefix: str):
        self.prefix = prefix

    def __call__(self, instance: Model, filename: str) -> str:
        ext = os.path.splitext(filename)[1].lower()
        return f"{self.prefix}/{uuid4().hex}{ext}"

    def __eq__(self, other):
        return isinstance(other, RandomUploadPath) and other.prefix == self.prefix


def private_upload_path(prefix: str) -> Callable[[Model, str], str]:
    # Deconstructible so migrations can serialize it.
    return RandomUploadPath(prefix)
