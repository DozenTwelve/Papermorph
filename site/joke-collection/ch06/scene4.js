/* scene4.js — Shh. (round 2) The American's jaw still hangs from scene 3; "Barking!" (the chopping is already silent),
   the shadow turns, the breath; the Chinese dog rises and shushes; the three look; "Don't bark, or you are the meat."
   then the held silence: the American frozen, the Polish dog reads his ribs, the Soviet dog's eyes slide, the bubble
   (the steak is him), the gulp, the shadow leaves, the door cracks, the dive, eight eyes, the smothered woof, the door
   shuts, the chopping returns; title card; the box walks away on sixteen legs.
   Shots (beat clock): TRIO 0 · CU US 0.8 · WIN 2.2 · CU US 2.6 (breath, push from 3.1) · BOX 4.7 · CU CN shh 5.95 ·
   CU US 6.65 · CU PL 7.15 · CU SU 7.65 · WIDE 8.15 · two-shot 8.85 · CN single 9.3 · WIN 9.55 · CN single 10.2 ·
   CU US frozen 13.5 · CU PL ribs 14.7 · CU SU 15.5 · US + bubble 16.0 · WIN 17.5 · DOOR 18.8 · BOX_WIDE dive 19.8 ·
   BOX 20.6 · GAG 21.6 · BOX 22.9 · WIDE 23.5 · SLOT 25.0 · card 25.6 · TAG 28.9. */
'use strict';
const PRE4 = 0.8;
const S4_RUNS = [[0, 1.0], [24.5, 26.5], [28.9, 32.3]];
chopSfx('scene4', S4_RUNS);
roomSfx('scene4', [[0, 25.6], [29.0, 32.3]]);
sfx('scene4', 3.05, 'inhale', .7);
sfx('scene4', 4.7, 'flap', .6);
sfx('scene4', 16.4, 'tick');
sfx('scene4', 17.1, 'gulp', 1);
sfx('scene4', 17.55, 'chop', .35);                                        // the knife put down
sfx('scene4', 18.2, 'step1', .3); sfx('scene4', 18.6, 'step1', .3);       // the cook walks to the door
sfx('scene4', 19.0, 'creak');
sfx('scene4', 19.85, 'whoosh');
[20.0, 20.2, 20.4].forEach(t => sfx('scene4', t, 'thud'));
sfx('scene4', 21.6, 'sniff', .5);
sfx('scene4', 22.1, 'woof-mf', .8);
sfx('scene4', 23.6, 'creak');
sfx('scene4', 24.2, 'latch');
sfx('scene4', 25.6, 'sting');
sfx('scene4', 26.4, 'tick');
for (let t = 29.4; t < 31.9; t += 1 / 6) sfx('scene4', +t.toFixed(3), 'patter1', .3);

// the poses the close-ups are cut from (a close-up is given the pose the puppet has)
const S4_USX = 640;
const s4us = (o = {}) => ({ x: S4_USX, y: ALLEY.ground, s: US.s, dir: 1, ...o });
const s4pl = (o = {}) => ({ x: ALLEY.pl, y: ALLEY.ground, s: PL.s, dir: -1, sit: 1, ...o });
const s4su = (o = {}) => ({ x: ALLEY.su, y: ALLEY.suY, s: SU.s, dir: -1, sit: 1, ...o });
const s4cn = (o = {}) => ({ ...ALLEY.cnUp, s: CN.s, dir: 1, sit: 1, ...o });
const s4lin = (q, a, b, x0, x1) => x0 + (x1 - x0) * Math.min(1, Math.max(0, (q - a) / (b - a)));
const s4off = (v, dx, dy, z) => ({ x: v.x + dx, y: v.y + dy, z: z ?? v.z });

function scene4(p, D) {
  const a = alleySet(p), c = a.cam, th = thought(c.stage), card = titleCard(p);
  const [hx, hy] = dogHead(s4us({ dir: -1 })), usCU = DOG_CU(s4us()), cnCU = s4off(DOG_CU(s4cn(), 3.6), -70, 0), cnShh = DOG_CU(s4cn(), 4.2);
  const breath = s4off(DOG_CU(s4us(), 3.1), -50, 22), TWO = { x: 470, y: 650, z: 2.8 }, plLook = { x: 970, y: 690, z: 2.6 };
  const bubV = { x: hx - 70, y: hy - 75, z: 2.2 }, bubPush = { x: hx - 80, y: hy - 80, z: 2.35 };
  c.cut(AL_TRIO, 0); c.cut(usCU, .8); c.cut(AL_WINDOW, 2.2);
  c.cut(breath, 2.6); c.to(s4off(DOG_CU(s4us(), 3.9), -50, 22), 3.1, 1.6);   // the breath: his chest, a slow push
  c.cut(AL_BOX, 4.7); c.cut(cnShh, 5.95); c.cut(usCU, 6.75);
  c.cut(DOG_CU(s4pl()), 7.25); c.cut(s4off(DOG_CU(s4su()), 0, -50), 7.75); c.cut(AL_WIDE, 8.25);
  c.cut(TWO, 8.95); c.cut(cnCU, 9.3); c.cut(AL_WINDOW, 9.55); c.cut(cnCU, 10.2);
  c.cut(DOG_CU(s4us({ dir: -1 }), 3.6), 13.5); c.cut(plLook, 14.7); c.cut(DOG_CU(s4su(), 3.6), 15.5);
  c.cut(bubV, 16.0); c.to(bubPush, 16.4, .15);
  c.cut(AL_WINDOW, 17.28); c.cut(AL_DOOR, 18.8); c.cut(AL_BOX_WIDE, 19.8); c.cut(AL_BOX, 20.6);
  c.cut(AL_GAG, 21.6); c.cut(AL_BOX, 22.9); c.cut(AL_WIDE, 23.5); c.cut(AL_SLOT, 25.0); c.cut(AL_TAG, 28.9);
  const dark = q => between(q, 21.3, 23.5) ? .5 : (between(q, 4.7, 6.75) || between(q, 8.95, 13.5) || between(q, 20.6, 23.5) || between(q, 25, 25.6)) ? .4 : 1;
  stopClock(D, (q, f) => {
    const title = between(q, 25.6, 28.9);
    vis(c.root, !title); if (title) { card.at(q, 25.6); return; } vis(card, false);
    c.apply(q, f); a.steam(q); a.shade(dark(q));

    // ---- the American: jaw hangs (scene 3), shuts and steps, shouts, the breath, deflates, faces LEFT (the box) from 7.25,
    // freezes, feels the looks, the bubble, the gulp, snaps to the door at 17.25, dives
    const usDir = q < 7.25 ? 1 : q < 17.2 ? -1 : q < 19.8 ? 1 : -1;
    const jumpU = span(q, 19.8, 20.0), jumping = between(q, 19.8, 20.0);
    const usX = q < 19.8 ? s4lin(q, .6, .85, 600, S4_USX) : s4lin(q, 19.8, 20.0, S4_USX, 240);
    const usJaw = q < .6 ? .85 : q < .8 ? .85 * (1 - span(q, .6, .8)) : q < 2.95 ? dogJaw(lips(q, 'scene4', PRE4, 's11'))
      : q < 3.1 ? 0 : q < 6.75 ? .2 + .3 * span(q, 3.1, 4.7) : q < 13.5 ? .5 * (1 - span(q, 6.75, 7.25)) : q < 14.7 ? .15 : .1;
    const frozen = between(q, 13.5, 14.7);
    const gulp = between(q, 17.1, 17.3), toDoor = between(q, 17.2, 17.5);
    const usEye = q < 6.75 ? .6 : q < 7.25 ? -1 : q < 14.4 ? .7 : q < 16.0 ? .3 : between(q, 16.0, 16.15) || between(q, 16.3, 16.45) ? -1 : q < 17.2 ? .3 : 1;
    vis(a.us.g, q < 20.0);
    a.us.pose({ x: usX, y: jumping ? ALLEY.ground - 110 * Math.sin(Math.PI * jumpU) : ALLEY.ground, s: US.s, dir: usDir,
      swell: span(q, 3.1, 4.7) * (1 - span(q, 6.75, 7.25)), jaw: usJaw, tongue: q < .6 ? 1 : 0,
      wag: !frozen && q >= .8 && q < 2.2, walk: between(q, .6, .85), rot: jumping ? -10 + 45 * jumpU : 0, paw: jumping ? 60 : 0,
      headR: (q < 3.1 ? 6 : 6 + 24 * span(q, 3.1, 4.5)) * (1 - span(q, 6.75, 7.2)) + (gulp ? -8 : 0),
      bob: gulp ? 6 : 0, eyeX: usEye, lids: toDoor ? 0 : 0,
      shut: !frozen && blinking(q, [1.9, 5.0, 9.7, 11.6, 16.6]) || blinking(q, [14.0, 15.6]) }, f);

    // ---- the Polish dog: his bowl on the ground; spring and jerk at the shush; reads his ribs, then the American's
    // rump; at 19.3 his head snaps to the door; leaps from his seat (off-screen right) head first
    const plU = span(q, 19.95, 20.2), plJump = between(q, 19.95, 20.2);
    const look = q < 14.7 ? 1 : q < 15.1 ? -1 : 1, down = span(q, 14.7, 15.0) * (1 - span(q, 15.0, 15.3));
    vis(a.pl.g, q < 20.2); vis(a.bowl, true); a.placeBowl(0, BOWL_KNOCKED.rot, BOWL_KNOCKED.dx);
    a.pl.pose(s4pl({ x: q < 19.95 ? ALLEY.pl : s4lin(q, 19.95, 20.2, ALLEY.pl, 240), y: plJump ? ALLEY.ground - 110 * Math.sin(Math.PI * plU) : ALLEY.ground,
      dir: q >= 19.95 ? -1 : q >= 19.3 ? 1 : -1, sit: q < 19.7 ? 1 : 0, rot: plJump ? -10 + 45 * plU : 0, paw: plJump ? 60 : 0,
      eyeX: q < 7.25 ? 0 : q < 14.7 ? 1 : look, headR: (between(q, 7.25, 7.35) ? 12 : 0) - 25 * down,
      ear: between(q, 7.3, 7.5) ? 40 : 0, shut: blinking(q, [3.1, 7.5, 10.9, 15.9, 18.4]) }), f);

    // ---- the Soviet dog: barely moves; his half-lids lift at the shush; his eyes slide to the box, later to the
    // American; his head snaps to the door at 19.47 (two frames after the Polish dog's)
    const suU = span(q, 20.15, 20.4), suJump = between(q, 20.15, 20.4);
    vis(a.su.g, q < 20.4);
    a.su.pose(s4su({ x: q < 20.15 ? ALLEY.su : s4lin(q, 20.15, 20.4, ALLEY.su, 240), y: suJump ? ALLEY.suY - 90 * Math.sin(Math.PI * suU) + 28 * suU : ALLEY.suY,
      dir: q >= 20.15 ? -1 : q >= 19.47 ? 1 : -1, sit: q < 19.9 ? 1 : 0, rot: suJump ? -10 + 45 * suU : 0, paw: suJump ? 60 : 0,
      lids: q < 7.75 ? .35 : q < 8.2 ? .35 - .25 * span(q, 7.75, 8.0) : q < 15.5 ? .1 : .2,
      eyeX: q < 7.75 ? 0 : q < 15.5 ? .9 * span(q, 7.75, 8.2) : .9, shut: blinking(q, [2.6, 9.2, 12.0, 16.6]) }), f);

    // ---- the Chinese dog: rises from deep inside at 5.0, shh paw 5.85–7.3, looks up at the American, at the door,
    // the punchline, the nod at "meat", then ducks back into the box 13.1–13.3 (his eyes appear that same frame)
    const cnOn = q >= 5.0 && q < 13.25;
    const rise = 130 * (1 - span(q, 5.0, 5.4)) + 130 * span(q, 13.1, 13.25);
    const glance = between(q, 9.3, 9.55), nod = between(q, 12.0, 12.25), up = between(q, 8.95, 9.3);
    vis(a.cn.g, cnOn);
    a.cn.pose(s4cn({ y: ALLEY.cnUp.y + rise, ear: EAR_FLAT, lids: .25, hold: between(q, 5.85, 7.3) ? 'shh' : undefined,
      jaw: dogJaw(lips(q, 'scene4', PRE4, 's12', 's13'), .4), headR: glance ? 12 : up ? 8 : nod ? -8 : q >= 10.2 && q < 13.1 ? -3 : 0,
      eyeX: glance ? 1 : up ? .5 : 1, shut: blinking(q, [6.9, 9.0, 9.9, 12.8]) }), f);

    // ---- the box: flaps up at 4.7; the dive (bulge, flap slap, hat bounce from 20.4); eight eyes; the light; the
    // American's mouth and the paws; sixteen legs and the walk
    const thud = between(q, 20.0, 20.1) || between(q, 20.2, 20.3) || between(q, 20.4, 20.5);
    const bulge = q < 20.0 ? 0 : q < 20.2 ? .45 : q < 20.4 ? .75 : 1.1;
    const flaps = q < 4.7 ? 0 : q < 13.1 ? .6 * span(q, 4.7, 5.0) : q < 13.3 ? .6 * (1 - span(q, 13.1, 13.25)) : q < 19.8 ? 0 : thud ? .5 : span(q, 19.8, 19.95);
    const four = q >= 20.4, eyes = four ? 4 : cnOn ? 0 : 1;
    const walking = q >= 29.4, boxX = q < 28.9 ? ALLEY.box : 470 - (walking ? 240 * (q - 29.4) : 0);
    const light = q >= 21.3, clamp = span(q, 22.1, 22.45) * (1 - span(q, 24.4, 24.8)) - (between(q, 22.6, 22.77) ? .08 : 0);
    a.box.pose({ x: boxX, y: ALLEY.ground - (walking ? 5 * (onTwos(q) > 0 ? 1 : 0) : 0) + (between(q, 20.4, 20.48) ? 6 : 0), flaps: q >= 29.4 ? .5 : flaps, eyes,
      eyeX: four ? (q >= 28.9 ? (between(q, 30.4, 30.8) ? 1 : -1) : light && q < 22.9 ? 1 : Math.sin(q * 3.3)) : 1,
      stuffed: q >= 20.4, hatDy: -14 * (1 - span(q, 20.4, 20.6)), bulge, light: span(q, 21.3, 21.5) * (q < 24.0 ? 1 : 1 - span(q, 24.0, 24.2)),
      shake: thud ? 1 : between(q, 22.1, 22.9) ? .5 : 0,
      tail: 10 + (four && q >= 21.3 && q < 22.1 ? 15 * onTwos(q) : 0),
      lids: eyes === 4 ? [q >= 22.1 && q < 23.1 ? .8 : q >= 21.3 && q < 22.1 ? 0 : .25, .1, .4, .3] : .2,
      shut: eyes === 4 ? [blinking(q, [21.0, 23.6, 25.2, 26.9]), blinking(q, [21.4, 22.7, 25.2, 27.3]), blinking(q, [20.9, 24.0, 25.2, 26.5]), blinking(q, [21.7, 23.0, 25.2, 27.0])] : blinking(q, [3.2, 17.0, 19.0]),
      mouth: span(q, 21.6, 21.8) * (1 - span(q, 23.0, 23.2)), clamp,
      legs: q >= 29.4, walk: walking ? q : 0 }, f);

    // ---- the thought bubble: the steak (16.1), the steak is him (16.4) and blinks (16.7), gone at 17.05
    th.pose({ x: hx - 130, y: hy - 125, tx: hx, ty: hy - 30, s: .68, u: between(q, 16.1, 17.05) ? span(q, 16.1, 16.45) : 0, me: q >= 16.4, q, blink: between(q, 16.7, 16.8) });

    // ---- the kitchen: cleaver up when silent; the shadow turns at 2.2, tilts its head to listen at 9.8, leaves at 17.5,
    // is back at 24.2; the door cracks at 18.8, its light creeps to the box (reaches it at .9), the door shuts 23.6–24.2
    const crack = q < 18.8 ? 0 : q < 19.8 ? .6 * span(q, 18.8, 19.8) : q < 20.6 ? .6 : q < 21.3 ? .6 + .3 * span(q, 20.6, 21.3) : q < 23.6 ? .9 : .9 * (1 - span(q, 23.6, 24.2));
    const turn = q < 24.2 ? span(q, 2.2, 2.6) * (between(q, 9.8, 10.05) ? .78 : 1) : 1 - span(q, 24.2, 24.4);
    a.kit.cook({ arm: cleaverAt(q, S4_RUNS), turn, show: !between(q, 17.5, 24.2) });
    a.kit.crack(crack);
  });
}
