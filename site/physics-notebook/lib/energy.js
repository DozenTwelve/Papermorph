'use strict';
// Energy unit components (style.json "components"). Load after engine.js and notebook.js.
//   blip(p, {x, y, s, form})   Blip, the energy mascot: hops, squashes, changes colour with its form, looks, blinks.
//   energyBars(p, {...})       bars for each store of energy plus a stacked total that stays the same height.

// ---------- Blip ----------
// Drawn around its feet at (0, 0), about 150 px tall at s = 1. Every move is on the beat clock.
const BLIP_BODY = 'M-60 -8C-66 -58 -34 -100 2 -102C8 -116 16 -122 26 -130C24 -116 28 -106 32 -98C58 -86 68 -52 62 -10' +
  'C60 -2 56 0 48 0L-48 0C-56 0 -60 -2 -60 -8Z';
function blip(p, { x = 0, y = 0, s = 1, form = 'kinetic', o = 1, face = 1 } = {}) {
  const g = G(p, { x, y, s, o });
  const shape = mk('g', {}, g);                         // squash and stretch (non-uniform, so set directly)
  const body = path(shape, BLIP_BODY, { fill: EN[form], stroke: INK, 'stroke-width': 5 });
  path(shape, 'M-40 -40C-42 -62 -28 -80 -10 -84', { stroke: '#ffffff', 'stroke-width': 7 });
  const faceG = G(shape, { o: face });
  const eyes = mk('g', {}, faceG), pupils = G(eyes);
  for (const ex of [-20, 18]) {
    mk('ellipse', { cx: ex, cy: -52, rx: 13, ry: 16, fill: '#fff', stroke: INK, 'stroke-width': 3.5 }, eyes);
  }
  for (const ex of [-20, 18]) mk('circle', { cx: ex + 2, cy: -50, r: 6.5, fill: INK }, pupils);
  const mouths = {
    smile: path(faceG, 'M-12 -24Q0 -13 12 -24', { stroke: INK, 'stroke-width': 4 }),
    open: path(faceG, 'M-10 -26Q0 -6 10 -26Z', { stroke: INK, 'stroke-width': 3.5, fill: '#7a1f2f' }, { o: 0 }),
    oh: path(faceG, 'M0 -28a6 8 0 1 0 .1 0Z', { stroke: INK, 'stroke-width': 3.5, fill: '#7a1f2f' }, { o: 0 }),
  };
  let sq = [1, 1], breath = [1, 1], blink = 1;   // squash from actions times a slow breath
  const shapeTf = () => shape.setAttribute('transform', `scale(${sq[0] * breath[0]} ${sq[1] * breath[1]})`);
  const eyeTf = () => eyes.setAttribute('transform', blink === 1 ? '' : `translate(0 ${-52 * (1 - blink)}) scale(1 ${blink})`);
  const B = { g, body, face: faceG, pupils,
    // Change form: body colour to EN[name].
    form(name, t0, dur = .5) { tw(body, { c_fill: EN[name] }, t0, dur); return B; },
    // Jump to (x, y) along an arc `h` high, squashing on take-off and landing.
    hop(x2, y2, t0, dur = .7, h = 110) {
      let from;
      B.squash(t0 - .12, .18, .2);
      prog(q => {
        const s = st(g);
        if (!from) from = [s.x, s.y];
        put(g, { x: from[0] + (x2 - from[0]) * q, y: from[1] + (y2 - from[1]) * q - h * 4 * q * (1 - q) });
      }, t0, dur, lin);
      B.squash(t0 + dur, .22, .35);
      return B;
    },
    // A squash and rebound: k = how flat (0.2 = 20 %).
    squash(t0, k = .2, dur = .4) {
      prog(q => {
        const e = Math.sin(q * Math.PI) * (1 - q * .4) - .25 * Math.sin(q * 2 * Math.PI) * q;
        sq = [1 + k * e, 1 - k * e]; shapeTf();
      }, Math.max(0, t0), dur, lin);
      return B;
    },
    // Keep alive for the whole beat: a slow breath and a blink every few seconds.
    live(D, seed = 0) {
      clockRun(t => {
        const b = .018 * Math.sin((t + seed) * 2.4);
        breath = [1 - b, 1 + b]; shapeTf();
        const k = ((t + seed * 1.7) % 3.7) / .16;
        blink = k < 1 ? 1 - .9 * Math.sin(k * Math.PI) : 1; eyeTf();
      }, D);
      return B;
    },
    // Look toward a direction (dx, dy each -1..1).
    look(dx, dy, t0, dur = .3) { tw(pupils, { x: dx * 6, y: dy * 5 }, t0, dur); return B; },
    mouth(name, t0) { for (const k in mouths) tw(mouths[k], { o: k === name ? 1 : 0 }, t0, .12, lin); return B; },
  };
  return B;
}

// ---------- energy bars ----------
// One bar per store and, on the right, the total as a stack of the same colours. The total's height never changes
// when only transfers happen: that is conservation, visible. keys: [{key, label, color}]; values 0..1 of the full
// height h; set(values) redraws at once, so drive it from prog/clockRun with the same function as the motion.
function energyBars(p, { x, y, h = 280, w = 54, gap = 26, keys, total = true, title = 'energy', o = 1 }) {
  const g = G(p, { x, y, o });                       // (x, y) = bottom left of the first bar
  const n = keys.length, tx = n * (w + gap) + 30;
  hand(g, title, (tx + (total ? w + 10 : -gap)) / 2, -h - 28, { size: 28, fill: COL.dim });
  path(g, `M-14 0H${tx + (total ? w + 14 : -gap + 14)}`, { stroke: INK, 'stroke-width': 3 });
  const bars = keys.map((k, i) => {
    const bx = i * (w + gap);
    mk('rect', { x: bx, y: -h, width: w, height: h, fill: 'none', stroke: COL.faint, 'stroke-width': 2, 'stroke-dasharray': '6 6', rx: 4 }, g);
    const r = mk('rect', { x: bx, y: 0, width: w, height: 0, fill: k.color, stroke: INK, 'stroke-width': 3, rx: 4 }, g);
    hand(g, k.label, bx + w / 2, 36, { size: 26, fill: mix(k.color, INK, .35) });
    return r;
  });
  let stack = [];
  if (total) {
    mk('rect', { x: tx, y: -h, width: w + 10, height: h, fill: 'none', stroke: COL.faint, 'stroke-width': 2, 'stroke-dasharray': '6 6', rx: 4 }, g);
    stack = keys.map(k => mk('rect', { x: tx, y: 0, width: w + 10, height: 0, fill: k.color }, g));
    const outline = mk('rect', { x: tx, y: 0, width: w + 10, height: 0, fill: 'none', stroke: INK, 'stroke-width': 3, rx: 4 }, g);
    stack.push(outline);
    hand(g, 'total', tx + (w + 10) / 2, 36, { size: 26, fill: INK });
  }
  const E = { g, bars, h,
    set(v) {
      E.v = v.slice();
      let acc = 0;
      v.forEach((val, i) => {
        const hh = Math.max(0, val) * h;
        bars[i].setAttribute('y', -hh); bars[i].setAttribute('height', hh);
        if (total) { stack[i].setAttribute('y', -acc - hh); stack[i].setAttribute('height', hh); }
        acc += hh;
      });
      if (total) { stack[n].setAttribute('y', -acc); stack[n].setAttribute('height', acc); }
      return E;
    },
    // Move from the values at t0 to v over dur (lazy start, like tw).
    to(v, t0, dur = .8, ease = io) {
      let from;
      prog(q => { if (!from) from = E.v.slice(); E.set(from.map((a, i) => a + (v[i] - a) * q)); }, t0, dur, ease);
      return E;
    },
  };
  E.v = keys.map(() => 0);
  return E;
}
