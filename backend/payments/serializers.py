from rest_framework import serializers

from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ["reference", "amount_xof", "status", "campaign_id"]


class SimulateSerializer(serializers.Serializer):
    outcome = serializers.ChoiceField(choices=["paid", "failed"])
