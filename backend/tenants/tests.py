from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from tenants.models import Tenant, Facility
from audit.models import AuditLog

User = get_user_model()

class AuthenticationAndRBACTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.register_url = reverse('register-tenant')
        self.login_url = reverse('login')
        self.me_url = reverse('current-user')
        self.create_user_url = reverse('create-user')
        self.ingest_url = reverse('ingestion_process')

    def test_tenant_registration_flow(self):
        # 1. Register a new tenant and its admin
        payload = {
            "company_name": "Acme Corp",
            "industry": "Technology",
            "admin_name": "Alice Admin",
            "admin_email": "alice@acme.com",
            "password": "securepassword123"
        }
        response = self.client.post(self.register_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        data = response.json()
        self.assertEqual(data['user']['email'], "alice@acme.com")
        self.assertEqual(data['user']['role'], "ADMIN")
        self.assertEqual(data['user']['tenant']['company_name'], "Acme Corp")

        # 2. Check Database existence
        tenant = Tenant.objects.get(company_name="Acme Corp")
        self.assertEqual(tenant.industry, "Technology")
        self.assertTrue(tenant.is_active)

        user = User.objects.get(email="alice@acme.com")
        self.assertEqual(user.full_name, "Alice Admin")
        self.assertEqual(user.role, User.Role.ADMIN)
        self.assertEqual(user.tenant, tenant)

    def test_duplicate_registration_validation(self):
        # Create an initial tenant
        Tenant.objects.create(company_name="Acme Corp")
        User.objects.create_user(
            email="alice@acme.com",
            password="password",
            full_name="Alice Admin",
            role=User.Role.ADMIN
        )

        # Try to register with same company name
        payload = {
            "company_name": "Acme Corp",
            "industry": "Services",
            "admin_name": "Bob",
            "admin_email": "bob@acme.com",
            "password": "securepassword"
        }
        response = self.client.post(self.register_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('company_name', response.json())

        # Try to register with same admin email
        payload = {
            "company_name": "New Corp",
            "industry": "Services",
            "admin_name": "Bob",
            "admin_email": "alice@acme.com",
            "password": "securepassword"
        }
        response = self.client.post(self.register_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('admin_email', response.json())

    def test_login_flow(self):
        # Create user
        tenant = Tenant.objects.create(company_name="Acme Corp")
        user = User.objects.create_user(
            email="alice@acme.com",
            password="mypassword",
            full_name="Alice Admin",
            role=User.Role.ADMIN,
            tenant=tenant
        )

        # Login with correct credentials
        payload = {"email": "alice@acme.com", "password": "mypassword"}
        response = self.client.post(self.login_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.json())
        self.assertEqual(response.json()['user']['role'], "ADMIN")
        self.assertIn('access_token', response.cookies)
        self.assertIn('refresh_token', response.cookies)

        # Login with incorrect credentials
        payload = {"email": "alice@acme.com", "password": "wrongpassword"}
        response = self.client.post(self.login_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_current_user_profile(self):
        tenant = Tenant.objects.create(company_name="Acme Corp")
        user = User.objects.create_user(
            email="alice@acme.com",
            password="password",
            full_name="Alice Admin",
            role=User.Role.ADMIN,
            tenant=tenant
        )

        # Unauthenticated request
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # Test auth with cookie
        # Perform login to set valid cookies on the test client
        login_payload = {"email": "alice@acme.com", "password": "password"}
        login_resp = self.client.post(self.login_url, login_payload, format='json')
        self.assertEqual(login_resp.status_code, status.HTTP_200_OK)

        # Retrieve profile using the cookies set on client
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()['email'], "alice@acme.com")

    def test_admin_creates_analyst_user(self):
        tenant = Tenant.objects.create(company_name="Acme Corp")
        admin = User.objects.create_user(
            email="admin@acme.com",
            password="password",
            full_name="Alice Admin",
            role=User.Role.ADMIN,
            tenant=tenant
        )
        analyst = User.objects.create_user(
            email="analyst@acme.com",
            password="password",
            full_name="Bob Analyst",
            role=User.Role.ANALYST,
            tenant=tenant
        )

        # 1. Analyst tries to create a user -> forbidden
        self.client.force_authenticate(user=analyst)
        payload = {
            "email": "newuser@acme.com",
            "full_name": "New User",
            "role": "REVIEWER",
            "password": "password123"
        }
        response = self.client.post(self.create_user_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # 2. Admin creates a user -> success
        self.client.force_authenticate(user=admin)
        response = self.client.post(self.create_user_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        new_user = User.objects.get(email="newuser@acme.com")
        self.assertEqual(new_user.role, User.Role.REVIEWER)
        # Inherited tenant validation
        self.assertEqual(new_user.tenant, tenant)

    def test_ingestion_tenant_isolation_and_audit(self):
        # Create tenant A and analyst
        tenant_a = Tenant.objects.create(company_name="Tenant A")
        analyst_a = User.objects.create_user(
            email="analyst_a@tenant.com",
            password="password",
            full_name="Analyst A",
            role=User.Role.ANALYST,
            tenant=tenant_a
        )

        # Create tenant B
        tenant_b = Tenant.objects.create(company_name="Tenant B")

        # Authenticate as Analyst A
        self.client.force_authenticate(user=analyst_a)

        # Request to ingest for Tenant B (should be rejected)
        payload = {
            "tenant_id": str(tenant_b.id),
            "source_type": "SAP",
            "file_name": "data.csv",
            "file_url": "http://example.com/data.csv"
        }
        response = self.client.post(self.ingest_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("Tenant isolation violation", response.json()['error'])

    def test_facility_relationships(self):
        from tenants.models import Facility
        from ingestion.models import DataSource, RawRecord
        from emissions.models import EmissionRecord
        from datetime import date

        # Create tenant
        tenant = Tenant.objects.create(company_name="Acme Corp")
        
        # Create facility
        facility = Facility.objects.create(
            tenant=tenant,
            name="Munich HQ",
            facility_type="office",
            location="Munich, Germany"
        )
        self.assertEqual(facility.name, "Munich HQ")
        self.assertEqual(facility.facility_type, "office")
        self.assertEqual(facility.location, "Munich, Germany")
        self.assertEqual(facility.tenant, tenant)
        
        # Create DataSource linked to Facility
        ds = DataSource.objects.create(
            tenant=tenant,
            facility=facility,
            source_type=DataSource.SourceType.SAP,
            ingestion_method=DataSource.IngestionMethod.CSV_Upload,
            uploaded_by="test_user"
        )
        self.assertEqual(ds.facility, facility)
        
        # Create RawRecord and EmissionRecord linked to Facility
        raw_rec = RawRecord.objects.create(
            data_source=ds,
            row_number=1,
            raw_payload={"liters": 100}
        )
        
        er = EmissionRecord.objects.create(
            tenant=tenant,
            facility=facility,
            raw_record=raw_rec,
            scope=EmissionRecord.Scope.SCOPE_1,
            activity_type=EmissionRecord.ActivityType.FUEL,
            activity_date=date.today(),
            quantity=100.0,
            normalized_unit="liters"
        )
        self.assertEqual(er.facility, facility)


class FacilityAPITests(TestCase):

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
            name="Facility A",
            facility_type="Factory",
            location="Berlin"
        )

        self.list_create_url = reverse('facility-list-create')
        self.detail_url = lambda pk: reverse('facility-detail-update-delete', kwargs={'pk': pk})

    def test_create_facility(self):
        self.client.force_authenticate(user=self.user_a)
        payload = {
            "name": "New Facility",
            "facility_type": "Office",
            "location": "Paris"
        }
        response = self.client.post(self.list_create_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.json()['name'], "New Facility")
        
        # Verify db persistence and tenant scoping
        new_fac = Facility.objects.get(name="New Facility")
        self.assertEqual(new_fac.tenant, self.tenant_a)

    def test_list_facilities(self):
        self.client.force_authenticate(user=self.user_a)
        # Create another facility under Tenant A
        Facility.objects.create(tenant=self.tenant_a, name="Facility A2")
        # Create facility under Tenant B (should not be listed)
        Facility.objects.create(tenant=self.tenant_b, name="Facility B")

        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data), 2)
        names = [fac['name'] for fac in data]
        self.assertIn("Facility A", names)
        self.assertIn("Facility A2", names)
        self.assertNotIn("Facility B", names)

    def test_get_facility_detail(self):
        self.client.force_authenticate(user=self.user_a)
        response = self.client.get(self.detail_url(self.facility_a.id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()['name'], "Facility A")

    def test_update_facility(self):
        self.client.force_authenticate(user=self.user_a)
        payload = {"name": "Facility A Updated", "location": "Munich"}
        response = self.client.patch(self.detail_url(self.facility_a.id), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.facility_a.refresh_from_db()
        self.assertEqual(self.facility_a.name, "Facility A Updated")
        self.assertEqual(self.facility_a.location, "Munich")

    def test_soft_delete_facility(self):
        self.client.force_authenticate(user=self.user_a)
        response = self.client.delete(self.detail_url(self.facility_a.id))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        self.facility_a.refresh_from_db()
        self.assertTrue(self.facility_a.is_deleted)

        # Ensure it is excluded from list and details
        list_resp = self.client.get(self.list_create_url)
        self.assertEqual(list_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_resp.json()), 0)

        detail_resp = self.client.get(self.detail_url(self.facility_a.id))
        self.assertEqual(detail_resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_tenant_isolation(self):
        # User B tries to access Facility A
        self.client.force_authenticate(user=self.user_b)
        
        # Get details -> 404
        response = self.client.get(self.detail_url(self.facility_a.id))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # Update -> 404
        response = self.client.patch(self.detail_url(self.facility_a.id), {"name": "Hacked"}, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # Delete -> 404
        response = self.client.delete(self.detail_url(self.facility_a.id))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class TenantSettingsAPITests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.tenant = Tenant.objects.create(
            company_name="Test Corp",
            baseline_year=2024,
            target_year=2035,
            reduction_target=50
        )
        self.admin = User.objects.create_user(
            email="admin@test.com",
            password="password",
            full_name="Alice Admin",
            role=User.Role.ADMIN,
            tenant=self.tenant
        )
        self.analyst = User.objects.create_user(
            email="analyst@test.com",
            password="password",
            full_name="Bob Analyst",
            role=User.Role.ANALYST,
            tenant=self.tenant
        )
        self.tenant_url = reverse('tenant-detail')

    def test_get_tenant_settings(self):
        self.client.force_authenticate(user=self.analyst)
        response = self.client.get(self.tenant_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data['company_name'], "Test Corp")
        self.assertEqual(data['baseline_year'], 2024)
        self.assertEqual(data['target_year'], 2035)
        self.assertEqual(data['reduction_target'], 50)
        self.assertEqual(data['emissions_standard'], "epa_2025")

    def test_update_tenant_settings_as_admin(self):
        self.client.force_authenticate(user=self.admin)
        payload = {
            "baseline_year": 2020,
            "target_year": 2030,
            "reduction_target": 75,
            "emissions_standard": "defra_2025"
        }
        response = self.client.patch(self.tenant_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.tenant.refresh_from_db()
        self.assertEqual(self.tenant.baseline_year, 2020)
        self.assertEqual(self.tenant.target_year, 2030)
        self.assertEqual(self.tenant.reduction_target, 75)
        self.assertEqual(self.tenant.emissions_standard, "defra_2025")

    def test_update_tenant_settings_as_analyst_forbidden(self):
        self.client.force_authenticate(user=self.analyst)
        payload = {
            "baseline_year": 2020
        }
        response = self.client.patch(self.tenant_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_creates_admin_user_success(self):
        self.client.force_authenticate(user=self.admin)
        create_user_url = reverse('create-user')
        payload = {
            "email": "newadmin@test.com",
            "full_name": "New Admin",
            "role": "ADMIN",
            "password": "password123"
        }
        response = self.client.post(create_user_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        new_user = User.objects.get(email="newadmin@test.com")
        self.assertEqual(new_user.role, User.Role.ADMIN)
        self.assertEqual(new_user.tenant, self.tenant)




