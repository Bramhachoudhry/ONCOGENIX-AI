"""
Automated tests for Django Analyses, Patient Data Isolation, and PDF Report Generation
"""

from unittest.mock import patch
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from analyses.models import Analysis
from analyses.report_generator import generate_patient_pdf_report

class AnalysesAPITest(TestCase):
    def setUp(self):
        self.client_a = APIClient()
        self.client_b = APIClient()

        self.user_a = User.objects.create_user(username="patient_a", password="Password123!")
        self.user_b = User.objects.create_user(username="patient_b", password="Password123!")

        self.client_a.force_authenticate(user=self.user_a)
        self.client_b.force_authenticate(user=self.user_b)

        # Create an analysis for User A
        self.analysis_a = Analysis.objects.create(
            user=self.user_a,
            sample_id="SAMPLE-LUAD-001",
            status="COMPLETED",
            validation_status="PASSED",
            total_variants=4,
            distinct_genes_count=3,
            mutated_genes=["KRAS", "TP53", "STK11"],
            cancer_prediction={
                "predicted_cancer_code": "LUAD",
                "predicted_cancer_name": "Lung Adenocarcinoma",
                "confidence_score": 0.82,
                "confidence_level": "HIGH",
                "is_abstention": False,
                "driving_features_present": ["KRAS", "STK11"]
            },
            evidence_matches=[
                {
                    "gene": "KRAS",
                    "variant": "p.G12C",
                    "clinical_significance": "Predictive of Response",
                    "potential_treatment": "Sotorasib",
                    "evidence_level": "Level A",
                    "evidence_source": "CIViC / FDA"
                }
            ]
        )

    def test_user_can_list_own_analyses(self):
        resp = self.client_a.get("/api/analyses/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]["sample_id"], "SAMPLE-LUAD-001")

    def test_patient_data_isolation_cannot_view_others_analysis(self):
        # User B attempts to access User A's private analysis
        resp = self.client_b.get(f"/api/analyses/{self.analysis_a.id}/")
        # Must return 404 (or 403) to prevent unauthorized disclosure of patient presence
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_patient_data_isolation_cannot_delete_others_analysis(self):
        # User B attempts to delete User A's private analysis
        resp = self.client_b.delete(f"/api/analyses/{self.analysis_a.id}/")
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(Analysis.objects.filter(pk=self.analysis_a.id).exists())

    def test_owner_can_view_own_analysis(self):
        resp = self.client_a.get(f"/api/analyses/{self.analysis_a.id}/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["sample_id"], "SAMPLE-LUAD-001")

    def test_pdf_report_download(self):
        resp = self.client_a.get(f"/api/analyses/{self.analysis_a.id}/report/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp["Content-Type"], "application/pdf")
        self.assertTrue(resp.content.startswith(b"%PDF"))

    def test_report_generator_direct(self):
        sample_data = {
            "report_id": "TEST-RPT-001",
            "sample_id": "TCGA-LUAD-DEMO",
            "validation_status": "PASSED",
            "valid_variants_processed": 5,
            "cancer_prediction": {
                "predicted_cancer_code": "LUAD",
                "predicted_cancer_name": "Lung Adenocarcinoma",
                "confidence_score": 0.88,
                "confidence_level": "HIGH",
                "driving_features_present": ["KRAS", "EGFR"]
            },
            "observed_variants": [
                {
                    "gene": "KRAS",
                    "protein_change": "p.G12C",
                    "chromosome": "chr12",
                    "start_position": 25398284,
                    "variant_classification": "Missense_Mutation",
                    "reference_allele": "C",
                    "alternate_allele": "A"
                }
            ],
            "evidence_matches": [
                {
                    "gene": "KRAS",
                    "variant": "p.G12C",
                    "clinical_significance": "Sensitivity",
                    "potential_treatment": "Sotorasib",
                    "evidence_level": "Level A",
                    "evidence_source": "CIViC"
                }
            ]
        }
        pdf_bytes = generate_patient_pdf_report(sample_data)
        self.assertIsInstance(pdf_bytes, bytes)
        self.assertTrue(pdf_bytes.startswith(b"%PDF"))
        self.assertGreater(len(pdf_bytes), 1000)

    def test_datasets_info_endpoint(self):
        resp = self.client_a.get("/api/datasets/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("studies", resp.data)

    def test_health_endpoint(self):
        resp = self.client_a.get("/api/health/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["status"], "healthy")
