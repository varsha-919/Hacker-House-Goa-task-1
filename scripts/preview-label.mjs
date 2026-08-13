// Render preview with the teammate label to verify position visually.
import sharp from 'sharp';

const W = 1684, H = 2528;
const names = ['Alex', 'Blair', 'Casey'];
const labelText =
  '+' + names.map((n) => n.charAt(0).toUpperCase() + n.slice(1)).join(' · ');

const fontSize = 36;
const padX = 28;
const padY = 16;
const margin = 48;
const approxCharW = fontSize * 0.6;
const textW = labelText.length * approxCharW;
const pillW = textW + padX * 2;
const pillH = fontSize + padY * 2;
const pillX = W - pillW - margin;
const pillY = H - pillH - margin;

const overlay =
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">` +
  `<rect x="${pillX}" y="${pillY}" width="${pillW}" height="${pillH}" rx="${pillH / 2}" ry="${pillH / 2}" fill="#f4e9d1" stroke="#0e2a1c" stroke-width="3"/>` +
  `<text x="${pillX + padX}" y="${pillY + pillH / 2}" font-family="ui-monospace,Menlo,Consolas,monospace" font-size="${fontSize}" font-weight="bold" fill="#d6336c" dominant-baseline="middle">${labelText}</text>` +
  `</svg>`;

const halfW = 842;
const halfH = 1264;
const scale = halfW / W;
// Scale overlay coordinates too
const sx = (v) => Math.round(v * scale);

const overlay2 =
  `<svg xmlns="http://www.w3.org/2000/svg" width="${halfW}" height="${halfH}">` +
  `<rect x="${sx(pillX)}" y="${sx(pillY)}" width="${sx(pillW)}" height="${sx(pillH)}" rx="${sx(pillH / 2)}" ry="${sx(pillH / 2)}" fill="#f4e9d1" stroke="#0e2a1c" stroke-width="${sx(3)}"/>` +
  `<text x="${sx(pillX + padX)}" y="${sx(pillY + pillH / 2)}" font-family="ui-monospace,Menlo,Consolas,monospace" font-size="${sx(fontSize)}" font-weight="bold" fill="#d6336c" dominant-baseline="middle">${labelText}</text>` +
  `</svg>`;

await sharp('public/ticket.png')
  .resize({ width: halfW })
  .composite([{ input: Buffer.from(overlay2), top: 0, left: 0 }])
  .png({ compressionLevel: 9 })
  .toFile('scripts/label-preview.png');

console.log('wrote scripts/label-preview.png');