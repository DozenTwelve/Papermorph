/* scene3.js — the punchline (round 2). Next morning in the town street: the policeman alone, yawning; he hears
   footsteps, sees the man and the penguin wearing the souvenirs (balloon insert, sticker insert, his face working it
   out), marches over ("Oi!"), points at the poster (the slogan insert pays the clue off), the man's "I did!", the photo
   (out of the pocket, the insert, the silence with the photo held between them), "Today we're going to the beach."
   (the shades drop), they cross in front of the frozen policeman and go; he ends looking off right, not at us.
   Beat clock throughout (storyboard times, heard word times): the speech starts PRE3 s in. */
'use strict';
const PRE3 = 1.0;
const S3 = { yawn: 2.4, wide2: 6.2, cop2: 8.2, balloon: 9.2, cop3: 10.1, sticker: 10.7, cop4: 11.6, three: 12.3, march: 12.6, man1: 13.7, oi: 14.5,
  pengA: 17.1, point: 17.7, poster: 18.0, man2: 18.9, two1: 20.4, manCU: 21.4, photo: 22.2, still: 24.4, pengB: 25.4, twitch: 25.9, putaway: 26.7,
  two2: 27.6, pengC: 29.4, shades: 29.6, copO: 29.9, wide3: 30.4, end: 34.1 };
const W3 = 30.4;                                    // the pair set off (the wide cuts in on the first step)
sfx('scene3', .05, 'waves-bed3', .3, 24.35);      // a low bed that stops by 24.4: the stare is silent
sfx('scene3', .5, 'gulls', .5);
for (let t = 29 / 6; t < 8; t += 1 / 6) sfx('scene3', +t.toFixed(3), 'patter1', Math.min(.5, .25 + .08 * (t - 4.8)));   // the arrival, one step per foot change
for (let t = 183 / 6; t < S3.end; t += 1 / 6) sfx('scene3', +t.toFixed(3), 'patter1', Math.max(.1, .5 - .1 * (t - 30.4)));   // the exit, fading
sfx('scene3', 14.3, 'whoosh', .35);
sfx('scene3', 25.8, 'gull1', .4);
sfx('scene3', S3.shades, 'tick', 1.6);
sfx('scene3', 29.9, 'waves', .15, 32);       // the sea comes back after the shades and carries into scene 4
// the man's and the policeman's footsteps (every other foot change), quieter than the penguin's patter
for (let t = 15 / 3; t < 8; t += 1 / 3) sfx('scene3', +t.toFixed(3), 'step1', Math.min(.3, .15 + .05 * (t - 5)));
for (let t = 38 / 3; t < 13.6; t += 1 / 3) sfx('scene3', +t.toFixed(3), 'step1', .35);   // his march
for (let t = 92 / 3; t < 34.1; t += 1 / 3) sfx('scene3', +t.toFixed(3), 'step1', Math.max(.08, .25 - .05 * (t - 30.4)));   // the exit

// the man leads: eager 205 px/s in from the left (unseen until 6.2), stops dead at x 860 at 8.0; at 30.4 he sets off right at 180 px/s, BEHIND the frozen policeman (y 775, s .86), so the policeman stays readable
const s3manX = q => q < 8 ? SQ.man - 205 * (8 - q) : q < W3 ? SQ.man : SQ.man + 180 * (q - W3);
const s3walking = q => q < 8 || q >= W3;
const s3clamp = (x, a, b) => Math.max(a, Math.min(b, x));

function scene3(p, D) {
  const s = squareSet(p), cam = s.cam, photo = photoInsert(p);
  cam.stage.appendChild(s.cop.g);                                          // drawn last: the pair walk behind him at the end
  const PGB = { balloon: true, sticker: true, ring: true };
  const COPX = 1090;
  // the screen-left hand: down, into the pocket (-40), out with the photo (70), held up between them, back in the pocket, down again
  const handL = q => q < 20.4 ? [12, null] : q < 20.8 ? [12 - 52 * span(q, 20.4, 20.8), null] : q < 21.4 ? [-40 + 110 * span(q, 20.8, 21.4), 'photo']
    : q < 26.7 ? [70, 'photo'] : q < 27.1 ? [70 - 110 * span(q, 26.7, 27.1), q < 26.95 ? 'photo' : null] : [-40 + 52 * span(q, 27.1, 27.6), null];
  const manAt = q => {
    const w = s3walking(q) ? spWalk(q) : null, [armL, holdL] = handL(q), say = lips(q, 'scene3', PRE3, 's12', 's13');
    const toPeng = q >= S3.two2 && q < S3.shades, step = span(q, W3, W3 + .3);
    const nod = (q > 24.65 && q < 24.85) || (q > 25.05 && q < 25.25) || (q > 19.97 && q < 20.2) ? 5 : 0;
    return { x: s3manX(q), y: 800 - 25 * step, s: .9 - .04 * step, look: w ? .5 : toPeng ? -.3 : .6, eyeX: toPeng ? -.7 : 1, eyeY: toPeng ? .6 : 0,
      lids: q >= 18.9 ? 0 : .15, brow: q >= 19 ? .5 : 0, headR: toPeng ? 3 : 0, hold: 'bucket', holdL, armL,
      armR: (w ? w.armR : 0) + 60 * span(q, 29.4, 29.6) * (1 - span(q, 29.8, 30.2)), bob: (w ? w.bob : 0) + nod, legL: w ? w.legL : 0, legR: w ? w.legR : 0,
      mouth: say !== 'X' ? say : 'smile', shut: blinking(q, [3.3, 8.9, 13.2, 17.2, 21.9, 26.0, 30.6]) };
  };
  // the penguin: waddles beside him, stops with him; in his flipper except while he fetches and shows the photo
  const pengAt = q => {
    const w = s3walking(q) ? pengWaddle(q) : {}, m = manAt(q), r = span(q, 20.4, 20.8) * (1 - span(q, 27.2, 27.6));
    const breath = s3walking(q) ? 0 : -1.5 * Math.sin(q * 2 * Math.PI / 2.4 + 1);       // it breathes while it stands
    // the balloon insert: up at the balloon, then to the policeman; the sticker insert: down at the sticker, then up again
    const ins = q >= S3.balloon && q < S3.cop3 ? [q < 9.6 ? -.9 : .1, q < 9.6 ? .6 : 1] : q >= S3.sticker && q < S3.cop4 ? [q < 11.1 ? .9 : -.5, q < 11.1 ? .3 : 1] : null;
    const up = q >= S3.pengB && q < S3.twitch || q >= S3.two2 && q < S3.shades;
    const base = { ...PGB, ...w, y: m.y, s: m.s, shades: q >= S3.shades ? 'on' : 'up', look: .5, eyeX: ins ? ins[1] : 1, eyeY: ins ? ins[0] : up ? -.8 : -.3, bob: (w.bob || 0) + breath, headR: q >= S3.pengB && q < S3.twitch ? 4 : 0,
      squash: .12 * span(q, 29.7, 29.8) * (1 - span(q, 29.85, 30)), shut: blinking(q, [3.9, 9.85, 11.3, 15.6, 22.3, 25.75, 31.2]) };
    const ref = pengHand(s.man, { ...m, armL: 12 }, base);
    return { ...base, x: ref.x, flipR: ref.flipR * (1 - r) + 3 * r };
  };
  const PX = pengAt(8).x;                                                      // where the penguin stands for the whole scene
  const copAt = q => {
    const walk = q >= S3.march && q < 13.6, w = walk ? spWalk(q) : {}, x = q < S3.march ? 1180 : COPX + 90 * (1 - span(q, S3.march, 13.6));
    const say = lips(q, 'scene3', PRE3, 's11'), mx = s3manX(q);
    const o = { x, y: 800, s: .9, armL: -20, armR: -20, lids: .3, mouth: 'flat', brow: 0, look: 0, eyeX: 0, eyeY: 0, headR: 0, ...w,
      bob: walk ? w.bob : -3 * Math.sin(q * 2 * Math.PI / 1.2), shut: blinking(q, [1.6, 4.4, 7.0, 12.8, 16.4, 19.6, 24.8, 25.25, 28.2, 31.5]) };
    const set = d => Object.assign(o, d);
    if (q < S3.yawn) set({});
    else if (q < 3.4) set({ mouth: 'D', lids: .85, eyeY: -.6, brow: .3, bob: 0 });                                  // the yawn
    else if (q < 5.6) set({ mouth: 'smile', lids: .35 });                                                            // contented rocking
    else if (q < S3.cop2) set({ look: -.6, eyeX: -1, lids: .05, bob: 0 });                                           // footsteps: he looks left and freezes
    else if (q < S3.cop3) set({ look: -.6, eyeX: -1, lids: 0, brow: .6, mouth: 'O', bob: 0 });                       // eyes wide, a small O
    else if (q < S3.cop4) set({ look: -.6, eyeX: -1, eyeY: .5, lids: 0, brow: .5, mouth: 'O', bob: 0 });             // down the string
    else if (q < S3.oi) set({ look: -.5, eyeX: -1, lids: .1, brow: -.6, mouth: q < 11.9 ? 'flat' : 'frown', bob: walk ? w.bob : -3 * Math.sin(q * 5.2) * .3 });
    else if (q < S3.point) set({ look: -.3, eyeX: -1, eyeY: .2, lids: .1, brow: -.5, headR: -4, mouth: say !== 'X' ? say : 'frown' });
    else if (q < S3.man2) {                                                                                           // the arm snaps to the poster on "zoo", down again by 18.9
      const a = -20 + 108 * span(q, 17.7, 17.9) * (1 - span(q, 18.3, 18.9));
      set({ look: .3, eyeX: 1, eyeY: -.1, lids: .1, brow: -.5, headR: -4 * (1 - span(q, 18.3, 18.9)), mouth: say !== 'X' ? say : 'frown', armR: a });
    } else if (q < S3.still) set({ look: -.3, eyeX: -1, lids: .3, brow: -.2, mouth: 'flat' });
    else if (q < S3.twitch) set({ look: -.5, eyeX: -1, eyeY: .2, lids: .45, brow: -.15, bob: 0 });                  // the silence: he stares at the photo
    else if (q < S3.putaway) {                                                                                        // eyelid and moustache twitch
      const tw = (q >= 26.0 && q < 26.2) || (q >= 26.35 && q < 26.55);
      set({ look: -.5, eyeX: -1, eyeY: .3, lids: tw ? .2 : .4, brow: -.2, mouth: tw ? 'wobble' : 'flat', bob: 0 });
    } else if (q < S3.two2) set({ look: -.5, eyeX: -1, eyeY: .2 + .7 * span(q, 26.7, 27.3), lids: .4, brow: -.15, bob: 0 });   // his eyes follow the photo down
    else if (q < S3.copO) set({ look: -.4, eyeX: -1, lids: .4, brow: -.15, bob: 0 });
    else if (q < S3.wide3) set({ look: .3, eyeX: 1, eyeY: 0, lids: 0, brow: .4, bob: 0, armR: -20 + 150 * span(q, 29.9, 30.15),
      mouth: q < 30.05 || q >= 30.2 ? 'O' : 'flat' });                                                          // a finger up beside his face; he starts to speak twice; nothing comes out
    else {                                                                                                            // frozen, finger half up, his eyes follow them off right
      const e = s3clamp((mx - COPX) / 150, -1, 1), blink = span(q, 34.12, 34.3) * (1 - span(q, 34.3, 34.5));
      set({ look: .6 * e, eyeX: e, lids: .4 + .5 * blink, brow: .15, mouth: 'flat', bob: 0, armR: 130 });
    }
    return o;
  };

  // ---- the shots: [from, name, view, soft] ----
  const CSP = { x: COPX + 55, y: 430, z: 4 };                       // policeman single clear of the man's cap at the left edge
  const SH = [[0, 'wide', SQ_WIDE], [S3.yawn, 'cop', COP_CU(1180)], [S3.wide2, 'wide', SQ_WIDE], [S3.cop2, 'cop', COP_SOLO(1180)],
    [S3.balloon, 'balloon', PENG_BALLOON(PX), 'all'], [S3.cop3, 'cop', COP_SOLO(1180)], [S3.sticker, 'sticker', PENG_STICKER(PX), 'all'], [S3.cop4, 'cop', COP_SOLO(1180)],
    [S3.three, 'three', { x: 960, y: 560, z: 1.45 }], [S3.man1, 'man', MAN_SOLO(SQ.man)], [S3.oi, 'cop', CSP], [S3.pengA, 'peng', PENG_CU(PX)],
    [S3.point, 'cop', CSP], [S3.poster, 'poster', SQ_POSTER, 'all'], [S3.man2, 'man', MAN_SOLO(SQ.man)], [S3.two1, 'two', { ...TWO_MP(SQ.man, PX), y: 575 }],
    [S3.manCU, 'man', { x: 745, y: 450, z: 3 }], [S3.photo, 'photo'], [S3.still, 'both', MAN_COP(SQ.man, COPX)], [S3.pengB, 'peng', PENG_CU(PX)],
    [S3.twitch, 'cop', { ...CSP, z: 4.4 }], [S3.putaway, 'both', MAN_COP(SQ.man, COPX)], [S3.two2, 'two', { ...TWO_MP(SQ.man, PX), y: 575 }],
    [S3.pengC, 'peng', PENG_CU(PX)], [S3.copO, 'cop', { x: COPX + 70, y: 420, z: 3.6 }], [S3.wide3, 'wide', SQ_WIDE], [S3.end, 'cop', { x: COPX - 50, y: 440, z: 3.8 }]];
  for (const [t, , v, soft] of SH) if (v) cam.cut(v, t).soft(t, soft || false);
  cam.to(POSTER_SLOGAN, S3.poster, .6);                // the poster insert pushes in on "A great day out!"
  cam.shake(S3.oi + .15, .35, 5);

  stopClock(D, (q, f) => {
    let shot = 'wide'; for (const sh of SH) if (q >= sh[0]) shot = sh[1];
    vis(photo, shot === 'photo'); vis(cam.root, shot !== 'photo');
    photoZoom(photo, 1 + .25 * span(q, S3.photo, 24.2));                  // a slow push on the penguin's ice-cream smile
    cam.apply(q, f);
    vis(s.cop.g, shot !== 'poster');
    s.cop.pose(copAt(q), f);
    s.man.pose(manAt(q), f);
    s.peng.pose(pengAt(q), f);
  });
}
