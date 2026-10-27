# The Pandemic shorts: what the base gives an episode

`ch00/` is the sample that uses every piece: watch it first (`?beat=0`), then read its page. It is not an episode.

## Files

| File | What it gives |
|---|---|
| `lib/engine.*`, `math.js`, … | the engine (engine-v2.6, `engine.py`); upright stage with `<html data-stage="portrait">` |
| `lib/shorts.js` | the shorts kit: `shot`, `photo`, `word`, `label`, `band`, `counter`, `stamp`, `meme`, `srcTag`, `shortsBeat`, … Its colours are this series' night palette |
| `lib/pandemic.js` | the series' pieces; its API is the comment block at its top |
| `lib/pglobe.js` | the film's night globe, upright (three.js in `lib/vendor/`); loaded by `startPandemic()`, used through `globeShot()` |
| `lib/book.css`, `fonts.css`, `fonts/` | the night palette for the player; Oswald and EB Garamond |
| `img/*.webp`, `img/SOURCES.md` | the film's pictures with their sources and licences. Credit each found picture on screen with `found()` (or `srcTag()`) as SOURCES.md says |
| `img/art.js` | `window.ART`, every picture's size, for `plate()` and `wide()`. Your own pictures go in `img/chNN-art.js` (`prep.py … --art chNN-art.js`), loaded after `art.js` |
| `img/geo-lite.js` | `GEO_LITE`: countries in lon/lat for `paperMap()` (Natural Earth 110m and 50m), China's provinces, `CITIES` |
| `img/geo.js`, `geo-world.js`, `geo-eu.js`, `spread.js`, `waves.js`, `quiet.js` | the film's data, as it was. `geo-world.js` has per-country weekly data (`GEO_W.countries[iso]`: stay-home weeks, deaths per million) keyed like `paperMap`'s `lit`; the projected paths in these files are for the wide film, too heavy for Firefox upright: draw countries with `paperMap()` |

## A chapter page

Start from `ch00/index.html`. Script order:

```html
<script src="../lib/engine.js"></script>
<script src="audio/en/timings.js"></script>
<script src="../img/art.js"></script>
<script src="../img/chNN-art.js"></script>      <!-- your own pictures' sizes, if any -->
<script src="../img/geo-lite.js"></script>
<script src="../img/spread.js"></script>        <!-- only if you use the film's data -->
<script src="../lib/icons.js"></script>
<script src="../lib/shorts.js"></script>
<script src="../lib/pandemic.js"></script>
<script src="chNN.js"></script>                 <!-- your episode's own helpers, if any -->
<script> … CHAPTER, BEATS (tuples .map(shortsBeat)), music(…) … startPandemic(); </script>
```

Call `startPandemic()` instead of `startShorts()`: it also loads the globe and the paper grain. Set `CHAPTER.next` to the next episode (`'../ch02/'`); ch06 has none.

## Look

- Ground `DARK` #0b0d11 night, ink `LIGHT` #f3ede0 cream, `RED` #e5402f for the virus only (cases, spread, deaths), `MARK` #f4c430 yellow, `MUTED` grey. Map: `MAPLAND` paper, `MAPSEA`, `MAPINK`, `MAPLINE`.
- Key words Oswald 600 (`word()`, `SANS`), quotes EB Garamond italic (`SERIF`).
- Words inside x 50–810, y 130–1290. `safe.py chNN --query tags` checks it; `paperMap` keeps its city labels inside.
- `photo()` tags a picture "AI illustration"; a found photograph goes through `found(g, name, source, t0, t1)`.

## The globe and the map

One view object drives both: `{ lon, lat, H }` where the Earth's radius is 450 / H px, as in the film (1.15 the whole world, .42 China, .02 a province). Put `globeShot()` and `paperMap()` in the same shot with the same `view(t)`, fade the map's group in over a few tenths, and pass each an `on: [t0, t1]` window so only the visible one is drawn (Firefox pays for every drawn layer). `M.xy(ll, t)` gives screen px of a lon/lat for your own marks. Measured in headless Firefox: 16.7 ms a frame on the globe-to-map beat.

## Port

Serve your own worktree's `site` on your own port (`python3 .claude/skills/papermorph/scripts/serve.py <port> site`); 8790 belongs to the base. Pass `--url http://localhost:<port>/pandemic-shorts/` to `shot.py`, `strip.py`, `perf.py`, `safe.py`, `export.py`.

## Do not edit

`lib/` (engine, `shorts.js`, `pandemic.js`, `pglobe.js`, `book.css`), `img/art.js`, `img/geo-lite.js`, the film's files in `img/` and `ch00/`. A piece you need that is missing goes in your episode's own folder (`chNN/chNN.js`); tell the coordinator if it should move into the base. Your own pictures go in `img/` under names no other episode uses (`ep3-…`), with their rows added to `img/SOURCES.md` at the end, in one block for your episode.
