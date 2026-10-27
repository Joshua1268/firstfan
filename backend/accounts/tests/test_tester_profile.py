import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test.client import BOUNDARY, MULTIPART_CONTENT, encode_multipart

from accounts.models import TesterProfile, User

URL = "/api/tester/profile/"
PDF = b"%PDF-1.7\n" + b"\x00" * 32


@pytest.fixture(autouse=True)
def _media(settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path


def patch_json(client, data):
    return client.patch(URL, data, content_type="application/json")


def patch_multipart(client, data):
    return client.patch(URL, encode_multipart(BOUNDARY, data), content_type=MULTIPART_CONTENT)


@pytest.fixture
def new_tester_client(client, db):
    client.post(
        "/api/auth/register/",
        {
            "email": "yao@x.ci",
            "password": "Sol1de-pass!",
            "first_name": "Yao",
            "role": "tester",
            "consent": True,
        },
        content_type="application/json",
    )
    return client


def test_profile_get(tester_client):
    r = tester_client.get(URL)
    assert r.status_code == 200
    assert r.json() == {
        "profession": "Comptable",
        "company": "",
        "city": "Plateau",
        "linkedin_url": "https://www.linkedin.com/in/awa",
        "momo_number": "0700000001",
        "available": True,
        "verification": "verified",
        "has_proof": False,
        "rating_avg": None,
    }


def test_profile_patch_and_complete(new_tester_client):
    c = new_tester_client
    assert c.get("/api/auth/me/").json()["profile_complete"] is False
    r = patch_json(c, {"profession": "Astronaute"})
    assert r.status_code == 400 and "profession" in r.json()
    r = patch_json(c, {"profession": "Comptable", "momo_number": "0700000009", "company": "Cabinet K"})
    assert r.status_code == 200 and r.json()["company"] == "Cabinet K"
    assert c.get("/api/auth/me/").json()["profile_complete"] is False
    r = patch_multipart(c, {"proof": SimpleUploadedFile("diplome.pdf", PDF), "available": "false"})
    assert r.status_code == 200 and r.json()["has_proof"] is True and r.json()["available"] is False
    assert c.get("/api/auth/me/").json()["profile_complete"] is True


def test_profile_rejects_fake_proof(tester_client):
    r = patch_multipart(tester_client, {"proof": SimpleUploadedFile("diplome.pdf", b"not a pdf at all")})
    assert r.status_code == 400 and "Format refusé" in r.json()["proof"][0]


def test_profile_verification_read_only(new_tester_client):
    r = patch_json(new_tester_client, {"verification": "verified", "rating_avg": "5.00"})
    assert r.status_code == 200 and r.json()["verification"] == "pending"
    profile = TesterProfile.objects.get(user__username="yao@x.ci")
    assert profile.verification == TesterProfile.Verification.PENDING and profile.rating_avg is None


def test_dev_cannot_read_tester_profile(dev_client):
    assert dev_client.get(URL).status_code == 403
    assert patch_json(dev_client, {"city": "Cocody"}).status_code == 403


def test_anonymous_cannot_read_tester_profile(client, db):
    assert client.get(URL).status_code == 403


def test_proof_download_owner_only(tester_client, tester_user, dev_client, dev_user):
    proof_url = URL + "proof/"
    assert tester_client.get(proof_url).status_code == 404
    patch_multipart(tester_client, {"proof": SimpleUploadedFile("diplome.pdf", PDF)})
    r = tester_client.get(proof_url)
    assert r.status_code == 200 and b"".join(r.streaming_content) == PDF
    assert dev_client.get(proof_url).status_code == 404
    assert dev_client.get(f"{proof_url}?user={tester_user.id}").status_code == 404
    dev_user.is_staff = True
    dev_user.save()
    assert dev_client.get(f"{proof_url}?user={tester_user.id}").status_code == 200
    assert dev_client.get(f"{proof_url}?user=abc").status_code == 404


def test_proof_stored_under_random_name(tester_client, tester_user):
    patch_multipart(tester_client, {"proof": SimpleUploadedFile("Mon Diplome.PDF", PDF)})
    name = TesterProfile.objects.get(user=tester_user).proof.name
    assert name.startswith("proofs/") and name.endswith(".pdf") and "Diplome" not in name


def test_tester_without_profile_gets_404(client, db):
    user = User.objects.create_user("solo@x.ci", "solo@x.ci", "Sol1de-pass!", role=User.Role.TESTER)
    client.force_login(user)
    assert client.get(URL).status_code == 404
