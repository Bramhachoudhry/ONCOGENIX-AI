"""
ONCOGENIX AI - Genomic Preprocessing Pipeline
Transforms raw TCGA mutations and sample metadata into a patient-by-gene binary matrix.
Performs patient-level stratified train/test split to guarantee zero data leakage.
"""

import json
import logging
import os
import numpy as np
import pandas as pd
from sklearn.model_selection import StratifiedGroupKFold

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("preprocess_pipeline")

def main():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    raw_dir = os.path.join(root_dir, "data", "raw")
    processed_dir = os.path.join(root_dir, "data", "processed")
    meta_dir = os.path.join(root_dir, "data", "metadata")
    os.makedirs(processed_dir, exist_ok=True)

    samples_path = os.path.join(raw_dir, "tcga_samples.json")
    mutations_path = os.path.join(raw_dir, "tcga_mutations.json")
    manifest_path = os.path.join(meta_dir, "dataset_manifest.json")

    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)
    driver_genes = manifest["driver_genes"]

    with open(samples_path, "r", encoding="utf-8") as f:
        raw_samples = json.load(f)

    with open(mutations_path, "r", encoding="utf-8") as f:
        raw_mutations = json.load(f)

    logger.info("Loaded %d raw samples and %d raw mutation records.", len(raw_samples), len(raw_mutations))

    # Map sampleId -> sample metadata (patientId, cancerLabel, cancerName)
    sample_meta = {}
    for s in raw_samples:
        sid = s["sampleId"]
        pid = s.get("patientId") or sid.split("-")[0] + "-" + sid.split("-")[1] + "-" + sid.split("-")[2]
        sample_meta[sid] = {
            "sample_id": sid,
            "patient_id": pid,
            "cancer_label": s["cancerLabel"],
            "cancer_name": s["cancerName"]
        }

    # Map patientId -> {gene: count, mutations: list}
    # Group by patientId to ensure each row represents one biological patient
    patients = {}
    for s in raw_samples:
        pid = s.get("patientId") or s["sampleId"][:12]
        label = s["cancerLabel"]
        name = s["cancerName"]
        if pid not in patients:
            patients[pid] = {
                "patient_id": pid,
                "cancer_label": label,
                "cancer_name": name,
                "samples": set(),
                "mutated_genes": set(),
                "mutation_details": []
            }
        patients[pid]["samples"].add(s["sampleId"])

    for m in raw_mutations:
        sid = m.get("sampleId")
        pid = m.get("patientId")
        if not pid and sid:
            pid = sid[:12] if len(sid) >= 12 else sid

        gene = m.get("geneSymbol")
        if pid in patients and gene in driver_genes:
            patients[pid]["mutated_genes"].add(gene)
            patients[pid]["mutation_details"].append({
                "gene": gene,
                "protein_change": m.get("proteinChange"),
                "mutation_type": m.get("mutationType"),
                "chr": m.get("chr"),
                "start": m.get("startPosition"),
                "ref": m.get("referenceAllele"),
                "alt": m.get("variantAllele")
            })

    # Build DataFrame
    records = []
    for pid, pdata in patients.items():
        row = {
            "patient_id": pid,
            "cancer_label": pdata["cancer_label"],
            "cancer_name": pdata["cancer_name"],
            "total_mutations_in_panel": len(pdata["mutation_details"]),
            "distinct_mutated_genes_count": len(pdata["mutated_genes"]),
            "sample_count": len(pdata["samples"])
        }
        # Binary gene indicators
        for gene in driver_genes:
            row[gene] = 1 if gene in pdata["mutated_genes"] else 0
        records.append(row)

    df = pd.DataFrame(records)
    logger.info("Created patient matrix with shape: %s", df.shape)
    logger.info("Class distribution:\n%s", df["cancer_label"].value_counts())

    # Filter out patients with zero mutations in panel if desired or keep them to represent wildtype profiles
    # Keeping all authentic patients gives real baseline class priors
    features_csv = os.path.join(processed_dir, "tcga_patient_features.csv")
    df.to_csv(features_csv, index=False)
    logger.info("Saved patient feature table to %s", features_csv)

    # Perform stratified patient-level train/test split (80% train, 20% test)
    # Using StratifiedGroupKFold on patient_id ensures no patient leakage
    sgkf = StratifiedGroupKFold(n_splits=5, shuffle=True, random_state=42)
    X_dummy = np.zeros(len(df))
    y = df["cancer_label"].values
    groups = df["patient_id"].values

    train_idx, test_idx = next(sgkf.split(X_dummy, y, groups))

    train_pids = df.iloc[train_idx]["patient_id"].tolist()
    test_pids = df.iloc[test_idx]["patient_id"].tolist()

    # Verify zero overlap between train and test patients
    overlap = set(train_pids).intersection(set(test_pids))
    assert len(overlap) == 0, f"Critical error: Data leakage detected! Overlap: {overlap}"

    split_info = {
        "random_state": 42,
        "n_train": len(train_idx),
        "n_test": len(test_idx),
        "train_patients": train_pids,
        "test_patients": test_pids,
        "train_distribution": df.iloc[train_idx]["cancer_label"].value_counts().to_dict(),
        "test_distribution": df.iloc[test_idx]["cancer_label"].value_counts().to_dict(),
        "feature_columns": driver_genes
    }

    split_json = os.path.join(processed_dir, "split_indices.json")
    with open(split_json, "w", encoding="utf-8") as f:
        json.dump(split_info, f, indent=2)

    logger.info("Verified patient-level split: %d train, %d test. Overlap: 0. Saved to %s",
                len(train_idx), len(test_idx), split_json)

if __name__ == "__main__":
    main()
