// DOM preview of the HH Goa 2026 poster.
//
// Mirror of the canvas renderer in lib/export.ts. Both read the same
// numbers from lib/posterLayout.ts and the same color/typography
// constants. This file uses absolute-positioned divs + inline SVG so
// the on-screen preview matches the downloaded PNG pixel-for-pixel
// (modulo font hinting).

import React, { forwardRef, useMemo } from 'react';
import {
  CARD_W,
  CARD_H,
  COLORS,
  FONT,
  getHeroMedallion,
  getHeroSun,
  getHeroPlate,
  getNameBlock,
  getNameBlockWavy,
  getPhotoCoverLayout,
  getBuilderStamp,
  getShipSticker,
  getStarSticker,
  getLocationPin,
  getSurfboard,
  getGoaRoute,
  getGoaScooter,
  getMountainRidge,
  getClassBuilderStamp,
  getClassRotateHint,
  getClassStarCorner,
  getFooterPostmark,
  getFooterTear,
  DEFAULT_ADJUST,
  type Rect,
} from '../lib/posterLayout';
import type { CropAdjust } from '../lib/image';

type Props = {
  data: {
    name: string;
    stackOrRole: string;
    builderTitle: string;
    photo: HTMLImageElement | null;
    builderNumber?: number;
    totalBuilders?: number;
    adjust?: CropAdjust;
  };
  size?: number;
  className?: string;
};

// ---------------- grain dots (same seed as canvas) ----------------

function grainDotsCSS() {
  const dots: { x: number; y: number; r: number }[] = [];
  let s = 1337;
  for (let i = 0; i < 1100; i++) {
    s = (s * 9301 + 49297) % 233280;
    const x = (s / 233280) * 100;
    s = (s * 9301 + 49297) % 233280;
    const y = (s / 233280) * 100;
    s = (s * 9301 + 49297) % 233280;
    const r = 0.4 + (s / 233280) * 1.2;
    dots.push({ x, y, r });
  }
  return dots;
}

const GRAIN_DOTS = grainDotsCSS();
const GRAIN_BG = GRAIN_DOTS.map(
  (d) =>
    `radial-gradient(circle, rgba(58,42,20,0.06) ${d.r}px, transparent ${d.r + 0.5}px) ${d.x}% ${d.y}% / 100% 100%`,
).join(', ');

const BUILDER_COUNT = 247;
const BUILDER_NO_DEFAULT = 28;

// ---------------- font measurement (matches canvas pickFittingFontSize) ----------------

function fitAnton(
  text: string,
  maxWidth: number,
  startSize: number,
  minSize: number,
  letterSpacing: number = -0.01,
): number {
  if (typeof document === 'undefined') return startSize;
  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return startSize;
  const family = FONT.display;
  let size = startSize;
  while (size > minSize) {
    ctx.font = `400 ${Math.round(size)}px ${family}`;
    let w = 0;
    for (const c of Array.from(text)) w += ctx.measureText(c).width;
    w += letterSpacing * size * (text.length - 1);
    if (w <= maxWidth) return Math.round(size);
    size -= 2;
  }
  return Math.round(minSize);
}

function measureTrackedAnton(
  text: string,
  fontSize: number,
  letterSpacing: number = -0.01,
): number {
  if (typeof document === 'undefined') return text.length * fontSize * 0.6;
  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return text.length * fontSize * 0.6;
  ctx.font = `400 ${fontSize}px ${FONT.display}`;
  let w = 0;
  for (const c of Array.from(text)) w += ctx.measureText(c).width;
  w += letterSpacing * fontSize * (text.length - 1);
  return w;
}

// ---------------- main preview ----------------

export const BuilderIDPreview = forwardRef<HTMLDivElement, Props>(function BuilderIDPreview(
  { data, size = CARD_W, className = '' },
  ref,
) {
  const name = (data.name || 'YOUR NAME').toUpperCase().trim();
  const stack = (data.stackOrRole || 'BUILDER').toUpperCase().trim();
  const klass = (data.builderTitle || 'THE BUILDER').toUpperCase().trim();
  const builderNo = String(data.builderNumber ?? BUILDER_NO_DEFAULT).padStart(3, '0');
  const totalBuilders = data.totalBuilders ?? BUILDER_COUNT;

  const adjust: CropAdjust = data.adjust ?? DEFAULT_ADJUST;

  // Auto-fit sizes matching the canvas renderer.
  const nameFont = useMemo(
    () => fitAnton(name, CARD_W - 200, 160, 64),
    [name],
  );
  const klassFont = useMemo(
    () => fitAnton(klass, CARD_W - 220, 130, 44),
    [klass],
  );
  const nameW = useMemo(
    () => measureTrackedAnton(name, nameFont),
    [name, nameFont],
  );
  const klassW = useMemo(
    () => measureTrackedAnton(klass, klassFont),
    [klass, klassFont],
  );

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      style={{
        width: size,
        height: size * (CARD_H / CARD_W),
        background: COLORS.cream,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: CARD_W,
          height: CARD_H,
          transformOrigin: 'top left',
          transform: `scale(${size / CARD_W})`,
          backgroundImage: GRAIN_BG,
          backgroundColor: COLORS.cream,
        }}
      >
        {/* Outer dark-green frame */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            boxShadow: `inset 0 0 0 10px ${COLORS.ink}, inset 0 0 0 12px ${COLORS.cream}`,
            pointerEvents: 'none',
          }}
        />

        <HeaderBand builderNo={builderNo} />
        <GoaScene />
        <HeroZone photo={data.photo} adjust={adjust} builderNo={builderNo} />
        <NameBlock name={name} stack={stack} nameFont={nameFont} nameW={nameW} builderNo={builderNo} />
        <ClassBand klass={klass} klassFont={klassFont} klassW={klassW} builderNo={builderNo} />
        <FooterBand builderNo={builderNo} />
      </div>
    </div>
  );
});

// ============================================================================
// header band (forest)
// ============================================================================

function HeaderBand({ builderNo }: { builderNo: string }) {
  const tagSize = 110;
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: CARD_W,
        height: 200,
        background: COLORS.ink,
        overflow: 'hidden',
      }}
    >
      {/* Sun-yellow HH tag in the top-left corner */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: tagSize,
          height: tagSize,
          background: COLORS.sun,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            fontFamily: FONT.display,
            fontSize: 60,
            color: COLORS.ink,
            letterSpacing: '-0.04em',
            lineHeight: 1,
          }}
        >
          HH
        </div>
        <div
          style={{
            fontFamily: FONT.mono,
            fontWeight: 700,
            fontSize: 10,
            color: COLORS.ink,
            letterSpacing: '0.2em',
            marginTop: 4,
          }}
        >
          EST. 2026
        </div>
      </div>

      {/* Brand wordmark — Hacker House */}
      <div
        style={{
          position: 'absolute',
          top: 32,
          left: tagSize + 30,
          fontFamily: FONT.editorialItalic,
          fontStyle: 'italic',
          fontWeight: 600,
          fontSize: 60,
          color: COLORS.cream,
          letterSpacing: '-0.01em',
          lineHeight: 1,
        }}
      >
        Hacker House
      </div>

      <div
        style={{
          position: 'absolute',
          top: 102,
          left: tagSize + 30,
          fontFamily: FONT.mono,
          fontWeight: 700,
          fontSize: 18,
          color: COLORS.sun,
          letterSpacing: '0.3em',
        }}
      >
        GOA · INDIA
      </div>

      {/* Builder count + currently shipping eyebrow */}
      <div
        style={{
          position: 'absolute',
          top: 140,
          left: tagSize + 30,
          fontFamily: FONT.mono,
          fontWeight: 700,
          fontSize: 12,
          color: COLORS.pink,
          letterSpacing: '0.26em',
        }}
      >
        247 BUILDERS · EST. 2026 · CURRENTLY SHIPPING
      </div>

      {/* Right: dates + GOA · INDIA mono */}
      <div
        style={{
          position: 'absolute',
          top: 30,
          right: 36,
          fontFamily: FONT.display,
          fontWeight: 700,
          fontSize: 38,
          color: COLORS.sun,
          letterSpacing: '-0.01em',
          lineHeight: 1,
        }}
      >
        28—31
      </div>
      <div
        style={{
          position: 'absolute',
          top: 76,
          right: 36,
          fontFamily: FONT.mono,
          fontWeight: 700,
          fontSize: 16,
          color: COLORS.cream,
          letterSpacing: '0.24em',
        }}
      >
        OCT 2026
      </div>
      <div
        style={{
          position: 'absolute',
          top: 102,
          right: 36,
          fontFamily: FONT.mono,
          fontWeight: 700,
          fontSize: 12,
          color: COLORS.pink,
          letterSpacing: '0.24em',
        }}
      >
        GOA · INDIA
      </div>

      {/* TKT round stamp + builder number */}
      <RoundStampSVG
        cx={CARD_W - 170}
        cy={50}
        r={36}
        topLabel="TKT"
        bottomLabel={`No. ${builderNo}`}
        color={COLORS.pink}
        accent={COLORS.sun}
        outerColor={COLORS.pink}
        fontSizeTop={14}
        fontSizeBottom={10}
      />

      {/* Perforated divider near bottom of header */}
      <div
        style={{
          position: 'absolute',
          bottom: 8,
          left: 0,
          right: 0,
          height: 4,
          backgroundImage: `repeating-linear-gradient(90deg, ${COLORS.cream} 0 8px, transparent 8px 16px)`,
          opacity: 0.6,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 24,
          left: 0,
          right: 0,
          height: 2,
          backgroundImage: `repeating-linear-gradient(90deg, ${COLORS.cream} 0 4px, transparent 4px 12px)`,
          opacity: 0.3,
        }}
      />
    </div>
  );
}

// ============================================================================
// goa scene (cream)
// ============================================================================

function GoaScene() {
  const r = { x: 0, y: 200, w: CARD_W, h: 160 };
  const sun = getHeroSun();
  const route = getGoaRoute();
  const sc = getGoaScooter();
  const ridge = getMountainRidge();

  // Route dot positions match the canvas drawRouteDots()
  const dots: { x: number; y: number }[] = [];
  const dx = route.x2 - route.x1;
  const dy = route.y2 - route.y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const steps = Math.max(1, Math.floor(dist / 8));
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    dots.push({ x: route.x1 + dx * t, y: route.y1 + dy * t });
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: r.y,
        left: r.x,
        width: r.w,
        height: r.h,
        background: COLORS.cream,
        overflow: 'hidden',
      }}
    >
      {/* Lat/long + Arabian Sea labels */}
      <div
        style={{
          position: 'absolute',
          top: 18,
          left: 16,
          fontFamily: FONT.mono,
          fontWeight: 700,
          fontSize: 11,
          color: COLORS.stamp,
          letterSpacing: '0.22em',
        }}
      >
        GOA · 15.5° N · 73.8° E
      </div>
      <div
        style={{
          position: 'absolute',
          top: 18,
          right: 16,
          fontFamily: FONT.mono,
          fontWeight: 700,
          fontSize: 11,
          color: COLORS.stamp,
          letterSpacing: '0.22em',
        }}
      >
        ARABIAN SEA
      </div>

      {/* Sun (clipped to upper half — visually sits behind photo) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: CARD_W,
          height: sun.cy + sun.r - r.y,
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
      >
        <SunSVG cx={sun.cx} cy={sun.cy - r.y} r={sun.r} fill={COLORS.sun} ray={COLORS.sunDeep} />
      </div>

      {/* Mountain ridge */}
      <svg
        viewBox={`0 0 ${CARD_W} 120`}
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 30,
          width: '100%',
          height: 70,
        }}
      >
        <path
          d={`M${ridge.left} 100 L${ridge.left + 120} ${ridge.baseY - r.y}
              L${ridge.left + 240} ${ridge.baseY - r.y + 22}
              L${ridge.left + 360} ${ridge.baseY - r.y - 10}
              L${ridge.left + 480} ${ridge.baseY - r.y + 16}
              L${ridge.left + 620} ${ridge.baseY - r.y - 4}
              L${ridge.left + 760} ${ridge.baseY - r.y + 20}
              L${ridge.left + 900} ${ridge.baseY - r.y + 2}
              L${ridge.right} ${ridge.baseY - r.y + 26}
              L${ridge.right} 120 L${ridge.left} 120 Z`}
          fill={COLORS.ink}
        />
        {/* Wave line under ridge */}
        <path
          d={`M${ridge.left} ${ridge.baseY - r.y + 56} Q${ridge.left + 200} ${ridge.baseY - r.y + 50}
              ${ridge.left + 400} ${ridge.baseY - r.y + 56}
              T${ridge.left + 800} ${ridge.baseY - r.y + 56}
              T${ridge.right} ${ridge.baseY - r.y + 56}`}
          fill="none"
          stroke={COLORS.sun}
          strokeWidth={3}
          strokeLinecap="round"
        />
      </svg>

      {/* Palms: large left, medium mid-left, small right */}
      <PalmSVG x={90} y={r.h - 6} h={90} color={COLORS.stamp} scale={1} />
      <PalmSVG x={220} y={r.h - 4} h={60} color={COLORS.ink} scale={0.85} />
      <PalmSVG x={r.w - 220} y={r.h - 6} h={72} color={COLORS.ink} scale={0.9} />

      {/* Route label */}
      <div
        style={{
          position: 'absolute',
          bottom: 28,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: FONT.mono,
          fontWeight: 700,
          fontSize: 10,
          color: COLORS.pink,
          letterSpacing: '0.3em',
        }}
      >
        ROUTE · BAGA → ANJUNA → PALOLEM
      </div>

      {/* Dotted route */}
      {dots.map((d, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: d.x - 4,
            top: d.y - r.y - 4,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: COLORS.pink,
          }}
        />
      ))}

      {/* Scooter on the route */}
      <ScooterSVG cx={sc.x} cy={sc.y - r.y} scale={1.4} color={COLORS.ink} />
    </div>
  );
}

// ============================================================================
// hero zone (cream) — PHOTO MEDALLION at center
// ============================================================================

function HeroZone({
  photo,
  adjust,
  builderNo,
}: {
  photo: HTMLImageElement | null;
  adjust: CropAdjust;
  builderNo: string;
}) {
  const r = { x: 0, y: 360, w: CARD_W, h: 560 };
  const { cx, cy, r: rad } = getHeroMedallion();
  const stamp = getBuilderStamp();
  const shipSticker = getShipSticker();
  const starSticker = getStarSticker();
  const pin = getLocationPin();
  const sb = getSurfboard();
  const plate = getHeroPlate();

  const layout =
    photo && photo.naturalWidth > 0
      ? getPhotoCoverLayout(photo.naturalWidth, photo.naturalHeight, rad, adjust)
      : null;

  return (
    <div
      style={{
        position: 'absolute',
        top: r.y,
        left: r.x,
        width: r.w,
        height: r.h,
        background: COLORS.cream,
        overflow: 'hidden',
      }}
    >
      {/* Decorative wave pattern under the photo */}
      <svg
        viewBox="0 0 1000 50"
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          left: 20,
          right: 20,
          bottom: 80,
          width: 'calc(100% - 40px)',
          height: 24,
          opacity: 0.6,
        }}
      >
        <path
          d="M0 12 Q100 -4 200 12 T400 12 T600 12 T800 12 T1000 12"
          fill="none"
          stroke={COLORS.pink}
          strokeWidth={3}
          strokeLinecap="round"
        />
        <path
          d="M0 28 Q100 12 200 28 T400 28 T600 28 T800 28 T1000 28"
          fill="none"
          stroke={COLORS.pink}
          strokeWidth={3}
          strokeLinecap="round"
          opacity={0.5}
        />
      </svg>

      {/* Tiny surfboard near the wave */}
      <SurfboardSVG x={sb.x - r.x - 60} y={sb.y - r.y - 20} scale={0.7} color={COLORS.ink} stripe={COLORS.sun} />

      {/* Palm fronds overlapping from the top into the medallion (cross-region decoration) */}
      <PalmSVG x={60} y={r.y + 130} h={130} color={COLORS.stamp} scale={1} mirrored />
      <PalmSVG x={CARD_W - 60} y={r.y + 130} h={130} color={COLORS.stamp} scale={1} />

      {/* Cream "postage stamp" plate behind the photo (rotated -1.4°) */}
      <div
        style={{
          position: 'absolute',
          left: plate.cx - plate.w / 2,
          top: plate.cy - plate.h / 2,
          width: plate.w,
          height: plate.h,
          background: COLORS.pink,
          transform: 'rotate(-1.4deg)',
          boxShadow: `inset 0 0 0 14px ${COLORS.cream}`,
        }}
      />

      {/* Sun-yellow ring behind the photo */}
      <div
        style={{
          position: 'absolute',
          left: cx - rad - 16,
          top: cy - rad - 16,
          width: (rad + 16) * 2,
          height: (rad + 16) * 2,
          borderRadius: '50%',
          background: COLORS.sun,
        }}
      />

      {/* Photo clipped to circle */}
      <div
        style={{
          position: 'absolute',
          left: cx - rad,
          top: cy - rad,
          width: rad * 2,
          height: rad * 2,
          borderRadius: '50%',
          overflow: 'hidden',
          background: COLORS.inkDeep,
        }}
      >
        {photo && layout ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${photo.src})`,
              backgroundSize: `${layout.bgSizePct}%`,
              backgroundPosition: `${layout.bgPosXPct}% ${layout.bgPosYPct}%`,
              backgroundRepeat: 'no-repeat',
            }}
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SunSVG cx={cx} cy={cy - 20} r={80} fill={COLORS.sun} ray={COLORS.sunDeep} cxAbs={false} />
            <div
              style={{
                position: 'absolute',
                top: cy + 60,
                fontFamily: FONT.mono,
                fontWeight: 700,
                fontSize: 32,
                color: COLORS.cream,
                letterSpacing: '0.3em',
              }}
            >
              PHOTO
            </div>
          </div>
        )}
      </div>

      {/* Double pink ring around the photo */}
      <div
        style={{
          position: 'absolute',
          left: cx - rad - 6,
          top: cy - rad - 6,
          width: (rad + 6) * 2,
          height: (rad + 6) * 2,
          borderRadius: '50%',
          border: `9px solid ${COLORS.pink}`,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: cx - rad - 24,
          top: cy - rad - 24,
          width: (rad + 24) * 2,
          height: (rad + 24) * 2,
          borderRadius: '50%',
          border: `2px solid ${COLORS.pink}`,
          pointerEvents: 'none',
        }}
      />

      {/* ★ tick on the ring (12 o'clock) */}
      <StarSVG x={cx} y={cy - rad - 24} r={12} color={COLORS.pink} />

      {/* BUILDER No. NNN round stamp top-left */}
      <RoundStampSVG
        cx={stamp.cx}
        cy={stamp.cy}
        r={stamp.r}
        topLabel="BUILDER"
        bottomLabel={`No. ${builderNo}`}
        color={COLORS.ink}
        accent={COLORS.sun}
        outerColor={COLORS.ink}
        fontSizeTop={10}
        fontSizeBottom={18}
      />

      {/* BUILD · SHIP · REPEAT sticker top-right (rotated) */}
      <CornerStickerSVG
        x={shipSticker.x}
        y={shipSticker.y}
        label="BUILD · SHIP · REPEAT"
        rotate={-7}
        bg={COLORS.sun}
        fg={COLORS.ink}
      />

      {/* ★ VIBE starburst sticker bottom-right */}
      <StarBurstSVG
        cx={starSticker.cx}
        cy={starSticker.cy}
        r={starSticker.r}
        bg={COLORS.pink}
        fg={COLORS.sun}
        ray={COLORS.pink}
        label="★ VIBE"
      />

      {/* Location tag bottom-left */}
      <div
        style={{
          position: 'absolute',
          left: pin.x,
          top: pin.y - r.y,
          fontFamily: FONT.mono,
          fontWeight: 700,
          fontSize: 12,
          color: COLORS.stamp,
          letterSpacing: '0.22em',
        }}
      >
        ◇ ANJUNA BEACH · GOA
      </div>
      <div
        style={{
          position: 'absolute',
          left: pin.x + 196,
          top: pin.y - r.y,
          fontFamily: FONT.mono,
          fontWeight: 700,
          fontSize: 12,
          color: COLORS.pink,
          letterSpacing: '0.22em',
        }}
      >
        ·  BE HERE NOW  ·
      </div>
    </div>
  );
}

// ============================================================================
// name block (cream) — wavy top edge, big Anton name, ⚡ accents
// ============================================================================

function NameBlock({
  name,
  stack,
  nameFont,
  nameW,
  builderNo,
}: {
  name: string;
  stack: string;
  nameFont: number;
  nameW: number;
  builderNo: string;
}) {
  const nb = getNameBlock();
  const wavy = getNameBlockWavy();

  // Build a wavy-top path as an SVG so we can clip the cream block's
  // top to a sine wave (matching the canvas renderer).
  const points: string[] = [];
  for (let x = 0; x <= CARD_W; x += wavy.period / 2) {
    const yy = wavy.y + wavy.amp * Math.sin((x / wavy.period) * Math.PI * 2);
    points.push(`${x},${yy}`);
  }
  const wavyPath =
    `M0,${wavy.y} ` + points.map((p) => `L${p}`).join(' ') +
    ` L${CARD_W},${CARD_H} L0,${CARD_H} Z`;

  return (
    <>
      {/* Cream block with wavy top edge (SVG so we can use a sine path) */}
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: CARD_W,
          height: CARD_H,
          pointerEvents: 'none',
        }}
        viewBox={`0 0 ${CARD_W} ${CARD_H}`}
        preserveAspectRatio="none"
      >
        <path d={wavyPath} fill={COLORS.cream} />
      </svg>

      {/* Yellow vertical bar on the left */}
      <div
        style={{
          position: 'absolute',
          left: nb.barLeft.x,
          top: nb.barLeft.y + wavy.amp, // bar starts at the wavy top
          width: nb.barLeft.w,
          height: nb.barLeft.h - wavy.amp,
          background: COLORS.sun,
        }}
      />

      {/* Sun-yellow accent dot top-right corner */}
      <div
        style={{
          position: 'absolute',
          left: CARD_W - 30 - 14,
          top: nb.top + 30 - 14 + wavy.amp,
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: COLORS.sun,
        }}
      />

      {/* BUILDER ID eyebrow left */}
      <div
        style={{
          position: 'absolute',
          left: 32,
          top: nb.eyebrow - 6,
          fontFamily: FONT.mono,
          fontWeight: 700,
          fontSize: 12,
          color: COLORS.sun,
          letterSpacing: '0.26em',
        }}
      >
        BUILDER ID · NO. {builderNo} / 247
      </div>

      {/* TRY ANOTHER eyebrow right */}
      <div
        style={{
          position: 'absolute',
          right: 32,
          top: nb.eyebrow - 6,
          fontFamily: FONT.mono,
          fontWeight: 700,
          fontSize: 12,
          color: COLORS.pink,
          letterSpacing: '0.26em',
        }}
      >
        ↻ TRY ANOTHER TITLE
      </div>

      {/* Big Anton name with ⚡ accents */}
      <div
        style={{
          position: 'absolute',
          left: 28,
          top: nb.name - nameFont / 2 - 6,
          fontFamily: FONT.display,
          fontSize: nameFont,
          color: COLORS.sun,
          lineHeight: 1,
        }}
      >
        ⚡
      </div>
      <div
        style={{
          position: 'absolute',
          left: 30 + nameFont * 0.5,
          top: nb.name - nameFont / 2 - 6,
          fontFamily: FONT.display,
          fontSize: nameFont,
          color: COLORS.ink,
          letterSpacing: '-0.01em',
          lineHeight: 1,
          whiteSpace: 'nowrap',
        }}
      >
        {name}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 30 + nameFont * 0.5 + nameW + nameFont * 0.1,
          top: nb.name - nameFont / 2 - 6,
          fontFamily: FONT.display,
          fontSize: nameFont,
          color: COLORS.pink,
          lineHeight: 1,
        }}
      >
        ⚡
      </div>

      {/* Pink underline accent */}
      <div
        style={{
          position: 'absolute',
          left: 30 + nameFont * 0.5,
          top: nb.underline - 2,
          width: Math.min(nameW, CARD_W - 200),
          height: 5,
          background: COLORS.pink,
        }}
      />

      {/* Stack line — mono ink with ⚡ accents */}
      <div
        style={{
          position: 'absolute',
          left: 32,
          top: nb.stack - 14,
          fontFamily: FONT.mono,
          fontWeight: 700,
          fontSize: 22,
          color: COLORS.ink,
          letterSpacing: '0.28em',
        }}
      >
        [ ⚡ {stack} ⚡ ]
      </div>

      {/* Right side: barcode + HH/GOA/26 tag */}
      <div
        style={{
          position: 'absolute',
          right: 240,
          top: nb.stack - 26,
          width: 200,
          height: 28,
          backgroundImage: `repeating-linear-gradient(90deg, ${COLORS.ink} 0 2px, transparent 2px 5px, ${COLORS.ink} 5px 7px, transparent 7px 11px, ${COLORS.ink} 11px 12px, transparent 12px 14px, ${COLORS.ink} 16px 18px, transparent 18px 22px, ${COLORS.ink} 23px 24px, transparent 24px 27px)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: 32,
          top: nb.stack - 14,
          fontFamily: FONT.mono,
          fontWeight: 700,
          fontSize: 12,
          color: COLORS.pink,
          letterSpacing: '0.26em',
        }}
      >
        HH / GOA / 26
      </div>
    </>
  );
}

// ============================================================================
// class band (pink)
// ============================================================================

function ClassBand({
  klass,
  klassFont,
  klassW,
  builderNo,
}: {
  klass: string;
  klassFont: number;
  klassW: number;
  builderNo: string;
}) {
  const r = { x: 0, y: 1100, w: CARD_W, h: 160 };
  const stamp = getClassBuilderStamp();
  const starCorner = getClassStarCorner();

  return (
    <div
      style={{
        position: 'absolute',
        top: r.y,
        left: r.x,
        width: r.w,
        height: r.h,
        background: COLORS.pink,
        overflow: 'hidden',
      }}
    >
      {/* BUILDER CLASS eyebrow */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 32,
          fontFamily: FONT.editorial,
          fontStyle: 'italic',
          fontWeight: 600,
          fontSize: 20,
          color: COLORS.cream,
          letterSpacing: '0.02em',
        }}
      >
        BUILDER CLASS
      </div>
      <div
        style={{
          position: 'absolute',
          top: 22,
          left: 210,
          fontFamily: FONT.mono,
          fontWeight: 700,
          fontSize: 13,
          color: COLORS.sun,
          letterSpacing: '0.3em',
        }}
      >
        ·  VIBE  ·
      </div>

      {/* Yellow star sticker in the corner */}
      <CornerStickerSVG
        x={starCorner.x + 60}
        y={starCorner.y + 22}
        label="★ CLASS"
        rotate={5}
        bg={COLORS.sun}
        fg={COLORS.ink}
        anchorLeft
      />

      {/* BUILDER No. round stamp top-right */}
      <RoundStampSVG
        cx={stamp.cx}
        cy={stamp.cy}
        r={stamp.r}
        topLabel="BUILDER"
        bottomLabel={`No. ${builderNo}`}
        color={COLORS.ink}
        accent={COLORS.sun}
        outerColor={COLORS.ink}
        fontSizeTop={9}
        fontSizeBottom={14}
      />

      {/* Big class title (Anton, sun yellow) */}
      <div
        style={{
          position: 'absolute',
          left: 32,
          top: 60 + klassFont / 2,
          fontFamily: FONT.display,
          fontWeight: 400,
          fontSize: klassFont,
          color: COLORS.sun,
          letterSpacing: '-0.01em',
          lineHeight: 1,
          whiteSpace: 'nowrap',
        }}
      >
        {klass}
      </div>

      {/* Yellow accent rule under class title */}
      <div
        style={{
          position: 'absolute',
          left: 32,
          top: 96 + klassFont * 0.85,
          width: Math.min(klassW, CARD_W - 220),
          height: 4,
          background: COLORS.sun,
        }}
      />

      {/* Bottom row */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          left: 32,
          fontFamily: FONT.mono,
          fontWeight: 700,
          fontSize: 11,
          color: COLORS.cream,
          letterSpacing: '0.3em',
        }}
      >
        247 BUILDERS · 28—31 OCT 2026
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          right: 28,
          fontFamily: FONT.mono,
          fontWeight: 700,
          fontSize: 11,
          color: COLORS.cream,
          letterSpacing: '0.3em',
        }}
      >
        ↻ TRY ANOTHER
      </div>
    </div>
  );
}

// ============================================================================
// footer band (cream)
// ============================================================================

function FooterBand({ builderNo }: { builderNo: string }) {
  const r = { x: 0, y: 1260, w: CARD_W, h: 90 };
  const tear = getFooterTear();
  const pm = getFooterPostmark();

  return (
    <div
      style={{
        position: 'absolute',
        top: r.y,
        left: r.x,
        width: r.w,
        height: r.h,
        background: COLORS.cream,
        overflow: 'hidden',
      }}
    >
      {/* Top dotted rule */}
      <div
        style={{
          position: 'absolute',
          top: 6,
          left: 0,
          right: 0,
          height: 2,
          backgroundImage: `repeating-linear-gradient(90deg, ${COLORS.ink} 0 4px, transparent 4px 12px)`,
          opacity: 0.4,
        }}
      />

      {/* Perforation strip on the left */}
      <div
        style={{
          position: 'absolute',
          left: tear.x,
          top: tear.y,
          width: tear.w,
          height: tear.h,
          backgroundImage: `radial-gradient(circle, ${COLORS.cream} 4px, transparent 5px)`,
          backgroundSize: '8px 16px',
          backgroundPosition: '0 0',
          backgroundColor: COLORS.ink,
        }}
      />

      {/* Goa editorial italic */}
      <div
        style={{
          position: 'absolute',
          top: r.h / 2 - 19,
          left: 50,
          fontFamily: FONT.editorialItalic,
          fontStyle: 'italic',
          fontWeight: 600,
          fontSize: 38,
          color: COLORS.ink,
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}
      >
        Goa
      </div>
      <div
        style={{
          position: 'absolute',
          top: r.h / 2 - 7,
          left: 138,
          fontFamily: FONT.mono,
          fontWeight: 700,
          fontSize: 11,
          color: COLORS.pink,
          letterSpacing: '0.3em',
        }}
      >
        INDIA
      </div>

      {/* Postmark center */}
      <PostmarkSVG
        cx={pm.cx}
        cy={pm.cy - r.y}
        w={pm.w}
        h={pm.h}
        text="#FrameInGoa"
        color={COLORS.pink}
      />

      {/* Right: hashtag + dates + tag */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          right: 32,
          fontFamily: FONT.display,
          fontSize: 22,
          color: COLORS.pink,
          letterSpacing: '-0.01em',
          lineHeight: 1,
        }}
      >
        #FrameInGoa
      </div>
      <div
        style={{
          position: 'absolute',
          top: 40,
          right: 32,
          fontFamily: FONT.mono,
          fontWeight: 700,
          fontSize: 11,
          color: COLORS.ink,
          letterSpacing: '0.26em',
        }}
      >
        28—31 OCT 2026
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 8,
          right: 32,
          fontFamily: FONT.mono,
          fontWeight: 700,
          fontSize: 10,
          color: COLORS.ink,
          letterSpacing: '0.26em',
        }}
      >
        HH / GOA / 26
      </div>

      {/* Bottom dotted rule */}
      <div
        style={{
          position: 'absolute',
          bottom: 4,
          left: 0,
          right: 0,
          height: 2,
          backgroundImage: `repeating-linear-gradient(90deg, ${COLORS.ink} 0 3px, transparent 3px 9px)`,
          opacity: 0.35,
        }}
      />

      {/* Tiny palm + birds bottom-right corner */}
      <PalmSVG x={CARD_W - 40} y={r.h} h={28} color={COLORS.ink} scale={0.8} />
      <BirdSVG x={CARD_W - 80} y={r.h - 30} scale={0.7} color={COLORS.ink} />
      <BirdSVG x={CARD_W - 52} y={r.h - 38} scale={0.5} color={COLORS.ink} />
    </div>
  );
}

// ============================================================================
// SVG illustration helpers
// ============================================================================

function PalmSVG({
  x,
  y,
  h,
  color,
  scale = 1,
  mirrored = false,
}: {
  x: number;
  y: number;
  h: number;
  color: string;
  scale?: number;
  mirrored?: boolean;
}) {
  const w = 130 * scale;
  const trunkX = mirrored ? w - 65 : 65;
  const trunkTopX = mirrored ? w - 70 : 60;
  return (
    <svg
      style={{
        position: 'absolute',
        left: x - w / 2,
        top: y - h,
        width: w,
        height: h + 32,
        transform: mirrored ? 'scaleX(-1)' : undefined,
      }}
      viewBox={`0 0 ${w} ${h + 32}`}
    >
      {/* Trunk */}
      <path
        d={`M${trunkX} ${h + 32} Q${trunkX + 8 * scale} ${h * 0.55} ${trunkTopX} 4`}
        fill="none"
        stroke={color}
        strokeWidth={4 * scale}
        strokeLinecap="round"
      />
      {/* Fronds */}
      {Array.from({ length: 8 }).map((_, i) => {
        const a = -Math.PI / 2 + ((i - 3.5) / 8) * (Math.PI * 0.95);
        const len = h * 0.55;
        const tipX = trunkTopX + Math.cos(a) * len;
        const tipY = Math.sin(a) * len;
        return (
          <path
            key={i}
            d={`M${trunkTopX} 4 Q${trunkTopX + Math.cos(a) * len * 0.5} ${Math.sin(a) * len * 0.5} ${tipX} ${tipY}`}
            fill="none"
            stroke={color}
            strokeWidth={5 * scale}
            strokeLinecap="round"
          />
        );
      })}
      {/* Coconuts */}
      <circle cx={trunkTopX - 7 * scale} cy={8} r={4 * scale} fill={color} />
      <circle cx={trunkTopX} cy={6} r={4 * scale} fill={color} />
      <circle cx={trunkTopX + 7 * scale} cy={8} r={4 * scale} fill={color} />
    </svg>
  );
}

function SunSVG({
  cx,
  cy,
  r,
  fill,
  ray,
  cxAbs = true,
}: {
  cx: number;
  cy: number;
  r: number;
  fill: string;
  ray: string;
  cxAbs?: boolean;
}) {
  const w = r * 5.2;
  const offsetX = cxAbs ? cx : w / 2;
  const offsetY = cxAbs ? cy : cy;
  return (
    <svg
      style={{
        position: 'absolute',
        left: offsetX - w / 2,
        top: offsetY - w / 2,
        width: w,
        height: w,
      }}
      viewBox="0 0 200 200"
    >
      <circle cx={100} cy={100} r={r * 1.4} fill={fill} />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const x1 = 100 + Math.cos(a) * (r * 1.7);
        const y1 = 100 + Math.sin(a) * (r * 1.7);
        const x2 = 100 + Math.cos(a) * (r * 2.6);
        const y2 = 100 + Math.sin(a) * (r * 2.6);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={ray}
            strokeWidth={Math.max(3, r * 0.22)}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

function ScooterSVG({
  cx,
  cy,
  scale,
  color,
}: {
  cx: number;
  cy: number;
  scale: number;
  color: string;
}) {
  const w = 60 * scale;
  const h = 40 * scale;
  return (
    <svg
      style={{
        position: 'absolute',
        left: cx - w / 2,
        top: cy - h / 2,
        width: w,
        height: h,
      }}
      viewBox="0 0 60 40"
    >
      {/* Wheels */}
      <circle cx="10" cy="30" r={6 * scale} fill={color} />
      <circle cx="48" cy="30" r={6 * scale} fill={color} />
      <circle cx="10" cy="30" r={2.4 * scale} fill={COLORS.cream} />
      <circle cx="48" cy="30" r={2.4 * scale} fill={COLORS.cream} />
      {/* Body */}
      <path
        d="M4 16 L4 6 Q4 0 10 0 L32 0 Q42 0 44 6 L44 16 Z"
        fill={color}
      />
      {/* Seat */}
      <rect x={12} y={-2 * scale} width={12 * scale} height={3 * scale} fill={color} />
      {/* Handle */}
      <line x1="36" y1="0" x2="40" y2={-6 * scale} stroke={color} strokeWidth={2.5 * scale} strokeLinecap="round" />
    </svg>
  );
}

function SurfboardSVG({
  x,
  y,
  scale,
  color,
  stripe,
}: {
  x: number;
  y: number;
  scale: number;
  color: string;
  stripe: string;
}) {
  const w = 30 * scale;
  const h = 80 * scale;
  return (
    <svg
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        height: h,
      }}
      viewBox="0 0 30 80"
    >
      <ellipse cx={15} cy={40} rx={11} ry={38} fill={color} />
      <ellipse cx={15} cy={40} rx={3.4} ry={36} fill={stripe} />
    </svg>
  );
}

function StarSVG({ x, y, r, color }: { x: number; y: number; r: number; color: string }) {
  const spikes = 5;
  const outer = r;
  const inner = r * 0.45;
  const points: string[] = [];
  let rot = -Math.PI / 2;
  for (let i = 0; i < spikes; i++) {
    points.push(`${x + Math.cos(rot) * outer},${y + Math.sin(rot) * outer}`);
    rot += Math.PI / spikes;
    points.push(`${x + Math.cos(rot) * inner},${y + Math.sin(rot) * inner}`);
    rot += Math.PI / spikes;
  }
  return (
    <svg
      style={{
        position: 'absolute',
        left: x - r - 4,
        top: y - r - 4,
        width: (r + 4) * 2,
        height: (r + 4) * 2,
      }}
      viewBox={`${x - r - 4} ${y - r - 4} ${(r + 4) * 2} ${(r + 4) * 2}`}
    >
      <polygon points={points.join(' ')} fill={color} />
    </svg>
  );
}

function RoundStampSVG({
  cx,
  cy,
  r,
  topLabel,
  bottomLabel,
  color,
  accent,
  outerColor,
  fontSizeTop = 11,
  fontSizeBottom = 15,
}: {
  cx: number;
  cy: number;
  r: number;
  topLabel: string;
  bottomLabel: string;
  color: string;
  accent: string;
  outerColor?: string;
  fontSizeTop?: number;
  fontSizeBottom?: number;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        left: cx - r,
        top: cy - r,
        width: r * 2,
        height: r * 2,
        borderRadius: '50%',
        border: `2.5px solid ${outerColor ?? color}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color,
      }}
    >
      <div
        style={{
          fontFamily: FONT.mono,
          fontWeight: 700,
          fontSize: fontSizeTop,
          letterSpacing: '0.18em',
        }}
      >
        {topLabel}
      </div>
      <div
        style={{
          fontFamily: FONT.mono,
          fontWeight: 700,
          fontSize: fontSizeBottom,
          letterSpacing: '0.1em',
          marginTop: 3,
        }}
      >
        {bottomLabel}
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: r * 0.32,
          width: 4,
          height: 4,
          borderRadius: '50%',
          background: accent,
        }}
      />
    </div>
  );
}

function CornerStickerSVG({
  x,
  y,
  label,
  rotate,
  bg,
  fg,
  anchorLeft = false,
}: {
  x: number;
  y: number;
  label: string;
  rotate: number;
  bg: string;
  fg: string;
  anchorLeft?: boolean;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        left: anchorLeft ? x : 'auto',
        right: anchorLeft ? 'auto' : CARD_W - x - 230,
        top: y,
        background: bg,
        color: fg,
        padding: '12px 20px',
        fontFamily: FONT.mono,
        fontWeight: 700,
        fontSize: 16,
        letterSpacing: '0.2em',
        transform: `rotate(${rotate}deg)`,
        borderRadius: 6,
        boxShadow: `inset 0 0 0 1.5px ${fg}`,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </div>
  );
}

function StarBurstSVG({
  cx,
  cy,
  r,
  bg,
  fg,
  ray,
  label,
}: {
  cx: number;
  cy: number;
  r: number;
  bg: string;
  fg: string;
  ray: string;
  label: string;
}) {
  const spikes = 12;
  const outer = r + 8;
  const inner = r * 0.85;
  const points: string[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
    const rad = i % 2 === 0 ? outer : inner;
    points.push(`${cx + Math.cos(a) * rad},${cy + Math.sin(a) * rad}`);
  }
  return (
    <svg
      style={{
        position: 'absolute',
        left: cx - outer - 4,
        top: cy - outer - 4,
        width: (outer + 4) * 2,
        height: (outer + 4) * 2,
      }}
      viewBox={`${cx - outer - 4} ${cy - outer - 4} ${(outer + 4) * 2} ${(outer + 4) * 2}`}
    >
      <polygon points={points.join(' ')} fill={ray} />
      <polygon
        points={points
          .map((p) => {
            const [px, py] = p.split(',').map(Number);
            const dx = px - cx;
            const dy = py - cy;
            return `${cx + dx * 0.86},${cy + dy * 0.86}`;
          })
          .join(' ')}
        fill={bg}
      />
      <text
        x={cx}
        y={cy + 5}
        textAnchor="middle"
        fill={fg}
        fontFamily={FONT.display}
        fontSize={r * 0.36}
        style={{ letterSpacing: '0.04em' }}
      >
        {label}
      </text>
    </svg>
  );
}

function PostmarkSVG({
  cx,
  cy,
  w,
  h,
  text,
  color,
}: {
  cx: number;
  cy: number;
  w: number;
  h: number;
  text: string;
  color: string;
}) {
  const period = 8;
  const amp = 3;
  const top: string[] = [];
  const bottom: string[] = [];
  for (let i = 0; i <= w; i += period) {
    const yy = amp * Math.sin((i / period) * Math.PI * 2);
    top.push(`${i},${yy}`);
  }
  for (let i = w; i >= 0; i -= period) {
    const yy = h - amp * Math.sin((i / period) * Math.PI * 2);
    bottom.push(`${i},${yy}`);
  }
  const pathD =
    `M0,${amp} ` + top.map((p) => `L${p}`).join(' ') +
    ' ' + bottom.map((p) => `L${p}`).join(' ') + ' Z';

  return (
    <svg
      style={{
        position: 'absolute',
        left: cx - w / 2,
        top: cy - h / 2,
        width: w,
        height: h,
        opacity: 0.85,
      }}
      viewBox={`0 0 ${w} ${h}`}
    >
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
      />
      <text
        x={w / 2}
        y={h / 2 + 7}
        textAnchor="middle"
        fill={color}
        fontFamily={FONT.display}
        fontSize={22}
        style={{ letterSpacing: '-0.01em' }}
      >
        {text}
      </text>
    </svg>
  );
}

function BirdSVG({
  x,
  y,
  scale,
  color,
}: {
  x: number;
  y: number;
  scale: number;
  color: string;
}) {
  const w = 40 * scale;
  const h = 18 * scale;
  return (
    <svg
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        height: h,
      }}
      viewBox="0 0 40 18"
    >
      <path
        d="M2 12 Q10 2 20 10 Q30 2 38 12"
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </svg>
  );
}
