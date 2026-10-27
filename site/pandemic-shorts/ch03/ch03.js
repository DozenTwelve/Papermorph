/* ch03.js: The World Stops' own pieces, loaded after pandemic.js and stay.js.
   hatchMap(p, D, view, hatch, { on })   ink hatching over paperMap() on the same view(t): hatch(iso, t) > 0 for each country
                                         with a stay-at-home order (red is the virus, so orders are ink, as in the film);
                                         redrawn only when the view or the set changes: keep view(t) still, move a wrapper
   stayOn(iso, day) · stayWeek(iso, i)   the orders from stay.js: in force by day 'YYYY-MM-DD' / in week i from WEEK0
   crop(g, name, [sx, sy, sw, sh], x, y, w, h)   part of a picture (source px) drawn into the box x, y, w, h */
'use strict';
const stayOn = (iso, day) => !!STAY[iso] && STAY[iso][0] <= day;
const stayWeek = (iso, i) => !!STAY[iso] && STAY[iso][1][i] === '1';
const dayAt = (d0, d1, q) => new Date(Date.parse(d0) + Math.round((Date.parse(d1) - Date.parse(d0)) / 864e5 * q) * 864e5).toISOString().slice(0, 10);
const dayFmt = d => new Date(d + 'T12:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).toUpperCase();

// the projection is paperMap's (pandemic.js): one canvas more, drawing only the hatched countries
function hatchMap(p, D, view, hatch, { on } = {}) {
  const geo = geoData(), g = G(p, {}), fo = mk('foreignObject', { x: 0, y: 0, width: W, height: H }, g);
  const cv = document.createElement('canvas'); cv.width = W * PX; cv.height = H * PX;
  cv.style.cssText = `width:${W}px;height:${H}px;display:block`;
  fo.appendChild(cv);
  const ctx = cv.getContext('2d');
  const tile = document.createElement('canvas'); tile.width = tile.height = 12;
  const tc = tile.getContext('2d'); tc.strokeStyle = MAPINK; tc.lineWidth = 2.6;
  tc.beginPath(); tc.moveTo(-3, 15); tc.lineTo(15, -3); tc.moveTo(-3, 3); tc.lineTo(3, -3); tc.moveTo(9, 15); tc.lineTo(15, 9); tc.stroke();
  const pat = ctx.createPattern(tile, 'repeat');
  const ring = (r, v) => {
    for (let i = 0; i < r.n; i++) {
      const dl = r.lam[i] - v.l0, cdl = Math.cos(dl), cp = r.cphi[i], sp = r.sphi[i];
      let x = cp * Math.sin(dl), y = v.cf0 * sp - v.sf0 * cp * cdl;
      if (v.sf0 * sp + v.cf0 * cp * cdl < 0) { const l = Math.hypot(x, y) || 1; x /= l; y /= l; }
      i ? ctx.lineTo(v.cx + v.k * x, v.cy - v.k * y) : ctx.moveTo(v.cx + v.k * x, v.cy - v.k * y);
    }
    ctx.closePath();
  };
  const L = geo.lod[0], keys = Object.keys(L);
  let drawn = null;   // what is on the canvas: redrawn only when the view or the hatched set changes (Firefox)
  clockRun(t => {
    const s = { lon: 0, lat: 0, H: 1.15, ...view(t) }, live = !on || (t >= on[0] && t <= on[1]);
    const sig = live ? JSON.stringify(s) + keys.map(c => hatch(c, t) > 0 ? 1 : 0).join('') : '';
    if (sig === drawn) return;
    drawn = sig;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
    if (!live) return;
    const f0 = s.lat * DEG;
    const v = { l0: s.lon * DEG, sf0: Math.sin(f0), cf0: Math.cos(f0), k: 450 / s.H, cx: W / 2 + (s.dx || 0), cy: H / 2 + (s.dy || 0) };
    ctx.setTransform(PX, 0, 0, PX, 0, 0);
    ctx.beginPath(); ctx.arc(v.cx, v.cy, v.k, 0, 2 * Math.PI); ctx.save(); ctx.clip();
    for (const c of keys) {
      const a = hatch(c, t) > 0 ? 1 : 0; if (!a) continue;
      ctx.beginPath(); for (const r of L[c]) ring(r, v);
      ctx.globalAlpha = a * .7; ctx.fillStyle = pat; ctx.fill(); ctx.globalAlpha = a * .12; ctx.fillStyle = MAPINK; ctx.fill();
    }
    ctx.globalAlpha = 1; ctx.restore();
  }, D, { tail: true });
  return g;
}

function crop(g, name, [sx, sy, sw, sh], x, y, w, h) {
  const [iw, ih] = ART[name], sv = mk('svg', { x, y, width: w, height: h, viewBox: `${sx} ${sy} ${sw} ${sh}`, preserveAspectRatio: 'xMidYMid slice' }, g);
  mk('image', { href: `../img/${name}.webp`, x: 0, y: 0, width: iw, height: ih }, sv);
  return sv;
}
