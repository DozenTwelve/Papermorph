# Films: documentaries and shorts

A film is a narrated argument told in pictures moved in step with a voice. It comes in two shapes that share almost everything: a **documentary** on the wide stage, two minutes for one idea or ten to fifteen for a book's argument ([documentary.md](documentary.md)), and a **short** on the upright 900 × 1600 stage for a phone feed, one point in one to three minutes ([shorts.md](shorts.md)). Read this file first, then the one for the shape. The reference films are listed in [SKILL.md](../../SKILL.md#reference-books).

## Contents

- Intake
- The folder
- Pictures
- Maps
- Voice and music
- Team
- Review rounds

## Intake

Ask as in [core/style.md](../core/style.md#asking). The film is the user's argument; the Skill's work is to make it land.

1. **The point and the angle.** What the film is about, the one thing a viewer should leave with (Foucault: madness was not always locked up; each age decided what to do with it), and what must be in it: a scene, a quote, a person, an ending. What the user stresses is a theme to carry, not a thing to repeat: the first film's two epigraphs, shown four times, were overdone; they belong at the start and the end, with light echoes between.
2. **The outline.** Ask for the user's outline (hook, steps, ending) before writing anything; without one, build it together, since the argument is theirs. A series of shorts has its own questions ([shorts.md](shorts.md#questions-for-the-user)).
3. **Length, audience, platform.** Ten minutes holds one argument with five or six turns, two minutes one turn, a short one point. Turn the minutes into words with the pace of the film's voice ([core/sound.md](../core/sound.md#length-from-words): about 2.4 words a second of finished documentary with the kit's Edge narrator, so three minutes is about 430 words). Who watches (an overseas feed, a home audience) and, for a short, which platform.
4. **The look.** One ground colour and two fonts for the whole film (a condensed sans for key words, a serif for quotes and captions), and how pictures are treated ([below](#pictures)). The colours live in the book's `lib/book.css`, which the kit reads; pictures are baked to match with `prep.py --ink/--paper`. A documentary chooses its ground on its own found pictures ([documentary.md](documentary.md#the-order-of-work)); a short starts from its kit's palette.
5. **People.** Period pictures for the dead, cut-out figures or drawings for the living: a photograph of a living person's face needs that person's leave to be published, and the video platforms take down films that use one without it.
6. **Sources.** Which numbers and quotes need a source, and how strict to be about anonymous reports ("according to the Wall Street Journal…"). Where the field disputes a claim the hook states as fact, say so and offer ways to put it (historians doubt Foucault's ships of fools; "Foucault went looking for real ones" kept the line and the truth). Ask, too, what the user would rather the film not touch at all (a virus's origin): a claim left out costs less than one hedged badly. Where sources disagree with each other, on a date or a number, say which you would use and why, and let the user choose; an illustrative number made up to explain (a price "like a house") is a claim too, and says so.
7. **Voice, music, pictures and budget** ([below](#voice-and-music)).

Then agree the models ([core/style.md](../core/style.md#models)) and write `books/<book>/style.json` from the kit's: `tier: "documentary"` or `"shorts"`, the user's words, the angle, the look, the voice, the music and the models; a short adds the platform, the source of its argument and the series with each episode's point.

## The folder

`python3 SKILL/scripts/new_book.py documentary <book>` or `… shorts <book>`, with `--maps` for a map ([core/publish.md](../core/publish.md#start-a-book-folder)). The kit's `lib/` lies over the engine's, its `book.css` (the film's colours) replacing the default; a short gets the documentary kit's fonts too.

- `books/<book>/` holds the storyboard (`storyboard.md`, or a short's `chNN-script.md`: outline, beats with what we see, sources), `art/` (`found/` with the downloads and `SOURCES.tsv`, generated pictures and clips, the `prep.py` list, the cost ledger) and `music/`.
- `site/<book>/img/` holds the treated pictures with `art.js` (from `prep.py`), clip sheets with `frames.js` (`frames.py`) and, when used, `lib/lines.js` (`trace.py`). Each `chNN/` has `audio/<lang>/`, `audio/bgm/` and, for a short, `audio/sfx/`.
- The kit's sample beat shows a picture named `first-picture` (a short's: `hook-picture`) once `prep.py` has put one by that name into `img/art.js`; until then the beat draws without it. Voice the sample with `tts.py` and open `ch01/` to check the folder works, then replace the narration with the film's script. A file the page asks for and the server lacks is named by `shot.py` and `check.py` as `missing file (404): URL` and counts as an error.
- The music line in `chapter.html` is commented out until the film has its track. A short's `chapter.html` also has the map kit's lines commented out; a documentary's has none, so a documentary with a map copies them from `assets/templates/shorts/chapter.html` (`geo-lite.js` and `map.js` after `film.js`, and the start through `loadGlobe()` when a beat uses the globe).
- The book's `index.html` starts as the picture-book series page; each shape's file says what it becomes.
- The film's own recurring pieces go in the book's lib: at the end of a documentary's `film.js`, or in a short's second file loaded after `shorts.js` (*Madness and Civilization*: `lib/madness.js`).

## Pictures

- **Find, then record.** `commons.py` searches Wikimedia Commons, downloads only public-domain and CC0 files, and logs each in `SOURCES.tsv`: name, Commons title, licence, author, source URL, any use restriction such as a trademark (it warns), credit line, licence URL and the work's date. The book's credits come from it; one subagent with it found all twenty of Foucault's storyboard pictures in thirteen minutes. The Library of Congress, Old Book Illustrations and the Internet Archive are good too; record those by hand the same way.
- **Treatments**, made by `prep.py`, which also writes `img/art.js` with each picture's size (the kit's picture helpers read it; a name it lacks, such as a picture resized by hand, draws at a stand-in size and warns in the console by name, which `check.py` lists):
  - *print*: the picture keeps its paper, with a border and a soft shadow, like a photograph laid on the ground. Paintings, photographs, title pages.
  - *line*: an engraving's dark lines take the ground's ink colour and the paper drops out, so the figure stands on the ground itself. Woodcuts and engravings with clean lines; a portrait shaded with dense hatching turns into a negative this way (its dark shading becomes the ground's light ink), so it goes in as a *print*. A line drawing is transparent between its lines: one that stands in front of something (a door shutting on a figure) takes `pic(…, { back: true })`, which fills it with the ground.
  - *full*: sized for a full-bleed shot on the upright stage ([shorts.md](shorts.md#the-picture)).
  - Films made at the same time each keep their own sizes file (`prep.py … --art ch03-art.js`, loaded after `img/art.js`), so no two edit the same line.
- **Generated pictures** fill what no archive has: `paint.py` (prices, ledger and balance in [core/style.md](../core/style.md#paid-steps)), each prompt noted beside its cost, the batch quoted before paying, the pictures shown to the user as they come. Low quality is usually enough (94 pictures cost $0.84 for a three-episode series); one made from a reference picture, to keep a figure or a style, costs about four times as much.
- **Line drawings that draw themselves.** `trace.py` turns a line drawing into ordered strokes; `traced()` draws it on over a few seconds. Striking once or twice; on every picture, a tic.
- **A still that moves.** For one or two moments, `video.py` makes a five-second clip from a still (paid, [core/style.md](../core/style.md#paid-steps); Kling kept the engraving style), and `frames.py` gives every frame the same treatment on one sprite sheet, played by `anim()` on the beat clock so pause, seek and the export agree. A job takes minutes; `video.py --resume JOBID` picks up an interrupted one. It worked best when rare.

## Maps

A map earns its place when the narration talks about where (the Rhine, the leper houses across Europe, a virus leaving one city). The map kit `assets/templates/maps/` serves both stages: `lib/map.js` draws a paper map (`paperMap()`) and `lib/globe.js` a night globe (`globeShot()`, three.js), both from one view `{ lon, lat, H }`, so a shot hands over from globe to map without a jump.

- Its data come from `geo.py`: `img/geo-lite.js` with the world's countries, capitals and big cities, plus only what the film shows, since each adds weight: `--regions CHN,ITA:region` (China's provinces, Italy's regions), `--detail Wuhan=114.27,30.58,1.5` (rivers, lakes and built-up areas around a city), `--cities`, and `--globe site/<book>/lib` for the globe (three.js and NASA's Black Marble as `img/night.webp`): `uv run --with pillow python3 SKILL/scripts/geo.py site/<book>/img --globe site/<book>/lib` (without `--globe`, plain `python3`). Credit "Natural Earth, public domain" and "Black Marble 2016, NASA Earth Observatory, public domain" in the film's sources.
- The API is the comment at the top of `map.js`; `sample.html` plays every piece (`?wide` on the landscape stage).
- Colour says what kind of thing is on the map: `lit`, `region`, `dots` and `routes` take the subject's colour (`--map-hot`, the book's red), `hatch`, `areas` and a route given `{ colour: MAP_COL.ink, dash: [10, 8] }` draw in ink what is not the subject (an order, a lockdown, the grain trade beside the tulip trade), and a dot whose story is over greys to `MAP_COL.dim`, so red keeps one meaning. The colours come from `lib/book.css` (`--map-land`, `--map-sea`, `--map-ink`, …) when it sets them.
- Move a map through its `view(t)` (`mapKeys()` for a camera through keys), not by scaling a group above it: Gecko re-rasters a canvas under a scaled parent. A map or globe draws only inside its `on` window (in a shorts `shot()`, the shot's), since Firefox pays for every drawn canvas, even a covered one.
- **A film carried by a map.** When the map is the stage rather than a shot or two (Tulip Mania's Holland, a war's front), keep it one map. Each beat builds its own `paperMap()`, so open each beat on the last view of the beat before (one shared key) and give the marks it brings along a `t0` below 0, which draws them already there: the cut shows no blink (the `carry` beat of `sample.html`). Let the camera carry the film: a pull-out ends the towns' labels with a `t1` before they pile up, a close-in brings its own; labels that would still cover each other take the other side or hide, and the console names them. Words over the paper map need a ground: `mapBand()` (the film's ground under its chalk) or a short's `label()`; the documentary's cream `key()`, `tag()` and `say()` vanish on the cream land, so a credit on a map takes `fill: MAP_COL.ink`. Lay a picture beside the place the voice names, not on it, and take it off before the camera moves there. A sea route takes `via` points to stay at sea (round the Cape, not over the Sahara). Scale: the stage's short side spans about 115 × H degrees of latitude (900 px at 450 / H px per Earth radius), so H .1 frames Italy, .016 Holland from Rotterdam to Den Helder, and Tulip Mania's towns needed .007 to .014. At those scales the coast is Natural Earth's 50 m, thinned to 0.02°: a ruler line that put Haarlem, 5 km inland, on the beach. `--detail` brings 10 m rivers and lakes (with `urban: false`, without today's built-up areas) but not a finer coast: check a town near the shore against a period map, and draw the shore it needs as an `areas` ring.
- **Another century.** The data are today's world, and `geo.py` says so each run: the Zuiderzee is a lake behind a dam with Flevoland drained out of it, the Haarlemmermeer is land, the borders are today's and the built-up areas reach Schiphol. A film set before such changes draws them back: an old sea as an `areas` ring filled `MAP_COL.sea` with `line: null` (Tulip Mania's 1630s Zuiderzee and Haarlem lake, rough outlines from a period map), and a country that did not exist yet lit as the `region`s or the `areas` outline it then had, not as today's `lit` iso.
- Without the kit, a Natural Earth coastline as one SVG path in the film's box, with a route drawn on by `along()`, is enough for one still map (Foucault's Europe).

## Voice and music

The mechanics are in [core/sound.md](../core/sound.md). For films:

- **The narrator carries the film**, so offer both kinds by ear: free voices (Edge, or Kokoro, local) and ElevenLabs v4 (`eleven.py`, paid, [core/style.md](../core/style.md#paid-steps)), the accepted voice on the films so far. Characters can have their own voices for a line or a laugh (the Fool's giggle, a king's edict).
- **Every clip at −14 LUFS** ([core/sound.md](../core/sound.md#levels)); a series that speaks faster than the voice's own pace (*The Pandemic*'s narrator at ×1.1) sets `"tempo"` in each narration file.
- **Music**: classical recordings suit found pictures. A documentary and a short use it differently ([documentary.md](documentary.md#the-order-of-work), [shorts.md](shorts.md#the-order-of-work)).

## Team

The general shape is in [core/team.md](../core/team.md); the director passes are as in [core/review.md](../core/review.md#review-rounds).

Each shape splits the work its own way: [documentary.md](documentary.md#team), [shorts.md](shorts.md#team).

## Review rounds

The loop is in [core/review.md](../core/review.md#review-rounds). For a film:

- **Round 1, on the sheets**, against the reference film or an approved episode. On Foucault it found ten must-fix defects, about half the wrong figure on screen while another was named.
- **Round 2, on the exported MP4**, by another fresh director who watches as a viewer: frames every half second on contact sheets, the first frame alone at full size, the audio transcribed with word times and its loudness measured, each against the script, its sources and the approved films' exports. This round is the lever: each of *The Pandemic*'s six shorts had passed its worker's checks and still had one to three must-fix faults, most the picture saying something other than the voice ("even the vaccinated" drawn as protection).
- **Check a director's measurement** before it goes back as work: one reported loudness no other measurement matched, and a cut "a second late" was Whisper starting a word at the pause before it; check a lag against the clip's own silences, not the transcript alone.
