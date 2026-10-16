"""
ONCOGENIX AI - Patient Mutation Profile Comparator
Computes genomic overlap, shared vs unique driver genes, variant intersections,
Jaccard similarity, and clinical evidence differences between two patient profiles.
"""

from typing import List, Dict, Any

def compare_patient_profiles(
    sample_a_id: str,
    variants_a: List[Dict[str, Any]],
    evidence_a: List[Dict[str, Any]],
    sample_b_id: str,
    variants_b: List[Dict[str, Any]],
    evidence_b: List[Dict[str, Any]]
) -> Dict[str, Any]:
    genes_a = set(v["gene"] for v in variants_a if v.get("gene"))
    genes_b = set(v["gene"] for v in variants_b if v.get("gene"))

    shared_genes = sorted(list(genes_a.intersection(genes_b)))
    unique_genes_a = sorted(list(genes_a - genes_b))
    unique_genes_b = sorted(list(genes_b - genes_a))

    all_genes = genes_a.union(genes_b)
    jaccard = round(len(shared_genes) / len(all_genes), 4) if all_genes else 0.0

    # Variant level overlap
    def variant_signature(v):
        prot = v.get("protein_change") or ""
        pos = str(v.get("start_position") or "")
        ref = v.get("reference_allele") or ""
        alt = v.get("alternate_allele") or ""
        return (v.get("gene", ""), prot, pos, ref, alt)

    sigs_b = {variant_signature(v): v for v in variants_b}
    sigs_a = {variant_signature(v): v for v in variants_a}

    shared_variants = []
    unique_variants_a = []
    unique_variants_b = []

    for sig, v in sigs_a.items():
        if sig in sigs_b:
            shared_variants.append(v)
        else:
            unique_variants_a.append(v)

    for sig, v in sigs_b.items():
        if sig not in sigs_a:
            unique_variants_b.append(v)

    # Categories
    cats_a = {}
    for v in variants_a:
        c = v.get("variant_classification") or "Other"
        cats_a[c] = cats_a.get(c, 0) + 1

    cats_b = {}
    for v in variants_b:
        c = v.get("variant_classification") or "Other"
        cats_b[c] = cats_b.get(c, 0) + 1

    # Evidence comparison
    ev_a_treatments = set(e.get("potential_treatment") for e in evidence_a if e.get("potential_treatment"))
    ev_b_treatments = set(e.get("potential_treatment") for e in evidence_b if e.get("potential_treatment"))

    return {
        "sample_a_id": sample_a_id,
        "sample_b_id": sample_b_id,
        "shared_genes": shared_genes,
        "unique_genes_a": unique_genes_a,
        "unique_genes_b": unique_genes_b,
        "shared_variants": shared_variants,
        "unique_variants_a": unique_variants_a,
        "unique_variants_b": unique_variants_b,
        "jaccard_similarity": jaccard,
        "category_comparison": {
            sample_a_id: cats_a,
            sample_b_id: cats_b
        },
        "evidence_comparison": {
            "sample_a_treatments": list(ev_a_treatments),
            "sample_b_treatments": list(ev_b_treatments),
            "shared_treatment_options": list(ev_a_treatments.intersection(ev_b_treatments)),
            "unique_treatment_options_a": list(ev_a_treatments - ev_b_treatments),
            "unique_treatment_options_b": list(ev_b_treatments - ev_a_treatments)
        },
        "scientific_guidance": "Sharing a mutation or target does not guarantee identical drug response. Treatment outcomes depend on cancer type, co-occurring alterations (e.g. STK11/KEAP1 in KRAS-mutant lung cancer), pharmacogenomics, and patient performance status."
    }
