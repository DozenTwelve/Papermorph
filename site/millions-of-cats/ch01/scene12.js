/* scene12.js — Not a single cat (p26). Shots (beat clock = PRE12 + the joined clip's time):
   1 a held stillness, the room and the two at the window from behind, a clock ticking (0 – s12_NOISE);
   2 "the noise stopped": the camera creeps closer; 3 "peeped out of the window": their heads lean to the glass (s12_PEEP);
   4 "They could not see a single cat!": hold on the empty window (stare12), then the page turn. */
'use strict';
const PRE12 = .5;
const s12_PEEP = markAt('scene12', PRE12, 'n10c.peeped'), s12_NOISE = PRE12 + 3.161, s12_LAST = clipAt('scene12', PRE12, 'n10d'), s12_STARE = clipAt('scene12', PRE12, 'stare12');
sfx('scene12', 0, 'room', .35, { loop: true });
sfx('scene12', .05, 'page', .5);
for (let t = .7; t < 15.4; t += .95) sfx('scene12', +t.toFixed(2), 'tick', .3);
sfx('scene12', s12_PEEP - .1, 'creak', .25);

function scene12(p, D) {
  const turnOut = pageTurn(p, 0, .6, 'out');
  const cam = paperCam(p, 'p26', { x: 600, y: 480, z: 1.3 });
  cam.to({ x: 575, y: 470, z: 1.45 }, 1.5, s12_PEEP - 1.5 - .3)
    .to({ x: 550, y: 440, z: 1.95 }, s12_PEEP - .3, 1.6)
    .to({ x: 548, y: 430, z: 2.1 }, s12_LAST, s12_STARE + 1 - s12_LAST);
  // the curtain the old man holds stirs in the draught, swaying from its rail (a layer lifted for this pass); the hand that holds it rides with it a little
  cam.move('curtain', q => `translate(700 253) skewX(${(1.1 * Math.sin(q * 1.3) + .5 * Math.sin(q * 3.1 + 1)).toFixed(2)}) translate(-700 -253)`);
  const at = pagePos('p26', 'pair26'), pair = cutPuppet(cam.stage, 'pair26');
  const turn = pageTurn(p, D - .1, .6, 'in');
  stopClock(D, (q, f) => {
    cam.apply(q, f);
    // still, breathing; a slow turn of the heads; on the peep both lean to the glass and look about; then frozen at the sight
    const lean = span(q, s12_PEEP - .25, s12_PEEP + .6), look = Math.sin((q - s12_PEEP) * 3.2) * 2 * span(q, s12_PEEP + .6, s12_PEEP + 1) * (1 - span(q, s12_LAST - .1, s12_LAST + .4));
    const sway = (1 - lean) * (Math.sin(q * .9) * 2 + Math.sin(q * 2.3) * .6);
    pair.pose({ ...at, sq: 1 + .014 * Math.sin(q * 1.8), rot: .8 * Math.sin(q * .7) * (1 - lean),
      parts: { heads: sway + look - 1.2 * lean }, move: { heads: [0, -2.5 * lean] } }, f);
    turnOut(q); turn(q);
  });
}
