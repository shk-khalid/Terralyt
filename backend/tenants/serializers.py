from rest_framework import serializers
from django.contrib.auth import get_user_model
from tenants.models import Tenant, Facility

User = get_user_model()

class TenantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = ['id', 'company_name', 'industry', 'is_active', 'created_at', 'baseline_year', 'target_year', 'reduction_target', 'emissions_standard']
        read_only_fields = ['id', 'is_active', 'created_at']


class UserSerializer(serializers.ModelSerializer):
    tenant = TenantSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'role', 'tenant', 'is_active', 'created_at']
        read_only_fields = ['id', 'is_active', 'created_at', 'tenant']


class TenantRegistrationSerializer(serializers.Serializer):
    company_name = serializers.CharField(max_length=255)
    industry = serializers.CharField(max_length=255, required=False, allow_blank=True, allow_null=True)
    admin_name = serializers.CharField(max_length=255)
    admin_email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)

    def validate_company_name(self, value):
        if Tenant.objects.filter(company_name__iexact=value).exists():
            raise serializers.ValidationError("A tenant with this company name already exists.")
        return value

    def validate_admin_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email address already exists.")
        return value


class UserCreationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'role', 'password']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email address already exists.")
        return value

    def validate_role(self, value):
        if value not in [User.Role.ADMIN, User.Role.ANALYST, User.Role.REVIEWER]:
            raise serializers.ValidationError("Admin users can only create ADMIN, ANALYST, or REVIEWER accounts.")
        return value


class FacilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Facility
        fields = ['id', 'name', 'facility_type', 'location', 'created_at']
        read_only_fields = ['id', 'created_at']
