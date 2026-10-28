import os
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured

BASE_DIR = Path(__file__).resolve().parent.parent

TRUE_VALUES = ("1", "true", "yes", "on")


def env_bool(name, default):
    value = os.environ.get(name)
    return default if value is None else value.strip().lower() in TRUE_VALUES


def env_list(name, default=""):
    return [item.strip() for item in os.environ.get(name, default).split(",") if item.strip()]


DEV_SECRET_KEY = "dev-insecure-key-change-me"

SECRET_KEY = os.environ.get("SECRET_KEY", DEV_SECRET_KEY)

DEBUG = env_bool("DEBUG", True)

ALLOWED_HOSTS = env_list("ALLOWED_HOSTS", "*")

# Must be set explicitly outside DEBUG: true for the demo, false in real production.
DEMO_MODE = env_bool("DEMO_MODE", True)

if not DEBUG:
    if not SECRET_KEY or SECRET_KEY == DEV_SECRET_KEY:
        raise ImproperlyConfigured(
            "SECRET_KEY doit être défini (et différent de la clé de développement) quand DEBUG est faux."
        )
    if not ALLOWED_HOSTS or "*" in ALLOWED_HOSTS:
        raise ImproperlyConfigured(
            "ALLOWED_HOSTS doit lister les domaines servis (sans « * ») quand DEBUG est faux."
        )
    if "DEMO_MODE" not in os.environ:
        raise ImproperlyConfigured("DEMO_MODE doit être défini explicitement quand DEBUG est faux.")

    # Caddy terminates TLS and sends X-Forwarded-Proto.
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    CSRF_TRUSTED_ORIGINS = env_list("CSRF_TRUSTED_ORIGINS")
    if not CSRF_TRUSTED_ORIGINS:
        raise ImproperlyConfigured(
            "CSRF_TRUSTED_ORIGINS doit lister les origines https du site quand DEBUG est faux."
        )
    SECURE_HSTS_SECONDS = int(os.environ.get("SECURE_HSTS_SECONDS", "31536000"))
    SECURE_HSTS_INCLUDE_SUBDOMAINS = env_bool("SECURE_HSTS_INCLUDE_SUBDOMAINS", False)
    # Caddy redirects to https; the internal /api/health/ probe stays on http.
    SECURE_SSL_REDIRECT = env_bool("SECURE_SSL_REDIRECT", False)
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_REFERRER_POLICY = "same-origin"
else:
    CSRF_TRUSTED_ORIGINS = env_list("CSRF_TRUSTED_ORIGINS")


INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "accounts",
    "core",
    "public",
    "projects",
    "campaigns",
    "payments",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"


DATABASES = {
    "default": {
        "ENGINE": "django_pg8000",
        "NAME": os.environ.get("DATABASE_NAME", "cadev"),
        "USER": os.environ.get("DATABASE_USER", "cadev"),
        "PASSWORD": os.environ.get("DATABASE_PASSWORD", "cadev"),
        "HOST": os.environ.get("DATABASE_HOST", "localhost"),
        "PORT": os.environ.get("DATABASE_PORT", "55432"),
    }
}


AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]


LANGUAGE_CODE = "fr"

TIME_ZONE = "Africa/Abidjan"

USE_I18N = True

USE_TZ = True


STATIC_URL = "static/"


MAILERS = {
    "default": {
        "BACKEND": "django.core.mail.backends.console.EmailBackend",
    },
}

AUTH_USER_MODEL = "accounts.User"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

PRODUCT_NAME = os.environ.get("PRODUCT_NAME", "FirstFan")

# Public address of the site, used in the tracking script snippet.
SITE_URL = os.environ.get("SITE_URL", "http://localhost:3000").rstrip("/")

# Whole XOF amounts.
PRICE_PER_TESTER_XOF = int(os.environ.get("PRICE_PER_TESTER_XOF", "5000"))
TESTER_REWARD_XOF = int(os.environ.get("TESTER_REWARD_XOF", "3500"))
# Only "simule" exists for now: the hook for a real aggregator.
PAYMENT_PROVIDER = os.environ.get("PAYMENT_PROVIDER", "simule")

# Closed by default: a public view must declare AllowAny.
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ["rest_framework.authentication.SessionAuthentication"],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"],
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"]
    + (["rest_framework.renderers.BrowsableAPIRenderer"] if DEBUG else []),
    "DEFAULT_PARSER_CLASSES": ["rest_framework.parsers.JSONParser"],
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": os.environ.get("THROTTLE_ANON", "60/min"),
        "user": os.environ.get("THROTTLE_USER", "300/min"),
        # Read by the Next server (15 s cache), not by each visitor.
        "public_stats": os.environ.get("THROTTLE_PUBLIC_STATS", "240/min"),
        "login": os.environ.get("THROTTLE_LOGIN", "10/min"),
    },
    # Caddy is the only proxy, so the client IP is the last X-Forwarded-For entry.
    "NUM_PROXIES": None if DEBUG else int(os.environ.get("NUM_PROXIES", "1")),
}
