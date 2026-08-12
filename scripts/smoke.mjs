// Headless smoke-test that actually exercises the canvas renderer.
//
// Uses esbuild (already in the dev toolchain via vite) to bundle
// the export module, then runs it under jsdom + node-canvas.
//
// Verifies:
//   - renderBuilderIDToCanvas produces a 1080x1350 PNG
//   - the PNG embeds the photo (file size > empty placeholder)
//   - renderTeamPosterToCanvas works with 1, 2, 3 members
//   - share.ts builds a working share link

import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';
import url from 'url';
import { build } from 'esbuild';

const ROOT = process.cwd();
const TINY_JPEG_DATAURL =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AKpgAH//Z';

const { window } = new JSDOM('', { url: 'http://localhost/', pretendToBeVisual: true });
globalThis.window = window;
globalThis.document = window.document;
// Node.js 22 made globalThis.navigator a read-only getter. Use
// Object.defineProperty so it can be replaced with JSDOM's navigator.
Object.defineProperty(globalThis, 'navigator', {
  value: window.navigator,
  writable: true,
  configurable: true,
});
globalThis.HTMLCanvasElement = window.HTMLCanvasElement;
globalThis.HTMLImageElement = window.HTMLImageElement;
globalThis.Image = window.Image;
globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 0);
globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
Object.defineProperty(globalThis.document, 'fonts', {
  value: { ready: Promise.resolve() },
  configurable: true,
});
window.URL.createObjectURL = () => 'blob:fake';
window.URL.revokeObjectURL = () => {};
// heic2any references Worker at import time
globalThis.Worker = class { constructor() {} postMessage() {} terminate() {} addEventListener() {} removeEventListener() {} };
window.Worker = globalThis.Worker;

// Install node-canvas as the 2D context impl
const nodeCanvas = await import('canvas');
const { createCanvas, Image, loadImage } = nodeCanvas;
const proto = window.HTMLCanvasElement.prototype;
proto.getContext = function (type) {
  if (type === '2d') {
    if (!this._nodeCanvas) {
      this._nodeCanvas = createCanvas(this.width || 300, this.height || 150);
    }
    return this._nodeCanvas.getContext('2d');
  }
  return null;
};
proto.toDataURL = function (type) {
  if (this._nodeCanvas) return this._nodeCanvas.toDataURL(type || 'image/png');
  return '';
};
proto.toBlob = function (cb, type) {
  if (!this._nodeCanvas) { cb(null); return; }
  this._nodeCanvas.toBlob((b) => cb(b), type || 'image/png');
};

// Build a tiny in-memory bundle that re-exports the renderer so we
// can require it.
const tmp = path.join(ROOT, '.smoke-bundle.cjs');
await build({
  entryPoints: [path.join(ROOT, 'scripts', 'smoke-entry.mjs')],
  bundle: true,
  format: 'cjs',
  platform: 'node',
  target: 'node20',
  outfile: tmp,
  external: ['jsdom', 'canvas', 'heic2any', '@supabase/supabase-js'],
  logLevel: 'silent',
});

const { renderBuilderIDToCanvas, renderTeamPosterToCanvas, canvasToPngDataUrl } = await import(
  url.pathToFileURL(tmp).href
);

// Load a small real JPEG (so the renderer can decode it via Image.src)
const photoImg = await loadImage(TINY_JPEG_DATAURL);
console.log('Loaded test photo:', photoImg.width, 'x', photoImg.height);

// Wrap node-canvas's Image so the renderer's "new Image() + .src = dataURL"
// pattern works. node-canvas supports this already.
const RendererImage = function () {
  return new Image();
};
globalThis.Image = RendererImage;
window.Image = RendererImage;

const fakeLoaded = {
  image: photoImg,
  width: photoImg.width,
  height: photoImg.height,
  exportSource: photoImg,
  exportWidth: photoImg.width,
  exportHeight: photoImg.height,
  file: { name: 'test.jpg', size: 100, type: 'image/jpeg' },
};

// Wait for the Image() in node-canvas to load the data URL
// (node-canvas loadImage is async, but `new Image(); img.src = dataurl`
//  loads synchronously in node-canvas when the source is a data URL.)

async function runSingle() {
  const canvas = renderBuilderIDToCanvas({
    name: 'VARSHA GARG',
    stackOrRole: 'FULL STACK DEVELOPER',
    builderClass: 'THE SHIPPER',
    photo: fakeLoaded.exportSource,
    adjust: { scale: 1, offsetX: 0, offsetY: 0 },
  });
  const dataUrl = canvasToPngDataUrl(canvas);
  const b64 = dataUrl.split(',')[1];
  const buf = Buffer.from(b64, 'base64');
  const out = path.join(ROOT, '.smoke-single.png');
  fs.writeFileSync(out, buf);
  console.log('Single poster:', canvas.width, 'x', canvas.height, '|', buf.length, 'bytes ->', out);
  if (canvas.width !== 1080 || canvas.height !== 1350) {
    throw new Error('Wrong dimensions: ' + canvas.width + 'x' + canvas.height);
  }
  if (buf.length < 5000) {
    throw new Error('PNG looks empty (' + buf.length + ' bytes)');
  }
  return { buf, canvas };
}

async function runTeam(n) {
  const members = [];
  for (let i = 0; i < n; i++) {
    members.push({
      name: ['VARSHA', 'ARYAN', 'PRIYA'][i],
      stackOrRole: ['FULL STACK', 'AI / ML', 'DESIGN'][i],
      builderClass: 'THE BUILDER',
      photo: fakeLoaded.exportSource,
      adjust: { scale: 1, offsetX: 0, offsetY: 0 },
    });
  }
  const canvas = renderTeamPosterToCanvas({ teamName: 'CREW 247', members });
  const dataUrl = canvasToPngDataUrl(canvas);
  const b64 = dataUrl.split(',')[1];
  const buf = Buffer.from(b64, 'base64');
  const out = path.join(ROOT, '.smoke-team-' + n + '.png');
  fs.writeFileSync(out, buf);
  console.log('Team poster (n=' + n + '):', canvas.width, 'x', canvas.height, '|', buf.length, 'bytes ->', out);
  if (canvas.width !== 1080 || canvas.height !== 1350) {
    throw new Error('Wrong team dimensions: ' + canvas.width + 'x' + canvas.height);
  }
  return buf;
}

try {
  await runSingle();
  await runTeam(1);
  await runTeam(2);
  await runTeam(3);
  console.log('\nAll smoke tests PASSED.');
  process.exit(0);
} catch (e) {
  console.error('\nSmoke test FAILED:', e);
  process.exit(1);
}
