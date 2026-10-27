import pytest

from campaigns.models import Campaign, Invitation
from conftest import make_tester
from payments import views
from payments.models import Earning, Payment, Withdrawal
from payments.providers import SimulatedProvider
from payments.services import confirm_payment, credit_tester


@pytest.fixture(autouse=True)
def _prices(settings):
    settings.PRICE_PER_TESTER_XOF = 5000
    settings.TESTER_REWARD_XOF = 3500
    settings.PAYMENT_PROVIDER = "simule"


@pytest.fixture
def selected(campaign):
    testers = [make_tester(f"{n}@x.ci") for n in "ab"]
    for tester in testers:
        Invitation.objects.create(campaign=campaign, tester=tester)
    return testers


def checkout(client, campaign):
    return client.post(f"/api/campaigns/{campaign.pk}/checkout/")


def simulate(client, reference, outcome):
    return client.post(
        f"/api/payments/{reference}/simulate/", {"outcome": outcome}, content_type="application/json"
    )


def test_checkout_is_idempotent(dev_client, campaign, selected):
    first = checkout(dev_client, campaign)
    second = checkout(dev_client, campaign)
    assert first.status_code == second.status_code == 200
    assert first.json() == second.json()
    payment = Payment.objects.get()
    assert first.json() == {
        "reference": payment.reference,
        "redirect_url": f"/paiement/simule/{payment.reference}",
    }
    assert payment.amount_xof == 10000 and payment.status == "pending" and payment.provider == "simule"
    body = dev_client.get(f"/api/payments/{payment.reference}/").json()
    assert body == {
        "reference": payment.reference,
        "amount_xof": 10000,
        "status": "pending",
        "campaign_id": campaign.pk,
    }


def test_checkout_without_selection(dev_client, campaign):
    assert checkout(dev_client, campaign).status_code == 409
    assert not Payment.objects.exists()


def test_confirm_payment_opens_campaign(dev_client, campaign, selected):
    reference = checkout(dev_client, campaign).json()["reference"]
    assert simulate(dev_client, reference, "paid").status_code == 200
    campaign.refresh_from_db()
    assert campaign.status == "open" and campaign.opened_at is not None
    assert set(campaign.invitations.values_list("status", flat=True)) == {"sent"}
    payment = Payment.objects.get()
    assert payment.status == "paid" and payment.paid_at is not None
    detail = dev_client.get(f"/api/campaigns/{campaign.pk}/").json()
    assert detail["payment"] == {"reference": reference, "status": "paid"}
    assert checkout(dev_client, campaign).status_code == 409


def test_confirm_twice_noop(dev_client, campaign, selected):
    checkout(dev_client, campaign)
    payment = Payment.objects.get()
    confirm_payment(payment)
    opened_at = Campaign.objects.get().opened_at
    paid_at = Payment.objects.get().paid_at
    Invitation.objects.filter(tester=selected[0]).update(status=Invitation.Status.ACCEPTED)
    confirm_payment(payment)
    assert Campaign.objects.get().opened_at == opened_at
    assert Payment.objects.get().paid_at == paid_at
    assert Invitation.objects.get(tester=selected[0]).status == "accepted"


def test_failed_payment_keeps_draft(dev_client, campaign, selected):
    reference = checkout(dev_client, campaign).json()["reference"]
    assert simulate(dev_client, reference, "failed").status_code == 200
    campaign.refresh_from_db()
    assert campaign.status == "draft" and Payment.objects.get().status == "failed"
    assert simulate(dev_client, reference, "paid").status_code == 409
    assert checkout(dev_client, campaign).json()["reference"] != reference


def test_simulate_rejects_unknown_outcome(dev_client, campaign, selected):
    reference = checkout(dev_client, campaign).json()["reference"]
    assert simulate(dev_client, reference, "maybe").status_code == 400


def test_simulate_only_with_simulated_provider(dev_client, campaign, selected, monkeypatch):
    reference = checkout(dev_client, campaign).json()["reference"]
    other = SimulatedProvider()
    other.name = "agregateur"
    monkeypatch.setattr(views, "get_provider", lambda: other)
    assert simulate(dev_client, reference, "paid").status_code == 404
    assert Payment.objects.get().status == "pending"


def test_payment_of_other_dev_404(dev_client, other_dev_client, tester_client, campaign, selected):
    assert checkout(other_dev_client, campaign).status_code == 404
    reference = checkout(dev_client, campaign).json()["reference"]
    assert other_dev_client.get(f"/api/payments/{reference}/").status_code == 404
    assert simulate(other_dev_client, reference, "paid").status_code == 404
    assert tester_client.get(f"/api/payments/{reference}/").status_code == 403
    assert Payment.objects.get().status == "pending"


def test_credit_tester_once(campaign, selected):
    invitation = Invitation.objects.get(tester=selected[0])
    first = credit_tester(invitation)
    second = credit_tester(invitation)
    assert first == second and Earning.objects.count() == 1
    assert first.amount_xof == 3500 and first.tester == selected[0]


def test_simulated_withdrawal_is_paid(campaign, selected):
    withdrawal = Withdrawal.objects.create(
        tester=selected[0], amount_xof=3500, momo_number="0700000009", provider="simule", reference="W1"
    )
    SimulatedProvider().send_withdrawal(withdrawal)
    withdrawal.refresh_from_db()
    assert withdrawal.status == "paid" and withdrawal.paid_at is not None
