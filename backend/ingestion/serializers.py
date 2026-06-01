from rest_framework import serializers
from ingestion.models import DataSource, RawRecord
from emissions.models import EmissionRecord

class DataSourceSerializer(serializers.ModelSerializer):
    file_name = serializers.SerializerMethodField()
    upload_date = serializers.DateTimeField(source='uploaded_at', read_only=True)
    processing_status = serializers.CharField(source='status', read_only=True)
    facility = serializers.SerializerMethodField()
    processing_summary = serializers.SerializerMethodField()
    file_size = serializers.SerializerMethodField()

    class Meta:
        model = DataSource
        fields = [
            'id', 
            'file_name', 
            'source_type', 
            'facility', 
            'uploaded_by', 
            'upload_date', 
            'processing_status',
            'file_url',
            'processing_summary',
            'file_size'
        ]
        read_only_fields = ['id', 'uploaded_by', 'upload_date', 'processing_status']

    def get_file_name(self, obj):
        if obj.file_url:
            return obj.file_url.split('/')[-1]
        return "unknown"

    def get_file_size(self, obj):
        """Return stored size or lazily fetch from Supabase bucket metadata and persist it."""
        if obj.file_size is not None:
            return obj.file_size
        if not obj.file_url:
            return None
        try:
            from ingestion.storage import SupabaseStorage
            storage = SupabaseStorage()
            # Derive the object path from the full URL:
            # file_url looks like: https://<project>.supabase.co/storage/v1/object/uploads/uploads/file.csv
            # The path within the bucket is the portion after "/object/<bucket_name>/"
            bucket_prefix = f"/object/{storage.bucket_name}/"
            if bucket_prefix in obj.file_url:
                object_path = obj.file_url.split(bucket_prefix, 1)[1]
            else:
                return None
            size = storage.get_file_size(object_path)
            if size is not None:
                obj.file_size = size
                obj.save(update_fields=['file_size'])
            return size
        except Exception:
            return None

    def get_facility(self, obj):
        if obj.facility:
            return {
                "id": str(obj.facility.id),
                "name": obj.facility.name
            }
        return None

    def get_processing_summary(self, obj):
        raw_records = obj.raw_records.all()
        total_rows = raw_records.count()
        successful_rows = raw_records.filter(parse_status=RawRecord.ParseStatus.SUCCESS).count()
        failed_rows = raw_records.filter(parse_status=RawRecord.ParseStatus.FAILED).count()
        anomaly_rows = EmissionRecord.objects.filter(
            raw_record__data_source=obj,
            anomaly_flag=True
        ).count()

        duration = "1.2s"
        if obj.processing_time is not None:
            # Avoid displaying 0.0s by clamping it to minimum of 0.1s
            seconds = max(0.1, obj.processing_time)
            duration = f"{seconds:.1f}s"

        return {
            "total_rows": total_rows,
            "row_count": total_rows,
            "successful_rows": successful_rows,
            "successful_records": successful_rows,
            "failed_rows": failed_rows,
            "anomaly_rows": anomaly_rows,
            "anomalies": anomaly_rows,
            "processing_duration": duration
        }

