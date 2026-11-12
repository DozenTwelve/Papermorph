// Papermorph science book: the clay set. Load after engine.js, figures.js and ../img/clay/clay.js (window.CLAY).
// The pictures are Blender renders of a clay tabletop (site/science/make/): plates (a set without its movers),
// sprites (one mover with its shadow, on a transparent film) and strips (a wheel or a ball at N angles, side by
// side). The page moves them exactly as it moved the pixel figures: the Blender camera is orthographic and never
// turns, so a sprite at page (x, y) is the frame Blender would render with the thing there (make/claykit.py).
// Labels, arrows, pins and readouts stay SVG over the picture.
'use strict';
const CL = window.CLAY, CLI = CL.img, CR = CL.road;   // CR: the road's lanes in page px (far, near, side) and its period W
const clSrc = name => `../img/clay/${name}.webp`;
const clOf = name => CLI[name] || (() => { throw new Error(`clay.js: no picture '${name}' in img/clay/clay.js (render it with site/science/make)`); })();
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
