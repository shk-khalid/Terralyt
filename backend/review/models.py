from django.db import models
from emissions.models import EmissionRecord
import uuid

class ReviewComment(models.Model):

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    emission_record = models.ForeignKey(
        EmissionRecord,
        on_delete=models.CASCADE,
        related_name="review_comments"
    )

    reviewer = models.CharField(max_length=255)

    comment = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "review_comments"

    def __str__(self):
        return f"Review by {self.reviewer}"