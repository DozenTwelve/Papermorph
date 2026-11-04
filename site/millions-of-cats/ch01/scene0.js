/* scene0.js — the title page (Gág's p03). The arched MILLIONS OF CATS drops in on its own and settles, the camera
   pushes slowly in on the kitten under the tree while the narrator reads the title and her name, then a page turn.
   The kitten is part of the baked page (not lifted), so the life is the camera, the letters and a small flicker of paper. */
'use strict';
const PRE0 = .5;
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
  const turn = pageTurn(p, D - .1, .6, 'in');
  stopClock(D, (q, f) => {
    cam.apply(q, f);
    // The letters drop in from above with a bounce, landing on "Millions", then breathe a hair on their pins.
    const u = q - .1, fall = u < 0 ? -260 : u < .34 ? -260 * (1 - ease(u / .34)) ** 2 : u < .5 ? -14 * Math.sin((u - .34) / .16 * Math.PI) : 0;
    const sway = q > .5 ? Math.sin(q * 1.6) * .35 : 0;
    L.setAttribute('transform', `translate(0 ${fall.toFixed(1)}) rotate(${sway.toFixed(2)} 600 70)`);
    vis(L, q >= .08);
    turn(q);
  });
}
