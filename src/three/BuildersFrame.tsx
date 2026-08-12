// BuildersFrame — a 3D printable Goan collector card floating in the
// hero. THIS is the centerpiece: a stylized illustration of Goa on
// one face, with "HACKER HOUSE / GOA 2026 / BUILDER FRAME" stamped
// on it.
//
// Composition:
//   - Yellow outer edge (frame border)
//   - Pink secondary border (thin)
//   - Deep-green card body
//   - Cream sticker surface with a stylized Goa illustration:
//       yellow sun, dark ocean, palm silhouettes
//   - Drawn via THREE.CanvasTexture from a Canvas2D render (so the
//     postcard is sharp at any zoom level)
//
// The card sits in the foreground Z-depth (≈50) and responds to the
// cursor with the strongest parallax multiplier in the scene. It does
// NOT auto-rotate continuously — only the cursor moves it slightly.

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { TILT, DEPTH, PALETTE } from './constants';

// --- Frame card geometry constants ---
// Aspect: 3:4 — tall vertical card. Matches the brief spec: "vertical
// rectangular frame/card".
const CARD_W = 1.0;
const CARD_H = 1.4;

// Mounted thickness: the visible side / bottom of the printed card.
const FRAME_THICKNESS = 0.04;
const FRAME_INSET = 0.06; // yellow edge that shows past the inner card

// Build a Canvas2D draw of the Goa hero card on a 720x1008 canvas
// (kept modest — texture is downsampled for perf anyway).
function drawFrameCard(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // 1. Yellow outer body (frame edge).
  ctx.fillStyle = '#FFD23F';
  ctx.fillRect(0, 0, w, h);

  // 2. Pink thin secondary border (slightly inset).
  ctx.fillStyle = '#FF2D7B';
  ctx.fillRect(18, 18, w - 36, h - 36);

  // 3. Cream paper surface (the actual sticker).
  ctx.fillStyle = '#F5EBD7';
  ctx.fillRect(28, 28, w - 56, h - 56);

  // 4. Stylized Goa illustration on the upper half — sun + ocean +
  // palms.
  const topHalf = h * 0.55;
  // Sky band
  ctx.fillStyle = '#F5EBD7';
  ctx.fillRect(28, 28, w - 56, topHalf - 28);
  // Yellow sun
  ctx.fillStyle = '#FEE101';
  ctx.beginPath();
  ctx.arc(w * 0.7, topHalf * 0.4, 70, 0, Math.PI * 2);
  ctx.fill();
  // Pink reflection on the sun
  ctx.fillStyle = '#FF2D7B';
  ctx.globalAlpha = 0.3;
  ctx.beginPath();
  ctx.arc(w * 0.7, topHalf * 0.55, 40, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  // Ocean (green band, then dark)
  const oceanTop = topHalf - 24;
  ctx.fillStyle = '#026736';
  ctx.fillRect(28, oceanTop, w - 56, 30);
  ctx.fillStyle = '#0E2A1F';
  ctx.fillRect(28, oceanTop + 30, w - 56, 24);
  // Yellow wave lines
  ctx.fillStyle = '#FFD23F';
  ctx.fillRect(28, oceanTop + 12, w - 56, 4);
  ctx.fillRect(28, oceanTop + 38, w - 56, 4);
  ctx.fillStyle = '#F5EBD7';
  ctx.fillRect(28, oceanTop + 60, w - 56, 2);
  // Palm silhouette (left side)
  ctx.fillStyle = '#0E2A1F';
  ctx.fillRect(w * 0.18, oceanTop - 90, 8, 90); // trunk
  // Palm fronds — simple triangular wedges
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = -Math.PI / 2 + (i - 2) * 0.4;
    const len = 50;
    const cx = w * 0.18 + 4;
    const cy = oceanTop - 90;
    const tx = cx + Math.cos(angle) * len;
    const ty = cy + Math.sin(angle) * len * 0.6;
    ctx.moveTo(cx, cy);
    ctx.lineTo(tx, ty);
    ctx.lineTo(cx - Math.cos(angle) * 4, cy - Math.sin(angle) * 4);
    ctx.closePath();
  }
  ctx.fill();
  // Smaller distant palm
  ctx.fillRect(w * 0.32, oceanTop - 60, 5, 60);
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const angle = -Math.PI / 2 + (i - 1.5) * 0.45;
    const len = 32;
    const cx = w * 0.32 + 2;
    const cy = oceanTop - 60;
    const tx = cx + Math.cos(angle) * len;
    const ty = cy + Math.sin(angle) * len * 0.6;
    ctx.moveTo(cx, cy);
    ctx.lineTo(tx, ty);
    ctx.lineTo(cx - Math.cos(angle) * 3, cy - Math.sin(angle) * 3);
    ctx.closePath();
  }
  ctx.fill();

  // 5. Typography — three lines, deep green Anton-style bold caps.
  // The card text is the actual focus of the frame.
  const textY = topHalf + 80;
  ctx.fillStyle = '#0E2A1F';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  // HACKER HOUSE - smallest, on top
  ctx.font = 'bold 48px "Anton", Impact, sans-serif';
  ctx.fillText('HACKER HOUSE', w / 2, textY);
  // Goan stamp text — pink with yellow outline (visual rubber stamp)
  ctx.font = 'italic 900 84px "Noto Serif Devanagari", serif';
  ctx.textAlign = 'center';
  // Yellow shadow first
  ctx.fillStyle = '#FEE101';
  ctx.fillText('गोवा', w / 2 + 6, textY + 102);
  // Pink on top
  ctx.fillStyle = '#FF2D7B';
  ctx.fillText('गोवा', w / 2, textY + 96);
  // 2026 subline
  ctx.font = 'bold 36px "Anton", Impact, sans-serif';
  ctx.fillStyle = '#0E2A1F';
  ctx.fillText('GOA · 2026', w / 2, textY + 168);

  // 6. Bottom ticket-stub row — three perforated boxes with marker
  // text.
  const stubY = h - 80;
  ctx.fillStyle = '#0E2A1F';
  ctx.fillRect(28, stubY, w - 56, 2);
  ctx.fillRect(28, stubY + 36, w - 56, 2);
  // Three columns
  ctx.font = 'bold 22px "JetBrains Mono", monospace';
  for (let i = 0; i < 3; i++) {
    const x0 = 36 + i * (w - 72) / 3;
    ctx.fillStyle = '#0E2A1F';
    ctx.textAlign = 'left';
    ctx.fillText(['BUILDER', 'FRAME', 'PASS'][i], x0, stubY + 22);
    ctx.font = '14px "JetBrains Mono", monospace';
    ctx.fillText(['№01', '28-31 OCT', '1/247'][i], x0, stubY + 50);
    ctx.font = 'bold 22px "JetBrains Mono", monospace';
  }
  // Vertical dividers
  ctx.fillStyle = '#0E2A1F';
  for (let i = 1; i < 3; i++) {
    const x = 36 + i * (w - 72) / 3 - 8;
    ctx.fillRect(x, stubY + 4, 2, 30);
  }
}

function FrameCard({
  reducedMotion,
}: {
  reducedMotion: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const { gl } = useThree();

  // Build the canvas texture once. Memoized so the card repaints only
  // on mount, not on every render.
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 720;
    canvas.height = 1008;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    drawFrameCard(ctx, canvas.width, canvas.height);
    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = gl.capabilities.getMaxAnisotropy();
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
    return tex;
  }, [gl]);

  // Dispose the texture when the component unmounts.
  useEffect(() => {
    return () => {
      texture?.dispose();
    };
  }, [texture]);

  // Cursor parallax — strongest reaction in the scene.
  useFrame((state) => {
    if (!groupRef.current) return;
    const cx = state.pointer.x; // -1..1
    const cy = state.pointer.y;
    if (reducedMotion) {
      groupRef.current.rotation.x = 0;
      groupRef.current.rotation.y = 0;
      return;
    }
    groupRef.current.rotation.y = cx * THREE.MathUtils.degToRad(TILT.maxDeg * TILT.layerMultipliers.frame);
    groupRef.current.rotation.x = -cy * THREE.MathUtils.degToRad(TILT.maxDeg * TILT.layerMultipliers.frame);
  });

  if (!texture) return null;

  return (
    <group ref={groupRef} position={[0, 0.1, DEPTH.frame]}>
      {/* Inner cream surface with the printed card texture */}
      <mesh position={[0, 0, FRAME_THICKNESS / 2]}>
        <planeGeometry args={[CARD_W - FRAME_INSET * 2, CARD_H - FRAME_INSET * 2]} />
        <meshStandardMaterial map={texture} roughness={0.55} metalness={0} />
      </mesh>
      {/* Pink secondary border — thin band around the cream surface */}
      <mesh position={[0, 0, FRAME_THICKNESS / 2 - 0.005]}>
        <planeGeometry args={[CARD_W - FRAME_INSET * 0.8, CARD_H - FRAME_INSET * 0.8]} />
        <meshBasicMaterial color={PALETTE.pink} />
      </mesh>
      {/* Yellow outer frame */}
      <mesh position={[0, 0, FRAME_THICKNESS / 2 - 0.01]}>
        <planeGeometry args={[CARD_W, CARD_H]} />
        <meshBasicMaterial color={PALETTE.sun} />
      </mesh>
      {/* Dark green thickness box (the side of the printed card) */}
      <mesh position={[0, 0, -FRAME_THICKNESS / 2]}>
        <boxGeometry args={[CARD_W, CARD_H, FRAME_THICKNESS]} />
        <meshStandardMaterial color={PALETTE.ink} roughness={0.85} />
      </mesh>
      {/* Drop shadow plane underneath */}
      <mesh position={[0.03, -0.03, -FRAME_THICKNESS - 0.01]} rotation={[0, 0, 0]}>
        <planeGeometry args={[CARD_W * 1.1, CARD_H * 1.05]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.25} />
      </mesh>
    </group>
  );
}

export function BuildersFrame({ reducedMotion }: { reducedMotion: boolean }) {
  return <FrameCard reducedMotion={reducedMotion} />;
}
