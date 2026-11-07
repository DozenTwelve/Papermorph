# Pages you explore: a map that changes, people who walk it

An explorable page is one map the reader moves through in time. Each year (or step) plays its events on the map: the camera goes to the place, a pin drops, a card with a picture and a clip, a region lit, the borders redrawn when the story changes them. Then the people walk to where that year took them, the camera following each. Between films the reader is in charge: a click on a person or a ringed place opens its card and plays its clip, ← and → move through the years. *Time of the Magicians* (Europe 1919–1929, four philosophers) and *The Map Redrawn* (Japan 1868–1878, the domains becoming prefectures) on https://papermorph.diamonddoge.org/ are the two reference pages; the kit is *The Map Redrawn*'s player, made general.

The kit is one way to start, not the shape every page must take. *Time of the Magicians* was built without it; a subject that wants a different page (no years, a city plan instead of a country, a globe, no walking people) is better served by drawing it fresh than by bending the sample. Take from the kit and the two pages what fits, and keep `explore.py`'s checks either way.

Choose it over a film when the subject is **where**, and the reader's own order is worth more than the narrator's: borders that move, several lives crossing one map, a decade the reader wants to step back and forth through. A film argues, one picture after another, at the narrator's pace; this page lets the reader look at what the film would only pass. When the user wants both, make the film ([films.md](../films/films.md)) and this page from the same research; they share the facts, the pictures and the voice, not the code.

These pages are not on the engine: `lib/explore.js` runs on its own clock (timers and `requestAnimationFrame`), so there are no beats, no `?beat=N&t=T`, no `export.py` video and no `lint.py`. Its checks are `explore.py`'s (below).

## Start and order of work

`python3 SKILL/scripts/new_book.py explore <book>` copies the kit into `site/<book>/`: `index.html`, `lib/` (`explore.js` and `topo.js`, the same in every book; `page.css`, the look; `states.js`, `story.js`, `events.js`, `sprite.js`, the book's data), `data/map.topo.json` and an empty `audio/<lang>/timings.js`. It runs as it is: a sample, Italy 1859–1861, with Garibaldi and Cavour and three ringed cities, which you replace file by file. The style conversation fills `books/<book>/style.json` ([core/style.md](../core/style.md)); for this page it settles the region and years, the people, the look and the voice.

1. **The story first, in words.** For each year: what happened where (two to five events), where each person went, and what a reader clicking on a person or a place should hear. Check every date and place against a second source, as the reference pages did, and keep the sources in `books/<book>/`. A year card is two or three sentences; a long card is a film beat in the wrong place.
2. **The map** ([below](#the-map-data-and-its-states)): the shapes, then the states the story moves them through.
3. **The data files**: `story.js` (people, places, each year's cards), `events.js`, `states.js`. The kit checks them on load and says in the console what it cannot do: a route stop missing from `PLACES`, a route that ends somewhere other than `at`, a year without a card for someone, an event naming a state or a region the map does not have.
4. **Look** at it with the reading-time clips (a card with no clip stays up for a time that follows its length): `explore.py check`, then `explore.py shots` and the pictures.
5. **The voice**: `explore.py narration` writes every card's text into `content/<book>/narration.<lang>.json` (ids `<year>-e<n>`, `<year>-<person>`, `place-<key>`), then `tts.py` or `eleven.py` voices it into `site/<book>/audio/<lang>/` ([core/sound.md](../core/sound.md)). The page plays the clips `timings.js` lists. After a text changes, run both again: only the changed clips are made.
6. **Music**, if the user wants it: `window.MUSIC = [{ from: year, src }]` in a `lib/voiced.js` loaded before `explore.js`, one looping track per era, cross-faded when the year crosses into the next and quieter under every clip (`?bgm=0.3` sets the level by ear). Without tracks the Music button is hidden.
7. **Check, shots, timing** in both browsers ([below](#seeing-your-own-page)), then the user's viewing, on a phone too.

## The map data and its states

The map is one TopoJSON file in which every border two areas share is one line both use: the page can then draw a line only where two *groups* meet, so the same file shows domains in 1868 and prefectures in 1871, or Italy's seven states in 1859 and one kingdom in 1861. `topo.py` makes it from Natural Earth (public domain):

```
python3 SKILL/scripts/topo.py site/<book>/data/map.topo.json --iso ITA,SMR,VAT,FRA,CHE,AUT,MCO \
    --bbox 5.5,36.4,19,47.3 --keep name,region,adm0_a3 --dissolve region --cone 38,46,42,12.5 --tol 400 --q 50000
```

- `areas`: today's provinces and states (admin-1) of the countries named, or countries with `--layer 50m_admin_0_countries`. Take the smallest pieces the story's borders follow, and every area from one layer: two sources draw a shared border with different points, and the run then reports few shared borders.
- `--cone` is the projection, a Lambert conic: its two parallels across the map's own latitudes, its origin in the middle. The file records it, and the page projects places with it.
- `--dissolve FIELD` adds `regions`, the areas sharing that property merged, which an event's `glow` lights by name.
- Size: the sample is 106 KB (166 areas). A file over about 2 MB loads slowly on a phone; raise `--tol`, or drop neighbours the camera never reaches.

The shapes are today's. A map of another century groups them in `states.js`: each state's `group(d)` gets one area's properties and returns the group it belongs to that year (`{ key, name, color?, kind? }`). An old border that does not follow a modern province is drawn along the nearest one; say so in a state's `note` and in the credits, as the sample does. Where the old borders matter more than that (*The Map Redrawn*: village-level domains from a research dataset; *Time of the Magicians*: CShapes' yearly borders, CC BY-NC-SA), find a historical dataset, check its licence, and convert it to TopoJSON with the same three objects; `ATLAS` in `states.js` names any other object names and the projection. A licence that forbids commercial use binds the whole page: tell the user before using it.

An event moves the map to a state (`state: 'villafranca'`): the areas fade to their new colours, the lines that go and the lines that come are drawn in the accent and fade, the label under the year changes. Going back a year returns the map to that year's last state.

## People, places and cards

- `PEOPLE`: name, short name (the tag on the map), colour; `img` adds a portrait to the card. `sprite.js` draws the walking figure: the sample's is a paper cut-out in the person's colour; a painted cut-out (one picture per person, facing right, outlined so it reads on any land colour) is what *The Map Redrawn* uses.
- `PLACES[key] = [label, lon, lat, side]`: every route stop. A fifth item `true` makes a marker for "abroad" that the page keeps inside the frame (*The Map Redrawn*'s America). `RENAMED` names one spot by another key from a year on (Edo becomes Tokyo).
- `YEARS[year][person]`: `route` (the stops walked that year), `at` (where they end it), `place` and `text` (the card), `gone: true` once they leave the story (the chip stays, drawn hollow, and the card says why). Years are consecutive integers.
- `PLACE_CARDS[key] = { text, title?, from?, to?, pic? }`: a place the reader can click, ringed on the map in the years it shows.
- `EVENTS[year]`: `{ title, at: [name, lon, lat], text, pic, caption?, glow?, state? }`. The camera goes close for a pin, wider (1500 km) for an event that changes the map, so the change can be seen.

## The camera and the screen

The camera eases on a log scale (a long zoom feels even), and every close-up is framed inside the part of the screen no card or control covers: the card goes on the side away from the place, and on an upright phone it is a sheet at the bottom with the place above it. Names are laid out each time the camera stops: the event's name always, the lit region, where someone stands, then places only passed through, each giving way rather than overlapping a card, a figure or another name. People in one town stand side by side off the coast with a thin leader line to their place. `ATLAS.rotate` turns a long country across a wide screen and along an upright one (Japan: 30° and −60°); a north mark appears when the map is turned.

## Firefox and performance

The map is SVG, and Firefox redraws all of it on every frame the view changes. What *The Map Redrawn* learned, now in the kit:

- **Coarse shapes while the camera moves.** Every shape exists twice, as the file has it and simplified (about 1 km, islets under 2 km left out); `setLite` swaps them in for every camera move and walk, and the thin lines between groups are not drawn until it stops. With 220,000 points and the lines, a moving frame took 150–200 ms; with this, under 20.
- **The coast in pieces.** The coast is many short paths, each its arcs inside a 50 km square, not one path: Firefox strokes a path once for every raster tile it reaches, and the whole coast as one path cost about 150 ms each time the map was drawn.
- **Strokes that do not scale** (`vector-effect: non-scaling-stroke`), labels and figures drawn at screen size inside a group scaled to the view, and no live CSS filters on the map.
- **One file per map**, loaded once; the grain is a small tile baked at load.

The bar is a median frame under 20 ms in Firefox while the camera moves, measured with `explore.py perf`. Over it, simplify the data (`--tol`), or lower `ATLAS.rough` and `ATLAS.coastCell` (in the file's units) before touching the code.

## Seeing your own page

`check.py`, `shot.py` and `perf.py` seek beats; on an explore page they stop and say so. `explore.py` drives the page through `window.MAP` instead (`python3 SKILL/scripts/serve.py 8765 site` first):

| | What it shows |
|---|---|
| `explore.py check URL` | in Chromium and Firefox: page errors, missing files, the kit's console messages; every year's film run with each card clicked on (`?speed=8` for waits and walks; clips still play through); every person's and every ringed place's card opened by a click, and whether its clip plays. Exit 1 on an error, a missing file or a clip that does not play |
| `explore.py shots URL --out DIR` | the start, every event card as it shows, every year's end, every place card; `--size 390x844` for an upright phone, `844x390` for one held sideways |
| `explore.py perf URL` | Firefox frame times during camera moves to each event and back, and one year's film |
| `explore.py narration URL FILE` | the card texts into the narration file |

Look at the shots for what no check sees: a card over the place it is about, a name dropped that the reader needed, a figure standing in a lake, a close-up that lands beside its event, a state's colours where two neighbours look alike. Then play it yourself at speed 1 with sound, in Firefox, going forward and back, clicking during a film and a walk. `?speed=4` plays the film faster; `?rot=0` shows a turned map unturned.
