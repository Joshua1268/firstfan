from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsDev
from payments.providers import get_provider
from payments.services import start_checkout
from projects.models import Project
from tracking.services import last_event_by_invitation

from .matching import tester_candidates
from .models import Campaign, Invitation
from .serializers import (
    CampaignCreateSerializer,
    CampaignDetailSerializer,
    CampaignSummarySerializer,
    LiveRowSerializer,
    SelectionSerializer,
    TesterCandidateSerializer,
    ValidateSerializer,
)
from .services import create_campaign, select_testers, validate_test


def get_campaign_detail(pk: int, owner) -> Campaign:
    campaigns = Campaign.objects.select_related("project").prefetch_related(
        "steps", "invitations__tester__tester_profile", "invitations__session__proofs"
    )
    return get_object_or_404(campaigns, pk=pk, project__owner=owner)


class ProjectCampaignsView(APIView):
    permission_classes = [IsAuthenticated, IsDev]

    def get(self, request, pk):
        project = get_object_or_404(Project, pk=pk, owner=request.user)
        campaigns = project.campaigns.order_by("-created_at")
        return Response(CampaignSummarySerializer(campaigns, many=True).data)

    def post(self, request, pk):
        project = get_object_or_404(Project, pk=pk, owner=request.user)
        serializer = CampaignCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        campaign = create_campaign(project=project, **serializer.validated_data)
        data = CampaignDetailSerializer(get_campaign_detail(campaign.pk, request.user)).data
        return Response(data, status=status.HTTP_201_CREATED)


class CampaignDetailView(APIView):
    permission_classes = [IsAuthenticated, IsDev]

    def get(self, request, pk):
        return Response(CampaignDetailSerializer(get_campaign_detail(pk, request.user)).data)


class CampaignTestersView(APIView):
    permission_classes = [IsAuthenticated, IsDev]

    def get(self, request, pk):
        campaign = get_object_or_404(Campaign, pk=pk, project__owner=request.user)
        source, candidates = tester_candidates(campaign)
        return Response(
            {"source": source, "candidates": TesterCandidateSerializer(candidates, many=True).data}
        )


class CampaignSelectionView(APIView):
    permission_classes = [IsAuthenticated, IsDev]

    def post(self, request, pk):
        campaign = get_object_or_404(Campaign, pk=pk, project__owner=request.user)
        serializer = SelectionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        select_testers(campaign, serializer.validated_data["tester_ids"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class CampaignCheckoutView(APIView):
    permission_classes = [IsAuthenticated, IsDev]

    def post(self, request, pk):
        campaign = get_object_or_404(Campaign, pk=pk, project__owner=request.user)
        payment = start_checkout(campaign)
        return Response(
            {"reference": payment.reference, "redirect_url": get_provider().start_checkout(payment)}
        )


def live_rows_data(invitations) -> list:
    last_events = last_event_by_invitation([i.pk for i in invitations])
    return LiveRowSerializer(invitations, many=True, context={"last_events": last_events}).data


def live_invitations(owner):
    # Selected testers only see the campaign once it is paid.
    return (
        Invitation.objects.filter(campaign__project__owner=owner)
        .exclude(status=Invitation.Status.SELECTED)
        .select_related("campaign__project", "tester__tester_profile", "session__feedback")
        .prefetch_related("session__proofs__step", "session__ratings")
        .order_by("pk")
    )


class CampaignLiveView(APIView):
    permission_classes = [IsAuthenticated, IsDev]

    def get(self, request, pk):
        campaign = get_object_or_404(Campaign, pk=pk, project__owner=request.user)
        rows = list(live_invitations(request.user).filter(campaign=campaign))
        return Response(live_rows_data(rows))


class ValidateTestView(APIView):
    permission_classes = [IsAuthenticated, IsDev]

    def post(self, request, pk):
        invitation = get_object_or_404(live_invitations(request.user), pk=pk)
        serializer = ValidateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validate_test(invitation, **serializer.validated_data)
        return Response(live_rows_data([get_object_or_404(live_invitations(request.user), pk=pk)])[0])
