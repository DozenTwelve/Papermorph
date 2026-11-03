/* Audio the page plays when it exists. Narration clips: list a card's id and the page plays audio/en/<id>.mp3 in its
   place; ids are '<year>-e<number>' for an event and '<year>-<person>' for a person's card. A card with no clip is held
   on screen for a reading time that follows the length of its text. Music: a list of mp3 paths, played in turn. */
'use strict';
// every event card and every person-year card; the source text and the respelling table are in the narration source
window.VOICED = [
  '1868-e1', '1868-e2', '1868-e3', '1868-e4', '1868-e5', '1869-e1',
  '1869-e2', '1869-e3', '1869-e4', '1870-e1', '1870-e2', '1870-e3',
  '1871-e1', '1871-e2', '1871-e3', '1871-e4', '1872-e1', '1872-e2',
  '1872-e3', '1873-e1', '1873-e2', '1873-e3', '1874-e1', '1874-e2',
  '1875-e1', '1875-e2', '1876-e1', '1876-e2', '1876-e3', '1876-e4',
  '1877-e1', '1877-e2', '1877-e3', '1878-e1', '1878-e2', '1868-fukuzawa',
  '1868-ito', '1868-saigo', '1868-tsuda', '1869-fukuzawa', '1869-ito', '1869-saigo',
  '1869-tsuda', '1870-fukuzawa', '1870-ito', '1870-saigo', '1870-tsuda', '1871-fukuzawa',
  '1871-ito', '1871-saigo', '1871-tsuda', '1872-fukuzawa', '1872-ito', '1872-saigo',
  '1872-tsuda', '1873-fukuzawa', '1873-ito', '1873-saigo', '1873-tsuda', '1874-fukuzawa',
  '1874-ito', '1874-saigo', '1874-tsuda', '1875-fukuzawa', '1875-ito', '1875-saigo',
  '1875-tsuda', '1876-fukuzawa', '1876-ito', '1876-saigo', '1876-tsuda', '1877-fukuzawa',
  '1877-ito', '1877-saigo', '1877-tsuda', '1878-fukuzawa', '1878-ito', '1878-saigo',
  '1878-tsuda',
];
// background music by era: each track loops from its year until the next one's
window.MUSIC = [{ from: 1868, src: 'audio/bgm/era1-domains.mp3' }, { from: 1872, src: 'audio/bgm/era2-new-state.mp3' }];
