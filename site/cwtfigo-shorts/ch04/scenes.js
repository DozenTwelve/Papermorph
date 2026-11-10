/* scenes.js — ch04 scenes 2 to 5 and the end card.
   scene2 Pop: Claude springs out of the hot laptop, burns a mitten ("Ow. Hot."), asks with his small sign to read
     temps, processes and startup; Martin's "Yep" stamps a green thumbprint on it: the script's fingerprint.
   scene3 Found it: the terminal (perf, then what starts at login), then Claude in plain words with paper chips, and
     Martin's frozen surprised face.
   scene4 A change asks every time: the big plan sign (no thumbprint), "Do it!", the --apply run, 91 → 52 °C, the
     cold egg.
   scene5 Next day: no question for the same script; Claude edits it, the print no longer matches, the sign is back,
     a new print.
   end: the series' end card (cwEnd) and Claude's install line. */
'use strict';
const CL = { x: PLACE.claude[0], y: PLACE.claude[1], s: CLAUDE_S, lids: .42 };
// Upright: the small sign goes up over his head (the single is tall, not wide), big enough to read on a phone.
const OVERHEAD = (text, size = 66, w = 820) => ({ name: 'sign', w, x: 0, y: -w * .42, upright: true, text, size });
const READ_SIGN = OVERHEAD("I'll read: temps,\nprocesses, startup.\nOK? [y/n]");
const AGAIN_SIGN = OVERHEAD('Changed.\nRead it again?\n[y/n]', 72);
const PLAN_SIGN = OVERHEAD('WOULD DO:\n1. stop the server\n2. take it off startup\nOK? [y/n]', 84, 1000);
// The upright single is too narrow for Claude and a sign beside him: a medium shot that holds both (the same soft
// garage behind, cut as a single), the sign in his screen-right mitten or the page in his screen-left one.
const SIGN_VIEW = { x: 1060, y: 395, z: 1.9 }, PLAN_VIEW = { x: 1070, y: 380, z: 1.75 }, TALK_VIEW = { x: 1085, y: 530, z: 2.0 }, PAGE_VIEW = { x: 930, y: 500, z: 2.0 };
const claudeWith = (t, view) => ({ ...shot(t, 'single', 'claude'), view });
const cmouth = m => m === 'X' ? 0 : m;
// Martin standing calm at his place (no heat), mug at the chest.
function martinIdle(st, q, extra = {}) {
  const base = { x: PLACE.martin[0], y: PLACE.martin[1], look: .35, eyeX: .7, lids: .1, brow: .3, mouth: 'X', shut: blinkAt(q, 2), frontL: true };
  const mouth = st.martin.point(base, [514, 684]);
  return { ...base, ...st.martin.aim(base, 'L', [mouth[0] - 18, mouth[1] + 64]), holdL: MUG, armR: 10, ...extra };
}
// A stamp's slam: 1.6 → 1 over .15 s from t0, then still.
const slam = (q, t0) => q < t0 ? 0 : 1 + .6 * (1 - ease((q - t0) / .15));

/* ---------- scene2: Pop ---------- */
function scene2(p, D, m) {
  const st = garageStage(p), at = (c, t = 0) => clipAt('scene2', PRE2, c, t), lap = hotLap(st);
  const T_POP = .3, T_KEY = .75, T_OFF = 1.75, T_LAND = 2.15, flip = at('c02', .05), T_STAMP = at('tail2', .05);
  const T_HOT = at('c01', .7);   // "Hot." in his single, blowing on the mitten
  const shots = [shot(0, 'wide'), shot(T_HOT, 'single', 'claude'), claudeWith(at('c02', -.1), SIGN_VIEW), shot(at('m03', .12), 'single', 'martin'),
    claudeWith(at('tail2', -.2), SIGN_VIEW)];
  const S = shooter(st, shots);
  st.cam.to({ x: 830, y: 470, z: 1.6 }, 0, 1.2); st.cam.shake(T_POP, .3, 8);
  sfx('scene2', 0, 'sizzle', .15, { loop: true, to: T_HOT });
  sfx('scene2', T_POP, 'pop', 1.8); sfx('scene2', T_POP + .05, 'whoosh', .8); sfx('scene2', T_KEY, 'sizzle', 1.2);
  sfx('scene2', T_OFF, 'whoosh', .6); sfx('scene2', T_LAND, 'boing', 1);
  sfx('scene2', flip, 'whoosh', .7); sfx('scene2', flip + .18, 'flap', 1.2);
  sfx('scene2', T_STAMP, 'clack', 1.6); sfx('scene2', T_STAMP, 'bang', .5);
  const [ox, oy] = lapW(0, -10), [kx, ky] = lapW(-62, 60), SK = .75;   // the screen; his feet on the keyboard, small
  stopClock(D, (q, f) => {
    const cur = S(q);
    st.frame(q, f, { door: 0, lap: { open: true, screen: 'off' } });
    lap.draw(q, f, { heat: 1, temp: 90, egg: { k: 1.6, cook: 1, sizzle: true } });
    const ct = cmouth(talk(q, 'scene2', PRE2, 'c01', 'c02'));
    let claude = null;
    if (q >= T_POP && q < T_KEY) {   // out of the screen, down onto the keyboard
      const u = span(q, T_POP, T_KEY);
      claude = { ...CL, x: ox + (kx - ox) * u, y: oy + (ky - oy) * u - 120 * Math.sin(Math.PI * u), s: .3 + (SK - .3) * u, spin: q * 480, armL: 120, armR: 120, mouth: 0 };
    } else if (q >= T_KEY && q < T_OFF) {   // the keyboard is hot: hopping foot to foot, "Ow."
      const hop = Math.abs(Math.sin((q - T_KEY) * 14));
      claude = { ...CL, x: kx + 6 * Math.sin(q * 14), y: ky, s: SK, bob: 22 * hop, squash: hop < .2 ? .88 : 1, lids: 0, brow: 1, eyeY: -.4,
        mouth: ct === 0 ? .7 : ct, spin: q * 900, star: '#ff2a2a', armL: 120 + 20 * Math.sin(q * 20), armR: 120 - 20 * Math.sin(q * 20) };
    } else if (q >= T_OFF && q < T_HOT) {   // off the laptop to the floor, growing to his height
      const u = span(q, T_OFF, T_LAND);
      claude = { ...CL, x: kx + (CL.x - kx) * u, y: ky + (CL.y - ky) * u - 160 * Math.sin(Math.PI * u), s: SK + (CLAUDE_S - SK) * u,
        squash: q > T_LAND && q < T_LAND + .2 ? .86 : 1, spin: q * 300, armL: 100, armR: 100, lids: 0, brow: 1, mouth: .5 };
    } else if (q >= T_HOT) {
      const up = span(q, flip, flip + .2), blow = q < flip;
      claude = { ...CL, spin: q * 60, mouth: blow && ct === 0 ? 'O' : ct, shut: blinkAt(q, 7), lids: up > 0 ? 0 : blow ? .1 : .42, brow: up > 0 ? .7 : blow ? 1 : 0,
        armL: 20, armR: up > 0 ? 20 + 175 * up : 20, reachR: up > 0 ? 1 + .5 * up : 1, frontR: true, hold: up > 0 ? READ_SIGN : null };
      if (up > 0) claude.frontR = false;
      else {   // the burnt mitten up by his teeth, shaken and blown on
        const [mx, my] = st.claude.point(claude, [760 + 14 * Math.sin(q * 30), 620]);
        Object.assign(claude, st.claude.aim(claude, 'R', [mx, my]));
      }
    }
    const startle = span(q, T_POP, T_POP + .2);
    const mt = talk(q, 'scene2', PRE2, 'm03');
    castPose(st, cur, f, {
      doc: docSolder(st, q, f, { look: .6 * startle, eyeX: startle, mouth: startle > .3 && q < 2 ? 'O' : 'X' }, startle),
      martin: cur.kind === 'single' ? { x: PLACE.martin[0], y: PLACE.martin[1], look: 0, lids: .2, brow: .4, mouth: mt === 'X' ? 'wobble' : mt, shut: blinkAt(q, 2), armL: 10, armR: 10 }
        : martinIdle(st, q, { look: .6, eyeX: 1, brow: 1, lids: 0, mouth: startle > .3 ? 'O' : 'wobble', lean: -8 * startle }),
      claude,
    });
    let fx = heatFX(q, 1, cur.kind === 'wide');
    const puff = span(q, T_POP, T_POP + .15) * (1 - span(q, T_POP + .5, T_POP + 1.3));
    if (puff > 0) fx += `<g transform="translate(${ox} ${oy - 30}) scale(${(.4 + .5 * span(q, T_POP, T_POP + .9)).toFixed(2)})" opacity="${puff.toFixed(2)}">${
      [[-70, 10, 55], [60, 0, 60], [0, -50, 70], [-35, 45, 45], [45, 50, 50]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#efe9de" stroke="${CW_INK}" stroke-width="5"/>`).join('')}</g>`;
    if (q >= T_KEY && q < T_OFF) fx += smokeSVG(kx - 12, ky - 4, q, 4, .9) + smokeSVG(kx + 14, ky - 4, q + .6, 4, .9);   // his feet smoking
    if (claude && q >= T_HOT && q < flip) { const [hx, hy] = st.claude.hand(claude, 'R'); fx += smokeSVG(hx, hy - 10, q, 4, 1.2); }
    if (claude && q >= T_STAMP && cur.who === 'claude') {
      const [sx, sy] = signPt(st, claude, READ_SIGN, 'R', .74, .7);
      fx += printSVG(sx, sy, 32, PRINT_OK, { label: 'OK', hash: 'sha256 3f9a…', k: slam(q, T_STAMP) });
    }
    st.fxHTML = fx;
  });
}

/* ---------- scene3: Found it ---------- */
function scene3(p, D, m) {
  const st = garageStage(p), at = (c, t = 0) => clipAt('scene3', PRE3, c, t), lap = hotLap(st);
  const term = bigTerm(p, [
    { at: 0, kind: 'cmd', text: 'cw run martin-laptop perf', cps: 50 },
    { at: .6, kind: 'dim', text: '## top-cpu' }, { at: .6, kind: 'out', text: '%CPU %MEM COMMAND' },
    { at: .6, kind: 'bad', text: '231.4 18.4 java' },
    { at: .8, kind: 'dim', text: '## temps-fans' }, { at: .8, kind: 'bad', text: 'x86_pkg_temp 91C' },
    { at: .8, kind: 'out', text: 'fan rpm 5900' },
    { at: 1.05, kind: 'cmd', text: 'cw run martin-laptop running', cps: 70 },
    { at: 1.5, kind: 'dim', text: '## desktop autostart' },
    { at: 1.5, kind: 'bad', text: 'exec-once = java -jar' }, { at: 1.5, kind: 'bad', text: '  ~/mc/server.jar' },
  ]);
  const w = (word, t = 0) => at('c03', t + { running: 1.16, since: 2.5, zero: 3.46 }[word]);
  const chips = [paperChip(p, 'java -jar server.jar', 450, CW_BAND.y + 830, { at: w('running'), mono: true, size: 38, r: -3 }),
    paperChip(p, 'SINCE MARCH', 650, CW_BAND.y + 470, { at: w('since'), size: 50, r: 4 }),
    paperChip(p, 'PLAYERS: 0', 650, CW_BAND.y + 310, { at: w('zero'), size: 56, r: -5, fill: '#ffd9cf' })];
  const shots = [shot(0, 'screen', null, { over: 'term' }), claudeWith(at('c03', -.1), TALK_VIEW), shot(at('m04', -.12), 'close', 'martin')];
  const S = shooter(st, shots, { term: term.g });
  st.cam.to({ z: shots[2].view.z * 1.06 }, at('m04', -.12), 1.4);
  sfx('scene3', 0, 'typing', 1); sfx('scene3', 1.05, 'typing', .9); sfx('scene3', .3, 'whirr', .6);
  for (const c of ['running', 'since', 'zero']) sfx('scene3', w(c), 'tick', 1.4);
  sfx('scene3', at('m04', -.12), 'bang', .4);
  stopClock(D, (q, f) => {
    const cur = S(q);
    if (cur.over === 'term') term.draw(q);
    st.frame(q, f, { door: 0, lap: { open: true, screen: 'off' } });
    lap.draw(q, f, { heat: 1, temp: 91, egg: { k: 1.6, cook: 1, sizzle: true } });
    const ct = cmouth(talk(q, 'scene3', PRE3, 'c03'));
    const tap = q > w('since') && q < w('since', .5);
    castPose(st, cur, f, {
      doc: null,
      martin: { x: PLACE.martin[0], y: PLACE.martin[1], look: 0, lids: 0, brow: .8, eyeY: -.15, mouth: 'O', armL: 18, armR: 18, reachL: .9, reachR: .9 },
      claude: { ...CL, spin: q * 60, mouth: ct, shut: blinkAt(q, 7), lids: .5, brow: .2, cigar: true, armL: 70, holdL: { name: 'cigar', w: 230, x: -30, y: 10, r: -10 },
        armR: tap ? 30 : 15 },
    });
    for (const c of chips) c.draw(q, cur.who === 'claude' ? 99 : -1);
    let fx = heatFX(q, 1, false);
    if (cur.who === 'martin') { const [hx, hy] = st.martin.point({ x: PLACE.martin[0], y: PLACE.martin[1] }, [700, 300]);
      const u = span(q, at('m04', 0), at('m04', 1.4)); fx += `<path d="M${hx},${(hy + 60 * u).toFixed(1)} q-7,12 0,17 q7,-5 0,-17 Z" fill="#bfe6ff" stroke="${CW_INK}" stroke-width="1.8"/>`; }
    st.fxHTML = fx;
  });
}

/* ---------- scene4: a change asks every time ---------- */
// The pencil Martin pokes the egg with, along his arm past the mitten (his own units: 300 long, the tip at +y).
const PENCIL = { svg: `<path d="M-14,0 h28 v250 l-14,50 l-14,-50 Z" fill="#f2c230" stroke="${CW_INK}" stroke-width="9" stroke-linejoin="round"/><path d="M-14,250 l14,50 l14,-50 Z" fill="#e8c9a0" stroke="${CW_INK}" stroke-width="7" stroke-linejoin="round"/><rect x="-14" y="-40" width="28" height="40" fill="#f08ca0" stroke="${CW_INK}" stroke-width="8"/>`, x: 0, y: 0 };
function scene4(p, D, m) {
  const st = garageStage(p), at = (c, t = 0) => clipAt('scene4', PRE4, c, t), lap = hotLap(st);
  const H4 = 3.5;   // the hole before "Aw." in join.py's m06@0+3.5: the terminal, the cool-down, the egg
  const T_EVERY = at('c04', 2.38), T_TERM = at('m06', .05), T_COOL = T_TERM + 2.0, T_EGG = at('m06', H4 - .1), T_SAD = at('m06', H4 + .82);
  const term = bigTerm(p, [
    { at: T_TERM, kind: 'cmd', text: 'cw run martin-laptop cool-down --apply', cps: 60 },
    { at: T_TERM + .85, kind: 'ok', text: 'stopped  java -jar server.jar' },
    { at: T_TERM + 1.0, kind: 'ok', text: 'removed  it from startup' },
  ]);
  const temp = q => 91 - 39 * span(q, T_COOL + .1, T_COOL + 1.2), heat = q => 1 - span(q, T_COOL + .1, T_COOL + 1.3);
  const big = stamp(p, '');
  // a change has no fingerprint to keep: it asks every time (screen space, across the plan sign's foot)
  const SX = SW / 2, SY = CW_BAND.y + 470;
  const every = stamp(p, `<g transform="translate(${SX} ${SY}) rotate(-7)"><rect x="-330" y="-56" width="660" height="112" rx="12" fill="#fbf8f0" opacity=".9" stroke="${PRINT_BAD}" stroke-width="10"/><text y="24" text-anchor="middle" font-family="${MARKER}" font-size="72" fill="${PRINT_BAD}">ASKS EVERY TIME</text></g>`);
  const [ex, ey] = lapW(EGG_AT[0], EGG_AT[1]);
  const W4 = { ...WIDE, x: 805 };
  const shots = [claudeWith(0, PLAN_VIEW), shot(at('m05', -.1), 'single', 'martin'), shot(T_TERM, 'screen', null, { over: 'term' }),
    { ...shot(T_COOL, 'wide'), view: W4 }, { ...shot(T_EGG, 'wide'), view: { x: ex - 8, y: ey - 14, z: 4.4 } }, shot(T_SAD, 'single', 'martin')];
  const S = shooter(st, shots, { term: term.g });
  const up0 = .05;
  sfx('scene4', 0, 'sizzle', .12, { loop: true, to: T_COOL + 1 });
  sfx('scene4', up0, 'whoosh', .8); sfx('scene4', up0 + .2, 'flap', 1.3);
  sfx('scene4', T_EVERY, 'clack', 1.4); sfx('scene4', T_EVERY, 'bang', .5);
  sfx('scene4', T_TERM, 'typing', 1); sfx('scene4', T_TERM + .85, 'beep', .8); sfx('scene4', T_COOL + 1.25, 'chime', .9);
  sfx('scene4', T_COOL, 'whirr', .7);
  stopClock(D, (q, f) => {
    const cur = S(q);
    if (cur.over === 'term') term.draw(q);
    st.frame(q, f, { door: 0, lap: { open: true, screen: 'off' } });
    const h = heat(q);
    lap.draw(q, f, { heat: h, temp: temp(q), egg: { k: 1.6, cook: 1, cold: h < .3, sizzle: h > .4 } });
    const ct = cmouth(talk(q, 'scene4', PRE4, 'c04')), mt = talk(q, 'scene4', PRE4, 'm05', 'm06');
    const up = span(q, up0, up0 + .25);
    const claude = q >= T_EGG && cur.kind === 'wide' ? null : cur.who === 'claude'
      ? { ...CL, spin: q * 60, mouth: ct, shut: blinkAt(q, 7), lids: 0, brow: .7, armL: 20, armR: 20 + 175 * up, reachR: 1 + .5 * up, frontR: false, hold: up > 0 ? PLAN_SIGN : null }
      : { ...CL, spin: q * 60, mouth: 0, lids: .42, look: -.4, eyeX: -.8, eyeY: .4, armL: 20, armR: 15, shut: blinkAt(q, 7) };
    let martin;
    if (cur.kind === 'single') {
      const nod = q < T_TERM ? 14 * Math.max(0, Math.sin((q - at('m05')) * 14)) : 0;
      martin = q < T_TERM ? { x: PLACE.martin[0], y: PLACE.martin[1], look: 0, lids: 0, brow: -.3, headY: nod, mouth: mt === 'X' ? 'grin' : mt, armL: 30, armR: 30, shut: blinkAt(q, 2) }
        : { x: PLACE.martin[0], y: PLACE.martin[1], look: 0, lids: .45, brow: 1, mouth: mt === 'X' ? 'frown' : mt, armL: 8, armR: 8, shut: blinkAt(q, 2) };
    } else if (q >= T_EGG) {   // he pokes the cold egg with a pencil: the tip at the white's edge
      const base = { x: PLACE.martin[0], y: PLACE.martin[1], look: .6, eyeX: 1, eyeY: .5, lids: .4, brow: 1, mouth: 'frown', frontR: true };
      const tip = [ex - 46 + 4 * Math.sin(q * 9), ey + 4 * Math.abs(Math.sin(q * 9))];
      const [sx, sy] = st.martin.point(base, CW.martin.shoulders[1]), d = Math.hypot(tip[0] - sx, tip[1] - sy), L = 300 * CW.martin.K;
      martin = { ...base, ...st.martin.aim(base, 'R', [tip[0] - (tip[0] - sx) / d * L, tip[1] - (tip[1] - sy) / d * L]), hold: PENCIL };
    } else martin = martinIdle(st, q, { look: .6, eyeX: q < T_COOL ? 1 : .9, eyeY: q < T_COOL ? -.6 : .3, brow: q < T_COOL ? .2 : .8, lids: q < T_COOL ? 0 : .1 });
    castPose(st, cur, f, { doc: docSolder(st, q, f), martin, claude });
    let fx = heatFX(q, h, cur.kind === 'wide');
    st.fxHTML = fx;
    const ev = cur.who === 'claude' && q >= T_EVERY; vis(every, ev);
    if (ev) tf(every, `translate(${SX} ${SY}) scale(${slam(q, T_EVERY).toFixed(3)}) translate(${-SX} ${-SY})`);
    // the big counter over the wide while the heat drains
    const on = cur.kind === 'wide' && q >= T_COOL && q < T_EGG; vis(big, on);
    if (on) { const t = Math.round(temp(q)), u = span(q, T_COOL + .1, T_COOL + 1.2), col = u < .5 ? mixHex(HOT, '#f0a020', u * 2) : mixHex('#f0a020', COOL, u * 2 - 1), y = CW_BAND.y + 200;
      const k = `${t}${col}`; if (big._k !== k) { big._k = k; const a = `x="${SW / 2}" y="${y}" text-anchor="middle" font-family="${MARKER}" font-size="190"`;
        big.innerHTML = `<text ${a} fill="none" stroke="${CW_INK}" stroke-width="40" stroke-linejoin="round">${t} °C</text><text ${a} fill="${col}">${t} °C</text>`; } }
  });
}

/* ---------- scene5: next day ---------- */
// check.sh on paper, filling the band: its lines, the line Claude pencils in, the old print (green, then smudged red
// and stamped CHANGED) and the new print. draw(q, { write: 0 … 1, changed: 0 … 1, fresh: t0 or null }).
function checkPage(p) {
  const g = mk('g', {}, p);
  mk('rect', { width: SW, height: SH, fill: '#3a2618' }, g);
  const paper = mk('g', {}, g), ink = mk('g', {}, g);
  const X = 110, Y = CW_BAND.y + 90, W = 680, H = 900;
  paper.innerHTML = `<g transform="rotate(-2 ${SW / 2} ${Y + H / 2})"><rect x="${X + 14}" y="${Y + 16}" width="${W}" height="${H}" fill="#000" opacity=".3"/>
    <rect x="${X}" y="${Y}" width="${W}" height="${H}" fill="#fbf8f0" stroke="${CW_INK}" stroke-width="6"/>
    <text x="${X + 40}" y="${Y + 84}" font-family="${MARKER}" font-size="64" fill="${CW_INK}">check.sh</text>
    ${['#!/bin/sh', '# check: martin-laptop', 'cat /sys/class/thermal/*/temp', 'pgrep -f server.jar && echo BACK']
      .map((l, i) => `<text x="${X + 40}" y="${Y + 170 + i * 52}" font-family="${MONO}" font-size="28" fill="#3a3f48">${esc(l)}</text>`).join('')}</g>`;
  const ADD = '+ check the fan too', ax = X + 40, ay = Y + 420;
  let key = '';
  return { g, draw(q, { write = 0, changed = 0, fresh = null } = {}) {
    const n = Math.floor(ADD.length * write), fk = fresh != null && q >= fresh ? slam(q, fresh).toFixed(2) : '-';
    const k = [n, changed.toFixed(2), fk].join(); if (k === key) return; key = k;
    let s = `<g transform="rotate(-2 ${SW / 2} ${Y + H / 2})">`;
    if (n) s += `<text x="${ax}" y="${ay}" font-family="${HAND}" font-size="54" fill="#4a4f5a">${esc(ADD.slice(0, n))}</text>`;
    if (write > 0 && write < 1) {   // the pencil at the end of the line
      const px = ax + inkW(ADD.slice(0, n)) + 6, py = ay - 6;
      s += `<g transform="translate(${px} ${py}) rotate(-35)"><path d="M0,0 l14,-20 h120 v40 h-120 Z" fill="#f2c230" stroke="${CW_INK}" stroke-width="5" stroke-linejoin="round"/><path d="M0,0 l14,-20 v40 Z" fill="#e8c9a0" stroke="${CW_INK}" stroke-width="4"/><circle cx="3" cy="0" r="4" fill="${CW_INK}"/><rect x="134" y="-20" width="26" height="40" fill="#f08ca0" stroke="${CW_INK}" stroke-width="5"/></g>`;
    }
    const col = changed > .5 ? PRINT_BAD : PRINT_OK;
    s += printSVG(X + W - 170, Y + 640, 70, col, { label: changed > .5 ? 'NO MATCH' : 'OK', hash: 'sha256 3f9a…', smudge: changed });
    if (changed > .5) s += `<g transform="translate(${X + W - 210} ${Y + 560}) rotate(-14) scale(${changed > .95 ? 1 : 1.3})"><rect x="-180" y="-52" width="360" height="104" rx="10" fill="none" stroke="${PRINT_BAD}" stroke-width="10"/><text y="26" text-anchor="middle" font-family="${MARKER}" font-size="78" fill="${PRINT_BAD}">CHANGED</text></g>`;
    if (fk !== '-') s += printSVG(X + 200, Y + 660, 70, PRINT_OK, { label: 'OK', hash: 'sha256 b71c…', rot: 10, k: +fk });
    ink.innerHTML = s + '</g>';
  } };
}
const inkW = s => s.length * 25;   // the hand font's average advance at 54 px, for the pencil
function scene5(p, D, m) {
  const st = garageStage(p), at = (c, t = 0) => clipAt('scene5', PRE5, c, t), lap = hotLap(st);
  const page = checkPage(p);
  const T_PAGE = at('c06', 0), T_SIGN = at('c06', 1.5), T_NEW = at('tail5', -.2), T_STAMP2 = at('tail5', -.05);
  const day = slamWord(p, 'NEXT DAY', { at: .05, out: 1.05, size: 150 });
  const w = (t) => at('c05', t);   // c05: Same 0, script .22, You 1.14, already 1.22, No 2.6
  const ok = paperChip(p, '51 °C', 230, CW_BAND.y + 190, { at: w(1.14), size: 72, r: 5, fill: '#d9f5dd' });
  const same = paperChip(p, 'SAME PRINT', 250, CW_BAND.y + 320, { at: w(.3), size: 56, r: -4, ink: PRINT_OK, fill: '#d9f5dd' });
  const shots = [shot(0, 'wide'), shot(at('m07', -.05), 'single', 'martin'), claudeWith(at('c05', -.1), PAGE_VIEW),
    shot(T_PAGE, 'insert', null, { over: 'page' }), claudeWith(T_SIGN, SIGN_VIEW), shot(at('m08', .2), 'single', 'martin'),
    shot(T_NEW, 'insert', null, { over: 'page' })];
  const S = shooter(st, shots, { page: page.g });
  st.cam.to({ z: 1.28 }, 0, 1.2);
  sfx('scene5', .05, 'bang', .6); sfx('scene5', w(-.05), 'whoosh', .3); sfx('scene5', w(.3), 'tick', .7); sfx('scene5', w(1.14), 'tick', 1.4); sfx('scene5', w(1.14), 'chime', .6);
  sfx('scene5', T_PAGE + .1, 'page', 1.2); sfx('scene5', T_PAGE + .85, 'clack', 1.4); sfx('scene5', T_PAGE + .85, 'bang', .4);
  sfx('scene5', T_SIGN - .05, 'whoosh', .7); sfx('scene5', T_SIGN + .13, 'flap', 1.2);
  sfx('scene5', T_STAMP2, 'clack', 1.6); sfx('scene5', T_STAMP2, 'bang', .5);
  // the page Claude holds up in his single (his own units): check.sh with its green print
  const HELD = { svg: `<rect x="-200" y="-560" width="400" height="500" fill="#fbf8f0" stroke="${CW_INK}" stroke-width="12"/>
    <text x="-160" y="-470" font-family="${MARKER}" font-size="72" fill="${CW_INK}">check.sh</text>
    ${[0, 1, 2, 3].map(i => `<rect x="-160" y="${-420 + i * 50}" width="${[300, 230, 280, 250][i]}" height="16" fill="#9aa2ad"/>`).join('')}
    ${printSVG(60, -170, 95, PRINT_OK)}`, x: 0, y: 0, upright: true };
  stopClock(D, (q, f) => {
    const cur = S(q);
    if (cur.over === 'page') page.draw(q, { write: span(q, T_PAGE + .15, T_PAGE + .75), changed: span(q, T_PAGE + .85, T_PAGE + 1.0), fresh: q >= T_NEW ? T_STAMP2 : null });
    st.frame(q, f, { door: 0, lap: { open: true, screen: 'off' } });
    lap.draw(q, f, { heat: 0, temp: 51, desk: true });
    const ct = cmouth(talk(q, 'scene5', PRE5, 'c05', 'c06')), mt = talk(q, 'scene5', PRE5, 'm07', 'm08');
    const shrug = span(q, w(2.5), w(2.75)) * (1 - span(q, w(3.6), w(3.9)));
    let claude = { ...CL, spin: q * 60, mouth: ct, shut: blinkAt(q, 7), lids: .42 };
    if (q < at('c05', -.1)) claude = { ...claude, armL: 20, armR: 15 };
    else if (q < T_PAGE) claude = { ...claude, armL: 75 + 40 * shrug, frontL: true, holdL: HELD, armR: 15 + 40 * shrug, brow: .3 * shrug };
    else { const upS = span(q, T_SIGN + .05, T_SIGN + .25); claude = { ...claude, lids: 0, brow: .7, armL: 20, armR: 20 + 175 * upS, reachR: 1 + .5 * upS, frontR: false, hold: upS > 0 ? AGAIN_SIGN : null }; }
    const martin = cur.kind === 'single' ? { x: PLACE.martin[0], y: PLACE.martin[1], look: 0, lids: .25, brow: q < T_PAGE ? .5 : 0, mouth: mt === 'X' ? 'flat' : mt, armL: 10, armR: 10, shut: blinkAt(q, 2) }
      : martinIdle(st, q);
    castPose(st, cur, f, { doc: docSolder(st, q, f), martin, claude });
    ok.draw(q, cur.who === 'claude' && q < T_PAGE ? 99 : -1); same.draw(q, cur.who === 'claude' && q < T_PAGE ? 99 : -1);
    let fx = '';
    if (cur.who === 'claude' && q < T_PAGE && q >= w(1.14)) {   // the print matches: a tick beside the page
      const [hx, hy] = st.claude.hand(claude, 'L'), k = CW.claude.K * CLAUDE_S;
      fx += tickSVG(hx + 130 * k, hy - 300 * k, 60 * slam(q, w(1.14)));
    }
    st.fxHTML = fx;
    day.draw(q);
  });
}

/* ---------- end card ---------- */
function endScene(p, D) {
  const e = cwEnd(p, { who: 'claude' });
  stopClock(D, (q, f) => e.draw(q, f, { mouth: talk(q, 'end', PRE_END, 'c07') }));
}
