/* scene8.js — At the mill, the second "listen and find" stop (lib/find.js). Little Horse walks up to the mill door,
   kneels so the sack slides off his back, catches its tie in his teeth and sets it down by the door with a thud, then
   stands proud by it ("Little Horse brought the wheat to the mill." — the video keeps the beat to PRE8 + 3.6, this
   proud hold with a small nod). On "Let's play again! Listen, and touch what he asks for." he steps back and the camera
   pulls out to the wide picture, still from then on, while he asks for the wheel, the duck and the sack; every thing
   answers a tap (mill, wheel, sack, duck, sun, cloud, fence, and Little Horse himself: "That's me!").
   Shots (beat clock, PRE8 3.2): 0 medium follow on the walk-in, door and wheel's edge in frame; 3.1 push in on him and
   the sack, held to 6.8; 6.9–8.8 pull out to the wide set (s8_WIDE). While the game waits he talks with findMouth(),
   looks out at the child while he asks, and glances at the thing just found (findSaw()). */
'use strict';
const PRE8 = 3.2;
let MILL_THINGS = [];   // the things to tap, filled by scene8

// A white paper duck floating, facing right, drawn around its waterline (0, 0).
const s8_duck = (body, wing, beak) => `<g filter="url(#paper)">
  <path d="M-46,-4 C-56,-18 -54,-36 -42,-32 C-32,-27 -24,-31 -10,-33 C8,-35 20,-31 25,-22 C31,-13 30,-3 22,0 L-40,0 Z" fill="${body}"/>
  <path d="M8,-24 C8,-44 14,-62 29,-63 C43,-64 49,-52 45,-42 C41,-34 32,-30 27,-21 Z" fill="${body}"/>
  <path d="M42,-53 C52,-55 61,-51 63,-46 C57,-42 49,-42 42,-45 Z" fill="${beak}"/>
  <path d="M-32,-19 C-22,-28 0,-28 9,-17 C-4,-9 -22,-9 -32,-19 Z" fill="${wing}"/>
  <path d="M-58,3 q14,-6 29,0 q14,-6 29,0 q14,-6 29,0 q14,-6 29,0" stroke="#d6eef3" stroke-width="4" fill="none"/></g>
  <circle cx="33" cy="-50" r="3.4" fill="#2a1a10"/><circle cx="34.2" cy="-51.4" r="1.1" fill="#fff"/>`;

// Little Horse's walk in, his steps back from the door, and the sack's fall from his back to the door.
const s8_IN = [[-1.2, 520], [2.4, 900]], s8_BACK = [[6.8, 900], [8.5, 680]];
// He kneels forward (rump up, chest down) so the sack slides off along his back and over his shoulder (SLIDE); he
// catches its tie in his teeth as it slides past his neck (GRIP), straightens and sets it down beside the door, clear
// of his forelegs (LAND, thud), lets go and looks at it. Every head angle stays within about ±60°.
const s8_SLIDE = 2.6, s8_GRIP = 2.95, s8_LAND = 3.5;
const s8_WIDE = { x: 830, y: 540, z: 1.1 };   // every thing in frame, as big as the fence and the sky allow, the ducks low in the frame's right
const s8_SACK_X = 1046, s8_SACK_S = 1.05;   // where the sack's tie is set down (its bottom on the ground, y 780), its size

function scene8(p, D) {
  const cam = paperCam(p, 'mill', { x: 770, y: 600, z: 1.75 }, { stages: ['pond'] });   // ducks swim in front of the pond's water
  cam.to({ x: 905, y: 610, z: 1.8 }, 0, 2.5)                // follow him to the door
    .to({ x: 925, y: 640, z: 2.0 }, 3.1, 1.8)                // push in on him and the sack, held through his proud moment
    .to(s8_WIDE, 6.9, 1.9)                                   // the wide picture; still from 8.8 on, through the game
    .shake(3.0, .17, 4);
  const sky = cam.world.firstChild;   // the sky layer's own group, so the sun and cloud shapes ride its parallax

  // the pictures, back to front
  const wheelWrap = mk('g', {}, cam.stage), wheel = millWheel(wheelWrap);
  const lh = horsePuppet(cam.stage);
  const sack = prop(cam.stage, SACK);   // moved behind him once his teeth hold its tie
  const ducks = mk('g', {}, cam.stageAt.pond);
  const duck = prop(ducks, s8_duck('#f7f2e6', '#e2dccb', '#e8902e')), duckling = prop(ducks, s8_duck('#f2cf5a', '#e2b844', '#e8902e'));

  // things painted into the baked set: transparent shapes over them (the wheel's rotating bitmap would make its box
  // breathe, so its target is a still circle and the wheel copies the circle's hop)
  const clear = { fill: 'transparent' };
  const mill = mk('path', { d: 'M845,780 L845,488 L790,488 L1040,330 L1160,400 L1160,780 Z', ...clear }, cam.stage);
  const wheelHit = mk('circle', { cx: 1340, cy: 650, r: 176, ...clear }, cam.stage);
  const fence = mk('rect', { x: 112, y: 684, width: 474, height: 108, ...clear }, cam.stage);
  const sun = mk('circle', { cx: 520, cy: 150, r: 58, ...clear }, sky);
  const cloud = mk('path', { d: 'M161,141 C150,115 176,97 198,108 C203,79 242,73 260,95 C275,68 322,75 324,106 C350,97 372,119 359,141 Z', ...clear }, sky);
  MILL_THINGS = [
    { g: mill, word: 'mill' },
    { g: wheelHit, word: 'wheel' },
    { g: sack, word: 'sack', side: 'below' },   // above it would lie over Little Horse's face
    { g: ducks, word: 'duck' },
    { g: sun, word: 'sun' },
    { g: cloud, word: 'cloud' },
    { g: fence, word: 'fence' },
    { g: lh.g, word: 'horse', clip: 'q-me', talk: true },   // he giggles "That's me!"
  ];

  // sound: the mill race under the whole scene, a hoof at every other footfall, the thud, a quack as the ducks come in
  sfx('scene8', 0, 'mill', .5);
  for (const keys of [s8_IN, s8_BACK]) {
    let last = null;
    for (let t = Math.max(0, keys[0][0]); t <= keys[1][0] + .2; t += 1 / 24) {
      const n = Math.floor(route(t, keys, 1.05).d * 2 / 74);
      if (last !== null && n !== last) sfx('scene8', +t.toFixed(2), 'hoof', .25);
      last = n;
    }
  }
  sfx('scene8', s8_LAND, 'thud', .45);
  sfx('scene8', 8.6, 'quack', .3);   // as the duck paddles into the wide picture

  // a living foal: blinks and ear flicks at their own uneven moments, a breath, a slow look round the yard
  const blink = q => { const k = Math.floor(q / 3.4), t0 = k * 3.4 + 1.7 + 1.1 * jit(k, 41); return blinking(q, jit(k, 42) > .4 ? [t0, t0 + .33] : [t0]); };
  const flick = q => { const k = Math.floor(q / 5.3), t0 = k * 5.3 + 2.6 + 1.4 * jit(k, 43), u = (q - t0) / .3; return u > 0 && u < 1 ? Math.sin(Math.PI * u) : 0; };
  const gaze = q => {   // neck angle while he stands proud: forward, down at his sack, up at the wheel, forward
    const c = ((q - 7) % 11 + 11) % 11;
    return c < 3 ? -10 : c < 3.6 ? tween(c, 3, .6, -10, 14) : c < 5.6 ? 14 : c < 6.3 ? tween(c, 5.6, .7, 14, -18) : c < 8.6 ? -18 : tween(c, 8.6, .8, -18, -10);
  };

  stopClock(D, (q, f) => {
    cam.apply(q, f);
    wheel(q);
    const hop = getComputedStyle(wheelHit).translate;   // the hop and the hint's shake find.js gives the wheel's circle
    tf(wheelWrap, hop === 'none' ? '' : `translate(${hop.split(' ').map(parseFloat).map(v => v || 0).join(',')})`);

    // Little Horse
    const rIn = route(q, s8_IN, 1.05), rB = route(q, s8_BACK, 1.05);
    const x = rIn.x + rB.x - 900, d = rIn.d - rB.d, walking = q < 2.7 || between(q, 6.7, 8.8);
    const stand = q < 5 ? rIn.stand : rB.stand;
    const crouch = tween(q, 2.4, .35, 0, 16) - tween(q, s8_GRIP, .5, 0, 6) - tween(q, s8_LAND + .1, .4, 0, 10);   // kneels, then bends to set it down
    const breath = 1.2 * Math.sin(2 * Math.PI * q / 3.4);
    let neck, nod = 0, tilt = 0, ear, look = 0, brow = 0, jaw = null;
    if (q < 2.4) { neck = -4; ear = -.5; }
    else if (q < s8_GRIP) { neck = tween(q, 2.4, .35, -4, 40); nod = tween(q, 2.4, .35, 0, -25); tilt = tween(q, 2.4, .35, 0, 9); ear = .3; look = -.6; brow = -.3; jaw = between(q, 2.7, s8_GRIP - .05) ? .55 : 0; }   // kneels; the sack slides; mouth open to catch it
    else if (q < s8_LAND) {                                                                  // catches it, straightens, lowers it to the door
      const u = span(q, s8_GRIP + .05, s8_LAND);
      neck = 40 + 17 * u; nod = -25 + 7 * u; tilt = 9 * (1 - u); ear = .2; brow = .35; jaw = 0;
    }
    else if (q < 4.2) { neck = tween(q, s8_LAND + .1, .35, 57, 32); nod = tween(q, s8_LAND + .1, .35, -18, 0); tilt = tween(q, s8_LAND + .1, .35, 0, 3); ear = -.2; look = .8; brow = -.1; jaw = q < s8_LAND + .12 ? 0 : null; }   // lets go, looks at it
    else if (q < 6.8) { neck = tween(q, 4.2, .5, 32, -12) + 9 * Math.sin(Math.PI * span(q, 5.6, 6.2)); tilt = tween(q, 4.2, .5, 3, -3); ear = -.6; brow = -.25; }   // chin up, then a small proud nod: done!
    else if (q < 8.8) { neck = tween(q, 6.8, .4, -12, -6); tilt = -3; ear = -.4; brow = -.2; }   // steps back to see it all
    else { neck = gaze(q); tilt = -2.5 + .6 * Math.sin(q * .9); ear = -.4; brow = -.2; }
    // the game: he asks with his head up and his eyes on the child, then glances at what was just found
    const saw = findSaw();
    if (FIND.saying) { neck = -8 + 2 * Math.sin(q * 5); look = 0; ear = -.6; brow = -.3; }
    else if (saw) {
      const r = saw.getBoundingClientRect(), [ex, ey] = lh.at('eye'), m = cam.stage.getScreenCTM().inverse();
      const tx = (r.left + r.width / 2) * m.a + m.e, ty = (r.top + r.height / 2) * m.d + m.f;
      look = Math.sign(tx - ex) || 0; neck = Math.max(-18, Math.min(20, (ty - ey) / 8)); ear = -.5;
    }
    const walkNod = walking ? 3 * Math.sin(4 * Math.PI * d / 74) * (1 - stand) : 0;
    lh.pose({ x, y: 780, s: 1.05, d, stand, gait: 'walk', bob: crouch + breath, tilt, neck: neck + 2 * Math.sin(q * .5), nod: nod + walkNod, jaw, mouth: findMouth(),
      ear: ear + .9 * flick(q), look, brow, lid: q > 8.8 && !FIND.saying ? .1 : 0, tail: 10 * Math.sin(q * 1.3) + 14 * flick(q + 1.9),
      sack: q < s8_SLIDE, shut: blink(q) || between(q, s8_LAND, s8_LAND + 2 / FPS) }, f);

    // the sack: in his teeth by its tie (filling out from its flat shape on his back), swinging, then set down by the door
    vis(sack, q >= s8_SLIDE);
    if ((q < s8_GRIP) !== (sack.nextSibling === null)) q < s8_GRIP ? cam.stage.appendChild(sack) : cam.stage.insertBefore(sack, lh.g);   // over his back while it slides, behind his head once in his teeth
    if (q >= s8_SLIDE) {
      const S = s8_SACK_S, k = q - s8_LAND, sq = k > 0 && k < .25 ? Math.sin(Math.PI * k / .25) : 0;   // the squash on landing
      let X = s8_SACK_X, Y = 780 - 75 * S * (1 - .12 * sq), rot = 0, ys = 1 - .12 * sq, xs = 1 + .1 * sq;
      if (q < s8_GRIP) {   // sliding off: from where it lay on his back to his open mouth, faster and faster, tipping forward
        const [bx, by] = lh.at('back'), [mx, my] = lh.at('mouth'), u = ((q - s8_SLIDE) / (s8_GRIP - s8_SLIDE)) ** 2;
        const tx = bx + 2 * S, ty = by - 36 * S;   // the tie where it lay
        X = tx + (mx - tx) * u; Y = ty + (my + 2 - ty) * u - 14 * Math.sin(Math.PI * u);
        ys = .66 + .34 * u; rot = 30 * Math.sin(Math.PI * u * .9);
      } else if (q < s8_LAND) {
        const [mx, my] = lh.at('mouth'), u = span(q, s8_LAND - .17, s8_LAND);   // the last frames ease onto the spot
        rot = (-14 * Math.sin(Math.PI * span(q, s8_GRIP, s8_LAND)) + 12 * Math.exp(-(q - s8_GRIP) * 8)) * (1 - u);   // the catch jerk, then it trails the swing
        X = mx + (X - mx) * u; Y = my + 2 + (Y - my - 2) * u;
      }
      tf(sack, `translate(${X.toFixed(1)},${Y.toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${(S * xs).toFixed(3)},${(S * ys).toFixed(3)}) translate(-2,35)`);
    }

    // the ducks bob, facing the mill; the duckling paddles after its mother (kept out of the close shots)
    const dx = tween(q, 6.8, 2.4, 1530, 1320) + 22 * Math.sin(q * .23);   // they paddle in from off the right for the wide picture
    tf(duck, `translate(${dx.toFixed(1)},${(808 + 2.5 * Math.sin(q * 2.1)).toFixed(1)}) rotate(${(3 * Math.sin(q * 1.7)).toFixed(1)}) scale(-1.35,1.35)`);
    tf(duckling, `translate(${(dx + 120 + 10 * Math.sin(q * .5)).toFixed(1)},${(812 + 2 * Math.sin(q * 2.9 + 1)).toFixed(1)}) rotate(${(4 * Math.sin(q * 2.3 + .5)).toFixed(1)}) scale(-.75,.75)`);
  });
}
