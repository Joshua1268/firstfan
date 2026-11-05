from pathlib import Path

from django.contrib.auth import authenticate, login, logout
from django.http import FileResponse, Http404, HttpResponseRedirect
from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from core.permissions import IsTester

from . import google
from .models import TesterProfile
from .professions import PROFESSIONS
from .serializers import LoginSerializer, MeSerializer, RegisterSerializer, TesterProfileSerializer
from .services import register_user


@method_decorator(ensure_csrf_cookie, name="dispatch")
class CsrfView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(status=status.HTTP_204_NO_CONTENT)


# DRF only checks CSRF for logged-in users, so anonymous forms need csrf_protect.
@method_decorator(csrf_protect, name="dispatch")
class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = register_user(**serializer.validated_data)
        login(request, user)
        return Response(MeSerializer(user).data, status=status.HTTP_201_CREATED)


@method_decorator(csrf_protect, name="dispatch")
class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        user = authenticate(request, username=data["email"].lower(), password=data["password"])
        if user is None:
            raise ValidationError({"detail": "Email ou mot de passe incorrect."})
        login(request, user)
        return Response(MeSerializer(user).data)


class GoogleStatusView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"enabled": google.is_enabled()})


def google_error_redirect(code: str) -> HttpResponseRedirect:
    page = "/inscription" if code in ("inconnu", "consentement") else "/connexion"
    return HttpResponseRedirect(f"{page}?google={code}")


class GoogleStartView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"

    def get(self, request):
        params = request.query_params
        try:
            url = google.start(
                request.session,
                intent=params.get("intent", ""),
                role=params.get("role", ""),
                consent=params.get("consent") == "1",
                next_path=params.get("next", ""),
            )
        except google.GoogleError as e:
            return google_error_redirect(e.code)
        return HttpResponseRedirect(url)


class GoogleCallbackView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"

    def get(self, request):
        params = request.query_params
        if "error" in params:
            request.session.pop(google.SESSION_KEY, None)
            return google_error_redirect("annule")
        try:
            user, target = google.finish(
                request.session, code=params.get("code", ""), state=params.get("state", "")
            )
        except google.GoogleError as e:
            return google_error_redirect(e.code)
        except ValidationError:
            # Same email signed up at the same moment.
            return google_error_redirect("invalide")
        login(request, user)
        return HttpResponseRedirect(target)


class LogoutView(APIView):
    # Idempotent so the front can call it after the session expired.
    permission_classes = [AllowAny]

    def post(self, request):
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    def get(self, request):
        return Response(MeSerializer(request.user).data)


class ProfessionList(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(PROFESSIONS)


class TesterProfileView(APIView):
    permission_classes = [IsAuthenticated, IsTester]
    parser_classes = [JSONParser, MultiPartParser]

    def get(self, request):
        profile = get_object_or_404(TesterProfile, user=request.user)
        return Response(TesterProfileSerializer(profile).data)

    def patch(self, request):
        profile = get_object_or_404(TesterProfile, user=request.user)
        serializer = TesterProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class TesterProofView(APIView):
    def get(self, request):
        user_id = request.user.id
        if request.user.is_staff and "user" in request.query_params:
            user_id = request.query_params["user"]
            if not user_id.isdigit():
                raise Http404
        profile = get_object_or_404(TesterProfile, user_id=user_id)
        if not profile.proof:
            raise Http404
        ext = Path(profile.proof.name).suffix
        return FileResponse(profile.proof.open("rb"), as_attachment=True, filename=f"justificatif{ext}")
