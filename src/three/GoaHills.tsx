// GoaHills — distant green hill silhouette as a flat shape.
//
// A long, low-poly green ridge behind the sun. Built from a single
// plane with a procedural hill silhouette baked into geometry. The
// ridge stays low so it doesn't compete with the title type.
//
// Why not generate via shader: a flat shape with hard outline reads
// as the printed-poster aesthetic; a shaded sphere reads as 3D.

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { DEPTH, PALETTE } from './constants';

function buildHillGeometry(width: number, baseY: number, peakCount: number, seed: number) {
  // Hill silhouette: a flat plane cropped to the shape of a hill.
  // We sample peakCount vertices along the top edge at varying heights
  // and connect them with the base — gives a smooth mountain-line look
  // for a vintage poster.
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0);

  // Deterministic pseudo-random for stable peaks across renders.
  let s = seed | 0;
  const rand = () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  // Step across the width; each segment's top is base + peakHeight * rand.
  const step = width / peakCount;
  for (let i = 0; i <= peakCount; i++) {
    const x = -width / 2 + step * i;
    const h = 0.6 + rand() * 0.7;
    shape.lineTo(x, h);
  }
  shape.lineTo(width / 2, 0);
  shape.lineTo(-width / 2, 0);
  shape.closePath();

  return new THREE.ShapeGeometry(shape);
}

export function GoaHills({ reducedMotion = false }: { reducedMotion?: boolean }) {
  const geometry = useMemo(
    () => buildHillGeometry(20, 0, 14, 1337),
    [],
  );

  useEffect(() => {
    return () => geometry.dispose();
  }, [geometry]);

  // Back hill — lighter goa-green.
  return (
    <mesh
      geometry={geometry}
      position={[0, -2.4, DEPTH.hills]}
      rotation={[0, 0, 0]}
    >
      <meshBasicMaterial color={PALETTE.goa} />
    </mesh>
  );
}
