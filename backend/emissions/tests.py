from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from tenants.models import Tenant, Facility
from ingestion.models import DataSource, RawRecord
from emissions.models import EmissionRecord

User = get_user_model()

class DashboardModuleAPITests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.tenant_a = Tenant.objects.create(company_name="Tenant A")
        self.tenant_b = Tenant.objects.create(company_name="Tenant B")

        self.user_a = User.objects.create_user(
            email="user_a@tenant.com",
            password="password",
            full_name="User A",
            role=User.Role.ANALYST,
            tenant=self.tenant_a
        )
        self.user_b = User.objects.create_user(
            email="user_b@tenant.com",
            password="password",
            full_name="User B",
            role=User.Role.ANALYST,
            tenant=self.tenant_b
        )

        self.facility_a = Facility.objects.create(
            tenant=self.tenant_a,
            name="Mumbai Plant"
        )
        self.facility_b = Facility.objects.create(
            tenant=self.tenant_b,
            name="Delhi Office"
        )

        # Uploads / DataSources
        self.ds_a1 = DataSource.objects.create(
            tenant=self.tenant_a,
            facility=self.facility_a,
            source_type="SAP",
            ingestion_method=DataSource.IngestionMethod.CSV_Upload,
            file_url="http://example.com/sap_a.csv",
            status=DataSource.Status.COMPLETED
        )

        # Raw records & Emission records
        self.raw_a1 = RawRecord.objects.create(data_source=self.ds_a1, row_number=1, raw_payload={})
        self.emission_a1 = EmissionRecord.objects.create(
            tenant=self.tenant_a,
            facility=self.facility_a,
            raw_record=self.raw_a1,
            scope=EmissionRecord.Scope.SCOPE_1,
            activity_type=EmissionRecord.ActivityType.FUEL,
            activity_date="2026-05-15",
            quantity=12000.0,
            normalized_unit="liters",
            review_status=EmissionRecord.ReviewStatus.APPROVED,
            anomaly_flag=False
        )

        self.raw_a2 = RawRecord.objects.create(data_source=self.ds_a1, row_number=2, raw_payload={})
        self.emission_a2 = EmissionRecord.objects.create(
            tenant=self.tenant_a,
            facility=self.facility_a,
            raw_record=self.raw_a2,
            scope=EmissionRecord.Scope.SCOPE_2,
            activity_type=EmissionRecord.ActivityType.ELECTRICITY,
            activity_date="2026-05-20",
            quantity=5000.0,
            normalized_unit="kWh",
            review_status=EmissionRecord.ReviewStatus.PENDING,
            anomaly_flag=True,
            anomaly_reason="High consumption"
        )

        self.summary_url = reverse('dashboard-summary')
        self.scopes_url = reverse('dashboard-scopes')
        self.facilities_url = reverse('dashboard-facilities')
        self.trends_url = reverse('dashboard-trends')

    def test_dashboard_summary(self):
        self.client.force_authenticate(user=self.user_a)
        response = self.client.get(self.summary_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()
        self.assertEqual(data["total_uploads"], 1)
        self.assertEqual(data["total_records"], 2)
        self.assertEqual(data["approved_records"], 1)
        self.assertEqual(data["pending_reviews"], 1)
        self.assertEqual(data["rejected_records"], 0)
        self.assertEqual(data["anomalies"], 1)

    def test_dashboard_scopes(self):
        self.client.force_authenticate(user=self.user_a)
        response = self.client.get(self.scopes_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()
        self.assertEqual(data["scope_1_totals"], 30.0)
        self.assertEqual(data["scope_2_totals"], 1.925)
        self.assertEqual(data["scope_3_totals"], 0.0)

    def test_dashboard_facilities(self):
        self.client.force_authenticate(user=self.user_a)
        response = self.client.get(self.facilities_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()
        self.assertEqual(data["Mumbai Plant"], 31.925)

    def test_dashboard_trends(self):
        self.client.force_authenticate(user=self.user_a)
        response = self.client.get(self.trends_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()
        self.assertIn("monthly_emissions", data)
        self.assertIn("uploads_per_month", data)
        self.assertIn("anomaly_trends", data)

        self.assertEqual(data["monthly_emissions"][0]["month"], "2026-05")
        self.assertEqual(data["monthly_emissions"][0]["emissions"], 31.925)

    def test_tenant_isolation(self):
        # User B has no records
        self.client.force_authenticate(user=self.user_b)

        response = self.client.get(self.summary_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["total_records"], 0)

        response = self.client.get(self.scopes_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["scope_1_totals"], 0.0)
