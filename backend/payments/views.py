from django.http import Http404
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import TesterProfile
from core.permissions import IsDev, IsTester

from .models import Payment
from .providers import SimulatedProvider, get_provider
from .serializers import (
    EarningSerializer,
    PaymentSerializer,
    SimulateSerializer,
    WithdrawalSerializer,
    WithdrawSerializer,
)
from .services import balance_of, confirm_payment, fail_payment, withdraw


def get_own_payment(reference: str, owner) -> Payment:
    return get_object_or_404(Payment, reference=reference, campaign__project__owner=owner)


class PaymentDetailView(APIView):
    permission_classes = [IsAuthenticated, IsDev]

    def get(self, request, reference):
        return Response(PaymentSerializer(get_own_payment(reference, request.user)).data)


class PaymentSimulateView(APIView):
    permission_classes = [IsAuthenticated, IsDev]

    def post(self, request, reference):
        if get_provider().name != SimulatedProvider.name:
            raise Http404
        payment = get_own_payment(reference, request.user)
        serializer = SimulateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if serializer.validated_data["outcome"] == "paid":
            confirm_payment(payment)
        else:
            fail_payment(payment)
        payment.refresh_from_db()
        return Response(PaymentSerializer(payment).data)


class WalletView(APIView):
    permission_classes = [IsAuthenticated, IsTester]

    def get(self, request):
        user = request.user
        profile = get_object_or_404(TesterProfile, user=user)
        earnings = user.earnings.select_related("invitation__campaign__project").order_by("-created_at")
        return Response(
            {
                "balance_xof": balance_of(user),
                "momo_number": profile.momo_number,
                "earnings": EarningSerializer(earnings, many=True).data,
                "withdrawals": WithdrawalSerializer(user.withdrawals.order_by("-created_at"), many=True).data,
            }
        )


class WithdrawalCreateView(APIView):
    permission_classes = [IsAuthenticated, IsTester]

    def post(self, request):
        serializer = WithdrawSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        withdrawal = withdraw(request.user, serializer.validated_data["amount_xof"])
        return Response(WithdrawalSerializer(withdrawal).data, status=status.HTTP_201_CREATED)
