/* scene1.js — The door. Night, rain, Doc soldering; Martin bangs on the shut door shouting off screen, the door rolls
   up, and his panic is a frontal single in the doorway, punched in on "Omarchy". */
'use strict';
const PRE1 = 1.6;
// Doc at the desk soldering a little board held in his left mitten; `extra` overrides any key.
const DOC_BOARD = `<rect x="-80" y="-55" width="160" height="100" rx="8" fill="#2f7d3a" stroke="${CW_INK}" stroke-width="7"/><rect x="-50" y="-30" width="40" height="30" fill="#222"/><rect x="15" y="-25" width="45" height="18" fill="#c9a23a"/><circle cx="30" cy="25" r="9" fill="#c0c0c0"/>`;
function docSolder(st, q, f, extra = {}) {
  const base = { x: PLACE.doc[0], y: PLACE.doc[1], look: .2, eyeY: 1, eyeX: .3, lids: .45, frontL: true, frontR: true,
    shut: blinkAt(q, 1) };
  const bob = 5 * Math.sin(q * 5.3);
  const o = { ...base, ...st.doc.aim(base, 'L', [PLACE.doc[0] - 30, 742]), ...st.doc.aim(base, 'R', [PLACE.doc[0] + 70, 722 + bob]),
    holdL: { svg: DOC_BOARD, x: 30, y: -10 }, hold: { name: 'iron', w: 300, upright: true, r: 160, x: -40, y: 0 }, ...extra };
  return o;
}
// Where the iron's tip is for Doc's pose o: the right mitten, then along the iron (300 units long at 160°).
function ironTip(st, o) { const [hx, hy] = st.doc.hand(o, 'R'), k = CW.doc.K * (o.s ?? 1); return [hx - 40 * k - 150 * k * .94, hy + 150 * k * .34]; }

function scene1(p, D, m) {
  const st = garageStage(p), at = (c, t = 0) => clipAt('scene1', PRE1, c, t);
  const roll0 = at('m01', 1.0), roll1 = roll0 + 1.15;
  const door = { x: PLACE.door[0], y: PLACE.door[1], s: .95 };
  const shots = [shot(0, 'wide'), shot(roll1 + .3, 'single', 'martin', door), shot(at('m01', 5.5), 'close', 'martin', door)];
  const S = shooter(st, shots);
  const bangs = [.3, .62, .95, at('m01', .05), at('m01', .52)];
  sfx('scene1', 0, 'rain', .55, { loop: true }); sfx('scene1', 0, 'hum', .3, { loop: true });
  bangs.forEach((t, i) => sfx('scene1', t, 'knock', i < 3 ? 1.6 : 1.3));
  sfx('scene1', .1, 'sizzle', .35); sfx('scene1', roll0, 'rollup', 1.1);
  // window.CW_MUSIC.opener: the guitar opener under this scene, once the coordinator's file is in audio/bgm/ (chapter page)
  stopClock(D, (q, f) => {
    const cur = S(q), bang = bangs.some(t => q >= t && q < t + .2) ? 1 : 0;
    st.frame(q, f, { door: span(q, roll0, roll1), bang });
    const talkM = talk(q, 'scene1', PRE1, 'm01'), close = cur.kind === 'close';
    const doc = docSolder(st, q, f);
    castPose(st, cur, f, {
      doc,
      martin: { ...door, o: q < roll0 + .3 ? 0 : 1, look: cur.kind === 'wide' ? .55 : 0, eyeX: cur.kind === 'wide' ? .8 : .35 * Math.sin(q * 3.1), eyeY: close ? -.2 : 0,
        brow: close ? 1.3 : 1, lids: 0, mouth: talkM === 'X' ? 'wobble' : talkM, bob: 6 * Math.abs(Math.sin(q * 7)) * (close ? 1 : .4),
        headR: close ? 3 * Math.sin(q * 6) : 0, frontL: true, frontR: true, armL: -18, armR: -18, reachL: .82, reachR: .82,
        chest: { name: 'laptop', w: 330, y: -360 }, shut: blinkAt(q, 2) },
      claude: null,
    });
    st.fxHTML = cur.kind === 'wide' && Math.floor(q * 3) % 3 !== 2 ? sparks(...ironTip(st, doc), f) : '';
  });
}
