/* scene2.js — You ask Claude. Four frontal singles: Doc at his bench shakes his head over the work, then swivels round
   on his stool for "Don't ask me, kid"; Martin is lost; Doc pushes his glasses up and leans into the lens, the iron
   still in his other mitten; Martin opens the laptop and its light comes up on his face. */
'use strict';
const PRE2 = .3;
function scene2(p, D, m) {
  const st = garageStage(p), at = (c, t = 0) => clipAt('scene2', PRE2, c, t);
  const shots = [shot(0, 'single', 'doc'), shot(at('m02', -.15), 'single', 'martin'), shot(at('d02', -.15), 'close', 'doc'),
    shot(at('m03', -.1), 'single', 'martin')];
  const S = shooter(st, shots);
  stingAt('scene2');
  sfx('scene2', 0, 'rain', .35, { loop: true }); sfx('scene2', 0, 'hum', .3, { loop: true });
  sfx('scene2', .2, 'sizzle', .4); sfx('scene2', 1.9, 'sizzle', .3);
  const glasses = at('d02', .1), open = at('m03', .1), swivel = at('d01', 1.0);
  sfx('scene2', swivel, 'whoosh', .5); sfx('scene2', swivel + .05, 'tick', .7);
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
        ...st.doc.aim(base, 'R', [base.x + 70, base.y - 190]), hold: IRON,
        headY: -8 * up, brow: 0, bob: 10 * span(q, glasses + .8, glasses + 1.6), shut: blinkAt(q, 4) };
    } else {   // "Oh no, no, no, no." still at the work, shaking his head; then he swivels round on the stool to face the kid
      const sw = Math.min(1, Math.max(0, (q - swivel) / .6)), up = span(q, swivel + .2, swivel + .55);
      doc = docSolder(st, q, f, { mouth: dt, look: 0, eyeX: .2 * (1 - up), headR: q < swivel ? 3 * Math.sin(q * 11) : 0, bob: 10 * Math.sin(Math.PI * sw),
        turn: Math.cos(Math.PI * 2 * sw) }, up);
      if (sw > 0) Object.assign(doc, { lids: .3 * up, eyeY: 0, brow: 0 });
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
      (cur.who === 'doc' ? solderSmoke(...ironTip(st, doc), q) + (cur.kind === 'single' && q < swivel && Math.floor(q * 3) % 3 === 0 ? sparks(...ironTip(st, doc), f) : '') : '');
  });
}
