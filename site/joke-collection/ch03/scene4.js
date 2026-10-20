/* scene4.js — Lying flat. They walk in along road2 (cow first, rod on), the cow slows as it works it out, stops, looks at
   the hay, at us, sighs and lies down (thud: the march music stops); everybody stares; the Chinese man twitches, turns,
   storms over to the American and jabs a finger at him (camera shake); snap zoom to the American's "Me?"; title card. */
'use strict';
const PRE4 = 0.5;
const s4v = (clip, t = 0) => clipAt('scene4', PRE4, clip, t);

/* ---------- timeline (beat time, s) ---------- */
const S4 = {
  slow0: 6.3, stop: 10.5,                          // the cow slows during "However far it walked…" and stands
  cowCU: 10.35, hay: 10.5, us: 11.9, blink: 12.6, sigh: 13.9, lie0: 14.65, lie1: 15.45,   // 4.2
  wide: 15.95,                                     // 4.3 (s13 starts at s4v('s13'))
  cnCU: 20.9, turn: 22.8, two: 23.4, storm0: 23.45, storm1: 24.6, // 4.4, 4.5
  hands: 29.9, snap: 30.35, titleAt: 33.6,         // 4.6, 4.7
};
S4.shake = s4v('s14', 1.107 + 3.5);                // on 境外
window.S4_STOP = S4.lie1;
for (let t = .2; t < S4.stop - 1; t += 2) sfx('scene4', t, 'clop', t < 6 ? .8 : .5);
sfx('scene4', S4.lie1, 'thud');
sfx('scene4', S4.cnCU + .1, 'crickets');
sfx('scene4', S4.snap, 'whoosh');
sfx('scene4', S4.titleAt, 'sting');

/* ---------- the march: cow x(q) (X0 → 1000), 130 px/s then slowing to a stop ---------- */
const S4_V = 130, S4_SLOW = S4.stop - S4.slow0, S4_X0 = 1000 - S4_V * S4.slow0 - S4_V * S4_SLOW / 2;
function s4cowX(q) {
  if (q <= S4.slow0) return S4_X0 + S4_V * q;
  const u = Math.min(1, (q - S4.slow0) / S4_SLOW);
  return S4_X0 + S4_V * S4.slow0 + S4_V * S4_SLOW * (u / 2 + Math.sin(Math.PI * u) / (2 * Math.PI));
}
const s4moving = q => q < S4.stop - .25;
// Piecewise eased keyframes [[t, v], …].
const s4k = (q, pts) => {
  if (q <= pts[0][0]) return pts[0][1];
  for (let i = 0; i < pts.length - 1; i++) if (q < pts[i + 1][0]) return pts[i][1] + (pts[i + 1][1] - pts[i][1]) * ease((q - pts[i][0]) / (pts[i + 1][0] - pts[i][0]));
  return pts[pts.length - 1][1];
};
const s4flick = (q, k, amp = .12) => amp * jit(Math.floor(q * 2.5), k);   // tiny eye moves

function scene4(p, D) {
  const R = roadSet(p, 'road2'), cam = R.cam, card = titleCard(p);
  const CX = 1000, CN_END = CX - 250, AM_X = CX - 560, IND_X = CX - 730, AM_FACE = AM_X + 120;   // standing places after the stop (the Indian man clear of the signpost at x 190…356)
  const CU_COW = { x: 1200, y: 560, z: 2.4 }, CU_CN = { x: CN_END, y: 470, z: 2.4 }, TWO = { x: 620, y: 500, z: 1.6 }, CU_AM = { x: AM_X, y: 470, z: 2.4 };
  // 4.1 wide, they walk in   4.2 the cow's close-up   4.3 wide   4.4 the Chinese man   4.5 two-shot   4.6 snap zoom to the American
  cam.cut(FARM_WIDE, 0).cut(CU_COW, S4.cowCU).soft(S4.cowCU, true).cut(FARM_WIDE, S4.wide).soft(S4.wide, false)
    .cut(CU_CN, S4.cnCU).soft(S4.cnCU, true).cut(TWO, S4.two).soft(S4.two, false).shake(S4.shake, .8, 9)
    .to(CU_AM, S4.snap, .3).soft(S4.snap + .3, true);

  stopClock(D, (q, f) => {
    const title = q >= S4.titleAt;
    vis(cam.root, !title); vis(card, title);
    if (title) return;
    cam.apply(q, f);
    const cx = s4cowX(q), mv = s4moving(q), w = mv ? spWalk(q) : {}, lieU = span(q, S4.lie0, S4.lie1);
    R.lash.pose({ on: false });

    /* ---------- the cow ---------- */
    const reaching = q < S4.stop ? Math.min(1, (S4.stop - q) / 2) : 0;   // the neck stretches while it still hopes
    const sigh = between(q, S4.sigh, S4.lie0 + .1) ? Math.sin(Math.PI * span(q, S4.sigh, S4.lie0 + .1)) : 0;
    const standing = q >= S4.stop && q < S4.lie0;
    const eyeX = q < S4.us ? 1 : q < S4.lie0 ? 0 : 0;
    R.cow.pose({ ...FARM.cow, x: cx, rod: true, walk: mv, bob: mv ? (w.bob || 0) * .7 : 8 * sigh, lie: lieU,
      headR: 10 * reaching - 5 * sigh, jaw: mv && q < 8 ? .12 * (onTwos(q) > 0 ? 1 : 0) : .25 * sigh,
      eyeX: standing || q < S4.stop ? eyeX : 0, eyeY: lieU > 0 ? .2 : 0, swing: mv ? 7 + 3 * onTwos(q) * reaching : 0,
      shut: blinking(q, [3.1, 7.6, 19.0, 26.5]) || between(q, S4.blink, S4.blink + .8),
      lids: sigh ? .5 : lieU > 0 ? .45 : q >= S4.us ? .15 : 0, brow: q >= S4.us && q < S4.lie0 ? -.4 * 0 : 0,
      ear: q > S4.stop ? 14 * (onTwos(q) > 0 && between(q % 5, 0, .3) ? 1 : 0) : 0, tail: q > S4.lie1 && between((q - S4.lie1) % 4, 0, .5) ? 25 * onTwos(q) : 0 }, f);

    /* ---------- the men: follow the cow, then stand and stare ---------- */
    const k = mv ? w : {};
    const stare = { look: .7, eyeX: 1 };
    // Chinese man: strutting beside the cow's tail (hands behind his back), then staring, then turning on the American
    const turn = span(q, S4.turn, S4.turn + .7), storm = span(q, S4.storm0, S4.storm1);
    const cnX = (mv ? cx - 250 : CN_END) + (q >= S4.storm0 ? (AM_FACE - CN_END + 100) * storm : 0);
    const stormWalk = q >= S4.storm0 && q < S4.storm1 + .1 ? spWalk(q) : {};
    const sp = q >= s4v('s14') && q < s4v('s14', 9.4);
    // stressed words: 境外势力 and 躺平; he leans in, squashes a little and jabs on twos at the American's face
    const stress = [[1.107, 1.9], [4.18, 5.0]].some(([a, b]) => between(q, s4v('s14', a + 3.5), s4v('s14', b + 3.5)));
    const jab = q >= S4.storm1 - .3 ? 108 + (stress ? 10 * onTwos(q) : 3 * onTwos(q)) : 30 * span(q, S4.storm0, S4.storm1);
    const drop = span(q, S4.hands - .3, S4.hands);   // the finger comes down as the American's hands go up (they'd meet like a fist bump)
    const angry = q >= S4.turn + .4;
    const twitch = between(q, S4.cnCU + .6, S4.cnCU + 1.5) ? (onTwos(q) > 0 ? .55 : 0) : between(q, S4.cnCU + 1.9, S4.cnCU + 2.3) && onTwos(q) > 0 ? .4 : 0;
    R.cn.pose({ x: cnX, y: FARM.ground, s: FARM.s, ...k, ...stormWalk, look: .7 - 1.5 * turn, eyeX: 1 - 2 * turn, eyeY: 0,
      armR: mv ? -20 : 0, armL: mv ? -20 : q >= S4.storm0 ? jab * (1 - drop) : 0,
      lids: twitch, squash: sp && stress ? .05 : 0, shut: blinking(q, [2.4, 6.9, 18.2]), brow: angry ? -1.2 : mv ? -.1 : .3,
      mouth: sp ? (lips(q, 'scene4', PRE4, 's14') === 'X' ? 'frown' : lips(q, 'scene4', PRE4, 's14')) : mv ? 'smile' : angry ? 'frown' : 'flat',
      headR: angry ? (sp ? -9 - (stress ? 4 : 0) : -5) : 0 }, f);
    // American: agape, then hands up for "Me?"
    const hands = span(q, S4.hands, S4.hands + .35);
    const amLook = q >= S4.storm0 - .2 ? { look: .9, eyeX: 1, eyeY: .1 } : stare;
    R.am.pose({ x: mv ? cx - 560 : AM_X + (q >= S4.storm0 + .5 ? -22 * span(q, S4.storm0 + .5, S4.storm1 + .3) : 0), y: FARM.ground, s: FARM.s, ...k, ...amLook, eyeY: (amLook.eyeY || 0) + s4flick(q, 3),
      hold: null, armL: 110 * hands, armR: 110 * hands + (k.armR || 0) * (1 - hands), shut: blinking(q, [1.9, 5.4, 9.1, 13.8, 18.7, 24.1, 28.3, 32.0]),
      mouth: q >= s4v('s15') ? lips(q, 'scene4', PRE4, 's15') === 'X' ? 'O' : lips(q, 'scene4', PRE4, 's15') : 'O',
      brow: 1.2 * span(q, S4.storm0 + .5, S4.storm0 + 1.2) + .3, lids: 0, squash: 0, bob: k.bob || 0, headR: q > S4.storm1 && hands === 0 ? -7 : hands > 0 ? 5 * onTwos(q) * (hands < 1 ? 1 : 0) : 0 }, f);
    // Indian man: agape, then a shrug behind the two-shot
    const shrug = s4k(q, [[26.4, 0], [26.8, 60], [28.2, 60], [28.6, 0]]);
    R.ind.pose({ x: mv ? cx - 730 : IND_X, y: FARM.ground, s: FARM.s, ...k, look: q >= S4.storm0 ? .5 : .6, eyeX: 1, eyeY: s4flick(q, 5),
      armL: shrug || (k.armL || 0), armR: shrug || (k.armR || 0), headR: shrug > 30 ? 8 : 0,
      shut: blinking(q, [3.6, 8.3, 15.1, 21.5, 26.2, 31.0]), mouth: shrug > 30 ? 'flat' : 'O', brow: .7 }, f);
  });
}
