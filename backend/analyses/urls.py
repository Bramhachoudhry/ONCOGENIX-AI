from django.urls import path
from .views import (
    AnalysisListCreateView, AnalysisDetailView, AnalysisReportDownloadView,
    PatientComparisonAPIView, DashboardSummaryView, DatasetsInfoView,
    ModelsInfoView, HealthView
)

urlpatterns = [
    path('health/', HealthView.as_view(), name='api_health'),
    path('dashboard/', DashboardSummaryView.as_view(), name='api_dashboard'),
    path('analyses/', AnalysisListCreateView.as_view(), name='api_analyses_list_create'),
    path('analyses/<uuid:pk>/', AnalysisDetailView.as_view(), name='api_analysis_detail'),
    path('analyses/<uuid:pk>/report/', AnalysisReportDownloadView.as_view(), name='api_analysis_report'),
    path('analyses/compare/', PatientComparisonAPIView.as_view(), name='api_analyses_compare'),
    path('models/', ModelsInfoView.as_view(), name='api_models_info'),
    path('datasets/', DatasetsInfoView.as_view(), name='api_datasets_info'),
]
