/* scene4.js — the meadow: the turning point. Red leaves the path; the wolf runs ahead.
   Shots (beat clock = PRE4 + clip times of the joined scene4: s04 0, think4 4.43, s04b 6.98, hole 11.38–13.58, run4 16.97):
     A  0 → s04+0.05      the path's edge, two-shot as scene 3 left them: the wolf (860, facing right) and Red (1060,
                          facing him), the meadow opening behind her; he leans in, oily
     B  → s04+1.45        close two-shot: "Why hurry?", paw out, Red readable at the right
     C  → s04+4.40        medium wide: on "Look" he sweeps his arm up past her; she turns to the meadow (in the wide) and
                          the camera pans with the arm onto it (flowers, butterflies, the bird, the sun) for "lovely flowers!"
     D1 → s04+5.15        Red's medium close-up, profile: she looks at the flowers and smiles, leans to go; the wolf behind
     D2 → s04+6.45        cut to her front close-up between the grinning wolf (left) and a torn-paper thought picture of
                          Mother's raised finger (right) that flickers in and fades; worried, she bites her lip
     D3 → s04b+1.27       profile again: she looks at the flowers, nods — decided — and steps to the path's edge
     E  → s04b+2.47       insert low on her feet: one big step over the pebble edge onto the grass on "left the path"
     F  → s04b+6.72       medium: she skips into the meadow and picks on twos, three flowers, the bunch growing
     G  → run4+0.53       low fast follow of the wolf on all fours, grass and big flowers whipping past; he leaves the frame
     H  → end (+hold)     wide: Red small and alone, still picking, the wolf gone */
'use strict';
const PRE4 = 1.0;
// Red picks a flower in u 0 … 1 (about a second): bend to it, snap, show it, put it in the bunch.
function s4_pick(u, col) {
  if (u < .3) { const e = ease(u / .3); return { lean: 62 * e, crouch: .7 * e, fua: -20 - 30 * e, ffa: 10 * e, held: null, put: false }; }
  if (u < .45) return { lean: 62, crouch: .7, fua: -50, ffa: 10, held: u >= .38 ? col : null, put: false };
  if (u < .75) { const e = ease((u - .45) / .3); return { lean: 62 - 47 * e, crouch: .7 * (1 - e), fua: -50 - 50 * e, ffa: 10 - 60 * e, held: col, put: false }; }
  const e = ease((u - .75) / .25);
  return { lean: 15 * (1 - e), crouch: 0, fua: -100 + 80 * e, ffa: -50 - 20 * e, held: u < .88 ? col : null, put: u >= .88 };
}
// A torn sheet w × h around (0, 0) (Little Horse's thought picture), the same every time.
function s4_torn(w, h, seed) {
  const pts = [], n = 9;
  const side = (x0, y0, x1, y1, k) => { for (let i = 0; i < n; i++) { const u = i / n; pts.push([x0 + (x1 - x0) * u + 4 * jit(seed, k + i), y0 + (y1 - y0) * u + 4 * jit(seed, k + 40 + i)]); } };
  side(-w / 2, -h / 2, w / 2, -h / 2, 0); side(w / 2, -h / 2, w / 2, h / 2, 100); side(w / 2, h / 2, -w / 2, h / 2, 200); side(-w / 2, h / 2, -w / 2, -h / 2, 300);
  return 'M' + pts.map(p => p.map(v => v.toFixed(1)).join(',')).join(' L') + ' Z';
}
// The thought picture popping in on twos (a flicker), then fading out in steps.
const s4_think = (q, t0, t1) => q < t0 || q >= t1 + .5 ? 0 : q >= t1 ? [.7, .45, .2, .08, 0, 0][Math.floor((q - t1) * FPS)] : [.5, .15, .8, .4, 1][Math.min(4, Math.floor((q - t0) * FPS))];

function scene4(p, D) {
  const C = (c, t) => clipAt('scene4', PRE4, c, t), s = .6;
  const T = {
    B: C('s04', .05), C: C('s04', 1.45), sweep: C('s04', 1.6), pan: C('s04', 2.15), D1: C('s04', 4.4), D2: C('s04', 5.15),
    cloud: C('s04', 5.35), cloudOff: C('s04', 6.15), D3: C('s04', 6.45), walk: C('s04b', .45), E: C('s04b', 1.27),
    step: C('s04b', 1.42), F: C('s04b', 2.47), G: C('s04b', 6.72), H: C('run4', .53),
  };
  const PICKS = [C('s04b', 3.6), C('s04b', 4.65), C('s04b', 5.7), C('run4', .8)], PICK = 1.05;
  // ---- sound: the meadow bed (it repeats to the end of the scene), feet where they are seen
  sfx('scene4', 0, 'meadow', .6, { loop: true });
  sfx('scene4', T.step + .5, 'step1', 1.6);
  [.35, .7, 1.05].forEach((t, i) => sfx('scene4', T.F + t, 'step' + (2 + i % 2), 1.1));
  PICKS.forEach(t => sfx('scene4', t + .4, 'pop', .45));
  sfx('scene4', T.G + .25, 'whoosh', 1.2);
  for (let t = T.G + .3; t < T.H - .1; t += .44) sfx('scene4', +t.toFixed(2), 'run', 1.3);

  // ---- the set, its live things (sun and clouds in the sky layer), the cast
  const cam = paperCam(p, 'meadow', { x: 1020, y: 560, z: 1.45 }, { stages: ['sky'] });
  const sun = sunProp(cam.stageAt.sky), clouds = [cloudProp(cam.stageAt.sky), cloudProp(cam.stageAt.sky)];
  const bird = birdProp(cam.stage), flies = [butterflyProp(cam.stage), butterflyProp(cam.stage)];
  const red = redPuppet(cam.stage), wolf = wolfPuppet(cam.stage);
  // the flowers she picks: one a step ahead of each pick (picks 0–2 in F, 3–4 in H)
  const STEP = 2 * 166 * Math.sin(18 * Math.PI / 180) * s, RX = PICKS.map((t, i) => 1467 + STEP * i), REACH = 64;
  const flowers = PICKS.map((t, i) => flowerProp(cam.stage, FLOWER_COLS[i]));
  const edge = [[1150, 935, 1.3, 4], [1262, 950, 1.5, 1]].map(([x, y, k, c]) => [flowerProp(cam.stage, FLOWER_COLS[c]), x, y, k]);   // the insert's foreground
  const near = [1530, 1610, 1700, 1790].map((x, i) => [flowerProp(cam.stage, FLOWER_COLS[(i + 2) % 7]), x]);   // not picked

  // ---- the thought picture (screen space, over everything): Mother, finger raised
  const th = mk('g', {}, p), thIn = mk('g', {}, th);
  prop(th, `<g filter="url(#paper)">${[[948, 404, 10], [985, 372, 16]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#f6efe0"/>`).join('')}</g>`);
  prop(thIn, `<g filter="url(#paper)"><path d="${s4_torn(400, 320, 404)}" fill="#f6efe0"/><path d="${s4_torn(370, 292, 405)}" fill="#e3edd2"/></g>`);
  const clip = mk('clipPath', { id: 's4_clip' }, thIn); mk('path', { d: s4_torn(366, 288, 405) }, clip);
  const momG = mk('g', { 'clip-path': 'url(#s4_clip)' }, thIn), mom = motherPuppet(momG);

  // ---- cameras
  cam.cut({ x: 965, y: 580, z: 2.6 }, T.B)                                    // B: the wolf asks, Red at the right
    .cut({ x: 1020, y: 540, z: 1.4 }, T.C).to({ x: 2300, y: 500, z: 1.1 }, T.pan, 1.75)   // C: sweep and pan
    .cut({ x: 1000, y: 565, z: 2.6 }, T.D1)                                  // D1: Red, profile, the wolf behind her
    .cut({ x: 1010, y: 548, z: 3.2 }, T.D2)                                  // D2: Red front between the wolf and Mother
    .cut({ x: 1000, y: 565, z: 2.6 }, T.D3).to({ x: 1060 }, T.walk, .8)     // D3: decided, she steps
    .cut({ x: 1170, y: 792, z: 3 }, T.E)                                     // E: feet off the path
    .cut({ x: 1530, y: 630, z: 1.9 }, T.F).to({ x: 1600 }, PICKS[1], 2)      // F: picking
    .cut({ x: s4_wolfX(T.G, T.G) + 30, y: 700, z: 1.8 }, T.G)                 // G: low follow, then he runs out
    .to({ x: t => s4_wolfX(Math.min(t, T.G + 2.3), T.G) + 30 }, T.G, .001)
    .cut({ x: 1760, y: 500, z: 1 }, T.H);                                    // H: alone

  stopClock(D, (q, f) => {
    cam.apply(q, f);
    cam.show('fore', !between(q, T.E, T.F));   // the insert: the big fore flowers would hide her feet
    // sky and meadow life
    sun.pose(1300, 170, .8, q * 6);
    clouds[0].pose(640 + 6 * q, 120, 1); clouds[1].pose(1500 + 6 * q, 70, .8);
    const flee = q >= T.G ? Math.max(0, q - (T.G + .25 + (2250 - 2100 - 140) / 330)) : 0;   // up and away as the wolf comes by
    bird.pose(2250 + 260 * flee, 788 - 420 * flee - 30 * Math.sin(Math.min(1, flee * 3) * Math.PI / 2), .7,
      flee > 0 ? { flap: onTwos(q) } : { peck: Math.floor(q * FPS / 3) % 4 === 0 ? 1 : 0, look: Math.sin(q * 1.3) });
    vis(bird.g, flee < 1.5);
    const wings = [1, .7, .35, .7][Math.floor(q * FPS / 2) % 4];
    flies[0].pose(1640 + 110 * Math.sin(q * .9), 620 + 40 * Math.sin(q * 2.3), .5, wings);
    flies[1].pose(2150 + 160 * Math.sin(q * .6 + 1), 580 + 50 * Math.sin(q * 1.9), .45, [.7, .35, .7, 1][Math.floor(q * FPS / 2) % 4]);
    edge.forEach(([fl, x, y, k], i) => fl.pose(x, y, k, { sway: 3 * Math.sin(q * 1.4 + i), on: between(q, T.E, T.F) }));
    near.forEach(([fl, x], i) => fl.pose(x, 812 + 6 * (i % 2), .75, { sway: 4 * Math.sin(q * 1.7 + i) }));

    // ---- Red
    const done = PICKS.filter(t => q >= t + PICK * .88).length;
    PICKS.forEach((t, i) => flowers[i].pose(RX[i] + REACH, 806, 1.2, { sway: 3 * Math.sin(q * 1.5 + i), on: q < t + PICK * .38 }));
    const breathe = 1.2 * Math.sin(q * 2.2);
    if (q < T.walk) {
      const front = between(q, T.D2, T.D3);
      const turn = q < T.D1 ? -1 + 2 * span(q, T.sweep + .35, T.sweep + .65) : 1;   // to the meadow, in the wide
      red.pose({ x: 1060, y: hipOn(795, s) + breathe * .3, s, head: front ? 'F' : 'P', turn,
        headR: front ? 0 : q < T.D1 ? (q > T.sweep + .2 ? -5 : 2) : 7 * span(q, T.D1 + .1, T.D1 + .4) - 6 * span(q, T.D3 + .05, T.D3 + .2),
        lean: q >= T.D1 && q < T.D2 ? 7 * span(q, T.D1 + .35, T.D2 - .1) : 0,
        nod: front ? 5 * span(q, T.D2 + .05, T.D2 + .3) : q >= T.D3 + .2 && q < T.D3 + .45 ? 4 : 0,
        brow: front ? 1 + span(q, T.cloud + .2, T.cloud + .5) : 0,
        mouth: front && q >= T.cloud + .45 ? (q < T.D3 - .25 ? 'G' : 'A') : 'X',
        shut: blinking(q, [.6, T.C + .9, T.D1 + .6, T.D2 + 1.05, T.D3 + .1]) }, f);
    } else if (q < T.step) {
      const w = walk(Math.min(q - T.walk, .5), { period: 1, A: 18 });   // one step to the edge
      red.pose({ x: 1060 + w.d * s, y: hipOn(795, s) + w.drop * s, s, near: w.near, far: w.far,
        kNear: w.kNear, kFar: w.kFar, headR: q > T.E ? 6 : 1, shut: blinking(q, [T.walk + .9]) }, f);
    } else if (q < T.F) {
      const u = Math.min(1, (q - T.step) / .6), b = bigStep(u), x0 = 1060 + STEP;
      red.pose({ x: x0 + b.d * s, y: hipOn(795 + 5 * ease(u), s) + b.drop * s, s, near: b.near, far: b.far, kNear: b.kNear, kFar: b.kFar, headR: 6 }, f);
    } else {
      // skip in (three steps), then a pick at each PICKS time, with one step forward before each one after the first
      const skip = walk(Math.min(q - T.F, 1.05), { period: .7, A: 26, knee: 50 }), inSkip = q - T.F < 1.05;
      let x = inSkip ? 1205 + skip.d * s : RX[0], pose = {}, legs = inSkip ? skip : null;
      PICKS.forEach((t, i) => {
        if (i && q >= t - .3) { const st = walk(Math.min(q - (t - .3), .25), { period: .5, A: 18 }); x = RX[i - 1] + st.d * s; if (q < t - .05) legs = st; }
        if (between(q, t, t + PICK)) pose = s4_pick((q - t) / PICK, FLOWER_COLS[i]);
      });
      const hop = inSkip ? -10 * Math.abs(Math.sin(skip.ph)) : 0;
      red.pose({ x, y: hipOn(800, s) + (legs ? legs.drop * s : 0) + hop, s,
        near: legs ? legs.near : 0, far: legs ? legs.far : 0, kNear: legs ? legs.kNear : 0, kFar: legs ? legs.kFar : 0,
        lean: pose.lean || 0, crouch: pose.crouch || 0, fua: pose.fua ?? null, ffa: pose.ffa ?? -10, held: pose.held || null,
        ua: -8 - .6 * (pose.lean || 0), swing: -(pose.lean || 0), bouquet: done,
        headR: pose.lean ? 0 : inSkip ? -3 : 2, mouth: 'X', shut: blinking(q, [T.F + 1.6, PICKS[2] + 1.1, T.H + .4]) }, f);
    }

    // ---- the wolf
    vis(wolf.g, q < T.E || between(q, T.G, T.H));
    if (q < T.G) {
      // he leans in to ask, then sweeps his arm up past her to the meadow and stays, watching her go
      const sweep = span(q, T.sweep + .1, T.sweep + .55), watch = q >= T.D1;
      wolf.pose({ x: 860, y: hipOn(790, s, 200) + breathe * .4, s, turn: 1,
        lean: q < T.C ? 6 + 8 * span(q, T.B, T.B + .4) : watch ? 10 : 6,
        ua: q < T.C ? (q >= T.B + .1 ? -42 : 4) : watch ? -30 + 8 * onTwos(q) * (q > T.D3) : -10 - 110 * sweep + 10 * span(q, T.sweep + 1.6, T.sweep + 2.2),
        fa: q < T.C ? (q >= T.B + .1 ? -62 : -70) : watch ? -90 : -10 * sweep,
        mouth: lips(q, 'scene4', PRE4, 's04'), tail: 10 * Math.sin(q * 4), brow: q < T.C || watch ? .8 : 0,
        headR: watch ? -4 : 0, look: 1, shut: blinking(q, [.35, T.B + 1.0, T.D1 + 1.2, T.D3 + .6]) }, f);
    } else {
      const x = s4_wolfX(q, T.G), d = (x - s4_wolfX(T.G, T.G)) / s, off = q - T.G;
      wolf.pose({ x, y: hipOn(800, s, 200), s, run: d, crouch: off < .25 ? .6 * (1 - off / .25) : 0,
        jaw: .45, ear: -1, brow: 1, tail: -14 + 6 * onTwos(q), look: 1, shut: false }, f);
    }

    // ---- the thought picture
    const k = s4_think(q, T.cloud, T.cloudOff);
    vis(th, k > 0);
    if (k > 0) {
      th.setAttribute('opacity', Math.min(1, k * 1.4).toFixed(2));
      tf(thIn, `translate(1190,230) scale(${(.85 + .15 * Math.min(1, k)).toFixed(3)})`);
      mom.pose({ x: 0, y: 190, s: 1.05, head: 'F', finger: true, rua: -28, rfa: -146 + (q > T.cloud + .35 ? 9 * onTwos(q) : 0), lua: 6, lfa: -4,
        brow: -.7, mouth: 'A', shut: false }, f);
    }
  });
}
// The wolf's x on the run, from a crouch at t0 at x 2100: 330 a second (2.5 strides), faster once the camera lets him go,
// up to 455 a second. The rig sets his paws by distance (a stride per 220 units, 132 px at s .6), so at 455 px/s the gait
// moves 0.29 of a stride per 12 fps frame; nearer 0.5 the legs flick between two mirror poses (a wagon-wheel strobe).
function s4_wolfX(q, t0) {
  const t = Math.max(0, q - t0 - .25), a = .35, v = 330, u = Math.max(0, t - 2.05), U = (455 - v) / 280;
  const x = 2100 + (t < a ? v * t * t / (2 * a) : v * (t - a / 2));
  return x + (u < U ? 140 * u * u : 140 * U * U + (455 - v) * (u - U));
}
