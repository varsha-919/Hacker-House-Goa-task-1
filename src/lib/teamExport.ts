// Team / combined-frame renderer.
//
// Composition (badge-style — 3 photo circles sit ABOVE the rectangular
// ID card, overlapping its top edge like a profile-photo badge):
//   1. Header band     (200) – HH brand, dates, ticket stub
//   2. Goa scene       (160) – mountain ridge + palms + sun
//   3. Badge row       (280) – 3 portrait circles in a row, mostly
//                              above the card, dipping ~30% into the
//                              top edge
//   4. Card body       (620) – the rectangular "TEAM ID CARD":
//                              – palm fronds + sun + scooter + route
//                              – wavy top edge so circles overlap
//                              – 3 names with ⚡ accents (name strip)
//                              – pink class band with 3 builder titles
//   5. Footer          (90)  – same dense postcard footer as single
//
// All coordinates/colors/fonts come from posterLayout.ts so the team
// poster reads as one cohesive illustration in the same visual
// language as the single builder poster.

import {
  CARD_W,
  CARD_H,
  COLORS,
  FONT,
  type CropAdjust,
} from './posterLayout';
import { DEFAULT_ADJUST, computeCoverLayout } from './image';

export type TeamMember = {
  name: string;
  stackOrRole: string;
  builderClass: string;
  photo: HTMLImageElement | null;
  adjust?: CropAdjust;
  builderNumber?: number;
};

export type TeamPosterData = {
  teamName: string;
  members: TeamMember[]; // 1..3
};

// Cohesive layout band heights (sum = 1350 = CARD_H)
const HEADER_H = 200;
const GOA_H = 160;
const BADGE_ROW_H = 280;            // visual band for the 3 circles
const PHOTO_R = 130;                // base photo radius in poster units
// The rectangular "TEAM ID CARD" container.
const CARD_TOP = HEADER_H + GOA_H + BADGE_ROW_H; // 200 + 160 + 280 = 640
const NAME_H = 180;
const NAME_TOP = CARD_TOP;          // 640 — name strip starts at card top
const CLASS_H = 160;
const CLASS_TOP = NAME_TOP + NAME_H; // 820
const FOOTER_H = 90;
const FOOTER_TOP = CARD_H - FOOTER_H; // 1260

export function renderTeamPosterToCanvas(data: TeamPosterData): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get a 2D drawing context.');

  drawBackground(ctx);
  drawHeader(ctx, data);
  drawGoaScene(ctx);
  drawCardBody(ctx, data);
  drawBadgeRow(ctx, data);
  drawNameStrip(ctx, data);
  drawClassStrip(ctx, data);
  drawFooter(ctx);

  return canvas;
}

// ============================================================================
// background
// ============================================================================

function drawBackground(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = COLORS.cream;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // grain dots (same seed as single)
  ctx.save();
  ctx.fillStyle = 'rgba(58, 42, 20, 0.05)';
  let s = 1337;
  for (let i = 0; i < 1100; i++) {
    s = (s * 9301 + 49297) % 233280;
    const x = (s / 233280) * CARD_W;
    s = (s * 9301 + 49297) % 233280;
    const y = (s / 233280) * CARD_H;
    s = (s * 9301 + 49297) % 233280;
    const r = 0.5 + (s / 233280) * 1.4;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // outer frame
  ctx.fillStyle = COLORS.ink;
  ctx.fillRect(0, 0, CARD_W, 10);
  ctx.fillRect(0, CARD_H - 10, CARD_W, 10);
  ctx.fillRect(0, 0, 10, CARD_H);
  ctx.fillRect(CARD_W - 10, 0, 10, CARD_H);
}

// ============================================================================
// header (200 high) — same as single
// ============================================================================

function drawHeader(ctx: CanvasRenderingContext2D, data: TeamPosterData) {
  ctx.fillStyle = COLORS.ink;
  ctx.fillRect(0, 0, CARD_W, HEADER_H);

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

  drawText(ctx, {
    text: 'Hacker House',
    x: tagSize + 30,
    y: 56,
    font: `italic 600 54px ${FONT.editorialItalic}`,
    color: COLORS.cream,
    align: 'left',
    baseline: 'middle',
    letterSpacing: -0.01,
  });
  drawText(ctx, {
    text: 'CREW · GOA · INDIA',
    x: tagSize + 30,
    y: 102,
    font: `700 16px ${FONT.mono}`,
    color: COLORS.sun,
    align: 'left',
    baseline: 'middle',
    letterSpacing: 0.28,
  });
  drawText(ctx, {
    text: `${data.members.length} BUILDERS · CURRENTLY SHIPPING · BUILD · SHIP · REPEAT`,
    x: tagSize + 30,
    y: 138,
    font: `700 11px ${FONT.mono}`,
    color: COLORS.pink,
    align: 'left',
    baseline: 'middle',
    letterSpacing: 0.24,
  });

  // Right-side dates + ticket stamp
  const rightX = CARD_W - 36;
  drawText(ctx, {
    text: '28—31',
    x: rightX,
    y: 46,
    font: `700 36px ${FONT.display}`,
    color: COLORS.sun,
    align: 'right',
    baseline: 'middle',
    letterSpacing: -0.01,
  });
  drawText(ctx, {
    text: 'OCT 2026',
    x: rightX,
    y: 86,
    font: `700 14px ${FONT.mono}`,
    color: COLORS.cream,
    align: 'right',
    baseline: 'middle',
    letterSpacing: 0.22,
  });
  drawText(ctx, {
    text: 'GOA · INDIA',
    x: rightX,
    y: 112,
    font: `700 11px ${FONT.mono}`,
    color: COLORS.pink,
    align: 'right',
    baseline: 'middle',
    letterSpacing: 0.22,
  });
  drawRoundStampLocal(ctx, {
    cx: CARD_W - 168,
    cy: 48,
    r: 36,
    color: COLORS.pink,
    text: 'TKT',
    sub: `No. ${String(data.members[0]?.builderNumber ?? 28).padStart(3, '0')}`,
  });

  // Team name cream stripe along the bottom
  ctx.fillStyle = COLORS.cream;
  ctx.fillRect(0, 156, CARD_W, 44);
  drawText(ctx, {
    text: (data.teamName || 'BUILDER CREW').toUpperCase() + '  ·  CREW',
    x: CARD_W / 2,
    y: 178,
    font: `400 26px ${FONT.display}`,
    color: COLORS.ink,
    align: 'center',
    baseline: 'middle',
    letterSpacing: -0.005,
  });
}

// ============================================================================
// goa scene (160 high) — same as single
// ============================================================================

function drawGoaScene(ctx: CanvasRenderingContext2D) {
  const r = { x: 0, y: HEADER_H, w: CARD_W, h: GOA_H };
  ctx.fillStyle = COLORS.cream;
  ctx.fillRect(r.x, r.y, r.w, r.h);

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

  // Mountain ridge
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(10, r.y + 100);
  ctx.lineTo(130, r.y + 70);
  ctx.lineTo(250, r.y + 92);
  ctx.lineTo(370, r.y + 60);
  ctx.lineTo(490, r.y + 86);
  ctx.lineTo(630, r.y + 66);
  ctx.lineTo(770, r.y + 90);
  ctx.lineTo(910, r.y + 72);
  ctx.lineTo(CARD_W - 10, r.y + 96);
  ctx.lineTo(CARD_W - 10, r.y + 120);
  ctx.lineTo(10, r.y + 120);
  ctx.closePath();
  ctx.fillStyle = COLORS.ink;
  ctx.fill();
  ctx.restore();

  // Wave under mountains
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(10, r.y + 110);
  for (let x = 10; x <= CARD_W - 10; x += 14) {
    const yy = r.y + 110 - Math.abs(Math.sin((x - 10) / 22)) * 4;
    ctx.lineTo(x, yy);
  }
  ctx.strokeStyle = COLORS.sun;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();

  // Palms
  drawPalm(ctx, 90, r.y + r.h - 6, 90, COLORS.stamp, 1);
  drawPalm(ctx, 220, r.y + r.h - 4, 60, COLORS.ink, 0.85);
  drawPalm(ctx, CARD_W - 220, r.y + r.h - 6, 72, COLORS.ink, 0.9);

  // Dotted travel route
  drawRouteDots(ctx, 30, r.y + 130, CARD_W - 30, r.y + 130, COLORS.pink, 8, 4);

  drawText(ctx, {
    text: 'ROUTE · BAGA → ANJUNA → PALOLEM',
    x: CARD_W / 2,
    y: r.y + 118,
    font: `700 10px ${FONT.mono}`,
    color: COLORS.pink,
    align: 'center',
    baseline: 'middle',
    letterSpacing: 0.3,
  });

  // Scooter on the route
  drawScooter(ctx, CARD_W * 0.55 - 30, r.y + 124, 1.4, COLORS.ink);
}

// ============================================================================
// card body (CARD_TOP..CARD_TOP+CARD_BODY_H) — the rectangular
// "TEAM ID CARD" container. Painted as a cream block with palm fronds,
// sun, scooter, route, and postmark decorations. The badge row circles
// paint on top of this base.
// ============================================================================

function drawCardBody(ctx: CanvasRenderingContext2D, _data: TeamPosterData) {
  // Cream base
  ctx.fillStyle = COLORS.cream;
  ctx.fillRect(0, CARD_TOP, CARD_W, CARD_H - CARD_TOP - FOOTER_H);

  // Palm fronds at the top corners of the card
  drawPalm(ctx, 80, CARD_TOP + 80, 130, COLORS.stamp, 1, true);
  drawPalm(ctx, CARD_W - 80, CARD_TOP + 80, 130, COLORS.stamp, 1);

  // Sun in upper-right of the card
  drawSun(ctx, CARD_W - 160, CARD_TOP + 140, 56, COLORS.sun, COLORS.sunDeep);

  // Dotted travel route across the card body
  const routeY = CARD_TOP + 220;
  drawRouteDots(ctx, 30, routeY, CARD_W - 30, routeY, COLORS.pink, 8, 4);
  drawText(ctx, {
    text: 'ROUTE · BAGA → ANJUNA → PALOLEM',
    x: CARD_W / 2,
    y: routeY - 18,
    font: `700 10px ${FONT.mono}`,
    color: COLORS.pink,
    align: 'center',
    baseline: 'middle',
    letterSpacing: 0.3,
  });
  drawScooter(ctx, CARD_W * 0.55 - 30, routeY, 1.4, COLORS.ink);

  // Shared postmark label near the bottom of the name strip
  drawText(ctx, {
    text: '·  ANJUNA · GOA  ·',
    x: CARD_W / 2,
    y: CLASS_TOP - 50,
    font: `700 14px ${FONT.mono}`,
    color: COLORS.pink,
    align: 'center',
    baseline: 'middle',
    letterSpacing: 0.3,
  });
  drawText(ctx, {
    text: 'CURRENTLY SHIPPING TOGETHER  ·  HH/GOA/26',
    x: CARD_W / 2,
    y: CLASS_TOP - 28,
    font: `700 10px ${FONT.mono}`,
    color: COLORS.stamp,
    align: 'center',
    baseline: 'middle',
    letterSpacing: 0.26,
  });
}

// ============================================================================
// badge row — 3 photo circles sitting mostly above the card top edge
// ============================================================================

function drawBadgeRow(ctx: CanvasRenderingContext2D, data: TeamPosterData) {
  const slots = [0, 1, 2].map((i) => data.members[i] ?? null);
  const slotW = CARD_W / 3;
  // cy is the circle's center, measured in absolute poster coords.
  // Negative offset from CARD_TOP lifts the circle's center above the
  // card's top edge so most of the disc sits above the card and only
  // ~30% dips in (profile-badge silhouette).
  const cy = CARD_TOP - PHOTO_R + 4 + 12; // ≈ 526 — circle bottom ≈ +18 inside card
  const r = PHOTO_R;

  for (let i = 0; i < 3; i++) {
    const cx = slotW * i + slotW / 2;
    drawMemberSlot(ctx, slots[i], cx, cy, r, data.members[i]?.builderNumber ?? 28);
  }
}

function drawMemberSlot(
  ctx: CanvasRenderingContext2D,
  m: TeamMember | null,
  cx: number,
  cy: number,
  r: number,
  builderNo: number,
) {
  // Cream postage plate behind (rotated, subtle backing)
  const plateW = 280;
  const plateH = 210;
  ctx.save();
  ctx.translate(cx, cy - 10);
  ctx.rotate(-0.04);
  ctx.fillStyle = COLORS.pink;
  ctx.globalAlpha = 0.95;
  ctx.fillRect(-plateW / 2, -plateH / 2, plateW, plateH);
  ctx.fillStyle = COLORS.cream;
  ctx.fillRect(-plateW / 2 + 10, -plateH / 2 + 10, plateW - 20, plateH - 20);
  ctx.globalAlpha = 1;
  ctx.restore();

  // Sun-yellow ring
  ctx.fillStyle = COLORS.sun;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 12, 0, Math.PI * 2);
  ctx.fill();

  // Photo
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  if (m && m.photo && m.photo.naturalWidth > 0) {
    const adj = m.adjust ?? DEFAULT_ADJUST;
    const layout = computeCoverLayout(m.photo.naturalWidth, m.photo.naturalHeight, r * 2, r * 2, adj);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(m.photo, layout.sx, layout.sy, layout.sw, layout.sh, cx - r, cy - r, r * 2, r * 2);
  } else {
    ctx.fillStyle = COLORS.inkDeep;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    drawSun(ctx, cx, cy - 20, 50, COLORS.sun, COLORS.sunDeep);
    drawText(ctx, {
      text: 'PHOTO',
      x: cx,
      y: cy + 60,
      font: `700 24px ${FONT.mono}`,
      color: COLORS.cream,
      align: 'center',
      baseline: 'middle',
      letterSpacing: 0.3,
    });
  }
  ctx.restore();

  // Pink double-ring
  ctx.strokeStyle = COLORS.pink;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 18, 0, Math.PI * 2);
  ctx.stroke();

  // ★ tick on the photo (sits on the upper-left of the disc as a sticker)
  drawStar(ctx, cx, cy - r * 0.55, 10, COLORS.pink);

  // BUILDER No. stamp on the photo (sits on the lower-right as a sticker)
  drawRoundStampLocal(ctx, {
    cx: cx + r * 0.55,
    cy: cy + r * 0.55,
    r: 26,
    color: COLORS.ink,
    text: 'BUILDER',
    sub: `No. ${String(builderNo).padStart(3, '0')}`,
    subFont: 11,
  });
}

// ============================================================================
// name strip (180) — wavy top edge, three names side-by-side
// ============================================================================

function drawNameStrip(ctx: CanvasRenderingContext2D, data: TeamPosterData) {
  // Cream block with wavy top edge. The block fills from NAME_TOP
  // down to CLASS_TOP (the bottom of the name strip). The wavy top
  // edge lets the photo circles overlap cleanly.
  ctx.fillStyle = COLORS.cream;
  ctx.save();
  ctx.beginPath();
  const wavyY = NAME_TOP;
  ctx.moveTo(0, wavyY);
  for (let x = 0; x <= CARD_W; x += 32) {
    const yy = wavyY + 18 * Math.sin((x / 64) * Math.PI * 2);
    ctx.lineTo(x, yy);
  }
  ctx.lineTo(CARD_W, CLASS_TOP);
  ctx.lineTo(0, CLASS_TOP);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Yellow vertical bar on the left
  ctx.fillStyle = COLORS.sun;
  ctx.fillRect(0, wavyY + 18, 14, NAME_H - 18);

  // Top eyebrow row
  drawText(ctx, {
    text: 'HH CREW · BUILDER ID · NO. 028 / 247',
    x: 32,
    y: wavyY + 30,
    font: `700 11px ${FONT.mono}`,
    color: COLORS.sun,
    align: 'left',
    baseline: 'middle',
    letterSpacing: 0.26,
  });

  const slots = [0, 1, 2].map((i) => data.members[i] ?? null);
  const slotW = CARD_W / 3;
  for (let i = 0; i < 3; i++) {
    const cx = slotW * i + slotW / 2;
    const m = slots[i];
    const name = (m?.name || 'BUILDER').toUpperCase();
    const stack = (m?.stackOrRole || 'BUILDER').toUpperCase();

    // Auto-fit name to slot width
    const nameFont = pickFittingFontSizeLocal(ctx, name, {
      family: FONT.display,
      weight: 400,
      letterSpacing: -0.01,
      maxWidth: slotW - 30,
      startSize: 64,
      minSize: 24,
    });
    // ⚡ left
    drawText(ctx, {
      text: '⚡',
      x: cx - nameFont * 0.55,
      y: wavyY + 90,
      font: `400 ${nameFont}px ${FONT.display}`,
      color: COLORS.sun,
      align: 'center',
      baseline: 'middle',
    });
    // Name
    drawText(ctx, {
      text: name,
      x: cx,
      y: wavyY + 90,
      font: `400 ${nameFont}px ${FONT.display}`,
      color: COLORS.ink,
      align: 'center',
      baseline: 'middle',
      letterSpacing: -0.01,
    });
    // ⚡ right
    drawText(ctx, {
      text: '⚡',
      x: cx + nameFont * 0.55,
      y: wavyY + 90,
      font: `400 ${nameFont}px ${FONT.display}`,
      color: COLORS.pink,
      align: 'center',
      baseline: 'middle',
    });

    // Stack mono ink
    drawText(ctx, {
      text: `[ ⚡ ${stack} ⚡ ]`,
      x: cx,
      y: wavyY + NAME_H - 26,
      font: `700 16px ${FONT.mono}`,
      color: COLORS.ink,
      align: 'center',
      baseline: 'middle',
      letterSpacing: 0.22,
    });
  }
}

// ============================================================================
// class strip (160) — pink, three class titles
// ============================================================================

function drawClassStrip(ctx: CanvasRenderingContext2D, data: TeamPosterData) {
  ctx.fillStyle = COLORS.pink;
  ctx.fillRect(0, CLASS_TOP, CARD_W, CLASS_H);

  // BUILDER CLASS eyebrow centered
  drawText(ctx, {
    text: '— BUILDER CLASSES —',
    x: CARD_W / 2,
    y: CLASS_TOP + 30,
    font: `italic 600 18px ${FONT.editorial}`,
    color: COLORS.cream,
    align: 'center',
    baseline: 'middle',
  });
  drawText(ctx, {
    text: '247 BUILDERS · 28—31 OCT 2026',
    x: CARD_W / 2,
    y: CLASS_TOP + 56,
    font: `700 11px ${FONT.mono}`,
    color: COLORS.sun,
    align: 'center',
    baseline: 'middle',
    letterSpacing: 0.3,
  });

  const slots = [0, 1, 2].map((i) => data.members[i]?.builderClass || 'THE BUILDER');
  const slotW = CARD_W / 3;
  for (let i = 0; i < 3; i++) {
    const cx = slotW * i + slotW / 2;
    const klass = slots[i].toUpperCase();
    const fontSize = pickFittingFontSizeLocal(ctx, klass, {
      family: FONT.display,
      weight: 400,
      letterSpacing: -0.01,
      maxWidth: slotW - 24,
      startSize: 56,
      minSize: 18,
    });
    drawText(ctx, {
      text: klass,
      x: cx,
      y: CLASS_TOP + 96 + fontSize / 2,
      font: `400 ${fontSize}px ${FONT.display}`,
      color: COLORS.sun,
      align: 'center',
      baseline: 'middle',
      letterSpacing: -0.01,
    });
  }
}

// ============================================================================
// footer — same dense postcard style as single
// ============================================================================

function drawFooter(ctx: CanvasRenderingContext2D) {
  const r = { x: 0, y: FOOTER_TOP, w: CARD_W, h: FOOTER_H };
  ctx.fillStyle = COLORS.cream;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  drawDottedLineLocal(ctx, r.x, r.y + 6, r.w, COLORS.ink, 0.4, 8, 2);

  // left tear (postcard perforation)
  for (let i = 0; i < r.h; i += 12) {
    ctx.fillStyle = COLORS.ink;
    ctx.fillRect(r.x, r.y + i, 24, 6);
  }

  drawText(ctx, {
    text: 'Goa',
    x: r.x + 56,
    y: r.y + r.h / 2 + 4,
    font: `italic 600 38px ${FONT.editorial}`,
    color: COLORS.ink,
    align: 'left',
    baseline: 'middle',
    letterSpacing: -0.02,
  });
  drawText(ctx, {
    text: 'INDIA',
    x: r.x + 138,
    y: r.y + r.h / 2 + 6,
    font: `700 11px ${FONT.mono}`,
    color: COLORS.pink,
    align: 'left',
    baseline: 'middle',
    letterSpacing: 0.3,
  });
  drawText(ctx, {
    text: '#FrameInGoa',
    x: r.x + r.w - 36,
    y: r.y + 24,
    font: `400 22px ${FONT.display}`,
    color: COLORS.pink,
    align: 'right',
    baseline: 'middle',
    letterSpacing: -0.01,
  });
  drawText(ctx, {
    text: '28—31 OCT 2026',
    x: r.x + r.w - 36,
    y: r.y + 50,
    font: `700 11px ${FONT.mono}`,
    color: COLORS.ink,
    align: 'right',
    baseline: 'middle',
    letterSpacing: 0.26,
  });
  drawText(ctx, {
    text: 'HH / GOA / 26',
    x: r.x + r.w - 36,
    y: r.y + r.h - 12,
    font: `700 10px ${FONT.mono}`,
    color: COLORS.ink,
    align: 'right',
    baseline: 'middle',
    letterSpacing: 0.26,
  });

  drawPalm(ctx, 30, r.y + r.h, 32, COLORS.ink, 0.8);
  drawBird(ctx, CARD_W - 80, r.y + r.h - 30, 0.7, COLORS.ink);
  drawBird(ctx, CARD_W - 52, r.y + r.h - 38, 0.5, COLORS.ink);
  drawDottedLineLocal(ctx, r.x, r.y + r.h - 4, r.w, COLORS.ink, 0.35, 6, 2);
}

// ============================================================================
// shared illustrations (same look as single-poster export.ts)
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
  mirrored: boolean = false,
) {
  ctx.save();
  if (mirrored) {
    ctx.translate(2 * baseX, 0);
    ctx.scale(-1, 1);
  }
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  ctx.quadraticCurveTo(baseX + 8 * scale, baseY - height * 0.5, baseX - 4 * scale, baseY - height);
  ctx.lineWidth = 5 * scale;
  ctx.stroke();

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
    ctx.globalAlpha = 0.6;
    ctx.stroke();
  }
  ctx.restore();
}

function drawDottedLineLocal(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  color: string,
  alpha: number,
  gap: number,
  fillW: number,
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  for (let i = 0; i < w; i += gap) {
    ctx.fillRect(x + i, y, fillW, 2);
  }
  ctx.restore();
}

function drawRoundStampLocal(
  ctx: CanvasRenderingContext2D,
  opts: { cx: number; cy: number; r: number; color: string; text: string; sub?: string; subFont?: number },
) {
  ctx.save();
  ctx.strokeStyle = opts.color;
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
    font: `700 11px ${FONT.mono}`,
    color: opts.color,
    align: 'center',
    baseline: 'middle',
    letterSpacing: 0.18,
  });
  if (opts.sub) {
    drawText(ctx, {
      text: opts.sub,
      x: opts.cx,
      y: opts.cy + 12,
      font: `700 ${opts.subFont ?? 18}px ${FONT.mono}`,
      color: opts.color,
      align: 'center',
      baseline: 'middle',
      letterSpacing: 0.1,
    });
  }
  ctx.restore();
}

// ============================================================================
// text helpers (same as export.ts)
// ============================================================================

type DrawTextOpts = {
  text: string;
  x: number;
  y: number;
  font: string;
  color: string;
  letterSpacing?: number;
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

function measureTrackedLocal(
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

function pickFittingFontSizeLocal(
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
    const w = measureTrackedLocal(ctx, text, font, opts.letterSpacing);
    if (w <= opts.maxWidth) return Math.round(size);
    size -= 2;
  }
  return opts.minSize;
}
