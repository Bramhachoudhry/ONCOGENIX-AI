"""
Automated Unit and Integration Tests for AI Inference Microservice
"""

import os
import unittest
from fastapi.testclient import TestClient
from ai_service.app.main import app

client = TestClient(app)

class TestAIService(unittest.TestCase):
    def test_health(self):
        resp = client.get("/health")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "healthy")
        self.assertTrue(data["model_loaded"])
        self.assertGreater(data["evidence_records_count"], 0)

    def test_model_info(self):
        resp = client.get("/model/info")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data["available"])
        self.assertIn("LUAD", data["classes"])
        self.assertIn("PAAD", data["classes"])
        self.assertEqual(data["feature_count"], 40)
        self.assertIn("KRAS", data["features"])

    def test_predict_cancer_luad(self):
        # LUAD characteristic genes: KRAS, EGFR, STK11, KEAP1
        payload = {
            "sample_id": "TEST-LUAD-PATIENT",
            "genes_mutated": ["KRAS", "EGFR", "STK11", "KEAP1"]
        }
        resp = client.post("/predict/cancer", json=payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertFalse(data["is_abstention"])
        self.assertIn(data["predicted_cancer_code"], ["LUAD", "COADREAD", "PAAD", "BRCA"])
        self.assertGreater(data["confidence_score"], 0.40)
        self.assertIn("KRAS", data["driving_features_present"])

    def test_predict_cancer_abstention_on_empty(self):
        # When no driver genes in panel are mutated, model MUST abstain
        payload = {
            "sample_id": "TEST-EMPTY-PATIENT",
            "genes_mutated": ["GENE_NOT_IN_PANEL_XYZ"]
        }
        resp = client.post("/predict/cancer", json=payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data["is_abstention"])
        self.assertEqual(data["confidence_level"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(data["predicted_cancer_code"])

    def test_analyze_mutations_csv(self):
        root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        sample_path = os.path.join(root_dir, "data", "samples", "sample_a_variants.csv")
        with open(sample_path, "r") as f:
            content = f.read()

        payload = {
            "sample_id": "TEST-SAMPLE-A",
            "genome_assembly": "GRCh37",
            "file_format": "csv",
            "raw_content": content
        }
        resp = client.post("/analyze/mutations", json=payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["validation_status"], "PASSED")
        self.assertGreaterEqual(data["valid_variants_processed"], 4)
        self.assertIn("KRAS", data["mutated_genes"])
        self.assertIn("STK11", data["mutated_genes"])
        # Check evidence match for KRAS G12C
        matched_genes = [e["gene"] for e in data["evidence_matches"]]
        self.assertIn("KRAS", matched_genes)
        # Check cancer prediction embedded
        self.assertIsNotNone(data["cancer_prediction"])

    def test_analyze_mutations_invalid_coordinates(self):
        invalid_content = "Hugo_Symbol,Chromosome,Start_Position,Reference_Allele,Tumor_Seq_Allele2\nKRAS,chr12,-999,C,A\nTP53,chr17,not_a_number,C,T\n,chr1,100,A,T"
        payload = {
            "sample_id": "INVALID-TEST",
            "raw_content": invalid_content,
            "file_format": "csv"
        }
        resp = client.post("/analyze/mutations", json=payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["valid_variants_processed"], 0)
        self.assertGreater(data["rejected_rows_count"], 0)

    def test_patient_comparison(self):
        root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        path_a = os.path.join(root_dir, "data", "samples", "sample_a_variants.csv")
        path_b = os.path.join(root_dir, "data", "samples", "sample_b_variants.csv")
        with open(path_a, "r") as f:
            content_a = f.read()
        with open(path_b, "r") as f:
            content_b = f.read()

        payload = {
            "sample_a_id": "Patient_LUAD",
            "sample_a_content": content_a,
            "sample_b_id": "Patient_PAAD",
            "sample_b_content": content_b
        }
        resp = client.post("/compare/mutations", json=payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("KRAS", data["shared_genes"])
        self.assertIn("TP53", data["shared_genes"])
        self.assertIn("STK11", data["unique_genes_a"])
        self.assertIn("SMAD4", data["unique_genes_b"])
        self.assertGreater(data["jaccard_similarity"], 0.0)

if __name__ == "__main__":
    unittest.main()
