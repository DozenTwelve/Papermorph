/* scene4.js — Can I run this? Five rounds, each faster: on the stage Claude really works the machines (takes the laptop
   from Martin and sets it on the stool, types with both mittens, yanks the cable out of the port and seats it again,
   hops to the shelf and pokes the router with a telescoping arm), then the terminal fills the frame and the two comic
   panels come up, Claude from the left asking, Martin from the right answering, flatter every time. A command's output
   prints only once Martin has said yes; the fifth is never answered, so it never runs. */
'use strict';
const PRE4 = .2;
// Where Claude types: downstage of the stool with his back to us, a little left of the laptop, so the screen shows past
// his right shoulder and a mitten on the keys either side of him. The cable spot is far enough right that the mitten on
// the plug is clear of his face.
const TYPE_AT = [836, 896];
const CABLE_AT = [1165, 846];
// Claude at the keys from behind, pose o at TYPE_AT: both mittens on the keyboard, tapping on `rate` a second, the body
// bobbing and the antenna wobbling with it.
function typingBack(st, o, q, rate = 10) {
  const tap = Math.floor(q * rate) % 2, [lx, ly] = PLACE.laptop, kx = LAP_W * .4, ky = ly - 16;
  const b = { ...o, x: TYPE_AT[0], y: TYPE_AT[1], s: CLAUDE_S, back: true, bob: 5 * Math.abs(Math.sin(q * rate * Math.PI / 2)), lean: 1.6 * Math.sin(q * rate * .7) };
  return { ...b, ...st.claude.aim({ ...b, lean: 0 }, 'L', [lx - kx + 10 * tap, ky - 6 * tap]), ...st.claude.aim({ ...b, lean: 0 }, 'R', [lx + kx - 10 * (1 - tap), ky - 6 * (1 - tap)]),
    spin: q * 200, starS: 1 + .08 * Math.sin(q * rate * 2) };
}
// A swivel between front and back: u 0 … 1, the figure squeezes through edge-on and comes out the other side.
const flip = (u, toBack) => ({ turn: Math.max(.04, Math.abs(Math.cos(Math.PI * u))), back: toBack ? u > .5 : u < .5 });
const toward = (a, b, u) => ({ x: a[0] + (b[0] - a[0]) * u, y: a[1] + (b[1] - a[1]) * u });
function scene4(p, D, m) {
  const st = garageStage(p), at = (c, t = 0) => clipAt('scene4', PRE4, c, t), end = c => at(c) + TIMINGS[c].dur;
  const ok = c => end(c) + .05;   // output prints once the answer is said
  const term = termScreen(p, [
    { at: at('c03', .8), kind: 'cmd', text: 'ip link show enp3s0', cps: 50 },
    { at: ok('m05'), text: '2: enp3s0: <BROADCAST,MULTICAST> mtu 1500 qdisc fq_codel state DOWN mode DEFAULT group default qlen 1000' },
    { at: ok('m05'), text: '    link/ether 3c:52:82:1a:7e:04 brd ff:ff:ff:ff:ff:ff' },
    { at: at('c04', .8), kind: 'cmd', text: "ethtool enp3s0 | grep 'Link detected'", cps: 70 },
    { at: ok('m06'), text: '        Link detected: no' },
    { at: at('c05', .7), kind: 'cmd', text: "ssh router 'logread | tail -20'", cps: 75 },
    { at: ok('m07'), text: 'Sun Nov  8 02:03:10 2026 kern.info kernel: [ 9022.418211] mtk_soc_eth 1e100000.ethernet lan2: Link is Down' },
    { at: ok('m07'), text: "Sun Nov  8 02:03:10 2026 daemon.notice netifd: Network device 'lan2' link is down" },
    { at: at('c06', -.15), kind: 'cmd', text: 'ping -c 3 1.1.1.1', cps: 120 },
    { at: ok('m08'), kind: 'bad', text: 'ping: connect: Network is unreachable' },
    { at: at('c07', -.2), kind: 'cmd', text: 'nmcli general status', cps: 160 },
  ], { rows: 8 });
  const cl = comicPanel(p, 'claude', 'L'), ma = comicPanel(p, 'martin', 'R');
  // the rounds: the stage while Claude works, then the screen with the panels
  const R = [
    { work: 0, screen: at('c03', 1.75), ask: 'c03', ans: 'm05', text: 'Can I run this? [y/n]', reply: 'y.' },
    { work: end('m05') + .15, screen: at('c04', 1.05), ask: 'c04', ans: 'm06', text: 'Can I run this? [y/n]', reply: 'y.' },
    { work: end('m06') + .15, screen: at('c05', .95), ask: 'c05', ans: 'm07', text: 'Run this? [y/n]', reply: '…y.' },
    { work: null, screen: end('m07') + .05, ask: 'c06', ans: 'm08', text: 'This? [y/n]', reply: 'Yes, YES.' },
    { work: null, screen: end('m08') + .02, ask: 'c07', ans: null, text: 'Can I—', reply: '' },
  ];
  const shots = [];
  R.forEach(r => { if (r.work !== null) shots.push(shot(r.work, 'wide')); shots.push(shot(r.screen, 'screen', null, { over: 'term' })); });
  const S = shooter(st, shots, { term: term.g });
  stingAt('scene4');
  for (const g of [cl.g, ma.g]) vis(g, false);
  const carryG = mk('g', {}, st.fx.parentNode);   // the laptop in Claude's hand on the way to the stool, built once
  const LH = LAP_W * 249 / 415;
  carryG.innerHTML = laptopSVG({ x: 0, y: LH / 2, open: true }).replace('<g class="scr"></g>', lapScreen({ screen: 2 }));
  // the hand-off: the laptop in Martin's hands (world centre and scale) to its place on the stool
  const FROM = [PLACE.martin[0], PLACE.martin[1] - 330 * CW.martin.K, 420 * CW.martin.K / LAP_W];
  const TO = [PLACE.laptop[0], PLACE.laptop[1] - LH / 2, 1];
  const lapAt = v => FROM.map((a, i) => a + (TO[i] - a) * ease(v));
  // round 1: takes the laptop from Martin, sets it on the stool, types; round 2: yanks the plug out of the port and seats
  // it again; round 3: two hops to the shelf, the arm telescopes up, pokes the router
  const take = .4, set = .75, r2 = R[1].work + .1, r3 = R[2].work + .05;
  sfx('scene4', 0, 'rain', .3, { loop: true }); sfx('scene4', 0, 'hum', .3, { loop: true });
  sfx('scene4', set, 'clack', 1); sfx('scene4', set + .15, 'typing', 1.1);
  sfx('scene4', r2 + .3, 'plug', 1.8); sfx('scene4', r2 + .75, 'plug', 2);
  sfx('scene4', r3 + .1, 'boing', .6); sfx('scene4', r3 + .45, 'boing', .6); sfx('scene4', r3 + .85, 'tick', 1.4); sfx('scene4', r3 + 1.05, 'tick', 1.4);
  R.forEach(r => { sfx('scene4', r.screen, 'typing', .5); sfx('scene4', at(r.ask) - .12, 'whoosh', .5);
    if (r.ans) { sfx('scene4', at(r.ans) - .05, 'whoosh', .45); sfx('scene4', ok(r.ans), 'tick', 1.2); } });
  stopClock(D, (q, f) => {
    const cur = S(q);
    let ri = 0; R.forEach((r, i) => { if (q >= (r.work ?? r.screen)) ri = i; });
    const r = R[ri];
    let cl0 = { x: TYPE_AT[0], y: TYPE_AT[1], s: CLAUDE_S, lids: .3, eyeY: .7, eyeX: -.6, look: -.4, mouth: 0, frontL: true, frontR: true };
    let plug = { at: PLACE.port }, flicker = false, onStool = true, held = false, carry = '';
    if (ri === 0) {
      Object.assign(cl0, toward(PLACE.claude, TYPE_AT, span(q, take, set)), { s: CLAUDE_S });
      if (q < set) {   // his arm telescopes out to the laptop in Martin's hands, both hold it a moment, he carries it to the stool
        onStool = false; held = q < take;
        const v = span(q, take, set), [lx, ly, sc] = lapAt(v), grip = [lx + LAP_W / 2 * sc, ly + 20 * sc];
        const reach = span(q, 0, .25), a = st.claude.aim(cl0, 'L', grip);
        Object.assign(cl0, { armL: 15 + (a.armL - 15) * reach, reachL: 1 + (a.reachL - 1) * reach, armR: 15, lean: -4 * reach, frontL: true });
        carry = `translate(${lx.toFixed(1)} ${ly.toFixed(1)}) scale(${sc.toFixed(3)})`;
      } else {   // turns his back to us and types with both mittens, the keys clacking
        const tw = span(q, set, set + .2);
        cl0 = { ...typingBack(st, cl0, q), ...flip(tw, true) };
      }
    } else if (ri === 1) {   // steps right, reaches down to the port, a big yank, a look at the plug, seats it
      const step = span(q, R[1].work + .1, R[1].work + .3), tw = span(q, R[1].work, R[1].work + .15);
      Object.assign(cl0, toward(TYPE_AT, CABLE_AT, step), { s: CLAUDE_S, ...flip(tw, false) });
      const out = span(q, r2 + .15, r2 + .3) - span(q, r2 + .6, r2 + .75);
      plug = { at: [PLACE.port[0] + 90 * out, PLACE.port[1] + 30 * out], lit: q > r2 + .75 && Math.floor(q * 6) % 2 === 0 };
      Object.assign(cl0, { eyeX: -.9, eyeY: .9, look: -.5, lean: -6 }, st.claude.aim(cl0, 'L', [plug.at[0] + 12, plug.at[1] + 2]), { armR: 25 + 30 * out });
    } else if (ri === 2) {   // two hops to the shelf, then the arm telescopes up to the router's ports
      const hop = span(q, r3, r3 + .7), hy = Math.abs(Math.sin(Math.PI * Math.min(1, (q - r3) / .35))) * (q < r3 + .7 ? 60 : 0);
      cl0 = { ...cl0, s: CLAUDE_S, y: CABLE_AT[1], x: CABLE_AT[0] + (PLACE.shelf[0] - CABLE_AT[0]) * hop, bob: hy, look: .5, eyeX: .8, eyeY: -.9, lean: 0, frontL: false,
        squash: q > r3 + .68 && q < r3 + .8 ? .9 : 1 };
      const poke = q > r3 + .8 ? (Math.floor((q - r3 - .8) * 5) % 2) * 12 : 0, up = span(q, r3 + .65, r3 + .85);
      const aimR = st.claude.aim(cl0, 'R', [PLACE.routerPort[0] - 50 - poke, PLACE.routerPort[1] + 4]);
      Object.assign(cl0, { armR: 10 + (aimR.armR - 10) * up, reachR: 1 + (aimR.reachR - 1) * up, armL: 15 });
      flicker = q > r3 + .8;
    } else { cl0 = { ...cl0, x: PLACE.shelf[0], y: PLACE.shelf[1], s: CLAUDE_S, look: .5, eyeX: .8, eyeY: -.9, frontL: false, armR: 175, reachR: 4.2 }; flicker = true; }
    st.frame(q, f, { door: 1, lap: onStool ? { open: true, screen: ri === 0 ? 2 + Math.floor(Math.max(0, q - set) * 6) : 7 } : null, plug, flicker });
    const marty = { x: PLACE.martin[0], y: PLACE.martin[1], look: .6, eyeX: .9, brow: .6, lids: .15 * ri, mouth: 'wobble', shut: blinkAt(q, 9),
      frontL: true, frontR: true, armL: -12, armR: -12, reachL: .85, reachR: .85 };
    if (held || q < 0) {   // holds it out by the sides until Claude has it; the picture is the carried laptop from the first frame
      const [lx, ly, sc] = lapAt(0);
      Object.assign(marty, st.martin.aim(marty, 'L', [lx - LAP_W / 2 * sc, ly + 20 * sc]), st.martin.aim(marty, 'R', [lx + LAP_W / 2 * sc - 10, ly + 20 * sc]));
    }
    castPose(st, cur, f, { doc: docSolder(st, q, f, { look: .5 * glance(q, 1), eyeX: .9 * glance(q, 1), lids: .4 }, glance(q, 1)), martin: marty, claude: cl0 });
    vis(carryG, !!carry); if (carry) tf(carryG, carry);
    // the screen and its panels
    if (cur.kind === 'screen') {
      term.draw(q);
      const next = R[ri + 1] ? (R[ri + 1].work ?? R[ri + 1].screen) : 99;
      const flat = [0, .3, .5, .7, 0][ri], snap = ri === 4;
      cl.draw(q, f, { at: at(r.ask) - .12, out: next - .2, text: r.text, size: 44,
        pose: { lids: 0, brow: .6, mouth: talk(q, 'scene4', PRE4, r.ask), spin: q * 200, shut: blinkAt(q, 3) } });
      const mt = talk(q, 'scene4', PRE4, r.ans || 'm08');
      ma.draw(q, f, { at: snap ? at('c07', .2) : at(r.ans) - .05, out: next - .2, text: r.reply, size: 48,
        pose: { lids: flat, brow: snap ? -1.3 : ri === 3 ? -.9 : .4 - .3 * ri, mouth: snap ? 'grin' : (mt === 'X' ? 'flat' : mt),
          headR: snap ? 4 * jit(f, 11) : 0, eyeY: snap ? 0 : .3 } });
    } else { vis(cl.g, false); vis(ma.g, false); }
  });
}
