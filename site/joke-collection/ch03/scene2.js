/* scene2.js — "Violence and superstition". Wide: the American walks to the cow's rear and lashes it (crack, shake);
   cow close-up: eyes wide, all four hooves leave the ground, MOOO!, lands, doesn't move, glares back; the Chinese man's
   close-up ("That's violence!"); the American's close-up, shrinking; wide: the Indian man walks round to the cow's
   front and prays, the cow sniffs him and chews; held silence (crickets), he peeks in close-up; the Chinese man's
   close-up ("That's superstition!") and a beat. Ends on that close-up; scene 3 opens on the wide. */
'use strict';
const PRE2 = 0.5;   // picture first: the American is already striding at the cow

// moments (scene time)
const T2 = {
  crack: 2.9,                        // the lash lands on the rump (the snap is 0.16 s into the sample)
  cowCU: 3.1,                        // cut to the cow mid-jump
  cnCU: clipAt('scene2', PRE2, 's06') - .05,     // the Chinese man's close-up, just before his line
  amCU: clipAt('scene2', PRE2, 's06', 2.4),      // after the line: the American shrinks
  wide: clipAt('scene2', PRE2, 's07') + .2,      // wide: back to the road (the Indian man is mid-walk, the American heads back)
  pray: clipAt('scene2', PRE2, 's07', 3.0),      // the Hindi starts here; his palms are together a moment before
  peek: clipAt('scene2', PRE2, 's07', 7.2),      // silence: close-up on the Indian man, he opens an eye
  cn2: clipAt('scene2', PRE2, 's08') + 3.0,      // the Chinese man's close-up, just before "That's superstition!"
};
sfx('scene2', T2.crack - .16, 'crack');
sfx('scene2', T2.crack + .35, 'thud', .6);            // the cow lands
sfx('scene2', clipAt('scene2', PRE2, 's08', .1), 'crickets');   // the silence after the prayer

function scene2(p, D) {
  const R = roadSet(p, 'road'), cam = R.cam;
  // cow CU keeps the rump in; the American's CU is centred on where he stands at the cow's rear
  const cuAm = { x: 620, y: 470, z: 2.4 }, cuCn = { x: 520, y: 470, z: 2.5 }, cuCow = { x: 1150, y: 520, z: 2.4 }, cuInd = { x: 1290, y: 500, z: 2.6 };
  cam.cut(FARM_WIDE, 0).cut(cuCow, T2.cowCU).soft(T2.cowCU, true).shake(T2.crack, .3, 6)
    .cut(cuCn, T2.cnCU).cut(cuAm, T2.amCU).cut(FARM_WIDE, T2.wide).soft(T2.wide, false)
    .cut(cuInd, T2.peek).soft(T2.peek, true).cut(cuCn, T2.cn2);
  cam.stage.insertBefore(R.cn.g, R.am.g); cam.stage.insertBefore(R.ind.g, R.am.g);   // the American walks in front of the others

  const s2hit = prop(cam.stage, '<g filter="url(#paper)" stroke-linecap="round"><path d="M-8,-62 L-4,-30 M30,-52 L14,-24 M52,-10 L22,-4 M-50,-44 L-26,-22 M44,30 L20,16" stroke="#fff6c8" stroke-width="9"/><path d="M0,-48 L0,-26 M26,-34 L14,-18 M-34,-30 L-18,-16" stroke="#f2c230" stroke-width="6"/></g>');
  const amX = q => q < 1.9 ? tween(q, 0, 1.9, FARM.am, 620) : q < T2.wide ? 620 : tween(q, T2.wide, 3.0, 620, FARM.am);
  const indX = q => tween(q, T2.wide, 2.3, 1000, 1460);   // already rounding the cow's flank when the wide returns

  stopClock(D, (q, f) => {
    cam.apply(q, f);
    const wk = spWalk(q), at = (a, b) => q >= a && q < b;

    /* --- the cow: stands chewing; jumps at the crack; lands, stares back; later sniffs the Indian man --- */
    const jump = at(T2.crack, T2.crack + .6) ? Math.sin(Math.PI * (q - T2.crack) / .6) : 0;   // up and down, 0.6 s
    const cow = { ...FARM.cow, x: FARM.cow.x + (at(T2.crack, T2.crack + .17) ? 16 : 0), y: FARM.cow.y - 70 * jump, splay: 22 * jump, jaw: .12 * onTwos(q) * (q < T2.crack ? 1 : 0), tail: 6 * onTwos(q), eyeX: 1,
      shut: blinking(q, [1.2, 7.4, 11.7, 17.5]) };
    if (q >= T2.crack) { Object.assign(cow, { lids: 0, shut: false, ear: 18, tail: 40, brow: q > T2.crack + 1 ? 1 : 0, eyeX: q > T2.crack + .8 ? -1 : 0, headR: tween(q, T2.crack, .3, 0, 12) });
      if (q > T2.crack + .6) cow.headR = tween(q, T2.crack + .6, .5, 12, 0); }
    if (q >= T2.crack && q < T2.wide) {
      const m = lips(q, 'scene2', PRE2, 's05');
      cow.jaw = m !== 'X' ? .9 : 0;
      if (q > T2.crack + 1.2 && m === 'X') cow.jaw = .1 * onTwos(q);
      if (q > T2.crack + 1.4) { cow.tail = 10 + 22 * (onTwos(q) > 0 ? 1 : 0); cow.ear = 6 * onTwos(q); }
    }
    if (q >= T2.wide) {   // the Indian man arrives at 12.0: the cow lowers its head, sniffs, blinks, chews
      const arr = T2.wide + 2.3, d = span(q, arr, arr + .8);
      Object.assign(cow, { brow: 0, eyeX: tween(q, T2.wide, .6, -1, 1), ear: 0, tail: 5 * onTwos(q), headR: -24 * d + (q > arr + .8 && q < arr + 2 ? -3 * onTwos(q) : 0) });
      cow.eyeY = q > arr + .8 && q < arr + 2 ? 1 : 0;
      if (q > arr + 2.2) { cow.jaw = .14 * onTwos(q); cow.headR = -24 * (1 - span(q, arr + 3, arr + 3.8) * .5); }
      cow.shut = blinking(q, [arr + 2, arr + 5.1, 19.0, 20.6]);
    }
    R.cow.pose(cow, f);

    /* --- the American: strides to the rear, whirls and cracks; shrinks; walks back to 300 --- */
    const phase = q < 1.9 ? -1 : q < T2.crack ? Math.min(.999, q < 2.45 ? .6 * (q - 1.9) / .55 : .6 + .4 * (q - 2.45) / (T2.crack - 2.45)) : q < T2.crack + .17 ? 1 : -1;
    const walking = q < 2.0 || q >= T2.wide;
    const sad = at(T2.crack + .5, T2.wide + .05);
    const am = { x: amX(q), y: FARM.ground + 20 * (q < 1.9 ? span(q, 0, 1) : q < T2.wide ? 1 : 1 - span(q, T2.wide, T2.wide + 3)), s: FARM.s, hold: 'whip', look: .6, eyeX: 1, mouth: 'smile', shut: blinking(q, [1.7, 5.3, 9.0, 13.2, 15.7]),
      armR: q < 2.0 ? 90 : 20 };
    if (walking) Object.assign(am, { legL: wk.legL, legR: wk.legR, bob: wk.bob, armL: wk.armL });
    if (walking && q < 2.0) am.armR = 90 + wk.armR;           // the whip arm is cocked, half up, as he strides
    if (q >= 1.9 && q < T2.crack + .17) am.armR = phase < .6 ? tween(phase, 0, .6, 90, 150) : tween(phase, .6, .4, 150, 60);
    if (q >= T2.crack + .17 && q < T2.crack + .5) am.armR = tween(q, T2.crack + .17, .33, 60, 20);
    if (q >= T2.crack) am.mouth = 'smile';
    if (sad) Object.assign(am, { mouth: 'frown', brow: 1, squash: .1 * span(q, T2.crack + 1.5, T2.amCU + .5), headR: -4, look: q < T2.wide ? -.3 : .5, eyeX: -.6, lids: .3, armR: 8 });
    if (q >= T2.cnCU && q < T2.wide) am.look = -.4;   // watching the Chinese man
    if (q >= T2.wide) Object.assign(am, { look: -.9, eyeX: -1, mouth: 'flat', brow: .6, squash: 0, headR: 0, armR: 4 + wk.armR });
    if (q >= T2.wide + 3.0) Object.assign(am, { look: .5, eyeX: 1, ...(({ legL, legR, bob }) => ({ legL: 0, legR: 0, bob: 0, armL: 0, armR: 6 }))(wk) });
    R.am.pose(am, f);
    const [hx, hy] = handAt(R.am, am, 'R');
    R.lash.pose({ hx, hy: hy - 46 * FARM.s, phase, on: q >= 1.9 && q < T2.wide + 3.1, tx: 900, ty: 560 });
    // a paper impact mark on the rump for 3 frames from the crack
    vis(s2hit, at(T2.crack, T2.crack + .25)); tf(s2hit, `translate(900,560) scale(${(1 + .2 * onTwos(q)).toFixed(2)})`);

    /* --- the Chinese man: watches, points and says "violence"; later "superstition" --- */
    const cn = { x: FARM.cn, y: FARM.ground, s: FARM.s, mouth: 'X', look: .6, eyeX: 1, brow: 0, shut: blinking(q, [1.0, 4.6, 8.0, 12.6, 15.0, 18.4]) };
    if (q > 5.0 && q < T2.cnCU + .5) Object.assign(cn, { brow: -1, mouth: 'flat' });
    if (at(T2.cnCU, T2.amCU)) Object.assign(cn, { look: .5, eyeX: 1, brow: -1, mouth: lips(q, 'scene2', PRE2, 's06') === 'X' ? 'frown' : lips(q, 'scene2', PRE2, 's06'),
      armR: tween(q, T2.cnCU, .4, 0, 88) + 3 * onTwos(q), headR: -3 + 2 * onTwos(q) });
    if (at(T2.amCU, T2.wide)) Object.assign(cn, { look: .5, brow: -.5, armR: 88, mouth: 'frown' });
    if (q >= T2.wide) Object.assign(cn, { look: .7, eyeX: 1, armR: tween(q, T2.wide, .6, 88, 0), mouth: 'flat', brow: -.5 });
    if (q >= T2.cn2 - .4) {   // shaking his head, pointing across at the Indian man
      const sh = q >= T2.cn2 ? Math.sin((q - T2.cn2) * 9) * 6 : 0;
      Object.assign(cn, { look: .7 + .1 * Math.sin((q - T2.cn2) * 9), eyeX: 1, brow: -1, armR: tween(q, T2.cn2 - .3, .35, 0, 90), headR: sh,
        mouth: lips(q, 'scene2', PRE2, 's08') === 'X' ? (q > clipAt('scene2', PRE2, 's08', 5.2) ? 'flat' : 'frown') : lips(q, 'scene2', PRE2, 's08') });
      if (q >= clipAt('scene2', PRE2, 's08', 5.3)) Object.assign(cn, { headR: 0, look: .7, brow: -.6 });   // the beat: arm still out, jaw set
    }
    R.cn.pose(cn, f);

    /* --- the Indian man: listens; rounds the cow; prays; opens an eye --- */
    const ind = { x: FARM.ind, y: FARM.ground, s: FARM.s, look: -.5, eyeX: -1, mouth: 'flat', shut: blinking(q, [1.5, 5.8, 8.6]) };
    if (q >= T2.wide) {
      const arr = T2.wide + 2.3, walk = q < arr;
      // round the cow's front: from behind-the-flank (y 620) down toward us and back up to the ground line
      const yy = FARM.ground + 40 * Math.sin(Math.PI * Math.min(1, (q - T2.wide) / 2.3));
      Object.assign(ind, { x: indX(q), y: yy, look: walk ? 1 : -.8, eyeX: walk ? 1 : -1, ...(walk ? wk : { legL: 0, legR: 0, bob: 0 }) });
      if (walk) { ind.armR = wk.armR; ind.armL = wk.armL; }
      else {
        const turn = span(q, arr, arr + .5), palms = span(q, arr + .3, arr + .8);
        ind.look = -.8 * turn; ind.armL = ind.armR = -115 * palms;
        ind.shut = q > arr + .7; ind.mouth = q >= T2.pray - .1 ? ((lips(q, 'scene2', PRE2, 's07') === 'X') ? 'flat' : lips(q, 'scene2', PRE2, 's07')) : 'flat';
        ind.brow = .3; ind.headR = q > T2.pray ? 3 * Math.sin(q * 2) : 0;
        // the silence: a peek with one eye (shut -> lids .6 looking at the cow), then a full look
        if (q >= T2.peek + .5) { ind.shut = false; ind.lids = q < T2.peek + 1.5 ? .6 : 0; ind.eyeX = -1; }
        if (q >= T2.peek + 1.7) { ind.shut = false; ind.lids = 0; ind.eyeX = -1; ind.mouth = 'flat'; ind.brow = -.2; ind.eyeY = -.2; }
        if (q >= T2.peek + 2.3) { ind.armL = ind.armR = -115 * (1 - span(q, T2.peek + 2.3, T2.peek + 2.8)); ind.brow = -.4; }
      }
    }
    R.ind.pose(ind, f);

    // who is on screen: the camera root is the same set throughout; the cow close-up leaves the rest in the frame edges
  });
}
