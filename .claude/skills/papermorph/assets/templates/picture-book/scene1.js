/* scene1.js — one scene of the film = one beat: a set, two puppets, a joined voice track, a sound effect. Copy it for
   scene2.js … and list them in chapter.html. A scene is a pure function of time: stopClock calls the drawing once per
   12 fps frame with q, the beat's clock, so pause, seek and ?beat=N&t=S show exactly the frame a viewer would see.
   Cut shots with cam.cut(view, t0), move with cam.to(view, t0, dur); a close-up on whoever speaks is a cut, not a zoom.
   Build the scene's pictures first (outside stopClock), then pose every puppet every frame. */
'use strict';
const PRE1 = 1.0;   // seconds of picture before the first word (the beat's `pre`)

function scene1(p, D) {
  const cam = paperCam(p, 'room');                       // the set 'room' from img/sets/sets.js; puppets go in cam.stage
  cam.cut({ x: 800, y: 450, z: 1 }, 0).to({ x: 860, y: 470, z: 1.12 }, 1, 9);   // a slow push-in
  const kid = kidPuppet(cam.stage, { coat: '#c94a3c', stripe: '#c94a3c' });
  const dad = kidPuppet(cam.stage, { coat: '#3e7fc4', stripe: '#f4f1ea' });
  sfx('scene1', .3, 'knock');                            // audio/sfx/knock.mp3 (SKILL/scripts/sfx.py)
  const enter = clipAt('scene1', PRE1, 's02');           // when the kid's first line starts
  // the kid side-steps in from the left with planted feet (spStep, cast.js): whole steps (2/3 s each) that end at x 580
  // just before the line; x comes from the distance the steps cover, so the feet never slide
  const STEP = 2 / 3, steps = Math.max(0, Math.floor((enter - .2) / STEP)), far = spStep(steps * STEP).d;

  stopClock(D, (q, f) => {
    cam.apply(q, f);
    const w = spStep(Math.min(Math.floor(q * 6) / 6, steps * STEP));   // on twos, like everything else
    kid.pose({ x: 580 - .95 * (far - w.d), y: 800, s: .95, look: .6, mouth: lips(q, 'scene1', PRE1, 's02', 's03'),
               legL: w.legL, legR: w.legR, bob: w.drop, shut: blinking(q, [2.4, 6.1]) }, f);
    dad.pose({ x: 1250, y: 800, s: 1, look: -.6, mouth: lips(q, 'scene1', PRE1, 's02b'), brow: q > enter ? -.3 : 0,
               shut: blinking(q, [3.3]) }, f);
  });
}
