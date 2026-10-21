/* scene1.js — The follower (round 2). Harbour: a man buys a fish and strolls home; a penguin hides behind the left end of
   the fish crates and follows the parcel, ~240 px behind, stopping a half step after every stop of his. Inserts: the
   crates (the head pops up behind the parcel), its face, the fish. Run-gag: he stops, it stops (three times).
   "Oh. Hello." / "Well… come along, then." The man never sees the fish is the reason. Ends on the empty harbour wide.
   Times are beat-clock seconds (PRE1 + audio time). See books/penguin/REWORK.md, scene 1. */
'use strict';
const PRE1 = 1.5;

// shot times
const S1 = { crates: 6.1, face: 8.3, wide2: 9.3, two: 11.0, manS: 11.8, pengCU: 12.6, manS2: 13.4, wideR: 14.0, freeze: 15.8, manS3: 17.0,
  twoShot: 19.0, honkCU: 22.8, fish: 23.9, manS4: 25.0, wide3: 27.3 };

// piecewise-linear path through [time, x] points (constant before the first and after the last)
function s1path(q, pts) {
  if (q <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (q < pts[i][0]) { const [t0, a] = pts[i - 1], [t1, b] = pts[i]; return a + (b - a) * (q - t0) / (t1 - t0); }
  return pts[pts.length - 1][1];
}
// the man: strolls from the stall at ~110 px/s, stops at 11.4 (x 1150) and 15.6 (x 1262), then hurries out at 170 px/s on "come along"
const S1_MAN = [[3.0, 230], [11.4, 1150], [14.4, 1150], [14.7, 1160], [15.6, 1262], [27.3, 1262], [27.6, 1274], [33, 2192]];
const manX = q => s1path(q, S1_MAN);
// the penguin: behind the crates' left end until 9.3, round it, a hurry to 250 px behind him, a half step late at 11.7 and
// again at 15.8, two steps up to his leg after "Hello." (22.0–22.6), a lean toward the parcel (+15), then after him
const S1_PENG = [[9.3, 620], [9.9, 520], [11.4, 855], [11.7, 901], [14.7, 901], [15.0, 908], [15.8, 1062], [22.0, 1062], [22.6, 1100], [27.9, 1115], [28.2, 1127], [33, 1990]];
const lean = q => 15 * span(q, 24.0, 24.9);
const pengX = q => s1path(q, S1_PENG) + (q < 27.9 ? lean(q) : 0);
// the man's walk with the stride matched to his speed: a foot change every 1/6 s moves him v/6 px, so the legs swing only
// as far as that (a foot lands under him, no skating); his arm swings with them
function s1walk(q, v) {
  const k = spWalk(q).k, A = Math.asin(Math.min(1, v / 6 / 218)) * 180 / Math.PI, u = A / 16;
  return { legL: A * k, legR: -A * k, bob: k > 0 ? -6 * u : 0, armR: -8 * k * u };
}
const moving = (fn, q) => Math.abs(fn(q + .05) - fn(q - .05)) > .4;

sfx('scene1', .05, 'waves', .3);
sfx('scene1', .5, 'gulls', .4);
sfx('scene1', 12.6, 'gull1', .4);
for (let t = 56 / 6; t < 11.7; t += 1 / 6) sfx('scene1', +t.toFixed(3), 'patter1', .8);     // out round the crates and after him; the last step (11.667) is the late half step
for (let t = 88 / 6; t < 15.7; t += 1 / 6) sfx('scene1', +t.toFixed(3), 'patter1', .8);     // the follow (nothing under the freeze)
sfx('scene1', 15.6, 'whoosh');                                                                  // the sound peaks ~0.22 s in: on the whip-round at 15.8
for (let t = 22; t < 22.6; t += 1 / 6) sfx('scene1', +t.toFixed(3), 'patter1', .8);         // two waddle steps up to his leg
for (const [a, b] of [[3.0, 11.4], [14.7, 15.6], [27.4, 30.2]])                              // the man's own steps, on his foot changes
  for (let t = Math.ceil(a * 6) / 6; t < b; t += 1 / 6) sfx('scene1', +t.toFixed(3), 'step1', .35);
sfx('scene1', 23.0, 'honk');
sfx('scene1', 27.833, 'patter', .8); sfx('scene1', 29.833, 'patter', .6);                    // after him, out of the frame

function scene1(p, D) {
  const h = harbourSet(p), cam = h.cam;
  // views that depend on where they stand
  const TWO = (m, g) => ({ x: Math.min((m + g) / 2, 1660 - 800 / 1.9), y: 610, z: 1.9 });
  const FISH = { x: 1150, y: 670, z: 4.4 }, WIDE_R = { x: 1030, y: 520, z: 1.35 }, CRATES = { x: 640, y: 660, z: 2.6 };
  const FACE = { x: 660, y: 600, z: 4.4 };

  cam.cut(HARB_WIDE, 0).cut(CRATES, S1.crates).cut(FACE, S1.face).cut(HARB_WIDE, S1.wide2)                       // 1 wide, 2 crates, 3 face, 4 wide
    .cut(TWO(1112, 830), S1.two).to(TWO(1150, 901), S1.two, .7)                                                // 5 follow shot: he stops, it stops half a step later
    .cut(MAN_SOLO(1150), S1.manS).cut({ x: 871, y: 690, z: 3.4 }, S1.pengCU).cut(MAN_SOLO(1150), S1.manS2)       // 6 he glances back, 7 who, me?, 8 shrug
    .cut(WIDE_R, S1.wideR).cut({ x: 1010, y: 690, z: 3.4 }, S1.freeze).cut(MAN_SOLO(1262), S1.manS3)            // 9 on, 10 frozen mid-step, 11 stare
    .cut(TWO(1262, 1062), S1.twoShot).cut({ x: 1110, y: 690, z: 3 }, S1.honkCU).cut(FISH, S1.fish)               // 12 "Oh. Hello.", 13 honk, 14 the fish
    .cut(MAN_SOLO(1262), S1.manS4).cut(HARB_WIDE, S1.wide3);                                                    // 15 "Well… come along", 16 wide, out
  cam.soft(S1.fish, 'all').soft(S1.manS4, false);

  stopClock(D, (q, f) => {
    cam.apply(q, f);
    const mx = manX(q), px = pengX(q), mw = moving(manX, q), pw = moving(pengX, q), w = pengWaddle(q), vm = Math.abs(manX(q + .05) - manX(q - .05)) / .1, wk = s1walk(q, vm);
    const sp = lips(q, 'scene1', PRE1, 's03', 's04'), rn = (a, b) => q >= a && q < b;
    const sm = sp === 'X' ? 'smile' : sp;                                    // the man's mouth moves only on his lines

    /* ---- the man ---- */
    const man = { x: mx, y: 800, s: .9, holdL: 'fish', armL: 10, look: 0, eyeX: 0, eyeY: 0, lids: .15, mouth: 'smile', headR: 0, brow: 0,
      shut: blinking(q, [1.9, 5.2, 9.0, 13.1, 21.4, 25.3]) };
    if (q < 3.0) { const u = Math.sin(Math.PI * span(q, .5, 2.0));             // looks at his parcel, then turns for home
      Object.assign(man, { armL: 10 + 34 * u, look: -.4 + .9 * span(q, 2.2, 3.0), eyeX: -.6 + 1.4 * span(q, 2.2, 3.0), eyeY: .4 * (1 - span(q, 2.2, 3.0)), headR: -3 * u, bob: -.8 * Math.sin(q * 2.2) }); }
    else if (mw) Object.assign(man, { legL: wk.legL, legR: wk.legR, bob: wk.bob, armR: wk.armR, look: .5, eyeX: .8 });
    else Object.assign(man, { bob: -.8 * Math.sin(q * 2.2) });
    if (rn(11.5, 13.4)) Object.assign(man, { look: -1, eyeX: -1, lids: .35, brow: -.15, mouth: 'flat', headR: -4 });                           // head right round, eyes narrowed
    if (rn(13.4, 14.4)) Object.assign(man, { look: .4, eyeX: .5, headR: 4 * Math.sin(Math.PI * span(q, 13.4, 14.1)), brow: .3, armR: 22 * Math.sin(Math.PI * span(q, 13.5, 14.1)) });   // shrugs it off
    if (q >= 15.6 && q < 15.7) Object.assign(man, { look: .5, eyeX: .8 });
    if (q >= 15.7 && q < 17.0) Object.assign(man, { look: -.9, eyeX: -1, lids: 0, brow: .3, mouth: 'O' });                                      // stops dead, whips round
    if (rn(17.0, 19.0)) Object.assign(man, { look: -.4, eyeX: -.4, eyeY: .8, lids: .3 + .5 * Math.sin(Math.PI * span(q, 17.6, 18.5)), shut: Math.sin(Math.PI * span(q, 17.6, 18.5)) > .7, mouth: q > 18.3 ? 'smile' : 'flat', headR: -2 });   // looks down at it, a slow blink, a hint of a smile
    if (rn(19.0, 25.0)) Object.assign(man, { look: -.5, eyeX: -.5, eyeY: .8, lids: .1, mouth: sm, headR: -4 * span(q, 19.0, 19.4), brow: .2 });   // "Oh. Hello." eyes on the penguin all through
    if (rn(25.0, 27.3)) Object.assign(man, { look: -.3, eyeX: -.3, eyeY: .7, lids: .1, brow: .35, headR: -3 - 3 * Math.sin(Math.PI * span(q, 25.0, 26.3)), mouth: sm });                      // won over (a slow nod): "Well…"
    if (q >= 27.3) Object.assign(man, { look: .3, eyeX: .5, mouth: sm });                                                                      // "…come along, then."
    if (q >= 27.3 && mw) Object.assign(man, { legL: wk.legL, legR: wk.legR, bob: wk.bob, armR: wk.armR, look: .5, eyeX: .8 });
    h.man.pose(man, f);

    /* ---- the penguin ---- */
    const [hx] = handAt(h.man, { x: mx, y: 800, s: .9, armL: 10 }, 'L');
    const trackFish = Math.max(-1, Math.min(1, (hx - px) / 90));
    const pg = { x: HARB.crates, y: HARB.hideY, s: HARB.hideS, bob: 0, eyeX: 1, look: .3, lids: .1, shut: blinking(q, [3.4, 9.5, 12.9, 16.9, 20.2, 25.7, 28.3]) };
    if (q < 9.3) {                                                                                           // behind the crates' left end
      if (q < 4.4) pg.bob = .8 * Math.sin(q * 2.6);                                                          // opening: a bit of head top, breathing
      else if (q < 7.5) { pg.bob = 7 * span(q, 4.4, 4.9) * (1 - span(q, 7.0, 7.5)); pg.eyeX = .6 * trackFish; }   // ducks while he passes
      else { pg.bob = -42 * span(q, 7.5, 7.8) + .8 * Math.sin(q * 2.6); pg.eyeX = 1; pg.eyeY = .3; pg.lids = 0; pg.look = .5 * Math.max(0, trackFish); }   // the head pops up behind the parcel
      if (q >= 8.3) { pg.look = .5 * trackFish; pg.eyeX = trackFish; pg.eyeY = .3; pg.beak = rn(8.6, 8.76) || rn(8.9, 9.06) ? .3 : 0; }     // follows the fish; the beak works twice
    } else if (q < 11.7) {                                                                                    // round the left end, then a hurry after him
      const u = span(q, 9.3, 9.7), hur = span(q, 9.9, 10.3);
      Object.assign(pg, { x: px, y: HARB.hideY + (800 - HARB.hideY) * u, s: HARB.hideS + (.9 - HARB.hideS) * u, bob: w.bob,
        rock: w.rock * (1 + .3 * hur), footL: w.footL, footR: w.footR, look: .6, eyeX: 1, eyeY: .2, lids: 0 });
    } else if (q < 14.7) {
      Object.assign(pg, { x: px, y: 800, s: .9, look: .2, bob: -.8 * Math.sin(q * 2.4) });
      if (q < 12.9) Object.assign(pg, { footR: 22, rock: 4, look: .5, eyeX: 1, lids: 0 });                   // a half step late, one foot still up
      else Object.assign(pg, { footR: 22 * (1 - span(q, 12.9, 13.2)) });
      if (q >= 11.75) Object.assign(pg, { eyeY: -1, eyeX: 0, look: -.1, flipL: -25, flipR: -25, headR: -3, lids: .25 });   // who, me? (the sky; flippers behind its back)
    } else if (q < S1.freeze) {
      Object.assign(pg, { x: px, y: 800, s: .9, look: .6, eyeX: 1, ...(pw ? { rock: w.rock, footL: w.footL, footR: w.footR, bob: w.bob } : {}) });
    } else if (q < 27.9) {
      Object.assign(pg, { x: px, y: 800, s: .9, look: .3, bob: -1 * Math.sin(q * 2.4) });
      if (q < 17.0) { const u = span(q, 16.2, 16.9);                                                          // frozen on one leg, flippers out, then the foot goes down slowly and it looks away
        Object.assign(pg, { footR: 24 * (1 - u), rock: -8 * (1 - u), flipL: 60 * (1 - u), flipR: 60 * (1 - u), eyeX: -1 * span(q, 16.5, 16.9), eyeY: -.6 * span(q, 16.5, 16.9), look: .6 - 1.0 * span(q, 16.5, 16.9), lids: .1 + .2 * u }); }
      else if (q < 19.0) Object.assign(pg, { eyeY: -1, eyeX: -.3, look: -.2, lids: .3 });                                                   // gazes at the sky
      else if (q < 22.8) {                                                                                    // looks up at him; at 22.0–22.6 two steps up to his leg
        Object.assign(pg, { eyeX: .7, eyeY: -.8, look: .6, headR: 5, lids: 0 });
        if (pw) Object.assign(pg, { rock: w.rock, footL: w.footL, footR: w.footR, bob: w.bob }); }
      else if (q < S1.fish) { const t = q - 23.0, wide = (t >= 0 && t < .16) || (t >= .2 && t < .62);        // honk: a short pulse, a long one, flippers flap, a stretch
        const u = Math.sin(Math.PI * span(q, 23.0, 23.62));
        Object.assign(pg, { eyeX: .7, eyeY: -.8, look: .6, beak: wide ? .85 : 0, flipL: 45 * u, flipR: 45 * u, bob: -4 * u, headR: 5 - 4 * u, lids: 0 }); }
      else { const u = span(q, 24.0, 24.9);                                                                    // the eyes slide to the parcel, the head leans, the beak works at it
        Object.assign(pg, { eyeX: .5 + .5 * u, eyeY: -.7 + .9 * u, look: .6 + .2 * u, headR: 5 + 9 * u, beak: Math.sin(q * 11) > 0 ? .5 * u : .1 * u, lids: 0, bob: -2 * u }); }
    } else Object.assign(pg, { x: px, y: 800, s: .9, look: .6, eyeX: 1, eyeY: 0, lids: .1, shut: false, headR: 0,   // trots after him at his pace
      ...(pw ? { rock: w.rock * 1.3, footL: w.footL, footR: w.footR, bob: w.bob } : { bob: 0 }) });
    h.front(h.peng, q >= 9.75);
    h.peng.pose(pg, f);
  });
}
