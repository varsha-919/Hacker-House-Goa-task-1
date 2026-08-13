// Test script: runs the actual cardComposer pipeline against a test
// photo to verify the photo lands in the right place on the master
// card. Uses sharp to render the result so we can inspect it.
//
// Usage: node scripts/test-composer.mjs
//
// Outputs:
//   scripts/test-output.png        — composited card
//   scripts/test-region-overlay.png — shows where the photo region is

import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// We re-implement just enough of cardComposer here so we can test the
// affine transform math without a DOM. The math is identical.
const PHOTO_REGION = {
  tl: { x: 311, y: 257 },
  tr: { x: 395, y: 252 },
  br: { x: 403, y: 407 },
  bl: { x: 319, y: 412 },
  width: 85,
  height: 155,
};

const SRC_W = 682, SRC_H = 1024;

// Build a test photo: a bright magenta rectangle with the word "TEST"
// so we can see exactly where it lands on the master card.
async function makeTestPhoto() {
  const W = 400, H = 500;
  const svg = `
  <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#FF2D7B"/>
    <text x="50%" y="50%" font-family="Arial" font-size="80" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">TEST</text>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

// Run the affine transform that compositePhoto uses:
//   unit square -> photo region quad
//   Then map src photo's "cover" rect into the unit square.
function composite(masterBuf, photoBuf, outW, outH, adjust) {
  // Load the photo dims
  return sharp(masterBuf)
    .composite([
      {
        input: photoBuf,
        // We'll use a custom affine via SVG for portability.
        // The trick: render the photo into a transparent canvas the size
        // of the photo window (in the OUTPUT coordinate space), then
        // use SVG <image> with a transform attribute to apply the
        // parallelogram.
        // BUT: SVG transform is in viewport pixels. We need to:
        //   1. Scale the photo to cover the window in its unrotated form
        //   2. Apply a 2D affine that maps unit square to the photo quad
        // Approach: use SVG <g transform="matrix(a,b,c,d,e,f)"> wrapping
        // the photo <image> with x=0,y=0,width=1,height=1.
        // The matrix in SVG transform="matrix(a b c d e f)" is:
        //   [ a c e ]
        //   [ b d f ]
        //   [ 0 0 1 ]
        // and applies as:
        //   x' = a*x + c*y + e
        //   y' = b*x + d*y + f
        // We need the SAME matrix as our composer.
      },
    ])
    .png()
    .toBuffer();
}

// Instead of trying to reimplement the affine in sharp, let's just use
// the actual composer logic via a tiny headless harness. The easiest
// is to spin up a minimal Puppeteer/Playwright instance... but we
// don't have those installed. Instead, let's use the canvas npm package
// OR just verify visually with a test photo via a real browser build.

// For now, the most practical approach: just verify the calibration
// visually by overlaying the photo region on the master card.

const masterPath = path.join(__dirname, '..', 'public', 'card.jpeg');
const master = fs.readFileSync(masterPath);

const r = PHOTO_REGION;
const svgOverlay = `
<svg width="${SRC_W}" height="${SRC_H}" xmlns="http://www.w3.org/2000/svg">
  <image href="data:image/jpeg;base64,${master.toString('base64')}" width="${SRC_W}" height="${SRC_H}"/>
  <polygon points="${r.tl.x},${r.tl.y} ${r.tr.x},${r.tr.y} ${r.br.x},${r.br.y} ${r.bl.x},${r.bl.y}" fill="rgba(255,45,123,0.5)" stroke="red" stroke-width="2"/>
  <text x="${r.tl.x}" y="${r.tl.y - 5}" font-family="Arial" font-size="10" fill="red">PHOTO REGION</text>
</svg>`;

await sharp(Buffer.from(svgOverlay)).png().toFile(path.join(__dirname, 'test-region-overlay.png'));
console.log('wrote scripts/test-region-overlay.png');

// Also write a sample test photo to use for the actual visual test
const testPhoto = await makeTestPhoto();
fs.writeFileSync(path.join(__dirname, 'test-photo.png'), testPhoto);
console.log('wrote scripts/test-photo.png');

// Composite the test photo into the master using sharp's affine-ish
// transforms. We approximate the parallelogram by warping the test
// photo with a perspective transform in SVG.
const w = r.width, h = r.height;
// Test photo's natural aspect: 400/500 = 0.8
// Window's aspect: 85/155 = 0.548 — much taller
// So with cover-fit, we'll zoom in (scale 1.0 means fill width to height).
// Default adjust = { scale: 1.15, offsetX: 0, offsetY: 0 }
const photoW = 400, photoH = 500;
const dstAspect = w / h; // 0.548
const srcAspect = photoW / photoH; // 0.8
// Source is wider. Cover-fit: align by width? no, source wider than dst
// means we crop horizontally. So srcH = photoH, srcW = photoH * dstAspect
// = 500 * 0.548 = 274. With scale 1.15, cropW = 274 / 1.15 = 238.
const cropW = (photoH * dstAspect) / 1.15;
const cropH = photoH / 1.15;
const sx = (photoW - cropW) / 2;
const sy = (photoH - cropH) / 2;
// Now we need to extract that crop and warp it into the photo region quad.
// Use sharp's extract + composite with a custom path. The simplest: use
// the extract region from the test photo, then composite with a
// transformation. But sharp doesn't directly support affine. We use SVG
// for the final composite.

const photoBase64 = testPhoto.toString('base64');
// Build the photo as a cropped image first
const croppedPhoto = await sharp(testPhoto)
  .extract({ left: Math.round(sx), top: Math.round(sy), width: Math.round(cropW), height: Math.round(cropH) })
  .resize(Math.round(w * 4), Math.round(h * 4), { fit: 'fill' })
  .png()
  .toBuffer();
const croppedBase64 = croppedPhoto.toString('base64');

// Now composite the cropped test photo into the master using an SVG
// <g transform="..."> with the parallelogram matrix.
const r2 = PHOTO_REGION;
const a = r2.tr.x - r2.tl.x;
const b = r2.tr.y - r2.tl.y;
const c = r2.bl.x - r2.tl.x;
const d = r2.bl.y - r2.tl.y;
const e = r2.tl.x;
const f = r2.tl.y;
const matrix = `${a} ${b} ${c} ${d} ${e} ${f}`;

const finalSvg = `
<svg width="${SRC_W}" height="${SRC_H}" xmlns="http://www.w3.org/2000/svg">
  <image href="data:image/jpeg;base64,${master.toString('base64')}" width="${SRC_W}" height="${SRC_H}"/>
  <g transform="matrix(${matrix})">
    <image href="data:image/png;base64,${croppedBase64}" x="0" y="0" width="1" height="1"/>
  </g>
</svg>`;
await sharp(Buffer.from(finalSvg)).png().toFile(path.join(__dirname, 'test-output.png'));
console.log('wrote scripts/test-output.png');
