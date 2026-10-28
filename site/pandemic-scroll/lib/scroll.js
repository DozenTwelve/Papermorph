/* scroll.js: the pandemic scroll story. The picture is a pure function of one number, P = k + f: step k (0-based, in
   page order) and the fraction f of the way through it, read from scrollY alone. Every mark on the canvas fades,
   grows or moves over a window of P, so the last frame of a step is the first frame of the next and scrolling back
   plays everything in reverse. The canvas redraws only when P or the canvas size changes. */
'use strict';
const RED = '#e5402f', INK = '#2b2520', SOFT = '#6a6258', NIGHT = '#04060a', CREAM = '#f3ede0', LAND = '#ece3cd', SEA = '#bfcac6',
  CNFILL = '#e3d3b0', LINE = '#9a8a70', URBAN = '#cdb995', RIVER = '#8fa9ad', GREY = '#9a948a';
const KEYF = '"Oswald", "Arial Narrow", sans-serif', SERF = '"EB Garamond", Georgia, serif';

const cv = document.querySelector('.graphic canvas'), ctx = cv.getContext('2d'), GRAIN = document.querySelector('.graphic .grain');
const STEPS = [...document.querySelectorAll('.step')], S = {};
STEPS.forEach((s, i) => { S[s.dataset.key] = i; });
const at = (key, f = 0) => S[key] + f;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');

/* ---------- small maths ---------- */
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ease = t => t * t * (3 - 2 * t);
// 0 before a, 1 after b, eased between: every fade and move on the page is one of these
const ramp = (P, a, b) => ease(clamp((P - a) / (b - a)));
// on over [a, b], off over [c, d]
const win = (P, a, b, c, d) => ramp(P, a, b) * (1 - ramp(P, c, d));
const lerp = (a, b, t) => a + (b - a) * t;
const rng = seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const DAY = 864e5, day = s => Date.parse(s) / DAY;
const fmtDate = (d, withDay = true) => new Date(d * DAY).toLocaleDateString('en-GB', { day: withDay ? 'numeric' : undefined, month: 'long', year: 'numeric', timeZone: 'UTC' }).toUpperCase();
const fmtN = n => Math.round(n).toLocaleString('en-US');

/* ---------- pictures ---------- */
const IMG = {};
['li-wenliang', 'doctor-1', 'doctor-2', 'doctor-3', 'doctor-4', 'doctor-5', 'doctor-6', 'doctor-7', 'no2-china', 'shelves-empty',
  'school-empty-classroom', 'street-glenview-24', 'virus-sem-red', 'airport-pek-empty', 'closed-sign-temporary', 'ppe-nurses-faceshields',
  'mask-cbp-officer', 'street-hwy407', 'mask-hawaii-guard', 'school-closed-banner'].forEach(n => {
  const im = new Image();
  im.onload = () => { drawn = null; schedule(); };
  im.src = `img/${n}.webp`;
  IMG[n] = im;
});
const ready = im => im && im.complete && im.naturalWidth;

/* ---------- map shapes, built once ---------- */
const P2 = d => new Path2D(d);
const CNP = { land: P2(CN.land), china: P2(CN.china), provs: P2(CN.provs), hubei: P2(CN.hubei), rails: P2(CN.rails), rivers: P2(CN.rivers),
  lakes: P2(CN.lakes), urban: P2(CN.urban) };
const ITP = { land: P2(IT.land), ita: P2(IT.ita), lomb: P2(IT.lomb), provs: P2(IT.provs) };
const WC = Object.entries(W.countries).map(([iso, c]) => ({ iso, p: P2(c[0]), home: c[1], dpm: c[2], cx: c[3], cy: c[4] }));
const WALL = new Path2D(); WC.forEach(c => WALL.addPath(c.p));
const CWUHAN = [0, 0], CODOGNO = [0, 0];

/* ---------- canvas, views ---------- */
let cw = 0, chh = 0, dpr = 1, U = 4;
// a view puts world point (x, y) at the centre of a screen box and fits a world radius r into the box's shorter side
function view(box, x, y, r) {
  const s = Math.min(box.w, box.h) / (2 * r);
  return { s, x, y, box, sx: wx => box.x + box.w / 2 + (wx - x) * s, sy: wy => box.y + box.h / 2 + (wy - y) * s };
}
function toWorld(V) { ctx.setTransform(dpr * V.s, 0, 0, dpr * V.s, dpr * (V.box.x + V.box.w / 2 - V.x * V.s), dpr * (V.box.y + V.box.h / 2 - V.y * V.s)); }
function toScreen() { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
// a camera through keys [P, x, y, r]: eased between keys, r changes evenly in log so a dive feels steady
function cam(keys, P) {
  if (P <= keys[0][0]) return keys[0].slice(1);
  for (let i = 1; i < keys.length; i++) {
    if (P <= keys[i][0]) {
      const a = keys[i - 1], b = keys[i], t = ease((P - a[0]) / (b[0] - a[0]));
      return [lerp(a[1], b[1], t), lerp(a[2], b[2], t), Math.exp(lerp(Math.log(a[3]), Math.log(b[3]), t))];
    }
  }
  return keys[keys.length - 1].slice(1);
}
const full = () => ({ x: 0, y: 0, w: cw, h: chh });

// hatching that keeps its screen size at any zoom: a red tint and diagonal strokes, in device px
let HATCH = null, hatchDpr = 0;
function hatch(V) {
  if (!HATCH || hatchDpr !== dpr) {
    const n = Math.round(7 * dpr), c = document.createElement('canvas'); c.width = c.height = n;
    const g = c.getContext('2d'); g.fillStyle = 'rgba(229,64,47,.18)'; g.fillRect(0, 0, n, n);
    g.strokeStyle = RED; g.lineWidth = n * .3;
    g.beginPath(); for (let k = -1; k <= 1; k++) { g.moveTo(k * n, n); g.lineTo(k * n + n, 0); } g.stroke();
    HATCH = ctx.createPattern(c, 'repeat'); hatchDpr = dpr;
  }
  HATCH.setTransform(new DOMMatrix().scale(1 / (dpr * V.s)));
  return HATCH;
}

/* ---------- drawing helpers (screen px) ---------- */
const fs = n => n * U;   // a type size in the page's unit: ~1/100 of the graphic's shorter side, within bounds
function text(str, x, y, { size = 4, font = KEYF, weight = 500, fill = INK, align = 'left', base = 'alphabetic', a = 1, italic = false, spacing = 0 } = {}) {
  if (a <= 0) return;
  ctx.globalAlpha = a; ctx.fillStyle = fill; ctx.textAlign = align; ctx.textBaseline = base;
  ctx.font = `${italic ? 'italic ' : ''}${weight} ${fs(size)}px ${font}`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = spacing ? `${spacing * fs(size)}px` : '0px';
  ctx.fillText(str, x, y);
  ctx.globalAlpha = 1;
}
// a label on a paper chip (the film's chipLabel): returns its box
function chip(str, x, y, { size = 3.6, fill = INK, bg = CREAM, align = 'left', a = 1, font = KEYF, weight = 500 } = {}) {
  if (a <= 0) return;
  ctx.font = `${weight} ${fs(size)}px ${font}`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${.06 * fs(size)}px`;
  const w = ctx.measureText(str).width, pad = fs(size) * .45, h = fs(size) * 1.5;
  // kept inside the canvas: a label near the edge slides in rather than losing its words
  const x0 = clamp(align === 'center' ? x - w / 2 - pad : align === 'right' ? x - w - 2 * pad : x, 4, Math.max(4, cw - w - 2 * pad - 4));
  ctx.globalAlpha = a * .94; ctx.fillStyle = bg; ctx.fillRect(x0, y - h / 2, w + 2 * pad, h);
  text(str, x0 + pad, y, { size, fill, base: 'middle', a, font, weight, spacing: .06 });
}
// the date in the top left, as in the film
function dateChip(str, a) { chip(str, fs(3), fs(4.5), { size: 3.4, fill: CREAM, bg: INK, a }); }
function dot(x, y, r, fill, a = 1) { if (a <= 0) return; ctx.globalAlpha = a; ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
function ring(x, y, r, stroke, w, a = 1) { if (a <= 0) return; ctx.globalAlpha = a; ctx.strokeStyle = stroke; ctx.lineWidth = w; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke(); ctx.globalAlpha = 1; }
function veil(fill, a) { if (a <= 0) return; toScreen(); ctx.globalAlpha = a; ctx.fillStyle = fill; ctx.fillRect(0, 0, cw, chh); ctx.globalAlpha = 1; }
// a picture covering box (focus fx, fy: the point of the picture kept in view)
function cover(im, box, a = 1, fx = .5, fy = .5, scale = 1) {
  if (!ready(im) || a <= 0) return;
  const k = Math.max(box.w / im.naturalWidth, box.h / im.naturalHeight) * scale, w = im.naturalWidth * k, h = im.naturalHeight * k;
  ctx.globalAlpha = a; ctx.drawImage(im, box.x + (box.w - w) * fx, box.y + (box.h - h) * fy, w, h); ctx.globalAlpha = 1;
}
// a round portrait in a red ring (the film's liChip)
function portrait(name, x, y, r, a) {
  const im = IMG[name]; if (a <= 0) return;
  ctx.globalAlpha = a; dot(x, y, r, RED, a);
  if (ready(im)) { ctx.save(); ctx.beginPath(); ctx.arc(x, y, r * .9, 0, 7); ctx.clip(); ctx.globalAlpha = a; ctx.drawImage(im, x - r * .9, y - r * .9, r * 1.8, r * 1.8); ctx.restore(); }
  ctx.globalAlpha = 1;
}
// paper grain and a vignette over a paper scene: a CSS layer over the canvas (.grain), so the compositor blends it
// instead of the canvas redrawing a full-screen multiply every frame (half a phone frame's cost). Its opacity is the
// strongest paper scene on screen this frame
let grainA = 0;
function paperTop(a) { grainA = Math.max(grainA, a); }

/* ---------- the maps ---------- */
function chinaMap(V, a, { hubei = 0, hubeiHatch = 0, rails = 0, detail = 0 } = {}) {
  if (a <= 0) return;
  ctx.globalAlpha = a; toScreen(); ctx.fillStyle = SEA; ctx.fillRect(0, 0, cw, chh);
  toWorld(V); const px = 1 / V.s;
  ctx.fillStyle = LAND; ctx.fill(CNP.land); ctx.strokeStyle = LINE; ctx.lineWidth = 1.1 * px; ctx.stroke(CNP.land);
  ctx.fillStyle = CNFILL; ctx.fill(CNP.china);
  ctx.setLineDash([4 * px, 3 * px]); ctx.lineWidth = .9 * px; ctx.stroke(CNP.provs); ctx.setLineDash([]);
  if (hubei > 0) { ctx.globalAlpha = a * hubei * .22; ctx.fillStyle = RED; ctx.fill(CNP.hubei); ctx.globalAlpha = a; }
  if (hubeiHatch > 0) { ctx.globalAlpha = a * hubeiHatch; ctx.fillStyle = hatch(V); ctx.fill(CNP.hubei); ctx.globalAlpha = a; }
  if (detail > 0) {
    ctx.globalAlpha = a * detail; ctx.fillStyle = URBAN; ctx.fill(CNP.urban);
    ctx.fillStyle = SEA; ctx.fill(CNP.lakes); ctx.strokeStyle = RIVER; ctx.lineWidth = .8 * px; ctx.stroke(CNP.lakes);
    ctx.globalAlpha = a;
  }
  ctx.strokeStyle = RIVER; ctx.lineWidth = 1.6 * px; ctx.globalAlpha = a * (.4 + .6 * detail); ctx.stroke(CNP.rivers); ctx.globalAlpha = a;
  ctx.strokeStyle = INK; ctx.lineWidth = 1.6 * px; ctx.stroke(CNP.china);
  if (rails > 0) { ctx.globalAlpha = a * rails; ctx.lineWidth = 1.4 * px; ctx.stroke(CNP.rails); ctx.globalAlpha = a; }
  ctx.globalAlpha = 1; toScreen();
}
function italyMap(V, a, { lomb = 0, ita = 0 } = {}) {
  if (a <= 0) return;
  ctx.globalAlpha = a; toScreen(); ctx.fillStyle = SEA; ctx.fillRect(0, 0, cw, chh);
  toWorld(V); const px = 1 / V.s;
  ctx.fillStyle = LAND; ctx.fill(ITP.land); ctx.strokeStyle = LINE; ctx.lineWidth = 1.1 * px; ctx.stroke(ITP.land);
  ctx.fillStyle = CNFILL; ctx.fill(ITP.ita);
  ctx.setLineDash([4 * px, 3 * px]); ctx.lineWidth = .8 * px; ctx.stroke(ITP.provs); ctx.setLineDash([]);
  if (ita > 0) { ctx.globalAlpha = a * ita; ctx.fillStyle = hatch(V); ctx.fill(ITP.ita); }
  if (lomb > 0) { ctx.globalAlpha = a * lomb * (1 - ita); ctx.fillStyle = hatch(V); ctx.fill(ITP.lomb); }
  ctx.globalAlpha = a; ctx.strokeStyle = INK; ctx.lineWidth = 1.6 * px; ctx.stroke(ITP.ita);
  ctx.globalAlpha = 1; toScreen();
}
// the world, each country painted by fill(c) -> [colour, alpha] or null
function worldMap(V, a, fill = null) {
  if (a <= 0) return;
  ctx.globalAlpha = a; toScreen(); ctx.fillStyle = SEA; ctx.fillRect(V.box.x, V.box.y, V.box.w, V.box.h);
  toWorld(V); const px = 1 / V.s;
  ctx.fillStyle = LAND; ctx.fill(WALL);
  if (fill) for (const c of WC) {
    const f = fill(c); if (!f || f[1] <= 0) continue;
    ctx.globalAlpha = a * f[1]; ctx.fillStyle = f[0] === 'hatch' ? hatch(V) : f[0]; ctx.fill(c.p);
  }
  ctx.globalAlpha = a; ctx.strokeStyle = LINE; ctx.lineWidth = .9 * px; ctx.stroke(WALL);
  ctx.globalAlpha = 1; toScreen();
}

/* ---------- the story's data ---------- */
// the first cases around Wuhan (China map px), as in the film
const CASES = (() => { const R = rng(4), a = [[.6, -.4]]; for (let i = 0; i < 9; i++) a.push([-4 + R() * 5, -3 + R() * 4.5]); for (let i = 0; i < 8; i++) a.push([5 + R() * 4, 2 + R() * 3.5]); return a; })();
// 30 trains of about 10,000 people leave Wuhan for 13 cities: destination, launch phase, speed (the film's EXO)
const CNC = ['Beijing', 'Shanghai', 'Guangzhou', 'Chongqing', 'Chengdu', 'Xian', 'Zhengzhou', 'Changsha', 'Nanjing', 'Hangzhou', 'Shenzhen', 'Harbin', 'Kunming'];
const TRAINS = (() => { const R = rng(8); return [...Array(30)].map((_, i) => [CNC[i % CNC.length], i / 30 + R() * .03, .8 + R() * .5]); })();
// where a train is: 0 at Wuhan when it leaves (newyear .3 to .58, before the gates close), 1 at its city (by lock .4)
const trainGo = ([, ph]) => at('newyear', .3 + ph * .28), trainEnd = t => trainGo(t) + 1 / (t[2] * 1.6);
const trainQ = (t, P) => clamp((P - trainGo(t)) / (trainEnd(t) - trainGo(t)));
// Italy's and China's confirmed deaths, March 2020 (Italian Civil Protection; China NHC, via Wikipedia): the bars' shape
const BARS = [['2020-03-01', 34, 2870], ['2020-03-05', 148, 3013], ['2020-03-10', 631, 3136], ['2020-03-15', 1809, 3199], ['2020-03-19', 3405, 3249], ['2020-03-22', 5476, 3261]];
const WAVE_D = WAVES.map(w => day(w[0]));
const W_START = day(W.dweeks[0]);
function wavesAt(d) {   // interpolated [cases a day, deaths a day] at day d
  let i = WAVE_D.findIndex(x => x > d); if (i < 0) i = WAVE_D.length; if (i === 0) return [WAVES[0][1], WAVES[0][2]];
  if (i === WAVE_D.length) return [WAVES[i - 1][1], WAVES[i - 1][2]];
  const t = (d - WAVE_D[i - 1]) / (WAVE_D[i] - WAVE_D[i - 1]);
  return [lerp(WAVES[i - 1][1], WAVES[i][1], t), lerp(WAVES[i - 1][2], WAVES[i][2], t)];
}
const SPREAD_D = SPREAD.map(s => day(s[3]));

/* ---------- the scenes, in page order ---------- */
// the 2020 wall: 16 of the year's pictures, going dark one by one
const WALL_IMGS = ['virus-sem-red', 'airport-pek-empty', 'street-glenview-24', 'school-empty-classroom', 'closed-sign-temporary', 'street-hwy407',
  'ppe-nurses-faceshields', 'mask-cbp-officer', 'mask-hawaii-guard', 'school-closed-banner', 'airport-pek-empty', 'virus-sem-red',
  'street-glenview-24', 'school-empty-classroom', 'mask-hawaii-guard', 'closed-sign-temporary'];
const WALL_OFF = [3, 9, 14, 0, 12, 6, 11, 2, 15, 8, 4, 13, 10, 1, 7, 5];
function sceneOpen(P) {
  const a = 1 - ramp(P, at('y2020', .92), at('y2020', 1));
  if (a <= 0) return;
  toScreen();
  const cols = 4, rows = 4, tw = cw / cols, th = chh / rows;
  WALL_IMGS.forEach((n, i) => {
    const off = WALL_OFF.indexOf(i), o = 1 - ramp(P, at('y2020', .25 + off * .04), at('y2020', .29 + off * .04));
    ctx.save(); ctx.beginPath(); ctx.rect((i % cols) * tw + 1.5, Math.floor(i / cols) * th + 1.5, tw - 3, th - 3); ctx.clip();
    cover(IMG[n], { x: (i % cols) * tw, y: Math.floor(i / cols) * th, w: tw, h: th }, .75 * o * a);
    ctx.restore();
  });
  veil(NIGHT, .35 * a);
  const s = 1 + .06 * ramp(P, 0, at('y2020', 1));
  ctx.save(); ctx.translate(cw / 2, chh / 2); ctx.scale(s, s);
  text('2020', 0, fs(8), { size: Math.min(26, 26 * cw / chh * 1.4), weight: 600, fill: CREAM, align: 'center', a: a * (1 - ramp(P, at('y2020', .7), at('y2020', .9))) });
  ctx.restore();
}
// the two numbers and the gap between them, as lengths (here and again at the end)
function sceneCount(P, a0, range = 0) {
  if (a0 <= 0) return;
  toScreen();
  const cx = cw / 2, y = chh * .32, k = 27e6 / 7115706, kMax = 35e6 / 7115706, Ub = Math.min(cw * .86, fs(80)) / kMax, bx = cx - Ub * kMax / 2, by = chh * .7, bh = fs(3.4);
  const c1 = ramp(P, at('count', .05), at('count', .3)), c2 = ramp(P, at('count', .4), at('count', .7));
  const a1 = a0 * ramp(P, at('count', 0), at('count', .1)), a2 = a0 * ramp(P, at('count', .38), at('count', .45));
  text(fmtN(7115706 * c1), cx, y, { size: 9, weight: 600, fill: CREAM, align: 'center', a: a1 });
  text('confirmed COVID-19 deaths', cx, y + fs(5), { size: 3.4, font: SERF, weight: 400, fill: CREAM, align: 'center', a: a1 });
  text(fmtN(27e6 * c2), cx, chh * .53, { size: 12, weight: 600, fill: RED, align: 'center', a: a2 });
  text('estimated from excess deaths', cx, chh * .53 + fs(5), { size: 3.4, font: SERF, weight: 400, fill: CREAM, align: 'center', a: a2 });
  ctx.globalAlpha = a0; ctx.fillStyle = CREAM; ctx.fillRect(bx, by, Ub * ramp(P, at('count', .2), at('count', .35)), bh);
  for (let j = 1; j < Math.ceil(k); j++) {
    const q = ramp(P, at('count', .45 + (j - 1) * .08), at('count', .53 + (j - 1) * .08));
    ctx.fillStyle = RED; ctx.fillRect(bx + Ub * j + 2, by, (Ub * Math.min(1, k - j) - 2) * q, bh);
  }
  text('nearly 4×', bx + Ub * k, by + bh + fs(5), { size: 4, weight: 500, fill: RED, align: 'right', a: a0 * ramp(P, at('count', .75), at('count', .85)) });
  if (range > 0) {   // 18 to 35 million: a bracket over the bar
    const x18 = bx + Ub * 18e6 / 7115706, x35 = bx + Ub * 35e6 / 7115706, yb = by - fs(2.2);
    ctx.globalAlpha = a0 * range; ctx.strokeStyle = CREAM; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x18, by - 2); ctx.lineTo(x18, yb); ctx.lineTo(x35, yb); ctx.stroke();
    text('18 to 35 million', x18, yb - fs(1.2), { size: 3, font: SERF, weight: 400, fill: CREAM, a: a0 * range });
  }
  ctx.globalAlpha = 1;
}

// the camera over China, from Wuhan's first showing to the moment it hands over to the world (China map px)
const CHINA_CAM = () => [
  [at('wuhan', .1), -60, -60, 1150], [at('wuhan', .3), -60, -60, 1150], [at('wuhan', .95), 0, 0, 55],
  [at('cases', .3), 1, 0, 26], [at('newyear', .05), 1, 0, 26], [at('newyear', .45), -30, -80, 820],
  [at('lock', .7), -30, -80, 820], [at('spread', 0), -30, -80, 820], [at('spread', .22), -30, -80, 2600],
];
// the camera over the world (world px); its first key meets the China camera's last at Wuhan, scaled by W.cn
const WORLD_CAM = () => [
  [at('spread', 0), W.wuhan[0] + -30 * W.cn, W.wuhan[1] + -80 * W.cn, 820 * W.cn], [at('spread', .22), W.wuhan[0] - 30 * W.cn, W.wuhan[1] - 80 * W.cn, 2600 * W.cn],
  [at('spread', .4), 60, -60, 1350], [at('italy', 0), 60, -60, 1350], [at('italy', .3), W.codogno[0] + 60 * W.it, W.codogno[1] + 50 * W.it, 420 * W.it],
  [at('pandemic', 0), W.codogno[0] + 60 * W.it, W.codogno[1] + 50 * W.it, 420 * W.it], [at('pandemic', .3), 60, -60, 1350],
  [at('newyork', 0), 60, -60, 1350], [at('newyork', .3), (W.pins.nyc[0] + W.pins.europe[0]) / 2, -330, 640],
  [at('home', 0), (W.pins.nyc[0] + W.pins.europe[0]) / 2, -330, 640], [at('home', .3), 60, -60, 1350],
];
const ITALY_CAM = () => [[at('italy', .3), 60, 50, 420], [at('italy', .55), 20, 0, 260], [at('italy', .85), 60, 50, 420], [at('pandemic', 0), 60, 50, 420]];
// the end: the world's camera dives to Wuhan and hands over to the China map close on the market and the institute
const ORIGIN_CAM = () => [[at('origin', 0), 60, -60, 1350], [at('origin', .25), W.wuhan[0], W.wuhan[1], 120 * W.cn]];
const ORIGIN_CN = () => [[at('origin', .25), 0, 0, 120], [at('origin', .5), CN.market[0] / 2 + CN.wiv[0] / 2, (CN.market[1] + CN.wiv[1]) / 2, 9]];

function sceneChina(P) {
  const a = ramp(P, at('wuhan', .05), at('wuhan', .25)) * (1 - ramp(P, at('spread', .08), at('spread', .22)));
  if (a <= 0) return;
  const [x, y, r] = cam(CHINA_CAM(), P), V = view(full(), x, y, r);
  chinaMap(V, a, {
    hubei: win(P, at('wuhan', .35), at('wuhan', .55), at('wuhan', .8), at('cases', .1)),
    hubeiHatch: ramp(P, at('lock', 0), at('lock', .15)),
    rails: ramp(P, at('newyear', .25), at('newyear', .45)),
    detail: ramp(P, at('wuhan', .7), at('wuhan', .95)) * (1 - ramp(P, at('newyear', .1), at('newyear', .3))),
  });
  paperTop(a);
  const wx = V.sx(0), wy = V.sy(0);
  // Wuhan, its ring and its name
  ring(wx, wy, fs(2.6), INK, 2.5, a);
  text('WUHAN', wx, wy - fs(4.5), { size: 4.4, weight: 600, align: 'center', spacing: .3, a: a * (1 - ramp(P, at('cases', .1), at('cases', .3))) * (1 - ramp(P, at('newyear', 0), at('newyear', .1))) + a * ramp(P, at('newyear', .3), at('newyear', .45)) * (1 - ramp(P, at('lock', .5), at('lock', .7))) });
  text('11 million people', wx, wy + fs(6.5), { size: 3.2, font: SERF, weight: 400, italic: true, align: 'center', a: a * win(P, at('wuhan', .55), at('wuhan', .7), at('cases', .1), at('cases', .25)) });
  // the first cases, one, a cluster, another
  CASES.forEach(([cx, cy], i) => {
    const t0 = i === 0 ? .12 : i < 10 ? .35 + i * .015 : .62 + (i - 10) * .015;
    const q = ramp(P, at('cases', t0), at('cases', t0 + .06)) * (1 - ramp(P, at('newyear', .1), at('newyear', .3)));
    dot(V.sx(cx), V.sy(cy), fs(1.1) * (.6 + .4 * q), RED, a * q);
  });
  dateChip('DECEMBER 2019', a * win(P, at('cases', 0), at('cases', .08), at('double', .9), at('double', 1)));
  chip('Pneumonia of unknown cause', wx + fs(5), wy - fs(14), { size: 3.2, font: SERF, weight: 400, a: a * win(P, at('cases', .2), at('cases', .3), at('cases', .9), at('li', .05)) });
  // the trains out of Wuhan, and each city lit as the first one arrives
  TRAINS.forEach(t => {
    const q = trainQ(t, P), [cx, cy] = CN.cities[t[0]];
    if (q > 0 && q < 1) {
      const x0 = V.sx(cx * q), y0 = V.sy(cy * q);
      ctx.globalAlpha = a * .35; ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(x0, y0); ctx.stroke();
      ctx.save(); ctx.globalAlpha = a; ctx.translate(x0, y0); ctx.rotate(Math.atan2(cy, cx)); ctx.fillStyle = INK;
      for (let k = 0; k < 3; k++) ctx.fillRect(-fs(3.4) + k * fs(1.2), -fs(.4), fs(1), fs(.8));
      ctx.restore();
    }
  });
  const cityA = a * ramp(P, at('newyear', .3), at('newyear', .45));
  CNC.forEach(n => {
    const [cx, cy] = CN.cities[n], sx = V.sx(cx), sy = V.sy(cy);
    dot(sx, sy, fs(.8), INK, cityA);
    // lit when its first train arrives
    const first = Math.min(...TRAINS.filter(t => t[0] === n).map(trainEnd));
    const q = ramp(P, first, first + .05);
    dot(sx, sy, fs(1.5) * q, RED, cityA * q);
    ring(sx, sy, fs(1.5) + fs(4) * q, RED, 2, cityA * q * (1 - q) * 3);
  });
  chip('23 JANUARY 2020 · 02:00', fs(3), fs(4.5), { size: 3.4, fill: CREAM, bg: INK, a: a * win(P, at('newyear', .45), at('newyear', .5), at('newyear', .6), at('newyear', .62)) });
  chip('23 JANUARY 2020 · 10:00: EVERYTHING STOPS', fs(3), fs(4.5), { size: 3.4, fill: CREAM, bg: RED, a: a * win(P, at('newyear', .6), at('newyear', .62), at('lock', .9), at('spread', .05)) });
  chip('≈ 300,000 left by train', wx + fs(4), wy + fs(10), { size: 3.4, a: a * win(P, at('newyear', .8), at('newyear', .9), at('lock', .05), at('lock', .15)) });
  chip('Wuhan, then all of Hubei: about 57 million people', cw / 2, chh - fs(6), { size: 3, font: SERF, weight: 400, align: 'center', a: a * win(P, at('lock', .15), at('lock', .25), at('spread', 0), at('spread', .08)) });
}

function sceneLi(P) {
  const a = win(P, at('li', 0), at('li', .12), at('double', .05), at('double', .2));
  veil(NIGHT, .72 * win(P, at('li', 0), at('li', .12), at('newyear', 0), at('newyear', .15)));
  if (a <= 0) return;
  toScreen();
  const cx = cw / 2, r = Math.min(cw, chh) * .2, cy = chh * .38;
  portrait('li-wenliang', cx, cy, r, a * ramp(P, at('li', .05), at('li', .15)));
  text('LI WENLIANG', cx, cy + r + fs(6), { size: 5.5, weight: 600, fill: CREAM, align: 'center', spacing: .1, a: a * ramp(P, at('li', .08), at('li', .18)) });
  text('eye doctor, Wuhan Central Hospital', cx, cy + r + fs(10.5), { size: 3.2, font: SERF, weight: 400, fill: CREAM, align: 'center', italic: true, a: a * ramp(P, at('li', .1), at('li', .2)) });
  // the letter he had to sign: a stamp across the portrait
  const st = ramp(P, at('li', .45), at('li', .5));
  if (st > 0) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(-.18); ctx.scale(1.4 - .4 * st, 1.4 - .4 * st);
    ctx.globalAlpha = a * st; ctx.strokeStyle = RED; ctx.lineWidth = 3; ctx.font = `600 ${fs(4.6)}px ${KEYF}`;
    const w = ctx.measureText('UNTRUE STATEMENTS').width;
    ctx.fillStyle = 'rgba(243,237,224,.88)'; ctx.fillRect(-w / 2 - fs(1.5), -fs(3.6), w + fs(3), fs(7.2)); ctx.strokeRect(-w / 2 - fs(1.5), -fs(3.6), w + fs(3), fs(7.2));
    text('UNTRUE STATEMENTS', 0, 0, { size: 4.6, weight: 600, fill: RED, align: 'center', base: 'middle', a: a * st });
    ctx.restore();
  }
  // the eight doctors punished: Li and seven stand-ins
  const rr = Math.min(cw / 20, r * .42), y8 = chh * .86;
  for (let i = 0; i < 8; i++) {
    const x = cx + (i - 3.5) * rr * 2.3;
    portrait(i ? `doctor-${i}` : 'li-wenliang', x, y8, rr, a * ramp(P, at('li', .7 + i * .025), at('li', .76 + i * .025)));
  }
  text('8 doctors punished for “rumours” · 7 are illustrations', cx, y8 + rr + fs(4), { size: 2.8, font: SERF, weight: 400, fill: CREAM, align: 'center', a: a * ramp(P, at('li', .9), at('li', .97)) });
}

function sceneDouble(P) {
  const a = win(P, at('double', .05), at('double', .2), at('newyear', 0), at('newyear', .12));
  if (a <= 0) return;
  toScreen();
  const q = ramp(P, at('double', .15), at('double', .9)), n = 2 ** (10 * q), cols = 32, g = Math.min(cw * .86, chh * .7) / cols;
  const x0 = cw / 2 - g * cols / 2 + g / 2, y0 = chh * .52 - g * cols / 2 + g / 2;
  for (let i = 0; i < 1024; i++) {
    const o = clamp(n - i); if (o <= 0) break;
    dot(x0 + (i % cols) * g, y0 + Math.floor(i / cols) * g, g * .36, RED, a * o);
  }
  text(`${fmtN(Math.floor(n))} ${Math.floor(n) === 1 ? 'case' : 'cases'}`, cw / 2, fs(9), { size: 5.5, weight: 600, fill: CREAM, align: 'center', a });
  text(`day ${Math.round(75 * q)} · doubling about every 7½ days`, cw / 2, fs(13.5), { size: 3.2, font: SERF, weight: 400, fill: CREAM, align: 'center', a });
  text('one dot = one case (illustrative)', cw / 2, chh - fs(3), { size: 2.6, font: SERF, weight: 400, fill: CREAM, align: 'center', a: a * .8 });
}

function sceneWorld(P) {
  const a = ramp(P, at('spread', .08), at('spread', .22)) * (1 - ramp(P, at('stops', 0), at('stops', .15)));
  if (a <= 0) return;
  const [x, y, r] = cam(WORLD_CAM(), P), V = view(full(), x, y, r);
  // the date: 23 Jan to 29 Feb over spread, on to 11 Mar over pandemic
  const d = lerp(day('2020-01-23'), day('2020-02-29'), ramp(P, at('spread', .25), at('spread', .9))) + (day('2020-03-11') - day('2020-02-29')) * ramp(P, at('pandemic', .3), at('pandemic', .6));
  // stay-home orders, a week at a time from 2 March (home)
  const wk = 5 * ramp(P, at('home', .25), at('home', .9)), wi = Math.floor(wk), wf = wk - wi;
  const homeA = ramp(P, at('home', .2), at('home', .3));
  worldMap(V, a, homeA > 0 ? c => {
    const now = c.home[wi] === '1', next = c.home[Math.min(4 + 1, wi + 1)] === '1';
    const o = wi >= 5 ? (c.home[5] === '1' ? 1 : 0) : now ? (next ? 1 : 1 - wf) : next ? wf : 0;
    return ['hatch', o * homeA];
  } : null);
  // the first case in each country, as a dot
  const dotA = a * (1 - ramp(P, at('newyork', 0), at('newyork', .15))) * (1 - homeA);
  let n = 0;
  if (dotA > 0) SPREAD.forEach((s, i) => {
    if (s[0] === 'China') return;
    const q = clamp((d - SPREAD_D[i]) / 2); if (q <= 0) return; n++;
    dot(V.sx(s[1]), V.sy(s[2]), fs(.8) * (.5 + .5 * q), RED, dotA * q);
  });
  dot(V.sx(W.wuhan[0]), V.sy(W.wuhan[1]), fs(1.2), RED, dotA);
  paperTop(a);
  const tl = ramp(P, at('spread', .2), at('spread', .3)) * (1 - ramp(P, at('italy', 0), at('italy', .15)));
  const tp = win(P, at('pandemic', .2), at('pandemic', .3), at('bergamo', .85), at('bergamo', 1));
  dateChip(fmtDate(d), a * Math.max(tl, tp));
  chip(`${n} countries with cases`, cw - fs(3), fs(4.5), { size: 3.2, align: 'right', a: a * Math.max(tl, tp * (1 - ramp(P, at('bergamo', 0), at('bergamo', .1)))) });
  // Li Wenliang, 7 February, at Wuhan
  const la = a * win(P, at('spread', .25) + (day('2020-02-07') - day('2020-01-23')) / 37 * .65, at('spread', .25) + (day('2020-02-08') - day('2020-01-23')) / 37 * .65, at('spread', .75), at('spread', .85));
  const lx = V.sx(W.wuhan[0]), ly = V.sy(W.wuhan[1]) - fs(10);
  portrait('li-wenliang', lx, ly, fs(5), la);
  chip('Li Wenliang, 1985–2020', lx, ly + fs(8), { size: 2.8, align: 'center', a: la });
  chip('Antarctica: not until December 2020', cw / 2, chh - fs(5), { size: 3, font: SERF, weight: 400, align: 'center', a: a * win(P, at('spread', .85), at('spread', .92), at('italy', 0), at('italy', .1)) });
  // pandemic: the word
  const pa = a * win(P, at('pandemic', .6), at('pandemic', .7), at('bergamo', 0), at('bergamo', .1));
  if (pa > 0) {
    const hx = cw / 2, hy = chh * .8;
    ctx.font = `600 ${fs(9)}px ${KEYF}`; const w = ctx.measureText('PANDEMIC').width;
    ctx.globalAlpha = pa * .8; ctx.fillStyle = RED; ctx.fillRect(hx - w / 2 - fs(1), hy - fs(3), (w + fs(2)) * ramp(P, at('pandemic', .68), at('pandemic', .8)), fs(5));
    text('PANDEMIC', hx, hy, { size: 9, weight: 600, fill: INK, align: 'center', a: pa });
    text('World Health Organization · 11 March 2020', hx, hy + fs(6), { size: 3, font: SERF, weight: 400, align: 'center', a: pa });
  }
  // New York: the Asia arc struck out, the Europe arcs thick and red
  // Asia's arc comes over the Pacific, from Wuhan one map-width to the west, so it never crosses Europe's
  const ny = [V.sx(W.pins.nyc[0]), V.sy(W.pins.nyc[1])], eu = [V.sx(W.pins.europe[0]), V.sy(W.pins.europe[1])], wu = [V.sx(W.wuhan[0] - 3200), V.sy(W.wuhan[1])];
  const nyA = a * win(P, at('newyork', .25), at('newyork', .35), at('home', 0), at('home', .12));
  if (nyA > 0) {
    dot(ny[0], ny[1], fs(1.3), RED, nyA);
    chip('NEW YORK · 1 MARCH 2020', ny[0] - fs(2), ny[1] + fs(5), { size: 3, align: 'right', a: nyA });
    const arc = (A, B, q, w, col, lift, dash) => {
      if (q <= 0) return;
      const mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2 - lift;
      ctx.globalAlpha = nyA; ctx.strokeStyle = col; ctx.lineWidth = w; ctx.setLineDash(dash || []);
      ctx.beginPath(); ctx.moveTo(A[0], A[1]);
      for (let i = 1; i <= 40 * q; i++) { const t = i / 40; ctx.lineTo((1 - t) ** 2 * A[0] + 2 * (1 - t) * t * mx + t * t * B[0], (1 - t) ** 2 * A[1] + 2 * (1 - t) * t * my + t * t * B[1]); }
      ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
    };
    arc(wu, ny, ramp(P, at('newyork', .4), at('newyork', .55)), 2, GREY, fs(30), [6, 5]);
    const xq = ramp(P, at('newyork', .55), at('newyork', .62));
    if (xq > 0) {   // struck out on its last stretch, west of New York
      const t = .93, mx0 = (wu[0] + ny[0]) / 2, my0 = (wu[1] + ny[1]) / 2 - fs(30);
      const mx = (1 - t) ** 2 * wu[0] + 2 * (1 - t) * t * mx0 + t * t * ny[0], my = (1 - t) ** 2 * wu[1] + 2 * (1 - t) * t * my0 + t * t * ny[1], k = fs(2.5) * xq;
      ctx.globalAlpha = nyA; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(mx - k, my - k); ctx.lineTo(mx + k, my + k); ctx.moveTo(mx + k, my - k); ctx.lineTo(mx - k, my + k); ctx.stroke(); ctx.globalAlpha = 1;
      chip('from Asia: a few', mx, my - fs(5), { size: 2.8, font: SERF, weight: 400, align: 'center', a: nyA * xq });
    }
    [[0, 0], [-fs(3), fs(2)], [fs(2), -fs(2.5)]].forEach(([ox, oy], i) => arc([eu[0] + ox, eu[1] + oy], ny, ramp(P, at('newyork', .62 + i * .06), at('newyork', .8 + i * .06)), fs(1.1), RED, fs(9 + i * 2)));
    text('IT CAME FROM EUROPE', cw / 2, chh - fs(5), { size: 5, weight: 600, fill: RED, align: 'center', a: nyA * ramp(P, at('newyork', .85), at('newyork', .95)) });
  }
  // stay home: the week and the count
  if (homeA > 0) {
    const w = Math.min(5, Math.round(wk)), cnt = WC.filter(c => c.home[w] === '1').length;
    dateChip('WEEK OF ' + fmtDate(day(W.weeks[w])), a * homeA);
    chip(`${cnt} countries: stay at home`, cw - fs(3), fs(4.5), { size: 3.2, align: 'right', a: a * homeA });
    chip('More than half of humanity told to stay home', cw / 2, chh - fs(5), { size: 3.2, align: 'center', a: a * ramp(P, at('home', .88), at('home', .96)) });
  }
}

function sceneItaly(P) {
  const a = win(P, at('italy', .22), at('italy', .32), at('pandemic', 0), at('pandemic', .15));
  if (a <= 0) return;
  const [x, y, r] = cam(ITALY_CAM(), P), V = view(full(), x, y, r);
  italyMap(V, a, { lomb: ramp(P, at('italy', .6), at('italy', .68)), ita: ramp(P, at('italy', .8), at('italy', .88)) });
  paperTop(a);
  const cx = V.sx(0), cy = V.sy(0);
  dot(cx, cy, fs(1.1), RED, a * ramp(P, at('italy', .35), at('italy', .4)));
  text('CODOGNO', cx + fs(2.5), cy - fs(2), { size: 3.4, weight: 500, spacing: .1, a: a * ramp(P, at('italy', .36), at('italy', .42)) * (1 - ramp(P, at('italy', .8), at('italy', .86))) });
  // the eleven towns: a ring of about 15 km round Codogno and Vo' (1 px = 3.2 km here)
  const rz = ramp(P, at('italy', .45), at('italy', .52)) * (1 - ramp(P, at('italy', .6), at('italy', .68)));
  ring(cx, cy, Math.max(5 * V.s, fs(3.2)), RED, 3, a * rz);   // never smaller than the town's dot
  chip('11 towns sealed off', cx + fs(3), cy + fs(6), { size: 3, a: a * rz });
  const dates = [[.32, '21 FEBRUARY 2020'], [.6, '8 MARCH 2020'], [.8, '9 MARCH 2020']];
  dates.forEach(([t, s], i) => dateChip(s, a * win(P, at('italy', t), at('italy', t + .02), dates[i + 1] ? at('italy', dates[i + 1][0]) : at('pandemic', 0), dates[i + 1] ? at('italy', dates[i + 1][0] + .02) : at('pandemic', .1))));
  chip('Lombardy: 10 million people', cw / 2, chh - fs(5), { size: 3.2, align: 'center', a: a * win(P, at('italy', .62), at('italy', .68), at('italy', .78), at('italy', .8)) });
  text('60,000,000', cw / 2, chh - fs(9), { size: 9, weight: 600, fill: RED, align: 'center', a: a * ramp(P, at('italy', .84), at('italy', .92)) });
  text('people, the first country to lock itself down', cw / 2, chh - fs(4.5), { size: 3, font: SERF, weight: 400, align: 'center', a: a * ramp(P, at('italy', .86), at('italy', .94)) });
}

function sceneBergamo(P) {
  const a = win(P, at('bergamo', 0), at('bergamo', .15), at('newyork', 0), at('newyork', .15));
  veil(CREAM, .86 * a);
  if (a <= 0) return;
  toScreen();
  const d = lerp(day(BARS[0][0]), day(BARS[BARS.length - 1][0]), ramp(P, at('bergamo', .15), at('bergamo', .9)));
  let i = BARS.findIndex(b => day(b[0]) > d); if (i < 1) i = i === 0 ? 1 : BARS.length - 1;
  const t = clamp((d - day(BARS[i - 1][0])) / (day(BARS[i][0]) - day(BARS[i - 1][0])));
  const it = lerp(BARS[i - 1][1], BARS[i][1], t), cn = lerp(BARS[i - 1][2], BARS[i][2], t), max = 5600;
  const x0 = cw * .1, bw = cw * .8, bh = fs(7);
  [['CHINA', cn, INK, chh * .4], ['ITALY', it, RED, chh * .58]].forEach(([n, v, col, y]) => {
    text(n, x0, y - fs(2), { size: 4, weight: 600, fill: col, spacing: .12, a });
    ctx.globalAlpha = a; ctx.fillStyle = col; ctx.fillRect(x0, y, bw * v / max, bh); ctx.globalAlpha = 1;
  });
  text('confirmed COVID-19 deaths', x0, chh * .3, { size: 3.2, font: SERF, weight: 400, italic: true, a });
  dateChip(fmtDate(d), a);
  text('ITALY PASSES CHINA', cw / 2, chh * .82, { size: 5.4, weight: 600, fill: RED, align: 'center', a: a * ramp(it - cn, 0, 300) });
}

function scenePhotos(P) {
  const a = win(P, at('stops', 0), at('stops', .15), at('sky', 0), at('sky', .15));
  if (a <= 0) return;
  toScreen(); ctx.globalAlpha = a; ctx.fillStyle = NIGHT; ctx.fillRect(0, 0, cw, chh);
  const shots = [['school-empty-classroom', .5, .5], ['shelves-empty', .5, .5], ['street-glenview-24', .5, .6]];
  const lbl = ['More than 1 billion students kept out of class', 'In the US alone, 40 million jobs gone', '$3.5 trillion less earned from work, worldwide'];
  shots.forEach(([n, fx, fy], i) => {
    const o = i === 0 ? 1 : ramp(P, at('stops', .3 + (i - 1) * .33), at('stops', .4 + (i - 1) * .33));
    cover(IMG[n], full(), a * o, fx, fy, 1.04 + .06 * ramp(P, at('stops', 0), at('sky', 0)));
    const off = i < 2 ? ramp(P, at('stops', .33 + i * .33), at('stops', .36 + i * .33)) : ramp(P, at('sky', 0), at('sky', .1));
    chip(lbl[i], fs(3), chh - fs(5), { size: 3.2, a: a * ramp(P, at('stops', .1 + i * .33), at('stops', .18 + i * .33)) * (1 - off) });
  });
  const cr = ['U.S. Army, Pfc. Kaden Pitt (PD)', 'Dan Keck (CC0)', 'C. E. Miller (PD)'];
  const ci = P < at('stops', .35) ? 0 : P < at('stops', .68) ? 1 : 2;
  text(cr[ci], cw - fs(2), fs(3.5), { size: 2.2, font: SERF, weight: 400, fill: CREAM, align: 'right', a: a * .85 });
}

function sceneSky(P) {
  const a = win(P, at('sky', 0), at('sky', .15), at('alpha', 0), at('alpha', .15));
  if (a <= 0) return;
  const im = IMG['no2-china'];
  toScreen(); ctx.globalAlpha = a; ctx.fillStyle = '#f6f7f9'; ctx.fillRect(0, 0, cw, chh);
  if (!ready(im)) return;
  // the picture is two maps side by side (Jan 1-20 | Feb 10-25) and a key: show one, wipe to the other
  const half = 358, top = 475, k = Math.min(cw / half, (chh - fs(10)) / top), w = half * k, h = top * k, x = (cw - w) / 2, y = (chh - h) / 2 - fs(2);
  ctx.drawImage(im, 0, 0, half, top, x, y, w, h);
  const q = ramp(P, at('sky', .3), at('sky', .8));
  if (q > 0) { ctx.save(); ctx.beginPath(); ctx.rect(x, y, w * q, h); ctx.clip(); ctx.drawImage(im, 362, 0, half, top, x, y, w, h); ctx.restore(); ctx.globalAlpha = a; ctx.fillStyle = RED; ctx.fillRect(x + w * q - 1.5, y, 3, h); }
  ctx.drawImage(im, 180, 482, 360, 63, cw / 2 - Math.min(w, 360 * k) / 2, y + h + fs(1), Math.min(w, 360 * k), Math.min(w, 360 * k) * 63 / 360);
  text('NASA Earth Observatory (PD)', cw - fs(2), chh - fs(1.5), { size: 2.2, font: SERF, weight: 400, fill: SOFT, align: 'right', a });
  ctx.globalAlpha = 1;
}

// the waves: the world tinted by deaths per million that week, and the world's cases and deaths a day below
function sceneWaves(P) {
  const a = win(P, at('alpha', 0), at('alpha', .15), at('toll', 0), at('toll', .15));
  if (a <= 0) return;
  toScreen(); ctx.globalAlpha = a; ctx.fillStyle = CREAM; ctx.fillRect(0, 0, cw, chh); ctx.globalAlpha = 1;
  const port = chh > cw * 1.05, mapBox = { x: 0, y: 0, w: cw, h: chh * (port ? .5 : .6) };
  const V = view(mapBox, 60, -40, 1600 * Math.max(1, mapBox.h * 2 / mapBox.w) * .98);
  const d0 = W_START, d1 = day('2021-03-01'), d2 = day('2022-02-07');
  const d = lerp(d0, d1, ramp(P, at('alpha', .1), at('alpha', .95))) + (d2 - d1) * ramp(P, at('delta', .05), at('delta', .95));
  const wi = clamp(Math.round((d - W_START) / 7), 0, W.dweeks.length - 1);
  worldMap(V, a, c => c.dpm ? [RED, +c.dpm[wi] * .09] : null);
  paperTop(a * .6);
  // the variants: rings where each was found
  [['kent', 'ALPHA', '2020-12-14'], ['india', 'DELTA', '2021-04-05'], ['southAfrica', 'OMICRON', '2021-11-24']].forEach(([pin, name, ds]) => {
    const q = clamp((d - day(ds)) / 21); if (q <= 0) return;
    const [x, y] = W.pins[pin], sx = V.sx(x), sy = V.sy(y);
    const fade = clamp(1 - (d - day(ds) - 60) / 60);
    dot(sx, sy, fs(1.2), RED, a * Math.min(1, q * 3) * Math.max(.35, fade));
    ring(sx, sy, fs(1.2) + fs(9) * q, RED, 2.5, a * (1 - q) * fade);
    chip(name, sx + fs(2), sy - fs(3.5), { size: 3, fill: RED, a: a * Math.min(1, q * 3) * Math.max(0, fade) });
  });
  // the strips
  const X0 = fs(4), X1 = cw - fs(4), X = dd => X0 + (X1 - X0) * (dd - d0) / (d2 - d0);
  const gy = mapBox.h + fs(5), gh = (chh - gy - fs(10)) / 2;
  [[1, 3.5e6, 'CASES A DAY', INK], [2, 15000, 'DEATHS A DAY', RED]].forEach(([col, max, name, fill], j) => {
    const base = gy + gh * (j + 1) + fs(2) * j, Y = v => base - (gh - fs(5)) * Math.min(1.05, v / max);
    ctx.globalAlpha = a; ctx.strokeStyle = '#b9ad94'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X0, base); ctx.lineTo(X1, base); ctx.stroke();
    text(name, X0, base - gh + fs(3.4), { size: 2.8, fill, spacing: .12, a });
    ctx.globalAlpha = a * .85; ctx.fillStyle = fill; ctx.beginPath(); ctx.moveTo(X0, base);
    for (let i = 0; i < WAVES.length && WAVE_D[i] <= d; i++) ctx.lineTo(X(WAVE_D[i]), Y(WAVES[i][col]));
    const v = wavesAt(d); ctx.lineTo(X(d), Y(v[col - 1])); ctx.lineTo(X(d), base); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
  });
  ['2021', '2022'].forEach(y => { const x = X(day(y + '-01-01')); text(y, x + 3, chh - fs(5.5), { size: 2.6, font: SERF, weight: 400, fill: SOFT, a }); ctx.globalAlpha = a * .6; ctx.strokeStyle = '#b9ad94'; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x, chh - fs(8)); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1; });
  // the first vaccine, 2 December 2020
  const vq = clamp((d - day('2020-12-02')) / 10);
  if (vq > 0) {
    const x = X(day('2020-12-02'));
    ctx.globalAlpha = a; ctx.strokeStyle = '#2f6f9f'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x, chh - fs(8)); ctx.lineTo(x, chh - fs(8) - (chh - fs(8) - gy) * vq); ctx.stroke(); ctx.globalAlpha = 1;
    text('FIRST VACCINE', x + 4, gy + fs(3), { size: 2.6, fill: '#2f6f9f', a: a * vq });
  }
  if (d > day('2022-01-10')) chip('≈ 3.4 million cases in a day', X(day('2022-01-24')), gy + fs(3), { size: 2.8, align: 'right', a: a * clamp((d - day('2022-01-10')) / 10) });
  dateChip(fmtDate(d, false), a);
  text('Our World in Data · 7-day averages', cw - fs(3), chh - fs(1.8), { size: 2.2, font: SERF, weight: 400, fill: SOFT, align: 'right', a });
  text('deaths per million that week', fs(3), mapBox.h - fs(2), { size: 2.4, font: SERF, weight: 400, fill: SOFT, a });
}

function sceneAge(P) {
  const a = win(P, at('age', .05), at('age', .2), at('over', 0), at('over', .15));
  if (a <= 0) return;
  toScreen();
  let port = chh > cw, g = Math.min(port ? cw * .8 : cw * .38, chh * (port ? .3 : .55)) / 10;
  const gp = port ? Math.min(g, (chh * .78 - fs(24)) / 20) : g;
  const boxes = port ? [[cw / 2 - 5 * gp, chh * .1 + fs(5)], [cw / 2 - 5 * gp, chh * .1 + 10 * gp + fs(19)]] : [[cw * .27 - 5 * g, chh * .2], [cw * .73 - 5 * g, chh * .2]];
  g = gp;
  [['AGE 10', '2 in 100,000', 0, .2], ['AGE 85', '15 in 100', 15, .45]].forEach(([title, sub, red, t0], j) => {
    const [x0, y0] = boxes[j], o = a * ramp(P, at('age', t0), at('age', t0 + .1));
    for (let i = 0; i < 100; i++) {
      const hot = i < red && P > at('age', t0 + .1 + i * .012);
      ctx.globalAlpha = o; ctx.fillStyle = hot ? RED : 'rgba(243,237,224,.16)'; ctx.fillRect(x0 + (i % 10) * g + 1, y0 + Math.floor(i / 10) * g + 1, g - 2, g - 2);
    }
    ctx.globalAlpha = 1;
    text(title, x0, y0 - fs(5.5), { size: 4.4, weight: 600, fill: CREAM, spacing: .1, a: o });
    text(sub + ' infected die', x0, y0 - fs(1.6), { size: 3, font: SERF, weight: 400, fill: CREAM, a: o });
  });
  const [bx, by] = boxes[0];
  text('the red here is 1/500 of one square', bx, by + 10 * g + fs(4), { size: 2.6, font: SERF, weight: 400, italic: true, fill: CREAM, a: a * ramp(P, at('age', .35), at('age', .45)) });
  text('7,500× HIGHER', cw / 2, chh - fs(5), { size: 6, weight: 600, fill: RED, align: 'center', a: a * ramp(P, at('age', .8), at('age', .9)) });
}

// countries still reporting new cases, each a dot, going out one by one (2022 to 2024)
function sceneOver(P) {
  const a = ramp(P, at('over', .05), at('over', .2)) * (1 - ramp(P, at('origin', .2), at('origin', .3)));
  if (a <= 0) return;
  const [x, y, r] = cam(ORIGIN_CAM(), P), V = view(full(), x, y, r);
  worldMap(V, a);
  const n = QUIET.points.length - 1, ki = (n) * ramp(P, at('over', .2), at('over', .9)), k = Math.round(ki);
  let cnt = 0;
  for (const [iso, bits] of Object.entries(QUIET.bits)) {
    const c = W.countries[iso]; if (!c) continue;
    const on = bits[k] === '1'; if (on) cnt++;
    dot(V.sx(c[3]), V.sy(c[4]), fs(.8), RED, a * (on ? 1 : 0) * (1 - ramp(P, at('origin', 0), at('origin', .1))));
  }
  paperTop(a);
  const ta = a * (1 - ramp(P, at('origin', 0), at('origin', .1)));
  dateChip(fmtDate(day(QUIET.points[k])), ta);
  chip(`${cnt} countries still reporting cases`, cw - fs(3), fs(4.5), { size: 3.2, align: 'right', a: ta });
  const em = day('2023-05-05'), dd = day(QUIET.points[k]);
  chip('5 May 2023: the WHO ends the emergency', cw / 2, chh - fs(5), { size: 3.2, align: 'center', fill: CREAM, bg: INK, a: ta * clamp((dd - em + 30) / 30) });
}

function sceneOrigin(P) {
  const a = ramp(P, at('origin', .2), at('origin', .3));
  if (a <= 0) return;
  const [x, y, r] = cam(ORIGIN_CN(), P), V = view(full(), x, y, r);
  chinaMap(V, a, { detail: 1 });
  paperTop(a);
  const sides = [[CN.market, 'NATURE', 'Huanan Seafood Market', 'many scientists; the WHO-convened study, 2021', .4], [CN.wiv, 'A LAB ACCIDENT', 'Wuhan Institute of Virology', 'the FBI; the US Department of Energy', .62]];
  sides.forEach(([[mx, my], title, place, who, t0], j) => {
    const o = a * ramp(P, at('origin', t0), at('origin', t0 + .08)), sx = V.sx(mx), sy = V.sy(my);
    dot(sx, sy, fs(1.1), INK, o); ring(sx, sy, fs(2.8), INK, 2.5, o);
    text(place.toUpperCase(), sx, sy + (j ? fs(7) : -fs(5)), { size: 2.8, align: 'center', spacing: .1, a: o });
    const cy = j ? chh - fs(14) : fs(12);
    chip(title, cw / 2, cy, { size: 4, align: 'center', a: o });
    text(who, cw / 2, cy + fs(5.5), { size: 2.8, font: SERF, weight: 400, italic: true, align: 'center', a: o * ramp(P, at('origin', t0 + .1), at('origin', t0 + .2)) });
  });
  // the end: dark, and the count
  const e = ramp(P, at('end', .35), at('end', .6));
  veil(NIGHT, .9 * e);
  text('AN OPEN QUESTION', cw / 2, chh * .42, { size: 6, weight: 600, fill: CREAM, align: 'center', spacing: .06, a: e });
  text('some 27 million lives', cw / 2, chh * .42 + fs(8), { size: 4.6, font: SERF, weight: 400, italic: true, fill: RED, align: 'center', a: ramp(P, at('end', .55), at('end', .75)) });
}

/* ---------- one frame ---------- */
function render(P) {
  // the ground over every device px (cw x chh can end mid-pixel, and a half-covered edge would keep the last frame)
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
  ctx.fillStyle = NIGHT; ctx.fillRect(0, 0, cv.width, cv.height);
  grainA = 0;
  sceneOpen(P);
  sceneCount(P, 1 - ramp(P, at('wuhan', 0), at('wuhan', .12)));
  sceneChina(P);
  sceneLi(P);
  sceneDouble(P);
  sceneWorld(P);
  sceneItaly(P);
  sceneBergamo(P);
  scenePhotos(P);
  sceneSky(P);
  sceneWaves(P);
  sceneCount(P, win(P, at('toll', .05), at('toll', .2), at('age', 0), at('age', .1)) * 1, ramp(P, at('toll', .5), at('toll', .7)));
  sceneAge(P);
  sceneOver(P);
  sceneOrigin(P);
  GRAIN.style.opacity = grainA.toFixed(3);
}

/* ---------- scroll to P ---------- */
let tops = [], trig = 0, drawn = null, queued = false;
const bar = document.querySelector('.progress i');
function layout() {
  const r = cv.getBoundingClientRect();
  cw = r.width; chh = r.height;
  dpr = Math.min(window.devicePixelRatio || 1, 3);
  cv.width = Math.round(cw * dpr); cv.height = Math.round(chh * dpr);
  U = clamp(Math.min(cw, chh) / 100, 3.4, 7);
  trig = innerHeight * parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--trig'));
  tops = STEPS.map(s => s.getBoundingClientRect().top + scrollY);
  tops.push(tops[tops.length - 1] + STEPS[STEPS.length - 1].offsetHeight);
  drawn = null;
}
// P from scrollY alone: the step whose top has passed the trigger line, and how far towards the next one
function progress() {
  const y = scrollY + trig;
  let k = -1;
  for (let i = 0; i < STEPS.length; i++) if (tops[i] <= y) k = i;
  if (k < 0) return 0;
  const f = clamp((y - tops[k]) / (tops[k + 1] - tops[k]));
  return reduced.matches ? k + 1 : k + f;   // reduced motion: each step shows its finished picture at once
}
function frame() {
  queued = false;
  const P = progress(), key = P.toFixed(4) + '|' + cw + 'x' + chh;
  if (key === drawn) return;
  const t0 = performance.now();
  render(P);
  drawn = key;
  FT.push(performance.now() - t0);
  if (FT.length > 600) FT.shift();
  bar.style.transform = `scaleX(${P / STEPS.length})`;
  document.documentElement.dataset.p = P.toFixed(4);
}
function schedule() { if (!queued) { queued = true; requestAnimationFrame(frame); } }
const FT = [];   // render times in ms, for the checks: window.scrollyStats()
window.scrollyStats = () => { const s = [...FT].sort((a, b) => a - b); return { n: s.length, median: s[s.length >> 1], p95: s[Math.floor(s.length * .95)], max: s[s.length - 1] }; };
window.scrollyP = () => progress();
window.scrollyRender = P => { render(P); drawn = null; };

addEventListener('scroll', schedule, { passive: true });
addEventListener('resize', () => { layout(); schedule(); });
reduced.addEventListener('change', () => { drawn = null; schedule(); });
new ResizeObserver(() => { layout(); schedule(); }).observe(document.body);
document.fonts.ready.then(() => { layout(); drawn = null; schedule(); });
layout(); schedule();
