# ONCOGENIX AI — Scientific Limitations & Clinical Boundaries

## 1. Clear Clinical Scope

ONCOGENIX AI is strictly an **investigational research and clinical decision-support prototype**. It is NOT an autonomous medical diagnostic device and has NOT been approved by the FDA or EMA as a primary diagnostic tool.

---

## 2. Core Scientific Truths

1. **Mutation Count ≠ Cancer Severity**:
   - A sample with 15 detected somatic mutations is not inherently more severe, advanced, or aggressive than a sample with 2 driver mutations.
   - For example, high tumor mutational burden (TMB) often predicts superior response to immune checkpoint blockade in certain solid tumors rather than poor prognosis.

2. **Stage and Grade Cannot Be Determined From Mutations Alone**:
   - Anatomical cancer stage (TNM: Tumor size, Nodal involvement, distant Metastasis) is determined by surgical pathology and radiological imaging (CT, PET-CT, MRI).
   - Histological tumor grade requires microscopic examination of cellular differentiation by a qualified pathologist.
   - If a submitted mutation file lacks staging metadata, the platform displays:
     > *"Stage and grade cannot be determined from the submitted mutation file alone."*

3. **No Autonomous Prescriptions**:
   - The platform never issues prescriptions or instructs a patient to start, stop, or adjust medication dosages.
   - Therapeutic associations displayed in evidence tables represent documented scientific literature (CIViC, ClinVar, FDA labels) and must be synthesized by a licensed oncologist considering organ function, comorbidities, and performance status.

4. **Specific Cohort Scope**:
   - The multiclass classifier is trained on four verified TCGA PanCancer Atlas cohorts: **Lung Adenocarcinoma (LUAD)**, **Pancreatic Adenocarcinoma (PAAD)**, **Colorectal Adenocarcinoma (COADREAD)**, and **Breast Invasive Carcinoma (BRCA)**.
   - The system does not claim to detect every human cancer or classify tumors outside its validated training domains.
