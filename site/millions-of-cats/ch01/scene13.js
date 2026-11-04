/* scene13.js — But look! (p27) and the one listen-and-find stop. Beat clock = PRE13 + the joined clip's time.
   1 follow shot, 0 – 6.2: the old woman runs out of the house at the top right and down Gág's path, arms out, small and far and
     growing as she comes; the camera rides along (a wide shot of her alone on the paper would lose her) ("I think they must have eaten each other all up");
   3 two-shot, 6.2 – 8.5: "It's too bad!", she wrings herself, he stands and puffs;
   4 close on him, 8.5 – 12.7: "But look!", his arm swings out and points; "said the very old man, and he pointed";
   5 insert on the high grass and the kitten in it, 12.7 – 15.8, the kitten trembling ("to a bunch of high grass");
   6 pulls back to the game's frame, 15.8 – D: the whole page, the house, a cloud, the grass, him, her, the kitten.
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
const s13_T0 = .45, s13_T1 = 6.1 + PRE13 - .5;   // she starts after the page turn and pulls up at the end of "It's"
const s13_SEG = (() => {   // each stretch takes time in proportion to its length over her size, so her stride is the same everywhere
  const w = s13_PATH.slice(1).map((b, i) => { const a = s13_PATH[i]; return Math.hypot(b[0] - a[0], b[1] - a[1]) / ((a[2] + b[2]) / 2); });
  const sum = w.reduce((x, y) => x + y, 0); let acc = 0;
  return w.map(v => { const r = [acc / sum, (acc += v) / sum]; return r; });
})();
function s13_run(q) {
  const u = Math.max(0, Math.min(1, (q - s13_T0) / (s13_T1 - s13_T0)));
  let i = s13_SEG.findIndex(r => u <= r[1]); if (i < 0) i = s13_SEG.length - 1;
  const [a, b] = [s13_PATH[i], s13_PATH[i + 1]], k = (u - s13_SEG[i][0]) / (s13_SEG[i][1] - s13_SEG[i][0] || 1);
  return { x: a[0] + (b[0] - a[0]) * k, y: a[1] + (b[1] - a[1]) * k, s: a[2] + (b[2] - a[2]) * k, going: q > s13_T0 && u < 1 };
}
for (let t = s13_T0 + .2, k = 0; t < s13_T1; t += .3, k++) sfx('scene13', +t.toFixed(2), 'step' + (k % 3 + 1), +(.12 + .35 * (t - s13_T0) / (s13_T1 - s13_T0)).toFixed(2));

function scene13(p, D) {
  const turnOut = pageTurn(p, 0, .6, 'out');
  const T3 = s13_C('w11b', -.15), T4 = s13_C('m11', -.1), T5 = s13_C('n11b', 2.4), T6 = s13_C('n11c', 0);   // shot cuts
  const TW = s13_C('n11', -.15);   // the follow shot begins as she is named
  sfx('scene13', T4 + .15, 'whoosh', .25);
  sfx('scene13', s13_C('n11b', 3.3), 'mew3', .3);

  const cam = paperCam(p, 'p27', { x: 1160, y: 250, z: 1.9 });
  const fx = t => s13_run(t).x - 60, fy = t => s13_run(t).y - 120 * s13_run(t).s;   // the follow shot rides along the run
  cam.cut({ x: fx, y: fy, z: 1.9 }, 0).to({ z: 2.3 }, .4, TW - .4)
    .cut({ x: 545, y: 560, z: 1.4 }, T3).to({ x: 520, y: 565, z: 1.5 }, T3, T4 - T3)
    .cut({ x: 350, y: 565, z: 2.9 }, T4).to({ x: 365, y: 565, z: 3.1 }, T4, T5 - T4)
    .cut({ x: 452, y: 745, z: 3.0 }, T5).to({ x: 452, y: 748, z: 3.4 }, T5, T6 - T5)
    .to(s13_GAME, T6 + .1, 1.6);

  // ---- the set: stage things ----
  const wAt = pagePos('p27', 'woman27'), mAt = pagePos('p27', 'man27'), kAt = pagePos('p27', 'kitten27');
  const man = cutPuppet(cam.stage, 'man27'), woman = cutPuppet(cam.stage, 'woman27'), kit = cutPuppet(cam.stage, 'kitten27');
  const kit2 = cutPuppet(cam.stage, 'kitten28');   // the clean p28 kitten over Gág's p27 blot, so a child can see what it taps
  const houseR = mk('rect', { x: 1245, y: 128, width: 118, height: 78, fill: 'transparent' }, cam.stage);   // painted into the set
  const cloudR = mk('rect', { x: 484, y: 202, width: 144, height: 70, fill: 'transparent' }, cam.stage);
  const grassR = mk('rect', { x: 262, y: 690, width: 150, height: 140, fill: 'transparent' }, cam.stage);
  THINGS13 = [
    { g: houseR, word: 'house', side: 'below' }, { g: cloudR, word: 'cloud', side: 'below' }, { g: grassR, word: 'grass', side: 'left' },
    { g: man.part.smoke, word: 'smoke', side: 'right' }, { g: man.g, word: 'old man', clip: 'q-me', talk: true, side: 'above' },
    { g: woman.g, word: 'old woman', clip: 'q-her', talk: true, side: 'right' }, { g: kit2.g, word: 'kitten', side: 'right' }];
  const where = new Map([[houseR, [1300, 166]], [cloudR, [556, 237]], [grassR, [340, 770]], [man.part.smoke, [462, 459]], [man.g, null],
    [woman.g, [696, 450]], [kit2.g, [463, 740]]]);
  let armNow = 6, lean = 0;

  stopClock(D, (q, f) => {
    cam.apply(q, f);
    const wait = q > D, saying = wait && FIND.saying, hers = saying === 'q-her', breathe = Math.sin(q * 2.3);

    // ---- the old woman: runs down the path, pulls up, then reacts and lives ----
    const r = s13_run(q), step = Math.sin(Math.max(0, q - s13_T0) * 2 * Math.PI / .56);
    const stress = s13_PK(q, s13_C('w11', .4), .15) + s13_PK(q, s13_C('w11', 1.15), .15) + s13_PK(q, s13_C('w11', 1.83), .2) + s13_PK(q, s13_C('w11b', .46), .12) + s13_PK(q, s13_C('w11b', .65), .12);
    const talkW = q > s13_C('w11') && q < s13_C('w11', 2.6) || q > s13_C('w11b') && q < s13_C('w11b', 1.4) || hers;
    const settle = Math.max(0, 1 - (q - s13_T1) / .5);   // the pulled-up lurch dies away
    let wo;
    if (q < s13_T1) wo = { x: r.x, y: r.y - Math.abs(step) * 9 * r.s, s: r.s, rot: -3 + 2 * step, parts: { head: 4 * step + 5 * stress } };
    else wo = { x: wAt.x, y: wAt.y - 2.5 * breathe * (q < s13_T1 ? 0 : 1) - (q > s13_T1 && q < s13_T1 + .4 ? 10 * Math.sin((q - s13_T1) / .4 * Math.PI) : 0),
      s: 1, rot: q < s13_T1 ? 0 : -3 * settle + 1.2 * Math.sin(q * 1.3) + (talkW && q < D ? -2 * stress : 0),
      sq: 1 + .012 * breathe + (talkW ? .012 * Math.abs(Math.sin(q * 9)) : 0),
      parts: { head: (q < T4 ? 3 * Math.sin(q * 5) * (q > s13_C('w11b') && q < s13_C('w11b', 1.5) ? 1 : .25) + 4 * stress : 0) + 2.5 * Math.sin(q * .9 + 1) +
        (wait ? (() => { const t = FIND.target && where.get(FIND.target); return t ? (t[1] < 600 ? 5 : -3) : 0; })() : 0) + (hers ? 4 * Math.sin(q * 8) : 0) } };
    if (q < s13_T1) wo.sq = 1 + .01 * breathe;
    woman.pose({ ...wo, flip: false }, f);

    // ---- the old man: stands, puffs, then swings his arm out and points; in the game it turns to what he asks for ----
    const mT = s13_C('m11', .4);   // the swing, on "look"
    let arm;
    if (q < D) {
      arm = 5 + 1.2 * Math.sin(q * 1.9) - 12 * span(q, T4 + .1, mT + .1) + 5 * span(q, mT + .1, mT + .45) - 4 * s13_PK(q, s13_C('n11b', 3.25), .25);
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
    const talkM = (q > s13_C('m11') && q < s13_C('m11', 1.2)) || (q > s13_C('n11b', 1.8) && q < s13_C('n11b', 4.4)) || (saying && !hers && saying !== 'q-her');
    const nodM = s13_PK(q, s13_C('m11', .22), .15) + s13_PK(q, s13_C('m11', .5), .15) + s13_PK(q, s13_C('n11b', 3.4), .2);   // his stressed words: But, look, grass
    man.pose({ x: mAt.x, y: mAt.y, flip: false, rot: .8 * Math.sin(q * 1.1) + lean * (q > D ? 1 : 0) - (talkM ? 1.2 * Math.abs(Math.sin(q * 7.5)) : 0) - 1.4 * nodM,
      sq: 1 + .012 * Math.sin(q * 2.2 + 1) + (talkM ? .013 * Math.abs(Math.sin(q * 7.5)) : 0),
      parts: { armR: arm, smoke: 3.5 * Math.sin(q * 1.9) + 2 * Math.sin(q * 4.3) } }, f);

    // ---- the kitten in the grass: always trembling a little, more when we look at it ----
    const tre = q > T5 - .2 ? 1 : .45;
    kit.pose({ x: kAt.x, y: kAt.y, rot: tre * 1.1 * (Math.floor(q * FPS) % 2 ? 1 : -1) * (.6 + .4 * Math.sin(q * 3)), sq: 1 + .012 * Math.sin(q * 3.1) }, f);

    // the clean kitten sits over the blot from the start of the scene, tucked low in the grass, trembling
    kit2.pose({ x: kAt.x + S13K.x, y: kAt.y + S13K.y, s: S13K.s, rot: tre * 1.1 * (Math.floor(q * FPS) % 2 ? 1 : -1) * (.6 + .4 * Math.sin(q * 3)), sq: 1 + .012 * Math.sin(q * 3.1) }, f);

    turnOut(q);
  });
}
