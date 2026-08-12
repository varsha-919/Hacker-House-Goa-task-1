// Stickers — sparse decorative paper stickers floating near the
// builders frame.
//
// Replaces the old random grey triangle particles. Each sticker is a
// small rounded-edge square (built from a flat plane + inset highlight)
// in cream / pink / yellow, with a slight rotation. They sit at the
// scene foreground depth and respond to cursor parallax.
//
// We use ~5 stickers maximum, positioned around the builders frame.
// Their purpose: add density of "physical paper" without busy geometry.

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TILT, DEPTH, PALETTE } from './constants';

// PALETTE values are typed as `ColorRepresentation` (number | string)
// so we coerce to plain strings here — the spec only needs hex.
const C = {
  pink: String(PALETTE.pink),
  sun: String(PALETTE.sun),
  ink: String(PALETTE.ink),
  cream: String(PALETTE.cream),
  creamBright: String(PALETTE.creamBright),
} as const;

type StickerSpec = {
  position: [number, number, number];
  rotation: [number, number, number];
  size: [number, number];
  color: string;
  edgeColor: string;
};

const STICKERS: StickerSpec[] = [
  // "BUILD MODE" — pink, top-left of the frame.
  {
    position: [-1.4, 1.0, DEPTH.stickerA],
    rotation: [-0.1, 0.15, 0.12],
    size: [0.55, 0.18],
    color: C.pink,
    edgeColor: C.ink,
  },
  // "GOA × HACKER" cream/yellow sticker — bottom-right of frame.
  {
    position: [1.5, -1.0, DEPTH.stickerB],
    rotation: [0.12, -0.18, -0.08],
    size: [0.7, 0.22],
    color: C.sun,
    edgeColor: C.ink,
  },
  // Smaller pink dot sticker, mid-bottom
  {
    position: [-0.85, -1.25, DEPTH.stickerA],
    rotation: [0.2, 0.05, 0.18],
    size: [0.32, 0.32],
    color: C.pink,
    edgeColor: C.cream,
  },
  // Tiny cream "BUILDER No.01" tag — bottom-left
  {
    position: [0.95, 1.05, DEPTH.stickerB],
    rotation: [-0.18, 0.2, -0.06],
    size: [0.45, 0.16],
    color: C.cream,
    edgeColor: C.ink,
  },
  // Yellow star-ish accent at upper-right (small)
  {
    position: [1.7, 0.8, DEPTH.stickerA],
    rotation: [0.08, -0.1, 0.22],
    size: [0.28, 0.28],
    color: C.sun,
    edgeColor: C.pink,
  },
];

function Sticker({ spec, reducedMotion }: { spec: StickerSpec; reducedMotion: boolean }) {
  const ref = useRef<THREE.Group>(null);

  const geometry = useMemo(
    () => new THREE.PlaneGeometry(spec.size[0], spec.size[1]),
    [spec.size],
  );
  const edgeGeometry = useMemo(
    () => new THREE.PlaneGeometry(spec.size[0] + 0.04, spec.size[1] + 0.04),
    [spec.size],
  );
  const innerHighlight = useMemo(
    () => new THREE.PlaneGeometry(spec.size[0] - 0.05, spec.size[1] - 0.05),
    [spec.size],
  );

  useEffect(() => {
    return () => {
      geometry.dispose();
      edgeGeometry.dispose();
      innerHighlight.dispose();
    };
  }, [geometry, edgeGeometry, innerHighlight]);

  // Subtle parallax — apply TILT layer multiplier.
  useFrame((state) => {
    if (reducedMotion || !ref.current) return;
    const cx = state.pointer.x;
    const cy = state.pointer.y;
    const mult = TILT.layerMultipliers.stickerA;
    ref.current.rotation.x = spec.rotation[0] - cy * THREE.MathUtils.degToRad(TILT.maxDeg * mult);
    ref.current.rotation.y = spec.rotation[1] + cx * THREE.MathUtils.degToRad(TILT.maxDeg * mult);
  });

  return (
    <group ref={ref} position={spec.position} rotation={spec.rotation}>
      {/* Edge / shadow color */}
      <mesh geometry={edgeGeometry} position={[0, 0, -0.005]}>
        <meshBasicMaterial color={spec.edgeColor} />
      </mesh>
      {/* Body */}
      <mesh geometry={geometry}>
        <meshBasicMaterial color={spec.color} />
      </mesh>
      {/* Inner highlight — slightly inset lighter color */}
      <mesh geometry={innerHighlight} position={[0, 0, 0.001]}>
        <meshBasicMaterial
          color={spec.color === PALETTE.cream ? PALETTE.creamBright : spec.color}
          transparent
          opacity={spec.color === PALETTE.cream ? 1 : 0.85}
        />
      </mesh>
    </group>
  );
}

export function Stickers({ reducedMotion = false }: { reducedMotion?: boolean }) {
  return (
    <group>
      {STICKERS.map((spec, i) => (
        <Sticker key={i} spec={spec} reducedMotion={reducedMotion} />
      ))}
    </group>
  );
}
