import pytest
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile

from core.uploads import MAX_UPLOAD_BYTES, private_upload_path, validate_upload

PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 32
PDF = b"%PDF-1.7\n" + b"\x00" * 32


def upload(name, content):
    return SimpleUploadedFile(name, content)


def test_rejects_pdf_renamed_jpg():
    with pytest.raises(ValidationError, match="Format refusé"):
        validate_upload(upload("photo.jpg", PDF))


def test_rejects_oversize():
    with pytest.raises(ValidationError, match="Fichier trop lourd"):
        validate_upload(upload("big.png", PNG + b"\x00" * (MAX_UPLOAD_BYTES + 1 - len(PNG))))


def test_rejects_empty():
    with pytest.raises(ValidationError, match="Fichier vide"):
        validate_upload(upload("empty.png", b""))


def test_accepts_png():
    validate_upload(upload("shot.png", PNG))


def test_accepts_jpeg_and_webp():
    validate_upload(upload("a.jpg", b"\xff\xd8\xff\xe0" + b"\x00" * 16))
    validate_upload(upload("b.webp", b"RIFF\x00\x00\x00\x00WEBPVP8 "))


def test_accepts_pdf_when_allowed():
    validate_upload(upload("proof.pdf", PDF), allow_pdf=True)


def test_refused_message_mentions_pdf_when_allowed():
    with pytest.raises(ValidationError, match="ou un PDF"):
        validate_upload(upload("notes.txt", b"hello"), allow_pdf=True)


def test_private_upload_path_is_random():
    to_path = private_upload_path("captures")
    first, second = to_path(None, "My Shot.PNG"), to_path(None, "My Shot.PNG")
    assert first.startswith("captures/") and first.endswith(".png")
    assert first != second and "Shot" not in first
