from django.contrib import admin
from ingestion.models import DataSource, RawRecord

@admin.register(DataSource)
class DataSourceAdmin(admin.ModelAdmin):
    list_display = ("id", "tenant", "source_type", "ingestion_method", "status", "uploaded_at")
    list_filter = ("source_type", "ingestion_method", "status")
    search_fields = ("tenant__company_name", "uploaded_by")

@admin.register(RawRecord)
class RawRecordAdmin(admin.ModelAdmin):
    list_display = ("id", "data_source", "row_number", "parse_status", "created_at")
    list_filter = ("parse_status",)
    search_fields = ("data_source__tenant__company_name", "error_message")
