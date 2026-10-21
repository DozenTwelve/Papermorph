/* scene3.js — What is meat? The Polish dog drops his bowl; the chopping stops; the Poland cutaway; the Soviet dog's
   "What is barking?"; the USSR cutaway (the puppy's silent mouth); the stunned trio. Beat clock; speech from PRE3. */
'use strict';
const PRE3 = 2.8;
const S3_RUNS = [[0, 1.0], [3.0, 40]];
chopSfx('scene3', S3_RUNS, { mute: [[5.1, 10.8], [16.5, 21.9]], quiet: [[3.0, 3.6, .15]] });
roomSfx('scene3', [[0, 5.1], [10.8, 16.5], [21.9, 23.7]]);
sfx('scene3', .1, 'scrape', .6); sfx('scene3', .45, 'scrape', .6);   // he licks the empty bowl
sfx('scene3', 1.0, 'clang');
sfx('scene3', 5.1, 'wind-pl', .4);
for (let t = 5.7; t < 6.1; t += 1 / 6) sfx('scene3', +t.toFixed(3), 'patter1', .5);   // the queue shuffles one step
sfx('scene3', 8.5, 'shutter');
sfx('scene3', 16.5, 'wind-su', .45); sfx('scene3', 20.3, 'wind-su', .45);
sfx('scene3', 18.15, 'yip-cut', .5);   // the puppy's yip, cut off: then nothing

function scene3(p, D) {
  const a = alleySet(p), c = a.cam, b = butcherSet(p), sn = snowSet(p), sv = sn.cam;
  // the alley's poses, shared by every alley shot
  const usP = { x: ALLEY.us, y: ALLEY.ground, s: US.s, dir: 1 }, plP = { x: ALLEY.pl, y: ALLEY.ground, s: PL.s, dir: -1, sit: 1 },
    suP = { x: ALLEY.su, y: ALLEY.suY, s: SU.s, dir: -1, sit: 1 };
  // alley: 0 AL_LICK (he licks the bowl, freezes at .55, his paw knocks it at .85), .9 the bowl spins and settles (AL_BOWL), 1.5 the window, 2.0 the eyes flinch,
  // 2.6 Polish CU ("What is meat?"), 4.0 American CU, 10.8 trio, 11.8 Soviet CU, 14.4 American CU, 15.7 Polish CU, 21.9 trio
  [[AL_LICK, 0], [AL_BOWL, .9], [AL_WINDOW, 1.5], [AL_SLOT, 2.0], [plP, 2.6], [usP, 4.0], [AL_TRIO, 10.8], [suP, 11.8], [usP, 14.4], [plP, 15.7], [AL_TRIO, 21.9]]
    .forEach(([v, t]) => c.cut(v.s ? DOG_CU(v) : v, t));
  // Poland: 5.1 wide (where we are), 5.7 pan along the queue (front to tail), 6.7 hooks, 7.4 the end, 8.5 the shutter, 9.9 the end
  b.cam.cut(BU_WIDE, 5.1); b.cam.cut(BU_FRONT, 5.7); b.cam.to({ x: 560, y: 640, z: 2.2 }, 5.7, 1.0);
  b.cam.cut(BU_HOOKS, 6.7); b.cam.cut(BU_END, 7.4); b.cam.cut(BU_DOOR, 8.5); b.cam.cut(BU_END, 9.9);
  const SNPUP = { ...SN_PUP, x: SN_PUP.x - 50 };   // keeps the leftmost dog's muzzle inside the frame
  // USSR: 16.5 wide, 18.1 the puppy, 19.1 the row, 20.3 the puppy, 21.3 the row
  [[SN_WIDE, 16.5], [SNPUP, 18.1], [SN_ROW, 19.1], [SNPUP, 20.3], [SN_ROW, 21.3]].forEach(([v, t]) => sv.cut(v, t));

  const pulse = (q, t0, d = .25) => q >= t0 && q < t0 + d ? Math.sin(Math.PI * (q - t0) / d) : 0;
  stopClock(D, (q, f) => {
    const inAlley = q < 5.1 || (q >= 10.8 && q < 16.5) || q >= 21.9, inPL = q >= 5.1 && q < 10.8, inSU = q >= 16.5 && q < 21.9;
    vis(c.root, inAlley); vis(b.cam.root, inPL); vis(sv.root, inSU);
    if (inAlley) alley(q, f);
    if (inPL) poland(q, f);
    if (inSU) ussr(q, f);
  });

  function alley(q, f) {
    c.apply(q, f); a.steam(q); a.shade(1);
    const spkPL = dogJaw(lips(q, 'scene3', PRE3, 's09')), spkSU = dogJaw(lips(q, 'scene3', PRE3, 's10'), .25);
    // Polish dog: licks the bowl on twos (to .55), freezes mid-lick (tongue out, eyes up), his paw slips at .85 and knocks it;
    // he looks at it, sits up at 2.6, speaks at 2.8
    const lickJ = q < .55 ? (onTwos(q) > 0 ? .4 : .25) : .3, lickR = q < .55 ? (onTwos(q) > 0 ? -26 : -32) : -26;
    const licking = q < 2.6;
    const headPL = licking ? (q < .9 ? lickR : -26 + 8 * span(q, .9, 1.4) - 10 * span(q, 2.0, 2.6)) : 0;
    const eyePL = q < .55 ? 0 : q < .9 ? 1 : q < 2.0 ? -.4 : q < 2.6 ? -.4 * (1 - span(q, 2.2, 2.6)) + .2 * span(q, 2.4, 2.6) : 1;
    a.pl.pose(licking ? { ...plP, ...PL_LICK, sit: 0, headR: headPL, jaw: q < .9 ? lickJ : .3 * (1 - span(q, .9, 1.8)), tongue: q < 1.3, eyeX: eyePL,
        paw: q >= .85 && q < 1.5 ? 35 * (q < .92 ? span(q, .85, .92) : 1 - span(q, 1.2, 1.5)) : 0, shut: q >= 2.2 && q < 2.3 }
      : { ...plP, jaw: q < 2.8 ? 0 : spkPL, eyeX: q >= 10.8 ? 1 : eyePL, lids: q >= 15.7 && q < 16.5 ? .3 : 0, shut: blinking(q, [3.2 + 3, 6.0, 16.0, 22.6]),
        ear: q >= 21.9 ? 20 * pulse(q, 22.0, .4) : q >= 15.7 ? 25 * pulse(q, 15.9, .3) : 0 }, f);
    // the bowl: at BOWL_AT until the paw knocks it (.85); it spins (cos of 0 -> 3 pi), rocks 8, -6, 3 and settles at BOWL_KNOCKED by 1.5
    vis(a.bowl, true);
    {
      const u = span(q, .88, 1.5), k = [[.88, 0], [1.05, 8], [1.2, -6], [1.35, 3], [1.5, BOWL_KNOCKED.rot]];
      let r = q < .88 ? 0 : BOWL_KNOCKED.rot; for (let i = 1; i < k.length; i++) if (q >= k[i - 1][0] && q < k[i][0]) r = k[i - 1][1] + (k[i][1] - k[i - 1][1]) * (q - k[i - 1][0]) / (k[i][0] - k[i - 1][0]);
      const spin = q >= .9 && q < 1.4 ? Math.cos(3 * Math.PI * (q - .9) / .5) : 1;
      a.placeBowl(q >= .88 && q < 1.2 ? 18 * Math.sin(Math.PI * (q - .88) / .32) : 0, r, BOWL_KNOCKED.dx * span(q, .88, 1.4), spin);
    }
    // American: the double take (jaw open, tongue out, two blinks), later the big reaction; jaw hangs to the end
    const take = between(q, 4.0, 5.1), big = between(q, 14.4, 15.7), pop = big ? Math.sin(Math.PI * Math.min(1, (q - 14.4) / .5)) : 0;
    a.us.pose({ ...usP, tongue: take || q >= 21.9, jaw: take ? .55 : big ? .65 : q >= 21.9 ? .7 : 0,
      headR: big ? 8 * pop : 0, bob: big ? -14 * pop : 0, ear: big && q < 14.9 ? 35 : 0,
      eyeX: q >= 10.8 && q < 14.4 ? 1 : 0, lids: take || big ? 0 : .1, shut: blinking(q, [1.8, 4.3, 4.8, 12.4, 15.2, 22.5]) }, f);
    // Soviet dog: barely moves; at 11.8 his eyes slide to the American, a breath; speaks at 13.25 with head and ear (muzzle)
    const nod = (q >= 13.25 && q < 13.4) || (q >= 13.68 && q < 13.83) ? 3 : 0;
    a.su.pose({ ...suP, lids: .35, eyeX: q < 11.8 ? 0 : 1, headR: nod, ear: pulse(q, 13.9, .25) * 20, swell: between(q, 12.2, 13.2) ? .4 * span(q, 12.2, 13.0) : 0,
      jaw: spkSU, shut: blinking(q, [3.4, 9.0, 13.0, 23.0]) }, f);
    vis(a.cn.g, false);
    // the eyes in the box: widen (2.0, 1 frame), squeeze and sink half at 2.08, hold .6 s, then ease back
    const lid = q < 2.0 ? 0 : q < 2.08 ? 0 : q < 2.6 ? .55 : .55 - .3 * span(q, 2.6, 3.2);
    a.box.pose({ x: ALLEY.box, y: ALLEY.ground, eyes: 1, eyeX: .6, lids: q >= 3.2 ? .25 : lid, shut: q >= 2.08 && q < 2.2 || blinking(q, [4.2, 13.0, 19.6]),
      shake: q >= 2.08 && q < 2.4 ? .6 : 0 }, f);
    a.kit.cook({ arm: cleaverAt(q, S3_RUNS), turn: 0 }); a.kit.crack(0);
  }

  function poland(q, f) {
    b.cam.apply(q, f);
    const step = span(q, 5.7, 6.1), dx = 70 * step, wk = between(q, 5.7, 6.15), sad = span(q, 9.0, 9.7), hope = between(q, 7.4, 8.5);
    const nudge = i => q >= 5.75 + i * .06 && q < 5.75 + i * .06 + 2 / FPS;   // each dog dips its nose to its bowl as the queue steps
    const front = span(q, 9.35, 9.5);   // the two front dogs' ears drop together as the shutter bangs (9.5)
    b.queue.forEach((d, i) => {
      const hop = i === 1 ? 150 * span(q, 7.0, 7.15) : 0;   // a hopeful nose pokes up into the hooks frame
      d.pose({ x: BUTCHER.queue[i] + dx - (hop ? 110 : 0), y: BUTCHER.y - hop, s: BUTCHER.s, dir: 1, walk: wk, lids: .3 + .2 * sad, ear: i < 2 ? -35 * front : -30 * sad,
        shut: blinking(q, [6.3 + i * .7, 9.0 + i * .3]), headR: hop ? 22 : nudge(i) ? -15 : -6 * sad }, f);
      const [bx, by] = bowlAhead({ x: BUTCHER.queue[i] + dx, y: BUTCHER.y, s: BUTCHER.s, dir: 1 }); tf(b.bowls[i], `translate(${bx},${by - 18 * BUTCHER.s}) scale(${BUTCHER.s})`);
    });
    b.pl.pose({ x: BUTCHER.pl + dx, y: BUTCHER.y, s: BUTCHER.s * 1.05, dir: 1, walk: wk, wag: hope, headR: hope ? 10 : nudge(5) ? -15 : -28 * sad,
      lids: .45 * sad, ear: -30 * sad, shut: blinking(q, [6.0, 8.0, 10.3]) }, f);
    { const [bx, by] = bowlAhead({ x: BUTCHER.pl + dx, y: BUTCHER.y, s: BUTCHER.s * 1.05, dir: 1 }); tf(b.bowls[5], `translate(${bx},${by - 18 * BUTCHER.s}) scale(${BUTCHER.s})`); }
    b.shutter(span(q, 8.5, 9.5));
  }

  function ussr(q, f) {
    sv.apply(q, f); sn.snow(q);
    const turned = i => q >= 19.1 + (SNOW.row.length - 1 - i) * (2 / FPS) && q < 21.3;
    sn.row.forEach((d, i) => d.pose({ x: SNOW.row[i] - (turned(i) ? 45 : 0), y: SNOW.y, s: SNOW.s, dir: turned(i) ? 1 : -1, sit: 1, lids: .4, shut: blinking(q, [17.0 + i * .5]) }, f));
    const open = q < 20.3 ? span(q, 18.12, 18.22) : 1 - span(q, 20.3, 21.0);
    sn.pup.pose({ x: SNOW.pup, y: SNOW.y, s: .5, dir: -1, sit: 1, jaw: .7 * open, ear: q > 20.3 ? EAR_FLAT : 0, shut: blinking(q, [17.4, 20.8]), headR: q >= 18.12 && q < 20.3 ? 12 : 0 }, f);
  }
}
