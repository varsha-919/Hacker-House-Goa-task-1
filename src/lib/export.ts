// Final-image rasterizer for the HH Goa 2026 poster.
//
// 1080 x 1350 portrait. Draws every element (background, illustrations,
// photo frame, photo, all text, stamps, footer) directly to a canvas,
// so the downloaded PNG is guaranteed to contain everything visible in
// the DOM preview.
//
// All coordinates come from posterLayout.ts — the DOM preview reads
// the same numbers, so preview and download cannot drift.
//
// The composition is a richly illustrated Goa event poster / collectible
// hacker-house pass: photo medallion at the center, with illustrations
// crossing band boundaries so the artwork reads as one composed piece.

import {
  CARD_W,
  CARD_H,
  COLORS,
  FONT,
  getPanelRects,
  getHeroMedallion,
  getHeroSun,
  getHeroPlate,
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
  getNameBlock,
  getNameBlockWavy,
  type CropAdjust,
} from './posterLayout';
import { DEFAULT_ADJUST, computeCoverLayout } from './image';

export const BUILDER_ID_SIZE = { w: CARD_W, h: CARD_H };

export type PosterData = {
  name: string;
  stackOrRole: string;
  builderClass: string;
  photo: HTMLImageElement | null;
  adjust?: CropAdjust;
  builderNumber?: number; // 1..247, used in stamps
};

export type RenderOptions = {
  size?: { w: number; h: number };
};

export function renderBuilderIDToCanvas(
  data: PosterData,
  options: RenderOptions = {},
): HTMLCanvasElement {
  const W = options.size?.w ?? CARD_W;
  const H = options.size?.h ?? CARD_H;
  const scale = W / CARD_W;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get a 2D drawing context.');
  ctx.scale(scale, scale);

  const name = (data.name || 'YOUR NAME').toUpperCase().trim();
  const stack = (data.stackOrRole || 'BUILDER').toUpperCase().trim();
  const klass = (data.builderClass || 'THE BUILDER').toUpperCase().trim();
  const builderNo = data.builderNumber ?? 28;

  drawBackground(ctx);
  drawHeader(ctx, { builderNo });
  drawGoaScene(ctx);
  drawHeroZone(ctx, data.photo, data.adjust, builderNo);
  drawNameBlock(ctx, name, stack);
  drawClassBand(ctx, klass, builderNo);
  drawFooter(ctx);

  return canvas;
}

// ============================================================================
// background
// ============================================================================

function drawBackground(ctx: CanvasRenderingContext2D) {
  // Soft cream paper
  ctx.fillStyle = COLORS.cream;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Subtle paper grain (deterministic dots, not noise)
  ctx.save();
  ctx.fillStyle = 'rgba(58, 42, 20, 0.05)';
  const grain = createGrainDots(1080, 1350, 1100);
  for (const d of grain) {
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Dark green outer frame
  ctx.fillStyle = COLORS.ink;
  ctx.fillRect(0, 0, CARD_W, 10);
  ctx.fillRect(0, CARD_H - 10, CARD_W, 10);
  ctx.fillRect(0, 0, 10, CARD_H);
  ctx.fillRect(CARD_W - 10, 0, 10, CARD_H);
}

function createGrainDots(w: number, h: number, n: number) {
  const out: { x: number; y: number; r: number }[] = [];
  let s = 1337;
  for (let i = 0; i < n; i++) {
    s = (s * 9301 + 49297) % 233280;
    const x = (s / 233280) * w;
    s = (s * 9301 + 49297) % 233280;
    const y = (s / 233280) * h;
    s = (s * 9301 + 49297) % 233280;
    const r = 0.5 + (s / 233280) * 1.4;
    out.push({ x, y, r });
  }
  return out;
}

// ============================================================================
// header band (forest)
// ============================================================================

function drawHeader(ctx: CanvasRenderingContext2D, opts: { builderNo: number }) {
  const r = getPanelRects().header;

  // Forest band
  ctx.fillStyle = COLORS.ink;
  ctx.fillRect(r.x, r.y, r.w, r.h);

  // Sun tag in the very top-left corner (yellow square)
  const tagSize = 110;
  ctx.fillStyle = COLORS.sun;
  ctx.fillRect(0, 0, tagSize, tagSize);

  drawText(ctx, {
    text: 'HH',
    x: tagSize / 2,
    y: tagSize / 2 - 8,
    font: `400 ${Math.round(tagSize * 0.55)}px ${FONT.display}`,
    color: COLORS.ink,
    align: 'center',
    baseline: 'middle',
    letterSpacing: -0.04,
  });
  drawText(ctx, {
    text: 'EST. 2026',
    x: tagSize / 2,
    y: tagSize - 16,
    font: `700 10px ${FONT.mono}`,
    color: COLORS.ink,
    align: 'center',
    baseline: 'middle',
    letterSpacing: 0.2,
  });

  // Big wordmark — Hacker House (editorial italic, the brand identity)
  drawText(ctx, {
    text: 'Hacker House',
    x: tagSize + 30,
    y: 60,
    font: `italic 600 60px ${FONT.editorialItalic}`,
    color: COLORS.cream,
    align: 'left',
    baseline: 'middle',
    letterSpacing: -0.01,
  });
  drawText(ctx, {
    text: 'GOA · INDIA',
    x: tagSize + 30,
    y: 104,
    font: `700 18px ${FONT.mono}`,
    color: COLORS.sun,
    align: 'left',
    baseline: 'middle',
    letterSpacing: 0.3,
  });

  // Builder count + currently shipping eyebrow
  drawText(ctx, {
    text: '247 BUILDERS · EST. 2026 · CURRENTLY SHIPPING',
    x: tagSize + 30,
    y: 142,
    font: `700 12px ${FONT.mono}`,
    color: COLORS.pink,
    align: 'left',
    baseline: 'middle',
    letterSpacing: 0.26,
  });

  // Right: dates in Anton + mono
  const rightX = CARD_W - 36;
  drawText(ctx, {
    text: '28—31',
    x: rightX,
    y: 50,
    font: `700 38px ${FONT.display}`,
    color: COLORS.sun,
    align: 'right',
    baseline: 'middle',
    letterSpacing: -0.01,
  });
  drawText(ctx, {
    text: 'OCT 2026',
    x: rightX,
    y: 90,
    font: `700 16px ${FONT.mono}`,
    color: COLORS.cream,
    align: 'right',
    baseline: 'middle',
    letterSpacing: 0.24,
  });
  drawText(ctx, {
    text: 'GOA · INDIA',
    x: rightX,
    y: 116,
    font: `700 12px ${FONT.mono}`,
    color: COLORS.pink,
    align: 'right',
    baseline: 'middle',
    letterSpacing: 0.24,
  });

  // TKT round stamp + builder number
  drawRoundStamp(ctx, {
    cx: CARD_W - 170,
    cy: 50,
    r: 36,
    border: COLORS.pink,
    text: 'TKT',
    textColor: COLORS.pink,
    textFont: `700 14px ${FONT.mono}`,
    sub: `No. ${String(opts.builderNo).padStart(3, '0')}`,
    subFont: `700 10px ${FONT.mono}`,
  });

  // Perforated divider line near the bottom of the header
  drawPerforatedLine(ctx, 0, r.h - 8, CARD_W, 4, COLORS.cream, 12, 8);
  drawDottedLine(ctx, 0, r.h - 24, CARD_W, COLORS.cream, 0.3, 8);
}

// ============================================================================
// goa scene (cream)
// ============================================================================

function drawGoaScene(ctx: CanvasRenderingContext2D) {
  const r = getPanelRects().goa;
  ctx.fillStyle = COLORS.cream;
  ctx.fillRect(r.x, r.y, r.w, r.h);

  // Top corners: lat/long + arabian sea labels
  drawText(ctx, {
    text: 'GOA · 15.5° N · 73.8° E',
    x: r.x + 16,
    y: r.y + 18,
    font: `700 11px ${FONT.mono}`,
    color: COLORS.stamp,
    align: 'left',
    baseline: 'middle',
    letterSpacing: 0.22,
  });
  drawText(ctx, {
    text: 'ARABIAN SEA',
    x: r.x + r.w - 16,
    y: r.y + 18,
    font: `700 11px ${FONT.mono}`,
    color: COLORS.stamp,
    align: 'right',
    baseline: 'middle',
    letterSpacing: 0.22,
  });

  // Sun behind the photo (drawn here so it sits over goa + hero boundary)
  const sun = getHeroSun();
  // Only draw upper half — lower half will be hidden by photo.
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, r.y, CARD_W, sun.cy + sun.r);
  ctx.clip();
  drawSun(ctx, sun.cx, sun.cy, sun.r, COLORS.sun, COLORS.sunDeep);
  ctx.restore();

  // Mountain ridge silhouette across full width
  const m = getMountainRidge();
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(m.left, m.baseY + 50);
  ctx.lineTo(m.left + 120, m.baseY);
  ctx.lineTo(m.left + 240, m.baseY + 22);
  ctx.lineTo(m.left + 360, m.baseY - 10);
  ctx.lineTo(m.left + 480, m.baseY + 16);
  ctx.lineTo(m.left + 620, m.baseY - 4);
  ctx.lineTo(m.left + 760, m.baseY + 20);
  ctx.lineTo(m.left + 900, m.baseY + 2);
  ctx.lineTo(m.right, m.baseY + 26);
  ctx.lineTo(m.right, m.baseY + 70);
  ctx.lineTo(m.left, m.baseY + 70);
  ctx.closePath();
  ctx.fillStyle = COLORS.ink;
  ctx.fill();
  ctx.restore();

  // Wave under the mountains
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(m.left, m.baseY + 56);
  for (let x = m.left; x <= m.right; x += 14) {
    const yy = m.baseY + 56 - Math.abs(Math.sin((x - m.left) / 22)) * 4;
    ctx.lineTo(x, yy);
  }
  ctx.strokeStyle = COLORS.sun;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();

  // Palms: one large left, one medium mid-left, one small right
  drawPalm(ctx, r.x + 90, r.y + r.h - 6, 90, COLORS.stamp, 1);
  drawPalm(ctx, r.x + 220, r.y + r.h - 4, 60, COLORS.ink, 0.85);
  drawPalm(ctx, r.x + r.w - 220, r.y + r.h - 6, 72, COLORS.ink, 0.9);

  // Dotted travel route line across the band
  const route = getGoaRoute();
  drawRouteDots(ctx, route.x1, route.y1, route.x2, route.y2, COLORS.pink, 8, 4);

  // Route label
  drawText(ctx, {
    text: 'ROUTE · BAGA → ANJUNA → PALOLEM',
    x: CARD_W / 2,
    y: route.y1 - 12,
    font: `700 10px ${FONT.mono}`,
    color: COLORS.pink,
    align: 'center',
    baseline: 'middle',
    letterSpacing: 0.3,
  });

  // Scooter on the route
  const sc = getGoaScooter();
  drawScooter(ctx, sc.x - 30, sc.y - 8, 1.4, COLORS.ink);
}

// ============================================================================
// hero zone (cream) — PHOTO MEDALLION at center
// ============================================================================

function drawHeroZone(
  ctx: CanvasRenderingContext2D,
  photo: HTMLImageElement | null,
  adjust: CropAdjust | undefined,
  builderNo: number,
) {
  const r = getPanelRects().hero;
  const { cx, cy, r: rad } = getHeroMedallion();

  // Cream base
  ctx.fillStyle = COLORS.cream;
  ctx.fillRect(r.x, r.y, r.w, r.h);

  // Decorative wave pattern running under the photo (across the cream base)
  drawWavePattern(ctx, r.x + 20, r.y + r.h - 80, r.w - 40, 24, COLORS.pink);

  // Tiny surfboard in the wave area
  const sb = getSurfboard();
  drawSurfboard(ctx, sb.x - 60, sb.y - 20, 0.7, COLORS.ink);

  // Palm frond overlapping from top-left into the medallion (cross-region decoration)
  drawPalm(ctx, 60, r.y + 130, 130, COLORS.stamp, 1);
  drawPalm(ctx, CARD_W - 60, r.y + 130, 130, COLORS.stamp, 1);

  // Cream "postage stamp" plate behind the photo (rotated -3°)
  const plate = getHeroPlate();
  ctx.save();
  ctx.translate(plate.cx, plate.cy);
  ctx.rotate(-0.025);
  ctx.fillStyle = COLORS.pink;
  ctx.fillRect(-plate.w / 2, -plate.h / 2, plate.w, plate.h);
  ctx.fillStyle = COLORS.cream;
  ctx.fillRect(-plate.w / 2 + 14, -plate.h / 2 + 14, plate.w - 28, plate.h - 28);
  ctx.restore();

  // Sun-yellow ring behind the photo
  ctx.fillStyle = COLORS.sun;
  ctx.beginPath();
  ctx.arc(cx, cy, rad + 16, 0, Math.PI * 2);
  ctx.fill();

  // Photo clipped to circle
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, rad, 0, Math.PI * 2);
  ctx.clip();

  if (photo && photo.naturalWidth > 0) {
    const layout = getPhotoCoverLayout(
      photo.naturalWidth,
      photo.naturalHeight,
      rad,
      adjust ?? DEFAULT_ADJUST,
    );
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
      photo,
      layout.sx,
      layout.sy,
      layout.sw,
      layout.sh,
      cx - rad,
      cy - rad,
      rad * 2,
      rad * 2,
    );
  } else {
    ctx.fillStyle = COLORS.inkDeep;
    ctx.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
    drawSun(ctx, cx, cy - 20, 80, COLORS.sun, COLORS.sunDeep);
    drawText(ctx, {
      text: 'PHOTO',
      x: cx,
      y: cy + 100,
      font: `700 32px ${FONT.mono}`,
      color: COLORS.cream,
      align: 'center',
      baseline: 'middle',
      letterSpacing: 0.3,
    });
  }
  ctx.restore();

  // Pink double-ring around the photo
  ctx.strokeStyle = COLORS.pink;
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.arc(cx, cy, rad + 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, rad + 24, 0, Math.PI * 2);
  ctx.stroke();

  // ★ tick on the ring (12 o'clock)
  drawStar(ctx, cx, cy - rad - 24, 12, COLORS.pink);

  // "BUILDER No. NNN" round stamp top-left of medallion
  const bs = getBuilderStamp();
  drawRoundStamp(ctx, {
    cx: bs.cx,
    cy: bs.cy,
    r: bs.r,
    border: COLORS.ink,
    text: 'BUILDER',
    textColor: COLORS.ink,
    textFont: `700 10px ${FONT.mono}`,
    sub: `No. ${String(builderNo).padStart(3, '0')}`,
    subFont: `700 18px ${FONT.mono}`,
  });

  // "BUILD · SHIP · REPEAT" sticker top-right of medallion (rotated -7°)
  const ss = getShipSticker();
  drawCornerSticker(ctx, ss.x, ss.y, COLORS.sun, COLORS.ink, 'BUILD · SHIP · REPEAT', -0.07);

  // ★ starburst sticker bottom-right
  const st = getStarSticker();
  drawStarBurst(ctx, st.cx, st.cy, st.r, COLORS.pink, COLORS.sun, '★ VIBE');

  // Location tag bottom-left of medallion
  const lp = getLocationPin();
  drawText(ctx, {
    text: '◇ ANJUNA BEACH · GOA',
    x: lp.x,
    y: lp.y,
    font: `700 12px ${FONT.mono}`,
    color: COLORS.stamp,
    align: 'left',
    baseline: 'middle',
    letterSpacing: 0.22,
  });
  drawText(ctx, {
    text: '·  BE HERE NOW  ·',
    x: lp.x + 196,
    y: lp.y,
    font: `700 12px ${FONT.mono}`,
    color: COLORS.pink,
    align: 'left',
    baseline: 'middle',
    letterSpacing: 0.22,
  });
}

// ============================================================================
// name block (cream) — wavy top edge, big Anton name, stack with ⚡ accents
// ============================================================================

function drawNameBlock(ctx: CanvasRenderingContext2D, name: string, stack: string) {
  const nb = getNameBlock();
  const wavy = getNameBlockWavy();

  // Cream block with wavy top edge
  ctx.fillStyle = COLORS.cream;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, wavy.y);
  // Wavy top: alternating sine over the full width
  for (let x = 0; x <= CARD_W; x += wavy.period / 2) {
    const yy = wavy.y + wavy.amp * Math.sin((x / wavy.period) * Math.PI * 2);
    ctx.lineTo(x, yy);
  }
  ctx.lineTo(CARD_W, CARD_H);
  ctx.lineTo(0, CARD_H);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Yellow vertical bar on the left
  ctx.fillStyle = COLORS.sun;
  ctx.fillRect(nb.barLeft.x, nb.barLeft.y, nb.barLeft.w, nb.barLeft.h);

  // Sun-yellow accent dot top-right corner
  ctx.fillStyle = COLORS.sun;
  ctx.beginPath();
  ctx.arc(CARD_W - 30, nb.top + 30, 14, 0, Math.PI * 2);
  ctx.fill();

  // Top row: BUILDER ID · NO. 028 / 247 left, ↻ TRY ANOTHER right
  drawText(ctx, {
    text: 'BUILDER ID · NO. 028 / 247',
    x: 32,
    y: nb.eyebrow,
    font: `700 12px ${FONT.mono}`,
    color: COLORS.sun,
    align: 'left',
    baseline: 'middle',
    letterSpacing: 0.26,
  });
  drawText(ctx, {
    text: '↻ TRY ANOTHER TITLE',
    x: CARD_W - 32,
    y: nb.eyebrow,
    font: `700 12px ${FONT.mono}`,
    color: COLORS.pink,
    align: 'right',
    baseline: 'middle',
    letterSpacing: 0.26,
  });

  // Big Anton name — auto-fit. Largest display element on the page.
  const nameFont = pickFittingFontSize(ctx, name, {
    family: FONT.display,
    weight: 400,
    letterSpacing: -0.01,
    maxWidth: CARD_W - 200, // leave room for the bolt accents on either side
    startSize: 160,
    minSize: 64,
  });
  // Yellow ⚡ left
  drawText(ctx, {
    text: '⚡',
    x: 28,
    y: nb.name,
    font: `400 ${nameFont}px ${FONT.display}`,
    color: COLORS.sun,
    align: 'left',
    baseline: 'middle',
  });
  // Name
  drawText(ctx, {
    text: name,
    x: 30 + nameFont * 0.5,
    y: nb.name,
    font: `400 ${nameFont}px ${FONT.display}`,
    color: COLORS.ink,
    align: 'left',
    baseline: 'middle',
    letterSpacing: -0.01,
  });
  // Pink ⚡ right
  const nameW = measureTrackedText(
    ctx,
    name,
    `400 ${nameFont}px ${FONT.display}`,
    -0.01,
  );
  drawText(ctx, {
    text: '⚡',
    x: 30 + nameFont * 0.5 + nameW + nameFont * 0.1,
    y: nb.name,
    font: `400 ${nameFont}px ${FONT.display}`,
    color: COLORS.pink,
    align: 'left',
    baseline: 'middle',
  });

  // Pink underline accent
  ctx.fillStyle = COLORS.pink;
  ctx.fillRect(30 + nameFont * 0.5, nb.underline, Math.min(nameW, CARD_W - 200), 5);

  // Stack line — mono ink, with lightning bolt accents
  const stackFontSize = 22;
  drawText(ctx, {
    text: `[ ⚡ ${stack} ⚡ ]`,
    x: 32,
    y: nb.stack,
    font: `700 ${stackFontSize}px ${FONT.mono}`,
    color: COLORS.ink,
    align: 'left',
    baseline: 'middle',
    letterSpacing: 0.28,
  });

  // Right side: barcode + HH/GOA/26 tag
  drawBarcodeLine(ctx, CARD_W - 240, nb.stack - 12, 200, COLORS.ink);
  drawText(ctx, {
    text: 'HH / GOA / 26',
    x: CARD_W - 32,
    y: nb.stack,
    font: `700 12px ${FONT.mono}`,
    color: COLORS.pink,
    align: 'right',
    baseline: 'middle',
    letterSpacing: 0.26,
  });
}

// ============================================================================
// class band (pink)
// ============================================================================

function drawClassBand(
  ctx: CanvasRenderingContext2D,
  klass: string,
  builderNo: number,
) {
  const r = getPanelRects().klass;

  // Pink band
  ctx.fillStyle = COLORS.pink;
  ctx.fillRect(r.x, r.y, r.w, r.h);

  // "BUILDER CLASS" eyebrow top-left
  drawText(ctx, {
    text: 'BUILDER CLASS',
    x: 32,
    y: r.y + 30,
    font: `italic 600 20px ${FONT.editorial}`,
    color: COLORS.cream,
    align: 'left',
    baseline: 'middle',
    letterSpacing: 0.02,
  });

  // "·  VIBE  ·" accent next to eyebrow
  drawText(ctx, {
    text: '·  VIBE  ·',
    x: 210,
    y: r.y + 30,
    font: `700 13px ${FONT.mono}`,
    color: COLORS.sun,
    align: 'left',
    baseline: 'middle',
    letterSpacing: 0.3,
  });

  // "BUILDER No. NNN" round stamp top-right
  const cbs = getClassBuilderStamp();
  drawRoundStamp(ctx, {
    cx: cbs.cx,
    cy: cbs.cy,
    r: cbs.r,
    border: COLORS.ink,
    text: 'BUILDER',
    textColor: COLORS.ink,
    textFont: `700 9px ${FONT.mono}`,
    sub: `No. ${String(builderNo).padStart(3, '0')}`,
    subFont: `700 14px ${FONT.mono}`,
  });

  // Yellow star sticker rotated in top-left corner
  const cs = getClassStarCorner();
  drawCornerSticker(ctx, cs.x + 60, cs.y + 22, COLORS.sun, COLORS.ink, '★ CLASS', 0.08);

  // Big class title — Anton sun yellow
  const fontSize = pickFittingFontSize(ctx, klass, {
    family: FONT.display,
    weight: 400,
    letterSpacing: -0.01,
    maxWidth: CARD_W - 220,
    startSize: 130,
    minSize: 44,
  });
  drawText(ctx, {
    text: klass,
    x: 32,
    y: r.y + 80 + fontSize / 2,
    font: `400 ${fontSize}px ${FONT.display}`,
    color: COLORS.sun,
    align: 'left',
    baseline: 'middle',
    letterSpacing: -0.01,
  });

  // Yellow accent rule under class title
  const klassW = measureTrackedText(
    ctx,
    klass,
    `400 ${fontSize}px ${FONT.display}`,
    -0.01,
  );
  ctx.fillStyle = COLORS.sun;
  ctx.fillRect(32, r.y + 96 + fontSize * 0.85, Math.min(klassW, CARD_W - 220), 4);

  // Bottom row: rotate hint right + count line left
  const rh = getClassRotateHint();
  drawText(ctx, {
    text: '↻ TRY ANOTHER',
    x: rh.x,
    y: rh.y,
    font: `700 11px ${FONT.mono}`,
    color: COLORS.cream,
    align: 'right',
    baseline: 'middle',
    letterSpacing: 0.3,
  });
  drawText(ctx, {
    text: '247 BUILDERS · 28—31 OCT 2026',
    x: 32,
    y: rh.y,
    font: `700 11px ${FONT.mono}`,
    color: COLORS.cream,
    align: 'left',
    baseline: 'middle',
    letterSpacing: 0.3,
  });
}

// ============================================================================
// footer band (cream)
// ============================================================================

function drawFooter(ctx: CanvasRenderingContext2D) {
  const r = getPanelRects().footer;

  // Cream footer
  ctx.fillStyle = COLORS.cream;
  ctx.fillRect(r.x, r.y, r.w, r.h);

  // Top dotted rule
  drawDottedLine(ctx, r.x, r.y + 6, r.w, COLORS.ink, 0.4, 8);

  // Postcard-style perforation on the left edge
  const tear = getFooterTear();
  drawTicketTear(ctx, tear.x, tear.y, tear.w, tear.h, COLORS.ink);

  // Left: GOA in big editorial italic
  drawText(ctx, {
    text: 'Goa',
    x: 50,
    y: r.y + r.h / 2 + 4,
    font: `italic 600 38px ${FONT.editorial}`,
    color: COLORS.ink,
    align: 'left',
    baseline: 'middle',
    letterSpacing: -0.02,
  });
  drawText(ctx, {
    text: 'INDIA',
    x: 138,
    y: r.y + r.h / 2 + 6,
    font: `700 11px ${FONT.mono}`,
    color: COLORS.pink,
    align: 'left',
    baseline: 'middle',
    letterSpacing: 0.3,
  });

  // Center: postmark
  const pm = getFooterPostmark();
  drawPostmark(ctx, pm.cx - pm.w / 2, pm.cy - pm.h / 2, pm.w, pm.h, COLORS.pink, '#FrameInGoa');

  // Right: hashtag + dates + tag
  drawText(ctx, {
    text: '#FrameInGoa',
    x: CARD_W - 32,
    y: r.y + 24,
    font: `400 22px ${FONT.display}`,
    color: COLORS.pink,
    align: 'right',
    baseline: 'middle',
    letterSpacing: -0.01,
  });
  drawText(ctx, {
    text: '28—31 OCT 2026',
    x: CARD_W - 32,
    y: r.y + 50,
    font: `700 11px ${FONT.mono}`,
    color: COLORS.ink,
    align: 'right',
    baseline: 'middle',
    letterSpacing: 0.26,
  });
  drawText(ctx, {
    text: 'HH / GOA / 26',
    x: CARD_W - 32,
    y: r.y + r.h - 12,
    font: `700 10px ${FONT.mono}`,
    color: COLORS.ink,
    align: 'right',
    baseline: 'middle',
    letterSpacing: 0.26,
  });

  // Tiny palm + sun
  drawPalm(ctx, CARD_W - 40, r.y + r.h, 28, COLORS.ink, 0.8);

  // Birds
  drawBird(ctx, CARD_W - 80, r.y + r.h - 30, 0.7, COLORS.ink);
  drawBird(ctx, CARD_W - 52, r.y + r.h - 38, 0.5, COLORS.ink);

  // Bottom rule
  drawDottedLine(ctx, r.x, r.y + r.h - 4, r.w, COLORS.ink, 0.35, 6);
}

// ============================================================================
// illustrations (reused across single + team)
// ============================================================================

function drawSun(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  fill: string,
  ray: string,
) {
  ctx.save();
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = ray;
  ctx.lineWidth = Math.max(3, radius * 0.18);
  ctx.lineCap = 'round';
  const rays = 12;
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * Math.PI * 2;
    const x1 = cx + Math.cos(a) * (radius + radius * 0.25);
    const y1 = cy + Math.sin(a) * (radius + radius * 0.25);
    const x2 = cx + Math.cos(a) * (radius + radius * 0.55);
    const y2 = cy + Math.sin(a) * (radius + radius * 0.55);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPalm(
  ctx: CanvasRenderingContext2D,
  baseX: number,
  baseY: number,
  height: number,
  color: string,
  scale: number = 1,
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';

  // Trunk: slight curve
  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  ctx.quadraticCurveTo(baseX + 8 * scale, baseY - height * 0.5, baseX - 4 * scale, baseY - height);
  ctx.lineWidth = 5 * scale;
  ctx.stroke();

  // Crown: 8 fronds
  const topX = baseX - 4 * scale;
  const topY = baseY - height;
  const fronds = 8;
  for (let i = 0; i < fronds; i++) {
    const a = -Math.PI / 2 + ((i - (fronds - 1) / 2) / fronds) * (Math.PI * 0.95);
    const len = height * 0.55;
    const tipX = topX + Math.cos(a) * len;
    const tipY = topY + Math.sin(a) * len;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(
      topX + Math.cos(a) * len * 0.5 + Math.cos(a + 1) * 6,
      topY + Math.sin(a) * len * 0.5 + Math.sin(a + 1) * 6,
      tipX,
      tipY,
    );
    ctx.lineWidth = 5 * scale;
    ctx.stroke();
  }
  // Coconuts
  ctx.fillStyle = color;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.arc(topX + i * 6 * scale, topY + 6 * scale, 4 * scale, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  color: string,
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  const spikes = 5;
  const outer = r;
  const inner = r * 0.45;
  let rot = -Math.PI / 2;
  ctx.moveTo(cx + Math.cos(rot) * outer, cy + Math.sin(rot) * outer);
  for (let i = 0; i < spikes; i++) {
    rot += Math.PI / spikes;
    ctx.lineTo(cx + Math.cos(rot) * inner, cy + Math.sin(rot) * inner);
    rot += Math.PI / spikes;
    ctx.lineTo(cx + Math.cos(rot) * outer, cy + Math.sin(rot) * outer);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// Round postage-style stamp with double ring + text + sub
function drawRoundStamp(ctx: CanvasRenderingContext2D, opts: {
  cx: number;
  cy: number;
  r: number;
  border: string;
  text: string;
  textColor: string;
  textFont: string;
  sub?: string;
  subFont?: string;
}) {
  ctx.save();
  ctx.strokeStyle = opts.border;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(opts.cx, opts.cy, opts.r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(opts.cx, opts.cy, opts.r - 5, 0, Math.PI * 2);
  ctx.stroke();

  drawText(ctx, {
    text: opts.text,
    x: opts.cx,
    y: opts.cy - (opts.sub ? 6 : 0),
    font: opts.textFont,
    color: opts.textColor,
    align: 'center',
    baseline: 'middle',
    letterSpacing: 0.18,
  });
  if (opts.sub && opts.subFont) {
    drawText(ctx, {
      text: opts.sub,
      x: opts.cx,
      y: opts.cy + 12,
      font: opts.subFont,
      color: opts.textColor,
      align: 'center',
      baseline: 'middle',
      letterSpacing: 0.1,
    });
  }
  ctx.restore();
}

// Rotated sticker with text (e.g. "BUILD · SHIP · REPEAT")
function drawCornerSticker(
  ctx: CanvasRenderingContext2D,
  anchorX: number,
  anchorY: number,
  bg: string,
  fg: string,
  text: string,
  rotation: number = 0.05,
) {
  ctx.save();
  const font = `700 16px ${FONT.mono}`;
  ctx.font = font;
  const w = measureTrackedText(ctx, text, font, 0.2) + 28;
  const h = 32;
  ctx.translate(anchorX, anchorY);
  ctx.rotate(rotation);

  ctx.fillStyle = bg;
  roundRect(ctx, -w, -h / 2, w, h, 6);
  ctx.fill();
  ctx.strokeStyle = fg;
  ctx.lineWidth = 1.5;
  roundRect(ctx, -w, -h / 2, w, h, 6);
  ctx.stroke();

  drawText(ctx, {
    text,
    x: -w / 2,
    y: 0,
    font,
    color: fg,
    align: 'center',
    baseline: 'middle',
    letterSpacing: 0.2,
  });
  ctx.restore();
}

// Starburst sticker: circle with rays + text inside
function drawStarBurst(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  bg: string,
  accent: string,
  text: string,
) {
  ctx.save();
  const spikes = 12;
  const outer = r + 8;
  const inner = r * 0.85;
  ctx.fillStyle = bg;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const ang = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
    const rad = i % 2 === 0 ? outer : inner;
    const x = cx + Math.cos(ang) * rad;
    const y = cy + Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.stroke();

  drawText(ctx, {
    text,
    x: cx,
    y: cy,
    font: `700 14px ${FONT.mono}`,
    color: accent,
    align: 'center',
    baseline: 'middle',
    letterSpacing: 0.2,
  });
  ctx.restore();
}

// Postmark stamp (postcard-style wavy rectangle with text)
function drawPostmark(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  text: string,
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  const period = 8;
  const amp = 3;
  ctx.beginPath();
  for (let i = 0; i <= w; i += period) {
    const yy = y + amp * Math.sin((i / period) * Math.PI * 2);
    if (i === 0) ctx.moveTo(x + i, yy);
    else ctx.lineTo(x + i, yy);
  }
  for (let i = w; i >= 0; i -= period) {
    const yy = y + h - amp * Math.sin((i / period) * Math.PI * 2);
    ctx.lineTo(x + i, yy);
  }
  ctx.closePath();
  ctx.stroke();

  drawText(ctx, {
    text,
    x: x + w / 2,
    y: y + h / 2 + 4,
    font: `400 22px ${FONT.display}`,
    color,
    align: 'center',
    baseline: 'middle',
    letterSpacing: -0.01,
  });
  ctx.restore();
}

// Postcard-style perforation strip (vertical)
function drawTicketTear(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
) {
  ctx.save();
  ctx.fillStyle = color;
  const period = 12;
  for (let i = 0; i < h; i += period) {
    ctx.fillRect(x, y + i, w, period / 2);
  }
  ctx.restore();
}

// Scooter silhouette (Vespa-style)
function drawScooter(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  color: string,
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2 * scale;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.arc(x + 10, y + 16, 6 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + 38, y + 16, 6 * scale, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x + 4, y + 14);
  ctx.lineTo(x + 4, y + 6);
  ctx.quadraticCurveTo(x + 4, y, x + 10, y);
  ctx.lineTo(x + 32, y);
  ctx.quadraticCurveTo(x + 42, y, x + 44, y + 6);
  ctx.lineTo(x + 44, y + 14);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x + 36, y);
  ctx.lineTo(x + 40, y - 6 * scale);
  ctx.lineWidth = 2.5 * scale;
  ctx.stroke();

  ctx.fillRect(x + 12, y - 2, 12 * scale, 3);

  ctx.restore();
}

// Surfboard with stripe
function drawSurfboard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  color: string,
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.translate(x, y);
  ctx.rotate(-0.45);
  ctx.ellipse(0, 0, 24 * scale, 6 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.cream;
  ctx.ellipse(0, 0, 20 * scale, 1.4 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Minimalist bird (~ gull)
function drawBird(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  color: string,
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2 * scale;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 6 * scale, y);
  ctx.quadraticCurveTo(x - 3 * scale, y - 4 * scale, x, y);
  ctx.quadraticCurveTo(x + 3 * scale, y - 4 * scale, x + 6 * scale, y);
  ctx.stroke();
  ctx.restore();
}

// Dotted travel route line
function drawRouteDots(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  spacing: number,
  radius: number,
) {
  ctx.save();
  ctx.fillStyle = color;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const steps = Math.floor(dist / spacing);
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    const px = x1 + dx * t;
    const py = y1 + dy * t;
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// Horizontal wave pattern (decorative, like sea waves)
function drawWavePattern(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (let row = 0; row < 2; row++) {
    ctx.beginPath();
    const yy = y + row * 12;
    ctx.moveTo(x, yy);
    for (let i = 0; i <= w; i += 12) {
      const off = Math.sin((i / 12) * Math.PI) * 4;
      ctx.lineTo(x + i, yy + off);
    }
    ctx.globalAlpha = 0.7;
    ctx.stroke();
  }
  ctx.restore();
}

// ============================================================================
// decorative lines
// ============================================================================

function drawDottedLine(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  color: string,
  alpha: number,
  gap: number,
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  for (let i = 0; i < w; i += gap) {
    ctx.fillRect(x + i, y, gap / 2, 2);
  }
  ctx.restore();
}

function drawPerforatedLine(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  _h: number,
  color: string,
  period: number,
  hole: number,
) {
  ctx.save();
  ctx.fillStyle = color;
  let cx = x;
  while (cx < x + w) {
    ctx.fillRect(cx, y, hole, 4);
    cx += period;
  }
  ctx.restore();
}

function drawBarcodeLine(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  color: string,
) {
  ctx.save();
  ctx.fillStyle = color;
  let cx = x;
  let s = 7;
  while (cx < x + w) {
    s = (s * 9301 + 49297) % 233280;
    const wide = s % 7 === 0;
    const bw = wide ? 3 : 1;
    ctx.fillRect(cx, y, bw, 14);
    cx += bw + 2;
  }
  ctx.restore();
}

// ============================================================================
// text helpers
// ============================================================================

type DrawTextOpts = {
  text: string;
  x: number;
  y: number;
  font: string;
  color: string;
  letterSpacing?: number; // em
  align?: 'left' | 'center' | 'right';
  baseline?: 'top' | 'middle' | 'bottom' | 'alphabetic';
};

function drawText(ctx: CanvasRenderingContext2D, opts: DrawTextOpts) {
  ctx.save();
  ctx.font = opts.font;
  ctx.fillStyle = opts.color;
  ctx.textAlign = opts.align ?? 'left';
  ctx.textBaseline = opts.baseline ?? 'alphabetic';
  const ls = opts.letterSpacing ?? 0;
  if (ls !== 0) {
    const chars = Array.from(opts.text);
    const widths = chars.map((c) => ctx.measureText(c).width);
    const fontSize = parseFloat(opts.font);
    const totalWidth = widths.reduce((a, b) => a + b, 0) + ls * (chars.length - 1) * fontSize;
    let startX = opts.x;
    if (opts.align === 'center') startX = opts.x - totalWidth / 2;
    else if (opts.align === 'right') startX = opts.x - totalWidth;
    let cursorX = startX;
    for (let i = 0; i < chars.length; i++) {
      ctx.fillText(chars[i], cursorX, opts.y);
      cursorX += widths[i] + ls * fontSize;
    }
  } else {
    ctx.fillText(opts.text, opts.x, opts.y);
  }
  ctx.restore();
}

function measureTrackedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  font: string,
  letterSpacing: number,
): number {
  ctx.save();
  ctx.font = font;
  const widths = Array.from(text).map((c) => ctx.measureText(c).width);
  const fontSize = parseFloat(font);
  const w = widths.reduce((a, b) => a + b, 0) + letterSpacing * (text.length - 1) * fontSize;
  ctx.restore();
  return w;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  rad: number,
) {
  const r = Math.min(rad, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function pickFittingFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  opts: {
    family: string;
    weight: number;
    letterSpacing: number;
    maxWidth: number;
    startSize: number;
    minSize: number;
  },
): number {
  let size = opts.startSize;
  while (size > opts.minSize) {
    const font = `${opts.weight} ${Math.round(size)}px ${opts.family}`;
    const w = measureTrackedText(ctx, text, font, opts.letterSpacing);
    if (w <= opts.maxWidth) return Math.round(size);
    size -= 2;
  }
  return opts.minSize;
}

// ============================================================================
// output helpers
// ============================================================================

export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error('Could not encode PNG.'));
      else resolve(blob);
    }, 'image/png');
  });
}

export function canvasToPngDataUrl(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/png');
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function sanitizeFilename(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'hh-goa-2026-builder-id'
  );
}