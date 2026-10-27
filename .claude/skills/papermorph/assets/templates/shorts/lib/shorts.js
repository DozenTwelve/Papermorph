/* shorts.js: the shorts kit, for an upright film (<html data-stage="portrait">, 900 x 1600) on a phone feed.
   This is the book's own copy: its colours come from lib/book.css (--dark, --light, --red, … below), fonts from
   lib/fonts.css; add the film's own pieces
   (its cast's sizes, its recurring cards, a map) in a second file of the book, loaded after this one.
   Loaded after engine.js, timings.js and icons.js; a chapter defines CHAPTER and BEATS (plain tuples mapped with
   shortsBeat), calls the engine's music() and then startShorts(). Every helper is a pure function of the beat clock, so
   pause, seek, ?beat=N&t=S and export.py agree. Sound effects are the engine's sfx(); BEAT_ID lets helpers call it. */
'use strict';
/* ---------- the look ----------
   Full bleed, one idea per shot, 1–3 s a shot.
   Platforms draw over the top 120 and the bottom 300 of the 900 x 1600 stage, and their buttons over the right 90
   between y 700 and 1300: words stay in x 50..810, y 130..1290. Pictures may run under all of it. */
const SANS = '"Oswald", "Arial Narrow", sans-serif', SERIF = '"EB Garamond", Georgia, serif';
const TEXT_CTX = document.createElement('canvas').getContext('2d');
// the palette: lib/book.css may set each as a custom property (--dark: #0b0d11), read as #rrggbb; else these defaults
const shortsColour = (name, d) => { TEXT_CTX.fillStyle = d; TEXT_CTX.fillStyle = bookSetting('--' + name) || d; return TEXT_CTX.fillStyle; };
const DARK = shortsColour('dark', '#1f1b16'), RED = shortsColour('red', '#c8281e'), TEAL = shortsColour('teal', '#2f6f73'),
  LIGHT = shortsColour('light', '#ece4d3'), MUTED = shortsColour('muted', '#8a7d68'), MARK = shortsColour('mark', '#ffd23f'),
  SEA = shortsColour('sea', '#123c44');
const CX = 450, W = 900, H = 1600;
const inkW = (str, size, font = SANS, weight = 600) => { TEXT_CTX.font = `${weight} ${size}px ${font}`; return TEXT_CTX.measureText(str).width; };
const rect = (p, x, y, w, h, attrs = {}) => mk('rect', { x, y, width: w, height: h, ...attrs }, p);
const ramp01 = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));
const smooth = q => q * q * (3 - 2 * q);
function seeded(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }
// the cut-out figures' widths at 1000 tall, by file name: the book fills it, Object.assign(MEME, { 'meme-cook': 672 })
const MEME = {};
// one meme crossing the frame left to right, then a fast swarm of the same (smaller and higher is farther away):
// first at t0 for `cross` s, h tall with its foot at y; then n more from t0 + after
function swarm(g, name, t0, { h = 560, y = 1500, cross = 1.6, n = 16, after = 1.3, seed = 7, hmin = 300, ymin = 1180 } = {}) {
  const w = MEME[name] * h / 1000;
  const e = meme(g, name, -w / 2 - 40, y, h, t0, { rise: 0, dur: .01 });
  tw(e, { x: W + w / 2 + 40 }, t0, cross, lin); sfx(BEAT_ID, t0 + .1, 'whoosh', .6);
  const R = seeded(seed);
  for (let i = 0; i < n; i++) {
    const t1 = t0 + after + i * .12 + R() * .08, far = R(), hh = hmin + (1 - far) * (h - hmin), ww = MEME[name] * hh / 1000;
    const f = meme(g, name, -ww / 2 - 20, ymin + (1 - far) * (y - ymin), hh, t1, { rise: 0, dur: .01 });
    tw(f, { x: W + ww / 2 + 20 }, t1, .55 + far * .35, lin);
    if (i % 4 === 0) sfx(BEAT_ID, t1, 'whoosh', .35);
  }
}

// A shot: a full-frame group on screen from t0 to t1, a hard cut in and out; `whip` slides it in with motion blur.
let fxN = 0;
function shot(p, t0, t1, { bg, whip = false, swipe = false } = {}) {
  const g = G(p, { o: 0 });
  // the blur is on only while the shot slides in: a filter left on costs every frame after (most in Firefox)
  const blur = (q, b, sd) => { b.setAttribute('stdDeviation', sd); if (q < 1) g.setAttribute('filter', `url(#${b.parentNode.id})`); else g.removeAttribute('filter'); };
  g._on = [t0, t1 === undefined ? Infinity : t1 + .29];   // the shot's window, which paperMap() draws in by default
  if (bg) rect(g, -20, -20, W + 40, H + 40, { fill: bg });
  if (t0 <= .01) put(g, { o: 1 }); else show(g, t0, .01, lin);   // a beat's first shot is there on its first frame
  // the old shot stays until the next one has finished sliding in (whip, swipe), so nothing shows through behind it
  if (t1 !== undefined) hide(g, t1 + .28, .01, lin);
  if (whip) {
    const id = 'whip' + (++fxN), f = mk('filter', { id, x: '-30%', y: 0, width: '160%', height: '100%' }, mk('defs', {}, g));
    const b = mk('feGaussianBlur', { stdDeviation: '0 0' }, f);
    prog(q => { put(g, { x: W * .6 * (1 - q) }); blur(q, b, `${(1 - q) * 60} 0`); }, t0, .26, out);
    sfx(BEAT_ID, t0, 'whoosh', .5);
  }
  if (swipe) {   // a feed scrolled up: the next clip rises from the bottom, blurred along its motion
    const id = 'swp' + (++fxN), f = mk('filter', { id, x: 0, y: '-30%', width: '100%', height: '160%' }, mk('defs', {}, g));
    const b = mk('feGaussianBlur', { stdDeviation: '0 0' }, f);
    prog(q => { put(g, { y: H * (1 - q) }); blur(q, b, `0 ${(1 - q) * 50}`); }, t0, .2, out);
    sfx(BEAT_ID, t0, 'whoosh', swipe === 'quiet' ? .18 : .4);
  }
  return g;
}
let BEAT_ID = '';   // the beat being built, for sfx() calls made by helpers
// a full-bleed picture with a slow push from scale s0 to s1 (and drift dx, dy) over t0..t1
function photo(g, name, t0, t1, { s0 = 1.02, s1 = 1.1, dx = 0, dy = 0, dim = 0, ai = true } = {}) {
  const im = G(g, { x: CX, y: H / 2, s: s0 });
  mk('image', { href: `../img/${name}.webp`, x: -W / 2, y: -H / 2, width: W, height: H, preserveAspectRatio: 'xMidYMid slice' }, im);
  tw(im, { s: s1, x: CX + dx, y: H / 2 + dy }, t0, t1 - t0, lin);
  if (dim) rect(g, 0, 0, W, H, { fill: '#000', opacity: dim });
  if (ai) srcTag(g, 'AI illustration', 50, 150, t0);
  return im;
}
// a found photograph, full bleed with a slow push (opts as photo()), tagged with its source instead of 'AI illustration'
function found(g, name, source, t0, t1, opts = {}) {
  const im = photo(g, name, t0, t1, { ...opts, ai: false });
  srcTag(g, source, 50, 150, t0);
  return im;
}
// a picture sized by ART (img/art.js): centred on (x, y), h (or w) px; enters at t0 rising from dy, or is there when
// t0 is undefined. A picture whose point is its text (a sign, a headline) goes in whole like this, not full bleed
function plate(g, name, x, y, { h, w, t0, dy = 60, r = 0 } = {}) {
  const [iw, ih] = ART[name], k = w ? w / iw : h / ih, e = G(g, { x, y: t0 === undefined ? y : y + dy, r, o: t0 === undefined ? 1 : 0 });
  mk('image', { href: `../img/${name}.webp`, x: -iw * k / 2, y: -ih * k / 2, width: iw * k, height: ih * k }, e);
  if (t0 !== undefined) tw(e, { y, o: 1 }, t0, .35, out);
  e._x = x; e._y = y;
  return e;
}
// a landscape picture larger than the frame, moved by a camera: keys [t, fx, fy, s], the point (fx, fy) of the picture
// (fractions of its width and height) at the frame's centre at scale s; eased between keys, the first held from 0.
// No edge ever shows (ART gives its size)
function wide(g, name, keys) {
  const [iw, ih] = ART[name], k = Math.max(H / ih, W / iw), Ws = iw * k, Hs = ih * k;
  const im = G(g, {});
  mk('image', { href: `../img/${name}.webp`, x: -Ws / 2, y: -Hs / 2, width: Ws, height: Hs }, im);
  const clamp = (v, size, frame) => size < frame ? frame / 2 : Math.min(size / 2, Math.max(frame - size / 2, v));
  const at = ([, fx, fy, s]) => ({ x: clamp(CX - s * (fx - .5) * Ws, Ws * s, W), y: clamp(H / 2 - s * (fy - .5) * Hs, Hs * s, H), s });
  put(im, at(keys[0]));
  keys.slice(1).forEach((key, i) => { const t = keys[i][0]; tw(im, at(key), t, key[0] - t, io); });
  return im;
}
// a small grey label top left: a source or "AI illustration"; shown with ?tags (as export.py shows them), so a cut
// being worked on stays clean while the calls stay in place. A long tag is set smaller to end inside x 810; a second
// tag at the same spot of the same shot (an AI picture and a number's source) stacks below the first
const TAGS = new URLSearchParams(location.search).has('tags');
function srcTag(g, str, x, y, t0) {
  if (!TAGS) return G(g, { o: 0 });
  str = str.toUpperCase();
  const at = g._tags || (g._tags = {}), n = at[x + ',' + y] = (at[x + ',' + y] || 0) + 1;
  // the box fits the drawn text: letter-spacing (.06em) adds that much after every character; 4 px spare for Gecko
  const textW = size => inkW(str, size, SANS, 500) + str.length * size * .06;
  const size = Math.min(20, 20 * (806 - x - 20) / textW(20)), w = textW(size) + 20;
  const e = G(g, { x, y: y + (n - 1) * 38, o: 0 });
  rect(e, 0, -22, w, 30, { fill: 'rgba(20,18,15,.55)', rx: 3 });
  T(e, str, { x: 10, y: 0, size, fill: '#f0ebe0', font: SANS, weight: 500 }).setAttribute('letter-spacing', '.06em');
  show(e, t0, .2, lin);
  return e;
}
// big condensed capitals popping in (a word or two); stroke: a dark edge to read over pictures. A word wider than maxW
// is set smaller to fit: 660 keeps a centred word and its stroke inside the safe box (x 50-810)
function word(g, str, x, y, t0, { size = 120, fill = DARK, anchor = 'middle', stroke, dur = .22, from = .82, maxW = 660 } = {}) {
  size = Math.min(size, size * maxW / inkW(str.toUpperCase(), size));
  const e = G(g, { x, y, s: from, o: 0 });
  const t = T(e, str.toUpperCase(), { x: 0, y: 0, size, fill, font: SANS, weight: 600, anchor });
  if (stroke) { t.setAttribute('stroke', stroke); t.setAttribute('stroke-width', size / 14); t.setAttribute('paint-order', 'stroke'); t.setAttribute('stroke-linejoin', 'round'); }
  if (t0 <= .01) put(e, { s: 1, o: 1 }); else tw(e, { s: 1, o: 1 }, t0, dur, out);   // there on a beat's first frame
  e._w = inkW(str.toUpperCase(), size);
  return e;
}
// a label: caps on a solid block (Vox's MARY / JESUS chips); not `chip`, which is the engine's own
function label(g, str, x, y, t0, { size = 40, fill = DARK, colour = LIGHT, anchor = 'middle', pad = 18 } = {}) {
  const w = inkW(str.toUpperCase(), size, SANS, 600) + pad * 2, x0 = anchor === 'middle' ? -w / 2 : anchor === 'end' ? -w : 0;
  const e = G(g, { x, y, s: .85, o: 0 });
  rect(e, x0, -size * .95, w, size * 1.3, { fill, rx: 4 });
  T(e, str.toUpperCase(), { x: x0 + pad, y: 0, size, fill: colour, font: SANS, weight: 600 });
  if (t0 <= .01) put(e, { s: 1, o: 1 }); else tw(e, { s: 1, o: 1 }, t0, .18, out);   // there on a beat's first frame
  return e;
}
// lines of a sentence as stacked chips, each popping in turn
function band(g, lines, y, t0, { size = 64, fill = DARK, colour = LIGHT, step = .25, lh = 1.3 } = {}) {
  lines.forEach((l, i) => label(g, l, CX, y + i * size * lh, t0 + i * step, { size, fill, colour }));
}
// a yellow marker swept behind [x, y, w, h]
function marker(g, x, y, w, h, t0, dur = .3) {
  const r = rect(g, x, y, 0, h, { fill: MARK });
  prog(q => r.setAttribute('width', w * q), t0, dur, out);
  return r;
}
// a Phosphor icon (fill weight), size px square, centred on (x, y)
function ico(g, name, x, y, size, fill, t0, { from = .5, dur = .25 } = {}) {
  const e = G(g, { x, y, s: from, o: 0 });
  const sv = mk('svg', { x: -size / 2, y: -size / 2, width: size, height: size, viewBox: '0 0 256 256', fill }, e);
  sv.innerHTML = ICONS[name];
  if (t0 === undefined) put(e, { s: 1, o: 1 }); else tw(e, { s: 1, o: 1 }, t0, dur, out);
  return e;
}
// a meme cut-out, h tall, its foot at (x, y); rises in from below
function meme(g, name, x, y, h, t0, { flip = false, rise = 260, dur = .35 } = {}) {
  const w = MEME[name] * h / 1000, e = G(g, { x, y: y + rise, o: 0 });
  const im = mk('image', { href: `../img/${name}.webp`, x: -w / 2, y: -h, width: w, height: h }, e);
  if (flip) im.setAttribute('transform', 'scale(-1,1)');
  if (t0 <= .01 && rise === 0) put(e, { y, o: 1 }); else tw(e, { y, o: 1 }, t0, dur, out);   // already standing on a beat's first frame
  e._y = y;
  return e;
}
// a rubber stamp slammed on
function stamp(g, str, x, y, t0, { size = 110, colour = RED, r = -9 } = {}) {
  const w = inkW(str, size) + 60, e = G(g, { x, y, r, s: 1.7, o: 0 });
  rect(e, -w / 2, -size * .85, w, size * 1.2, { fill: 'none', stroke: colour, 'stroke-width': size / 11, rx: 10 });
  T(e, str, { y: size * .3, size, fill: colour, font: SANS, weight: 600, anchor: 'middle' });
  tw(e, { s: 1, o: 1 }, t0, .16, out);
  sfx(BEAT_ID, t0, 'bang', 1.4);
  return e;
}
// a number counting up to n over dur; set smaller when its last value is wider than maxW, as word()
function counter(g, n, x, y, t0, { size = 90, fill = DARK, anchor = 'middle', dur = 1.1, pre = '', ticks = true, maxW = 660 } = {}) {
  size = Math.min(size, size * maxW / inkW(pre + Math.round(n).toLocaleString('en-US'), size));
  const t = T(g, pre + '0', { x, y, size, fill, font: SANS, weight: 600, anchor, o: 0 });
  show(t, t0, .1, lin);
  prog(q => { t.textContent = pre + Math.round(n * q).toLocaleString('en-US'); }, t0, dur, out);
  if (ticks) for (let k = 0; k < 6; k++) sfx(BEAT_ID, t0 + k * dur / 6, 'tick', .45);
  return t;
}
// a phone-shaped card holding a picture (rounded, black rim)
function phoneCard(g, x, y, w, h, img) {
  const e = G(g, { x, y }), id = 'pc' + (++fxN);
  rect(e, -w / 2 - 10, -h / 2 - 10, w + 20, h + 20, { rx: 34, fill: DARK });
  mk('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 26 }, mk('clipPath', { id }, mk('defs', {}, e)));
  const im = mk('image', { href: `../img/${img}.webp`, x: -w / 2, y: -h / 2, width: w, height: h, preserveAspectRatio: 'xMidYMid slice' }, e);
  im.setAttribute('clip-path', `url(#${id})`);
  return e;
}
// white overlay text the way a travel vlog captions itself
const vlog = (g, str, y, t0) => word(g, str, CX, y, t0, { size: 96, fill: '#fff', stroke: '#000' });
// Pictures lead the voice: every cue lands LEAD s before its word, so a cut (and its 0.2 s swipe) is complete as the
// word is heard. Cutting on the word itself reads as late.
const LEAD = .22;

/* ---------- charts and cards ---------- */
// a grid of icons: n of them, cols across, from (x, y), cell size c, popping in over dur
function icons(g, name, n, cols, x, y, c, colour, t0, dur = .8) {
  const out = [];
  for (let i = 0; i < Math.ceil(n); i++) {
    const e = ico(g, name, x + (i % cols) * c + c / 2, y + Math.floor(i / cols) * c + c / 2, c * .86, colour, t0 + dur * i / Math.ceil(n), { from: .3, dur: .14 });
    out.push(e);
  }
  return out;
}
// a bar growing from a base line: up (v > 0) or down (v < 0), k px per unit
function bar(g, x, base, w, v, k, colour, t0, dur = .5) {
  const b = rect(g, x, base, w, 0, { fill: colour });
  prog(q => { const h = Math.abs(v) * k * q; b.setAttribute('y', v > 0 ? base - h : base); b.setAttribute('height', h); }, t0, dur, out);
  return b;
}
// a picture cut to a rectangle
function clipImg(g, name, x, y, w, h, rx = 0) {
  const id = 'ci' + (++fxN);
  mk('rect', { x, y, width: w, height: h, rx }, mk('clipPath', { id }, mk('defs', {}, g)));
  mk('image', { href: `../img/${name}.webp`, x, y, width: w, height: h, preserveAspectRatio: 'xMidYMid slice' }, g).setAttribute('clip-path', `url(#${id})`);
}
/* an ink price tag */
function priceTag(p, x, y, str, t0, colour = DARK) {
  const g = G(p, { x, y, o: 0, r: -4, s: 1.2 }), w = inkW(str, 80, SERIF, 500) + 90;
  path(g, `M0 0L40 -56H${w}V56H40Z`, { fill: '#f6f1e6', stroke: colour, 'stroke-width': 5 });
  mk('circle', { cx: 36, cy: 0, r: 11, fill: 'none', stroke: colour, 'stroke-width': 5 }, g);
  T(g, str, { x: 66, y: 26, size: 80, fill: colour, font: SERIF, weight: 500 });
  tw(g, { o: 1, s: 1 }, t0, .2, out);
  return g;
}

// A beat tuple to the engine's beat: BEAT_ID for the helpers' sound effects, and every cue LEAD s early.
const shortsBeat = ([id, title, run, extra]) => ({ id, title, lead: false, ...extra,
  run: (m, D) => { BEAT_ID = id; return run((k, off = 0) => Math.max(0, m(k, off) - LEAD), D); } });

// the fonts must be in before words are measured
const startShorts = () => Promise.all(['600 40px Oswald', '500 40px Oswald', 'italic 400 40px "EB Garamond"', '400 40px "EB Garamond"', '500 40px "EB Garamond"']
  .map(f => document.fonts.load(f))).then(boot);
