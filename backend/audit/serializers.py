from rest_framework import serializers
from audit.models import AuditLog

class AuditLogSerializer(serializers.ModelSerializer):
    actor = serializers.SerializerMethodField()
    tenant_name = serializers.CharField(source='tenant.company_name', read_only=True)
    object_affected = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = [
            'id',
            'acted_by',
            'actor',
            'tenant',
            'tenant_name',
            'action_type',
            'action',
            'old_value',
            'new_value',
            'timestamp',
            'object_affected'
        ]
        read_only_fields = ['id', 'acted_by', 'actor', 'tenant', 'tenant_name', 'action_type', 'action', 'old_value', 'new_value', 'timestamp', 'object_affected']

    def get_actor(self, obj):
        if obj.acted_by:
            return obj.acted_by.email
        return obj.actor or "system"

    def get_object_affected(self, obj):
        if obj.emission_record:
            return {
                "type": "EmissionRecord",
                "id": str(obj.emission_record.id),
                "scope": obj.emission_record.scope,
                "activity_type": obj.emission_record.activity_type
            }
        elif obj.new_value and "data_source_id" in obj.new_value:
            return {
                "type": "DataSource",
                "id": obj.new_value["data_source_id"],
                "file_name": obj.new_value.get("file_name", "unknown")
            }
        return None
