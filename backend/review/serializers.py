from rest_framework import serializers
from emissions.models import EmissionRecord
from audit.models import AuditLog
from review.models import ReviewComment

class ReviewCommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReviewComment
        fields = ['id', 'reviewer', 'comment', 'created_at']

class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = ['id', 'action_type', 'actor', 'old_value', 'new_value', 'timestamp']

class EmissionRecordSerializer(serializers.ModelSerializer):
    raw_payload = serializers.JSONField(source='raw_record.raw_payload', read_only=True)
    facility_name = serializers.CharField(source='facility.name', read_only=True)
    upload_batch_id = serializers.UUIDField(source='raw_record.data_source_id', read_only=True)
    source_type = serializers.CharField(source='raw_record.data_source.source_type', read_only=True)

    class Meta:
        model = EmissionRecord
        fields = [
            'id',
            'facility',
            'facility_name',
            'scope',
            'activity_type',
            'activity_date',
            'quantity',
            'normalized_unit',
            'anomaly_flag',
            'anomaly_reason',
            'review_status',
            'raw_payload',
            'upload_batch_id',
            'source_type',
            'created_at',
            'updated_at'
        ]

class EmissionRecordDetailSerializer(EmissionRecordSerializer):
    audit_history = serializers.SerializerMethodField()
    review_comments = ReviewCommentSerializer(many=True, read_only=True)

    class Meta(EmissionRecordSerializer.Meta):
        fields = EmissionRecordSerializer.Meta.fields + ['audit_history', 'review_comments']

    def get_audit_history(self, obj):
        logs = obj.audit_logs.all().order_by('-timestamp')
        return AuditLogSerializer(logs, many=True).data
