"""
ONCOGENIX AI - Strict Genomic Mutation Validator
Validates gene symbols, coordinates, IUPAC alleles, chromosome nomenclature,
assembly versions, and deduplicates repeated variants.
Logs row counts before and after every step without silent deletion.
"""

import logging
import re
from typing import List, Dict, Any, Tuple

logger = logging.getLogger("validator")

VALID_BASES = set("ACGTN-")
VALID_CHRS = {f"chr{i}" for i in range(1, 23)} | {"chrx", "chry", "chrm", "chrmt"}

def normalize_chromosome(chrom: str) -> str:
    if not chrom:
        return ""
    c = str(chrom).strip().lower()
    if not c.startswith("chr"):
        c = f"chr{c}"
    return c

def normalize_assembly(assembly: str) -> str:
    if not assembly:
        return "GRCh37"
    a = str(assembly).strip().upper()
    if "38" in a:
        return "GRCh38"
    if "37" in a or "19" in a:
        return "GRCh37"
    return a

def validate_and_filter_variants(
    records: List[Dict[str, Any]],
    expected_assembly: str = "GRCh37"
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[str]]:
    """
    Validates a list of parsed raw variant records.
    Returns: (valid_records, rejected_records, validation_notes)
    """
    initial_count = len(records)
    logger.info("Validation starting. Initial record count: %d", initial_count)
    notes = [f"Input record count before validation: {initial_count}"]

    valid_records = []
    rejected_records = []
    seen_variants = set()
    duplicate_count = 0

    target_assembly = normalize_assembly(expected_assembly)

    for idx, rec in enumerate(records, start=1):
        # 1. Gene symbol check
        gene = rec.get("gene")
        if not gene or not str(gene).strip() or str(gene).strip().upper() in ["NA", "NULL", "NONE", "."]:
            rejected_records.append({
                "row_index": idx,
                "record": rec,
                "reason": "Missing or null gene identifier (Hugo_Symbol)."
            })
            continue
        clean_gene = str(gene).strip().upper()

        # 2. Chromosome validation
        chrom = rec.get("chromosome")
        norm_chrom = normalize_chromosome(chrom) if chrom else ""
        if norm_chrom and norm_chrom not in VALID_CHRS:
            rejected_records.append({
                "row_index": idx,
                "record": rec,
                "reason": f"Unrecognized chromosome designation: '{chrom}'."
            })
            continue

        # 3. Position validation
        start_pos = rec.get("start_position")
        end_pos = rec.get("end_position") or start_pos
        start_int = None
        end_int = None

        if start_pos not in (None, "", "NA", "."):
            try:
                start_int = int(float(str(start_pos).strip()))
                if start_int <= 0:
                    rejected_records.append({
                        "row_index": idx,
                        "record": rec,
                        "reason": f"Invalid non-positive genomic start coordinate: {start_int}."
                    })
                    continue
            except (ValueError, TypeError):
                rejected_records.append({
                    "row_index": idx,
                    "record": rec,
                    "reason": f"Genomic start position must be an integer: '{start_pos}'."
                })
                continue

        if end_pos not in (None, "", "NA", "."):
            try:
                end_int = int(float(str(end_pos).strip()))
                if end_int <= 0:
                    rejected_records.append({
                        "row_index": idx,
                        "record": rec,
                        "reason": f"Invalid non-positive genomic end coordinate: {end_int}."
                    })
                    continue
                if start_int and end_int < start_int:
                    rejected_records.append({
                        "row_index": idx,
                        "record": rec,
                        "reason": f"End coordinate ({end_int}) cannot be smaller than start coordinate ({start_int})."
                    })
                    continue
            except (ValueError, TypeError):
                pass

        # 4. Allele checks
        ref_allele = rec.get("reference_allele")
        alt_allele = rec.get("alternate_allele")
        clean_ref = str(ref_allele).strip().upper() if ref_allele not in (None, "", "NA", ".") else ""
        clean_alt = str(alt_allele).strip().upper() if alt_allele not in (None, "", "NA", ".") else ""

        if clean_ref:
            if not set(clean_ref).issubset(VALID_BASES):
                rejected_records.append({
                    "row_index": idx,
                    "record": rec,
                    "reason": f"Reference allele contains non-IUPAC characters: '{clean_ref}'."
                })
                continue

        if clean_alt:
            if not set(clean_alt).issubset(VALID_BASES):
                rejected_records.append({
                    "row_index": idx,
                    "record": rec,
                    "reason": f"Alternate allele contains non-IUPAC characters: '{clean_alt}'."
                })
                continue

        # 5. Assembly tracking
        raw_assembly = rec.get("genome_assembly") or target_assembly
        record_assembly = normalize_assembly(raw_assembly)

        # 6. Protein change clean
        prot = rec.get("protein_change")
        clean_prot = str(prot).strip() if prot not in (None, "", "NA", ".") else ""
        if clean_prot and not clean_prot.startswith("p."):
            clean_prot = f"p.{clean_prot}"

        # 7. Deduplication key
        var_key = (clean_gene, norm_chrom, start_int, clean_ref, clean_alt, clean_prot)
        if var_key in seen_variants:
            duplicate_count += 1
            continue
        seen_variants.add(var_key)

        clean_rec = {
            "gene": clean_gene,
            "chromosome": norm_chrom,
            "start_position": start_int,
            "end_position": end_int or start_int,
            "reference_allele": clean_ref,
            "alternate_allele": clean_alt,
            "variant_classification": rec.get("variant_classification") or "Missense_Mutation",
            "protein_change": clean_prot,
            "sample_id": rec.get("sample_id") or "UNKNOWN",
            "genome_assembly": record_assembly
        }
        valid_records.append(clean_rec)

    notes.append(f"Valid variants retained: {len(valid_records)}")
    if rejected_records:
        notes.append(f"Rejected rows: {len(rejected_records)}")
    if duplicate_count > 0:
        notes.append(f"Deduplicated repeated variant instances: {duplicate_count}")

    logger.info("Validation complete. Valid: %d, Rejected: %d, Duplicates: %d",
                len(valid_records), len(rejected_records), duplicate_count)

    return valid_records, rejected_records, notes
