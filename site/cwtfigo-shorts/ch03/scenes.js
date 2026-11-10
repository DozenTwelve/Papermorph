/* scenes.js — ch03 "No AI needed: the menu". Claude is out of tokens and asleep on his feet; Doc sends Martin to the
   menu; Panik / Kalm / Panik; the menu runs the approved check and maintain with no AI; the cleaner apps go in the
   bin; at five Claude wakes to find it done without him. Script and storyboard: books/cwtfigo-shorts/ch03/. */
'use strict';
const PRE1 = 1.5, PRE2 = .15, PRE3 = 1.5, PRE4 = 1.6, PRE5 = 1.1, PRE6 = 2.0, PRE_END = .6;
const CL = { x: PLACE.claude[0], y: PLACE.claude[1], s: CLAUDE_S };
const STAR_OUT = '#5b5550';   // Claude's ✻ while he is out of tokens

/* ---------- Doc at his bench (the promo's scene1 pose, upright places) ---------- */
const IRON = { name: 'iron', w: 300, upright: true, r: 160, x: -40, y: 0 };
const IRON_OFF = [59.7, -16.8];
function docSolder(st, q, f, extra = {}, up = 0) {
  const dab = 4 * Math.abs(Math.sin(q * 4.3)) * (1 - up);
  const base = { x: PLACE.doc[0], y: PLACE.doc[1], look: .1, eyeY: 1 - 1.2 * up, eyeX: .2, lids: .45 * (1 - up), lean: 3 * (1 - up),
    headY: 12 * (1 - up), frontL: true, frontR: true, shut: blinkAt(q, 1) };
  const tip = [BOARD[0] + 4 + 6 * Math.sin(q * 1.3), BOARD[1] - 12 - dab - 40 * up];
  return { ...base, ...st.doc.aim({ ...base, lean: 0 }, 'L', [BOARD[0] - 52, BOARD[1] - 16]),
    ...st.doc.aim({ ...base, lean: 0 }, 'R', [tip[0] + IRON_OFF[0], tip[1] + IRON_OFF[1]]), hold: IRON, ...extra };
}
function ironTip(st, o) { const [hx, hy] = st.doc.hand(o, 'R'), k = CW.doc.K * (o.s ?? 1); return [hx - 40 * k - 150 * k * .94, hy + 150 * k * .34]; }

/* ---------- Claude out of tokens ---------- */
// Asleep on his feet: lids shut, ✻ dark and still, a slow breath, leaning.
function asleep(q, extra = {}) {
  return { ...CL, shut: true, lean: -5, star: STAR_OUT, spin: 0, mouth: 0, armL: -4, armR: -4, squash: 1 + .012 * Math.sin(q * 2.2), ...extra };
}
// The cardboard sign hung round his neck by a string (world coordinates, for st.fxHTML).
function hungSign(st, o, lines, swing = 0) {
  const [nx, ny] = st.claude.point(o, [512, 735]), [cx, cy] = st.claude.point(o, [512, 1010]), w = 300, h = 148;
  const txt = lines.map((l, i) => `<text x="0" y="${(i - (lines.length - 1) / 2) * 44 + 13}" text-anchor="middle" font-family="${MARKER}" font-size="36" fill="${CW_INK}">${esc(l)}</text>`).join('');
  return `<g transform="translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${swing.toFixed(1)})">
    <path d="M${-w * .32},${-h / 2 + 8} L${(nx - cx).toFixed(1)},${(ny - cy).toFixed(1)} L${w * .32},${-h / 2 + 8}" fill="none" stroke="#e8dcc0" stroke-width="4"/>
    <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="6" fill="#c99a5b" stroke="${CW_INK}" stroke-width="6"/>
    <path d="M${-w / 2 + 14},${h / 2 - 16} H${w / 2 - 30}" stroke="#a87a40" stroke-width="4"/>${txt}</g>`;
}
// "Z"s rising from (x, y) (world coordinates).
function zzz(x, y, q, k = 1) {
  return [0, 1, 2].map(i => { const u = ((q / 1.8 + i / 3) % 1 + 1) % 1;
    return `<text x="${(x + 40 * u * k + 8 * Math.sin(u * 6)).toFixed(1)}" y="${(y - 120 * u * k).toFixed(1)}" font-family="${MARKER}" font-size="${((24 + 22 * u) * k).toFixed(1)}" fill="#f4ede0" stroke="${CW_INK}" stroke-width="${4 * k}" paint-order="stroke" opacity="${(Math.min(1, u * 5) * (1 - u)).toFixed(2)}">Z</text>`; }).join('');
}
const headTop = (st, o) => st.claude.point(o, [700, 330]);

/* ---------- 1. Hook: Claude is out ---------- */
function scene1(p, D, m) {
  const st = garageStage(p), at = (c, t = 0) => clipAt('scene1', PRE1, c, t);
  const MP = { x: 830, y: 846 };   // Martin at Claude's side, both mittens on him, shaking him
  const TWO = { x: 925, y: 540, z: 1.6 };   // low enough that the hook's words sit above Claude's ✻
  const shots = [shot(0, 'wide', null, { view: TWO }), shot(at('m01', 1.5), 'single', 'martin', MP), shot(at('c01', .1), 'single', 'claude', { x: CL.x - 10 }),
    shot(at('m02', -.05), 'single', 'martin', MP), shot(m('m02.doc') - .05, 'close', 'martin', MP)];
  const S = shooter(st, shots);
  st.cam.to({ z: 1.7, y: 555 }, 0, at('m01', 1.5));   // already moving under the hook
  const open = cwOpener(p, 'scene1', ['NO CLAUDE?', 'NO PROBLEM.'], { out: 2.2, y: CW_BAND.y + 150, size: 84 });
  const shakeUntil = at('m01', 1.5);
  [.1, .4, .7, 1.0].forEach(t => sfx('scene1', t, 'clack', .35));   // the rattle, under the first "Claude!"
  stopClock(D, (q, f) => {
    const cur = S(q);
    st.frame(q, f, { lap: { open: true, screen: 'term' } });
    const shake = q < shakeUntil ? Math.sin(q * 34) : 0;
    const cl = asleep(q, { x: CL.x + 11 * shake, lean: -3 + 4 * shake, mouth: talk(q, 'scene1', PRE1, 'c01') === 'X' ? 0 : .15 });
    const mt = talk(q, 'scene1', PRE1, 'm01', 'm02'), close = cur.kind === 'close';
    let ma = { ...MP, look: cur.kind === 'wide' ? .5 : 0, eyeX: cur.kind === 'wide' ? .7 : 0, brow: close ? 1.4 : 1.1, lids: 0,
      mouth: mt === 'X' ? 'wobble' : mt, bob: 5 * Math.abs(Math.sin(q * 17)) * (q < shakeUntil ? 1 : .3), shut: blinkAt(q, 2), frontR: true };
    if (q < shakeUntil) { ma = { ...ma, x: MP.x + 9 * shake, frontL: true }; ma = { ...ma, ...st.martin.aim(ma, 'R', st.claude.point(cl, [190, 745])), ...st.martin.aim(ma, 'L', st.claude.point(cl, [165, 900])) }; }
    else ma = { ...ma, armL: close ? 140 : 20, armR: close ? 140 : 20, headR: close ? 4 * Math.sin(q * 9) : 0 };
    castPose(st, cur, f, { doc: { x: PLACE.doc[0], y: PLACE.doc[1] }, martin: ma, claude: cl });
    const [zx, zy] = headTop(st, cl);
    st.fxHTML = (cur.kind === 'wide' || cur.who === 'claude' ? hungSign(st, cl, ['OUT OF TOKENS', 'BACK AT 5 PM'], 6 * shake) + zzz(zx, zy, q, cur.kind === 'wide' ? 1 : .8) : '');
    open.draw(q);
  });
}

/* ---------- 2. You don't need him ---------- */
function scene2(p, D, m) {
  const st = garageStage(p), at = (c, t = 0) => clipAt('scene2', PRE2, c, t), look = m('d01.menu') - .25;
  const shots = [shot(0, 'single', 'doc'), shot(m('d01.menu') - .1, 'close', 'doc')];
  const S = shooter(st, shots);
  st.cam.to({ z: shots[1].view.z * 1.08 }, m('d01.menu'), 1.4);
  sfx('scene2', .1, 'sizzle', .35);
  stopClock(D, (q, f) => {
    const cur = S(q), up = span(q, look, look + .3), dt = talk(q, 'scene2', PRE2, 'd01');
    st.frame(q, f, { lap: { open: true, screen: 'term' } });
    const doc = docSolder(st, q, f, { mouth: dt, look: 0, eyeX: up ? 0 : .2, eyeY: up ? -.1 : .9, brow: 0 }, up);
    castPose(st, cur, f, { doc, martin: null, claude: null });
    st.fxHTML = up < .5 ? solderSmoke(...ironTip(st, doc), q) + (Math.floor(q * 3) % 3 === 0 ? sparks(...ironTip(st, doc), f) : '') : '';
  });
}

/* ---------- 3. Panik / Kalm / Panik ---------- */
function scene3(p, D, m) {
  const at = (c, t = 0) => clipAt('scene3', PRE3, c, t), myself = at('m03', 1.1);
  mk('rect', { width: SW, height: SH, fill: '#16130f' }, p);
  const PH = 290, GAP = 12, X0 = 30, PW = SW - 60, Y0 = CW_BAND.y + 25;
  for (let i = 0; i < 3; i++) mk('rect', { x: X0, y: Y0 + i * (PH + GAP), width: PW, height: PH, fill: '#221d18', stroke: '#4a4038', 'stroke-width': 6, 'stroke-dasharray': '18 12' }, p);   // the three slots, waiting
  const spec = [
    { label: 'PANIK', sub: 'Claude is out of tokens.', fill: '#d8473b', t: 0 },
    { label: 'KALM', sub: 'He already wrote my scripts.', fill: '#6fa9d6', t: .7 },
    { label: 'PANIK', sub: 'I have to press Enter myself?', fill: '#d8473b', t: at('m03', -.15) },
  ];
  const panels = spec.map((s, i) => {
    const y0 = Y0 + i * (PH + GAP), g = mk('g', { visibility: 'hidden' }, p), id = `p3clip${i}`;
    g.innerHTML = `<clipPath id="${id}"><rect x="${X0}" y="${y0}" width="${PW}" height="${PH}"/></clipPath>
      <rect x="${X0 - 8}" y="${y0 - 8}" width="${PW + 16}" height="${PH + 16}" fill="#fbf8f0"/>
      <rect x="${X0}" y="${y0}" width="${PW}" height="${PH}" fill="${s.fill}"/><rect x="${X0}" y="${y0}" width="${PW}" height="${PH}" fill="url(#cwDots)"/>`;
    const inner = mk('g', { 'clip-path': `url(#${id})` }, g), pup = cwPuppet(inner, 'martin');
    const words = mk('g', {}, g);
    words.innerHTML = `<text x="${X0 + 34}" y="${y0 + 150}" font-family="${MARKER}" font-size="104" fill="#fbf8f0" stroke="${CW_INK}" stroke-width="18" paint-order="stroke" stroke-linejoin="round">${s.label}</text>
      <text x="${X0 + 36}" y="${y0 + 232}" font-family="${MARKER}" font-size="27" fill="#fbf8f0" stroke="${CW_INK}" stroke-width="7" paint-order="stroke">${esc(s.sub)}</text>`;
    mk('rect', { x: X0, y: y0, width: PW, height: PH, fill: 'none', stroke: CW_INK, 'stroke-width': 8 }, g);
    const k = CW.martin.K * 1.36;   // the whole head (hair to chin, 649 source px) fits the panel with the mouth in it
    return { g, pup, y0, s, base: { x: X0 + PW - 190, y: y0 + 8 + (CW.martin.feet[1] - CW.martin.head[1]) * k, s: 1.36 } };
  });
  [0, 1, 2].forEach(i => sfx('scene3', spec[i].t, i === 1 ? 'whoosh' : 'bang', i === 2 ? 1.1 : .8));
  stopClock(D, (q, f) => {
    panels.forEach(({ g, pup, s, base }, i) => {
      const on = q >= s.t; vis(g, on); if (!on) return;
      const u = s.t ? Math.min(1, (q - s.t) / .2) : 1, dx = (1 - ease(u)) * -SW, shake = i === 2 && q >= myself ? 5 * jit(f, 3) : 0;
      tf(g, `translate(${(dx + shake).toFixed(1)} 0)`);
      let o = { ...base, lids: 0, brow: 1.2, eyeX: .3 * Math.sin(q * 7 + i), frontL: true, frontR: true };
      if (i === 1) o = { ...base, lids: .58, brow: -.1, mouth: 'smile', headR: 4, armL: 0, armR: 0 };
      else {
        const mt = i === 2 ? talk(q, 'scene3', PRE3, 'm03') : 'X';
        o.mouth = i === 2 && q >= myself ? 'SCREAM' : mt === 'X' ? 'wobble' : mt;
        if (i === 2) o.brow = 1.5;
        const [ax, ay] = i === 0 ? [180, 330] : [270, 640], [bx, by] = i === 0 ? [840, 330] : [750, 640];
        o = { ...o, ...pup.aim(o, 'L', pup.point(o, [ax, ay])), ...pup.aim(o, 'R', pup.point(o, [bx, by])) };
      }
      pup.pose(o, i === 2 ? f : 0);
    });
  });
}

/* ---------- 4. The menu ---------- */
// The CWTFIGO menu (tui/), upright: header, Machines, Menu, the selected script's head, the key row; `sel` picks the
// menu row by time, `confirm` shows its --apply question in the key row from that time.
function tuiScreen(p, { sel, confirm = 99 }) {
  const g = mk('g', {}, p), B = CW_BAND.y, F = 28, ink = '#c8ccd8', dim = '#6b7082', teal = '#7fd6c2';
  const box = (y, h, title, on) => `<rect x="24" y="${y}" width="${SW - 48}" height="${h}" rx="8" fill="none" stroke="${on ? teal : '#4a4e5e'}" stroke-width="2.5"/>
    <rect x="40" y="${y - 16}" width="${title.length * F * .62 + 16}" height="30" fill="#1b1c27"/><text x="48" y="${y + 7}" font-family="${MONO}" font-size="${F}" fill="${on ? teal : dim}" font-weight="700">${esc(title)}</text>`;
  const T = (x, y, s, c = ink, w = 400) => `<text x="${x}" y="${y}" font-family="${MONO}" font-size="${F}" font-weight="${w}" fill="${c}" xml:space="preserve">${esc(s)}</text>`;
  const bg = mk('g', {}, g);
  bg.innerHTML = `<rect width="${SW}" height="${SH}" fill="#1b1c27"/>
    <rect x="24" y="${B + 22}" width="128" height="36" fill="${teal}"/>${T(34, B + 48, 'CWTFIGO', '#1b1c27', 700)}${T(166, B + 48, '~/.cwtfigo', dim)}${T(SW - 200, B + 48, '2/2 online', dim)}
    ${box(B + 96, 130, 'Machines', false)}
    ${T(44, B + 150, '▶ ●', '#7fe08a')}${T(112, B + 150, 'martin-laptop', '#fff', 700)}${T(420, B + 150, 'arch', dim)}
    ${T(44, B + 196, '  ●', '#7fe08a')}${T(112, B + 196, 'router', ink)}${T(420, B + 196, 'openwrt', dim)}
    ${box(B + 256, 196, 'Menu · martin-laptop', true)}`;
  const rows = mk('g', {}, g), pre = mk('g', {}, g), keys = mk('g', {}, g);
  const ITEMS = [['check.sh', 'health and drift check'], ['maintain.sh', 'updates and cleanup'], ['maintain.sh · --apply', '']];
  const HEAD = [['# check.sh (Arch): READ-ONLY health and', '# drift check. One line per check:', '# OK / BAD / WARN / INFO.', 'enter: runs it, no --apply step'],
    ['# maintain.sh (Arch): no argument: dry', '# run. Pending updates, what each', '# cleanup item would free.', 'enter: dry run, asks before --apply']];
  let key = '';
  return { g, draw(q) {
    let r = 0; for (const [t, i] of sel) if (q >= t) r = i;
    const ask = q >= confirm, k = r + '|' + ask + (Math.floor(q * 2.5) % 2);
    if (k === key) return; key = k;
    rows.innerHTML = ITEMS.map(([n, d], i) => {
      const y = B + 314 + i * 46, on = i === r;
      return (on ? `<rect x="40" y="${y - 31}" width="${SW - 80}" height="42" fill="#c9cbe0"/>` : '') +
        T(48, y, (on ? '▶ ' : '  ') + n, on ? '#1b1c27' : i === 2 ? dim : ink, on ? 700 : 400) + (d ? T(48 + (n.length + 3) * F * .6, y, d, on ? '#3a3d50' : dim) : '');
    }).join('');
    const h = HEAD[Math.min(r, 1)];
    pre.innerHTML = box(B + 484, 300, ITEMS[Math.min(r, 1)][0], false) + h.map((l, i) => T(48, B + 540 + i * 42, l, i === 3 ? teal : dim, i === 3 ? 700 : 400)).join('') +
      T(48, B + 720, '#!/bin/sh', dim);
    keys.innerHTML = ask
      ? `<rect x="24" y="${B + 812}" width="${SW - 48}" height="54" rx="6" fill="#f2c94c"/>${T(44, B + 848, 'Run maintain with --apply? y/N' + (Math.floor(q * 2.5) % 2 ? '▌' : ' '), '#1b1c27', 700)}`
      : T(30, B + 846, 'j/k', teal, 700) + T(90, B + 846, 'move', dim) + T(180, B + 846, 'enter', teal, 700) + T(270, B + 846, 'run', dim) +
        T(345, B + 846, 'r', teal, 700) + T(375, B + 846, 'refresh', dim) + T(510, B + 846, 'q', teal, 700) + T(540, B + 846, 'quit', dim);
  } };
}
// The terminal the menu hands over to while a script runs (tui/src/main.rs run_external), ending on its return line.
const RETURN = 'Press Enter to return.';
const DRY = [['out', '## cleanup (size, on/off)'], ['out', 'pkgcache   on   18.4 GiB old, 2.7 GiB uninstalled'], ['out', 'aur        on   9116M'],
  ['out', 'journal    on   3.8G, to 200M'], ['dim', 'usercache  off  2214M'], ['dim', 'trash      off  640M'], ['out', '## report'], ['ok', 'mode: dry run, nothing changed']];
const APPLY = [['out', '[sudo] password for martin: '], ['out', '+ pacman -Sy archlinux-keyring, then pacman -Su'], ['out', '+ sudo paccache -rk2 && sudo paccache -ruk0'],
  ['out', '+ yay -Sca --noconfirm'], ['out', '+ sudo journalctl --vacuum-size=200M'], ['out', '## report'], ['out', 'mode: applied'], ['ok', 'free on /: 3072M before, 37990M now']];
// The result, big, over the apply run: what a muted viewer reads.
function freeStamp(g) {
  return stamp(g, `<g transform="translate(${SW / 2} 820) rotate(-4)"><text text-anchor="middle" font-family="${MARKER}" font-size="140" fill="#5df07a" stroke="${CW_INK}" stroke-width="24" paint-order="stroke" stroke-linejoin="round">37G FREE</text></g>`);
}
function applyScreen(p, t0) {
  return termScreen(p, APPLY.map(([kind, text], i) => ({ at: t0 + (i ? .55 + i * .2 : 0), kind, text })), { rows: 18 });
}
function scene4(p, D, m) {
  const st = garageStage(p), at = (c, t = 0) => clipAt('scene4', PRE4, c, t);
  const run1 = at('m04', .5), back1 = at('m05', -.5), run2 = at('m05', .95), back2 = at('m06', -1.0), yes = at('m06', .55);
  const sh = termScreen(p, []), shBig = mk('g', {}, sh.g);   // the one command, big in the middle of the screen
  const tui = tuiScreen(p, { sel: [[0, 0], [back1 + .2, 1]], confirm: back2 + .25 });
  const L = (t0, arr) => arr.map(([kind, text], i) => ({ at: t0 + .1 + i * .09, kind, text }));
  const o1 = termScreen(p, L(run1, [['bad', 'BAD  disk / 97%, 3G free'], ['ok', 'OK   disk /boot 31%, 712M free'], ['ok', 'OK   no failed system units'],
    ['ok', 'OK   no failed user units'], ['ok', 'OK   running kernel 6.17.7-arch1-1 is installed'], ['ok', 'OK   no .pacnew'], ['dim', ''], ['dim', RETURN]]));
  const o2 = termScreen(p, L(run2, [...DRY, ['dim', ''], ['dim', RETURN]]));
  const o3 = applyScreen(p, yes + .1), freed = yes + .1 + .55 + 7 * .2;
  const ring = stamp(o1.g, `<ellipse cx="235" cy="328" rx="232" ry="21" fill="none" stroke="#ff3b2f" stroke-width="6"/>`);
  const big37 = freeStamp(o3.g);
  const shots = [shot(0, 'screen', null, { over: 'sh' }), shot(.85, 'screen', null, { over: 'tui' }), shot(run1, 'screen', null, { over: 'o1' }),
    shot(back1, 'screen', null, { over: 'tui' }), shot(run2, 'screen', null, { over: 'o2' }), shot(back2, 'screen', null, { over: 'tui' }),
    shot(at('m06', -.05), 'close', 'martin'), shot(yes, 'screen', null, { over: 'o3' })];
  const S = shooter(st, shots, { sh: sh.g, tui: tui.g, o1: o1.g, o2: o2.g, o3: o3.g });
  const mp = comicPanel(p, 'martin', 'R');   // Martin reacting under the output, as the promo's panels carry the terminal
  sfx('scene4', .15, 'typing', .7); sfx('scene4', .75, 'tick', 1.2); sfx('scene4', .9, 'chime', .6);
  [run1 - .05, back1 + .15, run2 - .05].forEach(t => sfx('scene4', t, 'tick', .6));
  sfx('scene4', run1 + .12, 'beep', .3); sfx('scene4', at('m06', .1), 'keysmash', 1.1); sfx('scene4', yes + .3, 'typing', .8);
  sfx('scene4', freed, 'chime', 1); sfx('scene4', freed + .45, 'bang', 1); sfx('scene4', run1 + .5, 'pop', .8);
  stopClock(D, (q, f) => {
    const cur = S(q);
    for (const [k, o] of [['sh', sh], ['tui', tui], ['o1', o1], ['o2', o2], ['o3', o3]]) if (cur.over === k) o.draw(q);
    if (cur.over === 'sh') { const n = Math.max(0, Math.min(7, Math.floor((q - .15) * 14))), c = Math.floor(q * 2.5) % 2 || n < 7 ? '▌' : ' ';
      shBig.innerHTML = `<text x="90" y="830" font-family="${MONO}" font-size="84" fill="#e8eaed" xml:space="preserve"><tspan fill="#5df07a">$ </tspan>${'cwtfigo'.slice(0, n)}${c}</text>`; }
    if (cur.over === 'o1') mp.draw(q, f, { at: run1 + .5, out: back1 + 1, text: '97%?!', pose: { brow: 1.3, lids: 0, mouth: 'O' } });
    else if (cur.over === 'o2') mp.draw(q, f, { at: run2 + .5, out: back2 + 1, text: '34G of junk?!', pose: { brow: -.8, lids: .1, mouth: 'grin' } });
    else if (cur.over === 'o3') mp.draw(q, f, { at: yes + .5, out: freed + .25, text: 'Bye-bye, junk!', pose: { brow: -1, lids: .3, mouth: 'grin' } });
    else vis(mp.g, false);
    vis(ring, q >= run1 + .5); vis(big37, q >= freed + .45);
    st.frame(q, f, { lap: { open: true, screen: 'term' } });
    const mt = talk(q, 'scene4', PRE4, 'm06'), jab = span(q, at('m06', .05), at('m06', .2)) - span(q, at('m06', .35), at('m06', .6));
    castPose(st, cur, f, { doc: null, claude: null,
      martin: { x: PLACE.martin[0], y: PLACE.martin[1], brow: -1, lids: .15, eyeY: .6, mouth: mt === 'X' ? 'grin' : mt, frontR: true, armR: 30 - 20 * jab, reachR: 1 + .3 * jab, armL: 10, bob: 8 * jab, shut: blinkAt(q, 2) } });
  });
}

/* ---------- 5. No AI, and the cleaner apps go ---------- */
// Made-up cleaner apps (parody names, our own flat icons): a broom, a RAM stick with a ×2 burst, a rocket.
const APPS = [
  { name: 'MegaClean Pro 2026', fill: '#2bb3a3', glyph: `<path d="M8,-26 L-6,6" stroke="#8a5a2b" stroke-width="7" stroke-linecap="round"/><path d="M-20,2 L6,14 L-2,30 L-28,18 Z" fill="#ffd23f" stroke="${CW_INK}" stroke-width="3"/><path d="M18,-14 l4,8 l8,4 l-8,4 l-4,8 l-4,-8 l-8,-4 l8,-4 Z" fill="#fff"/>` },
  { name: 'RAM Doubler Ultra', fill: '#6b3fd1', glyph: `<rect x="-26" y="-10" width="52" height="24" fill="#2f9e44" stroke="${CW_INK}" stroke-width="3"/>${[-18, -6, 6].map(x => `<rect x="${x}" y="-6" width="9" height="14" fill="#222"/>`).join('')}<path d="M14,-34 l5,9 l10,-3 l-4,10 l9,5 l-10,3 l2,10 l-9,-6 l-6,8 l-1,-10 l-10,-1 l8,-7 l-5,-9 l10,2 Z" fill="#ffd23f" stroke="${CW_INK}" stroke-width="2.5"/><text x="20" y="-15" text-anchor="middle" font-family="${MARKER}" font-size="13" fill="${CW_INK}">×2</text>` },
  { name: 'PC Turbo Booster', fill: '#e53935', glyph: `<path d="M-6,22 Q-16,32 -12,40 Q-2,34 4,26 Z" fill="#ffb02e"/><path d="M-12,16 Q-8,-14 18,-28 Q14,4 -2,24 Z" fill="#fff" stroke="${CW_INK}" stroke-width="3"/><circle cx="8" cy="-8" r="5" fill="#5b8fe0" stroke="${CW_INK}" stroke-width="2"/>` },
];
function appIcon(a, x, y, r = 0, s = 1, label = 19) {
  return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${r.toFixed(1)}) scale(${s.toFixed(3)})"><rect x="-40" y="-40" width="80" height="80" rx="18" fill="${a.fill}" stroke="${CW_INK}" stroke-width="5"/>${a.glyph}
    <text y="${44 + label}" text-anchor="middle" font-family="${MARKER}" font-size="${label}" fill="#f4ede0" stroke="${CW_INK}" stroke-width="5" paint-order="stroke">${esc(a.name)}</text></g>`;
}
// A dented metal bin (world coordinates, its foot at y); bump lifts the lid.
function binSVG(x, y, bump = 0) {
  const w = 96, h = 112, I = CW_INK;
  return `<path d="M${x - w / 2},${y - h} L${x - w / 2 + 10},${y} H${x + w / 2 - 10} L${x + w / 2},${y - h} Z" fill="#9aa2ad" stroke="${I}" stroke-width="6" stroke-linejoin="round"/>
    ${[-24, 0, 24].map(d => `<path d="M${x + d},${y - h + 12} L${x + d * .9},${y - 10}" stroke="#6f7680" stroke-width="5"/>`).join('')}
    <path d="M${x + 22},${y - 70} q10,8 2,18" fill="none" stroke="#6f7680" stroke-width="4"/>
    <g transform="translate(${x} ${y - h - 6 - 14 * bump}) rotate(${-8 * bump})"><rect x="${-w / 2 - 8}" y="-9" width="${w + 16}" height="16" rx="6" fill="#b4bbc4" stroke="${I}" stroke-width="6"/><rect x="-14" y="-22" width="28" height="13" rx="5" fill="#b4bbc4" stroke="${I}" stroke-width="5"/></g>`;
}
function scene5(p, D, m) {
  const st = garageStage(p), at = (c, t = 0) => clipAt('scene5', PRE5, c, t);
  const o3 = applyScreen(p, -9);   // the apply run, finished
  vis(freeStamp(o3.g), true);
  const big = (t, y, s, c, r) => ({ t, g: stamp(p, `<g transform="translate(${SW / 2} ${y}) rotate(${r})"><text text-anchor="middle" font-family="${MARKER}" font-size="150" fill="${c}" stroke="${CW_INK}" stroke-width="26" paint-order="stroke" stroke-linejoin="round">${s}</text></g>`) });
  const stamps = [big(.15, 960, 'NO AI.', '#fbf8f0', -6), big(.65, 1130, 'NO TOKENS.', '#ef601d', 4)];
  const MV = { x: 780, y: 640, z: 1.9 }, MX = 660, flick0 = at('m08', .3), wave = at('m08', 2.45);
  const shots = [shot(0, 'screen', null, { over: 'o3' }), shot(at('m07', -.05), 'close', 'martin'), { ...shot(at('m08', -.05), 'single', 'martin'), view: MV }];
  const S = shooter(st, shots, { o3: o3.g });
  st.cam.to({ z: MV.z * 1.08 }, at('m08'), 3.4);
  stamps.forEach(s => sfx('scene5', s.t, 'bang', 1));
  const BIN = [955, 905], HOVER = [[870, 445], [870, 590], [870, 735]], HAND = [805, 612], FL = [1, 0, 2].map(k => flick0 + k * .8);   // the middle app first (it hovers by his hand), then the top one comes down, the bottom one up
  FL.forEach(t => { sfx('scene5', t, 'whoosh', .6); sfx('scene5', t + .42, 'clang', 1); });
  stopClock(D, (q, f) => {
    const cur = S(q);
    if (cur.over === 'o3') o3.draw(q);
    stamps.forEach(s => vis(s.g, cur.over === 'o3' && q >= s.t));
    st.frame(q, f, { lap: { open: true, screen: 'term' } });
    const mt = talk(q, 'scene5', PRE5, 'm07', 'm08'), base = { x: PLACE.martin[0], y: PLACE.martin[1], shut: blinkAt(q, 2) };
    let ma;
    if (q < at('m08')) ma = { ...base, brow: -.6, lids: 0, mouth: mt === 'X' ? 'grin' : mt, armL: 150, armR: 150, frontL: true, frontR: true, bob: 6 * Math.abs(Math.sin(q * 8)) };
    else {
      ma = { ...base, x: MX, lids: .45, brow: 0, mouth: mt === 'X' ? 'smile' : mt, look: .2, eyeX: .7, frontR: true, armL: 8 };
      const next = Math.min(...FL.filter(t => q < t + .25)), i = Number.isFinite(next) ? 0 : 3;
      if (q >= wave) ma = { ...ma, eyeX: 0, look: 0, armR: 150 + 22 * Math.sin((q - wave) * 13), reachR: .95 };
      else if (i < 3) {   // the app comes to his hand, he flicks it at the bin
        const tgt = st.martin.aim({ ...ma }, 'R', HAND), u = span(q, next - .35, next - .1), back = span(q, next, next + .15);
        ma = { ...ma, armR: 25 + (tgt.armR - 25) * u + 30 * back, reachR: 1 + (tgt.reachR - 1) * u };
      } else ma = { ...ma, armR: 30 };
    }
    castPose(st, cur, f, { doc: null, claude: null, martin: ma });
    if (cur.kind === 'single') {
      let fx = '', bump = 0;
      APPS.forEach((a, i) => {
        const t = FL[i], u = Math.min(1, Math.max(0, (q - t) / .42)), c = span(q, t - .35, t - .1);
        if (q >= t + .42) { bump = Math.max(bump, 1 - Math.min(1, (q - t - .42) / .25)); return; }
        const hx = HOVER[i][0] + (HAND[0] + 30 - HOVER[i][0]) * c, hy = HOVER[i][1] + (HAND[1] - 30 - HOVER[i][1]) * c;
        const x = hx + (BIN[0] - hx) * u, y = hy + (BIN[1] - 150 - hy) * u - 70 * Math.sin(u * Math.PI) + 4 * Math.sin(q * 3 + i) * (1 - c);
        fx += appIcon(a, x, y, u * 300, 1.25 * (1 - .4 * u), u > 0 ? 0 : 19);
      });
      st.fxHTML = binSVG(...BIN, bump) + fx;
    } else st.fxHTML = '';
  });
}

/* ---------- 6. Five o'clock ---------- */
function scene6(p, D, m) {
  const st = garageStage(p), at = (c, t = 0) => clipAt('scene6', PRE6, c, t);
  const wake = .25, lit = .7, flip = .95, ins = at('c03', .05), say = at('c03', 2.6), drop = say - .15;
  const book = notebook(p, { left: [{ date: '11-03', text: 'martin-laptop: wrote check + maintain. Martin said yes.', at: -1, size: 50 }],
    right: [{ date: '2026-11-10 tui', text: 'ran maintain --apply: exit 0', at: ins + .2, cps: 40, ink: '#55504a', size: 50 }] });
  const shots = [shot(0, 'wide'), shot(at('c02', -.05), 'single', 'claude'), shot(at('m09', -.05), 'single', 'martin'),
    shot(ins, 'insert', null, { over: 'book' }), shot(say - .05, 'close', 'claude'), shot(at('m10', -.05), 'single', 'martin')];
  const S = shooter(st, shots, { book: book.g });
  for (const i of [2, 5]) st.cam.to({ z: shots[i].view.z * 1.16 }, shots[i].t, 2.4);   // Martin's two cool lines push in, so they never hold still
  sfx('scene6', wake, 'whirr', .9); sfx('scene6', lit, 'chime', 1.1); sfx('scene6', flip, 'flap', 1); sfx('scene6', ins, 'page', .9);
  sfx('scene6', drop + .35, 'clack', .8);
  stopClock(D, (q, f) => {
    const cur = S(q);
    if (cur.over === 'book') book.draw(q);
    st.frame(q, f, { lap: { open: true, screen: 'term' } });
    const ct = talk(q, 'scene6', PRE6, 'c02', 'c03'), mt = talk(q, 'scene6', PRE6, 'm09', 'm10');
    const on = q >= lit || (q >= wake && Math.floor(q * 14) % 2), up = span(q, lit, lit + .3);
    let cl = { ...asleep(q), shut: q < lit, lids: .42 * up + (1 - up), lean: -5 * (1 - up), star: on ? '#e8582a' : STAR_OUT, spin: q >= lit ? (q - lit) * 90 : 0,
      squash: 1, mouth: ct === 'X' ? 0 : ct, armL: 10, armR: 10, cigar: q >= at('c02', -.4) && q < drop };
    if (q >= say - .1) cl = { ...cl, lids: 0, eyeY: -.2, mouth: Math.max(.75, typeof ct === 'number' ? ct : CW_OPEN[ct] ?? 0), armL: 40, armR: 40 };
    const ma = { x: PLACE.martin[0], y: PLACE.martin[1], look: cur.kind === 'wide' ? .5 : 0, eyeX: cur.kind === 'wide' ? .8 : 0, lids: .5, brow: 0,
      mouth: mt === 'X' ? 'smile' : mt, armL: 5, armR: 5, shut: blinkAt(q, 2) };
    castPose(st, cur, f, { doc: docSolder(st, q, f), martin: ma, claude: cl });
    let fx = '';
    if (cur.kind === 'wide' || cur.who === 'claude') {
      fx += hungSign(st, cl, q < flip ? ['OUT OF TOKENS', 'BACK AT 5 PM'] : ['BACK!'], q >= flip ? 8 * Math.sin((q - flip) * 14) * (1 - span(q, flip, flip + .4)) : 0);
      if (q < lit) { const [zx, zy] = headTop(st, cl); fx += zzz(zx, zy, q); }
      if (q >= drop && q < drop + .6) {   // the cigar falls out of his open mouth
        const [ex, ey] = st.claude.point(cl, [700, 630]), u = (q - drop) / .6;
        fx += `<g transform="translate(${ex} ${(ey + 420 * u * u).toFixed(1)}) rotate(${(12 + 240 * u).toFixed(1)}) scale(${CLAUDE_S * CW.claude.K})"><image href="../img/props/cigar.webp" x="0" y="-33" width="230" height="66"/></g>`;
      }
    }
    if (cur.kind === 'wide') fx += solderSmoke(...ironTip(st, docSolder(st, q, f)), q);
    st.fxHTML = fx;
  });
}

/* ---------- 7. End card ---------- */
function endScene(p, D) {
  const e = cwEnd(p, { who: 'claude' });
  stopClock(D, (q, f) => e.draw(q, f, { mouth: talk(q, 'end', PRE_END, 'c04') }));
}
