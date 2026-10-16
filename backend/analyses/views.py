"""
ONCOGENIX AI - Analysis Views & API Controllers
Coordinates with FastAPI AI inference microservice, enforces user data isolation,
handles file storage, and serves clinical PDF reports.
"""

import json
import logging
import os
import requests
from django.conf import settings
from django.http import HttpResponse, Http404
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from .models import Analysis
from .serializers import AnalysisListSerializer, AnalysisDetailSerializer, AnalysisCreateSerializer
from .report_generator import generate_patient_pdf_report
from storage.firebase_storage import storage_service

logger = logging.getLogger("analyses_views")

class HealthView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        ai_service_url = getattr(settings, "FASTAPI_SERVICE_URL", "http://127.0.0.1:8001")
        ai_health = {"status": "unavailable", "detail": "Could not connect to FastAPI AI service"}
        try:
            r = requests.get(f"{ai_service_url}/health", timeout=3)
            if r.status_code == 200:
                ai_health = r.json()
        except Exception as e:
            ai_health["detail"] = str(e)

        return Response({
            "status": "healthy",
            "backend": "Django REST Framework",
            "storage_provider": "Firebase" if storage_service.firebase_initialized else "Local Secure Fallback",
            "ai_service": ai_health,
        }, status=status.HTTP_200_OK)

class DashboardSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user_analyses = Analysis.objects.filter(user=request.user)
        total_count = user_analyses.count()
        recent = user_analyses[:5]

        # Top mutated genes assayed by this user
        gene_counts = {}
        for a in user_analyses:
            for g in (a.mutated_genes or []):
                gene_counts[g] = gene_counts.get(g, 0) + 1
        sorted_genes = sorted(gene_counts.items(), key=lambda x: x[1], reverse=True)[:6]

        # AI service model metadata
        ai_service_url = getattr(settings, "FASTAPI_SERVICE_URL", "http://127.0.0.1:8001")
        model_info = {"available": False}
        try:
            r = requests.get(f"{ai_service_url}/model/info", timeout=3)
            if r.status_code == 200:
                model_info = r.json()
        except Exception:
            pass

        return Response({
            "user": request.user.username,
            "total_analyses": total_count,
            "recent_analyses": AnalysisListSerializer(recent, many=True).data,
            "frequent_user_mutations": sorted_genes,
            "model_info": model_info,
            "available_cancer_classes": [
                {"code": "LUAD", "name": "Lung Adenocarcinoma"},
                {"code": "PAAD", "name": "Pancreatic Adenocarcinoma"},
                {"code": "COADREAD", "name": "Colorectal Adenocarcinoma"},
                {"code": "BRCA", "name": "Breast Invasive Carcinoma"}
            ]
        }, status=status.HTTP_200_OK)

class AnalysisListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        analyses = Analysis.objects.filter(user=request.user)
        serializer = AnalysisListSerializer(analyses, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = AnalysisCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        validated_data = serializer.validated_data
        sample_id = validated_data.get("sample_id") or "SAMPLE-001"
        patient_id = validated_data.get("patient_identifier") or ""
        genome_assembly = validated_data.get("genome_assembly") or "GRCh37"
        analysis_type = validated_data.get("analysis_type") or "classification_and_evidence"
        file_format = validated_data.get("file_format") or "csv"

        uploaded_file = request.FILES.get("file")
        raw_content = validated_data.get("raw_content") or ""

        file_name = uploaded_file.name if uploaded_file else f"{sample_id}.csv"
        file_bytes = b""

        if uploaded_file:
            file_bytes = uploaded_file.read()
            raw_content = file_bytes.decode("utf-8", errors="replace")
            # Determine format from extension if not specified
            if file_name.endswith(".tsv"):
                file_format = "tsv"
            elif file_name.endswith(".maf"):
                file_format = "maf"
            elif file_name.endswith(".json"):
                file_format = "json"

        if not raw_content.strip():
            return Response({"error": "No file content or mutation data provided."}, status=status.HTTP_400_BAD_REQUEST)

        # Save raw file via storage provider
        storage_path, storage_type = storage_service.save_file(
            raw_content.encode("utf-8"), file_name, subfolder="uploads"
        )

        analysis = Analysis.objects.create(
            user=request.user,
            sample_id=sample_id,
            patient_identifier=patient_id,
            file_name=file_name,
            file_format=file_format,
            file_storage_path=storage_path,
            file_storage_type=storage_type,
            genome_assembly=genome_assembly,
            analysis_type=analysis_type,
            status="PROCESSING"
        )

        # Call FastAPI inference service
        ai_service_url = getattr(settings, "FASTAPI_SERVICE_URL", "http://127.0.0.1:8001")
        try:
            payload = {
                "sample_id": sample_id,
                "genome_assembly": genome_assembly,
                "file_format": file_format,
                "raw_content": raw_content
            }
            resp = requests.post(f"{ai_service_url}/analyze/mutations", json=payload, timeout=25)
            if resp.status_code != 200:
                analysis.status = "FAILED"
                analysis.error_message = f"AI Service error: {resp.text}"
                analysis.save()
                return Response({
                    "error": "Genomic analysis processing failed in AI service.",
                    "details": resp.text
                }, status=status.HTTP_502_BAD_GATEWAY)

            data = resp.json()

            analysis.status = "COMPLETED"
            analysis.validation_status = data.get("validation_status", "PASSED")
            analysis.total_variants = data.get("valid_variants_processed", 0)
            analysis.distinct_genes_count = data.get("distinct_mutated_genes_count", 0)
            analysis.mutated_genes = data.get("mutated_genes", [])
            analysis.variant_categories = data.get("variant_categories", {})
            analysis.observed_variants = data.get("observed_variants", [])
            analysis.evidence_matches = data.get("evidence_matches", [])
            analysis.cancer_prediction = data.get("cancer_prediction") or {}
            analysis.validation_notes = data.get("validation_notes", [])

            # Generate PDF report automatically
            try:
                report_dict = {
                    "report_id": f"OGX-{str(analysis.id)[:8].upper()}",
                    "sample_id": analysis.sample_id,
                    "created_at": analysis.created_at.strftime("%Y-%m-%d %H:%M:%S UTC"),
                    "genome_assembly": analysis.genome_assembly,
                    "validation_status": analysis.validation_status,
                    "valid_variants_processed": analysis.total_variants,
                    "cancer_prediction": analysis.cancer_prediction,
                    "observed_variants": analysis.observed_variants,
                    "evidence_matches": analysis.evidence_matches
                }
                pdf_bytes = generate_patient_pdf_report(report_dict)
                pdf_path, pdf_type = storage_service.save_file(
                    pdf_bytes, f"report_{analysis.sample_id}.pdf", subfolder="reports"
                )
                analysis.pdf_report_path = pdf_path
                analysis.pdf_report_storage_type = pdf_type
            except Exception as e:
                logger.error("Failed to generate PDF report: %s", e)

            analysis.save()
            return Response(AnalysisDetailSerializer(analysis).data, status=status.HTTP_201_CREATED)

        except requests.exceptions.RequestException as e:
            analysis.status = "FAILED"
            analysis.error_message = f"Cannot connect to AI inference service: {e}"
            analysis.save()
            return Response({
                "error": "AI Inference service is currently unavailable. Ensure Uvicorn is running on port 8001.",
                "details": str(e)
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

class AnalysisDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, pk, user):
        try:
            analysis = Analysis.objects.get(pk=pk)
            # Patient isolation security check
            if analysis.user != user and not user.is_staff:
                raise Http404("Analysis not found.")
            return analysis
        except Analysis.DoesNotExist:
            raise Http404("Analysis not found.")

    def get(self, request, pk):
        analysis = self.get_object(pk, request.user)
        return Response(AnalysisDetailSerializer(analysis).data, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        analysis = self.get_object(pk, request.user)
        # Delete stored files
        if analysis.file_storage_path:
            storage_service.delete_file(analysis.file_storage_path)
        if analysis.pdf_report_path:
            storage_service.delete_file(analysis.pdf_report_path)
        analysis.delete()
        return Response({"message": "Analysis deleted successfully."}, status=status.HTTP_204_NO_CONTENT)

class AnalysisReportDownloadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            analysis = Analysis.objects.get(pk=pk)
            if analysis.user != request.user and not request.user.is_staff:
                raise Http404("Report not found.")
        except Analysis.DoesNotExist:
            raise Http404("Report not found.")

        # Check if PDF already stored locally
        pdf_bytes = None
        if analysis.pdf_report_path and os.path.exists(analysis.pdf_report_path):
            with open(analysis.pdf_report_path, "rb") as f:
                pdf_bytes = f.read()

        # Generate on the fly if absent
        if not pdf_bytes:
            report_dict = {
                "report_id": f"OGX-{str(analysis.id)[:8].upper()}",
                "sample_id": analysis.sample_id,
                "created_at": analysis.created_at.strftime("%Y-%m-%d %H:%M:%S UTC"),
                "genome_assembly": analysis.genome_assembly,
                "validation_status": analysis.validation_status,
                "valid_variants_processed": analysis.total_variants,
                "cancer_prediction": analysis.cancer_prediction,
                "observed_variants": analysis.observed_variants,
                "evidence_matches": analysis.evidence_matches
            }
            pdf_bytes = generate_patient_pdf_report(report_dict)

        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="ONCOGENIX_Report_{analysis.sample_id}.pdf"'
        return response

class PatientComparisonAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        analysis_a_id = request.data.get("analysis_a_id")
        analysis_b_id = request.data.get("analysis_b_id")
        raw_a = request.data.get("raw_content_a")
        raw_b = request.data.get("raw_content_b")

        content_a = raw_a or ""
        content_b = raw_b or ""
        name_a = request.data.get("name_a", "Profile_A")
        name_b = request.data.get("name_b", "Profile_B")

        if analysis_a_id:
            try:
                a_obj = Analysis.objects.get(pk=analysis_a_id, user=request.user)
                name_a = a_obj.sample_id
                # Reconstruct content or read file
                if a_obj.file_storage_path and os.path.exists(a_obj.file_storage_path):
                    with open(a_obj.file_storage_path, "r", encoding="utf-8") as f:
                        content_a = f.read()
            except Analysis.DoesNotExist:
                return Response({"error": "Analysis A not found or access denied."}, status=status.HTTP_404_NOT_FOUND)

        if analysis_b_id:
            try:
                b_obj = Analysis.objects.get(pk=analysis_b_id, user=request.user)
                name_b = b_obj.sample_id
                if b_obj.file_storage_path and os.path.exists(b_obj.file_storage_path):
                    with open(b_obj.file_storage_path, "r", encoding="utf-8") as f:
                        content_b = f.read()
            except Analysis.DoesNotExist:
                return Response({"error": "Analysis B not found or access denied."}, status=status.HTTP_404_NOT_FOUND)

        if not content_a or not content_b:
            return Response({"error": "Two profiles are required for comparison."}, status=status.HTTP_400_BAD_REQUEST)

        ai_service_url = getattr(settings, "FASTAPI_SERVICE_URL", "http://127.0.0.1:8001")
        try:
            payload = {
                "sample_a_id": name_a,
                "sample_a_content": content_a,
                "sample_b_id": name_b,
                "sample_b_content": content_b
            }
            resp = requests.post(f"{ai_service_url}/compare/mutations", json=payload, timeout=20)
            if resp.status_code == 200:
                return Response(resp.json(), status=status.HTTP_200_OK)
            return Response(resp.json(), status=resp.status_code)
        except Exception as e:
            return Response({"error": f"AI service comparison failed: {e}"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

class DatasetsInfoView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        manifest_path = os.path.join(root_dir, "data", "metadata", "dataset_manifest.json")
        if os.path.exists(manifest_path):
            with open(manifest_path, "r", encoding="utf-8") as f:
                return Response(json.load(f), status=status.HTTP_200_OK)
        return Response({"error": "Dataset manifest not generated yet."}, status=status.HTTP_404_NOT_FOUND)

class ModelsInfoView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        ai_service_url = getattr(settings, "FASTAPI_SERVICE_URL", "http://127.0.0.1:8001")
        try:
            r = requests.get(f"{ai_service_url}/model/info", timeout=3)
            if r.status_code == 200:
                return Response(r.json(), status=status.HTTP_200_OK)
        except Exception:
            pass

        root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        metrics_path = os.path.join(root_dir, "ai_service", "models", "model_metrics.json")
        if os.path.exists(metrics_path):
            with open(metrics_path, "r", encoding="utf-8") as f:
                return Response(json.load(f), status=status.HTTP_200_OK)

        return Response({"error": "Model information not available."}, status=status.HTTP_404_NOT_FOUND)
