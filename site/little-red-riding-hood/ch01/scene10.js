/* scene10.js — away into the woods. */
'use strict';
const PRE10 = .3;
function scene10(p, D) {
  const C = (c, t) => clipAt('scene10', PRE10, c, t);
  const cam = paperCam(p, 'grandmaOut', { x: 1750, y: 470, z: 1 }, { after: 'house', stages: ['inside'] });
  // the window he went through: the room redrawn over the set's cross bars, the woodcutter seen only through the hole,
  // jagged glass left in the frame and a few shards on the grass below
  mk('rect', { x: 1300, y: 520, width: 160, height: 120 }, mk('clipPath', { id: 'pane10' }, cam.stage));
  const pane = mk('g', { 'clip-path': 'url(#pane10)' }, cam.stage);
  prop(pane, '<g filter="url(#paper)"><rect x="1296" y="516" width="168" height="44" fill="#6e4a30"/><rect x="1296" y="560" width="168" height="84" fill="#5a3a24"/></g>');
  const wood = woodcutterPuppet(pane);
  prop(cam.stage, `<path d="M1300,520 L1346,520 L1312,556 L1300,546 Z M1460,520 L1412,520 L1442,538 L1460,572 Z M1300,640 L1300,598 L1318,620 L1338,640 Z M1460,640 L1420,640 L1440,620 L1460,600 Z"
      fill="#e8f4f6" stroke="#ffffff" stroke-width="2" opacity=".85"/>
    <g filter="url(#paper)" fill="#6e4a30"><path d="M1376,520 h8 v22 l-5,7 l-3,-6 Z M1376,640 h8 v-24 l-4,-7 l-4,9 Z M1300,577 v7 h20 l6,-3 l-8,-4 Z M1460,577 v7 h-18 l-5,-4 l6,-3 Z"/></g>
    ${[[1312, 812, 30], [1340, 820, -20], [1371, 808, 60], [1398, 818, 10], [1430, 811, -45], [1452, 822, 80]].map(([x, y, r]) =>
      `<path d="M0,-8 L6,6 L-6,4 Z" fill="#e8f4f6" stroke="#ffffff" stroke-width="1.5" transform="translate(${x},${y}) rotate(${r}) scale(1.4)"/>`).join('')}`);
  const wolf = wolfPuppet(cam.stage), wipe = trunkWipe(p, D - .7, .65);   // time passes: to the table
  cam.to({ x: 2560, y: 640, z: 2.4 }, C('s10b', 0), 3.4);
  const backPath = x => 808 - (x - 1380) * 116 / 1620, far = x => .6 * (1 - .78 * Math.min(1, (x - 1380) / 1620));
  stopClock(D, (q, f) => {
    cam.apply(q, f); wipe(q);
    const w = walk(Math.max(0, q - .25), { L: 196, A: 28, period: .48, knee: 60 }), xs = 1420 + w.d * .3, s = far(xs), x = 1420 + w.d * s;
    wolf.pose({ x, y: backPath(x) - (200 - w.drop) * s - (q < .25 ? 20 * (1 - q / .25) : 0), s, near: w.near, far: w.far, kNear: w.kNear, kFar: w.kFar,
      lean: 26, ua: -30 + 45 * Math.sin(w.ph), fa: -40, tail: -25 + 6 * Math.sin(2 * w.ph), cap: 'off', night: true, jaw: .4 }, f);
    wood.pose({ x: 1372, y: 560 + 224 * .62, s: .62, axe: false, ua: -150, fa: -20 + 14 * onTwos(q), brow: -1, mouth: lips(q, 'scene10', PRE10, 's10'), shut: blinking(q, [C('s10b', .8)]) }, f);
  });
}
