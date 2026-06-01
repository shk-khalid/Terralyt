from django.contrib import admin
from audit.models import AuditLog

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("id", "emission_record", "action", "actor", "timestamp")
    list_filter = ("action",)
    search_fields = ("actor", "emission_record__id")
