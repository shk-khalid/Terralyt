from django.db import models
from tenants.models import Tenant
from ingestion.models import RawRecord
import uuid

class EmissionRecord(models.Model):

    class Scope(models.TextChoices):
        SCOPE_1 = "SCOPE_1", "Scope 1"
        SCOPE_2 = "SCOPE_2", "Scope 2"
        SCOPE_3 = "SCOPE_3", "Scope 3"

    class ActivityType(models.TextChoices):
        FUEL = "FUEL", "Fuel"
        ELECTRICITY = "ELECTRICITY", "Electricity"
        FLIGHT = "FLIGHT", "Flight"
        HOTEL = "HOTEL", "Hotel"
        GROUND_TRANSPORT = "GROUND_TRANSPORT", "Ground Transport"
        PROCUREMENT = "PROCUREMENT", "Procurement"

    class ReviewStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name="emission_records",
        db_index=False
    )

    facility = models.ForeignKey(
        'tenants.Facility',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="emission_records"
    )

    raw_record = models.OneToOneField(
        RawRecord,
        on_delete=models.CASCADE,
        related_name="emission_record"
    )

    scope = models.CharField(
        max_length=50,
        choices=Scope.choices
    )

    activity_type = models.CharField(
        max_length=100,
        choices=ActivityType.choices
    )

    activity_date = models.DateField()

    quantity = models.DecimalField(
        max_digits=15,
        decimal_places=3
    )

    normalized_unit = models.CharField(max_length=100)

    emission_factor = models.DecimalField(
        max_digits=15,
        decimal_places=6,
        blank=True,
        null=True
    )

    emission_value = models.DecimalField(
        max_digits=15,
        decimal_places=6,
        blank=True,
        null=True
    )

    anomaly_flag = models.BooleanField(default=False)

    anomaly_reason = models.TextField(blank=True, null=True)

    review_status = models.CharField(
        max_length=50,
        choices=ReviewStatus.choices,
        default=ReviewStatus.PENDING
    )

    is_locked = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "emission_records"
        indexes = [
            models.Index(fields=["review_status"]),
            models.Index(fields=["scope"]),
            models.Index(fields=["activity_type"]),
            models.Index(fields=["anomaly_flag"]),
            models.Index(fields=["activity_date"]),
            models.Index(fields=["tenant"]),
            models.Index(fields=["tenant", "review_status"]),
        ]

    def __str__(self):
        return f"{self.activity_type} - {self.quantity} {self.normalized_unit}"

    def calculate_emissions(self):
        qty = float(self.quantity or 0)
        act = (self.activity_type or "").upper()
        if act == "ELECTRICITY":
            factor = 0.385
        elif act == "FUEL":
            factor = 2.5
        elif act == "FLIGHT":
            factor = 0.3
        else:
            factor = 0.5
            
        self.emission_factor = factor
        self.emission_value = (qty * factor) / 1000.0

    def save(self, *args, **kwargs):
        self.calculate_emissions()
        super().save(*args, **kwargs)