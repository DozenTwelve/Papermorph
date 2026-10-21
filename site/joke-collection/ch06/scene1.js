/* scene1.js — "Three dogs". Alley at dusk: the narrator counts three dogs (insets on the chopping shadow, the dog
   tag, the empty bowl and its growl, the Soviet blink), stumbles at "and a Chinese dog" -- the camera whips to a rubbish
   box, two eyes open in its hand-hole: "Four dogs." The American draws himself up to speak. Chopping all film. */
'use strict';
const PRE1 = 1.5;
const S1_RUNS = [[0.2, 30]];
window.S1_STOP = 14.6;
chopSfx('scene1', S1_RUNS);
roomSfx('scene1', [[0, 27]]);
sfx('scene1', 7.8, 'tick');
sfx('scene1', 10.6, 'growl', .5);
sfx('scene1', 16.1, 'whoosh');

// ramp a value from `a` to `b` over [t0, t1]
const s1ramp = (q, t0, t1, a, b) => a + (b - a) * span(q, t0, t1);
// a pulse 0 -> 1 -> 0 around [t0, t1]
const s1pulse = (q, t0, t1) => span(q, t0, (t0 + t1) / 2) * (1 - span(q, (t0 + t1) / 2, t1));

function scene1(p, D) {
  const a = alleySet(p), c = a.cam;
  // shots (beat clock)
  c.cut(AL_WIDE, 0);
  c.cut(AL_WINDOW, 2.2);           // insert: the cook's shadow chopping
  c.cut(AL_WIDE, 3.0);
  c.cut(AL_TRIO, 3.6);             // the three look at each other
  c.cut(DOG_CU({ x: ALLEY.us, y: ALLEY.ground, s: US.s, dir: 1 }), 6.9);    // "An American dog,"
  { const v = DOG_CU({ x: ALLEY.pl, y: ALLEY.ground, s: PL.s, dir: -1, sit: 1 }, 3.0); c.cut({ ...v, x: v.x - 30, y: v.y + 95 }, 9.4); }   // "a Polish dog,"
  c.cut(DOG_CU({ x: ALLEY.su, y: ALLEY.suY, s: SU.s, dir: -1, sit: 1 }), 11.9);     // "a Soviet dog,"
  c.cut(AL_TRIO, 14.5);            // the narrator hesitates; they count each other
  c.cut(AL_TRIO, 16.0); c.to(AL_BOX, 16.1, .35);   // whip to the box on "Chinese"
  c.cut(AL_SLOT, 17.8);            // hard cut onto the hole as the eyes open
    c.cut(AL_WIDE, 20.8);            // "Four dogs." -- three talking, the box alone
  c.cut(AL_WINDOW, 22.0);          // the shadow chops
  c.cut(AL_SLOT, 23.3);            // the eyes slide to the door
  c.cut(AL_TRIO, 24.5);            // the American clears his throat

  stopClock(D, (q, f) => {
    c.apply(q, f); a.steam(q); a.shade(1);
    vis(a.cn.g, false);

    // who looks at whom: US toward PL (forward), PL toward US (forward) or back at SU (-1), SU toward PL (forward)
    let usE = 1, plE = 1, suE = 1, usH = 0, plH = 0, suH = 0;
    if (between(q, 3.8, 5.4)) { usE = 1; plE = -1; suE = 1; plH = 6; }          // PL turns to SU, SU to PL
    else if (between(q, 5.4, 6.2)) { usE = -.3; plE = 1; suE = -.4; usH = 6; suH = 4; }   // US looks at the box, SU at the door side
    else if (between(q, 6.2, 6.9)) { usE = 1; plE = 1; suE = 1; plH = -5; }
    if (between(q, 5.4, 6.2)) plH = -9;                                          // PL looks down at his bowl once
    if (between(q, 14.5, 16.1)) {                                               // the count: the American nods at 14.7 (PL), 15.0 (SU), 15.3 (himself); the others' eyes follow
      usH = -9 * (s1pulse(q, 14.7, 14.9) + s1pulse(q, 15.0, 15.2) + s1pulse(q, 15.3, 15.5));
      usE = q < 15.0 ? 1 : q < 15.3 ? 1 : -.4; plE = q < 14.7 ? 1 : q < 15.0 ? 1 : -.6; suE = q < 15.0 ? 1 : 0;
      if (q >= 15.0 && q < 15.3) plH = 4;
      if (q >= 15.3) suH = 3 * s1pulse(q, 15.3, 15.8);
    }
    if (between(q, 20.8, 24.5)) {                                               // chatting, glances shift every second or so
      usE = q % 2.2 < 1.2 ? 1 : .4; plE = q % 1.9 < 1 ? 1 : -.5; suE = q % 3 < 1.6 ? 1 : 0;
      usH = 3 * Math.sin(q * 1.7); plH = 2 * Math.sin(q * 1.3 + 1);
    }
    if (q >= 24.5) { usH = s1ramp(q, 24.5, 24.9, 0, 6) - 7 * s1pulse(q, 25.3, 26.2) + 3 * s1pulse(q, 25.6, 26.6); plE = 1; suE = 1; plH = 3; }

    // American: tongue and tail; chest out on his line; stands up straight and shakes his head before speaking
    const usP = { x: ALLEY.us, y: ALLEY.ground, s: US.s, dir: 1, wag: (q < 24.5 || q > 25.2) && !between(q, 16.0, 18.4), tongue: !between(q, 25.0, 26.3), headR: usH, eyeX: usE,
      shut: blinking(q, [1.9, 5.3, 8.4, 12.9, 17.5, 21.6, 25.9]), swell: Math.max(.5 * s1pulse(q, 6.9, 9.4) * 1.0, .35 * span(q, 24.5, 25.0)) };
    // Polish: bowl in his mouth, hungry eyes; belly growl at 10.6, ear twitch
    const plP = { x: ALLEY.pl, y: ALLEY.ground, s: PL.s, dir: -1, sit: 1, headR: plH, eyeX: plE,
      shut: blinking(q, [2.4, 6.2, 9.9, 13.6, 18.8, 22.7, 26.1]), ear: 22 * s1pulse(q, 10.5, 11.1) + 12 * s1pulse(q, 25.8, 26.3), bob: .4 * (s1pulse(q, 10.55, 10.85) + s1pulse(q, 1.7, 2.1)) };
    // Soviet: barely moves, half-lidded; one slow blink at 13.2
    const slow = Math.max(s1pulse(q, 13.2, 13.8), s1pulse(q, 1.0, 1.5));
    const suP = { x: ALLEY.su, y: ALLEY.suY, s: SU.s, dir: -1, sit: 1, headR: suH, eyeX: suE, lids: .35 + .65 * Math.min(1, slow * 1.6) };

    vis(a.bowl, true); a.placeBowl();                                           // his empty bowl on the ground
    if (between(q, 10.5, 11.3)) plP.headR = -14 * s1pulse(q, 10.5, 11.3);          // looks down at it on the growl
    a.us.pose(usP, f); a.pl.pose(plP, f); a.su.pose(suP, f);

    // the box: rubbish until "Chinese" (16.1); the eyes open at 17.6 and glance at the three
    const eyes = q >= 17.8 ? 1 : 0;
    let eyeX = .6, lids = 0, shut = false;
    if (q >= 17.8) lids = 1 - span(q, 17.8, 17.95);
    if (q >= 17.8 && q < 18.4) eyeX = 0;                                         // opens straight at us
    if (q >= 18.4 && q < 20.0) eyeX = 0;                                         // holds: "yes, me"
    if (q >= 20.0 && q < 23.3) eyeX = s1ramp(q, 20.0, 20.3, 0, 1);               // slides right to the three
    if (q >= 20.4 && q < 23.3) lids = .3;                                        // watching them
    if (between(q, 19.3, 19.3 + 2 / FPS)) shut = true;                           // blink in the slot
    if (q >= 23.3 && q < 24.5) { eyeX = 1; lids = .3 + .1 * s1pulse(q, 23.8, 24.4); }   // toward the door, worried
    if (between(q, 24.0, 24.0 + 2 / FPS)) shut = true;
    if (between(q, 21.6, 21.6 + 2 / FPS)) shut = true;
    a.box.pose({ x: ALLEY.box, y: ALLEY.ground, eyes, eyeX, lids, shut }, f);

    a.kit.cook({ arm: cleaverAt(q, S1_RUNS), turn: 0 });
    a.kit.crack(0);
  });
}
