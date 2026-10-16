/**
 * ONCOGENIX AI - Mutation Results & Clinical Evidence Page
 * Presents calibrated cancer classification probabilities, observed genomic alterations,
 * matched CIViC/ClinVar targeted evidence, oncologist discussion questions, and PDF download.
 */

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Dna, Activity, ShieldCheck, Download, AlertTriangle, CheckCircle2,
  HelpCircle, ExternalLink, ArrowLeft, RefreshCw, Layers, Award
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { api } from '../services/api';
import { AnalysisDetail } from '../types';

export const MutationResultsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [analysis, setAnalysis] = useState<AnalysisDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchAnalysis(id);
    }
  }, [id]);

  const fetchAnalysis = async (analysisId: string) => {
    setLoading(true);
    try {
      const data = await api.getAnalysis(analysisId);
      setAnalysis(data);
    } catch (err: any) {
      setError("Failed to retrieve analysis record or unauthorized access.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin" />
        <span className="text-xs font-mono text-cyan-400 tracking-wider">
          Retrieving Genomic Classification Telemetry...
        </span>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white">Analysis Not Available</h2>
        <p className="text-sm text-slate-400">{error || "Could not load genomic results."}</p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-dark-900 border border-slate-800 text-white hover:border-slate-700"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  const prediction: any = analysis.cancer_prediction || {};
  const isAbstention = prediction.is_abstention;
  const probs = prediction.class_probabilities || [];
  const variants = analysis.observed_variants || [];
  const evidenceMatches = analysis.evidence_matches || [];

  const chartData = probs.map(p => ({
    name: p.cancer_code,
    fullName: p.cancer_name,
    probability: (p.probability * 100),
  }));

  const getConfidenceBadgeColor = (level: string) => {
    switch (level) {
      case "HIGH": return "bg-emerald-950/60 border-emerald-500/40 text-emerald-300";
      case "MODERATE": return "bg-sky-950/60 border-sky-500/40 text-sky-300";
      case "LOW": return "bg-amber-950/60 border-amber-500/40 text-amber-300";
      default: return "bg-slate-800 border-slate-700 text-slate-400";
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Banner Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Link to="/history" className="text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> History
            </Link>
            <span className="text-slate-600">•</span>
            <span className="text-xs font-mono text-cyan-400">Assay ID: {analysis.sample_id}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            Precision Oncology Profiling Results
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={api.downloadReportUrl(analysis.id)}
            target="_blank"
            rel="noreferrer"
            className="px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-gradient-to-r from-cyan-400 to-electric-500 hover:from-cyan-300 hover:to-electric-400 text-dark-950 shadow-cyan-glow flex items-center justify-center gap-2 transition-all"
          >
            <Download className="w-4 h-4" />
            Download PDF Report
          </a>
        </div>
      </div>

      {/* 1. ML Cancer Classification Card */}
      <div className="glass-panel rounded-3xl p-6 lg:p-8 border border-cyan-500/30 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <span className="text-xs font-mono font-medium text-cyan-400 uppercase tracking-widest">
              Machine Learning Inferences
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-0.5">
              Primary Tumor Category Classification
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${getConfidenceBadgeColor(prediction.confidence_level)}`}>
              {prediction.confidence_level} CONFIDENCE
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-mono bg-dark-900 border border-slate-800 text-slate-400">
              {prediction.model_version || "TCGA-Ensemble-v1"}
            </span>
          </div>
        </div>

        {isAbstention ? (
          <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-4 text-amber-200">
            <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-sm">Classification Inconclusive (Scientific Abstention)</h4>
              <p className="text-xs text-amber-300/80 leading-relaxed">
                {prediction.abstention_reason || "The submitted mutation profile does not harbor alterations in the trained 40 driver genes. Precision classification abstains to avoid misleading guesses."}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Primary Prediction Callout */}
            <div className="lg:col-span-5 space-y-3">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-mono">
                Most Likely Molecular Category:
              </span>
              <div className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-white">
                {prediction.predicted_cancer_name}
              </div>
              <div className="flex items-center gap-2 text-sm font-mono text-cyan-400 font-semibold">
                <span>Code: {prediction.predicted_cancer_code}</span>
                <span>•</span>
                <span>Probability: {(prediction.confidence_score * 100).toFixed(1)}%</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed pt-2">
                Driving Genomic Biomarkers in Sample:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(prediction.driving_features_present || []).map((gene: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-cyan-950/60 border border-cyan-500/40 text-cyan-300"
                  >
                    {gene}
                  </span>
                ))}
              </div>
            </div>

            {/* Class Probability Distribution Chart */}
            <div className="lg:col-span-7 h-[200px] w-full">
              <span className="text-[11px] font-mono uppercase text-slate-500 mb-2 block">
                Posterior Class Probabilities across TCGA Cohorts (%):
              </span>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30, top: 0, bottom: 0 }}>
                  <XAxis type="number" domain={[0, 100]} stroke="#475569" fontSize={10} unit="%" />
                  <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} width={70} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#070b14', borderColor: '#1e293b', borderRadius: '8px', fontSize: '11px' }}
                    formatter={(val: any) => [`${Number(val).toFixed(1)}%`, 'Probability']}
                  />
                  <Bar dataKey="probability" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.name === prediction.predicted_cancer_code ? '#00f2fe' : '#334155'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* 2. Documented Clinical Evidence Matches (CIViC & ClinVar) */}
      <div className="glass-panel rounded-3xl p-6 lg:p-8 border border-slate-800 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <span className="text-xs font-mono font-medium text-violet-400 uppercase tracking-widest">
              CIViC & ClinVar Knowledge Base
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-0.5">
              Evidence-Supported Targeted Associations
            </h2>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-mono bg-violet-950/60 border border-violet-500/30 text-violet-300">
            {evidenceMatches.length} Matches Found
          </span>
        </div>

        {evidenceMatches.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 italic">
            No matching clinical evidence found in current database for the assayed variants.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {evidenceMatches.map((ev, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-dark-950/80 border border-slate-800 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-base font-extrabold text-cyan-300 font-mono">
                      {ev.gene} {ev.protein_change || ev.variant}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
                      {ev.evidence_level}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 font-medium mb-1">
                    {ev.clinical_significance}
                  </div>

                  <div className="text-xs text-slate-400 leading-relaxed mb-3">
                    {ev.molecular_consequence}
                  </div>

                  {ev.potential_treatment && (
                    <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-xs space-y-1">
                      <span className="text-[10px] uppercase font-mono text-cyan-400 font-bold block">
                        Potential Therapeutic Association:
                      </span>
                      <span className="text-white font-medium">{ev.potential_treatment}</span>
                    </div>
                  )}

                  {ev.resistance_association && (
                    <div className="p-2.5 mt-2 rounded-lg bg-amber-950/20 border border-amber-500/20 text-[11px] text-amber-300">
                      <span className="font-semibold">Resistance Note:</span> {ev.resistance_association}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>Source: {ev.evidence_source}</span>
                  <span>{ev.citation_id}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Observed Somatic Variants Table */}
      <div className="glass-panel rounded-3xl p-6 lg:p-8 border border-slate-800 space-y-4">
        <h3 className="text-lg font-bold text-white">Observed Somatic Mutations ({variants.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="border-b border-slate-800 text-[11px] font-mono uppercase text-slate-500">
              <tr>
                <th className="pb-3">Gene</th>
                <th className="pb-3">Protein Alteration</th>
                <th className="pb-3">Coordinates</th>
                <th className="pb-3">Ref &gt; Alt</th>
                <th className="pb-3">Classification</th>
                <th className="pb-3">Assembly</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {variants.map((v, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 font-bold text-cyan-300">{v.gene}</td>
                  <td className="py-2.5 text-white">{v.protein_change || "p.?"}</td>
                  <td className="py-2.5 text-slate-400">{v.chromosome}:{v.start_position}</td>
                  <td className="py-2.5 text-slate-400">{v.reference_allele}&gt;{v.alternate_allele}</td>
                  <td className="py-2.5 text-slate-300">{v.variant_classification}</td>
                  <td className="py-2.5 text-slate-500">{v.genome_assembly}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Questions for Treating Oncologist */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <HelpCircle className="w-4 h-4 text-cyan-400" />
          <span>Recommended Discussion Questions for the Treating Oncologist</span>
        </div>
        <ul className="text-xs text-slate-300 space-y-2 list-disc pl-5 leading-relaxed">
          <li>Are the identified alterations (e.g. KRAS, EGFR, PIK3CA) eligible for FDA-approved targeted therapies or active basket clinical trials?</li>
          <li>Do co-occurring mutations (e.g. STK11 or KEAP1 in KRAS-mutant lung tumors) suggest potential resistance to single-agent immune checkpoint blockade?</li>
          <li>Does this molecular profile indicate the need for germline hereditary cancer testing (e.g. BRCA1/2, Lynch syndrome)?</li>
          <li>How do these genomic findings correlate with histological tumor grade, pathology review, and TNM clinical stage?</li>
        </ul>
      </div>

      {/* 5. Scientific Limitation Notice */}
      <div className="p-4 rounded-2xl bg-dark-950 border border-slate-800 flex items-start gap-3 text-xs text-slate-400">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-slate-300">Mandatory Scientific Disclaimer:</strong> Stage and grade cannot be determined from the submitted mutation file alone. Mutation count does not directly indicate tumor burden or prognosis. Results are intended strictly for clinical research and decision-support.
        </p>
      </div>
    </div>
  );
};

export default MutationResultsPage;
