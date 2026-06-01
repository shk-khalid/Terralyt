from django.db import models
from tenants.models import Tenant
import uuid

class DataSource(models.Model):

    class SourceType(models.TextChoices):
        SAP = "SAP", "SAP"
        UTILITY = "UTILITY", "Utility"
        TRAVEL = "TRAVEL", "Travel"
        
    class IngestionMethod(models.TextChoices):
        CSV_Upload = "CSV_UPLOAD", "CSV Upload"
        API_PULL = "API_PULL", "API Pull"
        MANUAL = "MANUAL", "Manual"
    
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        PROCESSING = "PROCESSING", "Processing"
        COMPLETED = "COMPLETED", "Completed"
        FAILED = "FAILED", "Failed"
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="data_sources", db_index=False)
    facility = models.ForeignKey(
        'tenants.Facility',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="data_sources"
    )
    source_type = models.CharField(max_length=50, choices=SourceType.choices)
    ingestion_method = models.CharField(max_length=50, choices=IngestionMethod.choices)
    uploaded_file = models.FileField(upload_to='uploads/', blank=True, null=True)
    file_size = models.IntegerField(null=True, blank=True)
    processing_time = models.FloatField(null=True, blank=True)
    file_url = models.URLField(max_length=500, blank=True, null=True)
    uploaded_by = models.CharField(max_length=255)
    status = models.CharField(max_length=50, choices=Status.choices, default=Status.PENDING)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = "data_sources"
        indexes = [
            models.Index(fields=["tenant"]),
            models.Index(fields=["source_type"]),
            models.Index(fields=["status"]),
            models.Index(fields=["uploaded_at"]),
        ]

    def __str__(self):
        return f"{self.source_type} - {self.tenant.company_name}"


class RawRecord(models.Model):

    class ParseStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        SUCCESS = "SUCCESS", "Success"
        FAILED = "FAILED", "Failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    data_source = models.ForeignKey(DataSource, on_delete=models.CASCADE, related_name="raw_records", db_index=False)
    row_number = models.IntegerField()
    raw_payload = models.JSONField()
    parse_status = models.CharField(max_length=50, choices=ParseStatus.choices, default=ParseStatus.PENDING)
    error_message = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta: 
        db_table = "raw_records"
        indexes = [
            models.Index(fields=["parse_status"]),
            models.Index(fields=["data_source"]),
        ]

    def __str__(self):
        return f"Row {self.row_number} - {self.data_source.source_type}"