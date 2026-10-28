from django.http import Http404
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsDev

from .models import Payment
from .providers import SimulatedProvider, get_provider
from .serializers import PaymentSerializer, SimulateSerializer
from .services import confirm_payment, fail_payment


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
