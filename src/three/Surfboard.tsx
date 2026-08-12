// Surfboard — stylized surfboard leaning in the scene.
//
// Long flat plane with a rounded nose + tail (built from a stretched
// capsule) and a single horizontal stripe down the center. Two boards
// leaning side-by-side give the Goa beach vibe without crowding the
// scene.
//
// Positioned at the bottom-left, opposite the scooter for visual
// balance.

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { DEPTH, PALETTE } from './constants';

const C = {
  sun: String(PALETTE.sun),
  pink: String(PALETTE.pink),
  goa: String(PALETTE.goa),
} as const;

function buildBoardGeometry(length = 1.6, width = 0.32, thickness = 0.06) {
  // Build a long rounded shape via ExtrudeGeometry — planar with a
  // tear-drop silhouette. We use Shape for the silhouette, then
  // extrude a tiny depth for thickness.
  const shape = new THREE.Shape();
  shape.moveTo(0, -length / 2);
  shape.quadraticCurveTo(width / 2, -length / 2, width / 2, -length / 2 + 0.18);
  shape.lineTo(width / 2, length / 2 - 0.18);
  shape.quadraticCurveTo(width / 2, length / 2, 0, length / 2);
  shape.quadraticCurveTo(-width / 2, length / 2, -width / 2, length / 2 - 0.18);
  shape.lineTo(-width / 2, -length / 2 + 0.18);
  shape.quadraticCurveTo(-width / 2, -length / 2, 0, -length / 2);
  return new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: false,
  });
}

function useBoardGeometries() {
  return useMemo(
    () => ({
      board: buildBoardGeometry(),
      stripe: new THREE.PlaneGeometry(0.04, 1.0),
    }),
    [],
  );
}

type Props = {
  position?: [number, number, number];
  rotation?: [number, number, number];
  color: string;
  stripeColor: string;
};

export function Surfboard({
  position,
  rotation,
  color,
  stripeColor,
}: Props) {
  const g = useBoardGeometries();
  useEffect(() => {
    return () => {
      g.board.dispose();
      g.stripe.dispose();
    };
  }, [g]);

  return (
    <group position={position} rotation={rotation}>
      {/* Board */}
      <mesh geometry={g.board}>
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      {/* Center stripe */}
      <mesh geometry={g.stripe} position={[0, 0, 0.07]}>
        <meshStandardMaterial color={stripeColor} roughness={0.4} />
      </mesh>
    </group>
  );
}

export function Surfboards() {
  return (
    <group position={[0, 0, DEPTH.surfboard]}>
      {/* Board 1 — yellow with pink stripe, leaning left */}
      <Surfboard
        position={[-3.1, -1.8, 0]}
        rotation={[0.05, 0, 0.18]}
        color={C.sun}
        stripeColor={C.pink}
      />
      {/* Board 2 — pink with green stripe, leaning further */}
      <Surfboard
        position={[-2.5, -1.95, 0.05]}
        rotation={[-0.04, 0, 0.22]}
        color={C.pink}
        stripeColor={C.goa}
      />
    </group>
  );
}
