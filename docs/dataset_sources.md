# ONCOGENIX AI — Dataset Sources & Data Provenance

## 1. Public Research Datasets

ONCOGENIX AI models are trained exclusively on authentic, documented somatic mutation datasets and clinical sample metadata from the **TCGA PanCancer Atlas (Cell 2018)** retrieved via official REST APIs from **cBioPortal for Cancer Genomics** (https://www.cbioportal.org/api).

### Primary Cohorts

| Cancer Category | Study Identifier | Cancer Type | Total Samples | Somatic Mutations in Panel |
| :--- | :--- | :--- | :--- | :--- |
| **LUAD** | `luad_tcga_pan_can_atlas_2018` | Lung Adenocarcinoma | 566 | 1,549 |
| **PAAD** | `paad_tcga_pan_can_atlas_2018` | Pancreatic Adenocarcinoma | 184 | 427 |
| **COADREAD** | `coadread_tcga_pan_can_atlas_2018` | Colorectal Adenocarcinoma | 594 | 2,627 |
| **BRCA** | `brca_tcga_pan_can_atlas_2018` | Breast Invasive Carcinoma | 1,084 | 1,597 |
| **Total** | | | **2,428** | **6,200** |

- **Genome Build**: GRCh37 / hg19 (TCGA PanCancer Atlas standard coordinates).
- **Download Date**: October 2026.
- **License**: Public Domain (NIH/NCI Open Genomic Data Commons & cBioPortal Terms of Access).

---

## 2. Genomic Driver Panel (40 Genes)

The model features are defined over a curated panel of 40 validated driver genes frequently altered across thoracic, gastrointestinal, pancreatic, and breast malignancies:

`KRAS`, `TP53`, `EGFR`, `STK11`, `KEAP1`, `BRAF`, `PIK3CA`, `SMAD4`, `CDKN2A`, `ARID1A`, `APC`, `PTEN`, `ERBB2`, `MET`, `ALK`, `ROS1`, `RET`, `CTNNB1`, `PIK3R1`, `RB1`, `BRCA1`, `BRCA2`, `ATM`, `NF1`, `FBXW7`, `NOTCH1`, `FGFR1`, `FGFR2`, `FGFR3`, `IDH1`, `IDH2`, `CDH1`, `GATA3`, `MAP2K1`, `NRAS`, `HRAS`, `ERBB3`, `SMARCA4`, `ESR1`, `MTOR`.

---

## 3. Clinical Evidence Sources

Clinical evidence matching is powered by curated records from:
1. **CIViC (Clinical Interpretation of Variants in Cancer)**: https://civicdb.org/
   - Open-access community resource for clinical variant interpretation.
2. **NCBI ClinVar**: https://www.ncbi.nlm.nih.gov/clinvar/
   - Public archive of relationships between genomic variants and human phenotypes.
3. **FDA & NCCN Biomarker Guidelines**:
   - Compendia of approved companion diagnostics and targeted therapeutics (e.g. Sotorasib, Adagrasib, Osimertinib, Alpelisib, Olaparib, Trastuzumab Deruxtecan).

---

## 4. Reproducible Data Pipeline

The data acquisition and feature generation pipelines are fully automated and version-controlled:
- `ml/download_tcga_data.py`: Connects to cBioPortal REST API, pulls all sample and mutation records, and creates `data/metadata/dataset_manifest.json`.
- `ml/build_evidence_db.py`: Compiles verified clinical evidence into `data/reference/clinical_evidence.csv`.
- `ml/preprocess_pipeline.py`: Aggregates samples to patient level, constructs the 40-feature binary matrix, and performs grouped splitting with zero patient leakage.
