/* doc.js — the pandemic film's own pieces, on top of the engine and film.js: grounds, full-bleed stills, a paper map
   of China on a camera, the globe on the beat clock, whip pans and push-throughs between beats, counters, chips.
   Everything is a pure function of the beat clock. World coordinates: GEO (img/geo.js), an orthographic view centred
   on Wuhan at (0, 0), Earth radius GEO.R. */
'use strict';
const RED = '#e5402f', YEL = '#f4c430', NIGHT = '#04060a', CHAR = '#15171c', MAPLAND = '#ece3cd', MAPSEA = '#bfcac6',
  MAPCN = '#e3d3b0', MAPINK = '#2b2520', MAPLINE = '#9a8a70';
const ease3 = p => p * p * p, unease3 = p => 1 - (1 - p) ** 3;

function ground(p, fill) { return mk('rect', { x: -40, y: -40, width: SW + 80, height: SH + 80, fill }, p); }
// a static paper grain and vignette over a paper scene (an image, cheap to composite)
function paperTop(p, o = .35) {
  const g = G(p, { o });
  mk('image', { href: '../img/paper.webp', x: 0, y: 0, width: SW, height: SH, preserveAspectRatio: 'none', style: 'mix-blend-mode:multiply' }, g);
  mk('rect', { x: 0, y: 0, width: SW, height: SH, fill: 'url(#vign)' }, g);
  return g;
}

// filters live in the stage's own defs (the scene is cleared on every seek, the stage is not)
const DEFS = mk('defs', {}, document.getElementById('stage'));
(() => {
  const r = mk('radialGradient', { id: 'vign', cx: '50%', cy: '50%', r: '75%' }, DEFS);
  mk('stop', { offset: '55%', 'stop-color': '#000', 'stop-opacity': 0 }, r);
  mk('stop', { offset: '100%', 'stop-color': '#1a1208', 'stop-opacity': .55 }, r);
})();
let blurN = 0;
// WebKit (Safari, every iOS browser) runs SVG blurs on the CPU: ~200 ms a frame over a map. There the moves stay, unblurred;
// the export (Chromium) keeps the blur
const NO_BLUR = navigator.vendor === 'Apple Computer, Inc.';
// a directional blur on el, set per frame: blur(px) along x (axis 'x') or y; 0 removes the filter. The filter region is
// the screen (in el's space, shifted back by el's own offset tx, ty): a bbox region over a world map is huge
function blurOn(el, axis = 'x') {
  if (NO_BLUR) return () => {};
  const id = 'wb' + (++blurN), f = mk('filter', { id, filterUnits: 'userSpaceOnUse', x: -400, y: -400, width: SW + 800, height: SH + 800 }, DEFS);
  const gb = mk('feGaussianBlur', { stdDeviation: '0 0', 'edge-mode': 'duplicate' }, f);
  let cur = -1;
  return (a, tx = 0, ty = 0) => {
    a = Math.round(a);
    f.setAttribute('x', -400 - tx); f.setAttribute('y', -400 - ty);   // margin > 3 blur radii: the edge pulls in no transparency
    if (a === cur) return; cur = a;
    if (a <= 0) el.removeAttribute('filter');
    else { gb.setAttribute('stdDeviation', axis === 'x' ? `${a} 0` : `0 ${a}`); el.setAttribute('filter', `url(#${id})`); }
  };
}

/* Whip pans between beats. The outgoing beat throws its frame away over the last .3 s of its hold (on the tail of its
   clock, so it never lengthens the beat); the incoming one lands from the other side with the blur dying out.
   dir: 1 = the camera swings right (the picture moves left). */
const WHIP = .32;
function whipOut(g, D, dir = 1, axis = 'x', dist = 1300) {
  const b = blurOn(g, axis);
  // clockRun inline: a tail's dur is stretched to the beat's real end, which can pass D + HOLD (a clock run to D + HOLD
  // adds another HOLD), so the throw lands on that end and the frame never freezes thrown
  const w = { t0: 0, dur: D, ease: lin, tail: true };
  w.pf = q => {
    const t = q * w.dur, E = w.dur, k = ease3(span01(t, E - WHIP, E)), o = -dir * dist * k;
    put(g, axis === 'x' ? { x: o } : { y: o });
    axis === 'x' ? b(k * 90, o) : b(k * 90, 0, o);
  };
  TW.push(w);
}
function whipIn(g, dir = 1, axis = 'x', dist = 1300, dur = WHIP + .1) {
  const b = blurOn(g, axis);
  put(g, axis === 'x' ? { x: dir * dist } : { y: dir * dist });
  prog(q => { const k = 1 - unease3(q), o = dir * dist * k; put(g, axis === 'x' ? { x: o } : { y: o }); axis === 'x' ? b(k * 90, o) : b(k * 90, 0, o); }, 0, dur, lin);
}

// a full-bleed still: covers the stage, slow push (s0 → s1) between at and until, centred on focus [fx, fy] (0..1)
function still(p, name, at, until, { s0 = 1.04, s1 = 1.14, focus = [.5, .5], o = 1 } = {}) {
  const [w, h] = ART[name], k = Math.max(SW / w, SH / h), W = w * k, H = h * k;
  const g = G(p, { x: SW / 2, y: SH / 2, s: s0, o: 0 });
  const fx = Math.min(1 - SW / 2 / W, Math.max(SW / 2 / W, focus[0])), fy = Math.min(1 - SH / 2 / H, Math.max(SH / 2 / H, focus[1]));   // never uncover an edge
  mk('image', { href: `../img/${name}.webp`, x: -W * fx, y: -H * fy, width: W, height: H, preserveAspectRatio: 'none' }, g);
  tw(g, { o }, at, .01, lin);   // a cut, never a dip
  tw(g, { s: s1 }, at, until - at, lin);
  return g;
}
// a number that rolls from a to b; fmt turns a value into text
function counter(p, x, y, a, b, t0, dur, { size = 150, fill = CREAM, font = SER, anchor = 'middle', weight = 500, fmt = v => Math.round(v).toLocaleString('en-US'), ease = out } = {}) {
  const e = T(p, fmt(a), { x, y, size, fill, font, weight, anchor, o: 0 });
  e.setAttribute('font-variant-numeric', 'tabular-nums');
  show(e, t0, .2);
  prog(q => { e.textContent = fmt(a + (b - a) * q); }, t0, dur, ease);
  return e;
}
// key words that crumble: letters drop out one by one between t0 and t0 + dur (forgetting)
function crumble(p, str, x, y, t0, dur, { size = 110, fill = CREAM, appear, seed = 5 } = {}) {
  const g = G(p, {}), W = wid(str, size, KEY, '', 600) * 1.02;
  let cx = x - W / 2;
  const R = rng(seed), letters = [];
  for (const ch of str) {
    const e = T(g, ch, { x: cx, y, size, fill, font: KEY, weight: 600, o: appear === undefined ? 1 : 0 });
    cx += wid(ch, size, KEY, '', 600) * 1.02;
    if (ch !== ' ') letters.push(e);
    if (appear !== undefined) tw(e, { o: 1 }, appear, .4);
  }
  letters.forEach(e => { const t = t0 + R() * dur * .85; tw(e, { o: 0, y: y - 14 - R() * 26 }, t, .5 + R() * .4, io); });
  return g;
}
// a small caps label with a hairline leader to (tx, ty): Vox's name tag
function chipLabel(p, str, x, y, t0, { tx, ty, fill = CREAM, line = RED, size = 24, anchor = 'start' } = {}) {
  const g = G(p, { o: 0 });
  if (tx !== undefined) {
    const l = path(g, `M${tx} ${ty}L${x} ${y + 8}`, { stroke: line, 'stroke-width': 2 }, { d: 0 }); draw(l, t0, .3);
    mk('circle', { cx: tx, cy: ty, r: 5, fill: line }, g);
  }
  const e = T(g, str.toUpperCase(), { x, y, size, fill, font: KEY, weight: 500, anchor });
  e.setAttribute('letter-spacing', '.12em');
  show(g, t0, .25);
  return g;
}
// the date at the top left (Vox's year tag with a red tick)
function dateTag(p, str, t0, { fill = CREAM, x = 70, y = 86 } = {}) {
  const g = G(p, { x, y, o: 0 });
  mk('rect', { x: 0, y: -26, width: 6, height: 32, fill: RED }, g);
  const e = T(g, str.toUpperCase(), { x: 20, y: 0, size: 28, fill, font: KEY, weight: 500 });
  e.setAttribute('letter-spacing', '.16em');
  tw(g, { o: 1 }, t0, .25);
  return g;
}

/* ---------- level of detail for the map's paths ----------
   The map holds ~2.8 M characters of path, far finer than a screen pixel at most zooms, and the browser repaints every
   point on every frame the camera moves: one core flat out, 7–16 fps (thinning the points 4× gives ~55–60). So each
   source path is parsed once into rings; the view picks a tolerance and a clip box (lodKey), and a path's d
   is rebuilt only when either changes: clipped to the box, then simplified (Douglas–Peucker). Pure in t, like the rest. */
const LOD_SRC = new Map();   // source d -> { rings: [{ p: Float64Array, closed, bb }], cache: Map(key -> d) }
function lodSource(d) {
  let s = LOD_SRC.get(d);
  if (s) return s;
  const rings = d.split('M').filter(Boolean).map(sub => {
    const p = Float64Array.from(sub.match(/-?\d+(?:\.\d+)?(?:e-?\d+)?/g), Number), bb = [Infinity, Infinity, -Infinity, -Infinity];
    for (let i = 0; i < p.length; i += 2) { bb[0] = Math.min(bb[0], p[i]); bb[1] = Math.min(bb[1], p[i + 1]); bb[2] = Math.max(bb[2], p[i]); bb[3] = Math.max(bb[3], p[i + 1]); }
    return { p, closed: sub.includes('Z'), bb };
  });
  LOD_SRC.set(d, s = { rings, cache: new Map() });
  return s;
}
// a closed ring clipped to a box (Sutherland–Hodgman); the cut edges run along the box, off screen
function clipRing(p, [x0, y0, x1, y1]) {
  let pts = p;
  for (const [k, v, keep] of [[0, x0, 1], [0, x1, -1], [1, y0, 1], [1, y1, -1]]) {
    const out = [], n = pts.length;
    if (!n) break;
    for (let i = 0; i < n; i += 2) {
      const j = (i + 2) % n, a = (pts[i + k] - v) * keep, b = (pts[j + k] - v) * keep;
      if (a >= 0) out.push(pts[i], pts[i + 1]);
      if ((a >= 0) !== (b >= 0)) { const q = a / (a - b); out.push(pts[i] + (pts[j] - pts[i]) * q, pts[i + 1] + (pts[j + 1] - pts[i + 1]) * q); }
    }
    pts = out;
  }
  return pts;
}
// an open line cut to the box: runs of points inside, each with its outside neighbours so it reaches the edge
function clipLine(p, [x0, y0, x1, y1]) {
  const ins = i => p[i] >= x0 && p[i] <= x1 && p[i + 1] >= y0 && p[i + 1] <= y1, runs = [];
  let run = null;
  for (let i = 0; i < p.length; i += 2) {
    if (ins(i) || (i > 0 && ins(i - 2)) || (i + 2 < p.length && ins(i + 2))) (run || (runs.push(run = []), run)).push(p[i], p[i + 1]);
    else run = null;
  }
  return runs;
}
function simplify(p, tol) {   // Douglas–Peucker on a flat [x, y, ...] list
  const n = p.length / 2;
  if (n < 3 || tol <= 0) return p;
  const keep = new Uint8Array(n), st = [0, n - 1], t2 = tol * tol;
  keep[0] = keep[n - 1] = 1;
  while (st.length) {
    const b = st.pop(), a = st.pop(), ax = p[2 * a], ay = p[2 * a + 1], dx = p[2 * b] - ax, dy = p[2 * b + 1] - ay, L = dx * dx + dy * dy;
    let m = -1, md = t2;
    for (let i = a + 1; i < b; i++) {
      let u = L ? ((p[2 * i] - ax) * dx + (p[2 * i + 1] - ay) * dy) / L : 0; u = u < 0 ? 0 : u > 1 ? 1 : u;
      const ex = p[2 * i] - ax - u * dx, ey = p[2 * i + 1] - ay - u * dy, e = ex * ex + ey * ey;
      if (e > md) { md = e; m = i; }
    }
    if (m > 0) { keep[m] = 1; st.push(a, m, m, b); }
  }
  const out = [];
  for (let i = 0; i < n; i++) if (keep[i]) out.push(p[2 * i], p[2 * i + 1]);
  return out;
}
const lodPts = (p, closed) => p.length < 4 ? '' : 'M' + Array.from({ length: p.length / 2 }, (_, i) => `${+p[2 * i].toFixed(2)},${+p[2 * i + 1].toFixed(2)}`).join('L') + (closed ? 'Z' : '');
function lodBuild(src, tol, box) {
  const key = tol + '|' + box;
  let d = src.cache.get(key);
  if (d !== undefined) return d;
  if (src.cache.size >= 6) src.cache.delete(src.cache.keys().next().value);   // the oldest: a beat revisits few keys
  const parts = [];
  for (const r of src.rings) {
    const bb = r.bb;
    if (box && (bb[2] < box[0] || bb[0] > box[2] || bb[3] < box[1] || bb[1] > box[3])) continue;
    const inside = !box || (bb[0] >= box[0] && bb[2] <= box[2] && bb[1] >= box[1] && bb[3] <= box[3]);
    if (r.closed) { const c = inside ? r.p : clipRing(r.p, box); if (c.length >= 6) parts.push(lodPts(simplify(c, tol), true)); }
    else for (const c of inside ? [r.p] : clipLine(r.p, box)) parts.push(lodPts(simplify(c, tol), false));
  }
  src.cache.set(key, d = parts.join(''));
  return d;
}
// the tolerance and box for a view {x, y, z}: a tolerance of half to one screen px (stepping by 2), and a box of 5 x 5
// cells of at least one view each, so the screen keeps 1.5 views of margin (a whip throws the panel 1300 px, 1.44
// views tall; a shake a few px). At wide zooms it covers everything (null: no clip). Measured on the RTX, headed
// Chromium: 12–21 ms a frame on every map beat (half a px with 7 x 7 cells: 16–29 ms)
function lodKey(s) {
  const tol = 2 ** Math.floor(Math.log2(1 / s.z)), k = 1 / tol;   // k: the bucket's widest zoom, <= s.z
  const cw = SW / k, ch = SH / k;
  if (5 * cw > 6000) return [tol, null];
  const gx = Math.floor(s.x / cw), gy = Math.floor(s.y / ch);
  return [tol, [(gx - 2) * cw, (gy - 2) * ch, (gx + 3) * cw, (gy + 3) * ch]];
}

/* ---------- the paper map of China on a camera ---------- */
function paperMap(p, D, view, { rails = false } = {}) {
  const cam = camera(p, D, view);
  const w = cam.world, nz = sw => ({ 'stroke-width': sw, 'data-sw': sw }), lods = [];
  const lp = (d, attrs, g = w) => { const e = mk('path', { ...attrs, d: '' }, g); e._lod = lodSource(d); lods.push(e); return e; };
  mk('rect', { x: -6000, y: -6000, width: 12000, height: 12000, fill: MAPSEA }, w);
  lp(GEO.land, { fill: MAPLAND, stroke: MAPLINE, ...nz(1.1) });
  lp(GEO.china, { fill: MAPCN, stroke: MAPINK, ...nz(1.6) });
  const provs = G(w, {});
  for (const n in GEO.provinces) lp(GEO.provinces[n], { fill: 'none', stroke: MAPLINE, 'data-dash': '4 3', ...nz(.9) }, provs);
  const hubei = lp(GEO.provinces.Hubei, { fill: RED, 'fill-opacity': 0, stroke: 'none' });
  lp(GEO.urban, { fill: '#cdb995', stroke: 'none' });
  lp(GEO.lakes, { fill: MAPSEA, stroke: '#8fa9ad', ...nz(.8) });
  lp(GEO.rivers10, { fill: 'none', stroke: '#8fa9ad', ...nz(1.6) });
  const rail = rails ? GEO.rails.map(d => lp(d, { fill: 'none', stroke: MAPINK, opacity: 0, ...nz(1.3) })) : [];
  const marks = G(w, {});   // dots, rings, routes: drawn by the beat
  // strokes keep their screen width: data-sw px at any zoom (vector-effect: non-scaling-stroke drops WebKit to ~12 fps);
  // the paths take the detail the view needs
  let lastKey = '';
  clockRun(t => {
    const s = cam.at(t), z = s.z, [tol, box] = lodKey(s), key = tol + '|' + box;
    if (key !== lastKey) {
      lastKey = key;
      for (const e of lods) { const d = lodBuild(e._lod, tol, box); if (d !== e._d) e.setAttribute('d', e._d = d); }
    }
    w.querySelectorAll('[data-sw]').forEach(e => e.setAttribute('stroke-width', e.dataset.sw / z));
    w.querySelectorAll('[data-dash]').forEach(e => e.setAttribute('stroke-dasharray', e.dataset.dash.split(' ').map(v => v / z).join(' ')));
  }, D, { tail: true });
  return { cam, w, hubei, rail, marks };
}
// a city dot that keeps its screen size whatever the zoom: r px at zoom z
function cityDot(g, [x, y], r, z, fill = MAPINK) { return mk('circle', { cx: x, cy: y, r: r / z, fill }, g); }
// screen-space label that tracks a world point on cam (a group with a text, faded in by show/hide on the group)
function trackLabel(p, cam, str, [wx, wy], t0, D, { size = 30, fill = MAPINK, dy = -22, spacing = '.3em', font = SER, italic = false } = {}) {
  const g = G(p, { o: 0 }), e = T(g, str.toUpperCase(), { size, fill, font, weight: 500, anchor: 'middle' });
  e.setAttribute('letter-spacing', spacing); if (italic) e.setAttribute('font-style', 'italic');
  clockRun(t => { const [sx, sy] = cam.screen(wx, wy, t); put(e, { x: sx, y: sy + dy }); }, D, { tail: true });
  show(g, t0, .3);
  return g;
}

/* ---------- the globe ---------- */
// mount the shared WebGL canvas in this panel and draw view(t) every frame
function globeShot(p, D, view, dotsOn, arcsOn) {
  const g = Globe.mount(p);
  clockRun(t => Globe.draw(view(t), dotsOn && (i => dotsOn(i, t)), arcsOn && (i => arcsOn(i, t))), D, { tail: true });
  return g;
}
const WUHAN_LL = [114.268, 30.582];
// a camera zoom on the paper map that matches the globe's half-height H
const zOfH = H => Globe.mapZoom(H, GEO.R);
const HofZ = z => SH / 2 / z / GEO.R;
