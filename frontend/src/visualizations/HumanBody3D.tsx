/**
 * ONCOGENIX AI - Interactive 3D Anatomical Organ Visualization
 * Stylized 3D anatomical model with selectable target organs (Lungs, Pancreas, Colon, Breast).
 * Provides educational insight into organ-specific molecular signatures.
 */

import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Activity, Info, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface OrganInfo {
  id: string;
  name: string;
  code: string;
  tcgaStudy: string;
  color: string;
  position: [number, number, number];
  primaryDrivers: string[];
  description: string;
}

const ORGANS: OrganInfo[] = [
  {
    id: "lungs",
    name: "Lungs (Bilateral)",
    code: "LUAD",
    tcgaStudy: "Lung Adenocarcinoma (TCGA, PanCancer Atlas)",
    color: "#00f2fe",
    position: [0, 0.75, 0.2],
    primaryDrivers: ["KRAS", "EGFR", "STK11", "KEAP1", "TP53"],
    description: "Characterized by frequent KRAS G12C and EGFR activating mutations with distinct STK11/KEAP1 co-mutation immunoresistance patterns."
  },
  {
    id: "pancreas",
    name: "Pancreas",
    code: "PAAD",
    tcgaStudy: "Pancreatic Adenocarcinoma (TCGA, PanCancer Atlas)",
    color: "#f59e0b",
    position: [0.15, 0.1, 0.25],
    primaryDrivers: ["KRAS (92%)", "TP53", "SMAD4", "CDKN2A"],
    description: "Marked by near-universal KRAS oncogene activation (G12D/V/R) coupled with CDKN2A and SMAD4 tumor suppressor inactivation."
  },
  {
    id: "colon",
    name: "Colorectal Tract",
    code: "COADREAD",
    tcgaStudy: "Colorectal Adenocarcinoma (TCGA, PanCancer Atlas)",
    color: "#10b981",
    position: [0, -0.65, 0.2],
    primaryDrivers: ["APC (>70%)", "KRAS", "TP53", "PIK3CA", "FBXW7"],
    description: "Initiated by APC loss-of-function inducing Wnt pathway deregulation, followed by KRAS and PIK3CA activation."
  },
  {
    id: "breast",
    name: "Breast Tissue",
    code: "BRCA",
    tcgaStudy: "Breast Invasive Carcinoma (TCGA, PanCancer Atlas)",
    color: "#ec4899",
    position: [-0.45, 0.85, 0.35],
    primaryDrivers: ["PIK3CA", "TP53", "CDH1", "GATA3", "BRCA1/2"],
    description: "High prevalence of PIK3CA kinase domain alterations, HRD/BRCA deficiency, and CDH1 loss in invasive lobular subtypes."
  }
];

// Anatomical Human Body Silhouette
const BodyMesh: React.FC<{ selectedOrgan: string; onSelectOrgan: (id: string) => void }> = ({
  selectedOrgan,
  onSelectOrgan
}) => {
  const bodyRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (bodyRef.current) {
      bodyRef.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <group ref={bodyRef}>
      {/* Head */}
      <mesh position={[0, 2.2, 0]}>
        <sphereGeometry args={[0.42, 32, 32]} />
        <meshStandardMaterial color="#1e293b" wireframe transparent opacity={0.35} />
      </mesh>

      {/* Neck */}
      <mesh position={[0, 1.7, 0]}>
        <cylinderGeometry args={[0.18, 0.22, 0.35, 16]} />
        <meshStandardMaterial color="#1e293b" wireframe transparent opacity={0.3} />
      </mesh>

      {/* Torso */}
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.75, 0.55, 1.9, 32]} />
        <meshStandardMaterial color="#1e293b" wireframe transparent opacity={0.25} />
      </mesh>

      {/* Pelvis */}
      <mesh position={[0, -0.6, 0]}>
        <cylinderGeometry args={[0.55, 0.5, 0.6, 32]} />
        <meshStandardMaterial color="#1e293b" wireframe transparent opacity={0.25} />
      </mesh>

      {/* Arms */}
      <mesh position={[-0.95, 0.5, 0]} rotation={[0, 0, 0.2]}>
        <cylinderGeometry args={[0.14, 0.11, 1.8, 16]} />
        <meshStandardMaterial color="#1e293b" wireframe transparent opacity={0.2} />
      </mesh>
      <mesh position={[0.95, 0.5, 0]} rotation={[0, 0, -0.2]}>
        <cylinderGeometry args={[0.14, 0.11, 1.8, 16]} />
        <meshStandardMaterial color="#1e293b" wireframe transparent opacity={0.2} />
      </mesh>

      {/* Legs */}
      <mesh position={[-0.32, -1.8, 0]}>
        <cylinderGeometry args={[0.2, 0.14, 1.9, 16]} />
        <meshStandardMaterial color="#1e293b" wireframe transparent opacity={0.2} />
      </mesh>
      <mesh position={[0.32, -1.8, 0]}>
        <cylinderGeometry args={[0.2, 0.14, 1.9, 16]} />
        <meshStandardMaterial color="#1e293b" wireframe transparent opacity={0.2} />
      </mesh>

      {/* Interactive Hotspot Organs */}
      {ORGANS.map((organ) => {
        const isSelected = selectedOrgan === organ.id;
        return (
          <group
            key={organ.id}
            position={organ.position}
            onClick={(e) => {
              e.stopPropagation();
              onSelectOrgan(organ.id);
            }}
          >
            {/* Glowing core sphere */}
            <mesh>
              <sphereGeometry args={[isSelected ? 0.22 : 0.16, 24, 24]} />
              <meshStandardMaterial
                color={organ.color}
                emissive={organ.color}
                emissiveIntensity={isSelected ? 1.4 : 0.7}
                roughness={0.1}
                metalness={0.8}
              />
            </mesh>

            {/* Pulsing ring indicator */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.26, 0.32, 32]} />
              <meshBasicMaterial
                color={organ.color}
                transparent
                opacity={isSelected ? 0.8 : 0.35}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

export const HumanBody3D: React.FC = () => {
  const [selectedOrganId, setSelectedOrganId] = useState<string>("lungs");
  const selectedOrgan = ORGANS.find(o => o.id === selectedOrganId) || ORGANS[0];

  return (
    <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
      {/* 3D Anatomical Viewer */}
      <div className="lg:col-span-7 h-[420px] relative rounded-xl bg-dark-950/70 border border-slate-800/80 overflow-hidden">
        <Canvas
          camera={{ position: [0, 0, 6.2], fov: 42 }}
          style={{ background: 'transparent' }}
          gl={{ antialias: true, alpha: true }}
        >
          <ambientLight intensity={0.6} />
          <pointLight position={[5, 5, 5]} intensity={1.0} color="#00f2fe" />
          <pointLight position={[-5, -5, -5]} intensity={0.8} color="#8b5cf6" />
          <directionalLight position={[0, 4, 4]} intensity={0.5} />

          <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
            <BodyMesh
              selectedOrgan={selectedOrganId}
              onSelectOrgan={setSelectedOrganId}
            />
          </Float>

          <OrbitControls
            enableZoom={false}
            enablePan={false}
            rotateSpeed={0.7}
            dampingFactor={0.05}
          />
        </Canvas>

        {/* Floating organ pills */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
          {ORGANS.map((organ) => (
            <button
              key={organ.id}
              onClick={() => setSelectedOrganId(organ.id)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                selectedOrganId === organ.id
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-semibold shadow-cyan-glow'
                  : 'bg-dark-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {organ.name}
            </button>
          ))}
        </div>

        <div className="absolute bottom-2.5 right-3 text-[11px] text-slate-500 font-mono flex items-center gap-1.5 pointer-events-none">
          <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          3D Organ Navigation Matrix
        </div>
      </div>

      {/* Organ Clinical Profile Card */}
      <div className="lg:col-span-5 flex flex-col justify-between h-full space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span
              className="w-3 h-3 rounded-full animate-ping"
              style={{ backgroundColor: selectedOrgan.color }}
            />
            <span className="text-xs font-mono font-medium tracking-wider uppercase text-cyan-400">
              {selectedOrgan.code} Focus Cohort
            </span>
          </div>

          <h3 className="text-2xl font-bold text-white mb-1">
            {selectedOrgan.name}
          </h3>
          <p className="text-xs text-slate-400 mb-3 font-mono">
            {selectedOrgan.tcgaStudy}
          </p>

          <p className="text-sm text-slate-300 leading-relaxed mb-4">
            {selectedOrgan.description}
          </p>

          <div className="p-3.5 rounded-xl bg-dark-900/80 border border-slate-800/80 space-y-2">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
              Key TCGA Driver Biomarkers:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {selectedOrgan.primaryDrivers.map((gene, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-0.5 rounded-md text-xs font-mono font-medium bg-cyan-950/60 border border-cyan-500/30 text-cyan-300"
                >
                  {gene}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-900/40 border border-slate-800/60 text-[11px] text-slate-400">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              Scientific Notice: The anatomical 3D visualizer is an educational reference interface, not an imaging scan.
            </span>
          </div>

          <Link
            to="/analysis"
            className="w-full py-2.5 px-4 rounded-xl font-medium text-sm text-center flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-electric-600 hover:from-cyan-400 hover:to-electric-500 text-dark-950 font-semibold shadow-cyan-glow transition-all"
          >
            Assay {selectedOrgan.name} Mutation Profile
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HumanBody3D;
