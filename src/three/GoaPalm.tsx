// GoaPalm — illustrated coconut palm tree.
//
// Composed of:
//   1. Slender tapered trunk (slightly curved cylinder).
//   2. 7 frond planes fanning from the apex with a slight downward
//      curl — the classic Goa coconut silhouette.
//
// We do NOT use InstancedMesh here because each palm only has ~8
// meshes total; the cost of separate meshes is negligible. We model
// them as one <group> per tree so position/scale/rotation are
// independent.
//
// Gentle leaf sway — 0.5–1.5° amplitude. Reads as "leaves moving in
// the breeze" rather than the whole tree swaying.

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PALETTE } from './constants';

type Props = {
  position: [number, number, number];
  scale?: number;
  reducedMotion?: boolean;
  /** 0..1 — used to phase the sway so palms don't sway in lockstep. */
  swaySeed?: number;
  /** Frond color tint — lets left/right palms differ slightly. */
  tint?: string;
  /** Mirror across Y axis — used for the right palm so its fronds
   * fan the opposite direction, like real Goa coconut palms facing
   * each other. */
  mirror?: boolean;
};

export function GoaPalm({
  position,
  scale = 1,
  reducedMotion = false,
  swaySeed = 0,
  tint,
  mirror = false,
}: Props) {
  const frondsRef = useRef<THREE.Group>(null);

  // Trunk: tapered cylinder, slightly curved by manual displacement.
  const trunkGeometry = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.06, 0.13, 3.0, 8);
    g.translate(0, 1.5, 0);
    // Add slight curve by displacing top vertices a tiny bit forward.
    const pos = g.attributes.position;
    if (pos) {
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        // Top of trunk bows slightly forward.
        const bend = THREE.MathUtils.smoothstep(y, 0.5, 3.0) * 0.18;
        pos.setX(i, pos.getX(i) + bend);
      }
      pos.needsUpdate = true;
    }
    return g;
  }, []);

  // Each frond is a narrow plane with a slight downward curve. We
  // bend it by tweaking vertex Y to make it droop like a real coconut
  // frond in poster illustrations.
  const frondGeometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(1.6, 0.18, 8, 1);
    const pos = g.attributes.position;
    if (pos) {
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        // Outer tip droops down. Inner stays up.
        const t = (x + 0.8) / 1.6; // 0..1 from inner to tip
        pos.setY(i, pos.getY(i) - Math.pow(t, 2.4) * 0.55);
      }
      pos.needsUpdate = true;
    }
    return g;
  }, []);

  // 7 fronds, fan arrangement around the apex (y = 3.0).
  const fronds = useMemo(() => {
    const arr: { rot: [number, number, number] }[] = [];
    const N = 7;
    for (let i = 0; i < N; i++) {
      // Spread fronds between -100° and +100° around Y.
      const t = i / (N - 1);
      const angle = THREE.MathUtils.lerp(-Math.PI * 0.55, Math.PI * 0.55, t);
      arr.push({ rot: [0, angle, 0] });
    }
    return arr;
  }, []);

  // Coconuts — three small spheres hanging from the apex.
  const coconuts = useMemo(
    () => [
      { x: 0.22, y: 2.85, z: 0.1 },
      { x: -0.18, y: 2.78, z: -0.18 },
      { x: 0.08, y: 2.82, z: -0.22 },
    ],
    [],
  );

  // Animate the fronds group's rotation by ±1° around Z, with phase
  // offset per palm so trees don't sway in unison.
  useFrame((state) => {
    if (reducedMotion || !frondsRef.current) return;
    const t = state.clock.elapsedTime + swaySeed * 7;
    frondsRef.current.rotation.z = Math.sin(t * 0.6) * 0.015;
    frondsRef.current.rotation.x = Math.cos(t * 0.45) * 0.008;
  });

  useEffect(() => {
    return () => {
      trunkGeometry.dispose();
      frondGeometry.dispose();
    };
  }, [trunkGeometry, frondGeometry]);

  const frondColor = tint ?? PALETTE.ink;
  const trunkColor = '#081A12';

  return (
    <group
      position={position}
      scale={scale}
      rotation={[0, mirror ? Math.PI : 0, 0]}
    >
      {/* Trunk */}
      <mesh geometry={trunkGeometry}>
        <meshStandardMaterial color={trunkColor} roughness={0.95} metalness={0} />
      </mesh>
      {/* Fronds (group rotates as a unit for the sway) */}
      <group ref={frondsRef} position={[0.1, 2.95, 0]}>
        {fronds.map((f, i) => (
          <mesh
            key={i}
            geometry={frondGeometry}
            rotation={f.rot}
            position={[0, 0, 0]}
          >
            <meshStandardMaterial
              color={frondColor}
              roughness={0.85}
              metalness={0}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}
        {/* Coconuts at the apex */}
        {coconuts.map((c, i) => (
          <mesh key={i} position={[c.x, c.y, c.z]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color="#2C1810" roughness={1} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
