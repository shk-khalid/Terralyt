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
        """Return the stored file size directly to avoid blocking network calls in list views."""
        return obj.file_size

    def get_facility(self, obj):
        if obj.facility:
            return {
                "id": str(obj.facility.id),
                "name": obj.facility.name
            }
        return None

    def get_processing_summary(self, obj):
        # Calculate summary in memory using prefetched raw_records to prevent N+1 query loops
        raw_records = list(obj.raw_records.all())
        total_rows = len(raw_records)
        successful_rows = 0
        failed_rows = 0
        anomaly_rows = 0

        for r in raw_records:
            if r.parse_status == RawRecord.ParseStatus.SUCCESS:
                successful_rows += 1
            elif r.parse_status == RawRecord.ParseStatus.FAILED:
                failed_rows += 1
            
            # Safely check if a related emission_record exists and is flagged as an anomaly
            try:
                em_rec = getattr(r, 'emission_record', None)
                if em_rec and em_rec.anomaly_flag:
                    anomaly_rows += 1
            except Exception:
                pass

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

