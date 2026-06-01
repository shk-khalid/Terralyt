from django.urls import path
from emissions.views import (
    DashboardSummaryView,
    DashboardScopesView,
    DashboardFacilitiesView,
    DashboardTrendsView
)

urlpatterns = [
    path('summary', DashboardSummaryView.as_view(), name='dashboard-summary'),
    path('scopes', DashboardScopesView.as_view(), name='dashboard-scopes'),
    path('facilities', DashboardFacilitiesView.as_view(), name='dashboard-facilities'),
    path('trends', DashboardTrendsView.as_view(), name='dashboard-trends'),
]
