/* What the map is and the states it passes through. The sample: Italy 1859-1861, drawn from today's provinces
   (Natural Earth, public domain, made by topo.py), so every old border here is the nearest modern one. Replace it all.

   ATLAS: the map file and how to show it (every key may be left out):
     topo       the TopoJSON file (topo.py writes it)                        default 'data/map.topo.json'
     areas      the object whose pieces the states group                   default 'areas'
     regions    the object an event's glow lights, and regionKey its name   default 'regions', 'name'
     lambert    [lat1, lat2, lat0, lon0] when the file does not name its projection (topo.py names it)
     rotate     [degrees on a wide screen, on an upright phone], clockwise   default [0, 0]
     frame      [lon, lat] points the whole-map view holds                  default every place in PLACES
     rough, coastCell   the coarse shapes drawn while the camera moves, in the file's units (default about 1 km, 2 km islets, 50 km cells)
   STATES, in order: each says how every area (d: its properties in the file, here name, region, adm0_a3) is grouped.
   group(d) returns { key, name, color?, kind? }; areas with the same key are one shape with no line inside. Leave color
   out and the page picks one from the state's palette that differs from the neighbours'. Other keys: label (under the
   year), note (a smaller line under it), palette (a name in PALETTES), provinceLines (draw the region lines too),
   lines (0 to 1: how strongly the borders show at the whole-map view; by default only a state of 120 groups or fewer
   shows them). An event moves the map to a state with { state: id } (lib/events.js). */
'use strict';
const ATLAS = { frame: [[6.6, 45.0], [13.8, 46.6], [18.5, 40.1], [15.6, 37.9], [12.4, 37.8], [8.2, 39.0], [7.3, 43.8]] };

// colours for groups that name none: the first palette is the default
const PALETTES = {
  states: ['#d3a88f', '#a2b7b2', '#cdc597', '#b9aabb', '#a9bb98', '#97aac0', '#d8b682', '#cba0a0'],
};
// a group whose areas all share a `kind` (returned by group) takes its colour here
const KIND_COLOR = { abroad: '#d9d2c1' };

const IT = d => d.adm0_a3 === 'ITA' || d.adm0_a3 === 'SMR' || d.adm0_a3 === 'VAT';
const ROMAGNA = ['Bologna', 'Ferrara', 'Ravenna', 'Forlì-Cesena', 'Rimini'];
const SARDINIA = { key: 'sardinia', name: 'Kingdom of Sardinia', color: '#c98d6d' };
const AUSTRIA = { key: 'austria', name: 'Austrian Empire', color: '#a9b4bd' };
const FRANCE = { key: 'FRA', name: 'France', kind: 'abroad' };
// Italy in the spring of 1859, region by region
function before(d) {
  if (d.adm0_a3 === 'SMR') return { key: 'SMR', name: 'San Marino', color: '#e4d6a8' };
  if (d.adm0_a3 === 'AUT') return AUSTRIA;
  if (['Savoie', 'Haute-Savoie', 'Alpes-Maritimes'].includes(d.name)) return SARDINIA;   // Savoy and Nice, Sardinian until 1860
  if (!IT(d)) return d.adm0_a3 === 'FRA' ? FRANCE : { key: d.adm0_a3, name: d.adm0_a3 === 'CHE' ? 'Switzerland' : d.adm0_a3, kind: 'abroad' };
  if (['Piemonte', "Valle d'Aosta", 'Liguria', 'Sardegna'].includes(d.region)) return SARDINIA;
  if (['Lombardia', 'Veneto', 'Friuli-Venezia Giulia', 'Trentino-Alto Adige'].includes(d.region)) return AUSTRIA;
  if (d.region === 'Toscana') return { key: 'tuscany', name: 'Grand Duchy of Tuscany' };
  if (d.region === 'Emilia-Romagna') return ROMAGNA.includes(d.name) ? { key: 'papal', name: 'Papal States' } : { key: 'duchies', name: 'Parma and Modena' };
  if (['Lazio', 'Umbria', 'Marche'].includes(d.region) || d.adm0_a3 === 'VAT') return { key: 'papal', name: 'Papal States' };
  return { key: 'sicilies', name: 'Kingdom of the Two Sicilies' };
}
const into = (to, test) => d => (test(d) ? to : before(d));

const STATES = [
  { id: 'italy-1859', label: 'Italy in the spring of 1859', note: 'Old borders drawn along today\'s provinces.', group: before },
  { id: 'villafranca', label: 'After Villafranca, July 1859', note: 'Lombardy to Sardinia; Mantua stays Austrian.',
    group: into(SARDINIA, d => d.region === 'Lombardia' && d.name !== 'Mantova') },
  { id: 'annexations', label: 'March 1860: the centre votes to join', note: 'Nice and Savoy go to France.',
    group: d => (['Savoie', 'Haute-Savoie', 'Alpes-Maritimes'].includes(d.name) ? FRANCE
      : (d.region === 'Lombardia' && d.name !== 'Mantova') || d.region === 'Toscana' || d.region === 'Emilia-Romagna' ? SARDINIA : before(d)) },
  { id: 'south', label: 'November 1860: the south and the Marches', note: 'Rome and Venice are still outside.',
    group: d => (['Savoie', 'Haute-Savoie', 'Alpes-Maritimes'].includes(d.name) ? FRANCE
      : IT(d) && d.adm0_a3 !== 'SMR' && d.adm0_a3 !== 'VAT' && d.region !== 'Lazio' && !['Lombardia', 'Veneto', 'Friuli-Venezia Giulia', 'Trentino-Alto Adige'].includes(d.region)
        || (d.region === 'Lombardia' && d.name !== 'Mantova') ? SARDINIA : before(d)) },
];
// 17 March 1861: the same land, now the Kingdom of Italy
STATES.push({ ...STATES[3], id: 'italy-1861', label: 'The Kingdom of Italy, March 1861', note: 'Rome and Venice are still outside.',
  group: d => { const g = STATES[3].group(d); return g === SARDINIA ? { ...SARDINIA, key: 'italy', name: 'Kingdom of Italy' } : g; } });
