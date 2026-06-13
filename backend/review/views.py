from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.db import transaction

from emissions.models import EmissionRecord
from audit.models import AuditLog
from review.models import ReviewComment
from review.serializers import EmissionRecordSerializer, EmissionRecordDetailSerializer

class ReviewPendingListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        tenant = request.user.tenant
        if not tenant:
            return Response({"error": "User does not belong to any tenant."}, status=status.HTTP_400_BAD_REQUEST)

        queryset = EmissionRecord.objects.filter(
            tenant=tenant, 
            review_status=EmissionRecord.ReviewStatus.PENDING
        ).select_related('facility', 'raw_record', 'raw_record__data_source')

        facility = request.query_params.get('facility')
        if facility:
            queryset = queryset.filter(facility_id=facility)

        scope = request.query_params.get('scope')
        if scope:
            queryset = queryset.filter(scope=scope)

        source = request.query_params.get('source')
        if source:
            queryset = queryset.filter(raw_record__data_source__source_type=source)

        batch = request.query_params.get('batch') or request.query_params.get('upload_batch')
        if batch:
            queryset = queryset.filter(raw_record__data_source_id=batch)

        serializer = EmissionRecordSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ReviewAnomalyListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        tenant = request.user.tenant
        if not tenant:
            return Response({"error": "User does not belong to any tenant."}, status=status.HTTP_400_BAD_REQUEST)

        queryset = EmissionRecord.objects.filter(
            tenant=tenant, 
            anomaly_flag=True
        ).select_related('facility', 'raw_record', 'raw_record__data_source')

        serializer = EmissionRecordSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ReviewDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk, *args, **kwargs):
        tenant = request.user.tenant
        if not tenant:
            return Response({"error": "User does not belong to any tenant."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            record = EmissionRecord.objects.get(pk=pk, tenant=tenant)
        except EmissionRecord.DoesNotExist:
            return Response({"error": "Emission record not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = EmissionRecordDetailSerializer(record)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ReviewApproveView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk, *args, **kwargs):
        tenant = request.user.tenant
        if not tenant:
            return Response({"error": "User does not belong to any tenant."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            record = EmissionRecord.objects.get(pk=pk, tenant=tenant)
        except EmissionRecord.DoesNotExist:
            return Response({"error": "Emission record not found."}, status=status.HTTP_404_NOT_FOUND)

        old_status = record.review_status

        with transaction.atomic():
            record.review_status = EmissionRecord.ReviewStatus.APPROVED
            record.save()

            AuditLog.objects.create(
                emission_record=record,
                acted_by=request.user,
                tenant=tenant,
                action_type=AuditLog.ActionType.APPROVED,
                action=AuditLog.ActionType.APPROVED,
                actor=request.user.email,
                old_value={"review_status": old_status},
                new_value={"review_status": record.review_status}
            )

        serializer = EmissionRecordDetailSerializer(record)
        return Response({
            "message": "Record approved successfully",
            "record": serializer.data
        }, status=status.HTTP_200_OK)


class ReviewRejectView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk, *args, **kwargs):
        tenant = request.user.tenant
        if not tenant:
            return Response({"error": "User does not belong to any tenant."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            record = EmissionRecord.objects.get(pk=pk, tenant=tenant)
        except EmissionRecord.DoesNotExist:
            return Response({"error": "Emission record not found."}, status=status.HTTP_404_NOT_FOUND)

        reason = request.data.get("reason", "").strip()
        if not reason:
            return Response({"error": "Reason is required to reject a record."}, status=status.HTTP_400_BAD_REQUEST)

        old_status = record.review_status

        with transaction.atomic():
            record.review_status = EmissionRecord.ReviewStatus.REJECTED
            record.save()

            ReviewComment.objects.create(
                emission_record=record,
                reviewer=request.user.email,
                comment=reason
            )

            AuditLog.objects.create(
                emission_record=record,
                acted_by=request.user,
                tenant=tenant,
                action_type=AuditLog.ActionType.REJECTED,
                action=AuditLog.ActionType.REJECTED,
                actor=request.user.email,
                old_value={"review_status": old_status},
                new_value={"review_status": record.review_status, "rejection_reason": reason}
            )

        serializer = EmissionRecordDetailSerializer(record)
        return Response({
            "message": "Record rejected successfully",
            "record": serializer.data
        }, status=status.HTTP_200_OK)


class ReviewEditView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk, *args, **kwargs):
        tenant = request.user.tenant
        if not tenant:
            return Response({"error": "User does not belong to any tenant."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            record = EmissionRecord.objects.get(pk=pk, tenant=tenant)
        except EmissionRecord.DoesNotExist:
            return Response({"error": "Emission record not found."}, status=status.HTTP_404_NOT_FOUND)

        # Capture old values
        old_values = {
            "quantity": str(record.quantity),
            "normalized_unit": record.normalized_unit,
            "activity_date": str(record.activity_date) if record.activity_date else None,
        }

        quantity = request.data.get("quantity")
        unit = request.data.get("unit") or request.data.get("normalized_unit")
        activity_date = request.data.get("activity_date")

        new_values = {}
        if quantity is not None:
            record.quantity = quantity
            new_values["quantity"] = str(quantity)
        if unit is not None:
            record.normalized_unit = unit
            new_values["normalized_unit"] = unit
        if activity_date is not None:
            record.activity_date = activity_date
            new_values["activity_date"] = activity_date

        if new_values:
            with transaction.atomic():
                record.save()

                AuditLog.objects.create(
                    emission_record=record,
                    acted_by=request.user,
                    tenant=tenant,
                    action_type=AuditLog.ActionType.UPDATED,
                    action=AuditLog.ActionType.UPDATED,
                    actor=request.user.email,
                    old_value=old_values,
                    new_value=new_values
                )

        serializer = EmissionRecordDetailSerializer(record)
        return Response({
            "message": "Record updated successfully",
            "record": serializer.data
        }, status=status.HTTP_200_OK)
