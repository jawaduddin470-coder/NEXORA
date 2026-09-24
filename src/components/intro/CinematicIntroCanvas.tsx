import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

interface CinematicIntroCanvasProps {
  progress: number; // 0.0 to 1.0
  phase: number; // 1 to 7
}

// Generates an offline crisp texture for editorial passes with high contrast and typography
function createEditorialPassTexture(
  category: string,
  date: string,
  city: string,
  code: string,
  accentColor: string
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 320;
  const ctx = canvas.getContext('2d')!;

  // Crisp Solid White Card with High-Contrast Hairline Border
  ctx.fillStyle = '#FFFFFF';
  ctx.roundRect(10, 10, 492, 300, 16);
  ctx.fill();

  ctx.lineWidth = 3;
  ctx.strokeStyle = '#0F172A';
  ctx.roundRect(10, 10, 492, 300, 16);
  ctx.stroke();

  // Top Category Accent Banner
  ctx.fillStyle = accentColor;
  ctx.roundRect(10, 10, 492, 12, [16, 16, 0, 0]);
  ctx.fill();

  // Category Tag
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 24px "Space Grotesk", monospace, sans-serif';
  ctx.fillText(category.toUpperCase(), 35, 58);

  // Technical Reference Code
  ctx.fillStyle = '#64748B';
  ctx.font = 'bold 16px monospace';
  ctx.fillText(code, 360, 58);

  // Hairline Divider
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(35, 76);
  ctx.lineTo(477, 76);
  ctx.stroke();

  // Date Stamp
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 36px "Space Grotesk", sans-serif';
  ctx.fillText(date, 35, 135);

  // City & Venue
  ctx.fillStyle = '#475569';
  ctx.font = '600 20px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`📍  ${city}`, 35, 175);

  // Bottom Status Badge
  ctx.fillStyle = '#F1F5F9';
  ctx.roundRect(35, 215, 220, 42, 8);
  ctx.fill();

  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 16px monospace';
  ctx.fillText('NEXORA PASS / 2026', 48, 242);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// 3D Physical/Digital Event Pass with physical motion & convergence
const CinematicPass3D = ({
  category,
  date,
  city,
  code,
  accentColor,
  enterProgress,
  targetPos,
  progress,
}: {
  category: string;
  date: string;
  city: string;
  code: string;
  accentColor: string;
  enterProgress: number;
  targetPos: [number, number, number];
  progress: number;
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const texture = useMemo(
    () => createEditorialPassTexture(category, date, city, code, accentColor),
    [category, date, city, code, accentColor]
  );

  useFrame(() => {
    if (!groupRef.current) return;

    if (progress < enterProgress) {
      groupRef.current.scale.set(0, 0, 0);
    } else if (progress < 0.58) {
      // Entering from spatial depth and settling into orbit
      const t = Math.min(1, (progress - enterProgress) / 0.08);
      const easeT = Math.sin(t * Math.PI * 0.5);
      groupRef.current.scale.set(easeT, easeT, easeT);

      // Smooth spatial drift with parallax
      const currentX = targetPos[0] + Math.sin(progress * 3.5 + enterProgress * 8) * 0.15;
      const currentY = targetPos[1] + Math.cos(progress * 2.8 + enterProgress * 8) * 0.12;
      const currentZ = targetPos[2] + Math.sin(progress * 2.0 + enterProgress * 4) * 0.1;

      groupRef.current.position.lerp(new THREE.Vector3(currentX, currentY, currentZ), 0.12);
      groupRef.current.rotation.y = Math.sin(progress * 2.5 + enterProgress * 5) * 0.18;
      groupRef.current.rotation.x = Math.cos(progress * 1.8 + enterProgress * 3) * 0.08;
    } else if (progress < 0.72) {
      // Stage 5 Convergence: Gracefully move toward center and dissolve into energy
      const collapseT = (progress - 0.58) / 0.14;
      const easeCollapse = collapseT * collapseT;
      groupRef.current.position.lerp(new THREE.Vector3(0, 0, 0), easeCollapse * 0.28);
      const scale = Math.max(0, 1 - collapseT * 1.25);
      groupRef.current.scale.set(scale, scale, scale);
      groupRef.current.rotation.y += 0.04;
      groupRef.current.rotation.z += 0.02;
    } else {
      groupRef.current.scale.set(0, 0, 0);
    }
  });

  return (
    <group ref={groupRef} position={[targetPos[0], targetPos[1] + 2, targetPos[2] - 3]}>
      <mesh position={[0, 0, 0.02]}>
        <planeGeometry args={[1.4, 0.85]} />
        <meshBasicMaterial map={texture} transparent opacity={0.98} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.41, 0.86, 0.035]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.2} metalness={0.08} />
      </mesh>
    </group>
  );
};

// Purposeful Constellation Network Lines connecting experiences
const PurposefulConstellationNetwork = ({ progress }: { progress: number }) => {
  const lineRef = useRef<THREE.LineSegments>(null);

  const [positions] = useMemo(() => {
    const nodes = [
      [-2.3, 0.9, 0.5],
      [2.4, 1.1, -0.2],
      [1.9, -1.3, 0.4],
      [-1.9, -1.1, -0.4],
      [0, 2.1, -0.6],
      [0, -2.1, 0.6],
    ];
    const points: number[] = [];
    points.push(...nodes[0], ...nodes[3]);
    points.push(...nodes[1], ...nodes[4]);
    points.push(...nodes[2], ...nodes[5]);
    points.push(...nodes[1], ...nodes[0]);
    points.push(...nodes[4], ...nodes[3]);
    points.push(...nodes[2], ...nodes[1]);
    return [new Float32Array(points)];
  }, []);

  useFrame((_, delta) => {
    if (!lineRef.current) return;
    if (progress >= 0.30 && progress < 0.58) {
      const alpha = Math.min(1, (progress - 0.30) / 0.10);
      lineRef.current.scale.set(alpha, alpha, alpha);
      lineRef.current.rotation.y += delta * 0.15;
    } else if (progress >= 0.58 && progress < 0.72) {
      const collapse = Math.max(0, 1 - (progress - 0.58) / 0.14);
      lineRef.current.scale.set(collapse, collapse, collapse);
      lineRef.current.rotation.y += delta * 0.3;
    } else {
      lineRef.current.scale.set(0, 0, 0);
    }
  });

  return (
    <lineSegments ref={lineRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#38BDF8" transparent opacity={0.35} linewidth={1.5} />
    </lineSegments>
  );
};

// Refined Luminous Human Presence Nodes
const HumanPresenceLightForms = ({ progress }: { progress: number }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (progress >= 0.42 && progress < 0.62) {
      const alpha = Math.sin(((progress - 0.42) / 0.20) * Math.PI);
      groupRef.current.scale.set(alpha, alpha, alpha);
      groupRef.current.rotation.y += delta * 0.2;
    } else {
      groupRef.current.scale.set(0, 0, 0);
    }
  });

  return (
    <group ref={groupRef}>
      {[
        [1.6, 0.3, 0.4],
        [-1.5, -0.5, 0.3],
        [0.7, -1.1, -0.3],
        [-0.8, 1.3, -0.4],
      ].map((pos, idx) => (
        <group key={idx} position={pos as [number, number, number]}>
          <mesh position={[0, 0.2, 0]}>
            <sphereGeometry args={[0.07, 16, 16]} />
            <meshStandardMaterial color="#06B6D4" emissive="#0284C7" emissiveIntensity={0.6} />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.02, 0.1, 0.3, 16]} />
            <meshStandardMaterial color="#8B5CF6" emissive="#4F46E5" emissiveIntensity={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

// Converging Ambient Star / Particle Energy Swarm
const ConvergingEnergyParticles = ({ progress }: { progress: number }) => {
  const pointsRef = useRef<THREE.Points>(null);

  const particleData = useMemo(() => {
    const count = 75;
    const positions = new Float32Array(count * 3);
    const origins = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 2.5 + Math.random() * 3.5;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      origins[i * 3] = x;
      origins[i * 3 + 1] = y;
      origins[i * 3 + 2] = z;
    }

    return { positions, origins, count };
  }, []);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const attr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const array = attr.array as Float32Array;

    if (progress < 0.55) {
      // Gentle floating
      pointsRef.current.rotation.y += delta * 0.08;
      pointsRef.current.rotation.x += delta * 0.04;
    } else if (progress < 0.75) {
      // Active convergence inward toward center
      const convergeT = (progress - 0.55) / 0.20;
      const ease = Math.min(1, convergeT * 1.3);

      for (let i = 0; i < particleData.count; i++) {
        array[i * 3] = THREE.MathUtils.lerp(particleData.origins[i * 3], (Math.random() - 0.5) * 0.4, ease * 0.15);
        array[i * 3 + 1] = THREE.MathUtils.lerp(particleData.origins[i * 3 + 1], (Math.random() - 0.5) * 0.4, ease * 0.15);
        array[i * 3 + 2] = THREE.MathUtils.lerp(particleData.origins[i * 3 + 2], (Math.random() - 0.5) * 0.4, ease * 0.15);
      }
      attr.needsUpdate = true;
      pointsRef.current.rotation.y += delta * 0.25;
    } else {
      // Form subtle orbit around the formed N
      pointsRef.current.rotation.y += delta * 0.12;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleData.count}
          array={particleData.positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color="#38BDF8"
        transparent
        opacity={0.65}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// Concentrated Luminous Energy Core forming from convergence
const LuminousCoreNexus = ({ progress }: { progress: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    if (progress >= 0.52 && progress < 0.72) {
      const t = (progress - 0.52) / 0.20;
      const pulse = Math.sin(t * Math.PI * 3) * 0.15;
      const scale = Math.sin(t * Math.PI) * (0.85 + pulse);
      meshRef.current.scale.set(scale, scale, scale);
      meshRef.current.rotation.y += delta * 1.2;
      meshRef.current.rotation.z += delta * 0.8;
    } else {
      meshRef.current.scale.set(0, 0, 0);
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <sphereGeometry args={[0.3, 32, 32]} />
      <meshStandardMaterial
        color="#8B5CF6"
        emissive="#38BDF8"
        emissiveIntensity={1.2}
        transparent
        opacity={0.65}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
};

// Continuous Camera Director for Seamless Single-Shot Progression
const SingleShotCameraDirector = ({ progress }: { progress: number }) => {
  const sparkPointRef = useRef<THREE.Mesh>(null);

  const eventPasses = useMemo(
    () => [
      { category: 'Music', date: 'OCT 14', city: 'Hyderabad', code: 'NX-HYD-01', accentColor: '#8B5CF6', enterProgress: 0.12, targetPos: [-2.3, 0.9, 0.5] as [number, number, number] },
      { category: 'Technology', date: 'OCT 18', city: 'San Francisco', code: 'NX-SFO-02', accentColor: '#06B6D4', enterProgress: 0.19, targetPos: [2.4, 1.1, -0.2] as [number, number, number] },
      { category: 'Sports', date: 'NOV 04', city: 'London Arena', code: 'NX-LON-03', accentColor: '#10B981', enterProgress: 0.26, targetPos: [1.9, -1.3, 0.4] as [number, number, number] },
      { category: 'Art & Design', date: 'NOV 12', city: 'Paris Expo', code: 'NX-PAR-04', accentColor: '#F43F5E', enterProgress: 0.33, targetPos: [-1.9, -1.1, -0.4] as [number, number, number] },
      { category: 'Workshops', date: 'NOV 25', city: 'Berlin Lab', code: 'NX-BER-05', accentColor: '#4F46E5', enterProgress: 0.40, targetPos: [0, 2.1, -0.6] as [number, number, number] },
      { category: 'Conferences', date: 'DEC 05', city: 'Tokyo Dome', code: 'NX-TYO-06', accentColor: '#F59E0B', enterProgress: 0.47, targetPos: [0, -2.1, 0.6] as [number, number, number] },
    ],
    []
  );

  useFrame((state) => {
    if (progress < 0.18) {
      state.camera.position.z = THREE.MathUtils.lerp(8.0, 6.8, progress / 0.18);
      state.camera.position.x = THREE.MathUtils.lerp(0, 0.15, progress / 0.18);
      state.camera.position.y = 0;
    } else if (progress < 0.60) {
      const t = (progress - 0.18) / 0.42;
      state.camera.position.z = THREE.MathUtils.lerp(6.8, 6.0, t);
      state.camera.position.x = Math.sin(t * Math.PI * 1.4) * 0.45;
      state.camera.position.y = Math.cos(t * Math.PI) * 0.2;
    } else if (progress < 0.82) {
      const t = (progress - 0.60) / 0.22;
      state.camera.position.z = THREE.MathUtils.lerp(6.0, 5.8, t);
      state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, 0, 0.15);
      state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, 0, 0.15);
    } else {
      state.camera.position.z = THREE.MathUtils.lerp(5.8, 6.0, (progress - 0.82) / 0.18);
      state.camera.position.x = 0;
      state.camera.position.y = 0;
    }

    if (sparkPointRef.current) {
      if (progress < 0.20) {
        const pulse = 1 + Math.sin(Date.now() * 0.008) * 0.2;
        sparkPointRef.current.scale.set(pulse, pulse, pulse);
      } else {
        sparkPointRef.current.scale.set(0, 0, 0);
      }
    }
  });

  return (
    <>
      <ambientLight intensity={0.95} />
      <directionalLight position={[4, 6, 4]} intensity={1.5} color="#FFFFFF" />
      <directionalLight position={[-4, -3, 2]} intensity={0.8} color="#C7D2FE" />
      <directionalLight position={[0, 4, -4]} intensity={0.9} color="#38BDF8" />
      <pointLight position={[0, 0, 6]} intensity={0.3} color="#E0E7FF" distance={12} />

      {/* Origin Spark */}
      <mesh ref={sparkPointRef} position={[0, 0, 0]}>
        <sphereGeometry args={[0.14, 32, 32]} />
        <meshStandardMaterial color="#0F172A" emissive="#38BDF8" emissiveIntensity={0.5} />
      </mesh>

      {/* Event Passes */}
      {eventPasses.map((pass) => (
        <CinematicPass3D
          key={pass.code}
          category={pass.category}
          date={pass.date}
          city={pass.city}
          code={pass.code}
          accentColor={pass.accentColor}
          enterProgress={pass.enterProgress}
          targetPos={pass.targetPos}
          progress={progress}
        />
      ))}

      {/* Constellation Network */}
      <PurposefulConstellationNetwork progress={progress} />

      {/* Human Silhouette Nodes */}
      <HumanPresenceLightForms progress={progress} />

      {/* Concentrated Convergence Energy Core */}
      <LuminousCoreNexus progress={progress} />

      {/* Energy Particles */}
      <ConvergingEnergyParticles progress={progress} />
    </>
  );
};

export const CinematicIntroCanvas: React.FC<CinematicIntroCanvasProps> = ({ progress, phase }) => {
  return (
    <div className="w-full h-full relative pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 8.0], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
      >
        <SingleShotCameraDirector progress={progress} />
      </Canvas>
    </div>
  );
};

export default CinematicIntroCanvas;
