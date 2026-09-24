import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, OrbitControls, RoundedBox, Text } from '@react-three/drei';
import * as THREE from 'three';

interface Ticket3DProps {
  title?: string;
  category?: string;
  date?: string;
  reference?: string;
  ticketQuantity?: number;
}

const TicketMesh: React.FC<Ticket3DProps> = ({
  title = 'NEXORA PASS',
  category = 'VIP ACCESS',
  date = '2026-10-15',
  reference = 'NX-PASS-01',
  ticketQuantity = 1,
}) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.7) * 0.2;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.6} floatIntensity={1.2}>
      <group ref={groupRef}>
        {/* Main metallic 3D ticket pass body */}
        <RoundedBox args={[3.2, 1.85, 0.08]} radius={0.08} smoothness={4}>
          <meshStandardMaterial
            color="#0F172A"
            metalness={0.85}
            roughness={0.2}
            envMapIntensity={1.2}
          />
        </RoundedBox>

        {/* Accent left stripe */}
        <mesh position={[-1.52, 0, 0.045]}>
          <boxGeometry args={[0.09, 1.75, 0.02]} />
          <meshStandardMaterial color="#7C3AED" emissive="#7C3AED" emissiveIntensity={0.4} />
        </mesh>

        {/* Text overlays on pass */}
        <Text
          position={[-0.4, 0.52, 0.05]}
          fontSize={0.15}
          color="#A78BFA"
          anchorX="left"
          fontWeight="bold"
        >
          {category.toUpperCase()}
        </Text>
        <Text
          position={[-0.4, 0.22, 0.05]}
          fontSize={0.19}
          color="#FFFFFF"
          anchorX="left"
          maxWidth={2.2}
          lineHeight={1.1}
          fontWeight="bold"
        >
          {title.length > 22 ? title.slice(0, 22) + '...' : title}
        </Text>
        <Text
          position={[-0.4, -0.28, 0.05]}
          fontSize={0.14}
          color="#38BDF8"
          anchorX="left"
          fontWeight="semibold"
        >
          {date} • {ticketQuantity} {ticketQuantity === 1 ? 'PASS' : 'PASSES'}
        </Text>
        <Text
          position={[-0.4, -0.55, 0.05]}
          fontSize={0.12}
          color="#94A3B8"
          anchorX="left"
        >
          REF: {reference}
        </Text>

        {/* Holographic Security Chip */}
        <mesh position={[1.15, 0.5, 0.05]}>
          <planeGeometry args={[0.38, 0.28]} />
          <meshStandardMaterial
            color="#F59E0B"
            metalness={0.95}
            roughness={0.15}
            emissive="#F59E0B"
            emissiveIntensity={0.2}
          />
        </mesh>

        {/* QR Simulation Strip */}
        <mesh position={[1.15, -0.4, 0.05]}>
          <planeGeometry args={[0.4, 0.4]} />
          <meshBasicMaterial color="#38BDF8" transparent opacity={0.8} />
        </mesh>
      </group>
    </Float>
  );
};

export const Ticket3D: React.FC<Ticket3DProps> = (props) => {
  return (
    <div className="w-full h-[260px] sm:h-[300px] relative">
      <Canvas camera={{ position: [0, 0, 4.2], fov: 45 }} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={1.2} />
        <directionalLight position={[5, 5, 5]} intensity={1.8} color="#ffffff" />
        <directionalLight position={[-5, -5, -2]} intensity={1} color="#A78BFA" />
        <pointLight position={[0, 0, 3]} intensity={0.8} color="#38BDF8" />
        <TicketMesh {...props} />
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={1} />
      </Canvas>
    </div>
  );
};
