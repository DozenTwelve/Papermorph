# Films: documentaries and shorts

A film is a narrated argument told in pictures moved in step with a voice. It comes in two shapes that share almost everything: a **documentary** on the wide stage, two minutes for one idea or ten to fifteen for a book's argument ([documentary.md](documentary.md)), and a **short** on the upright 900 × 1600 stage for a phone feed, one point in one to three minutes ([shorts.md](shorts.md)). Read this file first, then the one for the shape.

The approved references, levels to reach rather than formats to copy: *Madness and Civilization* (after Foucault, ten minutes, `site/madness/`) for documentaries, *Shooting an Elephant* (`site/shooting-an-elephant/`) for one the reader acts in, and *Madness and Civilization* episode 1, *The Ship* (`site/madness-shorts/ch01/`), for shorts.

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
2. **The outline.** Ask for the user's outline (hook, steps, ending) before writing anything; without one, build it together, since the argument is theirs. A series: its name, how many episodes, a proposed split with each episode's one point as options to click, and how each episode hands on to the next.
3. **Length, audience, platform.** Ten minutes holds one argument with five or six turns, two minutes one turn, a short one point. Who watches (an overseas feed, a home audience) and, for a short, which platform.
4. **The look.** One ground colour for the whole film (burgundy `#5a0e16` for Foucault, chosen from four tested with the actual pictures on them), two fonts (a condensed sans for key words, a serif for quotes and captions), and how pictures are treated ([below](#pictures)). Offer a ground test, three or four grounds with real pictures on them side by side, before anything is built. The colours live in the book's `lib/book.css`, which the kit reads; pictures are baked to match with `prep.py --ink/--paper`.
5. **People.** Period pictures for the dead, cut-out figures or drawings for the living, never photographs of living people's faces.
6. **Sources.** Which numbers and quotes need a source, and how strict to be about anonymous reports ("according to the Wall Street Journal…"). Where the field disputes a claim the hook states as fact, say so and offer ways to put it (historians doubt Foucault's ships of fools; "Foucault went looking for real ones" kept the line and the truth).
7. **Voice, music, pictures and budget** ([below](#voice-and-music)).

Then agree the models ([core/style.md](../core/style.md#models)) and write `books/<book>/style.json` from the kit's: `tier: "documentary"` or `"shorts"`, the user's words, the angle, the look, the voice, the music and the models; a short adds the platform, the source of its argument and the series with each episode's point.

## The folder

`python3 SKILL/scripts/new_book.py documentary <book>` or `… shorts <book>`, with `--maps` for a map ([core/publish.md](../core/publish.md#start-a-book-folder)). The kit's `lib/` lies over the engine's, its `book.css` (the film's colours) replacing the default; a short gets the documentary kit's fonts too.

- `books/<book>/` holds the storyboard (`storyboard.md`, or a short's `chNN-script.md`: outline, beats with what we see, sources), `art/` (`found/` with the downloads and `SOURCES.tsv`, generated pictures and clips, the `prep.py` list, the cost ledger) and `music/`.
- `site/<book>/img/` holds the treated pictures with `art.js` (from `prep.py`), clip sheets with `frames.js` (`frames.py`) and, when used, `lib/lines.js` (`trace.py`). Each `chNN/` has `audio/<lang>/`, `audio/bgm/` and, for a short, `audio/sfx/`.
- The kit's sample beat shows a picture named `first-picture` (a short's: `img/hook-picture.webp`) once it exists. Until a short's picture exists the browser draws a broken image and the console shows one 404, so `shot.py`, which stops on any page error, takes no screenshots. Voice the sample with `tts.py` and open `ch01/` to check the folder works, then replace the narration with the film's script.
- The music line in `chapter.html` is commented out until the film has its track. A short's `chapter.html` also has the map kit's lines commented out; a documentary's has none, so a documentary with a map copies them from `assets/templates/shorts/chapter.html` (`geo-lite.js` and `map.js` after `film.js`, and the start through `loadGlobe()` when a beat uses the globe).
- A documentary's `index.html` is the picture-book series page in the film's colours and fonts, with a credits section listing every picture and recording from `SOURCES.tsv`; a single film is a series of one. A series of shorts gets a series page later, as any book does; until then the player's home button leads nowhere. Shorts can also live on their long film's page: *Madness and Civilization* lists its shorts at `/madness/#shorts`, and the host's `_redirects` sends `/madness-shorts/` there.
- The film's own recurring pieces go in the book's lib: at the end of a documentary's `film.js`, or in a short's second file loaded after `shorts.js` (*Madness and Civilization*: `lib/madness.js`).

## Pictures

- **Find, then record.** `commons.py` searches Wikimedia Commons, downloads only public-domain and CC0 files, and logs each in `SOURCES.tsv`: name, Commons title, licence, author, source URL, any use restriction such as a trademark (it warns), credit line, licence URL and the work's date. The book's credits come from it; one subagent with it found all twenty of Foucault's storyboard pictures in thirteen minutes. The Library of Congress, Old Book Illustrations and the Internet Archive are good too; record those by hand the same way.
- **Treatments**, made by `prep.py`, which also writes `img/art.js` with each picture's size:
  - *print*: the picture keeps its paper, with a border and a soft shadow, like a photograph laid on the ground. Paintings, photographs, title pages.
  - *line*: an engraving's dark lines take the ground's ink colour and the paper drops out, so the figure stands on the ground itself. Woodcuts and engravings with clean lines.
  - *full*: sized for a full-bleed shot on the upright stage.
  - Films made at the same time each keep their own sizes file (`prep.py … --art ch03-art.js`, loaded after `img/art.js`), so no two edit the same line.
- **Generated pictures** fill what no archive has: note each prompt and cost in the ledger, quote the batch before paying, and show the user the pictures as they come. Low quality is usually enough (94 pictures cost $0.84 for a three-episode series); one made from a reference picture, to keep a figure or a style, costs about four times as much ($0.016 against $0.004), since the reference counts as input.
- **One figure per role**, so a figure coming back means something (a callback), not that the cast ran out.
- **Line drawings that draw themselves.** `trace.py` turns a line drawing into ordered strokes; `traced()` draws it on over a few seconds. Striking once or twice; on every picture, a tic.
- **A still that moves.** For one or two moments, `video.py` makes a five-second clip from a still (about $0.42; Kling kept the engraving style), and `frames.py` gives every frame the same treatment on one sprite sheet, played by `anim()` on the beat clock so pause, seek and the export agree. A job takes minutes; `video.py --resume JOBID` picks up an interrupted one. It worked best when rare.

## Maps

A map earns its place when the narration talks about where (the Rhine, the leper houses across Europe, a virus leaving one city). The map kit `assets/templates/maps/` serves both stages: `lib/map.js` draws a paper map (`paperMap()`) and `lib/globe.js` a night globe (`globeShot()`, three.js), both from one view `{ lon, lat, H }`, so a shot hands over from globe to map without a jump.

- Its data come from `geo.py`: `img/geo-lite.js` with the world's countries, capitals and big cities, plus only what the film shows, since each adds weight: `--regions CHN,ITA:region` (China's provinces, Italy's regions), `--detail Wuhan=114.27,30.58,1.5` (rivers, lakes and built-up areas around a city), `--cities`, and `--globe site/<book>/lib` for the globe (three.js and NASA's Black Marble as `img/night.webp`): `uv run --with pillow python3 SKILL/scripts/geo.py site/<book>/img --globe site/<book>/lib` (without `--globe`, plain `python3`). Credit "Natural Earth, public domain" and "Black Marble 2016, NASA Earth Observatory, public domain" in the film's sources.
- The API is the comment at the top of `map.js`; `sample.html` plays every piece (`?wide` on the landscape stage).
- Colour says what kind of thing is on the map: `lit` and `region` fill in the subject's colour (`--map-hot`, the book's red), `hatch` and `areas` draw in ink what is not the subject (an order, a lockdown), so red keeps one meaning. The colours come from `lib/book.css` (`--map-land`, `--map-sea`, `--map-ink`, …) when it sets them.
- Move a map through its `view(t)` (`mapKeys()` for a camera through keys), not by scaling a group above it: Gecko re-rasters a canvas under a scaled parent. A map or globe draws only inside its `on` window (in a shorts `shot()`, the shot's), since Firefox pays for every drawn canvas, even a covered one.
- Without the kit, a Natural Earth coastline as one SVG path in the film's box, with a route drawn on by `along()`, is enough for one still map (Foucault's Europe).

## Voice and music

The mechanics are in [core/sound.md](../core/sound.md). For films:

- **The narrator carries the film**, so offer both kinds by ear: free voices (Edge, or Kokoro, local) and ElevenLabs v4 (`eleven.py`, paid, about $0.07 a minute), the accepted voice on the films so far. Characters can have their own voices for a line or a laugh (the Fool's giggle, a king's edict).
- **Every clip at −14 LUFS** ([core/sound.md](../core/sound.md#levels)); a series that speaks faster than the voice's own pace (*The Pandemic*'s narrator at ×1.1) sets `"tempo"` in each narration file.
- **Music**: classical recordings suit found pictures. A documentary and a short use it differently ([documentary.md](documentary.md#the-order-of-work), [shorts.md](shorts.md#the-order-of-work)).

## Team

The general shape is in [core/team.md](../core/team.md); the director passes are as in [core/review.md](../core/review.md#review-rounds).

- **Documentary**: one **strong** agent makes the whole film with the user (research, script and storyboard, voice and `timings.js`, music, pictures, the film's recurring pieces, the beats, its own checks), and a fresh **strong** director reviews it ([below](#review-rounds)); *Madness and Civilization* and *The Pandemic* were made this way. A long film can be split by part (a turn of the argument, often one music track), each part's builder given the storyboard rows, the marks to land on, the kit's API (to read, not edit) and the first and last frame of the neighbouring parts; that split has not been tried yet.
- **Short**: one **strong** worker per episode, in its own worktree when several run at once ([core/team.md](../core/team.md#workers-in-parallel)), writes the script beat by beat with the user (or the coordinator standing in), voices it, makes or finds the pictures, recording each prompt or source and its cost, builds the beats and runs its own checks: `strip.py` sheets of every beat and the first frame upright with `shot.py --clean`. A fresh **strong** director per episode reviews the exported MP4, and the same worker fixes. A series recut from a long film first gets one worker for what every episode shares (the series card, a globe or map, the voice settings). The *Madness and Civilization* and *The Pandemic* shorts were made this way.

## Review rounds

The loop is in [core/review.md](../core/review.md#review-rounds). For a film:

- **Round 1, on the sheets**, against the reference film or an approved episode. On Foucault it found ten must-fix defects, about half the wrong figure on screen while another was named.
- **Round 2, on the exported MP4**, by another fresh director who watches as a viewer: frames every half second on contact sheets, the first frame alone at full size, the audio transcribed with word times and its loudness measured, each against the script, its sources and the approved films' exports. This round is the lever: each of *The Pandemic*'s six shorts had passed its worker's checks and still had one to three must-fix faults, most the picture saying something other than the voice ("even the vaccinated" drawn as protection).
- **Check a director's measurement** before it goes back as work: one reported loudness no other measurement matched, and a cut "a second late" was Whisper starting a word at the pause before it; check a lag against the clip's own silences, not the transcript alone.
