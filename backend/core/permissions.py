from rest_framework.permissions import BasePermission


class IsDev(BasePermission):
    def has_permission(self, request, view):
        return getattr(request.user, "role", None) == "dev"


class IsTester(BasePermission):
    def has_permission(self, request, view):
        return getattr(request.user, "role", None) == "tester"
