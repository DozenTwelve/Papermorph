/* map.js: the map kit, a paper map and a night globe on one view, for an upright short (900 x 1600) and a landscape
   documentary (1600 x 900) alike: the stage is the engine's SW x SH. Pure functions of the beat clock, like the kits.
   Loaded after engine.js and ../img/geo-lite.js (geo.py), before the chapter; the globe (lib/globe.js, three.js in
   lib/vendor/ and img/night.webp, also from geo.py --globe) loads with loadGlobe(). Works beside shorts.js or film.js;
   it uses only the engine's helpers and its own colours.

   A view is { lon, lat, H, dx, dy, roll }: the point at the stage centre, the Earth's radius as 450 / H stage px (1.15
   the whole world, .42 China, .1 a country like Italy, .02 a province, .003 a city), the frame shifted by dx, dy px,
   turned clockwise by roll degrees. The globe and the paper map take the same view(t), so a shot hands over from one to
   the other without a jump: put both in the shot, fade the map's group in over a few tenths, and give each an `on`.

   paperMap(p, D, view, opts) -> M     the paper map in this panel; opts, all optional:
     lit(iso, t) -> 0..1                a country lit (iso as in geo-lite.js: ISO 3166 alpha-3, 'CHN', 'ITA', 'ATA')
     litFill: MAP_COL.hot               the fill of lit and region: a colour, or (key) => colour to mix several
     region(name, t, iso) -> 0..1       a region lit ('Hubei', 'Lombardia': geo.py --regions CHN,ITA:region)
     regions: true | ['CHN']            draw the borders of every region in the data (true) or of these countries'
     hatch(key, t) -> 0..1              ink hatching over a country (iso) or a region (name): an order, a lockdown, what
                                        is not the colour of the film's subject
     areas: [[shape, at, style]]        an area of your own: shape an iso ('ITA'), 'ITA/Lombardia', or rings of
                                        [lon, lat] (mapCircle(ll, km) is one); at a time (shown over .35 s) or (t) -> 0..1;
                                        style { fill: 'hatch' | colour | null, line: MAP_COL.ink | null, width: 3 }
     detail: 'Wuhan' | true             rivers, lakes and built-up areas of a place cut by geo.py --detail, faded in as
                                        the view closes in (H .22 to .06) and drawn under the marks
     dots: [[lon, lat, t0, r = 7]]      dots in MAP_COL.hot popping in at t0, r px
     routes: [[[lon, lat], [lon, lat], t0, dur = .8]]   an arc drawn from a to b; a dot lands at b when it arrives
     cities: [[name, t0, side]]         an ink dot and a label (CITIES; side 'l' or 'r', default 'r'); labels keep
                                        inside the safe box and hide when their city is off it
     labelSize: 36 · safe: [x0, y0, x1, y1] (the shorts' 50,150,810,1290 upright; 60,60,SW-60,SH-230 landscape)
     on: [t0, t1]                       drawn only then. Default: the shot's window when p is a shorts shot(), else the
                                        whole beat. A layer that is covered (the globe after the hand-over, a map under
                                        a later shot) must not be drawn: Firefox pays for every drawn canvas
     bg: MAP_COL.night | null           the ground around the disc (null: transparent) · px: 1 canvas px per stage px
   M = { g, view(t), xy(ll, t) -> [x, y] stage px or null behind the globe }: draw your own marks above M.g with M.xy.
   The map redraws only when something on it changes: a view that holds still with nothing popping costs nothing a
   frame, and its projected shapes are kept while the view holds. Labels, dots and routes may start at any time.
   Move a map through its view(t), never by scaling a group above it: Gecko re-rasters a canvas under a scaled parent.

   globeShot(p, D, view, dotsOn, arcsOn, { on })   the night globe here (one WebGL canvas for the whole film, moved into
                                        each beat); marks from Globe.clearMarks() / Globe.dot(lon, lat) / Globe.arc(a, b);
                                        dotsOn(i, t), arcsOn(i, t) -> 0..1; the view may add gain (city lights, 1.6) and
                                        dotScale. on as for paperMap
   loadGlobe() -> Promise               loads lib/globe.js and its texture: loadGlobe().then(startShorts) (or boot)
   mapXY(ll, v) -> [x, y] | null       a lon/lat to stage px for a view (globe and map alike), null on the far side
   mapKeys([[t, lon, lat, H, dx, dy]...], ease = io) -> view(t)   a camera through keys, eased between them, the first
                                        held from 0 and the last after; lon takes the short way round, H changes evenly
   mapRings(key) -> [[lon, lat]...][]   a country's ('ITA') or region's ('ITA/Lombardia') outline, for areas or SVG
   mapCircle([lon, lat], km) -> ring    a circle on the ground, for areas
   CITIES {name: [lon, lat]}            from geo-lite.js (capitals, big cities, geo.py --cities)
   MAP_COL                              land, sea, ink, line, night, hot (marks; book.css --red), mark, urban, river:
                                        each from book.css --map-<name> when set (--map-land: #ece3cd) */
'use strict';
const { paperMap, globeShot, loadGlobe, mapXY, mapKeys, mapRings, mapCircle, CITIES, MAP_COL } = (() => {
  const DEG = Math.PI / 180, R0 = Math.min(SW, SH) / 2;   // the Earth's radius at H = 1, in stage px
  const X = document.createElement('canvas').getContext('2d');
  const css = (k, d) => { X.fillStyle = d; X.fillStyle = bookSetting(k) || d; return X.fillStyle; };
  const MAP_COL = { land: css('--map-land', '#ece3cd'), sea: css('--map-sea', '#bfcac6'), ink: css('--map-ink', '#2b2520'),
    line: css('--map-line', '#9a8a70'), night: css('--map-night', '#04060a'), hot: css('--map-hot', css('--red', '#c8281e')),
    mark: css('--map-mark', css('--mark', '#f4c430')), urban: css('--map-urban', '#cdb995'), river: css('--map-river', '#8fa9ad') };
  const FONT = bookSetting('--map-font') || '"Oswald", "Arial Narrow", sans-serif';
  const PORTRAIT = SH > SW, SAFE = PORTRAIT ? [50, 150, 810, 1290] : [60, 60, SW - 60, SH - 230];
  const clamp01 = v => Math.min(1, Math.max(0, v)), ramp = (t, a, b) => clamp01((t - a) / (b - a));
  const within = (t, on) => !on || (t >= on[0] && t <= on[1]);
  // a shorts shot() records its window on its group: the default `on` of a map or globe inside it
  const shotOn = p => { for (let e = p; e && e.nodeType === 1; e = e.parentNode) if (e._on) return e._on; };

  /* ---------- data ---------- */
  const unpack = (rs, q = 100) => rs.map(r => {   // delta integers -> {lam, cphi, sphi, c: centre unit vector, rad}
    const n = r.length / 2, lam = new Float32Array(n), cphi = new Float32Array(n), sphi = new Float32Array(n);
    let x = 0, y = 0, cx = 0, cy = 0, cz = 0;
    for (let i = 0; i < n; i++) {
      x += r[2 * i]; y += r[2 * i + 1];
      lam[i] = x / q * DEG; const f = y / q * DEG; cphi[i] = Math.cos(f); sphi[i] = Math.sin(f);
      cx += cphi[i] * Math.cos(lam[i]); cy += cphi[i] * Math.sin(lam[i]); cz += sphi[i];
    }
    const l = Math.hypot(cx, cy, cz) || 1; cx /= l; cy /= l; cz /= l;
    let rad = 0;
    for (let i = 0; i < n; i++) rad = Math.max(rad, Math.acos(Math.min(1, cphi[i] * Math.cos(lam[i]) * cx + cphi[i] * Math.sin(lam[i]) * cy + sphi[i] * cz)));
    return { n, lam, cphi, sphi, c: [cx, cy, cz], rad };
  });
  const GL = window.GEO_LITE || { lod: [{}, {}], cities: {} };
  if (!window.GEO_LITE) console.error('map.js: no GEO_LITE; load ../img/geo-lite.js (made by geo.py) before map.js');
  const each = (o, f) => Object.fromEntries(Object.entries(o || {}).map(([k, v]) => [k, f(v)]));
  let DATA;
  const data = () => DATA || (DATA = {
    lod: GL.lod.map(L => each(L, rs => unpack(rs))),
    regions: each(GL.regions, R => each(R, rs => unpack(rs))),
    detail: each(GL.detail, d => ({ lakes: unpack(d.lakes, 1e4), urban: unpack(d.urban, 1e4), rivers: unpack(d.rivers, 1e4) })),
  });
  const decode = (rs, q = 100) => rs.map(r => { const o = []; let x = 0, y = 0; for (let i = 0; i < r.length; i += 2) { x += r[i]; y += r[i + 1]; o.push([x / q, y / q]); } return o; });
  const rawShape = key => { const [c, n] = key.split('/'); return n ? GL.regions?.[c]?.[n] : GL.lod[1][c] || GL.lod[0][c]; };
  function mapRings(key) {
    const rs = rawShape(key);
    if (!rs) throw new Error(`mapRings: no ${key} in geo-lite.js`);
    return decode(rs);
  }
  const mapCircle = ([lon, lat], km) => [...Array(48)].map((_, i) => { const a = i / 48 * 2 * Math.PI; return [lon + km / 111.2 / Math.cos(lat * DEG) * Math.cos(a), lat + km / 111.2 * Math.sin(a)]; });
  // lon/lat rings given by hand, packed like the data so they project the same way
  const pack = rings => unpack((typeof rings[0][0] === 'number' ? [rings] : rings).map(r => {
    const o = []; let px = 0, py = 0; for (const [x, y] of r) { const qx = Math.round(x * 1e4), qy = Math.round(y * 1e4); o.push(qx - px, qy - py); px = qx; py = qy; } return o; }), 1e4);

  /* ---------- views ---------- */
  function mapXY([lon, lat], v) {
    const k = R0 / v.H, dl = (lon - v.lon) * DEG, f = lat * DEG, f0 = v.lat * DEG;
    if (Math.sin(f0) * Math.sin(f) + Math.cos(f0) * Math.cos(f) * Math.cos(dl) < 0) return null;
    let x = Math.cos(f) * Math.sin(dl), y = Math.cos(f0) * Math.sin(f) - Math.sin(f0) * Math.cos(f) * Math.cos(dl);
    if (v.roll) { const c = Math.cos(v.roll * DEG), s = Math.sin(v.roll * DEG); [x, y] = [x * c + y * s, y * c - x * s]; }
    return [SW / 2 + (v.dx || 0) + k * x, SH / 2 + (v.dy || 0) - k * y];
  }
  function mapKeys(K, ease = io) {
    return t => {
      let i = 0; while (i < K.length - 2 && t > K[i + 1][0]) i++;
      const [t0, l0, f0, h0, x0 = 0, y0 = 0] = K[i], [t1, l1, f1, h1, x1 = 0, y1 = 0] = K[Math.min(i + 1, K.length - 1)];
      const q = t1 > t0 ? ease(ramp(t, t0, t1)) : 1, dl = ((l1 - l0) % 360 + 540) % 360 - 180;   // the short way round
      return { lon: l0 + dl * q, lat: f0 + (f1 - f0) * q, H: h0 * (h1 / h0) ** q, dx: x0 + (x1 - x0) * q, dy: y0 + (y1 - y0) * q };
    };
  }

  /* ---------- the paper map ---------- */
  // a colour with a paper grain multiplied in, as a pattern fixed to the canvas: baked once, free every frame (a grain
  // blended over the whole canvas each frame cost Firefox 7 ms)
  const GRAIN = {};
  let NOISE;
  function grained(ctx, colour) {
    if (!NOISE) {
      NOISE = document.createElement('canvas'); NOISE.width = NOISE.height = 256;
      const x = NOISE.getContext('2d'), im = x.createImageData(256, 256);
      let s = 11; const R = () => (s = (s * 16807) % 2147483647) / 2147483647;
      for (let i = 0; i < im.data.length; i += 4) { const v = 255 - R() * R() * 70; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
      x.putImageData(im, 0, 0);
    }
    if (!GRAIN[colour]) {
      const c = document.createElement('canvas'); c.width = c.height = 256;
      const x = c.getContext('2d'); x.fillStyle = colour; x.fillRect(0, 0, 256, 256);
      x.globalCompositeOperation = 'multiply'; x.globalAlpha = .5; x.drawImage(NOISE, 0, 0);
      GRAIN[colour] = c;
    }
    return ctx.createPattern(GRAIN[colour], 'repeat');
  }
  function hatchPattern(ctx) {
    const tile = document.createElement('canvas'); tile.width = tile.height = 12;
    const tc = tile.getContext('2d'); tc.strokeStyle = MAP_COL.ink; tc.lineWidth = 2.6;
    tc.beginPath(); tc.moveTo(-3, 15); tc.lineTo(15, -3); tc.moveTo(-3, 3); tc.lineTo(3, -3); tc.moveTo(9, 15); tc.lineTo(15, 9); tc.stroke();
    return ctx.createPattern(tile, 'repeat');
  }
  const measure = (str, size) => { X.font = `600 ${size}px ${FONT}`; return X.measureText(str).width; };
  const backEase = typeof back === 'function' ? back : out;

  function paperMap(p, D, view, { lit, litFill, region, regions = false, hatch, areas = [], detail, dots = [], routes = [],
    cities = [], labelSize = 36, safe = SAFE, on = shotOn(p), bg = MAP_COL.night, px = 1 } = {}) {
    const fillOf = typeof litFill === 'function' ? litFill : () => litFill || MAP_COL.hot;
    const geo = data();
    const g = G(p, {}), fo = mk('foreignObject', { x: 0, y: 0, width: SW, height: SH }, g);
    const cv = document.createElement('canvas'); cv.width = SW * px; cv.height = SH * px;
    cv.style.cssText = `width:${SW}px;height:${SH}px;display:block`;
    fo.appendChild(cv);
    const ctx = cv.getContext('2d'), land = grained(ctx, MAP_COL.land), sea = grained(ctx, MAP_COL.sea), hatchFill = hatchPattern(ctx);
    const lab = G(g, {});
    const labels = cities.map(([name, t0, side = 'r']) => {
      if (!CITIES[name]) throw new Error(`paperMap: no city ${name} in geo-lite.js (geo.py --cities)`);
      const e = G(lab, { o: 0 }), w = measure(name.toUpperCase(), labelSize);
      const tx = T(e, name.toUpperCase(), { x: 0, y: 0, size: labelSize, fill: MAP_COL.ink, font: FONT, weight: 600, anchor: 'start' });
      tx.setAttribute('stroke', MAP_COL.land); tx.setAttribute('stroke-width', labelSize / 5); tx.setAttribute('paint-order', 'stroke'); tx.setAttribute('stroke-linejoin', 'round');
      return { e, ll: CITIES[name], t0, side, w };
    });
    const rkeys = regions === true ? Object.keys(geo.regions) : regions || [];
    const regionSets = Object.entries(geo.regions).flatMap(([c, R]) => Object.entries(R).map(([n, rs]) => ({ c, n, rs })));
    const AREAS = areas.map(([shape, at, style = {}]) => {
      const rs = typeof shape === 'string'
        ? (shape.includes('/') ? geo.regions[shape.split('/')[0]]?.[shape.split('/')[1]] : geo.lod[1][shape] || geo.lod[0][shape]) : pack(shape);
      if (!rs) throw new Error(`paperMap: no area ${shape} in geo-lite.js`);
      return { rs, a: typeof at === 'function' ? at : t => ramp(t, at, at + .35), fill: 'fill' in style ? style.fill : 'hatch',
        line: 'line' in style ? style.line : MAP_COL.ink, width: style.width ?? 3 };
    });
    const details = detail === true ? Object.values(geo.detail) : detail ? [geo.detail[detail]] : [];
    if (details.some(d => !d)) throw new Error(`paperMap: no detail ${detail} in geo-lite.js (geo.py --detail)`);
    const vf = t => ({ lon: 0, lat: 0, H: 1.15, ...view(t) });

    // project rings into a Path2D for view v; open: a river, not closed
    function addRing(P, r, v, open) {
      const { l0, sf0, cf0, k, cx, cy } = v;
      let lx = 1e9, ly = 1e9;
      for (let i = 0; i < r.n; i++) {
        const dl = r.lam[i] - l0, cdl = Math.cos(dl), cp = r.cphi[i], sp = r.sphi[i];
        let x = cp * Math.sin(dl), y = cf0 * sp - sf0 * cp * cdl;
        if (sf0 * sp + cf0 * cp * cdl < 0) { const l = Math.hypot(x, y) || 1; x /= l; y /= l; }   // far side: onto the rim
        const Xp = cx + k * x, Yp = cy - k * y;
        if (!i) { P.moveTo(Xp, Yp); lx = Xp; ly = Yp; }
        else if (Math.abs(Xp - lx) + Math.abs(Yp - ly) > 1 || i === r.n - 1) { P.lineTo(Xp, Yp); lx = Xp; ly = Yp; }   // under a pixel: dropped
      }
      if (!open) P.closePath();
    }
    const visible = (r, v) => {
      const d = Math.acos(Math.max(-1, Math.min(1, r.c[0] * v.ex + r.c[1] * v.ey + r.c[2] * v.ez)));
      return d - r.rad < v.reach && r.rad * v.k > .6;
    };
    // projected shapes are cached while the view holds: a lit country fading in costs a fill, not a projection
    let cacheSig, cache;
    const shape = (id, rs, v, open) => {
      if (!cache.has(id)) { const P = new Path2D(); for (const r of rs || []) if (visible(r, v)) addRing(P, r, v, open); cache.set(id, P); }
      return cache.get(id);
    };

    let drawn = null;   // the signature of what is on the canvas: nothing changed, nothing drawn
    clockRun(t => {
      if (!within(t, on)) return;
      const s = vf(t), k = R0 / s.H;
      const L = k > 900 ? geo.lod[1] : geo.lod[0], keys = Object.keys(L);
      const pop = (t0, d = .25) => { const q = ramp(t, t0, t0 + d); return q && backEase(q); };
      const vals = {
        lit: lit ? keys.map(c => clamp01(lit(c, t))) : [],
        reg: region ? regionSets.map(R => clamp01(region(R.n, t, R.c))) : [],
        hat: hatch ? [...keys, ...regionSets.map(R => R.n)].map(c => clamp01(hatch(c, t))) : [],
        area: AREAS.map(A => clamp01(A.a(t))),
        det: details.length ? ramp(k, R0 / .22, R0 / .06) : 0,
        route: routes.map(([, , t0, dur = .8]) => ramp(t, t0, t0 + dur) + pop(t0 + dur)),
        dot: dots.map(d => pop(d[2])),
        lab: labels.map(l => ramp(t, l.t0, l.t0 + .3)),
      };
      const vsig = [s.lon, s.lat, s.H, s.dx || 0, s.dy || 0, s.roll || 0].map(n => n.toFixed(5)).join();
      const sig = vsig + JSON.stringify(vals);
      if (sig === drawn) return;
      drawn = sig;
      const l0 = s.lon * DEG, f0 = s.lat * DEG;
      const v = { l0, sf0: Math.sin(f0), cf0: Math.cos(f0), k, cx: SW / 2 + (s.dx || 0), cy: SH / 2 + (s.dy || 0),
        ex: Math.cos(f0) * Math.cos(l0), ey: Math.cos(f0) * Math.sin(l0), ez: Math.sin(f0) };
      const diag = Math.hypot(SW / 2 + Math.abs(s.dx || 0), SH / 2 + Math.abs(s.dy || 0));
      v.reach = diag >= k ? Math.PI / 2 : Math.asin(diag / k);
      if (vsig !== cacheSig) { cacheSig = vsig; cache = new Map(); }
      ctx.setTransform(px, 0, 0, px, 0, 0);
      if (bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, SW, SH); } else ctx.clearRect(0, 0, SW, SH);
      // roll: clockwise, as the globe's camera and mapXY turn it
      if (s.roll) { ctx.translate(v.cx, v.cy); ctx.rotate(s.roll * DEG); ctx.translate(-v.cx, -v.cy); }
      const disc = new Path2D(); disc.arc(v.cx, v.cy, k, 0, 2 * Math.PI);
      ctx.fillStyle = sea; ctx.fill(disc);
      ctx.save(); ctx.clip(disc);
      const all = shape('all', keys.flatMap(c => L[c]), v);
      ctx.fillStyle = land; ctx.fill(all);
      ctx.strokeStyle = MAP_COL.line; ctx.lineWidth = 1; ctx.lineJoin = 'bevel'; ctx.stroke(all);   // round joins: most of a 10 ms stroke
      const fillA = (P, a, f) => { if (a > 0) { ctx.globalAlpha = a * .85; ctx.fillStyle = f; ctx.fill(P); ctx.globalAlpha = 1; } };
      keys.forEach((c, i) => vals.lit[i] && fillA(shape('c' + c, L[c], v), vals.lit[i], fillOf(c)));
      regionSets.forEach((R, i) => vals.reg[i] && fillA(shape('r' + R.c + R.n, R.rs, v), vals.reg[i], fillOf(R.n)));
      if (rkeys.length) {
        const P = shape('borders', regionSets.filter(R => rkeys.includes(R.c)).flatMap(R => R.rs), v);
        ctx.setLineDash([4, 3]); ctx.lineWidth = .9; ctx.strokeStyle = MAP_COL.line; ctx.stroke(P); ctx.setLineDash([]);
      }
      if (vals.det) for (const [j, d] of details.entries()) {
        ctx.globalAlpha = .8 * vals.det; ctx.fillStyle = MAP_COL.urban; ctx.fill(shape('du' + j, d.urban, v));
        ctx.globalAlpha = vals.det; ctx.fillStyle = sea; const lk = shape('dl' + j, d.lakes, v); ctx.fill(lk);
        ctx.strokeStyle = MAP_COL.river; ctx.lineJoin = 'round'; ctx.lineWidth = 1; ctx.stroke(lk);
        ctx.lineWidth = Math.min(5, k / 4000); ctx.lineCap = 'round'; ctx.stroke(shape('dr' + j, d.rivers, v, true));
        ctx.globalAlpha = 1; ctx.lineJoin = 'bevel';
      }
      const hatchA = (P, a) => { if (a > 0) { ctx.globalAlpha = a * .7; ctx.fillStyle = hatchFill; ctx.fill(P); ctx.globalAlpha = a * .12; ctx.fillStyle = MAP_COL.ink; ctx.fill(P); ctx.globalAlpha = 1; } };
      if (hatch) {
        keys.forEach((c, i) => vals.hat[i] && hatchA(shape('c' + c, L[c], v), vals.hat[i]));
        regionSets.forEach((R, i) => vals.hat[keys.length + i] && hatchA(shape('r' + R.c + R.n, R.rs, v), vals.hat[keys.length + i]));
      }
      AREAS.forEach((A, i) => {
        const a = vals.area[i]; if (!a) return;
        const P = shape('a' + i, A.rs, v);
        if (A.fill === 'hatch') hatchA(P, a); else if (A.fill) fillA(P, a / .85, A.fill);
        if (A.line) { ctx.globalAlpha = a; ctx.strokeStyle = A.line; ctx.lineWidth = A.width; ctx.lineJoin = 'round'; ctx.stroke(P); ctx.globalAlpha = 1; ctx.lineJoin = 'bevel'; }
      });
      ctx.restore();
      // marks in stage px, so they keep their size at every zoom
      const xy = ll => mapXY(ll, { ...s, roll: 0 });
      ctx.save(); ctx.clip(disc);   // arcs over the rim would float in space
      ctx.strokeStyle = MAP_COL.hot; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
      routes.forEach(([a, b, t0, dur = .8]) => {
        const q = ramp(t, t0, t0 + dur), A = xy(a), B = xy(b);
        if (!q || !A || !B) return;
        const lift = Math.hypot(B[0] - A[0], B[1] - A[1]) * .25, mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2 - lift;
        ctx.beginPath(); ctx.moveTo(...A);
        for (let i = 1; i <= 24 * q; i++) { const u = i / 24; ctx.lineTo((1 - u) ** 2 * A[0] + 2 * u * (1 - u) * mx + u * u * B[0], (1 - u) ** 2 * A[1] + 2 * u * (1 - u) * my + u * u * B[1]); }
        ctx.stroke();
        if (q >= 1) dotAt(B, 7 * pop(t0 + dur));
      });
      ctx.restore();
      dots.forEach(([lon, lat, , r = 7], i) => { const P = xy([lon, lat]); if (P) dotAt(P, r * vals.dot[i]); });
      ctx.fillStyle = MAP_COL.ink;
      labels.forEach((l, i) => {
        const P = xy(l.ll), a = vals.lab[i];
        if (P && a) { ctx.globalAlpha = a; ctx.beginPath(); ctx.arc(P[0], P[1], 5, 0, 2 * Math.PI); ctx.fill(); ctx.globalAlpha = 1; }
        const Q = s.roll ? mapXY(l.ll, s) : P;   // the canvas is turned by the roll, the SVG labels are not
        if (!Q || Q[0] < safe[0] || Q[0] > safe[2] || Q[1] < safe[1] || Q[1] > safe[3]) return put(l.e, { o: 0 });
        let x = l.side === 'l' ? Q[0] - 14 - l.w : Q[0] + 14;
        if (x + l.w > safe[2]) x = Q[0] - 14 - l.w; if (x < safe[0]) x = Q[0] + 14;
        put(l.e, { x: Math.max(safe[0], Math.min(safe[2] - l.w, x)), y: Math.max(safe[1] + labelSize * .8, Math.min(safe[3], Q[1] + labelSize * .3)), o: a });
      });
    }, D, { tail: true });
    function dotAt([x, y], r) {
      if (r <= 0) return;
      ctx.fillStyle = MAP_COL.hot; ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.fill();
      ctx.globalAlpha = .25; ctx.beginPath(); ctx.arc(x, y, r * 2.2, 0, 2 * Math.PI); ctx.fill(); ctx.globalAlpha = 1;
    }
    return { g, view: vf, xy: (ll, t) => mapXY(ll, vf(t)) };
  }

  /* ---------- the globe ---------- */
  function globeShot(p, D, view, dotsOn, arcsOn, { on = shotOn(p) } = {}) {
    if (!window.Globe) throw new Error('globeShot: the globe is not loaded; start the chapter with loadGlobe().then(...)');
    const g = Globe.mount(p);
    clockRun(t => within(t, on) && Globe.draw({ H: 1.15, ...view(t) }, dotsOn && (i => dotsOn(i, t)), arcsOn && (i => arcsOn(i, t))), D, { tail: true });
    return g;
  }
  const loadGlobe = () => import('./globe.js').then(() => new Promise(r => { (function w() { window.GLOBE_READY ? r() : setTimeout(w, 30); })(); }));

  return { paperMap, globeShot, loadGlobe, mapXY, mapKeys, mapRings, mapCircle, CITIES: GL.cities, MAP_COL };
})();
