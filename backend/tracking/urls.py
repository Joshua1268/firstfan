from django.urls import path

from . import views

urlpatterns = [
    path("track/", views.TrackView.as_view()),
    path("projects/<int:pk>/script-status/", views.ScriptStatusView.as_view()),
    path("projects/<int:pk>/adoption/", views.AdoptionView.as_view()),
]
