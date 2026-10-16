"""
ONCOGENIX AI - Pydantic Request & Response Schemas
Provides strict validation for genomic inputs, classification inference,
mutation pattern analysis, and patient profile comparisons.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class VariantRecord(BaseModel):
    gene: str = Field(..., alias="Hugo_Symbol", description="Hugo gene symbol")
    chromosome: Optional[str] = Field(None, alias="Chromosome")
    start_position: Optional[int] = Field(None, alias="Start_Position")
    end_position: Optional[int] = Field(None, alias="End_Position")
    reference_allele: Optional[str] = Field(None, alias="Reference_Allele")
    alternate_allele: Optional[str] = Field(None, alias="Tumor_Seq_Allele2")
    variant_classification: Optional[str] = Field(None, alias="Variant_Classification")
    protein_change: Optional[str] = Field(None, alias="HGVSp_Short")
    sample_id: Optional[str] = Field(None, alias="Tumor_Sample_Barcode")
    genome_assembly: Optional[str] = Field("GRCh37", alias="NCBI_Build")

    class Config:
        populate_by_name = True

class MutationAnalysisRequest(BaseModel):
    sample_id: Optional[str] = "UNKNOWN-SAMPLE"
    genome_assembly: Optional[str] = "GRCh37"
    raw_content: Optional[str] = None
    file_format: Optional[str] = "csv" # csv, tsv, maf, json
    variants: Optional[List[VariantRecord]] = None

class PredictionRequest(BaseModel):
    sample_id: Optional[str] = "SAMPLE"
    genes_mutated: Optional[List[str]] = None
    variants: Optional[List[VariantRecord]] = None

class CancerClassProbability(BaseModel):
    cancer_code: str
    cancer_name: str
    probability: float
    percentage: str

class CancerPredictionResponse(BaseModel):
    sample_id: str
    predicted_cancer_code: Optional[str]
    predicted_cancer_name: Optional[str]
    confidence_score: float
    confidence_level: str # HIGH, MODERATE, LOW, INSUFFICIENT_EVIDENCE
    is_abstention: bool
    abstention_reason: Optional[str] = None
    class_probabilities: List[CancerClassProbability]
    driving_features_present: List[str]
    model_version: str
    scientific_disclaimer: str

class ClinicalEvidenceMatch(BaseModel):
    gene: str
    variant: str
    protein_change: Optional[str]
    chromosome: Optional[str]
    start_position: Optional[str]
    reference_allele: Optional[str]
    alternate_allele: Optional[str]
    genome_assembly: str
    cancer_context: str
    molecular_consequence: str
    evidence_source: str
    clinical_significance: str
    evidence_level: str
    potential_treatment: Optional[str]
    resistance_association: Optional[str]
    contraindications_or_limitations: Optional[str]
    evidence_date: str
    citation_id: str
    match_type: str # exact_variant, protein_change, gene_level

class MutationSummaryResponse(BaseModel):
    sample_id: str
    genome_assembly: str
    validation_status: str
    total_records_received: int
    valid_variants_processed: int
    rejected_rows_count: int
    validation_notes: List[str]
    distinct_mutated_genes_count: int
    mutated_genes: List[str]
    variant_categories: Dict[str, int]
    observed_variants: List[Dict[str, Any]]
    evidence_matches: List[ClinicalEvidenceMatch]
    severity_notice: str

class PatientComparisonRequest(BaseModel):
    sample_a_id: Optional[str] = "Patient_A"
    sample_a_content: Optional[str] = None
    sample_a_variants: Optional[List[VariantRecord]] = None
    sample_b_id: Optional[str] = "Patient_B"
    sample_b_content: Optional[str] = None
    sample_b_variants: Optional[List[VariantRecord]] = None

class PatientComparisonResponse(BaseModel):
    sample_a_id: str
    sample_b_id: str
    shared_genes: List[str]
    unique_genes_a: List[str]
    unique_genes_b: List[str]
    shared_variants: List[Dict[str, Any]]
    unique_variants_a: List[Dict[str, Any]]
    unique_variants_b: List[Dict[str, Any]]
    jaccard_similarity: float
    category_comparison: Dict[str, Dict[str, int]]
    evidence_comparison: Dict[str, Any]
    scientific_guidance: str
