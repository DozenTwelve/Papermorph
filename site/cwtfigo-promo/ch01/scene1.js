/* scene1.js — The door. Night, rain, Doc seated at his bench soldering under the lamp; Martin bangs on the shut door shouting off screen, the door rolls
   up, and his panic is a frontal single in the doorway, punched in on "Omarchy". */
'use strict';
const PRE1 = 1.6;
// Doc seated at his bench, a little hunched over the board: the left mitten steadies the board, the iron's tip dabs at
// it, his eyes on the work. `extra` overrides any key; `up` (0 … 1) lifts his head and the iron off the work.
const IRON = { name: 'iron', w: 300, upright: true, r: 160, x: -40, y: 0 };
const IRON_OFF = [59.7, -16.8];   // the iron's tip from the right mitten, for IRON at Doc's scale
function docSolder(st, q, f, extra = {}, up = 0) {
  const dab = 4 * Math.abs(Math.sin(q * 4.3)) * (1 - up);
  const base = { x: PLACE.doc[0], y: PLACE.doc[1], look: .1, eyeY: 1 - 1.2 * up, eyeX: .2, lids: .45 * (1 - up), lean: 3 * (1 - up),
    headY: 12 * (1 - up), frontL: true, frontR: true, shut: blinkAt(q, 1) };
  const tip = [BOARD[0] + 4 + 6 * Math.sin(q * 1.3), BOARD[1] - 12 - dab - 40 * up];
  return { ...base, ...st.doc.aim({ ...base, lean: 0 }, 'L', [BOARD[0] - 52, BOARD[1] - 16]),
    ...st.doc.aim({ ...base, lean: 0 }, 'R', [tip[0] + IRON_OFF[0], tip[1] + IRON_OFF[1]]), hold: IRON, ...extra };
}
// Doc between watching and working: mostly up (1), back down to the board for a moment every few seconds.
function glance(q, seed = 0) { const u = (q + seed) % 5.2; return 1 - span(u, 3.4, 3.7) + span(u, 4.5, 4.8); }
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
  bangs.forEach((t, i) => sfx('scene1', t, 'knock', i < 3 ? 2.2 : 1.5));
  sfx('scene1', .1, 'sizzle', .35); sfx('scene1', roll0, 'rollup', 1.1);
  stingAt('scene1', 0, 'opener', 1.1);   // the guitar opener, 3 s, then the bed comes in under it (chapter page)
  stopClock(D, (q, f) => {
    const cur = S(q), bang = bangs.some(t => q >= t && q < t + .2) ? 1 : 0;
    st.frame(q, f, { door: span(q, roll0, roll1), bang });
    const talkM = talk(q, 'scene1', PRE1, 'm01'), close = cur.kind === 'close';
    // the first bang: his head comes up off the work, the left mitten pushes his glasses up, eyes on the door
    const up = span(q, bangs[0], bangs[0] + .2), push = span(q, .5, .66) - span(q, .86, 1.05);
    let doc = docSolder(st, q, f, up > 0 ? { look: -.35 * up, eyeX: -up, mouth: up > .5 && q < roll0 ? 'O' : 'X', brow: 0 } : {}, up);
    if (push > 0) {
      const [gx, gy] = st.doc.point({ ...doc, lean: 0 }, [352, 430]);   // the left lens's outer rim
      const to = st.doc.aim({ ...doc, lean: 0 }, 'L', [gx - 10, gy + 6]), from = { armL: doc.armL, reachL: doc.reachL };
      doc = { ...doc, armL: from.armL + (to.armL - from.armL) * push, reachL: from.reachL + (to.reachL - from.reachL) * push, headY: doc.headY - 6 * push };
    }
    castPose(st, cur, f, {
      doc,
      martin: { ...door, o: q < roll0 + .3 ? 0 : 1, look: cur.kind === 'wide' ? .55 : 0, eyeX: cur.kind === 'wide' ? .8 : .35 * Math.sin(q * 3.1), eyeY: close ? -.2 : 0,
        brow: close ? 1.3 : 1, lids: 0, mouth: talkM === 'X' ? 'wobble' : talkM, bob: 6 * Math.abs(Math.sin(q * 7)) * (close ? 1 : .4),
        headR: close ? 3 * Math.sin(q * 6) : 0, frontL: true, frontR: true, armL: -18, armR: -18, reachL: .82, reachR: .82,
        chest: { name: 'laptop', w: 330, y: -360 }, shut: blinkAt(q, 2) },
      claude: null,
    });
    st.fxHTML = cur.kind === 'wide' ? solderSmoke(...ironTip(st, doc), q) + (up < .5 && Math.floor(q * 3) % 3 === 0 ? sparks(...ironTip(st, doc), f) : '') : '';
  });
}
