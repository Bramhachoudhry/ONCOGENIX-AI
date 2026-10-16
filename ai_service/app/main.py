"""
ONCOGENIX AI - FastAPI Inference Microservice
Provides high-performance precision oncology model inference,
genomic parsing, cancer classification, and clinical evidence matching.
"""

import logging
import os
import time
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Request, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from ai_service.app.schemas import (
    MutationAnalysisRequest, PredictionRequest, CancerPredictionResponse,
    MutationSummaryResponse, PatientComparisonRequest, PatientComparisonResponse
)
from ai_service.preprocessing.parser import parse_raw_mutation_content
from ai_service.preprocessing.validator import validate_and_filter_variants
from ai_service.inference.predictor import CancerClassifierService
from ai_service.inference.evidence_matcher import ClinicalEvidenceMatcher
from ai_service.inference.comparator import compare_patient_profiles

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("ai_service")

app = FastAPI(
    title="ONCOGENIX AI - Inference Service",
    description="Precision Oncology AI API: DNA mutation detection, cancer classification, and clinical evidence retrieval.",
    version="1.0.0"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Singletons for model and evidence matching
predictor = CancerClassifierService()
evidence_matcher = ClinicalEvidenceMatcher()

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = f"{process_time:.4f}s"
    return response

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "ONCOGENIX AI Inference Engine",
        "model_loaded": predictor.is_available(),
        "model_name": predictor.bundle.get("model_name") if predictor.is_available() else None,
        "evidence_records_count": len(evidence_matcher.evidence_records),
        "timestamp": time.time()
    }

@app.get("/model/info")
def get_model_info():
    info = predictor.get_model_info()
    if not info.get("available"):
        raise HTTPException(status_code=503, detail="Classification model artifact is not loaded.")
    return info

@app.post("/predict/cancer", response_model=CancerPredictionResponse)
def predict_cancer(req: PredictionRequest):
    if not predictor.is_available():
        raise HTTPException(
            status_code=503,
            detail="Cancer classification model is currently unavailable. Ensure the model has been trained and saved."
        )

    genes = req.genes_mutated or []
    if req.variants:
        genes.extend([v.gene for v in req.variants if v.gene])

    try:
        result = predictor.predict(genes, sample_id=req.sample_id or "SAMPLE")
        return result
    except Exception as e:
        logger.error("Inference failure: %s", e)
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

@app.post("/analyze/mutations")
async def analyze_mutations(req: MutationAnalysisRequest):
    raw_content = req.raw_content or ""
    variants_input = req.variants

    raw_records = []
    notes = []

    if raw_content:
        parsed_recs, parse_notes = parse_raw_mutation_content(raw_content, file_format=req.file_format or "csv")
        raw_records.extend(parsed_recs)
        notes.extend(parse_notes)
    elif variants_input:
        for v in variants_input:
            raw_records.append(v.model_dump(by_alias=False))
        notes.append(f"Received {len(raw_records)} structured variant objects.")
    else:
        raise HTTPException(status_code=400, detail="Either raw_content string or structured variants list must be provided.")

    valid_variants, rejected, val_notes = validate_and_filter_variants(
        raw_records, expected_assembly=req.genome_assembly or "GRCh37"
    )
    notes.extend(val_notes)

    # Mutation patterns
    mutated_genes = sorted(list(set(v["gene"] for v in valid_variants)))
    categories = {}
    for v in valid_variants:
        cat = v.get("variant_classification") or "Unknown"
        categories[cat] = categories.get(cat, 0) + 1

    # Clinical evidence matching
    evidence_matches = evidence_matcher.match_all_variants(valid_variants)

    # Optional cancer classification
    prediction_result = None
    if predictor.is_available():
        prediction_result = predictor.predict(mutated_genes, sample_id=req.sample_id or "UNKNOWN")

    severity_notice = (
        "Scientific Notice: Mutation count does not equal cancer severity or clinical stage. "
        "Stage and grade cannot be determined from the submitted mutation file alone. "
        "All biomarker findings require qualified clinical oncologist evaluation."
    )

    return {
        "sample_id": req.sample_id or "UNKNOWN",
        "genome_assembly": req.genome_assembly or "GRCh37",
        "validation_status": "PASSED" if valid_variants else "FAILED",
        "total_records_received": len(raw_records),
        "valid_variants_processed": len(valid_variants),
        "rejected_rows_count": len(rejected),
        "rejected_rows": rejected[:10],
        "validation_notes": notes,
        "distinct_mutated_genes_count": len(mutated_genes),
        "mutated_genes": mutated_genes,
        "variant_categories": categories,
        "observed_variants": valid_variants,
        "evidence_matches": evidence_matches,
        "cancer_prediction": prediction_result,
        "severity_notice": severity_notice
    }

@app.post("/compare/mutations", response_model=PatientComparisonResponse)
def compare_mutations(req: PatientComparisonRequest):
    # Process Patient A
    recs_a = []
    if req.sample_a_content:
        recs_a, _ = parse_raw_mutation_content(req.sample_a_content)
    elif req.sample_a_variants:
        recs_a = [v.model_dump(by_alias=False) for v in req.sample_a_variants]

    valid_a, _, _ = validate_and_filter_variants(recs_a)
    ev_a = evidence_matcher.match_all_variants(valid_a)

    # Process Patient B
    recs_b = []
    if req.sample_b_content:
        recs_b, _ = parse_raw_mutation_content(req.sample_b_content)
    elif req.sample_b_variants:
        recs_b = [v.model_dump(by_alias=False) for v in req.sample_b_variants]

    valid_b, _, _ = validate_and_filter_variants(recs_b)
    ev_b = evidence_matcher.match_all_variants(valid_b)

    comparison = compare_patient_profiles(
        sample_a_id=req.sample_a_id or "Patient_A",
        variants_a=valid_a,
        evidence_a=ev_a,
        sample_b_id=req.sample_b_id or "Patient_B",
        variants_b=valid_b,
        evidence_b=ev_b
    )
    return comparison
