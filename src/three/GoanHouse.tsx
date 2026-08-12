// GoanHouse — a small Portuguese-style Goan house in the background.
//
// Reads as a printed-illustration element. Built from extruded shapes:
//   - Cream wall block (the body of the house).
//   - Green roof (red/clay-tile green for visual punch — Goa palette
//     uses a saturated forest-green tile here, not realistic terracotta).
//   - Pink windows — the signature Portuguese-Bali Indo touch.
//   - Yellow door.
//   - A short picket fence stripe at the base.
//
// Sized small enough to sit clearly behind the typography but be
// recognizable. Positioned mid-left so it doesn't fight the right palm.

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { DEPTH, PALETTE } from './constants';

function useHouseGeometries() {
  return useMemo(() => {
    return {
      wall: new THREE.BoxGeometry(1.0, 0.9, 0.6),
      roof: new THREE.ConeGeometry(0.85, 0.5, 4),
      window: new THREE.PlaneGeometry(0.16, 0.16),
      door: new THREE.PlaneGeometry(0.18, 0.32),
      fence: new THREE.BoxGeometry(1.4, 0.08, 0.04),
      post: new THREE.BoxGeometry(0.04, 0.18, 0.04),
    };
  }, []);
}

export function GoanHouse({ position = [-2.6, -1.2, DEPTH.house] as [number, number, number] }: {
  position?: [number, number, number];
}) {
  const g = useHouseGeometries();

  useEffect(() => {
    return () => {
      Object.values(g).forEach((geo) => geo.dispose());
    };
  }, [g]);

  return (
    <group position={position} rotation={[0, 0.18, 0]}>
      {/* Wall */}
      <mesh geometry={g.wall} position={[0, 0.45, 0]}>
        <meshStandardMaterial color={PALETTE.cream} roughness={0.85} />
      </mesh>
      {/* Roof — slightly tilted cone, pyramid shape (4 sides) */}
      <mesh
        geometry={g.roof}
        position={[0, 1.15, 0]}
        rotation={[0, Math.PI / 4, 0]}
      >
        <meshStandardMaterial color={PALETTE.goa} roughness={0.7} />
      </mesh>
      {/* Windows — pink, two on the front face */}
      <mesh geometry={g.window} position={[-0.25, 0.55, 0.301]}>
        <meshStandardMaterial color={PALETTE.pink} roughness={0.6} />
      </mesh>
      <mesh geometry={g.window} position={[0.25, 0.55, 0.301]}>
        <meshStandardMaterial color={PALETTE.pink} roughness={0.6} />
      </mesh>
      {/* Window frames — thin dark green lines around each window */}
      <mesh geometry={g.window} position={[-0.25, 0.78, 0.301]}>
        <meshBasicMaterial color={PALETTE.creamBright} />
      </mesh>
      <mesh geometry={g.window} position={[0.25, 0.78, 0.301]}>
        <meshBasicMaterial color={PALETTE.creamBright} />
      </mesh>
      {/* Door — yellow */}
      <mesh geometry={g.door} position={[0, 0.16, 0.301]}>
        <meshStandardMaterial color={PALETTE.sun} roughness={0.6} />
      </mesh>
      {/* Base fence — green stripe with little posts */}
      <mesh geometry={g.fence} position={[0, -0.04, 0.45]}>
        <meshStandardMaterial color={PALETTE.goa} roughness={0.6} />
      </mesh>
      <mesh geometry={g.post} position={[-0.6, 0.05, 0.45]}>
        <meshStandardMaterial color={PALETTE.goa} roughness={0.6} />
      </mesh>
      <mesh geometry={g.post} position={[0, 0.05, 0.45]}>
        <meshStandardMaterial color={PALETTE.goa} roughness={0.6} />
      </mesh>
      <mesh geometry={g.post} position={[0.6, 0.05, 0.45]}>
        <meshStandardMaterial color={PALETTE.goa} roughness={0.6} />
      </mesh>
    </group>
  );
}
