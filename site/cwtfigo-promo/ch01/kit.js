/* kit.js — what every scene of the CWTFIGO promo shares: the garage stage with its three puppets and their places, the
   singles (a frontal talking head of whoever speaks), the terminal that fills the frame, the comic panels that pop in
   over it, the notebook insert and the end card. The owner's camera rule: a line is a frontal single, an event is the
   wide stage, a screen is the whole frame. */
'use strict';
const DESK = 486;   // the desk top in the garage plate
// Where everyone stands on the stage. Claude is as tall as Doc once he is out (s CLAUDE_S); the laptop sits on the
// stool in the middle, the router on the top shelf at the right, and a cable runs from the router to the laptop.
const CLAUDE_S = 1.9;
const PLACE = { doc: [430, 836], martin: [630, 846], claude: [1050, 846], laptop: [843, 577], door: [150, 770],
  shelf: [1440, 846], port: [930, 548], routerPort: [1530, 220] };
const LEDS = [1442.5, 1454, 1467.5, 1481.5, 1494, 1508.5];   // the router's lights on the shelf, y 213.7
const BULB = [903, 109];
const MONO = 'CW Mono, Menlo, Consolas, monospace', MARKER = 'CW Marker, Comic Sans MS, sans-serif';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ---------- the stage ---------- */
// The garage with the cast in their places. Returns the camera, the puppets, the laptop and helpers; the scene poses
// them every frame (stopClock) and calls stage.frame(q, f, extra) for the set's own life (rain, bulb, router, door).
function garageStage(p, { door = 0 } = {}) {
  const cam = paperCam(p, 'garage');
  const rain = mk('g', {}, cam.stage);   // outside the doorway, behind whoever stands there
  rain.innerHTML = Array.from({ length: 46 }, (_, i) => {
    const x = (i * 53.7) % 250, y = (i * 97.3) % 600;
    return `<path d="M${x.toFixed(0)},${(165 + y).toFixed(0)} l-7,34" stroke="#9fb6d8" stroke-width="2.4" opacity=".55"/>`;
  }).join('');
  const glow = mk('ellipse', { rx: 260, ry: 220, fill: 'url(#cwBulb)', opacity: .5 }, cam.stage);
  const leds = mk('g', {}, cam.stage), cable = mk('g', {}, cam.stage), laptop = mk('g', {}, cam.stage);
  const doc = docPuppet(cam.stage), martin = martinPuppet(cam.stage), claude = claudePuppet(cam.stage);
  const fx = mk('g', {}, cam.stage);
  let cableKey = '';
  let lapKey = '', ledKey = '', lapScr = '';
  const stage = { cam, doc, martin, claude, laptop, fx, cable,
    // q: time; door: 0 shut … 1 rolled up; bang: door shudder; ledsOk: router lights all green; lap: { open, screen } or null
    frame(q, f, { door = 0, bang = 0, ledsOk = false, lap = null, camQ = q, plug = null, flicker = false } = {}) {
      const top = 160;   // the door's roll is set before the camera draws, so the first frame of a rebuilt beat is right
      cam.move('door', () => `translate(${(bang * 5 * jit(f, 7)).toFixed(1)} 0) translate(0 ${top}) scale(1 ${Math.max(.001, 1 - door).toFixed(3)}) translate(0 ${-top})`);
      cam.apply(q, f, camQ);
      tf(rain, `translate(${(-7 * ((f % 4) / 4)).toFixed(1)} ${(34 * ((f % 4) / 4)).toFixed(1)})`);
      const sw = Math.sin(q * 1.6) * 18;
      tf(glow, `translate(${(BULB[0] + sw).toFixed(1)} ${BULB[1] + 60})`);
      const lk = ledsOk ? 'ok' : flicker ? `bad${Math.floor(q * 12) % 2}` : `bad${Math.floor(q * 3) % 2}`;
      const ck = JSON.stringify(plug);   // the cable only once the laptop sits on the stool
      if (ck !== cableKey) { cableKey = ck; cable.innerHTML = plug ? cableSVG(plug.at || PLACE.port, plug.lit) : ''; }
      if (lk !== ledKey) {
        ledKey = lk;
        leds.innerHTML = LEDS.map((x, i) => {
          const c = ledsOk ? '#3cff5a' : i < 2 ? '#3cff5a' : (i % 2 === (lk === 'bad0' ? 0 : 1) ? '#ff3b2f' : '#4a1410');
          return `<circle cx="${x}" cy="213.7" r="4.6" fill="${c}"/>${c === '#4a1410' ? '' : `<circle cx="${x}" cy="213.7" r="9" fill="${c}" opacity=".3"/>`}`;
        }).join('');
      }
      const k = JSON.stringify(lap && { ...lap, screen: null });   // the picture is rebuilt only when it moves or opens,
      if (k !== lapKey) { lapKey = k; laptop.innerHTML = lap ? laptopSVG(lap) : ''; lapScr = ''; }   // the screen on its own
      const sk = lap ? JSON.stringify(lap.screen) : '';
      if (lap && lap.open !== false && sk !== lapScr) { lapScr = sk; const s = laptop.querySelector('.scr'); if (s) s.innerHTML = lapScreen(lap); }
    },
  };
  // st.fxHTML = '…': the frame's effects (sparks, smoke, puffs), written only when they change
  let fxKey = null;
  Object.defineProperty(stage, 'fxHTML', { set(h) { if (h !== fxKey) { fxKey = h; fx.innerHTML = h; } } });
  return stage;
}
document.body.insertAdjacentHTML('afterbegin', `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  <radialGradient id="cwBulb"><stop offset="0" stop-color="#ffe9a8" stop-opacity=".55"/><stop offset="1" stop-color="#ffe9a8" stop-opacity="0"/></radialGradient>
  <pattern id="cwDots" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="9" cy="9" r="4" fill="#000" opacity=".16"/></pattern>
  <radialGradient id="cwGlow"><stop offset="0" stop-color="#9fd0ff" stop-opacity=".5"/><stop offset="1" stop-color="#9fd0ff" stop-opacity="0"/></radialGradient>
</defs></svg>`);

// The laptop on the desk (world coordinates), open or shut; `screen` is 'term', 'desk' (Martin's loud desktop) or 'off'.
function laptopSVG({ x = PLACE.laptop[0], y = PLACE.laptop[1], w = 190, open = true, screen = 'term', shown = 1 }) {
  if (!open) return `<g transform="translate(${x} ${y})"><image href="../img/props/laptop.webp" x="${-w / 2}" y="${-w * 197 / 348 * .25}" width="${w}" height="${(w * 197 / 348 * .25).toFixed(1)}" preserveAspectRatio="none"/></g>`;
  const h = w * 249 / 415;
  return `<g transform="translate(${x} ${y - h / 2}) scale(${shown})"><image href="../img/props/laptop-open.webp" x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h.toFixed(1)}"/><g class="scr"></g></g>`;
}
function lapScreen({ w = 190, screen = 'term' }) { const sx = w / 415; return screenSVG(screen, sx, -33.5 * sx, 303 * sx, 144 * sx); }
// What a laptop screen of w × h centred at (cx, cy) shows.
function screenSVG(kind, cx, cy, w, h) {
  const x = cx - w / 2, y = cy - h / 2;
  if (kind === 'term' || typeof kind === 'number') return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#0d1014"/>` +
    Array.from({ length: typeof kind === 'number' ? Math.min(9, kind) : 3 }, (_, i) => i).map(i => `<rect x="${x + 6}" y="${y + 6 + i * 9.5}" width="${(w * (.25 + .45 * ((i * 7) % 5) / 5)).toFixed(1)}" height="5" fill="${i % 3 ? '#aab2bf' : '#7ee08a'}" opacity=".85"/>`).join('');
  if (kind === 'desk') return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#1b1030"/>` +
    [['#ff4fb4', 0, 0, .55, .62], ['#3fe0ff', .57, 0, .43, .3], ['#ffd23f', .57, .32, .43, .3], ['#8b5bff', 0, .64, 1, .36]]
      .map(([c, a, b, ww, hh]) => `<rect x="${(x + 3 + a * (w - 6)).toFixed(1)}" y="${(y + 3 + b * (h - 6)).toFixed(1)}" width="${(ww * (w - 6) - 3).toFixed(1)}" height="${(hh * (h - 6) - 3).toFixed(1)}" rx="3" fill="${c}"/>`).join('');
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#08090b"/>`;
}

// Solder sparks at (x, y): a few short yellow strokes that change every frame (on twos).
function sparks(x, y, f, on = true) {
  if (!on) return '';
  return Array.from({ length: 5 }, (_, i) => { const a = (jit(Math.floor(f / 2), 40 + i) * .5 - .5) * Math.PI, r = 14 + 22 * Math.abs(jit(Math.floor(f / 2), 50 + i));
    return `<path d="M${x},${y} l${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}" stroke="${i % 2 ? '#fff6b0' : '#ffc23a'}" stroke-width="3.5" stroke-linecap="round"/>`; }).join('');
}

/* ---------- singles ---------- */
// The frontal single of a character at its place: the head and chest fill the frame, the garage soft behind.
// close: true is the punch-in. Pass the puppet's own pose x, y, s if it stands elsewhere (Martin in the doorway).
function singleView(who, { x, y, s = who === 'claude' ? .9 : 1, close = false } = {}) {
  const [px, py] = [x ?? PLACE[who][0], y ?? PLACE[who][1]], sp = CW[who], k = sp.K * s;
  const top = py - (sp.feet[1] - (sp.head ? sp.head[1] : sp.body[1] - 40)) * k;   // the hair (Claude: the ✻) on top
  const chest = py - (sp.feet[1] - (who === 'claude' ? 1000 : 960)) * k;
  const span = (chest - top) * (close ? .78 : 1.18), z = 900 / span;
  const cy = close ? top + span * .62 : top - span * .06 + span / 2;   // a close crops the hair, not the chin (captions sit low)
  return { x: Math.min(1660 - 800 / z, Math.max(-60 + 800 / z, px)), y: cy, z };
}

/* ---------- the terminal that fills the frame ---------- */
// lines: [{ at, text, kind: 'cmd' | 'out' | 'ok' | 'bad' | 'dim', cps }]: a command types at cps characters a
// second from `at`; output lines appear whole at `at`. The newest line stays above the bottom margin.
function termScreen(p, lines, { yolo = false, title = 'martin@omarchy: ~', rows = 16 } = {}) {
  const g = mk('g', {}, p);
  mk('rect', { width: 1600, height: 900, fill: '#0d1014' }, g);
  const bar = mk('g', {}, g);
  bar.innerHTML = `<rect width="1600" height="54" fill="#1c2027"/><circle cx="34" cy="27" r="9" fill="#ff5f57"/><circle cx="62" cy="27" r="9" fill="#febc2e"/><circle cx="90" cy="27" r="9" fill="#28c840"/>
    <text x="800" y="36" text-anchor="middle" font-family="${MONO}" font-size="22" fill="#8b93a1">${esc(title)}</text>`;
  const badge = mk('g', { visibility: yolo ? 'inherit' : 'hidden' }, g);   // 'visible' would show through a hidden screen
  badge.innerHTML = `<rect x="1340" y="80" width="214" height="56" rx="10" fill="#d8262b"/><text x="1447" y="119" text-anchor="middle" font-family="${MONO}" font-weight="800" font-size="30" fill="#fff">YOLO 12h</text>`;
  const body = mk('g', {}, g), LH = 46, TOP = 112, ROWS = rows, WRAP = 76;
  const col = { cmd: '#e8eaed', out: '#aab2bf', ok: '#5df07a', bad: '#ff6b5e', dim: '#5f6773' };
  let key = '';
  return { g, draw(q) {
    const shown = [];
    for (const L of lines) {
      if (q < L.at) break;
      let t = L.text;
      if (L.kind === 'cmd') { const n = Math.floor((q - L.at) * (L.cps || 40)); t = L.text.slice(0, n); }
      for (let i = 0; i < t.length || i === 0; i += WRAP) shown.push([L, (i ? '  ' : '') + t.slice(i, i + WRAP)]);   // a terminal wraps
    }
    const last = shown[shown.length - 1], typing = last && last[0].kind === 'cmd' && last[1].length < last[0].text.length;
    const cursor = Math.floor(q * 2.5) % 2 === 0 || typing;
    const k = shown.map(s => s[1]).join('\n') + (cursor ? '_' : '');
    if (k === key) return; key = k;
    const view = shown.slice(-ROWS);
    body.innerHTML = view.map(([L, t], i) => {
      const y = TOP + i * LH + 34, kind = L.kind || 'out', end = i === view.length - 1;
      const pre = kind === 'cmd' ? `<tspan fill="#5df07a">$ </tspan>` : '';
      return `<text x="64" y="${y}" font-family="${MONO}" font-size="31" fill="${col[kind]}" xml:space="preserve">${pre}${esc(t)}${end && cursor ? '<tspan fill="#e8eaed">▌</tspan>' : ''}</text>`;
    }).join('');
  } };
}

/* ---------- comic panels over the screen ---------- */
// A tilted comic panel of one character's head and shoulders that slams in from its side with a speech balloon.
// draw(q, { in: t0, out: t1, pose, text }) poses it; side 'L' (Claude) or 'R' (Martin).
function comicPanel(p, who, side) {
  const g = mk('g', {}, p), W = 520, H = 470, L = side === 'L';
  const x0 = L ? 40 : 1600 - 40 - W, y0 = 900 - H + 70, tilt = L ? -3.5 : 3;
  const id = `cwClip${who}${side}${Math.random().toString(36).slice(2, 6)}`;
  const inner = mk('g', {}, g);
  inner.innerHTML = `<clipPath id="${id}"><rect x="${x0}" y="${y0}" width="${W}" height="${H}"/></clipPath>
    <rect x="${x0 - 10}" y="${y0 - 10}" width="${W + 20}" height="${H + 20}" fill="#fff"/>
    <rect x="${x0}" y="${y0}" width="${W}" height="${H}" fill="${L ? '#f58a3c' : '#5b8fe0'}"/>
    <rect x="${x0}" y="${y0}" width="${W}" height="${H}" fill="url(#cwDots)"/>
    ${Array.from({ length: 14 }, (_, i) => { const a = i / 14 * Math.PI * 2, cx = x0 + W / 2, cy = y0 + H * .45;
      return `<path d="M${cx + Math.cos(a) * 140},${cy + Math.sin(a) * 140} L${cx + Math.cos(a) * 520},${cy + Math.sin(a) * 520}" stroke="#fff" stroke-width="10" opacity=".35"/>`; }).join('')}`;
  const pupG = mk('g', {}, inner);   // no clip: the panel runs off the bottom of the frame and the figure fits its width
  const pup = cwPuppet(pupG, who);
  const frame = mk('rect', { x: x0, y: y0, width: W, height: H, fill: 'none', stroke: CW_INK, 'stroke-width': 9 }, inner);
  const balloon = mk('g', {}, g);
  let bKey = '';
  // where the puppet stands so its head and shoulders fill the panel
  const sp = CW[who], s = who === 'claude' ? 3.5 : 1.55, k = sp.K * s;
  const headTop = (sp.feet[1] - (sp.head ? sp.head[1] : sp.body[1])) * k;
  const px = x0 + W / 2, py = y0 + (who === 'claude' ? 30 : 40) + headTop;
  return { g, draw(q, f, { at = 0, out = 99, pose = {}, text = '', size = 46 }) {
    const u = Math.min(1, Math.max(0, (q - at) / .25)), v = Math.min(1, Math.max(0, (q - out) / .2));
    const on = q >= at && v < 1;
    vis(g, on);   // cached: setting the same attribute every frame costs a repaint in Firefox
    if (!on) return;
    const over = u < 1 ? 1 + .12 * Math.sin(u * Math.PI) : 1;   // slam with a little overshoot
    const dx = (L ? -1 : 1) * ((1 - ease(u)) * 700 + ease(v) * 700);
    tf(g, `translate(${dx.toFixed(1)} 0) rotate(${tilt} ${x0 + W / 2} ${y0 + H / 2}) translate(${x0 + W / 2} ${y0 + H / 2}) scale(${over.toFixed(3)}) translate(${-(x0 + W / 2)} ${-(y0 + H / 2)})`);
    pup.pose({ x: px, y: py, s, ...pose }, 0);   // f = 0: no jitter, so the clipped panel redraws only when the face changes
    const bk = text + (q - at > .12);
    if (bk !== bKey) {
      bKey = bk;
      if (!text || q - at <= .12) { balloon.innerHTML = ''; return; }
      const bw = Math.max(220, text.length * size * .52 + 80), bh = size * 1.9;
      const bx = L ? x0 + W - 30 : x0 + 30 - bw, by = y0 + (L ? 10 : 120);   // beside the panel, towards the middle
      const tx = L ? x0 + W - 60 : x0 + 60;
      balloon.innerHTML = `<path d="M${bx + (L ? 30 : bw - 30)},${by + bh - 14} L${tx},${by + bh + 60} L${bx + (L ? 80 : bw - 80)},${by + bh - 6} Z" fill="#fff" stroke="${CW_INK}" stroke-width="7" stroke-linejoin="round"/>
        <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="${bh / 2}" fill="#fff" stroke="${CW_INK}" stroke-width="7"/>
        <path d="M${bx + (L ? 34 : bw - 34)},${by + bh - 8} L${bx + (L ? 76 : bw - 76)},${by + bh - 8}" stroke="#fff" stroke-width="9"/>
        <text x="${bx + bw / 2}" y="${by + bh / 2 + size * .36}" text-anchor="middle" font-family="${MARKER}" font-size="${size}" fill="${CW_INK}">${esc(text)}</text>`;
    }
  } };
}

/* ---------- the notebook insert ---------- */
// Claude's orange notebook filling the frame: the left page is earlier visits, "omarchy update" again and again, the
// dates closer and closer; the right page gets today's line, written in as `write` goes 0 … 1.
const NOTES_OLD = ['08-14', '09-02', '09-20', '10-05', '10-17', '10-26', '11-01', '11-04', '11-06', '11-07'];
const NOTE_NEW = ['11-08', 'martin-laptop: omarchy update, networkd → NetworkManager, configs in .bak'];
const HAND = 'CW Hand, Comic Sans MS, sans-serif';
function notebook(p) {
  const g = mk('g', {}, p);
  mk('rect', { width: 1600, height: 900, fill: '#3a2618' }, g);
  const book = mk('g', {}, g), ink = mk('g', {}, book);
  book.innerHTML = `<image href="../img/props/notebook-open.webp" x="-80" y="-60" width="1760" height="${(1760 * 220 / 352).toFixed(0)}"/>`;
  book.appendChild(ink);
  const old = NOTES_OLD.map((d, i) => `<text x="110" y="${110 + i * 86}" font-family="${HAND}" font-size="46" fill="#22306a"><tspan fill="#b04020">${d}</tspan>   martin-laptop: omarchy update</text>`).join('');
  let key = '';
  return { g, book, draw(q, { write = 1 } = {}) {
    const n = Math.floor(NOTE_NEW[1].length * Math.min(1, Math.max(0, write)));
    if (String(n) === key) return; key = String(n);
    const wrap = []; let cur = '';
    for (const w of NOTE_NEW[1].slice(0, n).split(' ')) { if ((cur + ' ' + w).length > 24) { wrap.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w; }
    wrap.push(cur);
    ink.innerHTML = old + `<text x="880" y="140" font-family="${HAND}" font-size="58" fill="#b04020">${NOTE_NEW[0]}</text>` +
      wrap.map((l, i) => `<text x="880" y="${230 + i * 92}" font-family="${HAND}" font-size="66" fill="#1f2a55">${esc(l)}</text>`).join('');
  } };
}

/* ---------- the end card ---------- */
function cwEndCard(p) {
  const g = mk('g', {}, p);
  mk('rect', { width: 1600, height: 900, fill: '#16130f' }, g);
  mk('rect', { width: 1600, height: 900, fill: 'url(#cwDots)', opacity: .5 }, g);
  const pup = claudePuppet(g);
  const txt = mk('g', {}, g);
  txt.innerHTML = `<text x="1040" y="250" text-anchor="middle" font-family="${MARKER}" font-size="128" fill="#ef601d">CWTFIGO</text>
    <text x="1040" y="350" text-anchor="middle" font-family="${MARKER}" font-size="46" fill="#f4ede0">Claude, what the fuck is going on?</text>
    <rect x="690" y="430" width="700" height="96" rx="16" fill="#0d1014" stroke="#3a3f48" stroke-width="3"/>
    <text x="1040" y="492" text-anchor="middle" font-family="${MONO}" font-size="36" fill="#e8eaed"><tspan fill="#5df07a">&gt; </tspan>/plugin install cwtfigo@cwtfigo</text>
    <text x="1040" y="600" text-anchor="middle" font-family="${MONO}" font-size="26" fill="#9aa2ad">an ops plugin for Claude Code</text>
    <text x="1040" y="840" text-anchor="middle" font-family="${MONO}" font-size="20" fill="#6c7380">Not affiliated with Anthropic</text>`;
  return { g, draw(q, f) {
    pup.pose({ x: 380, y: 820, s: 3.1, holdL: { name: 'cigar', w: 230, x: -30, y: 10, r: -10 }, armL: 70, lids: .42,
      mouth: 0, spin: q * 60, bob: 4 * Math.sin(q * 2), shut: blinking(q, [1.4, 3.6]) }, f);
  } };
}

/* ---------- shots ---------- */
// A shot: { t, kind: 'wide' | 'single' | 'close' | 'screen' | 'insert' | 'black', who, over } (over names the overlay a
// screen or insert shows). The camera cuts at each shot's t; singles and closes blur the set behind the speaker.
const WIDE = { x: 800, y: 450, z: 1 };
const shot = (t, kind, who = null, opts = {}) => ({ t, kind, who, over: opts.over || null,
  view: kind === 'wide' ? (opts.view || WIDE) : kind === 'single' || kind === 'close' ? singleView(who, { close: kind === 'close', s: who === 'claude' ? CLAUDE_S : 1, ...opts }) : null });
function shooter(st, shots, overlays = {}) {
  for (const s of shots) if (s.view) { st.cam.cut(s.view, s.t); st.cam.soft(s.t, s.kind === 'wide' ? false : 'all'); }
  let lastOver;   // undefined: the first frame sets every overlay's visibility
  return q => {
    let cur = shots[0]; for (const s of shots) if (q >= s.t) cur = s;
    const over = cur.kind === 'screen' || cur.kind === 'insert' || cur.kind === 'black' ? cur.over || cur.kind : null;
    if (over !== lastOver) { lastOver = over; for (const [k, g] of Object.entries(overlays)) vis(g, k === over); }
    return cur;
  };
}
// Pose the cast for this frame: in a single only its speaker shows; P.name null leaves that puppet off stage.
function castPose(st, cur, f, P) {
  for (const n of ['doc', 'martin', 'claude']) {
    const o = P[n], on = o && (cur.kind === 'wide' || cur.who === n);
    st[n].pose(on ? o : { ...(o || {}), o: 0 }, f);
  }
}
const blinkAt = (q, seed) => { const per = 2.6 + (seed % 3) * .7, u = (q + seed * .37) % per; return u < 2 / FPS; };
const talk = (q, scene, pre, ...clips) => lips(q, scene, pre, ...clips);
// A black frame (the cut before the end card) and the laptop's own screen filling the frame.
function blackOverlay(p) { const g = mk('g', {}, p); mk('rect', { width: 1600, height: 900, fill: '#000' }, g); return g; }
function percolating(p) {
  const g = mk('g', {}, p);
  mk('rect', { width: 1600, height: 900, fill: '#0d1014' }, g);
  const star = mk('g', {}, g), txt = mk('g', {}, g);
  star.innerHTML = [0, 60, 120].map(a => `<rect x="-9" y="-46" width="18" height="92" rx="3" transform="rotate(${a})" fill="#e8582a"/>`).join('');
  txt.innerHTML = `<text x="700" y="478" font-family="${MONO}" font-size="64" fill="#e8582a">Percolating…</text>`;
  return { g, draw(q) { tf(star, `translate(630 456) rotate(${(q * 360) % 360}) scale(${1 + .15 * Math.sin(q * 12)})`); txt.setAttribute('opacity', (.55 + .45 * Math.sin(q * 9)).toFixed(2)); } };
}
// A stamp in screen space beside a single: a code flag or a tick that pops in.
function stamp(p, html) { const g = mk('g', { visibility: 'hidden' }, p); g.innerHTML = html; return g; }
// The cable from the router down the shelf post and across the floor to the laptop's port; `plug` is where its end is.
function cableSVG([px, py], lit = false) {
  const [rx, ry] = PLACE.routerPort;
  return `<path d="M${rx},${ry} C${rx + 20},${ry + 60} 1398,300 1398,520 S1300,760 1150,770 S${px + 60},${py + 140} ${px},${py}" fill="none" stroke="#2b5fb3" stroke-width="7" stroke-linecap="round"/>
    <rect x="${px - 9}" y="${py - 9}" width="20" height="18" rx="3" fill="#cfd6e0" stroke="${CW_INK}" stroke-width="3"/>${lit ? `<circle cx="${PLACE.port[0] - 22}" cy="${PLACE.port[1] - 2}" r="4" fill="#3cff5a"/>` : ''}`;
}

// Cigar smoke: grey puffs rising and fading from (x, y), drawn into a string for st.fx (world coordinates).
function smokeSVG(x, y, q, n = 4, scale = 1) {
  return Array.from({ length: n }, (_, i) => {
    const u = ((q / 2.4 + i / n) % 1 + 1) % 1, r = (6 + 16 * u) * scale;
    return `<circle cx="${(x + 18 * u * scale + 6 * Math.sin(u * 7 + i)).toFixed(1)}" cy="${(y - 90 * u * scale).toFixed(1)}" r="${r.toFixed(1)}" fill="#cfcac0" opacity="${(Math.min(1, u * 6) * (1 - u) * .7).toFixed(2)}"/>`;
  }).join('');
}
// The cigar's ember for Claude's pose o (it sits at the right corner of his teeth).
const emberAt = (st, o) => st.claude.point(o, [556 + 107 - 20 + 226 * Math.cos(.21), 640 - 8 + 226 * Math.sin(.21)]);

/* ---------- music slots ----------
   The coordinator makes the guitar opener and the stings (our own chords, synthesized). Until the files are in, the
   slots stay empty: name a file here (in audio/bgm/ for the opener, audio/sfx/ for the stings, without .mp3) and it
   plays: the opener under scene 1, a sting on every cut into a new scene, the uh-oh on rm -rf (scene 5). */
window.CW_MUSIC = window.CW_MUSIC || { opener: null, sting: null, uhoh: null };
const stingAt = (scene, t = 0, which = 'sting', vol = 1.2) => { if (CW_MUSIC[which]) sfx(scene, t, CW_MUSIC[which], vol); };
