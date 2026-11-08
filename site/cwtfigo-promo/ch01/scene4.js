/* scene4.js — Can I run this? Five rounds, each faster: on the stage Claude really works the machines (takes the laptop
   from Martin and sets it on the stool, types with both mittens, yanks the cable out of the port and seats it again,
   hops to the shelf and pokes the router with a telescoping arm), then the terminal fills the frame and the two comic
   panels come up, Claude from the left asking, Martin from the right answering, flatter every time. A command's output
   prints only once Martin has said yes; the fifth is never answered, so it never runs. */
'use strict';
const PRE4 = .2;
// Where Claude types: right of the stool and a step upstage (feet higher, a touch smaller), so the keys sit at his
// shoulders and his arms come down onto them instead of across his teeth. The cable spot is far enough right that the
// mitten on the plug is clear of his face.
const TYPE_AT = [1005, 772], TYPE_S = CLAUDE_S * .93;
const CABLE_AT = [1165, 846];
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
    { work: 0, screen: at('c03', 1.1), ask: 'c03', ans: 'm05', text: 'Can I run this? [y/n]', reply: 'y.' },
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
  carryG.innerHTML = laptopSVG({ x: 0, y: 60, open: true, w: 190 }).replace('<g class="scr"></g>', lapScreen({ w: 190, screen: 2 }));
  // round 1: takes the laptop from Martin, sets it on the stool, types; round 2: yanks the plug out of the port and seats
  // it again; round 3: two hops to the shelf, the arm telescopes up, pokes the router
  const take = .15, set = .5, r2 = R[1].work + .1, r3 = R[2].work + .05;
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
    let cl0 = { x: TYPE_AT[0], y: TYPE_AT[1], s: TYPE_S, lids: .3, eyeY: .7, eyeX: -.6, look: -.4, mouth: 0, frontL: true, frontR: true };
    let plug = { at: PLACE.port }, flicker = false, onStool = true, held = false, carry = '';
    if (ri === 0) {
      const u = span(q, 0, take + .1);
      Object.assign(cl0, toward(PLACE.claude, TYPE_AT, u), { s: CLAUDE_S + (TYPE_S - CLAUDE_S) * u });
      if (q < set) {   // reaches for the laptop in Martin's hands, carries it to the stool
        onStool = false; held = q < take + .1;
        const v = span(q, take + .1, set), lx = PLACE.martin[0] + 40 + (PLACE.laptop[0] - PLACE.martin[0] - 40) * v, ly = 740 - 170 * v;
        Object.assign(cl0, st.claude.aim(cl0, 'L', [lx + 70, ly - 20]), { armR: 15, lean: -4 });
        if (!held) carry = `translate(${lx.toFixed(1)} ${ly.toFixed(1)})`;
      } else {   // leans in and types with both mittens, the keys clacking
        const tap = Math.floor(q * 10) % 2;
        cl0.lean = -5;
        Object.assign(cl0, st.claude.aim(cl0, 'L', [PLACE.laptop[0] - 34 + 8 * tap, 566 - 8 * tap]), st.claude.aim(cl0, 'R', [PLACE.laptop[0] + 30 - 8 * tap, 566 - 8 * (1 - tap)]));
      }
    } else if (ri === 1) {   // steps right, reaches down to the port, a big yank, a look at the plug, seats it
      const step = span(q, R[1].work, R[1].work + .15);
      Object.assign(cl0, toward(TYPE_AT, CABLE_AT, step), { s: TYPE_S + (CLAUDE_S - TYPE_S) * step });
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
    if (held || q < 0) Object.assign(marty, { armL: -18, armR: -18, reachL: .8, reachR: .8, chest: { name: 'laptop-open', w: 420, y: -330 } });
    castPose(st, cur, f, { doc: docSolder(st, q, f, { look: .5, eyeX: .9, eyeY: 0, lids: .4 }), martin: marty, claude: cl0 });
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
