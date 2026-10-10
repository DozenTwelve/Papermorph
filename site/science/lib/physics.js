// Papermorph science book: shared lesson helpers for physics chapters (load after engine.js and figures.js).
// Copied from ch09's chapter-local helpers (ch09 keeps its own copies, unchanged).
'use strict';
const txt = (p, s, x, y, t0, { size = 32, fill = COL.chalk, anchor = 'middle', weight = 600 } = {}) => { const e = T(p, s, { x, y, size, fill, anchor, weight, o: 0 }); show(e, t0); return e; };
// One line with coloured runs: [[text, colour?], …].
function runs(p, parts, { x, y, size = 40, anchor = 'middle', weight = 600, o = 0 }) {
  const t = T(p, '', { x, y, size, anchor, weight, o });
  parts.forEach(([s, c]) => { const sp = mk('tspan', { fill: c || COL.chalk }, t); sp.textContent = s; });
  return t;
}
function arrowPath(x1, y, x2) { const d = Math.sign(x2 - x1); return `M${x1} ${y}H${x2}M${x2 - 16 * d} ${y - 11}L${x2} ${y}L${x2 - 16 * d} ${y + 11}`; }
const DIST = COL.rat, TIME = COL.whole;          // distance pink (as "change of position" in part 1), time blue
const walkTo = (r, x, step = 22) => phPose(r, 'walk', x / step * Math.PI);   // two frames per stride, from x
// A measured track: a bar with ticks every `every` meters from 0 to `to`, U px per meter.
function meterTrack(p, { x0, U, y, to, every, size = 26 }) {
  const g = G(p);
  phBlock(g, x0 - 20, y, U * to + 40, 14, '#8a6f55', { top: 4, ol: 0 });
  for (let v = 0; v <= to; v += every) {
    mk('rect', { x: x0 + U * v - 2, y: y + 14, width: 4, height: 14, fill: COL.dim }, g);
    T(g, String(v), { x: x0 + U * v, y: y + 56, size, fill: COL.chalk, anchor: 'middle' });
  }
  T(g, 'meters', { x: x0 + U * to + 36, y: y + 56, size: size - 2, fill: COL.dim });
  return g;
}
// A fraction in words or numbers (upright text, no math italics), centred on x with its bar at y.
function wfrac(p, top, bot, x, y, { size = 44, ct = COL.chalk, cb = COL.chalk, o = 0 } = {}) {
  const g = G(p, { x, y, o }), w = Math.max(uiW(top, size), uiW(bot, size)) + 24;
  T(g, top, { y: -size * .32, size, fill: ct, anchor: 'middle', weight: 600 });
  mk('rect', { x: -w / 2, y: -2, width: w, height: 4, rx: 2, fill: COL.chalk }, g);
  T(g, bot, { y: size * 1.02, size, fill: cb, anchor: 'middle', weight: 600 });
  g._w = w;
  return g;
}
// A sim clock: stopwatch plus "N s" under it; set(sec) turns the hand (one turn per minute) and writes whole seconds.
function simClock(p, x, y, r = 46) {
  const sw = phStopwatch(p, { x, y, r }), lab = T(p, '0 s', { x, y: y + r + 48, size: 32, weight: 700, fill: TIME, anchor: 'middle' });
  return { sw, lab, set(sec) { put(sw._hand, { r: sec * 6 }); phText(lab, `${Math.floor(sec + 1e-6)} s`); } };
}
const ramp = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));
const VEL = COL.int;                             // velocity arrows and readouts: yellow
// Set path el to an arrow from (x, y), len long, at angle a (degrees; 0 = right, −90 = up).
function arrowAt(el, x, y, len, a, head = 18) {
  const r = a * Math.PI / 180, c = Math.cos(r), s = Math.sin(r), x2 = x + len * c, y2 = y + len * s;
  el.setAttribute('d', len < 2 ? '' : `M${x} ${y}L${x2} ${y2}M${x2 - head * c - head * .6 * s} ${y2 - head * s + head * .6 * c}L${x2} ${y2}L${x2 - head * c + head * .6 * s} ${y2 - head * s - head * .6 * c}`);
  return el;
}
const ACC = '#ee6fd0';                           // acceleration: magenta (velocity stays yellow)
const FORCE = '#ff7a45', NETF = COL.chalk;      // forces: orange arrows; the net force: a thick white arrow
// Where a label goes for the arrow from (x, y), len long at angle ang: the baseline point of a middle-anchored label
// whose ink box clears the shaft (and the head, when the label reaches it) by 12 px at any angle. side picks the
// shaft's 'above' / 'below' / 'left' / 'right' side (default: above, or right of a near-vertical arrow), the side a
// direction [dx, dy] points to, or 'tip' to put it just past the head.
const LABW = new Map();
function arrowLabelAt(x, y, len, ang, str, size, w, side) {
  const key = size + str; let tw = LABW.get(key);
  if (tw === undefined) { ctx2d.font = `700 ${size}px ${UI}`; LABW.set(key, tw = ctx2d.measureText(str).width / 2); }
  const r = ang * Math.PI / 180, c = Math.cos(r), s = Math.sin(r), th = .44 * size, head = 12 + w;
  let bx, by, nx, ny, clear;
  if (side === 'tip') { bx = x + len * c; by = y + len * s; nx = c; ny = s; clear = 12; }
  else {
    const [px, py] = Array.isArray(side) ? side : { above: [0, -1], below: [0, 1], left: [-1, 0], right: [1, 0] }[side] || (Math.abs(c) > .3 ? [0, -1] : [1, 0]);
    const m = Math.max(0, len - head) / 2;   // beside the middle of the shaft, not counting the head
    bx = x + m * c; by = y + m * s; nx = s; ny = -c;
    if (nx * px + ny * py < 0) { nx = -nx; ny = -ny; }
    const along = Math.abs(c) * tw + Math.abs(s) * th;   // the label's half-extent along the shaft
    clear = 12 + (m + along + 12 > len - head ? head * .6 : w / 2);
  }
  const k = clear + Math.abs(nx) * tw + Math.abs(ny) * th;
  return [bx + nx * k, by + ny * k + .28 * size];   // ink centre to baseline
}
// A labelled force arrow: f.set(x, y, len, angle, text, side, dx, dy) draws it from (x, y) with its label beside the
// shaft (see arrowLabelAt for side), nudged by dx, dy. len 0 hides it.
function forceArrow(p, { color = FORCE, w = 9, size = 28 } = {}) {
  const g = G(p), a = path(g, '', { stroke: color, 'stroke-width': w }), lab = phLabel(g, '', { size, fill: color });
  return Object.assign(g, {
    set(x, y, len, ang = 0, text = '', side, dx = 0, dy = 0) {
      arrowAt(a, x, y, len, ang, 12 + w); phText(lab, len > 1 ? text : '');
      const [lx, ly] = arrowLabelAt(x, y, len, ang, text, size, w, side); put(lab, { x: lx + dx, y: ly + dy });   // every frame, so replays match
    },
  });
}
// A crate (centred on x, sitting on y); returns the group. The label's baseline sits at labelY (from the bottom; default
// the middle), e.g. higher up when a weight arrow starts at the centre.
function crate(p, { x = 0, y = 0, w = 150, h = 130, label = '', labelY = -h / 2 + 10 } = {}) {
  const g = G(p, { x, y });
  phBlock(g, -w / 2, -h, w, h, '#a87a4f', { top: 8, right: 14, ol: 0 });
  path(g, `M${-w / 2 + 10} ${-h + 18}L${w / 2 - 24} -10M${-w / 2 + 10} -10L${w / 2 - 24} ${-h + 18}`, { stroke: '#7d5737', 'stroke-width': 8 });
  if (label) phLabel(g, label, { y: labelY, size: 30 });
  return g;
}

/* ---------- pixel actors (lib/actors.js, img/actor_<role>.png) ---------- */
// One sprite sheet per role; a frame is chosen by the viewBox of a nested <svg>, so swapping frames never refetches
// an image. The origin is the feet centre; face(-1) mirrors. Stride tables keep feet from skating: STEP is the
// distance (world px) the body moves per frame of each gait.
const STEP = { walk: 11, run: 26, push: 10, pull: 10, stumble: 14, backstep: 13 };
function phActor(p, role = 'you', { x = 0, y = 0, s = 1, o = 1, anim = 'stand' } = {}) {
  const A = ACTORS, w = A.W * PX, h = A.H * PX, rows = Object.keys(A.anims).length, cols = Math.max(...Object.values(A.anims).map(a => a.n));
  const g = G(p, { x, y, s, o }), inner = mk('g', {}, g);
  const sv = mk('svg', { x: -A.X0 * PX, y: -h, width: w, height: h, viewBox: `0 0 ${w} ${h}` }, inner);
  mk('image', { href: `../img/actor_${role}.png`, width: w * cols, height: h * rows, style: 'image-rendering: pixelated' }, sv);
  return Object.assign(g, {
    _dir: 1,
    // Show frame k (wrapped) of an animation.
    show(name, k = 0) {
      const a = A.anims[name], f = ((Math.floor(k) % a.n) + a.n) % a.n, vb = `${f * w} ${a.row * h} ${w} ${h}`;
      g._anim = name; g._f = f;
      if (sv._vb !== vb) sv.setAttribute('viewBox', sv._vb = vb);
      return g;
    },
    // A gait frame from the distance travelled, so the feet keep pace with the ground.
    stride(name, dist) { return g.show(name, Math.abs(dist) / STEP[name]); },
    face(dir) { if (dir !== g._dir) { g._dir = dir; if (dir < 0) inner.setAttribute('transform', 'scale(-1,1)'); else inner.removeAttribute('transform'); } return g; },
    // World position of a hand ('F' front, 'B' back) in the current frame.
    hand(which = 'F') { const st = g._st, [hx, hy] = A.anims[g._anim].hands[g._f][which]; return [st.x + hx * PX * st.s * g._dir, st.y + hy * PX * st.s]; },
  }).show(anim);
}
// Our bicycle with spinning SVG wheels and a pedalling rider: bike.ride(dist) turns wheels and cranks.
function phBike(p, role = 'you', o = {}) {
  const g = G(p, o), B = ACTORS.bike, w = ACTORS.W * PX, h = ACTORS.H * PX;
  const wheels = B.wheels.map(([wx, wy]) => {
    const wg = G(g, { x: wx * PX + PX / 2, y: wy * PX }), r = B.r * PX;
    mk('circle', { r, fill: 'none', stroke: '#2c3337', 'stroke-width': 7 }, wg);
    path(wg, `M${-r} 0H${r}M0 ${-r}V${r}`, { stroke: '#9aa5a8', 'stroke-width': 3 });
    return wg;
  });
  mk('image', { href: '../img/bicycle.png', x: -ACTORS.X0 * PX, y: -h, width: w, height: h, style: 'image-rendering: pixelated' }, g);
  const rider = phActor(g, role, { anim: 'pedal' });
  return Object.assign(g, { ride(dist) { const r = B.r * PX; wheels.forEach(wg => put(wg, { r: dist / r * 180 / Math.PI })); rider.show('pedal', dist / (2 * Math.PI * r * 1.5) * 8); return g; } });
}
