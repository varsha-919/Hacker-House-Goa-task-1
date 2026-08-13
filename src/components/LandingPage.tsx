

import React, { Suspense, useEffect, useRef } from 'react';
import { HeroScene } from '../three/HeroScene';

type Props = {
  onGenerate: () => void;
};

export function LandingPage({ onGenerate }: Props) {
  const stageRef = useRef<HTMLDivElement | null>(null);


  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motionQuery.matches) return;

    let raf = 0;
    let targetRx = 0;
    let targetRy = 0;
    let currentRx = 0;
    let currentRy = 0;

    const onMove = (e: PointerEvent) => {
      const rect = stage.getBoundingClientRect();
      // Normalize pointer to -1..+1 from hero center.
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;

      // Inverse mapping: cursor up → top tilts toward viewer.
      // ±10deg raw; clamp later.
      targetRx = -ny * 10;
      targetRy = nx * 10;

      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onLeave = () => {
      targetRx = 0;
      targetRy = 0;
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const tick = () => {
      raf = 0;
      currentRx += (targetRx - currentRx) * 0.08;
      currentRy += (targetRy - currentRy) * 0.08;

      const rx = Math.max(-5, Math.min(5, currentRx));
      const ry = Math.max(-5, Math.min(5, currentRy));

      stage.style.setProperty('--rx', `${rx.toFixed(2)}deg`);
      stage.style.setProperty('--ry', `${ry.toFixed(2)}deg`);

      if (Math.abs(targetRx - currentRx) > 0.05 || Math.abs(targetRy - currentRy) > 0.05) {
        raf = requestAnimationFrame(tick);
      }
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerleave', onLeave);
    window.addEventListener('blur', onLeave);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('blur', onLeave);
    };
  }, []);

  return (
    <main className="relative overflow-hidden text-cream">
      {/* HERO */}
      <section
        className="relative px-4 sm:px-6 lg:px-10 pt-10 sm:pt-16 lg:pt-20 pb-16 sm:pb-24 poster-stage grain"
        style={{ minHeight: "min(900px, 100vh)" }}
      >
        <Suspense fallback={null}>
          <HeroScene />
        </Suspense>

        <div
          ref={stageRef}
          className="poster-stage__inner mx-auto max-w-[1400px] relative z-10"
        >
          {/* Kicker */}
          <div className="anim-meta flex items-center justify-center gap-3 mb-8 sm:mb-12">
            <span className="hidden sm:inline-block w-8 h-px bg-cream/40" />
            <span
              className="font-mono uppercase text-cream/90 text-[10px] sm:text-[11px] flex items-center gap-2 px-3 py-1 border border-cream/40 rounded-full bg-ink/30"
              style={{ letterSpacing: "0.25em" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-pink animate-pulse" />
              GOA · 28—31 OCT 2026 · HYPE INCOMING
            </span>
            <span className="hidden sm:inline-block w-8 h-px bg-cream/40" />
          </div>

          <div className="mx-auto max-w-[1400px]">
            <h1 className="text-center select-none">
              <span
                className="huge-title block anim-hero-1"
                style={{
                  fontSize: "clamp(72px, 18vw, 280px)",
                }}
              >
                HACKER
              </span>

              <span
                className="block anim-hero-2 -my-2 sm:-my-3 lg:-my-4"
                aria-hidden
              >
                <span
                  className="stamp-glyph"
                  style={{ fontSize: "clamp(60px, 14vw, 220px)" }}
                  aria-label="गोवा (Goa)"
                >
                  गोवा
                </span>
              </span>

              <span
                className="huge-title block anim-hero-3"
                style={{
                  fontSize: "clamp(72px, 18vw, 280px)",
                }}
              >
                HOUSE
              </span>
            </h1>
          </div>
        </div>
        {/* /poster-stage__inner */}
      </section>
      <section
        className="relative px-4 sm:px-6 lg:px-10  poster-stage grain"
        style={{ minHeight: "min(400px" }}
      >
        <div className="anim-meta mt-10 sm:mt-14">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 sm:gap-8">
            <div
              className="font-mono uppercase text-cream text-xs sm:text-sm"
              style={{ letterSpacing: "0.22em" }}
            >
              GOA, INDIA · 28—31 OCT 2026
            </div>
            <div className="flex items-center gap-3">
              <span
                className="font-mono uppercase text-sun text-xs sm:text-sm"
                style={{ letterSpacing: "0.22em" }}
              >
                2:47 PM STUDIO
              </span>
              <span className="w-2 h-2 rounded-full bg-pink animate-pulse" />
            </div>
          </div>
          <div className="dashed-rule mt-4 sm:mt-6" />
        </div>

        <div className="mt-10 sm:mt-14 flex flex-col items-center anim-cta">
          <button
            type="button"
            onClick={onGenerate}
            className="ticket-btn text-base sm:text-lg md:text-xl"
            aria-label="Generate your Hacker House frame"
          >
            GENERATE YOUR FRAME
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>

          <p
            className="mt-6 font-mono uppercase text-cream/80 text-[11px] sm:text-xs flex items-center gap-2"
            style={{ letterSpacing: "0.25em" }}
          >
            BUILD YOUR HACKER HOUSE IDENTITY
            <span aria-hidden>→</span>
          </p>
        </div>
      </section>

      {/* EDITORIAL BRIDGE — green continues, cream typography */}
      <section className="relative px-4 sm:px-6 lg:px-10 py-16 sm:py-24 bg-goa-600 border-t-2 border-ink/40">
        {/* Decorative pink dot at corner */}
        <div
          className="absolute top-8 right-8 w-4 h-4 rounded-full bg-pink"
          aria-hidden
        />
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end">
            <div className="lg:col-span-8">
              <p
                className="font-mono uppercase text-pink text-[10px] sm:text-[11px] mb-4"
                style={{ letterSpacing: "0.3em" }}
              >
                ◐ FRAME IN GOA · 247 BUILDERS
              </p>
              <h2
                className="huge-title"
                style={{
                  fontSize: "clamp(40px, 9vw, 130px)",
                }}
              >
                BUILD YOUR ID.
                <br />
                <span>FRAME YOUR CREW.</span>
              </h2>
              <p className="mt-6 editorial-italic text-cream/90 text-lg sm:text-xl leading-relaxed max-w-2xl">
                Upload your photo, tell us what you build, and we'll turn it
                into your Hacker House Goa 2026 identity. Bring up to two
                teammates and frame the whole crew.
              </p>
            </div>
            <div className="lg:col-span-4 flex lg:justify-end">
              <button
                type="button"
                onClick={onGenerate}
                className="ticket-btn ticket-btn-sm"
              >
                GENERATE YOUR FRAME
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
          <div className="mt-14 sm:mt-20 grid grid-cols-3 gap-3 sm:gap-6 max-w-3xl">
            <Stamp n="01" label="PHOTO" />
            <Stamp n="02" label="DETAILS" />
            <Stamp n="03" label="SHARE" />
          </div>
        </div>
      </section>

      <footer className="relative px-4 sm:px-6 lg:px-10 py-8 bg-ink/95 text-cream overflow-hidden border-t-2 border-ink">
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          aria-hidden
        >
          <div className="absolute top-4 right-4 w-24 h-24 rounded-full bg-sun" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-pink" />
        </div>
        <div className="relative mx-auto max-w-[1400px] flex flex-col sm:flex-row items-center justify-between gap-3 text-cream/90">
          <div
            className="font-mono uppercase"
            style={{ letterSpacing: "0.22em" }}
          >
            HACKER HOUSE GOA · 2026
          </div>
          <div
            className="font-mono uppercase text-sun"
            style={{ letterSpacing: "0.22em" }}
          >
            BUILD · SHIP · REPEAT · 28—31 OCT 2026
          </div>
        </div>
      </footer>
    </main>
  );
}

// Small decorative stamp used in the bridge section.
function Stamp({ n, label }: { n: string; label: string }) {
  return (
    <div className="rounded-md border-2 border-dashed border-cream/40 p-3 sm:p-4 text-center bg-ink/20">
      <div
        className="font-mono uppercase text-cream/70 text-[10px]"
        style={{ letterSpacing: '0.28em' }}
      >
        {n}
      </div>
      <div
        className="mt-1 huge-title text-cream text-xl sm:text-2xl"
        style={{ textShadow: '2px 2px 0 #FFD23F' }}
      >
        {label}
      </div>
    </div>
  );
}
