"""
ONCOGENIX AI - Database Seeder
Seeds standard clinician demo account and sample completed analyses for immediate evaluation.
"""

import os
import sys
import django

# Setup Django environment
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth.models import User
from accounts.models import UserProfile
from analyses.models import Analysis
from analyses.report_generator import generate_patient_pdf_report
from storage.firebase_storage import storage_service

def seed():
    # 1. Create Demo Clinician
    demo_user, created = User.objects.get_or_create(
        username="demooncologist",
        defaults={
            "email": "demooncologist@oncogenix.ai",
            "first_name": "Dr. Sarah",
            "last_name": "Chen"
        }
    )
    demo_user.set_password("Password123!")
    demo_user.is_staff = True
    demo_user.save()

    profile = demo_user.profile
    profile.role = "oncologist"
    profile.institution = "Dana-Farber / Memorial Precision Oncology"
    profile.save()
    print("Demo user created: demooncologist / Password123!")

    # 2. Seed a completed LUAD analysis
    if not Analysis.objects.filter(user=demo_user, sample_id="TCGA-LUAD-SAMPLE-01").exists():
        luad_analysis = Analysis.objects.create(
            user=demo_user,
            sample_id="TCGA-LUAD-SAMPLE-01",
            patient_identifier="PT-LUAD-9421",
            file_name="sample_a_variants.csv",
            file_format="csv",
            genome_assembly="GRCh37",
            status="COMPLETED",
            validation_status="PASSED",
            total_variants=5,
            distinct_genes_count=5,
            mutated_genes=["KRAS", "TP53", "STK11", "KEAP1", "EGFR"],
            variant_categories={"Missense_Mutation": 4, "Nonsense_Mutation": 1},
            cancer_prediction={
                "predicted_cancer_code": "LUAD",
                "predicted_cancer_name": "Lung Adenocarcinoma",
                "confidence_score": 0.842,
                "confidence_level": "HIGH",
                "is_abstention": False,
                "class_probabilities": [
                    {"cancer_code": "LUAD", "cancer_name": "Lung Adenocarcinoma", "probability": 0.842, "percentage": "84.2%"},
                    {"cancer_code": "PAAD", "cancer_name": "Pancreatic Adenocarcinoma", "probability": 0.098, "percentage": "9.8%"},
                    {"cancer_code": "COADREAD", "cancer_name": "Colorectal Adenocarcinoma", "probability": 0.045, "percentage": "4.5%"},
                    {"cancer_code": "BRCA", "cancer_name": "Breast Invasive Carcinoma", "probability": 0.015, "percentage": "1.5%"}
                ],
                "driving_features_present": ["KRAS", "STK11", "KEAP1", "EGFR"],
                "model_version": "GradientBoostingClassifier (TCGA v1.0)",
                "scientific_disclaimer": "Stage and grade cannot be determined from mutation files alone."
            },
            observed_variants=[
                {"gene": "KRAS", "protein_change": "p.G12C", "chromosome": "chr12", "start_position": 25398284, "reference_allele": "C", "alternate_allele": "A", "variant_classification": "Missense_Mutation", "genome_assembly": "GRCh37"},
                {"gene": "TP53", "protein_change": "p.R248W", "chromosome": "chr17", "start_position": 7577538, "reference_allele": "C", "alternate_allele": "T", "variant_classification": "Missense_Mutation", "genome_assembly": "GRCh37"},
                {"gene": "STK11", "protein_change": "p.Q37*", "chromosome": "chr19", "start_position": 1207062, "reference_allele": "C", "alternate_allele": "T", "variant_classification": "Nonsense_Mutation", "genome_assembly": "GRCh37"},
                {"gene": "KEAP1", "protein_change": "p.R320W", "chromosome": "chr19", "start_position": 10599547, "reference_allele": "C", "alternate_allele": "T", "variant_classification": "Missense_Mutation", "genome_assembly": "GRCh37"},
                {"gene": "EGFR", "protein_change": "p.T790M", "chromosome": "chr7", "start_position": 55249071, "reference_allele": "C", "alternate_allele": "T", "variant_classification": "Missense_Mutation", "genome_assembly": "GRCh37"}
            ],
            evidence_matches=[
                {
                    "gene": "KRAS",
                    "variant": "p.Gly12Cys (G12C)",
                    "protein_change": "G12C",
                    "chromosome": "chr12",
                    "start_position": "25398284",
                    "reference_allele": "C",
                    "alternate_allele": "A",
                    "genome_assembly": "GRCh37",
                    "cancer_context": "Non-Small Cell Lung Cancer (LUAD)",
                    "molecular_consequence": "Constitutive GTPase activation, impaired GTP hydrolysis locking KRAS in active state",
                    "evidence_source": "CIViC / FDA / NCCN Guidelines",
                    "clinical_significance": "Predictive of Response / Sensitivity",
                    "evidence_level": "Level A (FDA-Approved Therapy)",
                    "potential_treatment": "Sotorasib (Lumakras), Adagrasib (Krazati)",
                    "resistance_association": "Secondary KRAS mutations (Y96D, G12V), MET amplification",
                    "contraindications_or_limitations": "Indicated specifically in locally advanced or metastatic NSCLC harboring KRAS G12C who have received prior systemic therapy.",
                    "evidence_date": "2024-06-01",
                    "citation_id": "CIViC:MP14; FDA STN-125746",
                    "match_type": "exact_genomic_variant"
                },
                {
                    "gene": "STK11",
                    "variant": "Loss-of-Function / Truncating Variant",
                    "protein_change": "p.Q37*",
                    "chromosome": "chr19",
                    "start_position": "1207062",
                    "reference_allele": "C",
                    "alternate_allele": "T",
                    "genome_assembly": "GRCh37",
                    "cancer_context": "Lung Adenocarcinoma (LUAD)",
                    "molecular_consequence": "Loss of LKB1 kinase, hyperactivation of mTORC1, loss of AMPK energy-sensing",
                    "evidence_source": "CIViC / ESMO Open / Clinical Cancer Research",
                    "clinical_significance": "Negative Predictive Biomarker for Single-Agent Immune Checkpoint Inhibitors (PD-1/PD-L1)",
                    "evidence_level": "Level B (Clinical Consensus in NSCLC)",
                    "potential_treatment": "Chemotherapy doublet combinations, Investigational metabolic combinations",
                    "resistance_association": "Associated with an immunologically 'cold' tumor microenvironment",
                    "contraindications_or_limitations": "Patients with co-occurring KRAS and STK11 mutations derive significantly less benefit from pembrolizumab monotherapy.",
                    "evidence_date": "2024-01-20",
                    "citation_id": "CIViC:MP45; PMID:30373880",
                    "match_type": "exact_genomic_variant"
                }
            ]
        )

        # Generate report for this demo analysis
        report_dict = {
            "report_id": f"OGX-{str(luad_analysis.id)[:8].upper()}",
            "sample_id": luad_analysis.sample_id,
            "created_at": luad_analysis.created_at.strftime("%Y-%m-%d %H:%M:%S UTC"),
            "genome_assembly": luad_analysis.genome_assembly,
            "validation_status": luad_analysis.validation_status,
            "valid_variants_processed": luad_analysis.total_variants,
            "cancer_prediction": luad_analysis.cancer_prediction,
            "observed_variants": luad_analysis.observed_variants,
            "evidence_matches": luad_analysis.evidence_matches
        }
        pdf_bytes = generate_patient_pdf_report(report_dict)
        pdf_path, pdf_type = storage_service.save_file(
            pdf_bytes, f"report_{luad_analysis.sample_id}.pdf", subfolder="reports"
        )
        luad_analysis.pdf_report_path = pdf_path
        luad_analysis.pdf_report_storage_type = pdf_type
        luad_analysis.save()
        print("Seeded sample analysis: TCGA-LUAD-SAMPLE-01 with PDF report.")

if __name__ == "__main__":
    seed()
