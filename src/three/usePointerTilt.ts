// usePointerTilt — reads the cursor-driven --rx / --ry CSS custom
// properties written by LandingPage's parallax effect, and exposes them
// as smoothed Euler-style rotation values inside an R3F useFrame loop.
//
// Why this exists:
//   The HTML/CSS parallax in LandingPage.tsx writes --rx / --ry onto
//   .poster-stage__inner. We want the WebGL scene behind the hero to
//   react to the SAME cursor position so the page never feels like
//   two competing motion systems. Rather than duplicate the listener
//   (one in CSS-land, one in JS-land reading pointermove), we read
//   the values the CSS already wrote.
//
// Usage inside an R3F component:
//   const { applyTilt } = usePointerTilt();
//   useFrame(() => { applyTilt(groupRef.current); });
//
// Or, more commonly, you call `applyTilt` from a parent's useFrame
// once per frame and the smoothing is internal.

import { useCallback, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TILT } from './constants';

// CSS selectors we look for. The first match wins; .poster-stage__inner
// is written by the parallax effect in LandingPage.tsx.
const TILT_SELECTOR = '.poster-stage__inner';

type SmoothedTilt = {
  rx: number;
  ry: number;
};

export function usePointerTilt(enabled: boolean = true) {
  // Current smoothed values (radians).
  const state = useRef<SmoothedTilt>({ rx: 0, ry: 0 });

  // The apply function — call this once per frame from a useFrame loop
  // with the group you want to tilt. It returns the smoothed rotation
  // as Euler XYZ.
  const applyTilt = useCallback(
    (target: THREE.Object3D | null) => {
      if (!enabled || !target) return;
      let cssRx = 0;
      let cssRy = 0;
      const el = document.querySelector(TILT_SELECTOR) as HTMLElement | null;
      if (el) {
        const cs = getComputedStyle(el);
        // CSS writes degrees. Read them, fall back to 0.
        cssRx = parseFloat(cs.getPropertyValue('--rx')) || 0;
        cssRy = parseFloat(cs.getPropertyValue('--ry')) || 0;
      }
      // CSS already clamps to ±TILT.maxDeg, so we trust the input.
      // Convert to radians (Three.js rotation units).
      const targetRx = THREE.MathUtils.degToRad(cssRx);
      const targetRy = THREE.MathUtils.degToRad(cssRy);

      // Lerp toward target with the same easing factor (~250ms settle)
      // as the CSS layer, so the WebGL response stays in sync visually.
      state.current.rx += (targetRx - state.current.rx) * 0.08;
      state.current.ry += (targetRy - state.current.ry) * 0.08;

      target.rotation.x = state.current.rx;
      target.rotation.y = state.current.ry;
    },
    [enabled],
  );

  return { applyTilt };
}

// Convenience: usePointerTiltAuto — calls useFrame for you and tilts
// the ref'd group. Use this when there's exactly one scene group that
// should tilt in lockstep with the CSS layer.
//
// Returns a `groupRef` to attach to <group ref={groupRef}> and an
// `applyTilt` function for manual control. Most callers will just
// use the returned ref.
export function usePointerTiltAuto(enabled: boolean = true) {
  const groupRef = useRef<THREE.Group>(null);
  const { applyTilt } = usePointerTilt(enabled);
  useFrame(() => {
    applyTilt(groupRef.current);
  });
  return groupRef;
}
