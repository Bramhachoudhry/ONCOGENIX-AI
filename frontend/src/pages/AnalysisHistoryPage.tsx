/**
 * ONCOGENIX AI - Analysis History & Report Repository
 * Displays previously completed patient genomic profiles with access control,
 * direct report downloads, and secure deletion.
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  History, Dna, Download, Trash2, ExternalLink, RefreshCw,
  AlertCircle, Upload, CheckCircle2, Clock
} from 'lucide-react';
import { api } from '../services/api';
import { AnalysisSummary } from '../types';

export const AnalysisHistoryPage: React.FC = () => {
  const [analyses, setAnalyses] = useState<AnalysisSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalyses();
  }, []);

  const fetchAnalyses = async () => {
    setLoading(true);
    try {
      const data = await api.getAnalyses();
      setAnalyses(data);
    } catch (err: any) {
      setError("Failed to retrieve analysis history.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, sampleId: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete analysis record "${sampleId}" and its associated storage files?`)) {
      return;
    }
    setDeletingId(id);
    try {
      await api.deleteAnalysis(id);
      setAnalyses(prev => prev.filter(a => a.id !== id));
    } catch (err: any) {
      alert("Failed to delete analysis record.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
            <History className="w-3.5 h-3.5" />
            PATIENT PROFILE ARCHIVE
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
            Analysis History & Saved Reports
          </h1>
          <p className="text-xs text-slate-400">
            Records are isolated to your authenticated account and stored securely.
          </p>
        </div>

        <Link
          to="/analysis"
          className="px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-gradient-to-r from-cyan-400 to-electric-500 hover:from-cyan-300 hover:to-electric-400 text-dark-950 shadow-cyan-glow flex items-center justify-center gap-2 transition-all self-start sm:self-auto"
        >
          <Upload className="w-4 h-4" />
          New Mutation Assay
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          <span className="text-xs font-mono text-cyan-400">Loading Analysis History...</span>
        </div>
      ) : analyses.length === 0 ? (
        <div className="py-16 text-center space-y-4 rounded-3xl border border-dashed border-slate-800 bg-dark-900/30">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/60 flex items-center justify-center mx-auto text-slate-500">
            <Dna className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No Previous Analyses Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You have not assayed any patient mutation files yet. Submit your first profile to begin tracking precision oncology insights.
          </p>
          <Link
            to="/analysis"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-cyan-500 text-dark-950 hover:bg-cyan-400 shadow-cyan-glow"
          >
            <Upload className="w-4 h-4" /> Upload DNA Mutation File
          </Link>
        </div>
      ) : (
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-slate-800 text-[11px] font-mono uppercase text-slate-500">
                <tr>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Sample ID</th>
                  <th className="pb-3">File Name</th>
                  <th className="pb-3">Predicted Category</th>
                  <th className="pb-3">Confidence</th>
                  <th className="pb-3">Variants</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {analyses.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 text-slate-400 font-mono text-[11px]">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 font-mono font-bold text-white">
                      {item.sample_id}
                    </td>
                    <td className="py-3.5 text-slate-400 truncate max-w-[140px]">
                      {item.file_name || "mutation_assay.csv"}
                    </td>
                    <td className="py-3.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                        {item.top_prediction}
                      </span>
                    </td>
                    <td className="py-3.5 font-mono">
                      {(item.confidence * 100).toFixed(1)}%
                    </td>
                    <td className="py-3.5 font-mono text-slate-400">
                      {item.total_variants}
                    </td>
                    <td className="py-3.5 text-right space-x-2">
                      <Link
                        to={`/results/${item.id}`}
                        className="px-3 py-1 rounded-lg bg-dark-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors"
                      >
                        Inspect
                      </Link>
                      <a
                        href={api.downloadReportUrl(item.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1 rounded-lg bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-300 font-medium text-xs inline-flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" /> PDF
                      </a>
                      <button
                        onClick={() => handleDelete(item.id, item.sample_id)}
                        disabled={deletingId === item.id}
                        className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisHistoryPage;
