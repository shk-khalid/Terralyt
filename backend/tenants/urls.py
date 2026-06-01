from django.urls import path
from tenants.views import (
    RegisterTenantView, 
    LoginView, 
    CurrentUserView, 
    CreateUserView,
    CookieTokenRefreshView,
    LogoutView,
    FacilityListCreateView,
    FacilityDetailUpdateDeleteView,
    UserListView,
    TenantDetailView
)

urlpatterns = [
    # Auth endpoints
    path('auth/register-tenant/', RegisterTenantView.as_view(), name='register-tenant'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/me/', CurrentUserView.as_view(), name='current-user'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/token/refresh/', CookieTokenRefreshView.as_view(), name='token-refresh'),
    
    # User endpoints
    path('users/', UserListView.as_view(), name='user-list'),
    path('users/create/', CreateUserView.as_view(), name='create-user'),

    # Tenant configuration endpoints
    path('tenant/', TenantDetailView.as_view(), name='tenant-detail'),

    # Facility endpoints
    path('facilities/', FacilityListCreateView.as_view(), name='facility-list-create'),
    path('facilities/<uuid:pk>/', FacilityDetailUpdateDeleteView.as_view(), name='facility-detail-update-delete'),
]

