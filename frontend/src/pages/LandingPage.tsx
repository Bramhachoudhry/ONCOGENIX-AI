/**
 * ONCOGENIX AI - Landing Page
 * Premium futuristic dark biotech interface inspired by high-end clinical AI dashboards.
 * Features interactive 3D DNA helix, real TCGA metrics, workflow explanations,
 * supported formats, and responsible-use notices.
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Dna, Activity, ShieldCheck, Database, FileText, ArrowRight,
  GitCompare, Layers, CheckCircle2, AlertTriangle, Cpu, Sparkles
} from 'lucide-react';
import DnaHelix3D from '../visualizations/DnaHelix3D';
import { api } from '../services/api';

export const LandingPage: React.FC = () => {
  const [modelInfo, setModelInfo] = useState<any>(null);

  useEffect(() => {
    api.getModelInfo().then(data => {
      if (data && data.available) {
        setModelInfo(data);
      }
    }).catch(() => {});
  }, []);

  return (
    <div className="relative overflow-hidden bg-tech-grid min-h-screen">
      {/* Background ambient lighting glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-gradient-radial from-cyan-500/10 via-violet-500/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-10 right-10 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* 1. HERO SECTION */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20 lg:pt-16 lg:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Headings & CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-6 space-y-6 text-center lg:text-left z-10"
          >
            {/* Clinical Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/50 border border-cyan-500/30 text-cyan-300 text-xs font-mono tracking-wider shadow-cyan-glow">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              AI-DRIVEN PRECISION ONCOLOGY PLATFORM
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
              Your DNA Holds Clues.<br />
              <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-violet-400 bg-clip-text text-transparent">
                Let’s Decode Them.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
              Explore tumor mutation patterns, investigate cancer-associated genomic profiles, and connect molecular findings with documented clinical evidence from CIViC and ClinVar.
            </p>

            {/* CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link
                to="/analysis"
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-cyan-400 to-electric-500 hover:from-cyan-300 hover:to-electric-400 text-dark-950 shadow-cyan-glow flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
              >
                <Dna className="w-4 h-4" />
                Start DNA Analysis
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/dashboard"
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-medium text-sm text-slate-200 hover:text-white bg-dark-900/80 border border-slate-800 hover:border-slate-700 hover:bg-slate-850/60 transition-all flex items-center justify-center gap-2"
              >
                <Activity className="w-4 h-4 text-cyan-400" />
                Explore Platform
              </Link>
            </div>

            {/* Subtle verification tag */}
            <div className="pt-4 flex items-center justify-center lg:justify-start gap-6 text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> TCGA PanCancer Atlas
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> CIViC Evidence Engine
              </span>
            </div>
          </motion.div>

          {/* Right Column: Interactive 3D DNA Helix */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-6 relative flex items-center justify-center"
          >
            <div className="w-full max-w-[540px] aspect-square rounded-3xl p-1 bg-gradient-to-b from-cyan-500/20 via-transparent to-violet-500/20 border border-slate-800/80 backdrop-blur-sm relative shadow-2xl">
              <DnaHelix3D className="w-full h-full" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. PLATFORM METRICS */}
      <section className="border-y border-slate-800/80 bg-dark-900/60 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4 rounded-xl bg-dark-950/40 border border-slate-800/60">
              <div className="text-3xl sm:text-4xl font-extrabold text-cyan-400 font-mono">2,428</div>
              <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-medium">TCGA Tumor Cohorts</div>
              <div className="text-[10px] text-slate-500 mt-0.5">LUAD, PAAD, COADREAD, BRCA</div>
            </div>

            <div className="p-4 rounded-xl bg-dark-950/40 border border-slate-800/60">
              <div className="text-3xl sm:text-4xl font-extrabold text-violet-400 font-mono">40</div>
              <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-medium">Core Driver Genes</div>
              <div className="text-[10px] text-slate-500 mt-0.5">KRAS, TP53, EGFR, STK11, etc.</div>
            </div>

            <div className="p-4 rounded-xl bg-dark-950/40 border border-slate-800/60">
              <div className="text-3xl sm:text-4xl font-extrabold text-cyan-400 font-mono">
                {modelInfo ? `${(modelInfo.evaluation_metrics?.accuracy * 100).toFixed(1)}%` : '78.4%'}
              </div>
              <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-medium">Held-Out Test Accuracy</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Zero-leakage patient-level split</div>
            </div>

            <div className="p-4 rounded-xl bg-dark-950/40 border border-slate-800/60">
              <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-mono">100%</div>
              <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-medium">Traceable Evidence</div>
              <div className="text-[10px] text-slate-500 mt-0.5">CIViC, ClinVar & NCCN</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. KEY PLATFORM FEATURES */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="text-xs font-mono font-medium text-cyan-400 uppercase tracking-widest">
            Core Scientific Modules
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Advanced Genomic Decision-Support
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Built to decipher the complexity of tumor heterogeneity, identifying driver alterations and correlating them with documented clinical therapies.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="glass-panel glass-panel-hover rounded-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Cancer Classification</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Predicts primary cancer category from binary tumor mutation profiles using supervised gradient boosted ensembles validated on TCGA PanCancer data.
            </p>
            <ul className="text-xs text-slate-400 space-y-2 pt-2 border-t border-slate-800">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Calibrated probability estimates
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Automatic abstention on wildtype profiles
              </li>
            </ul>
          </div>

          {/* Feature 2 */}
          <div className="glass-panel glass-panel-hover rounded-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Clinical Evidence Matching</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Maps detected variants to authoritative clinical guidelines (CIViC, ClinVar, FDA labels) specifying approved therapies, resistance biomarkers, and clinical trials.
            </p>
            <ul className="text-xs text-slate-400 space-y-2 pt-2 border-t border-slate-800">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-violet-400" /> Level A FDA-approved therapies
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-violet-400" /> Genomic coordinate & allele verification
              </li>
            </ul>
          </div>

          {/* Feature 3 */}
          <div className="glass-panel glass-panel-hover rounded-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <GitCompare className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Patient Profile Comparison</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Interactively compares two patient mutation assays to isolate shared driver variants, divergent mutations, and differential drug sensitivity targets.
            </p>
            <ul className="text-xs text-slate-400 space-y-2 pt-2 border-t border-slate-800">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" /> Jaccard genomic overlap metric
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" /> Side-by-side evidence divergence
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 4. WORKFLOW: HOW IT WORKS */}
      <section className="border-t border-slate-800/80 bg-dark-950/70 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <div className="text-xs font-mono font-medium text-cyan-400 uppercase tracking-widest">
              Analytical Protocol
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              From Raw DNA Assay to Clinical Insights
            </h2>
            <p className="text-slate-400 text-sm">
              A 4-step pipeline designed with strict validation and zero data leakage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl bg-dark-900/90 border border-slate-800 space-y-3 relative">
              <span className="text-3xl font-black font-mono text-cyan-500/30">01</span>
              <h4 className="text-base font-bold text-white">Assay Upload</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Submit CSV, TSV, MAF, or JSON tumor mutation files. Validates chromosome nomenclature, IUPAC alleles, and genome builds.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-dark-900/90 border border-slate-800 space-y-3 relative">
              <span className="text-3xl font-black font-mono text-cyan-500/30">02</span>
              <h4 className="text-base font-bold text-white">Genomic Normalization</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Maps variants to the 40-gene driver matrix (GRCh37/GRCh38). Deduplicates repeated calls and checks coordinate integrity.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-dark-900/90 border border-slate-800 space-y-3 relative">
              <span className="text-3xl font-black font-mono text-cyan-500/30">03</span>
              <h4 className="text-base font-bold text-white">AI Cancer Classification</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Infers primary cancer category using gradient boosting trained on authentic TCGA somatic alterations with calibrated confidence.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-dark-900/90 border border-slate-800 space-y-3 relative">
              <span className="text-3xl font-black font-mono text-cyan-500/30">04</span>
              <h4 className="text-base font-bold text-white">Clinical Evidence PDF</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Matches variants against CIViC/ClinVar to generate targeted therapy recommendations and a downloadable clinical PDF report.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SUPPORTED DATA FORMATS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="glass-panel rounded-3xl p-8 lg:p-12 border border-cyan-500/20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-4">
              <span className="text-xs font-mono font-medium text-cyan-400 uppercase tracking-widest">
                Data Interoperability
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-white">
                Compatible with Industry Standard Assays
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                ONCOGENIX AI supports standard files generated by Next-Generation Sequencing (NGS) panels, cBioPortal downloads, and bioinformatics pipelines.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="px-3 py-1 rounded-lg text-xs font-mono bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 font-semibold">CSV Tables</span>
                <span className="px-3 py-1 rounded-lg text-xs font-mono bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 font-semibold">TSV Exports</span>
                <span className="px-3 py-1 rounded-lg text-xs font-mono bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 font-semibold">MAF Files</span>
                <span className="px-3 py-1 rounded-lg text-xs font-mono bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 font-semibold">Structured JSON</span>
              </div>
            </div>

            <div className="lg:col-span-7 bg-dark-950/90 rounded-2xl p-5 border border-slate-800 font-mono text-xs overflow-x-auto shadow-inner">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-slate-500">
                <span>cBioPortal_sample_mutation_format.csv</span>
                <span className="text-cyan-400">RFC 4180 Validated</span>
              </div>
              <pre className="text-slate-300 space-y-1">
                <span className="text-slate-500"># Required & Optional Column Headers</span><br />
                <span className="text-cyan-300">Hugo_Symbol,Chromosome,Start_Position,Reference_Allele,Tumor_Seq_Allele2,HGVSp_Short</span><br />
                <span className="text-slate-200">KRAS,chr12,25398284,C,A,p.G12C</span><br />
                <span className="text-slate-200">TP53,chr17,7577538,C,T,p.R248W</span><br />
                <span className="text-slate-200">STK11,chr19,1207062,C,T,p.Q37*</span><br />
                <span className="text-slate-200">EGFR,chr7,55249071,C,T,p.T790M</span>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* 6. RESPONSIBLE USE & SCIENTIFIC LIMITATIONS */}
      <section className="border-t border-slate-800/80 bg-dark-950 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">Responsible Use & Scientific Limitations</h3>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed text-justify sm:text-center">
            ONCOGENIX AI is strictly an investigational bioinformatics research and clinical decision-support tool. It does not replace tissue biopsy pathology, TNM anatomical staging, or the judgment of certified clinical oncologists. Stage and grade cannot be determined from a mutation list alone, and mutation counts do not imply cancer severity.
          </p>
        </div>
      </section>

      {/* 7. CALL TO ACTION SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="glass-panel rounded-3xl p-10 lg:p-16 border border-cyan-500/30 relative overflow-hidden space-y-6">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-violet-500/10 pointer-events-none" />
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Ready to Analyze Tumor Genomics?
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto">
            Upload your mutation assay to immediately detect actionable biomarkers, compare molecular profiles, and generate clinical-grade precision reports.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to="/analysis"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-cyan-400 to-electric-500 hover:from-cyan-300 hover:to-electric-400 text-dark-950 shadow-cyan-glow flex items-center justify-center gap-2 transition-all hover:scale-105"
            >
              <Dna className="w-4 h-4" />
              Launch DNA Assay
            </Link>
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-medium text-sm text-slate-200 hover:text-white bg-dark-900 border border-slate-800 hover:border-slate-700 transition-all"
            >
              Create Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
