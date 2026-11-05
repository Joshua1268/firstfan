from django.urls import path

from . import views

urlpatterns = [
    path("auth/csrf/", views.CsrfView.as_view()),
    path("auth/register/", views.RegisterView.as_view()),
    path("auth/login/", views.LoginView.as_view()),
    path("auth/logout/", views.LogoutView.as_view()),
    path("auth/google/", views.GoogleStatusView.as_view()),
    path("auth/google/start/", views.GoogleStartView.as_view()),
    path("auth/google/callback/", views.GoogleCallbackView.as_view()),
    path("auth/me/", views.MeView.as_view()),
    path("professions/", views.ProfessionList.as_view()),
    path("tester/profile/", views.TesterProfileView.as_view()),
    path("tester/profile/proof/", views.TesterProofView.as_view()),
]
