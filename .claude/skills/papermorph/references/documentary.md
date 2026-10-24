# Documentaries: from a book or an idea to a film

A documentary is a narrated film of five to fifteen minutes about a book, an idea or a stretch of history. Its pictures are mostly found: public-domain engravings, paintings and photographs, a few line drawings that draw themselves on, words set large, a map or two, all on one coloured ground and moved in step with a narrator. There are no questions; the reader watches. The published example is *Madness and Civilization* (after Foucault, ten minutes) on the shelf at https://papermorph.diamonddoge.org/. The user signed it off as the reference for this kind of film: when in doubt, open it and match its level.

It shares the engine, the player, captions, previews, `export.py` and the team with every other book. What is its own: the kit `assets/templates/documentary/` (`chapter.html`, `lib/film.js`, `lib/book.css`, `lib/fonts.css` and the fonts), the picture scripts (`commons.py`, `prep.py`, `trace.py`, `frames.py`, `video.py`), the voice script `eleven.py`, and the order of work below.

## Intake

The same spirit as [intake.md](intake.md): a short conversation, choices to click, the user's words kept. Settle, skipping what the request already settles:

1. **The subject and the angle.** What the film is about, and the one thing a viewer should leave with (Foucault: madness was not always locked up; each age decided what to do with it). Ask what must be in it: a scene, a quote, a person, an ending. What the user stresses is a theme to carry, not a thing to repeat: in the first cut the two epigraphs appeared four times and the user said it was overdone; they belong at the start and the end, with light echoes between.
2. **Length and audience.** Ten minutes holds one argument with five or six turns; a two-minute film holds one turn.
3. **The look.** One ground colour for the whole film (burgundy `#5a0e16` for Foucault, chosen from four tested with the actual pictures on them), two fonts (a condensed sans for key words, a serif for quotes and captions), and how found pictures are treated (below). Offer a ground test: three or four grounds with real pictures on them, side by side, before anything is built.
4. **The voice.** The narrator carries the film. ElevenLabs (`elevenlabs/eleven-v4` through OpenRouter) gave the voice the user accepted; Edge TTS was rejected for this film. Ask for the key, play a few short samples, and let the user pick. Characters can have their own voices (the Fool's giggle, a king's edict); v4 audio tags such as `[cackles]` are acted, not read.
5. **Music.** Classical music suits found pictures: one recording per part of the film, changing at the turns, never abruptly, at a level that never covers the narrator. Open with something short and rhythmic so the start is not slow.
6. **Budget.** Voices cost about $0.65 for ten minutes; a five-second clip from a still about $0.42. Pictures from Wikimedia Commons cost nothing.

Then agree the models ([intake.md](intake.md#5-models)) and write `style.json` with `tier: "documentary"`, the user's words, the look, the voice and the models.

## The order of work

1. **Research and the script.** Read the source, then write the narration (`content/<book>/chNN/narration.en.json`, one beat per paragraph, `[[mark]]` before each word a picture lands on) and a storyboard table (`books/<book>/storyboard.md`: beat, what is said, what we see, which picture). Show both to the user before anything is built. The hard part of a documentary is the argument and the storyboard, not the animation.
2. **The folder.** `site/<book>/lib/` gets the kit's `lib/` (`film.js`, `book.css` with the ground and ink colours, `fonts.css`, `fonts/`) and then the engine (`engine.py`); `chNN/index.html` starts from the kit's `chapter.html`.
3. **Pictures.** Find them, record them, treat them (below).
4. **Voice.** `eleven.py` (or `tts.py`) writes one clip per beat and `timings.js` with the marks. It takes the voice and model from the narration file's `voice` and `model`, keeps paid clips cached (a rerun costs nothing), and `--only beat,beat` redoes some beats without touching the others. Its word alignment (local Whisper) assumes words split by spaces, so a Chinese or Japanese film needs `tts.py` for now.
5. **Music.** Find recordings (`commons.py --audio`), bring them to one loudness (`level.py`), and give each part of the film its track with `music(file, beats, gain, fade)` ([engine.md](engine.md#player)).
6. **The beats**, built from the kit's helpers and timed to the marks.
7. **Review rounds** (below), then the user's viewing, then `export.py` for a video and registering the film on the shelf ([site.md](site.md)).

## Pictures

- **Find, then record.** `commons.py` searches Wikimedia Commons and downloads only public-domain and CC0 files, logging each in `SOURCES.tsv` (title, author, licence, URL). One subagent with it found all twenty storyboard pictures for Foucault in thirteen minutes. Other good sources: the Library of Congress, Old Book Illustrations, the Internet Archive; record those by hand the same way.
- **Two treatments**, made by `prep.py`, which also writes `img/art.js` with each picture's size:
  - *print*: the picture keeps its paper, with a border and a soft shadow, like a photograph laid on the ground. Paintings, photographs, title pages.
  - *line*: an engraving's dark lines turn into the ground's ink colour and the paper drops out, so the figure stands on the ground itself. Woodcuts and engravings with clean lines.
- **Line drawings that draw themselves.** `trace.py` turns a line drawing into ordered strokes; `traced()` draws it on over a few seconds. It is striking once or twice; on every picture it becomes a tic.
- **A still that moves.** For one or two moments, `video.py` makes a five-second clip from a still (Kling kept the engraving style), and `frames.py` gives every frame the same treatment on one sprite sheet, played by `anim()` on the beat clock so pause, seek and the export agree. The user liked this most when it was rare.
- **Maps.** A coastline from Natural Earth (public domain) as one SVG path in the film's box, a route drawn on with `along()`. A map earns its place when the narration talks about where (the Rhine, the leper houses across Europe).

## Building the beats

`film.js` holds the helpers, all pure functions of the beat clock:

- `pic()` places a picture with an entrance; `leave()`, `push()` (a slow Ken Burns move), `dissolve()` (one picture turning into another in place);
- `key()` big words in the condensed font, `strike()` a line through one, `say()` a quote typed word by word as it is spoken, `tag()` a small caption, `dateChip()` the year and place at the top left;
- `closeups()` pushes into a print onto each thing as it is named, with a label, and back out;
- `epigraph()`, `doc()` (an old document), `balloon()`, `dots()`, `water()` and `bob()`, `anim()`, `along()`.

Add the film's own recurring pieces at the end of the book's `film.js` (Foucault's guide peeking up from the bottom edge, the Europe map). Set the chapter's `lead: false`: every opening is timed by hand.

What made the Foucault film work:

- **One idea or element every two to four seconds**, in step with the voice, on a sparse screen: one to three things on the ground.
- **Close-ups on what is named.** When the narration names "the greedy" and "the vain" aboard the ship of fools, the camera goes to each in the woodcut, with the words as a label.
- **A host, used sparingly.** The author as a cut-out guide works at the key points; fifteen appearances was too many, and the user asked for fewer.
- **Characters get voices** for a line or a laugh, short: the jester's laugh at the end of a section, not over it.
- **The ending gathers the film.** Foucault ends with every era's Fool appearing in turn, and the opening epigraph returns.
- **Words on screen are few**: a key word, a quote being read, a year. Everything else is said.

## Review rounds

After the first cut, an independent director pass: a fresh agent on a strong model, given contact sheets of every beat (`strip.py`) and the reference film, with no knowledge of how the beats were built. On Foucault it found ten must-fix defects, about half of them places where the picture contradicted the narration (the wrong figure on screen while another was named). Fix, then show each fix on a contact sheet at once, which is how the user liked to review. Then the user watches the whole film.

## Later

Vertical shorts (a 9:16 stage, faster cuts, a single music track cut to the timeline) are being worked out on their own branch and are not yet part of this path.
