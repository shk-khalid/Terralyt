from django.db import models
from django.conf import settings
from tenants.models import Tenant
from emissions.models import EmissionRecord
import uuid

class AuditLog(models.Model):

    class ActionType(models.TextChoices):
        CREATED = "CREATED", "Created"
        UPDATED = "UPDATED", "Updated"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"
        LOCKED = "LOCKED", "Locked"
        UPLOADED = "UPLOADED", "Uploaded"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    emission_record = models.ForeignKey(
        EmissionRecord,
        on_delete=models.CASCADE,
        related_name="audit_logs",
        db_index=False,
        null=True,
        blank=True
    )

    acted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs"
    )

    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name="audit_logs",
        null=True,
        blank=True
    )

    action_type = models.CharField(
        max_length=50,
        choices=ActionType.choices
    )

    # Keep compatibility with existing fields
    action = models.CharField(
        max_length=50,
        choices=ActionType.choices,
        blank=True,
        null=True
    )
    actor = models.CharField(max_length=255, blank=True, null=True)

    old_value = models.JSONField(blank=True, null=True)
    new_value = models.JSONField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "audit_logs"
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["emission_record"]),
            models.Index(fields=["timestamp"]),
            models.Index(fields=["tenant"]),
        ]

    def __str__(self):
        actor_str = self.acted_by.email if self.acted_by else (self.actor or "Unknown")
        return f"{self.action_type} by {actor_str}"