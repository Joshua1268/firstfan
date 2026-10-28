import pytest
from rest_framework.exceptions import ValidationError

from accounts.models import TesterProfile, User
from campaigns.models import Invitation
from conftest import client_for, make_tester
from payments.models import Withdrawal
from payments.services import balance_of, credit_tester, withdraw


@pytest.fixture(autouse=True)
def _settings(settings):
    settings.TESTER_REWARD_XOF = 3500
    settings.PAYMENT_PROVIDER = "simule"


def earn(campaign, tester):
    invitation = Invitation.objects.create(
        campaign=campaign, tester=tester, status=Invitation.Status.VALIDATED
    )
    return credit_tester(invitation)


def post_withdrawal(client, amount):
    return client.post("/api/tester/withdrawals/", {"amount_xof": amount}, content_type="application/json")


def test_balance_after_validations(tester_client, tester_user, campaign):
    earn(campaign, tester_user)
    earn(campaign, make_tester("b@x.ci"))
    assert balance_of(tester_user) == 3500
    body = tester_client.get("/api/tester/wallet/").json()
    assert body["balance_xof"] == 3500
    assert body["momo_number"] == "0700000001"
    [earning] = body["earnings"]
    assert earning["amount_xof"] == 3500 and earning["project_name"] == "Compta Express"
    assert earning["created_at"]
    assert body["withdrawals"] == []


def test_withdraw_full_balance(tester_client, tester_user, campaign):
    earn(campaign, tester_user)
    response = post_withdrawal(tester_client, 3500)
    assert response.status_code == 201
    body = response.json()
    assert body["amount_xof"] == 3500
    assert body["status"] == "paid"
    assert body["momo_number_masked"] == "07 •• •• •• 01"
    withdrawal = Withdrawal.objects.get()
    assert withdrawal.momo_number == "0700000001" and withdrawal.provider == "simule"
    assert balance_of(tester_user) == 0
    wallet = tester_client.get("/api/tester/wallet/").json()
    assert wallet["balance_xof"] == 0
    assert wallet["withdrawals"][0]["momo_number_masked"] == "07 •• •• •• 01"


def test_withdraw_more_than_balance_400(tester_client, tester_user, campaign):
    earn(campaign, tester_user)
    response = post_withdrawal(tester_client, 3501)
    assert response.status_code == 400
    assert response.json() == {"amount_xof": ["Montant supérieur à ton solde."]}
    assert post_withdrawal(tester_client, 0).status_code == 400
    assert not Withdrawal.objects.exists()


def test_withdraw_requires_momo(tester_client, tester_user, campaign):
    earn(campaign, tester_user)
    TesterProfile.objects.filter(user=tester_user).update(momo_number="")
    response = post_withdrawal(tester_client, 1000)
    assert response.status_code == 400
    assert response.json() == {"detail": "Ajoute ton numéro mobile money dans ton profil."}
    assert not Withdrawal.objects.exists()


def test_failed_withdrawal_restores_balance(tester_user, campaign):
    earn(campaign, tester_user)
    withdrawal = Withdrawal.objects.create(
        tester=tester_user, amount_xof=3000, momo_number="0700000001", provider="simule"
    )
    assert balance_of(tester_user) == 500
    admin = User.objects.create_superuser("admin@x.ci", "admin@x.ci", "Sol1de-pass!")
    response = client_for(admin).post(
        "/admin/payments/withdrawal/",
        {"action": "mark_failed", "_selected_action": [withdrawal.pk]},
    )
    assert response.status_code == 302
    withdrawal.refresh_from_db()
    assert withdrawal.status == Withdrawal.Status.FAILED
    assert balance_of(tester_user) == 3500


def test_concurrent_withdrawals_never_overdraw(tester_user, campaign):
    earn(campaign, tester_user)
    withdraw(tester_user, 3500)
    with pytest.raises(ValidationError):
        withdraw(tester_user, 3500)
    assert Withdrawal.objects.count() == 1
    assert balance_of(tester_user) == 0


def test_wallet_other_tester_isolated(tester_client, tester_user, campaign):
    other = make_tester("b@x.ci")
    earn(campaign, other)
    Withdrawal.objects.create(tester=other, amount_xof=100, momo_number="0700000009", provider="simule")
    body = tester_client.get("/api/tester/wallet/").json()
    assert body["balance_xof"] == 0
    assert body["earnings"] == [] and body["withdrawals"] == []
    assert post_withdrawal(tester_client, 100).status_code == 400
    assert balance_of(other) == 3400


def test_dev_cannot_access_wallet(dev_client, client, db):
    assert dev_client.get("/api/tester/wallet/").status_code == 403
    assert post_withdrawal(dev_client, 100).status_code == 403
    assert client.get("/api/tester/wallet/").status_code == 403
