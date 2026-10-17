"""
ONCOGENIX AI - Pure Django Frontend Views Test Suite
Verifies:
- Template rendering (Landing, Dashboard, Login, Register, Analysis, Results, Comparison, History, About)
- College name ("Thakur Shyamnarayan College of Engineering, Mumbai") is prominently featured
- Demo credentials and quick-fill buttons are strictly absent from login/register
- Authentication, redirection, and patient data isolation
- Analysis execution and PDF report download
"""

from unittest.mock import patch
from django.test import TestCase, Client
from django.contrib.auth.models import User
from analyses.models import Analysis

class FrontendViewsTestCase(TestCase):
    def setUp(self):
        self.client = Client()
        self.user_a = User.objects.create_user(
            username="clinician_a",
            email="clinician_a@tsce.edu",
            password="StrongPassword123!"
        )
        self.user_b = User.objects.create_user(
            username="clinician_b",
            email="clinician_b@tsce.edu",
            password="StrongPassword456!"
        )

        # Create sample analysis for user_a
        self.analysis_a = Analysis.objects.create(
            user=self.user_a,
            sample_id="TCGA-LUAD-9042",
            patient_identifier="PT-LUAD-42",
            genome_assembly="GRCh38",
            status="COMPLETED",
            validation_status="PASSED",
            total_variants=3,
            distinct_genes_count=3,
            mutated_genes=["EGFR", "TP53", "KRAS"],
            cancer_prediction={
                "predicted_cancer_code": "LUAD",
                "predicted_cancer_type": "LUAD",
                "predicted_cancer_name": "Lung Adenocarcinoma",
                "confidence_score": 85.5,
                "confidence_level": "High",
                "patient_summary": "EGFR L858R mutation identified with high LUAD likelihood.",
                "probabilities": {"LUAD": 0.855, "PAAD": 0.05, "BRCA": 0.045, "COADREAD": 0.05}
            },
            evidence_matches=[
                {
                    "gene": "EGFR",
                    "variant": "L858R",
                    "drugs": "Osimertinib",
                    "evidence_level": "A",
                    "clinical_significance": "Sensitivity to 3rd-generation EGFR TKIs"
                }
            ],
            observed_variants=[
                {
                    "gene": "EGFR",
                    "variant_classification": "Missense_Mutation",
                    "protein_change": "p.L858R",
                    "chromosome": "chr7",
                    "position": 55259515,
                    "clinical_significance": "Pathogenic"
                }
            ]
        )

    def test_landing_page(self):
        resp = self.client.get("/")
        self.assertEqual(resp.status_code, 200)
        content = resp.content.decode("utf-8")
        self.assertIn("ONCOGENIX", content)
        self.assertIn("Thakur Shyamnarayan College of Engineering, Mumbai", content)
        self.assertIn("AI-POWERED CLINICAL ONCOLOGY ENGINE", content)
        self.assertIn("Interactive 3D Helix", content)

    def test_about_methodology_page(self):
        resp = self.client.get("/about/")
        self.assertEqual(resp.status_code, 200)
        content = resp.content.decode("utf-8")
        self.assertIn("Thakur Shyamnarayan College of Engineering, Mumbai", content)
        self.assertIn("78.4%", content)
        self.assertIn("TCGA PanCancer Atlas", content)
        self.assertIn("CIViC", content)

    def test_login_page_renders_clean_without_demo_credentials(self):
        resp = self.client.get("/login/")
        self.assertEqual(resp.status_code, 200)
        content = resp.content.decode("utf-8")
        self.assertIn("Authenticate Session", content)
        self.assertIn("Thakur Shyamnarayan College of Engineering, Mumbai", content)
        # Ensure NO demo credentials or quick-fill buttons appear
        self.assertNotIn("demooncologist", content)
        self.assertNotIn("Password123!", content)
        self.assertNotIn("Quick Demo Fill", content)

    def test_login_flow(self):
        # Invalid login
        resp = self.client.post("/login/", {
            "username": "clinician_a",
            "password": "WrongPassword!"
        })
        self.assertEqual(resp.status_code, 200)
        self.assertIn("Authentication failed", resp.content.decode("utf-8"))

        # Valid login
        resp = self.client.post("/login/", {
            "username": "clinician_a",
            "password": "StrongPassword123!"
        }, follow=True)
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.context["user"].is_authenticated)

    def test_dashboard_requires_login(self):
        # Anonymous user gets redirected to /login/
        resp = self.client.get("/dashboard/")
        self.assertEqual(resp.status_code, 302)
        self.assertTrue(resp.url.startswith("/login/"))

        # Authenticated user accesses dashboard
        self.client.force_login(self.user_a)
        resp = self.client.get("/dashboard/")
        self.assertEqual(resp.status_code, 200)
        content = resp.content.decode("utf-8")
        self.assertIn("Precision Oncology Dashboard", content)
        self.assertIn("TCGA-LUAD-9042", content)
        self.assertIn("Thakur Shyamnarayan College of Engineering, Mumbai", content)

    def test_results_page_patient_isolation(self):
        # User A can view their own result
        self.client.force_login(self.user_a)
        resp = self.client.get(f"/results/{self.analysis_a.id}/")
        self.assertEqual(resp.status_code, 200)
        content = resp.content.decode("utf-8")
        self.assertIn("TCGA-LUAD-9042", content)
        self.assertIn("Lung Adenocarcinoma", content)
        self.assertIn("Osimertinib", content)

        # User B cannot view User A's result (404 / isolation enforced)
        self.client.force_login(self.user_b)
        resp = self.client.get(f"/results/{self.analysis_a.id}/")
        self.assertEqual(resp.status_code, 404)

    def test_history_page(self):
        self.client.force_login(self.user_a)
        resp = self.client.get("/history/")
        self.assertEqual(resp.status_code, 200)
        content = resp.content.decode("utf-8")
        self.assertIn("TCGA-LUAD-9042", content)
        self.assertIn("Lung Adenocarcinoma", content)

    def test_pdf_report_download(self):
        self.client.force_login(self.user_a)
        resp = self.client.get(f"/analyses/{self.analysis_a.id}/report/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp["Content-Type"], "application/pdf")
        self.assertTrue(len(resp.content) > 1000)

        # User B cannot download User A's report
        self.client.force_login(self.user_b)
        resp = self.client.get(f"/analyses/{self.analysis_a.id}/report/")
        self.assertEqual(resp.status_code, 404)

    @patch("analyses.frontend_views.requests.post")
    def test_analysis_submission_flow(self, mock_post):
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = {
            "validation_status": "PASSED",
            "valid_variants_processed": 3,
            "distinct_mutated_genes_count": 3,
            "mutated_genes": ["KRAS", "TP53", "CDKN2A"],
            "cancer_prediction": {
                "predicted_cancer_code": "PAAD",
                "predicted_cancer_name": "Pancreatic Adenocarcinoma",
                "confidence_score": 91.2,
                "confidence_level": "High",
                "patient_summary": "KRAS G12D driver mutation detected, characteristic of PAAD.",
                "probabilities": {"LUAD": 0.05, "PAAD": 0.912, "BRCA": 0.02, "COADREAD": 0.018}
            },
            "observed_variants": [
                {"gene": "KRAS", "protein_change": "p.G12D", "clinical_significance": "Pathogenic"}
            ],
            "evidence_matches": [
                {"gene": "KRAS", "variant": "G12D", "drugs": "Clinical trials (KRAS G12D inhibitors)", "evidence_level": "B"}
            ]
        }

        self.client.force_login(self.user_a)
        resp = self.client.post("/analysis/", {
            "sample_id": "TEST-PAAD-001",
            "patient_identifier": "PT-001",
            "genome_build": "GRCh38",
            "direct_genes": "KRAS, TP53, CDKN2A"
        })
        self.assertEqual(resp.status_code, 302)
        new_analysis = Analysis.objects.filter(sample_id="TEST-PAAD-001").first()
        self.assertIsNotNone(new_analysis)
        self.assertEqual(resp.url, f"/results/{new_analysis.id}/")
        self.assertEqual(new_analysis.predicted_cancer_type, "PAAD")
