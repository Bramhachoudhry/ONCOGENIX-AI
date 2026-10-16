"""
ONCOGENIX AI - Genomic Mutation File Parser
Parses CSV, TSV, MAF, and JSON mutation tables with resilient header detection.
"""

import csv
import io
import json
import logging
from typing import List, Dict, Any, Tuple

logger = logging.getLogger("parser")

COLUMN_SYNONYMS = {
    "gene": ["hugo_symbol", "gene", "hugosymbol", "gene_symbol", "symbol"],
    "chromosome": ["chromosome", "chr", "chrom"],
    "start_position": ["start_position", "start", "pos", "start_pos"],
    "end_position": ["end_position", "end", "end_pos"],
    "reference_allele": ["reference_allele", "ref", "ref_allele"],
    "alternate_allele": ["tumor_seq_allele2", "alternate_allele", "alt", "alt_allele", "tumor_seq_allele1"],
    "variant_classification": ["variant_classification", "consequence", "variant_type", "mutation_type", "effect"],
    "protein_change": ["hgvsp_short", "protein_change", "hgvsp", "amino_acid_change", "aachange"],
    "sample_id": ["tumor_sample_barcode", "sample_id", "patient_id", "sample_barcode", "sample"],
    "genome_assembly": ["ncbi_build", "genome_assembly", "assembly", "build"]
}

def normalize_column_name(col: str) -> str:
    cleaned = col.strip().lower().replace("-", "_").replace(" ", "_")
    for standard_name, synonyms in COLUMN_SYNONYMS.items():
        if cleaned in synonyms:
            return standard_name
    return cleaned

def parse_raw_mutation_content(raw_content: str, file_format: str = "csv") -> Tuple[List[Dict[str, Any]], List[str]]:
    """
    Parses raw string content into standardized variant dictionaries.
    Returns: (records, notes)
    """
    notes = []
    records = []

    if not raw_content or not raw_content.strip():
        notes.append("Empty content received.")
        return [], notes

    clean_content = raw_content.strip()

    # If format is JSON or content starts with '[' or '{'
    if file_format == "json" or clean_content.startswith(("[", "{")):
        try:
            data = json.loads(clean_content)
            if isinstance(data, dict):
                data = data.get("variants") or [data]
            for row in data:
                standardized = {}
                for k, v in row.items():
                    norm_k = normalize_column_name(k)
                    standardized[norm_k] = v
                records.append(standardized)
            notes.append(f"Parsed {len(records)} records from JSON structure.")
            return records, notes
        except Exception as e:
            notes.append(f"JSON parsing failed: {e}. Falling back to tabular parsing.")

    # Tabular parsing (CSV, TSV, MAF)
    lines = clean_content.splitlines()
    # Skip MAF comment headers (#version ...)
    data_lines = [l for l in lines if not l.startswith("#") and l.strip()]

    if not data_lines:
        notes.append("No data rows found after stripping comments.")
        return [], notes

    # Delimiter detection
    first_line = data_lines[0]
    if "\t" in first_line or file_format in ["tsv", "maf"]:
        delimiter = "\t"
    else:
        delimiter = ","

    reader = csv.reader(data_lines, delimiter=delimiter)
    try:
        raw_headers = next(reader)
    except StopIteration:
        notes.append("File contains no header line.")
        return [], notes

    col_map = {}
    for idx, h in enumerate(raw_headers):
        norm_h = normalize_column_name(h)
        col_map[idx] = norm_h

    for line_idx, row in enumerate(reader, start=2):
        if not row or not any(x.strip() for x in row):
            continue
        rec = {}
        for idx, val in enumerate(row):
            if idx in col_map:
                rec[col_map[idx]] = val.strip()
        records.append(rec)

    notes.append(f"Successfully read {len(records)} raw tabular rows with delimiter '{delimiter}'.")
    return records, notes
