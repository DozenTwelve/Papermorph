/* scene14.js — A very homely little cat (p27, then p28). Beat clock = PRE14 + the joined clip's time (clipAt below).
   It follows scene13's stop on the same page, so it opens on the game's frame, no page turn:
   1 push-in from that frame to the kitten in the grass, trembling ("In it sat one little frightened kitten"), 0 – 3.0;
   2 two-shot, "They went out and picked it up": she comes down the ridge to the kitten (which stays in its grass, trembling:
     it is never lifted off the p27 set) and bends over it, 3.0 – "picked";
   3 on "picked it up" a cut to a close shot of her hands taking the clean p28 kitten, on plain paper (kitten28 rises into her
     arms), "picked" – 5.5; then the kitten alone on its mound, big, "It was thin and scraggly";
   4 the talk, shot and reverse shot on the blank paper of p28 (the speakers are the p27 figures lifted large, in the
     blank part of the sheet; the mound is out of frame): her "Poor little kitty", him "Dear little kitty" and "How does it
     happen…" (no narrator tags between them since cut 3), with the kitten listening between (it looks up, an ear-flick of a head turn, a tremble);
   5 the kitten's own lines (k12, k12b): a slow push from a medium shot to a close-up of the face by "very homely", with a
     mouth under the nose, the head dropping a little on "nobody bothered about me".
   Ends with the page turning in for scene15. */
'use strict';
const PRE14 = .5;
CUT_FACE.kitten28 = { at: [1522, 1808], w: 32, h: 24 };   // straight under the nose, over the white muzzle, where the black chin takes the opening: it reads as the jaw dropping
sfx('scene14', 0, 'birds', .3, { loop: true });

const s14_C = (clip, t = 0) => clipAt('scene14', PRE14, clip, t);
const s14_PK = (q, t, w = .2) => Math.max(0, 1 - Math.abs(q - t) / w);
const s14_START = { x: 790, y: 470, z: 1.2 };   // where scene13's game left the camera
const s14_WALK = [696, 605, 600, 662];          // her way down the ridge to the kitten: x0, y0, x1, y1
sfx('scene14', s14_C('n12', 3.17), 'step1', .3); sfx('scene14', s14_C('n12', 3.531), 'step2', .3); sfx('scene14', s14_C('n12', 3.787), 'step3', .3);
sfx('scene14', s14_C('n12', 3.993), 'pop', .35); sfx('scene14', s14_C('n12', 4.031), 'mew2', .3);
sfx('scene14', s14_C('k12', .002), 'mew4', .25);

function scene14(p, D) {
  const T1 = s14_C('n12', 2.979), T2 = s14_C('n12', 4.945), TP = markAt('scene14', PRE14, 'n12.picked') - .1;   // cuts; the pick-up
  const W1 = s14_C('w12', -.05), K1 = s14_C('w12', 1.374), M1 = s14_C('m12', -.1), K2 = s14_C('m12', 1.135),
    W2 = M1, M2 = s14_C('m12b', -.05), K3 = s14_C('m12b', 2.685), M3 = s14_C('m12b', 6.432), K4 = s14_C('k12', -.1);
  const WALK0 = s14_C('n12', 3.097);
  // (cut 3 dropped "said the very old woman/man" after their lines, and with them her second shot: W2 is M1, the kitten listens until he speaks)
  const TE = s14_C('k12b', 5.495);   // the pick-up is shown last, after "So nobody bothered about me": the kitten stays on its mound through the talk

  // ---- p27: the grass ----
  const A = paperCam(p, 'p27', s14_START);
  A.to({ x: 452, y: 748, z: 3.0 }, .25, 2.6)
   .cut({ x: 505, y: 650, z: 1.9 }, T1).to({ x: 515, y: 640, z: 2.1 }, T1, TP - T1);
  s13_patch(A.stage);   // scene13's inked patch over the grey smear on the ridge edge
  const wAt = pagePos('p27', 'woman27'), mAt = pagePos('p27', 'man27'), kAt = pagePos('p27', 'kitten27');
  const man = cutPuppet(A.stage, 'man27'), woman = cutPuppet(A.stage, 'woman27'), kit = cutPuppet(A.stage, 'kitten27'), kit2 = cutPuppet(A.stage, 'kitten28');   // kit2: the clean kitten over Gág's blot, as scene13 left it

  // ---- p28: the mound (the kitten), and the blank paper beside it (the two old people's close-ups) ----
  const B = paperCam(p, 'p28', { x: 770, y: 690, z: 3.4 });
  B.cut({ x: 815, y: 252, z: 2.2 }, TP).to({ x: 815, y: 250, z: 2.25 }, TP, T2 - TP)   // her hands take the kitten, on the blank paper
   .cut({ x: 770, y: 690, z: 3.0 }, T2)
   .to({ x: 772, y: 686, z: 3.2 }, s14_C('n12', 4.994), K1 - s14_C('n12', 4.994))   // a slow push on the kitten ("thin and scraggly")
   .cut({ x: 1000, y: 300, z: 1.3 }, W1).to({ x: 1004, y: 304, z: 1.36 }, W1, K1 - W1)
   .cut({ x: 775, y: 684, z: 3.0 }, K1).to({ x: 775, y: 680, z: 3.2 }, K1, W2 - K1)
   .cut({ x: 1000, y: 300, z: 1.3 }, M1).to({ x: 1004, y: 300, z: 1.38 }, M1, K2 - M1)
   .cut({ x: 775, y: 684, z: 2.9 }, K2).to({ x: 775, y: 680, z: 3.1 }, K2, M2 - K2)
   .cut({ x: 1000, y: 300, z: 1.34 }, M2).to({ x: 998, y: 298, z: 1.4 }, M2, K3 - M2)
   .cut({ x: 775, y: 684, z: 2.8 }, K3).to({ x: 775, y: 680, z: 3.1 }, K3, M3 - K3)
   .cut({ x: 1000, y: 300, z: 1.4 }, M3).to({ x: 1002, y: 302, z: 1.46 }, M3, K4 - M3)
   .cut({ x: 775, y: 676, z: 2.8 }, K4).to({ x: 766, y: 650, z: 3.2 }, K4, s14_C('k12', 1.802) - K4)   // in to the face by "very homely"
   .to({ x: 766, y: 652, z: 3.3 }, s14_C('k12', 1.802), TE - s14_C('k12', 1.802))
   .cut({ x: 815, y: 252, z: 2.2 }, TE).to({ x: 815, y: 250, z: 2.25 }, TE, D - TE);   // her hands take the kitten
  const kAt28 = pagePos('p28', 'kitten28'), kitten = cutPuppet(B.stage, 'kitten28');
  const womanB = cutPuppet(B.stage, 'woman27'), manB = cutPuppet(B.stage, 'man27');
  // live pipe smoke in Gág's ink over the hidden drawn part (the pipe bowl at man27-local 66,-228), on both pages
  const s14_sm = [man, manB].map(m => inkSmoke(mk('g', {}, m.part.head), 66, -228, { size: 12, rise: 140, drift: 30, curl: 12, period: 2.2, ink: 2, seed: 3 })), s14_sB = s14_sm[1];
  A.move('tuftL', q => `translate(302 833) skewX(${(2.2 * Math.sin(q * 1.8) + .8 * Math.sin(q * 4.1)).toFixed(2)}) translate(-302 -833)`)
   .move('tuftB', q => `translate(415 826) skewX(${(2 * Math.sin(q * 1.5 + 1) + .7 * Math.sin(q * 3.7)).toFixed(2)}) translate(-415 -826)`);
  const turn = pageTurn(p, D - .1, .6, 'in');

  // the close shot: where her hands are (of her feet) when the kitten is in them, and the sides of its rise
  // In the close shot two bodies are cut: held, the kitten's lower body (the grass box of the scan, local y > -20) is
  // behind her hand; her piece carries a chunk of p27's hill ink on its right (local x > 100). The cut copies are baked
  // (img/cut/*-c14.webp, tools/millions-of-cats/clip14.py) and swapped in: a live clip-path on these big images made
  // Firefox redraw them in software every frame (100-400 ms frames).
  const cutBody = pp => [pp.part.body, pp.shade.body].map(g => { const im = g.firstChild, c = im.cloneNode();
    c.setAttribute('href', im.getAttribute('href').replace('.webp', '-c14.webp')); g.appendChild(c); return [im, c]; });
  const cut14 = [...cutBody(womanB), ...cutBody(kitten)];
  const HAND = [-70, -158], CS = 2.0, hop = u => Math.sin(Math.PI * u);

  stopClock(D, (q, f) => {
    const onA = q < TP, onC = q >= TP && q < T2 || q >= TE, late = q >= TE;
    vis(A.root, onA); vis(B.root, !onA);
    const breathe = Math.sin(q * 2.3);
    if (onA) {
      A.apply(q, f);
      // she comes down the ridge (a stepping bob, leaning forward), then bends over the kitten
      const wu = span(q, WALK0, TP), going = q > WALK0 && q < TP;
      const sp = Math.max(0, q - WALK0) / .25, sk = Math.floor(sp), sf = sp - sk, hopx = going ? 5 * (sf - .5) : 0;   // a step every .25 s: hop, tip, land
      const wx = (q < WALK0 ? wAt.x : s14_WALK[0] + (s14_WALK[2] - s14_WALK[0]) * wu) + hopx, wy = q < WALK0 ? wAt.y : s14_WALK[1] + (s14_WALK[3] - s14_WALK[1]) * wu;
      const bend = span(q, TP - .5, TP - .05);
      woman.pose({ x: wx, y: wy - (going ? Math.sin(Math.PI * sf) * 11 : 2 * breathe * (q > TP ? 1 : 0)),
        rot: (going ? -3 + (sk % 2 ? 4 : -4) : -5 * bend + 1.2 * Math.sin(q * 1.3)), sq: going ? 1 - .04 * (1 - Math.sin(Math.PI * sf)) : 1 + .012 * breathe,
        parts: { head: -12 * bend + 2.5 * Math.sin(q * .9 + 1), armL: going ? 8 + 14 * (sk % 2 ? 1 : -1) * Math.sin(Math.PI * sf) : 6 + 4 * Math.sin(q * 1.6) - 10 * bend } }, f);
      // he leans in to look, a hand out
      const look = span(q, T1, T1 + .6);
      man.pose({ x: mAt.x, y: mAt.y, rot: 3.5 * look + .8 * Math.sin(q * 1.1), sq: 1 + .012 * Math.sin(q * 2.2 + 1) - .01 * s14_PK(q, TP, .4),
        parts: { armR: 5 - 7 * s14_PK(q, TP - .1, .5) + 1.2 * Math.sin(q * 1.9), head: 6 * look + 1.5 * Math.sin(q * 1.2) }, hide: ['smoke'] }, f);
      s14_sm[0](q);
      // the kitten stays in its grass, trembling and looking up at her
      const shk = Math.floor(q * FPS) % 2 ? 1 : -1, tre = 1.8 * shk * (.6 + .4 * Math.sin(q * 3)) * (q < T1 ? 1.4 : 1);
      kit.pose({ x: kAt.x + .6 * shk, y: kAt.y, rot: tre, sq: 1 + .012 * Math.sin(q * 3.1) }, f);
      kit2.pose({ x: kAt.x + S13K.x + .8 * shk, y: kAt.y + S13K.y, s: S13K.s, rot: tre, sq: 1 + .012 * Math.sin(q * 3.1), parts: { head: -3 + 5 * span(q, T1 - 1.5, T1) + 1.5 * Math.sin(q * 1.3) } }, f);
    } else {
      B.apply(q, f);
      // which shot: the kitten's (on the mound) or the speakers' (blank paper)
      const speakW = (q >= W1 && q < K1) || (q >= W2 && q < M1), speakM = (q >= M1 && q < K2) || (q >= M2 && q < K3) || (q >= M3 && q < K4);
      vis(womanB.g, speakW || onC); vis(manB.g, speakM);
      for (const [whole, cut] of cut14) { vis(whole, !onC); vis(cut, onC); }
      vis(kitten.g, onC || (!speakW && !speakM));
      // her hands take the kitten: she bends to it, it rises into her arms and she straightens with it
      if (onC) {
        const u = late ? span(q, TE + .1, TE + .8) : 0, st = late ? span(q, TE + .4, TE + 1.1) : 0, wx = 987, wy = 700;
        womanB.pose({ x: wx, y: wy, s: CS, rot: -7 * (1 - st) + .9 * Math.sin(q * 1.1), sq: 1 + .012 * breathe,
          parts: { head: -12 * (1 - st) - 6 + 2.5 * Math.sin(q * .8), armL: 12 - 14 * st + 2 * Math.sin(q * 1.7) + (late ? 0 : 5 * Math.sin(q * 3)) } }, f);   // first she reaches down to it; the lift comes last
        const hx = wx + HAND[0] * CS, hy = wy + HAND[1] * CS + 34 * (1.0 + .15 * u);   // its feet below her hand, the hand over its cut-off bottom
        kitten.pose({ x: 790 + (hx - 790) * u, y: 640 + (hy - 640) * u - 30 * hop(u), s: 1.0 + .15 * u, rot: 1.2 * (Math.floor(q * FPS) % 2 ? 1 : -1) * (1 - u * .6) + 10 * hop(u) - 6 * u,
          sq: 1 + .014 * breathe, parts: { head: 3 * Math.sin(q * 1.3) } }, f);
      }
      // the old woman, large: looks down at it, a nod on "Poor", "kitty"
      if (speakW) {
        const nod = s14_PK(q, s14_C('w12', .25), .15) + s14_PK(q, s14_C('w12', .796), .2);
        const say = q < K1 ? Math.abs(Math.sin(q * 9)) * (q < s14_C('w12', 1.296) ? 1 : 0) : 0;
        womanB.pose({ x: 987, y: 842, s: 2.46, rot: .9 * Math.sin(q * 1.1) - 1.4 * nod, sq: 1 + .012 * breathe + .008 * say,
          parts: { head: -9 - 3 * nod + 2.5 * Math.sin(q * .8), armL: 8 + 12 * nod + 5 * say * Math.sin(q * 5) + 3 * Math.sin(q * 1.5) } }, f);
      }
      // the old man, large: bends to it a little, nods on "Dear", "kitty", "How", "trillions"
      if (speakM) {
        const nod = s14_PK(q, s14_C('m12', .095), .15) + s14_PK(q, s14_C('m12', .448), .2) + s14_PK(q, s14_C('m12b', .052), .15) + s14_PK(q, s14_C('m12b', 6.904), .2) + s14_PK(q, s14_C('m12b', 7.477), .2);
        const talk = (q >= M1 && q < s14_C('m12', 1.103)) || (q >= s14_C('m12b', 0) && q < s14_C('m12b', 1.953)) || (q >= M3 && q < s14_C('m12b', 7.872));
        manB.pose({ x: 971, y: 865, s: 2.4, rot: -3 + .8 * Math.sin(q * 1.2) - 1.1 * nod, sq: 1 + .012 * breathe + (talk ? .01 * Math.abs(Math.sin(q * 7.5)) : 0),
          parts: { armR: 4 + 1.5 * Math.sin(q * 1.7) + (talk ? 6 * Math.abs(Math.sin(q * 3.1)) : 0) + 8 * nod, head: 4 + 4 * nod + (talk ? 2 * Math.abs(Math.sin(q * 7.5)) : 0) + 1.5 * Math.sin(q * 1.3) }, hide: ['smoke'] }, f);
        s14_sB(q);
      }
      // the kitten on the mound: a tremble that eases as it grows used to them; head turns up to whoever speaks
      const afraid = q < M1 ? 1 : q < K4 ? .6 : .25;
      const up = (q >= K1 && q < W2) ? 1 : (q >= K2 && q < M2) ? 1 : (q >= K3 && q < M3) ? 1 : 0;   // listening, looking up at them
      const look = span(q, K1, K1 + .4) * (q < W2 ? 1 : 0) + span(q, K2, K2 + .4) * (q < M2 ? 1 : 0) + span(q, K3, K3 + .4) * (q < M3 ? 1 : 0);
      const gaze = q >= T2 && q < W1 ? 3 * Math.sin(q * 1.1) - 2 : 0;
      const flinch = [W1, W2, M1, M2, M3].reduce((a, t) => Math.max(a, q >= t && q < t + .6 ? 1 - (q - t) / .6 : 0), 0);   // it flinches when spoken to
      const shk = Math.floor(q * FPS) % 2 ? 1 : -1;
      const kn = (c, t) => s14_C(c, t), nodK = [['k12', .176], ['k12', 1.01], ['k12', 1.452], ['k12', 1.763], ['k12', 2.524], ['k12b', .191], ['k12b', .767], ['k12b', 1.601], ['k12b', 2.615], ['k12b', 3.057], ['k12b', 4.205], ['k12b', 4.701], ['k12b', 5.373]].reduce((a, [c, t]) => Math.max(a, s14_PK(q, kn(c, t), .14)), 0);
      const twitch = s14_PK(q, kn('k12', .1), .1) + s14_PK(q, kn('k12', 1.0), .1) + s14_PK(q, kn('k12b', .15), .1) + s14_PK(q, kn('k12b', 2.0), .1) + s14_PK(q, kn('k12b', 4.9), .1);   // an ear-flick of a head per line
      const burst = q > kn('k12', 1.9) && q < kn('k12', 2.7) ? 1 : 0, spoke = q >= K4 ? 1 : 0;   // a shiver burst after "homely"
      const kHead = (q >= K4 ? -4 * span(q, K4, K4 + .5) + 3 * Math.sin(q * .8) + (q > s14_C('k12b', .956) ? 5 * span(q, s14_C('k12b', .956), s14_C('k12b', 1.501)) * (1 - span(q, s14_C('k12b', 2.199), s14_C('k12b', 2.813))) : 0)
        + (q > s14_C('k12b', 4.072) ? -6 * span(q, s14_C('k12b', 4.072), s14_C('k12b', 4.652)) : 0) + 4 * s14_PK(q, s14_C('k12', 2.21), .3) : 6 * look + gaze)
        - 3 * afraid - 7 * flinch - 5 * nodK * spoke + 7 * twitch + 3.5 * shk * burst + 1.3 * Math.sin(q * 1.9) + 3.5 * Math.sin(q * 2.6 + 1) * (q < K4 ? 1 : .5);   // it cringes and looks about, slowly
      const tre = afraid * 1.8 * shk * (.7 + .3 * Math.sin(q * 3));
      if (!onC) kitten.pose({ x: kAt28.x + .6 * afraid * shk, y: kAt28.y, rot: tre + 3.5 * flinch + spoke * (2.5 * Math.sin(q * .9) + 3 * shk * burst) + 1.8 * Math.sin(q * 1.2) + (up ? .6 * Math.sin(q * 1.3) : 0), sq: 1 + .025 * breathe - .03 * flinch,
        sk: 2.5 * Math.sin(q * 2.2) + 1.5 * Math.sin(q * 5.3 + 1) + 2 * shk * burst, parts: { head: kHead, tail: 22 * Math.sin(q * 2.4) + 15 * shk * burst }, move: { head: [0, 7 * span(q, s14_C('k12b', 4.072), s14_C('k12b', 4.734))] }, mouth: lips(q, 'scene14', PRE14, 'k12', 'k12b') }, f);
    }
    turn(q);
  });
}
