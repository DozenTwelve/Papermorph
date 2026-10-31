/* scene7.js — Red arrives (storyboard v2 §7; director v2-r1 finding #4).
   Shots (beat clock; PRE7 is her walk in):
   A  0 – 3.1     trunk wipe out; the wide under the oaks: the woodcutter chopping by his block (a chop on each fall of
                  the axe), Red walks in from the left with basket and bouquet and stops behind him
   B  3.1 – s07w 1.5    Red's close-up, waving up at him: "Good morning, Mr. Woodcutter!"; he is soft at the right, his back
                  to her, still chopping (he hasn't seen her yet)
   T  – s07x -.1   the two of them: his last chop lands and the axe stays in the block; he turns, whole body, to her
   C  – s07x 2.8   his close-up facing her (screen left), smiling, Red soft at the left: "Morning, Little Red!" with a wave of
                  his free hand, "Say hello to your grandma for me!"
   D  – wave7      Red's close-up again, nodding twice (he is soft at the right, facing her now)
   E  wave7 – s07 3.1   the wide: he turns back, pulls his axe and chops, she skips on to the cottage (the camera goes
                  with her); she stops short of the open door
   F  – s07 4.35   Red's close-up, to us, worried: "How strange."
   G  – s07b       insert: the door wide open, swinging a little on its hinge, dark inside
   H  s07b – end   from inside (scene 5's view of the doorway): Red in the doorway against the daylight, "Grandma?"; on
                  door7 she steps in and out of the shadow; the chops go on outside, muffled
   Uses scene5.js's s5_woodPile and its s5_dark* filters, so the block and the doorway look the same in both scenes.
   Last frame: Red stepping in through the door (scene 8 opens on her by the bed). */
'use strict';
const PRE7 = 3.2;
const s7_C = (c, t = 0) => clipAt('scene7', PRE7, c, t);
const s7_END = PRE7 + TIMINGS.scene7.dur + .6;
const s7_CUT = { B: 3.1, T: s7_C('s07w', 1.5), C: s7_C('s07x', -.1), D: s7_C('s07x', 2.8), E: s7_C('wave7'), F: s7_C('s07', 3.1), G: s7_C('s07', 4.35), H: s7_C('s07b', -.1) };
// the woodcutter chops while nobody talks to him: a swing every s7_CHOP s, the blade landing at .85 of it. His last blade
// lands just after Red's greeting (s7_LAND, in shot T, where we see it) and he leaves the axe in the block until he
// goes back to work
const s7_CHOP = .9, s7_LAND = s7_C('s07w', 1.6), s7_PULL = s7_C('wave7', .5);
const s7_CHOPPING = [[s7_LAND - 4.85 * s7_CHOP, s7_LAND + .14 * s7_CHOP], [s7_PULL, 99]];
const s7_chopAt = q => { for (const [a, b] of s7_CHOPPING) if (q >= a && q < a + Math.ceil((b - a) / s7_CHOP) * s7_CHOP) return ((q - a) / s7_CHOP) % 1; return -1; };
// Red's walks: [start, from x, period, stride angle, steps]
const s7_WALK_IN = [.7, -80, .95, 24, 4], s7_WALK_ON = [s7_CUT.E + .12, 244, .8, 24.4, 7], s7_STEP_IN = [s7_C('door7', .1), 262, .95, 20, 2];
const s7_falls = ([t0, , period, , steps]) => Array.from({ length: steps }, (_, k) => +(t0 + period * (.25 + k / 2)).toFixed(2));

sfx('scene7', 0, 'forest', .5, { loop: true });
sfx('scene7', s7_CUT.H, 'room', .4, { loop: true });
for (const [a, b] of s7_CHOPPING) for (let k = 0; a + (k + .85) * s7_CHOP < Math.min(a + Math.ceil((b - a) / s7_CHOP) * s7_CHOP, s7_END); k++) {
  const t = +(Math.ceil((a + (k + .85) * s7_CHOP) * FPS - 1e-6) / FPS).toFixed(3);   // on the frame the blade lands
  sfx('scene7', t, t >= s7_CUT.H ? 'chopin' : 'chop', t >= s7_CUT.H ? 1 : t >= s7_CUT.F || between(t, s7_CUT.B, s7_CUT.T) ? .9 : 1.4);   // softer under her line
}
[...s7_falls(s7_WALK_IN), ...s7_falls(s7_WALK_ON), ...s7_falls(s7_STEP_IN)].forEach((t, i) => sfx('scene7', t, 'step' + (1 + i % 3), 1.4));
sfx('scene7', s7_CUT.G + .2, 'creak', .9);

function scene7(p, D) {
  const C = s7_C, K = s7_CUT, s = .6, WX = s5_WX, WY = s5_WY;
  const cam = paperCam(p, 'grandmaOut', { x: 760, y: 470, z: 1 }, { after: 'house', stages: ['inside'] });
  const door = doorLeaf(cam.stage, 'M1010,800 L1010,560 Q1070,510 1130,560 L1130,800 Z', '#3f5f8a', 1010, '<path d="M1040,530 V800 M1070,520 V800 M1100,530 V800" stroke="#2f4a6e" stroke-width="3"/><circle cx="1116" cy="680" r="6" fill="#caa24c"/>');
  s5_woodPile(cam.stage, false);
  const stuck = s5_woodPile(cam.stage, true);   // the same block with the axe left in it (drawn over the bare one)
  const puff = smoke(cam.stage, ...s5_CHIMNEY);
  // in each close-up the other one is soft: shallow focus, the listener still readable
  mk('defs', {}, p).innerHTML = '<filter id="s7_blur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3"/></filter>';
  const woodG = mk('g', {}, cam.stage), redG = mk('g', {}, cam.stage);
  const wood = woodcutterPuppet(woodG), red = redPuppet(redG), wipe = trunkWipe(p, 0, .8, 'out');
  const RED_CU = { x: 300, y: 600, z: 3.4 };
  cam.cut(RED_CU, K.B).cut({ x: 335, y: 585, z: 1.9 }, K.T).cut({ x: 362, y: 548, z: 3.2 }, K.C).cut(RED_CU, K.D)
    .cut({ x: 640, y: 470, z: 1 }, K.E).to({ x: 760, y: 470, z: 1 }, K.E + .6, 2.6).to({ x: 850, y: 540, z: 1.45 }, C('s07', 1.6), 1.6)
    .cut({ x: 818, y: 588, z: 3.2 }, K.F).cut({ x: 1138, y: 655, z: 3.1 }, K.G).to({ x: 1122, y: 650, z: 3.4 }, K.G + .3, 1.6);
  cam.soft(K.B, true).soft(K.T, false).soft(K.C, true).soft(K.E, false);
  const inn = paperCam(p, 'room', { x: 310, y: 622, z: 2 }), R = roomProps(inn, []), redIn = redPuppet(R.atDoor);
  inn.to({ x: 350, y: 632, z: 2.2 }, K.H + .6, 2.4);
  // a walk that ends standing: walker stops mid-stance with the swing knee bent, so the legs are set straight once it is done
  const walkOf = ([t0, x0, period, A, steps]) => { const w = walker(x0, s, { period, A }, 1, steps); return q => q - t0 < steps * period / 2 ? w(q - t0) : { ...w(q - t0), near: 0, far: 0, kNear: 0, kFar: 0, drop: 0 }; };
  const walkIn = walkOf(s7_WALK_IN), walkOn = walkOf(s7_WALK_ON), stepIn = walkOf(s7_STEP_IN);
  stopClock(D, (q, f) => {
    const inside = q >= K.H;
    vis(cam.root, !inside); vis(inn.root, inside);
    const blink = (...t) => blinking(q, t);
    if (inside) {
      inn.apply(q, f); R.door(-.35);
      const w = stepIn(q);
      R.atDoor.setAttribute('filter', w.x < 330 ? 'url(#s5_dark55)' : w.x < 372 ? 'url(#s5_dark80)' : '');   // out of the light into the room
      redIn.pose({ x: w.x, y: hipOn(800, s) + w.drop * s, s, near: w.near, far: w.far, kNear: w.kNear, kFar: w.kFar, bouquet: 7,
        cape: 3 + 3 * Math.sin(2 * w.ph), mouth: lips(q, 'scene7', PRE7, 's07b') === 'X' ? 'A' : lips(q, 'scene7', PRE7, 's07b'),
        brow: 1, headR: q < C('s07b', .7) ? -4 : 2, shut: blink(C('s07b', 1.1)) }, f);
      return;
    }
    cam.apply(q, f); wipe(q); puff(q);
    door(q >= K.G ? .2 + .08 * Math.sin((q - K.G) * 2.6) : .22 + .04 * Math.sin(q * 2.2));   // wide open (the wolf left it so), stirring
    // the woodcutter: chopping in profile, his back to her; the axe left in the block, a whole-body turn to her (T), his
    // close-up facing her with a wave of the free hand; turned back in the wide
    const u = s7_chopAt(q), lastSwing = q >= s7_LAND - .85 * s7_CHOP && q < s7_PULL;
    const ua = u < 0 ? 6 : u < .6 ? -42 - 133 * ease(u / .6) : u < .75 ? -175 : u < .85 ? -175 + 133 * (u - .75) / .1 : lastSwing ? -42 + 48 * (u - .85) / .15 : -42;
    const frames = (t0, n = 4) => Math.min(1, Math.max(0, Math.floor((q - t0) * FPS) + 1) / n);   // a turn over n frames
    const turn = q < K.E + .12 ? 1 - 2 * frames(K.T + .3) : -1 + 2 * frames(K.E + .12);
    const waving = between(q, C('s07x', -.05), C('s07x', 1.5)), w2 = onTwos(q);
    vis(stuck, between(q, s7_LAND, s7_PULL));
    woodG.setAttribute('filter', between(q, K.B, K.T) || between(q, K.D, K.E) ? 'url(#s7_blur)' : '');
    wood.pose({ x: WX, y: WY - 200 * .62, s: .62, turn, axe: !between(q, s7_LAND, s7_PULL),
      ua: waving ? -100 + 3 * w2 : ua, fa: waving ? -42 + 16 * w2 : u < 0 ? -6 : 0, hop: u >= .85 && u < .9 ? 2 : 0,
      mouth: lips(q, 'scene7', PRE7, 's07x'), headR: between(q, K.T + .55, K.E) ? -5 : 0,
      shut: blink(3.6, C('s07x', 1.75), C('s07x', 3.4), 12.6) }, f);
    // Red
    let o;
    if (q < K.E + .12) {
      const w = walkIn(q), hi = between(q, C('s07w', -.1), C('s07w', 1.5));
      o = { x: w.x, y: hipOn(800, s) + w.drop * s, near: w.near, far: w.far, kNear: w.kNear, kFar: w.kFar, cape: 3 + 3 * Math.sin(2 * w.ph + .6),
        swing: 6 * Math.sin(w.ph - 1), headR: q >= K.B ? -7 : 0, fua: hi ? -112 + 14 * onTwos(q) : null, ffa: hi ? -35 : -10,
        nod: [C('s07x', 3.2), C('s07x', 3.45)].some(t => between(q, t, t + 2 / FPS)) ? 4 : 0, mouth: lips(q, 'scene7', PRE7, 's07w'),
        shut: blink(2.9, C('s07x', .6), C('s07x', 2.6)) };
    } else {
      const w = walkOn(q), skip = q < K.E + 1.3 ? 16 * Math.abs(Math.sin(w.ph)) : 0, look = q >= C('s07', 2.6);
      o = { x: w.x, y: hipOn(800, s) + w.drop * s - skip, near: w.near, far: w.far, kNear: w.kNear, kFar: w.kFar, cape: 3 + 3 * Math.sin(2 * w.ph + .6) + skip * .4,
        swing: 6 * Math.sin(w.ph - 1), headR: look ? -4 : 0, brow: look ? 1 : 0, shut: blink(C('s07', 1.4)) };
      if (q >= K.F) {   // F: to us, worried, more so on "strange"
        o = { ...o, head: 'F', brow: 1 + span(q, C('s07', 3.3), C('s07', 3.8)), headR: 4 + 4 * span(q, C('s07', 3.3), C('s07', 3.8)), mouth: 'A',
          lua: -20, lfa: -40, shut: blink(C('s07', 3.95)) };
      }
    }
    redG.setAttribute('filter', between(q, K.C, K.D) ? 'url(#s7_blur)' : '');
    red.pose({ s, bouquet: 7, ...o }, f);
  });
}
