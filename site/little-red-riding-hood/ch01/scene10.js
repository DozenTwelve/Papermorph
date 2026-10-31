/* scene10.js — away into the woods, still in the nightcap. */
'use strict';
const PRE10 = 1.0;   // the wolf lands under the broken window and is off before the woodcutter shouts
function scene10(p, D) {
  const C = (c, t) => clipAt('scene10', PRE10, c, t), LAND = .32, FOLLOW = C('s10b', -.05), FAR = C('run10', -.12);
  // 10.1 outside: glass still falling, the wolf drops onto the grass and bolts right; 10.2 close on the woodcutter in
  // the broken window, fist shaking ("And don't come back…"); 10.3 a close running follow in the woods, pushing in on
  // the nightcap on "never even took off the nightcap"; 10.4 the wolf tiny on the far path, the cap tail still flapping.
  const out = paperCam(p, 'grandmaOut', { x: 1460, y: 640, z: 1.9 }, { after: 'house', stages: ['inside'] });
  out.cut({ x: 1386, y: 590, z: 3.0 }, C('s10', -.12)).to({ x: 1392, y: 586, z: 3.4 }, C('s10', .3), 2.1).cut({ x: 2650, y: 640, z: 2.4 }, FAR);
  // the window he went through: the room redrawn over the set's cross bars, the woodcutter seen only through the hole
  mk('rect', { x: 1300, y: 520, width: 160, height: 120 }, mk('clipPath', { id: 's10_pane' }, out.stage));
  const pane = mk('g', { 'clip-path': 'url(#s10_pane)' }, out.stage);
  prop(pane, '<g filter="url(#paper)"><rect x="1296" y="516" width="168" height="44" fill="#6e4a30"/><rect x="1296" y="560" width="168" height="84" fill="#5a3a24"/></g>');
  const wood = woodcutterPuppet(pane);
  prop(out.stage, `<path d="M1300,520 L1346,520 L1312,556 L1300,546 Z M1460,520 L1412,520 L1442,538 L1460,572 Z M1300,640 L1300,598 L1318,620 L1338,640 Z M1460,640 L1420,640 L1440,620 L1460,600 Z"
      fill="#e8f4f6" stroke="#ffffff" stroke-width="2" opacity=".85"/>
    <g filter="url(#paper)" fill="#6e4a30"><path d="M1376,520 h8 v22 l-5,7 l-3,-6 Z M1376,640 h8 v-24 l-4,-7 l-4,9 Z M1300,577 v7 h20 l6,-3 l-8,-4 Z M1460,577 v7 h-18 l-5,-4 l6,-3 Z"/></g>`);
  // shards: the last of the glass falling from the sill onto the grass (they land and lie there)
  const shards = [[1312, 30, .00], [1340, -20, .06], [1371, 60, .02], [1398, 10, .1], [1430, -45, .04], [1452, 80, .12], [1388, 120, .16]].map(([x, r, d], i) => ({
    x, r, d, gy: 806 + (i * 7) % 18, el: prop(out.stage, '<path d="M0,-8 L6,6 L-6,4 Z" fill="#e8f4f6" stroke="#ffffff" stroke-width="1.5"/>') }));
  const wolfOut = wolfPuppet(out.stage);
  // the woods: one long camera that rides with him
  const woods = paperCam(p, 'forest', { x: 900, y: 600, z: 2.1 });
  // speed lines behind him (paper strips, built first so they pass behind him), on twos
  const lines = prop(woods.stage, [0, 1, 2, 3].map(i => `<rect x="${-170 - i * 34}" y="${-100 + i * 40}" width="${150 - i * 18}" height="7" rx="3.5" fill="#f6efe0" opacity=".75"/>`).join(''));
  const wolf = wolfPuppet(woods.stage), WS = .8, WX0 = 700, SPEED = 470;
  const wx = q => WX0 + SPEED * Math.max(0, q - FOLLOW + .3);
  woods.to({ x: q => wx(q) + 150, y: 600, z: 2.1 }, FOLLOW, .001)
    .to({ x: q => wx(q) + 85, y: hipOn(WOODS, WS, 200) - 50, z: 3.3 }, C('s10b', 1.75), 1.3);   // into his head for "nightcap"
  const wipe = trunkWipe(p, D - .4, .5);   // time passes: to the table
  const backPath = x => 808 - (x - 1380) * 116 / 1620, far = x => .6 * (1 - .78 * Math.min(1, (x - 1380) / 1620));

  sfx('scene10', 0, 'forest', .5, { loop: true });
  sfx('scene10', .05, 'tinkle', 1.4); sfx('scene10', LAND, 'thud', 1.2); sfx('scene10', LAND + .02, 'tinkle', .7);
  for (let t = LAND + .3; t < C('s10', .8); t += .44) sfx('scene10', +t.toFixed(2), 'run', 1.1 - .25 * (t - LAND));
  sfx('scene10', FOLLOW, 'whoosh', 1.4);
  for (let t = FOLLOW; t < FAR - .1; t += .44) sfx('scene10', +t.toFixed(2), 'run', 1.4);
  for (let t = FAR; t < D; t += .44) sfx('scene10', +t.toFixed(2), 'run', .35);

  stopClock(D, (q, f) => {
    const inWoods = q >= FOLLOW && q < FAR;
    vis(out.root, !inWoods); vis(woods.root, inWoods);
    if (inWoods) woods.apply(q, f); else out.apply(q, f);
    wipe(q);
    const flap = 38 * onTwos(q);
    // shards fall from the sill (y 640) with gravity, then lie still
    for (const s of shards) {
      const u = Math.max(0, q - s.d), y = Math.min(s.gy, 640 + 40 * u + .5 * 2200 * u * u);
      tf(s.el, `translate(${s.x + 30 * Math.min(u, .4)},${y.toFixed(1)}) rotate(${s.r + (y < s.gy ? 500 * u : 0)}) scale(1.4)`);
    }
    if (!inWoods) {
      if (q < FAR) {
        // the wolf out of the window: falling, a crouch on landing, then a gallop out of frame right
        const s = .62, gy = hipOn(812, s, 200);
        if (q < LAND) {
          const u = q / LAND;
          wolfOut.pose({ x: 1430 + 90 * u, y: gy - 120 * (1 - u * u), s, run: 0, stretch: 1 - u, cap: 'off', night: true, flap, headR: 10 - 20 * u, brow: 1, mouth: 'D' }, f);
        } else {
          const t = q - LAND - .25, x = 1520 + (t > 0 ? 260 * t + 300 * t * t : 0);
          wolfOut.pose({ x, y: gy, s, run: (x - 1520) / s, crouch: t < 0 ? 1 - (q - LAND) / .25 * .6 : 0, cap: 'off', night: true, flap, tail: -20, brow: 1, mouth: 'D', look: -1 }, f);
        }
      } else {
        // far down the back path, receding: tiny, the cap tail flapping
        const x = 2600 + 150 * (q - FAR), s = far(x);
        wolfOut.pose({ x, y: backPath(x) - 200 * s, s, run: (x - 2000) / s, cap: 'off', night: true, flap: 1.4 * flap, tail: -20, mouth: 'D' }, f);
      }
      // the woodcutter rises into the window, then shakes his fist after the wolf
      const up = span(q, .45, .8), shout = between(q, C('s10', 0), C('s10', 2.5));
      wood.pose({ x: 1372, y: 712 + 130 * (1 - up), s: .62, axe: false, ua: -132 + 6 * (shout ? onTwos(q) : 0), fa: shout ? -30 + 22 * onTwos(q) : -40,
        brow: -1, headR: shout ? -4 : 0, mouth: lips(q, 'scene10', PRE10, 's10'), shut: blinking(q, [.95, C('s10', 1.9)]) }, f);
    } else {
      const x = wx(q), u = Math.max(0, q - FOLLOW + .3);
      wolf.pose({ x, y: hipOn(WOODS, WS, 200), s: WS, run: (x - WX0) / WS, lean: 0, cap: 'off', night: true, flap,
        tail: -14 + 8 * onTwos(q), ear: -1, brow: 1, mouth: 'D', jaw: .55 + .15 * onTwos(q),
        look: between(q, C('s10b', 2.2), C('s10b', 2.9)) ? -1 : 1, headR: between(q, C('s10b', 2.2), C('s10b', 2.9)) ? -8 : 0,
        shut: blinking(q, [C('s10b', .9), C('s10b', 3.6)]) }, f);
      tf(lines, `translate(${(x + (onTwos(q) > 0 ? 0 : -30)).toFixed(1)},${(hipOn(WOODS, WS, 200) + 10).toFixed(1)})`);
      vis(lines, u > .2);
    }
  });
}
