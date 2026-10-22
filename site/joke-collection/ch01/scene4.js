/* scene4.js — 合, the laugh. Two-shot in silence, the class turns and bursts out laughing (a sound effect, in the
   pre-roll), the bun stall the next morning, and the title card. Speech (s10, s10b) starts PRE4 s in. */
'use strict';
const PRE4 = 5.9;
const S4 = {
  wide: .8,                          // cut to the class; everyone turns
  laugh: 1.55,                       // dead silence, then the laughing (3.5 s of sound)
  stall: PRE4 - .3,                  // next morning (music off from here)
  card: PRE4 + 5.1,                  // title card
};
// the laugh plays on its own; the morning theme of scene 1 comes back with the stall and runs into the title card
window.MUSIC_OFF = { ...(window.MUSIC_OFF || {}), scene4: t => t < S4.stall };
sfx('scene4', S4.laugh, 'laugh');
sfx('scene4', S4.card, 'sting');

// the title card: cut-paper letters (each tilted a little, in turn) on a construction-paper card
function s4cardSVG() {
  const cols = ['#f4e9c8', '#f2c14e', '#e8715a', '#7cc08a', '#6aa6d8'], lines = [['Breakfast', 150], ['in the', 150], ['Bathroom', 150]];
  let n = 0, out = '<g filter="url(#paper)"><rect width="1600" height="900" fill="#2e3b5a"/></g>' +
    '<g filter="url(#paper)" transform="rotate(-1.2 800 450)"><rect x="140" y="90" width="1320" height="720" rx="14" fill="#e9b872"/><rect x="170" y="120" width="1260" height="660" rx="8" fill="#f3d79f"/></g>';
  const ys = [320, 500, 700], sizes = [190, 110, 210];
  lines.forEach(([txt], li) => {
    const sz = sizes[li], w = sz * .62, x0 = 800 - (txt.length * w) / 2;
    [...txt].forEach((ch, i) => {
      if (ch === ' ') { n++; return; }
      const rot = ((n * 37) % 11 - 5) * 1.3, dy = ((n * 53) % 7 - 3) * 4, c = cols[n % cols.length]; n++;
      const x = x0 + i * w + w / 2, y = ys[li] + dy;
      out += `<g filter="url(#paper)" transform="translate(${x},${y}) rotate(${rot})"><text text-anchor="middle" font-family="Arial Black, Impact, Helvetica, sans-serif" font-weight="900" font-size="${sz}" fill="${c}" stroke="#3a2a1c" stroke-width="9" stroke-linejoin="round" paint-order="stroke">${ch}</text></g>`;
    });
  });
  return out;
}

function scene4(p, D) {
  const room = classroom(p), cam = room.cam, { me, bo, mates } = room;
  // 4.1 two-shot, silent beat; 4.2 wide: the class turns, a beat, then roars with laughter
  cam.cut(TWO, 0).cut({ x: 800, y: 450, z: 1 }, S4.wide);
  // 4.3 the bun stall, next morning
  const st = stallSet(p), scam = st.cam; scam.cut(STALL_VIEW, 0);
  // 4.4 title card
  const card = mk('g', {}, p); prop(card, s4cardSVG());
  const cardBun = prop(card, bunSVG());

  stopClock(D, (q, f) => {
    const inRoom = q < S4.stall, inStall = q >= S4.stall && q < S4.card, inCard = q >= S4.card;
    vis(cam.root, inRoom); vis(scam.root, inStall); vis(card, inCard);
    if (inCard) {
      const k = Math.floor((q - S4.card) * FPS / 2) % 2;         // the bun bounces on twos
      tf(cardBun, `translate(1340,${k ? 520 : 548}) scale(1.9) rotate(${k ? -6 : 5})`);
      tf(card, `translate(${(jit(f, 5) * .8).toFixed(1)},${(jit(f, 6) * .8).toFixed(1)})`);
      return;
    }
    if (inStall) {
      scam.apply(q, f);
      const t = q - S4.stall, sh = q >= clipAt('scene4', PRE4, 's10b');
      const glance = between(q, clipAt('scene4', PRE4, 's10') + .75, clipAt('scene4', PRE4, 's10b') - .1);
      // Me left, Bo right, both facing us; the seller holds a bun up over her cart
      st.me.pose({ x: STALL.me, y: STALL.ground, s: STALL.s, mouth: lips(q, 'scene4', PRE4, 's10b'), lids: sh ? .3 : .55, eyeX: glance ? 1 : 0, look: glance ? .5 : 0,
        headR: glance ? -2 : 0, shut: blinking(q, [S4.stall + 2.3, S4.stall + 3.6]), bob: onTwos(q) > 0 ? -1 : 0 }, f);
      st.bo.pose({ x: STALL.bo, y: STALL.ground, s: STALL.s, mouth: lips(q, 'scene4', PRE4, 's10'), lids: .1, headR: 2 * Math.sin(t * 1.4),
        shut: blinking(q, [S4.stall + 1.4, S4.stall + 3.9]), bob: onTwos(q + .2) > 0 ? -1 : 0 }, f);
      st.aunt.pose({ x: STALL.aunt.x, y: STALL.aunt.y, s: STALL.aunt.s, mouth: 'smile', hold: 'bun', armR: 62, look: -.4, eyeX: -1,
        shut: blinking(q, [S4.stall + 2.1]), bob: onTwos(q + .5) > 0 ? -1 : 0 }, f);
      return;
    }
    cam.apply(q, f);
    const L = q - S4.laugh, laughing = L >= 0 && L < 3.7;
    if (!laughing) room.matesPose(q, f, { lookAt: 800, t0: S4.wide + .12 });
    else for (const m of mates) {
      // everyone shakes on twos, each out of step; some clutch their belly, some tip the head back
      const k = m.k, ph = onTwos(q + (k % 3) * .04 + (k % 2) * .08), env = Math.min(1, L / .15) * (1 - span(q, S4.laugh + 3.3, S4.laugh + 3.7) * .6);
      const belly = k % 3 === 0, back = k % 2 === 0;
      m.p.pose({ x: m.x, y: m.y, s: m.s, sit: true, look: Math.max(-1, Math.min(1, (800 - m.x) / 400)), eyeX: 0, lids: .6, shut: k % 4 === 1, mouth: 'grin',
        bob: ph > 0 ? -12 * env * m.s : 0, squash: (ph > 0 ? .09 : 0) * env, headR: (back ? -14 : 8) * ph * env - (back ? 10 * env : 0),
        armL: belly ? -34 : 8 * ph * env, armR: belly ? -34 : -8 * ph * env }, f);
    }
    // Me and Bo seated, deadpan through all of it, each blinking at their own time
    const br = 1.5 * Math.sin(q * 1.3);
    me.pose({ ...room.ME, sit: true, look: 0, lids: .5, mouth: 'X', bob: br * .3, shut: blinking(q, [1.1, 3.4, 5.0]) }, f);
    bo.pose({ ...room.BO, sit: true, look: 0, lids: .5, mouth: 'X', bob: br * .3, headR: 0, shut: blinking(q, [.5, 2.6, 4.4]) }, f);
  });
}
