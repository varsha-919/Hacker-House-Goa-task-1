// DOM preview of the Builder ID card.
//
// Uses the EXACT same layout numbers as the canvas rasterizer in
// lib/export.ts (PANELS, COLORS, photo cover-crop via computeCoverLayout).
// Because of that, what you see here is what gets downloaded.

import React, { forwardRef, useMemo } from 'react';
import { CARD_W, CARD_H, PANELS, COLORS, type BuilderIDData } from '../lib/builderIdLayout';
import { computeCoverLayout, type CropAdjust, DEFAULT_ADJUST } from '../lib/image';

// Measure the largest font size (px) at which `text` fits in `maxWidth`
// when rendered with Anton (used for both name and builder title).
function measureAntonFit(text: string, maxWidth: number, startSize: number, minSize: number): number {
  if (typeof document === 'undefined') return startSize;
  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return startSize;
  const family = '"Anton", Impact, sans-serif';
  const ls = -0.01;
  let size = startSize;
  while (size > minSize) {
    ctx.font = `700 ${Math.round(size)}px ${family}`;
    const lsPx = ls * size;
    let w = 0;
    for (const c of Array.from(text)) {
      w += ctx.measureText(c).width;
    }
    w += lsPx * (text.length - 1);
    if (w <= maxWidth) return Math.round(size);
    size -= 2;
  }
  return Math.round(minSize);
}

type Props = {
  data: BuilderIDData;
  size?: number;
  className?: string;
  showGuides?: boolean;
};

export const BuilderIDPreview = forwardRef<HTMLDivElement, Props>(function BuilderIDPreview(
  { data, size = CARD_W, className = '' },
  ref,
) {
  const name = (data.name || 'YOUR NAME').toUpperCase().trim();
  const stack = (data.stackOrRole || 'BUILDER').toUpperCase().trim();
  const title = (data.builderTitle || 'THE BUILDER').toUpperCase().trim();

  const adjust: CropAdjust = data.adjust ?? DEFAULT_ADJUST;
  const photoLayout = data.photo
    ? computeCoverLayout(data.photo.naturalWidth, data.photo.naturalHeight, CARD_W, PANELS.photo, adjust)
    : null;

  // Match the canvas's fitting logic exactly.
  const nameFontPx = useMemo(
    () =>
      measureAntonFit(
        name,
        CARD_W - 80,
        PANELS.name * 0.62,
        Math.max(20, Math.round(PANELS.name * 0.55 * 0.45)),
      ),
    [name],
  );

  const titleFontPx = useMemo(
    () =>
      measureAntonFit(
        title,
        CARD_W - 80,
        PANELS.title * 0.6,
        Math.max(40, Math.round(PANELS.title * 0.85 * 0.55)),
      ),
    [title],
  );

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden bg-ink ${className}`}
      style={{ width: size, height: size * (CARD_H / CARD_W) }}
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
        }}
      >
        <HeaderPanel size={size} />
        <PhotoPanel
          size={size}
          photo={data.photo}
          bgSizePct={photoLayout?.bgSizePct}
          bgPosXPct={photoLayout?.bgPosXPct}
          bgPosYPct={photoLayout?.bgPosYPct}
        />
        <NamePanel size={size} name={name} stack={stack} nameFontPx={nameFontPx} />
        <TitlePanel size={size} title={title} titleFontPx={titleFontPx} />
        <FooterPanel size={size} />
      </div>
    </div>
  );
});

function absPos(panel: { x: number; y: number; w: number; h: number }) {
  return {
    position: 'absolute' as const,
    left: panel.x,
    top: panel.y,
    width: panel.w,
    height: panel.h,
  };
}

function HeaderPanel({ size }: { size: number }) {
  const r = { x: 0, y: 0, w: CARD_W, h: PANELS.header };
  const sq = r.h;

  return (
    <div style={{ ...absPos(r), background: COLORS.cream, overflow: 'hidden' }}>
      {/* yellow square on the left */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: sq,
          height: sq,
          background: COLORS.sun,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontFamily: 'Anton, Impact, sans-serif',
            fontWeight: 700,
            fontSize: sq * 0.62,
            color: COLORS.ink,
            letterSpacing: '-0.04em',
            lineHeight: 1,
          }}
        >
          HH
        </span>
      </div>

      <div
        style={{
          position: 'absolute',
          left: sq + 28,
          top: 0,
          height: r.h,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            fontFamily: 'Anton, Impact, sans-serif',
            fontWeight: 700,
            fontSize: r.h * 0.34,
            color: COLORS.ink,
            lineHeight: 1,
            letterSpacing: '-0.01em',
          }}
        >
          HACKER HOUSE
        </div>
        <div
          style={{
            marginTop: 4,
            fontFamily: '"JetBrains Mono", ui-monospace, monospace',
            fontWeight: 700,
            fontSize: r.h * 0.18,
            color: COLORS.ink,
            letterSpacing: '0.18em',
          }}
        >
          GOA · 2026
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          right: 28,
          top: (r.h - r.h * 0.55) / 2,
          padding: `${r.h * 0.09}px ${r.h * 0.16}px`,
          background: COLORS.ink,
          color: COLORS.sun,
          borderRadius: 999,
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          fontWeight: 700,
          fontSize: r.h * 0.18,
          letterSpacing: '0.18em',
        }}
      >
        #FRAMEINGOA
      </div>
    </div>
  );
}

function PhotoPanel({
  size,
  photo,
  bgSizePct,
  bgPosXPct,
  bgPosYPct,
}: {
  size: number;
  photo: HTMLImageElement | null;
  bgSizePct?: number;
  bgPosXPct?: number;
  bgPosYPct?: number;
}) {
  const r = { x: 0, y: PANELS.header, w: CARD_W, h: PANELS.photo };

  return (
    <div style={{ ...absPos(r), overflow: 'hidden' }}>
      {photo && bgSizePct != null ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${photo.src})`,
            backgroundSize: `${bgSizePct}%`,
            backgroundPosition: `${bgPosXPct}% ${bgPosYPct}%`,
            backgroundRepeat: 'no-repeat',
            backgroundColor: COLORS.inkDeep,
          }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: COLORS.inkDeep,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              width: Math.min(r.w, r.h) * 0.32,
              height: Math.min(r.w, r.h) * 0.32,
              borderRadius: '50%',
              background: COLORS.sun,
              marginBottom: 16,
            }}
          />
          <div
            style={{
              fontFamily: 'Anton, Impact, sans-serif',
              fontWeight: 700,
              fontSize: r.h * 0.16,
              color: COLORS.ink,
              letterSpacing: '0.06em',
            }}
          >
            PHOTO
          </div>
        </div>
      )}

      {/* bottom gradient for legibility */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: r.h * 0.18,
          background:
            'linear-gradient(to bottom, rgba(14,42,31,0), rgba(14,42,31,0.45))',
        }}
      />

      {/* pink divider */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 8,
          background: COLORS.pink,
        }}
      />
    </div>
  );
}

function NamePanel({
  name,
  stack,
  nameFontPx,
}: {
  size: number;
  name: string;
  stack: string;
  nameFontPx: number;
}) {
  const r = { x: 0, y: PANELS.header + PANELS.photo, w: CARD_W, h: PANELS.name };

  return (
    <div style={{ ...absPos(r), background: COLORS.cream, overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          left: 40,
          top: r.h * 0.16,
          fontFamily: 'Anton, Impact, sans-serif',
          fontWeight: 700,
          fontSize: nameFontPx,
          color: COLORS.ink,
          lineHeight: 1,
          letterSpacing: '-0.01em',
          whiteSpace: 'nowrap',
        }}
      >
        {name}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 40,
          bottom: 42,
          width: 60,
          height: 6,
          background: COLORS.sun,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 40,
          bottom: 26,
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          fontWeight: 700,
          fontSize: r.h * 0.13,
          color: COLORS.ink,
          letterSpacing: '0.18em',
          whiteSpace: 'nowrap',
        }}
      >
        {stack}
      </div>
    </div>
  );
}

function TitlePanel({
  title,
  titleFontPx,
}: {
  size: number;
  title: string;
  titleFontPx: number;
}) {
  const r = { x: 0, y: PANELS.header + PANELS.photo + PANELS.name, w: CARD_W, h: PANELS.title };

  // Single-line in the preview matches the canvas's single-line fit; if
  // the title is genuinely too long we shrink to fit at the same minimum.
  return (
    <div style={{ ...absPos(r), background: COLORS.pink, overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          left: 40,
          top: 0,
          right: 40,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            fontFamily: 'Anton, Impact, sans-serif',
            fontWeight: 700,
            fontSize: titleFontPx,
            color: COLORS.cream,
            lineHeight: 0.92,
            letterSpacing: '-0.01em',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </div>
      </div>
    </div>
  );
}

function FooterPanel({ size }: { size: number }) {
  const r = {
    x: 0,
    y: PANELS.header + PANELS.photo + PANELS.name + PANELS.title,
    w: CARD_W,
    h: PANELS.footer,
  };

  return (
    <div style={{ ...absPos(r), background: COLORS.ink, overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          left: 40,
          top: r.h * 0.18,
          fontFamily: 'Anton, Impact, sans-serif',
          fontWeight: 700,
          fontSize: r.h * 0.55,
          color: COLORS.cream,
          lineHeight: 1,
          letterSpacing: '-0.02em',
        }}
      >
        GOA
      </div>
      <div
        style={{
          position: 'absolute',
          left: 40,
          top: r.h * 0.72,
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          fontWeight: 700,
          fontSize: r.h * 0.14,
          color: COLORS.sun,
          letterSpacing: '0.24em',
        }}
      >
        INDIA
      </div>

      <div
        style={{
          position: 'absolute',
          right: 40,
          top: r.h * 0.22,
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          fontWeight: 700,
          fontSize: r.h * 0.18,
          color: COLORS.cream,
          letterSpacing: '0.18em',
        }}
      >
        28—31 OCT 2026
      </div>
      <div
        style={{
          position: 'absolute',
          right: 40,
          top: r.h * 0.5,
          width: 80,
          height: 4,
          background: COLORS.sun,
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: 40,
          top: r.h * 0.62,
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          fontWeight: 700,
          fontSize: r.h * 0.15,
          color: COLORS.pink,
          letterSpacing: '0.18em',
        }}
      >
        #FRAMEINGOA
      </div>
    </div>
  );
}
