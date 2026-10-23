from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils import timezone

from .models import TesterProfile, User


@admin.register(User)
class CadevUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (("CADEV", {"fields": ("role",)}),)
    list_display = ("username", "email", "role", "is_staff")


@admin.register(TesterProfile)
class TesterProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "profession", "verification")
    list_filter = ("verification",)
    actions = ["marquer_verifie"]

    @admin.action(description="Marquer comme verifie")
    def marquer_verifie(self, request, queryset):
        queryset.update(verification=TesterProfile.Verification.VERIFIED, verified_at=timezone.now())
