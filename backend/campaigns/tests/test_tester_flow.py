import pytest
from django.core.files.uploadedfile import SimpleUploadedFile

from campaigns.models import Feedback, Invitation, Rating, ScenarioStep, StepProof
from conftest import client_for, make_tester

PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 32


@pytest.fixture(autouse=True)
def _media(settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path
    settings.TESTER_REWARD_XOF = 3500


@pytest.fixture
def invitation(campaign, tester_user):
    ScenarioStep.objects.create(campaign=campaign, order=2, instruction="Envoie-la")
    return Invitation.objects.create(campaign=campaign, tester=tester_user, status=Invitation.Status.SENT)


def png(name="capture.png"):
    return SimpleUploadedFile(name, PNG, content_type="image/png")


def url(invitation, suffix=""):
    return f"/api/tester/invitations/{invitation.pk}/{suffix}"


def accept(client, invitation, nda=True):
    return client.post(url(invitation, "accept/"), {"nda": nda}, content_type="application/json")


def save_step(client, invitation, order, **data):
    return client.post(url(invitation, f"steps/{order}/"), data)


def submit(client, invitation, **data):
    body = {
        "usefulness": 4,
        "blockers": "Rien",
        "would_pay": "yes",
        "comment": "",
        "dev_score": 5,
        "dev_comment": "Clair",
    }
    return client.post(url(invitation, "submit/"), body | data, content_type="application/json")


def do_all_steps(client, invitation):
    accept(client, invitation)
    for order in (1, 2):
        assert save_step(client, invitation, order, answer="ok", capture=png()).status_code == 200


def test_list_and_detail(tester_client, invitation):
    rows = tester_client.get("/api/tester/invitations/").json()
    assert rows == [
        {
            "id": invitation.pk,
            "project_name": "Compta Express",
            "target_profession": "Comptable",
            "steps_total": 2,
            "steps_done": 0,
            "status": "sent",
            "reward_xof": 3500,
            "created_at": rows[0]["created_at"],
        }
    ]
    body = tester_client.get(url(invitation)).json()
    assert body["project_description"] == "Suivi des factures"
    assert body["test_url"] is None and body["nda_accepted_at"] is None
    assert body["steps"][0] == {"order": 1, "instruction": "Crée une facture", "proof": None}
    assert body["feedback"] is None


def test_other_tester_gets_404(invitation, db):
    other = client_for(make_tester("other@x.ci"))
    assert other.get("/api/tester/invitations/").json() == []
    assert other.get(url(invitation)).status_code == 404
    assert accept(other, invitation).status_code == 404
    assert other.post(url(invitation, "decline/")).status_code == 404
    assert save_step(other, invitation, 1, answer="x", capture=png()).status_code == 404
    assert submit(other, invitation).status_code == 404


def test_dev_cannot_use_tester_routes(dev_client, invitation):
    assert dev_client.get("/api/tester/invitations/").status_code == 403


def test_selected_invisible_before_payment(tester_client, invitation):
    invitation.status = Invitation.Status.SELECTED
    invitation.save()
    assert tester_client.get("/api/tester/invitations/").json() == []
    assert tester_client.get(url(invitation)).status_code == 404


def test_accept_requires_nda(tester_client, invitation):
    assert accept(tester_client, invitation, nda=False).status_code == 400
    invitation.refresh_from_db()
    assert invitation.status == "sent" and invitation.nda_accepted_at is None
    assert accept(tester_client, invitation).status_code == 200
    assert accept(tester_client, invitation).status_code == 200
    invitation.refresh_from_db()
    assert invitation.status == "accepted" and invitation.nda_accepted_at is not None
    assert invitation.session.started_at is not None


def test_decline(tester_client, invitation):
    assert tester_client.post(url(invitation, "decline/")).status_code == 204
    invitation.refresh_from_db()
    assert invitation.status == "declined"
    assert accept(tester_client, invitation).status_code == 409


def test_test_url_has_token(tester_client, invitation):
    assert invitation.test_url is None
    accept(tester_client, invitation)
    invitation.refresh_from_db()
    assert invitation.test_url == f"https://compta.example?ff_t={invitation.token}"
    assert tester_client.get(url(invitation)).json()["test_url"] == invitation.test_url
    project = invitation.campaign.project
    project.url = "https://compta.example/app?lang=fr"
    project.save()
    invitation.refresh_from_db()
    assert invitation.test_url == f"https://compta.example/app?lang=fr&ff_t={invitation.token}"


def test_step_requires_accepted(tester_client, invitation):
    assert save_step(tester_client, invitation, 1, answer="x", capture=png()).status_code == 409


def test_step_upsert(tester_client, invitation):
    accept(tester_client, invitation)
    assert save_step(tester_client, invitation, 1, answer="sans capture").status_code == 400
    first = save_step(tester_client, invitation, 1, answer="Facture créée", capture=png())
    assert first.status_code == 200
    second = save_step(tester_client, invitation, 1, answer="Facture corrigée")
    assert second.status_code == 200
    proof = StepProof.objects.get()
    assert proof.answer == "Facture corrigée" and proof.capture
    assert second.json()["id"] == first.json()["id"] == proof.pk
    assert second.json()["capture_url"] == f"/api/proofs/{proof.pk}/capture/"
    assert save_step(tester_client, invitation, 9, answer="x", capture=png()).status_code == 404
    body = tester_client.get(url(invitation)).json()
    assert body["steps_done"] == 1
    assert body["steps"][0]["proof"]["answer"] == "Facture corrigée"
    assert body["steps"][1]["proof"] is None


def test_capture_rejects_fake_image(tester_client, invitation):
    accept(tester_client, invitation)
    fake = SimpleUploadedFile("photo.jpg", b"%PDF-1.4 fake", content_type="image/jpeg")
    r = save_step(tester_client, invitation, 1, answer="x", capture=fake)
    assert r.status_code == 400 and "capture" in r.json()
    empty = SimpleUploadedFile("photo.png", b"", content_type="image/png")
    assert save_step(tester_client, invitation, 1, answer="x", capture=empty).status_code == 400
    assert not StepProof.objects.exists()


def test_submit_requires_all_steps(tester_client, invitation):
    accept(tester_client, invitation)
    save_step(tester_client, invitation, 1, answer="x", capture=png())
    r = submit(tester_client, invitation)
    assert r.status_code == 400
    assert r.json() == {"detail": "Il reste des étapes sans preuve."}
    assert not Feedback.objects.exists()


def test_submit_validates_scores(tester_client, invitation):
    do_all_steps(tester_client, invitation)
    assert submit(tester_client, invitation, dev_score=6).status_code == 400
    assert submit(tester_client, invitation, would_pay="sure").status_code == 400


def test_submit_twice_409(tester_client, invitation, dev_user):
    do_all_steps(tester_client, invitation)
    assert submit(tester_client, invitation).status_code == 204
    assert submit(tester_client, invitation).status_code == 409
    invitation.refresh_from_db()
    assert invitation.status == "submitted" and invitation.session.submitted_at is not None
    feedback = Feedback.objects.get()
    assert (feedback.usefulness, feedback.would_pay) == (4, "yes")
    rating = Rating.objects.get()
    assert (rating.rater, rating.ratee, rating.score) == (invitation.tester, dev_user, 5)
    body = tester_client.get(url(invitation)).json()
    assert body["feedback"]["usefulness"] == 4 and body["status"] == "submitted"
    assert save_step(tester_client, invitation, 1, answer="x").status_code == 409


def test_capture_forbidden_to_stranger(tester_client, invitation, other_dev_client):
    do_all_steps(tester_client, invitation)
    proof = StepProof.objects.first()
    stranger = client_for(make_tester("stranger@x.ci"))
    assert stranger.get(f"/api/proofs/{proof.pk}/capture/").status_code == 404
    assert other_dev_client.get(f"/api/proofs/{proof.pk}/capture/").status_code == 404
    r = tester_client.get(f"/api/proofs/{proof.pk}/capture/")
    assert r.status_code == 200 and b"".join(r.streaming_content) == PNG


def test_capture_visible_to_owner_dev(tester_client, invitation, dev_client):
    do_all_steps(tester_client, invitation)
    proof = StepProof.objects.first()
    r = dev_client.get(f"/api/proofs/{proof.pk}/capture/")
    assert r.status_code == 200 and b"".join(r.streaming_content) == PNG
