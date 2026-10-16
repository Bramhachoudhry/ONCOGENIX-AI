"""
ONCOGENIX AI - Precision Cancer Classification Predictor
Loads serialized model artifacts, validates feature vectors, computes calibrated
class probabilities, handles model uncertainty/abstention, and explains driving genomic features.
"""

import logging
import os
from typing import List, Dict, Any, Optional
import joblib
import numpy as np

logger = logging.getLogger("predictor")

CANCER_NAME_MAP = {
    "LUAD": "Lung Adenocarcinoma",
    "PAAD": "Pancreatic Adenocarcinoma",
    "COADREAD": "Colorectal Adenocarcinoma",
    "BRCA": "Breast Invasive Carcinoma"
}

class CancerClassifierService:
    def __init__(self, model_path: Optional[str] = None):
        if not model_path:
            root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            model_path = os.path.join(root_dir, "ai_service", "models", "cancer_classifier.joblib")

        self.model_path = model_path
        self.bundle = None
        self.model = None
        self.feature_names = []
        self.classes = []
        self.feature_importance = {}
        self.load_model()

    def load_model(self):
        if not os.path.exists(self.model_path):
            logger.warning("Model artifact not found at %s. Classifier will be unavailable until trained.", self.model_path)
            self.model = None
            return

        try:
            self.bundle = joblib.load(self.model_path)
            self.model = self.bundle.get("model")
            self.feature_names = self.bundle.get("feature_names", [])
            self.classes = self.bundle.get("classes", [])
            self.feature_importance = self.bundle.get("feature_importance", {})
            logger.info("Successfully loaded classifier '%s' with %d features and %d classes.",
                        self.bundle.get("model_name"), len(self.feature_names), len(self.classes))
        except Exception as e:
            logger.error("Failed to load model from %s: %s", self.model_path, e)
            self.model = None

    def is_available(self) -> bool:
        return self.model is not None

    def get_model_info(self) -> Dict[str, Any]:
        if not self.is_available():
            return {
                "available": False,
                "error": "Model artifact is not loaded or missing from filesystem."
            }
        return {
            "available": True,
            "model_name": self.bundle.get("model_name"),
            "classes": self.classes,
            "cancer_names": {c: CANCER_NAME_MAP.get(c, c) for c in self.classes},
            "feature_count": len(self.feature_names),
            "features": self.feature_names,
            "dataset_provenance": self.bundle.get("dataset_provenance"),
            "genome_assembly": self.bundle.get("genome_assembly"),
            "n_train_samples": self.bundle.get("n_train_samples"),
            "n_test_samples": self.bundle.get("n_test_samples"),
            "evaluation_metrics": self.bundle.get("evaluation_metrics"),
            "baseline_comparison": self.bundle.get("baseline_comparison"),
            "top_features": list(self.feature_importance.items())[:15]
        }

    def predict(self, mutated_genes: List[str], sample_id: str = "SAMPLE") -> Dict[str, Any]:
        if not self.is_available():
            raise RuntimeError("Model artifact is unavailable. Classification service cannot process requests.")

        clean_genes = set(g.strip().upper() for g in mutated_genes if g)
        driving_features_in_sample = [g for g in self.feature_names if g in clean_genes]

        # Scientific Abstention Rule:
        # If the sample has zero alterations in the trained panel, do not guess arbitrarily.
        if len(driving_features_in_sample) == 0:
            return {
                "sample_id": sample_id,
                "predicted_cancer_code": None,
                "predicted_cancer_name": None,
                "confidence_score": 0.0,
                "confidence_level": "INSUFFICIENT_EVIDENCE",
                "is_abstention": True,
                "abstention_reason": "No alterations in the trained 40-gene panel were identified. Precision classification requires relevant genomic biomarkers.",
                "class_probabilities": [
                    {
                        "cancer_code": c,
                        "cancer_name": CANCER_NAME_MAP.get(c, c),
                        "probability": 0.0,
                        "percentage": "0.0%"
                    } for c in self.classes
                ],
                "driving_features_present": [],
                "model_version": self.bundle.get("model_name", "v1.0"),
                "scientific_disclaimer": "Stage, grade, and definitive clinical diagnosis cannot be determined from a mutation list alone. Results are for research and decision-support."
            }

        # Build feature vector
        x = np.zeros((1, len(self.feature_names)), dtype=float)
        for idx, gene in enumerate(self.feature_names):
            if gene in clean_genes:
                x[0, idx] = 1.0

        probs = self.model.predict_proba(x)[0]
        pred_idx = int(np.argmax(probs))
        top_code = self.classes[pred_idx]
        top_prob = float(probs[pred_idx])

        # Confidence level
        if top_prob >= 0.70:
            conf_level = "HIGH"
        elif top_prob >= 0.50:
            conf_level = "MODERATE"
        else:
            conf_level = "LOW"

        # Check uncertainty / high entropy
        is_abstention = False
        abstention_reason = None
        if top_prob < 0.35:
            is_abstention = True
            abstention_reason = "Model confidence is below safe classification threshold. The mutation pattern does not uniquely resolve to a single cancer type."
            conf_level = "UNCERTAIN"

        class_probs = []
        for c, p in zip(self.classes, probs):
            class_probs.append({
                "cancer_code": c,
                "cancer_name": CANCER_NAME_MAP.get(c, c),
                "probability": round(float(p), 4),
                "percentage": f"{p * 100:.1f}%"
            })
        class_probs.sort(key=lambda item: item["probability"], reverse=True)

        return {
            "sample_id": sample_id,
            "predicted_cancer_code": top_code if not is_abstention else None,
            "predicted_cancer_name": CANCER_NAME_MAP.get(top_code, top_code) if not is_abstention else None,
            "confidence_score": round(top_prob, 4),
            "confidence_level": conf_level,
            "is_abstention": is_abstention,
            "abstention_reason": abstention_reason,
            "class_probabilities": class_probs,
            "driving_features_present": driving_features_in_sample,
            "model_version": self.bundle.get("model_name", "v1.0"),
            "scientific_disclaimer": "Genomic classification is based on TCGA PanCancer Atlas mutation signatures. Stage and grade cannot be determined from the submitted mutation file alone. Requires qualified clinical review."
        }
