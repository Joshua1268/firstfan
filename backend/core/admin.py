from django.contrib import admin


class ReadOnlyAdmin(admin.ModelAdmin):
    # Money and tracking records change only through the app, never by hand.
    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
