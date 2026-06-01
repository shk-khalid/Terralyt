from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from unittest.mock import patch

from tenants.models import Tenant, Facility
from ingestion.models import DataSource, RawRecord
from emissions.models import EmissionRecord

User = get_user_model()

class UploadManagementAPITests(TestCase):

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
            name="Munich Factory",
            facility_type="factory",
            location="Munich"
        )
        self.facility_b = Facility.objects.create(
            tenant=self.tenant_b,
            name="Berlin Office",
            facility_type="office",
            location="Berlin"
        )

        self.list_create_url = reverse('upload-list-create')
        self.detail_url = lambda pk: reverse('upload-detail', kwargs={'pk': pk})
        self.reprocess_url = lambda pk: reverse('upload-reprocess', kwargs={'pk': pk})

        # Sample rows parsed from CSV
        # SAP parser expects: fuel_type, consumption, unit, date
        self.mock_sap_csv_rows = [
            {"FuelType": "Diesel", "Qty": "150.5", "Unit": "liters", "Date": "2026-05-01"},
            {"FuelType": "Petrol", "Qty": "100.0", "Unit": "liters", "Date": "2026-05-02"},
            {"FuelType": "Natural Gas", "Qty": "invalid_qty", "Unit": "kWh", "Date": "2026-05-03"},  # Anomaly (invalid qty)
        ]

    @patch('ingestion.views.fetch_and_parse_csv')
    def test_create_upload_and_trigger_ingestion(self, mock_fetch):
        mock_fetch.return_value = self.mock_sap_csv_rows

        self.client.force_authenticate(user=self.user_a)
        payload = {
            "facility_id": str(self.facility_a.id),
            "source_type": "SAP",
            "file_url": "http://example.com/sap_data.csv"
        }

        response = self.client.post(self.list_create_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        data = response.json()
        self.assertIn("upload_id", data)
        self.assertEqual(data["status"], "PROCESSING")

        # Check database records
        data_source = DataSource.objects.get(id=data["upload_id"])
        self.assertEqual(data_source.status, "COMPLETED")  # Synced pipeline completes
        self.assertEqual(data_source.facility, self.facility_a)
        self.assertEqual(data_source.uploaded_by, self.user_a.email)

        # Ensure raw records and emission records are created
        self.assertEqual(RawRecord.objects.filter(data_source=data_source).count(), 3)
        # Check anomaly flag on the invalid quantity row (Natural Gas)
        anomalous_record = EmissionRecord.objects.get(
            raw_record__data_source=data_source,
            activity_type="FUEL",
            quantity=0.0  # Fallback quantity
        )
        self.assertTrue(anomalous_record.anomaly_flag)
        self.assertIn("Invalid quantity", anomalous_record.anomaly_reason)

    def test_create_upload_invalid_facility(self):
        self.client.force_authenticate(user=self.user_a)
        
        # Try to post using Facility B which belongs to Tenant B
        payload = {
            "facility_id": str(self.facility_b.id),
            "source_type": "SAP",
            "file_url": "http://example.com/sap_data.csv"
        }
        response = self.client.post(self.list_create_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("not found under this tenant", response.json()["error"])

    @patch('ingestion.views.fetch_and_parse_csv')
    def test_list_uploads(self, mock_fetch):
        mock_fetch.return_value = self.mock_sap_csv_rows

        # Create upload for Tenant A
        ds_a = DataSource.objects.create(
            tenant=self.tenant_a,
            facility=self.facility_a,
            source_type="SAP",
            ingestion_method=DataSource.IngestionMethod.CSV_Upload,
            file_url="http://example.com/sap_a.csv",
            uploaded_by=self.user_a.email,
            status=DataSource.Status.COMPLETED
        )
        # Create upload for Tenant B
        ds_b = DataSource.objects.create(
            tenant=self.tenant_b,
            facility=self.facility_b,
            source_type="SAP",
            ingestion_method=DataSource.IngestionMethod.CSV_Upload,
            file_url="http://example.com/sap_b.csv",
            uploaded_by=self.user_b.email,
            status=DataSource.Status.COMPLETED
        )

        self.client.force_authenticate(user=self.user_a)
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["id"], str(ds_a.id))

    def test_get_upload_details_with_summary(self):
        # Create completed datasource
        ds = DataSource.objects.create(
            tenant=self.tenant_a,
            facility=self.facility_a,
            source_type="SAP",
            ingestion_method=DataSource.IngestionMethod.CSV_Upload,
            file_url="http://example.com/sap_a.csv",
            uploaded_by=self.user_a.email,
            status=DataSource.Status.COMPLETED
        )
        # Add 3 raw records: 2 success, 1 failed
        raw_1 = RawRecord.objects.create(data_source=ds, row_number=1, raw_payload={}, parse_status=RawRecord.ParseStatus.SUCCESS)
        raw_2 = RawRecord.objects.create(data_source=ds, row_number=2, raw_payload={}, parse_status=RawRecord.ParseStatus.SUCCESS)
        raw_3 = RawRecord.objects.create(data_source=ds, row_number=3, raw_payload={}, parse_status=RawRecord.ParseStatus.FAILED)
        
        # Add 1 anomaly emission record
        EmissionRecord.objects.create(
            tenant=self.tenant_a,
            raw_record=raw_1,
            scope=EmissionRecord.Scope.SCOPE_1,
            activity_type="FUEL",
            activity_date="2026-05-01",
            quantity=10.0,
            normalized_unit="liters",
            anomaly_flag=True
        )

        self.client.force_authenticate(user=self.user_a)
        response = self.client.get(self.detail_url(ds.id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.json()
        self.assertEqual(data["id"], str(ds.id))
        self.assertEqual(data["processing_summary"]["total_rows"], 3)
        self.assertEqual(data["processing_summary"]["successful_rows"], 2)
        self.assertEqual(data["processing_summary"]["failed_rows"], 1)
        self.assertEqual(data["processing_summary"]["anomaly_rows"], 1)

    @patch('ingestion.views.fetch_and_parse_csv')
    def test_reprocess_upload(self, mock_fetch):
        # Setup initial upload and records
        ds = DataSource.objects.create(
            tenant=self.tenant_a,
            facility=self.facility_a,
            source_type="SAP",
            ingestion_method=DataSource.IngestionMethod.CSV_Upload,
            file_url="http://example.com/sap_a.csv",
            uploaded_by=self.user_a.email,
            status=DataSource.Status.COMPLETED
        )
        raw_1 = RawRecord.objects.create(data_source=ds, row_number=1, raw_payload={}, parse_status=RawRecord.ParseStatus.SUCCESS)
        EmissionRecord.objects.create(
            tenant=self.tenant_a,
            raw_record=raw_1,
            scope=EmissionRecord.Scope.SCOPE_1,
            activity_type="FUEL",
            activity_date="2026-05-01",
            quantity=10.0,
            normalized_unit="liters"
        )

        # Reprocess with updated mock rows
        mock_fetch.return_value = [
            {"FuelType": "Diesel", "Qty": "200.0", "Unit": "liters", "Date": "2026-05-10"}
        ]

        self.client.force_authenticate(user=self.user_a)
        response = self.client.post(self.reprocess_url(ds.id), format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify records got cleared and replaced
        self.assertEqual(RawRecord.objects.filter(data_source=ds).count(), 1)
        self.assertEqual(EmissionRecord.objects.filter(raw_record__data_source=ds).count(), 1)
        
        new_emission = EmissionRecord.objects.get(raw_record__data_source=ds)
        self.assertEqual(new_emission.quantity, 200.0)

    def test_tenant_isolation(self):
        # Create Tenant A upload
        ds = DataSource.objects.create(
            tenant=self.tenant_a,
            facility=self.facility_a,
            source_type="SAP",
            ingestion_method=DataSource.IngestionMethod.CSV_Upload,
            file_url="http://example.com/sap_a.csv",
            uploaded_by=self.user_a.email,
            status=DataSource.Status.COMPLETED
        )

        # Tenant B user tries to access
        self.client.force_authenticate(user=self.user_b)
        
        # GET Detail -> 404
        response = self.client.get(self.detail_url(ds.id))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # Reprocess -> 404
        response = self.client.post(self.reprocess_url(ds.id))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    @patch('ingestion.views.fetch_and_parse_csv')
    @patch('django.core.files.storage.default_storage._save')
    def test_create_upload_with_file_multipart(self, mock_save, mock_fetch):
        from django.core.files.uploadedfile import SimpleUploadedFile
        mock_fetch.return_value = self.mock_sap_csv_rows
        mock_save.return_value = "uploads/test_upload.csv"

        self.client.force_authenticate(user=self.user_a)
        csv_content = b"FuelType,Qty,Unit,Date\nDiesel,150.5,liters,2026-05-01\n"
        uploaded_file = SimpleUploadedFile("test_upload.csv", csv_content, content_type="text/csv")

        payload = {
            "facility_id": str(self.facility_a.id),
            "source_type": "SAP",
            "file": uploaded_file
        }

        response = self.client.post(self.list_create_url, payload, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        data = response.json()
        self.assertIn("upload_id", data)
        self.assertEqual(data["status"], "PROCESSING")

        data_source = DataSource.objects.get(id=data["upload_id"])
        self.assertTrue(data_source.uploaded_file.name.endswith("test_upload.csv"))
        self.assertIn("storage/v1/object/uploads", data_source.file_url)
