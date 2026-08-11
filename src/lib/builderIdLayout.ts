// Single source of truth for the Builder ID card layout.
//
// The 1080x1350 portrait card is composed of stacked panels. Each panel
// is described in PIXELS at export resolution. The DOM preview scales
// these pixels by the preview's CSS scale so preview and export match.
//
// Panel structure (top -> bottom):
//   header   (HH GOA 2026 brand strip)             ~ 90px
//   photo    (large hero photo, full width)        ~ 700px
//   name     (large display name on cream)         ~ 200px
//   title    (builder title on pink)               ~ 160px
//   footer   (location, dates, hashtag)            ~ 200px

import { computeCoverLayout, type CropAdjust, DEFAULT_ADJUST } from './image';

export const CARD_W = 1080;
export const CARD_H = 1350;

// Colors (kept in sync with tailwind.config.js)
export const COLORS = {
  ink: '#0E2A1F',
  inkDeep: '#081A12',
  sun: '#FFD23F',
  sunDeep: '#F2BE1F',
  pink: '#FF2D7B',
  pinkDeep: '#E51A66',
  cream: '#F5EBD7',
  creamSoft: '#E9DAB7',
} as const;

// Per-panel heights (in export pixels)
export const PANELS = {
  header: 96,
  photo: 700,
  name: 200,
  title: 160,
  footer: 194,
} as const;

export type BuilderIDData = {
  name: string;
  stackOrRole: string;
  builderTitle: string;
  photo: HTMLImageElement | null;
  adjust?: CropAdjust;
};

export type PanelRects = {
  header: Rect;
  photo: Rect;
  name: Rect;
  title: Rect;
  footer: Rect;
};

export type Rect = { x: number; y: number; w: number; h: number };

export function getPanelRects(): PanelRects {
  const header = { x: 0, y: 0, w: CARD_W, h: PANELS.header };
  const photo = { x: 0, y: PANELS.header, w: CARD_W, h: PANELS.photo };
  const name = { x: 0, y: photo.y + PANELS.photo, w: CARD_W, h: PANELS.name };
  const title = { x: 0, y: name.y + PANELS.name, w: CARD_W, h: PANELS.title };
  const footer = { x: 0, y: title.y + PANELS.title, w: CARD_W, h: PANELS.footer };
  return { header, photo, name, title, footer };
}

// Photo cover layout: the photo fills the photo panel. The DOM preview
// uses CSS background-image, the canvas uses drawImage — but both are
// driven by computeCoverLayout so they cannot drift.
export function getPhotoCoverLayout(
  srcW: number,
  srcH: number,
  adjust: CropAdjust = DEFAULT_ADJUST,
) {
  return computeCoverLayout(srcW, srcH, CARD_W, PANELS.photo, adjust);
}
