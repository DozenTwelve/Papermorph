// prep.mjs: the scroll page's map data, cut down from the film's (../../pandemic/img/geo*.js, spread, waves, quiet).
// Run from the repository root: node site/pandemic-scroll/making/prep.mjs. Writes site/pandemic-scroll/lib/data.js.
// Paths are simplified (Douglas-Peucker, tolerance in each map's own px) so a phone downloads ~0.5 MB, not 7.5.
import fs from 'node:fs';
import vm from 'node:vm';

const SRC = 'site/pandemic/img/', OUT = 'site/pandemic-scroll/lib/data.js';
const ctx = {};
vm.createContext(ctx);
for (const f of ['geo', 'geo-eu', 'geo-world', 'spread', 'waves', 'quiet']) vm.runInContext(fs.readFileSync(SRC + f + '.js', 'utf8').replace(/^const /mg, 'var '), ctx);
const { GEO, GEO_IT, GEO_W, SPREAD, WAVES, QUIET } = ctx;

function dp(pts, tol) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const st = [[0, pts.length - 1]];
  while (st.length) {
    const [a, b] = st.pop(), [ax, ay] = pts[a], [bx, by] = pts[b], dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1;
    let mi = -1, md = tol;
    for (let i = a + 1; i < b; i++) {
      const d = L > 1e-9 ? Math.abs((pts[i][0] - ax) * dy - (pts[i][1] - ay) * dx) / L : Math.hypot(pts[i][0] - ax, pts[i][1] - ay);
      if (d > md) { md = d; mi = i; }
    }
    if (mi > 0) { keep[mi] = 1; st.push([a, mi], [mi, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}
// an M/L/Z path to a simplified one; rings smaller than the tolerance go
// box [x0, y0, x1, y1]: only rings that reach into it (the rest of the world is never on screen)
function simp(d, tol, box = null, digits = tol >= 1 ? 0 : 1) {
  if (!d) return '';
  const out = [];
  for (const part of d.split('M').filter(Boolean)) {
    const closed = /Z\s*$/.test(part);
    const pts = part.replace(/Z/g, '').split('L').map(s => s.split(',').map(Number));
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    if (box && (Math.max(...xs) < box[0] || Math.min(...xs) > box[2] || Math.max(...ys) < box[1] || Math.min(...ys) > box[3])) continue;
    if (closed && Math.max(...xs) - Math.min(...xs) < tol * 2 && Math.max(...ys) - Math.min(...ys) < tol * 2) continue;
    const s = dp(pts, tol);
    if (s.length < (closed ? 3 : 2)) continue;
    out.push('M' + s.map(p => p.map(v => +v.toFixed(digits)).join(',')).join('L') + (closed ? 'Z' : ''));
  }
  return out.join('');
}
const r1 = a => a.map(v => +v.toFixed(1));

// China: an orthographic view centred on Wuhan, Earth radius 2000 px (the film's GEO)
const CN = {
  land: simp(GEO.land, 2, [-1800, -1300, 1500, 1100]), china: simp(GEO.china, .6), provs: Object.values(GEO.provinces).map(d => simp(d, 1.2)).join(''),
  hubei: simp(GEO.provinces.Hubei, .3), rails: GEO.rails.map(d => simp(d, .8)).join(''),
  rivers: simp(GEO.rivers10, .5), lakes: simp(GEO.lakes, .15), urban: simp(GEO.urban, .1, [-60, -45, 60, 45]),
  cities: Object.fromEntries(Object.entries(GEO.cities).map(([k, v]) => [k, r1(v)])),
};
// Italy: centred on Codogno, radius 2000 px; Lombardy's provinces in one path
const lomb = Object.values(GEO_IT.provinces).filter(p => p[0] === 'Lombardia').map(p => simp(p[1], .15)).join('');
const IT = {
  land: simp(GEO_IT.land, 1, [-900, -700, 900, 800]), ita: simp(GEO_IT.countries.ITA, .3), lomb,
  provs: Object.values(GEO_IT.provinces).map(p => simp(p[1], .6)).join(''),
  cities: Object.fromEntries(Object.entries(GEO_IT.cities).map(([k, v]) => [k, r1(v)])),
};
// the world: Natural Earth projection, 3200 x 1600 px centred on 0, 0 (the film's GEO_W). Each country:
// [d, stay-home bits a week from W.weeks[0], deaths-per-million level a week (0-9) from W.dweeks[0], cx, cy]
const W = {
  weeks: GEO_W.weeks, dweeks: GEO_W.dweeks, pins: GEO_W.pins, wuhan: GEO_W.wuhan,   countries: Object.fromEntries(Object.entries(GEO_W.countries).map(([k, c]) => [k, [simp(c[0], 1.2), c[2] || '', c[3] || '', ...r1(c[4] || [0, 0])]])),
};
// lon/lat to world px: d3's Natural Earth 1, scaled and shifted to land Wuhan and New York where the film's pins are
const ne = ([lon, lat]) => {
  const l = lon * Math.PI / 180, f = lat * Math.PI / 180, f2 = f * f, f4 = f2 * f2;
  return [l * (0.8707 - 0.131979 * f2 + f4 * (-0.013791 + f4 * (0.003971 * f2 - 0.001529 * f4))),
    f * (1.007226 + f2 * (0.015085 + f4 * (-0.044475 + 0.028874 * f2 - 0.005916 * f4)))];
};
const a = ne([114.305, 30.593]), b = ne([-74.006, 40.713]), A = GEO_W.wuhan, B = GEO_W.pins.nyc;
const k = (A[0] - B[0]) / (a[0] - b[0]), tx = A[0] - k * a[0], ty = A[1] + k * a[1];
W.ne = [+k.toFixed(3), +tx.toFixed(2), +ty.toFixed(2)];
const yErr = Math.abs(ty - k * b[1] - B[1]);
if (yErr > 3) console.warn(`Natural Earth fit is off by ${yErr.toFixed(1)} px at New York: check the projection`);
const xy = ll => { const p = ne(ll); return [+(k * p[0] + tx).toFixed(1), +(ty - k * p[1]).toFixed(1)]; };
// places drawn on one map that another map must meet at the hand-over: their px on each, and how many world px one
// map px is there (the maps differ in projection and scale)
const ortho = (geo, [lon, lat]) => {
  const r = Math.PI / 180, dl = (lon - geo.center[0]) * r, f = lat * r, f0 = geo.center[1] * r;
  return [+(geo.R * Math.cos(f) * Math.sin(dl)).toFixed(2), +(-geo.R * (Math.cos(f0) * Math.sin(f) - Math.sin(f0) * Math.cos(f) * Math.cos(dl))).toFixed(2)];
};
const per = (geo, ll) => { const a = xy(ll), b = xy([ll[0] + 1, ll[1]]), c = ortho(geo, ll), d = ortho(geo, [ll[0] + 1, ll[1]]); return +(Math.hypot(b[0] - a[0], b[1] - a[1]) / Math.hypot(d[0] - c[0], d[1] - c[1])).toFixed(4); };
CN.market = ortho(GEO, [114.2576, 30.6196]); CN.wiv = ortho(GEO, [114.2625, 30.3764]);
W.cn = per(GEO, [114.305, 30.593]); W.it = per(GEO_IT, [9.7046, 45.16]); W.codogno = xy([9.7046, 45.16]);
const spread = SPREAD.map(([n, lon, lat, d]) => [n, ...xy([lon, lat]), d]);

const js = `// generated by making/prep.mjs from the film's data (Natural Earth, public domain; Our World in Data, CC BY 4.0)
const CN = ${JSON.stringify(CN)};
const IT = ${JSON.stringify(IT)};
const W = ${JSON.stringify(W)};
const SPREAD = ${JSON.stringify(spread)};
const WAVES = ${JSON.stringify(WAVES)};
const QUIET = ${JSON.stringify(QUIET)};
`;
fs.writeFileSync(OUT, js);
console.log(`${OUT}: ${(js.length / 1024).toFixed(0)} KB (y fit ${yErr.toFixed(2)} px)`,
  Object.fromEntries(Object.entries({ CN, IT, W }).map(([n, o]) => [n, (JSON.stringify(o).length / 1024).toFixed(0) + ' KB'])));
