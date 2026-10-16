"""
ONCOGENIX AI - TCGA Data Acquisition Pipeline
Downloads real somatic mutation datasets and clinical sample metadata from cBioPortal
for Lung Adenocarcinoma (LUAD), Pancreatic Adenocarcinoma (PAAD), Colorectal Cancer (COADREAD),
and Breast Invasive Carcinoma (BRCA).
"""

import json
import logging
import os
import sys
import time
from datetime import datetime, timezone
import requests

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("download_tcga_data")

STUDIES = {
    "LUAD": {
        "study_id": "luad_tcga_pan_can_atlas_2018",
        "name": "Lung Adenocarcinoma (TCGA, PanCancer Atlas)",
        "cancer_type": "Lung Adenocarcinoma",
        "molecular_profile_id": "luad_tcga_pan_can_atlas_2018_mutations",
        "sample_list_id": "luad_tcga_pan_can_atlas_2018_all",
    },
    "PAAD": {
        "study_id": "paad_tcga_pan_can_atlas_2018",
        "name": "Pancreatic Adenocarcinoma (TCGA, PanCancer Atlas)",
        "cancer_type": "Pancreatic Adenocarcinoma",
        "molecular_profile_id": "paad_tcga_pan_can_atlas_2018_mutations",
        "sample_list_id": "paad_tcga_pan_can_atlas_2018_all",
    },
    "COADREAD": {
        "study_id": "coadread_tcga_pan_can_atlas_2018",
        "name": "Colorectal Adenocarcinoma (TCGA, PanCancer Atlas)",
        "cancer_type": "Colorectal Adenocarcinoma",
        "molecular_profile_id": "coadread_tcga_pan_can_atlas_2018_mutations",
        "sample_list_id": "coadread_tcga_pan_can_atlas_2018_all",
    },
    "BRCA": {
        "study_id": "brca_tcga_pan_can_atlas_2018",
        "name": "Breast Invasive Carcinoma (TCGA, PanCancer Atlas)",
        "cancer_type": "Breast Invasive Carcinoma",
        "molecular_profile_id": "brca_tcga_pan_can_atlas_2018_mutations",
        "sample_list_id": "brca_tcga_pan_can_atlas_2018_all",
    },
}

# 40 core cancer driver genes across lung, pancreatic, colorectal, and breast malignancies
GENE_ENTREZ_MAP = {
    "KRAS": 3845, "TP53": 7157, "EGFR": 1956, "STK11": 6794, "KEAP1": 9817,
    "BRAF": 673, "PIK3CA": 5290, "SMAD4": 4089, "CDKN2A": 1029, "ARID1A": 8289,
    "APC": 324, "PTEN": 5728, "ERBB2": 2064, "MET": 4233, "ALK": 238,
    "ROS1": 6098, "RET": 5979, "CTNNB1": 1499, "PIK3R1": 5295, "RB1": 5925,
    "BRCA1": 672, "BRCA2": 675, "ATM": 472, "NF1": 4763, "FBXW7": 55294,
    "NOTCH1": 4851, "FGFR1": 2260, "FGFR2": 2263, "FGFR3": 2261, "IDH1": 3417,
    "IDH2": 3418, "CDH1": 999, "GATA3": 2625, "MAP2K1": 5604, "NRAS": 4893,
    "HRAS": 3265, "ERBB3": 2065, "SMARCA4": 6597, "ESR1": 2099, "MTOR": 2475
}

ENTREZ_TO_GENE = {v: k for k, v in GENE_ENTREZ_MAP.items()}

def download_study_samples(study_id: str):
    url = f"https://www.cbioportal.org/api/studies/{study_id}/samples"
    logger.info("Fetching samples from %s ...", url)
    resp = requests.get(url, timeout=30)
    resp.raise_for_status()
    return resp.json()

def download_study_mutations(molecular_profile_id: str, sample_list_id: str, entrez_ids: list):
    url = f"https://www.cbioportal.org/api/molecular-profiles/{molecular_profile_id}/mutations/fetch"
    logger.info("Fetching mutations from %s for %d genes ...", url, len(entrez_ids))
    payload = {
        "sampleListId": sample_list_id,
        "entrezGeneIds": entrez_ids
    }
    resp = requests.post(url, json=payload, timeout=60)
    resp.raise_for_status()
    return resp.json()

def main():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    raw_dir = os.path.join(root_dir, "data", "raw")
    meta_dir = os.path.join(root_dir, "data", "metadata")
    os.makedirs(raw_dir, exist_ok=True)
    os.makedirs(meta_dir, exist_ok=True)

    entrez_ids = list(GENE_ENTREZ_MAP.values())
    manifest = {
        "source": "cBioPortal REST API (https://www.cbioportal.org/api)",
        "download_timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "genome_build": "GRCh37 / hg19 (TCGA PanCancer Atlas)",
        "driver_genes": list(GENE_ENTREZ_MAP.keys()),
        "gene_count": len(GENE_ENTREZ_MAP),
        "studies": {}
    }

    all_samples = []
    all_mutations = []

    for code, info in STUDIES.items():
        logger.info("Processing study %s (%s)...", code, info["study_id"])
        try:
            samples = download_study_samples(info["study_id"])
            mutations = download_study_mutations(
                info["molecular_profile_id"],
                info["sample_list_id"],
                entrez_ids
            )

            # Annotate mutations with HUGO gene symbol and study label
            for mut in mutations:
                entrez_id = mut.get("entrezGeneId")
                mut["geneSymbol"] = ENTREZ_TO_GENE.get(entrez_id, "UNKNOWN")
                mut["cancerLabel"] = code
                mut["cancerName"] = info["cancer_type"]

            # Annotate samples
            for s in samples:
                s["cancerLabel"] = code
                s["cancerName"] = info["cancer_type"]

            all_samples.extend(samples)
            all_mutations.extend(mutations)

            manifest["studies"][code] = {
                "study_id": info["study_id"],
                "cancer_type": info["cancer_type"],
                "sample_count": len(samples),
                "mutation_records": len(mutations)
            }
            logger.info("Study %s: %d samples, %d mutation records in panel.",
                        code, len(samples), len(mutations))

        except Exception as e:
            logger.error("Error fetching study %s: %s", code, e)
            sys.exit(1)

    # Save raw outputs
    samples_path = os.path.join(raw_dir, "tcga_samples.json")
    with open(samples_path, "w", encoding="utf-8") as f:
        json.dump(all_samples, f, indent=2)

    mutations_path = os.path.join(raw_dir, "tcga_mutations.json")
    with open(mutations_path, "w", encoding="utf-8") as f:
        json.dump(all_mutations, f, indent=2)

    manifest["total_samples"] = len(all_samples)
    manifest["total_mutations"] = len(all_mutations)
    manifest_path = os.path.join(meta_dir, "dataset_manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    logger.info("Successfully saved %d samples to %s", len(all_samples), samples_path)
    logger.info("Successfully saved %d mutations to %s", len(all_mutations), mutations_path)
    logger.info("Saved dataset manifest to %s", manifest_path)

if __name__ == "__main__":
    main()
