/* scene14.js — A very homely little cat (p27, then p28). Beat clock = PRE14 + the joined clip's time (clipAt below).
   It follows scene13's stop on the same page, so it opens on the game's frame, no page turn:
   1 push-in from that frame to the kitten in the grass, trembling ("In it sat one little frightened kitten"), 0 – 3.0;
   2 two-shot, "They went out and picked it up": she comes down the ridge to it, he leans in, the kitten rises into her
     arms and the camera rises with it (so the painted kitten the set keeps is left below the frame), 3.0 – 5.5;
   3 cut to p28: the kitten alone on its mound, big, thin and scraggly, "It was thin and scraggly";
   4 the talk, shot and reverse shot on the blank paper of p28 (the speakers are the p27 figures lifted large, in the
     blank part of the sheet; the mound is out of frame): her "Poor little kitty", him "Dear little kitty" and "How does it
     happen…", with the kitten listening between (it looks up, an ear-flick of a head turn, a tremble);
   5 close on the kitten for its own lines, with a mouth on Gág's face (k12, k12b), slowly closer, the head turning
     small ways as it says "nobody bothered about me".
   Ends with the page turning in for scene15. */
'use strict';
const PRE14 = .5;
CUT_FACE.kitten28 = { at: [1545, 1801], w: 34, h: 26 };   // the white of the cheek right of the nose where the mouth slit is drawn; under the nose the face is black fur, an ink mouth would vanish
sfx('scene14', 0, 'birds', .3, { loop: true });

const s14_C = (clip, t = 0) => clipAt('scene14', PRE14, clip, t);
const s14_PK = (q, t, w = .2) => Math.max(0, 1 - Math.abs(q - t) / w);
const s14_START = { x: 790, y: 470, z: 1.2 };   // where scene13's game left the camera
const s14_WALK = [696, 605, 600, 662];          // her way down the ridge to the kitten: x0, y0, x1, y1
sfx('scene14', s14_C('n12', 3.3), 'step1', .3); sfx('scene14', s14_C('n12', 3.6), 'step2', .3); sfx('scene14', s14_C('n12', 3.9), 'step3', .3);
sfx('scene14', s14_C('n12', 4.05), 'pop', .35); sfx('scene14', s14_C('n12', 4.1), 'mew2', .3);
sfx('scene14', s14_C('k12', .1), 'mew4', .25);

function scene14(p, D) {
  const T1 = s14_C('n12', 3.0), T2 = s14_C('n12', 5.5), TP = markAt('scene14', PRE14, 'n12.picked') - .1;   // cuts; the pick-up
  const W1 = s14_C('w12', -.05), K1 = s14_C('w12', 1.7), W2 = s14_C('n12b', 0), M1 = s14_C('m12', -.1), K2 = s14_C('m12', 1.55),
    M2 = s14_C('n12c', -.05), K3 = s14_C('m12b', 2.55), M3 = s14_C('m12b', 5.45), K4 = s14_C('k12', -.1);
  const WALK0 = s14_C('n12', 3.2);

  // ---- p27: the grass ----
  const A = paperCam(p, 'p27', s14_START);
  A.to({ x: 452, y: 748, z: 3.0 }, .25, 2.6)
   .cut({ x: 505, y: 650, z: 1.9 }, T1).to({ x: 515, y: 640, z: 2.1 }, T1, TP - T1)
   .to({ x: 525, y: 590, z: 2.3 }, TP, T2 - TP);
  const wAt = pagePos('p27', 'woman27'), mAt = pagePos('p27', 'man27'), kAt = pagePos('p27', 'kitten27');
  const man = cutPuppet(A.stage, 'man27'), woman = cutPuppet(A.stage, 'woman27'), kit = cutPuppet(A.stage, 'kitten27');

  // ---- p28: the mound (the kitten), and the blank paper beside it (the two old people's close-ups) ----
  const B = paperCam(p, 'p28', { x: 770, y: 690, z: 3.4 });
  B.to({ x: 772, y: 686, z: 3.9 }, s14_C('n12', 5.55), K1 - s14_C('n12', 5.55))   // a slow push on the kitten ("thin and scraggly")
   .cut({ x: 1000, y: 300, z: 1.3 }, W1).to({ x: 1004, y: 304, z: 1.36 }, W1, K1 - W1)
   .cut({ x: 775, y: 684, z: 3.7 }, K1).to({ x: 775, y: 680, z: 3.9 }, K1, W2 - K1)
   .cut({ x: 1000, y: 300, z: 1.3 }, W2).to({ x: 996, y: 296, z: 1.36 }, W2, M1 - W2)
   .cut({ x: 1000, y: 300, z: 1.3 }, M1).to({ x: 1004, y: 300, z: 1.38 }, M1, K2 - M1)
   .cut({ x: 775, y: 684, z: 3.5 }, K2).to({ x: 775, y: 680, z: 3.7 }, K2, M2 - K2)
   .cut({ x: 1000, y: 300, z: 1.34 }, M2).to({ x: 998, y: 298, z: 1.4 }, M2, K3 - M2)
   .cut({ x: 775, y: 684, z: 3.3 }, K3).to({ x: 775, y: 680, z: 3.6 }, K3, M3 - K3)
   .cut({ x: 1000, y: 300, z: 1.4 }, M3).to({ x: 1002, y: 302, z: 1.46 }, M3, K4 - M3)
   .cut({ x: 772, y: 652, z: 4.4 }, K4).to({ x: 772, y: 646, z: 5.6 }, K4, D);
  const kAt28 = pagePos('p28', 'kitten28'), kitten = cutPuppet(B.stage, 'kitten28');
  const womanB = cutPuppet(B.stage, 'woman27'), manB = cutPuppet(B.stage, 'man27');
  const turn = pageTurn(p, D - .1, .6, 'in');

  // where the kitten goes: up into her arms (held low in front of her: the hands are out at (-62, -158) of her feet, but that puts it among his pipe smoke)
  const HAND = [-44, -112];
  const hop = u => Math.sin(Math.PI * u);

  stopClock(D, (q, f) => {
    const onA = q < T2;
    vis(A.root, onA); vis(B.root, !onA);
    const breathe = Math.sin(q * 2.3);
    if (onA) {
      A.apply(q, f);
      // she comes down the ridge (a stepping bob, leaning forward), then bends over the kitten
      const wu = span(q, WALK0, TP), going = q > WALK0 && q < TP;
      const wx = q < WALK0 ? wAt.x : s14_WALK[0] + (s14_WALK[2] - s14_WALK[0]) * wu, wy = q < WALK0 ? wAt.y : s14_WALK[1] + (s14_WALK[3] - s14_WALK[1]) * wu;
      const bend = span(q, TP - .25, TP + .2) * (1 - span(q, TP + .8, TP + 1.2));
      woman.pose({ x: wx, y: wy - (going ? Math.abs(Math.sin((q - WALK0) * 2 * Math.PI / .5)) * 8 : 2 * breathe * (q > TP ? 1 : 0)),
        rot: (going ? -3 + 2 * Math.sin((q - WALK0) * 2 * Math.PI / .5) : -5 * bend + 1.2 * Math.sin(q * 1.3)), sq: 1 + .012 * breathe,
        parts: { head: -12 * bend + 2.5 * Math.sin(q * .9 + 1) } }, f);
      // he leans in to look, a hand out
      const look = span(q, T1, T1 + .6);
      man.pose({ x: mAt.x, y: mAt.y, rot: 3.5 * look + .8 * Math.sin(q * 1.1), sq: 1 + .012 * Math.sin(q * 2.2 + 1) - .01 * s14_PK(q, TP, .4),
        parts: { armR: 5 - 7 * s14_PK(q, TP - .1, .5) + 1.2 * Math.sin(q * 1.9), smoke: 3.5 * Math.sin(q * 1.9) + 2 * Math.sin(q * 4.3) } }, f);
      // the kitten: trembles in the grass; lifted, it hops up into her arms and is held there, still trembling
      const u = span(q, TP, TP + .9);
      const hx = wx + HAND[0], hy = wy + HAND[1];
      const tre = 1.1 * (Math.floor(q * FPS) % 2 ? 1 : -1) * (.6 + .4 * Math.sin(q * 3)) * (q < T1 ? 1.4 : 1);
      kit.pose({ x: kAt.x + (hx - kAt.x) * u, y: kAt.y + (hy - kAt.y) * u - 40 * hop(u), s: 1 - .25 * u, rot: tre * (1 - u * .5) + 14 * hop(u) - 8 * u,
        sq: 1 + .012 * Math.sin(q * 3.1) }, f);
    } else {
      B.apply(q, f);
      // which shot: the kitten's (on the mound) or the speakers' (blank paper)
      const speakW = (q >= W1 && q < K1) || (q >= W2 && q < M1), speakM = (q >= M1 && q < K2) || (q >= M2 && q < K3) || (q >= M3 && q < K4);
      vis(womanB.g, speakW); vis(manB.g, speakM); vis(kitten.g, !speakW && !speakM);
      // the old woman, large: looks down at it, a nod on "Poor", "kitty"
      if (speakW) {
        const nod = s14_PK(q, s14_C('w12', .38), .15) + s14_PK(q, s14_C('w12', .95), .2);
        const say = q < K1 ? Math.abs(Math.sin(q * 9)) * (q < s14_C('w12', 1.6) ? 1 : 0) : 0;
        womanB.pose({ x: 987, y: 842, s: 2.46, rot: .9 * Math.sin(q * 1.1) - 1.4 * nod, sq: 1 + .012 * breathe + .008 * say,
          parts: { head: -9 - 3 * nod + 2.5 * Math.sin(q * .8) } }, f);
      }
      // the old man, large: bends to it a little, nods on "Dear", "kitty", "How", "trillions"
      if (speakM) {
        const nod = s14_PK(q, s14_C('m12', .22), .15) + s14_PK(q, s14_C('m12', .6), .2) + s14_PK(q, s14_C('m12b', .15), .15) + s14_PK(q, s14_C('m12b', 5.65), .2) + s14_PK(q, s14_C('m12b', 6.5), .2);
        const talk = (q >= M1 && q < s14_C('m12', 1.5)) || (q >= s14_C('m12b', .1) && q < s14_C('m12b', 2.2)) || (q >= M3 && q < s14_C('m12b', 7.1));
        manB.pose({ x: 971, y: 865, s: 2.4, rot: -3 + .8 * Math.sin(q * 1.2) - 1.1 * nod, sq: 1 + .012 * breathe + (talk ? .01 * Math.abs(Math.sin(q * 7.5)) : 0),
          parts: { armR: 4 + 1.5 * Math.sin(q * 1.7), smoke: 3.5 * Math.sin(q * 1.9) + 2 * Math.sin(q * 4.3) } }, f);
      }
      // the kitten on the mound: a tremble that eases as it grows used to them; head turns up to whoever speaks
      const afraid = q < M1 ? 1 : q < K4 ? .6 : .25;
      const up = (q >= K1 && q < W2) ? 1 : (q >= K2 && q < M2) ? 1 : (q >= K3 && q < M3) ? 1 : 0;   // listening, looking up at them
      const look = span(q, K1, K1 + .4) * (q < W2 ? 1 : 0) + span(q, K2, K2 + .4) * (q < M2 ? 1 : 0) + span(q, K3, K3 + .4) * (q < M3 ? 1 : 0);
      const gaze = q >= T2 && q < W1 ? 3 * Math.sin(q * 1.1) - 2 : 0;
      const kHead = (q >= K4 ? -4 * span(q, K4, K4 + .5) + 3 * Math.sin(q * .8) + (q > s14_C('k12b', 1.1) ? 5 * span(q, s14_C('k12b', 1.1), s14_C('k12b', 1.6)) * (1 - span(q, s14_C('k12b', 2.3), s14_C('k12b', 2.9))) : 0)
        + (q > s14_C('k12b', 4.9) ? -7 * span(q, s14_C('k12b', 4.9), s14_C('k12b', 5.5)) : 0) + 4 * s14_PK(q, s14_C('k12', 2.1), .3) : 6 * look + gaze)
        + 1.3 * Math.sin(q * 1.9);
      const tre = afraid * .9 * (Math.floor(q * FPS) % 2 ? 1 : -1) * (.6 + .4 * Math.sin(q * 3));
      kitten.pose({ x: kAt28.x, y: kAt28.y, rot: tre + (up ? .6 * Math.sin(q * 1.3) : 0), sq: 1 + .014 * breathe,
        parts: { head: kHead }, mouth: lips(q, 'scene14', PRE14, 'k12', 'k12b') }, f);
    }
    turn(q);
  });
}
