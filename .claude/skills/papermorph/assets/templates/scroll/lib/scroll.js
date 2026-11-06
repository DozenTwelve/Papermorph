/* scroll.js: the scroll page kit. The picture is a pure function of one number, P = k + f: step k (0-based, in page
   order) and the fraction f of the way through it, read from scrollY alone. Every mark on the canvas fades, grows or
   moves over a window of P, so the last frame of a step is the first frame of the next and scrolling back plays
   everything in reverse. The canvas redraws only when P or its size changes.

   The page's own script (story.js) draws: it calls scrollStory(draw) once, and draw(P) paints every scene for that P
   with the helpers below. Steps are the page's <section class="step" data-key="…"> in order; at('key', f) is the P
   of the fraction f through that step. Colours and fonts come from the page's CSS (--paper --ink --soft --accent
   --night, --font-key, --font-text), so a book changes them in its own <style>, not here.

   For the checks: scrollyP() the P of the current scroll, scrollyRender(P) draws one P, scrollyStats() render times,
   scrollySteps() the step keys; <html data-p> holds the P last drawn. A step without a data-key, a key used twice,
   at() of a key no step has and a picture that fails to load are reported on the console as errors. */
'use strict';

const cv = document.querySelector('.graphic canvas'), ctx = cv.getContext('2d'), GRAIN = document.querySelector('.graphic .grain');
const STEPS = [...document.querySelectorAll('.step')], STEP_AT = {};
STEPS.forEach((s, i) => {
  const k = s.dataset.key;
  if (!k) console.error(`scroll.js: step ${i + 1} (#${s.id || '?'}) has no data-key: at() cannot reach it`);
  else if (k in STEP_AT) console.error(`scroll.js: data-key="${k}" is on steps ${STEP_AT[k] + 1} and ${i + 1}: at('${k}') reaches the first`);
  else STEP_AT[k] = i;
});
const missingKeys = new Set();
function at(key, f = 0) {
  if (key in STEP_AT) return STEP_AT[key] + f;
  if (!missingKeys.has(key)) { missingKeys.add(key); console.error(`scroll.js: at('${key}'): no step has data-key="${key}" (keys: ${Object.keys(STEP_AT).join(', ')})`); }
  return NaN;
}
const reduced = matchMedia('(prefers-reduced-motion: reduce)');

/* ---------- small maths ---------- */
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ease = t => t * t * (3 - 2 * t);
// 0 before a, 1 after b, eased between: every fade and move on the page is one of these
const ramp = (P, a, b) => ease(clamp((P - a) / (b - a)));
// on over [a, b], off over [c, d]
const win = (P, a, b, c, d) => ramp(P, a, b) * (1 - ramp(P, c, d));
const lerp = (a, b, t) => a + (b - a) * t;
const rng = seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647;   // the same "random" layout every scroll

/* ---------- colours and fonts, from the page's CSS ---------- */
const C = {};
let KEYF = 'sans-serif', SERF = 'serif';
function readStyle() {
  const s = getComputedStyle(document.documentElement), v = n => s.getPropertyValue(n).trim();
  for (const n of ['paper', 'ink', 'soft', 'accent', 'night']) C[n] = v('--' + n) || { paper: '#f3ede0', ink: '#2b2520', soft: '#6a6258', accent: '#e5402f', night: '#04060a' }[n];
  KEYF = v('--font-key') || KEYF; SERF = v('--font-text') || SERF;
  HATCH = null;
}

/* ---------- pictures ---------- */
// pictures(['a', 'b']) loads img/a.webp, img/b.webp into IMG; the canvas redraws as each arrives. A name with a dot
// is taken as it is (img/map.png). A picture that fails is named on the console and draws nothing.
const IMG = {};
function pictures(names) {
  for (const n of names) {
    if (IMG[n]) continue;
    const im = new Image(), src = `img/${n.includes('.') ? n : n + '.webp'}`;
    im.onload = () => { drawn = null; schedule(); };
    im.onerror = () => console.error(`scroll.js: picture ${src} did not load`);
    im.src = src;
    IMG[n] = im;
  }
}
const ready = im => im && im.complete && im.naturalWidth;

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

// hatching that keeps its screen size at any zoom: an accent tint and diagonal strokes, in device px
let HATCH = null, hatchDpr = 0;
function hatch(V) {
  if (!HATCH || hatchDpr !== dpr) {
    const n = Math.round(7 * dpr), c = document.createElement('canvas'); c.width = c.height = n;
    const g = c.getContext('2d'); g.globalAlpha = .18; g.fillStyle = C.accent; g.fillRect(0, 0, n, n); g.globalAlpha = 1;
    g.strokeStyle = C.accent; g.lineWidth = n * .3;
    g.beginPath(); for (let k = -1; k <= 1; k++) { g.moveTo(k * n, n); g.lineTo(k * n + n, 0); } g.stroke();
    HATCH = ctx.createPattern(c, 'repeat'); hatchDpr = dpr;
  }
  HATCH.setTransform(new DOMMatrix().scale(1 / (dpr * V.s)));
  return HATCH;
}

/* ---------- maps from geo.py ---------- */
// geo.py's img/geo-lite.js (Natural Earth, lon/lat rings delta-encoded in 1/100 deg) as one Path2D per country, in
// world units of degrees: x = lon, y = -lat (north up), for view(), cam() and toWorld(). lod 0 is the 110m world
// (wide views), lod 1 the 50m one (close views). An equirectangular map: fine for the world or a continent; a close
// view far from the equator looks wide, so scale x by cos(lat) of the centre there (geoPaths(L, cos(lat0))).
function geoPaths(L, kx = 1) {
  const out = {};
  for (const [iso, rings] of Object.entries(L)) {
    const p = new Path2D();
    for (const r of rings) {
      let x = 0, y = 0;
      for (let i = 0; i < r.length; i += 2) { x += r[i]; y += r[i + 1]; i ? p.lineTo(x / 100 * kx, -y / 100) : p.moveTo(x / 100 * kx, -y / 100); }
      p.closePath();
    }
    out[iso] = p;
  }
  return out;
}

/* ---------- drawing helpers (screen px) ---------- */
const fs = n => n * U;   // a type size in the page's unit: ~1/100 of the graphic's shorter side, within bounds
function text(str, x, y, { size = 4, font = KEYF, weight = 500, fill = C.ink, align = 'left', base = 'alphabetic', a = 1, italic = false, spacing = 0 } = {}) {
  if (a <= 0) return;
  ctx.globalAlpha = a; ctx.fillStyle = fill; ctx.textAlign = align; ctx.textBaseline = base;
  ctx.font = `${italic ? 'italic ' : ''}${weight} ${fs(size)}px ${font}`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = spacing ? `${spacing * fs(size)}px` : '0px';
  ctx.fillText(str, x, y);
  ctx.globalAlpha = 1;
}
// a label on a paper chip, kept inside the canvas: a label near the edge slides in rather than losing its words
function chip(str, x, y, { size = 3.6, fill = C.ink, bg = C.paper, align = 'left', a = 1, font = KEYF, weight = 500 } = {}) {
  if (a <= 0) return;
  ctx.font = `${weight} ${fs(size)}px ${font}`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${.06 * fs(size)}px`;
  const w = ctx.measureText(str).width, pad = fs(size) * .45, h = fs(size) * 1.5;
  const x0 = clamp(align === 'center' ? x - w / 2 - pad : align === 'right' ? x - w - 2 * pad : x, 4, Math.max(4, cw - w - 2 * pad - 4));
  ctx.globalAlpha = a * .94; ctx.fillStyle = bg; ctx.fillRect(x0, y - h / 2, w + 2 * pad, h);
  text(str, x0 + pad, y, { size, fill, base: 'middle', a, font, weight, spacing: .06 });
}
function dot(x, y, r, fill, a = 1) { if (a <= 0) return; ctx.globalAlpha = a; ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
function ring(x, y, r, stroke, w, a = 1) { if (a <= 0) return; ctx.globalAlpha = a; ctx.strokeStyle = stroke; ctx.lineWidth = w; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke(); ctx.globalAlpha = 1; }
function veil(fill, a) { if (a <= 0) return; toScreen(); ctx.globalAlpha = a; ctx.fillStyle = fill; ctx.fillRect(0, 0, cw, chh); ctx.globalAlpha = 1; }
// a picture covering box (focus fx, fy: the point of the picture kept in view)
function cover(im, box, a = 1, fx = .5, fy = .5, scale = 1) {
  if (!ready(im) || a <= 0) return;
  const k = Math.max(box.w / im.naturalWidth, box.h / im.naturalHeight) * scale, w = im.naturalWidth * k, h = im.naturalHeight * k;
  ctx.globalAlpha = a; ctx.drawImage(im, box.x + (box.w - w) * fx, box.y + (box.h - h) * fy, w, h); ctx.globalAlpha = 1;
}
// a paper scene: the vignette over the canvas is a CSS layer (.grain), so the compositor blends it instead of the
// canvas redrawing a full-screen multiply every frame. Its opacity is the strongest paper scene on screen this frame
let grainA = 0;
function paperTop(a) { grainA = Math.max(grainA, a); }

/* ---------- one frame ---------- */
let draw = null;
function render(P) {
  // the ground over every device px (cw x chh can end mid-pixel, and a half-covered edge would keep the last frame)
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
  ctx.fillStyle = C.night; ctx.fillRect(0, 0, cv.width, cv.height);
  grainA = 0;
  toScreen();
  draw(P);
  if (GRAIN) GRAIN.style.opacity = grainA.toFixed(3);
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
  if (bar) bar.style.transform = `scaleX(${P / STEPS.length})`;
  document.documentElement.dataset.p = P.toFixed(4);
}
function schedule() { if (draw && !queued) { queued = true; requestAnimationFrame(frame); } }
const FT = [];   // render times in ms
window.scrollyStats = () => { const s = [...FT].sort((a, b) => a - b); return { n: s.length, median: s[s.length >> 1], p95: s[Math.floor(s.length * .95)], max: s[s.length - 1] }; };
window.scrollyP = () => progress();
window.scrollyRender = P => { render(P); drawn = null; };
window.scrollySteps = () => STEPS.map(s => s.dataset.key);

// The page's script hands its drawing over once; the page starts drawing then.
function scrollStory(f) {
  if (draw) return console.error('scroll.js: scrollStory() was called twice: the second drawing is ignored');
  draw = f;
  readStyle(); layout(); schedule();
}
addEventListener('scroll', schedule, { passive: true });
addEventListener('resize', () => { layout(); schedule(); });
reduced.addEventListener('change', () => { drawn = null; schedule(); });
new ResizeObserver(() => { layout(); schedule(); }).observe(document.body);
document.fonts.ready.then(() => { layout(); drawn = null; schedule(); });
addEventListener('load', () => { if (!draw) console.error('scroll.js: the page never called scrollStory(draw): nothing is drawn'); });
readStyle(); layout();
