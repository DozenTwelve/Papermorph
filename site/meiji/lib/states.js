/* The states the map passes through, in order. Each is data: how every lord (domain) is grouped for display.
   To change what the map shows, replace a state's `group`; nothing else needs to change. The page recolours the groups,
   fades the lines between groups that merged, and draws the lines where groups meet.

   group(d) gets one domain piece, { lord, kind, provinces, ken } (kind: han, bakufu, hatamoto, religious, court, other,
   unknown; ken: its prefecture of January 1872, from notes/ken-1871.csv; k76: of August 1876, from ken-1876.csv), and returns { key, name, color?, kind? }.
   Pieces returning the same key are one group, drawn as one area with no line inside. Leave color out to have the page
   pick a palette colour that differs from the neighbours.
   provinceLines: draw the old province borders (only true while provinces still mean something on the map).
   note: an optional caption under the label. */
'use strict';

// muted palettes in the range of aged paper; han take them in turn, neighbours kept apart
const PALETTES = {
  domains: ['#c89a82', '#8fa6b0', '#a9b48f', '#b0a0b4', '#92b0a6', '#9aa3be', '#c4a0a6', '#bdbb8a', '#a3bac4', '#cfb08a'],
  prefectures: ['#b9805f', '#6f8f9e', '#869a66', '#8f7a9b', '#6d978a', '#b49555', '#7a85ab', '#aa7080', '#8d8f58', '#6fa1ae'],
  consolidated: ['#d9ab8f', '#a7c0c9', '#bccaa0', '#c8b6cb', '#a5c6bb', '#c3c8d9', '#dfb5bb', '#d0cd9b'],
};
// land that is not han: fixed colours by kind
const KIND_COLOR = { bakufu: '#efe7d2', hatamoto: '#cdb184', religious: '#c1baac', court: '#dcc7c4', other: '#e3d6ac', unknown: '#a7a79f' };

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
