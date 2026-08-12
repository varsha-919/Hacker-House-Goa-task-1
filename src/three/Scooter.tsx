// Scooter — a tiny vintage-style moped decoration in the hero scene.
//
// Abstract enough that it doesn't need to be a literal Vespa. Built
// from stacked primitives:
//   - Yellow body (rounded box)
//   - Green seat (smaller box on top)
//   - Pink handlebars (thin extruded bar)
//   - Two dark wheels (small cylinders)
//
// Positioned at the bottom-right of the hero, behind the right palm.
// Reads as a "tiny collectible illustration" at scene scale.

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { DEPTH, PALETTE } from './constants';

function useScooterGeometries() {
  return useMemo(() => {
    return {
      body: new THREE.BoxGeometry(0.55, 0.18, 0.22),
      seat: new THREE.BoxGeometry(0.18, 0.06, 0.18),
      handle: new THREE.BoxGeometry(0.4, 0.04, 0.04),
      wheel: new THREE.CylinderGeometry(0.09, 0.09, 0.05, 12),
      headlight: new THREE.SphereGeometry(0.05, 8, 6),
    };
  }, []);
}

type Props = {
  position?: [number, number, number];
};

export function Scooter({ position = [2.7, -2.3, DEPTH.scooter] as [number, number, number] }: Props) {
  const g = useScooterGeometries();
  useEffect(() => {
    return () => Object.values(g).forEach((geo) => geo.dispose());
  }, [g]);

  return (
    <group position={position} rotation={[0, -0.4, 0]} scale={0.9}>
      {/* Body */}
      <mesh geometry={g.body} position={[0, 0.12, 0]}>
        <meshStandardMaterial color={PALETTE.sun} roughness={0.6} />
      </mesh>
      {/* Seat */}
      <mesh geometry={g.seat} position={[-0.05, 0.24, 0]}>
        <meshStandardMaterial color={PALETTE.goa} roughness={0.7} />
      </mesh>
      {/* Handlebars */}
      <mesh geometry={g.handle} position={[0.18, 0.34, 0]} rotation={[0, 0, -0.2]}>
        <meshStandardMaterial color={PALETTE.pink} roughness={0.5} />
      </mesh>
      {/* Wheels */}
      <mesh
        geometry={g.wheel}
        position={[-0.2, 0, 0.12]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <meshStandardMaterial color={PALETTE.inkDeep} roughness={0.95} />
      </mesh>
      <mesh
        geometry={g.wheel}
        position={[0.2, 0, 0.12]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <meshStandardMaterial color={PALETTE.inkDeep} roughness={0.95} />
      </mesh>
      <mesh
        geometry={g.wheel}
        position={[-0.2, 0, -0.12]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <meshStandardMaterial color={PALETTE.inkDeep} roughness={0.95} />
      </mesh>
      <mesh
        geometry={g.wheel}
        position={[0.2, 0, -0.12]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <meshStandardMaterial color={PALETTE.inkDeep} roughness={0.95} />
      </mesh>
      {/* Headlight — small bright disc on the front */}
      <mesh geometry={g.headlight} position={[0.32, 0.18, 0]}>
        <meshStandardMaterial
          color={PALETTE.creamBright}
          emissive={PALETTE.sun}
          emissiveIntensity={0.4}
          roughness={0.3}
        />
      </mesh>
    </group>
  );
}
