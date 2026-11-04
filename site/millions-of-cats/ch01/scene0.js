/* scene0.js — the title page (Gág's p03). The arched MILLIONS OF CATS drops in on its own and settles, the camera
   pushes slowly in on the kitten under the tree while the narrator reads the title and her name, then a page turn.
   The kitten is lifted off the page (kitten3: body, head, tail): it breathes, its tail swishes, it looks up as the title
   lands and mews on "Gág". The flowers of the hill (layers fl1..fl9) sway from their feet. */
'use strict';
const PRE0 = .5;
CUT_FACE.kitten3 = { at: [1717, 1387], w: 20, h: 16 };
function scene0(p, D) {
  const P = PRE0, T = t => P + t;
  const cam = paperCam(p, 'title', { x: 800, y: 440, z: 1.0 });
  const L = cam.layer('letters');
  mk('rect', { x: -500, y: -200, width: 2900, height: 1300, fill: '#eee8d6' }, cam.world).parentNode.insertBefore(cam.world.lastChild, cam.world.firstChild);   // paper behind the page: its band for the letters is cut out, and shows dark until they drop
  // The slow push: from the whole page, down the trunk, to the kitten (world about 823, 505); eased over the whole scene.
  cam.to({ x: 800, y: 400, z: 1.18 }, 0, T(2.4)).to({ x: 823, y: 500, z: 2.1 }, T(2.4), D - T(2.4) - .1);
  cam.soft(T(2.4), true);   // "By Wanda Gág": the far page goes soft, the kitten stays the picture
  sfx('scene0', T(.0), 'whoosh', .3); sfx('scene0', T(.28), 'chime', .35);
  sfx('scene0', T(3.45), 'mew1', .3); sfx('scene0', D - .05, 'page', .5);
  const kit = cutPuppet(cam.stage, 'kitten3'), K = pagePos('title', 'kitten3');
  const pg = SETS.title[0].page, fy = py => pg.wy + (py - pg.y0) * pg.s;   // a page y in world px: the flowers' feet
  const FL = [1695, 1640, 1610, 1555, 1525, 1545, 1580, 1620, 1680];
  FL.forEach((py, i) => cam.move('fl' + (i + 1), q => `translate(0 ${fy(py).toFixed(1)}) skewX(${(5 * Math.sin(q * 1.7 + i * 1.3) + 1.5 * Math.sin(q * 3.1 + i)).toFixed(2)}) translate(0 ${(-fy(py)).toFixed(1)})`));
  const turn = pageTurn(p, D - .1, .6, 'in');
  stopClock(D, (q, f) => {
    cam.apply(q, f);
    // The letters drop in from above with a bounce, landing on "Millions", then breathe a hair on their pins.
    const u = q - .1, fall = u < 0 ? -260 : u < .34 ? -260 * (1 - ease(u / .34)) ** 2 : u < .5 ? -14 * Math.sin((u - .34) / .16 * Math.PI) : 0;
    const sway = q > .5 ? Math.sin(q * 1.6) * .35 : 0;
    L.setAttribute('transform', `translate(0 ${fall.toFixed(1)}) rotate(${sway.toFixed(2)} 600 70)`);
    vis(L, q >= .08);
    // the kitten: a breath, the tail swishing, glances up at the falling letters and holds there, then back to us; a mew
    const up = span(q, .05, .45) * (1 - span(q, 1.5, 2.1)), mew = q > T(3.45) && q < T(3.45) + .4 ? 'C' : 'X';
    const cl = catLife(q, 0, { tail: 14, head: 5 });
    kit.pose({ x: K.x, y: K.y, s: K.s, sq: 1 + .014 * Math.sin(q * 2.3) + .03 * up, rot: .8 * Math.sin(q * 1.2),
      parts: { tail: cl.parts.tail, head: -7 * up + cl.parts.head }, move: { head: [0, -3 * up] }, mouth: mew }, f);
    turn(q);
  });
}
