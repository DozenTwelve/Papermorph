/* scene1.js — home. Down from the treetops to the cottage; on "a little girl who loved her red hooded cape" the door
   opens and Red twirls out, cape flying, and ends facing us for her name. Mother comes to the door: "Take this…", an
   insert of the basket (Red's hand lifts the cloth on "cake": cake and juice; she takes the handle on "to Grandma");
   Mother close, Red's hood blurred in front of her; the path itself on "Stay on the path"; Mother's finger on "don't
   talk to strangers!"; Red close (Mother's blurred head in front), "I promise!"; the wide, she skips off down the path
   into the woods, Mother waving; a trunk wipes to scene 2. Beat clock = PRE1 + the scene-clip word times. */
'use strict';
const PRE1 = 2.4;
// The ground at the cottage door is y 790; puppets here are at scale .6 (Red about 245 px tall). Past the gate the path
// climbs and narrows into the distance, so she grows smaller as she goes.
const s1_pathY = x => 806 - .05 * (x - 560), s1_depth = x => .62 * (1 - .32 * Math.min(1, Math.max(0, (x - 830) / 970)));
// A raised finger that wags on twos while she says the words between a and b.
const s1_wag = (q, a, b) => q > a && q < b ? 9 * onTwos(q) : 0;
const s1_footY = (gy, s) => gy - 170 * s;   // hip height for feet on the ground line gy
// A whole-body turn from a to b over four frames, through a thin squash (never quite 0).
const s1_turn = (q, t0, a, b) => { const v = tween(q, t0, 4 / FPS, a, b); return Math.abs(v) < .12 ? .12 * Math.sign(b) : v; };
// For the basket insert: an arm that reaches in from off frame. The hand is at the origin and the arm runs back along
// -x; place(hx, hy, sx, sy, k) puts the hand at (hx, hy) with the arm pointing back to the shoulder (sx, sy) off frame, k its size.
function s1_arm(parent, sleeve, skin, cape = '') {
  const g = mk('g', {}, parent);
  prop(g, `<g filter="url(#paper)"><rect x="-1400" y="-40" width="1010" height="80" rx="34" fill="${sleeve}"/>${cape ? `<path d="M-1400,-60 L-720,-60 Q-650,0 -720,60 L-1400,60 Z" fill="${cape}"/>` : ''}</g>
    <g filter="url(#paper)"><rect x="-430" y="-31" width="430" height="62" rx="28" fill="${skin}"/><circle r="46" fill="${skin}"/>
      <ellipse cx="-6" cy="-42" rx="17" ry="26" transform="rotate(-28,-6,-42)" fill="${skin}"/></g>`);
  return (hx, hy, sx, sy, k = 1) => tf(g, `translate(${hx.toFixed(1)},${hy.toFixed(1)}) rotate(${(Math.atan2(hy - sy, hx - sx) * 180 / Math.PI).toFixed(1)}) scale(${k})`);
}
// A point (x, y) turned by deg (clockwise on screen) about (cx, cy).
const s1_rot = (x, y, cx, cy, deg) => { const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); return [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c]; };
// The cottage door, swinging open on its hinge at t0. (index.html's paperWarm builds one to bake it: keep the name.)
function door(parent, t0 = 0) {
  const g = mk('g', {}, parent);
  g.innerHTML = `<g filter="url(#paper)"><path d="M606,790 L606,476 Q675,424 744,476 L744,790 Z" fill="#8a5a32"/>
    <path d="M640,450 V790 M675,436 V790 M710,450 V790" stroke="#6e4426" stroke-width="3"/>
    <path d="M606,530 h70 M606,720 h70" stroke="#3b2a1e" stroke-width="9"/><circle cx="726" cy="630" r="7" fill="#caa24c"/></g>`;
  bakeAll(g);
  const open = [1, .7, .3, -.1, -.4, -.55];
  return q => { const k = Math.floor((q - t0) * FPS); tf(g, `translate(606,0) scale(${k < 0 ? 1 : open[Math.min(k, open.length - 1)]},1) translate(-606,0)`); };
}

function scene1(p, D) {
  const P = PRE1, T = (c, t = 0) => clipAt('scene1', P, c, t);
  // Times on the beat clock. s01 starts the scene clip, so its word times are used as they are; s01b's are written
  // (word time − 8.83) and s01c's (word time − 16.3), the clips' starts in narration.en.words.txt.
  const DOOR = T('s01', 1.7), OUT = T('s01', 2.3), LAND = T('s01', 3.95);      // "a little girl who loved her red hooded cape": she twirls out
  const MED = T('s01', 5.4), NAME = T('s01', 6.56), HOOD = T('s01', 7.72);     // "everyone called her Little Red Riding Hood": Red to us
  const MOM = T('s01', 7.2);                                                    // Mother comes to the door behind her
  const TWO = T('s01', 8.4), GIVE = T('s01b');                                  // "Take this": the basket held out
  const INS = T('s01b', 9.1 - 8.83), CAKE = T('s01b', 9.21 - 8.83), TOGRAN = T('s01b', 10.27 - 8.83);   // insert: the basket
  const CU = T('s01b', 11.2 - 8.83), WELL = T('s01b', 11.49 - 8.83), FINGER = T('s01b', 12.45 - 8.83);  // Mother close
  const PATH = T('s01b', 13.02 - 8.83);                                         // "Stay on the path": the path
  const DONT = T('s01b', 14.0 - 8.83), TALK = T('s01b', 14.13 - 8.83), STR = T('s01b', 15.03 - 8.83);   // "don't talk to strangers!"
  const RED = T('s01c', -.12), PROM = T('s01c', 16.46 - 16.3);                  // "I promise!"
  const WIDE = T('s01c', 17.62 - 16.3), TURN = WIDE + .3, WALK = TURN + .45;     // she skips off (the walk1 hole)
  const WIPE = D - .85, WP = .78, WA = 28;                                       // her skip: period and stride

  // ---- cameras ----
  const cam = paperCam(p, 'home', { x: 800, y: -260, z: 1 });
  cam.to({ y: 450 }, .2, 2.3).to({ x: 700, y: 585, z: 1.45 }, 2.5, DOOR + .2 - 2.5)   // down from the treetops, in toward the door
    .to({ x: 735, y: 595, z: 1.6 }, DOOR + .2, MED - DOOR - .2)                         // a slow drift in as she twirls
    .cut({ x: 815, y: 612, z: 2.6 }, MED).to({ x: 812, y: 608, z: 2.75 }, MED, TWO - MED)   // Red, medium, to us
    .cut({ x: 760, y: 610, z: 1.9 }, TWO)                                                // the two of them at the door
    .cut({ x: 1120, y: 600, z: 3 }, INS)                                                 // the insert's blurred wall
    .cut({ x: 745, y: 566, z: 3.4 }, CU).to({ x: 742, y: 562, z: 3.5 }, CU, PATH - CU)   // Mother close
    .cut({ x: 742, y: 562, z: 3.5 }, DONT)                                               // Mother's finger
    .cut({ x: 1000, y: 470, z: 1 }, WIDE).to({ x: 1200 }, WALK + .3, 3);                 // the wide: off she goes
  cam.soft(MED, true).soft(TWO, false).soft(INS, 'all').soft(CU, true).soft(WIDE, false);
  // "Stay on the path": the path itself, where it bends into the trees by the meadow (the very place she will leave it
  // in scene 4; the home set's path is too thin to read). A camera of its own on the meadow set.
  const path = paperCam(p, 'meadow', { x: 1020, y: 650, z: 1.5 }).to({ x: 1120, y: 630, z: 1.7 }, PATH, DONT - PATH);
  // The reverse for Red's close-up: from the doorway out over the garden, Red drawn large on a camera of its own.
  const out = paperCam(p, 'homeOut').soft(0, 'all'), redOut = redPuppet(out.stage);
  // Listeners in front of the close-ups, out of focus: Mother's head in Red's, Red's hood in Mother's.
  mk('defs', {}, p).innerHTML = '<filter id="s1_blur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="9"/></filter>';
  const momFgG = mk('g', { filter: 'url(#s1_blur)' }, out.stage), momFg = motherPuppet(momFgG);
  const fg = mk('g', { filter: 'url(#s1_blur)' }, p), redFg = redPuppet(fg);
  // The insert: the basket between Mother's hand (left) and Red's (right), in frame coordinates over the blurred wall.
  const ins = mk('g', {}, p), bw = mk('g', {}, ins), bk = basketProp(bw), cloth = bk.cloth;
  const momHand = s1_arm(ins, '#f4efe2', '#f2c9a6'), redHand = s1_arm(ins, '#f4efe2', '#f6d2b5', '#c8322f');
  const wipe = trunkWipe(p, WIPE, D - WIPE - .05);
  const puffs = smoke(cam.stage, 932, 84), theDoor = door(cam.stage, DOOR), mom = motherPuppet(cam.stage), red = redPuppet(cam.stage);

  // ---- sound ----
  sfx('scene1', 0, 'forest', .4, { loop: true });   // a bed: it repeats to the end of the scene
  sfx('scene1', DOOR, 'creak', 1.1); sfx('scene1', OUT + .25, 'whoosh', .5); sfx('scene1', LAND, 'step2', .7);
  sfx('scene1', CAKE + .2, 'whoosh', .3);
  for (let k = 0, t; (t = WALK + WP * (.25 + .5 * k)) < WIPE + .2; k++) sfx('scene1', +t.toFixed(2), 'step' + (1 + k % 3), .7 - .05 * k);

  stopClock(D, (q, f) => {
    const redCU = between(q, RED, WIDE), momCU = between(q, CU, PATH) || between(q, DONT, RED), insert = between(q, INS, CU);
    const pathShot = between(q, PATH, DONT);
    vis(cam.root, !redCU && !pathShot); vis(out.root, redCU); vis(path.root, pathShot);
    vis(fg, momCU); vis(ins, insert);
    if (pathShot) { path.apply(q, f); return; }
    const breath = k => Math.sin((q + k) * 2 * Math.PI / 3);

    // ---- Red's close-up: "I promise!", two nods; Mother's blurred head at the left ----
    if (redCU) {
      out.apply(q, f);
      const nod = [0, PROM - RED - .12 + .2].reduce((n, t) => n + 20 * Math.sin(Math.PI * Math.min(1, Math.max(0, (q - RED - .12 - t) / .3))), 0);
      redOut.pose({ x: 930, y: 1000 + 3 * breath(0), s: 2.88, head: 'F', nod, headR: -3 + 2 * breath(.5), mouth: lips(q, 'scene1', P, 's01c'),
        shut: blinking(q, [RED + .9]), rua: 4, rfa: -2, lua: -4, lfa: 2 }, f);
      momFg.pose({ x: 120, y: 1290 + 4 * breath(1), s: 3.6, turn: 1, headR: 4, shut: false }, f);
      return;
    }
    cam.apply(q, f); puffs(q); theDoor(q); wipe(q);

    // ---- the insert: Red's hand lifts the cloth on "cake", takes the handle on "to Grandma", Mother lets go ----
    if (insert) {
      const BX = 800, BY = 885, S = 2.1, K = S / 1.5, at = (x, y) => [BX + x * S, BY + y * S];
      tf(ins, `translate(800,450) scale(${(1 + .07 * span(q, INS, CU)).toFixed(4)}) translate(-800,-450)`);   // a slow push in
      const lift = span(q, CAKE + .12, CAKE + .55), theta = 40 * lift, CX = 150 * lift, CY = 70 * lift;   // the cloth slides off over the right rim
      bk.pose(BX, BY, S, 0);
      tf(cloth, `translate(${CX.toFixed(1)},${CY.toFixed(1)}) rotate(${theta.toFixed(1)},138,-150)`);
      const [mx, my] = at(-26, -236), [gx, gy] = at(35, -235);   // on the handle's top, where it shows over the cake
      const pinch = s1_rot(0, -262, 138, -150, theta), [cx, cy] = at(pinch[0] + CX, pinch[1] + CY);
      // Red's hand: in to the cloth, lifts it, then across to the handle
      const RS = [1900, -150];
      let rx, ry;
      if (q < CAKE + .12) { const u = span(q, INS - .05, CAKE + .12); rx = RS[0] + (cx - RS[0]) * u; ry = RS[1] + (cy - RS[1]) * u; }
      else if (q < CAKE + .75) { rx = cx; ry = cy; }
      else { const u = span(q, CAKE + .75, TOGRAN + .05); rx = cx + (gx - cx) * u; ry = cy + (gy - cy) * u; }
      // once she has it, she lifts it a little and it swings from her hand
      const up = span(q, TOGRAN + .35, TOGRAN + .75), sw = 6 * Math.exp(-Math.max(0, q - TOGRAN - .5) * 2.5) * Math.sin(Math.max(0, q - TOGRAN - .5) * 9) * (q > TOGRAN + .5);
      const lx = 30 * up, ly = -45 * up;
      tf(bw, `translate(${lx.toFixed(1)},${ly.toFixed(1)}) rotate(${sw.toFixed(2)},${gx.toFixed(1)},${gy.toFixed(1)})`);
      redHand(rx + (q > TOGRAN ? lx : 0) + jit(f, 41), ry + (q > TOGRAN ? ly : 0) + jit(f, 42), 1750, -400, K);
      // Mother's hand holds the handle until Red has it, then slides away up and out
      const away = span(q, TOGRAN + .25, TOGRAN + .65), MS = [-250, -350];
      const bob = 5 * Math.sin((q - INS) * 3) * (1 - away);
      momHand(mx + (MS[0] + 200 - mx) * away + jit(f, 43), my + bob + (MS[1] + 100 - my) * away + jit(f, 44), MS[0], MS[1], K);
      if (q < TOGRAN + .35) tf(bw, `translate(0,${bob.toFixed(1)})`);
    }

    // ---- Red's hood, blurred, in front of Mother's close-up ----
    if (momCU) redFg.pose({ x: 1565, y: 1500 + 5 * breath(.3), s: 4.5, turn: -1, basket: true, headR: q < DONT ? 5 * span(q, WELL, WELL + .4) : 2, cape: 3, shut: false }, f);

    // ---- Mother ----
    vis(mom.g, q >= MOM && !insert);
    const sm = .6, front = momCU;
    let ua = 6, fa = -6, basket = q < INS;
    if (q >= GIVE && q < INS + .1) ua = tween(q, GIVE, .4, 6, -45), fa = tween(q, GIVE, .4, -6, -15);   // the basket held out
    let rua = 6, rfa = -4, brow = 0, headR = 0, finger = false;
    if (front) {
      brow = q < FINGER ? .7 * span(q, WELL, WELL + .3) : -.7;                         // sad for Grandma, then firm
      headR = q < FINGER ? 5 * span(q, WELL, WELL + .3) : -2 * span(q, FINGER, FINGER + .3);
      const up = span(q, FINGER, FINGER + .3);
      rua = 6 - 34 * up; rfa = -4 - 142 * up + s1_wag(q, TALK, TALK + .7) + s1_wag(q, STR, STR + .8); finger = up > .5;
    }
    let wave = {};
    if (q >= TURN + .2) wave = { ua: -118, fa: -30 + 22 * onTwos(q) };                // waving her off, on twos
    mom.pose({ x: q < MOM + .4 ? tween(q, MOM, .4, 650, 690) : 690, y: 790 - 212 * sm + (front ? .8 * breath(.2) : 0), s: sm, head: front ? 'F' : 'P',
      ua, fa, basket, swing: basket ? 6 * Math.exp(-Math.max(0, q - GIVE) * 2.5) * Math.sin((q - GIVE) * 9) * (q > GIVE) : 0,
      rua, rfa, lua: -6, lfa: 4, finger, brow, headR,
      mouth: lips(q, 'scene1', P, 's01b'), shut: blinking(q, [MOM + .9, TWO + .4, CU + .2, DONT + 1.0, WIDE + .6, WIDE + 2.4]), ...wave }, f);

    // ---- Red ----
    vis(red.g, q >= DOOR + .2 && !insert && !momCU && !between(q, PATH, DONT));
    if (q >= WIDE) {   // she turns to the path and skips off along it
      const w = walk(q - WALK, { period: WP, A: WA }), xs = 830 + w.d * .5, sr = s1_depth(xs), x = 830 + w.d * sr, walking = q > WALK;
      red.pose({ x, y: s1_pathY(x) - (170 - w.drop) * sr - (walking ? 10 * sr * Math.abs(Math.cos(w.ph)) : 0), s: sr,
        turn: s1_turn(q, TURN, -1, 1), near: w.near, far: w.far, kNear: w.kNear, kFar: w.kFar,
        cape: walking ? 4 + 5 * Math.sin(2 * w.ph + .6) : 3, ua: walking ? -8 + 8 * Math.sin(w.ph) : -8, fa: -78, swing: walking ? 10 * Math.sin(w.ph - 1) : 0,
        headR: walking ? 2 * Math.sin(2 * w.ph) : 0, shut: blinking(q, [WIDE + 1.6]) }, f);
      return;
    }
    if (q >= TWO) {    // turned to Mother (on the cut): looks at the basket, reaches for it
      const reach = span(q, GIVE + .1, GIVE + .45);
      red.pose({ x: 830, y: s1_footY(800, .62) + breath(0), s: .62, turn: -1, basket: false, headR: 4 * span(q, GIVE, GIVE + .2),
        ua: -8 - 60 * reach, fa: -78 + 58 * reach, shut: blinking(q, [TWO + .25]) }, f);
      return;
    }
    // out of the door in a twirl (one and a quarter turns), landing to face us
    const u = Math.min(1, Math.max(0, (q - OUT) / (LAND - OUT))), after = Math.max(0, q - LAND), s = .6 + .02 * u;
    const settle = Math.exp(-after * 3) * Math.sin(after * 10), spinning = u > 0 && u < 1, landed = u >= 1;
    const arms = landed ? span(q, NAME, NAME + .3) * (1 - span(q, HOOD + .5, HOOD + .8)) : 0;   // arms out for her name
    const dip = 10 * Math.sin(Math.PI * span(q, HOOD, HOOD + .45));                            // a little curtsy on "Hood"
    red.pose({
      x: 675 + 155 * ease(u), y: s1_footY(790 + 10 * u, s) - 16 * Math.abs(Math.sin(Math.PI * 2.5 * u)) + dip + (landed ? breath(0) : 0), s,
      turn: Math.cos(Math.PI * 2.5 * ease(u)), head: landed ? 'F' : 'P', basket: false,
      near: 12 * Math.sin(5 * Math.PI * u), far: -12 * Math.sin(5 * Math.PI * u),
      kNear: 22 * Math.abs(Math.sin(2.5 * Math.PI * u)), kFar: 14 * Math.abs(Math.sin(2.5 * Math.PI * u + 1)),
      cape: 3 + 34 * Math.sin(Math.PI * u) + 6 * settle,
      ua: spinning ? -8 - 62 * Math.sin(Math.PI * u) : -8, fa: spinning ? -24 : -78,
      rua: 6 - 44 * arms + 3 * settle, rfa: -4 - 20 * arms, lua: -6 + 44 * arms - 3 * settle, lfa: 4 + 20 * arms,
      headR: landed ? 4 * Math.sin((q - LAND) * 2.2) - 2 * settle : 0, shut: blinking(q, [LAND + .7, MED + 1.3, HOOD + 1.0]),
    }, f);
  });
}
