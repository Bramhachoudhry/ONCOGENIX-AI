"""
ONCOGENIX AI - Main URL Configuration
Pure Django Frontend & REST Framework API Routes
"""

from django.contrib import admin
from django.urls import path, include
from analyses.frontend_views import (
    landing_page, login_page, register_page, logout_page,
    dashboard_page, analysis_page, results_page, comparison_page,
    history_page, about_page, delete_analysis_view, download_pdf_report
)

urlpatterns = [
    # Institutional Admin
    path('admin/', admin.site.urls),

    # Pure Django Web Application Frontend Routes
    path('', landing_page, name='landing'),
    path('login/', login_page, name='login'),
    path('register/', register_page, name='register'),
    path('logout/', logout_page, name='logout'),
    path('dashboard/', dashboard_page, name='dashboard'),
    path('analysis/', analysis_page, name='analysis'),
    path('results/<uuid:pk>/', results_page, name='results'),
    path('comparison/', comparison_page, name='comparison'),
    path('history/', history_page, name='history'),
    path('about/', about_page, name='about'),
    path('analyses/<uuid:pk>/delete/', delete_analysis_view, name='delete_analysis'),
    path('analyses/<uuid:pk>/report/', download_pdf_report, name='download_pdf_report'),

    # REST APIs (For external microservices and testing)
    path('api/auth/', include('accounts.urls')),
    path('api/', include('analyses.urls')),
]

from django.conf import settings
from django.conf.urls.static import static

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.BASE_DIR / 'static')
