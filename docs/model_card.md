# ONCOGENIX AI — Model Card

## 1. Model Details

- **Model Name**: ONCOGENIX Cancer Classification Ensemble (`GradientBoostingClassifier`)
- **Version**: 1.0.0
- **Model Type**: Supervised Ensemble of Decision Trees (`sklearn.ensemble.GradientBoostingClassifier`)
- **Training Framework**: scikit-learn 1.9.1, Python 3.14
- **Serialized Artifact**: `ai_service/models/cancer_classifier.joblib`
- **Trained Classes**: `["BRCA", "COADREAD", "LUAD", "PAAD"]`
- **Input Features**: 40 binary indicator variables corresponding to driver gene mutation status.

---

## 2. Intended Use

- **Intended Use**: Research and clinical decision-support to explore tumor mutation signatures and assist bioinformaticians/oncologists in identifying the primary cancer category from molecular assays.
- **Out-of-Scope / Excluded Uses**:
  - Definitive clinical diagnosis without tissue biopsy and pathology.
  - Cancer staging or histological grading (mutation files alone cannot establish stage or grade).
  - Autonomous drug prescription or treatment selection.
  - Analysis of tumor types not included in the training cohort.

---

## 3. Evaluation Protocol & Performance

Evaluation was conducted on a **strictly held-out patient-level test partition (486 patients)** using `StratifiedGroupKFold(n_splits=5)` on `patient_id` with 0% patient leakage.

### Global Metrics

| Model Architecture | Accuracy | Balanced Accuracy | Macro F1-Score | Macro Precision | Macro Recall |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Majority Class Baseline** | 44.4% | 25.0% | 0.1538 | 0.1111 | 0.2500 |
| **Logistic Regression (Balanced)** | 75.7% | 69.5% | 0.6911 | 0.7042 | 0.6953 |
| **Random Forest (200 Trees)** | 78.2% | 71.7% | 0.7252 | 0.7588 | 0.7172 |
| **Gradient Boosting (Selected)** | **78.4%** | **71.4%** | **0.7351** | **0.7732** | **0.7140** |

### Per-Class Test Performance

| Class | Precision | Recall | F1-Score | Support |
| :--- | :--- | :--- | :--- | :--- |
| **BRCA** (Breast) | 76.7% | 95.8% | 85.2% | 216 |
| **COADREAD** (Colorectal) | 88.2% | 68.9% | 77.4% | 119 |
| **LUAD** (Lung) | 77.8% | 61.4% | 68.6% | 114 |
| **PAAD** (Pancreatic) | 66.7% | 59.5% | 62.9% | 37 |

---

## 4. Top Predictive Features

Relative feature importance indicates the molecular markers most influential in class discrimination:

1. **APC (0.3377)**: High-frequency gatekeeper alteration defining colorectal adenocarcinoma.
2. **KRAS (0.1666)**: Highly prevalent in pancreatic and lung adenocarcinomas.
3. **KEAP1 (0.0932)**: Key differentiating factor for lung adenocarcinoma.
4. **PIK3CA (0.0535)**: Predominant in breast invasive carcinoma.
5. **BRAF (0.0416)**: Distinguishes specific colorectal and lung subsets.
6. **EGFR (0.0387)**: Classical hallmark of lung adenocarcinoma.
7. **STK11 (0.0337)**: Specific co-mutational marker in lung adenocarcinoma.

---

## 5. Abstention & Uncertainty Protocol

To prevent erroneous classifications:
- When a patient profile contains **0 mutations** across the 40 driver genes, the classifier **abstains** (`is_abstention = True`), returning `INSUFFICIENT_EVIDENCE`.
- When the maximum posterior probability is below 0.35, the prediction is flagged as `UNCERTAIN`.
