/* The map and the states it passes through. lib/explore.js is Papermorph's explore kit, unchanged; what is this book's
   is here and in story.js, events.js, sprite.js and voiced.js.
   ATLAS: the map file (quantised metres on a Lambert conic, parallels 33 and 38, origin 36N 136E, GRS80), its objects,
   the turn (clockwise, so the islands lie across a wide screen and stand along an upright phone), the whole-Japan frame
   (everything ever drawn, not Okinawa), and the coarse shapes for a moving camera (20 and 40 file units, about 1 and 2 km;
   coast pieces of 1000 units, about 53 km). */
const ATLAS = {
  topo: 'data/japan-1868.topo.json', areas: 'domains', regions: 'provinces', regionKey: 'prov', lambert: [33, 38, 36, 136], rotate: [30, -60],
  frame: [[129.6, 31.0], [129.7, 34.6], [141.6, 41.6], [142.2, 39.5], [140.9, 35.0], [135.7, 33.4], [131, 31.1]], rough: [20, 40], coastCell: 1000,
};

/* The states the map passes through, in order. Each is data: how every lord (domain) is grouped for display.
   To change what the map shows, replace a state's `group`; nothing else needs to change. The page recolours the groups,
   fades the lines between groups that merged, and draws the lines where groups meet.

   group(d) gets one domain piece, { lord, kind, provs, ken } (kind: han, bakufu, hatamoto, religious, court, other,
   unknown; ken: its prefecture of January 1872, from notes/ken-1871.csv; k76: of August 1876, from ken-1876.csv), and returns { key, name, color?, kind? }.
   Pieces returning the same key are one group, drawn as one area with no line inside. Leave color out to have the page
   pick a palette colour that differs from the neighbours.
   provinceLines: draw the old province borders (only true while provinces still mean something on the map).
   note: an optional caption under the label. */
'use strict';

// woodblock colours in the range of aged paper; han take them in turn, neighbours kept apart
const PALETTES = {
  domains: ['#d3a88f', '#a2b7b2', '#cdc597', '#b9aabb', '#a9bb98', '#97aac0', '#d8b682', '#cba0a0', '#bbbfa6', '#a3bec8'],
  prefectures: ['#bc8a72', '#86a19c', '#b2ae78', '#a08ca6', '#8fa781', '#7791ab', '#c8a164', '#b58c91', '#939f88', '#82a6b2'],
  consolidated: ['#e0a98f', '#9cc0bd', '#d6cc8c', '#bba7c6', '#a5c48f', '#8fadcf', '#e2b86e', '#d29ca3', '#b3bd9c', '#8dbfd2'],
};
// land that is not han: fixed colours by kind
const KIND_COLOR = { bakufu: '#f1e8d2', hatamoto: '#d2b98c', religious: '#c4bcae', court: '#dfcbc6', other: '#e5d8b0', unknown: '#a9aaa3' };

// land the new government holds directly once the Tokugawa are gone
const isGovernment = d => d.kind === 'bakufu' || d.kind === 'hatamoto';
const GOVERNMENT = { key: 'government', name: 'Government land', color: '#e6d7ad' };

const STATES = [
  {
    id: 'domains', label: 'Domains, on the eve of the Restoration', palette: 'domains', provinceLines: true,
    group: d => ({ key: d.lord, name: d.lord }),
  },
  {
    id: 'tokugawa-lands-1868', label: 'Domains and government land', palette: 'domains', provinceLines: true,
    group: d => (isGovernment(d) ? GOVERNMENT : { key: d.lord, name: d.lord }),
  },
  {
    id: 'prefectures-august-1871', label: 'Prefectures, August 1871', palette: 'prefectures',
    note: 'Drawn from the domains of the 1868 map; some had already been changed by 1871.',
    group: d => (isGovernment(d) ? GOVERNMENT : { key: d.lord, name: d.lord }),
  },
  {
    id: 'consolidated-1871', label: '3 fu and 72 ken, January 1872', palette: 'consolidated',
    note: 'By county, from the decrees. Temporary exclaves not shown.',
    group: d => ({ key: d.ken, name: d.ken }),
  },
  {
    id: 'consolidated-1876', label: '3 fu and 35 ken, August 1876', palette: 'consolidated',
    note: 'By county, from the decrees of 1876. Later boundary changes are not shown.',
    group: d => ({ key: d.k76, name: d.k76 }),
  },
];
