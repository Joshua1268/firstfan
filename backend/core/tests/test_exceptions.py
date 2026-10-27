from rest_framework.test import APIRequestFactory
from rest_framework.views import APIView

from core.exceptions import Conflict


class ConflictView(APIView):
    permission_classes = []

    def get(self, request):
        raise Conflict("Campagne déjà payée.")


class DefaultConflictView(APIView):
    permission_classes = []

    def get(self, request):
        raise Conflict()


def test_conflict_returns_409_with_detail():
    response = ConflictView.as_view()(APIRequestFactory().get("/"))
    assert response.status_code == 409
    assert response.data == {"detail": "Campagne déjà payée."}


def test_conflict_default_detail():
    response = DefaultConflictView.as_view()(APIRequestFactory().get("/"))
    assert response.data == {"detail": "Action impossible dans l'état actuel."}
