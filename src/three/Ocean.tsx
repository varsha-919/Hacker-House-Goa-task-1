// Ocean — a banded 3D ocean, not realistic water.
//
// Reads as a printed Goa poster: layers of horizontal ribbons in
// dark green, with thin yellow wave-line strokes and pink micro
// accents on top. The ocean sits below the sun and the hills, in
// the mid-low portion of the hero.
//
// Animation: tiny vertical drift on the wave strokes (1-2% amplitude)
// so the water feels alive. Reduced-motion pauses it.

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { DEPTH, PALETTE, HERO } from './constants';

export function Ocean({ reducedMotion = false }: { reducedMotion?: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  // Three horizontal bands — back band is darker (further from light),
  // front band is lighter.
  const bands = useMemo(
    () => [
      { y: -2.1, h: 1.6, color: PALETTE.goa, opacity: 1 },
      { y: -2.95, h: 1.4, color: PALETTE.inkDeep, opacity: 1 },
      { y: -3.7, h: 1.2, color: '#021F14', opacity: 1 },
    ],
    [],
  );

  // Wave-stroke geometry: a flat ribbon with a sine-style top edge,
  // drawn as a yellow stripe with low opacity. 3 of them stacked
  // at different y positions to suggest wave layers.
  const waves = useMemo(
    () => [
      { y: -2.05, color: PALETTE.sun, opacity: 0.85, phase: 0 },
      { y: -2.85, color: PALETTE.sunBright, opacity: 0.55, phase: 1.3 },
      { y: -3.45, color: PALETTE.pink, opacity: 0.4, phase: 2.6 },
      { y: -4.0, color: PALETTE.creamBright, opacity: 0.45, phase: 0.5 },
    ],
    [],
  );

  const stripeGeoms = useMemo(
    () => waves.map(() => new THREE.PlaneGeometry(20, 0.06, 1, 1)),
    [waves.length],
  );

  useFrame((state) => {
    if (reducedMotion || !groupRef.current) return;
    // Subtle horizontal scroll on the wave stripes — 1 px amplitude
    // over 6s. Reads as "drifting waves". Stops on reduced-motion.
    const t = state.clock.elapsedTime;
    groupRef.current.children.forEach((child, i) => {
      const phase = waves[i]?.phase ?? 0;
      child.position.x = Math.sin(t * 0.5 + phase) * 0.15;
    });
  });

  useEffect(() => {
    return () => {
      stripeGeoms.forEach((g) => g.dispose());
    };
  }, [stripeGeoms]);

  return (
    <group ref={groupRef} position={[0, 0, DEPTH.ocean]}>
      {/* Solid color bands — from back (lighter) to front (deeper) */}
      {bands.map((b, i) => (
        <mesh key={i} position={[0, b.y, 0]}>
          <planeGeometry args={[20, b.h]} />
          <meshBasicMaterial color={b.color} />
        </mesh>
      ))}
      {/* Wave-stroke highlights */}
      {waves.map((w, i) => (
        <mesh key={i} geometry={stripeGeoms[i]} position={[0, w.y, 0.02]}>
          <meshBasicMaterial
            color={w.color}
            transparent
            opacity={w.opacity}
          />
        </mesh>
      ))}
    </group>
  );
}
