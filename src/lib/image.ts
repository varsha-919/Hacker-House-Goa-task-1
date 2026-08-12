// HEIC handling + image utilities.
//
// Browsers do not natively decode HEIC. We use heic2any to convert HEIC -> JPEG
// before any other processing. All other formats (jpg/png/webp/gif) pass through
// directly to a normal FileReader.

import heic2any from 'heic2any';

export const MAX_IMAGE_DIM = 2400; // px on the longest side after decode
export const TARGET_DECODE_BYTES = 12 * 1024 * 1024; // 12MB soft cap

export type LoadedImage = {
  // Original decoded image
  image: HTMLImageElement;
  // Original width/height (decoded)
  width: number;
  height: number;
  // Resized-for-export image (downscaled if huge)
  exportSource: HTMLImageElement;
  exportWidth: number;
  exportHeight: number;
  // Original File for reference
  file: File;
};

function isHeic(file: File): boolean {
  const name = file.name.toLowerCase();
  const type = (file.type || '').toLowerCase();
  return (
    name.endsWith('.heic') ||
    name.endsWith('.heif') ||
    type === 'image/heic' ||
    type === 'image/heif'
  );
}

async function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Could not read file.'));
    reader.readAsDataURL(file);
  });
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Only set crossOrigin for http(s) URLs. data: URLs cannot be crossOrigin.
    if (/^https?:\/\//i.test(src)) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not decode image.'));
    img.src = src;
  });
}

function maybeDownscale(image: HTMLImageElement): Promise<HTMLImageElement> {
  const longest = Math.max(image.naturalWidth, image.naturalHeight);
  if (longest <= MAX_IMAGE_DIM) {
    return Promise.resolve(image);
  }
  const ratio = MAX_IMAGE_DIM / longest;
  const w = Math.round(image.naturalWidth * ratio);
  const h = Math.round(image.naturalHeight * ratio);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.resolve(image);

  // Use high-quality smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, 0, 0, w, h);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          resolve(image);
          return;
        }
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          URL.revokeObjectURL(url);
          resolve(img);
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          resolve(image);
        };
        img.src = url;
      },
      'image/jpeg',
      0.9,
    );
  });
}

export async function loadImageFromFile(file: File): Promise<LoadedImage> {
  if (!file) throw new Error('No file provided.');
  if (file.size > 50 * 1024 * 1024) {
    throw new Error('That image is over 50MB. Please pick a smaller photo.');
  }

  let workingFile: File | Blob = file;

  // HEIC -> JPEG
  if (isHeic(file)) {
    try {
      const converted = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.9,
      });
      const blob = Array.isArray(converted) ? converted[0] : converted;
      if (!blob) throw new Error('HEIC conversion failed.');
      workingFile = blob;
    } catch (err) {
      console.error('HEIC conversion error', err);
      throw new Error('Could not read HEIC photo. Try a JPG or PNG instead.');
    }
  }

  let dataUrl: string;
  if (workingFile instanceof File) {
    dataUrl = await fileToDataURL(workingFile);
  } else {
    dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Could not read image.'));
      reader.readAsDataURL(workingFile);
    });
  }

  const image = await loadImage(dataUrl);
  const exportSource = await maybeDownscale(image);

  return {
    image,
    width: image.naturalWidth,
    height: image.naturalHeight,
    exportSource,
    exportWidth: exportSource.naturalWidth,
    exportHeight: exportSource.naturalHeight,
    file,
  };
}

// A "cover" style crop calculation. Returns the source rectangle to extract
// from the original image so it fills the target aspect ratio.
export type CropAdjust = {
  scale: number;     // 1.0 = full size, 1.5 = zoomed 50% in
  offsetX: number;   // -1..1, horizontal (positive = shift right)
  offsetY: number;   // -1..1, vertical (positive = shift down)
};

// Tighter default crop: scale 1.15 so faces fill the circle cleanly without
// manual zoom. Users can still drag the slider down to 1.0 for a wider crop.
export const DEFAULT_ADJUST: CropAdjust = { scale: 1.15, offsetX: 0, offsetY: 0 };

export type CoverRect = {
  sx: number; sy: number; sw: number; sh: number;
  dx: number; dy: number; dw: number; dh: number;
};

// Single source of truth for both the CSS preview AND the Canvas export.
// Returns both the drawImage-style rect for canvas, and the CSS background
// (size %, position %) that renders identically in the DOM. Both come
// from the same underlying math so they cannot drift.
export type CoverLayout = {
  // Canvas drawImage args
  sx: number; sy: number; sw: number; sh: number;
  // CSS background
  bgSizePct: number;       // background-size as a single percentage (px only)
  bgPosXPct: number;       // background-position-x %
  bgPosYPct: number;       // background-position-y %
};

export function computeCoverLayout(
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number,
  adjust: CropAdjust = DEFAULT_ADJUST,
): CoverLayout {
  const srcAspect = srcW / srcH;
  const dstAspect = dstW / dstH;

  // Base crop region (before zoom / offset)
  let baseW: number;
  let baseH: number;
  if (srcAspect > dstAspect) {
    // Image is wider than target -> crop horizontally
    baseH = srcH;
    baseW = srcH * dstAspect;
  } else {
    // Image is taller than target -> crop vertically
    baseW = srcW;
    baseH = srcW / dstAspect;
  }

  // Apply zoom: scale > 1 zooms in (smaller crop region, larger displayed size)
  const zoom = Math.max(1, Math.min(3, adjust.scale));
  const cropW = baseW / zoom;
  const cropH = baseH / zoom;

  // Center-crop then apply offset
  let sx = (srcW - cropW) / 2;
  let sy = (srcH - cropH) / 2;
  const maxOffsetX = (srcW - cropW) / 2;
  const maxOffsetY = (srcH - cropH) / 2;
  sx += adjust.offsetX * maxOffsetX;
  sy += adjust.offsetY * maxOffsetY;
  sx = Math.max(0, Math.min(srcW - cropW, sx));
  sy = Math.max(0, Math.min(srcH - cropH, sy));

  // For the CSS preview, the image is sized so that the crop rectangle
  // fills the destination box. background-size must be:
  //   size% = (srcW / cropW) * 100   (when src aligns to width),
  //   size% = (srcH / cropH) * 100   (when src aligns to height).
  // The Side that aligns is the one that matches the destination aspect.
  let bgSizePct: number;
  let bgPosXPct: number;
  let bgPosYPct: number;

  if (srcAspect > dstAspect) {
    // source is wider; after crop, srcH fully maps to dstH and srcW is cropped.
    bgSizePct = (srcH / cropH) * 100;
    // The crop cropW is centered at srcW/2 then offset -> the LEFT edge of
    // the crop rectangle in the image sits at sx. After scaling up, the
    // displayed image width is bgSizePct% of the dst width. The crop
    // rectangle's left edge sits at (sx / srcW) * displayedWidth
    //                = (sx / srcW) * (bgSizePct/100) * dstW pixels from the left.
    // background-position-x% = position of crop CENTER as % of displayed width.
    const cropCenterX = sx + cropW / 2;
    bgPosXPct = (cropCenterX / srcW) * 100;
    bgPosYPct = 50;
  } else {
    // source is taller (or equal); after crop, srcW fully maps to dstW and srcH is cropped.
    bgSizePct = (srcW / cropW) * 100;
    const cropCenterY = sy + cropH / 2;
    bgPosXPct = 50;
    bgPosYPct = (cropCenterY / srcH) * 100;
  }

  return {
    sx,
    sy,
    sw: cropW,
    sh: cropH,
    bgSizePct,
    bgPosXPct,
    bgPosYPct,
  };
}

// Backwards-compat helper used by anything that still wants a drawImage rect.
export function computeCoverRect(
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number,
  adjust: CropAdjust = DEFAULT_ADJUST,
): CoverRect {
  const c = computeCoverLayout(srcW, srcH, dstW, dstH, adjust);
  return {
    sx: c.sx,
    sy: c.sy,
    sw: c.sw,
    sh: c.sh,
    dx: 0,
    dy: 0,
    dw: dstW,
    dh: dstH,
  };
}

// Detect if an image is "portrait-ish" (taller than wide) — used to
// decide whether to bias the crop area to the upper half (faces)
export function isPortraitLike(srcW: number, srcH: number): boolean {
  return srcH > srcW * 1.05;
}
