/* scene1.js — home (Gág's p05). The house and its flower bed, the old man and old woman standing on the paper to the
   right (lifted man5, woman5, on the spot where she drew them). Shots: wide, the two, the flower bed and the door,
   the two (lonely), her, him, her with the thought of a kitten, him, then he walks off right (since cut 3 only
   her sigh and his question are tagged by the narrator). Beat clock = PRE1 + the
   scene-clip word times. */
'use strict';
const PRE1 = .5;
// A mouth over the old woman's drawn one (page px of p05 where her smile is; read off a grid crop).
CUT_FACE.woman5 = { at: [3001, 1598], w: 26, h: 15 };
function scene1(p, D) {
  const P = PRE1, T = (t = 0) => P + t;
  const cam = paperCam(p, 'house', { x: 800, y: 450, z: 1.3 });
  mk('rect', { x: -500, y: -200, width: 2900, height: 1300, fill: '#eee8d6' }, cam.world).parentNode.insertBefore(cam.world.lastChild, cam.world.firstChild);   // paper behind the page: its cut-out edges never show the dark
  const man = cutPuppet(cam.stage, 'man5'), woman = cutPuppet(cam.stage, 'woman5');
  const M = pagePos('house', 'man5'), W = pagePos('house', 'woman5');
  const th = thought(cam.stage, 1305, 535, 1560, 392, 88);
  const kit = cutPuppet(th.inside, 'cat8a');
  // Gág's pipe smoke is hidden (man5.smoke) and drawn live in her ink from the pipe's end; chimney smoke from her chimney.
  const pipeG = mk('g', {}, cam.stage), pipe = inkSmoke(pipeG, 0, 0, { size: 13, rise: 150, drift: 34, curl: 15, waves: 1.5, period: 2.1, ink: 2, seed: 2 });
  const pg = SETS.house[0].page, wx = px => pg.wx + (px - pg.x0) * pg.s, wy = py => pg.wy + (py - pg.y0) * pg.s;
  const chim = inkSmoke(cam.stage, wx(950), wy(612), { size: 11, rise: 110, drift: 42, curl: 12, waves: 1.4, period: 2.7, ink: 2, seed: 5 });
  // the flower bed sways from its foot (skew about the bed's bottom edge), each patch at its own pace
  [['bedL', 1460, 0], ['bedF', 1450, 1.9], ['bedR', 1340, 3.4]].forEach(([n, py, ph]) => cam.move(n, q =>
    `translate(0 ${wy(py).toFixed(1)}) skewX(${(5 * Math.sin(q * 1.8 + ph) + 1.6 * Math.sin(q * 3.3 + ph * 2)).toFixed(2)}) translate(0 ${(-wy(py)).toFixed(1)})`));
  const turnOut = pageTurn(p, 0, .5, 'out'), turnIn = pageTurn(p, D - .1, .6, 'in');

  // Times on the beat clock.
  const WALK = T(28.3), W1 = T(13.96), M1 = T(19.69), WB = T(22.87), MB = T(26.06);   // he sets off right after "my dear" (cut 3: no narrator tags after her line or his)
  const THINK0 = T(23.62), THINK1 = T(25.25), SIGH = T(17.45);   // the thought has faded by the cut to him

  // Cameras: wide, a push towards the two, the house, flowers pan to the door, the two, then close-ups for each voice.
  cam.to({ x: 830, y: 470, z: 1.42 }, 0, T(2.2))
    .cut({ x: 1000, y: 620, z: 1.7 }, T(2.12)).to({ x: 1050, y: 630, z: 1.9 }, T(2.12), 2.2)          // "a very old man and a very old woman"
    .cut({ x: 480, y: 430, z: 1.5 }, T(4.5)).to({ x: 500, y: 440, z: 1.55 }, T(4.5), 1.9)             // "a nice clean house"
    .cut({ x: 740, y: 500, z: 2.1 }, T(6.4)).to({ x: 570, y: 485, z: 2.1 }, T(6.4), 1.9)               // flowers all around: along the bed
    .cut({ x: 509, y: 440, z: 2.7 }, T(8.34)).to({ x: 509, y: 430, z: 2.95 }, T(8.34), 1.9)            // except where the door was
    .cut({ x: 1170, y: 640, z: 1.65 }, T(10.28)).to({ x: 1180, y: 640, z: 2.05 }, T(10.28), 3.6)       // so very lonely: push in on the two
    .cut({ x: 1195, y: 612, z: 2.05 }, W1 - .08).to({ x: 1205, y: 614, z: 2.2 }, W1 - .08, 3.2)         // her: "If we only had a cat!"; her sigh
    .cut({ x: 1100, y: 610, z: 2.5 }, M1 - .1).to({ x: 1090, y: 612, z: 2.7 }, M1 - .1, 3)             // him: "A cat?"
    .cut({ x: 1320, y: 545, z: 1.7 }, WB - .1)                                                         // her, and the cloud with the kitten
    .cut({ x: 1095, y: 610, z: 2.6 }, MB - .1).to({ x: 1090, y: 612, z: 2.75 }, MB - .1, 2.2)           // him: "I will get you a cat, my dear"
    .cut({ x: 1150, y: 600, z: 1.35 }, T(28.2)).to({ x: 1250, y: 610, z: 1.5 }, T(28.2), D - T(28.2)); // he walks off right
  cam.soft(T(10.28), true).soft(MB - .1, true).soft(T(28.2), false)
    .soft(W1 - .08, false).soft(M1 - .1, false).soft(WB - .1, false);   // no blur on the two close shots: the far fence floated in the corner
  sfx('scene1', 0, 'birds', .4, { loop: true });
  sfx('scene1', THINK0, 'pop', .4); sfx('scene1', THINK0 + .15, 'mew2', .3); sfx('scene1', 0, 'page', .4);
  for (let k = 0; k < 8; k++) sfx('scene1', WALK + .2 + k * .36, 'step' + (k % 3 + 1), .25);
  sfx('scene1', D - .1, 'page', .5);

  stopClock(D, (q, f) => {
    cam.apply(q, f);
    const sad = span(q, T(11.6), T(12.8)) * (1 - span(q, W1 - .05, W1 + .3));   // "so very lonely": shoulders down, heads low
    // ---- the old woman: breath; head follows the talk; the sigh on "sighed"
    const wsp = lips(q, 'scene1', P, 'w01', 'w01b'), msp = lips(q, 'scene1', P, 'm01', 'm01b');
    const sigh = Math.sin(Math.PI * Math.min(1, Math.max(0, (q - SIGH) / 1.5)));
    const wTalk = wsp !== 'X' ? Math.sin(q * 9) * 1.3 : 0;
    const look = 5 * span(q, WALK + 1.3, WALK + 2);   // watches him go: head turns after him
    const bump = (a, b) => Math.sin(Math.PI * span(q, a, b)),
      g1 = bump(T(14.9), T(16.0)), g2 = bump(T(23.7), T(25.3)) * (1 + .15 * Math.sin(q * 10));   // "only had": both hands rise; "sweet little fluffy": hands up to the cheek
    const wg = wsp !== 'X' ? .5 + .5 * Math.sin(q * 6.4) : 0, dream = span(q, THINK0, THINK0 + .7) * (1 - span(q, THINK1, THINK1 + .7)),
      hush = msp !== 'X' ? 2.5 * Math.sin(q * 4.2) : 0;   // her hands talk with her; she nods while he answers; in the thought they lift
    woman.pose({ x: W.x, y: W.y, sq: 1 + .012 * Math.sin(q * 2.1) - .02 * sigh - .012 * sad,
      rot: .5 * Math.sin(q * 1.1 + 1),
      parts: { head: 3 * Math.sin(q * 1.3) + 6 * sad + 7 * sigh + (q > WB && q < THINK1 ? 5 * span(q, WB, WB + .5) : 0) + wTalk + look + hush + 6 * g1 - 7 * g2, armL: 2 * Math.sin(q * 1.4) + 8 * wg + 12 * g1 + 14 * g2 + 9 * dream - 4 * sad - 3 * sigh,
        armR: -(2 * Math.sin(q * 1.4 + 1) + 6 * Math.abs(Math.sin(q * 5.1 + 1)) * (wsp !== 'X' ? 1 : 0) + 12 * g1 + 14 * g2 + 9 * dream - 4 * sad) },
      move: { head: [0, 2 * sigh + 3 * sad] },
      mouth: wsp }, f);
    // ---- the old man: breath, a rock, smoke curling; his lines pulse the whole figure (his mouth is under the beard and pipe)
    const pulse = msp !== 'X' ? .01 * Math.abs(Math.sin(q * 8.5)) : 0;
    const w = cutWalk(q - WALK, { L: 125, A: 18, period: .72 });
    const going = q >= WALK, lean = going ? 3 * span(q, WALK - .5, WALK + .3) : 0;
    const pop = Math.sin(Math.PI * span(q, M1 - .05, M1 + .45));   // "A cat?": he starts, head up
    const mhead = 2 * Math.sin(q * 1.2) + (msp !== 'X' ? 5 * Math.sin(q * 7.3) : 0) + (wsp !== 'X' ? 3.5 * Math.sin(q * 3.2) : 0) - 7 * pop + 5 * sad + (going ? 2 * Math.sin(q * 5.5) : 0);
    const mrot = going ? lean : .7 * Math.sin(q * 1.3) + (msp !== 'X' ? 1.2 * Math.sin(q * 6) : 0);
    const mx = M.x + (going ? w.d : 0), mb = going ? w.bob : 3.5 * pop, msq = 1 + .012 * Math.sin(q * 2.3) + pulse - .02 * sad;
    man.pose({ x: mx, y: M.y, sq: msq, bob: mb, rot: mrot,
      parts: { legL: going ? w.legL : 0, legR: going ? w.legR : 0, head: mhead }, hide: ['smoke'] }, f);
    // the pipe's end (page 2418, 1372) rides on the figure: rotated about his feet and bobbed with him
    const pa = mrot * Math.PI / 180, ddx = (2418 - 2400) * .358, ddy = (1372 - 2190) * .358 * msq;
    pipe.px = mx + ddx * Math.cos(pa) - ddy * Math.sin(pa); pipe.py = M.y - mb + ddx * Math.sin(pa) + ddy * Math.cos(pa);
    pipeG.setAttribute('transform', `translate(${pipe.px.toFixed(1)} ${pipe.py.toFixed(1)})`);
    pipe(q); chim(q);
    // ---- the thought: a kitten like the one under the tree, sitting still and breathing
    th.pose(q, THINK0, THINK1);
    const kl = catLife(q, 1, { tail: 14, head: 6 });
    kit.pose({ x: 0, y: 56, s: 1.25, sq: 1 + .02 * Math.sin(q * 3), rot: 2 * Math.sin(q * 1.7) + kl.rot, bob: kl.bob, parts: kl.parts }, f);
    turnOut(q); turnIn(q);
  });
}
