/* scene8.js — the three questions. It opens on scene 6's last pose: the wolf tucked up in bed, facing us, the quilt
   in a mound to his chin, nightcap and glasses; Red stands on the floor in front of the bed, her feet below the quilt.
   Then Red and the wolf alternate in close-ups that come closer each time (his with the wall and window behind him,
   hers with the open door), and each question gets its own extreme close-up: the ears twitching under the cap, the
   eyes behind the glasses (pupils sliding, a blink), the teeth as the jaw drops. Red grows more worried each time
   (brows, ever smaller mouths, a step back on the third). The wardrobe crack with Grandma's umbrella rising, a hush,
   "EAT", and the lunge: he throws off the quilt — which scene 9 picks up mid-air (s8_flight, s8_redDuck). */
'use strict';
const PRE8 = .8;
// The lunge, shared with scene 9: ft seconds after the wolf leaves the bed (side two-shot in the room set). Up off the
// quilt fast, then a cartoon hang near the top (scene 8 ends somewhere in it), then (scene 9) the dive at the bouquet.
const s8_LUNGE_VIEW = { x: 1100, y: 580, z: 1.9 };
function s8_flight(ft) {
  const up = Math.min(1, ft / .3), hang = span(ft, .3, 1.05), dive = Math.max(0, Math.min(1, (ft - 1.05) / .3));
  const x = 1250 - 35 * (1 - (1 - up) ** 2) - 15 * hang - 25 * dive, y = 640 - 170 * (1 - (1 - up) ** 2) - 8 * hang + 140 * dive * dive;
  return { x, y, s: .6, turn: -1, run: 0, stretch: 1, crouch: 0, night: true, cap: 'off', glasses: false, jaw: .9, mouth: 'D', brow: 1.5, tail: 30, ear: 0 };
}
// Red under him: the bouquet goes up over her head and she starts to duck (ft from the same lunge clock).
function s8_redDuck(ft) {
  const u = span(ft, .05, .5);
  return { x: 1030, y: hipOn(800, .6), s: .6, turn: 1, crouch: .55 * u + .45 * span(ft, 1.0, 1.3), ua: -8 - 100 * u, fa: -78 + 50 * u, bouquet: 7, brow: 2, mouth: u > .3 ? 'E' : 'A', shut: ft > 1.1 };
}
// Red's frightened mouths: a small downturned rest mouth (ms8W) and every viseme shrunk (ms8s*), for the third question.
document.body.insertAdjacentHTML('beforeend', `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  <g id="ms8W"><path d="M-6,2.5 Q0,-2.5 6,2.5" fill="none" stroke="#5a2a1e" stroke-width="2.6" stroke-linecap="round"/></g>
  ${'ABEFH'.split('').map(m => `<g id="ms8s${m}"><use href="#m${m}" transform="scale(.7)"/></g>`).join('')}</defs></svg>`);
// question n (0, 1, 2) → her viseme: no tongue-out grins (C, D) at all; on the third everything small
const s8_FEAR = [{ X: 'A', C: 'H', D: 'E', G: 'B' }, { X: 's8W', C: 'H', D: 'E', G: 'B' },
  { X: 's8W', A: 's8W', B: 's8sB', C: 's8sH', D: 's8sE', E: 's8sE', F: 's8sF', G: 's8sB', H: 's8sH' }];
{ const C = (c, t = 0) => clipAt('scene8', PRE8, c, t);
  sfx('scene8', 0, 'room', .4, { loop: true });   // a bed: it repeats to the end of the scene
  // the woodcutter still chopping outside, through the wall, in the gaps; quiet from the umbrella on
  [.35, C('s08', 2.75), C('s08c', -.6), C('s08d', -.55), C('umbrella8', .2), C('umbrella8', 1.05)].forEach(t => sfx('scene8', +t.toFixed(2), 'chopin', .9));
  sfx('scene8', +(C('s08f', 1.8) - .34).toFixed(2), 'sting', 2);   // its chord lands on "EAT"
  sfx('scene8', +C('lunge8', -.05).toFixed(2), 'whoosh', 1.6);
}
function scene8(p, D) {
  const C = (c, t = 0) => clipAt('scene8', PRE8, c, t), breathe = (q, k = 0) => 2 * Math.sin(q * 2.2 + k);
  // the room: the two-shot, the wardrobe crack, the lunge
  const cam = paperCam(p, 'room', { x: 1130, y: 605, z: 1.75 }), R = roomProps(cam, []);
  const wolf = wolfPuppet(R.inBed);
  // the quilt's edge pulled up to his chin, his paws on it (scene 6's last pose); flung off when he lunges
  const flap = mk('g', {}, R.front);
  const cloth = prop(flap, `<g filter="url(#paper)"><path d="M-190,8 C-130,6 -110,-60 -64,-66 Q0,-74 64,-66 C86,-60 92,-14 100,8 Z" fill="#b5523b"/><path d="M-112,-40 C-96,-58 -84,-64 -64,-66 Q0,-74 64,-66 C76,-64 84,-56 88,-44" stroke="#c8704a" stroke-width="8" fill="none"/></g>`);
  const paws = prop(flap, `<g filter="url(#paper)"><circle cx="-30" cy="0" r="12" fill="${FUR2}"/><circle cx="30" cy="0" r="12" fill="${FUR2}"/></g>`);
  const red = redPuppet(R.front), wolfL = wolfPuppet(R.front);
  mk('rect', { x: 1875, y: 424, width: 57, height: 366 }, mk('clipPath', { id: 's8_crack' }, R.inWardrobe));
  const crack = mk('g', { 'clip-path': 'url(#s8_crack)' }, R.inWardrobe);
  mk('rect', { x: 1868, y: 410, width: 72, height: 390, fill: '#2a1a10' }, crack);
  const granIn = grandmaPuppet(crack);
  // the close-ups: his (her view: wall and window behind him), hers (his view: the open door behind her)
  const A = paperCam(p, 'roomA', { x: 800, y: 405, z: 1.25 }).soft(0, 'all'), wolfA = wolfPuppet(A.stage), specs = granGlassesProp(A.stage);
  const B = paperCam(p, 'roomB').soft(0, 'all'), redB = redPuppet(B.stage);
  const EAT = C('s08f', 1.8), HUSH = C('hush8', -.3), LUNGE = C('lunge8', -.05);
  // [start, camera, the puppet's size]; the three inserts are the A camera at its closest on one feature each
  const SH = [[0, 'two'], [C('s08', 1.25), 'ears', 2.2], [C('s08b', -.08), 'A', 2.5], [C('s08c', -.1), 'B', 2.6], [C('s08c', 1.5), 'eyes', 2.6],
    [C('s08d', -.08), 'A', 2.8], [C('umbrella8', -.5), 'ward'], [C('s08e', -.06), 'B', 3.1], [C('s08e', 2.15), 'mouth', 3.0], [HUSH, 'A', 3.0], [LUNGE, 'two']];
  const hip = big => 430 + 212 * big;
  const AV = { x: 800, y: 405, z: 1.25 };
  // ECUs: the ears and the nightcap (eyes peeping at the bottom), the glasses filling the frame, the muzzle and teeth
  A.cut({ x: 800, y: 322, z: 3.5 }, SH[1][0]).cut(AV, SH[2][0]).cut({ x: 800, y: 412, z: 3.5 }, SH[4][0])
    .cut(AV, SH[5][0]).cut({ x: 800, y: 545, z: 3.5 }, SH[8][0]).cut(AV, SH[9][0]).shake(EAT, .35, 14);
  const WARD = SH[6][0];
  cam.cut({ x: 1898, y: 572, z: 3.0 }, WARD).cut(s8_LUNGE_VIEW, LUNGE);
  stopClock(D, (q, f) => {
    let k = 0; for (let i = 0; i < SH.length; i++) if (q >= SH[i][0]) k = i;
    const [, which, big] = SH[k], two = which === 'two' || which === 'ward', onA = ['A', 'ears', 'eyes', 'mouth'].includes(which);
    vis(cam.root, two); vis(A.root, onA); vis(B.root, which === 'B');
    const wolfMouth = lips(q, 'scene8', PRE8, 's08b', 's08d', 's08f'), said = lips(q, 'scene8', PRE8, 's08', 's08c', 's08e');
    // worried, more with each question: brows up, mouths smaller; a small "o" of fear once she has asked about the mouth
    const n = q < C('s08c', -.5) ? 0 : q < C('s08e', -.5) ? 1 : 2, worry = [1.1, 1.6, 2.2][n];
    const redMouth = said !== 'X' ? s8_FEAR[n][said] || said : q > C('s08e', 1) ? 's8sF' : s8_FEAR[n].X;
    if (two) {
      cam.apply(q, f); R.wardrobe(.6);
      if (which === 'ward') {   // through the crack: her eye narrows, then the umbrella comes up, slowly
        const up = span(q, WARD + .35, WARD + 1.75);
        granIn.pose({ x: 1906, y: 692 + breathe(q), s: .55, head: 'F', cap: false, glasses: false, umbrella: true, brow: -1.8 * span(q, WARD + .1, WARD + .35), mouth: 'A',
          rua: 30 - 150 * up, rfa: -10 - 70 * up, nod: 3 * span(q, WARD + 1.8, WARD + 2.0), shut: blinking(q, [WARD + 1.95]) }, f);
        return;
      }
      const lunge = q >= LUNGE, ft = q - LUNGE;
      vis(wolf.g, !lunge); vis(wolfL.g, lunge);
      if (lunge) wolfL.pose(s8_flight(ft), f);
      else wolf.pose({ x: 1250, y: 630, s: .6, turn: -1, head: 'F', cap: 'off', night: true, glasses: true, nod: 1.5 * Math.sin(q * 2.6),
        look: -1, brow: .5, mouth: 'X', shut: blinking(q, [C('s08', .6)]) }, f);
      // the quilt edge: tucked under his chin; on the lunge flung up and back, then flat on the bed
      const fl = span(ft, 0, .35), arc = Math.sin(Math.PI * fl);
      vis(flap, fl < 1); vis(paws, !lunge);
      tf(cloth, `translate(${(1250 + 40 * fl).toFixed(1)},${(646 - 110 * arc).toFixed(1)}) rotate(${(25 * arc).toFixed(1)}) scale(1,${Math.max(.05, 1 - fl).toFixed(3)})`);
      tf(paws, `translate(1250,${(580 + breathe(q) * .5).toFixed(1)})`);
      red.pose(lunge ? s8_redDuck(ft) : { x: 1030, y: hipOn(800, .6) + breathe(q, 1) * .5, s: .6, bouquet: 7, mouth: redMouth, brow: worry, ua: -8, fa: -78, headR: -4 * span(q, 0, .5),
        shut: blinking(q, [.3, C('s08', 2.6)]) }, f);
      return;
    }
    if (onA) {
      A.apply(q, f);
      const hush = which === 'A' && k === 9, eat = q >= EAT;
      // in the hush he comes closer (a push-in); at EAT he rears up and grows over us
      const push = hush ? .35 * span(q, HUSH, EAT - .05) + .2 * span(q, EAT, EAT + .25) + .1 * span(q, C('s08f', 2.55), LUNGE) : 0;
      const see = k === 5 ? .12 * span(q, C('s08d', .95), C('s08d', 1.3)) : 0, s = big + push + see, rise = hush ? 70 * span(q, C('s08f', 2.55), LUNGE) : 0;
      const hear = k === 2 ? span(q, C('s08b', .85), C('s08b', 1.15)) * (1 - span(q, C('s08b', 2.1), C('s08b', 2.4))) : 0;
      const claws = eat ? span(q, EAT, EAT + .2) : 0;
      // the eyes ECU: the pupils slide left, right, back, then a slow blink
      const look = which === 'eyes' ? [0, -1.5, 1.5, 0][Math.min(3, Math.floor((q - SH[4][0]) / .4))] : 0;
      // the teeth ECU: the jaw drops slowly, the head tips, the brows come down
      const bare = which === 'mouth' ? span(q, SH[8][0] + .25, SH[8][0] + 1.1) : 0;
      // the ears ECU: on "big" and on "ears", each ear flick on twos (and the cap's tail jiggles)
      const flick = which === 'ears' && (between(q, C('s08', 1.12), C('s08', 1.5)) || between(q, C('s08', 1.6), C('s08', 2.0)) || between(q, C('s08', 2.4), C('s08', 2.8)));
      // an old lady's wobble on his lines; in the hush, still, eyes narrowing
      wolfA.pose({ x: 800, y: hip(s) - rise + breathe(q) * (hush ? .3 : 1), s, head: 'F', cap: 'off', night: true, glasses: !eat, look,
        mouth: wolfMouth, jaw: eat && q < EAT + .7 ? 1 : which === 'mouth' ? .9 * bare : null,
        headR: which === 'A' && !hush && wolfMouth !== 'X' ? 3 * Math.sin(q * 9) : which === 'mouth' ? 4 * bare : 0,
        brow: eat ? 1.6 : hush ? 1.1 * span(q, HUSH + .4, EAT - .3) : which === 'mouth' ? .9 * bare : 0,
        ear: flick ? 1.6 * onTwos(q) : eat && q < EAT + .4 ? onTwos(q) : 0, flap: flick ? 12 * onTwos(q) : 0,
        rua: 30 - 200 * hear - 150 * claws, rfa: -60 + 50 * hear + 20 * claws, lua: -30 + 150 * claws, lfa: 60 - 20 * claws,
        shut: blinking(q, [C('s08b', 2.5), C('s08c', 2.4), C('s08d', 1.9)]) || (which === 'eyes' && between(q, SH[4][0] + 1.6, SH[4][0] + 1.85)) }, f);
      // her glasses fly off his nose at EAT
      const g = (q - EAT) / .7; vis(specs.g, eat && g < 1);
      if (eat && g < 1) specs.pose(800 + 520 * g, hip(s) - rise - 222 * s - 380 * g + 420 * g * g, .62 * s, 260 * g);
      return;
    }
    B.apply(q, f);
    // the third question: she leans back half a step from him, the bouquet pulled to her chest, and stays back
    const back = k === 7 ? span(q, C('s08e', .05), C('s08e', .55)) : 0, sb = big * (1 - .1 * back);
    redB.pose({ x: 800 - 30 * back, y: 430 + 194 * sb + breathe(q, 1) + 26 * back, s: sb, head: 'F', mouth: redMouth, brow: worry, headR: k === 3 ? -5 : -7 * back,
      bouquet: 7, basket: true, lua: 15 + 10 * back, lfa: -110 - 20 * back, rua: 4, rfa: -4, nod: k === 7 && between(q, C('s08e', .25), C('s08e', .45)) ? 3 : 0,
      shut: blinking(q, [C('s08c', .85), C('s08e', .3)]) }, f);
  });
}
