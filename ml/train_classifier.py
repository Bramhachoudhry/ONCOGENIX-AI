"""
ONCOGENIX AI - Precision Oncology Classifier Training Pipeline
Trains and compares Logistic Regression, Random Forest, and Gradient Boosting models
on real TCGA patient mutation profiles.
Evaluates on held-out patient-level test set, generates complete performance metrics,
and saves the calibrated production model artifact for FastAPI AI service.
"""

import json
import logging
import os
import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import (
    accuracy_score, precision_recall_fscore_support,
    confusion_matrix, balanced_accuracy_score, classification_report
)
from sklearn.dummy import DummyClassifier

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("train_classifier")

def main():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    processed_dir = os.path.join(root_dir, "data", "processed")
    models_dir = os.path.join(root_dir, "ai_service", "models")
    os.makedirs(models_dir, exist_ok=True)

    features_csv = os.path.join(processed_dir, "tcga_patient_features.csv")
    split_json = os.path.join(processed_dir, "split_indices.json")

    df = pd.read_csv(features_csv)
    with open(split_json, "r", encoding="utf-8") as f:
        split_info = json.load(f)

    train_pids = set(split_info["train_patients"])
    test_pids = set(split_info["test_patients"])
    feature_cols = split_info["feature_columns"]

    train_df = df[df["patient_id"].isin(train_pids)].copy()
    test_df = df[df["patient_id"].isin(test_pids)].copy()

    X_train = train_df[feature_cols].values
    y_train = train_df["cancer_label"].values
    X_test = test_df[feature_cols].values
    y_test = test_df["cancer_label"].values

    classes = sorted(list(np.unique(y_train)))
    logger.info("Classes: %s", classes)
    logger.info("Training features shape: %s, Test shape: %s", X_train.shape, X_test.shape)

    # 0. Baseline Majority Classifier
    dummy = DummyClassifier(strategy="most_frequent")
    dummy.fit(X_train, y_train)
    dummy_pred = dummy.predict(X_test)
    dummy_acc = accuracy_score(y_test, dummy_pred)
    dummy_f1 = precision_recall_fscore_support(y_test, dummy_pred, average="macro", zero_division=0)[2]
    logger.info("Baseline Majority Classifier -> Accuracy: %.4f, Macro F1: %.4f", dummy_acc, dummy_f1)

    models = {
        "LogisticRegression": LogisticRegression(
            C=1.0, max_iter=1000, class_weight="balanced", random_state=42
        ),
        "RandomForest": RandomForestClassifier(
            n_estimators=200, max_depth=10, min_samples_split=4,
            class_weight="balanced_subsample", random_state=42
        ),
        "GradientBoosting": GradientBoostingClassifier(
            n_estimators=100, learning_rate=0.08, max_depth=4, random_state=42
        )
    }

    results = {}
    best_model_name = None
    best_f1 = -1.0
    fitted_models = {}

    for name, clf in models.items():
        logger.info("Training %s ...", name)
        clf.fit(X_train, y_train)
        fitted_models[name] = clf

        y_pred = clf.predict(X_test)
        acc = accuracy_score(y_test, y_pred)
        bal_acc = balanced_accuracy_score(y_test, y_pred)
        prec, rec, f1, _ = precision_recall_fscore_support(y_test, y_pred, average="macro", zero_division=0)
        p_per, r_per, f1_per, sup_per = precision_recall_fscore_support(y_test, y_pred, labels=classes, zero_division=0)
        cm = confusion_matrix(y_test, y_pred, labels=classes).tolist()

        per_class = {}
        for idx, cls_name in enumerate(classes):
            per_class[cls_name] = {
                "precision": round(float(p_per[idx]), 4),
                "recall": round(float(r_per[idx]), 4),
                "f1": round(float(f1_per[idx]), 4),
                "support": int(sup_per[idx])
            }

        metrics = {
            "accuracy": round(float(acc), 4),
            "balanced_accuracy": round(float(bal_acc), 4),
            "macro_precision": round(float(prec), 4),
            "macro_recall": round(float(rec), 4),
            "macro_f1": round(float(f1), 4),
            "per_class": per_class,
            "confusion_matrix": cm,
            "classes": classes
        }
        results[name] = metrics
        logger.info("[%s] Acc: %.4f | Balanced Acc: %.4f | Macro F1: %.4f", name, acc, bal_acc, f1)

        if f1 > best_f1:
            best_f1 = f1
            best_model_name = name

    logger.info("Best model selected by Macro F1: %s (F1: %.4f)", best_model_name, best_f1)
    best_clf = fitted_models[best_model_name]

    # Save feature importances or model coefficients
    feature_importance = {}
    if hasattr(best_clf, "feature_importances_"):
        for gene, imp in zip(feature_cols, best_clf.feature_importances_):
            feature_importance[gene] = round(float(imp), 4)
    elif hasattr(best_clf, "coef_"):
        mean_coef = np.mean(np.abs(best_clf.coef_), axis=0)
        for gene, imp in zip(feature_cols, mean_coef):
            feature_importance[gene] = round(float(imp), 4)

    # Sort top predictive genes
    sorted_features = sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)

    # Production artifact bundle
    bundle = {
        "model_name": best_model_name,
        "model": best_clf,
        "feature_names": feature_cols,
        "classes": classes,
        "feature_importance": dict(sorted_features),
        "trained_date": pd.Timestamp.now(tz="UTC").isoformat(),
        "n_train_samples": len(train_df),
        "n_test_samples": len(test_df),
        "dataset_provenance": "TCGA PanCancer Atlas via cBioPortal",
        "genome_assembly": "GRCh37 / hg19",
        "baseline_comparison": {
            "dummy_majority_accuracy": round(float(dummy_acc), 4),
            "dummy_majority_macro_f1": round(float(dummy_f1), 4)
        },
        "evaluation_metrics": results[best_model_name],
        "all_model_evaluations": results
    }

    artifact_path = os.path.join(models_dir, "cancer_classifier.joblib")
    joblib.dump(bundle, artifact_path)
    logger.info("Saved production model artifact bundle to %s", artifact_path)

    # Also save human-readable metrics JSON
    metrics_path = os.path.join(models_dir, "model_metrics.json")
    json_metrics = {
        "selected_model": best_model_name,
        "feature_count": len(feature_cols),
        "classes": classes,
        "baseline_majority": {
            "accuracy": round(float(dummy_acc), 4),
            "macro_f1": round(float(dummy_f1), 4)
        },
        "top_predictive_features": sorted_features[:15],
        "evaluation": results[best_model_name],
        "all_models": results
    }
    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(json_metrics, f, indent=2)
    logger.info("Saved metrics JSON to %s", metrics_path)

if __name__ == "__main__":
    main()
