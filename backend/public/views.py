from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .services import get_public_stats


class StatsView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "public_stats"

    def get(self, request):
        response = Response(get_public_stats())
        response["Cache-Control"] = "public, max-age=15"
        return response
