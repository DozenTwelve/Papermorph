/* story.js: the sample's pictures, one scene function per stretch of the story, all drawn from P alone.
   Replace it with the book's own: keep scrollStory(P => …) at the end, and draw every scene from at('key', f)
   windows, so scrolling back plays the story in reverse and a reload at any scroll shows the same frame. */
'use strict';
const SEA = '#bfcac6', LAND = '#ece3cd', LIT = '#e3d3b0', LINE = '#9a8a70';

// Natural Earth's countries (img/geo-lite.js, made by geo.py), one Path2D each, and all of them as one path
const WORLD = geoPaths(GEO_LITE.lod[0]), ALL = new Path2D();
Object.values(WORLD).forEach(p => ALL.addPath(p));
// Natural Earth's populated places with pop_max of ten million or more: name, country, lon, lat, people
const CITIES = [['Tokyo', 'JPN', 139.75, 35.69, 35676000], ['New York', 'USA', -73.98, 40.75, 19040000], ['Mexico City', 'MEX', -99.13, 19.44, 19028000],
  ['Mumbai', 'IND', 72.86, 19.02, 18978000], ['São Paulo', 'BRA', -46.63, -23.56, 18845000], ['Delhi', 'IND', 77.23, 28.67, 15926000],
  ['Shanghai', 'CHN', 121.43, 31.22, 14987000], ['Kolkata', 'IND', 88.32, 22.5, 14787000], ['Dhaka', 'BGD', 90.41, 23.73, 12797394],
  ['Buenos Aires', 'ARG', -58.4, -34.6, 12795000], ['Los Angeles', 'USA', -118.18, 33.99, 12500000], ['Karachi', 'PAK', 66.99, 24.87, 12130000],
  ['Cairo', 'EGY', 31.25, 30.05, 11893000], ['Rio de Janeiro', 'BRA', -43.23, -22.92, 11748000], ['Osaka', 'JPN', 135.46, 34.75, 11294000],
  ['Beijing', 'CHN', 116.39, 39.93, 11106000], ['Manila', 'PHL', 120.98, 14.61, 11100000], ['Moscow', 'RUS', 37.61, 55.75, 10452000],
  ['Istanbul', 'TUR', 29.01, 41.11, 10061000]];
const ASIA = new Set(['JPN', 'IND', 'CHN', 'BGD', 'PAK', 'PHL']), LEFT = new Set(['Osaka', 'Kolkata']);   // labels set left of the dot, clear of a neighbour's
const fmtM = n => (n / 1e6).toFixed(1) + ' million';

// the radius (in degrees) that fits a w × h degree box into the canvas, whatever its shape: a phone's tall graphic
// and a desktop's wide one frame the same countries
const fit = (w, h) => Math.max(w / 2 * Math.min(cw, chh) / cw, h / 2 * Math.min(cw, chh) / chh);
// the camera: the whole world, then a dive to Asia while that step plays, held through the end
const CAM = () => [[at('world', 0), 12, -12, fit(360, 150)], [at('asia', .05), 12, -12, fit(360, 150)], [at('asia', .55), 104, -24, fit(92, 52)]];

function sceneMap(P) {
  const a = ramp(P, at('world', 0), at('world', .25)), [x, y, r] = cam(CAM(), P), V = view(full(), x, y, r), px = 1 / V.s;
  if (a <= 0) return V;
  ctx.globalAlpha = a; ctx.fillStyle = SEA; ctx.fillRect(0, 0, cw, chh);
  toWorld(V);
  ctx.fillStyle = LAND; ctx.fill(ALL);
  const lit = a * ramp(P, at('asia', .3), at('asia', .5));   // the Asian countries of the list, lit as the camera arrives
  if (lit > 0) { ctx.globalAlpha = lit; ctx.fillStyle = LIT; for (const iso of ASIA) if (WORLD[iso]) ctx.fill(WORLD[iso]); }
  ctx.globalAlpha = a; ctx.strokeStyle = LINE; ctx.lineWidth = .9 * px; ctx.stroke(ALL);
  ctx.globalAlpha = 1; toScreen();
  paperTop(a);
  chip('NATURAL EARTH · 177 COUNTRIES', fs(3), fs(4.5), { size: 3.2, fill: C.paper, bg: C.ink, a: a * (1 - ramp(P, at('cities', 0), at('cities', .1))) });
  return V;
}

// the nineteen cities, biggest first, a circle each whose area is its people; outside Asia they dim on the dive
function sceneCities(P, V) {
  const a = 1 - ramp(P, at('rank', .05), at('rank', .25));
  if (a <= 0) return;
  const k = Math.min(cw, chh) / 100, dim = ramp(P, at('asia', .2), at('asia', .45));
  let shown = 0;
  CITIES.forEach(([name, iso, lon, lat, pop], i) => {
    const o = ramp(P, at('cities', .1 + i * .035), at('cities', .14 + i * .035));
    if (o <= 0) return;
    shown++;
    const asia = ASIA.has(iso), r = k * 1.1 * Math.sqrt(pop / 1e7), oa = a * o * (asia ? 1 : 1 - .75 * dim);
    dot(V.sx(lon), V.sy(-lat), r, C.accent, oa * .55); ring(V.sx(lon), V.sy(-lat), r, C.accent, 1.5, oa);
  });
  chip(`${shown} OF 10 MILLION OR MORE`, cw - fs(3), fs(4.5), { size: 3.2, align: 'right', a: a * ramp(P, at('cities', .05), at('cities', .12)) * (1 - dim) });
  // on the dive, the Asian ten are named, and counted
  const la = a * ramp(P, at('asia', .5), at('asia', .65));
  if (la > 0) {
    for (const [name, iso, lon, lat] of CITIES) {
      if (ASIA.has(iso)) text(name.toUpperCase(), V.sx(lon) + (LEFT.has(name) ? -fs(2) : fs(2)), V.sy(-lat) + fs(1), { size: 2.6, spacing: .08, align: LEFT.has(name) ? 'right' : 'left', a: la });
    }
    chip('10 OF THE 19 IN ASIA', cw - fs(3), fs(4.5), { size: 3.2, align: 'right', fill: C.paper, bg: C.ink, a: la });
  }
}

// the ten biggest as bars over the darkened map: Tokyo's, nearly twice the next
function sceneRank(P) {
  const a = ramp(P, at('rank', .05), at('rank', .25));
  if (a <= 0) return;
  veil(C.night, .88 * a);
  const top = CITIES.slice(0, 10), x0 = Math.min(cw * .34, fs(30)), w = cw - x0 - fs(20), y0 = chh * .16, h = (chh * .8 - y0) / top.length;
  top.forEach(([name, , , , pop], i) => {
    const g = ramp(P, at('rank', .2 + i * .03), at('rank', .4 + i * .03)), y = y0 + i * h;
    text(name, x0 - fs(1.5), y + h * .62, { size: 2.8, font: SERF, weight: 400, fill: C.paper, align: 'right', a });
    ctx.globalAlpha = a; ctx.fillStyle = i ? C.paper : C.accent; ctx.fillRect(x0, y + h * .2, w * pop / top[0][4] * g, h * .6); ctx.globalAlpha = 1;
  });
  text(fmtM(top[0][4]).toUpperCase(), x0 + w + fs(1), y0 + h * .62, { size: 2.8, fill: C.accent, a: a * ramp(P, at('rank', .4), at('rank', .5)) });
  text('PEOPLE IN THE WHOLE URBAN AREA', x0, chh * .1, { size: 2.8, spacing: .08, fill: C.paper, a });
}

scrollStory(P => {
  const V = sceneMap(P);
  sceneCities(P, V);
  sceneRank(P);
});
