export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  institution: string;
  is_staff: boolean;
}

export interface ClassProbability {
  cancer_code: string;
  cancer_name: string;
  probability: number;
  percentage: string;
}

export interface CancerPrediction {
  predicted_cancer_code?: string;
  predicted_cancer_name?: string;
  confidence_score: number;
  confidence_level: 'HIGH' | 'MODERATE' | 'LOW' | 'INSUFFICIENT_EVIDENCE' | 'UNCERTAIN';
  is_abstention: boolean;
  abstention_reason?: string;
  class_probabilities: ClassProbability[];
  driving_features_present: string[];
  model_version: string;
  scientific_disclaimer: string;
}

export interface ObservedVariant {
  gene: string;
  chromosome?: string;
  start_position?: number;
  end_position?: number;
  reference_allele?: string;
  alternate_allele?: string;
  variant_classification?: string;
  protein_change?: string;
  sample_id?: string;
  genome_assembly?: string;
}

export interface ClinicalEvidenceMatch {
  gene: string;
  variant: string;
  protein_change?: string;
  chromosome?: string;
  start_position?: string;
  reference_allele?: string;
  alternate_allele?: string;
  genome_assembly: string;
  cancer_context: string;
  molecular_consequence: string;
  evidence_source: string;
  clinical_significance: string;
  evidence_level: string;
  potential_treatment?: string;
  resistance_association?: string;
  contraindications_or_limitations?: string;
  evidence_date: string;
  citation_id: string;
  match_type: string;
}

export interface AnalysisSummary {
  id: string;
  sample_id: string;
  patient_identifier?: string;
  file_name?: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  validation_status: string;
  total_variants: number;
  distinct_genes_count: number;
  top_prediction: string;
  confidence: number;
  created_at: string;
}

export interface AnalysisDetail extends AnalysisSummary {
  genome_assembly: string;
  analysis_type: string;
  mutated_genes: string[];
  variant_categories: Record<string, number>;
  observed_variants: ObservedVariant[];
  evidence_matches: ClinicalEvidenceMatch[];
  cancer_prediction: CancerPrediction;
  validation_notes: string[];
  pdf_report_path?: string;
  error_message?: string;
}

export interface PatientComparison {
  sample_a_id: string;
  sample_b_id: string;
  shared_genes: string[];
  unique_genes_a: string[];
  unique_genes_b: string[];
  shared_variants: ObservedVariant[];
  unique_variants_a: ObservedVariant[];
  unique_variants_b: ObservedVariant[];
  jaccard_similarity: number;
  category_comparison: Record<string, Record<string, number>>;
  evidence_comparison: {
    sample_a_treatments: string[];
    sample_b_treatments: string[];
    shared_treatment_options: string[];
    unique_treatment_options_a: string[];
    unique_treatment_options_b: string[];
  };
  scientific_guidance: string;
}

export interface ModelInfo {
  available: boolean;
  model_name?: string;
  classes?: string[];
  cancer_names?: Record<string, string>;
  feature_count?: number;
  features?: string[];
  dataset_provenance?: string;
  genome_assembly?: string;
  evaluation_metrics?: any;
  baseline_comparison?: any;
  top_features?: [string, number][];
}
