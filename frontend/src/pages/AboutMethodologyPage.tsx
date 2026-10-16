/**
 * ONCOGENIX AI - Methodology & Scientific Framework Page
 * Explains precision oncology concepts, data provenance (TCGA/cBioPortal),
 * machine learning training protocol, clinical evidence matching, and responsible-use ethics.
 */

import React from 'react';
import {
  Dna, Cpu, Database, ShieldAlert, Award, Layers, ExternalLink,
  CheckCircle2, AlertTriangle, GitBranch
} from 'lucide-react';

export const AboutMethodologyPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="space-y-3 border-b border-slate-800 pb-8 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
          <Dna className="w-3.5 h-3.5" />
          SCIENTIFIC PROTOCOL & METHODOLOGY
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Precision Oncology AI Framework
        </h1>
        <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
          Detailed technical documentation on genomic data provenance, supervised machine learning architectures, clinical evidence matching, and ethical operating boundaries.
        </p>
      </div>

      {/* 1. Precision Oncology Concepts */}
      <section className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider">
          <Layers className="w-4 h-4" />
          01. Biological Principles
        </div>
        <h2 className="text-2xl font-bold text-white">Somatic Mutations vs. Germline Variants</h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          Precision oncology focuses on identifying somatic DNA alterations that arise exclusively within tumor tissue during malignant transformation, differentiating them from germline variants present throughout constitutional cells.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
          <div className="p-4 rounded-xl bg-dark-950 border border-slate-800 space-y-1.5">
            <span className="font-bold text-cyan-300 uppercase tracking-wide block">Driver Alterations</span>
            <p className="text-slate-400 leading-relaxed">
              Mutations that confer a selective growth advantage to cancer cells (e.g. KRAS G12C, EGFR L858R, PIK3CA H1047R). These serve as molecular hallmarks for classification and precision drug targets.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-dark-950 border border-slate-800 space-y-1.5">
            <span className="font-bold text-slate-300 uppercase tracking-wide block">Passenger Alterations</span>
            <p className="text-slate-400 leading-relaxed">
              Inconsequential somatic mutations that accumulate due to genomic instability without actively driving tumor progression. Distinguishing drivers from passengers is critical to avoid false targets.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Dataset Provenance & Preprocessing */}
      <section className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-violet-400 text-xs font-mono font-bold uppercase tracking-wider">
          <Database className="w-4 h-4" />
          02. Authentic Data Provenance
        </div>
        <h2 className="text-2xl font-bold text-white">TCGA PanCancer Atlas via cBioPortal API</h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          The models in ONCOGENIX AI are strictly trained and validated on authentic clinical research cohorts downloaded via official REST APIs from cBioPortal:
        </p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
          <li className="p-3 rounded-xl bg-dark-950 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-200">LUAD (Lung Adenocarcinoma)</span>
            <span className="text-cyan-400">566 Samples</span>
          </li>
          <li className="p-3 rounded-xl bg-dark-950 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-200">PAAD (Pancreatic Adenocarcinoma)</span>
            <span className="text-cyan-400">184 Samples</span>
          </li>
          <li className="p-3 rounded-xl bg-dark-950 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-200">COADREAD (Colorectal Adenocarcinoma)</span>
            <span className="text-cyan-400">594 Samples</span>
          </li>
          <li className="p-3 rounded-xl bg-dark-950 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-200">BRCA (Breast Invasive Carcinoma)</span>
            <span className="text-cyan-400">1,084 Samples</span>
          </li>
        </ul>
        <div className="pt-2 text-xs text-slate-400 leading-relaxed">
          <strong>Genome Coordinates:</strong> All training variants were aligned to GRCh37/hg19 standard assembly. Coordinates and alleles are validated using IUPAC nomenclature.
        </div>
      </section>

      {/* 3. Machine Learning Protocol */}
      <section className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-sky-400 text-xs font-mono font-bold uppercase tracking-wider">
          <Cpu className="w-4 h-4" />
          03. Machine Learning Protocol
        </div>
        <h2 className="text-2xl font-bold text-white">Zero Data Leakage & Patient-Level Splitting</h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          A common pitfall in computational genomics is sample leakage, where different biopsies or repeated records from the same patient appear in both train and test partitions.
        </p>
        <div className="p-4 rounded-xl bg-dark-950 border border-cyan-500/20 text-xs text-slate-300 space-y-2">
          <div className="flex items-center gap-2 font-bold text-cyan-300">
            <CheckCircle2 className="w-4 h-4" /> Patient-Level Stratification Guarantee:
          </div>
          <p className="leading-relaxed">
            Data was partitioned using <code>StratifiedGroupKFold</code> on <code>patient_id</code> (1,942 training patients, 486 held-out test patients). There is exactly <strong>0% patient overlap</strong> between partitions.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs text-center font-mono">
          <div className="p-3 rounded-xl bg-dark-950 border border-slate-800">
            <div className="text-slate-400 text-[10px]">Majority Baseline</div>
            <div className="text-lg font-bold text-slate-400">44.4%</div>
            <div className="text-[10px] text-slate-500">Macro F1: 0.154</div>
          </div>
          <div className="p-3 rounded-xl bg-dark-950 border border-slate-800">
            <div className="text-slate-400 text-[10px]">Logistic Regression</div>
            <div className="text-lg font-bold text-sky-300">75.7%</div>
            <div className="text-[10px] text-slate-500">Macro F1: 0.691</div>
          </div>
          <div className="p-3 rounded-xl bg-dark-950 border border-cyan-500/30 shadow-cyan-glow">
            <div className="text-cyan-400 text-[10px]">Gradient Boosting (Selected)</div>
            <div className="text-lg font-bold text-cyan-300">78.4%</div>
            <div className="text-[10px] text-cyan-400">Macro F1: 0.735</div>
          </div>
        </div>
      </section>

      {/* 4. Scientific Limitations */}
      <section className="glass-panel rounded-3xl p-6 sm:p-8 border border-amber-500/30 space-y-4 bg-amber-950/10">
        <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider">
          <ShieldAlert className="w-4 h-4" />
          04. Known Limitations & Responsible Use
        </div>
        <h2 className="text-2xl font-bold text-white">Responsible Clinical Decision-Support</h2>
        <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
          <p>
            1. <strong>Stage and Grade Isolation:</strong> Stage and grade cannot be determined from a mutation list alone. They require anatomical imaging (CT/PET/MRI) and histological evaluation.
          </p>
          <p>
            2. <strong>Mutation Count ≠ Cancer Severity:</strong> A patient with 12 recorded somatic mutations does not automatically have more severe or advanced cancer than a patient with 2 mutations.
          </p>
          <p>
            3. <strong>Abstention Mechanism:</strong> When an input contains zero alterations in the 40 driver genes, ONCOGENIX AI abstains from guessing, returning an explicit "Insufficient Genomic Evidence" status.
          </p>
          <p>
            4. <strong>No Autonomous Prescriptions:</strong> Evidence associations represent documented scientific literature (CIViC/ClinVar) and must be reviewed by board-certified oncologists.
          </p>
        </div>
      </section>
    </div>
  );
};

export default AboutMethodologyPage;
