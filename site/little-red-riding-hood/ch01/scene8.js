/* scene8.js — what big ears. */
'use strict';
const PRE8 = .4;
function scene8(p, D) {
  const C = (c, t) => clipAt('scene8', PRE8, c, t), mid = c => C(c, -.05);
  const cam = paperCam(p, 'room', { x: 1140, y: 560, z: 1.9 }), R = roomProps(cam, []);
  const wolf = wolfPuppet(R.inBed), red = redPuppet(R.front);
  // Grandma inside the wardrobe, seen only through the crack of its door (open to .6: 1875–1932)
  mk('rect', { x: 1875, y: 424, width: 57, height: 366 }, mk('clipPath', { id: 'crack8' }, R.inWardrobe));
  const crack = mk('g', { 'clip-path': 'url(#crack8)' }, R.inWardrobe);
  mk('rect', { x: 1868, y: 410, width: 72, height: 390, fill: '#2a1a10' }, crack);
  const granIn = grandmaPuppet(crack);
  // the close-ups face each other across the bed: his, with the wall and window behind him (her view); hers, with
  // the open door behind her (his view). Each line comes closer than the one before.
  const A = paperCam(p, 'roomA').soft(0, 'all'), wolfA = wolfPuppet(A.stage);
  const B = paperCam(p, 'roomB').soft(0, 'all'), redB = redPuppet(B.stage);
  const shots = [['s08', 'two'], ['s08b', 'A', 1.9], ['s08c', 'B', 2], ['s08d', 'A', 2.7], ['s08e', 'B', 2.8], ['s08f', 'A', 3.4]];
  const EAT = C('s08f', .88);
  // while he says "see you with", a look at the wardrobe: through the crack, Grandma's eye narrows and the umbrella comes up
  const WARD = [C('s08d', 1.0), mid('s08e')];
  cam.cut({ x: 1870, y: 560, z: 2.6 }, WARD[0]);
  stopClock(D, (q, f) => {
    let k = 0; for (let i = 0; i < shots.length; i++) if (q >= mid(shots[i][0])) k = i;
    const ward = between(q, ...WARD), [, which, big] = ward ? [, 'two'] : shots[k], s = .6;
    vis(cam.root, which === 'two'); vis(A.root, which === 'A'); vis(B.root, which === 'B');
    const wolfMouth = lips(q, 'scene8', PRE8, 's08b', 's08d', 's08f');
    // s08e has half a second of silence after "And Grandma…": its cues (shots.js) already hold her mouth shut through it
    const tE = q - C('s08e'), redMouth = lips(q, 'scene8', PRE8, 's08', 's08c') !== 'X' ? lips(q, 'scene8', PRE8, 's08', 's08c') : mouthAt('s08e', tE);
    if (ward) {
      cam.apply(q, f); R.wardrobe(.6);
      const up = span(q, WARD[0] + .4, WARD[0] + 1.1);
      granIn.pose({ x: 1906, y: 692, s: .55, head: 'F', cap: false, glasses: false, umbrella: true, brow: -1.8 * span(q, WARD[0] + .1, WARD[0] + .3), mouth: 'A',
        rua: 30 - 150 * up, rfa: -10 - 70 * up, shut: blinking(q, [WARD[0] + .7]) }, f);
    } else if (which === 'two') {
      cam.apply(q, f); R.wardrobe(.6);
      wolf.pose({ x: 1250, y: 630, s, turn: -1, cap: 'off', night: true, glasses: true, ear: between(q, C('s08', 1.3), C('s08', 2.6)) ? onTwos(q) : 0 }, f);
      red.pose({ x: 1030, y: hipOn(800, s), s, bouquet: 7, mouth: redMouth, ua: -8, fa: -78, shut: blinking(q, [C('s08', 2.8)]) }, f);
    } else if (which === 'A') {
      A.apply(q, f);
      const eat = q >= EAT, lunge = span(q, EAT + .6, D);
      if (k === 5) A.shake(EAT, .3, 12);
      wolfA.pose({ x: 800, y: 430 + 212 * big * (1 + .3 * lunge) - 300 * lunge, s: big * (1 + .3 * lunge), head: 'F', cap: 'off', night: true, glasses: !eat,
        mouth: wolfMouth, jaw: eat && q < EAT + .9 ? 1 : null, brow: eat ? -1 : .6, rua: 30, rfa: -60, lua: -30, lfa: 60, shut: blinking(q, [C('s08b', 1.3), C('s08d', 1.5)]) }, f);
    } else {
      B.apply(q, f);
      redB.pose({ x: 800, y: 430 + 194 * big, s: big, head: 'F', mouth: redMouth, headR: k === 2 ? -6 : 0, bouquet: 0, basket: false,
        nod: k === 4 && between(tE, 1.0, 1.5) ? 3 : 0, shut: blinking(q, [C('s08c', 2.6), C('s08e', 1.1)]) }, f);
    }
  });
}
