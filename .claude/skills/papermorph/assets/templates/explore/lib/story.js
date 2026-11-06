/* The story the map tells: who walks, the places, and each year's card for each person. The sample: Garibaldi and
   Cavour, 1859-1861, in our own words. Replace it all; keep the shapes.
   PLACES[key]: [label, lon, lat, label side (r, l, t, b), off the map?]: an off-the-map place (true) is a marker kept
   inside the frame, for anyone gone abroad. YEARS: one entry per year, consecutive, each with a card for every person:
   route, the places walked that year after where the last year left them (the last is where they stand, `at`);
   place, the card's heading; text, the card's words (and its clip: '<year>-<person>'); gone: true, off the map from then.
   PLACE_CARDS[key]: a place that can be clicked: { text, title?, from?, to? (the years it shows), pic? }; its clip is
   'place-<key>'. RENAMED: { key: [year, other key] }: one spot under a new name from that year. WORDS: the page's own
   words in the book's language (explore.js lists them). */
'use strict';
const INTRO = {
  title: 'Italy Made', sub: 'Italy 1859–1861',
  text: 'In 1859 Italy is seven states. Each year the map plays what happened; then Garibaldi and Cavour walk to where that year took them. Click one to hear their year, or a ringed city to hear about it.',
};

const PEOPLE = {
  garibaldi: { name: 'Giuseppe Garibaldi', short: 'Garibaldi', color: '#b2352a' },
  cavour: { name: 'Camillo Benso, Count of Cavour', short: 'Cavour', color: '#2f5878' },
};

const PLACES = {
  turin: ['Turin', 7.69, 45.07, 'l'], leri: ['Leri', 8.30, 45.25, 'b'], varese: ['Varese', 8.83, 45.82, 't'], como: ['Como', 9.08, 45.81, 'r'],
  genoa: ['Genoa', 8.93, 44.41, 'b'], caprera: ['Caprera', 9.47, 41.21, 'r'], marsala: ['Marsala', 12.44, 37.80, 'l'],
  palermo: ['Palermo', 13.36, 38.12, 't'], naples: ['Naples', 14.27, 40.85, 'r'], teano: ['Teano', 14.07, 41.25, 't'], rome: ['Rome', 12.50, 41.90, 'l'],
};

const START = { garibaldi: 'caprera', cavour: 'turin' };

const YEARS = {
  1859: {
    garibaldi: { route: ['varese', 'como'], at: 'como', place: 'Varese and Como', text: 'In May he leads his Alpine Hunters over the Ticino and beats the Austrians at Varese and San Fermo. He ends the year near Como.' },
    cavour: { route: ['leri'], at: 'leri', place: 'Leri', text: 'He made this war, and France fought it with him. When the peace leaves Venice to Austria, he resigns in a rage and goes home to his farm at Leri.' },
  },
  1860: {
    garibaldi: { route: ['genoa', 'marsala', 'palermo', 'naples', 'teano', 'caprera'], at: 'caprera', place: 'From Genoa to Teano', text: 'A thousand volunteers sail from Genoa. Sicily falls, then Naples. At Teano he hands the south to the king, and goes home to Caprera with a sack of seed.' },
    cavour: { route: ['turin'], at: 'turin', place: 'Turin', text: 'Back in office in January. He trades Nice, Garibaldi\'s birthplace, for France\'s blessing, and sends the army south before Garibaldi can reach Rome.' },
  },
  1861: {
    garibaldi: { route: ['turin', 'caprera'], at: 'caprera', place: 'Turin, then Caprera', text: 'In April he comes to parliament in his red shirt and accuses Cavour of selling his city. Then he goes back to his island.' },
    cavour: { route: [], at: 'turin', gone: true, place: 'Turin', text: 'Italy has a parliament and a king. On 6 June he dies, at fifty, in Turin. Rome is not yet Italy\'s.' },
  },
};

const PLACE_CARDS = {
  turin: { text: 'The capital of the Kingdom of Sardinia, and from 1861 of Italy, until the government moves to Florence in 1865.' },
  naples: { text: 'The biggest city in Italy, capital of the Two Sicilies until its king leaves for Gaeta in September 1860.' },
  rome: { title: 'Rome', text: 'The Pope\'s city, guarded by French troops. It joins Italy in 1870, and becomes its capital in 1871.' },
};
