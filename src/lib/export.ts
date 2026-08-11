// Final-image rasterizer for the Builder ID card.
//
// 1080 x 1350 portrait. Every visible element of the preview is drawn
// here, in pixels, so the downloaded PNG is guaranteed to contain the
// photo + name + stack + builder title + all branding.
//
// Layout is defined in builderIdLayout.ts; this file only knows how to
// paint panels. If you change a panel size there, you don't have to
// touch this file.

import {
  COLORS,
  CARD_W,
  CARD_H,
  PANELS,
  getPanelRects,
  type BuilderIDData,
} from './builderIdLayout';
import type { CropAdjust } from './image';
import { computeCoverLayout, DEFAULT_ADJUST } from './image';

export const BUILDER_ID_SIZE = { w: CARD_W, h: CARD_H };

// Render the full Builder ID card to a canvas.
export function renderBuilderIDToCanvas(
  data: BuilderIDData,
  size: { w?: number; h?: number } = {},
): HTMLCanvasElement {
  const W = size.w ?? CARD_W;
  const H = size.h ?? CARD_H;
  const scale = W / CARD_W; // both width and height should scale uniformly

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get a 2D drawing context.');
  ctx.scale(scale, scale);

  // Safety guards
  const name = (data.name || 'YOUR NAME').toUpperCase().trim();
  const stack = (data.stackOrRole || 'BUILDER').toUpperCase().trim();
  const title = (data.builderTitle || 'THE BUILDER').toUpperCase().trim();

  drawBackground(ctx);
  drawHeaderPanel(ctx);
  drawPhotoPanel(ctx, data.photo, data.adjust);
  drawNamePanel(ctx, name, stack);
  drawTitlePanel(ctx, title);
  drawFooterPanel(ctx);

  return canvas;
}

// ---------------- panels ----------------

function drawBackground(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = COLORS.ink;
  ctx.fillRect(0, 0, CARD_W, CARD_H);
}

// Header: cream background, big "HACKER HOUSE" lockup + "GOA · 2026" sub.
function drawHeaderPanel(ctx: CanvasRenderingContext2D) {
  const r = getPanelRects().header;

  ctx.fillStyle = COLORS.cream;
  ctx.fillRect(r.x, r.y, r.w, r.h);

  // Yellow square block on the left (the "ticket stub")
  const sq = r.h;
  ctx.fillStyle = COLORS.sun;
  ctx.fillRect(0, 0, sq, sq);

  // Big "HH" lockup inside the square
  drawText(ctx, {
    text: 'HH',
    x: sq / 2,
    y: sq / 2,
    font: `700 ${Math.round(sq * 0.62)}px "Anton", Impact, sans-serif`,
    color: COLORS.ink,
    align: 'center',
    baseline: 'middle',
    letterSpacing: -0.04,
  });

  // To the right of the yellow block — event title
  drawText(ctx, {
    text: 'HACKER HOUSE',
    x: sq + 28,
    y: r.h * 0.36,
    font: `700 ${Math.round(r.h * 0.34)}px "Anton", Impact, sans-serif`,
    color: COLORS.ink,
    align: 'left',
    baseline: 'middle',
    letterSpacing: -0.01,
  });

  drawText(ctx, {
    text: 'GOA · 2026',
    x: sq + 30,
    y: r.h * 0.72,
    font: `700 ${Math.round(r.h * 0.18)}px "JetBrains Mono", ui-monospace, monospace`,
    color: COLORS.ink,
    align: 'left',
    baseline: 'middle',
    letterSpacing: 0.18,
  });

  // Right side: pill with #FRAMEINGOA
  const pillText = '#FRAMEINGOA';
  const pillFontSize = Math.round(r.h * 0.18);
  ctx.font = `700 ${pillFontSize}px "JetBrains Mono", ui-monospace, monospace`;
  const pillTextWidth = measureTracked(ctx, pillText, 0.18);
  const pillPadX = 18;
  const pillPadY = 8;
  const pillW = pillTextWidth + pillPadX * 2;
  const pillH = pillFontSize + pillPadY * 2;
  const pillX = r.x + r.w - pillW - 28;
  const pillY = r.y + (r.h - pillH) / 2;
  ctx.fillStyle = COLORS.ink;
  roundRect(ctx, pillX, pillY, pillW, pillH, 999);
  ctx.fill();
  drawText(ctx, {
    text: pillText,
    x: pillX + pillW / 2,
    y: pillY + pillH / 2,
    font: `700 ${pillFontSize}px "JetBrains Mono", ui-monospace, monospace`,
    color: COLORS.sun,
    align: 'center',
    baseline: 'middle',
    letterSpacing: 0.18,
  });
}

// Photo panel: full-width, the photo fills via cover-crop.
function drawPhotoPanel(
  ctx: CanvasRenderingContext2D,
  photo: HTMLImageElement | null,
  adjust?: CropAdjust,
) {
  const r = getPanelRects().photo;

  // If no photo, draw a warm placeholder pattern with a sun graphic.
  if (!photo || photo.naturalWidth === 0) {
    ctx.fillStyle = COLORS.inkDeep;
    ctx.fillRect(r.x, r.y, r.w, r.h);

    // Big sun
    ctx.fillStyle = COLORS.sun;
    ctx.beginPath();
    ctx.arc(r.w / 2, r.h / 2, Math.min(r.w, r.h) * 0.22, 0, Math.PI * 2);
    ctx.fill();

    drawText(ctx, {
      text: 'PHOTO',
      x: r.w / 2,
      y: r.h / 2,
      font: `700 ${Math.round(r.h * 0.18)}px "Anton", Impact, sans-serif`,
      color: COLORS.ink,
      align: 'center',
      baseline: 'middle',
      letterSpacing: 0.06,
    });
    return;
  }

  // Use computeCoverLayout so the canvas crop matches the DOM preview.
  const layout = computeCoverLayoutForPanel(
    photo.naturalWidth,
    photo.naturalHeight,
    adjust,
  );

  ctx.save();
  // Clip to the photo rectangle so any rounding stays inside the panel.
  ctx.beginPath();
  ctx.rect(r.x, r.y, r.w, r.h);
  ctx.clip();

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(
    photo,
    layout.sx,
    layout.sy,
    layout.sw,
    layout.sh,
    r.x,
    r.y,
    r.w,
    r.h,
  );
  ctx.restore();

  // Pink gradient overlay (very subtle, bottom-only) so the name above
  // sits on a darker base if the photo is bright at the bottom.
  const overlayH = r.h * 0.18;
  const grad = ctx.createLinearGradient(0, r.y + r.h - overlayH, 0, r.y + r.h);
  grad.addColorStop(0, 'rgba(14, 42, 31, 0)');
  grad.addColorStop(1, 'rgba(14, 42, 31, 0.45)');
  ctx.fillStyle = grad;
  ctx.fillRect(r.x, r.y + r.h - overlayH, r.w, overlayH);

  // Pink thin divider line — visual rhythm between photo and name panel
  ctx.fillStyle = COLORS.pink;
  ctx.fillRect(r.x, r.y + r.h - 8, r.w, 8);
}

// Name panel: cream background, name in big Anton, stack as mono subline.
function drawNamePanel(
  ctx: CanvasRenderingContext2D,
  name: string,
  stack: string,
) {
  const r = getPanelRects().name;

  ctx.fillStyle = COLORS.cream;
  ctx.fillRect(r.x, r.y, r.w, r.h);

  // Name — fits the panel width; auto-shrinks if long.
  const nameFont = pickFittingFontSize(ctx, name, {
    family: '"Anton", Impact, sans-serif',
    weight: 700,
    letterSpacing: -0.01,
    maxWidth: r.w - 80,
    height: r.h * 0.55,
    startSize: r.h * 0.62,
  });

  drawText(ctx, {
    text: name,
    x: r.x + 40,
    y: r.y + r.h * 0.16,
    font: `700 ${Math.round(nameFont)}px "Anton", Impact, sans-serif`,
    color: COLORS.ink,
    align: 'left',
    baseline: 'top',
    letterSpacing: -0.01,
  });

  // Stack / role sub-line
  const stackFont = Math.round(r.h * 0.13);
  drawText(ctx, {
    text: stack,
    x: r.x + 40,
    y: r.y + r.h - 26,
    font: `700 ${stackFont}px "JetBrains Mono", ui-monospace, monospace`,
    color: COLORS.ink,
    align: 'left',
    baseline: 'alphabetic',
    letterSpacing: 0.18,
  });

  // Yellow underline accent on the left of the stack text
  ctx.fillStyle = COLORS.sun;
  ctx.fillRect(r.x + 40, r.y + r.h - 42, 60, 6);
}

// Title panel: pink, big builder title in cream.
function drawTitlePanel(ctx: CanvasRenderingContext2D, title: string) {
  const r = getPanelRects().title;

  ctx.fillStyle = COLORS.pink;
  ctx.fillRect(r.x, r.y, r.w, r.h);

  // Pick the largest font that fits on one line; if the title is too long,
  // shrink further and wrap to two lines so it never overflows the panel.
  const fontOpts = {
    family: '"Anton", Impact, sans-serif',
    weight: 700,
    letterSpacing: -0.01,
    maxWidth: r.w - 80,
    height: r.h * 0.85,
    startSize: r.h * 0.6,
  };
  let titleFont = pickFittingFontSize(ctx, title, fontOpts);

  // Try single-line first; if it doesn't fit even at the minimum, wrap.
  let lines = [title];
  const minFont = Math.max(40, Math.round(fontOpts.height * 0.55));
  if (titleFont <= minFont) {
    lines = wrapText(ctx, title, {
      font: `700 ${titleFont}px "Anton", Impact, sans-serif`,
      maxWidth: r.w - 80,
      letterSpacing: -0.01,
      maxLines: 2,
    });
  }

  const lineH = Math.round(titleFont * 0.92);
  const totalH = lines.length * lineH;
  const topY = r.y + (r.h - totalH) / 2;
  for (let i = 0; i < lines.length; i++) {
    drawText(ctx, {
      text: lines[i],
      x: r.x + 40,
      y: topY + i * lineH,
      font: `700 ${Math.round(titleFont)}px "Anton", Impact, sans-serif`,
      color: COLORS.cream,
      align: 'left',
      baseline: 'top',
      letterSpacing: -0.01,
    });
  }
}

// Footer: ink base, GOA · INDIA on the left, dates + hashtag right.
function drawFooterPanel(ctx: CanvasRenderingContext2D) {
  const r = getPanelRects().footer;

  ctx.fillStyle = COLORS.ink;
  ctx.fillRect(r.x, r.y, r.w, r.h);

  // Left: GOA
  drawText(ctx, {
    text: 'GOA',
    x: r.x + 40,
    y: r.y + r.h * 0.46,
    font: `700 ${Math.round(r.h * 0.55)}px "Anton", Impact, sans-serif`,
    color: COLORS.cream,
    align: 'left',
    baseline: 'middle',
    letterSpacing: -0.02,
  });

  drawText(ctx, {
    text: 'INDIA',
    x: r.x + 40,
    y: r.y + r.h * 0.46 + Math.round(r.h * 0.55) * 0.85,
    font: `700 ${Math.round(r.h * 0.14)}px "JetBrains Mono", ui-monospace, monospace`,
    color: COLORS.sun,
    align: 'left',
    baseline: 'middle',
    letterSpacing: 0.24,
  });

  // Right: dates + hashtag stacked
  drawText(ctx, {
    text: '28—31 OCT 2026',
    x: r.x + r.w - 40,
    y: r.y + r.h * 0.42,
    font: `700 ${Math.round(r.h * 0.18)}px "JetBrains Mono", ui-monospace, monospace`,
    color: COLORS.cream,
    align: 'right',
    baseline: 'middle',
    letterSpacing: 0.18,
  });

  // Small yellow bar between date and hashtag
  ctx.fillStyle = COLORS.sun;
  ctx.fillRect(r.x + r.w - 40 - 80, r.y + r.h * 0.56, 80, 4);

  drawText(ctx, {
    text: '#FRAMEINGOA',
    x: r.x + r.w - 40,
    y: r.y + r.h * 0.78,
    font: `700 ${Math.round(r.h * 0.15)}px "JetBrains Mono", ui-monospace, monospace`,
    color: COLORS.pink,
    align: 'right',
    baseline: 'middle',
    letterSpacing: 0.18,
  });
}

// ---------------- helpers ----------------

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
  if (ls > 0) {
    const chars = Array.from(opts.text);
    const widths = chars.map((c) => ctx.measureText(c).width);
    const totalWidth =
      widths.reduce((a, b) => a + b, 0) + ls * (chars.length - 1) * parseFloat(opts.font);
    let startX = opts.x;
    if (opts.align === 'center') startX = opts.x - totalWidth / 2;
    else if (opts.align === 'right') startX = opts.x - totalWidth;
    let cursorX = startX;
    for (let i = 0; i < chars.length; i++) {
      ctx.fillText(chars[i], cursorX, opts.y);
      cursorX += widths[i] + ls * parseFloat(opts.font);
    }
  } else {
    ctx.fillText(opts.text, opts.x, opts.y);
  }
  ctx.restore();
}

function measureTracked(
  ctx: CanvasRenderingContext2D,
  text: string,
  letterSpacing: number,
): number {
  const widths = Array.from(text).map((c) => ctx.measureText(c).width);
  return widths.reduce((a, b) => a + b, 0) + letterSpacing * (text.length - 1) * parseFloat(ctx.font);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// Find the largest font size (px) that fits the given text within maxWidth.
function pickFittingFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  opts: {
    family: string;
    weight: number;
    letterSpacing: number;
    maxWidth: number;
    height: number;
    startSize: number;
  },
): number {
  let size = opts.startSize;
  const minSize = Math.max(20, Math.round(opts.height * 0.45));
  while (size > minSize) {
    ctx.font = `${opts.weight} ${Math.round(size)}px ${opts.family}`;
    const w = measureTracked(ctx, text, opts.letterSpacing);
    if (w <= opts.maxWidth) return Math.round(size);
    size -= 2;
  }
  return minSize;
}

// Greedy word-wrap. Returns up to maxLines of strings; extra text is
// dropped (with ellipsis if needed) so the panel never overflows.
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  opts: { font: string; maxWidth: number; letterSpacing: number; maxLines?: number },
): string[] {
  const maxLines = opts.maxLines ?? 2;
  ctx.font = opts.font;
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [text];
  const lines: string[] = [];
  let current = '';
  for (const w of words) {
    const candidate = current ? current + ' ' + w : w;
    const wWidth = measureTracked(ctx, candidate, opts.letterSpacing);
    if (wWidth <= opts.maxWidth || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = w;
    }
    if (lines.length === maxLines) break;
  }
  if (current && lines.length < maxLines) lines.push(current);

  // If we ran out of lines and there are more words, append ellipsis to last line
  if (lines.length === maxLines) {
    const consumed = lines.join(' ').split(/\s+/).length;
    if (consumed < words.length) {
      const last = lines[lines.length - 1];
      let trimmed = last;
      while (trimmed.length > 1) {
        const cand = trimmed.replace(/\s*\S+$/, '') + '…';
        const w = measureTracked(ctx, cand, opts.letterSpacing);
        if (w <= opts.maxWidth) {
          lines[lines.length - 1] = cand;
          break;
        }
        trimmed = trimmed.replace(/\s*\S+$/, '');
      }
    }
  }
  return lines;
}

function computeCoverLayoutForPanel(srcW: number, srcH: number, adjust?: CropAdjust) {
  return computeCoverLayout(srcW, srcH, CARD_W, PANELS.photo, adjust ?? DEFAULT_ADJUST);
}

// ---- output helpers ----

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
