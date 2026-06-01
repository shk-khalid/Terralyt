# Data Model Architecture & Schema Documentation

This document describes the data models and database schema of the Terralyt backend system, outlining the design decisions and architectural rationales (*"why"*).

---

## 1. Architectural Rationales & Key Design Features

### 1.1. Multi-Tenancy & Isolation
* **Implementation:** Every primary operational model (`User`, `Facility`, `DataSource`, `EmissionRecord`, `AuditLog`) contains a foreign key relation to the `Tenant` model.
* **Why:** Enforces strict logical data isolation at the database level. All queries are filtered by the tenant of the authenticated user, preventing cross-tenant data leakage.

### 1.2. Scope 1/2/3 Categorization
* **Implementation:** The `EmissionRecord` model has `scope` (choices: `SCOPE_1`, `SCOPE_2`, `SCOPE_3`) and `activity_type` fields.
* **Why:** Aligns calculations and reporting with the GHG Protocol corporate standard. Scope 1 maps direct emissions (e.g. Fuel), Scope 2 maps indirect emissions (e.g. Electricity), and Scope 3 maps value-chain emissions (e.g. Travel segments).

### 1.3. Source-of-Truth Tracking & Traceability
* **Implementation:** 
  * `EmissionRecord` has a `OneToOneField` mapping back to its source `RawRecord`.
  * `RawRecord` has a `ForeignKey` reference to the originating `DataSource` (which holds the uploaded file info, uploader user, and timestamp).
  * Edit tracking is handled through the combination of `EmissionRecord.updated_at` (automatic modification tracking) and `AuditLog` records.
* **Why:** Enables absolute auditability. A user looking at a dashboard metric can trace the exact raw JSON row payload, the original file uploaded, when it was uploaded, who uploaded it, and if/when any manual overrides or review status updates were performed.

### 1.4. Unit Normalization
* **Implementation:** The `normalized_unit` field stores unified unit codes (e.g. liters, kWh) computed during the ingestion parser stage.
* **Why:** Prevents calculation discrepancies caused by supplier-specific unit string variations (e.g., `Litres`, `ltr`, `L` are normalized to `liters`).

### 1.5. Immutable Audit Trail
* **Implementation:** The `AuditLog` model acts as an append-only ledger tracking operations (`CREATED`, `UPDATED`, `APPROVED`, `REJECTED`, `LOCKED`, `UPLOADED`) with `old_value` and `new_value` JSON snapshots.
* **Why:** Provides compliance records to verify data integrity for external auditors.

---

## 2. Core & Multi-Tenancy Models

### 2.1. Tenant
Represents a corporate tenant or organization using the platform.

```django
class Tenant(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company_name = models.CharField(max_length=255)
    industry = models.CharField(max_length=255, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    baseline_year = models.IntegerField(default=2024)
    target_year = models.IntegerField(default=2035)
    reduction_target = models.IntegerField(default=50)
    emissions_standard = models.CharField(max_length=100, default="epa_2025")
    created_at = models.DateTimeField(auto_now_add=True)
```

### 2.2. User
Custom user profile extending Django's standard `AbstractUser`, enforcing unique emails and Role-Based Access Control (RBAC).
* **Roles:** `ADMIN`, `ANALYST`, `REVIEWER`.

```django
class User(AbstractUser):
    username = None
    email = models.EmailField(unique=True)
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    full_name = models.CharField(max_length=255)
    role = models.CharField(max_length=50, choices=Role.choices, default=Role.ANALYST)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="users", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

### 2.3. Facility
Represents a physical operational location (office, plant, factory, warehouse) owned by a tenant.

```django
class Facility(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="facilities")
    name = models.CharField(max_length=255)
    facility_type = models.CharField(max_length=100, blank=True, null=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
```

---

## 3. Ingestion App Models

### 3.1. DataSource
Tracks file ingestion run metadata.

```django
class DataSource(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="data_sources", db_index=False)
    facility = models.ForeignKey('tenants.Facility', on_delete=models.SET_NULL, null=True, blank=True, related_name="data_sources")
    source_type = models.CharField(max_length=50, choices=SourceType.choices)
    ingestion_method = models.CharField(max_length=50, choices=IngestionMethod.choices)
    uploaded_file = models.FileField(upload_to='uploads/', blank=True, null=True)
    file_size = models.IntegerField(null=True, blank=True)
    processing_time = models.FloatField(null=True, blank=True)
    file_url = models.URLField(max_length=500, blank=True, null=True)
    uploaded_by = models.CharField(max_length=255)
    status = models.CharField(max_length=50, choices=Status.choices, default=Status.PENDING)
    uploaded_at = models.DateTimeField(auto_now_add=True)
```

### 3.2. RawRecord
Retains original, unmodified rows of uploaded files as JSON payloads.

```django
class RawRecord(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    data_source = models.ForeignKey(DataSource, on_delete=models.CASCADE, related_name="raw_records", db_index=False)
    row_number = models.IntegerField()
    raw_payload = models.JSONField()
    parse_status = models.CharField(max_length=50, choices=ParseStatus.choices, default=ParseStatus.PENDING)
    error_message = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

---

## 4. ESG & Emissions Models

### 4.1. EmissionRecord
Normalized emissions record, holding parsed and calculated sustainability metrics.

```django
class EmissionRecord(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="emission_records", db_index=False)
    facility = models.ForeignKey('tenants.Facility', on_delete=models.SET_NULL, null=True, blank=True, related_name="emission_records")
    raw_record = models.OneToOneField(RawRecord, on_delete=models.CASCADE, related_name="emission_record")
    scope = models.CharField(max_length=50, choices=Scope.choices)
    activity_type = models.CharField(max_length=100, choices=ActivityType.choices)
    activity_date = models.DateField()
    quantity = models.DecimalField(max_digits=15, decimal_places=3)
    normalized_unit = models.CharField(max_length=100)
    emission_factor = models.DecimalField(max_digits=15, decimal_places=6, blank=True, null=True)
    emission_value = models.DecimalField(max_digits=15, decimal_places=6, blank=True, null=True)
    anomaly_flag = models.BooleanField(default=False)
    anomaly_reason = models.TextField(blank=True, null=True)
    review_status = models.CharField(max_length=50, choices=ReviewStatus.choices, default=ReviewStatus.PENDING)
    is_locked = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

---

## 5. Verification & Auditing Models

### 5.1. ReviewComment
```django
class ReviewComment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    emission_record = models.ForeignKey(EmissionRecord, on_delete=models.CASCADE, related_name="review_comments")
    reviewer = models.CharField(max_length=255)
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
```

### 5.2. AuditLog
```django
class AuditLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    emission_record = models.ForeignKey(EmissionRecord, on_delete=models.CASCADE, related_name="audit_logs", db_index=False, null=True, blank=True)
    acted_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="audit_logs")
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="audit_logs", null=True, blank=True)
    action_type = models.CharField(max_length=50, choices=ActionType.choices)
    old_value = models.JSONField(blank=True, null=True)
    new_value = models.JSONField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
```
