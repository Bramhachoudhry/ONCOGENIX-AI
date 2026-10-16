"""
ONCOGENIX AI - Clinical Precision Oncology PDF Report Generator
Generates clinical-grade PDF reports summarizing patient mutation patterns,
cancer classification inferences, clinical evidence matches, questions for
the treating oncologist, and scientific disclaimers.
"""

import io
import os
from datetime import datetime, timezone
from typing import Dict, Any

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable

def generate_patient_pdf_report(analysis_data: Dict[str, Any]) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40, leftMargin=40,
        topMargin=40, bottomMargin=40
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0f172a')
    )
    subtitle_style = ParagraphStyle(
        'DocSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#0284c7')
    )
    heading_style = ParagraphStyle(
        'SectionHead',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#0f172a'),
        spaceBefore=10,
        spaceAfter=6
    )
    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#334155')
    )
    bold_body_style = ParagraphStyle(
        'BoldDocBody',
        parent=body_style,
        fontName='Helvetica-Bold'
    )
    disclaimer_style = ParagraphStyle(
        'DisclaimerText',
        parent=styles['Italic'],
        fontName='Helvetica-Oblique',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#64748b')
    )

    story = []

    # Header banner
    story.append(Paragraph("ONCOGENIX AI", title_style))
    story.append(Paragraph("Precision Oncology AI Platform — Genomic Profiling & Clinical Evidence Report", subtitle_style))
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0284c7"), spaceAfter=12))

    # Patient / Metadata Summary Table
    report_id = analysis_data.get("report_id") or f"OGX-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"
    sample_id = analysis_data.get("sample_id", "ANONYMOUS_SAMPLE")
    created_at = analysis_data.get("created_at", datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"))
    assembly = analysis_data.get("genome_assembly", "GRCh37")

    meta_table_data = [
        [Paragraph("<b>Report Identifier:</b>", body_style), Paragraph(report_id, body_style),
         Paragraph("<b>Date / Time:</b>", body_style), Paragraph(str(created_at), body_style)],
        [Paragraph("<b>Sample / Patient Barcode:</b>", body_style), Paragraph(sample_id, body_style),
         Paragraph("<b>Reference Genome:</b>", body_style), Paragraph(assembly, body_style)],
        [Paragraph("<b>Validation Status:</b>", body_style), Paragraph(analysis_data.get("validation_status", "VALIDATED"), body_style),
         Paragraph("<b>Variants Assayed:</b>", body_style), Paragraph(str(analysis_data.get("valid_variants_processed", 0)), body_style)]
    ]
    meta_table = Table(meta_table_data, colWidths=[130, 140, 110, 150])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 14))

    # Cancer Classification Inferences
    story.append(Paragraph("1. Machine Learning Cancer Classification Inference", heading_style))
    pred = analysis_data.get("cancer_prediction") or {}
    pred_code = pred.get("predicted_cancer_code")
    pred_name = pred.get("predicted_cancer_name")
    conf_score = pred.get("confidence_score", 0.0)
    conf_level = pred.get("confidence_level", "N/A")
    is_abstention = pred.get("is_abstention", False)

    if is_abstention or not pred_code:
        story.append(Paragraph(
            f"<b>Classification Status:</b> Inconclusive / Abstention<br/>"
            f"<b>Rationale:</b> {pred.get('abstention_reason', 'Insufficient genomic driver mutations identified in assay panel.')}",
            body_style
        ))
    else:
        pred_text = (
            f"<b>Predicted Primary Cancer Type:</b> {pred_name} ({pred_code})<br/>"
            f"<b>Model Confidence Score:</b> {conf_score * 100:.1f}% ({conf_level} Confidence)<br/>"
            f"<b>Driving Driver Genes Detected:</b> {', '.join(pred.get('driving_features_present', [])) or 'None'}<br/>"
            f"<b>Model Architecture:</b> {pred.get('model_version', 'GradientBoostingClassifier')} (Trained on TCGA PanCancer Atlas)"
        )
        story.append(Paragraph(pred_text, body_style))

    story.append(Spacer(1, 12))

    # Observed Mutation Profile
    story.append(Paragraph("2. Detected Somatic Mutation Profile", heading_style))
    variants = analysis_data.get("observed_variants", [])
    if variants:
        var_headers = [
            Paragraph("<b>Gene</b>", bold_body_style),
            Paragraph("<b>Variant / Protein</b>", bold_body_style),
            Paragraph("<b>Genomic Position</b>", bold_body_style),
            Paragraph("<b>Classification</b>", bold_body_style),
            Paragraph("<b>Alleles</b>", bold_body_style)
        ]
        var_data = [var_headers]
        for v in variants[:12]: # fit cleanly on page
            var_data.append([
                Paragraph(v.get("gene", ""), body_style),
                Paragraph(v.get("protein_change") or "p.?", body_style),
                Paragraph(f"{v.get('chromosome', '')}:{v.get('start_position', '')}", body_style),
                Paragraph(v.get("variant_classification", ""), body_style),
                Paragraph(f"{v.get('reference_allele', '')}&gt;{v.get('alternate_allele', '')}", body_style)
            ])
        var_table = Table(var_data, colWidths=[80, 110, 130, 130, 80])
        var_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0284c7')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#94a3b8')),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
            ('TOPPADDING', (0,0), (-1,-1), 3),
            ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ]))
        story.append(var_table)
    else:
        story.append(Paragraph("No valid somatic mutations detected in assay.", body_style))

    story.append(Spacer(1, 12))

    # Matched Clinical Evidence
    story.append(Paragraph("3. Documented Clinical Evidence & Targeted Associations", heading_style))
    ev_matches = analysis_data.get("evidence_matches", [])
    if ev_matches:
        ev_headers = [
            Paragraph("<b>Target</b>", bold_body_style),
            Paragraph("<b>Clinical Relevance</b>", bold_body_style),
            Paragraph("<b>Potential Therapeutic Associations</b>", bold_body_style),
            Paragraph("<b>Evidence Level & Source</b>", bold_body_style)
        ]
        ev_data = [ev_headers]
        for ev in ev_matches[:8]:
            ev_data.append([
                Paragraph(f"<b>{ev.get('gene', '')}</b><br/>{ev.get('protein_change') or ev.get('variant', '')}", body_style),
                Paragraph(ev.get("clinical_significance", ""), body_style),
                Paragraph(ev.get("potential_treatment") or "Investigational / Supportive Care", body_style),
                Paragraph(f"{ev.get('evidence_level', '')}<br/><i>{ev.get('evidence_source', '')}</i>", body_style)
            ])
        ev_table = Table(ev_data, colWidths=[90, 140, 180, 120])
        ev_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0f172a')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#94a3b8')),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
            ('TOPPADDING', (0,0), (-1,-1), 3),
            ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ]))
        story.append(ev_table)
    else:
        story.append(Paragraph("No matching evidence found in CIViC / ClinVar databases for assayed variants.", body_style))

    story.append(Spacer(1, 12))

    # Questions for Oncologist
    story.append(Paragraph("4. Recommended Questions for the Treating Oncologist", heading_style))
    questions = [
        "1. Do the identified alterations (e.g. KRAS/EGFR/PIK3CA) qualify this tumor for FDA-approved targeted therapies or active basket clinical trials?",
        "2. Are there co-occurring mutations (e.g. STK11 or KEAP1) that may impact the expected efficacy of immune checkpoint blockade?",
        "3. Does this molecular profile warrant germline genetic testing to assess hereditary cancer predisposition (e.g. BRCA1/2, Lynch Syndrome)?",
        "4. How do these genomic findings correlate with the patient's histological tumor type, pathology grade, and TNM clinical stage?"
    ]
    for q in questions:
        story.append(Paragraph(q, body_style))
        story.append(Spacer(1, 2))

    story.append(Spacer(1, 14))

    # Responsible-Use Disclaimer
    story.append(HRFlowable(width="100%", thickness=0.8, color=colors.HexColor("#cbd5e1"), spaceAfter=6))
    story.append(Paragraph("<b>MANDATORY CLINICAL DISCLAIMER & SCIENTIFIC LIMITATIONS:</b>", bold_body_style))
    disclaimer_body = (
        "ONCOGENIX AI is a research and clinical decision-support prototype. "
        "Stage and grade cannot be determined from the submitted DNA mutation file alone. "
        "A mutation count does not reflect tumor burden or disease severity. "
        "This automated report does NOT constitute a medical diagnosis, clinical guideline directive, or prescription. "
        "All patient treatment decisions must be made by licensed medical oncologists in conjunction with complete clinical, radiological, and pathology evaluations."
    )
    story.append(Paragraph(disclaimer_body, disclaimer_style))

    doc.build(story)
    return buffer.getvalue()
