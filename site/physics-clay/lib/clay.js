// Papermorph science book: the clay set. Load after engine.js, figures.js and ../img/clay/clay.js (window.CLAY).
// The pictures are Blender renders of a clay tabletop (site/physics-clay/make/): plates (a set without its movers),
// sprites (one mover with its shadow, on a transparent film) and strips (a wheel or a ball at N angles, side by
// side). The page moves them exactly as it moved the pixel figures: the Blender camera is orthographic and never
// turns, so a sprite at page (x, y) is the frame Blender would render with the thing there (make/claykit.py).
// Labels, arrows, pins and readouts stay SVG over the picture.
'use strict';
const CL = window.CLAY, CLI = CL.img, CR = CL.road;   // CR: the road's lanes in page px (far, near, side) and its period W
const clSrc = name => `../img/clay/${name}.webp`;
const clOf = name => CLI[name] || (() => { throw new Error(`clay.js: no picture '${name}' in img/clay/clay.js (render it with site/physics-clay/make)`); })();
for (const name in CLI) new Image().src = clSrc(name);   // fetched at load, so a beat's first frame has its picture

// A plate, or a sprite placed by its anchor (a vehicle: the middle of its lane under its centre; a person: the feet).
function clImg(p, name, o = {}) {
  const m = clOf(name), g = G(p, o);
  mk('image', { href: clSrc(name), x: m.x, y: m.y, width: m.w, height: m.h }, g);
  return g;
}
// A strip: frame k of n shows through a window (wheels and balls turn by showing the next angle).
function clStrip(p, name, o = {}) {
  const m = clOf(name), g = G(p, o);
  const v = mk('svg', { x: m.x, y: m.y, width: m.w, height: m.h, viewBox: `0 0 ${m.w} ${m.h}` }, g);
  mk('image', { href: clSrc(name), width: m.w * m.n, height: m.h }, v);
  g._k = 0; g._n = m.n; g._r = m.r;
  g._frame = k => { k = ((k % m.n) + m.n) % m.n; if (k !== g._k) v.setAttribute('viewBox', `${(g._k = k) * m.w} 0 ${m.w} ${m.h}`); };
  return g;
}
// The frame for a thing of rolling radius r that has rolled `dist` px to the right: the nearest of the n angles.
const clTurn = (s, dist, r = s._r, lead = 0) => s._frame(Math.round(dist / r / (2 * Math.PI) * s._n) + lead);
// A vehicle: its body, and its wheels over it. clRoll(v, dist) turns the wheels by the distance driven.
function clVehicle(p, name, o) {
  const m = clOf(name), g = clImg(p, name, o);
  g._wheels = m.wheels.map(([x, y]) => clStrip(g, m.wheel, { x, y }));
  g._r = m.r;
  return g;
}
const clRoll = (v, dist) => v._wheels.forEach((w, i) => clTurn(w, dist, v._r, i * 7));   // each wheel was pressed on at its own angle
const clTruck = (p, o) => clVehicle(p, 'truck', { y: CR.far, ...o }), clCar = (p, o) => clVehicle(p, 'car', { y: CR.near, ...o });
const clCarL = (p, o) => clVehicle(p, 'car_l', { y: CR.near, ...o });   // your car facing left (built mirrored, so its windows and wheels face us)
// The road on a camera, as phRoad: the plate repeats every CR.W px, so a follow shot can run any distance.
// Returns the layers to add things to, back to front: side (people on the far pavement), vehicles, front (labels).
function clRoad(cam) {
  const m = clOf('road'), back = cam.layer(1, CR.W);
  for (let k = -1; k <= 2; k++) mk('image', { href: clSrc('road'), x: k * CR.W, y: m.y, width: m.w, height: m.h }, back);
  return { scenery: back, side: G(cam.world), vehicles: G(cam.world), front: G(cam.world) };
}
// A scrim over the foot of the picture: labels there keep their contrast over the bright near ground.
{
  const g = mk('linearGradient', { id: 'clScrim', x1: 0, y1: 0, x2: 0, y2: 1 }, mk('defs', {}, scene.ownerSVGElement));
  mk('stop', { offset: 0, 'stop-color': COL.board, 'stop-opacity': 0 }, g);
  mk('stop', { offset: .45, 'stop-color': COL.board, 'stop-opacity': .7 }, g);
  mk('stop', { offset: 1, 'stop-color': COL.board, 'stop-opacity': .86 }, g);
  const sky = mk('linearGradient', { id: 'clSky', x1: 0, y1: 0, x2: 0, y2: 1 }, g.parentNode);   // daylight: deep at the top, pale at the horizon
  mk('stop', { offset: 0, 'stop-color': '#3f6e9e' }, sky);
  mk('stop', { offset: .65, 'stop-color': '#7fa9cc' }, sky);
  mk('stop', { offset: 1, 'stop-color': '#c9ddea' }, sky);
}
const clScrim = (p, y0 = 680, o = {}) => put(mk('rect', { x: 0, y: y0, width: SW, height: SH - y0, fill: 'url(#clScrim)' }, p), o);
// A prop that holds text, standing in the set: a chalkboard ('chalk_w', 'chalk_t') or a paper card pinned to a board
// ('card'), placed by its feet at (x, y). Returns its group and its panel's page rectangle, to lay the text out on.
function clBoard(p, name, x, y, o = {}) {
  const g = clImg(p, name, { x, y, ...o }), [x0, y0, x1, y1] = clOf(name).panel;
  return { g, x0: x + x0, y0: y + y0, x1: x + x1, y1: y + y1, cx: x + (x0 + x1) / 2, cy: y + (y0 + y1) / 2 };
}
// Text on the bright clay sky. Chalk and grey text turns to ink. A coloured label (or its small group: a legend, a
// "Measured from" tag) gets a small chalk slate behind it, which follows it every frame (place, width, opacity), and
// keeps its chalk colours on the slate. Call it at the end of a beat with the page y the sky reaches down to; texts lower
// down, or in skip rectangles ([x0, y0, x1, y1], e.g. a chalkboard), are left alone. { ink: false }: slates only.
// D: the beat's length (the slates follow their labels on the beat clock, after the labels' own tweens).
const INK = '#1d2a33', INK2 = '#3b5260';
function inkOf(c) { c = (c || '').toLowerCase(); return c === COL.chalk ? INK : c === COL.dim || c === COL.faint ? INK2 : null; }
function skyInk(p, D, below = 9999, skip = [], { ink = true } = {}) {
  const onSky = [], units = new Set();
  for (const t of p.querySelectorAll('text')) {
    const m = t.getCTM(), b = t.getBBox();
    if (!m || !b.width) continue;
    const cx = m.e + m.a * (b.x + b.width / 2), cy = m.f + m.d * (b.y + b.height / 2);
    if (cy > below || skip.some(([x0, y0, x1, y1]) => cx > x0 && cx < x1 && cy > y0 && cy < y1)) continue;
    onSky.push(t);
    const runs = t.querySelectorAll('tspan').length ? [...t.querySelectorAll('tspan')] : [t];
    if (runs.some(e => !inkOf(e.getAttribute('fill') || t.getAttribute('fill')))) {
      const par = t.parentNode, pb = par !== p && par.getBBox();
      units.add(pb && pb.width < 760 && pb.height < 140 ? par : t);
    }
  }
  for (const t of onSky) {   // ink for what has no slate behind it
    if ([...units].some(u => u === t || u.contains(t)) || !ink) continue;
    for (const e of t.querySelectorAll('tspan').length ? t.querySelectorAll('tspan') : [t]) { const k = inkOf(e.getAttribute('fill') || t.getAttribute('fill')); if (k) e.setAttribute('fill', k); }
    t.removeAttribute('stroke');
  }
  units.forEach(u => slateBehind(u, D));
}
function slateBehind(u, D) {
  const slate = (parent, before, b) => {   // the nearest of two slates, stretched to the box b (padded)
    const w = b.width + 40, h = b.height + 20;
    const im = mk('image', { preserveAspectRatio: 'none', href: clSrc(w > 380 ? 'slate_l' : 'slate_s'), x: b.x - 20, y: b.y - 10, width: w, height: h });
    parent.insertBefore(im, before);
    return im;
  };
  if (u.tagName !== 'text') {   // a group: the slate inside it shares its fades and place (room for a readout that grows)
    const b = u.getBBox(); slate(u, u.firstChild, { x: b.x, y: b.y, width: b.width + 34, height: b.height }); return;
  }
  // a single label: the slate is its sibling and follows its place, width and opacity on the beat clock
  const g = mk('g', {}); u.parentNode.insertBefore(g, u);
  let im = null, key = '';
  const sync = () => {
    const b = u.getBBox(), tf = u.getAttribute('transform') || '', op = u.getAttribute('opacity') ?? '1';
    const k = [b.x, b.y, b.width, b.height, tf, op].join();
    if (k === key) return; key = k;
    if (tf) g.setAttribute('transform', tf); else g.removeAttribute('transform');
    g.setAttribute('opacity', op);
    if (im) im.remove();
    im = slate(g, null, b);
  };
  sync(); clockRun(sync, D);
}
// Text on a paper card: ink, no outline.
function paperInk(g) {
  for (const t of g.querySelectorAll('text')) {
    for (const e of [t, ...t.querySelectorAll('tspan')]) { const k = inkOf(e.getAttribute('fill')); if (k) e.setAttribute('fill', k); }
    t.removeAttribute('stroke');
  }
}
