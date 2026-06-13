from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.db import models

from audit.models import AuditLog
from audit.serializers import AuditLogSerializer

class AuditLogListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        tenant = request.user.tenant
        if not tenant:
            return Response({"error": "User does not belong to any tenant."}, status=status.HTTP_400_BAD_REQUEST)

        queryset = AuditLog.objects.filter(tenant=tenant).select_related('acted_by', 'tenant', 'emission_record')

        # Filters
        action_type = request.query_params.get('action_type') or request.query_params.get('action')
        if action_type:
            queryset = queryset.filter(action_type=action_type.upper())

        user_param = request.query_params.get('user') or request.query_params.get('actor')
        if user_param:
            queryset = queryset.filter(
                models.Q(acted_by__email__icontains=user_param) | 
                models.Q(actor__icontains=user_param)
            )

        start_date = request.query_params.get('start_date')
        if start_date:
            queryset = queryset.filter(timestamp__date__gte=start_date)

        end_date = request.query_params.get('end_date')
        if end_date:
            queryset = queryset.filter(timestamp__date__lte=end_date)

        serializer = AuditLogSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AuditLogDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk, *args, **kwargs):
        tenant = request.user.tenant
        if not tenant:
            return Response({"error": "User does not belong to any tenant."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            log = AuditLog.objects.get(pk=pk, tenant=tenant)
        except AuditLog.DoesNotExist:
            return Response({"error": "Audit log entry not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = AuditLogSerializer(log)
        return Response(serializer.data, status=status.HTTP_200_OK)
