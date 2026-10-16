/**
 * ONCOGENIX AI - Clinical Patient Report Page
 * Formats a clean clinical diagnostic report matching professional oncology standards,
 * with direct download of the official generated PDF report.
 */

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Download, Printer, ArrowLeft, RefreshCw, Dna, ShieldAlert,
  CheckCircle2, FileText, Activity
} from 'lucide-react';
import { api } from '../services/api';
import { AnalysisDetail } from '../types';

export const PatientReportPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [analysis, setAnalysis] = useState<AnalysisDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      api.getAnalysis(id).then(data => setAnalysis(data)).finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin" />
        <span className="text-xs font-mono text-cyan-400">Rendering Clinical Document...</span>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Report Not Found</h2>
        <Link to="/history" className="text-cyan-400 text-xs font-mono">Back to History</Link>
      </div>
    );
  }

  const pred: any = analysis.cancer_prediction || {};
  const reportId = `OGX-${analysis.id.slice(0, 8).toUpperCase()}`;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Action Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <Link to={`/results/${analysis.id}`} className="text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Interactive Results
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl text-xs font-medium bg-dark-900 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
          <a
            href={api.downloadReportUrl(analysis.id)}
            target="_blank"
            rel="noreferrer"
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-dark-950 flex items-center gap-1.5 shadow-cyan-glow"
          >
            <Download className="w-3.5 h-3.5" /> Download Official PDF
          </a>
        </div>
      </div>

      {/* Clinical Report Sheet (Clean White/Navy Medical Report Aesthetic) */}
      <div className="bg-white text-slate-900 rounded-3xl p-8 sm:p-12 shadow-2xl space-y-8 font-sans">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b-2 border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight text-slate-900">ONCOGENIX AI</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-bold">
                RESEARCH REPORT
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Precision Oncology Genomic Profiling & Clinical Evidence Synthesis
            </p>
          </div>
          <div className="text-right text-xs font-mono text-slate-600 space-y-0.5">
            <div><strong>Report ID:</strong> {reportId}</div>
            <div><strong>Generated:</strong> {new Date(analysis.created_at).toUTCString()}</div>
          </div>
        </div>

        {/* Patient / Sample Metadata Table */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <div>
            <span className="text-slate-500 block font-medium">Sample Barcode:</span>
            <span className="font-mono font-bold text-slate-800">{analysis.sample_id}</span>
          </div>
          <div>
            <span className="text-slate-500 block font-medium">Patient ID:</span>
            <span className="font-mono font-bold text-slate-800">{analysis.patient_identifier || "DE-IDENTIFIED"}</span>
          </div>
          <div>
            <span className="text-slate-500 block font-medium">Genome Assembly:</span>
            <span className="font-mono font-bold text-slate-800">{analysis.genome_assembly}</span>
          </div>
          <div>
            <span className="text-slate-500 block font-medium">Validation Status:</span>
            <span className="font-mono font-bold text-emerald-700">{analysis.validation_status}</span>
          </div>
        </div>

        {/* Section 1: Classification Inference */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-sky-900 border-b border-slate-200 pb-1">
            1. Molecular Cancer Category Classification
          </h3>
          {pred.is_abstention ? (
            <p className="text-xs text-slate-700 leading-relaxed">
              <strong>Status:</strong> Inconclusive / Abstention.<br />
              <strong>Rationale:</strong> {pred.abstention_reason}
            </p>
          ) : (
            <div className="text-xs space-y-1.5 text-slate-700">
              <p><strong>Predicted Tumor Category:</strong> {pred.predicted_cancer_name} ({pred.predicted_cancer_code})</p>
              <p><strong>Estimated Model Confidence:</strong> {(pred.confidence_score * 100).toFixed(1)}% ({pred.confidence_level})</p>
              <p><strong>Driving Driver Genes Present:</strong> {(pred.driving_features_present || []).join(", ") || "None"}</p>
              <p><strong>Algorithm Architecture:</strong> {pred.model_version} (Trained on TCGA PanCancer Atlas)</p>
            </div>
          )}
        </div>

        {/* Section 2: Observed Somatic Variants */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-sky-900 border-b border-slate-200 pb-1">
            2. Observed Genomic Alterations ({analysis.observed_variants.length})
          </h3>
          <table className="w-full text-left text-xs border border-slate-200">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-2">Gene</th>
                <th className="p-2">Protein Alteration</th>
                <th className="p-2">Genomic Coordinate</th>
                <th className="p-2">Alleles</th>
                <th className="p-2">Classification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
              {analysis.observed_variants.map((v, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="p-2 font-bold text-sky-950">{v.gene}</td>
                  <td className="p-2">{v.protein_change || "p.?"}</td>
                  <td className="p-2">{v.chromosome}:{v.start_position}</td>
                  <td className="p-2">{v.reference_allele}&gt;{v.alternate_allele}</td>
                  <td className="p-2 text-slate-600">{v.variant_classification}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section 3: Evidence Matches */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-sky-900 border-b border-slate-200 pb-1">
            3. Documented Clinical Evidence & Targeted Associations
          </h3>
          {analysis.evidence_matches.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No matching clinical evidence found in CIViC/ClinVar.</p>
          ) : (
            <table className="w-full text-left text-xs border border-slate-200">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-2">Biomarker Target</th>
                  <th className="p-2">Clinical Significance</th>
                  <th className="p-2">Potential Therapeutic Association</th>
                  <th className="p-2">Evidence Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-[11px]">
                {analysis.evidence_matches.map((ev, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="p-2 font-mono font-bold text-sky-900">{ev.gene} {ev.protein_change || ev.variant}</td>
                    <td className="p-2 text-slate-700">{ev.clinical_significance}</td>
                    <td className="p-2 font-medium text-slate-900">{ev.potential_treatment || "Investigational"}</td>
                    <td className="p-2 text-slate-500 font-mono">{ev.evidence_level}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Section 4: Oncologist Questions */}
        <div className="space-y-2 p-4 rounded-xl bg-sky-50 border border-sky-100 text-xs text-sky-950">
          <h4 className="font-bold uppercase tracking-wider text-[11px]">Questions for Treating Oncologist:</h4>
          <ul className="list-decimal pl-4 space-y-1">
            <li>Do detected alterations qualify for FDA-approved targeted therapies or active basket clinical trials?</li>
            <li>Do co-occurring mutations (e.g. STK11/KEAP1) affect expected response to immunotherapy?</li>
            <li>Is germline genetic counseling indicated based on this molecular profile?</li>
          </ul>
        </div>

        {/* Section 5: Mandatory Disclaimer */}
        <div className="pt-4 border-t border-slate-200 text-[10px] text-slate-500 leading-relaxed text-justify">
          <strong>CLINICAL RESEARCH DISCLAIMER:</strong> This report is generated by ONCOGENIX AI as an investigational research prototype. It does NOT constitute a clinical diagnosis, guideline endorsement, or prescription. Cancer stage and grade cannot be determined from mutation files alone. All treatment decisions require qualified medical oncologist evaluation.
        </div>
      </div>
    </div>
  );
};

export default PatientReportPage;
