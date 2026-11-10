/* kit.js — what every scene of the CWTFIGO promo shares: the garage stage with its three puppets and their places, the
   singles (a frontal talking head of whoever speaks), the terminal that fills the frame, the comic panels that pop in
   over it, the notebook insert and the end card. The owner's camera rule: a line is a frontal single, an event is the
   wide stage, a screen is the whole frame. */
'use strict';
// ?frame=45: the 4:5 cut for X. Everything that matters stays inside the centre 720 × 900 window of the stage
// (x 440 … 1160); export.py --query frame=45 --height 1350 and a centre crop of 1080 × 1350 make the video
// (books/cwtfigo-promo/recut-45.md). Without the query the film is the 16:9 cut as approved.
const F45 = new URLSearchParams(location.search).get('frame') === '45';
if (F45) document.documentElement.classList.add('f45');
const X45 = 440, W45W = 720;   // the 4:5 window on the stage
const DESK = 486;   // the desk top in the garage plate
// Where everyone stands on the stage. Claude is as tall as Doc once he is out (s CLAUDE_S); the laptop sits on the
// stool in the middle, the router on the top shelf at the right, and a cable runs from the router to the laptop.
// Doc sits at his own solder bench downstage left (his feet are behind it; PLACE.doc is where they would be).
const CLAUDE_S = 2.1;
const PLACE = { doc: [430, 905], martin: [630, 846], claude: [1050, 846], laptop: [843, 577], door: [150, 770],
  shelf: [1440, 846], port: [990, 562], routerPort: [1530, 220] };
const BENCH = { x0: 236, x1: 600, y: 766 };   // Doc's bench: its top edge; the board lies on it at BOARD
const BOARD = [452, 758];
const STAND = [560, 766];   // the iron's stand on Doc's bench (a coil on a foot)
// The iron resting in its stand, tip down-left in the coil (world coordinates).
const IRON_IN_STAND = `<image href="../img/props/iron.webp" x="-50" y="-17" width="100" height="34" transform="translate(${STAND[0] + 16} ${STAND[1] - 34}) rotate(-52)"/>`;
const LAP_W = 300;   // the laptop on the stool, wide enough that Claude's mittens show either side of him from behind
const LEDS = [1442.5, 1454, 1467.5, 1481.5, 1494, 1508.5];   // the router's lights on the shelf, y 213.7
const BULB = [903, 109];
const MONO = 'CW Mono, Menlo, Consolas, monospace', MARKER = 'CW Marker, Comic Sans MS, sans-serif';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ---------- the stage ---------- */
// The garage with the cast in their places. Returns the camera, the puppets, the laptop and helpers; the scene poses
// them every frame (stopClock) and calls stage.frame(q, f, extra) for the set's own life (rain, bulb, router, door).
function garageStage(p, { door = 0 } = {}) {
  const cam = paperCam(p, 'garage');
  if (F45) {   // 4:5: the wides pull back past the plate's foot, so the concrete floor carries on below it
    const apron = mk('g', {}, null);
    apron.innerHTML = `<linearGradient id="cwApron" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a5657"/><stop offset="1" stop-color="#3f3c3d"/></linearGradient>
      <rect x="-200" y="900" width="2000" height="600" fill="url(#cwApron)"/>`;
    cam.world.insertBefore(apron, cam.world.firstChild);
  }
  const rain = mk('g', {}, cam.stage);   // outside the doorway, behind whoever stands there
  rain.innerHTML = Array.from({ length: 46 }, (_, i) => {
    const x = (i * 53.7) % 250, y = (i * 97.3) % 600;
    return `<path d="M${x.toFixed(0)},${(165 + y).toFixed(0)} l-7,34" stroke="#9fb6d8" stroke-width="2.4" opacity=".55"/>`;
  }).join('');
  const glow = mk('ellipse', { rx: 260, ry: 220, fill: 'url(#cwBulb)', opacity: .5 }, cam.stage);
  const leds = mk('g', {}, cam.stage), cable = mk('g', {}, cam.stage), laptop = mk('g', {}, cam.stage);
  const doc = docPuppet(cam.stage);
  const bench = mk('g', {}, cam.stage); bench.innerHTML = benchSVG();   // in front of Doc, behind the others
  const martin = martinPuppet(cam.stage), claude = claudePuppet(cam.stage);
  const fx = mk('g', {}, cam.stage);
  let cableKey = '';
  let lapKey = '', ledKey = '', lapScr = '';
  const stage = { cam, doc, martin, claude, laptop, fx, cable, bench,
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
function laptopSVG({ x = PLACE.laptop[0], y = PLACE.laptop[1], w = LAP_W, open = true, screen = 'term', shown = 1 }) {
  if (!open) return `<g transform="translate(${x} ${y})"><image href="../img/props/laptop.webp" x="${-w / 2}" y="${-w * 197 / 348 * .25}" width="${w}" height="${(w * 197 / 348 * .25).toFixed(1)}" preserveAspectRatio="none"/></g>`;
  const h = w * 249 / 415;
  return `<g transform="translate(${x} ${y - h / 2}) scale(${shown})"><image href="../img/props/laptop-open.webp" x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h.toFixed(1)}"/><g class="scr"></g></g>`;
}
function lapScreen({ w = LAP_W, screen = 'term' }) { const sx = w / 415; return screenSVG(screen, sx, -33.5 * sx, 303 * sx, 144 * sx); }
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

// Doc's solder bench, downstage left: a plank on two legs that hides his legs and the stool, the board on it with a
// little spool of solder, and a clamp lamp whose cone lights his hands.
function benchSVG() {
  const { x0, x1, y } = BENCH, [bx, by] = BOARD, I = CW_INK, sx = 296, sy = 616;   // the lamp's shade
  return `<path d="M262,${y} L270,590 L${sx},${sy - 18}" fill="none" stroke="${I}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M262,${y} L270,590 L${sx},${sy - 18}" fill="none" stroke="#5d6470" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M${sx + 18},${sy + 10} L${bx + 20},${y - 10} L${bx - 90},${y - 10} Z" fill="#ffe9a8" opacity=".2"/>
    <ellipse cx="${bx - 10}" cy="${y - 12}" rx="100" ry="24" fill="#ffe9a8" opacity=".35"/>
    <path d="M${sx - 26},${sy - 30} L${sx + 26},${sy - 14} L${sx + 18},${sy + 18} L${sx - 30},${sy + 2} Z" fill="#2f6f9e" stroke="${I}" stroke-width="6" stroke-linejoin="round"/>
    <rect x="${x0 + 10}" y="${y + 20}" width="${x1 - x0 - 20}" height="${920 - y}" fill="#8a5a2b" stroke="${I}" stroke-width="7"/>
    <rect x="${x0 + 40}" y="${y + 46}" width="${(x1 - x0) / 2 - 56}" height="48" rx="5" fill="#9c6a35" stroke="${I}" stroke-width="5"/>
    <rect x="${(x0 + x1) / 2 + 16}" y="${y + 46}" width="${(x1 - x0) / 2 - 56}" height="48" rx="5" fill="#9c6a35" stroke="${I}" stroke-width="5"/>
    <rect x="${(x0 + x1) / 2 - 92}" y="${y + 64}" width="36" height="10" rx="4" fill="${I}"/><rect x="${x1 - 112}" y="${y + 64}" width="36" height="10" rx="4" fill="${I}"/>
    <rect x="${x0}" y="${y}" width="${x1 - x0}" height="30" rx="4" fill="#b9773a" stroke="${I}" stroke-width="7"/>
    <path d="M${x0 + 30},${y + 14} H${x1 - 40}" stroke="#8a5a2b" stroke-width="4"/>
    <path d="M${bx - 58},${y} L${bx - 50},${by - 8} H${bx + 58} L${bx + 62},${y} Z" fill="#2f7d3a" stroke="${I}" stroke-width="5" stroke-linejoin="round"/>
    <rect x="${bx - 30}" y="${by - 16}" width="22" height="9" fill="#222"/><rect x="${bx + 12}" y="${by - 14}" width="26" height="7" fill="#c9a23a"/>
    <circle cx="${x0 + 84}" cy="${y - 12}" r="14" fill="#c0c0c0" stroke="${I}" stroke-width="5"/><circle cx="${x0 + 84}" cy="${y - 12}" r="5" fill="#555"/>
    <path d="M${STAND[0] - 22},${y} h44 l-8,-10 h-28 Z" fill="#5d6470" stroke="${I}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M${STAND[0] - 6},${y - 10} l26,-34 M${STAND[0] + 2},${y - 10} l26,-34 M${STAND[0] + 2},${y - 22} l14,0 M${STAND[0] + 10},${y - 32} l14,0" stroke="#9aa2ad" stroke-width="5" stroke-linecap="round"/>`;
}
// Solder smoke: a thin grey curl rising from the iron's tip (world coordinates).
function solderSmoke(x, y, q) {
  return Array.from({ length: 5 }, (_, i) => {
    const u = ((q / 2.2 + i / 4) % 1 + 1) % 1;
    return `<circle cx="${(x + 14 * Math.sin(u * 9 + i) + 10 * u).toFixed(1)}" cy="${(y - 110 * u).toFixed(1)}" r="${(5 + 13 * u).toFixed(1)}" fill="#f2efe8" stroke="#9a948a" stroke-width="2" opacity="${(Math.min(1, u * 5) * (1 - u) * .9).toFixed(2)}"/>`;
  }).join('');
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
  const half = (F45 ? W45W / 2 : 800) / z;   // keep the frame (4:5: its window) on the plate
  return { x: Math.min(1660 - half, Math.max(-60 + half, px)), y: cy, z };
}
// 4:5: a single that holds up a cardboard sign beside the head pulls back and puts the speaker left of centre, so
// the sign reads whole inside the window.
const signView = v => ({ x: v.x + 165 / v.z, y: v.y + 60 / v.z, z: v.z * .63 });
// 4:5: Claude's single with the ✓ ticks beside him: pulled back a little, Claude left, the ticks on the right.
const tickView = v => ({ x: v.x + 150 / v.z, y: v.y + 40 / v.z, z: v.z * .78 });
// 4:5 wides, framed on who matters in each (recut-45.md); z under 1 tops the frame at the ceiling, the apron below.
const wide45 = (x, z = 1) => ({ x, y: z >= 1 ? 450 : -26 + 450 / z, z });
const W45 = { door: wide45(380), stage: wide45(740, .78), cable: wide45(840, .78), router: wide45(1180, .78),
  yolo: wide45(1020, .7), lights: wide45(1000, .7), run: wide45(470, .78) };
const wv = name => F45 ? { view: W45[name] } : {};

/* ---------- the terminal that fills the frame ---------- */
// lines: [{ at, text, kind: 'cmd' | 'out' | 'ok' | 'bad' | 'dim', cps }]: a command types at cps characters a
// second from `at`; output lines appear whole at `at`. The newest line stays above the bottom margin.
function termScreen(p, lines, { yolo = false, title = 'martin@omarchy: ~', rows = 16 } = {}) {
  const g = mk('g', {}, p);
  g.innerHTML = termChrome(title);
  const badge = mk('g', { visibility: yolo ? 'inherit' : 'hidden' }, g);   // 'visible' would show through a hidden screen
  badge.innerHTML = yoloBadge();
  // 4:5: the window's 720 wide at 27 (40 px in the video), 40 columns; rows 8 (scene 4's panels below) stay 8
  // 4:5: below the YOLO badge, which sits over the first row in the narrow window; scene 4's 8 rows → 7, clear of the balloons
  const body = mk('g', {}, g), LH = F45 ? 40 : 46, TOP = F45 && yolo ? 150 : 112, ROWS = F45 ? (rows > 8 ? 15 : 7) : rows, WRAP = F45 ? 40 : 76;
  const FS = F45 ? 27 : 31, TX = F45 ? X45 + 26 : 64;
  const col = { cmd: '#e8eaed', out: '#aab2bf', ok: '#5df07a', bad: '#ff6b5e', dim: '#5f6773' };
  let key = '';
  return { g, draw(q) {
    const shown = [];
    for (const L of lines) {
      if (q < L.at) break;
      let t = L.text;
      if (L.kind === 'cmd') { const n = Math.floor((q - L.at) * (L.cps || 40)); t = L.text.slice(0, n); }
      for (let i = 0; i < t.length || i === 0; i += WRAP) shown.push([L, (i ? '  ' : '') + t.slice(i, i + WRAP), i > 0]);   // a terminal wraps
    }
    const last = shown[shown.length - 1], typing = last && last[0].kind === 'cmd' && last[1].length < last[0].text.length;
    const cursor = Math.floor(q * 2.5) % 2 === 0 || typing;
    const k = shown.map(s => s[1]).join('\n') + (cursor ? '_' : '');
    if (k === key) return; key = k;
    const view = shown.slice(-ROWS);
    body.innerHTML = view.map(([L, t, cont], i) => {
      const y = TOP + i * LH + 34, kind = L.kind || 'out', end = i === view.length - 1;
      const pre = kind === 'cmd' && !cont ? `<tspan fill="#5df07a">$ </tspan>` : '';
      return `<text x="${TX}" y="${y}" font-family="${MONO}" font-size="${FS}" fill="${col[kind]}" xml:space="preserve">${pre}${esc(t)}${end && cursor ? '<tspan fill="#e8eaed">▌</tspan>' : ''}</text>`;
    }).join('');
  } };
}

// The terminal window's title bar and the YOLO badge (in 4:5 inside the window: dots at its left, badge at its right).
function termChrome(title = 'martin@omarchy: ~') {
  const x = F45 ? X45 : 0;
  return `<rect width="1600" height="900" fill="#0d1014"/><rect width="1600" height="54" fill="#1c2027"/>
    <circle cx="${x + 34}" cy="27" r="9" fill="#ff5f57"/><circle cx="${x + 62}" cy="27" r="9" fill="#febc2e"/><circle cx="${x + 90}" cy="27" r="9" fill="#28c840"/>
    <text x="800" y="36" text-anchor="middle" font-family="${MONO}" font-size="22" fill="#8b93a1">${esc(title)}</text>`;
}
function yoloBadge() {
  const x = F45 ? X45 + W45W - 24 - 214 : 1340;
  return `<rect x="${x}" y="80" width="214" height="56" rx="10" fill="#d8262b"/><text x="${x + 107}" y="119" text-anchor="middle" font-family="${MONO}" font-weight="800" font-size="30" fill="#fff">YOLO 12h</text>`;
}

/* ---------- comic panels over the screen ---------- */
// A tilted comic panel of one character's head and shoulders that slams in from its side with a speech balloon.
// draw(q, { in: t0, out: t1, pose, text }) poses it; side 'L' (Claude) or 'R' (Martin).
function comicPanel(p, who, side) {
  const g = mk('g', {}, p), W = F45 ? 340 : 520, H = F45 ? 330 : 470, L = side === 'L';   // 4:5: the window's bottom corners
  const x0 = F45 ? (L ? X45 + 14 : X45 + W45W - 14 - W) : L ? 40 : 1600 - 40 - W, y0 = 900 - H + 70, tilt = 0;   // upright: a turned group makes Firefox redraw its big pictures whenever a mouth changes
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
  const sp = CW[who], s = (who === 'claude' ? 3.5 : 1.55) * W / 520, k = sp.K * s;
  const headTop = (sp.feet[1] - (sp.head ? sp.head[1] : sp.body[1])) * k;
  const px = x0 + W / 2, py = y0 + (who === 'claude' ? 30 : 40) * W / 520 + headTop;
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
      if (F45) size *= .72;
      const bw = Math.max(F45 ? 160 : 220, text.length * size * .52 + (F45 ? 60 : 80)), bh = size * 1.9;
      // beside the panel, towards the middle (4:5: above it, Claude's higher, both inside the window)
      const bx = F45 ? (L ? x0 : x0 + W - bw) : L ? x0 + W - 30 : x0 + 30 - bw, by = F45 ? y0 - bh - (L ? 120 : 50) : y0 + (L ? 10 : 120);
      const tx = F45 ? (L ? x0 + 110 : x0 + W - 110) : L ? x0 + W - 60 : x0 + 60;
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
// CWTFIGO, the owner's slogan as the headline over the two install lines (marketplace add, then plugin install) and
// "Not affiliated with Anthropic" small at the bottom. 4:5: the layout of the shared shorts kit's end card (cwEnd,
// site/cwtfigo-shorts/lib/kit.js: the 900 × 1125 band) scaled into the 720 × 900 window, the lines typed in as there,
// so the five X videos end alike.
const CW_SLOGAN = ['Turn your Claude Code into', 'the ultimate troubleshooting tool.'];
const CW_INSTALL = ['/plugin marketplace add DozenTwelve/CWTFIGO', '/plugin install cwtfigo@cwtfigo'];
function cwEndCard(p) {
  const g = mk('g', {}, p);
  mk('rect', { width: 1600, height: 900, fill: '#16130f' }, g);
  mk('rect', { width: 1600, height: 900, fill: 'url(#cwDots)', opacity: .5 }, g);
  const band = mk('g', F45 ? { transform: `translate(${X45} 0) scale(.8)` } : {}, g);   // 4:5: band units, 900 wide
  const pup = claudePuppet(band);
  const txt = mk('g', {}, band), typed = mk('g', {}, band);
  const slogan = (x, y, fs) => CW_SLOGAN.map((l, i) => `<text x="${x}" y="${y + i * fs * 1.2}" text-anchor="middle" font-family="${MARKER}" font-size="${fs}" fill="#f4ede0">${l}</text>`).join('');
  // 4:5 (band units): title, tagline, Claude, the slogan, the box, the disclaimer; 16:9: Claude left, the words right
  const L = F45 ? { x: 450, box: [30, 760, 840, 150], fs: 27, lx: 58, ly: [820, 876] } : { x: 1040, box: [610, 530, 860, 150], fs: 30, lx: 640, ly: [592, 648] };
  txt.innerHTML = (F45
    ? `<text x="450" y="128" text-anchor="middle" font-family="${MARKER}" font-size="116" fill="#ef601d">CWTFIGO</text>
    <text x="450" y="190" text-anchor="middle" font-family="${MARKER}" font-size="38" fill="#f4ede0">Claude, what the fuck is going on?</text>
    ${slogan(450, 650, 46)}
    <text x="450" y="990" text-anchor="middle" font-family="${MONO}" font-size="22" fill="#6c7380">Not affiliated with Anthropic</text>`
    : `<text x="1040" y="200" text-anchor="middle" font-family="${MARKER}" font-size="120" fill="#ef601d">CWTFIGO</text>
    <text x="1040" y="280" text-anchor="middle" font-family="${MARKER}" font-size="40" fill="#f4ede0">Claude, what the fuck is going on?</text>
    ${slogan(1040, 410, 46)}
    <text x="1040" y="840" text-anchor="middle" font-family="${MONO}" font-size="20" fill="#6c7380">Not affiliated with Anthropic</text>`) +
    `<rect x="${L.box[0]}" y="${L.box[1]}" width="${L.box[2]}" height="${L.box[3]}" rx="16" fill="#0d1014" stroke="#3a3f48" stroke-width="3"/>`;
  let key = '';
  return { g, draw(q, f) {
    // the lines type in, the second 1.1 s after the first (45 characters a second), as on the shorts' end card
    const n = CW_INSTALL.map((l, i) => Math.max(0, Math.min(l.length, Math.floor((q - .3 - i * 1.1) * 45))));
    const cur = n[1] > 0 ? 1 : 0, blink = Math.floor(q * 2.5) % 2 === 0, k = n.join() + blink;
    if (k !== key) {
      key = k;
      typed.innerHTML = CW_INSTALL.map((l, i) => `<text x="${L.lx}" y="${L.ly[i]}" font-family="${MONO}" font-size="${L.fs}" fill="#e8eaed" xml:space="preserve"><tspan fill="#5df07a">&gt; </tspan>${esc(l.slice(0, n[i]))}${i === cur && blink ? '<tspan fill="#e8eaed">▌</tspan>' : ''}</text>`).join('');
    }
    pup.pose({ ...(F45 ? { x: 450, y: 600, s: 1.55 } : { x: 380, y: 820, s: 3.1 }), holdL: { name: 'cigar', w: 230, x: -30, y: 10, r: -10 }, armL: 70, lids: .42,
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
  // the props on the set stay sharp while the plate goes soft, so a single shows only its speaker's own: Doc's bench
  const wide = cur.kind === 'wide';
  vis(st.laptop, wide); vis(st.cable, wide); vis(st.bench, wide || cur.who === 'doc');
  for (const n of ['doc', 'martin', 'claude']) {
    const o = P[n], on = o && (cur.kind === 'wide' || cur.who === n);
    vis(st[n].g, !!on);   // one off screen is hidden and left as it is: posing it unseen still costs Firefox a repaint
    if (on) st[n].pose(o, f);
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
  txt.innerHTML = F45 ? `<text x="800" y="560" text-anchor="middle" font-family="${MONO}" font-size="64" fill="#e8582a">Percolating…</text>`   // 4:5: the star above the word
    : `<text x="700" y="478" font-family="${MONO}" font-size="64" fill="#e8582a">Percolating…</text>`;
  return { g, draw(q) { tf(star, `translate(${F45 ? '800 400' : '630 456'}) rotate(${(q * 360) % 360}) scale(${1 + .15 * Math.sin(q * 12)})`); txt.setAttribute('opacity', (.55 + .45 * Math.sin(q * 9)).toFixed(2)); } };
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

/* ---------- music ----------
   The coordinator's score: a 3 s guitar opener (audio/sfx/, played as an effect at the top of scene 1), the bed under
   the film (audio/bgm/, the chapter page's music()) and the uh-oh on rm -rf (scene 5); no ambience and no scene-cut
   stings (the owner's mix). Swap a track by putting its file in place under the same name. */
window.CW_MUSIC = window.CW_MUSIC || { opener: 'opener', bgm: 'bgm-a', sting: null, uhoh: 'sting-uhoh' };
const CW_STINGS = [];   // the owner dropped the scene-cut stings: name scenes here (and a sting file) to bring them back
const stingAt = (scene, t = 0, which = 'sting', vol = 1.2) => {
  if (CW_MUSIC[which] && (which !== 'sting' || CW_STINGS.includes(scene))) sfx(scene, t, CW_MUSIC[which], vol, SFX_BED[CW_MUSIC[which]] || 3);
};
