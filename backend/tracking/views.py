import json
from pathlib import Path

from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from core.permissions import IsDev
from projects.models import Project

from .serializers import TrackSerializer
from .services import adoption_rows, record_event, script_status

SCRIPT = (Path(__file__).parent / "static" / "tracking" / "t.js").read_text()


def tracking_script(request):
    response = HttpResponse(SCRIPT, content_type="application/javascript")
    response["Cache-Control"] = "public, max-age=300"
    return response


class TrackView(APIView):
    # Called by the script on the dev's site: no session, and never an error back.
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "track"

    def post(self, request):
        try:
            payload = json.loads(request.body)
        except ValueError:
            payload = None
        serializer = TrackSerializer(data=payload)
        if serializer.is_valid():
            data = serializer.validated_data
            record_event(key=data["k"], token=data.get("t"), url=data["u"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class ScriptStatusView(APIView):
    permission_classes = [IsAuthenticated, IsDev]

    def get(self, request, pk):
        project = get_object_or_404(Project, pk=pk, owner=request.user)
        return Response(script_status(project))


class AdoptionView(APIView):
    permission_classes = [IsAuthenticated, IsDev]

    def get(self, request, pk):
        project = get_object_or_404(Project, pk=pk, owner=request.user)
        demo = project.campaigns.filter(is_demo=True).exists()
        return Response({"rows": adoption_rows(project, timezone.now()), "demo": demo})
