/* What happens on the map each year, in order; each is a card the camera goes to, and a clip ('<year>-e<number>').
   at: [place name, lon, lat], where the camera goes and the pin drops; glow: a region to light (ATLAS.regions, by its
   name); state: the id of a map state (lib/states.js) the map changes to; pic: a picture path, or false for a card
   without one; caption: under the picture (default '<place>, <year>'). The sample: Italy 1859-1861. */
'use strict';
const EVENTS = {
  1859: [
    { title: 'Magenta', at: ['Magenta', 8.88, 45.46], pic: false, text: 'On 4 June, France and Sardinia beat the Austrians west of Milan. Four days later Napoleon the Third rides into the city.' },
    { title: 'Solferino', at: ['Solferino', 10.57, 45.37], pic: false, text: 'On 24 June, the biggest battle in Europe since Leipzig. A Swiss visitor, Henri Dunant, sees the wounded left in the sun, and will found the Red Cross.' },
    { title: 'Villafranca', at: ['Villafranca', 10.84, 45.35], glow: 'Lombardia', state: 'villafranca', pic: false, text: 'On 11 July the two emperors make peace without asking Italy. Lombardy goes to Sardinia; Venice stays Austrian.' },
  ],
  1860: [
    { title: 'The Centre Votes', at: ['Florence', 11.25, 43.77], glow: 'Toscana', state: 'annexations', pic: false, text: 'In March, Tuscany and Emilia vote to join Sardinia. The price is Nice and Savoy, handed to France.' },
    { title: 'The Thousand', at: ['Marsala', 12.44, 37.80], glow: 'Sicily', pic: false, text: 'On 11 May, Garibaldi lands at Marsala with a thousand volunteers. By June, Palermo is his.' },
    { title: 'Naples', at: ['Naples', 14.27, 40.85], glow: 'Campania', pic: false, text: 'On 7 September he arrives in Naples by train, ahead of his army. The king has already gone.' },
    { title: 'Teano', at: ['Teano', 14.07, 41.25], state: 'south', pic: false, text: 'On 26 October he meets Victor Emmanuel on the road and hails him King of Italy. The south and the Marches vote to join.' },
  ],
  1861: [
    { title: 'The Kingdom of Italy', at: ['Turin', 7.69, 45.07], glow: 'Piemonte', state: 'italy-1861', pic: false, text: 'On 17 March, the parliament in Turin proclaims Victor Emmanuel King of Italy.' },
    { title: 'Rome and Venice', at: ['Rome', 12.50, 41.90], glow: 'Lazio', pic: false, text: 'Rome is still the Pope\'s, and Venice is still Austria\'s. Cavour tells parliament that Rome must be the capital.' },
  ],
};
