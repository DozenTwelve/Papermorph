/* scene1.js — "The cow won't move". Road wide (cow chewing, men glance as named), cow close-up ("Moo."), wide again
   (they argue in mime), the American's close-up ("Easy." — he draws the whip — "Watch this."). Ends on his smirk. */
'use strict';
const PRE1 = 1.0, PREN1 = PRE1;
const N1 = { cowCU: 9.45, wide2: 12.7, amCU: 19.45, hole: clipAt('scene1', PREN1, 's04', 1.2) };
sfx('scene1', 9.22, 'whoosh', .25);

// a man shrugs (both arms out, a little bounce) or scratches his head (screen-right arm up, small scrubbing)
const s1shrug = (q, t0) => { const u = span(q, t0, t0 + .25) * (1 - span(q, t0 + .7, t0 + 1)); return { armL: 55 * u, armR: 55 * u, headR: 5 * u, bob: -3 * u }; };
const s1scratch = (q, t0) => { const u = span(q, t0, t0 + .3) * (1 - span(q, t0 + 1.1, t0 + 1.4)); return { armR: 150 * u + 6 * u * onTwos(q), headR: -3 * u }; };

function scene1(p, D) {
  const R = roadSet(p, 'road');
  const cam = R.cam;
  // 1.1 wide  1.2 cow close-up  1.3 wide  1.4 American close-up
  cam.cut(FARM_WIDE, 0).to({ x: 1150, y: 540, z: 1.75 }, N1.cowCU - .25, .22).cut(FCU.cow, N1.cowCU).soft(N1.cowCU, true).cut(FARM_WIDE, N1.wide2).soft(N1.wide2, false)
    .cut({ x: 320, y: 540, z: 2.3 }, N1.amCU).soft(N1.amCU, true);
  const b = (q, ...t) => blinking(q, t);
  stopClock(D, (q, f) => {
    cam.apply(q, f);
    const cuCow = q >= N1.cowCU && q < N1.wide2, cuAm = q >= N1.amCU;
    const sp = lips(q, 'scene1', PREN1, 's02');

    /* --- the cow: chews, flicks its tail and ear; turns its eye to the men, "Moo.", looks away, chews on --- */
    const look = tween(q, 8.2, .8, 0, 1) - tween(q, 10.9, .6, 0, 1) * 0;   // 0 = forward
    const turn = span(q, 8.3, 9.3) * (1 - span(q, 11.2, 12));            // eye + head swing toward the men
    const moo = sp !== 'X' && sp !== undefined;
    const mouthy = q >= 11.09 && q < 11.92 ? .9 : (Math.floor(q * 6) % 2 ? .22 : .04) * (turn > .5 && q < 11.2 ? 0 : 1);
    R.cow.pose({ ...FARM.cow, jaw: mouthy, eyeX: 1 - 2 * turn, headR: -3 + 5 * turn, ear: 8 * Math.sin(q * 3.1) * (q % 4 < 1 ? 1 : .2),
      tail: 14 * Math.sin(q * 2.4) + 8 * Math.sin(q * 5.3), shut: b(q, 2.2, 5.6, 7.7, 12.4, 15.5, 20.1), lids: turn * .25 }, f);

    /* --- the men: in a row, looking at the cow; a nod as each is named; mime argument from 12.9 --- */
    const nod = t0 => { const u = span(q, t0, t0 + .15) * (1 - span(q, t0 + .3, t0 + .5)); return { headR: -5 * u, bob: 3 * u }; };
    const base = { y: FARM.ground, s: FARM.s, eyeX: 1, mouth: 'flat' };
    const am = { ...base, x: FARM.am, look: .55, shut: b(q, 3.4, 8.8, 14.6, 17.4), ...nod(clipAt('scene1', PREN1, 's01', 2.52)) };
    const cn = { ...base, x: FARM.cn, look: .55, shut: b(q, 2.1, 7.1, 13.3, 16.2), ...nod(clipAt('scene1', PREN1, 's01', .23)) };
    const ind = { ...base, x: FARM.ind, look: .55, shut: b(q, 4.6, 6.4, 11.9, 17.9), ...nod(clipAt('scene1', PREN1, 's01', 1.5)) };
    if (q < N1.cowCU) {   // arms tucked in; now and then a glance at the cow or a neighbour
      [am, cn, ind].forEach(m => { m.armL = -6; m.armR = -6; });
      const g = (a, b) => q >= a && q < b;
      if (g(1.6, 2.6)) { cn.eyeX = 1; cn.look = .8; }
      if (g(3.0, 4.0)) { cn.eyeX = -1; cn.look = -.6; ind.eyeX = -1; ind.look = -.6; }
      if (g(4.2, 5.2)) { am.eyeX = 1; am.look = .8; }
      if (g(6.2, 7.2)) { ind.eyeX = 1; ind.look = .9; cn.eyeX = 1; cn.look = .9; }
      if (g(7.6, 8.4)) { am.eyeX = 1; am.look = .8; am.armR = 6; }
    }
    if (q > 3.6 && q < 8.0) { cn.eyeX = 1; if (q > 5.6) { ind.brow = .3; } }
    // 1.2: they turn to look at the cow's eye, a flinch when it moos
    if (q >= 8.6 && q < 12.7) { cn.brow = .4; ind.brow = .4; am.brow = .3; if (q > 9.9 && q < 11) { cn.headR = -3; am.headR = -3; ind.headR = -3; } }
    // 1.3: they look at one another, shrug, scratch; the heads turn toward whoever "speaks"
    const A = q - 13.0;
    if (q >= 12.9 && q < N1.amCU) {
      const seq = Math.floor(Math.max(0, A) / 1.5) % 3;   // who is "talking" now: 0 Chinese, 1 Indian, 2 American
      const sw = Math.floor(Math.max(0, A) / 1.5);
      Object.assign(cn, { look: seq === 1 ? .8 : seq === 2 ? -.8 : -.2, eyeX: seq === 1 ? 1 : -1, brow: seq === 0 ? -.5 : 0 });
      Object.assign(ind, { look: seq === 0 ? -.8 : seq === 2 ? .8 : .2, eyeX: seq === 0 ? -1 : seq === 2 ? 1 : 0, brow: seq === 1 ? -.4 : 0 });
      Object.assign(am, { look: seq === 0 ? .8 : seq === 1 ? .6 : .3, eyeX: 1, brow: seq === 2 ? -.5 : 0 });
      if (seq === 0 && A < 4.5) Object.assign(cn, { armR: 80 + 8 * onTwos(q), armL: 30 }, { headR: 2 * onTwos(q) });   // the Chinese man gestures
      if (A > 0 && A < 1.5) Object.assign(ind, s1shrug(q, 13.2));
      if (A >= 1.5 && A < 3.0) Object.assign(ind, { armL: 60 + 10 * onTwos(q), armR: 60 - 10 * onTwos(q), headR: 3 * onTwos(q) });
      if (A >= 3.0 && A < 4.5) Object.assign(am, s1shrug(q, 16.2));
      if (A >= 3.0 && A < 4.3) Object.assign(cn, s1scratch(q, 16.1));
      if (A >= 4.5 && A < 6.4) { Object.assign(am, { look: .2, eyeX: .5 }); Object.assign(ind, s1scratch(q, 17.6)); }
      if (sw >= 4) Object.assign(am, { mouth: 'smile', brow: 0 });   // the American is thinking of something
    }

    /* --- 1.4 the American: a grin, "Easy.", draws the whip in the hole, "Watch this." --- */
    const t = q - N1.amCU, draw = span(q, N1.hole - .05, N1.hole + .75);
    const easy = lips(q, 'scene1', PREN1, 's04');
    const aCU = { ...am, look: 0, eyeX: 0, shut: b(q, N1.amCU + 1.3, N1.hole + 1.6), brow: 0, lids: .1,
      mouth: q < N1.hole - .1 ? (easy !== 'X' ? easy : 'grin') : (q > N1.hole + 1 && easy === 'X' ? 'grin' : easy !== 'X' ? easy : 'smile'),
      armR: 10 + 12 * draw + (q > 21.5 && q < 22.6 ? 5 * Math.sin((q - 21.5) * 22) : 0), headR: 2 * Math.sin(Math.min(1, t) * 3) * (1 - draw), hold: draw < .55 ? 'coil' : 'whip' };
    // D: the Chinese man turns to the American, doubtful on "Watch this."
    if (cuAm) Object.assign(cn, { look: -.6, eyeX: -1, brow: q > 21.4 ? -.3 : 0 });
    if (R.fwd !== cuAm) { R.fwd = cuAm; [R.am.g, ...R.lash.els].forEach(e => cuAm ? cam.stage.appendChild(e) : cam.stage.insertBefore(e, R.cn.g)); }   // close-up: he stands in front of the Chinese man
    const wasAm = cuAm ? aCU : am;
    if (cuAm) wasAm.eyeX = q < N1.hole ? 1 : 0.6;
    R.am.pose(q < N1.amCU ? { ...am, hold: 'coil', armR: am.armR ?? 6 } : wasAm, f);
    R.cn.pose(cn, f); R.ind.pose(ind, f);
    const pose = q < N1.amCU ? { ...am, hold: 'coil', armR: am.armR ?? 6 } : wasAm;
    const [hx, hy] = handAt(R.am, pose, 'R');
    R.lash.pose({ hx, hy: hy - 46 * FARM.s, phase: -1, on: pose.hold === 'whip', len: Math.min(1, .25 + span(q, 21.4, 21.65) * .75) });
  });
}
