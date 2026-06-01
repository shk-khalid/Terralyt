from django.urls import path
from ingestion.views import (
    IngestionProcessView,
    UploadListCreateView,
    UploadDetailView,
    UploadReprocessView
)

urlpatterns = [
    path('process', IngestionProcessView.as_view(), name='ingestion_process'),
    path('', UploadListCreateView.as_view(), name='upload-list-create'),
    path('<uuid:pk>', UploadDetailView.as_view(), name='upload-detail'),
    path('<uuid:pk>/reprocess', UploadReprocessView.as_view(), name='upload-reprocess'),
]
