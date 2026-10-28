from django.db.models import Q
from django.http import FileResponse
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsTester

from .models import Invitation, StepProof
from .serializers import (
    AcceptSerializer,
    ProofSerializer,
    StepProofInputSerializer,
    SubmitSerializer,
    TesterInvitationDetailSerializer,
    TesterInvitationSummarySerializer,
)
from .services import accept_invitation, decline_invitation, save_step_proof, submit_test


def tester_invitations(user):
    # Selected invitations stay hidden until the dev has paid.
    return (
        Invitation.objects.filter(tester=user)
        .exclude(status=Invitation.Status.SELECTED)
        .select_related("campaign__project", "session__feedback")
        .prefetch_related("campaign__steps", "session__proofs")
    )


def get_invitation(request, pk: int) -> Invitation:
    return get_object_or_404(tester_invitations(request.user), pk=pk)


class TesterInvitationListView(APIView):
    permission_classes = [IsAuthenticated, IsTester]

    def get(self, request):
        invitations = tester_invitations(request.user).order_by("-created_at")
        return Response(TesterInvitationSummarySerializer(invitations, many=True).data)


class TesterInvitationDetailView(APIView):
    permission_classes = [IsAuthenticated, IsTester]

    def get(self, request, pk):
        return Response(TesterInvitationDetailSerializer(get_invitation(request, pk)).data)


class AcceptInvitationView(APIView):
    permission_classes = [IsAuthenticated, IsTester]

    def post(self, request, pk):
        invitation = get_invitation(request, pk)
        serializer = AcceptSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        accept_invitation(invitation, nda=serializer.validated_data["nda"])
        return Response(TesterInvitationDetailSerializer(get_invitation(request, pk)).data)


class DeclineInvitationView(APIView):
    permission_classes = [IsAuthenticated, IsTester]

    def post(self, request, pk):
        decline_invitation(get_invitation(request, pk))
        return Response(status=status.HTTP_204_NO_CONTENT)


class StepProofView(APIView):
    permission_classes = [IsAuthenticated, IsTester]
    parser_classes = [MultiPartParser]

    def post(self, request, pk, order):
        invitation = get_invitation(request, pk)
        serializer = StepProofInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        proof = save_step_proof(invitation, order, **serializer.validated_data)
        return Response(ProofSerializer(proof).data)


class SubmitTestView(APIView):
    permission_classes = [IsAuthenticated, IsTester]

    def post(self, request, pk):
        invitation = get_invitation(request, pk)
        serializer = SubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)
        dev_score, dev_comment = data.pop("dev_score"), data.pop("dev_comment")
        submit_test(invitation, feedback=data, dev_score=dev_score, dev_comment=dev_comment)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProofCaptureView(APIView):
    # Open to the session tester, the project owner and staff.
    def get(self, request, pk):
        proofs = StepProof.objects.exclude(capture="")
        if not request.user.is_staff:
            proofs = proofs.filter(
                Q(session__invitation__tester=request.user)
                | Q(session__invitation__campaign__project__owner=request.user)
            )
        proof = get_object_or_404(proofs, pk=pk)
        return FileResponse(proof.capture.open("rb"))
