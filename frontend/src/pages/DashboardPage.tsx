/**
 * ONCOGENIX AI - Main Dashboard
 * Displays real user-specific analysis metrics, interactive 3D anatomical model,
 * model health telemetry, and recent analysis history.
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, Dna, Upload, Clock, FileCheck, AlertCircle, ArrowRight,
  Download, Sparkles, CheckCircle2, ChevronRight, Layers, Database
} from 'lucide-react';
import { api } from '../services/api';
import HumanBody3D from '../visualizations/HumanBody3D';

export const DashboardPage: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const data = await api.getDashboard();
      setDashboardData(data);
    } catch (err: any) {
      setError("Failed to load clinical dashboard telemetry.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
        <span className="text-xs font-mono text-cyan-400 tracking-wider">Loading Dashboard Telemetry...</span>
      </div>
    );
  }

  const userAnalysesCount = dashboardData?.total_analyses || 0;
  const recentAnalyses = dashboardData?.recent_analyses || [];
  const modelInfo = dashboardData?.model_info || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Welcome Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-medium text-cyan-400 uppercase tracking-widest">
              Clinical Workspace
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs font-mono text-slate-400">
              Authenticated: {dashboardData?.user || 'Clinician'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            Genomic Precision Dashboard
          </h1>
        </div>

        {/* Quick Upload Action */}
        <Link
          to="/analysis"
          className="px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-gradient-to-r from-cyan-400 to-electric-500 hover:from-cyan-300 hover:to-electric-400 text-dark-950 shadow-cyan-glow flex items-center justify-center gap-2 transition-all self-start md:self-auto"
        >
          <Upload className="w-4 h-4" />
          Upload DNA Mutation Assay
        </Link>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Your Analyses</span>
            <FileCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">{userAnalysesCount}</div>
          <div className="text-[11px] text-slate-400">
            {userAnalysesCount === 0 ? "No profiles submitted yet" : "Completed patient assays"}
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>AI Model Engine</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-bold text-emerald-400 truncate font-mono">
            {modelInfo.available ? modelInfo.model_name : "Active Engine"}
          </div>
          <div className="text-[11px] text-slate-400">
            {modelInfo.available ? `${modelInfo.feature_count} driver gene features` : "FastAPI inference connected"}
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>TCGA Reference Cohorts</span>
            <Database className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-3xl font-extrabold text-violet-400 font-mono">2,428</div>
          <div className="text-[11px] text-slate-400">
            LUAD, PAAD, COADREAD, BRCA
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Evidence Matches Assayed</span>
            <Layers className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-3xl font-extrabold text-sky-400 font-mono">
            {dashboardData?.frequent_user_mutations?.length || 0}
          </div>
          <div className="text-[11px] text-slate-400">
            Distinct driver genes identified
          </div>
        </div>
      </div>

      {/* 3D Human Body Anatomy Visualization */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Interactive Anatomical Cohort Explorer</h2>
            <p className="text-xs text-slate-400">Select anatomical regions to review primary tumor driver signatures</p>
          </div>
        </div>
        <HumanBody3D />
      </div>

      {/* Recent Analyses and Frequent Mutations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Analyses Table */}
        <div className="lg:col-span-8 glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Recent Genomic Profiling Analyses</h3>
            <Link to="/history" className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono">
              View All History <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentAnalyses.length === 0 ? (
            <div className="py-12 text-center space-y-3 rounded-xl border border-dashed border-slate-800 bg-dark-950/40">
              <div className="w-10 h-10 rounded-full bg-slate-800/60 flex items-center justify-center mx-auto text-slate-500">
                <Dna className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-semibold text-slate-300">No Genomic Analyses on Record</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                You haven't uploaded any mutation files yet. Submit your first patient sample to explore actionable insights.
              </p>
              <Link
                to="/analysis"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-500 text-dark-950 hover:bg-cyan-400 shadow-cyan-glow"
              >
                <Upload className="w-3.5 h-3.5" /> Upload First Mutation Assay
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="border-b border-slate-800 text-[11px] font-mono uppercase text-slate-500">
                  <tr>
                    <th className="pb-3">Sample ID</th>
                    <th className="pb-3">Predicted Category</th>
                    <th className="pb-3">Confidence</th>
                    <th className="pb-3">Variants</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {recentAnalyses.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 font-mono font-medium text-white">{item.sample_id}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                          {item.top_prediction}
                        </span>
                      </td>
                      <td className="py-3 font-mono">
                        {(item.confidence * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 font-mono text-slate-400">
                        {item.total_variants}
                      </td>
                      <td className="py-3 text-right space-x-2">
                        <Link
                          to={`/results/${item.id}`}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white font-medium text-[11px]"
                        >
                          View
                        </Link>
                        <a
                          href={api.downloadReportUrl(item.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-300 font-medium text-[11px]"
                        >
                          PDF
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* User Frequent Mutation Summary */}
        <div className="lg:col-span-4 glass-panel rounded-2xl p-6 border border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-1">Your Assayed Alterations</h3>
            <p className="text-xs text-slate-400 mb-4">Most frequently observed driver genes across your submitted profiles</p>

            {(!dashboardData?.frequent_user_mutations || dashboardData.frequent_user_mutations.length === 0) ? (
              <p className="text-xs text-slate-500 italic py-6 text-center">
                Driver genes will populate here once you analyze samples.
              </p>
            ) : (
              <div className="space-y-2.5">
                {dashboardData.frequent_user_mutations.map(([gene, count]: [string, number], idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-dark-950/60 border border-slate-800">
                    <span className="font-mono font-bold text-cyan-300 text-xs">{gene}</span>
                    <span className="text-xs text-slate-400 font-mono">{count} assay{count > 1 ? 's' : ''}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800 space-y-2">
            <Link
              to="/comparison"
              className="w-full py-2.5 rounded-xl text-xs font-semibold bg-dark-900 hover:bg-slate-800 border border-slate-700 text-white flex items-center justify-center gap-2 transition-all"
            >
              <Dna className="w-3.5 h-3.5 text-cyan-400" />
              Compare Two Patient Profiles
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
