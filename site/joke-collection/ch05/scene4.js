/* scene4.js — the tag, at the beach (PRE4 2.0; round 2). Cut in on the floating penguin, the wide (the policeman is on
   this beach too), he eats a chip, the second penguin comes along the shore from the right to his chips, he finds it
   looking up, steps away, it follows a beat late, then looks innocent; the man calls from the sea; the policeman's
   stare at us (the film's only look at the camera); title card. */
'use strict';
const PRE4 = 2.0;
window.S4_STOP = 14.8;   // the music's fade ends under "He'll love it!", before the stare

/* ---------- timeline (beat clock) ---------- */
const S4 = { wide: 1.8, cop1: 4.2, two: 5.2, chips: 7.6, cop2: 8.4, two2: 9.4, swim: 11.9, snap: 12.05, two3: 13.3, man2: 14.2, stare: 15.4, card: 18.3,
  chomp: 4.55, sigh: 5.4, reach: 7.6, step: [9.6, 10.0], follow: [10.0, 10.5], steps: [9.667, 9.833, 10.0], honk: 16.6 };
const S4_FLOAT = { x: 1420, y: 585, z: 4.6 };   // BEACH_FLOAT nudged right so the man's sleeve is out of frame
const S4_LOOK = { x: 470, y: 570, z: 2.6 };                      // tight two-shot of the look: his face and its face
const S4_SEA = { x: 1200, y: 450, z: 3 };                       // the man in the sea, framed so the cap is not cut
const S4_CHIPS = { x: 570, y: 690, z: 3.8 };                      // insert: the chips and the second penguin's head
sfx('scene4', .05, 'waves', .35);
sfx('scene4', .05, 'gulls', .3);
for (let t = 32 / 6; t < 7.4; t += 1 / 6) sfx('scene4', +t.toFixed(3), 'patter1', .5);   // its walk in from the right, the last step at the stop
S4.steps.forEach(t => sfx('scene4', t, 'step1', .35));                                    // his big step to the left
for (let t = 10.0; t < 10.5; t += 1 / 6) sfx('scene4', +t.toFixed(3), 'patter1', .4);     // its three small steps after him, on the waddle's foot changes
sfx('scene4', 10.833, 'patter1', .4);   // its foot comes down
sfx('scene4', S4.chomp, 'chomp');
sfx('scene4', 11.85, 'whoosh', .4);                  // its peak lands on the snap, before "You"
sfx('scene4', S4.honk, 'honk');
sfx('scene4', S4.card, 'sting');

function scene4(p, D) {
  const b = beachSet(p), cam = b.cam, card = titleCard(p);
  vis(card.children[1], false);                                  // the kit's few-pixel peek: replaced by our own, behind the strip
  const tc = mk('g', { 'clip-path': 'url(#s4Peek)' }, card), tp = penguinPuppet(tc);
  mk('rect', { x: 0, y: 0, width: 1600, height: 440 }, mk('clipPath', { id: 's4Peek' }, card));
  card.insertBefore(tc, card.lastChild);
  const COP2 = COP_CU(380);
  cam.cut(S4_FLOAT, 0).cut(BEACH_WIDE, S4.wide).cut(COP_CU(BEACH.cop), S4.cop1).cut(BEACH_TWO, S4.two).cut(S4_CHIPS, S4.chips).cut(COP_CU(BEACH.cop), S4.cop2)
    .cut(BEACH_TWO, S4.two2).cut(S4_LOOK, 10.5).cut(BEACH_TWO, 11.2).cut(BEACH_SWIM, S4.swim).to(S4_SEA, S4.snap, .15).cut(BEACH_TWO, S4.two3).cut(S4_SEA, S4.man2).cut(COP2, S4.stare);

  stopClock(D, (q, f) => {
    const onCard = q >= S4.card;
    vis(cam.root, !onCard); card.at(q, S4.card);
    cam.apply(q, f); b.roll(q);
    const blink = (...t) => blinking(q, t);

    /* the man in the sea: treads water, looks to the shore; he raises his hand at 11.9, then waves with the whole arm while he calls */
    const speak = q >= 12.05 && q < 15.2, wave = ease((q - 11.9) / .2);
    b.man.pose({ x: BEACH.man, y: BEACH.sea + b.bob(q), s: BEACH.ss, look: -.5, eyeX: -1, eyeY: .1, lids: speak ? 0 : .1, brow: speak ? .4 : 0,
      mouth: speak ? lips(q, 'scene4', PRE4, 's14') : 'smile', shut: blink(1.6, 5.9, 9.4, 13.8),
      armR: 10 * (1 - wave) + wave * (135 + 18 * Math.sin((q - 11.9) * 9)), armL: 15 + 8 * Math.sin(q * 3), headR: speak ? 3 * Math.sin(q * 3) : 0 }, f);
    /* the penguin floats in its ring, shades on, flippers paddling; on "He'll love it!" it waves a flipper */
    const hi = span(q, 14.3, 14.5) * (1 - span(q, 15.2, 15.4));
    b.peng.pose({ x: BEACH.peng, y: BEACH.float + b.bob(q + .7), s: BEACH.ss, ring: true, shades: 'on', sticker: true, look: -.2,
      flipL: 50 + 9 * Math.sin(q * 3.1), flipR: 50 + 9 * Math.sin(q * 2.7 + 1) + hi * (40 + 25 * Math.sin((q - 14.3) * 11)), headR: 4 * Math.sin(q * 1.2) }, f);

    /* the policeman: chips in his screen-left hand; one chip to the mouth (eat 1 = in the mouth, .5 = halfway) */
    const e = (q < S4.cop1 ? 0 : q < S4.chomp ? ease((q - S4.cop1) / .35) : q < S4.chomp + .1 ? 1 : q < 4.85 ? 1 - ease((q - S4.chomp - .1) / .2) : q < S4.reach ? 0 :
      q < S4.cop2 ? .3 * ease((q - S4.reach) / .8) : .3 + .3 * ease((q - S4.cop2) / .4));
    const copX = BEACH.cop - 90 * span(q, ...S4.step), stepping = q >= S4.step[0] && q < S4.step[1] + .1, w = stepping ? spWalk(q) : {};
    const chewing = q >= 4.7 && q < 5.35;
    const sighA = Math.sin(Math.PI * span(q, S4.sigh, S4.sigh + .8)) + Math.sin(Math.PI * span(q, 2.2, 2.9)); // two sighs: in the wide, after the bite
    const down = span(q, 8.6, 9.1) * (1 - span(q, 12.2, 12.6)), sea = span(q, 12.2, 12.6) * (1 - span(q, 13.3, 13.5)) + span(q, 13.5, 13.7) * (1 - span(q, S4.stare, S4.stare + .7)) ;
    const toCam = span(q, S4.stare, S4.stare + .7);
    // 9.4-11.9: he looks down at the penguin, 13.3-14.2 both turn to the sea
    const seaLook = (q >= 13.3 && q < 14.4) ? 1 : 0, sd = down * (1 - seaLook), glum = 1 - sd - toCam - seaLook;
    const co = { ...w, x: copX, y: 800 + 2 * Math.sin(q * 5.2) + (stepping ? 0 : 0), s: .9, holdL: 'chips', armL: -40, eat: e, hold: (q >= S4.cop1 && q < S4.chomp + .1) || q >= S4.reach ? 'chip' : null, armR: -50,
      look: .25 * glum + .1 * sd + .35 * seaLook, eyeX: .8 * glum + .5 * sd + seaLook, eyeY: -.1 * glum + .7 * sd - .1 * seaLook,
      lids: q >= S4.stare ? .25 - .07 * toCam : .45 * glum + .2 * sd + .35 * seaLook, brow: .4 * sd + (q >= S4.cop2 && q < 9.4 ? .4 : 0), headR: 3 * sd, squash: .04 * sighA + .012 * Math.sin(q * 2.4),
      mouth: chewing && Math.floor(q * 6) % 2 ? 'flat' : chewing ? 'chew' : sighA > .1 ? 'frown' : 'flat',
      shut: blink(1.0, 3.3, 6.5, 8.0, 10.2, 12.9, 16.2, 17.6), bob: stepping ? w.bob || 0 : 0 };
    // the look: he looks down at it, eyes on it (10.5-10.95); when it looks away his eyes narrow (brow cross) on the penguin
    if (q >= 10.5 && q < 10.95) Object.assign(co, { eyeX: .9, eyeY: .8, headR: 4, lids: .3, brow: .4 });
    else if (q >= 10.95 && q < 12.2) Object.assign(co, { eyeX: .8, eyeY: .7, headR: 3, lids: .22, brow: -.3 });
    b.cop.pose(co, f);

    /* the second penguin: along the shore from the right (it is in the cut's frame only as it walks in), stops at 640 at
       7.4; in the chips insert it looks at the chips, then at him; when he steps left it follows three small steps
       (to 560, ~180 px off) and stops with a foot up (10.5-10.8), they look at each other (10.5-10.9), then it snaps its
       gaze to the sky with its flippers behind its back (from 10.9); at the stare it pulls up into his frame and honks */
    const F = S4.follow, walking1 = q >= S4.two && q < 7.4, walking2 = q >= F[0] && q < F[1];
    const px = q < 7.4 ? Math.max(640, 1070 - 195 * (q - S4.two)) : 640 - 80 * span(q, ...F);
    const wd = walking1 || walking2 ? pengWaddle(q) : { rock: 0, footL: 0, footR: 0, bob: 0 };
    const late = q >= F[1] && q < 10.833, mutual = q >= 10.5 && q < 10.95, sky = q >= 10.95 && q < 13.3, seaB = q >= 13.3 && q < 14.4;
    const chipLook = q >= 7.6 && q < 8.1, nod = Math.sin(Math.PI * span(q, 8.1, 8.4));
    const camT = span(q, 15.6, 16.0), pull = span(q, 15.8, 16.3);
    vis(b.peng2.g, q >= S4.two);
    const hon = (q >= S4.honk && q < S4.honk + .16) || (q >= S4.honk + .2 && q < S4.honk + .62);
    const gaze = walking1 ? [.6, -.3, .6] :                          // [eyeX, eyeY, look]
      q >= 15.6 ? [0, 0, 0] : seaB ? [1, -.1, .3] : sky ? [.5, -1, .4] : mutual || (q >= F[1] && q < 10.5) ? [-.6, -.9, -.45] :
      walking2 ? [-.4, -.3, -.5] : chipLook ? [-.5, -.9, -.45] : q >= 8.4 && q < 10.0 ? [-.5, -.7, -.45] : [0, -.2, 0];
    b.peng2.pose({ ...wd, footR: late ? 22 : wd.footR, rock: late ? 6 : wd.rock, x: px, y: 800 - 38 * pull, s: .9,
      look: gaze[2], eyeX: gaze[0], eyeY: gaze[1], lids: sky ? .1 : 0,
      headR: -3 * (chipLook ? 1 : 0) + 4 * nod + (sky ? 5 : 0) - (hon ? 6 : 0), beak: hon ? .8 : q >= 7.6 && q < 8.4 ? .3 + .25 * Math.sin(q * 16) : 0,
      bob: wd.bob + (walking1 || walking2 ? 0 : .8 * Math.sin(q * 2.4)) + (hon ? -4 : 0), shut: blink(8.9, 11.6, 13.0, 15.8),
      flipL: sky ? -28 : 6, flipR: sky ? -28 : 6 }, f);

    /* the title card's penguin: the card's own peek is a few pixels, so a bigger one rises behind the strip at 18.9 and blinks */
    const up = span(q, 18.9, 19.3);
    vis(tp.g, onCard);
    tp.pose({ x: 1452, y: 640 - 175 * up, s: .85, look: -.6, eyeX: -1, eyeY: .3, shut: blink(19.9, 21.0) }, f);
  });
}
