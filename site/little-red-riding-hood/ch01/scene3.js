/* scene3.js — the wolf. */
'use strict';
const PRE3 = 2.2;
function scene3(p, D) {
  const C = (c, t) => clipAt('scene3', PRE3, c, t), TX = 2250, POP = 1.5, STOP = 1.425;
  const cam = paperCam(p, 'forest', { x: 2060, y: 560, z: 1.45 });
  const wolf = wolfPuppet(cam.stage), red = redPuppet(cam.stage);
  prop(cam.stage, `<g filter="url(#paper)"><path d="M${TX - 64},800 C${TX - 50},500 ${TX - 56},200 ${TX - 40},-200 L${TX + 44},-200 C${TX + 56},200 ${TX + 50},500 ${TX + 66},800 Z" fill="#6e4a30"/>
    <path d="M${TX - 20},700 C${TX - 10},500 ${TX - 24},300 ${TX - 12},0 M${TX + 22},760 C${TX + 30},520 ${TX + 18},300 ${TX + 26},40" stroke="#5a3b24" stroke-width="6" fill="none"/></g>`);
  // 3.2 the wolf's view of her: the woods behind her, his ear and shoulder dark and close at the edge
  const rev = paperCam(p, 'forestRev').soft(0, 'all'), redRev = redPuppet(rev.stage);
  prop(rev.root, `<g filter="url(#paper)"><path d="M1290,900 C1300,700 1380,560 1480,520 L1520,380 L1560,500 C1620,520 1660,560 1680,600 L1680,900 Z" fill="#3e3a36"/></g>`);
  const go = walker(1640, .6, { period: .95, A: 24 }, 1, 3);
  cam.cut({ x: 2120, y: 520, z: 2.6 }, C('s03c', -.05)).soft(C('s03c', -.05), true);
  stopClock(D, (q, f) => {
    const reverse = between(q, C('s03b', -.05), C('s03c', -.05));
    vis(cam.root, !reverse); vis(rev.root, reverse);
    if (reverse) {
      rev.apply(q, f);
      redRev.pose({ x: 760, y: 430 + 194 * 2, s: 2, head: 'F', mouth: mouthAt('s03b', q - C('s03b')), shut: blinking(q, [C('s03b', 1.6)]),
        rua: q > C('s03b', 2.2) ? -96 : 6, rfa: q > C('s03b', 2.2) ? -10 : -4 }, f);
      return;
    }
    cam.apply(q, f);
    const w = go(q), s = .6, startle = between(q, POP + .1, POP + .1 + 2 / FPS);
    red.pose({ x: w.x - (q > POP + .1 ? 12 : 0), y: hipOn(WOODS, s) + w.drop * s - (startle ? 12 : 0), s,
      near: w.near, far: w.far, kNear: w.kNear, kFar: w.kFar, cape: 3, ua: -8, fa: -78,
      headR: q > POP + .1 ? -4 : 0, shut: blinking(q, [6.2, 12.0]), mouth: 'X' }, f);
    // the wolf hops out from behind the trunk, bows with his cap in his paw, then asks
    const hop = Math.min(1, Math.max(0, (q - POP) / .4)), land = between(q, POP + .4, POP + .4 + 2 / FPS);
    const bow = q < C('s03', 3) ? span(q, C('s03', .2), C('s03', .6)) : 1 - span(q, C('s03', 3), C('s03', 3.4));
    const aside = q >= C('s03c', -.05);
    wolf.pose({ x: TX + 10 - 150 * hop, y: hipOn(WOODS, s, 200) - 50 * Math.sin(Math.PI * hop) + (land ? 6 : 0), s, turn: -1,
      lean: 26 * bow, cap: bow > .05 ? 'hand' : 'on', ua: bow > .05 ? -20 * bow : q > C('s03', 3.4) && q < C('s03b') ? -46 : 6, fa: bow > .05 ? -125 * bow : -20,
      tail: 8 * Math.sin(q * 5), head: aside ? 'F' : 'P', mouth: lips(q, 'scene3', PRE3, 's03', 's03c'),
      rua: 40, rfa: -104 + 8 * onTwos(q), lua: -40, lfa: 104 - 8 * onTwos(q),
      brow: aside && q > C('s03c', 2.5) ? onTwos(q) : 0, look: aside && q < C('s03c', 2.3) ? -1 : 0, shut: blinking(q, [4.0, 14.8]) }, f);
  });
}
