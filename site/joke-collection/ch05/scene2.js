/* scene2.js — Good idea! The policeman rocks on his corner; the man comes in with the fish, the penguin behind him. The
   policeman's double take, "Is that a penguin?", the man's "I think he likes me" (an insert on the fish the penguin is
   really after), the sigh, "take him to the zoo" and the poster (insert), the man reads it and lights up: "Good idea!".
   He changes the fish to his other hand, the penguin takes his hand in its flipper, off they go past the satisfied
   policeman. Ends on the empty street, the policeman rocking alone. Times are the beat clock (storyboard, scene 2). */
'use strict';
const PRE2 = 2.0;
window.S2_HUSH = 28.0;   // the music stops with the hush after "And off they went."

/* ---------- sounds ---------- */
// patter1 is one penguin step; the waddle changes foot every 1/6 s, so the steps follow the feet
for (let k = 3; k <= 27; k++) sfx('scene2', +(k / 6).toFixed(3), 'patter1', .5);   // the penguin comes in, 0.5 … 4.5
sfx('scene2', 4.65, 'patter1', .6);                                                 // its late last step
sfx('scene2', 3.3, 'whoosh');                                                       // the policeman's snap zoom (the sound peaks 0.22 s in: on 3.5)
for (let k = 0; k <= 25; k++) sfx('scene2', +(k / 6).toFixed(3), 'step1', .3);       // the man's shoes, in
for (let k = 147; k <= 149; k++) sfx('scene2', +(k / 6).toFixed(3), 'patter1', .5);  // the penguin's steps to his hand, 24.5 … 24.83
for (let k = 150; k <= 180; k++) sfx('scene2', +(k / 6).toFixed(3), 'step1', .3);   // the man's shoes, out
for (let k = 150; k <= 180; k++) sfx('scene2', +(k / 6).toFixed(3), 'patter1', .5); // off they go, from 25.0 to 30.0

/* ---------- timeline (beat clock) ---------- */
const S2 = { glanceL: 2.7, back: 3.0, snap: 3.5, manStop: 4.3, pengStop: 4.65,
  lookDown: 7.2, sighIn: 15.1, sigh: 15.7, point: 17.35, pointEnd: 18.4,
  nodMan: 20.9, pass: 22.7, flip: 24.4, walk: 25.0, step: 25.4, salute: 25.6, copBack: 28.0 };
// the man strolls in at 150 px/s and stops at 860; after the hand-in-flipper he sets off (short start-up, then 195 px/s)
const s2manX = q => q < S2.walk ? 860 - 150 * Math.max(0, S2.manStop - q)
  : 860 + 195 * (q - S2.walk < .3 ? (q - S2.walk) ** 2 / .6 : q - S2.walk - .15);
const s2pengX = q => 620 - 150 * Math.max(0, S2.pengStop - q);   // the penguin trails ~240-290 px behind and stops half a step late (the running gag)

function scene2(p, D) {
  const s = squareSet(p), cam = s.cam;
  // the fish insert: between the parcel (hanging from the man's left mitten) and the penguin's head, his face out of frame
  const fh = handAt(s.man, { x: SQ.man, y: 800, s: .9, armL: 10 }, 'L');
  const INS_FISH = { x: (fh[0] + SQ.peng) / 2 + 10, y: (fh[1] + 600) / 2 + 80, z: 3.6 };   // low enough that his face is out of frame
  const TWO = { x: 718, y: 580, z: 2.0 };   // the man and the penguin: his cap clear of the top edge, the policeman's edge nearly out

  /* ---------- shots ---------- */
  cam.cut(SQ_WIDE, 0)                                  // the street: policeman on his corner, the two walk in
    .cut(COP_CU(SQ.cop), 2.6).to({ z: 2.8 }, S2.snap, .15)   // him: glance, glance back, double take (snap zoom)
    .cut(SQ_THREE, 4.1)                                // the man stops, the penguin half a step later
    .cut(COP_SOLO(SQ.cop), 5.1)                        // "Excuse me, sir. Is that a penguin?"
    .cut(TWO, 8.3)                 // the man and the penguin: "he's been following me"
    .cut(MAN_SOLO(SQ.man), 12.0)                       // "I think he likes me."
    .cut(INS_FISH, 13.6)                               // insert: the penguin has eyes only for the parcel
    .cut(COP_SOLO(SQ.cop), 14.6)                       // his look, the sigh, "take him to the zoo"
    .cut(SQ_POSTER, 18.3).to({ ...POSTER_PENG, x: POSTER_PENG.x - 45 }, 18.4, 1.0)   // insert: the poster, pushing in on the penguins in it
    .cut(MAN_SOLO(SQ.man), 19.5)                       // he looks, nods briskly: "Good idea!", then down at the penguin
    .cut(TWO, 22.6)                // the fish changes hands, the flipper takes his hand
    .cut(SQ_WIDE, S2.walk)                             // off they go; he steps back and salutes them past
    .cut(COP_SOLO(SQ.cop), 28.3)                       // his satisfied nod (both have passed out of this frame)
    .cut(SQ_WIDE, 29.2);                               // the street: the policeman rocking again, they walk out
  cam.soft(13.6, 'all').soft(14.6, false);

  cam.stage.appendChild(s.cop.g);                      // drawn last: the pair walk behind him at the end
  stopClock(D, (q, f) => {
    cam.apply(q, f);
    const nearTo = (a, b) => q >= a && q < b;
    const hide = nearTo(18.3, 19.5);   // the poster insert has no policeman in it
    const mx = s2manX(q);
    // the pair step back (y 775, s .86) and pass BEHIND the policeman, as in scene 3, then come forward again
    const dep = span(q, 25.4, 25.7) * (1 - span(q, 27.6, 28.2)), my = 800 - 25 * dep, ms = .9 - .04 * dep;

    /* ---- the policeman ---- */
    {
      const talk = lips(q, 'scene2', PRE2, 's07'), ask = lips(q, 'scene2', PRE2, 's05');
      const rock = -3 * (.5 - .5 * Math.cos(2 * Math.PI * q / 1.2));     // up on his toes and back, 1.2 s a rock
      const c = { x: SQ.cop, y: 800, s: .9, armL: -20, armR: -20, lids: .3, brow: 0, look: 0, eyeX: 0, eyeY: 0, mouth: 'flat', bob: rock, squash: 0, headR: 0,
        shut: blinking(q, [1.0, 6.6, 8.6, 12.9, 16.2, 20.8, 26.0, 27.9, 29.6]) };
      if (q < S2.glanceL) { /* eyes front, rocking */ }
      else if (q < S2.back) Object.assign(c, { look: -.35, eyeX: -1 });                           // a glance down the road
      else if (q < S2.snap) Object.assign(c, { look: .1, eyeX: .2 });                             // ...and back
      else if (q < 5.1) Object.assign(c, { look: -.8, eyeX: -1, lids: 0, brow: .5, mouth: 'O' });   // the double take: eyes wide
      else if (q < 8.3) {                                                                         // "Excuse me, sir. Is that a penguin?"
        const down = nearTo(S2.lookDown, 8.3);
        Object.assign(c, { look: down ? -.7 : -.5, eyeX: -1, eyeY: down ? .55 : 0, lids: .2, brow: .35, headR: down ? -3 : 0, mouth: ask === 'X' ? 'flat' : ask, squash: down ? -.02 : 0 });
      } else if (q < 14.6) Object.assign(c, { look: -.6, eyeX: -1, eyeY: .3, lids: .3 });         // listening (cut by the frame edge: eyes and blinks stay alive)
      else if (q < S2.pointEnd) {                                                                 // the look, the sigh, "take him to the zoo", the point
        const toMan = q > 15.4, pt = span(q, S2.point, S2.point + .3) * (1 - span(q, S2.pointEnd, S2.pointEnd + .5));
        Object.assign(c, { look: -.5 + 1.0 * span(q, S2.point, S2.point + .25), eyeX: -1 + 2 * span(q, S2.point, S2.point + .2), eyeY: toMan ? 0 : .6,
          lids: q < S2.point ? .55 : .3, brow: 0,                                                 // lids .3 while pointing: the eyes show turning to the poster
          squash: -.025 * span(q, S2.sighIn, S2.sighIn + .5) + .065 * span(q, S2.sigh, S2.sigh + .4) * (1 - span(q, S2.sigh + .5, S2.sigh + 1.0)),
          armR: -20 + 108 * pt, headR: 2 * pt, mouth: talk === 'X' ? (q > 15.6 && q < 16.5 ? 'frown' : 'flat') : talk });
      } else if (q < S2.walk) Object.assign(c, { armR: -20 + 108 * (1 - span(q, 18.4, 18.9)), look: .3 * span(q, 21, 22.5), eyeX: .5 });   // (arm down while the camera is elsewhere)
      else {
        // they come and go past him: he steps back half a step (y 775, s .87) and half-salutes (the mitten beside his head), eyes following
        const back = span(q, S2.step, S2.step + .4) * (1 - span(q, S2.copBack, S2.copBack + .5));
        const sal = span(q, S2.salute, S2.salute + .3) * (1 - span(q, 27.0, 27.4));
        const follow = Math.max(-1, Math.min(1, (mx - SQ.cop) / 160)), watch = 1 - span(q, 29.0, 29.4);
        const nodDip = nearTo(28.4, 28.8) ? .05 * Math.sin(Math.PI * (q - 28.4) / .4) : 0;
        Object.assign(c, { y: 800, s: .9, armR: -20 + 140 * sal, headR: 2 * sal,
          look: .5 * watch * (follow > 0 ? 1 : .4), eyeX: follow * watch, lids: .3, brow: 0, mouth: q > 26.8 && watch > .5 ? 'smile' : 'flat', squash: nodDip });
      }
      vis(s.cop.g, !hide);
      s.cop.pose(c, f);
    }

    /* ---- the man ---- */
    const walking = q < S2.manStop || q >= S2.walk;
    const w = spWalk(q);
    const speak = lips(q, 'scene2', PRE2, 's06', 's08');
    const pass = nearTo(S2.pass, S2.pass + .6) ? manPass((q - S2.pass) / .6, 'fish', { restL: 10, restR: 0 }) : null;
    const swapped = q >= S2.pass + .6;
    const man = { x: mx, y: my, s: ms, look: 0, eyeX: 0, eyeY: 0, lids: .2, brow: 0, headR: 0, mouth: 'smile', bob: 0, squash: 0,
      holdL: swapped ? null : 'fish', hold: swapped ? 'fish' : null, armL: swapped ? 10 - 6 * span(q, S2.pass + .6, S2.pass + 1.0) : 10, armR: 0,
      shut: blinking(q, [2.2, 6.4, 10.4, 12.9, 16.0, 20.0, 23.9, 28.0]) };
    if (pass) Object.assign(man, pass);
    if (walking) Object.assign(man, { legL: w.legL, legR: w.legR, bob: w.bob, armR: swapped ? 0 : w.armR, look: .35, eyeX: 1 });
    if (q >= S2.manStop && q < S2.walk) {
      const speaking = speak !== 'X';
      if (q < 8.0) Object.assign(man, { look: .5, eyeX: 1, brow: .25 });                              // polite, to the policeman
      else if (q < 14.7) Object.assign(man, { look: -.45, eyeX: -1, eyeY: .55, headR: -3, brow: q > 12 ? .4 : .25 });   // fondly down at the penguin
      else if (q < 18.1) Object.assign(man, { look: .5, eyeX: 1, brow: .25 });                         // listens to the policeman
      else if (q < 22.5) {                                                                           // one look at the poster, a brisk nod, "Good idea!"
        const nod = nearTo(S2.nodMan, S2.nodMan + .35) ? Math.sin(Math.PI * (q - S2.nodMan) / .35) : 0;
        Object.assign(man, { look: .6, eyeX: 1, eyeY: -.3 + .5 * nod, headR: -2 * nod, squash: .035 * nod });
      } else Object.assign(man, { look: -.4, eyeX: -1, eyeY: .5, headR: -3, brow: .3 });                // down at the penguin: shall we?
      if (speaking) man.mouth = speak;
    }
    if (q >= S2.walk) Object.assign(man, { look: .5, eyeX: 1, brow: .2 });
    s.man.pose(man, f);

    /* ---- the penguin: whenever it stands by the man it looks up-right at the parcel ---- */
    const pw = pengWaddle(q);
    const pg = { x: s2pengX(q), y: my, s: ms, look: .4, eyeX: 1, eyeY: -.4, lids: 0, bob: -1.2 * Math.sin(q * 2.6),
      shut: blinking(q, [1.4, 5.7, 9.4, 14.8, 21.3, 26.2]) };
    if (q < S2.pengStop) Object.assign(pg, { look: .5, eyeX: 1, eyeY: -.2, rock: pw.rock, footL: pw.footL, footR: pw.footR, bob: pw.bob });
    else if (q >= 13.6 && q < 14.6) Object.assign(pg, { headR: 6, eyeY: -.5, beak: onTwos(q) > 0 ? .5 : 0 });   // smacking its beak at the parcel
    else if (q >= 23.6 && q < S2.walk) Object.assign(pg, { eyeY: .3, headR: 4 });                         // sees the free hand
    if (q >= S2.flip && q < S2.walk) Object.assign(pg, { rock: pw.rock, footL: pw.footL, footR: pw.footR, bob: pw.bob });   // it waddles over to take it
    // a foot still up as it stops (half a step late)
    if (nearTo(S2.pengStop, S2.pengStop + .25)) Object.assign(pg, { footR: 22, rock: 6 });
    let pose = pg;
    if (q >= S2.flip) {                                                                                  // the flipper rises into the man's hand
      const u = span(q, S2.flip, S2.flip + .4), h = pengHand(s.man, man, { ...pg, flipR: 0 });
      pose = { ...pg, x: pg.x + (h.x - pg.x) * u, flipR: h.flipR * u };
    }
    if (q >= S2.walk) {                                                                                  // hand in flipper: follows the hand, waddling
      const h = pengHand(s.man, man, { ...pg, rock: pw.rock, footL: pw.footL, footR: pw.footR, bob: pw.bob, look: .5, eyeX: 1, eyeY: 0 });
      pose = { ...h, shut: pg.shut };
    }
    s.peng.pose(pose, f);
  });
}
