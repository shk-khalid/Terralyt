from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from tenants.models import Tenant, Facility
from ingestion.models import DataSource, RawRecord
from emissions.models import EmissionRecord
from audit.models import AuditLog
from review.models import ReviewComment

User = get_user_model()

class ReviewModuleAPITests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.tenant_a = Tenant.objects.create(company_name="Tenant A")
        self.tenant_b = Tenant.objects.create(company_name="Tenant B")

        self.user_a = User.objects.create_user(
            email="user_a@tenant.com",
            password="password",
            full_name="User A",
            role=User.Role.REVIEWER,
            tenant=self.tenant_a
        )
        self.user_b = User.objects.create_user(
            email="user_b@tenant.com",
            password="password",
            full_name="User B",
            role=User.Role.REVIEWER,
            tenant=self.tenant_b
        )

        self.facility_a1 = Facility.objects.create(
            tenant=self.tenant_a,
            name="Facility A1",
            facility_type="Factory",
            location="Berlin"
        )
        self.facility_a2 = Facility.objects.create(
            tenant=self.tenant_a,
            name="Facility A2",
            facility_type="Office",
            location="Munich"
        )

        self.ds_a1 = DataSource.objects.create(
            tenant=self.tenant_a,
            facility=self.facility_a1,
            source_type="SAP",
            ingestion_method=DataSource.IngestionMethod.CSV_Upload,
            file_url="http://example.com/sap_a1.csv",
            status=DataSource.Status.COMPLETED
        )

        # Create Raw and Emission records for Tenant A
        self.raw_a1 = RawRecord.objects.create(
            data_source=self.ds_a1,
            row_number=1,
            raw_payload={"fuel_consumption": "500.0", "unit": "liters"}
        )
        self.emission_a1 = EmissionRecord.objects.create(
            tenant=self.tenant_a,
            facility=self.facility_a1,
            raw_record=self.raw_a1,
            scope=EmissionRecord.Scope.SCOPE_1,
            activity_type=EmissionRecord.ActivityType.FUEL,
            activity_date="2026-05-01",
            quantity=500.0,
            normalized_unit="liters",
            anomaly_flag=False,
            review_status=EmissionRecord.ReviewStatus.PENDING
        )

        # Anomalous record
        self.raw_a2 = RawRecord.objects.create(
            data_source=self.ds_a1,
            row_number=2,
            raw_payload={"fuel_consumption": "invalid", "unit": "kWh"}
        )
        self.emission_a2 = EmissionRecord.objects.create(
            tenant=self.tenant_a,
            facility=self.facility_a2,
            raw_record=self.raw_a2,
            scope=EmissionRecord.Scope.SCOPE_2,
            activity_type=EmissionRecord.ActivityType.ELECTRICITY,
            activity_date="2026-05-02",
            quantity=0.0,
            normalized_unit="kWh",
            anomaly_flag=True,
            anomaly_reason="Invalid quantity",
            review_status=EmissionRecord.ReviewStatus.PENDING
        )

        self.pending_url = reverse('review-pending')
        self.anomalies_url = reverse('review-anomalies')
        self.detail_url = lambda pk: reverse('review-detail', kwargs={'pk': pk})
        self.approve_url = lambda pk: reverse('review-approve', kwargs={'pk': pk})
        self.reject_url = lambda pk: reverse('review-reject', kwargs={'pk': pk})
        self.edit_url = lambda pk: reverse('review-edit', kwargs={'pk': pk})

    def test_get_pending_records_scoping_and_filters(self):
        self.client.force_authenticate(user=self.user_a)
        
        # 1. Unfiltered request -> returns both pending records
        response = self.client.get(self.pending_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()), 2)

        # 2. Filter by facility A1
        response = self.client.get(self.pending_url, {"facility": str(self.facility_a1.id)})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()), 1)
        self.assertEqual(response.json()[0]["id"], str(self.emission_a1.id))

        # 3. Filter by scope
        response = self.client.get(self.pending_url, {"scope": "SCOPE_2"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()), 1)
        self.assertEqual(response.json()[0]["id"], str(self.emission_a2.id))

    def test_get_anomalies_only(self):
        self.client.force_authenticate(user=self.user_a)
        response = self.client.get(self.anomalies_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["id"], str(self.emission_a2.id))
        self.assertTrue(data[0]["anomaly_flag"])

    def test_get_record_detail_and_raw_payload(self):
        self.client.force_authenticate(user=self.user_a)
        response = self.client.get(self.detail_url(self.emission_a1.id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.json()
        self.assertEqual(data["id"], str(self.emission_a1.id))
        self.assertEqual(data["raw_payload"], self.raw_a1.raw_payload)
        self.assertIn("audit_history", data)

    def test_approve_record(self):
        self.client.force_authenticate(user=self.user_a)
        response = self.client.post(self.approve_url(self.emission_a1.id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.emission_a1.refresh_from_db()
        self.assertEqual(self.emission_a1.review_status, EmissionRecord.ReviewStatus.APPROVED)

        # Check Audit Log creation
        log = AuditLog.objects.filter(emission_record=self.emission_a1, action_type=AuditLog.ActionType.APPROVED).first()
        self.assertIsNotNone(log)
        self.assertEqual(log.acted_by, self.user_a)
        self.assertEqual(log.old_value, {"review_status": "PENDING"})
        self.assertEqual(log.new_value, {"review_status": "APPROVED"})

    def test_reject_record(self):
        self.client.force_authenticate(user=self.user_a)
        payload = {"reason": "Missing documents"}
        response = self.client.post(self.reject_url(self.emission_a1.id), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.emission_a1.refresh_from_db()
        self.assertEqual(self.emission_a1.review_status, EmissionRecord.ReviewStatus.REJECTED)

        # Verify comment created
        comment = ReviewComment.objects.filter(emission_record=self.emission_a1).first()
        self.assertIsNotNone(comment)
        self.assertEqual(comment.comment, "Missing documents")
        self.assertEqual(comment.reviewer, self.user_a.email)

        # Verify AuditLog created
        log = AuditLog.objects.filter(emission_record=self.emission_a1, action_type=AuditLog.ActionType.REJECTED).first()
        self.assertIsNotNone(log)
        self.assertEqual(log.new_value, {"review_status": "REJECTED", "rejection_reason": "Missing documents"})

    def test_edit_record_traces_changes(self):
        self.client.force_authenticate(user=self.user_a)
        payload = {"quantity": 600.0, "unit": "kg"}
        response = self.client.patch(self.edit_url(self.emission_a1.id), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.emission_a1.refresh_from_db()
        self.assertEqual(self.emission_a1.quantity, 600.0)
        self.assertEqual(self.emission_a1.normalized_unit, "kg")

        # Verify Audit Log captures old and new values
        log = AuditLog.objects.filter(emission_record=self.emission_a1, action_type=AuditLog.ActionType.UPDATED).first()
        self.assertIsNotNone(log)
        self.assertEqual(log.old_value["quantity"], "500.000")
        self.assertEqual(log.old_value["normalized_unit"], "liters")
        self.assertEqual(log.new_value["quantity"], "600.0")
        self.assertEqual(log.new_value["normalized_unit"], "kg")

    def test_tenant_isolation(self):
        # User B (Tenant B) attempts to approve Tenant A's record
        self.client.force_authenticate(user=self.user_b)
        
        response = self.client.post(self.approve_url(self.emission_a1.id))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        response = self.client.post(self.reject_url(self.emission_a1.id), {"reason": "bad"}, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        response = self.client.patch(self.edit_url(self.emission_a1.id), {"quantity": 100})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        response = self.client.get(self.detail_url(self.emission_a1.id))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
