# ONCOGENIX AI — Privacy & Security Architecture

## 1. Genomic Data Protection Principles

Genomic data is uniquely identifying and sensitive. ONCOGENIX AI incorporates data protection from the ground up:

1. **De-Identification by Default**:
   - Patient names, social security numbers, medical record numbers, or real identities are never used as model features or stored in genomic tables.
   - Pseudonymous sample identifiers (e.g. `SAMPLE-LUAD-001`, `PT-8294`) are strictly enforced.

2. **Patient Data Isolation**:
   - Every genomic analysis, raw assay file, and generated PDF report is linked strictly to the authenticated `User` account via Django ORM foreign keys.
   - Access attempts to view, modify, or delete another patient's records return `404 Not Found` (or `403 Forbidden`) to avoid leaking the existence of patient records.

3. **Secure File Deletion**:
   - When a user deletes an analysis record from the history view, the backend automatically deletes the physical file from Firebase Cloud Storage or local disk storage.

4. **Credential Isolation**:
   - All credentials (Django secret key, Firebase service account credentials, database passwords) are stored exclusively in `.env` and excluded via `.gitignore`.
   - No private keys or service account credentials are sent to the frontend.

5. **Local AI Inference Boundary**:
   - Inference and evidence matching are executed internally by the self-hosted FastAPI service without sending genomic payloads to third-party public commercial APIs.
