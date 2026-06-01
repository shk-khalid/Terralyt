from django.urls import path
from audit.views import AuditLogListView, AuditLogDetailView

urlpatterns = [
    path('', AuditLogListView.as_view(), name='audit-log-list'),
    path('<uuid:pk>', AuditLogDetailView.as_view(), name='audit-log-detail'),
]
