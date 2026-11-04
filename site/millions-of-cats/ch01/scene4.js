/* scene4.js — Choosing. Gág's own vignettes, one cat at a time, each taken on its own page spot: p10 left (the white
   cat held high), p10 right (the black-and-white kitten hops up to his hand), p11 right (the grey kitten drops from the
   branch), p11 left (the white cat in the corner jumps on), p12 (the black kitten, from behind), p13 (the baby tiger on
   the hedge). Beat clock = PRE4 + the scene-clip word times (c below is clip seconds). Cuts: a wide that finds the
   vignette, an insert on each cat as the narration names it, a closer shot for whoever speaks, and on "so he took it"
   the cat's hop in an insert. The page changes (p10 -> p11 -> p12 -> p13) turn in the holes g4b, g4d and g4e; between
   the two vignettes of one page the camera travels (g4a, g4c). A figure never leaves the spot Gág drew it on: only its
   parts move, and a taken cat's old spot is plain paper. */
'use strict';
const PRE4 = .6;
const S4_TURN = [20.2, 36.2, 47.759];                 // clip time of the page turns (covered at this moment), each in its g4 hole
const S4_SAY = [[0, 4.4], [42.48, 45.082], [54.479, 56.509]];   // the old man's own lines (clip seconds)

// a hop from a to b over [t0, t0 + dur], h px high at the top; u 0 → 1
function s4hop(q, t0, dur, a, b, h) {
  const u = Math.min(1, Math.max(0, (q - t0) / dur));
  return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u - Math.sin(u * Math.PI) * h, u };
}
// how much the old man is talking (0 … 1) at q, from his lines' times: a syllable pulse while a line runs
function s4talk(q) { for (const [a, b] of S4_SAY) if (q >= PRE4 + a && q < PRE4 + b) return Math.abs(Math.sin((q - PRE4 - a) * 8.4)); return 0; }
// the same breath and slow rock every living figure gets
const s4idle = (q, ph = 0) => ({ sq: 1 + .012 * Math.sin(q * 2.2 + ph), rot: Math.sin(q * 1.3 + ph) * .5 });
// a speaker's nod on his stressed words: pulses with the syllables, a degree or two of head-and-shoulder tip plus a little dip
const s4nod = (q, ph = 0) => { const k = s4talk(q); return { rot: k * 1.6 * Math.sin(q * 4.2 + ph), bob: k * 2.5 }; };
// a cat in the hand or arms squirms: quick small turns and squashes, out of step with the next one
const s4squirm = (q, t0, t1, amp, ph = 0) => { const k = span(q, t0, t0 + .25) * (1 - span(q, t1 - .4, t1)); return { rot: k * amp * Math.sin(q * 11 + ph), sq: 1 + k * .05 * Math.sin(q * 13 + ph) }; };
// 0 → 1 → 0 over [a, b]: an arm that goes out and comes back
const s4hump = (q, a, b) => Math.sin(Math.PI * span(q, a, b));
// a damped pendulum swing (degrees) from t0
const s4swing = (q, t0, amp, hz = 1.6, damp = 1.1) => q < t0 ? 0 : amp * Math.exp(-(q - t0) * damp) * Math.sin((q - t0) * hz * Math.PI * 2);
// a point on a part turned a degrees (clockwise on screen) about its pivot
const s4turnAbout = (pv, d, a) => { const r = a * Math.PI / 180; return { x: pv.x + d.x * Math.cos(r) - d.y * Math.sin(r), y: pv.y + d.x * Math.sin(r) + d.y * Math.cos(r) }; };

function scene4(p, D) {
  const c2t = c => PRE4 + c, M = m => markAt('scene4', PRE4, m);
  const cam10 = paperCam(p, 'p10'), cam11 = paperCam(p, 'p11'), cam12 = paperCam(p, 'p12'), cam13 = paperCam(p, 'p13');
  const out = pageTurn(p, 0, .6, 'out');

  // ---- p10: left vignette, the white cat; right vignette, the black-and-white kitten ----
  const a10 = pagePos('p10', 'man10a'), b10 = pagePos('p10', 'man10b'), k10 = pagePos('p10', 'cat10bw');
  const man10a = cutPuppet(cam10.stage, 'man10a'), man10b = cutPuppet(cam10.stage, 'man10b'), kit10 = cutPuppet(cam10.stage, 'cat10bw');
  // ---- p11 ----
  const a11 = pagePos('p11', 'man11a'), b11 = pagePos('p11', 'man11b'), k11 = pagePos('p11', 'kitten11'), w11 = pagePos('p11', 'cat11w');
  const man11a = cutPuppet(cam11.stage, 'man11a'), man11b = cutPuppet(cam11.stage, 'man11b'), kit11 = cutPuppet(cam11.stage, 'kitten11'), cat11 = cutPuppet(cam11.stage, 'cat11w');
  // the dark ground band under the white cat is missing where she sat (lift notes): lay Gág's own band, shifted over from beside it
  const gl = cam11.layer('page'), gid = 's4gap';
  gl.insertAdjacentHTML('beforeend', `<clipPath id="${gid}"><rect x="502" y="733" width="106" height="30"/></clipPath><g clip-path="url(#${gid})"><image href="../img/sets/p11/page.webp" x="${-87.3 + 95}" y="-60.1" width="1774.6" height="1020.3" preserveAspectRatio="none"/></g>`);
  // the right-hand man of p11 stands on bare paper in Gág's page: give him her own ground, the grass band of the left vignette
  // copied over (once as it is and once mirrored, so the two halves meet at their matching edge and the ends taper)
  gl.insertAdjacentHTML('beforeend', `<g id="s4gr-g"><clipPath id="s4gr"><rect x="285" y="731" width="210" height="38"/></clipPath>` + [`translate(540 -133)`, `translate(1530 -133) scale(-1 1)`].map(t =>
    `<g transform="${t}"><g clip-path="url(#s4gr)"><image href="../img/sets/p11/page.webp" x="-87.3" y="-60.1" width="1774.6" height="1020.3" preserveAspectRatio="none"/></g></g>`).join('') + '</g>');
  const ground11 = document.getElementById('s4gr-g');
  // the white-cat man of p10 stands on bare paper too (Gág drew him floating): the grass tuft of the right vignette, copied under his feet the same way
  cam10.layer('page').insertAdjacentHTML('beforeend', `<g id="s4gr10"><clipPath id="s4gc10"><rect x="919" y="675" width="111" height="73"/></clipPath>` + [`translate(-589 -150)`, `translate(1471 -150) scale(-1 1)`].map(t =>
    `<g transform="${t}"><g clip-path="url(#s4gc10)"><image href="../img/sets/p10/page.webp" x="-87.3" y="-60.1" width="1774.6" height="1020.3" preserveAspectRatio="none"/></g></g>`).join('') + '</g>');
  // ---- p12, p13 ----
  const m12 = pagePos('p12', 'man12'), c12 = pagePos('p12', 'cat12'), m13 = pagePos('p13', 'man13'), c13 = pagePos('p13', 'cat13');
  const man12 = cutPuppet(cam12.stage, 'man12'), cat12 = cutPuppet(cam12.stage, 'cat12'), man13 = cutPuppet(cam13.stage, 'man13'), cat13 = cutPuppet(cam13.stage, 'cat13');

  // Gág's flowers and the bush, lifted as small pieces: each sways from its foot (sk), behind the figures
  const s4tuft = (cam, page, names) => names.map((n, i) => { const t = cutPuppet(cam.stage, n); cam.stage.insertBefore(t.g, cam.stage.firstChild); return { t, at: pagePos(page, n), i }; });
  const tf10 = s4tuft(cam10, 'p10', ['tuft10a', 'tuft10b', 'tuft10c']), tf11 = s4tuft(cam11, 'p11', ['tuft11a', 'tuft11b', 'tuft11c']), tf12 = s4tuft(cam12, 'p12', ['tuft12a', 'tuft12b']);
  const s4sway = (q, L, f) => L.forEach(({ t, at, i }) => t.pose({ x: at.x, y: at.y, s: at.s, sk: 5 * Math.sin(q * 1.8 + i * 1.7) + 2 * Math.sin(q * 3.1 + i * 2.3) }, f));

  // ---- cameras ----
  const T = c2t;
  // p10 left: he says "Oh!…", chooses (arms up), "It was white" (insert on the cat), then the camera travels right
  cam10.cut({ x: 425, y: 355, z: 1.7 }, 0).to({ x: 430, y: 372, z: 1.85 }, 0, T(4.5))      // tight enough that the right vignette's edge stays out, and he stands on his own ground
    .cut({ x: 480, y: 300, z: 2.7 }, T(4.62)).to({ x: 485, y: 295, z: 2.9 }, T(4.62), 3.6)
    .cut({ x: 520, y: 275, z: 3.7 }, T(8.2))
    .to({ x: 1135, y: 500, z: 1.4 }, T(9.4), 1.35)
    // p10 right: the wide, the insert on the kitten, the two-shot as his hand reaches, the insert on the hop
    .cut({ x: 1020, y: 655, z: 3.4 }, T(13.6))
    .cut({ x: 1095, y: 585, z: 2.0 }, T(15.05)).to({ x: 1080, y: 580, z: 2.15 }, T(15.05), 2.6)
    .cut({ x: 1050, y: 610, z: 3.0 }, T(17.6)).to({ x: 1085, y: 570, z: 1.9 }, T(18.4), 1.2);
  // p11 right: he walks in, the kitten on its branch tip, the reach, the drop; then the camera travels left
  cam11.cut({ x: 1110, y: 420, z: 1.9 }, 0)
    .cut({ x: 1230, y: 270, z: 3.1 }, T(21.6)).to({ x: 1215, y: 285, z: 3.3 }, T(21.6), 2.4)
    .cut({ x: 1130, y: 400, z: 2.0 }, T(24.15)).to({ x: 1135, y: 380, z: 2.15 }, T(24.15), 2.4)
    .cut({ x: 1140, y: 340, z: 2.2 }, T(26.4)).to({ x: 1110, y: 460, z: 1.9 }, T(27.3), .6)
    .cut({ x: 460, y: 470, z: 1.8 }, T(27.95))      // a plain cut to the other vignette: never two old men in one frame
    // p11 left: the white cat in the corner, the two-shot, the jump
    .cut({ x: 625, y: 650, z: 3.9 }, T(30.2))
    .cut({ x: 515, y: 600, z: 2.0 }, T(31.15)).to({ x: 510, y: 595, z: 2.2 }, T(31.15), 2.5)
    .cut({ x: 525, y: 585, z: 2.3 }, T(33.75));
  // p12: the wide, the insert on the black kitten, the man who speaks, the hop
  cam12.cut({ x: 535, y: 410, z: 1.5 }, 0)
    .cut({ x: 440, y: 335, z: 4.2 }, T(40.0))
    .cut({ x: 580, y: 330, z: 2.2 }, T(42.4)).to({ x: 575, y: 325, z: 2.4 }, T(42.4), 3.21)   // through "So he took it" (cut 3 dropped "said the very old man" and its wide)
    .cut({ x: 505, y: 350, z: 1.9 }, T(45.609)).to({ x: 520, y: 430, z: 1.7 }, T(46.709), .7);
  // p13: the wide, the insert on the baby tiger, the two-shot, the man who cries out, the leap
  cam13.cut({ x: 1135, y: 430, z: 1.5 }, 0)
    .cut({ x: 1232, y: 292, z: 5 }, T(50.409))
    .cut({ x: 1130, y: 390, z: 1.8 }, T(52.909))
    .cut({ x: 1075, y: 300, z: 2.3 }, T(54.409))     // y up 35: his head (the cat on it, his stressed bobs) stays in with air above
    .cut({ x: 1100, y: 345, z: 1.8 }, T(56.909))
    .cut({ x: 1135, y: 270, z: 2.4 }, T(58.609)).to({ x: 1135, y: 310, z: 2.0 }, T(59.909), 1.0);

  // ---- page turns: p10 → p11 → p12 → p13, each in a hole; the last one closes the scene ----
  const turns = S4_TURN.map(c => {
    const s = T(c), a = pageTurn(p, s - .5, .5, 'in'), ga = p.lastChild, b = pageTurn(p, s, .5, 'out'), gb = p.lastChild;
    sfx('scene4', s - .5, 'page', .45);
    return q => { a(q); vis(ga, q > s - .5 && q < s); b(q); vis(gb, q >= s && q < s + .5); };
  });
  const last = pageTurn(p, D - .1, .6, 'in'); sfx('scene4', D - .1, 'page', .55);

  // ---- sound ----
  sfx('scene4', 0, 'meadow', .45, { loop: true });
  sfx('scene4', T(0.3), 'mew1', .25);
  sfx('scene4', T(8.35), 'mew2', .3);
  sfx('scene4', T(13.8), 'mew3', .3); sfx('scene4', M('n04b.took') + .05, 'hop', .5);
  sfx('scene4', T(21.8), 'mew1', .3); sfx('scene4', M('n04c.took') + .1, 'hop', .5);
  sfx('scene4', T(30.3), 'mew2', .3); sfx('scene4', M('n04d.took') + .1, 'hop', .5);
  sfx('scene4', T(40.3), 'mew4', .3); sfx('scene4', M('n04f.took') + .05, 'hop', .5);
  sfx('scene4', T(50.709), 'mew3', .3); sfx('scene4', M('n04h.did') - .25, 'hop', .5);

  // ---- the poses ----
  const HOP = .55;
  stopClock(D, (q, f) => {
    const on10 = q < T(S4_TURN[0]), on11 = !on10 && q < T(S4_TURN[1]), on12 = !on10 && !on11 && q < T(S4_TURN[2]), on13 = !on10 && !on11 && !on12;
    vis(cam10.root, on10); vis(cam11.root, on11); vis(cam12.root, on12); vis(cam13.root, on13);
    const talk = s4talk(q);

    if (on10) {
      cam10.apply(q, f); s4sway(q, tf10, f);
      // the white cat: his arms hang low at "Oh!", lift on "So he chose one", and the cat wiggles in his hands on "white"
      const up = span(q, M('n04.white') - 1.7, M('n04.white') - .2);
      const wig = q > M('n04.white') ? Math.sin((q - M('n04.white')) * 9) * 3 * span(q, M('n04.white'), M('n04.white') + .3) : 0;
      // the arms part overlaps its cut by only 3 page px: a turn of more than a degree opens the line across his beard, so they only
      // turn a hair and shift by a pixel; the lift and the wiggle ride on the whole figure (rot, bob)
      man10a.pose({ x: a10.x, y: a10.y, s: a10.s, ...s4idle(q), rot: s4idle(q).rot + s4nod(q).rot + wig * .2, bob: talk * 2.5 + 2.5 * up + (q > T(.0) && q < T(.3) ? 6 * Math.sin((q - T(0)) / .3 * Math.PI) : 0),
        parts: { arms: .8 * Math.sin(q * 1.9) + wig * .3 }, move: { arms: [wig * .12, .5 - .9 * (1 - up) + .15 * Math.sin(q * 1.9) - Math.abs(wig) * .25] } }, f);
      // the other man at the tree: bends, sees the kitten, reaches, picks it up
      const tk = M('n04b.took'), ph = M('n04b.bw');
      const reach = -8 * span(q, T(15.2), tk) + 53 * span(q, tk + .25, tk + .95);        // armR: down to the kitten, then lifted with it
      const lean = -2 * span(q, T(12.4), T(13.0)) + Math.sin(q * 1.4) * .5;
      man10b.pose({ x: b10.x, y: b10.y, s: b10.s, sq: 1 + .012 * Math.sin(q * 2.1), rot: lean, parts: { armR: reach } }, f);
      // the kitten at his feet: looks, then on "took" crouches and hops to his hand and rides there
      const piv = { x: b10.x - 50 * b10.s, y: b10.y - 179 * b10.s }, hand = s4turnAbout(piv, { x: -75 * b10.s, y: 49 * b10.s }, reach);
      const at = { x: k10.x, y: k10.y }, to = { x: hand.x + 8, y: hand.y + 44 };
      const h = s4hop(q, tk + .0, HOP, at, to, 70), crouch = q > tk - .22 && q < tk ? .88 : 1;
      const kp = q < tk ? at : h.u < 1 ? h : to;
      const sq10 = s4squirm(q, tk + .95, T(19.3), 6, 2), cl10 = catLife(q, 1);
      kit10.pose({ x: kp.x, y: kp.y, s: k10.s, parts: cl10.parts, sq: (q < tk ? crouch * (1 + .015 * Math.sin(q * 3)) : 1 + .03 * Math.sin((q - tk) * 8) * Math.exp(-(q - tk) * 2)),
        rot: q < tk ? (q > ph ? Math.sin(q * 2.2) * 3 : 0) : h.u < 1 ? -22 + 44 * h.u : Math.sin(q * 5) * 2 + sq10.rot }, f);
    }
    if (on11) {
      cam11.apply(q, f); s4sway(q, tf11, f);
      // right: he walks in (one stride cycle, ending with the feet together), then reaches up for the kitten
      const rightOn = q < T(27.95); vis(ground11, rightOn); for (const pp of [man11b, kit11]) vis(pp.g, rightOn); for (const pp of [man11a, cat11]) vis(pp.g, !rightOn);
      const w0 = T(20.75), W = cutWalk(q - w0, { L: 140, A: 14, period: 1 }), walking = q >= w0 && q < w0 + 1;
      const done = q >= w0 + 1, wk = walking ? W : { legL: 0, legR: 0, d: 135.5, bob: 0 };
      const rise = span(q, T(24.2), T(26.0)), tk = M('n04c.took');
      man11b.pose({ x: b11.x - 135.5 + wk.d + 0, y: b11.y, s: b11.s, bob: wk.bob + rise * 8 * (done ? 1 : 0), ...s4idle(q, 1), rot: s4idle(q, 1).rot + 4 * rise,
        parts: { legL: wk.legL - 3 * rise, legR: wk.legR + 3 * rise } }, f);
      const hx = 1152, hy = 238;            // where the kitten sits once he has it: his open hands are at about (1130, 300)
      const sw = s4swing(q, T(21.7), 16, 1.1, .35);
      const kd = s4hop(q, tk + .05, .55, { x: k11.x, y: k11.y }, { x: hx, y: hy }, -30);
      const cl11 = catLife(q, 2), sq11 = s4squirm(q, tk + .65, T(27.95), 7, 1);
      kit11.pose(q < tk + .05 ? { x: k11.x, y: k11.y, s: k11.s, rot: sw, parts: cl11.parts } : { x: kd.x, y: kd.y, s: k11.s, rot: sw * (1 - kd.u) + sq11.rot, sq: sq11.sq, parts: cl11.parts }, f);
      // left: the man under the drooping tree shifts and looks down; the white cat looks up, then jumps on
      man11a.pose({ x: a11.x, y: a11.y, s: a11.s, ...s4idle(q, 2), rot: s4idle(q, 2).rot + 3 * span(q, T(31.3), T(33.0)) + 1.2 * Math.sin(q * 3.1) * span(q, T(33.0), T(35)), bob: 2 * Math.max(0, Math.sin(q * 3.1)) * span(q, T(33.0), T(35)),
        parts: { arm: 9 * s4hump(q, M('n04d.took') - .5, M('n04d.took') + 1.1) + 1.5 * Math.sin(q * 1.7 + 2), head: 4 * span(q, T(30.8), T(31.6)) * (1 - span(q, T(33), T(34))) + 2.5 * Math.sin(q * 3.1) * span(q, T(33.0), T(35)) } }, f);
      const tc = M('n04d.took'), cp = s4hop(q, tc + .05, .55, { x: w11.x, y: w11.y }, { x: 520, y: 590 }, 60);
      const cl11w = catLife(q, 3), sq11w = s4squirm(q, tc + .65, T(35.2), 7, 3);
      cat11.pose({ x: cp.x, y: cp.y, s: w11.s, parts: cl11w.parts, ...s4idle(q, 3), sq: q > tc - .25 && q < tc + .05 ? .9 : 1 + .015 * Math.sin(q * 2.4), rot: cp.u > 0 && cp.u < 1 ? -25 + 40 * cp.u : Math.sin(q * 1.6) * 2 + sq11w.rot }, f);
    }
    if (on12) {
      cam12.apply(q, f); s4sway(q, tf12.map(t => ({ ...t, i: t.i + 4 })), f);
      const sway = Math.sin(q * 1.2) * .8, tk = M('n04f.took');
      man12.pose({ x: m12.x, y: m12.y, s: m12.s, ...s4idle(q, 4), bob: s4nod(q, 1).bob, rot: sway + s4nod(q, 1).rot + 2.5 * span(q, T(40.2), T(41.5)) * (1 - span(q, T(43), T(43.5))),
        parts: { legL: Math.sin(q * 1.2) * 1.5, legR: -Math.sin(q * 1.2) * 1.5,
          armL: -11 * s4hump(q, tk - .6, tk + 1.1) + 1.5 * Math.sin(q * 1.9) - 2 * talk, armR: 3 * Math.sin(q * 2.3 + 1) + 4 * talk * Math.sin(q * 5) } }, f);
      const hp = s4hop(q, tk + .05, HOP, { x: c12.x, y: c12.y }, { x: 585, y: 240 }, 60);
      const cl12 = catLife(q, 4), sq12 = s4squirm(q, tk + .65, T(46.609), 7, 4);
      cat12.pose({ x: hp.x, y: hp.y, s: c12.s, parts: cl12.parts, ...s4idle(q, 5), sq: q > tk - .25 && q < tk + .05 ? .9 : 1 + .02 * Math.sin(q * 2.6), rot: hp.u > 0 && hp.u < 1 ? -10 + 20 * hp.u : sq12.rot }, f);
    }
    if (on13) {
      cam13.apply(q, f);
      const tk = M('n04h.did') - .25;
      man13.pose({ x: m13.x, y: m13.y, s: m13.s, ...s4idle(q, 6), bob: talk * 3 + (q > T(54.479) && q < T(56.609) ? Math.abs(Math.sin((q - T(54.479)) * 4.2)) * 6 : 0), rot: Math.sin(q * 1.2) * .8 + s4nod(q, 2).rot + 2 * span(q, T(50.609), T(52.209)) * (1 - span(q, T(53.209), T(54.209))),
        parts: { arm: -5 * s4hump(q, T(48.409), T(50.609)) - 12 * s4hump(q, T(52.609), T(54.209)) - 14 * s4hump(q, tk - .4, tk + 1.0) + 1.2 * Math.sin(q * 1.8), head: 2.2 * s4nod(q, 2).rot + 3 * s4hump(q, T(50.609), T(52.209)) + 4 * s4hump(q, T(48.009), T(50.009)) } }, f);
      const hp = s4hop(q, tk, HOP, { x: c13.x, y: c13.y }, { x: 1150, y: 290 }, 60);
      const cl13 = catLife(q, 5), sq13 = s4squirm(q, tk + .65, D, 7, 5);
      cat13.pose({ x: hp.x, y: hp.y, s: c13.s, parts: cl13.parts, ...s4idle(q, 7), sq: q > tk - .25 && q < tk ? .9 : 1 + .02 * Math.sin(q * 2.6), rot: hp.u > 0 && hp.u < 1 ? -10 + 20 * hp.u : sq13.rot }, f);
    }
    out(q); turns.forEach(t => t(q)); last(q);
  });
}
