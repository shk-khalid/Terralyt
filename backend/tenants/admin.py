from django.contrib import admin
from tenants.models import Tenant, User, Facility

@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ("id", "company_name", "industry", "created_at")
    search_fields = ("company_name", "industry")

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("id", "email", "full_name", "role", "tenant", "is_active")
    list_filter = ("role", "is_active")
    search_fields = ("email", "full_name")

@admin.register(Facility)
class FacilityAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "facility_type", "location", "tenant", "created_at")
    list_filter = ("facility_type", "tenant")
    search_fields = ("name", "location", "tenant__company_name")


