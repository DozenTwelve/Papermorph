/* scene8.js — the three questions. Red and the wolf alternate in close-ups that come closer each time (his with the
   wall and window behind him, hers with the open door), an insert on every feature she names, the wardrobe crack with
   Grandma's umbrella rising, a hush, "EAT", and the lunge — which scene 9 picks up mid-air (s8_flight, s8_redDuck). */
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
{ const C = (c, t = 0) => clipAt('scene8', PRE8, c, t);
  sfx('scene8', 0, 'room', .4, 10);   // BED_STEP (shared.js) lays it again every 9.5 s
  // the woodcutter still chopping outside, through the wall, in the gaps; quiet from the umbrella on
  [.35, C('s08', 2.75), C('s08c', -.6), C('s08d', -.55), C('umbrella8', .2), C('umbrella8', 1.05)].forEach(t => sfx('scene8', +t.toFixed(2), 'chopin', .9));
  sfx('scene8', +(C('s08f', 1.8) - .34).toFixed(2), 'sting', 2);   // its chord lands on "EAT"
  sfx('scene8', +C('lunge8', -.05).toFixed(2), 'whoosh', 1.6);
}
function scene8(p, D) {
  const C = (c, t = 0) => clipAt('scene8', PRE8, c, t), breathe = (q, k = 0) => 2 * Math.sin(q * 2.2 + k);
  // the room: the two-shot, the wardrobe crack, the lunge
  const cam = paperCam(p, 'room', { x: 1120, y: 570, z: 2.0 }), R = roomProps(cam, []);
  const wolf = wolfPuppet(R.inBed), red = redPuppet(R.front), wolfL = wolfPuppet(R.front);
  mk('rect', { x: 1875, y: 424, width: 57, height: 366 }, mk('clipPath', { id: 's8_crack' }, R.inWardrobe));
  const crack = mk('g', { 'clip-path': 'url(#s8_crack)' }, R.inWardrobe);
  mk('rect', { x: 1868, y: 410, width: 72, height: 390, fill: '#2a1a10' }, crack);
  const granIn = grandmaPuppet(crack);
  // the close-ups: his (her view: wall and window behind him), hers (his view: the open door behind her)
  const A = paperCam(p, 'roomA', { x: 800, y: 405, z: 1.25 }).soft(0, 'all'), wolfA = wolfPuppet(A.stage), specs = granGlassesProp(A.stage);
  const B = paperCam(p, 'roomB').soft(0, 'all'), redB = redPuppet(B.stage);
  const EAT = C('s08f', 1.8), HUSH = C('hush8', -.3), LUNGE = C('lunge8', -.05);
  // [start, camera, the close-up's size]; inserts are the A camera closing on his face at size 1.9
  const SH = [[0, 'two'], [C('s08', 1.25), 'ears', 1.9], [C('s08b', -.08), 'A', 2.5], [C('s08c', -.1), 'B', 2.6], [C('s08c', 1.5), 'eyes', 1.9],
    [C('s08d', -.08), 'A', 2.8], [C('umbrella8', -.5), 'ward'], [C('s08e', -.06), 'B', 3.1], [C('s08e', 2.15), 'mouth', 1.9], [HUSH, 'A', 3.0], [LUNGE, 'two']];
  const hip = big => 430 + 212 * big;
  const AV = { x: 800, y: 405, z: 1.25 };
  A.cut({ x: 800, y: 345, z: 2.4 }, SH[1][0]).cut(AV, SH[2][0]).cut({ x: 800, y: 418, z: 2.5 }, SH[4][0])
    .cut(AV, SH[5][0]).cut({ x: 800, y: 492, z: 2.5 }, SH[8][0]).cut(AV, SH[9][0]).shake(EAT, .35, 14);
  const WARD = SH[6][0];
  cam.cut({ x: 1898, y: 572, z: 3.0 }, WARD).cut(s8_LUNGE_VIEW, LUNGE);
  stopClock(D, (q, f) => {
    let k = 0; for (let i = 0; i < SH.length; i++) if (q >= SH[i][0]) k = i;
    const [, which, big] = SH[k], two = which === 'two' || which === 'ward', onA = ['A', 'ears', 'eyes', 'mouth'].includes(which);
    vis(cam.root, two); vis(A.root, onA); vis(B.root, which === 'B');
    const wolfMouth = lips(q, 'scene8', PRE8, 's08b', 's08d', 's08f'), said = lips(q, 'scene8', PRE8, 's08', 's08c', 's08e');
    // worried, more with each question; a small "o" of fear once she has asked about the mouth
    const worry = q < C('s08c', -.5) ? 1 : q < C('s08e', -.5) ? 1.4 : 2, redMouth = said !== 'X' ? said : q > C('s08e', 1) ? 'F' : 'A';
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
      else wolf.pose({ x: 1250, y: 630 + breathe(q), s: .6, turn: -1, cap: 'off', night: true, glasses: true, look: 1, mouth: 'X', shut: blinking(q, [C('s08', .6)]) }, f);
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
      const look = which === 'eyes' ? [0, -1.2, 1.2, 0][Math.min(3, Math.floor((q - SH[4][0]) / .45))] : 0;
      // an old lady's wobble on his lines; in the hush, still, eyes narrowing
      wolfA.pose({ x: 800, y: hip(s) - rise + breathe(q) * (hush ? .3 : 1), s, head: 'F', cap: 'off', night: true, glasses: !eat, look,
        mouth: wolfMouth, jaw: eat && q < EAT + .7 ? 1 : which === 'mouth' ? .45 * span(q, SH[8][0] + .3, SH[8][0] + 1) : null,
        headR: which === 'A' && !hush && wolfMouth !== 'X' ? 3 * Math.sin(q * 9) : 0,
        brow: eat ? 1.6 : hush ? 1.1 * span(q, HUSH + .4, EAT - .3) : 0,
        ear: which === 'ears' && (between(q, C('s08', 1.36), C('s08', 1.9)) || between(q, C('s08', 2.3), C('s08', 2.7))) ? onTwos(q) : eat && q < EAT + .4 ? onTwos(q) : 0,
        rua: 30 - 200 * hear - 150 * claws, rfa: -60 + 50 * hear + 20 * claws, lua: -30 + 150 * claws, lfa: 60 - 20 * claws,
        shut: blinking(q, [C('s08b', 2.5), C('s08c', 2.4), C('s08d', 1.9)]) }, f);
      // her glasses fly off his nose at EAT
      const g = (q - EAT) / .7; vis(specs.g, eat && g < 1);
      if (eat && g < 1) specs.pose(800 + 520 * g, hip(s) - rise - 222 * s - 380 * g + 420 * g * g, .62 * s, 260 * g);
      return;
    }
    B.apply(q, f);
    const shrink = k === 7 ? span(q, C('s08e', .1), C('s08e', .5)) : 0;   // "And…": she pulls back
    redB.pose({ x: 800, y: 430 + 194 * big + breathe(q, 1) + 10 * shrink, s: big, head: 'F', mouth: redMouth, brow: worry, headR: k === 3 ? -5 : -3 * shrink,
      bouquet: 7, basket: true, lua: 15, lfa: -110, rua: 4, rfa: -4, nod: k === 7 && between(q, C('s08e', .25), C('s08e', .45)) ? 3 : 0,
      shut: blinking(q, [C('s08c', .85), C('s08e', .3)]) }, f);
  });
}
