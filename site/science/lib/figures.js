// Papermorph science book: the scene set. Load after engine.js.
// Style: pixel art. Vehicles, people, lamps, trees, houses and Earth are sprites in ../img/ (Kenney CC0 sprites and our
// own pixel art; credits in img/CREDITS.md), drawn at PX world px per sprite pixel with image-rendering: pixelated.
// Shapes that animate or teach stay SVG: road, wheel hubs, pins, labels, arrows, ball, stopwatch, notebook, Sun.
// Every figure is drawn around its own origin with the ground at y = 0, facing right (+x); place it with
// put(e, {x, y, s}) and animate it with the engine's tweens.
'use strict';
const PH = {
  out: '#14201c', road: '#3a4541', walk: '#55625b', grass: '#2d4636', line: '#ece8dc', hill1: '#22352d', hill2: '#283f34',
  glass: '#c8e0ff', metal: '#7d8a86', ocean: '#3f7fb0', land: '#4ea05a', sky: '#4f7f9c',
  you: COL.real, friend: COL.nat, truck: COL.whole, car: COL.irr, ref: COL.task, change: COL.rat,
};
const OL = 2.5;
const dk = (c, k = .22) => mix(c, '#0e1714', k), lt = (c, k = .3) => mix(c, '#ffffff', k);
const phLine = (w = OL) => ({ stroke: PH.out, 'stroke-width': w, 'stroke-linejoin': 'round' });
const phHash = (i, j) => { const v = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return v - Math.floor(v); };

/* ---------- building blocks ---------- */
// A flat block with an optional lighter top band and darker right/bottom bands (and outline, ol = 0 for none).
function phBlock(p, x, y, w, h, c, { top = 4, right = 0, bottom = 0, ol = OL } = {}) {
  mk('rect', { x, y, width: w, height: h, fill: c }, p);
  if (top) mk('rect', { x, y, width: w, height: Math.min(top, h / 2), fill: lt(c) }, p);
  if (right) mk('rect', { x: x + w - right, y, width: right, height: h, fill: dk(c) }, p);
  if (bottom) mk('rect', { x, y: y + h - bottom, width: w, height: bottom, fill: dk(c) }, p);
  if (ol) mk('rect', { x, y, width: w, height: h, fill: 'none', ...phLine(ol) }, p);
}

// Text with a thin dark outline, so it stays legible when something passes behind it.
function phLabel(p, str, { x = 0, y = 0, size = 30, fill = COL.chalk, anchor = 'middle', weight = 700, o = 1 } = {}) {
  const t = T(p, str, { x, y, size, fill, anchor, weight, o });
  // A thin, capped outline keeps small labels legible over pictures; titles (72 px and up) sit on clean board and get none.
  if (size < 72) { t.setAttribute('stroke', COL.board); t.setAttribute('stroke-width', Math.min(5, size * .16)); t.setAttribute('paint-order', 'stroke'); }
  t.setAttribute('stroke-linejoin', 'round');
  return t;
}
const phText = (t, s) => { if (t.textContent !== s) t.textContent = s; };   // per-frame text: write only on change
// Reference-point pin (an on-screen marker): the tip touches (0, 0).
function phPin(p, o = {}) {
  const g = G(p, o);
  path(g, 'M0 0C-5 -12 -19 -22 -19 -37A19 19 0 1 1 19 -37C19 -22 5 -12 0 0Z', { fill: PH.ref, ...phLine() });
  path(g, 'M-11 -44A12 12 0 0 1 -2 -53', { stroke: lt(PH.ref, .5), 'stroke-width': 3.5 });
  mk('circle', { cx: 0, cy: -37, r: 7, fill: COL.board }, g);
  return g;
}

/* ---------- sprites ---------- */
const PX = 8;                                    // world px per sprite pixel
const PH_SPR = { car: [32, 13], truck: [44, 24], lamp: [7, 27], tree: [16, 20], house: [18, 14], maya_seated: [7, 7],
  you: [9, 15], you_walk1: [7, 15], you_walk2: [11, 15], friend: [9, 15], friend_walk1: [7, 15], friend_walk2: [11, 15],
  runner: [7, 15], runner_walk1: [6, 15], runner_walk2: [11, 15], dolphin: [25, 8], walrus: [20, 11], light_red: [6, 21], light_green: [6, 21],
  car_top: [18, 8], you_top: [7, 7], bee: [9, 5],
  you_point: [13, 15], friend_point: [13, 15], rider: [8, 15], bike: [16, 10], cart: [14, 11], can: [5, 8], can_crushed: [7, 5], apple: [6, 6], you_down: [15, 5] };   // *_top: seen from above, facing east; their origin is the centre (phTop)
function phSprite(p, name, { x = 0, y = 0, s = 1, o = 1 } = {}) {
  const g = G(p, { x, y, s, o });
  g._in = mk('g', {}, g);                         // mirrored by phFace
  g._img = mk('image', { style: 'image-rendering: pixelated' }, g._in);
  phFrame(g, name);
  return g;
}
// Show another picture (animation frame) in a sprite; its bottom centre stays at the origin.
function phFrame(g, name) {
  if (g._name === name) return;
  const [w, h] = PH_SPR[name], a = { href: `../img/${name}.png`, x: -w * PX / 2, y: -h * PX, width: w * PX, height: h * PX };
  for (const k in a) g._img.setAttribute(k, a[k]);
  g._name = name;
}
// Face right (dir > 0) or left (dir < 0): mirrors the picture (and a vehicle's hubs) about the origin.
function phFace(g, dir) {
  const left = dir < 0;
  if (g._left !== left) { g._left = left; if (left) g._in.setAttribute('transform', 'scale(-1,1)'); else g._in.removeAttribute('transform'); }
}
// A sprite seen from above, centred on its origin, facing east; turn it with put(g, {r: degrees}) (−90 = north).
function phTop(p, name, o) { const g = phSprite(p, name, o), [, h] = PH_SPR[name]; g._img.setAttribute('y', -h * PX / 2); return g; }
// People (120 px tall): role 'you' (lilac), 'friend' (coral) or 'runner'. Poses: stand, walk (two frames per stride; phase in radians).
const PH_PERSON_H = 120;
const phPerson = (p, { role = 'you', ...o } = {}) => Object.assign(phSprite(p, role, o), { _role: role });
const phPose = (person, pose = 'stand', phase = 0) =>
  phFrame(person, pose === 'walk' ? `${person._role}_walk${((Math.floor(phase / Math.PI) % 2) + 2) % 2 + 1}` : person._role);

// Vehicles. Each wheel's 2×2 hub gets one light pixel that steps round it as the vehicle rolls (see phRoll).
const PH_HUBS = { car: [[3, 9], [17, 9]], truck: [[5, 20], [11, 20], [30, 20]] };   // hub top-left, in sprite px
function phVehicle(p, name, o) {
  const g = phSprite(p, name, o), [w, h] = PH_SPR[name];
  g._hubs = PH_HUBS[name].map(([hx, hy]) => {
    const x = -w * PX / 2 + hx * PX, y = -h * PX + hy * PX;
    mk('rect', { x, y, width: 2 * PX, height: 2 * PX, fill: '#3e4751' }, g._in);
    return Object.assign(mk('rect', { x, y, width: PX, height: PX, fill: PH.glass }, g._in), { _x: x, _y: y });
  });
  return g;
}
const phCar = (p, o) => phVehicle(p, 'car', o), phTruck = (p, o) => phVehicle(p, 'truck', o);
// Wheels turn with the distance rolled: a quarter turn per quarter of the wheel's circumference (radius 24), clockwise going right.
function phRoll(v, dist) {
  const k = ((Math.floor(dist / 24 / (Math.PI / 2)) % 4) + 4) % 4;
  if (k === v._k) return;
  const [dx, dy] = [[0, 0], [1, 0], [1, 1], [0, 1]][v._k = k];
  v._hubs.forEach(r => { r.setAttribute('x', r._x + dx * PX); r.setAttribute('y', r._y + dy * PX); });
}
// Passenger railway carriage in flat pixel blocks, `w` long, 278 px tall; g._wins holds window centres (x).
function phCarriage(p, { x = 0, y = 0, w = 960, color = COL.real } = {}) {
  const g = G(p, { x, y });
  const x0 = -w / 2;
  phBlock(g, x0, -262, w, 222, color, { top: 0, bottom: 32, ol: 0 });
  phBlock(g, x0 + 16, -278, w - 32, 16, dk(color, .35), { top: 0, ol: 0 });
  mk('rect', { x: x0, y: -118, width: w, height: 8, fill: lt(color, .45) }, g);
  g._wins = [];
  for (let wx = x0 + 110; wx < w / 2 - 60; wx += 170) {
    mk('rect', { x: wx - 64, y: -232, width: 128, height: 96, fill: dk(color, .35) }, g);
    mk('rect', { x: wx - 56, y: -224, width: 112, height: 80, fill: PH.glass }, g);
    mk('rect', { x: wx + 16, y: -224, width: 16, height: 80, fill: '#ffffff', opacity: .5 }, g);
    g._wins.push(wx);
  }
  mk('rect', { x: w / 2 - 40, y: -250, width: 32, height: 200, fill: dk(color, .2) }, g);
  [x0 + 110, w / 2 - 110].forEach(bx => {
    mk('rect', { x: bx - 80, y: -48, width: 160, height: 16, fill: '#3b4744' }, g);
    [-46, 46].forEach(o => mk('rect', { x: bx + o - 16, y: -40, width: 32, height: 32, fill: '#3e4751' }, g));
  });
  return g;
}

/* ---------- scenery ---------- */
// Stepped (voxel) hills repeating every W px, ridge around y, filled down to y + depth.
function phHills(p, { y, amp = 40, W = ROAD.W, x0, x1, fill, seed = 1, step = 40, q = 16, depth = 700 }) {
  const f = x => y - amp * (.55 * Math.sin(2 * Math.PI * 2 * x / W + seed) + .3 * Math.sin(2 * Math.PI * 5 * x / W + 2 * seed) + .15 * Math.sin(2 * Math.PI * 11 * x / W + 3 * seed));
  let d = `M${x0} ${y + depth}`;
  for (let x = x0; x < x1; x += step) d += `V${Math.round(f(x) / q) * q}H${x + step}`;
  return path(p, d + `V${y + depth}Z`, { fill, stroke: 'none' });
}
// Side-view street on a camera (see camera() in the engine). Fixed scenery wraps every ROAD.W world px, so follow shots
// can run for any distance. Returns the layers to add things to, back to front:
// scenery (wraps; for fixed things that should repeat), side (people on the pavement), vehicles, front (labels).
const ROAD = { top: 478, far: 566, mid: 640, near: 726, bot: 748, side: 474, W: 2400 };
function phRoad(cam, { trees = [300, 1100, 1900], lamps = [1500], hills = true, x0 = -1600, x1 = 5600 } = {}) {
  const W = ROAD.W, rep = xs => xs.flatMap(v => { const out = []; for (let x = v + Math.floor((x0 - v) / W) * W; x < x1; x += W) out.push(x); return out; });
  if (hills) phHills(cam.layer(.3, W), { y: 380, amp: 44, x0, x1, fill: PH.hill1, seed: 1 });
  const scenery = cam.layer(1, W);
  phBlock(scenery, x0, 452, x1 - x0, 26, PH.walk, { top: 4, ol: 0 });
  rep(trees).forEach(x => phSprite(scenery, 'tree', { x, y: ROAD.side }));
  rep(lamps).forEach(x => phSprite(scenery, 'lamp', { x, y: ROAD.side }));
  const side = G(cam.world), surface = cam.layer(1, W);
  mk('rect', { x: x0, y: ROAD.top, width: x1 - x0, height: ROAD.bot - ROAD.top, fill: PH.road }, surface);
  path(surface, `M${x0} ${ROAD.top + 12}H${x1}M${x0} ${ROAD.bot - 8}H${x1}`, { stroke: PH.line, 'stroke-width': 4, opacity: .65 });
  path(surface, rep(Array.from({ length: 15 }, (_, i) => i * 160)).map(x => `M${x} ${ROAD.mid - 4}h72v8h-72Z`).join(''), { fill: PH.line });
  phBlock(surface, x0, ROAD.bot, x1 - x0, 700, PH.grass, { top: 8, ol: 0 });
  path(surface, rep(Array.from({ length: 10 }, (_, i) => i * 240)).map(x => {
    const k = Math.round((((x % W) + W) % W) / 240), gx = x + 60 + (k % 2) * 70, gy = ROAD.bot + 56 + (k % 3) * 32;
    return `M${gx} ${gy}h8v-8h8v-8h8v16h8v-8h8v8Z`;
  }).join(''), { fill: lt(PH.grass, .14) });
  return { scenery, side, vehicles: G(cam.world), front: G(cam.world) };
}

/* ---------- objects ---------- */
// Soccer ball of radius r, centred on the origin: move the group, rotate ball._spin; highlight and shadow stay put.
function phBall(p, r = 40, o = {}) {
  const g = G(p, o);
  mk('ellipse', { cy: r, rx: r * .9, ry: r * .12, fill: '#000', opacity: .25 }, g);
  const sp = G(g);
  mk('circle', { r, fill: '#f4f1e8' }, sp);
  const pent = (cx, cy, k, rot) => Array.from({ length: 5 }, (_, i) => { const a = rot + i * 72 * Math.PI / 180; return `${i ? 'L' : 'M'}${(cx + k * Math.cos(a)).toFixed(1)} ${(cy + k * Math.sin(a)).toFixed(1)}`; }).join('') + 'Z';
  path(sp, pent(0, 0, r * .3, -Math.PI / 2), { fill: '#2a3532' });
  [0, 72, 144, 216, 288].forEach(a => {
    const t = (a - 90) * Math.PI / 180, cx = Math.cos(t) * r * .9, cy = Math.sin(t) * r * .9;
    path(sp, pent(cx, cy, r * .24, t + Math.PI), { fill: '#2a3532' });
    path(sp, `M${(Math.cos(t) * r * .3).toFixed(1)} ${(Math.sin(t) * r * .3).toFixed(1)}L${(Math.cos(t) * r * .68).toFixed(1)} ${(Math.sin(t) * r * .68).toFixed(1)}`, { stroke: '#2a3532', 'stroke-width': 2 });
  });
  mk('circle', { cx: -r * .38, cy: -r * .42, r: r * .2, fill: '#fff', opacity: .55 }, g);
  mk('circle', { r, fill: 'none', ...phLine(3) }, g);
  g._spin = sp;
  return g;
}
// Stopwatch; returns the group with ._hand to rotate.
function phStopwatch(p, { x = 0, y = 0, r = 60, o = 1 } = {}) {
  const g = G(p, { x, y, o });
  phBlock(g, -12, -r - 24, 24, 18, PH.metal, { top: 4, ol: 2 });
  mk('circle', { r: r + 9, fill: PH.metal, ...phLine() }, g);
  mk('circle', { r, fill: '#f4f1e8' }, g);
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; path(g, `M${Math.sin(a) * r * .8} ${-Math.cos(a) * r * .8}L${Math.sin(a) * r * .92} ${-Math.cos(a) * r * .92}`, { stroke: PH.out, 'stroke-width': 3 }); }
  g._hand = path(g, `M0 8V${-r * .78}`, { stroke: COL.bad, 'stroke-width': 4 });
  mk('circle', { r: 5, fill: PH.out }, g);
  return g;
}
// Open notebook; g._page flips about the spine with phFlip(book, angle in degrees, 0 = lying right, 180 = lying left).
function phNotebook(p, { x = 0, y = 0, s = 1 } = {}) {
  const g = G(p, { x, y, s });
  const page = (dx, parent) => {
    const e = mk('g', {}, parent);
    mk('rect', { x: dx, y: -70, width: 130, height: 170, fill: '#f4f1e8', ...phLine() }, e);
    for (let ly = -40; ly < 95; ly += 20) path(e, `M${dx + 14} ${ly}H${dx + 116}`, { stroke: '#86c9e8', 'stroke-width': 2 });
    return e;
  };
  phBlock(g, -142, -78, 284, 186, '#a65d4b', { top: 0, bottom: 8 });
  page(-132, g); page(2, g);
  g._page = page(0, g);
  return g;
}
function phFlip(book, deg) {
  const k = Math.cos(deg * Math.PI / 180), e = book._page;
  e.setAttribute('transform', `scale(${Math.abs(k) < .02 ? .02 * Math.sign(k || 1) : k},1) skewY(${-8 * Math.sin(deg * Math.PI / 180)})`);
  e.firstChild.setAttribute('fill', k < 0 ? '#e2ddcf' : '#f4f1e8');
}
// The Sun with block rays (g._rays turns).
function phSun(p, { x = 0, y = 0, r = 54 } = {}) {
  const g = G(p, { x, y });
  const rays = G(g);
  for (let i = 0; i < 12; i++) mk('rect', { x: r + 8, y: -4, width: 18, height: 8, fill: '#f6c445', transform: `rotate(${i * 30})` }, rays);
  mk('circle', { r, fill: '#f6c445', ...phLine() }, g);
  mk('circle', { cx: -r * .2, cy: -r * .2, r: r * .62, fill: '#f9d978', opacity: .7 }, g);
  g._rays = rays;
  return g;
}
// Small Earth seen from the side (for orbits).
function phEarthSmall(p, { x = 0, y = 0, r = 26 } = {}) {
  const g = G(p, { x, y });
  mk('circle', { r, fill: PH.ocean, ...phLine(2) }, g);
  [[-.55, -.45, .45, .35], [.05, .1, .5, .4], [-.45, .25, .3, .25]].forEach(([lx, ly, w, h]) => mk('rect', { x: lx * r, y: ly * r, width: w * r, height: h * r, fill: PH.land }, g));
  return g;
}
// Earth seen from far above the North Pole: the rim is the equator. One pixel image (img/earth.png, ocean included,
// turned so land is at the top of the rim); no SVG disc, which is slow in Firefox at close-up zoom.
// Rotate g._spin (degrees; negative = counterclockwise on screen).
function phEarthPolar(p, { x = 0, y = 0, R = 220 } = {}) {
  const g = G(p, { x, y }), spin = G(g);
  mk('image', { href: '../img/earth.png', x: -R, y: -R, width: 2 * R, height: 2 * R, style: 'image-rendering: pixelated' }, spin);
  g._spin = spin;
  return g;
}
