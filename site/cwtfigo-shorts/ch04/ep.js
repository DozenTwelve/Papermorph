/* ep.js — ch04 "90 °C every day": this episode's own pieces on top of the series kit (lib/kit.js). The hot laptop with
   an egg frying on its keyboard, Martin's mug, the thumbprint stamp (a script's fingerprint: one yes, kept until the
   script changes), the paper chips beside a single, a big word slammed over the stage, the check.sh page, and Doc at
   his bench (the promo's docSolder, which the kit does not carry). */
'use strict';
const PRE1 = 1.5, PRE2 = 1.5, PRE3 = 2.3, PRE4 = .3, PRE5 = 1.2, PRE_END = .3;
const HOT = '#c8261a', COOL = '#2f9e52', PRINT_OK = '#22a04a', PRINT_BAD = '#d8262b';
const mixHex = (a, b, u) => '#' + [1, 3, 5].map(i => Math.round(parseInt(a.substr(i, 2), 16) * (1 - u) + parseInt(b.substr(i, 2), 16) * u).toString(16).padStart(2, '0')).join('');

/* ---------- Doc at his bench (promo ch01/scene1.js) ---------- */
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

/* ---------- the laptop on the stool ---------- */
// The kit draws the laptop (st.frame lap); this writes its screen and the egg into the laptop's own screen group, so
// both sit with the laptop, behind Martin, and vanish with it in a single. Laptop-local units: the screen is
// x -109.5 … 109.5, y -76 … 28; the keyboard y 47 … 65.
const LAP_H = LAP_W * 249 / 415, LAP_O = [PLACE.laptop[0], PLACE.laptop[1] - LAP_H / 2];
const lapW = (x, y) => [LAP_O[0] + x, LAP_O[1] + y];
const EGG_AT = [40, 54];
function eggSVG(cx, cy, k, { cook = 0, cold = false, sizzle = false, f = 0 } = {}) {
  const P = (x, y) => `${(cx + x * k).toFixed(1)},${(cy + y * k).toFixed(1)}`;
  const edge = cook > .3 ? mixHex(CW_INK, '#b06a2a', Math.min(1, cook)) : CW_INK;
  let s = `<path d="M${P(-34, 0)} C${P(-36, -11)} ${P(-10, -14)} ${P(2, -11)} C${P(20, -15)} ${P(38, -7)} ${P(34, 3)} C${P(30, 12)} ${P(-8, 13)} ${P(-20, 9)} C${P(-30, 8)} ${P(-33, 5)} ${P(-34, 0)} Z" fill="${cold ? '#cfcbbf' : '#fbf8f0'}" stroke="${edge}" stroke-width="2.6" stroke-linejoin="round"/>`;
  s += `<ellipse cx="${(cx + 3 * k).toFixed(1)}" cy="${(cy - (cold ? 0 : 3) * k).toFixed(1)}" rx="${((cold ? 13 : 11) * k).toFixed(1)}" ry="${((cold ? 4.5 : 8) * k).toFixed(1)}" fill="${cold ? '#b98a3c' : '#ffb21e'}" stroke="${CW_INK}" stroke-width="2.2"/>`;
  if (!cold) s += `<ellipse cx="${(cx - 1 * k).toFixed(1)}" cy="${(cy - 6 * k).toFixed(1)}" rx="${(3.5 * k).toFixed(1)}" ry="${(2 * k).toFixed(1)}" fill="#fff" opacity=".8"/>`;
  if (sizzle) s += Array.from({ length: 5 }, (_, i) => { const u = jit(Math.floor(f / 2), 70 + i), v = jit(Math.floor(f / 2), 80 + i);
    return `<circle cx="${(cx + u * 30 * k).toFixed(1)}" cy="${(cy + v * 8 * k).toFixed(1)}" r="${(1.6 + Math.abs(u) * 1.6).toFixed(1)}" fill="none" stroke="${CW_INK}" stroke-width="1.2" opacity=".7"/>`; }).join('');
  return s;
}
// draw(q, f, { heat: 0 … 1, temp: °C or null, egg: null | { k, cook, cold, sizzle }, desk }) — call after st.frame.
function hotLap(st) {
  let key = '';
  return { draw(q, f, { heat = 0, temp = null, egg = null, desk = false } = {}) {
    const scr = st.laptop.querySelector('.scr'); if (!scr) return;
    const flick = heat > .5 && Math.floor(q * 6) % 2 ? .82 : 1;
    const k = JSON.stringify([heat.toFixed(2), temp == null ? null : Math.round(temp), egg, flick, egg && egg.sizzle ? Math.floor(f / 2) : 0, desk]);
    if (k === key) return; key = k;
    let s = desk ? screenSVG('desk', 0, -24, 219, 104) : `<rect x="-109.5" y="-76" width="219" height="104" fill="${mixHex('#0d1014', HOT, heat * flick)}"/>`;
    if (temp != null) s += `<rect x="-62" y="-52" width="124" height="54" rx="8" fill="#0d1014" opacity="${desk ? .75 : 0}"/><text x="0" y="-9" text-anchor="middle" font-family="${MONO}" font-weight="700" font-size="44" fill="#fff">${Math.round(temp)}°C</text>`;
    if (egg) s += eggSVG(EGG_AT[0], EGG_AT[1], egg.k ?? 1, { ...egg, f });
    scr.innerHTML = s;
  } };
}
// Heat on the stage (world units): a red wash over the garage, a glow round the laptop, smoke from its vents and the
// air shimmering above it. A string for st.fxHTML.
function heatFX(q, heat, full = true) {
  if (heat <= .01) return '';
  const [lx, ly] = lapW(0, 0);
  let s = `<rect x="-60" y="-34" width="1720" height="968" fill="${HOT}" opacity="${(.2 * heat).toFixed(3)}"/>`;
  if (!full) return s;   // a single: only the red air, the laptop is not in it
  s += `<ellipse cx="${lx}" cy="${ly + 20}" rx="230" ry="190" fill="url(#cwHeat)" opacity="${heat.toFixed(3)}"/>`;
  s += solderSmoke(lx - 118, ly + 70, q) + solderSmoke(lx + 120, ly + 68, q + 1.1) +
    smokeSVG(lx - 95, ly + 40, q, 4, 1.4) + smokeSVG(lx + 100, ly + 40, q + .9, 4, 1.4);
  s += Array.from({ length: 4 }, (_, i) => {
    const x = lx - 70 + i * 46, y0 = ly - 100, w = 6 * Math.sin(q * 5 + i);
    return `<path d="M${x},${y0} q${w},-14 0,-28 q${-w},-14 0,-28 q${w},-14 0,-28" fill="none" stroke="#fff3d6" stroke-width="3" stroke-linecap="round" opacity="${(.45 * heat).toFixed(2)}" transform="translate(0 ${(-10 * ((q * 1.5 + i * .3) % 1)).toFixed(1)})"/>`;
  }).join('');
  return s;
}

document.body.insertAdjacentHTML('afterbegin', `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  <radialGradient id="cwHeat"><stop offset="0" stop-color="#ff6a2a" stop-opacity=".45"/><stop offset="1" stop-color="#ff6a2a" stop-opacity="0"/></radialGradient>
</defs></svg>`);

/* ---------- props held in a mitten (puppet-local units, Martin's K .3) ---------- */
const MUG = { svg: `<path d="M38,-26 q34,0 34,24 t-34,24" fill="none" stroke="${CW_INK}" stroke-width="10"/><path d="M-36,-44 h74 v78 q0,16 -16,16 h-42 q-16,0 -16,-16 Z" fill="#f4ede0" stroke="${CW_INK}" stroke-width="10" stroke-linejoin="round"/><ellipse cx="1" cy="-44" rx="37" ry="9" fill="#5a3214" stroke="${CW_INK}" stroke-width="7"/>`,
  x: 0, y: -50, upright: true };
const EGG_HELD = { svg: `<ellipse cx="0" cy="-40" rx="38" ry="48" fill="#f6ead6" stroke="${CW_INK}" stroke-width="9"/>`, upright: true };
const SHELL = { svg: `<path d="M-40,-30 a38,30 0 0 0 30,34 l8,-14 l8,10 l8,-12 l8,10 l8,-6 a38,30 0 0 0 10,-24" fill="#f6ead6" stroke="${CW_INK}" stroke-width="9" stroke-linejoin="round"/>`, upright: true };
// Claude's cardboard sign held up beside his head (as the promo's SIGN), the words in hand lettering.
const SIGN = (text, size = 56, w = 640) => ({ name: 'sign', w, x: 40, y: -w * .42, upright: true, text, size });
// Where on the stage a point of a held sign's board is: (u, v) from -1 … 1 across the board, for Claude's pose o.
function signPt(st, o, h, side, u, v) {
  const [hx, hy] = st.claude.hand(o, side), k = CW.claude.K * (o.s ?? 1);
  const H = h.w * 439 / 305, bw = h.w, bh = h.w * 219 / 305, cx = h.x, cy = h.y - H / 2 + H * .25;
  return [hx + (cx + u * bw / 2) * k, hy + (cy + v * bh / 2) * k];
}

/* ---------- the fingerprint ---------- */
// A thumbprint stamp centred at (cx, cy), radius r: broken whorls in `col`, a label under it and the script's hash.
// smudge 0 … 1 doubles it off to one side (the script changed: the print no longer matches).
function printSVG(cx, cy, r, col, { label = '', hash = '', rot = -14, smudge = 0, o = 1, k = 1 } = {}) {
  const rings = Array.from({ length: 6 }, (_, i) => { const rr = r * (.22 + i * .155);
    return `<ellipse cx="0" cy="${(i * r * .03).toFixed(1)}" rx="${(rr * .78).toFixed(1)}" ry="${rr.toFixed(1)}" fill="none" stroke="${col}" stroke-width="${(r * .075).toFixed(1)}" stroke-linecap="round" stroke-dasharray="${(rr * 1.7).toFixed(1)} ${(rr * .42).toFixed(1)}" stroke-dashoffset="${(i * rr * .9).toFixed(1)}"/>`; }).join('');
  const t = `translate(${cx.toFixed(1)} ${cy.toFixed(1)}) scale(${k.toFixed(3)})`;
  let s = `<g transform="${t}" opacity="${o.toFixed(2)}"><g transform="rotate(${rot})">`;
  if (smudge > 0) s += `<g transform="translate(${(r * .32 * smudge).toFixed(1)} ${(r * .12 * smudge).toFixed(1)}) rotate(${(16 * smudge).toFixed(1)})" opacity=".55">${rings}</g>`;
  s += rings + '</g>';
  if (label || hash) s += `<rect x="${(-r * 1.25).toFixed(1)}" y="${(r * 1.12).toFixed(1)}" width="${(r * 2.5).toFixed(1)}" height="${(r * (hash ? 1.2 : .7)).toFixed(1)}" rx="${(r * .15).toFixed(1)}" fill="#fbf8f0" opacity=".92"/>`;
  if (label) s += `<text y="${(r * 1.62).toFixed(1)}" text-anchor="middle" font-family="${MARKER}" font-size="${(r * .62).toFixed(1)}" fill="${col}">${esc(label)}</text>`;
  if (hash) s += `<text y="${(r * 2.12).toFixed(1)}" text-anchor="middle" font-family="${MONO}" font-size="${(r * .36).toFixed(1)}" fill="${col}">${esc(hash)}</text>`;
  return s + '</g>';
}
const tickSVG = (x, y, s, col = PRINT_OK) => `<path d="M${x - s * .5},${y} l${s * .35},${s * .38} l${s * .7},${-s * .8}" fill="none" stroke="${col}" stroke-width="${(s * .2).toFixed(1)}" stroke-linecap="round" stroke-linejoin="round"/>`;

/* ---------- words in screen space ---------- */
// A paper chip that pops in beside a single (screen units): draw(q).
function paperChip(p, text, x, y, { at = 0, r = -4, size = 54, mono = false, ink = CW_INK, fill = '#fbf8f0' } = {}) {
  const w = text.length * size * (mono ? .62 : .56) + 56, h = size * 1.5;
  const g = stamp(p, `<g transform="rotate(${r} ${x} ${y})"><rect x="${x - w / 2 + 8}" y="${y - h / 2 + 10}" width="${w}" height="${h}" rx="10" fill="${CW_INK}" opacity=".35"/>
    <rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="10" fill="${fill}" stroke="${CW_INK}" stroke-width="7"/>
    <text x="${x}" y="${y + size * .36}" text-anchor="middle" font-family="${mono ? MONO : MARKER}" font-weight="${mono ? 700 : 400}" font-size="${size}" fill="${ink}">${esc(text)}</text></g>`);
  return { g, draw(q, out = 99) {
    const on = q >= at && q < out; vis(g, on); if (!on) return;
    const u = Math.min(1, (q - at) / .18), k = u < 1 ? .4 + .75 * ease(u) : 1;
    tf(g, `translate(${x} ${y}) scale(${k.toFixed(3)}) translate(${-x} ${-y})`);
  } };
}
// A big word slammed over the picture (like the opener's): draw(q).
function slamWord(p, text, { at = 0, out = 99, y = CW_BAND.y + 220, size = 130, col = '#fbf8f0' } = {}) {
  const attrs = `x="${SW / 2}" y="${y}" text-anchor="middle" font-family="${MARKER}" font-size="${size}"`;
  const g = stamp(p, `<text ${attrs} fill="none" stroke="${CW_INK}" stroke-width="${size * .22}" stroke-linejoin="round">${esc(text)}</text><text ${attrs} fill="${col}">${esc(text)}</text>`);
  const cy = y - size * .35;
  return { g, draw(q) {
    const on = q >= at && q < out + .25; vis(g, on); if (!on) return;
    const k = q - at < .2 ? 1.3 - .3 * ease((q - at) / .2) : 1;
    tf(g, `translate(${SW / 2} ${cy}) scale(${k.toFixed(3)}) translate(${-SW / 2} ${-cy})`);
    g.setAttribute('opacity', (q > out ? Math.max(0, 1 - (q - out) / .25) : 1).toFixed(2));
  } };
}

/* ---------- the terminal, set for a phone ---------- */
// The kit's termScreen sets 50 columns at 27 px for the main film's look; on a phone in 4:5 that is a smudge. This is
// the same window at 44 px, 32 columns (a longer line wraps with two spaces), the bar on the band's top edge; a 'bad'
// line gets a dark red band behind it. lines as termScreen's: { at, text, kind, cps }.
function bigTerm(p, lines, { title = 'martin@omarchy: ~', size = 44, wrap = 32 } = {}) {
  const g = mk('g', {}, p), B = CW_BAND.y;
  mk('rect', { width: SW, height: SH, fill: '#0d1014' }, g);
  const bar = mk('g', {}, g);
  bar.innerHTML = `<rect y="${B}" width="${SW}" height="54" fill="#1c2027"/><circle cx="34" cy="${B + 27}" r="9" fill="#ff5f57"/><circle cx="62" cy="${B + 27}" r="9" fill="#febc2e"/><circle cx="90" cy="${B + 27}" r="9" fill="#28c840"/>
    <text x="${SW / 2 + 30}" y="${B + 36}" text-anchor="middle" font-family="${MONO}" font-size="22" fill="#8b93a1">${esc(title)}</text>`;
  const body = mk('g', {}, g), LH = size * 1.3, TOP = B + 80;
  const col = { cmd: '#e8eaed', out: '#aab2bf', ok: '#5df07a', bad: '#ff6b5e', dim: '#6c7482' };
  let key = '';
  return { g, draw(q) {
    const shown = [];
    for (const L of lines) {
      if (q < L.at) break;
      let t = L.text;
      if (L.kind === 'cmd') t = (L.prompt ?? '$ ') + L.text.slice(0, Math.floor((q - L.at) * (L.cps || 40)));
      for (let i = 0; i < t.length || i === 0; i += wrap) shown.push([L, (i ? '  ' : '') + t.slice(i, i + wrap)]);
    }
    const cursor = Math.floor(q * 2.5) % 2 === 0;
    const k = shown.map(s => s[1]).join('\n') + cursor; if (k === key) return; key = k;
    body.innerHTML = shown.map(([L, t], i) => {
      const y = TOP + (i + 1) * LH, kind = L.kind || 'out', end = i === shown.length - 1;
      const hl = kind === 'bad' ? `<rect x="20" y="${(y - size * .95).toFixed(1)}" width="${SW - 40}" height="${(size * 1.25).toFixed(1)}" rx="6" fill="#5a1410"/>` : '';
      const txt = kind === 'cmd' && t.startsWith('$ ') ? `<tspan fill="#5df07a">$ </tspan>${esc(t.slice(2))}` : esc(t);
      return `${hl}<text x="36" y="${y.toFixed(1)}" font-family="${MONO}" font-size="${size}" font-weight="${kind === 'bad' || kind === 'ok' ? 700 : 400}" fill="${col[kind]}" xml:space="preserve">${txt}${end && cursor ? '<tspan fill="#e8eaed">▌</tspan>' : ''}</text>`;
    }).join('');
  } };
}
