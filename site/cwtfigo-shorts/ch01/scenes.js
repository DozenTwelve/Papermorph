/* scenes.js — ch01 "It remembers". Martin's Wi-Fi drops again; Claude reads the laptop's page in his notebook, runs
   its approved check, which shows the October fix came undone; "They're the same picture."; the fix asks and sticks;
   today's line goes in the notebook; Doc's toaster has eleven pages. Kit: ../lib/kit.js (books/cwtfigo-shorts/KIT.md).
   Beats: scene1 … scene5, scene7, end (scene 6, the notebook line, is the end of scene 5, so "Noted." starts over the wide). */
'use strict';
const PRE1 = 1.6, PRE2 = .3, PRE3 = .2, PRE4 = .2, PRE5 = .2, PRE7 = .2, PRE_E = .3;

/* ---------- shared acting ---------- */
// Doc at his bench, the iron dabbing at the board (the promo's scene 1); `up` 0 … 1 lifts his head and the iron.
const IRON = { name: 'iron', w: 300, upright: true, r: 160, x: -40, y: 0 };
const IRON_OFF = [59.7, -16.8];
function docSolder(st, q, extra = {}, up = 0) {
  const dab = 4 * Math.abs(Math.sin(q * 4.3)) * (1 - up);
  const base = { x: PLACE.doc[0], y: PLACE.doc[1], look: .1, eyeX: .2, eyeY: 1 - 1.2 * up, lids: .45 * (1 - up), lean: 3 * (1 - up),
    headY: 12 * (1 - up), frontL: true, frontR: true, shut: blinkAt(q, 1) };
  const tip = [BOARD[0] + 4 + 6 * Math.sin(q * 1.3), BOARD[1] - 12 - dab - 40 * up];
  return { ...base, ...st.doc.aim({ ...base, lean: 0 }, 'L', [BOARD[0] - 52, BOARD[1] - 16]),
    ...st.doc.aim({ ...base, lean: 0 }, 'R', [tip[0] + IRON_OFF[0], tip[1] + IRON_OFF[1]]), hold: IRON, ...extra };
}
function ironTip(st, o) { const [hx, hy] = st.doc.hand(o, 'R'), k = CW.doc.K * (o.s ?? 1); return [hx - 40 * k - 150 * k * .94, hy + 150 * k * .34]; }
// Martin clutching his laptop to his chest, as he came in.
const CLUTCH = { frontL: true, frontR: true, armL: -18, armR: -18, reachL: .82, reachR: .82, chest: { name: 'laptop', w: 330, y: -360 } };
const martinAt = (q, extra = {}) => ({ x: PLACE.martin[0], y: PLACE.martin[1], brow: 1, lids: 0, mouth: 'wobble', shut: blinkAt(q, 2), ...CLUTCH, ...extra });
const claudeAt = (q, extra = {}) => ({ x: PLACE.claude[0], y: PLACE.claude[1], s: CLAUDE_S, lids: .42, spin: q * 60, mouth: 0, shut: blinkAt(q, 3), ...extra });
const NB = { name: 'notebook', w: 240, upright: true, r: -8, x: 108, y: 0 };   // the closed notebook in Claude's left mitten
const SIGN = (text, size = 62, w = 560) => ({ name: 'sign', w, x: 40, y: -w * .42, upright: true, text, size });
const cmouth = m => m === 'X' ? 0 : m;   // Claude's teeth read a shape or an opening; rest is shut
// The kit's terminal at 1.3 × from the band's top-left, so its lines read on a phone (each line here fits 34 characters).
const bigTerm = term => { tf(term.g, `translate(0 ${CW_BAND.y}) scale(1.45) translate(0 ${-CW_BAND.y})`); return term; };
// A big stamp in the band's lower half, under the terminal's lines (hidden until shown).
const bigStamp = (p, text, col) => stamp(p, `<g transform="translate(450 1010) rotate(-6)"><rect x="-300" y="-82" width="600" height="148" rx="16" fill="none" stroke="${col}" stroke-width="12"/><text y="30" text-anchor="middle" font-family="${MARKER}" font-size="92" fill="${col}">${text}</text></g>`);
// Claude holding his closed notebook flat against his chest, a mitten on each side of it (or only the left: side 'L').
const NB_AT = [0, -470], NB_W = 300;
function bookGrip(st, o, side = 'LR') {
  const c = { ...o, lean: 0 }, [cx, cy] = [512 + NB_AT[0], 1459 + NB_AT[1]], g = { ...o, chest: { name: 'notebook', w: NB_W, x: NB_AT[0], y: NB_AT[1] }, frontL: true };
  if (side.includes('L')) Object.assign(g, st.claude.aim(c, 'L', st.claude.point(c, [cx - NB_W * .42, cy + 20])));
  if (side.includes('R')) Object.assign(g, { frontR: true }, st.claude.aim(c, 'R', st.claude.point(c, [cx + NB_W * .42, cy + 20])));
  return g;
}

// The laptop's page, as the last visit left it (the notebook's picture of ~/.cwtfigo/hosts/martin-laptop/).
const NBS = 48, RW = 31;   // the notebook's hand, bigger than the kit's 40 so it reads on a phone; the right page's wrap (26 characters a row)
const PAGE = {
  left: [{ text: 'martin-laptop', at: -9, size: 56, ink: NOTE_RED }, { gap: 10 }, { text: 'Arch Linux laptop', at: -9, size: NBS },
    { text: 'Intel Wi-Fi', at: -9, size: NBS }, { text: 'owner: Martin', at: -9, size: NBS }, { gap: 24 }, { text: 'check: Wi-Fi power save still off?', at: -9, size: NBS }],
  right: [{ date: '10-14', text: 'Wi-Fi drops', at: -9, size: NBS, wrap: RW }, { text: 'cause: power saving', at: -9, size: NBS, wrap: RW }, { text: 'fix: power save off', at: -9, size: NBS, wrap: RW }],
};
// A marker swept under line i of a notebook from t (orange, under the ink); [i, t, 'date'] marks the line's date.
const dateBox = L => [L.date.length * L.size * .8 * .45, L.y - L.size * 1.47, L.size * .68];   // width, top, height
function noteMarks(book, marks) {
  const hl = mk('g', {}, book.book); book.book.insertBefore(hl, book.ink);
  let key = '';
  return q => {
    const k = marks.map(([, t]) => span(q, t, t + .3).toFixed(2)).join();
    if (k === key) return; key = k;
    hl.innerHTML = marks.map(([i, t, date]) => {
      const L = book.laid[i], u = span(q, t, t + .3), [w, y, h] = date ? dateBox(L) : [Math.max(...L.rs.map(r => r.length)) * L.size * .43, L.y - L.size * .62, L.size * .8];
      return u ? `<rect x="${L.x - 8}" y="${y.toFixed(1)}" width="${(w * u + 16).toFixed(1)}" height="${h.toFixed(1)}" rx="6" fill="#ff9a3c" opacity=".55"/>` : '';
    }).join('');
  };
}

/* ---------- scene 1: "Again!" ---------- */
function scene1(p, D) {
  const st = garageStage(p), at = (c, t = 0) => clipAt('scene1', PRE1, c, t);
  const door = { x: PLACE.door[0] + 40, y: PLACE.door[1], s: .95 };
  const DOORSIDE = { x: 470, y: 450, z: WIDE.z };
  const shots = [{ ...shot(0, 'wide'), view: DOORSIDE }, shot(PRE1 - .1, 'single', 'martin', door), shot(at('m01', 1.85), 'close', 'martin', door)];
  st.cam.to({ z: WIDE.z * 1.1, x: 440 }, 0, PRE1 - .1);
  const S = shooter(st, shots);
  const open = cwOpener(p, 'scene1', ['SAME BUG?', 'IT REMEMBERS.'], { size: 84, slam: 1.1 });
  sfx('scene1', 0, 'rollup', .9); sfx('scene1', .02, 'rain', .35);
  stopClock(D, (q, f) => {
    const cur = S(q), roll = .22 + .78 * span(q, 0, 1.0), close = cur.kind === 'close';
    st.frame(q, f, { door: roll });
    const duck = 1 - span(q, .7, 1.3);   // ducks under the rising door, then straightens
    const up = span(q, .9, 1.1);
    const doc = docSolder(st, q, up > 0 ? { look: -.35 * up, eyeX: -up, mouth: 'O', brow: .3 } : {}, up);
    castPose(st, cur, f, {
      doc,
      martin: { ...door, ...CLUTCH, lean: 12 * duck, squash: 1 - .12 * duck, bob: cur.kind === 'wide' ? 0 : 6 * Math.abs(Math.sin(q * 7)) * (close ? 1 : .5),
        look: cur.kind === 'wide' ? .5 : 0, eyeX: cur.kind === 'wide' ? .8 : .3 * Math.sin(q * 3.1), brow: close ? 1.3 : 1, lids: 0,
        mouth: talk(q, 'scene1', PRE1, 'm01') === 'X' ? 'wobble' : talk(q, 'scene1', PRE1, 'm01'), headR: close ? 3 * Math.sin(q * 6) : 0, shut: blinkAt(q, 2) },
      claude: null,
    });
    st.fxHTML = cur.kind === 'wide' && up < .5 ? solderSmoke(...ironTip(st, doc), q) : '';
    open.draw(q);
  });
}

/* ---------- scene 2: "Ask Claude. He's got notes on you." ---------- */
function scene2(p, D, m) {
  const st = garageStage(p), at = (c, t = 0) => clipAt('scene2', PRE2, c, t);
  const notes = m('d01.notes'), wide = at('tail2'), pull = wide + .25;
  const shots = [shot(0, 'single', 'doc'), shot(wide - .05, 'wide')];
  const S = shooter(st, shots);
  sfx('scene2', pull + .1, 'whoosh', .7); sfx('scene2', pull + .45, 'flap', 1.2);
  stopClock(D, (q, f) => {
    const cur = S(q), dt = talk(q, 'scene2', PRE2, 'd01');
    st.frame(q, f, { door: 1 });
    const point = span(q, notes - .25, notes + .1) * (1 - span(q, wide - .2, wide));   // the iron points off right at Claude
    const doc = docSolder(st, q, { mouth: dt, look: .45 * point, eyeX: .9 * point, brow: -.3 * point }, point * .8);
    if (point > 0) Object.assign(doc, { armR: doc.armR + (100 - doc.armR) * point, reachR: doc.reachR + (1 - doc.reachR) * point });
    const u = span(q, pull, pull + .45);   // the notebook comes round from behind his back
    castPose(st, cur, f, {
      doc,
      martin: martinAt(q, { look: .5 * span(q, wide, wide + .3), eyeX: .9 * span(q, wide, wide + .3), mouth: 'wobble' }),
      claude: claudeAt(q, { frontL: u > .5, armL: -30 + 100 * u, reachL: .8, holdL: u > 0 ? NB : null, eyeX: -.6, look: -.2 }),
    });
    st.fxHTML = '';
  });
}

/* ---------- scene 3: the notebook, "Running your check.", the check ---------- */
// The orange pen in Claude's grey mitten, its tip at (0, 0), drawn on the page (book coordinates).
const PEN_SVG = `<path d="M120,-50 L640,430" stroke="${CW_INK}" stroke-width="60" stroke-linecap="round"/><path d="M120,-50 L640,430" stroke="#a6a9ae" stroke-width="46" stroke-linecap="round"/>
  <path d="M160,-13 L640,430" stroke="${CW_INK}" stroke-width="46" stroke-dasharray="5 34" opacity=".55"/>
  <path d="M0,0 L160,-160" stroke="${CW_INK}" stroke-width="24" stroke-linecap="round"/><path d="M20,-20 L156,-156" stroke="#ef601d" stroke-width="14" stroke-linecap="round"/>
  <circle cx="100" cy="-66" r="48" fill="#a6a9ae" stroke="${CW_INK}" stroke-width="7"/><circle cx="66" cy="-98" r="21" fill="#a6a9ae" stroke="${CW_INK}" stroke-width="7"/>`;
function scene3(p, D, m) {
  const st = garageStage(p), at = (c, t = 0) => clipAt('scene3', PRE3, c, t);
  const book = notebook(p, PAGE);
  const oct = m('c01.oct'), drops = m('c01.drops'), ps = m('c01.ps');
  const marked = [[0, at('c01')], [5, oct, 'date'], [5, drops], [6, ps]];
  const marks = noteMarks(book, marked);
  const pen = mk('g', {}, book.book); pen.innerHTML = PEN_SVG;
  // the camera on the page: in on the machine's name, across to October's lines, closer on the cause
  const keys = [[0, 200, 700, 1.6], [oct - .3, 215, 708, 1.75], [oct + .3, 740, 650, 1.3], [ps + .6, 750, 640, 1.42]];
  const view = q => { let k = keys[0]; for (let i = 1; i < keys.length; i++) { const [t0, ...a] = keys[i - 1], [t1, ...b] = keys[i]; if (q >= t0) { const u = span(q, t0, t1); k = [0, ...a.map((v, j) => v + (b[j] - v) * u)]; } } return k; };
  const T = at('tail3'), L = (t, kind, text, cps = 70) => ({ at: T + t, kind, text, cps });
  const term = bigTerm(termScreen(p, [
    L(.05, 'cmd', 'cw run martin-laptop check'),
    L(.45, 'ok', 'OK   disk / 41%, 212G free'), L(.55, 'ok', 'OK   no failed system units'), L(.65, 'ok', 'OK   running kernel is installed'),
    L(.9, 'bad', 'BAD  wifi power save on'), L(.95, 'dim', '     (off since 10-14)'),
  ], { title: 'martin@laptop: ~' }));
  const came = bigStamp(p, 'CAME BACK', '#ff3b2f');
  const shots = [shot(0, 'insert', null, { over: 'book' }), shot(at('c02', -.05), 'single', 'claude'), shot(T, 'screen', null, { over: 'term' })];
  const S = shooter(st, shots, { book: book.g, term: term.g });
  sfx('scene3', .05, 'page', .9); sfx('scene3', T + .05, 'typing', .7); [.45, .55, .65].forEach(t => sfx('scene3', T + t, 'tick', .9));
  marked.slice(1).forEach(([, t]) => sfx('scene3', t, 'tick', .6));
  sfx('scene3', T + .9, 'bang', .5); sfx('scene3', T + 1.15, 'clack', 1.3);
  stopClock(D, (q, f) => {
    const cur = S(q), ct = talk(q, 'scene3', PRE3, 'c01', 'c02');
    if (cur.over === 'book') {
      book.draw(q); marks(q);
      const [, cx, cy, z] = view(q);
      tf(book.book, `translate(${SW / 2} ${800}) scale(${z.toFixed(3)}) translate(${(-cx).toFixed(1)} ${(-cy).toFixed(1)})`);
      let li = 0, onDate; for (const [i, t, d] of marked) if (q >= t - .15) [li, onDate] = [i, d];   // the pen goes to what is being read and taps it
      const Lx = book.laid[li], w = onDate ? dateBox(Lx)[0] : Math.max(...Lx.rs.map(r => r.length)) * Lx.size * .43, tapY = 6 * Math.abs(Math.sin(q * 11));
      // under the end of the name on the left page (its mitten stays in the frame), after the line's end on the right
      tf(pen, `translate(${(Lx.x + w + (li ? 18 : -20)).toFixed(1)} ${(Lx.y + (onDate ? -Lx.size * .95 - 4 : li ? -6 : 22) - tapY).toFixed(1)})`);
    }
    if (cur.over === 'term') term.draw(q);
    vis(came, cur.over === 'term' && q >= T + 1.15);
    st.frame(q, f, { door: 1 });
    const tap = Math.abs(Math.sin(q * 9)) * span(q, at('c02', .3), at('c02', .5));
    const o = claudeAt(q, { mouth: cmouth(ct), look: .25, eyeX: .7, spin: q * 140 });
    castPose(st, cur, f, { doc: null, martin: null, claude: { ...bookGrip(st, o, 'L'), frontR: true, armR: 60 + 10 * tap, reachR: .9 } });
  });
}

/* ---------- scene 4: "Find the difference between this… and this." / "They're the same picture." ---------- */
// The two things Martin holds up, one in each mitten beside his head (source px of his puppet, kept upright): October's
// check line and today's, the same words on the same paper.
const CARD = (date, r) => ({ upright: true, x: 0, y: -215, svg: `<g transform="rotate(${r}) scale(1.25)"><rect x="-210" y="-160" width="420" height="320" rx="10" fill="#f6efdc" stroke="${CW_INK}" stroke-width="10"/>
  <text x="0" y="-70" text-anchor="middle" font-family="${HAND}" font-size="70" fill="${NOTE_RED}">${date}</text>
  <text x="0" y="20" text-anchor="middle" font-family="${MONO}" font-size="46" fill="${NOTE_INK}">wifi power</text>
  <text x="0" y="90" text-anchor="middle" font-family="${MONO}" font-size="46" fill="${NOTE_INK}">save: ON</text></g>` });
const CARD_OLD = CARD('10-14', -3), CARD_NEW = CARD('11-10', 3);
function scene4(p, D, m) {
  const st = garageStage(p), at = (c, t = 0) => clipAt('scene4', PRE4, c, t);
  const MEME = { x: PLACE.martin[0], y: 668, z: 2.05 };   // his face between the two things he holds up
  const shots = [{ ...shot(0, 'single', 'martin'), view: MEME }, shot(at('c03', -.05), 'single', 'claude')];
  const S = shooter(st, shots);
  const t1 = m('m02.this1'), t2 = m('m02.this2');
  sfx('scene4', t1 - .05, 'flap', 1); sfx('scene4', t2 - .05, 'flap', 1);
  stopClock(D, (q, f) => {
    const cur = S(q), mt = talk(q, 'scene4', PRE4, 'm02'), ct = talk(q, 'scene4', PRE4, 'c03');
    st.frame(q, f, { door: 1 });
    const a = span(q, t1 - .25, t1) - .6 * span(q, t2 - .25, t2), b = span(q, t2 - .25, t2);   // each card up on its "this"
    const shake = (t) => q > t && q < t + .35 ? 5 * Math.sin(q * 40) : 0;
    const tb = at('tail4') + .1, o = claudeAt(q, { mouth: cmouth(ct), lids: .62 + .38 * Math.sin(Math.PI * span(q, tb - .22, tb + .22)), spin: 0, eyeX: 0, brow: 0, shut: false });
    castPose(st, cur, f, {
      doc: null,
      martin: { x: PLACE.martin[0], y: PLACE.martin[1], mouth: mt === 'X' ? 'flat' : mt, brow: .5, lids: .1, look: -.3 * a + .3 * b, eyeX: -.9 * a + .9 * b,
        armL: 66 + 24 * a + shake(t1), reachL: .92, holdL: CARD_OLD, armR: 66 + 24 * b + shake(t2), reachR: .92, hold: CARD_NEW, frontL: true, frontR: true, shut: blinkAt(q, 4) },
      claude: bookGrip(st, o),
    });
  });
}

/* ---------- scene 5: "The reboot switched it back on. This time I'll make it stick." / "Yes!" / the fix /
   "Noted. The second time costs less." ---------- */
function scene5(p, D, m) {
  const st = garageStage(p), at = (c, t = 0) => clipAt('scene5', PRE5, c, t);
  const snap = m('c04.stick') + .1, T = at('tail5'), wide = T + 1.8, note = m('c05.second') - .05;
  const L = (t, kind, text, cps = 80) => ({ at: T + t, kind, text, cps });
  const term = termScreen(p, [
    L(.02, 'cmd', 'cw run martin-laptop wifi --apply', 140),
    L(.3, 'ok', 'OK   wifi power save off'),
    L(.4, 'cmd', 'cw run martin-laptop check', 140),
    L(.62, 'ok', 'OK   disk / 41%, 212G free'), L(.67, 'ok', 'OK   no failed system units'), L(.72, 'ok', 'OK   running kernel is installed'),
    L(.82, 'ok', 'OK   wifi power save off'),
  ], { title: 'martin@laptop: ~' }); bigTerm(term);
  const fixed = bigStamp(p, 'FIXED', '#3cff5a');
  const shots = [shot(0, 'single', 'claude'), { ...shot(snap - .08, 'single', 'claude'), view: { x: PLACE.claude[0] + 68, y: 550, z: 2.1 } }, shot(at('m03', -.05), 'single', 'martin'), shot(T, 'screen', null, { over: 'term' }), shot(wide, 'wide'),
    shot(note, 'insert', null, { over: 'book' })];
  // today's line, written under October's while he says it
  const book = notebook(p, { left: PAGE.left, right: [...PAGE.right, { gap: 40 },
    { date: '11-10', text: 'came back after reboot. made it stick. check watches it.', at: note + .1, cps: 32, ink: NOTE_RED, size: NBS, wrap: RW }] });
  const S = shooter(st, shots, { term: term.g, book: book.g });
  sfx('scene5', note, 'page', .7);
  sfx('scene5', snap - .05, 'whoosh', 1); sfx('scene5', snap + .1, 'flap', 1.4);
  sfx('scene5', T + .03, 'typing', .7); sfx('scene5', T + .4, 'typing', .5); sfx('scene5', T + .84, 'chime', 1.1); sfx('scene5', T + .92, 'clack', 1);
  const wifi = stamp(p, '');   // the Wi-Fi fan over Martin's laptop in the wide, green: online again
  stopClock(D, (q, f) => {
    const cur = S(q), ct = talk(q, 'scene5', PRE5, 'c04', 'c05'), mt = talk(q, 'scene5', PRE5, 'm03');
    if (cur.over === 'term') term.draw(q);
    if (cur.over === 'book') { book.draw(q); const u = span(q, note, D - .2); tf(book.book, `translate(${SW / 2} 800) scale(${(1.38 + .12 * u).toFixed(3)}) translate(${(-748 + 10 * u).toFixed(1)} ${(-690 - 5 * u).toFixed(1)})`); }
    vis(fixed, cur.over === 'term' && q >= T + .92);
    st.frame(q, f, { door: 1 });
    const up = span(q, snap, snap + .1), nod = q > at('m03') ? 8 * Math.abs(Math.sin((q - at('m03')) * 14)) * (1 - span(q, at('m03', .6), at('m03', .8))) : 0;
    const hug = span(q, wide, wide + .3);
    castPose(st, cur, f, {
      doc: docSolder(st, q, {}, 0),
      martin: martinAt(q, { mouth: cur.kind === 'wide' ? 'grin' : mt === 'X' ? 'grin' : mt, brow: cur.kind === 'wide' ? -.2 : .6, headY: nod, bliss: hug > .5,
        armL: -18 - 20 * hug, armR: -18 - 20 * hug, bob: 6 * hug * Math.abs(Math.sin(q * 6)) }),
      claude: cur.kind === 'wide' ? claudeAt(q, { mouth: cmouth(ct), frontL: true, armL: 70, reachL: .8, holdL: NB, lids: .45 })
        : { ...bookGrip(st, claudeAt(q, { mouth: cmouth(ct), brow: .4, lids: .45 }), 'L'), armR: 20 + 130 * up, reachR: .95, hold: up > 0 ? SIGN('Can I change\nthis? [y/n]', 66, 540) : null },
    });
    if (cur.kind === 'wide') {
      const [x, y] = [PLACE.martin[0], 690], k = WIDE.z, u = span(q, wide + .1, wide + .4), s = (.6 + .4 * u).toFixed(2);
      const sx = (x - WIDE.x) * k + SW / 2, sy = (y - WIDE.y) * k + SH / 2;
      wifi.innerHTML = u ? `<g transform="translate(${sx.toFixed(0)} ${sy.toFixed(0)}) scale(${s})" fill="none" stroke="#3cff5a" stroke-width="12" stroke-linecap="round">
        <path d="M-60,-10 A85,85 0 0 1 60,-10"/><path d="M-38,14 A54,54 0 0 1 38,14"/><path d="M-16,36 A22,22 0 0 1 16,36"/><circle cy="54" r="7" fill="#3cff5a" stroke="none"/></g>` : '';
    }
    vis(wifi, cur.kind === 'wide');
  });
}

/* ---------- scene 7: "Got notes on me too?" / "On your toaster. Eleven pages." ---------- */
const TOASTER = { upright: true, x: 60, y: -250, svg: `<g transform="rotate(-3)"><rect x="-250" y="-330" width="500" height="660" rx="12" fill="#f6efdc" stroke="${CW_INK}" stroke-width="12"/>
  <rect x="-250" y="-330" width="500" height="60" fill="#ef601d" stroke="${CW_INK}" stroke-width="12"/>
  <text x="-215" y="-200" font-family="${HAND}" font-size="62" fill="${NOTE_RED}">doc-toaster</text>
  ${Array.from({ length: 9 }, (_, i) => `<path d="M-215,${-130 + i * 48} H${120 + 80 * Math.sin(i * 2.3)}" stroke="${NOTE_INK}" stroke-width="10" stroke-linecap="round"/>`).join('')}
  <text x="150" y="290" font-family="${HAND}" font-size="44" fill="${NOTE_INK}">p. 11</text></g>` };
function scene7(p, D, m) {
  const st = garageStage(p), at = (c, t = 0) => clipAt('scene7', PRE7, c, t);
  const flip = at('c06', -.1), fall = at('tail7') + .1;
  const shots = [shot(0, 'wide'), shot(at('d02', .5), 'single', 'doc'), { ...shot(at('c06', -.05), 'single', 'claude'), view: { x: PLACE.claude[0] - 58, y: 548, z: 2.12 } },
    { ...shot(fall, 'close', 'doc') }];
  const S = shooter(st, shots);
  sfx('scene7', flip + .05, 'flap', 1.2);
  stopClock(D, (q, f) => {
    const cur = S(q), dt = talk(q, 'scene7', PRE7, 'd02'), ct = talk(q, 'scene7', PRE7, 'c06');
    st.frame(q, f, { door: 1 });
    const lean = span(q, 0, .4), sad = span(q, fall, fall + .3);
    const doc = sad > 0 ? docSolder(st, q, { mouth: q < fall + .35 ? 'O' : 'frown', lids: 0, brow: 1.4 * sad, look: 0, eyeX: 0, eyeY: -.3, headY: 24 * sad, headR: -4 * sad, armR: 10, reachR: .9, hold: null }, 1)
      : docSolder(st, q, { mouth: dt, look: .5 * lean, eyeX: 1, lids: .35, brow: -.6, lean: 6 * lean }, lean);
    const u = span(q, flip, flip + .25);
    castPose(st, cur, f, {
      doc,
      martin: martinAt(q, { mouth: 'smile', brow: 0, look: -.3, eyeX: -.8 }),
      claude: u > .5 ? claudeAt(q, { mouth: cmouth(ct), cigar: true, lids: .5, brow: .3, frontL: true, armL: 110, reachL: .8, holdL: TOASTER, look: -.15 }) : cur.kind === 'wide' ? claudeAt(q, { frontL: true, armL: 70, reachL: .8, holdL: NB }) : bookGrip(st, claudeAt(q, { mouth: cmouth(ct), lids: .5, brow: .3 })),
    });
    st.fxHTML = '';
  });
}

/* ---------- end: "Two lines to install. I'll remember the rest." ---------- */
function endScene(p, D) { const e = cwEnd(p); stopClock(D, (q, f) => e.draw(q, f, { mouth: talk(q, 'end', PRE_E, 'c07') })); }
