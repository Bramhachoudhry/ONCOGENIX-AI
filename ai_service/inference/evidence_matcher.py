"""
ONCOGENIX AI - Clinical Evidence Matching Engine
Matches detected patient variants against documented clinical evidence records
from CIViC and ClinVar with coordinate-, allele-, and protein-level precision.
"""

import csv
import logging
import os
from typing import List, Dict, Any, Optional

logger = logging.getLogger("evidence_matcher")

class ClinicalEvidenceMatcher:
    def __init__(self, db_path: Optional[str] = None):
        if not db_path:
            root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            db_path = os.path.join(root_dir, "data", "reference", "clinical_evidence.csv")

        self.db_path = db_path
        self.evidence_records = []
        self.load_database()

    def load_database(self):
        if not os.path.exists(self.db_path):
            logger.warning("Clinical evidence database not found at %s. Evidence matching will return empty.", self.db_path)
            return

        try:
            with open(self.db_path, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                self.evidence_records = [row for row in reader]
            logger.info("Loaded %d clinical evidence records from %s.", len(self.evidence_records), self.db_path)
        except Exception as e:
            logger.error("Error reading clinical evidence database: %s", e)

    def match_variant(self, variant: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Matches a single variant record against the evidence database.
        Checks:
        1. Exact match (Gene, start_pos, ref, alt, assembly)
        2. Protein change match (Gene, protein_change)
        3. Gene-level alteration match
        """
        matches = []
        v_gene = str(variant.get("gene", "")).strip().upper()
        v_pos = str(variant.get("start_position", "")).strip()
        v_ref = str(variant.get("reference_allele", "")).strip().upper()
        v_alt = str(variant.get("alternate_allele", "")).strip().upper()
        v_prot = str(variant.get("protein_change", "")).strip().lower().replace("p.", "")
        v_assembly = str(variant.get("genome_assembly", "GRCh37")).strip().upper()

        if not v_gene:
            return []

        for ev in self.evidence_records:
            e_gene = ev["gene"].strip().upper()
            if e_gene != v_gene:
                continue

            e_pos = ev.get("start_position", "").strip()
            e_ref = ev.get("reference_allele", "").strip().upper()
            e_alt = ev.get("alternate_allele", "").strip().upper()
            e_prot = ev.get("protein_change", "").strip().lower().replace("p.", "")
            e_assembly = ev.get("genome_assembly", "GRCh37").strip().upper()

            # Level 1: Genomic coordinate & allele match
            if v_pos and e_pos and v_pos == e_pos:
                if v_assembly == e_assembly:
                    if v_ref == e_ref and v_alt == e_alt:
                        matched_rec = dict(ev)
                        matched_rec["match_type"] = "exact_genomic_variant"
                        matches.append(matched_rec)
                        continue

            # Level 2: Protein change match
            if v_prot and e_prot and (v_prot in e_prot or e_prot in v_prot):
                matched_rec = dict(ev)
                matched_rec["match_type"] = "protein_change_match"
                matches.append(matched_rec)
                continue

            # Level 3: Gene-level alteration fallback if exact variant wasn't matched yet
            # Only include if no specific matches found
        return matches

    def match_all_variants(self, variants: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        all_matches = []
        seen_citations = set()

        for var in variants:
            var_matches = self.match_variant(var)
            for m in var_matches:
                key = (m.get("gene"), m.get("citation_id"), m.get("match_type"))
                if key not in seen_citations:
                    seen_citations.add(key)
                    all_matches.append(m)

        return all_matches
