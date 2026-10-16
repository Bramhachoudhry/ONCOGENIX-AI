/**
 * ONCOGENIX AI - Interactive 3D DNA Double Helix
 * Built with Three.js, React Three Fiber (@react-three/fiber), and Drei.
 * Features antiparallel sugar-phosphate backbones, hydrogen-bonded base pairs,
 * orbital glowing particles, and interactive user rotation controls.
 */

import React, { useRef, useMemo, Component, ErrorInfo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

// Fallback component for devices without WebGL
class WebGLBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn("WebGL Context unavailable:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-dark-900/60 rounded-2xl border border-cyan-500/20">
          <div className="w-20 h-20 rounded-full border-2 border-dashed border-cyan-400 animate-spin flex items-center justify-center mb-4">
            <span className="text-cyan-400 text-xs font-mono">DNA</span>
          </div>
          <h4 className="text-cyan-400 font-semibold mb-1">Interactive 3D DNA Engine</h4>
          <p className="text-slate-400 text-xs max-w-xs">
            WebGL hardware acceleration is restricted. Precision molecular visualization is active in fallback mode.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

interface HelixProps {
  numBasePairs?: number;
  radius?: number;
  height?: number;
  turns?: number;
}

const HelixMesh: React.FC<HelixProps> = ({
  numBasePairs = 28,
  radius = 2.0,
  height = 9.0,
  turns = 2.8
}) => {
  const groupRef = useRef<THREE.Group>(null);

  // Compute 3D coordinates for the double helix
  const { strandA, strandB, basePairs } = useMemo(() => {
    const sA: THREE.Vector3[] = [];
    const sB: THREE.Vector3[] = [];
    const bp: { pA: THREE.Vector3; pB: THREE.Vector3; mid: THREE.Vector3; color: string }[] = [];

    const baseColors = ['#00f2fe', '#38bdf8', '#818cf8', '#a855f7'];

    for (let i = 0; i < numBasePairs; i++) {
      const t = i / (numBasePairs - 1);
      const angle = t * Math.PI * 2 * turns;
      const y = (t - 0.5) * height;

      // Strand A (5' -> 3')
      const xA = Math.cos(angle) * radius;
      const zA = Math.sin(angle) * radius;
      const posA = new THREE.Vector3(xA, y, zA);
      sA.push(posA);

      // Strand B (Antiparallel, phase shifted by 180 degrees)
      const xB = Math.cos(angle + Math.PI) * radius;
      const zB = Math.sin(angle + Math.PI) * radius;
      const posB = new THREE.Vector3(xB, y, zB);
      sB.push(posB);

      // Base pair bridge between posA and posB
      const mid = new THREE.Vector3((xA + xB) / 2, y, (zA + zB) / 2);
      bp.push({
        pA: posA,
        pB: posB,
        mid,
        color: baseColors[i % baseColors.length]
      });
    }

    return { strandA: sA, strandB: sB, basePairs: bp };
  }, [numBasePairs, radius, height, turns]);

  // Gentle rotation on each frame
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.45;
      groupRef.current.rotation.x = Math.sin(Date.now() * 0.0005) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Strand A Nucleotides (Cyan Glow) */}
      {strandA.map((pos, idx) => (
        <mesh key={`strandA-${idx}`} position={pos}>
          <sphereGeometry args={[0.16, 16, 16]} />
          <meshStandardMaterial
            color="#00f2fe"
            emissive="#00c6ff"
            emissiveIntensity={0.6}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>
      ))}

      {/* Strand B Nucleotides (Electric Violet Glow) */}
      {strandB.map((pos, idx) => (
        <mesh key={`strandB-${idx}`} position={pos}>
          <sphereGeometry args={[0.16, 16, 16]} />
          <meshStandardMaterial
            color="#8b5cf6"
            emissive="#7c3aed"
            emissiveIntensity={0.6}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>
      ))}

      {/* Hydrogen-bonded Base Pair Bridges */}
      {basePairs.map((pair, idx) => {
        // Create cylinder between pA and pB
        const dir = new THREE.Vector3().subVectors(pair.pB, pair.pA);
        const len = dir.length();
        const orientation = new THREE.Matrix4();
        orientation.lookAt(pair.pA, pair.pB, new THREE.Vector3(0, 1, 0));

        return (
          <group key={`basepair-${idx}`} position={pair.mid}>
            <mesh rotation={[Math.PI / 2, 0, Math.atan2(pair.pB.x - pair.pA.x, pair.pB.z - pair.pA.z)]}>
              <cylinderGeometry args={[0.045, 0.045, len, 8]} />
              <meshStandardMaterial
                color={pair.color}
                emissive={pair.color}
                emissiveIntensity={0.4}
                roughness={0.3}
                metalness={0.5}
                transparent
                opacity={0.85}
              />
            </mesh>
          </group>
        );
      })}

      {/* Orbital Ring Guide (inspired by modern futuristic diagnostic aesthetics) */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius * 1.5, radius * 1.52, 64]} />
        <meshBasicMaterial color="#00f2fe" opacity={0.15} transparent side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

export const DnaHelix3D: React.FC<{ className?: string }> = ({ className = "w-full h-[520px]" }) => {
  return (
    <div className={`relative ${className}`}>
      <WebGLBoundary>
        <Canvas
          camera={{ position: [0, 0, 8.5], fov: 42 }}
          style={{ background: 'transparent' }}
          gl={{ antialias: true, alpha: true }}
        >
          <ambientLight intensity={0.7} />
          <pointLight position={[10, 10, 10]} intensity={1.5} color="#00f2fe" />
          <pointLight position={[-10, -10, -10]} intensity={1.2} color="#8b5cf6" />
          <directionalLight position={[0, 5, 5]} intensity={0.8} />

          <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
            <HelixMesh />
          </Float>

          {/* Floating Quantum / Genomic Bio-particles */}
          <Sparkles count={45} scale={8} size={2.2} speed={0.4} color="#00f2fe" opacity={0.6} />
          <Sparkles count={35} scale={7} size={2.0} speed={0.3} color="#a855f7" opacity={0.5} />

          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate={false}
            rotateSpeed={0.8}
            dampingFactor={0.05}
          />
        </Canvas>
      </WebGLBoundary>

      {/* Interactive prompt overlay */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1 rounded-full bg-dark-900/80 border border-cyan-500/20 text-[11px] text-cyan-300 pointer-events-none backdrop-blur-md">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
        Interactive 3D Helix: Drag to Rotate
      </div>
    </div>
  );
};

export default DnaHelix3D;
