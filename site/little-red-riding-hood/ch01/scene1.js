/* scene1.js — home. */
'use strict';
// The ground at the cottage door is y 790; puppets here are at scale .6 (Red about 245 px tall).
const PRE1 = 1.5, DOOR = 6.75, OUT = 7.05, LAND = 8.25;
const SC1 = t => PRE1 + TIMINGS.scene1.parts.s01b + t;   // a moment in Mother's line
const T13 = 8.9, GIVE = 9.15, REACH = 9.85, TAKE = 10.35;
const T14 = SC1(5.25), T15 = PRE1 + TIMINGS.scene1.parts.s01c - .15, SC1c = t => PRE1 + TIMINGS.scene1.parts.s01c + t;
// 1.6: Red turns round and walks off along the garden path toward the woods; the path climbs and narrows into the
// distance, so she grows smaller as she goes. Mother waves from the door. A near tree trunk wipes to scene 2.
const T16 = T15 + 1.5, TURN = T16 + .25, WALK = TURN + .4, WIPE = 23.55;
const pathY = x => 806 - .05 * (x - 560), depth = x => .62 * (1 - .32 * Math.min(1, Math.max(0, (x - 830) / 970)));
// A raised finger that wags on twos while she says the words between a and b.
const wag = (q, a, b) => q > a && q < b ? 9 * (Math.floor(q * FPS / 2) % 2 ? 1 : -1) : 0;
const footY = (gy, s) => gy - 170 * s;   // hip height for feet on the ground line gy
function door(parent) {
  const g = mk('g', {}, parent);
  g.innerHTML = `<g filter="url(#paper)"><path d="M606,790 L606,476 Q675,424 744,476 L744,790 Z" fill="#8a5a32"/>
    <path d="M640,450 V790 M675,436 V790 M710,450 V790" stroke="#6e4426" stroke-width="3"/>
    <path d="M606,530 h70 M606,720 h70" stroke="#3b2a1e" stroke-width="9"/><circle cx="726" cy="630" r="7" fill="#caa24c"/></g>`;
  bakeAll(g);
  const open = [1, .7, .3, -.1, -.4, -.55];
  return q => { const k = Math.floor((q - DOOR) * FPS); tf(g, `translate(606,0) scale(${k < 0 ? 1 : open[Math.min(k, open.length - 1)]},1) translate(-606,0)`); };
}
function scene1(p, D) {
  // 1.1 from the treetops down to the cottage, then a slow push toward the door
  const cam = paperCam(p, 'home', { x: 800, y: -260, z: 1 });
  cam.to({ y: 450 }, .4, 3.2).to({ x: 690, y: 560, z: 1.45 }, 3.8, 2.8);
  // 1.2 medium on the door: it swings open and Red spins out into the garden, ending turned back toward the house
  cam.cut({ x: 745, y: 640, z: 2 }, 6.6);
  // 1.3 two-shot: Mother steps into the doorway and hands Red the basket
  cam.cut({ x: 760, y: 600, z: 1.7 }, T13);
  // 1.4 Mother close, facing us, finger raised; 1.5 Red close, nodding hard. Each is alone in her close-up.
  cam.cut({ x: 708, y: 552, z: 4.4 }, T14).soft(T14, true);
  // The reverse angle for Red's close-up: from the doorway out over the garden, so a second camera on its own set,
  // with Red drawn large in it instead of zooming.
  const out = paperCam(p, 'homeOut').soft(0, 'all'), redOut = redPuppet(out.stage);
  cam.cut({ x: 1000, y: 470, z: 1 }, T16).soft(T16, false).to({ x: 1140 }, WALK + .3, 3);
  const wipe = trunkWipe(p, WIPE, D - WIPE - .05);
  const puffs = smoke(cam.stage, 932, 84), theDoor = door(cam.stage), mom = motherPuppet(cam.stage), red = redPuppet(cam.stage);
  stopClock(D, (q, f) => {
    const reverse = q >= T15 && q < T15 + 1.5;
    vis(cam.root, !reverse); vis(out.root, reverse);
    if (reverse) {
      out.apply(q, f);
      redOut.pose({ x: 800, y: 430 + 194 * 2.88, s: 2.88, head: 'F', mouth: mouthAt('s01c', q - SC1c(0)), shut: blinking(q, [19.4]),
        nod: [.1, .45].some(t => q >= SC1c(t) && q < SC1c(t) + 2 / FPS) ? 22 : 0, rua: 4, rfa: -2 }, f);
      return;
    }
    cam.apply(q, f); puffs(q); theDoor(q); wipe(q);

    vis(mom.g, q >= T13);
    const held = q < TAKE, sm = .6;
    mom.pose({
      x: 690, y: 790 - 212 * sm, s: sm,
      ua: q < TAKE ? tween(q, GIVE, .45, 6, -45) : tween(q, TAKE + .15, .5, -45, 6),
      fa: q < TAKE ? tween(q, GIVE, .45, -6, -15) : tween(q, TAKE + .15, .5, -15, -6),
      finger: q >= T14 && q < T15, head: q >= T14 && q < T15 ? 'F' : 'P',
      rua: -28, rfa: -146 + wag(q, SC1(5.4), SC1(6.1)) + wag(q, SC1(6.7), SC1(7.9)), lua: 40, lfa: -58,
      basket: held, swing: held ? 6 * Math.exp(-(q - GIVE) * 2.5) * Math.sin((q - GIVE) * 9) * (q > GIVE) : 0,
      brow: q < T14 ? span(q, SC1(3.0), SC1(3.3)) : -.7 * span(q, SC1(6.6), SC1(6.8)), headR: q < T14 ? 4 * span(q, SC1(3.0), SC1(3.3)) : -3 * span(q, SC1(6.6), SC1(6.8)),
      mouth: mouthAt('s01b', q - SC1(0)), shut: blinking(q, [11.4, 15.6, 22.4]),
      ...(q >= TURN + .2 ? { ua: -118, fa: -30 + (Math.floor(q * FPS / 2) % 2 ? 22 : -22) } : {}),   // waving on twos
    }, f);

    vis(red.g, q >= DOOR + .25 && !(q >= T14 && q < T15));
    const u = Math.min(1, Math.max(0, (q - OUT) / (LAND - OUT))), after = Math.max(0, q - LAND), s = .6 + .02 * u;
    const settle = Math.exp(-after * 3) * Math.sin(after * 10), spinning = u > 0 && u < 1;
    const sinceTake = Math.max(0, q - TAKE), sway = 7 * Math.exp(-sinceTake * 2.2) * Math.sin(sinceTake * 8);
    if (q >= T16) {   // 1.6
      const w = walk(q - WALK, { period: .85, A: 26 }), xs = 830 + w.d * .5, sr = depth(xs), x = 830 + w.d * sr;
      const tw = Math.min(1, Math.max(0, (q - TURN) / .35)), walking = q > WALK;
      red.pose({ x, y: pathY(x) - (170 - w.drop) * sr, s: sr, turn: -Math.cos(Math.PI * tw),
        near: w.near, far: w.far, kNear: w.kNear, kFar: w.kFar, cape: walking ? 3 + 3 * Math.sin(2 * w.ph + .6) : 3,
        ua: walking ? -8 + 6 * Math.sin(w.ph) : -8, fa: -78, swing: walking ? 9 * Math.sin(w.ph - 1) : 0,
        headR: walking ? 2 * Math.sin(2 * w.ph) : 0, shut: blinking(q, [21.6]) }, f);
      return;
    }
    red.pose({
      x: 675 + 155 * ease(u), y: footY(790 + 10 * u, s) - 16 * Math.abs(Math.sin(Math.PI * 3 * u)), s,
      turn: Math.cos(Math.PI * 3 * ease(u)),                     // one and a half turns: she ends facing the door
      near: 12 * Math.sin(6 * Math.PI * u), far: -12 * Math.sin(6 * Math.PI * u),
      kNear: 22 * Math.abs(Math.sin(3 * Math.PI * u)), kFar: 14 * Math.abs(Math.sin(3 * Math.PI * u + 1)),
      cape: 3 + 30 * Math.sin(Math.PI * u) + 6 * settle,
      ua: spinning ? -8 - 62 * Math.sin(Math.PI * u) : q < TAKE ? tween(q, REACH, .4, 4 + 4 * settle, -70) : tween(q, TAKE + .05, .5, -70, -8),
      fa: spinning ? -24 : q < TAKE ? tween(q, REACH, .4, -10, -20) : tween(q, TAKE + .05, .5, -20, -78),
      basket: !held, swing: sway,
      headR: spinning ? 0 : -2 * settle - 3 * span(q, SC1(3.2), SC1(3.5)) + 3 * span(q, T15, T15 + .2), shut: blinking(q, [9.6, 13.9, 19.4]),

    }, f);
  });
}
