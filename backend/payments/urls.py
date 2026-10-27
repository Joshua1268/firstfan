from django.urls import path

from . import views

urlpatterns = [
    path("payments/<str:reference>/", views.PaymentDetailView.as_view()),
    path("payments/<str:reference>/simulate/", views.PaymentSimulateView.as_view()),
]
