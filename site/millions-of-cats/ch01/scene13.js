/* scene13.js — But look! (p27) and the one listen-and-find stop. Beat clock = PRE13 + the joined clip's time.
   1 follow shot, 0 – 5.0: the old woman runs out of the house at the top right and down Gág's path, arms out, small and far and
     growing as she comes; the camera rides along (a wide shot of her alone on the paper would lose her) ("I think they must have eaten each other all up", "It's too bad!");
   3 two-shot, 5.0 – 5.9: her last strides, she pulls up beside him and wrings herself, he stands and puffs;
   4 close on him, 5.9 – 10.1: "But look!", his arm swings out and points; "said the very old man, and he pointed";
   5 insert on the high grass and the kitten in it, 10.1 – 13.2, the kitten trembling ("to a bunch of high grass");
   6 pulls back to the game's frame, 13.2 – D: the whole page, the house, a cloud, the grass, him, her, the kitten.
   The game (q > D): he asks (no mouth: his arm turns to the thing asked for and he pulses with the voice), she and
   everyone else live on: breath, sway, a trembling kitten, smoke from his pipe. */
'use strict';
const PRE13 = .5;
let THINGS13 = [];   // filled by scene13 each time it builds; findWords reads it
sfx('scene13', 0, 'birds', .35, { loop: true });

const s13_C = (clip, t = 0) => clipAt('scene13', PRE13, clip, t);
const s13_PK = (q, t, w = .2) => Math.max(0, 1 - Math.abs(q - t) / w);   // a small peak in time: a stressed word
const S13K = { x: -30, y: 8, s: .8 };   // the clean kitten on Gág's blot: offset from her kitten27 anchor, and scale (s 1 = the p28 size)
const s13_GAME = { x: 790, y: 470, z: 1.2 };
// her run down the ridge: [x, y, scale] in set px (the house door to where Gág drew her)
const s13_PATH = [[1250, 200, .24], [1066, 250, .38], [977, 313, .5], [889, 401, .65], [853, 490, .75], [756, 552, .88], [696, 605, 1]];
const s13_T0 = .45, s13_T1 = 5.6;   // she starts after the page turn and pulls up beside him just before "But look!" (m11 at 5.9 on the beat clock):
// since cut 3 dropped "said the very old woman" the follow shot stays on her through "It's too bad!" and the two-shot
// takes her last strides
const s13_SEG = (() => {   // each stretch takes time in proportion to its length over her size, so her stride is the same everywhere
  const w = s13_PATH.slice(1).map((b, i) => { const a = s13_PATH[i]; return Math.hypot(b[0] - a[0], b[1] - a[1]) / ((a[2] + b[2]) / 2); });
  const sum = w.reduce((x, y) => x + y, 0); let acc = 0;
  return w.map(v => { const r = [acc / sum, (acc += v) / sum]; return r; });
})();
function s13_ride(q) {   // the smooth line the follow camera rides (not her body)
  const u = Math.max(0, Math.min(1, (q - s13_T0) / (s13_T1 - s13_T0)));
  let i = s13_SEG.findIndex(r => u <= r[1]); if (i < 0) i = s13_SEG.length - 1;
  const [a, b] = [s13_PATH[i], s13_PATH[i + 1]], k = (u - s13_SEG[i][0]) / (s13_SEG[i][1] - s13_SEG[i][0] || 1);
  const s = a[2] + (b[2] - a[2]) * k;
  return { x: a[0] + (b[0] - a[0]) * k, y: a[1] + (b[1] - a[1]) * k + 12 * s * (1 - Math.max(0, Math.min(1, (u - .8) / .2))), s, going: q > s13_T0 && u < 1 };
}
// her steps: [x, y, scale] of each landing on the ridge's black edge (found in the set's own pixels, sole 2 px into the ink); the last is where Gág drew her
const s13_CT = [[1250, 184, .24], [1225, 191, .26], [1199, 198, .28], [1174, 210, .3], [1148, 216, .32], [1123, 228, .34], [1098, 240, .36], [1072, 255, .38], [1043, 271, .41], [1013, 293, .45],
  [982, 316, .49], [948, 344, .55], [914, 366, .61], [883, 402, .67], [860, 456, .73], [814, 522, .8], [756, 539, .88], [696, 605, 1]];
const s13_SP = (s13_T1 - s13_T0) / (s13_CT.length - 1);   // seconds per step: four frames on twos (two down, two in the air)
// she is a figure with no legs: the foot lands and holds (x and y of the contact do not change) for two frames, the body dips, then she hops to the next landing
function s13_run(q) {
  const t = Math.max(0, (q - s13_T0) / s13_SP), n = s13_CT.length - 1, k = Math.min(n, Math.floor(t + 1e-6)), f = k >= n ? 0 : t - k;
  const a = s13_CT[k], b = s13_CT[Math.min(n, k + 1)], e = f < .5 ? 0 : (f - .5) * 2;   // e: how far through the hop
  return { x: a[0] + (b[0] - a[0]) * e, y: a[1] + (b[1] - a[1]) * e - Math.sin(Math.PI * e) * 14 * a[2], s: a[2] + (b[2] - a[2]) * e, k, f, held: f < .5, going: q > s13_T0 && k < n };
}
for (let k = 1; k < s13_CT.length; k++) { const t = s13_T0 + k * s13_SP; sfx('scene13', +t.toFixed(2), 'step' + (k % 3 + 1), +(.12 + .35 * (t - s13_T0) / (s13_T1 - s13_T0)).toFixed(2)); }

// an inked patch over the soft grey smear on p27's ridge edge where the old woman was drawn (set world px), with the ridge's teeth
function s13_patch(parent) {
  const pts = [[704, 590], [712, 576], [716, 560], [720, 548], [731, 541], [752, 536], [770, 529], [790, 524], [808, 520], [826, 514], [836, 508], [846, 510], [830, 540], [812, 566], [790, 584], [770, 598], [740, 606]];   // read off the set's own pixels: the grey rim along the ridge top
  const d = 'M' + pts.map(([x, y]) => `${x},${y}`).join(' L') + ' Z';
  return mk('path', { d, fill: '#1e1a16' }, parent);
}

function scene13(p, D) {
  const turnOut = pageTurn(p, 0, .6, 'out');
  const T3 = s13_C('w11b', .945), T4 = s13_C('m11', -.1), T5 = s13_C('n11b', 2.668), T6 = s13_C('n11c', 0);   // shot cuts
  sfx('scene13', T4 + .15, 'whoosh', .25);
  sfx('scene13', s13_C('n11b', 3.482), 'mew3', .3);

  const cam = paperCam(p, 'p27', { x: 1160, y: 250, z: 1.9 });
  const fx = t => s13_ride(t).x - 60, fy = t => s13_ride(t).y - 120 * s13_ride(t).s;   // the follow shot rides along the run
  const sz = t => {   // her size along the run's landings, smoothly (s13_run's own s steps with each hop)
    const x = Math.max(0, (t - s13_T0) / s13_SP), n = s13_CT.length - 1, k = Math.min(n, Math.floor(x)), f = Math.min(1, x - k);
    return s13_CT[k][2] + (s13_CT[Math.min(n, k + 1)][2] - s13_CT[k][2]) * f;
  };
  const fz = t => Math.min(3.6, Math.max(2.3, .9 / sz(t)));   // close enough that she is about a quarter of the frame from her first word, out to 2.3 as she grows
  cam.cut({ x: fx, y: fy, z: fz }, 0)
    .cut({ x: 545, y: 560, z: 1.4 }, T3).to({ x: 520, y: 565, z: 1.5 }, T3, T4 - T3)
    .cut({ x: 350, y: 565, z: 2.9 }, T4).to({ x: 365, y: 565, z: 3.1 }, T4, T5 - T4)
    .cut({ x: 452, y: 745, z: 3.0 }, T5).to({ x: 452, y: 748, z: 3.4 }, T5, T6 - T5)
    .to(s13_GAME, T6 + .1, 1.6);

  // ---- the set: stage things ----
  const wAt = pagePos('p27', 'woman27'), mAt = pagePos('p27', 'man27'), kAt = pagePos('p27', 'kitten27');
  s13_patch(cam.stage);
  const man = cutPuppet(cam.stage, 'man27'), woman = cutPuppet(cam.stage, 'woman27'), kit = cutPuppet(cam.stage, 'kitten27');
  const kit2 = cutPuppet(cam.stage, 'kitten28');   // the clean p28 kitten over Gág's p27 blot, so a child can see what it taps
  const houseR = mk('rect', { x: 1245, y: 128, width: 118, height: 78, fill: 'transparent' }, cam.stage);   // painted into the set
  const cloudR = mk('rect', { x: 484, y: 202, width: 144, height: 70, fill: 'transparent' }, cam.stage);
  const grassR = mk('rect', { x: 262, y: 690, width: 150, height: 140, fill: 'transparent' }, cam.stage);
  // Gág's drawn smoke is kept only as a hidden part; the live smoke curls from the pipe bowl in her ink (s13_smoke: a wrapper to point at)
  const s13_sg = mk('g', {}, man.part.head), s13_sq = inkSmoke(s13_sg, 66, -228, { size: 12, rise: 140, drift: 30, curl: 12, period: 2.2, ink: 2, seed: 3 });
  // Gág's tufts sway from their feet (world px of the set; 'tuftL' left fan, 'tuftB' the blades along the bottom)
  cam.move('tuftL', q => `translate(302 833) skewX(${(2.2 * Math.sin(q * 1.8) + .8 * Math.sin(q * 4.1)).toFixed(2)}) translate(-302 -833)`)
    .move('tuftB', q => `translate(415 826) skewX(${(2 * Math.sin(q * 1.5 + 1) + .7 * Math.sin(q * 3.7)).toFixed(2)}) translate(-415 -826)`);

  THINGS13 = [
    { g: houseR, word: 'house', side: 'below' }, { g: cloudR, word: 'cloud', side: 'below' }, { g: grassR, word: 'grass', side: 'left' },
    { g: s13_sg, word: 'smoke', side: 'right' }, { g: man.g, word: 'old man', clip: 'q-me', talk: true, side: 'above' },
    { g: woman.g, word: 'old woman', clip: 'q-her', talk: true, side: 'right' }, { g: kit2.g, word: 'kitten', side: 'right' }];
  const where = new Map([[houseR, [1300, 166]], [cloudR, [556, 237]], [grassR, [340, 770]], [s13_sg, [462, 459]], [man.g, null],
    [woman.g, [696, 450]], [kit2.g, [463, 740]]]);
  let armNow = 6, lean = 0;

  stopClock(D, (q, f) => {
    cam.apply(q, f);
    const wait = q > D, saying = wait && FIND.saying, hers = saying === 'q-her', breathe = Math.sin(q * 2.3);

    // ---- the old woman: runs down the path, pulls up, then reacts and lives ----
    const r = s13_run(q), step = Math.sin(Math.max(0, q - s13_T0) * 2 * Math.PI / .56);
    const stress = s13_PK(q, s13_C('w11', .306), .15) + s13_PK(q, s13_C('w11', 1.108), .15) + s13_PK(q, s13_C('w11', 1.991), .2) + s13_PK(q, s13_C('w11b', .403), .12) + s13_PK(q, s13_C('w11b', .551), .12);
    const talkW = q > s13_C('w11') && q < s13_C('w11', 2.537) || q > s13_C('w11b') && q < s13_C('w11b', 1.089) || hers;
    const settle = Math.max(0, 1 - (q - s13_T1) / .5);   // the pulled-up lurch dies away
    let wo;
    const sk = r.k, sf = r.f;
    if (q < s13_T1) wo = { x: r.x, y: r.y, s: r.s, rot: -3 + (sk % 2 ? 4 : -4) * (r.held ? .5 : 1), sq: r.held ? 1 - (sf < .25 ? .06 : .03) : 1.02, parts: { head: 4 * step + 5 * stress, armL: 8 + 14 * step } };
    else wo = { x: wAt.x, y: wAt.y - 2.5 * breathe * (q < s13_T1 ? 0 : 1) - (q > s13_T1 && q < s13_T1 + .4 ? 10 * Math.sin((q - s13_T1) / .4 * Math.PI) : 0),
      s: 1, rot: q < s13_T1 ? 0 : -3 * settle + 1.2 * Math.sin(q * 1.3) + (talkW && q < D ? -2 * stress : 0),
      sq: 1 + .012 * breathe + (talkW ? .012 * Math.abs(Math.sin(q * 9)) : 0),
      parts: { armL: 6 + 3 * Math.sin(q * 1.4) + 15 * stress + (talkW ? 6 * Math.sin(q * 6) : 0) + (wait && !hers ? 4 * Math.sin(q * 2.1) : 0), head: (q < T4 ? 3 * Math.sin(q * 5) * (q > s13_C('w11b') && q < s13_C('w11b', 1.16) ? 1 : .25) + 4 * stress : 0) + 2.5 * Math.sin(q * .9 + 1) +
        (wait ? (() => { const t = FIND.target && where.get(FIND.target); return t ? (t[1] < 600 ? 5 : -3) : 0; })() : 0) + (hers ? 4 * Math.sin(q * 8) : 0) } };
    woman.pose({ ...wo, flip: false }, f);

    // ---- the old man: stands, puffs, then swings his arm out and points; in the game it turns to what he asks for ----
    const mT = s13_C('m11', .183);   // the swing, on "look"
    let arm;
    if (q < D) {
      arm = 5 + 1.2 * Math.sin(q * 1.9) - 12 * span(q, T4 + .1, mT + .1) + 5 * span(q, mT + .1, mT + .45) - 14 * span(q, s13_C('n11b', 1.947), s13_C('n11b', 2.191)) * (1 - span(q, T6, T6 + .5));   // "he pointed": down toward the grass, before the cut
      armNow = arm;
    } else {
      const t = saying === 'q-me' ? null : FIND.target && where.get(FIND.target);
      let goal = -3 + 2 * Math.sin(q * 1.7);
      if (t) goal = -2 + .06 * Math.max(-165, Math.min(40, Math.atan2(-(t[0] - 330), t[1] - 512) * 180 / Math.PI + 27));   // a sleeve, not a stick (the body behind it has a hole where Gág's arm was): it turns only a little, and he leans the rest
      if (FIND.target === man.g || saying === 'q-me') goal = 4;
      const tx = FIND.target && !saying ? where.get(FIND.target) : null;
      lean += ((tx ? Math.max(-1, Math.min(1, (tx[0] - 366) / 700)) * 2.2 : 0) - lean) * .2;
      armNow += (goal - armNow) * .28; arm = armNow + (saying ? 2.5 * Math.sin(q * 7) : 0);
    }
    const talkM = (q > s13_C('m11') && q < s13_C('m11', .574)) || (q > s13_C('n11b', 2.011) && q < s13_C('n11b', 4.15)) || (saying && !hers && saying !== 'q-her');
    const nodM = s13_PK(q, s13_C('m11', .076), .15) + s13_PK(q, s13_C('m11', .232), .15) + s13_PK(q, s13_C('n11b', 3.541), .2);   // his stressed words: But, look, grass
    man.pose({ x: mAt.x, y: mAt.y, flip: false, rot: .8 * Math.sin(q * 1.1) + lean * (q > D ? 1 : 0) - (talkM ? 1.2 * Math.abs(Math.sin(q * 7.5)) : 0) - 1.4 * nodM,
      sq: 1 + .012 * Math.sin(q * 2.2 + 1) + (talkM ? .013 * Math.abs(Math.sin(q * 7.5)) : 0),
      parts: { armR: arm, head: 3 * nodM + 1.5 * Math.sin(q * 1.2) + (q > s13_C('n11b', 2.071) && q < T6 || (wait && FIND.target === kit2.g) ? 6 : 0) + (talkM ? 2 * Math.abs(Math.sin(q * 7.5)) : 0) }, hide: ['smoke'] }, f);
    s13_sq(q);

    // ---- the kitten in the grass: always trembling a little, more when we look at it ----
    const tre = q > T5 - .2 ? 2.4 : 1.6, shake = Math.floor(q * FPS) % 2 ? 1 : -1;   // a fast small tremble on twos
    const listen = (talkM || talkW) ? 1 : 0;
    kit.pose({ x: kAt.x, y: kAt.y, rot: tre * 1.1 * shake * (.6 + .4 * Math.sin(q * 3)), sq: 1 + .012 * Math.sin(q * 3.1) }, f);

    // the clean kitten sits over the blot from the start of the scene, tucked low in the grass, trembling
    kit2.pose({ x: kAt.x + S13K.x + .8 * tre * shake, y: kAt.y + S13K.y, s: S13K.s, rot: tre * 1.1 * shake * (.6 + .4 * Math.sin(q * 3)), sq: 1 + .012 * Math.sin(q * 3.1), parts: { head: -3 + 6 * listen + 1.5 * Math.sin(q * 1.3) + 2 * shake * tre * .5 } }, f);

    turnOut(q);
  });
}
