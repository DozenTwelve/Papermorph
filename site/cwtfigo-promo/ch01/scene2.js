/* scene2.js — You ask Claude. Four frontal singles: Doc at his bench stops soldering on "Oh no, no, no, no.", sets the
   iron in its stand and looks up at Martin; Martin is lost; Doc pushes his glasses up and leans into the lens;
   Martin opens the laptop and its light comes up on his face. */
'use strict';
const PRE2 = .3;
function scene2(p, D, m) {
  const st = garageStage(p), at = (c, t = 0) => clipAt('scene2', PRE2, c, t);
  const shots = [shot(0, 'single', 'doc'), shot(at('m02', -.15), 'single', 'martin'), shot(at('d02', -.15), 'close', 'doc'),
    shot(at('m03', -.1), 'single', 'martin')];
  const S = shooter(st, shots);
  stingAt('scene2');
  sfx('scene2', .2, 'sizzle', .4); sfx('scene2', 1.9, 'sizzle', .3);
  const glasses = at('d02', .1), open = at('m03', .1), ironSet = at('d01', .75);
  sfx('scene2', ironSet, 'clack', .8);
  sfx('scene2', open + .15, 'latch', .8);
  stopClock(D, (q, f) => {
    const cur = S(q);
    st.frame(q, f, { door: 1 });
    const dt = talk(q, 'scene2', PRE2, 'd01', 'd02'), mt = talk(q, 'scene2', PRE2, 'm02', 'm03');
    let doc;
    if (cur.kind === 'close') {   // pushes his glasses up with a finger, then leans in, conspiratorial
      const up = span(q, glasses, glasses + .22) - span(q, glasses + .5, glasses + .72);   // down before "Claude…"
      const base = { x: PLACE.doc[0], y: PLACE.doc[1], s: 1 + .05 * span(q, glasses + .8, glasses + 1.6), lids: .25, eyeX: 0, eyeY: 0 };
      const [ex, ey] = st.doc.point(base, [352, 430]);   // the left lens's outer rim: pushed up from the side, the mouth stays clear
      const reachTo = st.doc.aim(base, 'L', [ex - 14, ey + 6]);
      doc = { ...base, mouth: dt, frontL: true, frontR: true, armL: -6 + (reachTo.armL + 6) * up, reachL: 1 + (reachTo.reachL - 1) * up,
        ...st.doc.aim(base, 'R', [BOARD[0] + 60, BOARD[1] - 16]), hold: null,
        headY: -8 * up, brow: 0, bob: 10 * span(q, glasses + .8, glasses + 1.6), shut: blinkAt(q, 4) };
    } else {   // "Oh no, no, no, no.": stops soldering, the iron goes into its stand, he looks up at Martin, shaking his head
      const up = span(q, at('d01', .05), at('d01', .45)), look = span(q, at('d01', .5), at('d01', .8));
      doc = docSolder(st, q, f, { mouth: dt, look: .35 * look, eyeX: .2 + .7 * look, headR: 4 * look + (q < at('d01', 1.36) ? 3 * Math.sin(q * 11) * up : 0) }, up);
      // the right mitten carries the iron to the stand (to, then let go), then rests on the bench
      const base = { ...doc, lean: 0 }, toStand = span(q, ironSet - .35, ironSet), back = span(q, ironSet + .1, ironSet + .4);
      const at0 = { armR: doc.armR, reachR: doc.reachR }, atS = st.doc.aim(base, 'R', [STAND[0] + 16 + IRON_OFF[0] * .6, STAND[1] - 40]), rest = st.doc.aim(base, 'R', [BOARD[0] + 60, BOARD[1] - 16]);
      const lerp = (a, b, u) => a + (b - a) * u, mid = q < ironSet ? [at0, atS, toStand] : [atS, rest, back];
      doc.armR = lerp(mid[0].armR, mid[1].armR, mid[2]); doc.reachR = lerp(mid[0].reachR, mid[1].reachR, mid[2]);
      if (q >= ironSet) doc.hold = null;
    }
    const lap = span(q, open, open + .5);
    castPose(st, cur, f, {
      doc,
      martin: { x: PLACE.martin[0], y: PLACE.martin[1], mouth: mt === 'X' ? 'wobble' : mt, brow: q < at('m03') ? .7 : 1.2,
        lids: 0, eyeX: q < at('m03') ? -.3 : 0, eyeY: q > open ? .7 : 0, headR: q < at('m03') ? -4 : 0, frontL: true, frontR: true,
        armL: -16, armR: -16, reachL: .8, reachR: .8, shut: blinkAt(q, 5),
        chest: lap > 0 ? { name: 'laptop-open', w: 420, y: -330 + 30 * (1 - lap), screen: lap > .9 ? `<rect x="-152" y="-106" width="304" height="144" fill="#0d1014"/><text x="-120" y="-60" font-family="${MONO}" font-size="26" fill="#e8582a">✻</text>` : "" }
                       : { name: 'laptop', w: 330, y: -360 } },
      claude: null,
    });
    // the screen's light on his face once it is open
    st.fxHTML = (cur.who === 'martin' && lap > .5 ? `<ellipse cx="${PLACE.martin[0]}" cy="${PLACE.martin[1] - 250}" rx="120" ry="90" fill="url(#cwGlow)" opacity="${(.35 * lap).toFixed(2)}"/>` : '') +
      (cur.who === 'doc' ? (q < ironSet ? solderSmoke(...ironTip(st, doc), q) + (q < at('d01') && Math.floor(q * 3) % 3 === 0 ? sparks(...ironTip(st, doc), f) : '') : IRON_IN_STAND) : '');
  });
}
