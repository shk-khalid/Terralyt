from django.contrib import admin
from django.urls import path, include
from config.views import health_check

urlpatterns = [
    path('', health_check, name='root'),
    path('admin/', admin.site.urls),
    path('health/', health_check, name='health-check'),
    path('api/ingestion/', include('ingestion.urls')),
    path('api/uploads/', include('ingestion.urls')),
    path('api/review/', include('review.urls')),
    path('api/dashboard/', include('emissions.urls')),
    path('api/audit-logs/', include('audit.urls')),
    path('api/', include('tenants.urls')),
]


