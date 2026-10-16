/**
 * ONCOGENIX AI - Patient Mutation Profile Comparison Page
 * Interactively compares two patient mutation profiles to identify shared vs unique
 * driver genes, exact variant intersections, Jaccard similarity, and therapeutic differences.
 */

import React, { useEffect, useState } from 'react';
import {
  GitCompare, Dna, ArrowRight, RefreshCw, AlertCircle, CheckCircle2,
  Sparkles, Layers, ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';
import { PatientComparison, AnalysisSummary } from '../types';

export const PatientComparisonPage: React.FC = () => {
  const [userAnalyses, setUserAnalyses] = useState<AnalysisSummary[]>([]);
  const [selectedAnalysisA, setSelectedAnalysisA] = useState("");
  const [selectedAnalysisB, setSelectedAnalysisB] = useState("");

  const [rawA, setRawA] = useState("");
  const [rawB, setRawB] = useState("");
  const [nameA, setNameA] = useState("Patient_LUAD");
  const [nameB, setNameB] = useState("Patient_PAAD");

  const [comparison, setComparison] = useState<PatientComparison | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getAnalyses().then(data => setUserAnalyses(data)).catch(() => {});
    // Auto-load default comparison
    loadSamplePreset();
  }, []);

  const loadSamplePreset = () => {
    setNameA("Patient_LUAD_SampleA");
    setNameB("Patient_PAAD_SampleB");
    setRawA(`Hugo_Symbol,Chromosome,Start_Position,Reference_Allele,Tumor_Seq_Allele2,HGVSp_Short
KRAS,chr12,25398284,C,A,p.G12C
TP53,chr17,7577538,C,T,p.R248W
STK11,chr19,1207062,C,T,p.Q37*
KEAP1,chr19,10599547,C,T,p.R320W`);

    setRawB(`Hugo_Symbol,Chromosome,Start_Position,Reference_Allele,Tumor_Seq_Allele2,HGVSp_Short
KRAS,chr12,25398284,C,T,p.G12D
TP53,chr17,7577120,G,A,p.R175H
SMAD4,chr18,48591873,G,A,p.R361H
CDKN2A,chr9,21971153,C,T,p.R80*`);
  };

  const handleCompare = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload: any = {
        name_a: nameA,
        name_b: nameB,
      };

      if (selectedAnalysisA) {
        payload.analysis_a_id = selectedAnalysisA;
      } else {
        payload.raw_content_a = rawA;
      }

      if (selectedAnalysisB) {
        payload.analysis_b_id = selectedAnalysisB;
      } else {
        payload.raw_content_b = rawB;
      }

      const res = await api.compareProfiles(payload);
      setComparison(res);
    } catch (err: any) {
      setError("Comparison failed. Ensure both profiles have valid mutation rows.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-2 border-b border-slate-800 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
          <GitCompare className="w-3.5 h-3.5" />
          MULTI-PATIENT GENOMIC COMPARATOR
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Patient Molecular Profile Comparison
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl">
          Evaluate two distinct tumor genomes side-by-side to detect shared driver alterations, unique variants, and differential targeted therapy options.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Input Configuration Form */}
      <form onSubmit={handleCompare} className="glass-panel rounded-3xl p-6 lg:p-8 border border-slate-800 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Patient Profile A */}
          <div className="space-y-4 p-5 rounded-2xl bg-dark-950/70 border border-slate-800/80">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase">Profile A</span>
              {userAnalyses.length > 0 && (
                <select
                  value={selectedAnalysisA}
                  onChange={(e) => setSelectedAnalysisA(e.target.value)}
                  className="px-2 py-1 rounded bg-dark-900 border border-slate-700 text-xs text-slate-200 outline-none"
                >
                  <option value="">-- Choose From History --</option>
                  {userAnalyses.map(a => (
                    <option key={a.id} value={a.id}>{a.sample_id} ({a.top_prediction})</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Profile A Label</label>
              <input
                type="text"
                value={nameA}
                onChange={(e) => setNameA(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-dark-900 border border-slate-800 text-xs text-white outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Mutations Content (CSV)</label>
              <textarea
                rows={5}
                value={rawA}
                onChange={(e) => setRawA(e.target.value)}
                placeholder="Hugo_Symbol,HGVSp_Short..."
                className="w-full p-3 rounded-xl bg-dark-900 border border-slate-800 text-xs font-mono text-slate-200 outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {/* Patient Profile B */}
          <div className="space-y-4 p-5 rounded-2xl bg-dark-950/70 border border-slate-800/80">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-mono font-bold text-violet-400 uppercase">Profile B</span>
              {userAnalyses.length > 0 && (
                <select
                  value={selectedAnalysisB}
                  onChange={(e) => setSelectedAnalysisB(e.target.value)}
                  className="px-2 py-1 rounded bg-dark-900 border border-slate-700 text-xs text-slate-200 outline-none"
                >
                  <option value="">-- Choose From History --</option>
                  {userAnalyses.map(a => (
                    <option key={a.id} value={a.id}>{a.sample_id} ({a.top_prediction})</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Profile B Label</label>
              <input
                type="text"
                value={nameB}
                onChange={(e) => setNameB(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-dark-900 border border-slate-800 text-xs text-white outline-none focus:border-violet-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Mutations Content (CSV)</label>
              <textarea
                rows={5}
                value={rawB}
                onChange={(e) => setRawB(e.target.value)}
                placeholder="Hugo_Symbol,HGVSp_Short..."
                className="w-full p-3 rounded-xl bg-dark-900 border border-slate-800 text-xs font-mono text-slate-200 outline-none focus:border-violet-400"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <button
            type="button"
            onClick={loadSamplePreset}
            className="text-xs text-slate-400 hover:text-cyan-400 font-mono underline"
          >
            Reset to Reference Benchmark Comparison (LUAD vs PAAD)
          </button>

          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-cyan-400 to-electric-500 hover:from-cyan-300 hover:to-electric-400 text-dark-950 shadow-cyan-glow flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-dark-950" />
                Comparing Profiles...
              </span>
            ) : (
              <>
                <GitCompare className="w-4 h-4" />
                Execute Genomic Comparison
              </>
            )}
          </button>
        </div>
      </form>

      {/* Comparison Results */}
      {comparison && (
        <div className="space-y-8 animate-fadeIn">
          {/* Overlap Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="glass-panel rounded-2xl p-5 border border-cyan-500/20 text-center space-y-1">
              <span className="text-xs font-mono uppercase text-slate-400">Jaccard Genomic Similarity</span>
              <div className="text-3xl font-extrabold text-cyan-400 font-mono">
                {(comparison.jaccard_similarity * 100).toFixed(1)}%
              </div>
              <div className="text-[11px] text-slate-500">Overlap index |A ∩ B| / |A ∪ B|</div>
            </div>

            <div className="glass-panel rounded-2xl p-5 border border-slate-800 text-center space-y-1">
              <span className="text-xs font-mono uppercase text-slate-400">Shared Mutated Genes</span>
              <div className="text-3xl font-extrabold text-emerald-400 font-mono">
                {comparison.shared_genes.length}
              </div>
              <div className="text-[11px] text-slate-500">{comparison.shared_genes.join(", ") || "None"}</div>
            </div>

            <div className="glass-panel rounded-2xl p-5 border border-slate-800 text-center space-y-1">
              <span className="text-xs font-mono uppercase text-slate-400">Divergent Driver Genes</span>
              <div className="text-3xl font-extrabold text-violet-400 font-mono">
                {comparison.unique_genes_a.length + comparison.unique_genes_b.length}
              </div>
              <div className="text-[11px] text-slate-500">
                {comparison.unique_genes_a.length} unique to A, {comparison.unique_genes_b.length} unique to B
              </div>
            </div>
          </div>

          {/* Venn-like Gene Breakdown */}
          <div className="glass-panel rounded-3xl p-6 lg:p-8 border border-slate-800 space-y-6">
            <h3 className="text-lg font-bold text-white">Genomic Alteration Intersection</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Unique to A */}
              <div className="p-5 rounded-2xl bg-dark-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-mono font-bold text-cyan-400 uppercase">Unique to {comparison.sample_a_id}</span>
                  <span className="text-xs font-mono text-slate-500">{comparison.unique_genes_a.length} genes</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {comparison.unique_genes_a.length === 0 ? (
                    <span className="text-xs text-slate-500 italic">No unique genes</span>
                  ) : (
                    comparison.unique_genes_a.map((g, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-cyan-950/60 border border-cyan-500/40 text-cyan-300">
                        {g}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Shared between A & B */}
              <div className="p-5 rounded-2xl bg-dark-950 border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-mono font-bold text-emerald-400 uppercase">Shared Drivers (A ∩ B)</span>
                  <span className="text-xs font-mono text-slate-500">{comparison.shared_genes.length} genes</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {comparison.shared_genes.length === 0 ? (
                    <span className="text-xs text-slate-500 italic">No shared driver genes</span>
                  ) : (
                    comparison.shared_genes.map((g, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-emerald-950/60 border border-emerald-500/40 text-emerald-300">
                        {g}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Unique to B */}
              <div className="p-5 rounded-2xl bg-dark-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-mono font-bold text-violet-400 uppercase">Unique to {comparison.sample_b_id}</span>
                  <span className="text-xs font-mono text-slate-500">{comparison.unique_genes_b.length} genes</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {comparison.unique_genes_b.length === 0 ? (
                    <span className="text-xs text-slate-500 italic">No unique genes</span>
                  ) : (
                    comparison.unique_genes_b.map((g, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-violet-950/60 border border-violet-500/40 text-violet-300">
                        {g}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Differential Evidence & Therapeutic Insights */}
          <div className="glass-panel rounded-3xl p-6 lg:p-8 border border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-white">Targeted Therapy Differential Comparison</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="p-4 rounded-xl bg-dark-950 border border-slate-800 space-y-2">
                <span className="font-semibold text-cyan-400 uppercase font-mono block">
                  {comparison.sample_a_id} Therapeutic Matches:
                </span>
                <ul className="list-disc pl-4 space-y-1 text-slate-300">
                  {(comparison.evidence_comparison?.sample_a_treatments || []).length > 0 ? (
                    comparison.evidence_comparison.sample_a_treatments.map((t, idx) => <li key={idx}>{t}</li>)
                  ) : (
                    <li className="text-slate-500 italic">No targeted options matched</li>
                  )}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-dark-950 border border-slate-800 space-y-2">
                <span className="font-semibold text-violet-400 uppercase font-mono block">
                  {comparison.sample_b_id} Therapeutic Matches:
                </span>
                <ul className="list-disc pl-4 space-y-1 text-slate-300">
                  {(comparison.evidence_comparison?.sample_b_treatments || []).length > 0 ? (
                    comparison.evidence_comparison.sample_b_treatments.map((t, idx) => <li key={idx}>{t}</li>)
                  ) : (
                    <li className="text-slate-500 italic">No targeted options matched</li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Scientific Caution Guidance */}
          <div className="p-5 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex items-start gap-3 text-xs text-cyan-200">
            <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-white">Precision Medicine Note:</strong> {comparison.scientific_guidance}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientComparisonPage;
