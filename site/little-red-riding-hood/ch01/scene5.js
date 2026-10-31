/* scene5.js — Grandma's door. */
'use strict';
const PRE5 = 4.0;
[3.45, 3.62, 3.79].forEach(t => sfx('scene5', t, 'knock', 2));   // the engine plays at half the vol: 2 is full
function scene5(p, D) {
  const C = (c, t) => clipAt('scene5', PRE5, c, t);
  const cam = paperCam(p, 'grandmaOut', { x: 900, y: 470, z: 1 }, { after: 'house', stages: ['inside'] });
  const door = doorLeaf(cam.stage, 'M1010,800 L1010,560 Q1070,510 1130,560 L1130,800 Z', '#3f5f8a', 1010, '<path d="M1040,530 V800 M1070,520 V800 M1100,530 V800" stroke="#2f4a6e" stroke-width="3"/><circle cx="1116" cy="680" r="6" fill="#caa24c"/>');
  const wolf = wolfPuppet(cam.stage);
  // inside: 5.3 Grandma in bed answers; 5.4 from inside, the latch lifts and the door opens on the wolf
  const inn = paperCam(p, 'room', { x: 1200, y: 560, z: 2.3 }), R = roomProps(inn, []), gran = grandmaPuppet(R.inBed), wolfIn = wolfPuppet(R.atDoor);
  inn.cut({ x: 330, y: 600, z: 1.8 }, C('s05b', 3.75));
  const RUN = 1.8, SKID = 2.1, TIP = 2.2, KNOCK = 3.45, INSIDE = C('s05b', -.05);
  const runner = walker(-150, .6, { L: 196, A: 26, period: .5, knee: 60 }), tip = walker(650, .6, { period: 1.2, A: 28, knee: 50 });
  cam.cut({ x: 1010, y: 610, z: 2.4 }, 3.3);
  stopClock(D, (q, f) => {
    const inside = q >= INSIDE;
    vis(cam.root, !inside); vis(inn.root, inside);
    const s = .6;
    if (inside) {
      inn.apply(q, f); R.door(opening(q, C('s05b', 4.3)));
      gran.pose({ x: 1250, y: 630, s: .55, turn: -1, mouth: lips(q, 'scene5', PRE5, 's05b'), nod: between(q, C('s05b', .05), C('s05b', .05) + 2 / FPS) ? 4 : 0, shut: blinking(q, [C('s05b', 2.2)]) }, f);
      vis(wolfIn.g, q >= C('s05b', 4.3));
      wolfIn.pose({ x: 262, y: hipOn(800, s, 200), s, lean: 6, ua: -20, fa: -30, brow: 1 }, f);
      return;
    }
    cam.apply(q, f); door(1);
    let o;
    if (q < SKID) { const w = runner(Math.min(q, RUN)); o = { x: Math.min(w.x, 600) + (q > RUN ? 50 * span(q, RUN, SKID) : 0), y: hipOn(800, s, 200) + w.drop * s, near: q > RUN ? 28 : w.near, far: q > RUN ? -20 : w.far, kNear: q > RUN ? 0 : w.kNear, kFar: q > RUN ? 0 : w.kFar, lean: q > RUN ? -14 : 28, ua: -30 + 40 * Math.sin(w.ph), fa: -40, tail: -20 }; }
    else { const w = tip(Math.min(q - TIP, 2.4)), x = Math.min(935, w.x); o = { x, y: hipOn(800, s, 200) + w.drop * s - 10, near: x < 935 ? w.near : 0, far: x < 935 ? w.far : 0, kNear: x < 935 ? w.kNear : 0, kFar: x < 935 ? w.kFar : 0, lean: 10, ua: -100, fa: -60, tail: 10 }; }
    if (q >= 3.3) {   // 5.2 at the door: three knocks, then a paw at his throat for the high voice
      const knock = [KNOCK, KNOCK + .17, KNOCK + .34].some(t => between(q, t, t + 1 / FPS));
      o = { ...o, x: 935, near: 0, far: 0, kNear: 0, kFar: 0, lean: 6, ua: q < C('s05', 1.5) ? -75 : -10, fa: q < C('s05', 1.5) ? -35 + (knock ? 25 : 0) : -155,
        brow: q > C('s05', 1.5) ? 1 : 0, shut: q > C('s05', 2) && q < C('s05', 2.6) && onTwos(q) > 0, mouth: lips(q, 'scene5', PRE5, 's05') };
    }
    wolf.pose({ s, ...o }, f);
  });
}
