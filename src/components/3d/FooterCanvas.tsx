import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

const NexoraSignatureCrystal = () => {
  const crystalRef = useRef<THREE.Mesh>(null);
  const ringRef1 = useRef<THREE.Mesh>(null);
  const ringRef2 = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (crystalRef.current) {
      crystalRef.current.rotation.y += delta * 0.25;
      crystalRef.current.rotation.x += delta * 0.12;
    }
    if (ringRef1.current) {
      ringRef1.current.rotation.z += delta * 0.35;
      ringRef1.current.rotation.x += delta * 0.15;
    }
    if (ringRef2.current) {
      ringRef2.current.rotation.z -= delta * 0.2;
      ringRef2.current.rotation.y += delta * 0.25;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.8} floatIntensity={1.2}>
      <group>
        {/* Central Faceted Translucent Crystal Core */}
        <mesh ref={crystalRef}>
          <octahedronGeometry args={[1.1, 0]} />
          <MeshDistortMaterial
            color="#8b5cf6"
            emissive="#4f46e5"
            emissiveIntensity={0.3}
            roughness={0.15}
            metalness={0.85}
            distort={0.18}
            speed={1.2}
            transparent={true}
            opacity={0.85}
          />
        </mesh>

        {/* Primary Orbital Ring */}
        <mesh ref={ringRef1} rotation={[Math.PI / 3, Math.PI / 6, 0]}>
          <torusGeometry args={[1.7, 0.025, 16, 64]} />
          <meshStandardMaterial
            color="#06b6d4"
            emissive="#06b6d4"
            emissiveIntensity={0.6}
            roughness={0.2}
            metalness={0.9}
          />
        </mesh>

        {/* Secondary Tilted Counter-Orbital Ring */}
        <mesh ref={ringRef2} rotation={[-Math.PI / 4, Math.PI / 4, 0]}>
          <torusGeometry args={[2.0, 0.015, 16, 64]} />
          <meshStandardMaterial
            color="#a855f7"
            emissive="#9333ea"
            emissiveIntensity={0.5}
            roughness={0.3}
            metalness={0.8}
            transparent={true}
            opacity={0.7}
          />
        </mesh>

        {/* Tiny Orbital Sparkle Nodes */}
        <mesh position={[1.7, 0, 0]}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
        <mesh position={[-1.7, 0, 0]}>
          <sphereGeometry args={[0.05, 12, 12]} />
          <meshBasicMaterial color="#c084fc" />
        </mesh>
      </group>
    </Float>
  );
};

export const FooterCanvas: React.FC<{ className?: string }> = ({ className = 'w-64 h-64 sm:w-72 sm:h-72' }) => {
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    return (
      <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-violet-600 via-indigo-500 to-cyan-400 opacity-50 blur-xl mx-auto" />
    );
  }

  return (
    <div className={`${className} mx-auto relative pointer-events-none`}>
      <Canvas camera={{ position: [0, 0, 4.5], fov: 42 }} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[4, 5, 4]} intensity={1.4} color="#38bdf8" />
        <pointLight position={[-4, -3, 3]} intensity={1.8} color="#a855f7" />
        <NexoraSignatureCrystal />
      </Canvas>
    </div>
  );
};

export default FooterCanvas;
