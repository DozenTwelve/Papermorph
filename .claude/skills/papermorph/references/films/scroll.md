# Scroll pages

A scroll page tells a story the reader moves through with their own thumb: the text runs in cards, and a picture pinned beside it (above it on a phone) changes as they scroll. Scrolling back plays the picture in reverse. It is a film's material, the found pictures, maps, numbers and script, read at the reader's own pace instead of the voice's. *The Pandemic* has both: the [documentary](https://papermorph.diamonddoge.org/pandemic/) and the [scroll story](https://papermorph.diamonddoge.org/pandemic-scroll/) recut from it, 23 steps.

It lives in this folder because its material and its research are a film's: [films.md](films.md) for intake, sources, licences and maps applies as it is. What differs is the clock: there is none. The page runs outside the engine and the beat player, so nothing in [core/engine.md](../core/engine.md) about beats, narration, captions or export applies here.

## When it fits

Offer one when the reader will want to stop and look: numbers to compare, a map to study, a sequence of dates, a page to send someone who will read it on a phone in a queue, with the sound off. A film carries the reader along; a scroll page lets them linger on the count and skip the part they know. It suits a documentary's argument recut as a read, or an idea that is mostly maps and numbers to begin with.

It is the wrong shape for a story that lives in a voice, music or acting (a picture book, a short), and for a lesson that asks the reader questions: those need the engine's player.

## Start one

```sh
python3 SKILL/scripts/new_book.py scroll <book> [--lang xx] [--root DIR]
```

It copies the kit, [`assets/templates/scroll/`](../../assets/templates/scroll/), into `site/<book>/`: `index.html` (the page and its four sample steps), `story.js` (the sample's pictures), `lib/scroll.js` and `lib/scroll.css` (the kit, which a book leaves alone), the documentary kit's fonts, and `img/geo-lite.js` (Natural Earth's 1:110m countries, for the sample's map). It copies the kit's `style.json` into `books/<book>/` and its check, `e2e.py`, to `tools/<book>/e2e_scroll.py`. It runs no `engine.py` and makes no chapter or narration folders. Open the sample before changing anything: four steps, a world map that fades in, nineteen cities that appear one by one, a dive to Asia, a bar chart over the darkened map. Each is one of the things a step usually does.

The kit is a starting point, not a form to fill: *The Pandemic*'s scroll page was written before it with its own code. Change it, or write the page another way when the story wants something the kit does not do; keep the check (`e2e_scroll.py`) or one like it, so you can see every step.

## The order of work

1. **Intake and the angle**, as for a film ([films.md](films.md#intake)): what the reader should leave with, the look, where the material comes from. If the page is recut from a film the user approved, its `style.json`, sources and pictures are the start; ask only what changes (the angle of a read is often one turn shorter).
2. **The step list**, before any drawing: one line per step, the card's words and what the picture shows at the step's end. Twelve to twenty-five steps is a page; fewer than six is a figure, more than thirty a chapter. Show the list to the user.
3. **The data and pictures**: maps from `geo.py` (below), numbers with their source, pictures from `commons.py` and treated by `prep.py` as for a film ([documentary.md](documentary.md)). Every source goes into the page's credits.
4. **The cards** (`index.html`), then **the pictures** (`story.js`), a few steps at a time, checked and looked at after each batch (below).
5. **The user reads it on a phone** before it is published. A page the Skill made is a first cut, like a chapter.

## Steps and their pictures

The page's `<section class="step" data-key="…">` elements are the steps, in order. The kit turns the scroll into one number, **P = k + f**: step k (counted from 0) and the fraction f of the way through it, read from the scroll position alone. `story.js` hands a drawing function to the kit once, `scrollStory(P => { … })`, and that function paints the whole picture for that P on the canvas. Because the picture depends on nothing else, scrolling back is rewinding, a reload at any place shows the same frame, and a link to `#step-7` lands on step 7's picture.

So every change is a window of P, named by step keys, never a timer or an event:

- `at('cities', .3)` is the P 30 % into the step whose `data-key` is `cities`; a key no step has is named on the console.
- `ramp(P, a, b)` goes 0 to 1 between two such points (eased), `win(P, a, b, c, d)` on and then off again; every fade, growth and move on the page is one of these.
- `cam(keys, P)` is a camera through `[P, x, y, r]` keys and `view(box, x, y, r)` puts world point (x, y) at the centre of the canvas with world radius r fitted in; `toWorld(V)` draws in world units, `V.sx`, `V.sy` place a label in screen px.
- `text`, `chip` (a label on a paper chip, kept inside the canvas), `dot`, `ring`, `veil`, `cover(IMG[name], box)` (a picture covering a box), `hatch(V)` (a pattern for areas), `paperTop(a)` (the paper vignette over a paper scene); sizes are in `fs(n)`, about a hundredth of the canvas's shorter side, so type scales from a phone to a wide screen.
- `pictures(['name', …])` loads `img/name.webp` into `IMG` and redraws as each arrives; one that fails is named on the console.
- Colours and fonts are CSS variables in the page's `<style>` (`--paper --ink --soft --accent --night`, `--font-key`, `--font-text`); the kit reads them into `C.paper`, `C.accent`, `KEYF`, `SERF`, so the cards and the canvas always agree.

The header comment of [`lib/scroll.js`](../../assets/templates/scroll/lib/scroll.js) lists these with their arguments; the names it declares are global, and `story.js` declaring one of them again stops the page with a redeclaration error, which the check reports. Write scenes as the sample does: one function per stretch of the story, each fading itself in and out over its own windows, called in order from the drawing function, so a scene that is not on screen costs a comparison and nothing more.

What makes a step good:

- **One change per step**, the one its card names, finished by the step's end: the next card arrives on a settled picture. A step whose picture changes while the reader is still on the previous card has its windows too early.
- **The end of a step is the start of the next**: a scene carried across steps (a map that zooms on) keeps its state, so the reader never sees a jump. Overlap fades rather than cutting where two scenes meet.
- **Words beside what they name**: a label on the dot, the date in a chip, the count next to the bar. What the picture says is also in the card, because the canvas is hidden from screen readers (`aria-hidden`) and some readers will skip it.
- **Motion that explains**: a camera that dives to where the next card is about, bars that grow to their value, dots that appear in the order the text counts them. Decoration that moves while the reader reads pulls the eye off the words.

## Words: cards, not narration

A scroll page has no voice: the reader reads. Rewrite a film's narration for reading rather than pasting it: a card is 40 to 90 words (two or three short paragraphs on a phone), it names what the picture shows, and it can carry what a voice cannot, such as a source line (`<p class="src">`), a quotation in a `blockquote`, a link. The kit plays no sound; a page that wants the film's voice links to the film.

## Phones and wide screens

`lib/scroll.css` is phone first: the picture holds the top 60 % of the screen and each card sticks in the band below it while its step plays, then slides up under the picture as the next arrives. From 820 px wide the cards run in a column on the left and the picture is pinned on the right. `--trig` is the line a step starts at (a fraction of the window's height from the top; the cards stick to it), and the check measures every card against the room under it: a card taller than that shows its last lines only as its step leaves, so shorten it or split the step. On a short phone (under 720 px tall) the picture and the type shrink.

Draw for both shapes. The canvas is tall on a phone and wide on a desktop, so frame by what must be in view, not by a fixed zoom: the sample's `fit(w, h)` gives the camera radius that fits a w × h degree box into whichever canvas it gets. Keep labels a few `fs` inside the edges, and look at both sizes' screenshots.

## Reduced motion

A reader who asked their system for reduced motion gets each step's finished picture as soon as the step arrives (P jumps from one whole number to the next): no fades, dives or growth while scrolling, and the same pictures. Nothing in `story.js` needs to do anything for it, as long as each step's end is a complete picture. Smooth scrolling is turned off for them too.

## Maps and data

`geo.py` writes `img/geo-lite.js` from Natural Earth (public domain), the same data the map kit uses ([films.md](films.md#maps)); `geoPaths(GEO_LITE.lod[0])` gives one `Path2D` per country (ISO 3166 alpha-3 key) in degrees, x the longitude and y minus the latitude, ready for `view` and `toWorld`. `lod[1]`, the 50m world, is for close views. It is an equirectangular map: fine for the world or a continent; for a close view far from the equator, pass `cos(latitude)` of the centre as the second argument so the land is not stretched wide. Big data files cost a phone their download: *The Pandemic*'s page cut 7.5 MB of film map data to 0.5 MB with a small script of its own (`site/pandemic-scroll/making/prep.mjs`), simplifying paths and keeping only the rings that come into view. Keep such a script with the page, so the data can be made again.

## Checking it

The engine's tools (`check.py`, `shot.py`, `strip.py`, `still.py`, `perf.py`, `export.py`, and `lint.py`, which looks for chapter folders) read a chapter's `BEATS` and do not work on a scroll page. The kit's check does instead:

```sh
python3 SKILL/scripts/serve.py 8765 site &
uv run --with playwright python3 tools/<book>/e2e_scroll.py http://localhost:8765/<book>/ --out books/<book>/review/scroll
```

In Chromium and Firefox, on a 1280 px window and a 390 px phone, it reports page errors, console errors (the kit's own reports among them) and missing files; scrolls down through the page and back up, and names a place where P went backwards, a step no scroll position landed in, or a place where scrolling back drew a different P; checks that reduced motion holds each step at a whole number; names cards too tall for their band; and prints render times (over 16 ms at the 95th percentile, a phone drops frames). With `--out` it writes a screenshot of the middle and the end of every step at both sizes: open them. They are the only view of the pictures the check gives, and the place to see a label off the edge, a card covering what it names, a scene that has not finished by its step's end. `scrollyRender(P)` in the browser's console draws any P, for a closer look at one moment.

Publishing is as for any book ([core/publish.md](../core/publish.md)): `site/<book>/` is static files; credit every source in the page's footer.
