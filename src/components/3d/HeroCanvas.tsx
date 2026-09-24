import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sparkles, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const OfficialBrand3DHeroCore = () => {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const sphereRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * (hovered ? 0.45 : 0.22);
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.35;
    }
    if (sphereRef.current) {
      const angle = Date.now() * 0.0016;
      sphereRef.current.position.x = Math.cos(angle) * 2.2;
      sphereRef.current.position.y = Math.sin(angle) * 0.7;
      sphereRef.current.position.z = Math.sin(angle) * 1.4;
    }
  });

  return (
    <Float speed={2.2} rotationIntensity={0.5} floatIntensity={0.8}>
      <group
        ref={groupRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        {/* Left Pillar - Violet / Indigo Facet */}
        <mesh position={[-0.75, 0, 0]}>
          <boxGeometry args={[0.5, 2.6, 0.35]} />
          <meshPhysicalMaterial
            color="#8B5CF6"
            emissive="#4F46E5"
            emissiveIntensity={0.2}
            roughness={0.1}
            metalness={0.15}
            transmission={0.82}
            ior={1.55}
            transparent
            opacity={0.92}
          />
        </mesh>

        {/* Diagonal Slash - Electric Blue / Cyan Specular Spine */}
        <mesh position={[0, 0, 0.05]} rotation={[0, 0, -0.68]}>
          <boxGeometry args={[0.48, 3.2, 0.32]} />
          <meshPhysicalMaterial
            color="#06B6D4"
            emissive="#3B82F6"
            emissiveIntensity={0.35}
            roughness={0.08}
            metalness={0.25}
            transmission={0.85}
            ior={1.6}
            transparent
            opacity={0.95}
          />
        </mesh>

        {/* Right Pillar - Translucent Ice Blue Facet */}
        <mesh position={[0.75, 0, 0]}>
          <boxGeometry args={[0.5, 2.6, 0.35]} />
          <meshPhysicalMaterial
            color="#38BDF8"
            emissive="#06B6D4"
            emissiveIntensity={0.15}
            roughness={0.12}
            metalness={0.1}
            transmission={0.88}
            ior={1.5}
            transparent
            opacity={0.9}
          />
        </mesh>

        {/* Angled Orbital Halo Ring */}
        <mesh ref={ringRef} rotation={[Math.PI / 3.2, 0.3, -0.2]}>
          <torusGeometry args={[2.0, 0.032, 24, 120]} />
          <meshStandardMaterial
            color="#38BDF8"
            emissive="#C084FC"
            emissiveIntensity={0.6}
            roughness={0.1}
            metalness={0.8}
            transparent
            opacity={0.85}
          />
        </mesh>

        {/* Orbiting Satellite Sphere */}
        <mesh ref={sphereRef} position={[1.6, 0.4, 0.7]}>
          <sphereGeometry args={[0.15, 32, 32]} />
          <meshStandardMaterial
            color="#A855F7"
            emissive="#06B6D4"
            emissiveIntensity={0.5}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>

        {/* Twin Sparkle Stars */}
        <group position={[1.3, 1.2, 0.4]}>
          {/* Major Star */}
          <mesh position={[0, 0, 0]}>
            <octahedronGeometry args={[0.2, 0]} />
            <meshStandardMaterial color="#C084FC" emissive="#7C3AED" emissiveIntensity={0.8} />
          </mesh>
          {/* Minor Star */}
          <mesh position={[0.3, -0.22, 0.08]}>
            <octahedronGeometry args={[0.11, 0]} />
            <meshStandardMaterial color="#8B5CF6" emissive="#6366F1" emissiveIntensity={0.8} />
          </mesh>
        </group>

        {/* Ambient Sparkles */}
        <Sparkles count={40} scale={5.5} size={2.5} speed={0.4} color="#06B6D4" />
      </group>
    </Float>
  );
};

export const HeroCanvas: React.FC = () => {
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center bg-violet-50/50 dark:bg-slate-900/40 rounded-3xl border border-violet-200 dark:border-violet-500/20">
        <div className="w-48 h-48 rounded-full bg-gradient-to-tr from-violet-600 via-indigo-500 to-cyan-400 blur-2xl opacity-60 animate-pulse-slow" />
      </div>
    );
  }

  return (
    <div className="w-full h-[400px] sm:h-[480px] cursor-grab active:cursor-grabbing relative">
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={1.1} />
        <directionalLight position={[10, 10, 8]} intensity={2.0} color="#FFFFFF" />
        <directionalLight position={[-10, -5, -5]} intensity={0.9} color="#C4B5FD" />
        <pointLight position={[0, -4, 4]} intensity={1.3} color="#06B6D4" />
        <pointLight position={[4, 4, -4]} intensity={1.3} color="#8B5CF6" />
        <OfficialBrand3DHeroCore />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.8} />
      </Canvas>
      <div className="absolute bottom-2 right-4 text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-semibold pointer-events-none">
        Interactive 3D Crystalline Pass
      </div>
    </div>
  );
};

export default HeroCanvas;
