# Films: documentaries and shorts

A film is a narrated argument told in pictures moved in step with a voice. It comes in two shapes that share almost everything: a **documentary** on the wide stage, two minutes for one idea or ten to fifteen for a book's argument ([documentary.md](documentary.md)), and a **short** on the upright 900 × 1600 stage for a phone feed, one point in one to three minutes ([shorts.md](shorts.md)). Read this file first for either, then the one for its shape.

The approved references: *Madness and Civilization* (after Foucault, ten minutes, `site/madness/`) for documentaries, *Shooting an Elephant* (`site/shooting-an-elephant/`) for a documentary the reader acts in, and *Madness and Civilization* episode 1, *The Ship* (`site/madness-shorts/ch01/`), for shorts. Open them and match their level; they are levels to reach, not formats to copy.

## Contents

- Intake
- The folder
- Pictures
- Maps
- Voice and music
- Team
- Review rounds

## Intake

A short conversation in the spirit of [core/style.md](../core/style.md#asking): choices to click, the user's words kept verbatim, skipping what the request already settles. The film is the user's argument; the Skill's work is to make it land.

1. **The point and the angle.** What the film is about, and the one thing a viewer should leave with (Foucault: madness was not always locked up; each age decided what to do with it). Ask what must be in it: a scene, a quote, a person, an ending. What the user stresses is a theme to carry, not a thing to repeat: the first film's two epigraphs, shown four times, were overdone; they belong at the start and the end, with light echoes between.
2. **The outline.** Ask for the user's outline before writing anything: the hook, the steps, the ending. If there is none, build it together; the argument is the user's, not invented. A series: its name, how many episodes, where the material divides (propose a split, each episode with its one point, as options to click), and how each episode hands on to the next.
3. **Length, audience, platform.** Ten minutes holds one argument with five or six turns; a two-minute film holds one turn; a short holds one point. Who watches (an overseas feed, a home audience), and for a short, which platform.
4. **The look.** One ground colour for the whole film (burgundy `#5a0e16` for Foucault, chosen from four tested with the actual pictures on them), two fonts (a condensed sans for key words, a serif for quotes and captions), and how pictures are treated ([below](#pictures)). Offer a ground test: three or four grounds with real pictures on them, side by side, before anything is built. The colours live in the book's `lib/book.css`, which the kit reads; pictures are baked to match with `prep.py --ink/--paper`.
5. **People.** How real people appear: period pictures for the dead, cut-out figures or drawings for the living, never photographs of living people's faces.
6. **Sources.** Which numbers and quotes need a source, and how strict to be about anonymous reports ("according to the Wall Street Journal…"). Look at the argument too: where the field disputes a claim the hook states as fact, say so and offer ways to put it (historians doubt Foucault's ships of fools; "Foucault went looking for real ones" kept the line and the truth).
7. **Voice, music, pictures and budget** ([below](#voice-and-music)): the narrator picked by ear from short samples in the film's own words, the music, found or generated pictures, and what each costs.

Then agree the models ([core/style.md](../core/style.md#models)) and write `books/<book>/style.json` from the kit's `style.json`: `tier: "documentary"` or `"shorts"`, the user's words, the angle, the look, the voice, the music and the models; a short adds the platform, the source of its argument and the series with each episode's point.

## The folder

`python3 SKILL/scripts/new_book.py documentary <book>` or `… shorts <book>`, with `--maps` when the film has a map ([core/publish.md](../core/publish.md#start-a-book-folder)). It lays the kit's `lib/` over the engine's, its `book.css` (with the film's colours) replacing the default; a short gets the documentary kit's fonts too.

- `books/<book>/` holds the storyboard (`storyboard.md`, or a short's `chNN-script.md`: the outline, the beats with what we see, the sources), `art/` (`found/` with the downloaded pictures and `SOURCES.tsv`, generated pictures and clips, the `prep.py` list, the cost ledger) and `music/`.
- `site/<book>/img/` holds the treated pictures with `art.js` (`prep.py` fills it), clip sheets with `frames.js` (`frames.py`) and, when the film uses them, `lib/lines.js` (`trace.py`). Each film `chNN/` has `audio/<lang>/`, `audio/bgm/` and, for a short, `audio/sfx/`.
- The kit's sample beat shows a picture named `first-picture` (a short's: `img/hook-picture.webp`) once there is one. Until a short's picture exists the browser draws a broken image behind its words and the console shows one 404, so `shot.py`, which stops on any page error, takes no screenshots. Voice the sample with `tts.py` and open `ch01/` to check the folder works, then replace the narration with the film's script.
- The music line in `chapter.html` is commented out until the film has its track, and so are the map kit's lines.
- A documentary's `index.html` is the picture-book series page, given the film's colours and fonts and a credits section listing every picture and recording from `SOURCES.tsv`; a single film is a series of one. A series of shorts gets a series page later, as any book does; until then the player's home button leads nowhere. Shorts can also live on their long film's series page: *Madness and Civilization* lists its shorts at `/madness/#shorts`, and the host's `_redirects` sends `/madness-shorts/` there.
- The film's own recurring pieces go in the book's lib: at the end of a documentary's `film.js`, or a short's second file loaded after `shorts.js` (*Madness and Civilization*: `lib/madness.js`).

## Pictures

- **Find, then record.** `commons.py` searches Wikimedia Commons and downloads only public-domain and CC0 files, logging each in `SOURCES.tsv` beside the downloads: name, Commons title, licence, author, source URL, any use restriction such as a trademark (which it warns about), the credit line, the licence URL and the work's date. The book page's credits come from it. One subagent with it found all twenty storyboard pictures for Foucault in thirteen minutes. Other good sources: the Library of Congress, Old Book Illustrations, the Internet Archive; record those by hand the same way.
- **Treatments**, made by `prep.py`, which also writes `img/art.js` with each picture's size:
  - *print*: the picture keeps its paper, with a border and a soft shadow, like a photograph laid on the ground. Paintings, photographs, title pages.
  - *line*: an engraving's dark lines turn into the ground's ink colour and the paper drops out, so the figure stands on the ground itself. Woodcuts and engravings with clean lines.
  - *full*: sized for a full-bleed shot on the upright stage.
  - Films made at the same time each keep their own sizes file (`prep.py … --art ch03-art.js`, loaded after `img/art.js`), so no two of them edit the same line.
- **Generated pictures.** An image model fills what no archive has; note each picture's prompt and cost in the ledger, quote the batch before paying, and show the user the pictures as they come. Low quality is usually enough (94 pictures cost $0.84 for a three-episode series); a picture made from a reference picture, to keep a figure or a style, costs about four times as much, since the reference counts as input ($0.016 against $0.004).
- **One figure per role**, so that a figure coming back means something (a callback), not that the cast ran out.
- **Line drawings that draw themselves.** `trace.py` turns a line drawing into ordered strokes; `traced()` draws it on over a few seconds. It is striking once or twice; on every picture it becomes a tic.
- **A still that moves.** For one or two moments, `video.py` makes a five-second clip from a still (about $0.42; Kling kept the engraving style), and `frames.py` gives every frame the same treatment on one sprite sheet, played by `anim()` on the beat clock so pause, seek and the export agree. A job takes minutes; `video.py --resume JOBID` picks up one that was interrupted. It worked best when rare.

## Maps

A map earns its place when the narration talks about where (the Rhine, the leper houses across Europe, a virus leaving one city). The map kit `assets/templates/maps/` serves both shapes on either stage: `lib/map.js` draws a paper map (`paperMap()`) and `lib/globe.js` a night globe (`globeShot()`, three.js), both from one view `{ lon, lat, H }`, so a shot hands over from the globe to the map without a jump.

- Its data come from `geo.py`: `img/geo-lite.js` with the world's countries, capitals and big cities, plus only what the film shows, since each adds weight: `--regions CHN,ITA:region` (China's provinces, Italy's regions), `--detail Wuhan=114.27,30.58,1.5` (rivers, lakes and built-up areas around a city), `--cities`, and `--globe site/<book>/lib` for the globe (three.js and NASA's Black Marble as `img/night.webp`): `uv run --with pillow python3 SKILL/scripts/geo.py site/<book>/img --globe site/<book>/lib` (without `--globe`, plain `python3`). Credit "Natural Earth, public domain" and "Black Marble 2016, NASA Earth Observatory, public domain" in the film's sources.
- The API is the comment at the top of `map.js`; `sample.html` plays every piece (`?wide` on the landscape stage).
- Colour says what kind of thing is on the map: `lit` and `region` fill in the subject's colour (`--map-hot`, the book's red), `hatch` and `areas` draw in ink what is not the subject (an order, a lockdown), so the red keeps one meaning. The colours come from `lib/book.css` (`--map-land`, `--map-sea`, `--map-ink`, …) when it sets them.
- Move a map through its `view(t)` (`mapKeys()` for a camera through keys), not by scaling a group above it: Gecko re-rasters a canvas under a scaled parent. A map or globe draws only inside its `on` window (in a shorts `shot()`, the shot's), since Firefox pays for every drawn canvas, even a covered one.
- Without the kit, a coastline from Natural Earth as one SVG path in the film's box, with a route drawn on by `along()`, is enough for one still map (Foucault's Europe).

## Voice and music

The mechanics (the narration file, `tts.py` and `eleven.py`, levels, `music.py`, recording licences) are in [core/sound.md](../core/sound.md). For films:

- **The narrator carries the film**, so the user picks it by ear. Offer both kinds: free voices (Edge, or Kokoro, local) and ElevenLabs v4 through OpenRouter (`eleven.py`, paid). ElevenLabs was the accepted voice on the films so far. Edge and Kokoro cost nothing; ElevenLabs about $0.07 a minute (`eleven.py --dry` prints the estimate; quote it). Characters can have their own voices for a line or a laugh (the Fool's giggle, a king's edict).
- **Every clip at one level**, −14 LUFS ([core/sound.md](../core/sound.md#levels)); a series that speaks faster than the voice's own pace (*The Pandemic*'s narrator at ×1.1) sets `"tempo"` in each narration file.
- **Music**: classical recordings suit found pictures; generated music (Lyria) is made outside the Skill for now. How a documentary and a short each use it differs ([documentary.md](documentary.md#the-order-of-work), [shorts.md](shorts.md#the-order-of-work)). Leave `?bgm=` on the page so the user can set the level by ear ([core/sound.md](../core/sound.md#music)).

## Team

The general shape is in [core/team.md](../core/team.md).

- **Documentary**: split by part of the film (a turn of the argument, often one music track). The **strong** coordinator researches and writes the script and storyboard with the user, then builds what every part shares: the voice and `timings.js`, the music, and the film's own recurring pieces. A **middle** worker finds and treats the pictures from the storyboard (`commons.py`, `prep.py`, and `trace.py` or `frames.py` where the storyboard asks), recording each source. One **middle** worker per part then builds its beats, given the storyboard rows, the marks to land on, the kit's API (to read, not to edit), the first and last frame of the parts beside it, and how to look at its own frames; it replies with contact sheets of its beats and what they showed.
- **Short**: an episode is short enough that the **strong** coordinator writes the script and the shot-by-shot storyboard with the user and builds what the beats share: the voice and `timings.js` at one level, the music, and the series' own pieces. A **middle** worker makes or finds the pictures from the storyboard and records each prompt or source and its cost. One **middle** worker builds the beats (two, splitting the episode at a turn, when it is long), given the script, the marks, the kit's API to read and not edit, the safe area, and how to look at its frames: `strip.py` sheets of every beat and the first frame upright with `shot.py --clean`.
- The director passes are **strong** and report-only; the coordinator merges their findings and sends parts back to their workers.

## Review rounds

The loop is in [core/review.md](../core/review.md#review-rounds). For a film:

- **Round 1, on the sheets**: a fresh director on a strong model, given contact sheets of every beat and the reference film (or an approved episode), with no knowledge of how the beats were built. On Foucault it found ten must-fix defects, about half of them the wrong figure on screen while another was named.
- **Round 2, on the exported MP4**, by another fresh director who watches it as a viewer would: frames every half second on contact sheets, the first frame alone at full size, the audio transcribed with word times and its loudness measured, each against the script and its sources and against the approved films' exports. This round is the lever: on *The Pandemic*'s six shorts every first cut had passed its worker's own checks and still had one to three must-fix faults, most of them the picture saying something other than the voice ("even the vaccinated" drawn as protection).
- **Check a director's measurement** before it goes back as work: one reported loudness no other measurement matched, and a cut "a second late" was only Whisper starting a word at the pause before it (check a lag against the clip's own silences, not the transcript alone). After the fixes, a quick look of your own at the new MP4's frames; then the user watches the whole film.
