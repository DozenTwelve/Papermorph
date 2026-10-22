/* scene1.js — 起, the excuses. Wide of the class (narrator); the two-shot, seated: Me writes his homework, Bo has nothing
   (that is who "I" is); Bo close-up for "an excuse" (smug); then shot/reverse: the teacher asks "Bo. Homework." (same
   framing, same pose, every time) and Bo, on his feet in the two-shot, answers dead straight with a gesture per excuse
   while Me reacts a little more each time. Teacher close-up for the dog line, Bo close-up for the silence and "Yet.",
   then the sting. */
'use strict';
const PRE1 = 1.0;   // the wide first, then the narrator

// shot times (beat clock = PRE1 + audio time)
const S1 = { two0: 1.9, smug: 4.25, two0b: 5.9, tch1: 7.75, two1: 10.0, tch2: 12.6, two2: 15.25, tch3: 17.5, two3: 20.1, cu: 22.4, bo: 26.7, sting: 30.15 };
sfx('scene1', S1.two1 - .05, 'chair');
sfx('scene1', S1.sting, 'sting');

function scene1(p, D) {
  const c = classroom(p, { pen: `<g transform="translate(-20,-30) rotate(55)">${pencilSVG}</g>` }), cam = c.cam, tc = teacherSet(p), tcam = tc.cam;
  const BO_CU = { x: 920, y: 470, z: 2.8 }, BO_SIT_CU = { x: 930, y: 540, z: 2.6 }, TCH = { x: 1060, y: 480, z: 1.5 };
  // Me's homework lying on the desk (foreshortened), drawn over the desk top; shown in the seated shots only
  const sheet = prop(cam.stage, `<g filter="url(#paper)"><path d="M-52,-2 L-40,-20 H44 L56,-2 Z" fill="#fbfaf4"/>${[-15,-10,-5].map(y => `<path d="M-30,${y} h56" stroke="#3a4f86" stroke-width="1.6"/>`).join('')}</g>`);
  tf(sheet, `translate(${c.ME.x + 20},722)`);
  cam.cut({ x: 800, y: 450, z: 1 }, 0);                                              // 1 wide on the class
  cam.cut(TWO, S1.two0).soft(S1.two0, false);                                        // 2 two-shot, seated: Me writes, Bo idles
  cam.cut(BO_SIT_CU, S1.smug).soft(S1.smug, true);                                   // 3 Bo, smug: "an excuse"
  cam.cut(TWO, S1.two0b).soft(S1.two0b, false);                                      // 4 back to the two-shot; Bo sits up
  cam.cut(TWO, S1.two1).cut(TWO, S1.two2).cut(TWO, S1.two3);                         // 6,8,10 Bo up, two-shot
  cam.cut(BO_CU, S1.bo).soft(S1.bo, true);                                           // 12 Bo close-up
  tcam.cut(TCH, 0).cut(TEACH_CU, S1.cu).soft(S1.cu, true);                           // 5,7,9 teacher medium; 11 close-up

  const teacherOn = q => between(q, S1.tch1, S1.two1) || between(q, S1.tch2, S1.two2) || between(q, S1.tch3, S1.two3) || between(q, S1.cu, S1.bo);
  const wide = q => q < S1.two0, smug = q => between(q, S1.smug, S1.two0b);
  const two = q => between(q, S1.two0, S1.smug) || between(q, S1.two0b, S1.tch1) || between(q, S1.two1, S1.tch2) || between(q, S1.two2, S1.tch3) || between(q, S1.two3, S1.cu);
  const boCU = q => q >= S1.bo;
  // each excuse: Bo's gesture (from the word) and Me's reaction
  const X = [S1.two1 + .8, S1.two2 + .27, S1.two3 + .29];   // "wind", "Aliens", "dog" as heard in the two-shot
  const ramp = (q, a, b, v0, v1) => v0 + (v1 - v0) * ease(span(q, a, b));
  const narrow = m => ({ D: 'B', C: 'B', H: 'G', E: 'F' }[m] || m);   // the teacher's mouth stays small: deadpan

  stopClock(D, (q, f) => {
    const t = teacherOn(q), w = wide(q), tw = two(q), sm = smug(q), bc = boCU(q);
    vis(tcam.root, t); vis(cam.root, !t);
    cam.apply(q, f); tcam.apply(q, f); vis(sheet, q < S1.tch1);
    for (const m of c.mates) vis(m.p.g, w || tw);
    vis(c.me.g, w || tw); vis(c.bo.g, w || tw || sm || bc);
    if (w || tw) c.matesPose(q, f);
    const mouth = (...cl) => { const m = lips(q, 'scene1', PRE1, ...cl); return m === 'X' ? 'flat' : m; };

    // the teacher: deadpan, identical in every shot; one blink in each wait, eyes drift a hair; one blink between the two lines
    tc.t.pose({ ...TEACHER, lids: .45, look: 0, eyeX: between(q, 8.6, 9.2) || between(q, 18.3, 18.9) ? .35 : between(q, 13.3, 13.9) ? -.35 : 0,
      mouth: narrow(mouth('s02', 's02c', 's02e', 's03')), armR: 0,
      shut: blinking(q, [8.9, 13.7, 18.4, 24.1, 26.0]) }, f);

    // Bo: idles in the first two-shot (eyes up, a slow head tilt), sits up at the teacher's name, on his feet from the cut
    const sit = q < S1.tch1;
    const gest = { armR: 0, armL: 0, look: 0, eyeX: 0, eyeY: 0, headR: 0, brow: 0 };
    if (sit) {
      if (q < S1.smug) Object.assign(gest, { eyeY: -.8, look: -.2, headR: -3 + 2 * Math.sin(q * 1.6), armR: 8 + 4 * Math.sin(q * 2.2) });   // gazes at the ceiling, fidgets
      else if (q < S1.two0b) Object.assign(gest, { eyeX: -.4, headR: 4, brow: -.3 });                                                   // smug
      else Object.assign(gest, { eyeY: q < 7.2 ? -.6 : 0, headR: q < 7.2 ? -2 : 0 });
    } else if (q >= S1.two1 && q < S1.tch2) {   // "The wind took it": the flat of the hand wafts out toward the window
      Object.assign(gest, { armR: q < X[0] - .1 ? 20 : ramp(q, X[0] - .1, X[0] + .9, 70, 125) * (q < X[0] + 1.2 ? 1 : 1 - span(q, X[0] + 1.2, X[0] + 1.6)), headR: 2 * span(q, X[0], X[0] + .6) });
    } else if (q >= S1.two2 && q < S1.tch3) {   // "Aliens": a forefinger straight up, eyes up with it
      const up = span(q, X[1] - .15, X[1] + .35), dn = span(q, X[1] + 1.4, X[1] + 1.8);
      Object.assign(gest, { armR: 150 * up * (1 - dn), eyeY: -.7 * up * (1 - dn), headR: -3 * up * (1 - dn) });
    } else if (q >= S1.two3 && q < S1.cu) {   // "My dog ate it": both hands out, palms up: what can I do
      const o = span(q, X[2] - .15, X[2] + .3) * (1 - span(q, X[2] + 1.5, X[2] + 1.9));
      Object.assign(gest, { armR: 58 * o, armL: 58 * o, headR: 4 * o, brow: .4 * o });
    }
    if (bc) {   // the silence: eyes slide left, back, a blink, then "Yet." and the smug face
      const away = between(q, 27.5, 28.3) ? -1 : between(q, 28.3, 28.5) ? -.4 : 0;
      Object.assign(gest, { eyeX: away, look: away * .3, eyeY: between(q, 28.9, 29.4) ? -.3 : 0, headR: q > 29.8 ? -3 : 0, brow: q > 29.55 ? -.3 : 0 });
    }
    const boMouth = bc && q > 29.95 ? 'smile' : mouth('s02b', 's02d', 's02f', 's03b');
    c.bo.pose({ ...(sit ? c.BO : c.BO_UP), ...gest, sit, lids: bc ? .45 : sm ? .2 : .3, mouth: sm ? (q > S1.smug + .5 ? 'smile' : 'X') : boMouth,
      shut: blinking(q, [2.4, 5.9, 12.2, 18.9, 23.6, 27.0, 28.7, 31.4]) }, f);

    // Me, left: writing in the first two-shot, then a bigger reaction to each excuse
    const k = X.filter(x => q >= x - .1).length, kx = X[Math.max(0, k - 1)];
    const me = { ...c.ME, sit: true, look: 0, eyeX: 0, eyeY: 0, lids: .1, mouth: 'flat', brow: 0, headR: 0, armL: 0, armR: 0, hold: null, holdL: null,
      shut: blinking(q, [3.3, 8.5, 14.3, 21.5]) };
    if (q < S1.tch1) {   // head bent over a sheet, pencil scratching; one glance at Bo at the cut back (5.9–6.9)
      const gl = between(q, S1.two0b + .2, S1.two0b + 1.2);
      Object.assign(me, { holdL: 'pen', armR: -30, armL: -62 + 7 * onTwos(q), eyeY: gl ? 0 : .8, eyeX: gl ? 1 : 0, look: gl ? .5 : .2, lids: gl ? .25 : .15,
        headR: gl ? 0 : 2, mouth: gl ? 'flat' : 'chew', shut: blinking(q, [3.3, 6.7]) });
    } else if (k > 0) {
      const dt = q - kx;
      if (k === 1) Object.assign(me, { look: .5 * span(q, kx, kx + .2), eyeX: dt < 1.4 ? 1 : 0, lids: dt < 1.4 ? .3 : .22 });                    // a sideways look at Bo
      if (k === 2) Object.assign(me, { look: .5, eyeX: 1, eyeY: -.8 * span(q, kx, kx + .3) * (dt < 1.4 ? 1 : 0), lids: .3, brow: -.35, headR: 2, mouth: 'frown' });   // eyes follow the finger up, a frown
      if (k === 3) Object.assign(me, { look: .3 * (dt < .4), eyeX: dt < .4 ? 1 : 0, lids: .4, mouth: 'frown', brow: .3,
        shut: dt > .5 && dt < 1.3, headR: 4 * span(q, kx + .4, kx + .9), bob: 6 * span(q, kx + .4, kx + .9) });                                   // eyes shut, head sinks
    }
    c.me.pose(me, f);
  });
}
