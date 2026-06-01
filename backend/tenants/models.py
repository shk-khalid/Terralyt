from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
import uuid 

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

    class Meta: 
        db_table = "tenants"

    def __str__(self):
        return self.company_name


class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        extra_fields.setdefault('is_active', True)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'ADMIN')
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    username = None  # Remove username requirement
    email = models.EmailField(unique=True)

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    full_name = models.CharField(max_length=255)
    
    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Admin"
        ANALYST = "ANALYST", "Analyst"
        REVIEWER = "REVIEWER", "Reviewer"

    role = models.CharField(
        max_length=50, 
        choices=Role.choices, 
        default=Role.ANALYST
    )
    tenant = models.ForeignKey(
        Tenant, 
        on_delete=models.CASCADE, 
        related_name="users", 
        null=True, 
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        db_table = "users"

    def __str__(self):
        return self.email


class Facility(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="facilities")
    name = models.CharField(max_length=255)
    facility_type = models.CharField(max_length=100, blank=True, null=True) # e.g. plant, office, factory, warehouse
    location = models.CharField(max_length=255, blank=True, null=True)
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "facilities"
        indexes = [
            models.Index(fields=["tenant"]),
            models.Index(fields=["is_deleted"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.tenant.company_name})"