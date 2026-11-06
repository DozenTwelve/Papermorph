/* scene1.js — one scene of the film = one beat: a set, three puppets, a joined voice track, a sound effect, and the
   things a listen-and-find stop asks for. Copy it for scene2.js … and list them in chapter.html. A scene is a pure
   function of time: stopClock calls the drawing once per 12 fps frame with q, the beat's clock, so pause, seek and
   ?beat=N&t=S show exactly the frame a viewer would see.
   Cut shots with cam.cut(view, t0), move with cam.to(view, t0, dur); a close-up on whoever speaks is a cut, not a zoom.
   Build the scene's pictures first (outside stopClock), then pose every puppet every frame. */
'use strict';
const PRE1 = 1.0;   // seconds of picture before the first word (the beat's `pre`)
let THINGS1 = [];   // what can be tapped in this picture, filled each time the scene builds; the beat's findWords reads it

function scene1(p, D, m) {
  const cam = paperCam(p, 'room');                       // the set 'room' from img/sets/sets.js; puppets go in cam.stage
  cam.cut({ x: 800, y: 450, z: 1 }, 0).to({ x: 860, y: 470, z: 1.12 }, 1, 9);   // a slow push-in
  const kid = kidPuppet(cam.stage, { coat: '#c94a3c', stripe: '#c94a3c' });
  const dad = kidPuppet(cam.stage, { coat: '#3e7fc4', stripe: '#f4f1ea' });
  const cat = catPuppet(cam.stage);                      // the four-legged rig (cast.js, section 3)
  // The listen-and-find stop after the scene (chapter.html's FIND1): every thing a child might tap says its name
  // (audio/en/w-<word>.mp3), so list the background's people too, not only what is asked for.
  THINGS1 = [{ g: cat.g, word: 'cat' }, { g: dad.g, word: 'dad' }, { g: kid.g, word: 'kid' }];
  sfx('scene1', 0, 'room', .4, { loop: true });          // a bed: room tone laid again and again to the scene's end,
                                                         // through the find stop's wait too (sound.md)
  sfx('scene1', .3, 'knock');                            // audio/sfx/knock.mp3 (SKILL/scripts/sfx.py)
  const enter = clipAt('scene1', PRE1, 's02');           // when the kid's first line starts
  // a word inside a line: m('line.mark') is the beat-clock time of [[mark]] in that line (pre and the line's place in
  // the joined clip already counted: adding clipAt to it times the action late by the line's start)
  const come = m('s02b.open');                           // Dad waves the kid in on "Come in"
  // the kid side-steps in from the left with planted feet (spStep, cast.js): whole steps (2/3 s each) that end at x 580
  // just before the line; x comes from the distance the steps cover, so the feet never slide
  const STEP = 2 / 3, steps = Math.max(0, Math.floor((enter - .2) / STEP)), far = spStep(steps * STEP).d;
  // the cat walks in ahead of the kid and stops at its feet: route gives x and the distance d that plants the paws
  const CAT = [[0, -160], [Math.max(1, enter - .4), 330]];

  stopClock(D, (q, f) => {
    cam.apply(q, f);
    const w = spStep(Math.min(Math.floor(q * 6) / 6, steps * STEP));   // on twos, like everything else
    kid.pose({ x: 580 - .95 * (far - w.d), y: 800, s: .95, look: .6, mouth: lips(q, 'scene1', PRE1, 's02', 's03'),
               legL: w.legL, legR: w.legR, bob: w.drop, shut: blinking(q, [2.4, 6.1]) }, f);
    const r = route(q, CAT, 1.3);
    cat.pose({ x: r.x, y: 800, s: 1.3, d: r.d, stand: r.stand, tail: 10 * Math.sin(q * 2), look: q > enter ? 1 : 0,
               shut: blinking(q, [3.0, 7.2]) }, f);
    dad.pose({ x: 1250, y: 800, s: 1, look: -.6, mouth: lips(q, 'scene1', PRE1, 's02b'), brow: q > enter ? -.3 : 0,
               armL: tween(q, come, .4, 0, 70) - tween(q, come + 1.2, .5, 0, 70),
               shut: blinking(q, [3.3]) }, f);
  });
}
