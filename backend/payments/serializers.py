from rest_framework import serializers

from .models import Earning, Payment, Withdrawal


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ["reference", "amount_xof", "status", "campaign_id"]


class SimulateSerializer(serializers.Serializer):
    outcome = serializers.ChoiceField(choices=["paid", "failed"])


class EarningSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source="invitation.campaign.project.name")

    class Meta:
        model = Earning
        fields = ["amount_xof", "project_name", "created_at"]


class WithdrawalSerializer(serializers.ModelSerializer):
    momo_number_masked = serializers.SerializerMethodField()

    class Meta:
        model = Withdrawal
        fields = ["amount_xof", "status", "momo_number_masked", "created_at"]

    def get_momo_number_masked(self, withdrawal: Withdrawal) -> str:
        number = withdrawal.momo_number
        return f"{number[:2]} •• •• •• {number[-2:]}"


class WithdrawSerializer(serializers.Serializer):
    amount_xof = serializers.IntegerField(min_value=1)
