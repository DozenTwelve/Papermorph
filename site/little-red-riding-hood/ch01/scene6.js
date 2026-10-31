/* scene6.js — the wardrobe. Times are on the beat clock; C(t) is t s into the narrator's s06.
     A  0         – C 0      wide: the wolf leaning in at the open door, Grandma in bed sees him (scene 5's last frame)
     B  C 0       – C 3.45   medium, Grandma to us: a start, eyes wide behind her glasses; then a set jaw ("quick!")
     C  C 3.45    – C 4.88   medium, following her: she hops out of bed in a long arc, arms going, flings the wardrobe
                             open and lands inside with a squash; her nightcap and glasses fly off behind her
     I  C 4.88    – C 5.38   insert: the pillow, the cap lying there, the glasses coming down, landing and rocking
     D  C 5.38    – C 10.25  the wardrobe: she pulls it shut (slam, shake, wobble); in the silence the camera pans left
                             with the wolf creeping in to the head of the bed, his back to the wardrobe; he finds the
                             cap and glasses and puts them on ("The wolf put on her nightcap and glasses")
     G  C 10.25   – C 12.6   the bed: he climbs in, pulls the quilt to his chin and waits (push in)
     H  C 12.6    – end      close: the wardrobe door opens a crack, Grandma's eye looks out (eye6) */
'use strict';
const PRE6 = 1.2;
const s6_C = t => clipAt('scene6', PRE6, 's06', t);
const s6_WALK = { t0: s6_C(2.2), period: .88, steps: 11, x0: 262 };   // the wolf's creep from the door to the bed's head
const s6_SHUT0 = Math.round(s6_C(5.38) * FPS) / FPS, s6_SLAM = s6_SHUT0 + 5 / FPS;   // the wardrobe door pulled to, on a frame
sfx('scene6', 0, 'room', .4, { loop: true });   // a bed: it repeats to the end of the scene
sfx('scene6', s6_C(3.52), 'hop', 1.4); sfx('scene6', s6_C(3.64), 'whoosh', 1); sfx('scene6', s6_C(4.3), 'creak', .8);
sfx('scene6', s6_C(4.65), 'hop', 1);                                   // she lands in the wardrobe
sfx('scene6', s6_C(5.02), 'pad', .9);                                  // the glasses land on the pillow (in the insert)
sfx('scene6', s6_SLAM, 'slam', 2); sfx('scene6', s6_SLAM, 'bang', .9);
for (let j = 1; j <= s6_WALK.steps; j++) {                              // his paws, once he is in the picture
  const t = s6_WALK.t0 + (j - .5) * s6_WALK.period / 2;
  if (t > s6_C(5.95)) sfx('scene6', +t.toFixed(3), 'pad', 1);
}
sfx('scene6', s6_C(10.8), 'creak', .5);                                 // the bed takes his weight
sfx('scene6', s6_C(12.85), 'creak', .7);                                // the wardrobe door, just a crack
// The hop's follow: a medium that travels with her from the bed to the wardrobe and rises a little with her arc.
const s6_follow = (a, b) => ({ x: t => 1330 + 500 * span(t, a, b + .1), y: t => 598 - 50 * Math.sin(Math.PI * Math.min(1, Math.max(0, (t - a) / (b - a)))), z: 2.3 });
function scene6(p, D) {
  const C = s6_C, SLAM = s6_SLAM, HOP0 = C(3.52), HOP1 = C(4.65), OPEN = C(4.3), SHUT0 = s6_SHUT0;
  const cam = paperCam(p, 'room', { x: 800, y: 560, z: 1.15 }), R = roomProps(cam, []);
  // inside the wardrobe: dark; Grandma; and, for the last shot, her face close behind the crack (clipped to the door)
  mk('rect', { x: 1792, y: 412, width: 140, height: 378, fill: '#2a1a10' }, R.inWardrobe);
  const granIn = grandmaPuppet(R.inWardrobe);
  mk('rect', { x: 1792, y: 412, width: 140, height: 378 }, mk('clipPath', { id: 'crack6' }, R.inWardrobe));
  const eyeG = mk('g', { 'clip-path': 'url(#crack6)' }, R.inWardrobe), granEye = grandmaPuppet(eyeG);
  // in bed the quilt hides her lower half: clipped at the quilt's lower edge (off once she hops)
  mk('rect', { x: -500, y: -500, width: 4000, height: 1264 }, mk('clipPath', { id: 'bed6' }, R.inBed));
  const bedClip = mk('g', { 'clip-path': 'url(#bed6)' }, R.inBed);
  const gran = grandmaPuppet(bedClip), wolfBed = wolfPuppet(R.inBed);
  const cap = granCapProp(R.front), specs = granGlassesProp(R.front), wolf = wolfPuppet(R.front);
  // the quilt's edge he pulls up to his chin, his paws on it
  const flap = mk('g', {}, R.front);
  const cloth = prop(flap, `<g filter="url(#paper)"><path d="M-190,8 C-130,6 -110,-60 -64,-66 Q0,-74 64,-66 C86,-60 92,-14 100,8 Z" fill="#b5523b"/><path d="M-112,-40 C-96,-58 -84,-64 -64,-66 Q0,-74 64,-66 C76,-64 84,-56 88,-44" stroke="#c8704a" stroke-width="8" fill="none"/></g>`);
  const paws = prop(flap, `<g filter="url(#paper)"><circle cx="-30" cy="0" r="12" fill="${FUR2}"/><circle cx="30" cy="0" r="12" fill="${FUR2}"/></g>`);
  cam.cut({ x: 1200, y: 585, z: 2.9 }, C(0)).to({ x: 1235, y: 585, z: 3.4 }, C(1.84), 1.2).cut(s6_follow(HOP0, HOP1), C(3.45)).cut({ x: 1300, y: 625, z: 3.3 }, C(4.88))
    .cut({ x: 1800, y: 590, z: 1.9 }, SHUT0).to({ x: 1500, y: 590, z: 1.85 }, C(6.0), 1.0).to({ x: 1470, y: 585, z: 2.0 }, C(7.8), 1.6)
    .cut({ x: 1290, y: 580, z: 2.0 }, C(10.25)).to({ x: 1250, y: 545, z: 2.6 }, C(11.0), 1.6)
    .cut({ x: 1916, y: 580, z: 3.4 }, C(12.6)).shake(SLAM, 2 / FPS, 8);
  const wipe = trunkWipe(p, D - .1, .6);   // scene 7 opens on the trunk
  const lin = (q, a, b) => Math.min(1, Math.max(0, (q - a) / (b - a))), lerp = (a, b, u) => a + (b - a) * u;
  const GY = 680;   // Grandma sitting up in bed, the quilt to her chest (clipped at its lower edge)
  const breath = q => 1.5 * Math.sin(q * 2.6);
  const hop = q => { const u = lin(q, HOP0, HOP1); return { u, x: 1250 + 608 * u, y: GY + (684 - GY) * u - 170 * Math.sin(Math.PI * u) }; };
  const creep = walker(s6_WALK.x0, .6, { period: s6_WALK.period, A: 30, knee: 50 }, 1, s6_WALK.steps), WX = creep(1e9).x;
  const STOP = s6_WALK.t0 + s6_WALK.steps * s6_WALK.period / 2, WY = hipOn(800, .6, 200);
  // the cap and glasses: off her head as she leaves the bed, onto the pillow; then up to the wolf's head
  const CAPOFF = C(3.62), CAPREST = C(4.15), SPOFF = C(3.7), SPREST = C(5.02);
  const GRAB = C(8.45), CAPON = C(8.85), GRAB2 = C(9.05), SPON = C(9.45), CLIMB0 = C(10.35), CLIMB1 = C(10.85);
  const c0 = hop(CAPOFF), s0 = hop(SPOFF), capFrom = [c0.x + 5, c0.y - 132], spFrom = [s0.x + 18, s0.y - 113];
  const capRest = [1282, 628], spRest = [1306, 645], capTo = [WX - 3, WY - 150], spTo = [WX - 26, WY - 130];
  stopClock(D, (q, f) => {
    cam.apply(q, f); wipe(q); R.door(-.35);
    R.wardrobe(q < OPEN ? 1 : q < SHUT0 ? opening(q, OPEN) : q < SLAM ? opening(q, SHUT0, [-.35, -.15, .15, .45, .75, 1])
      : q < SLAM + .45 ? 1 + .03 * onTwos(q) : 1 - .22 * span(q, C(12.85), C(13.35)));
    // Grandma in bed, then in the air
    const h = hop(q), jolt = C(.25), set = C(1.84);
    vis(gran.g, q < HOP1); if (q >= HOP0) bedClip.removeAttribute('clip-path'); else bedClip.setAttribute('clip-path', 'url(#bed6)');
    if (q < C(0)) gran.pose({ x: 1250, y: GY, s: .55, turn: -1, hop: between(q, .6, .6 + 2 / FPS) ? -8 : 0, nod: breath(q),
      ua: q > .6 ? -60 : 6, fa: q > .6 ? -50 : -6, shut: blinking(q, [.3]) }, f);
    else if (q < C(3.45)) gran.pose({ x: 1250, y: GY, s: .55, head: 'F', turn: -1, hop: between(q, jolt, jolt + 2 / FPS) ? -10 : 0,
      brow: q < jolt ? .4 : q < set ? 1.4 : -1, mouth: between(q, jolt, C(1.4)) ? 'D' : 'X', crouch: .5 * span(q, C(2.75), C(3.2)),
      nod: breath(q) + (between(q, C(2.36), C(2.36) + 2 / FPS) ? 6 : 0),
      rua: between(q, jolt, set) ? -150 : 6, rfa: between(q, jolt, set) ? -110 : -4, lua: between(q, jolt, set) ? 150 : -6, lfa: between(q, jolt, set) ? 110 : 4,
      shut: blinking(q, [C(1.6), C(3.0)]) }, f);
    else {   // in the air: leaning into it, arms going on twos; the near arm out to the wardrobe's knob as she comes down
      const pump = h.u > 0 && q < OPEN - .15 ? 30 * onTwos(q) : 0, grab = span(q, OPEN - .2, OPEN);
      gran.pose({ x: h.x, y: h.y, s: .55, turn: 1, crouch: q < HOP0 ? .6 : 0, lean: h.u > 0 ? 25 - 15 * grab : 0, ua: h.u > 0 ? lerp(-70 + pump, -95, grab) : -20,
        fa: h.u > 0 ? lerp(-50 - pump, -5, grab) : -20, headR: h.u > 0 ? -6 : 0, brow: -1, mouth: h.u > 0 && q < OPEN ? 'C' : 'X', cap: q < CAPOFF, glasses: q < SPOFF }, f);
    }
    // in the wardrobe: lands, then (front, after the cut) pulls the door to
    vis(granIn.g, q >= HOP1 && q < C(12.6));
    if (q < SHUT0) granIn.pose({ x: 1858, y: 680, s: .55, turn: 1, crouch: .6 * (1 - span(q, HOP1, HOP1 + .3)), cap: false, glasses: false, ua: -40, fa: -20, brow: -1, nod: 4 * span(q, HOP1, HOP1 + .15) }, f);
    else granIn.pose({ x: 1858, y: 680, s: .55, head: 'F', cap: false, glasses: false, brow: -1, lua: q < SHUT0 + 2 / FPS ? 80 : 30, lfa: q < SHUT0 + 2 / FPS ? 20 : 10, shut: blinking(q, [SLAM + .1]) }, f);
    // her eye at the crack: the face slides in from behind the right-hand door
    vis(eyeG, q >= C(12.6)); const ex = 1938 + 40 * (1 - span(q, C(13.3), C(13.65)));
    granEye.pose({ x: ex, y: 911, s: 1.6, head: 'F', cap: false, glasses: false,
      brow: q > C(13.95) ? .8 : 0, shut: blinking(q, [C(13.75), C(14.35)]) }, f);
    // the cap: off, onto the pillow, then up onto the wolf
    vis(cap.g, q >= CAPOFF && q < CAPON);
    if (q < GRAB) { const u = lin(q, CAPOFF, CAPREST); cap.pose(lerp(capFrom[0], capRest[0], u), lerp(capFrom[1], capRest[1], u) - 70 * Math.sin(Math.PI * u), .55, -12 * u); }
    else { const u = span(q, GRAB, CAPON); cap.pose(lerp(capRest[0], capTo[0], u), lerp(capRest[1], capTo[1], u) - 30 * Math.sin(Math.PI * u), .55 + .07 * u, -12 * (1 - u)); }
    // the glasses: higher, spinning, they land in the insert and rock still
    vis(specs.g, q >= SPOFF && q < SPON);
    if (q < SPREST) { const u = lin(q, SPOFF, SPREST); specs.pose(lerp(spFrom[0], spRest[0], u), lerp(spFrom[1], spRest[1], u) - 4 * 260 * u * (1 - u), .55, 720 * u); }
    else if (q < GRAB2) { const t = q - SPREST; specs.pose(spRest[0], spRest[1] - (t < .17 ? 12 * Math.sin(Math.PI * t / .17) : 0), .55, 8 + (t < .6 ? 10 * Math.cos(t * 18) * (1 - t / .6) : 0)); }
    else { const u = span(q, GRAB2, SPON); specs.pose(lerp(spRest[0], spTo[0], u), lerp(spRest[1], spTo[1], u) - 20 * Math.sin(Math.PI * u), .55 + .05 * u, 8 * (1 - u)); }
    // the wolf
    const tucked = q >= CLIMB1, capOn = q >= CAPON, spOn = q >= SPON;
    vis(wolf.g, !tucked); vis(wolfBed.g, tucked);
    if (tucked) {
      const waiting = between(q, C(11.5), C(12.4));
      wolfBed.pose({ x: 1250, y: 630, s: .6, turn: -1, head: 'F', cap: 'off', night: true, glasses: true, nod: breath(q),
        look: q > C(11.06) && q < C(12.2) ? -1 : 0, brow: waiting ? (onTwos(q) > 0 ? 1 : .3) : .5, shut: blinking(q, [C(12.3)]) }, f);
    } else if (q >= C(10.25)) {   // G: to us, climbing in over the quilt
      const u = lin(q, CLIMB0, CLIMB1);
      wolf.pose({ x: lerp(WX, 1250, u), y: lerp(WY, 630, u) - 80 * Math.sin(Math.PI * u), s: .6, turn: -1, head: 'F', cap: 'off', night: true, glasses: true,
        rua: -20 * Math.sin(Math.PI * u), lua: 20 * Math.sin(Math.PI * u), nod: breath(q) }, f);
    } else if (q < s6_WALK.t0) {  // in the doorway, leaning in, sly
      wolf.pose({ x: s6_WALK.x0, y: WY, s: .6, lean: 12, brow: .6, look: 1, ua: -20, fa: -40, tail: 8 * Math.sin(q * 3), nod: breath(q), shut: blinking(q, [.9]) }, f);
    } else if (q < STOP) {        // creeping in on tiptoe
      const w = creep(q - s6_WALK.t0);
      wolf.pose({ x: w.x, y: WY + w.drop * .6, s: .6, near: w.near, far: w.far, kNear: w.kNear, kFar: w.kFar, lean: 14, ua: -100, fa: -60,
        brow: .6, tail: 10 * Math.sin(q * 4) }, f);
    } else {                      // at the head of the bed: turns his back to the wardrobe, finds them, puts them on
      const turn = 1 - 2 * lin(q, C(7.1), C(7.1) + 3 / FPS);
      const scratch = between(q, C(7.4), C(7.8)), reach = lin(q, C(8.1), C(8.35)) * (1 - lin(q, GRAB, CAPON)), reach2 = lin(q, C(8.9), GRAB2) * (1 - lin(q, GRAB2, SPON));
      const lift = between(q, GRAB, CAPON + .1) ? lin(q, GRAB, CAPON) : 0, lift2 = between(q, GRAB2, SPON + .1) ? lin(q, GRAB2, SPON) : 0;
      const preen = q >= SPON + .1;
      let ua = 6, fa = -6;
      if (scratch) ua = -165, fa = -60 + 20 * onTwos(q);
      else if (lift) ua = lerp(-40, -170, lift), fa = lerp(-20, -40, lift);
      else if (lift2) ua = lerp(-40, -120, lift2), fa = lerp(-20, -80, lift2);
      else if (reach || reach2) ua = -40, fa = -20;
      wolf.pose({ x: WX, y: WY, s: .6, turn, lean: 30 * Math.max(reach, reach2), cap: capOn ? 'off' : 'on', night: capOn, glasses: spOn, ua, fa,
        headR: between(q, C(7.8), C(8.1)) ? 14 : preen ? -8 : 0, brow: scratch || between(q, C(7.8), C(8.45)) ? 1.2 : preen ? (onTwos(q) > 0 ? .9 : .3) : .4,
        ear: between(q, C(7.8), C(8.1)) ? onTwos(q) : 0, tail: 8 * Math.sin(q * 3), nod: breath(q), shut: blinking(q, [C(7.5), C(9.9)]) }, f);
    }
    vis(flap, tucked); const fh = span(q, C(10.9), C(11.25));
    tf(cloth, `translate(1250,646) scale(1,${Math.max(.05, fh).toFixed(3)})`); tf(paws, `translate(1250,${(646 - 66 * fh).toFixed(1)})`);
  });
}
