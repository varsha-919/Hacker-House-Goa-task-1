// Minimal baseline-JPEG decoder. Decodes /public/card.jpeg to a raw RGB buffer
// and writes it as PPM, just to read off pixel coordinates of the portrait
// window in the master card. No external deps.

const fs = require('fs');

const buf = fs.readFileSync('public/card.jpeg');

// ---- Find SOF0/2 for size and component info ----
let i = 2, width = 0, height = 0, sofStart = 0, comps = 0;
const compInfo = [];
while (i < buf.length) {
  if (buf[i] !== 0xFF) { i++; continue; }
  while (buf[i] === 0xFF) i++;
  const marker = buf[i++];
  if (marker === 0xC0 || marker === 0xC2) {
    sofStart = i;
    const len = buf.readUInt16BE(i);
    height = buf.readUInt16BE(i + 3);
    width = buf.readUInt16BE(i + 5);
    comps = buf[i + 7];
    let p = i + 8;
    for (let c = 0; c < comps; c++) {
      const id = buf[p++];
      const hv = buf[p++];
      const hSamp = (hv >> 4) & 0xF;
      const vSamp = hv & 0xF;
      const qt = buf[p++];
      compInfo.push({ id, hSamp, vSamp, qt });
    }
    break;
  }
  const segLen = buf.readUInt16BE(i);
  i += segLen;
}
console.error('image', width, 'x', height, 'comps', comps);

// ---- DQT tables ----
const dqt = new Array(4).fill(null);
i = 2;
while (i < buf.length) {
  if (buf[i] !== 0xFF) { i++; continue; }
  while (buf[i] === 0xFF) i++;
  const marker = buf[i++];
  if (marker === 0xDB) {
    const segLen = buf.readUInt16BE(i);
    let p = i + 2;
    const end = i + segLen;
    while (p < end) {
      const id = buf[p++];
      const table = new Uint8Array(64);
      for (let k = 0; k < 64; k++) table[k] = buf[p + k];
      dqt[id] = table;
      p += 64;
    }
    i = end;
    continue;
  }
  if (marker === 0xC0) break;
  const segLen = buf.readUInt16BE(i);
  i += segLen;
}

// ---- DHT tables ----
const dht = {};
i = 2;
while (i < buf.length) {
  if (buf[i] !== 0xFF) { i++; continue; }
  while (buf[i] === 0xFF) i++;
  const marker = buf[i++];
  if (marker === 0xC4) {
    const segLen = buf.readUInt16BE(i);
    let p = i + 2;
    const end = i + segLen;
    while (p < end) {
      const tcAndTh = buf[p++];
      const tc = (tcAndTh >> 4) & 0xF;
      const th = tcAndTh & 0xF;
      const counts = new Uint8Array(16);
      let total = 0;
      for (let k = 0; k < 16; k++) { counts[k] = buf[p++]; total += counts[k]; }
      const syms = new Uint8Array(total);
      for (let k = 0; k < total; k++) syms[k] = buf[p++];
      const key = (tc << 4) | th;
      dht[key] = { counts, syms, tc, th };
    }
    i = end;
    continue;
  }
  if (marker === 0xDA) break;
  if (marker === 0xC0) break;
  const segLen = buf.readUInt16BE(i);
  i += segLen;
}

// ---- Find SOS, collect scan data ----
let p = 2, dataStart = -1;
while (p < buf.length) {
  if (buf[p] !== 0xFF) { p++; continue; }
  while (buf[p] === 0xFF) p++;
  const marker = buf[p++];
  if (marker === 0xDA) {
    const segLen = buf.readUInt16BE(p);
    p += segLen;
    dataStart = p;
    break;
  }
  const segLen = buf.readUInt16BE(p);
  p += segLen;
}

const dataBytes = [];
let q = dataStart;
while (q < buf.length) {
  if (buf[q] === 0xFF) {
    if (q + 1 >= buf.length) break;
    const m = buf[q + 1];
    if (m === 0x00) { dataBytes.push(0xFF); q += 2; continue; }
    if (m >= 0xD0 && m <= 0xD7) { q += 2; continue; }
    if (m === 0xD9) break;
    break;
  }
  dataBytes.push(buf[q]); q++;
}
const scanBuf = Buffer.from(dataBytes);
console.error('scan bytes', scanBuf.length);

// ---- Bit reader ----
let bytePos = 0, bitPos = 0;
function readBit() {
  if (bytePos >= scanBuf.length) return 0;
  const b = scanBuf[bytePos];
  const bit = (b >> (7 - bitPos)) & 1;
  bitPos++;
  if (bitPos === 8) { bitPos = 0; bytePos++; }
  return bit;
}
function readBits(n) {
  let v = 0;
  for (let k = 0; k < n; k++) v = (v << 1) | readBit();
  return v;
}
function decodeHuff(table) {
  let code = 0;
  for (let len = 1; len <= 16; len++) {
    code = (code << 1) | readBit();
    let start = 0;
    for (let k = 1; k < len; k++) start += table.counts[k - 1];
    const range = table.counts[len];
    if (code - start < range) {
      return table.syms[start + (code - start)];
    }
  }
  return 0;
}
function ext(v, n) { if (v < (1 << (n - 1))) return v - (1 << n) + 1; return v; }

// ---- IDCT (AAN) ----
const SqrtHalfSqrt2 = 0.3535533905932737;
const Sqrt2 = 1.4142135623730951;
function idct(block) {
  const b = new Float32Array(64);
  for (let i = 0; i < 8; i++) {
    const s0 = block[0*8+i] * Sqrt2;
    const s1 = block[4*8+i] * Sqrt2;
    const s2 = block[2*8+i];
    const s3 = block[6*8+i];
    const s4 = block[1*8+i] - block[7*8+i];
    const s5 = block[3*8+i] * 2;
    const s6 = block[5*8+i] * 2;
    const s7 = block[1*8+i] + block[7*8+i];
    const t0 = s0 + s1;
    const t1 = s0 - s1;
    const t2 = s2 * 2 - s3 * 2;
    const t3 = s2 * 2 + s3 * 2;
    const t4 = s4 + s6;
    const t5 = s5 - s7;
    const t6 = s4 - s6;
    const t7 = s5 + s7;
    b[0*8+i] = t0 + t3 + t7;
    b[1*8+i] = t1 + t2 + t5;
    b[2*8+i] = t1 - t2 - t6;
    b[3*8+i] = t0 - t3 - t5;
    b[4*8+i] = t0 - t3 + t5;
    b[5*8+i] = t1 + t2 - t6;
    b[6*8+i] = t1 - t2 + t5;
    b[7*8+i] = t0 + t3 - t7;
  }
  for (let i = 0; i < 8; i++) {
    const s0 = b[i*8+0] * Sqrt2;
    const s1 = b[i*8+4] * Sqrt2;
    const s2 = b[i*8+2];
    const s3 = b[i*8+6];
    const s4 = b[i*8+1] - b[i*8+7];
    const s5 = b[i*8+3] * 2;
    const s6 = b[i*8+5] * 2;
    const s7 = b[i*8+1] + b[i*8+7];
    const t0 = s0 + s1;
    const t1 = s0 - s1;
    const t2 = s2 * 2 - s3 * 2;
    const t3 = s2 * 2 + s3 * 2;
    const t4 = s4 + s6;
    const t5 = s5 - s7;
    const t6 = s4 - s6;
    const t7 = s5 + s7;
    block[0*8+i] = (t0 + t3 + t7) * SqrtHalfSqrt2;
    block[1*8+i] = (t1 + t2 + t5) * SqrtHalfSqrt2;
    block[2*8+i] = (t1 - t2 - t6) * SqrtHalfSqrt2;
    block[3*8+i] = (t0 - t3 - t5) * SqrtHalfSqrt2;
    block[4*8+i] = (t0 - t3 + t5) * SqrtHalfSqrt2;
    block[5*8+i] = (t1 + t2 - t6) * SqrtHalfSqrt2;
    block[6*8+i] = (t1 - t2 + t5) * SqrtHalfSqrt2;
    block[7*8+i] = (t0 + t3 - t7) * SqrtHalfSqrt2;
  }
}

// ---- YCbCr -> RGB ----
function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
function toRGB(Y, Cb, Cr) {
  let r = Y + 1.402 * (Cr - 128);
  let g = Y - 0.344136 * (Cb - 128) - 0.714136 * (Cr - 128);
  let b = Y + 1.772 * (Cb - 128);
  return [clamp(Math.round(r),0,255), clamp(Math.round(g),0,255), clamp(Math.round(b),0,255)];
}

// ---- Sampling factors ----
const maxH = Math.max(...compInfo.map(c => c.hSamp));
const maxV = Math.max(...compInfo.map(c => c.vSamp));

// Component index in compInfo
const Yc  = compInfo[0];
const Cbc = compInfo[1];
const Crc = compInfo[2];

// MCU size in pixels
const mcuW = maxH * 8;
const mcuH = maxV * 8;
const mcusX = Math.ceil(width / mcuW);
const mcusY = Math.ceil(height / mcuH);
const total = mcusX * mcusY;

const rgb = Buffer.alloc(width * height * 3);
const prevDC = [0, 0, 0];

for (let mcu = 0; mcu < total; mcu++) {
  const mcuCol = mcu % mcusX;
  const mcuRow = Math.floor(mcu / mcusX);
  const x0 = mcuCol * mcuW;
  const y0 = mcuRow * mcuH;

  const yBlocks = [];
  for (let by = 0; by < Yc.vSamp; by++)
    for (let bx = 0; bx < Yc.hSamp; bx++) {
      const tblDC = dht[(0 << 4) | 0];
      const tblAC = dht[(1 << 4) | 0];
      const dcCode = decodeHuff(tblDC);
      prevDC[0] += ext(readBits(dcCode), dcCode);
      const q = new Float32Array(64);
      q[0] = prevDC[0] * dqt[Yc.qt][0];
      for (let k = 1; k < 64; k++) {
        const ac = decodeHuff(tblAC);
        if (ac === 0) break;
        const rrrr = ac >> 4;
        const ssss = ac & 0xF;
        k += rrrr;
        q[k] = ext(readBits(ssss), ssss) * dqt[Yc.qt][k];
      }
      idct(q);
      yBlocks.push({ bx, by, q });
    }

  // For simplicity: assume 4:2:0 (Y h2 v2, Cb h1 v1, Cr h1 v1) — the common case
  function decodeChroma(ci, prevIdx) {
    const tblDC = dht[(0 << 4) | ci];
    const tblAC = dht[(1 << 4) | ci];
    const dcCode = decodeHuff(tblDC);
    prevDC[prevIdx] += ext(readBits(dcCode), dcCode);
    const q = new Float32Array(64);
    q[0] = prevDC[prevIdx] * dqt[compInfo[ci].qt][0];
    for (let k = 1; k < 64; k++) {
      const ac = decodeHuff(tblAC);
      if (ac === 0) break;
      const rrrr = ac >> 4;
      const ssss = ac & 0xF;
      k += rrrr;
      q[k] = ext(readBits(ssss), ssss) * dqt[compInfo[ci].qt][k];
    }
    idct(q);
    return q;
  }
  const CbQ = decodeChroma(1, 1);
  const CrQ = decodeChroma(2, 2);

  // Place pixels
  for (let by = 0; by < Yc.vSamp; by++) {
    for (let bx = 0; bx < Yc.hSamp; bx++) {
      const blk = yBlocks.find(b => b.bx === bx && b.by === by);
      if (!blk) continue;
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          const px = x0 + bx * 8 + x;
          const py = y0 + by * 8 + y;
          if (px >= width || py >= height) continue;
          const Yv = blk.q[y * 8 + x] + 128;
          const cy = Math.min(7, Math.floor((by * 8 + y) / (Yc.vSamp)));
          const cx = Math.min(7, Math.floor((bx * 8 + x) / (Yc.hSamp)));
          const Cbv = CbQ[cy * 8 + cx] + 128;
          const Crv = CrQ[cy * 8 + cx] + 128;
          const [r, g, b2] = toRGB(Yv, Cbv, Crv);
          const idx = (py * width + px) * 3;
          rgb[idx] = r; rgb[idx + 1] = g; rgb[idx + 2] = b2;
        }
      }
    }
  }
}

// Write PPM
fs.writeFileSync('/tmp/card.ppm', Buffer.concat([
  Buffer.from(`P6\n${width} ${height}\n255\n`),
  rgb,
]));
console.error('wrote /tmp/card.ppm');

// ---- Find portrait window ----
// The portrait in the card is a roughly green/blue solid region between
// the "BUILDER 001" text and "HH · GOA · 2026" band. To find it, scan for
// columns and rows that are mostly green (G > R and G > B, G > 100) and
// within a "person silhouette" range.
// Simpler: look for the inner cream-paper area surrounded by yellow ticket.
// Actually the photo placeholder is a peach/skin color. Let's find all peach
// pixels (R > 180, G > 130, G < 200, B > 80, B < 160).

function isPeach(r, g, b) {
  return r > 180 && g > 130 && g < 200 && b > 80 && b < 170 && r > b + 20;
}

let minX = width, maxX = 0, minY = height, maxY = 0, count = 0;
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const idx = (y * width + x) * 3;
    const r = rgb[idx], g = rgb[idx + 1], b = rgb[idx + 2];
    if (isPeach(r, g, b)) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      count++;
    }
  }
}
console.log('peach pixels:', count, 'bbox:', minX, minY, 'to', maxX, maxY, '(w=' + (maxX-minX) + ', h=' + (maxY-minY) + ')');

// Also find yellow ticket bounds (R > 200, G > 180, B < 120)
function isYellow(r, g, b) {
  return r > 200 && g > 170 && b < 130;
}
let yminX = width, ymaxX = 0, yminY = height, ymaxY = 0, ycount = 0;
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const idx = (y * width + x) * 3;
    const r = rgb[idx], g = rgb[idx + 1], b = rgb[idx + 2];
    if (isYellow(r, g, b)) {
      if (x < yminX) yminX = x;
      if (x > ymaxX) ymaxX = x;
      if (y < yminY) yminY = y;
      if (y > ymaxY) ymaxY = y;
      ycount++;
    }
  }
}
console.log('yellow pixels:', ycount, 'bbox:', yminX, yminY, 'to', ymaxX, ymaxY);
