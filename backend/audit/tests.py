from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from datetime import date, timedelta

from tenants.models import Tenant, Facility
from ingestion.models import DataSource, RawRecord
from emissions.models import EmissionRecord
from audit.models import AuditLog

User = get_user_model()

class AuditLogModuleAPITests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.tenant_a = Tenant.objects.create(company_name="Tenant A")
        self.tenant_b = Tenant.objects.create(company_name="Tenant B")

        self.user_a = User.objects.create_user(
            email="user_a@tenant.com",
            password="password",
            full_name="User A",
            role=User.Role.ADMIN,
            tenant=self.tenant_a
        )
        self.user_b = User.objects.create_user(
            email="user_b@tenant.com",
            password="password",
            full_name="User B",
            role=User.Role.ADMIN,
            tenant=self.tenant_b
        )

        self.facility_a = Facility.objects.create(
            tenant=self.tenant_a,
            name="Facility A"
        )

        self.ds_a = DataSource.objects.create(
            tenant=self.tenant_a,
            facility=self.facility_a,
            source_type="SAP",
            ingestion_method=DataSource.IngestionMethod.CSV_Upload,
            file_url="http://example.com/sap_a.csv",
            status=DataSource.Status.COMPLETED
        )
        self.raw_a = RawRecord.objects.create(data_source=self.ds_a, row_number=1, raw_payload={})
        self.emission_a = EmissionRecord.objects.create(
            tenant=self.tenant_a,
            facility=self.facility_a,
            raw_record=self.raw_a,
            scope=EmissionRecord.Scope.SCOPE_1,
            activity_type=EmissionRecord.ActivityType.FUEL,
            activity_date="2026-05-15",
            quantity=100.0,
            normalized_unit="liters",
            review_status=EmissionRecord.ReviewStatus.PENDING
        )

        # Create audit logs
        self.log_1 = AuditLog.objects.create(
            tenant=self.tenant_a,
            emission_record=self.emission_a,
            acted_by=self.user_a,
            action_type=AuditLog.ActionType.CREATED,
            action=AuditLog.ActionType.CREATED,
            actor=self.user_a.email,
            new_value={"quantity": 100.0}
        )

        self.log_2 = AuditLog.objects.create(
            tenant=self.tenant_a,
            emission_record=self.emission_a,
            acted_by=self.user_a,
            action_type=AuditLog.ActionType.APPROVED,
            action=AuditLog.ActionType.APPROVED,
            actor=self.user_a.email,
            old_value={"status": "PENDING"},
            new_value={"status": "APPROVED"}
        )

        # Audit log for Tenant B
        self.log_b = AuditLog.objects.create(
            tenant=self.tenant_b,
            action_type=AuditLog.ActionType.UPLOADED,
            action=AuditLog.ActionType.UPLOADED,
            actor=self.user_b.email
        )

        self.list_url = reverse('audit-log-list')
        self.detail_url = lambda pk: reverse('audit-log-detail', kwargs={'pk': pk})

    def test_list_audit_logs_scoping_and_filtering(self):
        self.client.force_authenticate(user=self.user_a)
        
        # 1. List logs -> returns only Tenant A logs
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data), 2)
        
        actions = [log["action_type"] for log in data]
        self.assertIn("CREATED", actions)
        self.assertIn("APPROVED", actions)
        self.assertNotIn("UPLOADED", actions)

        # 2. Filter by action type
        response = self.client.get(self.list_url, {"action": "APPROVED"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()), 1)
        self.assertEqual(response.json()[0]["id"], str(self.log_2.id))

        # 3. Filter by user/actor email
        response = self.client.get(self.list_url, {"user": "user_a"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()), 2)

        # 4. Filter by date range (includes today)
        today_str = date.today().strftime("%Y-%m-%d")
        tomorrow_str = (date.today() + timedelta(days=1)).strftime("%Y-%m-%d")
        response = self.client.get(self.list_url, {"start_date": today_str, "end_date": tomorrow_str})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()), 2)

    def test_get_audit_log_details(self):
        self.client.force_authenticate(user=self.user_a)
        response = self.client.get(self.detail_url(self.log_1.id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()
        self.assertEqual(data["id"], str(self.log_1.id))
        self.assertEqual(data["actor"], self.user_a.email)
        self.assertEqual(data["tenant_name"], "Tenant A")
        self.assertEqual(data["object_affected"]["type"], "EmissionRecord")
        self.assertEqual(data["object_affected"]["id"], str(self.emission_a.id))

    def test_tenant_isolation(self):
        self.client.force_authenticate(user=self.user_b)
        
        # Try to retrieve Tenant A's log details
        response = self.client.get(self.detail_url(self.log_1.id))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
