from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.db.models import Sum, Count, Avg
from django.db.models.functions import TruncMonth

from ingestion.models import DataSource
from emissions.models import EmissionRecord

class DashboardSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        tenant = request.user.tenant
        if not tenant:
            return Response({"error": "User does not belong to any tenant."}, status=status.HTTP_400_BAD_REQUEST)

        total_uploads = DataSource.objects.filter(tenant=tenant).count()
        records = EmissionRecord.objects.filter(tenant=tenant)
        total_records = records.count()
        approved_records = records.filter(review_status=EmissionRecord.ReviewStatus.APPROVED).count()
        pending_reviews = records.filter(review_status=EmissionRecord.ReviewStatus.PENDING).count()
        rejected_records = records.filter(review_status=EmissionRecord.ReviewStatus.REJECTED).count()
        anomalies = records.filter(anomaly_flag=True).count()

        completed_uploads = DataSource.objects.filter(tenant=tenant, status=DataSource.Status.COMPLETED).exclude(processing_time=None)
        avg_processing_time = completed_uploads.aggregate(avg_time=Avg('processing_time'))['avg_time'] or 0.0

        return Response({
            "Total Uploads": total_uploads,
            "total_uploads": total_uploads,
            "Total Records": total_records,
            "total_records": total_records,
            "Approved Records": approved_records,
            "approved_records": approved_records,
            "Pending Reviews": pending_reviews,
            "pending_reviews": pending_reviews,
            "Rejected Records": rejected_records,
            "rejected_records": rejected_records,
            "Anomalies": anomalies,
            "anomalies": anomalies,
            "avg_processing_time": round(avg_processing_time, 2)
        }, status=status.HTTP_200_OK)


class DashboardScopesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        tenant = request.user.tenant
        if not tenant:
            return Response({"error": "User does not belong to any tenant."}, status=status.HTTP_400_BAD_REQUEST)

        records = EmissionRecord.objects.filter(tenant=tenant)
        scope_data = records.values('scope').annotate(total=Sum('emission_value'))

        totals = {
            "SCOPE_1": 0.0,
            "SCOPE_2": 0.0,
            "SCOPE_3": 0.0
        }
        for item in scope_data:
            scope_key = item['scope']
            if scope_key in totals:
                totals[scope_key] = float(item['total'] or 0.0)

        return Response({
            "Scope 1 totals": totals["SCOPE_1"],
            "Scope 2 totals": totals["SCOPE_2"],
            "Scope 3 totals": totals["SCOPE_3"],
            "scope_1_totals": totals["SCOPE_1"],
            "scope_2_totals": totals["SCOPE_2"],
            "scope_3_totals": totals["SCOPE_3"],
            "Scope 1": totals["SCOPE_1"],
            "Scope 2": totals["SCOPE_2"],
            "Scope 3": totals["SCOPE_3"],
            "scope_1": totals["SCOPE_1"],
            "scope_2": totals["SCOPE_2"],
            "scope_3": totals["SCOPE_3"]
        }, status=status.HTTP_200_OK)


class DashboardFacilitiesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        tenant = request.user.tenant
        if not tenant:
            return Response({"error": "User does not belong to any tenant."}, status=status.HTTP_400_BAD_REQUEST)

        records = EmissionRecord.objects.filter(tenant=tenant).exclude(facility=None)
        facility_data = records.values('facility__name').annotate(total=Sum('emission_value'))

        result = {}
        for item in facility_data:
            name = item['facility__name']
            if name:
                result[name] = float(item['total'] or 0.0)

        return Response(result, status=status.HTTP_200_OK)


class DashboardTrendsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        tenant = request.user.tenant
        if not tenant:
            return Response({"error": "User does not belong to any tenant."}, status=status.HTTP_400_BAD_REQUEST)

        # Truncate month to aggregate time-series data
        emissions_by_month = (
            EmissionRecord.objects.filter(tenant=tenant)
            .annotate(month=TruncMonth('activity_date'))
            .values('month')
            .annotate(total=Sum('emission_value'))
            .order_by('month')
        )

        uploads_by_month = (
            DataSource.objects.filter(tenant=tenant)
            .annotate(month=TruncMonth('uploaded_at'))
            .values('month')
            .annotate(count=Count('id'))
            .order_by('month')
        )

        anomalies_by_month = (
            EmissionRecord.objects.filter(tenant=tenant, anomaly_flag=True)
            .annotate(month=TruncMonth('activity_date'))
            .values('month')
            .annotate(count=Count('id'))
            .order_by('month')
        )

        monthly_emissions = []
        for item in emissions_by_month:
            if item['month']:
                month_str = item['month'].strftime("%Y-%m")
                monthly_emissions.append({
                    "month": month_str,
                    "emissions": float(item['total'] or 0.0)
                })

        uploads_per_month = []
        for item in uploads_by_month:
            if item['month']:
                month_str = item['month'].strftime("%Y-%m")
                uploads_per_month.append({
                    "month": month_str,
                    "uploads": item['count']
                })

        anomaly_trends = []
        for item in anomalies_by_month:
            if item['month']:
                month_str = item['month'].strftime("%Y-%m")
                anomaly_trends.append({
                    "month": month_str,
                    "anomalies": item['count']
                })

        return Response({
            "monthly_emissions": monthly_emissions,
            "uploads_per_month": uploads_per_month,
            "anomaly_trends": anomaly_trends
        }, status=status.HTTP_200_OK)
