var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// scripts/smoke-entry.mjs
var smoke_entry_exports = {};
__export(smoke_entry_exports, {
  canvasToPngDataUrl: () => canvasToPngDataUrl,
  renderBuilderIDToCanvas: () => renderBuilderIDToCanvas,
  renderTeamPosterToCanvas: () => renderTeamPosterToCanvas
});
module.exports = __toCommonJS(smoke_entry_exports);

// src/lib/image.ts
var import_heic2any = __toESM(require("heic2any"), 1);
var TARGET_DECODE_BYTES = 12 * 1024 * 1024;
var DEFAULT_ADJUST = { scale: 1.15, offsetX: 0, offsetY: 0 };
function computeCoverLayout(srcW, srcH, dstW, dstH, adjust = DEFAULT_ADJUST) {
  const srcAspect = srcW / srcH;
  const dstAspect = dstW / dstH;
  let baseW;
  let baseH;
  if (srcAspect > dstAspect) {
    baseH = srcH;
    baseW = srcH * dstAspect;
  } else {
    baseW = srcW;
    baseH = srcW / dstAspect;
  }
  const zoom = Math.max(1, Math.min(3, adjust.scale));
  const cropW = baseW / zoom;
  const cropH = baseH / zoom;
  let sx = (srcW - cropW) / 2;
  let sy = (srcH - cropH) / 2;
  const maxOffsetX = (srcW - cropW) / 2;
  const maxOffsetY = (srcH - cropH) / 2;
  sx += adjust.offsetX * maxOffsetX;
  sy += adjust.offsetY * maxOffsetY;
  sx = Math.max(0, Math.min(srcW - cropW, sx));
  sy = Math.max(0, Math.min(srcH - cropH, sy));
  let bgSizePct;
  let bgPosXPct;
  let bgPosYPct;
  if (srcAspect > dstAspect) {
    bgSizePct = srcH / cropH * 100;
    const cropCenterX = sx + cropW / 2;
    bgPosXPct = cropCenterX / srcW * 100;
    bgPosYPct = 50;
  } else {
    bgSizePct = srcW / cropW * 100;
    const cropCenterY = sy + cropH / 2;
    bgPosXPct = 50;
    bgPosYPct = cropCenterY / srcH * 100;
  }
  return {
    sx,
    sy,
    sw: cropW,
    sh: cropH,
    bgSizePct,
    bgPosXPct,
    bgPosYPct
  };
}

// src/lib/posterLayout.ts
var CARD_W = 1080;
var CARD_H = 1350;
var COLORS = {
  // Core
  ink: "#0E2A1F",
  inkDeep: "#081A12",
  inkSoft: "#143C2A",
  cream: "#F5EBD7",
  creamSoft: "#E9DAB7",
  creamWarm: "#EFDFC0",
  paper: "#FBF6E8",
  paperInk: "#3A2A14",
  sun: "#FFD23F",
  sunDeep: "#F2BE1F",
  pink: "#FF2D7B",
  pinkDeep: "#E51A66",
  // Decorative tints used for stamps / wave strokes
  stamp: "#1B5E3F"
};
var PANELS = {
  header: 200,
  goa: 160,
  hero: 560,
  name: 180,
  klass: 160,
  footer: 90
};
function getPanelRects() {
  let y = 0;
  const header = { x: 0, y, w: CARD_W, h: PANELS.header };
  y += PANELS.header;
  const goa = { x: 0, y, w: CARD_W, h: PANELS.goa };
  y += PANELS.goa;
  const hero = { x: 0, y, w: CARD_W, h: PANELS.hero };
  y += PANELS.hero;
  const name = { x: 0, y, w: CARD_W, h: PANELS.name };
  y += PANELS.name;
  const klass = { x: 0, y, w: CARD_W, h: PANELS.klass };
  y += PANELS.klass;
  const footer = { x: 0, y, w: CARD_W, h: PANELS.footer };
  return { header, goa, hero, name, klass, footer };
}
var FONT = {
  display: '"Anton", Impact, "Haettenschweiler", "Arial Narrow Bold", sans-serif',
  editorial: '"Fraunces", "DM Serif Display", Georgia, "Times New Roman", serif',
  mono: '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace',
  editorialItalic: '"Fraunces", "DM Serif Display", Georgia, serif'
};
function getHeroMedallion() {
  return {
    cx: CARD_W / 2,
    cy: PANELS.header + PANELS.goa + PANELS.hero / 2 - 20,
    // 200+160+280-20 = 620
    r: 320
  };
}
function getHeroSun() {
  const m = getHeroMedallion();
  return { cx: m.cx, cy: m.cy - 40, r: 170 };
}
function getHeroPlate() {
  const m = getHeroMedallion();
  return {
    cx: m.cx,
    cy: m.cy + 30,
    w: 720,
    h: 480
  };
}
function getPhotoCoverLayout(srcW, srcH, circleR, adjust = DEFAULT_ADJUST) {
  return computeCoverLayout(srcW, srcH, circleR * 2, circleR * 2, adjust);
}
function getNameBlockWavy() {
  return {
    y: PANELS.header + PANELS.goa + PANELS.hero,
    // 920
    amp: 18,
    period: 64
  };
}
function getNameBlock() {
  const y = PANELS.header + PANELS.goa + PANELS.hero;
  const h = PANELS.name;
  return {
    x: 0,
    y,
    w: CARD_W,
    h,
    top: y,
    bottom: y + h,
    eyebrow: y + 32,
    // "BUILDER ID · NO. 028 / 247"
    name: y + 110,
    // baseline of VARSHA GARG
    underline: y + 124,
    // pink bar under name
    stack: y + h - 26,
    // [ ⚡ FULL STACK DEVELOPER ⚡ ]
    barLeft: { x: 0, y: y + 8, w: 14, h: h - 16 }
    // yellow left bar
  };
}
function getBuilderStamp() {
  return { cx: 138, cy: PANELS.header + PANELS.goa + 70, r: 58 };
}
function getShipSticker() {
  return { x: CARD_W - 14, y: PANELS.header + PANELS.goa + 32 };
}
function getStarSticker() {
  const m = getHeroMedallion();
  return { cx: m.cx + m.r * 0.78, cy: m.cy + m.r * 0.7, r: 56 };
}
function getLocationPin() {
  const m = getHeroMedallion();
  return { x: 36, y: m.cy + m.r - 4 };
}
function getSurfboard() {
  const m = getHeroMedallion();
  return { x: m.cx + m.r * 0.65, y: m.cy + m.r - 12 };
}
function getGoaRoute() {
  const top = PANELS.header;
  return {
    x1: 30,
    y1: top + 130,
    x2: CARD_W - 30,
    y2: top + 130
  };
}
function getGoaScooter() {
  const top = PANELS.header;
  return { x: CARD_W * 0.55, y: top + 130 };
}
function getMountainRidge() {
  const top = PANELS.header;
  return {
    baseY: top + 100,
    left: 10,
    right: CARD_W - 10
  };
}
function getClassBuilderStamp() {
  const r = getPanelRects().klass;
  return { cx: r.x + r.w - 80, cy: r.y + 32, r: 42 };
}
function getClassRotateHint() {
  const r = getPanelRects().klass;
  return { x: r.x + r.w - 28, y: r.y + r.h - 18 };
}
function getClassStarCorner() {
  const r = getPanelRects().klass;
  return { x: r.x + 8, y: r.y + 14 };
}
function getFooterPostmark() {
  const r = getPanelRects().footer;
  return { cx: r.x + r.w / 2, cy: r.y + r.h / 2 - 4, w: 200, h: 56 };
}
function getFooterTear() {
  const r = getPanelRects().footer;
  return { x: r.x, y: r.y, w: 28, h: r.h };
}

// src/lib/export.ts
function renderBuilderIDToCanvas(data, options = {}) {
  const W = options.size?.w ?? CARD_W;
  const H = options.size?.h ?? CARD_H;
  const scale = W / CARD_W;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get a 2D drawing context.");
  ctx.scale(scale, scale);
  const name = (data.name || "YOUR NAME").toUpperCase().trim();
  const stack = (data.stackOrRole || "BUILDER").toUpperCase().trim();
  const klass = (data.builderClass || "THE BUILDER").toUpperCase().trim();
  const builderNo = data.builderNumber ?? 28;
  drawBackground(ctx);
  drawHeader(ctx, { builderNo });
  drawGoaScene(ctx);
  drawHeroZone(ctx, data.photo, data.adjust, builderNo);
  drawNameBlock(ctx, name, stack);
  drawClassBand(ctx, klass, builderNo);
  drawFooter(ctx);
  return canvas;
}
function drawBackground(ctx) {
  ctx.fillStyle = COLORS.cream;
  ctx.fillRect(0, 0, CARD_W, CARD_H);
  ctx.save();
  ctx.fillStyle = "rgba(58, 42, 20, 0.05)";
  const grain = createGrainDots(1080, 1350, 1100);
  for (const d of grain) {
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.fillStyle = COLORS.ink;
  ctx.fillRect(0, 0, CARD_W, 10);
  ctx.fillRect(0, CARD_H - 10, CARD_W, 10);
  ctx.fillRect(0, 0, 10, CARD_H);
  ctx.fillRect(CARD_W - 10, 0, 10, CARD_H);
}
function createGrainDots(w, h, n) {
  const out = [];
  let s = 1337;
  for (let i = 0; i < n; i++) {
    s = (s * 9301 + 49297) % 233280;
    const x = s / 233280 * w;
    s = (s * 9301 + 49297) % 233280;
    const y = s / 233280 * h;
    s = (s * 9301 + 49297) % 233280;
    const r = 0.5 + s / 233280 * 1.4;
    out.push({ x, y, r });
  }
  return out;
}
function drawHeader(ctx, opts) {
  const r = getPanelRects().header;
  ctx.fillStyle = COLORS.ink;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  const tagSize = 110;
  ctx.fillStyle = COLORS.sun;
  ctx.fillRect(0, 0, tagSize, tagSize);
  drawText(ctx, {
    text: "HH",
    x: tagSize / 2,
    y: tagSize / 2 - 8,
    font: `400 ${Math.round(tagSize * 0.55)}px ${FONT.display}`,
    color: COLORS.ink,
    align: "center",
    baseline: "middle",
    letterSpacing: -0.04
  });
  drawText(ctx, {
    text: "EST. 2026",
    x: tagSize / 2,
    y: tagSize - 16,
    font: `700 10px ${FONT.mono}`,
    color: COLORS.ink,
    align: "center",
    baseline: "middle",
    letterSpacing: 0.2
  });
  drawText(ctx, {
    text: "Hacker House",
    x: tagSize + 30,
    y: 60,
    font: `italic 600 60px ${FONT.editorialItalic}`,
    color: COLORS.cream,
    align: "left",
    baseline: "middle",
    letterSpacing: -0.01
  });
  drawText(ctx, {
    text: "GOA \xB7 INDIA",
    x: tagSize + 30,
    y: 104,
    font: `700 18px ${FONT.mono}`,
    color: COLORS.sun,
    align: "left",
    baseline: "middle",
    letterSpacing: 0.3
  });
  drawText(ctx, {
    text: "247 BUILDERS \xB7 EST. 2026 \xB7 CURRENTLY SHIPPING",
    x: tagSize + 30,
    y: 142,
    font: `700 12px ${FONT.mono}`,
    color: COLORS.pink,
    align: "left",
    baseline: "middle",
    letterSpacing: 0.26
  });
  const rightX = CARD_W - 36;
  drawText(ctx, {
    text: "28\u201431",
    x: rightX,
    y: 50,
    font: `700 38px ${FONT.display}`,
    color: COLORS.sun,
    align: "right",
    baseline: "middle",
    letterSpacing: -0.01
  });
  drawText(ctx, {
    text: "OCT 2026",
    x: rightX,
    y: 90,
    font: `700 16px ${FONT.mono}`,
    color: COLORS.cream,
    align: "right",
    baseline: "middle",
    letterSpacing: 0.24
  });
  drawText(ctx, {
    text: "GOA \xB7 INDIA",
    x: rightX,
    y: 116,
    font: `700 12px ${FONT.mono}`,
    color: COLORS.pink,
    align: "right",
    baseline: "middle",
    letterSpacing: 0.24
  });
  drawRoundStamp(ctx, {
    cx: CARD_W - 170,
    cy: 50,
    r: 36,
    border: COLORS.pink,
    text: "TKT",
    textColor: COLORS.pink,
    textFont: `700 14px ${FONT.mono}`,
    sub: `No. ${String(opts.builderNo).padStart(3, "0")}`,
    subFont: `700 10px ${FONT.mono}`
  });
  drawPerforatedLine(ctx, 0, r.h - 8, CARD_W, 4, COLORS.cream, 12, 8);
  drawDottedLine(ctx, 0, r.h - 24, CARD_W, COLORS.cream, 0.3, 8);
}
function drawGoaScene(ctx) {
  const r = getPanelRects().goa;
  ctx.fillStyle = COLORS.cream;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  drawText(ctx, {
    text: "GOA \xB7 15.5\xB0 N \xB7 73.8\xB0 E",
    x: r.x + 16,
    y: r.y + 18,
    font: `700 11px ${FONT.mono}`,
    color: COLORS.stamp,
    align: "left",
    baseline: "middle",
    letterSpacing: 0.22
  });
  drawText(ctx, {
    text: "ARABIAN SEA",
    x: r.x + r.w - 16,
    y: r.y + 18,
    font: `700 11px ${FONT.mono}`,
    color: COLORS.stamp,
    align: "right",
    baseline: "middle",
    letterSpacing: 0.22
  });
  const sun = getHeroSun();
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, r.y, CARD_W, sun.cy + sun.r);
  ctx.clip();
  drawSun(ctx, sun.cx, sun.cy, sun.r, COLORS.sun, COLORS.sunDeep);
  ctx.restore();
  const m = getMountainRidge();
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(m.left, m.baseY + 50);
  ctx.lineTo(m.left + 120, m.baseY);
  ctx.lineTo(m.left + 240, m.baseY + 22);
  ctx.lineTo(m.left + 360, m.baseY - 10);
  ctx.lineTo(m.left + 480, m.baseY + 16);
  ctx.lineTo(m.left + 620, m.baseY - 4);
  ctx.lineTo(m.left + 760, m.baseY + 20);
  ctx.lineTo(m.left + 900, m.baseY + 2);
  ctx.lineTo(m.right, m.baseY + 26);
  ctx.lineTo(m.right, m.baseY + 70);
  ctx.lineTo(m.left, m.baseY + 70);
  ctx.closePath();
  ctx.fillStyle = COLORS.ink;
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(m.left, m.baseY + 56);
  for (let x = m.left; x <= m.right; x += 14) {
    const yy = m.baseY + 56 - Math.abs(Math.sin((x - m.left) / 22)) * 4;
    ctx.lineTo(x, yy);
  }
  ctx.strokeStyle = COLORS.sun;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
  drawPalm(ctx, r.x + 90, r.y + r.h - 6, 90, COLORS.stamp, 1);
  drawPalm(ctx, r.x + 220, r.y + r.h - 4, 60, COLORS.ink, 0.85);
  drawPalm(ctx, r.x + r.w - 220, r.y + r.h - 6, 72, COLORS.ink, 0.9);
  const route = getGoaRoute();
  drawRouteDots(ctx, route.x1, route.y1, route.x2, route.y2, COLORS.pink, 8, 4);
  drawText(ctx, {
    text: "ROUTE \xB7 BAGA \u2192 ANJUNA \u2192 PALOLEM",
    x: CARD_W / 2,
    y: route.y1 - 12,
    font: `700 10px ${FONT.mono}`,
    color: COLORS.pink,
    align: "center",
    baseline: "middle",
    letterSpacing: 0.3
  });
  const sc = getGoaScooter();
  drawScooter(ctx, sc.x - 30, sc.y - 8, 1.4, COLORS.ink);
}
function drawHeroZone(ctx, photo, adjust, builderNo) {
  const r = getPanelRects().hero;
  const { cx, cy, r: rad } = getHeroMedallion();
  ctx.fillStyle = COLORS.cream;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  drawWavePattern(ctx, r.x + 20, r.y + r.h - 80, r.w - 40, 24, COLORS.pink);
  const sb = getSurfboard();
  drawSurfboard(ctx, sb.x - 60, sb.y - 20, 0.7, COLORS.ink);
  drawPalm(ctx, 60, r.y + 130, 130, COLORS.stamp, 1);
  drawPalm(ctx, CARD_W - 60, r.y + 130, 130, COLORS.stamp, 1);
  const plate = getHeroPlate();
  ctx.save();
  ctx.translate(plate.cx, plate.cy);
  ctx.rotate(-0.025);
  ctx.fillStyle = COLORS.pink;
  ctx.fillRect(-plate.w / 2, -plate.h / 2, plate.w, plate.h);
  ctx.fillStyle = COLORS.cream;
  ctx.fillRect(-plate.w / 2 + 14, -plate.h / 2 + 14, plate.w - 28, plate.h - 28);
  ctx.restore();
  ctx.fillStyle = COLORS.sun;
  ctx.beginPath();
  ctx.arc(cx, cy, rad + 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, rad, 0, Math.PI * 2);
  ctx.clip();
  if (photo && photo.naturalWidth > 0) {
    const layout = getPhotoCoverLayout(
      photo.naturalWidth,
      photo.naturalHeight,
      rad,
      adjust ?? DEFAULT_ADJUST
    );
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(
      photo,
      layout.sx,
      layout.sy,
      layout.sw,
      layout.sh,
      cx - rad,
      cy - rad,
      rad * 2,
      rad * 2
    );
  } else {
    ctx.fillStyle = COLORS.inkDeep;
    ctx.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
    drawSun(ctx, cx, cy - 20, 80, COLORS.sun, COLORS.sunDeep);
    drawText(ctx, {
      text: "PHOTO",
      x: cx,
      y: cy + 100,
      font: `700 32px ${FONT.mono}`,
      color: COLORS.cream,
      align: "center",
      baseline: "middle",
      letterSpacing: 0.3
    });
  }
  ctx.restore();
  ctx.strokeStyle = COLORS.pink;
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.arc(cx, cy, rad + 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, rad + 24, 0, Math.PI * 2);
  ctx.stroke();
  drawStar(ctx, cx, cy - rad - 24, 12, COLORS.pink);
  const bs = getBuilderStamp();
  drawRoundStamp(ctx, {
    cx: bs.cx,
    cy: bs.cy,
    r: bs.r,
    border: COLORS.ink,
    text: "BUILDER",
    textColor: COLORS.ink,
    textFont: `700 10px ${FONT.mono}`,
    sub: `No. ${String(builderNo).padStart(3, "0")}`,
    subFont: `700 18px ${FONT.mono}`
  });
  const ss = getShipSticker();
  drawCornerSticker(ctx, ss.x, ss.y, COLORS.sun, COLORS.ink, "BUILD \xB7 SHIP \xB7 REPEAT", -0.07);
  const st = getStarSticker();
  drawStarBurst(ctx, st.cx, st.cy, st.r, COLORS.pink, COLORS.sun, "\u2605 VIBE");
  const lp = getLocationPin();
  drawText(ctx, {
    text: "\u25C7 ANJUNA BEACH \xB7 GOA",
    x: lp.x,
    y: lp.y,
    font: `700 12px ${FONT.mono}`,
    color: COLORS.stamp,
    align: "left",
    baseline: "middle",
    letterSpacing: 0.22
  });
  drawText(ctx, {
    text: "\xB7  BE HERE NOW  \xB7",
    x: lp.x + 196,
    y: lp.y,
    font: `700 12px ${FONT.mono}`,
    color: COLORS.pink,
    align: "left",
    baseline: "middle",
    letterSpacing: 0.22
  });
}
function drawNameBlock(ctx, name, stack) {
  const nb = getNameBlock();
  const wavy = getNameBlockWavy();
  ctx.fillStyle = COLORS.cream;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, wavy.y);
  for (let x = 0; x <= CARD_W; x += wavy.period / 2) {
    const yy = wavy.y + wavy.amp * Math.sin(x / wavy.period * Math.PI * 2);
    ctx.lineTo(x, yy);
  }
  ctx.lineTo(CARD_W, CARD_H);
  ctx.lineTo(0, CARD_H);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = COLORS.sun;
  ctx.fillRect(nb.barLeft.x, nb.barLeft.y, nb.barLeft.w, nb.barLeft.h);
  ctx.fillStyle = COLORS.sun;
  ctx.beginPath();
  ctx.arc(CARD_W - 30, nb.top + 30, 14, 0, Math.PI * 2);
  ctx.fill();
  drawText(ctx, {
    text: "BUILDER ID \xB7 NO. 028 / 247",
    x: 32,
    y: nb.eyebrow,
    font: `700 12px ${FONT.mono}`,
    color: COLORS.sun,
    align: "left",
    baseline: "middle",
    letterSpacing: 0.26
  });
  drawText(ctx, {
    text: "\u21BB TRY ANOTHER TITLE",
    x: CARD_W - 32,
    y: nb.eyebrow,
    font: `700 12px ${FONT.mono}`,
    color: COLORS.pink,
    align: "right",
    baseline: "middle",
    letterSpacing: 0.26
  });
  const nameFont = pickFittingFontSize(ctx, name, {
    family: FONT.display,
    weight: 400,
    letterSpacing: -0.01,
    maxWidth: CARD_W - 200,
    // leave room for the bolt accents on either side
    startSize: 160,
    minSize: 64
  });
  drawText(ctx, {
    text: "\u26A1",
    x: 28,
    y: nb.name,
    font: `400 ${nameFont}px ${FONT.display}`,
    color: COLORS.sun,
    align: "left",
    baseline: "middle"
  });
  drawText(ctx, {
    text: name,
    x: 30 + nameFont * 0.5,
    y: nb.name,
    font: `400 ${nameFont}px ${FONT.display}`,
    color: COLORS.ink,
    align: "left",
    baseline: "middle",
    letterSpacing: -0.01
  });
  const nameW = measureTrackedText(
    ctx,
    name,
    `400 ${nameFont}px ${FONT.display}`,
    -0.01
  );
  drawText(ctx, {
    text: "\u26A1",
    x: 30 + nameFont * 0.5 + nameW + nameFont * 0.1,
    y: nb.name,
    font: `400 ${nameFont}px ${FONT.display}`,
    color: COLORS.pink,
    align: "left",
    baseline: "middle"
  });
  ctx.fillStyle = COLORS.pink;
  ctx.fillRect(30 + nameFont * 0.5, nb.underline, Math.min(nameW, CARD_W - 200), 5);
  const stackFontSize = 22;
  drawText(ctx, {
    text: `[ \u26A1 ${stack} \u26A1 ]`,
    x: 32,
    y: nb.stack,
    font: `700 ${stackFontSize}px ${FONT.mono}`,
    color: COLORS.ink,
    align: "left",
    baseline: "middle",
    letterSpacing: 0.28
  });
  drawBarcodeLine(ctx, CARD_W - 240, nb.stack - 12, 200, COLORS.ink);
  drawText(ctx, {
    text: "HH / GOA / 26",
    x: CARD_W - 32,
    y: nb.stack,
    font: `700 12px ${FONT.mono}`,
    color: COLORS.pink,
    align: "right",
    baseline: "middle",
    letterSpacing: 0.26
  });
}
function drawClassBand(ctx, klass, builderNo) {
  const r = getPanelRects().klass;
  ctx.fillStyle = COLORS.pink;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  drawText(ctx, {
    text: "BUILDER CLASS",
    x: 32,
    y: r.y + 30,
    font: `italic 600 20px ${FONT.editorial}`,
    color: COLORS.cream,
    align: "left",
    baseline: "middle",
    letterSpacing: 0.02
  });
  drawText(ctx, {
    text: "\xB7  VIBE  \xB7",
    x: 210,
    y: r.y + 30,
    font: `700 13px ${FONT.mono}`,
    color: COLORS.sun,
    align: "left",
    baseline: "middle",
    letterSpacing: 0.3
  });
  const cbs = getClassBuilderStamp();
  drawRoundStamp(ctx, {
    cx: cbs.cx,
    cy: cbs.cy,
    r: cbs.r,
    border: COLORS.ink,
    text: "BUILDER",
    textColor: COLORS.ink,
    textFont: `700 9px ${FONT.mono}`,
    sub: `No. ${String(builderNo).padStart(3, "0")}`,
    subFont: `700 14px ${FONT.mono}`
  });
  const cs = getClassStarCorner();
  drawCornerSticker(ctx, cs.x + 60, cs.y + 22, COLORS.sun, COLORS.ink, "\u2605 CLASS", 0.08);
  const fontSize = pickFittingFontSize(ctx, klass, {
    family: FONT.display,
    weight: 400,
    letterSpacing: -0.01,
    maxWidth: CARD_W - 220,
    startSize: 130,
    minSize: 44
  });
  drawText(ctx, {
    text: klass,
    x: 32,
    y: r.y + 80 + fontSize / 2,
    font: `400 ${fontSize}px ${FONT.display}`,
    color: COLORS.sun,
    align: "left",
    baseline: "middle",
    letterSpacing: -0.01
  });
  const klassW = measureTrackedText(
    ctx,
    klass,
    `400 ${fontSize}px ${FONT.display}`,
    -0.01
  );
  ctx.fillStyle = COLORS.sun;
  ctx.fillRect(32, r.y + 96 + fontSize * 0.85, Math.min(klassW, CARD_W - 220), 4);
  const rh = getClassRotateHint();
  drawText(ctx, {
    text: "\u21BB TRY ANOTHER",
    x: rh.x,
    y: rh.y,
    font: `700 11px ${FONT.mono}`,
    color: COLORS.cream,
    align: "right",
    baseline: "middle",
    letterSpacing: 0.3
  });
  drawText(ctx, {
    text: "247 BUILDERS \xB7 28\u201431 OCT 2026",
    x: 32,
    y: rh.y,
    font: `700 11px ${FONT.mono}`,
    color: COLORS.cream,
    align: "left",
    baseline: "middle",
    letterSpacing: 0.3
  });
}
function drawFooter(ctx) {
  const r = getPanelRects().footer;
  ctx.fillStyle = COLORS.cream;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  drawDottedLine(ctx, r.x, r.y + 6, r.w, COLORS.ink, 0.4, 8);
  const tear = getFooterTear();
  drawTicketTear(ctx, tear.x, tear.y, tear.w, tear.h, COLORS.ink);
  drawText(ctx, {
    text: "Goa",
    x: 50,
    y: r.y + r.h / 2 + 4,
    font: `italic 600 38px ${FONT.editorial}`,
    color: COLORS.ink,
    align: "left",
    baseline: "middle",
    letterSpacing: -0.02
  });
  drawText(ctx, {
    text: "INDIA",
    x: 138,
    y: r.y + r.h / 2 + 6,
    font: `700 11px ${FONT.mono}`,
    color: COLORS.pink,
    align: "left",
    baseline: "middle",
    letterSpacing: 0.3
  });
  const pm = getFooterPostmark();
  drawPostmark(ctx, pm.cx - pm.w / 2, pm.cy - pm.h / 2, pm.w, pm.h, COLORS.pink, "#FrameInGoa");
  drawText(ctx, {
    text: "#FrameInGoa",
    x: CARD_W - 32,
    y: r.y + 24,
    font: `400 22px ${FONT.display}`,
    color: COLORS.pink,
    align: "right",
    baseline: "middle",
    letterSpacing: -0.01
  });
  drawText(ctx, {
    text: "28\u201431 OCT 2026",
    x: CARD_W - 32,
    y: r.y + 50,
    font: `700 11px ${FONT.mono}`,
    color: COLORS.ink,
    align: "right",
    baseline: "middle",
    letterSpacing: 0.26
  });
  drawText(ctx, {
    text: "HH / GOA / 26",
    x: CARD_W - 32,
    y: r.y + r.h - 12,
    font: `700 10px ${FONT.mono}`,
    color: COLORS.ink,
    align: "right",
    baseline: "middle",
    letterSpacing: 0.26
  });
  drawPalm(ctx, CARD_W - 40, r.y + r.h, 28, COLORS.ink, 0.8);
  drawBird(ctx, CARD_W - 80, r.y + r.h - 30, 0.7, COLORS.ink);
  drawBird(ctx, CARD_W - 52, r.y + r.h - 38, 0.5, COLORS.ink);
  drawDottedLine(ctx, r.x, r.y + r.h - 4, r.w, COLORS.ink, 0.35, 6);
}
function drawSun(ctx, cx, cy, radius, fill, ray) {
  ctx.save();
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = ray;
  ctx.lineWidth = Math.max(3, radius * 0.18);
  ctx.lineCap = "round";
  const rays = 12;
  for (let i = 0; i < rays; i++) {
    const a = i / rays * Math.PI * 2;
    const x1 = cx + Math.cos(a) * (radius + radius * 0.25);
    const y1 = cy + Math.sin(a) * (radius + radius * 0.25);
    const x2 = cx + Math.cos(a) * (radius + radius * 0.55);
    const y2 = cy + Math.sin(a) * (radius + radius * 0.55);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  ctx.restore();
}
function drawPalm(ctx, baseX, baseY, height, color, scale = 1) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  ctx.quadraticCurveTo(baseX + 8 * scale, baseY - height * 0.5, baseX - 4 * scale, baseY - height);
  ctx.lineWidth = 5 * scale;
  ctx.stroke();
  const topX = baseX - 4 * scale;
  const topY = baseY - height;
  const fronds = 8;
  for (let i = 0; i < fronds; i++) {
    const a = -Math.PI / 2 + (i - (fronds - 1) / 2) / fronds * (Math.PI * 0.95);
    const len = height * 0.55;
    const tipX = topX + Math.cos(a) * len;
    const tipY = topY + Math.sin(a) * len;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(
      topX + Math.cos(a) * len * 0.5 + Math.cos(a + 1) * 6,
      topY + Math.sin(a) * len * 0.5 + Math.sin(a + 1) * 6,
      tipX,
      tipY
    );
    ctx.lineWidth = 5 * scale;
    ctx.stroke();
  }
  ctx.fillStyle = color;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.arc(topX + i * 6 * scale, topY + 6 * scale, 4 * scale, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
function drawStar(ctx, cx, cy, r, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  const spikes = 5;
  const outer = r;
  const inner = r * 0.45;
  let rot = -Math.PI / 2;
  ctx.moveTo(cx + Math.cos(rot) * outer, cy + Math.sin(rot) * outer);
  for (let i = 0; i < spikes; i++) {
    rot += Math.PI / spikes;
    ctx.lineTo(cx + Math.cos(rot) * inner, cy + Math.sin(rot) * inner);
    rot += Math.PI / spikes;
    ctx.lineTo(cx + Math.cos(rot) * outer, cy + Math.sin(rot) * outer);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
function drawRoundStamp(ctx, opts) {
  ctx.save();
  ctx.strokeStyle = opts.border;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(opts.cx, opts.cy, opts.r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(opts.cx, opts.cy, opts.r - 5, 0, Math.PI * 2);
  ctx.stroke();
  drawText(ctx, {
    text: opts.text,
    x: opts.cx,
    y: opts.cy - (opts.sub ? 6 : 0),
    font: opts.textFont,
    color: opts.textColor,
    align: "center",
    baseline: "middle",
    letterSpacing: 0.18
  });
  if (opts.sub && opts.subFont) {
    drawText(ctx, {
      text: opts.sub,
      x: opts.cx,
      y: opts.cy + 12,
      font: opts.subFont,
      color: opts.textColor,
      align: "center",
      baseline: "middle",
      letterSpacing: 0.1
    });
  }
  ctx.restore();
}
function drawCornerSticker(ctx, anchorX, anchorY, bg, fg, text, rotation = 0.05) {
  ctx.save();
  const font = `700 16px ${FONT.mono}`;
  ctx.font = font;
  const w = measureTrackedText(ctx, text, font, 0.2) + 28;
  const h = 32;
  ctx.translate(anchorX, anchorY);
  ctx.rotate(rotation);
  ctx.fillStyle = bg;
  roundRect(ctx, -w, -h / 2, w, h, 6);
  ctx.fill();
  ctx.strokeStyle = fg;
  ctx.lineWidth = 1.5;
  roundRect(ctx, -w, -h / 2, w, h, 6);
  ctx.stroke();
  drawText(ctx, {
    text,
    x: -w / 2,
    y: 0,
    font,
    color: fg,
    align: "center",
    baseline: "middle",
    letterSpacing: 0.2
  });
  ctx.restore();
}
function drawStarBurst(ctx, cx, cy, r, bg, accent, text) {
  ctx.save();
  const spikes = 12;
  const outer = r + 8;
  const inner = r * 0.85;
  ctx.fillStyle = bg;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const ang = i / (spikes * 2) * Math.PI * 2 - Math.PI / 2;
    const rad = i % 2 === 0 ? outer : inner;
    const x = cx + Math.cos(ang) * rad;
    const y = cy + Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.stroke();
  drawText(ctx, {
    text,
    x: cx,
    y: cy,
    font: `700 14px ${FONT.mono}`,
    color: accent,
    align: "center",
    baseline: "middle",
    letterSpacing: 0.2
  });
  ctx.restore();
}
function drawPostmark(ctx, x, y, w, h, color, text) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  const period = 8;
  const amp = 3;
  ctx.beginPath();
  for (let i = 0; i <= w; i += period) {
    const yy = y + amp * Math.sin(i / period * Math.PI * 2);
    if (i === 0) ctx.moveTo(x + i, yy);
    else ctx.lineTo(x + i, yy);
  }
  for (let i = w; i >= 0; i -= period) {
    const yy = y + h - amp * Math.sin(i / period * Math.PI * 2);
    ctx.lineTo(x + i, yy);
  }
  ctx.closePath();
  ctx.stroke();
  drawText(ctx, {
    text,
    x: x + w / 2,
    y: y + h / 2 + 4,
    font: `400 22px ${FONT.display}`,
    color,
    align: "center",
    baseline: "middle",
    letterSpacing: -0.01
  });
  ctx.restore();
}
function drawTicketTear(ctx, x, y, w, h, color) {
  ctx.save();
  ctx.fillStyle = color;
  const period = 12;
  for (let i = 0; i < h; i += period) {
    ctx.fillRect(x, y + i, w, period / 2);
  }
  ctx.restore();
}
function drawScooter(ctx, x, y, scale, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2 * scale;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.arc(x + 10, y + 16, 6 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + 38, y + 16, 6 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + 4, y + 14);
  ctx.lineTo(x + 4, y + 6);
  ctx.quadraticCurveTo(x + 4, y, x + 10, y);
  ctx.lineTo(x + 32, y);
  ctx.quadraticCurveTo(x + 42, y, x + 44, y + 6);
  ctx.lineTo(x + 44, y + 14);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + 36, y);
  ctx.lineTo(x + 40, y - 6 * scale);
  ctx.lineWidth = 2.5 * scale;
  ctx.stroke();
  ctx.fillRect(x + 12, y - 2, 12 * scale, 3);
  ctx.restore();
}
function drawSurfboard(ctx, x, y, scale, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.translate(x, y);
  ctx.rotate(-0.45);
  ctx.ellipse(0, 0, 24 * scale, 6 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.cream;
  ctx.ellipse(0, 0, 20 * scale, 1.4 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
function drawBird(ctx, x, y, scale, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2 * scale;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x - 6 * scale, y);
  ctx.quadraticCurveTo(x - 3 * scale, y - 4 * scale, x, y);
  ctx.quadraticCurveTo(x + 3 * scale, y - 4 * scale, x + 6 * scale, y);
  ctx.stroke();
  ctx.restore();
}
function drawRouteDots(ctx, x1, y1, x2, y2, color, spacing, radius) {
  ctx.save();
  ctx.fillStyle = color;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const steps = Math.floor(dist / spacing);
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    const px = x1 + dx * t;
    const py = y1 + dy * t;
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
function drawWavePattern(ctx, x, y, w, h, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  for (let row = 0; row < 2; row++) {
    ctx.beginPath();
    const yy = y + row * 12;
    ctx.moveTo(x, yy);
    for (let i = 0; i <= w; i += 12) {
      const off = Math.sin(i / 12 * Math.PI) * 4;
      ctx.lineTo(x + i, yy + off);
    }
    ctx.globalAlpha = 0.7;
    ctx.stroke();
  }
  ctx.restore();
}
function drawDottedLine(ctx, x, y, w, color, alpha, gap) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  for (let i = 0; i < w; i += gap) {
    ctx.fillRect(x + i, y, gap / 2, 2);
  }
  ctx.restore();
}
function drawPerforatedLine(ctx, x, y, w, _h, color, period, hole) {
  ctx.save();
  ctx.fillStyle = color;
  let cx = x;
  while (cx < x + w) {
    ctx.fillRect(cx, y, hole, 4);
    cx += period;
  }
  ctx.restore();
}
function drawBarcodeLine(ctx, x, y, w, color) {
  ctx.save();
  ctx.fillStyle = color;
  let cx = x;
  let s = 7;
  while (cx < x + w) {
    s = (s * 9301 + 49297) % 233280;
    const wide = s % 7 === 0;
    const bw = wide ? 3 : 1;
    ctx.fillRect(cx, y, bw, 14);
    cx += bw + 2;
  }
  ctx.restore();
}
function drawText(ctx, opts) {
  ctx.save();
  ctx.font = opts.font;
  ctx.fillStyle = opts.color;
  ctx.textAlign = opts.align ?? "left";
  ctx.textBaseline = opts.baseline ?? "alphabetic";
  const ls = opts.letterSpacing ?? 0;
  if (ls !== 0) {
    const chars = Array.from(opts.text);
    const widths = chars.map((c) => ctx.measureText(c).width);
    const fontSize = parseFloat(opts.font);
    const totalWidth = widths.reduce((a, b) => a + b, 0) + ls * (chars.length - 1) * fontSize;
    let startX = opts.x;
    if (opts.align === "center") startX = opts.x - totalWidth / 2;
    else if (opts.align === "right") startX = opts.x - totalWidth;
    let cursorX = startX;
    for (let i = 0; i < chars.length; i++) {
      ctx.fillText(chars[i], cursorX, opts.y);
      cursorX += widths[i] + ls * fontSize;
    }
  } else {
    ctx.fillText(opts.text, opts.x, opts.y);
  }
  ctx.restore();
}
function measureTrackedText(ctx, text, font, letterSpacing) {
  ctx.save();
  ctx.font = font;
  const widths = Array.from(text).map((c) => ctx.measureText(c).width);
  const fontSize = parseFloat(font);
  const w = widths.reduce((a, b) => a + b, 0) + letterSpacing * (text.length - 1) * fontSize;
  ctx.restore();
  return w;
}
function roundRect(ctx, x, y, w, h, rad) {
  const r = Math.min(rad, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
function pickFittingFontSize(ctx, text, opts) {
  let size = opts.startSize;
  while (size > opts.minSize) {
    const font = `${opts.weight} ${Math.round(size)}px ${opts.family}`;
    const w = measureTrackedText(ctx, text, font, opts.letterSpacing);
    if (w <= opts.maxWidth) return Math.round(size);
    size -= 2;
  }
  return opts.minSize;
}
function canvasToPngDataUrl(canvas) {
  return canvas.toDataURL("image/png");
}

// src/lib/teamExport.ts
var HEADER_H = 200;
var GOA_H = 160;
var CREW_TOP = HEADER_H + GOA_H;
var CREW_H = 470;
var CREW_BOTTOM = CREW_TOP + CREW_H;
var NAME_H = 180;
var NAME_TOP = CREW_BOTTOM;
var CLASS_H = 160;
var CLASS_TOP = NAME_TOP + NAME_H;
var FOOTER_H = CARD_H - (CLASS_TOP + CLASS_H);
var FOOTER_TOP = CARD_H - FOOTER_H;
function renderTeamPosterToCanvas(data) {
  const canvas = document.createElement("canvas");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get a 2D drawing context.");
  drawBackground2(ctx);
  drawHeader2(ctx, data);
  drawGoaScene2(ctx);
  drawCrew(ctx, data);
  drawNameStrip(ctx, data);
  drawClassStrip(ctx, data);
  drawFooter2(ctx);
  return canvas;
}
function drawBackground2(ctx) {
  ctx.fillStyle = COLORS.cream;
  ctx.fillRect(0, 0, CARD_W, CARD_H);
  ctx.save();
  ctx.fillStyle = "rgba(58, 42, 20, 0.05)";
  let s = 1337;
  for (let i = 0; i < 1100; i++) {
    s = (s * 9301 + 49297) % 233280;
    const x = s / 233280 * CARD_W;
    s = (s * 9301 + 49297) % 233280;
    const y = s / 233280 * CARD_H;
    s = (s * 9301 + 49297) % 233280;
    const r = 0.5 + s / 233280 * 1.4;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.fillStyle = COLORS.ink;
  ctx.fillRect(0, 0, CARD_W, 10);
  ctx.fillRect(0, CARD_H - 10, CARD_W, 10);
  ctx.fillRect(0, 0, 10, CARD_H);
  ctx.fillRect(CARD_W - 10, 0, 10, CARD_H);
}
function drawHeader2(ctx, data) {
  ctx.fillStyle = COLORS.ink;
  ctx.fillRect(0, 0, CARD_W, HEADER_H);
  const tagSize = 110;
  ctx.fillStyle = COLORS.sun;
  ctx.fillRect(0, 0, tagSize, tagSize);
  drawText2(ctx, {
    text: "HH",
    x: tagSize / 2,
    y: tagSize / 2 - 8,
    font: `400 ${Math.round(tagSize * 0.55)}px ${FONT.display}`,
    color: COLORS.ink,
    align: "center",
    baseline: "middle",
    letterSpacing: -0.04
  });
  drawText2(ctx, {
    text: "EST. 2026",
    x: tagSize / 2,
    y: tagSize - 16,
    font: `700 10px ${FONT.mono}`,
    color: COLORS.ink,
    align: "center",
    baseline: "middle",
    letterSpacing: 0.2
  });
  drawText2(ctx, {
    text: "Hacker House",
    x: tagSize + 30,
    y: 56,
    font: `italic 600 54px ${FONT.editorialItalic}`,
    color: COLORS.cream,
    align: "left",
    baseline: "middle",
    letterSpacing: -0.01
  });
  drawText2(ctx, {
    text: "CREW \xB7 GOA \xB7 INDIA",
    x: tagSize + 30,
    y: 102,
    font: `700 16px ${FONT.mono}`,
    color: COLORS.sun,
    align: "left",
    baseline: "middle",
    letterSpacing: 0.28
  });
  drawText2(ctx, {
    text: `${data.members.length} BUILDERS \xB7 CURRENTLY SHIPPING \xB7 BUILD \xB7 SHIP \xB7 REPEAT`,
    x: tagSize + 30,
    y: 138,
    font: `700 11px ${FONT.mono}`,
    color: COLORS.pink,
    align: "left",
    baseline: "middle",
    letterSpacing: 0.24
  });
  const rightX = CARD_W - 36;
  drawText2(ctx, {
    text: "28\u201431",
    x: rightX,
    y: 46,
    font: `700 36px ${FONT.display}`,
    color: COLORS.sun,
    align: "right",
    baseline: "middle",
    letterSpacing: -0.01
  });
  drawText2(ctx, {
    text: "OCT 2026",
    x: rightX,
    y: 86,
    font: `700 14px ${FONT.mono}`,
    color: COLORS.cream,
    align: "right",
    baseline: "middle",
    letterSpacing: 0.22
  });
  drawText2(ctx, {
    text: "GOA \xB7 INDIA",
    x: rightX,
    y: 112,
    font: `700 11px ${FONT.mono}`,
    color: COLORS.pink,
    align: "right",
    baseline: "middle",
    letterSpacing: 0.22
  });
  drawRoundStampLocal(ctx, {
    cx: CARD_W - 168,
    cy: 48,
    r: 36,
    color: COLORS.pink,
    text: "TKT",
    sub: `No. ${String(data.members[0]?.builderNumber ?? 28).padStart(3, "0")}`
  });
  ctx.fillStyle = COLORS.cream;
  ctx.fillRect(0, 156, CARD_W, 44);
  drawText2(ctx, {
    text: (data.teamName || "BUILDER CREW").toUpperCase() + "  \xB7  CREW",
    x: CARD_W / 2,
    y: 178,
    font: `400 26px ${FONT.display}`,
    color: COLORS.ink,
    align: "center",
    baseline: "middle",
    letterSpacing: -5e-3
  });
}
function drawGoaScene2(ctx) {
  const r = { x: 0, y: HEADER_H, w: CARD_W, h: GOA_H };
  ctx.fillStyle = COLORS.cream;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  drawText2(ctx, {
    text: "GOA \xB7 15.5\xB0 N \xB7 73.8\xB0 E",
    x: r.x + 16,
    y: r.y + 18,
    font: `700 11px ${FONT.mono}`,
    color: COLORS.stamp,
    align: "left",
    baseline: "middle",
    letterSpacing: 0.22
  });
  drawText2(ctx, {
    text: "ARABIAN SEA",
    x: r.x + r.w - 16,
    y: r.y + 18,
    font: `700 11px ${FONT.mono}`,
    color: COLORS.stamp,
    align: "right",
    baseline: "middle",
    letterSpacing: 0.22
  });
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(10, r.y + 100);
  ctx.lineTo(130, r.y + 70);
  ctx.lineTo(250, r.y + 92);
  ctx.lineTo(370, r.y + 60);
  ctx.lineTo(490, r.y + 86);
  ctx.lineTo(630, r.y + 66);
  ctx.lineTo(770, r.y + 90);
  ctx.lineTo(910, r.y + 72);
  ctx.lineTo(CARD_W - 10, r.y + 96);
  ctx.lineTo(CARD_W - 10, r.y + 120);
  ctx.lineTo(10, r.y + 120);
  ctx.closePath();
  ctx.fillStyle = COLORS.ink;
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(10, r.y + 110);
  for (let x = 10; x <= CARD_W - 10; x += 14) {
    const yy = r.y + 110 - Math.abs(Math.sin((x - 10) / 22)) * 4;
    ctx.lineTo(x, yy);
  }
  ctx.strokeStyle = COLORS.sun;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
  drawPalm2(ctx, 90, r.y + r.h - 6, 90, COLORS.stamp, 1);
  drawPalm2(ctx, 220, r.y + r.h - 4, 60, COLORS.ink, 0.85);
  drawPalm2(ctx, CARD_W - 220, r.y + r.h - 6, 72, COLORS.ink, 0.9);
  drawRouteDots2(ctx, 30, r.y + 130, CARD_W - 30, r.y + 130, COLORS.pink, 8, 4);
  drawText2(ctx, {
    text: "ROUTE \xB7 BAGA \u2192 ANJUNA \u2192 PALOLEM",
    x: CARD_W / 2,
    y: r.y + 118,
    font: `700 10px ${FONT.mono}`,
    color: COLORS.pink,
    align: "center",
    baseline: "middle",
    letterSpacing: 0.3
  });
  drawScooter2(ctx, CARD_W * 0.55 - 30, r.y + 124, 1.4, COLORS.ink);
}
function drawCrew(ctx, data) {
  const r = { x: 0, y: CREW_TOP, w: CARD_W, h: CREW_H };
  ctx.fillStyle = COLORS.cream;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  drawWavePattern2(ctx, r.x + 20, r.y + r.h - 90, r.w - 40, 24, COLORS.pink);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, CREW_TOP - 30, CARD_W, 230);
  ctx.clip();
  drawSun2(ctx, CARD_W - 200, CREW_TOP + 60, 70, COLORS.sun, COLORS.sunDeep);
  ctx.restore();
  drawPalm2(ctx, 60, CREW_TOP + 90, 130, COLORS.stamp, 1);
  drawPalm2(ctx, CARD_W - 60, CREW_TOP + 90, 130, COLORS.stamp, 1);
  const slots = [0, 1, 2].map((i) => data.members[i] ?? null);
  const slotW = CARD_W / 3;
  const cy = CREW_TOP + 230;
  const r2 = 150;
  for (let i = 0; i < 3; i++) {
    const cx = slotW * i + slotW / 2;
    drawMemberSlot(ctx, slots[i], cx, cy, r2, data.members[i]?.builderNumber ?? 28);
  }
  drawText2(ctx, {
    text: "\xB7  ANJUNA \xB7 GOA  \xB7",
    x: CARD_W / 2,
    y: CREW_BOTTOM - 26,
    font: `700 14px ${FONT.mono}`,
    color: COLORS.pink,
    align: "center",
    baseline: "middle",
    letterSpacing: 0.3
  });
  drawText2(ctx, {
    text: "CURRENTLY SHIPPING TOGETHER  \xB7  HH/GOA/26",
    x: CARD_W / 2,
    y: CREW_BOTTOM - 8,
    font: `700 10px ${FONT.mono}`,
    color: COLORS.stamp,
    align: "center",
    baseline: "middle",
    letterSpacing: 0.26
  });
}
function drawMemberSlot(ctx, m, cx, cy, r, builderNo) {
  const plateW = 320;
  const plateH = 240;
  ctx.save();
  ctx.translate(cx, cy - 10);
  ctx.rotate(-0.04);
  ctx.fillStyle = COLORS.pink;
  ctx.fillRect(-plateW / 2, -plateH / 2, plateW, plateH);
  ctx.fillStyle = COLORS.cream;
  ctx.fillRect(-plateW / 2 + 12, -plateH / 2 + 12, plateW - 24, plateH - 24);
  ctx.restore();
  ctx.fillStyle = COLORS.sun;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  if (m && m.photo && m.photo.naturalWidth > 0) {
    const adj = m.adjust ?? DEFAULT_ADJUST;
    const layout = computeCoverLayout(m.photo.naturalWidth, m.photo.naturalHeight, r * 2, r * 2, adj);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(m.photo, layout.sx, layout.sy, layout.sw, layout.sh, cx - r, cy - r, r * 2, r * 2);
  } else {
    ctx.fillStyle = COLORS.inkDeep;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    drawSun2(ctx, cx, cy - 20, 50, COLORS.sun, COLORS.sunDeep);
    drawText2(ctx, {
      text: "PHOTO",
      x: cx,
      y: cy + 60,
      font: `700 24px ${FONT.mono}`,
      color: COLORS.cream,
      align: "center",
      baseline: "middle",
      letterSpacing: 0.3
    });
  }
  ctx.restore();
  ctx.strokeStyle = COLORS.pink;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 18, 0, Math.PI * 2);
  ctx.stroke();
  drawStar2(ctx, cx, cy - r - 18, 10, COLORS.pink);
  drawRoundStampLocal(ctx, {
    cx,
    cy: cy - r - 50,
    r: 30,
    color: COLORS.ink,
    text: "BUILDER",
    sub: `No. ${String(builderNo).padStart(3, "0")}`,
    subFont: 13
  });
}
function drawNameStrip(ctx, data) {
  ctx.fillStyle = COLORS.cream;
  ctx.save();
  ctx.beginPath();
  const wavyY = NAME_TOP;
  ctx.moveTo(0, wavyY);
  for (let x = 0; x <= CARD_W; x += 32) {
    const yy = wavyY + 18 * Math.sin(x / 64 * Math.PI * 2);
    ctx.lineTo(x, yy);
  }
  ctx.lineTo(CARD_W, CARD_H);
  ctx.lineTo(0, CARD_H);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = COLORS.sun;
  ctx.fillRect(0, wavyY + 18, 14, NAME_H - 18);
  drawText2(ctx, {
    text: "HH CREW \xB7 BUILDER ID \xB7 NO. 028 / 247",
    x: 32,
    y: wavyY + 30,
    font: `700 11px ${FONT.mono}`,
    color: COLORS.sun,
    align: "left",
    baseline: "middle",
    letterSpacing: 0.26
  });
  const slots = [0, 1, 2].map((i) => data.members[i] ?? null);
  const slotW = CARD_W / 3;
  for (let i = 0; i < 3; i++) {
    const cx = slotW * i + slotW / 2;
    const m = slots[i];
    const name = (m?.name || "BUILDER").toUpperCase();
    const stack = (m?.stackOrRole || "BUILDER").toUpperCase();
    const nameFont = pickFittingFontSizeLocal(ctx, name, {
      family: FONT.display,
      weight: 400,
      letterSpacing: -0.01,
      maxWidth: slotW - 30,
      startSize: 64,
      minSize: 24
    });
    drawText2(ctx, {
      text: "\u26A1",
      x: cx - nameFont * 0.55,
      y: wavyY + 90,
      font: `400 ${nameFont}px ${FONT.display}`,
      color: COLORS.sun,
      align: "center",
      baseline: "middle"
    });
    drawText2(ctx, {
      text: name,
      x: cx,
      y: wavyY + 90,
      font: `400 ${nameFont}px ${FONT.display}`,
      color: COLORS.ink,
      align: "center",
      baseline: "middle",
      letterSpacing: -0.01
    });
    drawText2(ctx, {
      text: "\u26A1",
      x: cx + nameFont * 0.55,
      y: wavyY + 90,
      font: `400 ${nameFont}px ${FONT.display}`,
      color: COLORS.pink,
      align: "center",
      baseline: "middle"
    });
    drawText2(ctx, {
      text: `[ \u26A1 ${stack} \u26A1 ]`,
      x: cx,
      y: wavyY + NAME_H - 26,
      font: `700 16px ${FONT.mono}`,
      color: COLORS.ink,
      align: "center",
      baseline: "middle",
      letterSpacing: 0.22
    });
  }
}
function drawClassStrip(ctx, data) {
  ctx.fillStyle = COLORS.pink;
  ctx.fillRect(0, CLASS_TOP, CARD_W, CLASS_H);
  drawText2(ctx, {
    text: "\u2014 BUILDER CLASSES \u2014",
    x: CARD_W / 2,
    y: CLASS_TOP + 30,
    font: `italic 600 18px ${FONT.editorial}`,
    color: COLORS.cream,
    align: "center",
    baseline: "middle"
  });
  drawText2(ctx, {
    text: "247 BUILDERS \xB7 28\u201431 OCT 2026",
    x: CARD_W / 2,
    y: CLASS_TOP + 56,
    font: `700 11px ${FONT.mono}`,
    color: COLORS.sun,
    align: "center",
    baseline: "middle",
    letterSpacing: 0.3
  });
  const slots = [0, 1, 2].map((i) => data.members[i]?.builderClass || "THE BUILDER");
  const slotW = CARD_W / 3;
  for (let i = 0; i < 3; i++) {
    const cx = slotW * i + slotW / 2;
    const klass = slots[i].toUpperCase();
    const fontSize = pickFittingFontSizeLocal(ctx, klass, {
      family: FONT.display,
      weight: 400,
      letterSpacing: -0.01,
      maxWidth: slotW - 24,
      startSize: 56,
      minSize: 18
    });
    drawText2(ctx, {
      text: klass,
      x: cx,
      y: CLASS_TOP + 96 + fontSize / 2,
      font: `400 ${fontSize}px ${FONT.display}`,
      color: COLORS.sun,
      align: "center",
      baseline: "middle",
      letterSpacing: -0.01
    });
  }
}
function drawFooter2(ctx) {
  const r = { x: 0, y: FOOTER_TOP, w: CARD_W, h: FOOTER_H };
  ctx.fillStyle = COLORS.cream;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  drawDottedLineLocal(ctx, r.x, r.y + 6, r.w, COLORS.ink, 0.4, 8, 2);
  for (let i = 0; i < r.h; i += 12) {
    ctx.fillStyle = COLORS.ink;
    ctx.fillRect(r.x, r.y + i, 24, 6);
  }
  drawText2(ctx, {
    text: "Goa",
    x: r.x + 56,
    y: r.y + r.h / 2 + 4,
    font: `italic 600 38px ${FONT.editorial}`,
    color: COLORS.ink,
    align: "left",
    baseline: "middle",
    letterSpacing: -0.02
  });
  drawText2(ctx, {
    text: "INDIA",
    x: r.x + 138,
    y: r.y + r.h / 2 + 6,
    font: `700 11px ${FONT.mono}`,
    color: COLORS.pink,
    align: "left",
    baseline: "middle",
    letterSpacing: 0.3
  });
  drawText2(ctx, {
    text: "#FrameInGoa",
    x: r.x + r.w - 36,
    y: r.y + 24,
    font: `400 22px ${FONT.display}`,
    color: COLORS.pink,
    align: "right",
    baseline: "middle",
    letterSpacing: -0.01
  });
  drawText2(ctx, {
    text: "28\u201431 OCT 2026",
    x: r.x + r.w - 36,
    y: r.y + 50,
    font: `700 11px ${FONT.mono}`,
    color: COLORS.ink,
    align: "right",
    baseline: "middle",
    letterSpacing: 0.26
  });
  drawText2(ctx, {
    text: "HH / GOA / 26",
    x: r.x + r.w - 36,
    y: r.y + r.h - 12,
    font: `700 10px ${FONT.mono}`,
    color: COLORS.ink,
    align: "right",
    baseline: "middle",
    letterSpacing: 0.26
  });
  drawPalm2(ctx, 30, r.y + r.h, 32, COLORS.ink, 0.8);
  drawBird2(ctx, CARD_W - 80, r.y + r.h - 30, 0.7, COLORS.ink);
  drawBird2(ctx, CARD_W - 52, r.y + r.h - 38, 0.5, COLORS.ink);
  drawDottedLineLocal(ctx, r.x, r.y + r.h - 4, r.w, COLORS.ink, 0.35, 6, 2);
}
function drawSun2(ctx, cx, cy, radius, fill, ray) {
  ctx.save();
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = ray;
  ctx.lineWidth = Math.max(3, radius * 0.18);
  ctx.lineCap = "round";
  const rays = 12;
  for (let i = 0; i < rays; i++) {
    const a = i / rays * Math.PI * 2;
    const x1 = cx + Math.cos(a) * (radius + radius * 0.25);
    const y1 = cy + Math.sin(a) * (radius + radius * 0.25);
    const x2 = cx + Math.cos(a) * (radius + radius * 0.55);
    const y2 = cy + Math.sin(a) * (radius + radius * 0.55);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  ctx.restore();
}
function drawPalm2(ctx, baseX, baseY, height, color, scale = 1) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  ctx.quadraticCurveTo(baseX + 8 * scale, baseY - height * 0.5, baseX - 4 * scale, baseY - height);
  ctx.lineWidth = 5 * scale;
  ctx.stroke();
  const topX = baseX - 4 * scale;
  const topY = baseY - height;
  const fronds = 8;
  for (let i = 0; i < fronds; i++) {
    const a = -Math.PI / 2 + (i - (fronds - 1) / 2) / fronds * (Math.PI * 0.95);
    const len = height * 0.55;
    const tipX = topX + Math.cos(a) * len;
    const tipY = topY + Math.sin(a) * len;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(
      topX + Math.cos(a) * len * 0.5 + Math.cos(a + 1) * 6,
      topY + Math.sin(a) * len * 0.5 + Math.sin(a + 1) * 6,
      tipX,
      tipY
    );
    ctx.lineWidth = 5 * scale;
    ctx.stroke();
  }
  ctx.fillStyle = color;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.arc(topX + i * 6 * scale, topY + 6 * scale, 4 * scale, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
function drawStar2(ctx, cx, cy, r, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  const spikes = 5;
  const outer = r;
  const inner = r * 0.45;
  let rot = -Math.PI / 2;
  ctx.moveTo(cx + Math.cos(rot) * outer, cy + Math.sin(rot) * outer);
  for (let i = 0; i < spikes; i++) {
    rot += Math.PI / spikes;
    ctx.lineTo(cx + Math.cos(rot) * inner, cy + Math.sin(rot) * inner);
    rot += Math.PI / spikes;
    ctx.lineTo(cx + Math.cos(rot) * outer, cy + Math.sin(rot) * outer);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
function drawBird2(ctx, x, y, scale, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2 * scale;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x - 6 * scale, y);
  ctx.quadraticCurveTo(x - 3 * scale, y - 4 * scale, x, y);
  ctx.quadraticCurveTo(x + 3 * scale, y - 4 * scale, x + 6 * scale, y);
  ctx.stroke();
  ctx.restore();
}
function drawScooter2(ctx, x, y, scale, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2 * scale;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.arc(x + 10, y + 16, 6 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + 38, y + 16, 6 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + 4, y + 14);
  ctx.lineTo(x + 4, y + 6);
  ctx.quadraticCurveTo(x + 4, y, x + 10, y);
  ctx.lineTo(x + 32, y);
  ctx.quadraticCurveTo(x + 42, y, x + 44, y + 6);
  ctx.lineTo(x + 44, y + 14);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + 36, y);
  ctx.lineTo(x + 40, y - 6 * scale);
  ctx.lineWidth = 2.5 * scale;
  ctx.stroke();
  ctx.fillRect(x + 12, y - 2, 12 * scale, 3);
  ctx.restore();
}
function drawRouteDots2(ctx, x1, y1, x2, y2, color, spacing, radius) {
  ctx.save();
  ctx.fillStyle = color;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const steps = Math.floor(dist / spacing);
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    const px = x1 + dx * t;
    const py = y1 + dy * t;
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
function drawWavePattern2(ctx, x, y, w, h, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  for (let row = 0; row < 2; row++) {
    ctx.beginPath();
    const yy = y + row * 12;
    ctx.moveTo(x, yy);
    for (let i = 0; i <= w; i += 12) {
      const off = Math.sin(i / 12 * Math.PI) * 4;
      ctx.lineTo(x + i, yy + off);
    }
    ctx.globalAlpha = 0.6;
    ctx.stroke();
  }
  ctx.restore();
}
function drawDottedLineLocal(ctx, x, y, w, color, alpha, gap, fillW) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  for (let i = 0; i < w; i += gap) {
    ctx.fillRect(x + i, y, fillW, 2);
  }
  ctx.restore();
}
function drawRoundStampLocal(ctx, opts) {
  ctx.save();
  ctx.strokeStyle = opts.color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(opts.cx, opts.cy, opts.r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(opts.cx, opts.cy, opts.r - 5, 0, Math.PI * 2);
  ctx.stroke();
  drawText2(ctx, {
    text: opts.text,
    x: opts.cx,
    y: opts.cy - (opts.sub ? 6 : 0),
    font: `700 11px ${FONT.mono}`,
    color: opts.color,
    align: "center",
    baseline: "middle",
    letterSpacing: 0.18
  });
  if (opts.sub) {
    drawText2(ctx, {
      text: opts.sub,
      x: opts.cx,
      y: opts.cy + 12,
      font: `700 ${opts.subFont ?? 18}px ${FONT.mono}`,
      color: opts.color,
      align: "center",
      baseline: "middle",
      letterSpacing: 0.1
    });
  }
  ctx.restore();
}
function drawText2(ctx, opts) {
  ctx.save();
  ctx.font = opts.font;
  ctx.fillStyle = opts.color;
  ctx.textAlign = opts.align ?? "left";
  ctx.textBaseline = opts.baseline ?? "alphabetic";
  const ls = opts.letterSpacing ?? 0;
  if (ls !== 0) {
    const chars = Array.from(opts.text);
    const widths = chars.map((c) => ctx.measureText(c).width);
    const fontSize = parseFloat(opts.font);
    const totalWidth = widths.reduce((a, b) => a + b, 0) + ls * (chars.length - 1) * fontSize;
    let startX = opts.x;
    if (opts.align === "center") startX = opts.x - totalWidth / 2;
    else if (opts.align === "right") startX = opts.x - totalWidth;
    let cursorX = startX;
    for (let i = 0; i < chars.length; i++) {
      ctx.fillText(chars[i], cursorX, opts.y);
      cursorX += widths[i] + ls * fontSize;
    }
  } else {
    ctx.fillText(opts.text, opts.x, opts.y);
  }
  ctx.restore();
}
function measureTrackedLocal(ctx, text, font, letterSpacing) {
  ctx.save();
  ctx.font = font;
  const widths = Array.from(text).map((c) => ctx.measureText(c).width);
  const fontSize = parseFloat(font);
  const w = widths.reduce((a, b) => a + b, 0) + letterSpacing * (text.length - 1) * fontSize;
  ctx.restore();
  return w;
}
function pickFittingFontSizeLocal(ctx, text, opts) {
  let size = opts.startSize;
  while (size > opts.minSize) {
    const font = `${opts.weight} ${Math.round(size)}px ${opts.family}`;
    const w = measureTrackedLocal(ctx, text, font, opts.letterSpacing);
    if (w <= opts.maxWidth) return Math.round(size);
    size -= 2;
  }
  return opts.minSize;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  canvasToPngDataUrl,
  renderBuilderIDToCanvas,
  renderTeamPosterToCanvas
});
