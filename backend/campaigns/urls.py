from django.urls import path

from . import views_dev, views_tester

urlpatterns = [
    path("projects/<int:pk>/campaigns/", views_dev.ProjectCampaignsView.as_view()),
    path("campaigns/<int:pk>/", views_dev.CampaignDetailView.as_view()),
    path("campaigns/<int:pk>/testers/", views_dev.CampaignTestersView.as_view()),
    path("campaigns/<int:pk>/selection/", views_dev.CampaignSelectionView.as_view()),
    path("campaigns/<int:pk>/checkout/", views_dev.CampaignCheckoutView.as_view()),
    path("tester/invitations/", views_tester.TesterInvitationListView.as_view()),
    path("tester/invitations/<int:pk>/", views_tester.TesterInvitationDetailView.as_view()),
    path("tester/invitations/<int:pk>/accept/", views_tester.AcceptInvitationView.as_view()),
    path("tester/invitations/<int:pk>/decline/", views_tester.DeclineInvitationView.as_view()),
    path("tester/invitations/<int:pk>/steps/<int:order>/", views_tester.StepProofView.as_view()),
    path("tester/invitations/<int:pk>/submit/", views_tester.SubmitTestView.as_view()),
    path("proofs/<int:pk>/capture/", views_tester.ProofCaptureView.as_view()),
]
