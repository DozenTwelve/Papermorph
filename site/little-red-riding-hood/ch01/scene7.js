/* scene7.js — Red at the door. */
'use strict';
const PRE7 = 1.6;
const C7 = (c, t) => clipAt('scene7', PRE7, c, t);
// The woodcutter chops by the oak while nobody talks to him: a swing every CHOP s, the blade landing at .85 of it.
const CHOP = .9, CHOPPING = [[0, C7('s07w', .1)], [C7('s07', .9), 99]];
const chopAt = q => { for (const [a, b] of CHOPPING) if (q >= a && q < b) return ((q - a) / CHOP) % 1; return -1; };
for (const [a, b] of CHOPPING) for (let t = a + .85 * CHOP; t < Math.min(b, PRE7 + TIMINGS.scene7.dur); t += CHOP) sfx('scene7', t, 'chop', a ? .9 : 1.6);
function scene7(p, D) {
  const C = C7;
  const cam = paperCam(p, 'grandmaOut', { x: 820, y: 470, z: 1 }, { after: 'house', stages: ['inside'] });
  const door = doorLeaf(cam.stage, 'M1010,800 L1010,560 Q1070,510 1130,560 L1130,800 Z', '#3f5f8a', 1010, '<path d="M1040,530 V800 M1070,520 V800 M1100,530 V800" stroke="#2f4a6e" stroke-width="3"/><circle cx="1116" cy="680" r="6" fill="#caa24c"/>');
  // the woodcutter by the oak, a chopping block in front of him and a few split logs
  const WX = 400, WY = 772;
  const wood = woodcutterPuppet(cam.stage);
  prop(cam.stage, `<g filter="url(#paper)"><path d="M${WX + 56},${WY} L${WX + 60},${WY - 78} L${WX + 116},${WY - 78} L${WX + 120},${WY} Z" fill="#7a5034"/><ellipse cx="${WX + 88}" cy="${WY - 78}" rx="28" ry="7" fill="#c9a074"/>
    <rect x="${WX + 74}" y="${WY - 118}" width="28" height="40" fill="#a37a52"/><ellipse cx="${WX + 88}" cy="${WY - 118}" rx="14" ry="4.5" fill="#d8b88a"/>
    <path d="M${WX - 120},${WY} l60,0 l-6,-22 l-56,4 Z M${WX - 110},${WY - 20} l56,-4 l-4,-20 l-54,6 Z" fill="#a37a52"/></g>`);
  const red = redPuppet(cam.stage), wipe = trunkWipe(p, 0, .8, 'out');
  const inn = paperCam(p, 'room', { x: 330, y: 600, z: 1.8 }), R = roomProps(inn, []), redIn = redPuppet(R.atDoor);
  // 7.1 she comes along the path, stops to greet him, then on to the open door
  const opts = { period: .95, A: 24 }, go1 = walker(-60, .6, opts, 1, 3), STOP = go1(99).x, go2 = walker(STOP, .6, opts, 1, 6), ON = C('s07', .2);
  cam.cut({ x: WX - 20, y: 600, z: 2.1 }, C('s07w', -.05)).cut({ x: 820, y: 470, z: 1 }, ON);   // the greeting, close
  stopClock(D, (q, f) => {
    const inside = q >= C('s07b', -.05);
    vis(cam.root, !inside); vis(inn.root, inside);
    const s = .6;
    if (inside) {
      inn.apply(q, f); R.door(-.35);
      const w = walk(Math.max(0, Math.min(q - C('s07b', 1.1), .95)), { period: .95, A: 24 });
      redIn.pose({ x: 270 + w.d * s, y: hipOn(800, s) + w.drop * s, s, near: w.near, far: w.far, kNear: w.kNear, kFar: w.kFar, bouquet: 7,
        mouth: lips(q, 'scene7', PRE7, 's07b'), headR: 3 }, f);
      return;
    }
    cam.apply(q, f); wipe(q); door(.45 + .06 * Math.sin(q * 2.2));
    // the axe: raised over his head, a pause, down onto the log
    const u = chopAt(q), ua = u < 0 ? 6 : u < .6 ? -42 - 133 * ease(u / .6) : u < .75 ? -175 : u < .85 ? -175 + 133 * (u - .75) / .1 : -42;
    const talk = between(q, C('s07w', .1), ON + .3), turnBack = span(q, C('s07w', .1), C('s07w', .4)) - span(q, ON, ON + .3);
    wood.pose({ x: WX, y: WY - 200 * .62, s: .62, turn: 1 - 2 * turnBack, ua, fa: u < 0 ? -6 : 0, hop: u >= .85 && u < .9 ? 2 : 0,
      mouth: lips(q, 'scene7', PRE7, 's07x'), brow: talk ? .6 : 0, shut: blinking(q, [C('s07x', 1.6), C('s07', 3.0)]) }, f);
    const w = q < ON ? go1(q) : go2(q - ON);
    red.pose({ x: w.x, y: hipOn(800, s) + w.drop * s, s, near: w.near, far: w.far, kNear: w.kNear, kFar: w.kFar, cape: 3 + 3 * Math.sin(2 * w.ph + .6),
      ua: -8 + 4 * Math.sin(w.ph), fa: -78, swing: 6 * Math.sin(w.ph - 1), bouquet: 7, mouth: lips(q, 'scene7', PRE7, 's07w'),
      headR: q > C('s07', 3.2) ? -6 : 0, shut: blinking(q, [C('s07w', 2.2), C('s07', 2.4)]) }, f);
  });
}
