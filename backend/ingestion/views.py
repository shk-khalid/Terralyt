from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.db import transaction
from tenants.permissions import IsAdminRole, IsAnalystRole
from audit.models import AuditLog
from decimal import Decimal, InvalidOperation
import logging

from tenants.models import Tenant
from ingestion.models import DataSource, RawRecord
from emissions.models import EmissionRecord

from services.file_fetcher import fetch_and_parse_csv
from services.parsers.sap_parser import SAPParser
from services.parsers.utility_parser import UtilityParser
from services.parsers.travel_parser import TravelParser
from services.normalizers.unit_normalizer import normalize_unit
from services.normalizers.date_normalizer import normalize_date
from services.normalizers.schema_normalizer import SchemaNormalizer
from services.validators.validation_rules import validate_record, KNOWN_UNITS

logger = logging.getLogger(__name__)


def run_ingestion_pipeline(data_source, file_url, user):
    import time
    start_time = time.time()
    
    # Attempt to capture and store file size
    try:
        if data_source.uploaded_file:
            data_source.file_size = data_source.uploaded_file.size
        elif file_url:
            from services.file_fetcher import download_file
            try:
                content = download_file(file_url)
                data_source.file_size = len(content)
            except Exception:
                pass
        data_source.save(update_fields=['file_size'])
    except Exception:
        pass

    source_type = data_source.source_type
    normalized_source = source_type.strip().upper()
    if normalized_source == "SAP":
        parser = SAPParser()
    elif normalized_source == "UTILITY":
        parser = UtilityParser()
    elif normalized_source == "TRAVEL":
        parser = TravelParser()
    else:
        raise ValueError(f"Unsupported source_type '{source_type}'. Supported types: SAP, UTILITY, TRAVEL")

    try:
        # 1. Fetch & Parse CSV stream
        raw_csv_rows = fetch_and_parse_csv(file_url)

        # 2. Extract fields using resolved parser
        parsed_rows = parser.parse(raw_csv_rows)

        success_count = 0
        failed_count = 0

        import uuid
        raw_records_to_create = []
        emission_records_to_create = []
        row_details = []

        # Process each parsed row in memory
        for idx, parsed_row in enumerate(parsed_rows, start=1):
            raw_payload = parsed_row
            raw_record_id = uuid.uuid4()
            raw_record = RawRecord(
                id=raw_record_id,
                data_source=data_source,
                row_number=idx,
                raw_payload=raw_payload,
                parse_status=RawRecord.ParseStatus.PENDING
            )

            try:
                # Run Schema Normalizer to convert source-specific fields to common internal schema
                common_record = SchemaNormalizer.normalize(parsed_row, source_type)

                raw_qty = common_record.get("quantity")
                raw_unit = common_record.get("normalized_unit")
                raw_date = common_record.get("activity_date")

                # Normalize unit
                norm_unit = normalize_unit(raw_unit)

                # Normalize date
                norm_date = normalize_date(raw_date)

                # Parse quantity into Decimal
                norm_qty = None
                if raw_qty:
                    try:
                        norm_qty = Decimal(str(raw_qty))
                    except (ValueError, InvalidOperation):
                        pass

                # Validate against validation rules
                anomaly_flag, anomaly_reason = validate_record(
                    common_record, norm_qty, norm_unit, norm_date
                )

                from datetime import date
                local_reasons = []
                if anomaly_reason:
                    local_reasons.append(anomaly_reason)

                # 1. Fallback for quantity
                if norm_qty is None:
                    norm_qty = Decimal("0.000")
                    anomaly_flag = True
                    if not raw_qty:
                        local_reasons.append("Quantity is missing (defaulted to 0.00)")
                    else:
                        local_reasons.append(f"Invalid quantity '{raw_qty}' (defaulted to 0.00)")

                # 2. Fallback for date
                if norm_date is None:
                    norm_date = date.today()
                    anomaly_flag = True
                    if not raw_date:
                        local_reasons.append("Date is missing (defaulted to today's date)")
                    else:
                        local_reasons.append(f"Invalid date format '{raw_date}' (defaulted to today's date)")

                # 3. Fallback for unit
                if not norm_unit or norm_unit.lower() not in KNOWN_UNITS:
                    norm_unit = "unknown"
                    anomaly_flag = True
                    if not raw_unit:
                        local_reasons.append("Unit is missing (defaulted to unknown)")
                    else:
                        local_reasons.append(f"Invalid or unknown unit '{raw_unit}' (defaulted to unknown)")

                final_anomaly_reason = "; ".join(local_reasons) if local_reasons else None

                # Instantiate EmissionRecord in memory using common schema values
                emission_record = EmissionRecord(
                    id=uuid.uuid4(),
                    tenant=data_source.tenant,
                    facility=data_source.facility,
                    raw_record=raw_record,
                    scope=common_record.get("scope"),
                    activity_type=common_record.get("activity_type"),
                    activity_date=norm_date,
                    quantity=norm_qty,
                    normalized_unit=norm_unit,
                    anomaly_flag=anomaly_flag,
                    anomaly_reason=final_anomaly_reason,
                    review_status=EmissionRecord.ReviewStatus.PENDING
                )
                emission_record.calculate_emissions()
                emission_records_to_create.append(emission_record)

                raw_record.parse_status = RawRecord.ParseStatus.SUCCESS
                raw_record.error_message = None
                success_count += 1

                row_details.append({
                    "row_number": idx,
                    "status": "anomaly" if anomaly_flag else "success",
                    "raw_payload": raw_payload,
                    "anomaly_reason": final_anomaly_reason,
                    "error": None
                })

            except Exception as row_error:
                raw_record.parse_status = RawRecord.ParseStatus.FAILED
                raw_record.error_message = str(row_error)
                failed_count += 1

                row_details.append({
                    "row_number": idx,
                    "status": "failed",
                    "raw_payload": parsed_row,
                    "anomaly_reason": None,
                    "error": str(row_error)
                })

            raw_records_to_create.append(raw_record)

        # Bulk create all records in a single database transaction
        with transaction.atomic():
            RawRecord.objects.bulk_create(raw_records_to_create)
            EmissionRecord.objects.bulk_create(emission_records_to_create)

        # Update DataSource completion state
        data_source.status = DataSource.Status.COMPLETED
        data_source.processing_time = time.time() - start_time
        data_source.save()

        # Create AuditLog entry for UPLOADED action
        file_name = file_url.split('/')[-1] if file_url else "unknown"
        AuditLog.objects.create(
            acted_by=user,
            tenant=user.tenant,
            action_type=AuditLog.ActionType.UPLOADED,
            action=AuditLog.ActionType.UPLOADED,
            actor=user.email,
            new_value={
                "data_source_id": str(data_source.id),
                "file_name": file_name,
                "total_rows": len(parsed_rows),
                "successful_rows": success_count,
                "failed_rows": failed_count
            }
        )

        return {
            "total_rows": len(parsed_rows),
            "successful_rows": success_count,
            "failed_rows": failed_count,
            "row_details": row_details
        }

    except Exception as pipeline_error:
        logger.error(f"Critical Ingestion Pipeline failure: {pipeline_error}")
        data_source.status = DataSource.Status.FAILED
        data_source.processing_time = time.time() - start_time
        data_source.save()
        raise pipeline_error


class IngestionProcessView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAnalystRole | IsAdminRole]

    def post(self, request, *args, **kwargs):
        tenant = request.user.tenant
        if not tenant:
            return Response(
                {"error": "User does not belong to any tenant."},
                status=status.HTTP_400_BAD_REQUEST
            )

        payload_tenant_id = request.data.get("tenant_id")
        if payload_tenant_id and str(payload_tenant_id) != str(tenant.id):
            return Response(
                {"error": "Tenant isolation violation. Cannot ingest data for another tenant."},
                status=status.HTTP_403_FORBIDDEN
            )

        source_type = request.data.get("source_type")
        file_name = request.data.get("file_name")
        file_url = request.data.get("file_url")

        if not all([source_type, file_name, file_url]):
            return Response(
                {"error": "Missing required fields: source_type, file_name, file_url"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create DataSource tracking record
        data_source = DataSource.objects.create(
            tenant=tenant,
            source_type=source_type,
            ingestion_method=DataSource.IngestionMethod.CSV_Upload,
            uploaded_file=None,
            file_url=file_url,
            uploaded_by="system",
            status=DataSource.Status.PROCESSING
        )

        try:
            result = run_ingestion_pipeline(data_source, file_url, request.user)
            return Response({
                "message": "Ingestion processing completed",
                "data_source_id": str(data_source.id),
                "total_rows": result["total_rows"],
                "successful_rows": result["successful_rows"],
                "failed_rows": result["failed_rows"],
                "row_details": result["row_details"]
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": f"Critical ingestion failure: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


from ingestion.serializers import DataSourceSerializer
from tenants.models import Facility

class UploadListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        tenant = request.user.tenant
        if not tenant:
            return Response({"error": "User does not belong to any tenant."}, status=status.HTTP_400_BAD_REQUEST)
        
        uploads = DataSource.objects.filter(tenant=tenant).select_related('facility').prefetch_related('raw_records__emission_record')
        serializer = DataSourceSerializer(uploads, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, *args, **kwargs):
        tenant = request.user.tenant
        if not tenant:
            return Response({"error": "User does not belong to any tenant."}, status=status.HTTP_400_BAD_REQUEST)

        facility_id = request.data.get("facility_id")
        source_type = request.data.get("source_type")
        file = request.FILES.get("file")
        file_url = request.data.get("file_url")

        if not all([facility_id, source_type]) or not (file or file_url):
            return Response(
                {"error": "Missing required fields: facility_id, source_type, and either file or file_url"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            facility = Facility.objects.get(id=facility_id, tenant=tenant, is_deleted=False)
        except Facility.DoesNotExist:
            return Response(
                {"error": f"Facility with id '{facility_id}' not found under this tenant."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create DataSource tracking record
        data_source = DataSource.objects.create(
            tenant=tenant,
            facility=facility,
            source_type=source_type,
            ingestion_method=DataSource.IngestionMethod.CSV_Upload,
            uploaded_file=file if file else None,
            file_url=file_url if not file else None,
            uploaded_by=request.user.email,
            status=DataSource.Status.PROCESSING
        )

        if file:
            try:
                # Retrieve the uploaded file URL (which connects to Supabase)
                data_source.file_url = data_source.uploaded_file.url
                data_source.save(update_fields=['file_url'])
            except Exception as upload_err:
                data_source.status = DataSource.Status.FAILED
                data_source.save()
                return Response(
                    {"error": f"Failed to upload file to Supabase storage: {str(upload_err)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        try:
            result = run_ingestion_pipeline(data_source, data_source.file_url, request.user)
            return Response({
                "upload_id": str(data_source.id),
                "status": "PROCESSING"
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {"error": f"Ingestion pipeline failure: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class UploadDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk, *args, **kwargs):
        tenant = request.user.tenant
        if not tenant:
            return Response({"error": "User does not belong to any tenant."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            data_source = DataSource.objects.get(pk=pk, tenant=tenant)
        except DataSource.DoesNotExist:
            return Response({"error": "Upload record not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = DataSourceSerializer(data_source)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UploadReprocessView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk, *args, **kwargs):
        tenant = request.user.tenant
        if not tenant:
            return Response({"error": "User does not belong to any tenant."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            data_source = DataSource.objects.get(pk=pk, tenant=tenant)
        except DataSource.DoesNotExist:
            return Response({"error": "Upload record not found."}, status=status.HTTP_404_NOT_FOUND)

        file_url = data_source.file_url or request.data.get("file_url")
        if not file_url:
            return Response(
                {"error": "No file_url stored or provided to reprocess."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update status to processing and clear old records
        data_source.status = DataSource.Status.PROCESSING
        data_source.file_url = file_url
        data_source.save()

        with transaction.atomic():
            EmissionRecord.objects.filter(raw_record__data_source=data_source).delete()
            RawRecord.objects.filter(data_source=data_source).delete()

        try:
            result = run_ingestion_pipeline(data_source, file_url, request.user)
            return Response({
                "upload_id": str(data_source.id),
                "status": "PROCESSING"
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": f"Reprocessing failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

