// Single source of truth for the HH Goa 2026 poster.
//
// 1080 x 1350 portrait. All coordinates, panel heights, colors, font
// sizes and offsets live in this file. The DOM preview and the canvas
// renderer both import from here so they cannot drift.
//
// Composition (a single illustrated event poster, not stacked panels):
//   1. Header band   (forest, 200)  – HH brand identity, dates, ticket stub
//   2. Goa scene     (cream,  160)  – sun, palms, mountains, scooter, route
//   3. Hero zone     (cream,  560)  – centered photo medallion, sun behind,
//                                       rings, plate, stamps, stickers
//   4. Name block    (cream,  180)  – big name + stack with ⚡ accents,
//                                       wavy top edge so palm fronds overlap
//   5. Class band    (pink,   160)  – BUILDER CLASS + curated title
//   6. Footer band   (cream,   90)  – Goa italic, postmark, hashtag
//
// Illustrations deliberately cross band boundaries (sun behind photo,
// palm fronds overlapping the name block, sticker wrapping the plate)
// so the artwork reads as one composed poster rather than six stacked
// panels.

import { DEFAULT_ADJUST as DEFAULT_ADJUST_IMAGE, type CropAdjust } from './image';

export const CARD_W = 1080;
export const CARD_H = 1350;

export const COLORS = {
  // Core
  ink: '#0E2A1F',
  inkDeep: '#081A12',
  inkSoft: '#143C2A',
  cream: '#F5EBD7',
  creamSoft: '#E9DAB7',
  creamWarm: '#EFDFC0',
  paper: '#FBF6E8',
  paperInk: '#3A2A14',
  sun: '#FFD23F',
  sunDeep: '#F2BE1F',
  pink: '#FF2D7B',
  pinkDeep: '#E51A66',
  // Decorative tints used for stamps / wave strokes
  stamp: '#1B5E3F',
} as const;

export const PANELS = {
  header: 200,
  goa: 160,
  hero: 560,
  name: 180,
  klass: 160,
  footer: 90,
} as const;

export type Rect = { x: number; y: number; w: number; h: number };

export type PanelRects = {
  header: Rect;
  goa: Rect;
  hero: Rect;
  name: Rect;
  klass: Rect;
  footer: Rect;
};

export function getPanelRects(): PanelRects {
  let y = 0;
  const header = { x: 0, y, w: CARD_W, h: PANELS.header }; y += PANELS.header;
  const goa = { x: 0, y, w: CARD_W, h: PANELS.goa }; y += PANELS.goa;
  const hero = { x: 0, y, w: CARD_W, h: PANELS.hero }; y += PANELS.hero;
  const name = { x: 0, y, w: CARD_W, h: PANELS.name }; y += PANELS.name;
  const klass = { x: 0, y, w: CARD_W, h: PANELS.klass }; y += PANELS.klass;
  const footer = { x: 0, y, w: CARD_W, h: PANELS.footer };
  return { header, goa, hero, name, klass, footer };
}

// ---------------- font family strings (shared) ----------------

// Always quote the family and provide a robust fallback list so the
// canvas can find the same face as the DOM.
export const FONT = {
  display: '"Anton", Impact, "Haettenschweiler", "Arial Narrow Bold", sans-serif',
  editorial: '"Fraunces", "DM Serif Display", Georgia, "Times New Roman", serif',
  mono: '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace',
  editorialItalic: '"Fraunces", "DM Serif Display", Georgia, serif',
} as const;

// ---------------- shared building blocks ----------------

// Hero photo medallion (centered in the hero zone).
// r=320 — visible and dominant, but leaves room for ornaments to overlap.
export function getHeroMedallion() {
  return {
    cx: CARD_W / 2,
    cy: PANELS.header + PANELS.goa + PANELS.hero / 2 - 20, // 200+160+280-20 = 620
    r: 320,
  };
}

// Sun behind the photo (mostly occluded by photo + ring).
export function getHeroSun() {
  const m = getHeroMedallion();
  return { cx: m.cx, cy: m.cy - 40, r: 170 };
}

// Cream "postage stamp" plate behind the photo (rotated -3°).
export function getHeroPlate() {
  const m = getHeroMedallion();
  return {
    cx: m.cx,
    cy: m.cy + 30,
    w: 720,
    h: 480,
  };
}

// Cover-crop used by both renderers.
export function getPhotoCoverLayout(
  srcW: number,
  srcH: number,
  circleR: number,
  adjust: CropAdjust = DEFAULT_ADJUST_IMAGE,
) {
  return computeCoverLayout(srcW, srcH, circleR * 2, circleR * 2, adjust);
}

// ---------------- name block ----------------

// Wavy top edge parameters for the name block so the cream block's top
// is curved, letting palm fronds and the photo plate's bottom corner
// overlap into it visually.
export function getNameBlockWavy() {
  return {
    y: PANELS.header + PANELS.goa + PANELS.hero, // 920
    amp: 18,
    period: 64,
  };
}

// Name block text baselines. The name itself uses Anton (display), the
// largest single element on the page.
export function getNameBlock() {
  const y = PANELS.header + PANELS.goa + PANELS.hero; // 920
  const h = PANELS.name;
  return {
    x: 0,
    y,
    w: CARD_W,
    h,
    top: y,
    bottom: y + h,
    eyebrow: y + 32,        // "BUILDER ID · NO. 028 / 247"
    name: y + 110,          // baseline of VARSHA GARG
    underline: y + 124,     // pink bar under name
    stack: y + h - 26,      // [ ⚡ FULL STACK DEVELOPER ⚡ ]
    barLeft: { x: 0, y: y + 8, w: 14, h: h - 16 }, // yellow left bar
  };
}

// ---------------- decorative helpers ----------------

// "BUILDER No. NNN" round stamp inside hero zone, top-left of medallion.
export function getBuilderStamp() {
  return { cx: 138, cy: PANELS.header + PANELS.goa + 70, r: 58 };
}

// "BUILD · SHIP · REPEAT" sticker at top-right of medallion.
export function getShipSticker() {
  return { x: CARD_W - 14, y: PANELS.header + PANELS.goa + 32 };
}

// "★ VIBE" starburst sticker at bottom-right of medallion.
export function getStarSticker() {
  const m = getHeroMedallion();
  return { cx: m.cx + m.r * 0.78, cy: m.cy + m.r * 0.7, r: 56 };
}

// "ANJUNA BEACH · GOA" tag at bottom-left of medallion.
export function getLocationPin() {
  const m = getHeroMedallion();
  return { x: 36, y: m.cy + m.r - 4 };
}

// Tiny surfboard inside hero zone, right side.
export function getSurfboard() {
  const m = getHeroMedallion();
  return { x: m.cx + m.r * 0.65, y: m.cy + m.r - 12 };
}

// Dotted travel route inside the Goa band.
export function getGoaRoute() {
  const top = PANELS.header;
  return {
    x1: 30,
    y1: top + 130,
    x2: CARD_W - 30,
    y2: top + 130,
  };
}

// Scooter on the Goa route.
export function getGoaScooter() {
  const top = PANELS.header;
  return { x: CARD_W * 0.55, y: top + 130 };
}

// Mountain ridge silhouette across full width inside Goa band.
export function getMountainRidge() {
  const top = PANELS.header;
  return {
    baseY: top + 100,
    left: 10,
    right: CARD_W - 10,
  };
}

// "BUILDER No. NNN" round stamp inside class band (top-right).
export function getClassBuilderStamp() {
  const r = getPanelRects().klass;
  return { cx: r.x + r.w - 80, cy: r.y + 32, r: 42 };
}

// "↻ TRY ANOTHER" hint inside class band.
export function getClassRotateHint() {
  const r = getPanelRects().klass;
  return { x: r.x + r.w - 28, y: r.y + r.h - 18 };
}

// Yellow ★ corner sticker inside class band.
export function getClassStarCorner() {
  const r = getPanelRects().klass;
  return { x: r.x + 8, y: r.y + 14 };
}

// Postmark inside footer.
export function getFooterPostmark() {
  const r = getPanelRects().footer;
  return { cx: r.x + r.w / 2, cy: r.y + r.h / 2 - 4, w: 200, h: 56 };
}

// Left-edge postcard perforation inside footer.
export function getFooterTear() {
  const r = getPanelRects().footer;
  return { x: r.x, y: r.y, w: 28, h: r.h };
}

// Re-exports so consumers only need to import from one place.
export const DEFAULT_ADJUST = DEFAULT_ADJUST_IMAGE;
export type { CropAdjust };

// Local import to keep the public surface of image.ts stable.
import { computeCoverLayout } from './image';