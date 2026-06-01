from django.contrib import admin
from emissions.models import EmissionRecord

@admin.register(EmissionRecord)
class EmissionRecordAdmin(admin.ModelAdmin):
    list_display = ("id", "tenant", "scope", "activity_type", "activity_date", "quantity", "normalized_unit", "anomaly_flag", "review_status")
    list_filter = ("scope", "activity_type", "anomaly_flag", "review_status")
    search_fields = ("tenant__company_name", "anomaly_reason")
