/* scene4w.js — in the meadow (point and read).
   Meanwhile, back in the meadow: Red stands up from her picking and turns to us, and the page waits while the reader
   taps the things in the picture to hear their names. The camera holds still, so the hit shapes for the things baked
   into the set (tree, sun, cloud, flowers) are placed by where they show on screen at this view. */
'use strict';
const PRE4W = 1.2, CAM4W = { x: 3250, y: 480, z: 1.2 };
let MEADOW_THINGS = [];
// A screen point of the fixed view, in the world of its k = 1 plane (where hit shapes and puppets go).
const meadowAt = (sx, sy) => [CAM4W.x + (sx - 800) / CAM4W.z, CAM4W.y + (sy - 450) / CAM4W.z];
function birdProp(parent) {
  const g = mk('g', {}, parent), body = mk('g', {}, g);
  body.innerHTML = `<g filter="url(#paper)"><path d="M-30,4 L-52,-6 L-50,12 Z" fill="#3f5f8a"/><ellipse cx="0" cy="0" rx="30" ry="21" fill="#5b82b8"/>
    <ellipse cx="6" cy="8" rx="17" ry="11" fill="#f1e2c4"/></g>`;
  const head = mk('g', {}, body);
  head.innerHTML = `<g filter="url(#paper)"><circle cx="24" cy="-18" r="15" fill="#5b82b8"/><path d="M37,-21 L50,-16 L37,-12 Z" fill="#efae48"/></g><circle cx="29" cy="-21" r="3.2" fill="#22150e"/>`;
  const wing = prop(body, `<g filter="url(#paper)"><path d="M-14,-6 Q4,-22 18,-4 Q2,10 -14,-6 Z" fill="#3f5f8a"/></g>`);
  const legs = prop(g, `<path d="M-4,18 l-3,14 M8,18 l2,14" stroke="#c98a3c" stroke-width="3"/>`);
  bakeAll(g);
  return { g, pose(x, y, s, { peck = 0, flap = 0, look = 0 } = {}) {
    tf(g, `translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${s})`); vis(legs, !flap);
    tf(body, `translate(0,${flap ? -14 : 0}) rotate(${(peck * 28).toFixed(1)},10,10)`);
    tf(head, `rotate(${(look * 10).toFixed(1)},24,-8)`);
    tf(wing, flap ? `rotate(${flap > 0 ? -50 : 20},-14,-6)` : '');
  } };
}
function butterflyProp(parent) {
  const g = mk('g', {}, parent), wings = [-1, 1].map(d => prop(g, `<g filter="url(#paper)"><path d="M0,0 C${12 * d},-34 ${44 * d},-30 ${36 * d},-6 C${32 * d},6 ${12 * d},4 0,0 Z" fill="#e88ab0"/>
    <path d="M0,2 C${16 * d},8 ${30 * d},16 ${20 * d},30 C${10 * d},32 ${2 * d},18 0,2 Z" fill="#efae48"/><circle cx="${22 * d}" cy="-14" r="5" fill="#f6efe0"/></g>`));
  prop(g, `<g filter="url(#paper)"><rect x="-3.5" y="-16" width="7" height="34" rx="3.5" fill="#3b2a1e"/></g><path d="M-2,-15 q-6,-12 -12,-14 M2,-15 q6,-12 12,-14" stroke="#3b2a1e" stroke-width="2" fill="none"/>`);
  mk('circle', { r: 40, fill: 'transparent' }, g);   // a finger-sized target even when the wings are shut
  return { g, pose(x, y, s, open) { tf(g, `translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${s})`); wings.forEach(w => tf(w, `scale(${open},1)`)); } };
}
function scene4w(p, D) {
  const cam = paperCam(p, 'forest', CAM4W), st = cam.stage;
  // the set's own clouds sit at the very top of this view: one more, lower and drifting, is the one to tap
  const sky = mk('g', {}, st);
  prop(sky, `<g filter="url(#paper)"><circle cx="-40" cy="10" r="30" fill="#fbf4e2"/><circle cx="0" cy="-8" r="40" fill="#fbf4e2"/>
    <circle cx="45" cy="8" r="32" fill="#fbf4e2"/><rect x="-70" y="10" width="148" height="30" rx="15" fill="#fbf4e2"/></g>`);
  mk('rect', { x: -80, y: -56, width: 170, height: 106, rx: 40, fill: 'transparent' }, sky);
  const hits = mk('g', {}, st);   // invisible hit shapes over the set's own things, under the puppets
  const spot = (word, d) => { const g = mk('g', {}, hits); mk('path', { d, fill: 'transparent' }, g); return { g, word }; };
  const at = (sx, sy) => meadowAt(sx, sy).map(v => v.toFixed(0)).join(',');
  const circle = (sx, sy, r) => { const [x, y] = meadowAt(sx, sy), R = r / CAM4W.z; return `M${x - R},${y} a${R},${R} 0 1 0 ${2 * R},0 a${R},${R} 0 1 0 ${-2 * R},0 Z`; };
  const box = (x0, y0, x1, y1) => `M${at(x0, y0)} L${at(x1, y0)} L${at(x1, y1)} L${at(x0, y1)} Z`;
  const sun = spot('sun', circle(1200, 85, 88)), tree = spot('tree', box(905, 425, 1112, 690)), flower = spot('flower', box(885, 700, 1040, 795));
  const red = redPuppet(st), bird = birdProp(st), fly = butterflyProp(st);
  MEADOW_THINGS = [sun, { g: sky, word: 'cloud' }, tree, flower, { g: red.g.querySelector('[data-p="basketF"]'), word: 'basket', side: 'right' },   // the basket in her hand; above it is her face
    { g: bird.g, word: 'bird' }, { g: fly.g, word: 'butterfly' }];
  const [RX] = meadowAt(640, 0), GY = 738, s = .6;
  const [BX, BY] = meadowAt(1478, 362);   // the bird on the crown of the round tree at the right
  // Red: bent over a flower, then up and round to face us (1.0–1.6); after that she breathes and looks about,
  // for as long as the page waits (draw runs on past D).
  const draw = (q, f) => {
    cam.apply(q, f);
    const up = span(q, .9, 1.3), turn = q < 1.1 ? 1 : 1 - Math.min(1, (q - 1.1) / .5), front = q >= 1.6;
    const look = front ? Math.sin(q * .9) : 0, breathe = Math.sin(q * 2.4);
    red.pose({ x: RX, y: hipOn(GY, s) + 10 * (1 - up) - (front ? 1.5 * breathe : 0), s, turn, head: front ? 'F' : 'P',
      kNear: 30 * (1 - up), kFar: 20 * (1 - up), ua: front ? -8 : 40 * (1 - up) - 8 * up, fa: front ? -78 : 30 * (1 - up) - 78 * up,
      rua: 8 + 2 * breathe, rfa: -6, lua: -14, lfa: 40, headR: front ? 6 * look : 14 * (1 - up), cape: 3 + 2 * breathe,
      bouquet: 7, shut: blinking(q, [2.6, 6.4]) || (q > D && (q % 4.3) < 2 / FPS) }, f);
    const peck = Math.floor(q * 1.3) % 3 === 0 && (q * 1.3) % 1 < .25 ? 1 : 0;
    bird.pose(BX, BY, .8, { peck, look: peck ? 0 : Math.sign(Math.sin(q * .7)) });
    // the butterfly loops slowly over the flowers at the right, wings on twos
    const [FX, FY] = meadowAt(1275 + 50 * Math.sin(q * .8), 640 + 22 * Math.sin(q * 1.6));
    const [CX, CY] = meadowAt(560 + 40 * Math.sin(q / 6), 205);
    tf(sky, `translate(${CX.toFixed(1)},${CY.toFixed(1)}) scale(1.2)`);
    fly.pose(FX, FY, 1.3, [1, .7, .35, .7][Math.floor(q * FPS / 2) % 4]);
  };
  // on twos like stopClock, but a tail run: while the page waits, tapWords runs it on past D on wall time
  clockRun(t => { const f = Math.floor(t * FPS + 1e-6); draw(f / FPS, f); }, D, { tail: true });
}
