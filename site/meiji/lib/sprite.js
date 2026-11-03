/* The four walking figures: painted cut-outs (img/figures/<id>.webp, made once with an image model, outlined white,
   all facing right: the engine mirrors them when they walk left). figureSprite(id) is the only way the page asks
   for a figure: it returns the markup and where its feet stand. Units are a 120 x 260 base: the feet are the
   picture's bottom centre, placed at (60, feet), and a man's picture is about 244 tall, Tsuda's 196. */
'use strict';
(function () {
  // [feet y, picture height, picture width/height] per figure; the aspect is that of the WebP
  const FIG = {
    fukuzawa: [252, 244, 164 / 360],
    ito:      [252, 244, 143 / 360],
    saigo:    [252, 248, 183 / 360],
    tsuda:    [200, 196, 147 / 360]
  };

  // { markup, feet, width, height }: draw it translated so (60, feet) is the origin, scaled to the height wanted
  window.figureSprite = id => {
    const [feet, h, aspect] = FIG[id], w = Math.round(h * aspect * 10) / 10;
    return {
      markup: `<image href="img/figures/${id}.webp" x="${60 - w / 2}" y="${feet - h}" width="${w}" height="${h}" preserveAspectRatio="none"/>`,
      feet, width: w, height: h
    };
  };
})();
