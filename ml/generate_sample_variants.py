"""
ONCOGENIX AI - Sample Variant File Generator
Generates documented patient mutation profiles (CSV/TSV) for demonstration,
validation, and comparative testing.
"""

import os
import csv

def main():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    samples_dir = os.path.join(root_dir, "data", "samples")
    data_dir = os.path.join(root_dir, "data")
    os.makedirs(samples_dir, exist_ok=True)

    # Columns standard in cBioPortal mutation tables / precision oncology assays
    headers = [
        "Hugo_Symbol", "Chromosome", "Start_Position", "End_Position",
        "Reference_Allele", "Tumor_Seq_Allele2", "Variant_Classification",
        "HGVSp_Short", "Tumor_Sample_Barcode", "NCBI_Build"
    ]

    sample_a_rows = [
        ["KRAS", "chr12", "25398284", "25398284", "C", "A", "Missense_Mutation", "p.G12C", "SAMPLE-LUAD-001", "GRCh37"],
        ["TP53", "chr17", "7577538", "7577538", "C", "T", "Missense_Mutation", "p.R248W", "SAMPLE-LUAD-001", "GRCh37"],
        ["STK11", "chr19", "1207062", "1207062", "C", "T", "Nonsense_Mutation", "p.Q37*", "SAMPLE-LUAD-001", "GRCh37"],
        ["KEAP1", "chr19", "10599547", "10599547", "C", "T", "Missense_Mutation", "p.R320W", "SAMPLE-LUAD-001", "GRCh37"],
        ["EGFR", "chr7", "55249071", "55249071", "C", "T", "Missense_Mutation", "p.T790M", "SAMPLE-LUAD-001", "GRCh37"]
    ]

    sample_b_rows = [
        ["KRAS", "chr12", "25398284", "25398284", "C", "T", "Missense_Mutation", "p.G12D", "SAMPLE-PAAD-002", "GRCh37"],
        ["TP53", "chr17", "7577120", "7577120", "G", "A", "Missense_Mutation", "p.R175H", "SAMPLE-PAAD-002", "GRCh37"],
        ["SMAD4", "chr18", "48591873", "48591873", "G", "A", "Missense_Mutation", "p.R361H", "SAMPLE-PAAD-002", "GRCh37"],
        ["CDKN2A", "chr9", "21971153", "21971153", "C", "T", "Nonsense_Mutation", "p.R80*", "SAMPLE-PAAD-002", "GRCh37"]
    ]

    sample_c_rows = [
        ["PIK3CA", "chr3", "178952085", "178952085", "A", "G", "Missense_Mutation", "p.H1047R", "SAMPLE-BRCA-003", "GRCh37"],
        ["CDH1", "chr16", "68842686", "68842686", "C", "G", "Nonsense_Mutation", "p.Y142*", "SAMPLE-BRCA-003", "GRCh37"],
        ["PTEN", "chr10", "89692904", "89692904", "G", "A", "Missense_Mutation", "p.R130Q", "SAMPLE-BRCA-003", "GRCh37"],
        ["BRCA1", "chr17", "41276045", "41276045", "T", "G", "Missense_Mutation", "p.C61G", "SAMPLE-BRCA-003", "GRCh37"]
    ]

    sample_d_rows = [
        ["APC", "chr5", "112175955", "112175955", "C", "T", "Nonsense_Mutation", "p.R1450*", "SAMPLE-COAD-004", "GRCh37"],
        ["KRAS", "chr12", "25398285", "25398285", "G", "T", "Missense_Mutation", "p.G12V", "SAMPLE-COAD-004", "GRCh37"],
        ["TP53", "chr17", "7577538", "7577538", "C", "T", "Missense_Mutation", "p.R248W", "SAMPLE-COAD-004", "GRCh37"],
        ["PIK3CA", "chr3", "178936091", "178936091", "G", "A", "Missense_Mutation", "p.E545K", "SAMPLE-COAD-004", "GRCh37"]
    ]

    # Write files to both data/samples and data/
    targets = [
        (sample_a_rows, "sample_a_variants.csv"),
        (sample_b_rows, "sample_b_variants.csv"),
        (sample_c_rows, "sample_c_brca_pik3ca.csv"),
        (sample_d_rows, "sample_d_coad_apc.csv"),
    ]

    for rows, filename in targets:
        for folder in [samples_dir, data_dir]:
            p = os.path.join(folder, filename)
            with open(p, "w", newline="", encoding="utf-8") as f:
                w = csv.writer(f)
                w.writerow(headers)
                w.writerows(rows)
            print(f"Wrote {p}")

    # Patient comparison CSV with shared & unique variants
    comparison_headers = [
        "Patient_ID", "Hugo_Symbol", "Protein_Change", "Variant_Classification",
        "Chromosome", "Start_Position", "Reference_Allele", "Tumor_Seq_Allele2", "Genome_Assembly"
    ]
    comparison_rows = [
        ["PATIENT_01", "KRAS", "p.G12C", "Missense_Mutation", "chr12", "25398284", "C", "A", "GRCh37"],
        ["PATIENT_01", "TP53", "p.R248W", "Missense_Mutation", "chr17", "7577538", "C", "T", "GRCh37"],
        ["PATIENT_01", "STK11", "p.Q37*", "Nonsense_Mutation", "chr19", "1207062", "C", "T", "GRCh37"],
        ["PATIENT_02", "KRAS", "p.G12C", "Missense_Mutation", "chr12", "25398284", "C", "A", "GRCh37"],
        ["PATIENT_02", "TP53", "p.R175H", "Missense_Mutation", "chr17", "7577120", "G", "A", "GRCh37"],
        ["PATIENT_02", "EGFR", "p.L858R", "Missense_Mutation", "chr7", "55259515", "T", "G", "GRCh37"],
    ]
    for folder in [samples_dir, data_dir]:
        p = os.path.join(folder, "patient_mutation_comparison.csv")
        with open(p, "w", newline="", encoding="utf-8") as f:
            w = csv.writer(f)
            w.writerow(comparison_headers)
            w.writerows(comparison_rows)
        print(f"Wrote {p}")

if __name__ == "__main__":
    main()
