/* scene6.js — the wardrobe. */
'use strict';
const PRE6 = .6;
sfx('scene6', PRE6 + TIMINGS.scene6.marks['s06.hide'] + .8, 'bang', 1.6);   // the wardrobe slammed shut
function scene6(p, D) {
  const HIDE = PRE6 + TIMINGS.scene6.marks['s06.hide'], CAP = PRE6 + TIMINGS.scene6.marks['s06.cap'], W = t => PRE6 + t;
  const cam = paperCam(p, 'room', { x: 1120, y: 480, z: .9 }), R = roomProps(cam, []);
  const granIn = grandmaPuppet(R.inWardrobe), gran = grandmaPuppet(R.inBed), wolfBed = wolfPuppet(R.inBed), wolf = wolfPuppet(R.front);
  const things = prop(R.front, `<g filter="url(#paper)"><path d="M-40,8 C-40,-30 46,-34 54,6 Q8,-10 -40,8 Z" fill="#f6efe0"/></g>`), specs = mk('g', {}, R.front);
  specs.innerHTML = '<circle cx="-12" r="10" fill="none" stroke="#7a5a2a" stroke-width="2.6"/><circle cx="12" r="10" fill="none" stroke="#7a5a2a" stroke-width="2.6"/>';
  const wipe = trunkWipe(p, D - .7, .65);
  // 6.1 the wolf leans in; her eyes go wide; 6.2 she hops into the wardrobe and slams it; 6.3 close on the bed:
  // nightcap, glasses, into bed; then wide again — a crack in the wardrobe door, one eye.
  cam.shake(HIDE + .8, 2 / FPS, 8).cut({ x: 1120, y: 620, z: 1.9 }, CAP).to({ z: 2.15 }, CAP + .1, 4).cut({ x: 1120, y: 480, z: .9 }, W(11));
  const sneak = walker(262, .6, { period: 1.1, A: 26, knee: 50 }, 1, 8);
  stopClock(D, (q, f) => {
    cam.apply(q, f); wipe(q); R.door(-.35);
    const hop = Math.min(1, Math.max(0, (q - HIDE) / .7)), inWard = q >= HIDE + .8;
    R.wardrobe(q < HIDE + .45 ? 1 : q < HIDE + .8 ? -.3 : q < W(11.2) ? 1 + (q < HIDE + 1.2 ? .03 * onTwos(q) : 0) : .82);
    vis(gran.g, !inWard);
    const sg = .55, startled = q >= W(1.0);
    gran.pose({ x: 1250 + 605 * ease(hop), y: 630 + (692 - 630) * hop - 130 * Math.sin(Math.PI * hop), s: sg, turn: hop > 0 ? 1 : -1,
      head: startled && hop === 0 ? 'F' : 'P', brow: startled ? 1 : 0, hop: between(q, W(1.0), W(1.0) + 2 / FPS) ? -8 : 0,
      ua: between(q, W(.4), W(1.0)) ? -150 : 6, fa: between(q, W(.4), W(1.0)) ? -30 : -6, rua: -30, rfa: -10, lua: 30, lfa: 10,
      cap: q < HIDE + .1, glasses: q < HIDE + .1 }, f);
    vis(granIn.g, q >= W(11.2));
    granIn.pose({ x: 1830, y: 692, s: sg, head: 'F', cap: false, glasses: false, shut: blinking(q, [W(11.9)]) }, f);
    // her nightcap and glasses fly onto the bed, and wait there for the wolf
    const fly = Math.min(1, Math.max(0, (q - HIDE - .1) / .4)), worn = q >= W(7.4), specsOn = q >= W(8.2);
    vis(things, q >= HIDE + .1 && !worn); tf(things, `translate(${1300 - 120 * fly},${560 + 80 * fly - 90 * Math.sin(Math.PI * fly)}) scale(.55)`);
    vis(specs, q >= HIDE + .1 && !specsOn); tf(specs, `translate(${1280 - 70 * fly},${560 + 84 * fly - 60 * Math.sin(Math.PI * fly)}) scale(.55)`);
    const s = .6, w = sneak(Math.max(0, q - HIDE - 1.2)), bed = Math.min(1, Math.max(0, (q - W(9.0)) / .4));
    const x = q < W(9.0) ? Math.min(1000, w.x) : 1000 + 250 * ease(bed);
    // over the quilt while he climbs, under it once he is in: two of him, one on each side of the quilt
    const tucked = bed >= 1; vis(wolf.g, !tucked); vis(wolfBed.g, tucked);
    (tucked ? wolfBed : wolf).pose({ x, y: q < W(9.0) ? hipOn(800, s, 200) + w.drop * s : hipOn(800, s, 200) + (630 - hipOn(800, s, 200)) * bed - 80 * Math.sin(Math.PI * bed), s,
      turn: q < W(9.0) ? 1 : bed < .5 ? 1 - 2 * bed * 2 : -1, near: q < W(9.0) && x < 1000 ? w.near : 0, far: q < W(9.0) && x < 1000 ? w.far : 0,
      kNear: x < 1000 ? w.kNear : 0, kFar: x < 1000 ? w.kFar : 0, lean: q < W(1.2) ? 22 * span(q, W(.1), W(.5)) : q < HIDE + 1.2 ? 22 : 8,
      ua: between(q, W(7.0), W(7.4)) ? -60 : between(q, W(7.4), W(8.6)) ? -150 : 6, fa: between(q, W(7.0), W(7.4)) ? -30 : between(q, W(7.4), W(8.6)) ? -30 : -6,
      cap: worn ? 'off' : 'on', night: worn, glasses: specsOn, head: q >= W(10.2) ? 'F' : 'P', brow: q >= W(10.2) ? onTwos(q) * .6 : 0,
      tail: 6 * Math.sin(q * 4), shut: blinking(q, [W(2.6), W(9.4)]) }, f);
  });
}
