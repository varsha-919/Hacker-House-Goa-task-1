// GoaSun — large yellow sunset disc placed low on the horizon.
//
// Reads as a low Goa sunset, not a generic glowing ball. It is composed
// of three flat layers stacked on top of each other:
//   1. Big flat yellow circle (the disc itself).
//   2. Larger cream-yellow halo behind, soft falloff (graphic poster
//      glow — not a photo bloom).
//   3. A thin pink horizon stripe just below the disc's bottom edge
//      so the sun reads as a printed-poster element.
//
// Gentle scale pulse (~1%) to feel alive. Pauses on reduced-motion.

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { DEPTH, PALETTE } from './constants';

export function GoaSun({ reducedMotion = false }: { reducedMotion?: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  const geometries = useMemo(
    () => ({
      disc: new THREE.CircleGeometry(1.7, 64),
      halo: new THREE.CircleGeometry(3.4, 64),
      belt: new THREE.PlaneGeometry(8, 0.18),
    }),
    [],
  );

  // Tiny pulse — ±1% over 5s, not a glow-pulse (no neon).
  useFrame((state) => {
    if (reducedMotion || !groupRef.current) return;
    const t = state.clock.elapsedTime;
    const s = 1 + Math.sin(t * 0.7) * 0.01;
    groupRef.current.scale.setScalar(s);
  });

  useEffect(() => {
    return () => {
      geometries.disc.dispose();
      geometries.halo.dispose();
      geometries.belt.dispose();
    };
  }, [geometries]);

  // Positioned low on the horizon (below HACKER).
  // x slightly right so the sun doesn't sit dead center on the
  // pink गोवा stamp.
  return (
    <group ref={groupRef} position={[1.2, -1.2, DEPTH.sun]}>
      {/* Halo — soft outer glow ring */}
      <mesh geometry={geometries.halo}>
        <meshBasicMaterial
          color={PALETTE.sun}
          transparent
          opacity={0.35}
          depthWrite={false}
        />
      </mesh>
      {/* Sun body — flat disc */}
      <mesh geometry={geometries.disc}>
        <meshBasicMaterial color={PALETTE.sunBright} />
      </mesh>
      {/* Pink horizon stripe just under the disc */}
      <mesh
        geometry={geometries.belt}
        position={[0, -1.62, 0.01]}
        rotation={[0, 0, 0]}
      >
        <meshBasicMaterial color={PALETTE.pink} />
      </mesh>
    </group>
  );
}
