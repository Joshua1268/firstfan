import base64
import json
import secrets
import time
from urllib.parse import urlencode

import httpx
from django.conf import settings
from django.utils.http import url_has_allowed_host_and_scheme

from .models import User
from .services import register_user

AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
TOKEN_URL = "https://oauth2.googleapis.com/token"
ISSUERS = ("https://accounts.google.com", "accounts.google.com")
SESSION_KEY = "google_oauth"
TIMEOUT_S = 5


# `code` is the short reason the front shows after the redirect.
class GoogleError(Exception):
    def __init__(self, code: str):
        super().__init__(code)
        self.code = code


def is_enabled() -> bool:
    return bool(settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET)


def redirect_uri() -> str:
    return settings.SITE_URL + "/api/auth/google/callback/"


def safe_next(next_path: str) -> str:
    if next_path.startswith("/") and url_has_allowed_host_and_scheme(next_path, allowed_hosts=set()):
        return next_path
    return ""


def home_for(user: User) -> str:
    if user.role == User.Role.DEV:
        return "/dev"
    if user.role == User.Role.TESTER:
        profile = getattr(user, "tester_profile", None)
        return "/testeur" if profile and profile.is_complete else "/testeur/profil"
    return "/"


def start(session, *, intent: str, role: str, consent: bool, next_path: str) -> str:
    if not is_enabled():
        raise GoogleError("indisponible")
    if intent not in ("login", "signup"):
        raise GoogleError("invalide")
    if intent == "signup":
        if role not in (User.Role.DEV, User.Role.TESTER):
            raise GoogleError("invalide")
        if role == User.Role.TESTER and not consent:
            raise GoogleError("consentement")
    state = secrets.token_urlsafe(32)
    session[SESSION_KEY] = {
        "state": state,
        "intent": intent,
        "role": role if intent == "signup" else "",
        "consent": consent,
        "next": safe_next(next_path),
    }
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": redirect_uri(),
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "prompt": "select_account",
    }
    return AUTH_URL + "?" + urlencode(params)


def exchange_code(code: str) -> dict:
    data = {
        "code": code,
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "redirect_uri": redirect_uri(),
        "grant_type": "authorization_code",
    }
    try:
        response = httpx.post(TOKEN_URL, data=data, timeout=TIMEOUT_S)
        response.raise_for_status()
        return response.json()
    except (httpx.HTTPError, ValueError) as e:
        raise GoogleError("invalide") from e


# The id_token comes straight from Google's token endpoint over HTTPS,
# so OpenID Connect allows reading it without checking the signature.
def read_claims(id_token: str) -> dict:
    try:
        payload = id_token.split(".")[1]
        claims = json.loads(base64.urlsafe_b64decode(payload + "=" * (-len(payload) % 4)))
    except (IndexError, ValueError) as e:
        raise GoogleError("invalide") from e
    if not isinstance(claims, dict):
        raise GoogleError("invalide")
    if claims.get("aud") != settings.GOOGLE_CLIENT_ID or claims.get("iss") not in ISSUERS:
        raise GoogleError("invalide")
    if not isinstance(claims.get("exp"), int | float) or claims["exp"] < time.time():
        raise GoogleError("invalide")
    if not claims.get("email") or claims.get("email_verified") not in (True, "true"):
        raise GoogleError("refuse")
    return claims


def finish(session, *, code: str, state: str) -> tuple[User, str]:
    saved = session.pop(SESSION_KEY, None)
    if not saved or not state or not secrets.compare_digest(saved["state"], state):
        raise GoogleError("invalide")
    if not code:
        raise GoogleError("invalide")
    claims = read_claims(exchange_code(code).get("id_token", ""))
    email = claims["email"].lower()
    if len(email) > 150:
        raise GoogleError("refuse")
    user = User.objects.filter(username=email).first()
    if user is None:
        if saved["intent"] != "signup":
            raise GoogleError("inconnu")
        user = register_user(
            email=email,
            password=None,
            first_name=(claims.get("given_name") or "")[:150],
            role=saved["role"],
            consent=saved["consent"],
        )
    if not user.is_active:
        raise GoogleError("refuse")
    return user, saved["next"] or home_for(user)
