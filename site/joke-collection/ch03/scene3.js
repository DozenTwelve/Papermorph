/* scene3.js — Of its own free will. The Chinese man walks off left (the other two glance at each other) and comes back
   with a rod and a bundle of hay; an INSERT close-up (hook, hay, two mittens knotting) for "tied the hay to the hook";
   a medium shot where he lashes the rod to the cow's back; the cow close-up (eyes cross the hay, two lunges, steps);
   then the wide follow: the cow trudges right, he struts beside it and says his line, the others trail behind, and
   all walk out right in the hush. Walks are slower than the series' 150 px/s so the wide can hold the whole speech. */
'use strict';
const PRE3 = 0.5;
const s3v = (clip, t = 0) => clipAt('scene3', PRE3, clip, t);
// word time w of s10 → beat time (silent holes: 0.4 s after 0.05, 1.6 s after 1.6)
const s3w = w => s3v('s10', w + (w >= .05 ? .4 : 0) + (w >= 1.6 ? 1.6 : 0));

/* ---------- timeline (beat time, s) ---------- */
const T3 = {
  fix: .6, away: 1.5, off: 5.1, back: 6.5,                 // he straightens his shirt, walks off left (gone at 5.1), returns from 6.5
  indGo: 9.0,                                              // the Indian man wanders left to watch
  insIn: s3w(.05) - .1, insOut: s3w(1.85) - .04,           // INSERT close-up: from "He tied" to just before "and the rod"
  knot0: s3w(1.0), knot1: s3w(1.6) + 1.5, pull: 14.0,      // wraps on "to the hook", tightens in the hole
  med: s3w(1.85) - .04, lift: s3w(1.85) + .05, rodOn: s3w(2.9), medOut: 16.85,
  cu: 16.85, seeHay: 17.45, lunge1: 17.95, lunge2: 18.75, step1: 19.2, step2: 19.9, go: 20.3, wide: 20.5,
  talk: s3v('s11') + 5.1,                                  // the line starts here (after its 5 s hole)
  hush: s3v('hush2'),
};

/* ---------- helpers ---------- */
const s3k = (q, pts) => {   // eased piecewise keyframes [[t, v], …]
  if (q <= pts[0][0]) return pts[0][1];
  for (let i = 0; i < pts.length - 1; i++) if (q < pts[i + 1][0]) return pts[i][1] + (pts[i + 1][1] - pts[i][1]) * ease((q - pts[i][0]) / (pts[i + 1][0] - pts[i][0]));
  return pts[pts.length - 1][1];
};
const s3lin = (q, pts) => {   // linear piecewise
  if (q <= pts[0][0]) return pts[0][1];
  for (let i = 0; i < pts.length - 1; i++) if (q < pts[i + 1][0]) return pts[i][1] + (pts[i + 1][1] - pts[i][1]) * (q - pts[i][0]) / (pts[i + 1][0] - pts[i][0]);
  return pts[pts.length - 1][1];
};
const s3flick = (q, k, amp = .12) => amp * jit(Math.floor(q * 2.5), k);
// the cow's x: still, two small steps, then a trudge that gains pace (velocity keyframes integrated once)
const S3_V = [[0, 0], [T3.step1, 0], [T3.step1 + .2, 100], [T3.step1 + .4, 0], [T3.step2, 0], [T3.step2 + .2, 100], [T3.step2 + .4, 0],
  [T3.go, 0], [T3.go + .3, 55], [27.2, 55], [28.0, 400], [40, 400]];   // a slow trudge keeps the cow in frame to the end of the line (27.3), then they hurry off, all out of frame before the cut
const S3_X = (() => { const a = [FARM.cow.x]; for (let i = 1; i <= 32 * 120; i++) a.push(i / 120 >= T3.cu && (i - 1) / 120 < T3.cu ? 760 : a[i - 1] + s3lin(i / 120, S3_V) / 120); return a; })();   // the cow is re-placed (760) at the cut to its close-up
const s3cowX = q => S3_X[Math.max(0, Math.min(S3_X.length - 1, Math.round(q * 120)))];
sfx('scene3', T3.step1 - .1, 'clop'); for (let t = T3.step1 - .1 + 2; t < 31 && s3cowX(t) - 175 < 1600; t += 2) sfx('scene3', t, 'clop', .8);   // the clops stop when the cow has left the frame
const s3moving = (fn, q) => Math.abs(fn(q) - fn(q - .12)) > 3 && Math.abs(fn(q) - fn(q - .12)) < 40;
// a figure that walks 150 px/s along a path from t0, never past its target
const s3follow = (x0, t0, target) => q => Math.min(x0 + 150 * Math.max(0, q - t0), target(q));
// the men's walk, driven by ground covered (feet stay planted), in four poses per two steps: one leg swings out toward the way he
// goes (dir +1 right, -1 left) while the other stands, then both vertical with the body up (pass), then the other leg steps, then pass.
// One pose per 30 px; the arms swing against the stepping leg. amp < 1 shortens the swing for the last slow steps.
const s3walk = (x, amp = 1, dir = 1) => {
  const ph = ((Math.floor(x / 30) % 4) + 4) % 4, s = [1, 0, -1, 0][ph], a = 20 * amp * -dir;   // a leg turns by -a·dir to go right
  return { legL: s > 0 ? a : 0, legR: s < 0 ? -a : 0, bob: ph % 2 ? -5 : 0, armL: 12 * s * amp, armR: -12 * s * amp, k: s };
};

/* ---------- the insert: hook, hay and two mittens on a blurred road ---------- */
function s3insert(p) {
  const g0 = mk('g', {}, p), g = mk('g', { transform: 'translate(800,200) scale(1.7) translate(-800,-200)' }, g0), HX = 800, TIE = 340;
  g.innerHTML = '<rect width="1600" height="900" fill="#1d1a1a" opacity=".18"/>';
  const line = mk('path', { d: `M${HX},-20 V${TIE - 70}`, stroke: '#3a3430', 'stroke-width': 5, fill: 'none' }, g);
  const hook = prop(g, `<g filter="url(#paper)"><circle cy="0" r="13" fill="none" stroke="#5a5f66" stroke-width="7"/><path d="M0,13 V120 Q0,190 -60,176 Q-96,166 -90,128 L-70,150" fill="none" stroke="#5a5f66" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M0,13 V120 Q0,190 -60,176 Q-96,166 -90,128 L-70,150" fill="none" stroke="#c4cad2" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/></g>`);
  const hay = prop(g, `<g transform="scale(1.45)">${haySVG}</g>`);
  const wrap = mk('g', {}, g);
  for (let i = 0; i < 3; i++) mk('path', { d: `M${HX - 26},${TIE + 8 + i * 12} q26,12 52,0`, stroke: '#b08a50', 'stroke-width': 7, fill: 'none', 'stroke-linecap': 'round' }, wrap);
  const knot = prop(g, `<g filter="url(#paper)"><circle r="14" fill="#b08a50"/><path d="M-4,8 q-10,26 -22,34 M4,8 q10,26 22,30" stroke="#b08a50" stroke-width="6" fill="none" stroke-linecap="round"/></g>`);
  const hand = side => {
    const m = mk('g', {}, g), sleeve = mk('path', { stroke: '#b9d0e6', 'stroke-width': 64, 'stroke-linecap': 'round', fill: 'none' }, m);
    const mit = prop(m, `<g filter="url(#paper)"><circle r="36" fill="#f2efe6"/><ellipse cx="${side * -28}" cy="-12" rx="14" ry="20" fill="#f2efe6"/></g>`);
    return { m, sleeve, mit };
  };
  const L = hand(1), R = hand(-1);
  return { g, pose(q) {
    vis(g0, q >= T3.insIn && q < T3.insOut); if (q < T3.insIn || q >= T3.insOut) return;
    const hayIn = span(q, T3.insIn, T3.insIn + .55), wr = span(q, T3.knot0, T3.knot1), pull = span(q, T3.pull, T3.pull + .35), away = span(q, T3.pull + .35, T3.pull + 1.0);
    // the hook sways a little as it is handled
    const sway = 2.5 * Math.sin((q - T3.insIn) * 5) * (1 - span(q, T3.pull + .5, T3.pull + 2.2));
    tf(hook, `translate(${HX},${TIE - 70}) rotate(${sway.toFixed(2)})`);
    // the left mitten pinches the hook's shank; the right carries the hay in, circles round the shank, then pulls
    const a = wr * Math.PI * 6 + 1.2;
    let rx = 1580 + (HX + 58 - 1580) * hayIn, ry = 560 + (TIE + 30 - 560) * hayIn;
    if (wr > 0) { rx = HX + 52 * Math.cos(a) * (1 - pull * .5); ry = TIE + 12 + 20 * Math.sin(a); }
    const dig = onTwos(q) * 4 * (wr > 0 && wr < 1 ? 1 : 0);
    let lx = -80 + (HX - 52 + 80) * span(q, T3.insIn - .1, T3.insIn + .4), ly = TIE - 18 + dig;
    ry += 22 * pull; lx -= 70 * away; rx += 110 * away; ry += 60 * away; ly -= 60 * away;
    // the hay hangs from the knot, swings once released
    const swing = 11 * Math.exp(-3 * Math.max(0, q - T3.pull - .4)) * Math.cos(Math.max(0, q - T3.pull - .4) * 9) * span(q, T3.pull + .3, T3.pull + .45);
    const hayLoopY = TIE + 44 + 18 * pull;
    const hx = hayIn < 1 ? rx - 35 : HX, hy = hayIn < 1 ? ry + 14 : hayLoopY;
    tf(hay, `translate(${hx.toFixed(1)},${hy.toFixed(1)}) rotate(${swing.toFixed(2)})`);
    vis(wrap, wr > .05); tf(wrap, `translate(0,${(8 * pull).toFixed(1)})`);
    for (let i = 0; i < 3; i++) vis(wrap.children[i], wr > .25 + i * .22);
    vis(knot, wr >= 1); tf(knot, `translate(${HX},${TIE + 26 + 8 * pull})`);
    // mittens with sleeves running off the screen edges
    tf(L.mit, `translate(${lx.toFixed(1)},${ly.toFixed(1)})`); L.sleeve.setAttribute('d', `M${lx - 80},760 L${lx - 6},${ly + 28}`);
    tf(R.mit, `translate(${rx.toFixed(1)},${ry.toFixed(1)})`); R.sleeve.setAttribute('d', `M${rx + 80},760 L${rx + 6},${ry + 28}`);
  } };
}

function scene3(p, D) {
  const R = roadSet(p, 'road'), cam = R.cam, ins = s3insert(p), who = [R.cow, R.am, R.cn, R.ind];
  // the carried rod is drawn here (not as a held prop, which can't tilt): up-right from his hand, the hay hanging from its tip;
  // in the last half second he lowers it onto the cow's back, base and tip sliding to the cow's rod, so the swap is seamless
  const rg = mk('g', {}, cam.stage), rodL = mk('path', { stroke: '#3a2a1a', 'stroke-width': 7, 'stroke-linecap': 'round', fill: 'none' }, rg),
    reel = mk('circle', { r: 12, fill: '#9aa0a8' }, rg), rgLine = mk('path', { stroke: '#3a3430', 'stroke-width': 2, fill: 'none' }, rg),
    rgHay = prop(rg, haySVG);
  const MED = { x: 1060, y: 560, z: 1.5 }, INS = { x: 800, y: 450, z: 1 };
  // 3.1 wide: he leaves, the others glance, he returns   INSERT: the knot   3.2 medium: the rod   3.3 cow close-up   3.4 wide follow
  cam.cut(FARM_WIDE, 0)
    .cut(INS, T3.insIn).soft(T3.insIn, 'all')
    .cut(MED, T3.med).soft(T3.med, false)
    .cut({ x: t => s3cowX(t) + 215, y: 545, z: 2.8 }, T3.cu).soft(T3.cu, true)
    .cut({ x: t => Math.min(960, Math.max(650, s3cowX(t) - 150)), y: 520, z: 1.25 }, T3.wide).soft(T3.wide, false);   // follows the cow, then locks

  // where everyone is (functions of time)
  const cnX = q => q < T3.away ? 500 : q < T3.back ? Math.max(-120, 500 - 150 * (q - T3.away)) : q < T3.cu ? Math.min(875, -40 + 150 * (q - T3.back)) : s3cowX(q) - 200;
  const indX = q => q < T3.indGo ? 1460 : q < T3.cu ? Math.max(400, 1460 - 150 * (q - T3.indGo)) : s3cowX(q) - 430;
  const amX = q => q < T3.cu ? 300 : s3cowX(q) - 660;
  const speaking = q => q >= T3.talk - .05 && q < 27.5 && lips(q, 'scene3', PRE3, 's11') !== 'X';   // the whole line, driven by the lip data
  const talkOver = 27.5;
  // draw order: cow, Chinese man, rod, American (he walks behind the American), the Indian man (above the rod); he walks behind the cow while crossing it
  for (const e of [R.cn.g, rg, R.am.g, R.ind.g]) cam.stage.appendChild(e);
  const indBehind = q => q < T3.cu && indX(q) < 1450 && indX(q) > 780;

  stopClock(D, (q, f) => {
    cam.apply(q, f);
    const inIns = q >= T3.insIn && q < T3.insOut;
    ins.pose(q); for (const w of who) vis(w.g, !inIns);
    vis(R.cn.g, !inIns && !(q >= T3.cu && q < T3.wide));
    const wf = f - f % 4;   // the cow's walk swaps every 4 frames

    /* ---------- the cow ---------- */
    const cx = s3cowX(q), cwalk = q > T3.step1 && s3moving(s3cowX, q) || q > T3.go;
    const lunge = (t0, d, a) => between(q, t0, t0 + d) ? Math.sin(Math.PI * (q - t0) / d) * a : 0;
    const reach = q >= T3.wide ? lunge(21.2 + 1.9 * Math.floor((q - 21.2) / 1.9), .6, 1) : 0;
    const hay = Math.max(lunge(T3.lunge1, .5, 1), lunge(T3.lunge2, .6, 1), reach);
    const sees = q >= T3.seeHay, rodOn = q >= T3.rodOn;
    const chewing = !sees || q > T3.wide, flick = Math.floor(q * 3) % 2 ? 1 : 0;
    const cowEye = q < T3.cu ? (q > 7.2 && q < 10.2 ? { eyeX: -1, eyeY: 0 } : { eyeX: 0, eyeY: 0 })   // watches the man walk by
      : q < T3.seeHay ? { eyeX: 0, eyeY: 0 } : { eyeX: 1, eyeY: .4 * span(q, T3.seeHay, T3.seeHay + .25) };
    const swing = rodOn ? (q > T3.cu ? 4 * Math.sin((q - T3.cu) * 3) * .3 : 0) + (hay ? -0 : 0)
      + 16 * Math.exp(-2.5 * Math.max(0, q - T3.lunge1 - .25)) * (q > T3.lunge1 + .25 && q < T3.lunge2 ? 1 : 0)
      + 20 * Math.exp(-2.5 * Math.max(0, q - T3.lunge2 - .3)) * (q > T3.lunge2 + .3 && q < T3.step1 ? 1 : 0)
      + (q > T3.step1 ? 2.5 * Math.sin((q - T3.step1) * 5) * (cwalk ? 1 : 0) : 0) + (q > T3.wide ? 14 * hay + 6 * Math.sin((q - T3.wide) * 4) : 0) : 0;
    R.cow.pose({ ...FARM.cow, x: cx, ...cowEye, rod: rodOn, walk: cwalk, bob: cwalk ? -3 * (Math.floor(q * 3) % 2) : 0,
      jaw: hay > 0 ? .55 * hay + .1 : chewing ? (Math.floor(q * 3.5) % 2 ? .13 : 0) : (q > T3.lunge2 + .6 && q < T3.step1 ? .08 : 0),
      headR: -7 * hay + (sees && !hay ? -1.5 : 0), brow: 0,
      tail: 12 * Math.sin(q * 1.7) + (cwalk ? 8 * Math.sin(q * 4) : 0), ear: flick && Math.floor(q) % 3 === 0 ? 14 : 0,
      shut: blinking(q, [1.6, 4.4, 7.9, 12.1, 15.8, 18.2, 22.0, 26.3, 29.4]), lids: 0, swing }, cwalk ? wf : f);

    /* ---------- the Chinese man ---------- */
    const cn = cnX(q), cnWalk = s3moving(cnX, q), w = cnWalk ? s3walk(cn, 1, Math.sign(cn - cnX(q - .1)) || 1) : {};
    const tidy = between(q, T3.fix, T3.away), lifting = between(q, T3.lift, T3.rodOn), winding = between(q, T3.rodOn - .6, T3.medOut);
    const rodHeld = q >= T3.back && q < T3.rodOn, hayHeld = q >= T3.back && q < T3.insIn;
    const tug = tidy ? s3k(q, [[T3.fix, 0], [T3.fix + .25, -40], [T3.fix + .5, 10], [T3.fix + .75, -40], [T3.fix + 1.0, 0]]) : 0;
    let aR = tug, aL = tidy ? tug : 0;   // both hands smooth the shirt
    if (q >= T3.back && q < T3.cu) { aR = 22; aL = 28; }
    if (lifting) { aR = s3k(q, [[T3.lift, 22], [T3.lift + .5, 118], [T3.rodOn, 100]]); aL = s3k(q, [[T3.lift, 28], [T3.lift + .5, 100], [T3.rodOn, 88]]); }
    if (q >= T3.rodOn - .01 && q < T3.medOut) { const ph = (q - T3.rodOn) * 7; aR = 85 + 28 * Math.sin(ph); aL = 85 + 28 * Math.sin(ph + Math.PI); }
    let cnPose, cnLook;
    if (q < T3.cu) cnLook = q < T3.away ? { look: .2, eyeX: .3 } : q < T3.back ? { look: -1, eyeX: -1 } : q < T3.med ? { look: .9, eyeX: 1 } : { look: .5, eyeX: 1, eyeY: .35 };
    else if (q < T3.talk - .3) cnLook = { look: -.2, eyeX: 0 };   // proud, eyes front
    else cnLook = { look: -.9 * span(q, T3.talk + 1.1, T3.talk + 1.4), eyeX: -1 * span(q, T3.talk + 1.1, T3.talk + 1.4) };
    const strut = q >= T3.cu;
    cnPose = { x: cn, y: FARM.ground + (strut ? 12 : 0) - (q < T3.cu ? 22 * Math.max(0, Math.min(1, (460 - cn) / 70)) : 0),   // farther back while he passes the American, so he walks behind him
      s: FARM.s, ...cnLook, ...w, armL: strut ? -20 : w.armL === undefined ? aL : aL, armR: strut ? -20 : aR,
      hold: null, holdL: hayHeld ? 'hay' : null, headR: strut ? 6 + (speaking(q) ? 3 * (Math.floor(q * 3) % 2) : 0) : 0, lids: strut ? .25 : 0, brow: strut ? 1 : 0,
      mouth: speaking(q) ? lips(q, 'scene3', PRE3, 's11') : (strut ? 'smile' : 'flat'), shut: blinking(q, [2.4, 8.9, 12.4, 17.6, 21.3, 24.9, 29.1]) };
    if (cnWalk && !strut) { cnPose.armR = aR + 3 * (w.k || 0); cnPose.armL = aL; }
    if (q >= T3.back && q < T3.cu) { cnPose.armR = lifting || winding ? aR : 22; cnPose.armL = lifting || winding ? aL : 28; }
    if (q >= T3.back && q < T3.rodOn - .6 && q >= T3.med) { cnPose.armR = lifting ? aR : 22; cnPose.armL = lifting ? aL : 28; }
    R.cn.pose(cnPose, f);
    const carry = q >= T3.back && q < T3.rodOn && !inIns; vis(rg, carry);
    if (carry) {
      const [h0, h1] = handAt(R.cn, cnPose, 'R'), u = ease(span(q, T3.rodOn - .5, T3.rodOn)), cs = FARM.cow.s, cwx = cx;
      const L = (a, b) => a + (b - a) * u, bx = L(h0 + FARM.s * 14, cwx - 60 * cs), by = L(h1 + FARM.s * 40, FARM.cow.y - 288 * cs),
        tx = L(h0 + FARM.s * 300, cwx + 372 * cs), ty = L(h1 - FARM.s * 270, FARM.cow.y - 500 * cs), sc = L(FARM.s, cs);
      rodL.setAttribute('d', `M${bx.toFixed(1)},${by.toFixed(1)} L${tx.toFixed(1)},${ty.toFixed(1)}`);
      tf(reel, `translate(${bx.toFixed(1)},${by.toFixed(1)})`);
      vis(rgLine, q >= T3.med); vis(rgHay, q >= T3.med);
      rgLine.setAttribute('d', `M${tx.toFixed(1)},${ty.toFixed(1)} v${(200 * sc).toFixed(1)}`);
      tf(rgHay, `translate(${tx.toFixed(1)},${(ty + 200 * sc).toFixed(1)}) scale(${sc.toFixed(3)})`);
    }

    /* ---------- the American ---------- */
    const am = amX(q), amWalk = s3moving(amX, q), aw = amWalk ? s3walk(am) : {};
    const toInd = between(q, 2.6, 4.6), tail = q >= T3.cu;
    const amPose = { x: am, y: FARM.ground, s: FARM.s, hold: 'coil', ...aw, armR: amWalk ? 14 + 4 * (aw.k || 0) : 14, armL: amWalk ? aw.armL : 0, bob: aw.bob || 0,
      look: toInd ? .9 : q < T3.back ? .4 : .5, eyeX: toInd ? 1 : q < 5.4 ? 0 : 1, eyeY: 0, shut: blinking(q, [3.3, 9.7, 13.1, 18.9, 23.6, 27.8]),
      mouth: tail ? 'O' : 'flat', lids: tail ? 0 : .12, brow: tail ? .35 : 0, headR: tail ? 3 : 0 };
    if (tail) { amPose.look = .7; amPose.eyeX = 1; amPose.eyeY = s3flick(q, 4, .1); }
    R.am.pose(amPose, f);
    const [hx, hy] = handAt(R.am, amPose, 'R');
    R.lash.pose({ hx, hy: hy - 46 * FARM.s, phase: -1, on: false });

    /* ---------- the Indian man ---------- */
    const ind = indX(q), indWalk = s3moving(indX, q), iw = indWalk ? s3walk(ind, 1, Math.sign(ind - indX(q - .1)) || 1) : {};
    const itail = q >= T3.cu, toAm = between(q, 2.6, 4.6);
    const indPose = { x: ind, y: FARM.ground, s: FARM.s, ...iw, armL: indWalk ? iw.armL : 0, armR: indWalk ? iw.armR : 0,
      look: toAm ? -.9 : indWalk && q < T3.cu ? -.8 : itail ? .6 : q < T3.back ? -.8 : -.5, eyeX: toAm ? -1 : indWalk && q < T3.cu ? -1 : itail ? 1 : -1,
      eyeY: itail ? .0 : 0, shut: blinking(q, [1.9, 6.1, 10.8, 15.0, 20.4, 25.2, 29.9]),
      mouth: itail ? 'O' : 'flat', brow: itail ? .4 : 0, lids: itail ? 0 : .1 };
    if (!indWalk && !itail && q > T3.back) indPose.look = -.5;
    R.ind.pose(indPose, f);
    const behind = indBehind(q); if (behind !== R.ind.behind) { R.ind.behind = behind; cam.stage.insertBefore(R.ind.g, behind ? R.cow.g : null); }
  });
}
