/* scene1.js — "Arrival". Gate wide (heat haze, the lane): Yui walks in with her suitcase, me behind her, Uncle Pedro
   comes out from the farmhouse waving; Yui bows (her first of the week); close on Yui for "four years of English…". */
'use strict';
const PRE1 = 1.0, S1 = TIMINGS.scene1;
const N1 = { bow: PRE1 + S1.marks['s01.by1'], s02: clipAt('scene1', PRE1, 's02'), cu: clipAt('scene1', PRE1, 's02') - .35 };

function scene1(p, D) {
  const R = gateSet(p), cam = R.cam;
  // 1.1 gate wide  1.2 Yui close-up
  cam.cut(BK.gateView, 0).cut(BK.gateYui, N1.cu).soft(N1.cu, true);
  const b = (q, ...t) => blinking(q, t);
  stopClock(D, (q, f) => {
    cam.apply(q, f);
    const cuYui = q >= N1.cu;
    const sp = lips(q, 'scene1', PRE1, 's01', 's02');

    /* --- the walk in: Yui with the suitcase, me behind; Pedro trots out from the house, waving --- */
    // gait rides the translations: standing frames keep resting legs so nobody slides
    const yuiWalk = spWalk(q, 2.2), meWalk = spWalk(q, 2.0);
    const yui = { x: 60 + 430 * span(q, .2, 3.1), y: BK.GROUND, s: .95, holdL: q < N1.bow + 1.4 ? 'case' : null,
      look: q > N1.bow - .4 && q < N1.bow + 2.2 ? 0 : 1, eyeX: 0, mouth: 'X', shut: b(q, .9, N1.bow + 1.9, 10.2) };
    if (q > .2 && q < 3.1) Object.assign(yui, yuiWalk, { armL: 6, armR: -8 });
    const me = { x: 30 + 300 * span(q, .3, 3.2), y: BK.GROUND, s: .92, look: .55, eyeX: 1, mouth: 'flat',
      shut: b(q, 2.4, 6.6, 9.8) };
    if (q > .3 && q < 3.2) Object.assign(me, meWalk, { armL: 8, armR: -8 });
    // Pedro: out from the house, waving the whole way, then both arms wide for the welcome
    const pedro = { x: 1560 - 350 * span(q, .3, 3.0), y: BK.GROUND, s: .92, look: -1, eyeX: -1,
      mouth: q < 4.9 ? 'grin' : 'smile', armR: 118 + 9 * onTwos(q), headR: -2,
      shut: b(q, 1.6, 5.4, 8.0, 11.4) };
    if (q > .3 && q < 3.0) Object.assign(pedro, spWalk(q, 2.4));   // leg cycle only while he moves
    if (q > 3.4 && q < 5.0) Object.assign(pedro, { armL: 55, armR: 55 });   // arms wide: ¡bienvenidos!

    /* --- Yui's first bow of the week, on "my cousin Yui" --- */
    const bow = span(q, N1.bow + .35, N1.bow + 1.05) * (1 - span(q, N1.bow + 2.3, N1.bow + 3.1));
    Object.assign(yui, { headR: 15 * bow, bob: 7 * bow, squash: .11 * bow, brow: .2 * bow });
    // me watches the bow; a little wave back to Pedro on "our farm in the south of Spain"
    if (between(q, 3.2, 4.9)) { me.look = -.85; me.eyeX = -1; }
    const wave = span(q, 4.4, 4.9) * (1 - span(q, 6.0, 6.6));
    Object.assign(me, { armR: 70 * wave, headR: 4 * wave, mouth: wave > .4 ? 'smile' : 'flat' });

    /* --- 1.2 on Yui: hopeful about her English, then a flicker of doubt on "Spain was going to test all of it" --- */
    if (cuYui) {
      yui.look = 0; yui.eyeX = 0;
      yui.mouth = sp !== 'X' ? sp : 'smile';
      yui.eyeY = -.25; yui.brow = q > N1.s02 + 1.9 ? .35 : 0;   // the doubt creeps in on the second sentence
      yui.headR = 2 * Math.sin(q * 1.4) * .6;
    }
    R.yui.pose(yui, f); R.me.pose(me, f); R.pedro.pose(pedro, f);
  });
}
