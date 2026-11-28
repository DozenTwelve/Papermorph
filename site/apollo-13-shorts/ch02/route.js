/* ch02's own pieces: the Earth-Moon route recut upright (after the documentary's route() in site/apollo-13/lib/film.js);
   the mission clock is the series' metClock() in lib/apollo13.js. Loaded after shorts.js and lib/apollo13.js. Names
   start with c2 so nothing clashes with the series' lib file or another episode's.

   The route is schematic, not to scale: Earth at the foot of the frame, the Moon above. Legs, one meaning each:
     out    Earth to the Moon (where they had been)
     top    round the Moon's far side (shared by every way back)
     hyb    the landing path's way back, which passes beside Earth: MISS
     free   push 1's free return, the long way down to Earth (the Indian Ocean)
     pc2    push 2's path, split from free just past the Moon, shorter, to the Pacific
   freeG and topG are faint copies of free and top: the safe loop as a ghost.
   c2Route(p, { legs: { name: [drawn 0..1, opacity] } }) draws them; c2Craft() moves the amber dot along a chain of legs. */
'use strict';
const C2_EARTH = [430, 1150], C2_ER = 90, C2_MOON = [450, 470], C2_MR = 56;
const C2_P = {   // cubic pieces [start, c1, c2, end]
  out: [[372, 1078], [230, 900], [250, 650], [393, 527]],
  top1: [[393, 527], [358, 470], [382, 393], [450, 391]],
  top2: [[450, 391], [522, 389], [548, 463], [512, 523]],
  hyb: [[512, 523], [690, 740], [760, 980], [800, 1660]],
  free: [[512, 523], [700, 760], [700, 1040], [515, 1178]],
};
const C2_SPLIT = .2;   // push 2 leaves the free-return leg at this bezier parameter
// de Casteljau: a cubic split at u into its two halves
function c2Split([a, b, c, d], u) {
  const L = (p, q) => [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u];
  const ab = L(a, b), bc = L(b, c), cd = L(c, d), abc = L(ab, bc), bcd = L(bc, cd), m = L(abc, bcd);
  return [[a, ab, abc, m], [m, bcd, cd, d]];
}
const [C2_FREE_A] = c2Split(C2_P.free, C2_SPLIT);
const C2_PC2 = [C2_FREE_A[3], [600, 760], [560, 950], [465, 1067]];
const c2D = (...cs) => cs.map((c, i) => (i ? '' : `M${c[0][0]} ${c[0][1]}`) + `C${c[1][0]} ${c[1][1]} ${c[2][0]} ${c[2][1]} ${c[3][0]} ${c[3][1]}`).join('');
const C2_LEGS = {
  out: c2D(C2_P.out), top: c2D(C2_P.top1, C2_P.top2), hyb: c2D(C2_P.hyb), free: c2D(C2_P.free),
  freeA: c2D(C2_FREE_A), pc2: c2D(C2_PC2),
};
const C2_STYLE = {
  topG: ['top', { stroke: LIGHT, 'stroke-width': 3, 'stroke-dasharray': '8 12' }],
  freeG: ['free', { stroke: LIGHT, 'stroke-width': 3, 'stroke-dasharray': '8 12' }],
  out: ['out', { stroke: LIGHT, 'stroke-width': 4 }],
  hyb: ['hyb', { stroke: MUTED, 'stroke-width': 4 }],
  top: ['top', { stroke: LIGHT, 'stroke-width': 4 }],
  free: ['free', { stroke: LIGHT, 'stroke-width': 4 }],
  pc2: ['pc2', { stroke: MARK, 'stroke-width': 7 }],
  freeA: ['freeA', { stroke: 'none' }],   // for the dot only
};
// the Earth disc (drawn, not a photograph: a diagram), centred on (0, 0), r px
function c2Earth(g, r) {
  const e = G(g, {});
  mk('circle', { r, fill: '#2f6fa8' }, e);
  const k = r / 90;
  mk('path', { d: `M${-30 * k} ${-42 * k}q${30 * k} ${-14 * k} ${50 * k} ${8 * k}q${-10 * k} ${24 * k} ${-36 * k} ${18 * k}zM${-48 * k} ${8 * k}q${26 * k} ${6 * k} ${34 * k} ${30 * k}q${-24 * k} ${12 * k} ${-40 * k} ${-8 * k}zM${22 * k} ${30 * k}q${22 * k} ${-4 * k} ${30 * k} ${16 * k}q${-14 * k} ${16 * k} ${-30 * k} ${4 * k}z`, fill: '#5f9a5a', opacity: .8 }, e);
  mk('circle', { r, fill: 'none', stroke: LIGHT, 'stroke-width': 2.5 }, e);
  return e;
}
function c2Route(p, { legs = {}, labels = true } = {}) {
  const g = G(p, {});
  const eg = G(g, { x: C2_EARTH[0], y: C2_EARTH[1] }); c2Earth(eg, C2_ER);
  const mg = G(g, { x: C2_MOON[0], y: C2_MOON[1] });
  mk('circle', { r: C2_MR, fill: '#a7adb5' }, mg);
  [[-16, -10, 11], [14, 16, 8], [10, -20, 6]].forEach(([x, y, r]) => mk('circle', { cx: x, cy: y, r, fill: '#8d939c' }, mg));
  if (labels) {
    const lab = (s, x, y, a) => T(g, s, { x, y, size: 26, fill: MUTED, font: SANS, weight: 500, anchor: a }).setAttribute('letter-spacing', '.12em');
    lab('MOON', 330, 455, 'end'); lab('EARTH', C2_EARTH[0], C2_EARTH[1] + C2_ER + 44, 'middle');
    T(g, 'not to scale', { x: 60, y: 1282, size: 26, fill: MUTED, font: SERIF }).setAttribute('font-style', 'italic');
  }
  g._legs = {};
  for (const [name, [leg, attrs]] of Object.entries(C2_STYLE)) {
    const [d, o] = legs[name] || [0, 1];   // a leg not given is there to draw on (a dashed ghost stays hidden)
    const dashed = 'stroke-dasharray' in attrs;
    const e = path(g, C2_LEGS[leg], { fill: 'none', 'stroke-linecap': 'round', ...attrs }, dashed ? { o: o * d } : { d, o });
    g._legs[name] = e;
  }
  g.appendChild(eg); g.appendChild(mg);   // the discs over the legs' ends
  g._dot = G(g, { o: 0 });
  mk('circle', { r: 24, fill: MARK, opacity: .28 }, g._dot);
  mk('circle', { r: 10, fill: MARK }, g._dot);
  return g;
}
// the point q (0..1 of its length) along a leg
function c2At(g, leg, q) {
  const e = g._legs[leg], L = e.getTotalLength(), pt = e.getPointAtLength(Math.min(1, Math.max(0, q)) * L);
  return [pt.x, pt.y];
}
// the dot along a chain of legs: s from 0 to chain.length (leg index + fraction); keys [[t, s], ...], eased between keys,
// shown from the first key's time
function c2Craft(g, chain, keys) {
  const sAt = t => {
    if (t <= keys[0][0]) return keys[0][1];
    for (let j = 1; j < keys.length; j++) if (t <= keys[j][0]) { const [t0, s0] = keys[j - 1], [t1, s1] = keys[j]; return s0 + (s1 - s0) * smooth(ramp01(t, t0, t1)); }
    return keys[keys.length - 1][1];
  };
  const pos = s => { const i = Math.min(chain.length - 1, Math.floor(s)); return c2At(g, chain[i], s - i); };
  show(g._dot, keys[0][0], .2, lin);
  let last = '';
  clockRun(t => {
    const [x, y] = pos(sAt(t)), k = `${x.toFixed(1)},${y.toFixed(1)}`;
    if (k !== last) { last = k; put(g._dot, { x, y }); }
  }, 0, { tail: true });
}
// an engine burn at (x, y): an amber glow pulsing from t0 for dur s, with its rumble
function c2Burn(g, x, y, t0, dur, { big = 1 } = {}) {
  const e = G(g, { x, y, o: 0 });
  const halo = mk('circle', { r: 30 * big, fill: MARK, opacity: .35 }, e), core = mk('circle', { r: 16 * big, fill: '#fff4dc' }, e);
  show(e, t0, .12, lin); hide(e, t0 + dur, .35, lin);
  prog(q => { const w = 1 + .22 * Math.sin(q * dur * 18); halo.setAttribute('r', (30 + 26 * Math.min(1, q * 6)) * big * w); core.setAttribute('r', 16 * big * w); }, t0, dur, lin);
  sfx(BEAT_ID, t0, dur > 3 ? 'rumble-long' : 'rumble', 1.1);
  return e;
}
// a line through a word (word() returns it with _w); drawn left to right
function c2Strike(g, e, x, y, t0, size, colour = MARK) {
  const w = e._w + 24, l = path(g, `M${x - w / 2} ${y - size * .32}H${x + w / 2}`, { stroke: colour, 'stroke-width': size / 9, 'stroke-linecap': 'round' }, { d: 0 });
  draw(l, t0, .25, out);
  return l;
}
// a close-up of Earth's end of the route: the disc large, a splashdown mark and its ocean's name
function c2Globe(p, r = 300) {
  const g = G(p, { x: CX, y: 760 });
  c2Earth(g, r);
  T(g, 'not to scale', { x: -370, y: 470, size: 26, fill: MUTED, font: SERIF }).setAttribute('font-style', 'italic');
  return g;
}
// an X where they would splash down, at (x, y) in the globe's own coordinates
function c2X(g, x, y, t0, colour = MARK) {
  const e = G(g, { x, y, s: 1.8, o: 0 });
  path(e, 'M-22 -22L22 22M22 -22L-22 22', { stroke: DARK, 'stroke-width': 18, 'stroke-linecap': 'round' });
  e._ink = path(e, 'M-22 -22L22 22M22 -22L-22 22', { stroke: colour, 'stroke-width': 10, 'stroke-linecap': 'round' });
  tw(e, { s: 1, o: 1 }, t0, .2, out);
  sfx(BEAT_ID, t0, 'thud', .9);
  return e;
}
// a small boat bobbing on the beat clock
function c2Boat(g, x, y, size, t0, phase = 0) {
  const b = G(g, { x, y });
  ico(b, 'boat', 0, 0, size, LIGHT, t0);
  clockRun(t => put(b, { x, y: y + 5 * Math.sin(t * 2.4 + phase), r: 3 * Math.sin(t * 1.9 + phase) }), 0, { tail: true });
  return b;
}
