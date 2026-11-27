/* story.js: Apollo 13, The Way Home. Every frame is drawn from P alone (lib/scroll.js): one scene per stretch of the
   story, each faded in over the first quarter of its first step and covering the one before it. Four drawings made in
   code (the ship, the route, the filters, the battery chart) and NASA's photographs between them. */
'use strict';
const AMBER = '#f2b544', PALE = '#dcd5c6', DIM = '#59606e', HULL = '#161c29', HOT = '#ff6347';
pictures(['launch', 'crew', 'damaged-sm', 'moon-far-side', 'mailbox-ground', 'mailbox-aquarius', 'splashdown', 'mission-control']);

/* ---------- the mission clock: hours after launch at each place in the story (MR / AFJ times, rounded) ---------- */
// a key at a step's start (f 0) holds the hour of the step before until its end, so each step ends on a still clock
const CLOCK = [['out', 0, 0], ['out', .85, 55], ['tank', 0, 55], ['tank', .2, 56], ['lost', .1, 56], ['lost', .85, 58], ['lifeboat', 0, 58],
  ['lifeboat', .8, 58.7], ['back', 0, 58.7], ['back', .15, 61], ['back', .6, 61.5], ['back', 1, 61.9], ['faster', 0, 77], ['faster', .55, 79.5], ['faster', 1, 79.9], ['aim', .05, 100], ['aim', .4, 105.3],
  ['aim', .85, 137.7], ['letgo', .4, 138], ['letgo', 1, 138.5], ['wake', .25, 140], ['wake', .8, 141.5]];
function hours(P) {
  const k = CLOCK.map(([key, f, h]) => [at(key, f), h]);
  if (P <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) if (P <= k[i][0]) return lerp(k[i - 1][1], k[i][1], ease((P - k[i - 1][0]) / (k[i][0] - k[i - 1][0])));
  return k[k.length - 1][1];
}
function clockChip(P, a) {
  const h = Math.floor(hours(P));
  chip(h === 0 ? 'LAUNCH' : `${h} HOUR${h === 1 ? '' : 'S'} AFTER LAUNCH`, fs(3), fs(4.5), { size: 3, fill: C.night, bg: AMBER, a });
}
// stacked chips at the bottom left: a photograph's caption
function caption(lines, a) { lines.forEach((s, i) => chip(s, fs(3), chh - fs(4) - (lines.length - 1 - i) * fs(4.6), { size: 2.7, a })); }

/* ---------- photographs ---------- */
// a picture covering box, but keeping at least `keep` of its width and height (a group portrait: nobody's face is
// cut, whatever the box's shape); what it cannot cover stays the night ground
function shown(im, box, a, fx, fy, keep = 0) {
  if (!ready(im)) return;
  const kOver = Math.max(box.w / im.naturalWidth, box.h / im.naturalHeight), kIn = Math.min(box.w / im.naturalWidth, box.h / im.naturalHeight);
  cover(im, box, a, fx, fy, keep ? Math.min(1, kIn / keep / kOver) : 1);
}
const photo = (name, fx, fy, lines, keep = 0) => (P, a) => { shown(IMG[name], full(), a, fx, fy, keep); caption(lines, a); };

/* ---------- the ship: Aquarius, Odyssey and the service module, side by side, in units of k px ---------- */
function shipScene(P, a) {
  const k = Math.min(cw * .86 / 96, chh * .5 / 34), x0 = cw / 2 - 47 * k, y0 = chh * .54;
  const X = u => x0 + u * k, Y = v => y0 + v * k;
  const show = key => (P < at('tank', 0) ? ramp(P, at('ship', key), at('ship', key + .18)) : 1);   // the parts arrive one by one
  const cmA = show(.08), smA0 = show(.3), lmA0 = show(.52);
  const cmLit = clamp(1 - ramp(P, at('lifeboat', .4), at('lifeboat', .7)) + ramp(P, at('wake', .05), at('wake', .3)));
  const smLit = 1 - ramp(P, at('lost', .35), at('lost', .8)), lmLit = ramp(P, at('lifeboat', .1), at('lifeboat', .4));
  const smDx = 7 * ramp(P, at('letgo', .1), at('letgo', .8)), smA = smA0 * (1 - ramp(P, at('wake', 0), at('wake', .25)));
  const lmDx = -16 * ramp(P, at('wake', .6), at('wake', .92)), lmA = lmA0 * (1 - ramp(P, at('wake', .7), at('wake', .95)));
  const panel = ramp(P, at('tank', .5), at('tank', .85)), seeIn = ramp(P, at('tank', .08), at('tank', .25));
  const part = (pts, dx, lit, pa, danger = 0) => {
    if (pa <= 0) return;
    ctx.beginPath(); pts.forEach(([u, v], i) => (i ? ctx.lineTo : ctx.moveTo).call(ctx, X(u + dx), Y(v))); ctx.closePath();
    ctx.globalAlpha = a * pa; ctx.fillStyle = HULL; ctx.fill();
    if (lit > 0) { ctx.globalAlpha = a * pa * .5 * lit; ctx.fillStyle = AMBER; ctx.fill(); }
    ctx.globalAlpha = a * pa; ctx.strokeStyle = danger ? HOT : lit > .5 ? AMBER : PALE; ctx.lineWidth = Math.max(1.5, k * .3); ctx.stroke();
    ctx.globalAlpha = 1;
  };
  const named = (name, role, u, v, na, roleA) => {
    text(name, X(u), Y(v), { size: 3.6, fill: PALE, align: 'center', spacing: .08, a: a * na });
    text(role, X(u), Y(v) + fs(4), { size: 2.9, font: SERF, weight: 400, fill: PALE, align: 'center', a: a * na * roleA, italic: true });
  };
  const roleA = P < at('tank', 0) ? 1 : 1 - ramp(P, at('tank', 0), at('tank', .15));

  // Aquarius, the Moon lander, docked by its top hatch to Odyssey's nose: ascent stage, descent stage, folded legs
  const lm = [[12, -9], [19, -8], [22, -3], [22, 3], [19, 8], [12, 9]], ds = [[2, -11], [12, -11], [12, 11], [2, 11]];
  part(ds, lmDx, lmLit, lmA); part(lm, lmDx, lmLit, lmA);
  if (lmA > 0) {
    ctx.globalAlpha = a * lmA; ctx.strokeStyle = lmLit > .5 ? AMBER : PALE; ctx.lineWidth = Math.max(1, k * .22); ctx.beginPath();
    for (const s of [-1, 1]) { ctx.moveTo(X(4 + lmDx), Y(11 * s)); ctx.lineTo(X(-1 + lmDx), Y(15 * s)); ctx.moveTo(X(9 + lmDx), Y(11 * s)); ctx.lineTo(X(3 + lmDx), Y(15.5 * s)); }
    ctx.stroke(); ctx.globalAlpha = 1;
  }
  part([[22, -2], [25, -2], [25, 2], [22, 2]], lmDx, lmLit, lmA);   // the tunnel goes with Aquarius
  // Odyssey, the capsule that comes home
  part([[25, -2.6], [40, -13], [40, 13], [25, 2.6]], 0, cmLit, cmA);
  // the service module, its engine bell, and the side panel over the oxygen tanks
  part([[40, -13], [78, -13], [78, 13], [40, 13]], smDx, smLit, smA, ramp(P, at('tank', .45), at('tank', .6)));
  part([[78, -4], [92, -11], [92, 11], [78, 4]], smDx, 0, smA);
  if (smA > 0) {
    const ox = X(47 + smDx), oy = Y(-13), ow = 24 * k, oh = 11 * k;
    if (seeIn > 0) {   // the open bay: two oxygen tanks behind the panel
      ctx.globalAlpha = a * smA * seeIn; ctx.fillStyle = C.night; ctx.fillRect(ox, oy, ow, oh);
      if (panel > 0) { ctx.globalAlpha = a * smA * panel * .55; ctx.fillStyle = hatch({ s: 1 }); ctx.fillRect(ox, oy, ow, oh); }
      ring(X(53 + smDx), Y(-7.5), 3.6 * k, PALE, Math.max(1.2, k * .25), a * smA * seeIn);
      ring(X(64 + smDx), Y(-7.5), 3.6 * k, ramp(P, at('tank', .3), at('tank', .45)) ? HOT : PALE, Math.max(1.2, k * .25), a * smA * seeIn);
      text('TANK 1', X(53 + smDx), Y(-7.5) + fs(1), { size: 2.4, fill: PALE, align: 'center', a: a * smA * seeIn * (1 - ramp(P, at('lost', .8), at('lost', .95))) });
      text('TANK 2', X(64 + smDx), Y(-7.5) + fs(1), { size: 2.4, fill: HOT, align: 'center', a: a * smA * seeIn * (1 - ramp(P, at('lost', .8), at('lost', .95))) });
      const glow = win(P, at('tank', .28), at('tank', .42), at('tank', .6), at('tank', .9));
      if (glow > 0) {
        const g = ctx.createRadialGradient(X(64 + smDx), Y(-7.5), 0, X(64 + smDx), Y(-7.5), 7 * k);
        g.addColorStop(0, HOT); g.addColorStop(1, 'rgba(255,99,71,0)');
        ctx.globalAlpha = a * smA * glow; ctx.fillStyle = g; ctx.fillRect(X(56 + smDx), Y(-15), 16 * k, 15 * k); ctx.globalAlpha = 1;
      }
    }
    // the panel: see-through while we look inside, then blown off
    const pa = a * smA * (1 - .7 * seeIn) * (1 - panel);
    if (pa > 0) {
      ctx.save(); ctx.translate(ox + ow / 2 + panel * 10 * k, oy + oh / 2 - panel * 16 * k); ctx.rotate(-.6 * panel);
      ctx.globalAlpha = pa; ctx.fillStyle = HULL; ctx.fillRect(-ow / 2, -oh / 2, ow, oh);
      ctx.globalAlpha = pa * .5 * smLit; ctx.fillStyle = AMBER; ctx.fillRect(-ow / 2, -oh / 2, ow, oh);
      ctx.globalAlpha = pa; ctx.strokeStyle = PALE; ctx.lineWidth = Math.max(1, k * .2); ctx.strokeRect(-ow / 2, -oh / 2, ow, oh);
      ctx.restore(); ctx.globalAlpha = 1;
    }
  }
  // the crew: two of them move into Aquarius, then Swigert; all three back into Odyssey at the end
  const crewA = a * ramp(P, at('ship', .8), at('ship', .95));
  [[31, -3.5, .15, .45], [31, 3.5, .2, .5], [35, 0, .5, .8]].forEach(([u, v, f0, f1], i) => {
    const go = ramp(P, at('lifeboat', f0), at('lifeboat', f1)) - ramp(P, at('wake', .3 + i * .05), at('wake', .5 + i * .05));
    const lmU = [15, 15, 17][i], lmV = [-4, 4, 0][i];
    dot(X(lerp(u, lmU, go) + (go > .5 ? lmDx : 0)), Y(lerp(v, lmV, go)), Math.max(3, k * 1.3), PALE, crewA);
  });
  text('THE CREW', X(33), Y(-15), { size: 2.7, fill: PALE, align: 'center', a: crewA * win(P, at('ship', .85), at('ship', .95), at('tank', 0), at('tank', .1)) });

  named('AQUARIUS', 'the Moon lander', 12 + lmDx, -18, a * lmA0 * (1 - ramp(P, at('wake', .7), at('wake', .95))), roleA);
  named('ODYSSEY', 'comes home', 31, 19, cmA, roleA);
  named('SERVICE MODULE', 'power, oxygen, engine', 60 + smDx, 19, smA, roleA);

  // the oxygen gauge empties, then the power
  const gA = a * win(P, at('lost', 0), at('lost', .1), at('lifeboat', 0), at('lifeboat', .2));
  if (gA > 0) {
    const gx = X(47), gy = Y(-21), gw = 31 * k, gh = Math.max(6, 1.6 * k), lvl = 1 - ramp(P, at('lost', .1), at('lost', .75));
    text(lvl > .02 ? 'OXYGEN IN THE SERVICE MODULE' : 'OXYGEN: GONE · ELECTRICITY: NONE', gx, gy - fs(1.5), { size: 2.8, fill: lvl > .02 ? PALE : HOT, a: gA });
    ctx.globalAlpha = gA; ctx.strokeStyle = PALE; ctx.lineWidth = 1; ctx.strokeRect(gx, gy, gw, gh);
    ctx.fillStyle = lvl > .3 ? PALE : HOT; ctx.fillRect(gx, gy, gw * lvl, gh); ctx.globalAlpha = 1;
  }
  chip('BATTERIES: SAVED FOR THE LANDING', X(32), Y(26), { size: 2.9, align: 'center', fill: C.night, bg: AMBER, a: a * win(P, at('lost', .75), at('lost', .9), at('lifeboat', .1), at('lifeboat', .3)) });
  chip('THE LIFEBOAT', X(12), Y(26), { size: 2.9, align: 'center', fill: C.night, bg: AMBER, a: a * win(P, at('lifeboat', .4), at('lifeboat', .6), at('letgo', 0), at('letgo', .2)) });
  chip('THE DAMAGE, SEEN AT LAST', X(59 + smDx), Y(-21), { size: 2.9, align: 'center', fill: C.paper, bg: C.accent, a: a * win(P, at('letgo', .6), at('letgo', .8), at('wake', 0), at('wake', .15)) });
  chip('ODYSSEY, AWAKE', X(32), Y(26), { size: 2.9, align: 'center', fill: C.night, bg: AMBER, a: a * ramp(P, at('wake', .2), at('wake', .4)) });
  if (P > at('out', 0)) clockChip(P, a);
}

/* ---------- the route: Earth, the Moon and the path between (a drawing, not to scale) ---------- */
const bez = (p0, p1, p2, p3, n = 60) => Array.from({ length: n + 1 }, (_, i) => {
  const t = i / n, s = 1 - t;
  return [s * s * s * p0[0] + 3 * s * s * t * p1[0] + 3 * s * t * t * p2[0] + t * t * t * p3[0], s * s * s * p0[1] + 3 * s * s * t * p1[1] + 3 * s * t * t * p2[1] + t * t * t * p3[1]];
});
const MOON = [82, -4], MR_ = 3.4, ER = 7;
const OUT = bez([6, 3.5], [30, 13], [62, 8], [80.6, 1.2]);
const AROUND = Array.from({ length: 41 }, (_, i) => { const t = (1.75 - 3.5 * i / 40); return [MOON[0] + 5.4 * Math.cos(t), MOON[1] + 5.4 * Math.sin(t)]; });
const HOME = bez(AROUND[40], [60, -15], [26, -14], [5.2, -4.8]);
const PATH = [...OUT, ...AROUND.slice(1), ...HOME.slice(1)], CUM = [0];
for (let i = 1; i < PATH.length; i++) CUM.push(CUM[i - 1] + Math.hypot(PATH[i][0] - PATH[i - 1][0], PATH[i][1] - PATH[i - 1][1]));
const LEN = CUM[CUM.length - 1], U_OUT = CUM[OUT.length - 1] / LEN, U_AROUND = CUM[OUT.length + AROUND.length - 2] / LEN;
// where the ship is (a fraction of the whole path) at each hour: on the way out, around the Moon, home
const PLACES = [[0, 0], [55.9, .8 * U_OUT], [61.5, .87 * U_OUT], [77, (U_OUT + U_AROUND) / 2], [79.5, U_AROUND],
  [105.3, U_AROUND + .45 * (1 - U_AROUND)], [137.7, U_AROUND + .93 * (1 - U_AROUND)], [142.9, 1]];
function shipU(h) {
  for (let i = 1; i < PLACES.length; i++) if (h <= PLACES[i][0]) return lerp(PLACES[i - 1][1], PLACES[i][1], (h - PLACES[i - 1][0]) / (PLACES[i][0] - PLACES[i - 1][0]));
  return 1;
}
function pointAt(u) {
  const d = u * LEN; let i = 1;
  while (i < CUM.length - 1 && CUM[i] < d) i++;
  const t = (d - CUM[i - 1]) / (CUM[i] - CUM[i - 1] || 1);
  return [lerp(PATH[i - 1][0], PATH[i][0], t), lerp(PATH[i - 1][1], PATH[i][1], t)];
}
function strokeAlong(V, u0, u1, colour, width, alpha, dash) {
  if (alpha <= 0 || u1 <= u0) return;
  ctx.beginPath();
  let [x, y] = pointAt(u0); ctx.moveTo(V.sx(x), V.sy(y));
  for (let i = 0; i < PATH.length; i++) { const u = CUM[i] / LEN; if (u > u0 && u < u1) ctx.lineTo(V.sx(PATH[i][0]), V.sy(PATH[i][1])); }
  [x, y] = pointAt(u1); ctx.lineTo(V.sx(x), V.sy(y));
  ctx.globalAlpha = alpha; ctx.strokeStyle = colour; ctx.lineWidth = width; ctx.setLineDash(dash || []); ctx.lineCap = 'round'; ctx.stroke();
  ctx.setLineDash([]); ctx.globalAlpha = 1;
}
// a sphere lit from the left (the Sun's side in this drawing); the day/night line is its middle
function globe(x, y, r, day, night, a) {
  ctx.globalAlpha = a; ctx.fillStyle = night; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  ctx.fillStyle = day; ctx.beginPath(); ctx.arc(x, y, r, Math.PI / 2, Math.PI * 1.5); ctx.fill(); ctx.globalAlpha = 1;
}
const fitBox = (w, h) => Math.max(w / 2 * Math.min(cw, chh) / cw, h / 2 * Math.min(cw, chh) / chh);
function routeScene(P, a) {
  const V = view(full(), 42, -1.5, fitBox(108, 40)), px = Math.min(cw, chh) / 100;
  const h = hours(P), u = shipU(h);
  // Earth and the Moon
  globe(V.sx(0), V.sy(0), ER * V.s, '#3f78b0', '#13253d', a);
  globe(V.sx(MOON[0]), V.sy(MOON[1]), MR_ * V.s, '#c9c3b6', '#4a4a4c', a);
  text('EARTH', V.sx(0), V.sy(ER) + fs(4), { size: 2.8, fill: PALE, align: 'center', spacing: .1, a });
  text('MOON', V.sx(MOON[0]), V.sy(MOON[1] - 5.6) - fs(1.8), { size: 2.8, fill: PALE, align: 'center', spacing: .1, a });
  const term = a * win(P, at('aim', .05), at('aim', .25), at('aim', .55), at('aim', .7));   // the day/night line they steered by
  if (term > 0) {
    ctx.globalAlpha = term; ctx.strokeStyle = AMBER; ctx.lineWidth = Math.max(2, px * .6);
    ctx.beginPath(); ctx.moveTo(V.sx(0), V.sy(-ER)); ctx.lineTo(V.sx(0), V.sy(ER)); ctx.stroke(); ctx.globalAlpha = 1;
    chip('THE LINE BETWEEN DAY AND NIGHT', V.sx(0), V.sy(ER) + fs(9), { size: 2.9, align: 'left', fill: C.night, bg: AMBER, a: term });
  }
  // the planned path: into orbit around the Moon, then the landing (it goes once the plan is given up)
  const plan = a * (1 - ramp(P, at('back', .1), at('back', .4)));
  strokeAlong(V, u, U_OUT, PALE, px * .5, plan * .7, [px * 1.4, px * 1.2]);
  if (plan > 0) {
    ctx.globalAlpha = plan * .7; ctx.strokeStyle = PALE; ctx.lineWidth = px * .5; ctx.setLineDash([px * 1.4, px * 1.2]);
    ctx.beginPath(); ctx.arc(V.sx(MOON[0]), V.sy(MOON[1]), 5.6 * V.s, 0, 7); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
    chip('PLANNED: CIRCLE THE MOON, THEN LAND', V.sx(MOON[0]), V.sy(MOON[1] - 5.6) - fs(7), { size: 2.9, align: 'center', fill: PALE, bg: C.night, a: plan * ramp(P, at('out', .3), at('out', .5)) });
  }
  // the way home, once the first push has made it: dashed ahead of the ship
  const ahead = a * ramp(P, at('back', .3), at('back', .6));
  strokeAlong(V, u, 1, AMBER, px * .55, ahead * .8, [px * 1.4, px * 1.2]);
  // the way travelled
  strokeAlong(V, 0, u, AMBER, px * .8, a);
  // the pushes: a ring where each fired, its label in its own step
  const burn = (hh, key, label, dx, dy) => {
    const s = at(key, 0);
    if (P < s) return;
    const [bx, by] = pointAt(shipU(hh)), x = V.sx(bx), y = V.sy(by), on = ramp(P, s + .2, s + .35);
    ring(x, y, px * 1.6, AMBER, Math.max(1.5, px * .35), a * on);
    const fl = win(P, s + .2, s + .3, s + .4, s + .6);
    ring(x, y, px * (1.6 + 4 * fl), AMBER, 2, a * fl * .7);
    chip(label, x + fs(dx), y + fs(dy), { size: 2.9, align: dx < 0 ? 'right' : dx > 0 ? 'left' : 'center', fill: C.night, bg: AMBER, a: a * ramp(P, s + .3, s + .45) * (1 - ramp(P, s + 1, s + 1.15)) });
  };
  burn(61.5, 'back', 'PUSH 1 · 34 SECONDS', 0, 5);
  burn(79.5, 'faster', 'PUSH 2 · 4 MIN 24 S', -6, 3);
  burn(105.3, 'aim', 'HOUR 105 · 14 SECONDS', 0, -5);
  if (P >= at('aim', .5)) {   // the last small push, later in the same step
    const [bx, by] = pointAt(shipU(137.7)), on = ramp(P, at('aim', .75), at('aim', .88));
    ring(V.sx(bx), V.sy(by), px * 1.6, AMBER, Math.max(1.5, px * .35), a * on);
    chip('HOUR 137 · 21 SECONDS', V.sx(bx) + fs(2), V.sy(by) - fs(5), { size: 2.9, align: 'left', fill: C.night, bg: AMBER, a: a * on });
  }
  const pac = a * ramp(P, at('faster', .6), at('faster', .8));
  if (pac > 0) {
    chip('ABOUT 9 HOURS SOONER', cw - fs(3), fs(4.5), { size: 3, align: 'right', fill: C.night, bg: AMBER, a: pac * (1 - ramp(P, at('aim', 0), at('aim', .2))) });
    text('THE PACIFIC OCEAN', V.sx(0), V.sy(-ER) - fs(5.5), { size: 2.8, fill: AMBER, align: 'center', a: pac * (1 - ramp(P, at('aim', .05), at('aim', .2))) });
  }
  // the ship
  const [sx, sy] = pointAt(u);
  dot(V.sx(sx), V.sy(sy), Math.max(4, px * 1.1), AMBER, a); ring(V.sx(sx), V.sy(sy), Math.max(7, px * 2), AMBER, 1.5, a * .6);
  text('NOT TO SCALE', cw - fs(3), chh - fs(3), { size: 2.6, fill: DIM, align: 'right', spacing: .1, a });
  clockChip(P, a);
}

/* ---------- the filters: a square cartridge and a round holder ---------- */
function fitScene(P, a) {
  const k = Math.min(cw / 90, chh / 56), cx = cw / 2, cy = chh * .5;
  const lx = cx - 20 * k, rx = cx + 20 * k, slide = ramp(P, at('air', .45), at('air', .8)), sq = lerp(rx, lx, slide);
  const ra = a * ramp(P, at('air', .1), at('air', .25)), sa = a * ramp(P, at('air', .25), at('air', .4));
  ctx.globalAlpha = ra; ctx.fillStyle = HULL; ctx.beginPath(); ctx.arc(lx, cy, 11 * k, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
  ring(lx, cy, 11 * k, PALE, Math.max(2, k * .5), ra);
  text('AQUARIUS’S HOLDER', lx, cy + 17 * k, { size: 2.8, fill: PALE, align: 'center', a: ra });
  text('round', lx, cy + 17 * k + fs(3.6), { size: 2.9, font: SERF, weight: 400, fill: PALE, align: 'center', italic: true, a: ra });
  const mis = ramp(P, at('air', .75), at('air', .9));
  ctx.globalAlpha = sa * (1 - .25 * slide); ctx.fillStyle = PALE; ctx.fillRect(sq - 10 * k, cy - 10 * k, 20 * k, 20 * k);
  ctx.globalAlpha = sa; ctx.strokeStyle = mis > 0 ? HOT : PALE; ctx.lineWidth = Math.max(2, k * .5); ctx.strokeRect(sq - 10 * k, cy - 10 * k, 20 * k, 20 * k); ctx.globalAlpha = 1;
  ring(lx, cy, 11 * k, PALE, Math.max(2, k * .5), ra * slide);
  text('ODYSSEY’S SPARES', rx, cy - 15 * k, { size: 2.8, fill: PALE, align: 'center', a: sa * (1 - slide) });
  text('square', rx, cy - 15 * k + fs(3.6), { size: 2.9, font: SERF, weight: 400, fill: PALE, align: 'center', italic: true, a: sa * (1 - slide) });
  chip('THEY DO NOT FIT', lx, cy - 16 * k, { size: 3, align: 'center', fill: C.paper, bg: C.accent, a: a * mis });
  text('CARBON DIOXIDE FILTERS', cx, fs(9), { size: 3, fill: PALE, align: 'center', spacing: .1, a: ra });
}

/* ---------- Aquarius's batteries: 2,179 amp-hours at power-up, 410 when it was let go (MR §7.2.5);
   the points between are read by eye from the report's Fig. 7.2-2, ±100 Ah ---------- */
const CHARGE = [[58, 2179], [60, 2100], [70, 1800], [80, 1530], [90, 1380], [100, 1260], [110, 1120], [120, 950], [130, 780], [135, 660], [140, 450], [141.5, 410]];
function chartScene(P, a) {
  const wide = cw > chh, x0 = cw * (wide ? .14 : .16), x1 = cw * (wide ? .9 : .88), y0 = chh * .26, y1 = chh * .8;
  const X = h => lerp(x0, x1, (h - 55) / 90), Y = v => lerp(y1, y0, v / 2200);
  text('AQUARIUS’S BATTERIES', x0, chh * .1, { size: 3.4, fill: PALE, spacing: .08, a });
  text('charge left, in amp-hours', x0, chh * .1 + fs(4.4), { size: 2.9, font: SERF, weight: 400, italic: true, fill: PALE, a });
  ctx.globalAlpha = a * .35; ctx.strokeStyle = PALE; ctx.lineWidth = 1; ctx.beginPath();
  for (const v of [0, 1000, 2000]) { ctx.moveTo(x0, Y(v)); ctx.lineTo(x1, Y(v)); }
  ctx.stroke(); ctx.globalAlpha = 1;
  for (const v of [0, 1000, 2000]) text(v.toLocaleString('en'), x0 - fs(1.2), Y(v) + fs(1), { size: 2.6, fill: PALE, align: 'right', a });
  for (const hh of [60, 80, 100, 120, 140]) text(String(hh), X(hh), y1 + fs(4), { size: 2.6, fill: PALE, align: 'center', a });
  text('HOURS AFTER LAUNCH', (x0 + x1) / 2, y1 + fs(8.5), { size: 2.6, fill: DIM, align: 'center', spacing: .1, a });
  // the line, drawn as the step plays
  const reach = lerp(58, 141.5, ramp(P, at('cold', .1), at('cold', .8)));
  ctx.globalAlpha = a; ctx.strokeStyle = AMBER; ctx.lineWidth = Math.max(2.5, fs(.7)); ctx.lineJoin = 'round'; ctx.beginPath();
  for (let i = 0; i < CHARGE.length; i++) {
    const [h, v] = CHARGE[i];
    if (h > reach) { const [h0, v0] = CHARGE[i - 1]; ctx.lineTo(X(reach), Y(lerp(v0, v, (reach - h0) / (h - h0)))); break; }
    (i ? ctx.lineTo : ctx.moveTo).call(ctx, X(h), Y(v));
  }
  ctx.stroke(); ctx.globalAlpha = 1;
  for (const [h, v] of CHARGE) if (h <= reach) dot(X(h), Y(v), Math.max(2.5, fs(.6)), AMBER, a);
  chip('2,179 · FULL', X(58) + fs(1.5), Y(2179) - fs(3.5), { size: 2.9, fill: C.night, bg: AMBER, a: a * ramp(P, at('cold', .1), at('cold', .2)) });
  chip('410 · ABOUT A FIFTH', X(141.5), Y(410) - fs(4.5), { size: 2.9, align: 'right', fill: C.night, bg: AMBER, a: a * ramp(P, at('cold', .8), at('cold', .9)) });
  text('read by eye from NASA’s chart', x1, y0 - fs(2), { size: 2.4, font: SERF, weight: 400, italic: true, fill: DIM, align: 'right', a });
}

/* ---------- the end: the crew and Mission Control together ---------- */
function teamScene(P, a) {
  const wide = cw > chh * 1.4, g = fs(1);   // side by side on a wide canvas, stacked on a tall one
  const A = wide ? { x: 0, y: 0, w: cw / 2 - g, h: chh } : { x: 0, y: 0, w: cw, h: chh / 2 - g };
  const B = wide ? { x: cw / 2 + g, y: 0, w: cw / 2 - g, h: chh } : { x: 0, y: chh / 2 + g, w: cw, h: chh / 2 - g };
  const ca = a, ma = a * ramp(P, at('team', .25), at('team', .45));
  ctx.save(); ctx.beginPath(); ctx.rect(A.x, A.y, A.w, A.h); ctx.clip(); shown(IMG.crew, A, ca, .5, .35, .9); ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.rect(B.x, B.y, B.w, B.h); ctx.clip(); cover(IMG['mission-control'], B, ma, .55, .5); ctx.restore();
  chip('THE CREW', A.x + fs(3), A.y + A.h - fs(4), { size: 2.7, a: ca });
  chip('MISSION CONTROL, HOUSTON', B.x + fs(3), B.y + B.h - fs(4), { size: 2.7, a: ma });
}

/* ---------- the order of scenes: each starts at its step and covers the scene before it ---------- */
const SCENES = [
  ['launch', photo('launch', .5, .4, ['11 APRIL 1970', 'KENNEDY SPACE CENTER, FLORIDA'])],
  ['crew', photo('crew', .5, .35, ['THE CREW, THE DAY BEFORE LAUNCH'], .9)],
  ['ship', shipScene],
  ['out', routeScene],
  ['tank', shipScene],
  ['call', photo('damaged-sm', .5, .5, ['THE SERVICE MODULE, PHOTOGRAPHED', 'THREE DAYS LATER, AS THE CREW LET IT GO'])],
  ['lost', shipScene],
  ['back', routeScene],
  ['farside', photo('moon-far-side', .5, .5, ['THE FAR SIDE OF THE MOON,', 'PHOTOGRAPHED BY THE CREW'])],
  ['faster', routeScene],
  ['air', fitScene],
  ['prototype', photo('mailbox-ground', .55, .5, ['HOUSTON: DEKE SLAYTON HOLDS UP', 'THE ADAPTER THE ENGINEERS MADE'])],
  ['mailbox', photo('mailbox-aquarius', .45, .5, ['ON BOARD AQUARIUS: HOSES TO THE MAILBOX', 'BEHIND THEM. JACK SWIGERT, RIGHT'])],
  ['aim', routeScene],
  ['cold', chartScene],
  ['letgo', shipScene],
  ['splash', photo('splashdown', .46, .5, ['17 APRIL 1970: SPLASHDOWN', 'IN THE SOUTH PACIFIC OCEAN'])],
  ['team', teamScene],
];

scrollStory(P => {
  SCENES.forEach(([key, draw], i) => {
    const s = at(key, 0), next = i + 1 < SCENES.length ? at(SCENES[i + 1][0], .3) : Infinity;
    if (P > next || (i && P < s)) return;
    const a = i ? ramp(P, s, s + .25) : 1;
    veil(C.night, a);
    draw(P, a);
  });
});
