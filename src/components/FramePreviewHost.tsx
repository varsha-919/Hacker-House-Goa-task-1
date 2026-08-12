// FramePreviewHost — the visual switcher in front of the generator.
//
// Responsibilities:
//   - Show the live DOM preview while the user is editing input
//     (cheap, instant feedback as they type)
//   - After they click Generate, show the just-rasterized canvas as
//     a 3D frame card (heavy but premium — only one rasterization,
//     no per-keystroke cost)
//   - On mobile / reduced-motion, fall back to the DOM preview
//
// Inputs:
//   - preview: mode + slot data, used to render the DOM preview
//   - generatedCanvas: the canvas2D HTMLCanvasElement produced by
//     handleGenerate() in App.tsx (passed in via props)
//   - generatedKind: 'single' | 'team' — picks which DOM preview to
//     show on fallback paths and which 3D card variant to render
//
// Why one canvas, not two:
//   The canvas passed in is the SAME canvas that canvasToPngDataUrl
//   serializes for the PNG download. Byte-identical PNG output is
//   preserved — we don't re-rasterize for the 3D surface.

import { useEffect, useState } from 'react';
import { BuilderIDPreview } from './BuilderIDPreview';
import { TeamPreview, type TeamMemberInput } from './TeamPreview';
import { FramePreview3D } from '../three/FramePreview3D';
import { MOBILE_BREAKPOINT_PX } from '../three/constants';
import type { CropAdjust } from '../lib/image';

// Slot data shape mirrors what App.tsx carries.
export type PreviewSlot = {
  loaded: { exportSource: HTMLImageElement | null } | null;
  adjust: CropAdjust;
  name: string;
  stack: string;
  builderClass: string;
};

type Props = {
  // Either the canvas from a successful Generate, or null while editing.
  generatedCanvas: HTMLCanvasElement | null;
  generatedKind: 'single' | 'team';
  // Live preview inputs (used when generatedCanvas is null OR on mobile).
  slots: PreviewSlot[];
  teamName: string;
  // Display sizing — the host DOM already provides a fixed-width
  // wrapper in App.tsx (ScaledPreview). When fillContainer is true,
  // the 3D frame fills its parent (good for responsive layouts).
  width?: number;
  height?: number;
  fillContainer?: boolean;
};

export function FramePreviewHost({
  generatedCanvas,
  generatedKind,
  slots,
  teamName,
  width = 460,
  height = 575,
  fillContainer = false,
}: Props) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Honor prefers-reduced-motion at the JS layer.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Mobile detection — matchMedia is more reliable than resize listeners
  // for "is this device narrow" because it doesn't fire during the
  // browser chrome collapse.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX - 1}px)`);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // --- Choose which preview to render ---

  // 1. If we have a generated canvas AND we're not on mobile AND the
  //    user hasn't requested reduced motion → 3D frame.
  // 2. Otherwise → DOM preview (existing components, untouched).
  const use3D = !isMobile && !prefersReducedMotion && generatedCanvas !== null;

  if (use3D && generatedCanvas) {
    return (
      <FramePreview3D
        posterCanvas={generatedCanvas}
        width={width}
        height={height}
        reducedMotion={false}
        fillContainer={fillContainer}
      />
    );
  }

  // --- DOM preview fallback path ---

  if (generatedKind === 'team' || slots.length > 1) {
    const members: TeamMemberInput[] = slots.map((s) => ({
      name: s.name,
      stackOrRole: s.stack,
      builderClass: s.builderClass,
      photo: s.loaded?.exportSource ?? null,
      adjust: s.adjust,
    }));
    return <TeamPreview teamName={teamName} members={members} />;
  }

  const slot = slots[0];
  if (!slot) return null;
  return (
    <BuilderIDPreview
      data={{
        name: slot.name,
        stackOrRole: slot.stack,
        builderTitle: slot.builderClass,
        photo: slot.loaded?.exportSource ?? null,
        adjust: slot.adjust,
      }}
    />
  );
}
