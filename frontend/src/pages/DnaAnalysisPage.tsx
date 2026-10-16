/**
 * ONCOGENIX AI - DNA Analysis & Mutation Assay Upload Page
 * Supports drag-and-drop file upload, file inspection, format validation,
 * sample presets (LUAD, PAAD, BRCA, COAD), and background processing.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, Dna, FileText, CheckCircle2, AlertCircle, ArrowRight,
  ShieldCheck, RefreshCw, Zap
} from 'lucide-react';
import { api } from '../services/api';

const SAMPLE_PRESETS = [
  {
    name: "Sample A: Lung Adenocarcinoma (LUAD)",
    filename: "sample_a_variants.csv",
    description: "Assay with KRAS G12C, TP53 R248W, STK11 Q37*, KEAP1, EGFR T790M",
    content: `Hugo_Symbol,Chromosome,Start_Position,End_Position,Reference_Allele,Tumor_Seq_Allele2,Variant_Classification,HGVSp_Short,Tumor_Sample_Barcode,NCBI_Build
KRAS,chr12,25398284,25398284,C,A,Missense_Mutation,p.G12C,SAMPLE-LUAD-001,GRCh37
TP53,chr17,7577538,7577538,C,T,Missense_Mutation,p.R248W,SAMPLE-LUAD-001,GRCh37
STK11,chr19,1207062,1207062,C,T,Nonsense_Mutation,p.Q37*,SAMPLE-LUAD-001,GRCh37
KEAP1,chr19,10599547,10599547,C,T,Missense_Mutation,p.R320W,SAMPLE-LUAD-001,GRCh37
EGFR,chr7,55249071,55249071,C,T,Missense_Mutation,p.T790M,SAMPLE-LUAD-001,GRCh37`
  },
  {
    name: "Sample B: Pancreatic Adenocarcinoma (PAAD)",
    filename: "sample_b_variants.csv",
    description: "Assay with KRAS G12D, TP53 R175H, SMAD4 R361H, CDKN2A R80*",
    content: `Hugo_Symbol,Chromosome,Start_Position,End_Position,Reference_Allele,Tumor_Seq_Allele2,Variant_Classification,HGVSp_Short,Tumor_Sample_Barcode,NCBI_Build
KRAS,chr12,25398284,25398284,C,T,Missense_Mutation,p.G12D,SAMPLE-PAAD-002,GRCh37
TP53,chr17,7577120,7577120,G,A,Missense_Mutation,p.R175H,SAMPLE-PAAD-002,GRCh37
SMAD4,chr18,48591873,48591873,G,A,Missense_Mutation,p.R361H,SAMPLE-PAAD-002,GRCh37
CDKN2A,chr9,21971153,21971153,C,T,Nonsense_Mutation,p.R80*,SAMPLE-PAAD-002,GRCh37`
  },
  {
    name: "Sample C: Breast Invasive Carcinoma (BRCA)",
    filename: "sample_c_brca_pik3ca.csv",
    description: "Assay with PIK3CA H1047R, CDH1 Y142*, PTEN R130Q, BRCA1 C61G",
    content: `Hugo_Symbol,Chromosome,Start_Position,End_Position,Reference_Allele,Tumor_Seq_Allele2,Variant_Classification,HGVSp_Short,Tumor_Sample_Barcode,NCBI_Build
PIK3CA,chr3,178952085,178952085,A,G,Missense_Mutation,p.H1047R,SAMPLE-BRCA-003,GRCh37
CDH1,chr16,68842686,68842686,C,G,Nonsense_Mutation,p.Y142*,SAMPLE-BRCA-003,GRCh37
PTEN,chr10,89692904,89692904,G,A,Missense_Mutation,p.R130Q,SAMPLE-BRCA-003,GRCh37
BRCA1,chr17,41276045,41276045,T,G,Missense_Mutation,p.C61G,SAMPLE-BRCA-003,GRCh37`
  },
  {
    name: "Sample D: Colorectal Adenocarcinoma (COAD)",
    filename: "sample_d_coad_apc.csv",
    description: "Assay with APC R1450*, KRAS G12V, TP53 R248W, PIK3CA E545K",
    content: `Hugo_Symbol,Chromosome,Start_Position,End_Position,Reference_Allele,Tumor_Seq_Allele2,Variant_Classification,HGVSp_Short,Tumor_Sample_Barcode,NCBI_Build
APC,chr5,112175955,112175955,C,T,Nonsense_Mutation,p.R1450*,SAMPLE-COAD-004,GRCh37
KRAS,chr12,25398285,25398285,G,T,Missense_Mutation,p.G12V,SAMPLE-COAD-004,GRCh37
TP53,chr17,7577538,7577538,C,T,Missense_Mutation,p.R248W,SAMPLE-COAD-004,GRCh37
PIK3CA,chr3,178936091,178936091,G,A,Missense_Mutation,p.E545K,SAMPLE-COAD-004,GRCh37`
  }
];

export const DnaAnalysisPage: React.FC = () => {
  const navigate = useNavigate();

  const [sampleId, setSampleId] = useState("SAMPLE-LUAD-001");
  const [patientIdentifier, setPatientIdentifier] = useState("PT-8294");
  const [genomeAssembly, setGenomeAssembly] = useState("GRCh37");
  const [analysisType, setAnalysisType] = useState("classification_and_evidence");
  const [fileFormat, setFileFormat] = useState("csv");

  const [rawContent, setRawContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [privacyAgreed, setPrivacyAgreed] = useState(true);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
    const fname = file.name.toLowerCase();
    if (fname.endsWith(".tsv")) setFileFormat("tsv");
    else if (fname.endsWith(".maf")) setFileFormat("maf");
    else if (fname.endsWith(".json")) setFileFormat("json");
    else setFileFormat("csv");

    const reader = new FileReader();
    reader.onload = (event) => {
      setRawContent(event.target?.result as string);
    };
    reader.readAsText(file);
  };

  const handleLoadPreset = (preset: typeof SAMPLE_PRESETS[0]) => {
    setSelectedFile(null);
    setRawContent(preset.content);
    setSampleId(preset.filename.replace(".csv", "").toUpperCase());
    setFileFormat("csv");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!rawContent.trim() && !selectedFile) {
      setError("Please select a mutation file or load a reference test assay.");
      return;
    }

    if (!privacyAgreed) {
      setError("You must confirm intended investigational use.");
      return;
    }

    setProcessing(true);

    try {
      const formData = new FormData();
      formData.append("sample_id", sampleId);
      formData.append("patient_identifier", patientIdentifier);
      formData.append("genome_assembly", genomeAssembly);
      formData.append("analysis_type", analysisType);
      formData.append("file_format", fileFormat);

      if (selectedFile) {
        formData.append("file", selectedFile);
      } else {
        formData.append("raw_content", rawContent);
      }

      const result = await api.createAnalysis(formData);
      navigate(`/results/${result.id}`);
    } catch (err: any) {
      const detail = err.response?.data?.details ||
                     err.response?.data?.error ||
                     "Analysis submission failed. Please verify the AI service is online.";
      setError(detail);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-2 border-b border-slate-800 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
          <Dna className="w-3.5 h-3.5" />
          GENOMIC MUTATION ASSAY PIPELINE
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Upload & Analyze DNA Mutation Profile
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl">
          Submit somatic variant calls in CSV, TSV, MAF, or JSON format. The assay will be normalized, assayed for driver alterations, and matched against clinical evidence.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Preset Fast-Loader */}
      <div className="p-5 rounded-2xl bg-dark-900/60 border border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Zap className="w-4 h-4 text-cyan-400" />
          <span>Quick Load: Pre-Validated Reference TCGA Tumor Assays</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {SAMPLE_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleLoadPreset(preset)}
              className="p-3 text-left rounded-xl bg-dark-950 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-850/60 transition-all text-xs space-y-1 group"
            >
              <div className="font-bold text-white group-hover:text-cyan-300">{preset.name}</div>
              <div className="text-[11px] text-slate-400 line-clamp-2">{preset.description}</div>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Drag & Drop Area */}
        <div className="lg:col-span-7 space-y-4">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all flex flex-col items-center justify-center min-h-[280px] ${
              dragActive
                ? 'border-cyan-400 bg-cyan-950/30 scale-[1.01]'
                : 'border-slate-800 hover:border-slate-700 bg-dark-900/40'
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4">
              <Upload className="w-7 h-7" />
            </div>

            <h3 className="text-base font-semibold text-white mb-1">
              Drag and drop your mutation assay file here
            </h3>
            <p className="text-xs text-slate-400 mb-4 max-w-sm">
              Supports CSV, TSV, MAF, and JSON files up to 25MB containing Hugo_Symbol and genomic alterations.
            </p>

            <label className="px-4 py-2 rounded-xl text-xs font-semibold bg-dark-800 hover:bg-dark-700 text-cyan-300 border border-cyan-500/30 cursor-pointer transition-all shadow-sm">
              Browse Local Files
              <input
                type="file"
                accept=".csv,.tsv,.maf,.json,.txt"
                onChange={handleFileInput}
                className="hidden"
              />
            </label>
          </div>

          {/* File inspection details */}
          {(selectedFile || rawContent) && (
            <div className="p-4 rounded-xl bg-dark-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-white flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  {selectedFile ? selectedFile.name : `${sampleId}.csv (Loaded Preset)`}
                </span>
                <span className="font-mono text-cyan-400 uppercase">{fileFormat}</span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                {rawContent.split("\n").filter(l => l.trim()).length} rows loaded into memory
              </div>
            </div>
          )}

          {/* Raw content preview / manual edit */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">Assay Raw Data Content (CSV / TSV / MAF)</label>
            <textarea
              rows={6}
              value={rawContent}
              onChange={(e) => setRawContent(e.target.value)}
              placeholder="Hugo_Symbol,Chromosome,Start_Position,Reference_Allele,Tumor_Seq_Allele2..."
              className="w-full p-3 rounded-xl bg-dark-950 border border-slate-800 text-xs font-mono text-slate-200 outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Right Column: Parameters and Confirm */}
        <div className="lg:col-span-5 glass-panel rounded-2xl p-6 border border-slate-800 space-y-5 h-fit">
          <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">
            Assay Parameters
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Sample Barcode / Assay ID</label>
              <input
                type="text"
                required
                value={sampleId}
                onChange={(e) => setSampleId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-dark-950 border border-slate-800 text-xs text-white outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Pseudonymous Patient ID</label>
              <input
                type="text"
                value={patientIdentifier}
                onChange={(e) => setPatientIdentifier(e.target.value)}
                placeholder="PT-001 (Optional)"
                className="w-full px-3 py-2 rounded-xl bg-dark-950 border border-slate-800 text-xs text-white outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Genome Assembly</label>
              <select
                value={genomeAssembly}
                onChange={(e) => setGenomeAssembly(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-dark-950 border border-slate-800 text-xs text-white outline-none focus:border-cyan-400"
              >
                <option value="GRCh37">GRCh37 / hg19 (TCGA PanCancer Standard)</option>
                <option value="GRCh38">GRCh38 / hg38 (NCBI Modern Build)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Analysis Mode</label>
              <select
                value={analysisType}
                onChange={(e) => setAnalysisType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-dark-950 border border-slate-800 text-xs text-white outline-none focus:border-cyan-400"
              >
                <option value="classification_and_evidence">
                  Cancer Classification & Clinical Evidence
                </option>
                <option value="evidence_only">
                  Biomarker & Clinical Evidence Matching Only
                </option>
              </select>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={privacyAgreed}
                onChange={(e) => setPrivacyAgreed(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-slate-700 bg-dark-950 text-cyan-500 focus:ring-cyan-400"
              />
              <span className="text-[11px] text-slate-400 leading-relaxed">
                I verify that this genomic data is de-identified and authorized for research decision-support.
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={processing}
            className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-cyan-400 to-electric-500 hover:from-cyan-300 hover:to-electric-400 text-dark-950 shadow-cyan-glow flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {processing ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-dark-950" />
                Processing Genomic Assay...
              </span>
            ) : (
              <>
                <Dna className="w-4 h-4" />
                Execute Precision Analysis
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DnaAnalysisPage;
