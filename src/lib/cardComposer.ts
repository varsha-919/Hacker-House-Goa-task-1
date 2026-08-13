// Card composer — composes a user's photo into the master Hacker House Goa
// 2026 builder card (public/card.jpeg) and exports the result as a
// high-resolution PNG.
//
// Design rules:
//   - card.jpeg is the IMMUTABLE master artwork. We never redraw it.
//   - The user's photo replaces ONLY the portrait window in the center of
//     the yellow ticket on the card.
//   - The photo is placed with an affine transform (rotation + scale +
//     skew) so it visually inherits the slight tilt of the ticket frame.
//   - All processing is client-side (canvas + blob), no server upload.
//   - The export uses the master card's native resolution (682×1024) for
//     pixel-sharp output. (We can also export at 2× for retina.)
//
// The photo region is defined as a rotated rectangle on the source
// artwork. PHOTO_REGION is calibrated to card.jpeg.

import { DEFAULT_ADJUST, type CropAdjust, computeCoverLayout } from './image';

export const MASTER_CARD_URL = '/ticket.png';

// ticket.png is 1684×2528. Calibrated photo window on the master:
// a CIRCLE inside the green ticket frame, where the user's portrait
// replaces the placeholder. Coordinates are in source pixels on the
// 1684×2528 grid.
//
// Calibrated by visual overlay (red circle aligned to the inner edge
// of the green placeholder ring on the master artwork). The ticket is
// tilted ~-3° on the master; the placeholder rides the same tilt, so
// the circle is rotated by `rotation` to match. The clip path applies
// the rotation so the photo follows the ticket's tilt visually.
export const PHOTO_REGION = {
  // Circle (cx, cy, r) in source pixels (1684×2528).
  cx: 858,
  cy: 1095,
  r: 275,
  // The placeholder is tilted with the ticket frame. Negative = CCW.
  rotation: -0.052, // ~ -3°
};

// Width of the green border ring drawn on top of the photo. Same
// thickness as the ticket card border on the master, so it visually
// matches the surrounding ticket frame.
export const PHOTO_BORDER_WIDTH = 22;
// Green color used for the border ring. Matches the deep saturated
// Goa green on the master ticket frame.
export const PHOTO_BORDER_COLOR = '#0f5a2e';

export type PhotoInput = {
  // The decoded image (already-loaded HTMLImageElement)
  image: HTMLImageElement;
  width: number;
  height: number;
  // Crop adjustments from the user (zoom + position)
  adjust: CropAdjust;
};

// Load the master card once and cache it.
let masterCardPromise: Promise<HTMLImageElement> | null = null;
export function loadMasterCard(): Promise<HTMLImageElement> {
  if (masterCardPromise) return masterCardPromise;
  masterCardPromise = new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load master card.'));
    img.src = MASTER_CARD_URL;
  });
  return masterCardPromise;
}

// Reset the cached master card (used when the asset changes during dev).
export function _resetMasterCardCache() {
  masterCardPromise = null;
}

// Render the master card to a canvas at the given resolution, with an
// optional user photo composited into the portrait window.
//
// `outputW` / `outputH` default to the master card's native size. Pass
// 2× values for retina-sharp output (the source is small enough that we
// can upsample the raster without losing the printed look).
export function composeCard(opts: {
  outputW?: number;
  outputH?: number;
  photo?: PhotoInput | null;
} = {}): HTMLCanvasElement {
  const master = new Image();
  // We need a synchronous-ish flow. The caller must have called
  // loadMasterCard() first and passed the result in via opts, OR we fall
  // back to creating a canvas that just embeds the master image as
  // <img>. For the composited version we need a real Image object.
  throw new Error('composeCard requires a preloaded master image. Use composeCardAsync.');
}

// Async version: load the master card, then render the composited
// canvas. This is the main public entry point.
export async function composeCardAsync(opts: {
  outputW?: number;
  outputH?: number;
  photo?: PhotoInput | null;
  teammateNames?: string[];
} = {}): Promise<HTMLCanvasElement> {
  const master = await loadMasterCard();
  return renderComposited(master, opts);
}

// Internal: build the final composited canvas from a preloaded master
// image and an optional user photo.
function renderComposited(
  master: HTMLImageElement,
  opts: {
    outputW?: number;
    outputH?: number;
    photo?: PhotoInput | null;
    teammateNames?: string[];
  },
): HTMLCanvasElement {
  const W = opts.outputW ?? master.naturalWidth;
  const H = opts.outputH ?? master.naturalHeight;
  const scale = W / master.naturalWidth;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get a 2D drawing context.');

  // 1. Paint the master artwork.
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(master, 0, 0, W, H);

  // 2. If we have a user photo, composite it into the portrait window.
  if (opts.photo) {
    compositePhoto(ctx, opts.photo, scale);
  }

  // 3. Optional: stamp the small "+name1 · name2 · name3" label outside
  // the card frame. Master artwork is untouched — this is drawn on top.
  if (opts.teammateNames && opts.teammateNames.length > 0) {
    stampTeammateLabel(ctx, opts.teammateNames, scale);
  }

  return canvas;
}

// Draw a small pill at the bottom-right of the canvas listing all
// teammate names. Drawn OUTSIDE the ticket frame so the master artwork
// remains pixel-perfect. The pill color matches the cream ticket
// palette so it reads as part of the design system.
export function stampTeammateLabel(
  ctx: CanvasRenderingContext2D,
  names: string[],
  scale: number = 1,
): void {
  const cleaned = names.map((n) => (n || '').trim()).filter(Boolean);
  if (cleaned.length === 0) return;

  const W = ctx.canvas.width;
  const H = ctx.canvas.height;

  // Label copy. Uppercase the first letter of each name for visual
  // consistency with the rest of the UI.
  const labelText =
    '+' + cleaned.map((n) => n.charAt(0).toUpperCase() + n.slice(1)).join(' · ');

  // Pill geometry — all values are scaled so they stay crisp at any
  // output resolution (native, 2× retina, etc.).
  const fontSize = Math.round(36 * scale);
  const padX = Math.round(28 * scale);
  const padY = Math.round(16 * scale);
  const margin = Math.round(48 * scale);
  const pillH = fontSize + padY * 2;
  const radius = pillH / 2;

  ctx.save();
  ctx.font = `bold ${fontSize}px ui-monospace, "SF Mono", Menlo, Consolas, monospace`;
  ctx.textBaseline = 'middle';

  // Measure the text so we can size the pill precisely.
  const metrics = ctx.measureText(labelText);
  const textW = metrics.width;
  const pillW = textW + padX * 2;

  // Anchor at bottom-right of the canvas.
  const x = W - pillW - margin;
  const y = H - pillH - margin;

  // Cream pill with a thin ink border.
  ctx.fillStyle = '#f4e9d1'; // cream-50ish, matches ticket cream
  ctx.strokeStyle = '#0e2a1c'; // ink color
  ctx.lineWidth = Math.max(2, 3 * scale);

  ctx.beginPath();
  // Rounded rect — use arc() on each corner.
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + pillW - radius, y);
  ctx.arc(x + pillW - radius, y + radius, radius, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(x + radius, y + pillH);
  ctx.arc(x + radius, y + radius, radius, Math.PI / 2, (3 * Math.PI) / 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Text fill — deep pink, matching the existing palette.
  ctx.fillStyle = '#d6336c';
  ctx.fillText(labelText, x + padX, y + pillH / 2);
  ctx.restore();
}

// Composite the user's photo into the calibrated circular portrait window
// on the master canvas. The circle is tilted with the ticket frame so we
// rotate the clip path; the photo is then mapped into the circle's bounding
// square using a cover-fit crop that respects the user's zoom/position.
function compositePhoto(
  ctx: CanvasRenderingContext2D,
  photo: PhotoInput,
  scale: number,
) {
  const r = PHOTO_REGION;
  const sx = scale;
  const sy = scale;
  const cx = r.cx * sx;
  const cy = r.cy * sy;
  const radius = r.r * sx;

  // Compute the cover layout for the photo inside a square that contains
  // the circle (the circle's diameter box). The square's aspect is 1:1 so
  // the cover-fit math is simple: scale by max(ratio) and center.
  const layout = computeCoverLayout(
    photo.width,
    photo.height,
    r.r * 2, // width
    r.r * 2, // height
    photo.adjust ?? DEFAULT_ADJUST,
  );

  ctx.save();
  // Move to the circle center, apply the ticket's tilt, draw the circle
  // path, and clip. This ensures the photo never bleeds onto the cream
  // ticket border even with the rotation applied.
  ctx.translate(cx, cy);
  ctx.rotate(r.rotation);
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  // Now draw the photo into the rotated frame. We work in the same
  // rotated coordinate space so the photo inherits the ticket's tilt.
  // Map the photo (cover-cropped to a 2r × 2r square) into the
  // unrotated bounding square, then the rotation we already applied
  // to the context handles the visual tilt.
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(
    photo.image,
    layout.sx,
    layout.sy,
    layout.sw,
    layout.sh,
    -radius,
    -radius,
    radius * 2,
    radius * 2,
  );
  ctx.restore();

  // 3. Draw the green border ring on top of the photo so the user sees
  // a clean frame around their photo, matching the ticket card border
  // on the master. Stroked along the same tilted circle so it rides the
  // ticket's tilt visually.
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(r.rotation);
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.lineWidth = PHOTO_BORDER_WIDTH * scale;
  ctx.strokeStyle = PHOTO_BORDER_COLOR;
  ctx.stroke();
  ctx.restore();
}

// Output helpers ------------------------------------------------------------

export function canvasToPngDataUrl(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/png');
}

export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error('Could not encode PNG.'));
      else resolve(blob);
    }, 'image/png');
  });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.download = filename;
  a.href = url;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const a = document.createElement('a');
  a.download = filename;
  a.href = dataUrl;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function sanitizeFilename(input: string): string {
  return (
    (input || 'builder')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'hh-goa-2026-builder-frame'
  );
}

// Read a File as a data URL (client-side only, no server).
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error('Could not read file.'));
    r.readAsDataURL(file);
  });
}

export async function loadImageFromDataUrl(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not decode image.'));
    img.src = src;
  });
}

// Top-level export: given a user file, load it, composite it on the
// master card, and return the result as a high-res PNG data URL.
export async function exportBuilderCard(file: File, adjust: CropAdjust): Promise<string> {
  const dataUrl = await fileToDataUrl(file);
  const image = await loadImageFromDataUrl(dataUrl);
  const canvas = await composeCardAsync({
    photo: {
      image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      adjust,
    },
    // 2× the source for retina-sharp exports (3368×5056).
    outputW: 3368,
    outputH: 5056,
  });
  return canvasToPngDataUrl(canvas);
}
