/**
 * ONCOGENIX AI - Institutional Footer
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Dna, ShieldAlert, ExternalLink, Github, Database } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-dark-950 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                <Dna className="w-4 h-4 text-cyan-400" />
              </div>
              <span className="font-bold text-white text-base tracking-wider">ONCOGENIX AI</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              “Decode the Mutation. Understand the Cancer. Advance Precision Medicine.”
            </p>
            <p className="text-[11px] text-slate-500 font-mono">
              Research & Clinical Decision Support Prototype
            </p>
          </div>

          {/* Platform Links */}
          <div className="space-y-2">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-200">Platform</h5>
            <ul className="space-y-1.5 text-xs">
              <li><Link to="/dashboard" className="hover:text-cyan-400 transition-colors">Clinical Dashboard</Link></li>
              <li><Link to="/analysis" className="hover:text-cyan-400 transition-colors">DNA Mutation Assay</Link></li>
              <li><Link to="/comparison" className="hover:text-cyan-400 transition-colors">Patient Comparison</Link></li>
              <li><Link to="/history" className="hover:text-cyan-400 transition-colors">Analysis History</Link></li>
              <li><Link to="/about" className="hover:text-cyan-400 transition-colors">Methodology & Limits</Link></li>
            </ul>
          </div>

          {/* Scientific Data Provenance */}
          <div className="space-y-2">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-200">Data Provenance</h5>
            <ul className="space-y-1.5 text-xs">
              <li>
                <a href="https://www.cbioportal.org/" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-cyan-400">
                  cBioPortal TCGA PanCancer <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="https://civicdb.org/" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-cyan-400">
                  CIViC Clinical Interpretations <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="https://www.ncbi.nlm.nih.gov/clinvar/" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-cyan-400">
                  NCBI ClinVar Database <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="https://portal.gdc.cancer.gov/" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-cyan-400">
                  NCI Genomic Data Commons <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Compliance & Responsible Use Statement */}
          <div className="space-y-2">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
              Clinical Notice
            </h5>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              ONCOGENIX AI is strictly an investigational research and clinical decision-support prototype. It does not replace pathological examination, formal cancer staging, or licensed oncologist directives.
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} ONCOGENIX AI Platform. Designed for Precision Medicine & Genomic Research.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>TCGA Verified</span>
            <span>•</span>
            <span>CIViC Integrated</span>
            <span>•</span>
            <span>Firebase Secured</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
