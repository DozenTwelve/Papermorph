/* scene9.js — out!. */
'use strict';
const PRE9 = 1.0;
const C9 = (c, t) => clipAt('scene9', PRE9, c, t), M9 = k => PRE9 + TIMINGS.scene9.marks['s09c.' + k];
// BANG: the wardrobe bursts open; WHACK: the umbrella comes down on his head; RUN: he bolts for the front door;
// LEAP: the only way left, over everyone; CRASH: through the window.
const LAND9 = 1.2, BANG = C9('s09', 0), WHACK = C9('s09', 2.04), RUN = C9('s09b', -.85), LEAP = C9('s09c', 5.3), CRASH = LEAP + .9;
sfx('scene9', LAND9, 'thud', 2); sfx('scene9', BANG, 'bang', 2); sfx('scene9', WHACK + .12, 'bonk', 2); sfx('scene9', CRASH, 'crash', 2);
// The bedroom window (in the room set, 1420–1660 × 300–530): glass until `at`; then broken — the woods redrawn over
// the set's cross bars, jagged glass left in the frame — and shards that burst out and fall to the floor.
function brokenWindow(back, front, at) {
  const glass = prop(back, `<g><rect x="1420" y="300" width="240" height="230" fill="#e8f4f6" opacity=".25"/>
    <path d="M1440,340 l40,-26 M1450,362 l64,-42 M1562,340 l40,-26 M1572,470 l52,-34" stroke="#ffffff" stroke-width="6" stroke-linecap="round" opacity=".6"/></g>`);
  const broken = prop(back, `<g filter="url(#paper)"><rect x="1418" y="298" width="244" height="234" fill="#cfe0d0"/><path d="M1418,430 C1480,400 1560,420 1662,396 L1662,532 L1418,532 Z" fill="#7fa54f"/>
      <path d="M1440,430 l20,-60 l20,60 Z M1500,420 l24,-80 l24,80 Z M1590,410 l20,-64 l20,64 Z" fill="#4d7d55"/></g>
    <path d="M1418,298 L1478,298 L1436,346 L1418,330 Z M1662,298 L1600,298 L1640,320 L1662,372 Z M1418,532 L1418,468 L1440,500 L1466,532 Z M1662,532 L1612,532 L1636,506 L1662,476 Z"
      fill="#e8f4f6" stroke="#ffffff" stroke-width="2" opacity=".85"/>
    <g filter="url(#paper)" fill="#7a5034"><path d="M1535,298 h10 v30 l-6,9 l-4,-7 Z M1535,532 h10 v-34 l-5,-9 l-5,11 Z M1418,410 v10 h28 l8,-4 l-10,-6 Z M1662,410 v10 h-24 l-6,-6 l8,-4 Z"/></g>`);
  const G = 1800, shards = [...Array(18)].map((_, i) => {
    const a = i * 2.4, r = .6 + (i % 5) * .25, y0 = 320 + (i * 53) % 190, vy = -150 - 140 * Math.abs(Math.sin(a)) * r;
    return { el: mk('path', { d: `M0,${-7 - (i % 4) * 3} L${5 + (i % 3) * 3},6 L-6,4 Z`, fill: '#e8f4f6', stroke: '#ffffff', 'stroke-width': 1.5 }, front),
      x0: 1440 + (i * 37) % 200, y0, vx: 240 * Math.cos(a) * r, vy, spin: (i % 2 ? 1 : -1) * (300 + i * 40), land: (-vy + Math.sqrt(vy * vy + 2 * G * (796 - y0))) / G };
  });
  return q => {
    const t = q - at; vis(glass, t < 0); vis(broken, t >= 0);
    for (const sh of shards) {
      vis(sh.el, t >= 0); if (t < 0) continue;
      const u = Math.min(t, sh.land);
      tf(sh.el, `translate(${(sh.x0 + sh.vx * u).toFixed(1)},${(sh.y0 + sh.vy * u + G * u * u / 2).toFixed(1)}) rotate(${(sh.spin * u).toFixed(0)}) scale(1.6)`);
    }
  };
}
function scene9(p, D) {
  const C = C9;
  const cam = paperCam(p, 'room', { x: 1050, y: 500, z: 1.1 }), R = roomProps(cam, []);
  const win = brokenWindow(R.atDoor, R.front, CRASH);
  const wood = woodcutterPuppet(R.atDoor), gran = grandmaPuppet(R.front), red = redPuppet(R.front), wolf = wolfPuppet(R.front);
  const spill = prop(R.front, `<g filter="url(#paper)">${[[-60, 4, '#d6493f'], [-30, -6, '#f6efe0'], [0, 6, '#efae48'], [30, -4, '#e88ab0'], [60, 6, '#d6493f'], [-90, 8, '#f6efe0']].map(([x, y, c]) =>
    `<rect x="${x - 14}" y="${y - 2}" width="28" height="3" fill="#4f7a34"/><circle cx="${x + 14}" cy="${y}" r="9" fill="${c}"/>`).join('')}</g>`, { transform: 'translate(720,796) scale(.7)' });
  // 9.1 he crouches on the bed and leaps; she ducks and cries for help; he sails over her, snaps the bouquet out of her
  // hands and lands face first in it; 9.2 the wardrobe rattles and
  // bursts open: Grandma and her umbrella; 9.3 wide: she runs at him and brings it down on his head; he bolts for the
  // door — 9.4 where the woodcutter steps in; 9.5 wide: Grandma one side, the woodcutter the other, the window; the leap.
  const DOOR = C('s09b', -.05), WIDE = C('s09c', -.05);
  cam.cut({ x: 1800, y: 560, z: 1.8 }, C('s09', -.7)).cut({ x: 1150, y: 500, z: 1.1 }, C('s09', .9))
    .cut({ x: 290, y: 560, z: 1.8 }, DOOR).cut({ x: 1000, y: 470, z: .95 }, WIDE).shake(CRASH, 3 / FPS, 10);
  const runner = walker(780, .6, { L: 196, A: 26, period: .5, knee: 60 }, -1, 3);
  stopClock(D, (q, f) => {
    cam.apply(q, f); R.door(-.35); win(q);
    R.wardrobe(q < C('s09', -.7) ? 1 : q < BANG ? 1 + .04 * onTwos(q) : opening(q, BANG, [1, .4, -.2, -.45, -.4]));
    const s = .6, sw = q >= WIDE;
    vis(spill, q >= LAND9);
    // the wolf
    let o;
    const leap = Math.min(1, Math.max(0, (q - .3) / .9)), crouch = span(q, 0, .25) * (1 - leap), UP = C('s09', 1.2);
    if (q < LAND9) o = { x: 1250 - 470 * ease(leap), y: 630 + 12 * crouch + 122 * leap - 80 * Math.sin(Math.PI * leap), turn: -1, lean: 20 * crouch + 40 * leap, ua: -120, fa: -30, near: -40 * Math.sin(Math.PI * leap), far: 40 * Math.sin(Math.PI * leap), tail: -30 * leap,
      mouth: leap > .3 && leap < .7 ? 'D' : 'X', jaw: leap > .3 && leap < .55 ? 1 : null };
    else if (q < UP) o = { x: 780, y: 752, turn: -1, lean: 78, shut: true, ua: -120, fa: -30 };
    else if (q < RUN) {
      const r = span(q, UP, UP + .5), hit = between(q, WHACK + .1, WHACK + .45);
      o = { x: 780, y: 752 - 72 * r - (hit ? 40 * Math.sin(Math.PI * (q - WHACK - .1) / .35) : 0), turn: -1, lean: 78 * (1 - r),
        ua: q > WHACK + .1 ? -160 : -20, fa: q > WHACK + .1 ? -30 : -10, brow: q > WHACK + .1 ? 1 : 0, ear: hit ? onTwos(q) : 0,
        shut: between(q, WHACK + .1, WHACK + .9), mouth: hit ? 'D' : 'X' };
    } else if (q < DOOR) { const w = runner(q - RUN); o = { x: w.x, y: 680 + w.drop * s, turn: -1, near: w.near, far: w.far, kNear: w.kNear, kFar: w.kFar, lean: 28, ua: -30 + 40 * Math.sin(w.ph), fa: -40, brow: 1, tail: -20 }; }
    else if (q < WIDE) {   // skids to a stop in front of the woodcutter
      const k = span(q, DOOR, DOOR + .3);
      o = { x: 470 - 40 * k + (q > DOOR + .5 ? 1.5 * onTwos(q) : 0), y: 680, turn: -1, lean: -14, near: 28 * (1 - k), far: -20 * (1 - k), ua: -100, fa: -60, brow: 1, tail: 10 };
    } else if (q < LEAP) {   // looks at Grandma, at the woodcutter, at the window; crouches
      const look = q < M9('gran') ? -1 : q < M9('wood') ? 1 - 2 * span(q, M9('wood'), M9('wood') + .12) : -1 + 2 * span(q, M9('way'), M9('way') + .12);
      const cr = span(q, LEAP - .35, LEAP - .05);
      o = { x: 430, y: 680 + 14 * cr, turn: q < M9('wood') ? -1 + 2 * span(q, M9('gran'), M9('gran') + .12) : look, lean: 22 * cr, headR: q > M9('way') + .2 ? -12 * (1 - cr) : 0,
        ua: -100 + 60 * cr, fa: -60, brow: 1, near: 20 * cr, far: 20 * cr, kNear: 40 * cr, kFar: 40 * cr, tail: 10 };
    } else { const u = Math.min(1, (q - LEAP) / .9); o = { x: 430 + 1110 * u, y: 694 - 224 * u - 300 * Math.sin(Math.PI * u), s: s * (1 - .3 * u * u), turn: 1, lean: 30, near: -30, far: 30, ua: -150, fa: -20, tail: -30, brow: 1 }; }
    vis(wolf.g, q < CRASH);
    wolf.pose({ s, cap: 'off', night: true, glasses: false, ...o }, f);
    // Red: ducks, then watches the wolf; at the crash, the window
    const duck = between(q, .45, 1.9);
    red.pose({ x: 1030, y: hipOn(800, s) + (duck ? 62 * s : 0), s, turn: q < 1.9 || q > CRASH - .3 ? 1 : -1, near: duck ? -62 : 0, far: duck ? -50 : 0, kNear: duck ? 104 : 0, kFar: duck ? 100 : 0,   // a squat
      ua: duck ? -150 : -8, fa: duck ? -40 : -78, headR: duck ? 10 : sw && q > LEAP ? -8 : 0, bouquet: q < .75 ? 7 : 0, shut: duck,
      mouth: lips(q, 'scene9', PRE9, 's09a') }, f);
    // Grandma: out of the wardrobe in a hop, across the room, the umbrella down on his head; then she shakes it at him
    vis(gran.g, q >= BANG + 1 / FPS);
    const hop = span(q, BANG, BANG + .5), run = span(q, C('s09', .9), C('s09', 1.9)), whack = span(q, WHACK, WHACK + .16);
    gran.pose({ x: 1860 - 160 * hop - 810 * run, y: 692 - 110 * Math.sin(Math.PI * hop) - (run > 0 && run < 1 ? 8 * Math.abs(Math.sin(q * 14)) : 0), s: .55,
      turn: q > CRASH - .4 ? 1 : -1, cap: false, glasses: false, umbrella: true, mouth: lips(q, 'scene9', PRE9, 's09'),
      ua: q < WHACK ? -175 : -175 + 47 * whack + (between(q, WHACK + .5, RUN) || between(q, WIDE, LEAP) ? 30 * onTwos(q) : 0), fa: -10, brow: -1 }, f);
    // the woodcutter steps into the doorway
    vis(wood.g, q >= DOOR);
    const stamp = between(q, C('s09b', 1.7), C('s09b', 1.7) + 2 / FPS);
    wood.pose({ x: 200 + 68 * span(q, DOOR, DOOR + .35), y: hipOn(800, .62, 200), s: .62, ua: -20, fa: -150, lean: q > C('s09b', 1.6) ? 8 : 0, hop: stamp ? -10 : 0, brow: -1,
      mouth: lips(q, 'scene9', PRE9, 's09b'), shut: blinking(q, [C('s09b', 2.4)]) }, f);
  });
}
