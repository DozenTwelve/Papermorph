/* scene11.js — The quarrel (p25). Shots (beat clock = PRE11 + the joined clip's time):
   1 wide on the tangle, it begins to boil on "quarrel", cats shot out of it and back (0 – bit);
   2-4 inserts into the tangle on "bit", "scratched", "clawed" (each a closer view, shaken);
   5 wide again for "a great noise" (s11_W), 6 follow the two tiny people running up the hill to the house on "ran" and in at its door.
   The tangle is Gág's `fight` layer, jolted on twos inside a wrapper group (cam.apply owns the layer's own transform). */
'use strict';
const PRE11 = .5;
const s11_T = t => PRE11 + t;
const s11_QUARREL = markAt('scene11', PRE11, 'n10.quarrel'), s11_BIT = markAt('scene11', PRE11, 'n10b.bit'),
  s11_SCR = markAt('scene11', PRE11, 'n10b.scratched'), s11_CLAW = markAt('scene11', PRE11, 'n10b.clawed'), s11_RAN = markAt('scene11', PRE11, 'n10b.ran');
const s11_W = s11_T(7.205), s11_DOOR = [1248, 163];   // the wide again; where the house's door is (world px)
const s11_C = [825, 530];   // the tangle's centre
sfx('scene11', 0, 'fight', .9, { loop: true });
sfx('scene11', .05, 'page', .8);
sfx('scene11', s11_QUARREL - .1, 'yowl', .7); sfx('scene11', s11_QUARREL + .3, 'hiss', .6);
sfx('scene11', s11_BIT, 'hiss', .7); sfx('scene11', s11_SCR, 'yowl', .6); sfx('scene11', s11_CLAW, 'yowl', .8); sfx('scene11', s11_CLAW + .1, 'hiss', .5);
sfx('scene11', s11_T(8.249), 'yowl', .6); sfx('scene11', s11_T(9.641), 'hiss', .6);
// cats shot out of the tangle and back: [piece, start (clip s), length, from, to (world px), spin turns]
const s11_FLY = [
  ['cat25a', 1.038, .9, [700, 560], [330, 790], 1], ['cat25b', 1.502, 1, [900, 540], [1390, 760], -1], ['cat25c', 2.346, .9, [800, 520], [560, 250], 1],
  ['cat25d', 3.146, 1, [760, 590], [260, 650], -1], ['cat25b', 4.298, .8, [600, 560], [330, 420], -1], ['cat25a', 4.522, .8, [900, 520], [1180, 330], 1],
  ['cat25d', 5.671, .8, [780, 480], [620, 280], 1], ['cat25c', 5.782, .9, [800, 500], [1000, 300], -1], ['cat25a', 7.382, 1, [720, 580], [300, 780], 1],
  ['cat25d', 8.425, 1, [850, 560], [1380, 700], -1], ['cat25b', 9.489, 1, [800, 590], [500, 850], 1], ['cat25c', 10.33, 1, [820, 560], [330, 700], -1],
  ['cat25a', 12.002, 1, [900, 440], [1150, 250], 1], ['cat25d', 12.778, 1, [1000, 470], [790, 240], -1], ['cat25b', 13.508, 1, [850, 440], [1110, 235], 1],
];
s11_FLY.forEach(([, t, , , , ]) => sfx('scene11', s11_T(t) + .05, 'whoosh', .22));

function scene11(p, D) {
  const turnOut = pageTurn(p, 0, .6, 'out');
  const cam = paperCam(p, 'p25', { x: 800, y: 470, z: 1.3 }, { after: 'fight' });
  cam.to({ x: 800, y: 500, z: 1.55 }, .6, s11_BIT - .6)
    .cut({ x: 600, y: 560, z: 2.7 }, s11_BIT).to({ x: 640, y: 540, z: 3 }, s11_BIT, s11_SCR - s11_BIT)
    .cut({ x: 900, y: 540, z: 2.7 }, s11_SCR).to({ x: 860, y: 520, z: 3 }, s11_SCR, s11_CLAW - s11_SCR)
    .cut({ x: 790, y: 420, z: 2.6 }, s11_CLAW).to({ x: 800, y: 440, z: 2.9 }, s11_CLAW, s11_W - s11_CLAW)
    .cut({ x: 800, y: 470, z: 1.3 }, s11_W).to({ x: 900, y: 430, z: 1.4 }, s11_W, s11_RAN - .3 - s11_W)
    // on "ran" a cut to the hill path and the house from below-left, so Gág's page fills the frame and both run whole inside it up to the door
    .cut({ x: 985, y: 335, z: 1.9 }, s11_RAN - .1).to({ x: 1010, y: 300, z: 2.05 }, s11_RAN - .1, 2.3);
  cam.shake(s11_QUARREL, s11_BIT - s11_QUARREL, 5); cam.shake(s11_BIT, s11_W - s11_BIT, 7); cam.shake(s11_W, s11_RAN - s11_W, 3);
  // the tangle in a wrapper, so it can jolt without touching the layer's own parallax transform
  const fg = cam.layer('fight'), wrap = mk('g', {}, cam.world);
  fg.parentNode.insertBefore(wrap, fg); wrap.appendChild(fg);
  const amp = q => 1.5 + 3 * span(q, s11_QUARREL - .3, s11_QUARREL + .4) + 2 * span(q, s11_BIT - .1, s11_BIT + .2) - 2 * span(q, s11_W, s11_W + .5);

  // where the pair was lifted off the page's sky and the hill's rim, a grey smear shows once they run: a soft paper patch over the sky side of it
  const patch = mk('g', {}, cam.stage);
  const edge = [[925, 300], [969, 279], [1037, 266], [1090, 250], [1122, 232], [1170, 192]];   // the hill's rim where the pair were lifted: crisp, hatched in Gág's ink
  let ticks = '';
  for (let k = 0; k < edge.length - 1; k++) {
    const [ax, ay] = edge[k], [bx, by] = edge[k + 1], len = Math.hypot(bx - ax, by - ay), nx = (by - ay) / len, ny = -(bx - ax) / len;
    for (let t = 0; t < len; t += 5) { const r = rnd(k * 97 + t), l = 7 + r * 12, x = ax + (bx - ax) * t / len, y = ay + (by - ay) * t / len;
      ticks += `M${x.toFixed(1)} ${y.toFixed(1)}l${(nx * l).toFixed(1)} ${(ny * l).toFixed(1)}`; }   // down-right, into the hill
  }
  patch.innerHTML = `<polygon points="925,185 1163,183 1170,192 ${edge.slice().reverse().map(e => e.join(',')).join(' ')}" fill="#efe8d6"/><polygon points="${edge.map(e => e.join(',')).join(' ')} ${edge.slice().reverse().map(([x, y]) => `${x},${y + 24}`).join(' ')}" fill="#1e1a16"/><path d="M${edge.map(e => e.join(' ')).join('L')}" fill="none" stroke="#1e1a16" stroke-width="4" stroke-linejoin="round"/><path d="${ticks}" fill="none" stroke="#efe8d6" stroke-width="1.8" stroke-linecap="round"/>`;
  // the door's jamb: the pair are cut off at the door's left edge as they go in
  const jamb = mk('g', {}, cam.stage); jamb.innerHTML = '<defs><clipPath id="s11jamb"><rect x="0" y="-200" width="1247" height="800"/></clipPath></defs>';
  const pc = mk('g', { 'clip-path': 'url(#s11jamb)' }, cam.stage);
  // a seething crowd over Gág's tangle: cats lunging, hopping and spinning, wilder as the quarrel grows (catCrowd's seethe)
  const crowd = catCrowd(cam.stage, { names: ['cat25a', 'cat25b', 'cat25c', 'cat25d'], n: 22, box: [380, 470, 1250, 760], seed: 25, s: [1.35, .85] });
  const man = cutPuppet(pc, 'man25'), woman = cutPuppet(pc, 'woman25');
  const mAt = pagePos('p25', 'man25'), wAt = pagePos('p25', 'woman25');
  const fly = s11_FLY.map(([n, t, d, a, b, spin]) => ({ p: cutPuppet(cam.stage, n), t: s11_T(t), d, a, b, spin }));
  const route = (at, u, lag) => {   // from a spot up the hill to the door, in a gentle zigzag of steps
    const e = ease(Math.min(1, Math.max(0, u)));
    return { x: at.x + (s11_DOOR[0] - at.x - lag) * e, y: at.y + (s11_DOOR[1] - at.y) * e };
  };
  const turn = pageTurn(p, D - .1, .6, 'in');
  stopClock(D, (q, f) => {
    cam.apply(q, f);
    // the tangle: a jolt on twos (shift, tilt, a boil of scale about its centre)
    const g = Math.floor(f / 2), a = amp(q), k = (n) => jit(g, n);
    wrap.setAttribute('transform', `translate(${s11_C[0] + k(41) * a} ${s11_C[1] + k(42) * a}) rotate(${k(43) * a * .3}) scale(${1 + k(44) * a * .004}) translate(${-s11_C[0]} ${-s11_C[1]})`);
    crowd.pose(q, f, { from: s11_QUARREL - .2, every: i => i * .03, hop: false, seethe: .3 + .7 * span(q, s11_QUARREL, s11_CLAW) });
    // single cats flung out and back
    for (const c of fly) {
      const u = (q - c.t) / c.d, on = u > 0 && u < 1;
      vis(c.p.g, on);
      if (on) {
        const h = Math.sin(Math.PI * u), arc = Math.sin(Math.PI * u) * 60;
        c.p.pose({ x: c.a[0] + (c.b[0] - c.a[0]) * h, y: c.a[1] + (c.b[1] - c.a[1]) * h - arc + 40, s: .9 + .5 * h, rot: c.spin * 360 * u * .5 + jit(g, 7) * 6, sq: 1 }, f);
      }
    }
    // the tiny old people: they shake and cringe, then run to the house and in at the door
    const ru = (q - s11_RAN) / 1.7, mu = ru, wu = (q - s11_RAN + .15) / 1.6;
    const tremble = a * .25 * k(51), hop = q => { const u = Math.floor(q * FPS / 2) * 2 / FPS * 3.2 * Math.PI * 2; return Math.abs(Math.sin(u)) * 6; };
    const MW = { L: 32, A: 32, period: .34 }, mwEnd = cutWalk(1.7, MW).d;   // the man's feet: a quick stride, planted while the body rides over them
    const doRun = (pup, at, u, lag, flip, ph, legs) => {
      const run = u > 0, on = u < 1;
      vis(pup.g, on);
      if (!on) return;
      if (!run) { pup.pose({ ...at, x: at.x + tremble * .5, flip, bob: Math.abs(Math.sin(q * 13 + ph)) * 3 * (a / 6), sq: 1 + .012 * Math.sin(q * 2.2 + ph) - .03 * span(q, s11_QUARREL, s11_QUARREL + .5), rot: Math.sin(q * 9 + ph) * 1.2 * (a / 6) }, f); return; }
      const e = Math.min(1, u), y0 = at.y + (s11_DOOR[1] - at.y) * ease(e), sc = (1 - .78 * ease(e)) ;
      if (legs) {   // x from the hip's travel d·s, scaled so the walk ends at the door
        const w = cutWalk(u * 1.7, MW), k = (s11_DOOR[0] - at.x - lag) / (mwEnd * at.s);
        pup.pose({ ...at, x: at.x + w.d * at.s * k, y: y0, flip, bob: w.bob * 2.2 * at.s * sc, rot: Math.sin(q * 11 + ph) * 2, s: sc, parts: { legF: w.legL, legB: w.legR } }, f);
      } else {   // the woman's skirt hides her legs: a quick shuffle, the hem bobbing and tipping at each step
        const r = route(at, u, lag - 8), st = Math.floor(q * FPS / 2) * 2 / FPS * 3.4 * Math.PI * 2;
        pup.pose({ ...at, x: r.x, y: r.y, flip, bob: Math.abs(Math.sin(st)) * 5 * sc, rot: Math.sin(st) * 7, sq: 1 + .03 * Math.sin(st * 2), s: sc }, f);
      }
    };
    doRun(man, mAt, mu, -14, false, 0, true); doRun(woman, wAt, wu, -12, false, 1.3, false);
    turnOut(q); turn(q);
  });
  // the door: each is gone through it
  sfx('scene11', s11_RAN + 1.65, 'door', .6);
}
