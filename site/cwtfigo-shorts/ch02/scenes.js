/* scenes.js — ch02 "Many machines", one function per beat (books/cwtfigo-shorts/ch02/storyboard.md). The owner's camera
   rule: a line is a frontal single, an event is the wide, a screen is the whole frame. The machines (ep.js) stand on
   Doc's bench in a row, so the 4:5 wide holds them all; the plate's own router on the shelf stays outside it. */
'use strict';
const PRE1 = 1.8, PRE2 = 1.25, PRE3 = .1, PRE4 = .5, PRE5 = .5, PRE6 = .5, PRE7 = .2, PRE8 = .4, PRE_E = .2;
const endOf = (scene, pre, c) => clipAt(scene, pre, c) + TIMINGS[c].dur;
// This episode's wide: a little left of the kit's WIDE so the NAS on the bench's left end stays in, Claude a step nearer.
const EP_WIDE = { x: 712, y: 450, z: 1.17 }, CL_X = 975;
const cmouth = m => m === 'X' ? 0 : m;   // Claude's teeth read 'X' as shut
// Claude beside the stool, smug, cigar in; extra overrides.
function claudeAt(q, extra = {}) {
  return { x: CL_X, y: PLACE.claude[1], s: CLAUDE_S, lids: .42, spin: q * 60, cigar: true, mouth: 0, shut: blinkAt(q, 3), ...extra };
}
// The machines show in the wide and in Doc's own shots (they stand in front of him); never in Claude's.
const showMachines = cur => cur.kind === 'wide' || cur.who === 'doc';
function cigarSmoke(st, o, q) { return o && o.cigar ? smokeSVG(...emberAt(st, o), q, 4, 1) : ''; }

/* 1. Pointing: the hook. The three machines blame each other, alarms going; Doc in the middle cracks. */
function scene1(p, D) {
  const st = garageStage(p), M = machinesLayer(st), at = (c, t = 0) => clipAt('scene1', PRE1, c, t);
  const H0 = { x: 495, y: 530, z: 1.4 }, H1 = { x: 495, y: 580, z: 1.6 };   // the bench and Doc fill the frame from the first frame
  const shots = [shot(0, 'wide', null, { view: H0 }), shot(at('d01', -.05), 'single', 'doc')];
  const S = shooter(st, shots);
  st.cam.to(H1, .01, 2.4);
  const pops = { nas: 0, router: .1, deck: .2 };   // all three up from the first frame
  [.15, .75, 1.35, 1.95].forEach(t => sfx('scene1', t, 'beep', .55));
  Object.values(pops).forEach(t => sfx('scene1', t, 'pop', .9));
  const open = cwOpener(p, 'scene1', ['THREE MACHINES', 'ONE LAPTOP'], { out: 2.3, size: 72 });
  stopClock(D, (q, f) => {
    const cur = S(q);
    st.frame(q, f, { door: 0, lap: { open: true, screen: 'term' } });
    // Doc's head follows each balloon as it pops, then both hands go to his head for the line
    const who = q < .6 ? -1 : q < 1.2 ? .8 : q < at('d01') - .3 ? -.4 : 0;
    const doc = docAt(st, q, { look: who * .6, eyeX: who, eyeY: .7, lids: 0, mouth: talk(q, 'scene1', PRE1, 'd01'),
      headR: q > at('d01') ? 2.5 * jit(Math.floor(f / 2), 5) : 0 }, q > at('d01') - .4 ? 'head' : null);
    castPose(st, cur, f, { doc, martin: null, claude: null });
    vis(M.g, showMachines(cur));
    const bal = { nas: 1, router: 1, deck: 1 };   // all three shouting from the first frame (the pops only sound)
    M.draw(q, f, { ...blaming(1), balloons: cur.kind === 'wide' ? bal : {}, red: 1, extra: smokeSVG(MACH.nas.x, MACH.nas.y - 150, q, 5, 1.6) });
    st.fxHTML = '';
    open.draw(q);
  });
}

/* 2. Which one? The laptop on the stool goes POOF, Claude lands, the machines stare; Doc: all of them. */
function scene2(p, D) {
  const st = garageStage(p), M = machinesLayer(st), at = (c, t = 0) => clipAt('scene2', PRE2, c, t);
  const T_POP = .2, T_LAND = .95, FROM = [PLACE.laptop[0], PLACE.laptop[1] - 100];
  const shots = [shot(0, 'wide', null, { view: EP_WIDE }), shot(at('c01', -.25), 'single', 'claude', { x: CL_X }), shot(at('d02', -.05), 'single', 'doc')];
  const S = shooter(st, shots);
  st.cam.shake(T_POP, .35, 8);
  sfx('scene2', T_POP, 'pop', 1.8); sfx('scene2', T_POP + .05, 'whoosh', .8); sfx('scene2', T_LAND, 'boing', 1);
  [.6, 1.3].forEach(t => sfx('scene2', t, 'beep', .4));
  stopClock(D, (q, f) => {
    const cur = S(q);
    st.frame(q, f, { door: 0, lap: { open: true, screen: 'term' } });
    const u = span(q, T_POP, T_LAND), air = q >= T_POP;
    const ct = cmouth(talk(q, 'scene2', PRE2, 'c01'));
    // lands, then looks along the machines: right to left, rack to monitor to bench
    const scan = q < T_LAND + .2 ? 0 : q < T_LAND + .5 ? -1 : -.6;
    const claude = air ? claudeAt(q, { x: FROM[0] + (CL_X - FROM[0]) * u, y: FROM[1] + (PLACE.claude[1] - FROM[1]) * u - 220 * Math.sin(Math.PI * u),
      s: .35 + (CLAUDE_S - .35) * u, squash: q > T_LAND && q < T_LAND + .2 ? .86 : 1, spin: q * (u < 1 ? 480 : 60), cigar: q > T_LAND,
      look: scan * .6, eyeX: scan, eyeY: q > T_LAND + .5 && q < T_LAND + .9 ? -.8 : 0, mouth: ct, armL: u < 1 ? 120 : 15, armR: u < 1 ? 120 : 15 }) : null;
    const dt = talk(q, 'scene2', PRE2, 'd02');
    const startle = span(q, T_POP, T_POP + .2);
    let doc;
    if (q >= at('d02', -.05)) doc = docAt(st, q, { look: 0, lids: 0, mouth: dt, headR: 3 * jit(Math.floor(f / 2), 9) }, 'up');
    else doc = docAt(st, q, { look: .8 * startle, eyeX: startle, lids: 0, mouth: startle > .3 && q < 1.4 ? 'O' : 'frown', lean: -5 * startle }, 'head');
    castPose(st, cur, f, { doc, martin: null, claude });
    vis(M.g, showMachines(cur));
    const stare = q > T_POP && q < at('d02');   // all eyes on the new arrival, then back to blaming
    const b = blaming(1);
    if (stare) for (const k of ['nas', 'router', 'deck']) b[k] = { ...b[k], jab: false, look: [1, k === 'router' ? .6 : -.5] };
    const puff = span(q, T_POP, T_POP + .15) * (1 - span(q, T_POP + .5, T_POP + 1.3));
    let fx = puff > 0 && cur.kind === 'wide' ? `<g transform="translate(${FROM[0]} ${FROM[1]}) scale(${(.6 + .8 * span(q, T_POP, T_POP + .9)).toFixed(2)})" opacity="${puff.toFixed(2)}">${
      [[-70, 10, 55], [60, 0, 60], [0, -50, 70], [-35, 45, 45], [45, 50, 50]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#efe9de" stroke="${CW_INK}" stroke-width="5"/>`).join('')}</g>` : '';
    if (cur.kind !== 'wide' && cur.who === 'claude') fx += cigarSmoke(st, claude, q);
    M.draw(q, f, { ...b, red: 1, extra: smokeSVG(MACH.nas.x, MACH.nas.y - 150, q, 5, 1.6) });
    st.fxHTML = fx;
  });
}

/* 3. I never leave your laptop: the reject / approve meme, then the SSH lines zip out from the laptop. */
function scene3(p, D) {
  const st = garageStage(p), M = machinesLayer(st), at = (c, t = 0) => clipAt('scene3', PRE3, c, t);
  const meme = rejectApprove(p);
  const T_W = at('tail3'), lines = { nas: T_W + .1, router: T_W + .3, deck: T_W + .5 };
  const shots = [shot(0, 'insert', null, { over: 'meme' }), shot(T_W, 'wide', null, { view: { ...EP_WIDE, x: 660 } })];   // left enough for the NAS's tag
  const S = shooter(st, shots, { meme: meme.g });
  sfx('scene3', 0, 'whoosh', .7); sfx('scene3', at('c03', -.1), 'flap', 1);
  sfx('scene3', T_W, 'typing', .9);
  Object.values(lines).forEach(t => sfx('scene3', t, 'whoosh', .9));
  stopClock(D, (q, f) => {
    const cur = S(q);
    if (cur.over === 'meme') meme.draw(q, f, { lit: q < at('c03', -.1) ? 0 : 1, mouth: cmouth(talk(q, 'scene3', PRE3, 'c02', 'c03')) });
    st.frame(q, f, { door: 0, lap: { open: true, screen: 3 + Math.floor(Math.max(0, q - T_W) * 6) } });
    const tap = Math.floor(q * 10) % 2;
    const c0 = claudeAt(q, { look: -.5, eyeX: -1, eyeY: .6, lids: .3, frontL: true });
    const claude = { ...c0, ...st.claude.aim(c0, 'L', [PLACE.laptop[0] + 70 + 8 * tap, PLACE.laptop[1] - 14 - 6 * tap]), armR: 15 };
    castPose(st, cur, f, { doc: docAt(st, q, { look: .5, eyeX: 1, eyeY: -.2, lids: 0, mouth: 'O' }), martin: null, claude });
    vis(M.g, showMachines(cur));
    const us = {}; for (const [k, t] of Object.entries(lines)) us[k] = span(q, t, t + .4);
    const b = blaming(1);
    for (const k of ['nas', 'router', 'deck']) b[k] = { ...b[k], jab: false, look: us[k] > 0 ? [1, -.3] : b[k].look };
    M.draw(q, f, { ...b, red: 1, extra: smokeSVG(MACH.nas.x, MACH.nas.y - 150, q, 5, 1.6) + sshSVG(us) });
    st.fxHTML = '';
  });
}

/* 4–6. One screen per machine: the terminal fills the band, Claude's panel from the LEFT, Doc's from the RIGHT, then an
   insert of the machine itself where the fix lands. */
function machineScreen(p, D, scene, pre, { title, lines, cl, dc, insert, stamp }) {
  const st = garageStage(p), M = machinesLayer(st), at = (c, t = 0) => clipAt(scene, pre, c, t);
  const term = termScreen(p, lines(at, (c, t = 0) => endOf(scene, pre, c) + t), { title, rows: 7 });
  const cP = clippedPanel(p, 'claude', 'L'), dP = clippedPanel(p, 'doc', 'R');
  const shots = [shot(0, 'screen', null, { over: 'term' })];
  if (insert) shots.push(shot(insert.t(at, (c, t = 0) => endOf(scene, pre, c) + t), 'wide', null, { view: insert.view }));
  const S = shooter(st, shots, { term: term.g });
  sfx(scene, .05, 'typing', .3);
  // when a panel's balloon changes: its clip's start, a mark in it (at: 'name') or seconds into it (at: 0.1)
  const tOf = r => typeof r.at === 'string' ? pre + TIMINGS[scene].marks[`${r.c}.${r.at}`] : at(r.c, r.at || 0);
  const voiced = (rs, who) => [...new Set(rs.map(x => x.c).filter(c => MOUTHS[c] && c[0] === who))];
  // the line that matters, stamped big over the terminal when it prints
  const stG = mk('g', { visibility: 'hidden' }, p), T_ST = stamp ? stamp.t(at, (c, t = 0) => endOf(scene, pre, c) + t) : 99;
  if (stamp) { stG.innerHTML = `<g transform="translate(640 470) rotate(-8)"><text text-anchor="middle" font-family="${MARKER}" font-size="104" fill="none" stroke="${CW_INK}" stroke-width="22" stroke-linejoin="round">${esc(stamp.text)}</text><text text-anchor="middle" font-family="${MARKER}" font-size="104" fill="${stamp.color || '#ff3b2f'}">${esc(stamp.text)}</text></g>`;
    sfx(scene, T_ST, 'tick', .8); }
  cl.forEach(r => sfx(scene, tOf(r) - .15, 'whoosh', .25)); dc.forEach(r => sfx(scene, tOf(r) - .1, 'whoosh', .2));
  if (insert) { const t = insert.t(at, (c, t = 0) => endOf(scene, pre, c) + t); sfx(scene, t + .3, 'chime', .7); }
  for (const g of [cP.g, dP.g]) vis(g, false);
  stopClock(D, (q, f) => {
    const cur = S(q);
    st.frame(q, f, { door: 0, lap: { open: true, screen: 'term' } });
    if (cur.kind === 'screen') {
      term.draw(q);
      const r = cl.filter(r => q >= tOf(r) - .15).pop() || cl[0], d = dc.filter(r => q >= tOf(r) - .1).pop() || dc[0];
      cP.draw(q, f, { at: tOf(cl[0]) - .15, text: r.text || '', size: 42,
        pose: { lids: .42, brow: r.brow ?? 0, mouth: cmouth(talk(q, scene, pre, ...voiced(cl, 'c'))), spin: q * 120, shut: blinkAt(q, 3), cigar: !!r.cigar, ...(r.pose || {}) } });
      dP.draw(q, f, { at: tOf(dc[0]) - .1, text: d.text || '', size: 46,
        pose: { lids: d.lids ?? 0, mouth: talk(q, scene, pre, ...voiced(dc, 'd')), shut: blinkAt(q, 5), ...(d.pose || {}) } });
      if (stamp) { const on = q >= T_ST; vis(stG, on); if (on) { const k = 1.4 - .4 * ease(span(q, T_ST, T_ST + .15)); tf(stG, `translate(640 470) scale(${k.toFixed(3)}) translate(-640 -470)`); } }
      castPose(st, cur, f, { doc: null, martin: null, claude: null });
      vis(M.g, false);
    } else {
      vis(cP.g, false); vis(dP.g, false); vis(stG, false);
      castPose(st, cur, f, { doc: null, martin: null, claude: null });   // the insert is the machine alone
      vis(M.g, true);
      M.draw(q, f, { ...insert.state(q), red: 0 });
    }
    st.fxHTML = '';
  });
}

function scene4(p, D) {
  machineScreen(p, D, 'scene4', PRE4, { title: 'doc@laptop: ~',
    lines: at => [
      { at: -1, kind: 'cmd', text: 'cw run nas smart', cps: 45 },
      { at: .05, text: '## /dev/sda' },
      { at: .1, kind: 'ok', text: 'SMART overall-health self-assessment test result: PASSED' },
      { at: .25, text: '## /dev/sdc' },
      { at: .3, kind: 'bad', text: 'SMART overall-health self-assessment test result: FAILED!' },
      { at: .35, kind: 'bad', text: 'Reallocated_Sector_Ct  FAILING_NOW  1284' },
    ],
    stamp: { text: 'FAILED!', t: at => at('c04', .3) },
    cl: [{ c: 'c04', text: 'disk 3 is dying.', pose: { armR: 160, reachR: .85, frontR: true, brow: .5 } }, { c: 'c04', at: 'hands', text: 'needs hands.', pose: { lids: .6, brow: .3 } }, { c: 'c05', text: 'Yours.', cigar: true }],
    dc: [{ c: 'c04', at: .3, text: '', pose: { brow: 1, armR: 15 } }, { c: 'd04', text: '…mine?', lids: 0, pose: { brow: 1, armR: 15 } },
      { c: 'c05', text: '…mine?', lids: .45, pose: { armR: 125, reachR: .9, frontR: true, hold: { name: 'screwdriver', w: 300, upright: true, x: 10, y: -40, r: -60 } } }],
  });
}

function scene5(p, D) {
  machineScreen(p, D, 'scene5', PRE5, { title: 'doc@laptop: ~',
    lines: (at, end) => [
      { at: -1, kind: 'cmd', text: 'cw run router check', cps: 45 },
      { at: .1, kind: 'bad', text: 'BAD  DNS via 127.0.0.1 does not resolve example.com: clients using the router for DNS are offline' },
      { at: .15, kind: 'ok', text: 'OK   AdGuardHome running' },
      { at: at('c06', 2.2), kind: 'cmd', text: 'uci show adguardhome.config', cps: 50 },
      { at: at('c06', 2.9), text: "adguardhome.config.config='/etc/adguardhome.yaml'" },
      { at: at('c06', 3.0), kind: 'dim', text: '# 25.12 reads config_file, not config' },
      { at: end('d05', .05), kind: 'cmd', text: 'uci rename adguardhome.config.config=config_file', cps: 90 },
      { at: end('d05', .65), kind: 'ok', text: 'OK   DNS via 127.0.0.1 resolves' },
    ],
    stamp: { text: 'NO DNS', t: at => at('c06', .3) },
    cl: [{ c: 'c06', text: 'update renamed 1 setting.', pose: { armR: 160, reachR: .85, frontR: true, brow: .5 } }, { c: 'c06', at: 'amnesia', text: 'ad blocker: amnesia.', pose: { armL: 115, armR: 115, reachL: .8, reachR: .8, brow: .9, lids: .2 } },
      { c: 'c07', text: 'Fix it? [y/n]', pose: { brow: .4, lids: 0 } }],
    dc: [{ c: 'c06', at: .3, text: '', pose: { brow: .8, armR: 15, look: -.3 } }, { c: 'c06', at: 'amnesia', text: '', pose: { brow: 1, mouth: 'O' } }, { c: 'd05', text: 'y.', pose: { brow: 0 } }],
    insert: { t: (at, end) => end('d05', .8), view: { x: 478, y: 715, z: 3.2 },
      state: q => ({ nas: null, deck: null, router: { ok: true, arms: 'down', lids: .35, look: [0, .3] } }) },
  });
}

function scene6(p, D) {
  machineScreen(p, D, 'scene6', PRE6, { title: 'doc@laptop: ~',
    lines: (at, end) => [
      { at: -1, kind: 'cmd', text: 'cw run deck space', cps: 45 },
      { at: .1, text: '61G   ~/.local/share/Steam/steamapps/compatdata' },
      { at: .15, text: '9.8G  ~/.local/share/Steam/steamapps/shadercache' },
      { at: .2, text: '3.1G  ~/Videos' },
      { at: at('c08', 1.5), kind: 'dim', text: '# compatdata: 38 games no longer installed' },
      { at: at('c08', 3.6), kind: 'dim', text: '# saves inside 3 of them: keep those' },
      { at: end('c08', .95), kind: 'ok', text: 'OK   61G freed, 3 save folders kept' },
    ],
    stamp: { text: '61G', t: at => at('c08', .9), color: '#ef601d' },
    cl: [{ c: 'c08', text: '61 gigs of leftovers.', pose: { armR: 160, reachR: .85, frontR: true, brow: .5 } }, { c: 'c08', at: 'saves', text: 'Saves stay.', cigar: true },
      { c: 'c08', at: 5.05, text: 'Clean? [y/n]', pose: { brow: .4, lids: 0 } }],
    dc: [{ c: 'c08', at: .3, text: '', pose: { brow: .6, armR: 15 } }, { c: 'c08', at: 5.5, text: 'y.' }],
    insert: { t: (at, end) => end('c08', 1.5), view: { x: 614, y: 735, z: 3.4 },
      state: q => ({ nas: null, router: null, deck: { screen: 'free', arms: 'down', lids: .3, look: [0, -.2] } }) },
  });
}

/* 7. One notebook: "Where do you keep notes?" Claude's notebook, a tab per machine; "never on the box that's on fire". */
function scene7(p, D) {
  const st = garageStage(p), M = machinesLayer(st), at = (c, t = 0) => clipAt('scene7', PRE7, c, t);
  const fire = PRE7 + TIMINGS.scene7.marks['c10.fire'];
  const book = notebook(p, {
    left: [{ date: '11-10', text: 'nas: disk 3 dying. Doc swaps it.', at: -1, size: 52 }, { gap: 20 },
      { text: 'router: config_file, fixed.', at: -1, size: 52 }],
    right: [{ date: '11-10', text: 'deck: 61G freed, saves kept.', at: -1, size: 52 }, { gap: 20 },
      { text: 'all of it lives here, on the laptop.', at: at('c10', .2), cps: 30, ink: NOTE_RED, size: 52 }] });
  const tabs = mk('g', {}, book.book);
  tabs.innerHTML = [['nas', '#5b8fe0'], ['router', '#3cae63'], ['deck', '#9a62d0'], ['laptop', '#ef601d']].map(([t, c], i) => {
    const x = 36 + i * 210, y = CW_BAND.y + 22;
    return `<path d="M${x},${y + 66} L${x + 14},${y} H${x + 186} L${x + 200},${y + 66} Z" fill="${c}" stroke="${CW_INK}" stroke-width="6" stroke-linejoin="round"/>` +
      `<text x="${x + 100}" y="${y + 46}" text-anchor="middle" font-family="${MONO}" font-weight="800" font-size="32" fill="#fbf8f0">${t}</text>`;
  }).join('');
  const shots = [shot(0, 'single', 'doc'), shot(at('c10', -.05), 'insert', null, { over: 'book' }), shot(fire - .05, 'wide', null, { view: { x: 356, y: 670, z: 3 } }),
    shot(fire + .65, 'single', 'claude', { x: CL_X })];
  const S = shooter(st, shots, { book: book.g });
  sfx('scene7', at('c10', -.05), 'page', .5);
  stopClock(D, (q, f) => {
    const cur = S(q);
    if (cur.over === 'book') book.draw(q);
    st.frame(q, f, { door: 0, lap: { open: true, screen: 'term' } });
    const claude = claudeAt(q, { look: -.2, eyeX: -.4, lids: .5, brow: .4, mouth: cmouth(talk(q, 'scene7', PRE7, 'c10')),
      frontR: true, armR: 60 + 10 * Math.max(0, Math.sin((q - fire) * 8)) });
    castPose(st, cur, f, { doc: cur.kind === 'wide' ? null : docAt(st, q, { look: .4, eyeX: .9, lids: .5, mouth: talk(q, 'scene7', PRE7, 'd07') }), martin: null, claude: cur.kind === 'wide' ? null : claude });
    vis(M.g, showMachines(cur));
    M.draw(q, f, { nas: { dark: 2, fire: cur.kind === 'wide' ? .7 : 0, alarm: cur.kind === 'wide' ? 1 : 0, lids: .5, look: [.8, -.5] }, router: { ok: true, lids: .3 }, deck: { screen: 'free', lids: .3 },
      extra: smokeSVG(MACH.nas.x, MACH.nas.y - 150, q, 3, 1) });
    st.fxHTML = cur.who === 'claude' ? cigarSmoke(st, claude, q) : '';
  });
}

/* 8. Whose fault: calm again; "So whose fault was it?" and the three machines and Claude all point at Doc. "…Fair." */
function scene8(p, D) {
  const st = garageStage(p), M = machinesLayer(st), at = (c, t = 0) => clipAt('scene8', PRE8, c, t);
  const T_PT = endOf('scene8', PRE8, 'd08') + .1, T_FAIR = at('d09', .9);
  const shots = [shot(0, 'wide', null, { view: EP_WIDE }), shot(T_PT - .05, 'wide', null, { view: { x: 690, y: 450, z: 1.25 } }), shot(T_FAIR, 'single', 'doc')];
  const S = shooter(st, shots);
  [0, .07, .14, .2].forEach((d, i) => sfx('scene8', T_PT + d, 'whoosh', .5 + .1 * i));
  const doc0 = { x: PLACE.doc[0], y: PLACE.doc[1] }, FACE = st.doc.point(doc0, [512, 420]);
  stopClock(D, (q, f) => {
    const cur = S(q);
    st.frame(q, f, { door: 0, lap: { open: true, screen: 'term' } });
    const pt = q >= T_PT, dt = talk(q, 'scene8', PRE8, 'd08', 'd09');
    const doc = q < at('d08', -.1) ? docAt(st, q, { look: .3, eyeX: .4, lids: .3, mouth: 'smile' }, 'brow')
      : docAt(st, q, { look: pt ? 0 : .5, eyeX: pt ? 0 : .7, lids: q >= T_FAIR ? .55 : pt ? 0 : .35, mouth: pt && dt === 'X' ? 'O' : dt, headY: q >= T_FAIR ? 10 : 0, lean: pt && q < T_FAIR ? -4 : 0 });
    if (pt && q < T_FAIR) Object.assign(doc, st.doc.aim(doc, 'R', st.doc.point(doc, [560, 900])));   // me?
    const c0 = claudeAt(q, { x: 935, look: -.4, eyeX: -1, lids: pt ? .2 : .42, brow: pt ? .6 : 0 });
    const claude = pt ? { ...c0, ...st.claude.aim(c0, 'L', [FACE[0] + 70, FACE[1] + 30]), frontL: true } : c0;   // the arm telescopes across the garage
    castPose(st, cur, f, { doc, martin: null, claude });
    vis(M.g, showMachines(cur));
    const calm = { nas: { dark: 2, lids: .35 }, router: { ok: true, lids: .35 }, deck: { screen: 'free', lids: .35 } };
    const AT = { nas: st.doc.point(doc0, [330, 470]), router: st.doc.point(doc0, [512, 120]), deck: st.doc.point(doc0, [700, 470]) };   // cheek, crown, cheek
    if (pt) for (const k of ['nas', 'router', 'deck']) calm[k] = { ...calm[k], point: AT[k], lids: 0, look: null, reach: 1.15, jab: true };
    M.draw(q, f, { ...calm, extra: smokeSVG(MACH.nas.x, MACH.nas.y - 150, q, 3, 1) });
    st.fxHTML = cur.kind === 'wide' ? cigarSmoke(st, claude, q) : '';
  });
}

/* The series' end card: Claude says the install line. */
function endScene(p, D) {
  const e = cwEnd(p, { who: 'claude' });
  stopClock(D, (q, f) => e.draw(q, f, { mouth: cmouth(talk(q, 'end', PRE_E, 'e01')) }));
}
