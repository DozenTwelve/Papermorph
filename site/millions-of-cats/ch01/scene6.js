/* scene6.js — Back home (Gág's pages 16 and 17; storyboard scene6).
   A (0 – 7.9) page 16, the long strip of hills: the tiny old man walks left over them with his armful and a trail of
   cats trotting after him, the camera drifting along ("sunny hills", "cool valleys"). B (8.0 – 10.3) cut to page 17, the
   winding road: he strides a few steps off the spot Gág drew him on, the first cats trotting after him. Then "hundreds
   and thousands and millions and billions and trillions of cats": each number word is a cut further back along the
   road, and the stretch of road it shows fills with trotting cats. "following him": back to him with the whole road full.
   Beat clock = PRE6 + clip time. */
'use strict';
const PRE6 = .5;
const S6_LEFT = ['cat22a', 'cat22b', 'cat22c', 'cat22d', 'cat23a', 'cat23e', 'cat23g'];   // pieces drawn head to the left
// The road of page 17 in set px, from just beyond the front to the far bend, and its arc lengths.
const S6_ROAD = [[1160, 806], [1055, 788], [934, 773], [823, 755], [730, 727], [656, 689], [600, 652], [563, 614], [572, 581], [628, 553],
  [693, 539], [767, 521], [827, 488], [841, 469], [804, 446], [739, 427], [674, 408], [618, 394], [595, 375]];
const S6_ARC = [0]; for (let i = 1; i < S6_ROAD.length; i++) S6_ARC.push(S6_ARC[i - 1] + Math.hypot(S6_ROAD[i][0] - S6_ROAD[i - 1][0], S6_ROAD[i][1] - S6_ROAD[i - 1][1]));
const S6_LEN = S6_ARC[S6_ARC.length - 1];
function s6road(a) {   // [x, y, perspective scale] at arc length a along the road
  a = Math.max(0, Math.min(S6_LEN, a)); let i = 1; while (i < S6_ARC.length - 1 && S6_ARC[i] < a) i++;
  const k = (a - S6_ARC[i - 1]) / (S6_ARC[i] - S6_ARC[i - 1]), A = S6_ROAD[i - 1], B = S6_ROAD[i];
  return [A[0] + (B[0] - A[0]) * k, A[1] + (B[1] - A[1]) * k, .8 - .6 * a / S6_LEN];
}

function scene6(p, D) {
  const P = PRE6, T = t => P + t, W = m => markAt('scene6', P, 'n05b.' + m);
  const out = pageTurn(p, 0, .6, 'out'), turn = pageTurn(p, D - .1, .6, 'in');
  const CUT = T(7.95);                              // page 16 -> page 17
  const paper = c => c.world.insertBefore(mk('rect', { x: -3000, y: -2000, width: 8000, height: 5000, fill: '#eee8d6' }), c.world.firstChild);

  // ---------------- page 16: the strip of hills ----------------
  const A = paperCam(p, 'p16'); paper(A);
  const m16 = cutPuppet(A.stage, 'man16'), at16 = pagePos('p16', 'man16');
  const EDGE16 = at16.x + 55;   // Gág's picture ends there (page px 3195): a cat further right would stand on blank paper
  const X0 = at16.x, WALK0 = T(.3), SPEED = 92, GY = at16.y + 34;
  // His steps set the ground's speed: the compass walk plants each foot while the hip rides over it (leg 33 px, swing 26 deg, 0.64 s
  // per two steps = about 90 px/s, SPEED); the trail walks the same distance, their legs by it.
  const w16 = q => cutWalk(Math.max(0, Math.min(q, CUT) - WALK0), { L: 33, A: 26, period: .64 });
  const manX = q => X0 - w16(q).d;
  const trail = Array.from({ length: 11 }, (_, i) => ({ i, name: S6_LEFT[i % S6_LEFT.length], off: 85 + i * 62 + rnd(i * 3 + 1) * 24, dy: (rnd(i * 7 + 2) - .5) * 14, ph: rnd(i * 5 + 4) * 7,
    p: cutPuppet(A.stage, S6_LEFT[i % S6_LEFT.length]) }));
  A.cut({ x: 1000, y: 310, z: 1.5 }, 0).to({ x: 760, y: 310, z: 1.4 }, WALK0, CUT - WALK0);
  A.soft(0, false);
  for (const [n, k] of [['cloudA', 1], ['cloudB', 3]]) A.move(n, q => `translate(${(8 * Math.sin(q * .5 + k * 2)).toFixed(1)} ${(2.5 * Math.sin(q * .37 + k)).toFixed(1)})`);   // Gág's two clouds drift

  // ---------------- page 17: the winding road ----------------
  const B = paperCam(p, 'p17'); paper(B);
  const m17 = cutPuppet(B.stage, 'man17'), at17 = pagePos('p17', 'man17');
  const WALK17 = T(8.15), TAU_END = 2.25;           // three steps and he stands
  const mw = q => cutWalk(Math.min(Math.max(0, q - WALK17), TAU_END), { L: 119, A: 11, period: 1.5 });
  // the cats on the road: slot arc, when they appear, who they are
  const items = [];
  const add = (n, a0, a1, t0, t1, seed) => { for (let i = 0; i < n; i++) {
    const a = a0 + (a1 - a0) * (i + rnd(seed + i * 3)) / n, t = t0 + (t1 - t0) * rnd(seed * 3 + i * 5);
    items.push({ a, t, lat: (rnd(seed * 7 + i * 11) - .5) * 28, ph: rnd(seed * 13 + i) * 7, name: S6_LEFT[Math.floor(rnd(seed * 17 + i * 2) * S6_LEFT.length)] }); } };
  const L = S6_LEN;
  add(7, 90, 330, T(8.3), T(9.6), 1);                       // the first, right behind him
  add(14, .13 * L, .36 * L, W('hun'), W('hun') + .8, 2);      // hundreds
  add(22, .3 * L, .55 * L, W('thou'), W('thou') + .8, 3);     // thousands
  add(34, .5 * L, .78 * L, W('mil'), W('mil') + .8, 4);       // millions
  add(46, .7 * L, 1 * L, W('bil'), W('bil') + .8, 5);         // billions
  add(110, .08 * L, 1 * L, W('tril'), W('tril') + 1.1, 6);    // trillions: the whole road
  // three cats over the smeared stand-in where his legs were drawn, trotting on the spot from the cut on
  [[900, 736, 1.3, 0], [960, 750, 1.3, 2], [1040, 760, 1.3, 3], [1000, 744, 1.1, 4]].forEach(([x, y, sc, k], i) => items.push({ fixed: [x, y, sc], a: 0, t: CUT + .1 + i * .12, lat: 0, ph: k + 1, name: S6_LEFT[(i + 3) % S6_LEFT.length] }));
  for (const it of items) it.p = cutPuppet(B.stage, it.name);
  // draw order: far cats first, the man among them by his y
  const slotY = a => s6road(a)[1];
  const itY = it => it.fixed ? it.fixed[1] : slotY(it.a);
  const order = items.map(it => ({ g: it.p.g, y: itY(it) })).concat([{ g: m17.g, y: at17.y + 10 }]).sort((a, b) => a.y - b.y);
  for (const o of order) B.stage.appendChild(o.g);
  B.cut({ x: 980, y: 690, z: 1.7 }, CUT)
    .to({ x: 960, y: 680, z: 1.55 }, CUT, W('hun') - CUT)
    .cut({ x: 790, y: 640, z: 1.55 }, W('hun')).to({ x: 790, y: 590, z: .95 }, W('hun'), W('tril') - W('hun'))   // one pull-back over the numbers, no cuts
    .to({ x: 800, y: 600, z: .9 }, W('tril'), W('follow') - W('tril'))
    .cut({ x: 1000, y: 700, z: 1.5 }, W('follow')).to({ x: 960, y: 650, z: 1.15 }, W('follow'), 2.6);
  B.soft(CUT - .01, false);

  // ---------------- sound ----------------
  sfx('scene6', 0, 'birds', .4, { loop: true, to: CUT }); sfx('scene6', 0, 'meadow', .4, { loop: true });
  sfx('scene6', .02, 'page', .7);
  for (let i = 0; i < 14; i++) sfx('scene6', WALK0 + .3 + i * .5, ['step1', 'step2', 'step3'][i % 3], .12);
  sfx('scene6', CUT - .05, 'whoosh', .35);
  for (let i = 0; i < 3; i++) sfx('scene6', WALK17 + i * .75, ['step1', 'step2', 'step3'][i], .35);
  [['hun', .3], ['thou', .35], ['mil', .42], ['bil', .5], ['tril', .6]].forEach(([m, v]) => { sfx('scene6', W(m), 'mews', v); sfx('scene6', W(m) + .12, 'pop', .35); });
  sfx('scene6', W('follow'), 'mew2', .35);
  sfx('scene6', D - .15, 'page', .6);

  stopClock(D, (q, f) => {
    const first = q < CUT - .001;
    vis(A.root, first); vis(B.root, !first);
    if (first) {
      A.apply(q, f);
      const x = manX(q), w = w16(q), walking = q > WALK0;
      m16.pose({ x, y: GY, s: at16.s, bob: w.bob + Math.sin(q * 2.2) * .6, rot: walking ? w.legL * .05 : 0, sq: 1 + .01 * Math.sin(q * 2.2),
        parts: { legL: w.legL, legR: w.legR } }, f);
      const dist = X0 - x;   // how far the ground has gone by: the cats' legs keep pace with it
      for (const c of trail) {
        const cx = x + c.off, L = catLife(q, c.ph, { d: dist / .5, L: 80, A: 22, tail: 16, head: 9 });
        c.p.pose({ x: cx, y: GY + c.dy, s: .5, bob: L.bob * 1.4 + (walking ? Math.abs(Math.sin(dist / 22 + c.ph)) * 1.2 : 0), rot: L.rot, parts: L.parts, op: Math.max(0, Math.min(1, (EDGE16 - cx) / 30)) }, f + c.i);
      }
    } else {
      B.apply(q, f);
      const w = mw(q), shift = w.d;
      m17.pose({ x: at17.x + w.d, y: at17.y + w.d * .12 + (w.d > 0 ? 0 : 0), s: at17.s, bob: w.bob + Math.sin(q * 2.2) * .8, sq: 1 + .008 * Math.sin(q * 2.2),
        parts: { legL: w.legL, legR: w.legR } }, f);
      for (const it of items) {
        const u = q - it.t; vis(it.p.g, u >= 0); if (u < 0) continue;
        const tr0 = trot(q, it.ph, 3.2), slow = Math.max(0, q - WALK17 - TAU_END) * 34;   // when he has stopped the cats go on trotting, slowly
        if (it.fixed) { const L = catLife(q, it.ph, { d: (u + slow * .05) * 70 / it.fixed[2], L: 80, A: 20, tail: 16, head: 9 }); it.p.pose({ x: it.fixed[0], y: it.fixed[1], s: it.fixed[2], flip: true, bob: tr0.bob * 1.6 + L.bob + (u < .3 ? Math.sin(u / .3 * Math.PI) * 10 : 0), rot: tr0.rot + L.rot, parts: L.parts }, f + it.ph * 5 | 0); continue; }
        const k = Math.min(1, u / 1.1), sm = k * k * (3 - 2 * k), arc = it.a + 230 * (1 - sm) - shift;   // runs in from further back
        const [rx, ry, rs] = s6road(arc), [ax, ay] = s6road(arc + 14), [bx, by] = s6road(arc - 14), tr = trot(q, it.ph, 3.2);
        const nx = -(by - ay), ny = bx - ax, nl = Math.hypot(nx, ny) || 1;
        const L = catLife(q, it.ph, { d: (shift + 230 * sm + slow) / (rs * 1.05), L: 80, A: 20, tail: 16, head: 9 });
        it.p.pose({ x: rx + nx / nl * it.lat * rs, y: ry + ny / nl * it.lat * rs + 2, s: rs * 1.05, flip: bx > ax, bob: tr.bob * rs * 1.6 + L.bob * rs + (u < .3 ? Math.sin(u / .3 * Math.PI) * 10 : 0), rot: tr.rot + L.rot, parts: L.parts }, f + it.ph * 5 | 0);
      }
    }
    out(q); turn(q);
  });
}
