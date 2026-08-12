// FramePreview3D — a 3D physical-frame card view of the same canvas
// that gets downloaded as a PNG.
//
// How it works:
//   1. Parent (FramePreviewHost) calls renderBuilderIDToCanvas or
//      renderTeamPosterToCanvas from src/lib/{export,teamExport}.ts
//      and passes the resulting HTMLCanvasElement to this component.
//   2. We wrap that canvas in a THREE.CanvasTexture once.
//   3. We apply that texture to a flat plane (the poster face) sitting
//      on top of a dark-green thickness box (the back + edge of the
//      printed card).
//
// Why this matters: the canvas we render is BIT-IDENTICAL to the one
// canvasToPngDataUrl serializes for the download. There is no second
// render path. The 3D card is literally the printed poster; the user
// sees the same pixels at download time that they see on screen.
//
// Mobile: this component is heavy. FramePreviewHost swaps in the
// existing BuilderIDPreview/TeamPreview DOM components on small
// viewports, so this only loads on desktop.

import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// CanvasGeometry aspect: 1080 / 1350 = 0.8. We size the plane on a unit
// of 1.0 width and 1.25 height so 1080/1350 maps cleanly.
const POSTER_W = 1.0;
const POSTER_H = 1.25;
const FRAME_THICKNESS = 0.06;
const FRAME_INSET = 0.02; // box slightly larger than plane so the edge shows

// TiltCard — the 3D frame. Auto-rotates slightly with sin() unless
// the user drags to take over. Responds to cursor position over the
// canvas for parallax.
function TiltCard({
  posterCanvas,
  reducedMotion,
}: {
  posterCanvas: HTMLCanvasElement;
  reducedMotion: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const { gl, size } = useThree();

  // Build the texture from the canvas. We update it whenever the
  // canvas changes (i.e. slot data changes → re-rendered by parent).
  const texture = useMemo(() => {
    const tex = new THREE.CanvasTexture(posterCanvas);
    tex.anisotropy = gl.capabilities.getMaxAnisotropy();
    tex.needsUpdate = true;
    return tex;
    // Re-build when the canvas reference changes (new render).
  }, [posterCanvas, gl]);

  // Cleanup the texture on unmount or canvas switch.
  useEffect(() => {
    return () => {
      texture.dispose();
    };
  }, [texture]);

  // Manual drag-to-rotate. Tracks pointer delta on the canvas and
  // adjusts the group's rotation around Y while dragging. Releases
  // back to auto-tilt on pointerup.
  const dragState = useRef<{ active: boolean; lastX: number; lastY: number }>({
    active: false,
    lastX: 0,
    lastY: 0,
  });
  const userRotation = useRef({ x: 0, y: 0 });

  // Auto-tilt: slow sin wave on Y axis (±3°) so the card "breathes".
  // Pauses on reduced-motion.
  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;

    // If user is dragging, use drag-driven rotation directly.
    if (dragState.current.active) {
      groupRef.current.rotation.x = userRotation.current.x;
      groupRef.current.rotation.y = userRotation.current.y;
      return;
    }

    // Otherwise, gentle ambient tilt + cursor parallax on the canvas.
    // Cursor parallax: read pointer relative to canvas center.
    const cx = state.pointer.x; // -1..1
    const cy = state.pointer.y;
    const cursorY = reducedMotion ? 0 : cx * 0.10; // 5.7° each side
    const cursorX = reducedMotion ? 0 : -cy * 0.08;

    const autoY = reducedMotion ? 0 : Math.sin(t * 0.4) * 0.05; // ±2.9° sway

    // Smooth blend between user rotation (idle state) and ambient.
    const baseY = userRotation.current.y * 0.6; // fading back to user angle when released
    const baseX = userRotation.current.x * 0.6;

    groupRef.current.rotation.x = baseX + cursorX;
    groupRef.current.rotation.y = baseY + cursorY + autoY;
  });

  // Mouse-down on the parent canvas → start drag tracking.
  // We attach listeners to gl.domElement via useEffect so they don't
  // double-fire with pointer events already managed by R3F.
  useEffect(() => {
    const dom = gl.domElement;
    const onDown = (e: PointerEvent) => {
      dragState.current.active = true;
      dragState.current.lastX = e.clientX;
      dragState.current.lastY = e.clientY;
    };
    const onMove = (e: PointerEvent) => {
      if (!dragState.current.active) return;
      const dx = e.clientX - dragState.current.lastX;
      const dy = e.clientY - dragState.current.lastY;
      dragState.current.lastX = e.clientX;
      dragState.current.lastY = e.clientY;
      // Sensitivity: 1 pixel ≈ 0.005 radians
      userRotation.current.y = THREE.MathUtils.clamp(
        userRotation.current.y + dx * 0.005,
        -0.6,
        0.6,
      );
      userRotation.current.x = THREE.MathUtils.clamp(
        userRotation.current.x + dy * 0.005,
        -0.4,
        0.4,
      );
    };
    const onUp = () => {
      dragState.current.active = false;
    };
    dom.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      dom.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [gl]);

  return (
    <group ref={groupRef}>
      {/* The poster face — flat plane with the canvas texture */}
      <mesh position={[0, 0, FRAME_THICKNESS / 2]}>
        <planeGeometry args={[POSTER_W, POSTER_H]} />
        <meshStandardMaterial
          map={texture}
          roughness={0.4}
          metalness={0}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* The frame thickness — dark green box behind the poster plane.
           The box sticks out FRAME_INSET on each edge so the side of
           the box shows around the poster plane. */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry
          args={[
            POSTER_W + FRAME_INSET * 2,
            POSTER_H + FRAME_INSET * 2,
            FRAME_THICKNESS,
          ]}
        />
        <meshStandardMaterial color={'#0E2A1F'} roughness={0.85} metalness={0} />
      </mesh>

      {/* Drop shadow — a slightly larger dark plane below. Adds depth
           without raytraced shadows. */}
      <mesh position={[0.04, -0.06, -FRAME_THICKNESS - 0.001]} rotation={[0, 0, 0]}>
        <planeGeometry args={[POSTER_W * 1.1, POSTER_H * 1.05]} />
        <meshBasicMaterial color={'#000000'} transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

export type FramePreview3DProps = {
  posterCanvas: HTMLCanvasElement;
  width?: number;     // viewport width in CSS pixels (used as initial)
  height?: number;    // viewport height in CSS pixels (used as initial)
  reducedMotion?: boolean;
  fillContainer?: boolean; // if true, the canvas fills its parent and resizes via ResizeObserver
};

export function FramePreview3D({
  posterCanvas,
  width = 460,
  height = 575,        // width * (1350/1080)
  reducedMotion = false,
  fillContainer = false,
}: FramePreview3DProps) {
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Wait one frame to ensure the canvas data is fully painted before
    // we hand it to Three.js — prevents the first frame from showing
    // a black texture.
    const r = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(r);
  }, [posterCanvas]);

  // Container style: pass-through width/height unless fillContainer is on.
  const containerStyle: React.CSSProperties = fillContainer
    ? { width: '100%', height: '100%', pointerEvents: 'auto' }
    : { width, height, pointerEvents: 'auto' };

  if (!mounted) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      style={containerStyle}
      className="relative"
    >
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [0, 0, 2.5], fov: 35 }}
        frameloop="always"
        shadows={false}
        style={{ width: '100%', height: '100%' }}
        onCreated={(state) => {
          state.gl.setClearColor(0x000000, 0);
        }}
      >
        <directionalLight position={[2, 3, 4]} intensity={0.7} color={'#FFD23F'} />
        <directionalLight position={[-2, -1, 2]} intensity={0.4} color={'#FF2D7B'} />
        <ambientLight intensity={0.5} />
        <TiltCard posterCanvas={posterCanvas} reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  );
}
