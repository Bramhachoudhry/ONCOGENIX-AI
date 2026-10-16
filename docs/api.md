# ONCOGENIX AI — API Specification

The platform consists of two coordinated services:
1. **Django REST Framework (Port 8000)**: Authentication, User Profiles, Analysis Orchestration, PDF Generation, and Cloud Storage.
2. **FastAPI AI Service (Port 8001)**: High-speed ML inference, genomic validation, and clinical evidence matching.

---

## 1. Django REST Framework Endpoints

### Authentication
- `POST /api/auth/register/`
  - Body: `{ username, email, password, confirm_password, role, institution }`
  - Response (201): `{ token, user: { id, username, email, role }, message }`
- `POST /api/auth/login/`
  - Body: `{ username_or_email, password }`
  - Response (200): `{ token, user, message }`
- `POST /api/auth/logout/`
  - Headers: `Authorization: Token <token>`
  - Response (200): `{ message }`
- `GET /api/auth/me/`
  - Headers: `Authorization: Token <token>`
  - Response (200): `User` object

### Dashboard & Analyses
- `GET /api/dashboard/`
  - Returns authenticated user's analysis count, recent analyses, model status, and assayed mutations.
- `GET /api/analyses/`
  - Returns list of analyses owned by the authenticated user.
- `POST /api/analyses/`
  - MultiPart/JSON Body: `{ sample_id, patient_identifier, genome_assembly, analysis_type, file_format, file | raw_content }`
  - Response (201): Complete `AnalysisDetail` object with prediction, observed variants, and evidence matches.
- `GET /api/analyses/{id}/`
  - Returns full analysis detail. Enforces ownership check (404 on cross-user access).
- `DELETE /api/analyses/{id}/`
  - Permanently deletes analysis and its associated storage files.
- `GET /api/analyses/{id}/report/`
  - Returns generated clinical PDF report with `Content-Type: application/pdf`.
- `POST /api/analyses/compare/`
  - Body: `{ name_a, name_b, analysis_a_id?, raw_content_a?, analysis_b_id?, raw_content_b? }`
  - Returns genomic intersection, unique variants, and differential therapies.
- `GET /api/models/`
  - Returns active model metadata, accuracy, and feature importances.
- `GET /api/datasets/`
  - Returns TCGA dataset manifest and cohort metrics.
- `GET /api/health/`
  - Returns backend health and FastAPI connection status.

---

## 2. FastAPI AI Inference Service Endpoints

- `GET /health`
  - Returns: `{ status: "healthy", model_loaded: bool, model_name: str, evidence_records_count: int }`
- `GET /model/info`
  - Returns model architecture, classes, 40 features, and test metrics.
- `POST /predict/cancer`
  - Body: `{ sample_id, genes_mutated: [str], variants: [VariantRecord]? }`
  - Returns: `CancerPredictionResponse` with calibrated probabilities, confidence level, driving features, and abstention status.
- `POST /analyze/mutations`
  - Body: `{ sample_id, genome_assembly, file_format, raw_content?, variants? }`
  - Returns: Validation results, parsed variants, mutated genes, evidence matches, and ML prediction.
- `POST /compare/mutations`
  - Body: `{ sample_a_id, sample_a_content?, sample_b_id, sample_b_content? }`
  - Returns: Shared genes, unique genes, Jaccard similarity, and differential clinical evidence.
