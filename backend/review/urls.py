from django.urls import path
from review.views import (
    ReviewPendingListView,
    ReviewAnomalyListView,
    ReviewDetailView,
    ReviewApproveView,
    ReviewRejectView,
    ReviewEditView
)

urlpatterns = [
    path('pending', ReviewPendingListView.as_view(), name='review-pending'),
    path('anomalies', ReviewAnomalyListView.as_view(), name='review-anomalies'),
    path('<uuid:pk>', ReviewDetailView.as_view(), name='review-detail'),
    path('<uuid:pk>/approve', ReviewApproveView.as_view(), name='review-approve'),
    path('<uuid:pk>/reject', ReviewRejectView.as_view(), name='review-reject'),
    path('<uuid:pk>/edit', ReviewEditView.as_view(), name='review-edit'),
]
