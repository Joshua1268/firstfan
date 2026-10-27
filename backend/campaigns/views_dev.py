from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsDev
from projects.models import Project

from .models import Campaign
from .serializers import (
    CampaignCreateSerializer,
    CampaignDetailSerializer,
    CampaignSummarySerializer,
    SelectionSerializer,
    TesterCandidateSerializer,
)
from .services import create_campaign, eligible_testers, select_testers


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
        candidates = list(eligible_testers(campaign))
        context = {
            "recommended_ids": {user.pk for user in candidates[: campaign.testers_wanted]},
            "selected_ids": set(campaign.invitations.values_list("tester_id", flat=True)),
        }
        return Response(TesterCandidateSerializer(candidates, many=True, context=context).data)


class CampaignSelectionView(APIView):
    permission_classes = [IsAuthenticated, IsDev]

    def post(self, request, pk):
        campaign = get_object_or_404(Campaign, pk=pk, project__owner=request.user)
        serializer = SelectionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        select_testers(campaign, serializer.validated_data["tester_ids"])
        return Response(status=status.HTTP_204_NO_CONTENT)
