from django.contrib import admin
from django.urls import include, path

from tracking.views import tracking_script

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/public/", include("public.urls")),
    path("api/", include("core.urls")),
    path("api/", include("accounts.urls")),
    path("api/", include("projects.urls")),
    path("api/", include("campaigns.urls")),
    path("api/", include("payments.urls")),
    path("api/", include("tracking.urls")),
    path("t.js", tracking_script),
]
