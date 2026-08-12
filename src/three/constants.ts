// Hacker House Goa 2026 — 3D palette + depth + motion constants.
//
// All color values map to the Tailwind tokens in tailwind.config.js
// and the CSS custom properties in index.css. Three of them are the
// source of truth so the printed-poster identity carries through.

import type { ColorRepresentation } from 'three';

// --- Palette (kept in sync with tailwind.config.js) ---
export const PALETTE = {
  // Brand
  ink: '#0E2A1F' as ColorRepresentation,        // deep green (type, depth accents)
  inkDeep: '#081A12' as ColorRepresentation,    // deepest accent
  goa: '#026736' as ColorRepresentation,        // saturated palm/jungle green

  // Cream paper
  cream: '#F5EBD7' as ColorRepresentation,      // base paper
  creamSoft: '#E9DAB7' as ColorRepresentation,  // aged cream
  creamBright: '#FBF6E8' as ColorRepresentation, // highlight cream

  // Yellow / sun
  sun: '#FFD23F' as ColorRepresentation,        // bright yellow
  sunBright: '#FEE101' as ColorRepresentation,  // peak highlight (sun disc)
  sunDeep: '#F2BE1F' as ColorRepresentation,    // shadowed yellow

  // Pink
  pink: '#FF2D7B' as ColorRepresentation,       // hot pink stamp accent
  pinkDeep: '#E51A66' as ColorRepresentation,   // shadowed pink
} as const;

// --- Depth hierarchy (per the spec section 16) ---
export const DEPTH = {
  hills: -60,         // far-back silhouette
  sun: -45,           // sun disc behind HACKER
  ocean: -40,         // ocean band
  palms: -20,         // mid-ground palms (left + right)
  house: -25,         // Goan house behind the type
  scooter: -10,       // small scooter decoration
  surfboard: -10,     // surfboard leaning
  stickerA: 25,       // decorative sticker (cream)
  stickerB: 30,       // pink sticker
  stamp: 70,          // pink गोवा stamp — pulled forward of frame
  frame: 50,          // 3D builder frame card
} as const;

// --- Pointer tilt ---
export const TILT = {
  // The CSS parallax writes --rx / --ry in degrees (clamped). We
  // re-apply them inside R3F at a small fraction (multiplier per layer)
  // so each layer travels a different amount.
  layerMultipliers: {
    bg: 0.1,       // background drift
    sun: 0.15,     // sun disc
    ocean: 0.2,    // ocean
    palms: 0.2,    // palms
    house: 0.3,    // Goan house
    scooter: 0.4,  // scooter
    surfboard: 0.4,
    frame: 0.6,    // 3D builder frame — strongest cursor response
    stamp: 0.8,    // गोवा stamp — moves with cursor most
    stickerA: 0.5,
    stickerB: 0.5,
  } as const,
  // Maximum degrees of rotation per layer (HTML clamps the raw CSS
  // rotation to ±6°; each R3F layer multiplies by its own factor,
  // capped here so motion stays subtle).
  maxDeg: 5,
} as const;

// --- Mobile breakpoint ---
export const MOBILE_BREAKPOINT_PX = 768;

// --- Hero scene composition ---
export const HERO = {
  // Camera tuned for "poster in a room" perspective. fov 32 keeps
  // vertical edges straight; pulled-back Z gives the layered scene
  // room without distortion.
  cameraZ: 9,
  fov: 32,
  // 1 large palm left + 1 large palm right + 1 small palm back per spec.
  palmCountDesktop: 3,
  palmCountMobile: 2,
} as const;
