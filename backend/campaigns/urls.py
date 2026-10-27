from django.urls import path

from . import views_dev

urlpatterns = [
    path("projects/<int:pk>/campaigns/", views_dev.ProjectCampaignsView.as_view()),
    path("campaigns/<int:pk>/", views_dev.CampaignDetailView.as_view()),
]
