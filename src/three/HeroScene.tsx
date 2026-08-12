// HeroScene — the layered Goa 3D environment behind the hero typography.
//
// Composition (back → front Z per the spec, section 16):
//   -60  GoaHills
//   -45  GoaSun
//   -40  Ocean
//   -25  GoanHouse
//   -20  GoaPalms (1 left, 1 right, 1 small back)
//   -10  Scooter, Surfboard
//     0  (HTML typography HACKER / HOUSE / गोवा)
//   +25  Stickers (decoration)
//   +50  BuildersFrame (the centerpiece card)
//   +70  गोवा stamp (HTML)
//
// Lighting: warm Goa sunset. NO blue / cyan / purple. NO neon glow.
//   - ambient warm yellow
//   - key directional yellow (sun coming from low-right)
//   - pink accent light from the opposite side
//
// Cursor parallax: each layer has its own multiplier (constants.ts).
// The whole scene group does NOT rotate as one — individual elements
// apply their parallax internally. This makes palms and the frame
// travel different amounts, giving a real depth-separation feel.
//
// Mobile: stripped down — fewer palms, smaller frame, no stickers.

import { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { GoaHills } from './GoaHills';
import { GoaSun } from './GoaSun';
import { Ocean } from './Ocean';
import { GoaPalm } from './GoaPalm';
import { GoanHouse } from './GoanHouse';
import { Scooter } from './Scooter';
import { Surfboards } from './Surfboard';
import { Stickers } from './Stickers';
import { BuildersFrame } from './BuildersFrame';
import { HERO, MOBILE_BREAKPOINT_PX } from './constants';

export type HeroSceneProps = {
  className?: string;
};

export function HeroScene({ className = 'hero-canvas-host' }: HeroSceneProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mqReduce.matches);
    const onReduce = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mqReduce.addEventListener('change', onReduce);

    const mqMobile = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX - 1}px)`);
    setIsMobile(mqMobile.matches);
    const onMobile = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mqMobile.addEventListener('change', onMobile);

    return () => {
      mqReduce.removeEventListener('change', onReduce);
      mqMobile.removeEventListener('change', onMobile);
    };
  }, []);

  if (reducedMotion) {
    return <div className={className} aria-hidden />;
  }

  return (
    <div className={className} aria-hidden>
      <Canvas
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'low-power',
        }}
        camera={{ position: [0, 0, HERO.cameraZ], fov: HERO.fov }}
        frameloop="always"
        shadows={false}
        onCreated={(state) => {
          state.gl.setClearColor(0x000000, 0);
        }}
      >
        {/* Goa sunset lighting — warm directional + ambient + pink accent.
           No blue / neon / purple contamination. */}
        <ambientLight intensity={0.85} color={'#FFE9B5'} />
        <directionalLight
          position={[5, 2, 4]}
          intensity={1.0}
          color={'#FFD23F'}
          castShadow={false}
        />
        <directionalLight
          position={[-3, 1, 2]}
          intensity={0.5}
          color={'#FF8AA8'}
          castShadow={false}
        />
        {/* Subtle hemisphere light to keep darks readable without
           washing the palette. */}
        <hemisphereLight
          args={['#FFE9B5', '#026736', 0.35]}
        />

        {/* Background layer — far back */}
        <GoaHills reducedMotion={false} />
        <GoaSun reducedMotion={false} />

        {/* Mid layer */}
        <Ocean reducedMotion={false} />
        <GoanHouse />

        {/* Palms — count depends on viewport per the spec */}
        {isMobile ? (
          <>
            <GoaPalm position={[-3.2, -0.7, -20]} scale={1.4} swaySeed={0} />
            <GoaPalm position={[3.2, -0.7, -20]} scale={1.4} swaySeed={0.5} mirror />
          </>
        ) : (
          <>
            {/* Big left palm */}
            <GoaPalm
              position={[-3.6, -0.5, -20]}
              scale={1.7}
              swaySeed={0}
            />
            {/* Big right palm */}
            <GoaPalm
              position={[3.6, -0.6, -20]}
              scale={1.6}
              swaySeed={0.7}
            />
            {/* Smaller distant palm */}
            <GoaPalm
              position={[1.7, -0.4, -38]}
              scale={0.9}
              swaySeed={1.3}
            />
          </>
        )}

        {/* Foreground decoration */}
        {!isMobile && <Scooter />}
        <Surfboards />
        {!isMobile && <Stickers />}

        {/* Centerpiece — the 3D builder frame */}
        <BuildersFrame reducedMotion={false} />
      </Canvas>
    </div>
  );
}
