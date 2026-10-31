/* scene9.js — out! It starts mid-lunge on scene 8's last frame (s8_flight, s8_redDuck): the wolf's face goes into
   the bouquet; the wardrobe bursts open; Grandma's close-up; a medium that runs with her from the wardrobe, past Red,
   onto the wolf getting up dazed with his back to her; a medium two-shot as he turns and scrambles and she comes on,
   umbrella up, and brings it down; back to the wide as he turns to flee and drops to all fours; he gallops for the
   door and skids before the woodcutter; a cut on each mark of "Grandma … the woodcutter … one way out", his eyes go
   to the window; the leap, followed, through the glass. */
'use strict';
const PRE9 = .2;
const s9_C = (c, t = 0) => clipAt('scene9', PRE9, c, t), s9_M = k => PRE9 + TIMINGS.scene9.marks['s09c.' + k];
// the lunge clock where scene 8 left it (its beat end, hold included)
const s9_F0 = PRE8 + TIMINGS.scene8.dur + HOLD - clipAt('scene8', PRE8, 'lunge8', -.05);
const s9_T = (() => {
  const C = s9_C, BANG = C('burst9', .4), WHACK = C('bonk9', .35), LEAP = C('leap9', .25);
  return { HIT: .3, LAND: .8, BANG, LANDG: BANG + .5, RUNG: C('s09', 1.15), ATG: C('s09', 2.45), WHACK, TURN: WHACK + .45, GO: WHACK + .7, AT_DOOR: WHACK + 1.35,
    WOOD: C('bonk9', .6), SHOO: C('s09b', 1.0), LEAP, CRASH: LEAP + .8 };
})();
{ const C = s9_C, T = s9_T;
  sfx('scene9', 0, 'room', .4, { loop: true });   // a bed: it repeats to the end of the scene
  const fx = (t, n, v) => sfx('scene9', +t.toFixed(2), n, v);
  fx(T.HIT, 'thud', 2); fx(T.LAND, 'thud', 1.2);
  fx(T.BANG - .38, 'knock', .8); fx(T.BANG - .2, 'knock', .9); fx(T.BANG, 'bang', 2); fx(T.LANDG, 'hop', 1.4);
  for (let t = T.RUNG + .1, i = 0; t < T.ATG; t += .22, i++) fx(t, 'step' + (1 + i % 3), .9);
  fx(T.WHACK + .1, 'bonk', 2);
  fx(T.GO + .05, 'run', 1.3);
  fx(T.AT_DOOR - .2, 'skid', 1.6); fx(T.SHOO, 'thud', 1);
  fx(T.LEAP, 'whoosh', 1.6); fx(T.CRASH, 'crash', 2); fx(T.CRASH + .2, 'tinkle', 1.4);
}
// The bedroom window (in the room set, 1420–1660 × 300–530): glass until `at`; then broken — the woods redrawn over
// the set's cross bars, jagged glass left in the frame — and shards that burst out and fall to the floor.
function s9_brokenWindow(back, front, at) {
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
  const C = s9_C, T = s9_T, breathe = (q, k = 0) => 2 * Math.sin(q * 2.2 + k);
  const cam = paperCam(p, 'room', s8_LUNGE_VIEW), R = roomProps(cam, []);
  const win = s9_brokenWindow(R.atDoor, R.front, T.CRASH);
  const wood = woodcutterPuppet(R.atDoor);
  const spill = prop(R.front, `<g filter="url(#paper)">${[[-60, 4, '#d6493f'], [-30, -6, '#f6efe0'], [0, 6, '#efae48'], [30, -4, '#e88ab0'], [60, 6, '#d6493f'], [-90, 8, '#f6efe0']].map(([x, y, c]) =>
    `<rect x="${x - 14}" y="${y - 2}" width="28" height="3" fill="#4f7a34"/><circle cx="${x + 14}" cy="${y}" r="9" fill="${c}"/>`).join('')}</g>`, { transform: 'translate(735,796) scale(.7)' });
  const red = redPuppet(R.front), wolf = wolfPuppet(R.front), gran = grandmaPuppet(R.front);
  // his close-up when his eyes find the window: the room behind him, out of focus
  const W = paperCam(p, 'room', { x: 820, y: 450, z: 1.4 }).soft(0, 'all'), wolfW = wolfPuppet(W.stage);
  // shots: A the lunge (two-shot), B the wardrobe, C Grandma's close-up, D her run (a medium that follows her onto
  // the wolf), D2 a medium two-shot on her and him: he turns to her, scrambles, the bonk; D3 the wide again: he turns
  // for the door, drops to all fours and bolts out of frame left; E the door,
  // F [gran], G [wood], H his eyes to the window (W), I the window, J the leap
  const SH = [[0, 'A'], [C('burst9', -.05), 'B'], [C('s09', -.15), 'C'], [C('s09', 1.1), 'D'], [C('s09', 2.1), 'D2'], [T.TURN, 'D3'], [C('bonk9', 1.4), 'E'],
    [s9_M('gran') - .05, 'F'], [s9_M('wood') - .05, 'G'], [s9_M('way') - .05, 'H'], [C('s09c', 5.35), 'I'], [C('leap9', .05), 'J']];
  const at = n => SH.find(s => s[1] === n)[0];
  const gxAt = q => 1880 - 180 * span(q, T.BANG, T.LANDG) - 795 * span(q, T.RUNG, T.ATG);   // Grandma's x
  const wolfX = q => q < T.LEAP ? 530 : 530 + 1010 * Math.min(1, (q - T.LEAP) / .8);
  cam.to({ x: 1030 }, T.HIT, .6).cut({ x: 1820, y: 590, z: 2.1 }, at('B')).cut({ x: 1700, y: 580, z: 3.5 }, at('C')).cut({ x: 1480, y: 600, z: 1.9 }, at('D')).to({ x: t => Math.max(1060, Math.min(1480, gxAt(t) - 200)) }, at('D'), .001)
    .cut({ x: 875, y: 612, z: 2.9 }, at('D2')).to({ x: 860 }, at('D2'), T.TURN - at('D2'))
    .cut({ x: 1060, y: 600, z: 1.9 }, at('D3'))
    .cut({ x: 380, y: 590, z: 2.0 }, at('E')).to({ x: 330, y: 545, z: 2.3 }, T.SHOO - .2, .6)
    .cut({ x: 925, y: 560, z: 2.6 }, at('F')).cut({ x: 290, y: 595, z: 2.3 }, at('G'))
    .cut({ x: 1540, y: 430, z: 1.7 }, at('I')).to({ z: 2.4 }, at('I') + .05, .85)
    .cut({ x: 680, y: 540, z: 1.5 }, at('J')).to({ x: t => Math.max(680, Math.min(1420, wolfX(t) + 60)), y: 500 }, T.LEAP, .35)
    .to({ x: 1260, y: 500, z: 1.45 }, T.CRASH + .25, 1.0).shake(T.CRASH, 3 / FPS, 10);
  const gallop = q => route(q, [[T.GO, 800], [T.AT_DOOR, 470]], .6);
  stopClock(D, (q, f) => {
    let k = 0; for (let i = 0; i < SH.length; i++) if (q >= SH[i][0]) k = i;
    const shot = SH[k][1];
    vis(cam.root, shot !== 'H'); vis(W.root, shot === 'H');
    if (shot === 'H') {   // eyes right, then the whole head after them: the window
      W.apply(q, f);
      const t0 = at('H'), tt = span(q, t0 + .5, t0 + .75);
      wolfW.pose({ x: 820, y: 450 + 215 * 2.6 + breathe(q), s: 2.6, head: tt > .5 ? 'P' : 'F', turn: tt > .5 ? tt : 1, cap: 'off', night: true, glasses: false, brow: -1,
        look: 2 * span(q, t0 + .1, t0 + .25), ear: between(q, t0 + .3, t0 + .5) ? onTwos(q) : 0, rua: 20, rfa: -70, lua: -20, lfa: 70, shut: blinking(q, [t0 + .02]) }, f);
      return;
    }
    cam.apply(q, f); win(q); R.door(-.35);
    R.wardrobe(q < T.BANG - .4 ? 1 : q < T.BANG ? 1 + .05 * onTwos(q) : opening(q, T.BANG, [1, .3, -.3, -.5, -.45]));
    vis(spill, q >= T.LAND);
    const s = .6, floor4 = hipOn(800, s, 200);
    // the wolf
    let o;
    if (q < T.HIT) o = s8_flight(s9_F0 + q);
    else if (q < T.LAND) { const u = (q - T.HIT) / (T.LAND - T.HIT), a = s8_flight(s9_F0 + T.HIT);
      o = { ...a, x: a.x + (800 - a.x) * ease(u), y: a.y + (floor4 + 30 - a.y) * u * u - 150 * Math.sin(Math.PI * u), stretch: 1 - u, crouch: u, headR: 30 * u, jaw: 0, mouth: 'X', shut: true, tail: 30 - 50 * u }; }
    else if (q < C('s09', 1.85)) o = { x: 800, y: floor4 + 34, s, turn: -1, run: 0, crouch: 1, headR: 42, shut: true, tail: -20 + 6 * onTwos(q) * (q > 1.2 && q < 1.5 ? 1 : 0), night: true, cap: 'off' };
    else if (q < T.GO) {   // up, dazed, his back to her as she comes; turned to her on the cut (D2); the bonk; clutches his head; turns for the door
      const up = span(q, C('s09', 1.85), C('s09', 2.2)), tr = q < at('D2') ? -1 : q < T.TURN ? 1 : 1 - 2 * span(q, T.TURN, T.TURN + .3);
      const hit = q >= T.WHACK + .1, bump = between(q, T.WHACK + .1, T.WHACK + .4) ? 30 * Math.sin(Math.PI * (q - T.WHACK - .1) / .3) : 0;
      const scr = between(q, at('D2'), T.WHACK) ? 1 : 0;   // scrambling: his feet shuffle under him as she comes on
      o = { x: 800, y: floor4 - bump, s, turn: tr, lean: 40 * (1 - up), near: 12 * scr * onTwos(q), far: -12 * scr * onTwos(q), headR: q < at('D2') ? 8 * Math.sin(q * 6) : 0, ua: hit ? -165 : -20, fa: hit ? -30 : -40,
        brow: -1, ear: hit && q < T.WHACK + .6 ? onTwos(q) : 0, shut: hit && q < T.WHACK + .7, mouth: hit && q < T.WHACK + .5 ? 'D' : 'X', tail: -10 };
    } else if (q < T.SHOO) {   // gallop to the door, skid before the woodcutter
      const g = gallop(q), sk = span(q, T.AT_DOOR - .25, T.AT_DOOR);
      o = { x: g.x, y: floor4, s, turn: -1, run: g.d, skid: sk * (1 - span(q, T.AT_DOOR + .3, T.AT_DOOR + .6)), crouch: .4 * span(q, T.AT_DOOR + .3, T.AT_DOOR + .6), brow: -1, ear: sk > 0 && q < T.AT_DOOR + .3 ? onTwos(q) : 0, tail: 20 * (1 - sk) };
    } else if (q < at('J')) {   // "Shoo!": he rears up and backs off a step, trembling
      const back = span(q, T.SHOO, T.SHOO + .35);
      o = { x: 470 + 60 * back + (q > T.SHOO + .4 ? 1.5 * onTwos(q) : 0), y: floor4, s, turn: -1, lean: -10 * back, ua: -150, fa: -50, brow: -1.2, near: 10 * back, far: -10 * back, tail: -30,
        look: q > s9_M('way') ? -1 : 0, shut: blinking(q, [s9_M('wood') + .8]) };
    } else if (q < T.LEAP) o = { x: 530, y: floor4, s, turn: 1, run: 0, crouch: span(q, at('J'), T.LEAP - .05), tail: 20 * onTwos(q), brow: -1 };
    else { const u = Math.min(1, (q - T.LEAP) / .8);
      o = { x: wolfX(q), y: floor4 + (430 - floor4) * u - 260 * Math.sin(Math.PI * u), s, turn: 1, run: 0, stretch: 1, crouch: 0, brow: -1, jaw: .4, tail: -30 }; }
    vis(wolf.g, q < T.CRASH);
    wolf.pose({ s, cap: 'off', night: true, glasses: false, flap: o.run !== undefined && o.run !== null ? 20 * onTwos(q) : 0, ...o }, f);
    // Red: ducked under the bouquet, "Help!"; up again, watching (turned to him); ducks as he flies over, turns after him
    const said = lips(q, 'scene9', PRE9, 's09a');
    if (q < 2.6) { const r = s8_redDuck(s9_F0 + q); red.pose({ ...r, bouquet: q < T.HIT ? 7 : 2, mouth: said !== 'X' ? said : r.mouth, shut: q > T.HIT && q < 1.4 }, f); }
    else {
      const duck = span(q, T.LEAP + .15, T.LEAP + .35) * (1 - span(q, T.LEAP + .6, T.LEAP + .9)), tr = -1 + 2 * span(q, T.LEAP + .45, T.LEAP + .7);
      red.pose({ x: 1030, y: hipOn(800, s) + breathe(q, 1) * .5, s, turn: tr, crouch: .6 * duck, ua: -8 - 140 * duck, fa: -78 + 40 * duck, bouquet: 2, brow: 1.5, mouth: 'F',
        shut: blinking(q, [4.6, 8.3, 12.2]) || duck > .5 }, f);
    }
    // Grandma: out of the wardrobe in a hop, her close-up, across the room, the umbrella down on his head; then she stands
    // her ground, umbrella up; ducks as he flies over, turns after him
    vis(gran.g, q >= T.BANG + 1 / FPS);
    const gm = lips(q, 'scene9', PRE9, 's09'), hop = span(q, T.BANG, T.LANDG), run = span(q, T.RUNG, T.ATG), sq = q < T.LANDG ? .8 * span(q, T.BANG, T.BANG + .1) * (1 - span(q, T.BANG + .1, T.BANG + .2)) : 1 - span(q, T.LANDG, T.LANDG + .25);
    const shake = 14 * onTwos(q), gx = 1880 - 180 * hop - 795 * run, gd = span(q, T.LEAP + .1, T.LEAP + .3) * (1 - span(q, T.LEAP + .55, T.LEAP + .8));
    if (shot === 'C') gran.pose({ x: gx, y: 692 + breathe(q), s: .55, head: 'F', cap: false, glasses: false, umbrella: true, mouth: gm, brow: -1.5,
      rua: -150 + shake, rfa: -30, lua: -20, lfa: -40, shut: blinking(q, [C('s09', .2)]) }, f);
    else {
      const wind = q < T.WHACK ? 0 : span(q, T.WHACK, T.WHACK + .16), after = q > T.WHACK + .5;
      gran.pose({ x: gx, y: 692 - 110 * Math.sin(Math.PI * hop) - (run > 0 && run < 1 ? 8 * Math.abs(Math.sin(q * 14)) : 0), s: .55, crouch: Math.max(sq, .6 * gd),
        turn: q > T.CRASH - .15 ? 1 : -1, cap: false, glasses: false, umbrella: true, mouth: gm, brow: -1.5,
        ua: after ? -160 + .7 * shake : -175 + 40 * wind, fa: after ? -20 : -10, shut: blinking(q, [10.6, 13.0]) }, f);
    }
    // the woodcutter steps into the doorway, axe up: "Go on! Shoo!"
    vis(wood.g, q >= T.WOOD);
    const stamp = between(q, T.SHOO, T.SHOO + 2 / FPS);
    wood.pose({ x: 200 + 68 * span(q, T.WOOD, T.WOOD + .35), y: hipOn(800, .62, 200) + breathe(q, 2), s: .62, head: 'F', rua: -60 - 100 * span(q, T.AT_DOOR - .45, T.AT_DOOR - .1) + (q > T.SHOO ? 8 * onTwos(q) : 0), rfa: -20, lua: -10, lfa: 20,
      hop: stamp ? -10 : 0, brow: -1, mouth: lips(q, 'scene9', PRE9, 's09b'), shut: blinking(q, [C('s09b', 1.6), s9_M('wood') + 1.2]) }, f);
  });
}
