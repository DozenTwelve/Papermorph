# Documentaries: from a book or an idea to a film

A documentary is a narrated film on the wide stage about a book, an idea or a stretch of history. Its pictures are mostly found: public-domain engravings, paintings and photographs, a few line drawings that draw themselves on, words set large, a map or two (or one map that carries the whole film, [films.md](films.md#maps)), all on one coloured ground and moved in step with a narrator. Usually the reader just watches; a film can also hand them the action at a few moments ([Interactive moments](#interactive-moments)). The references are in [SKILL.md](../../SKILL.md#reference-books); [films.md](films.md) holds intake, the folder, pictures, maps, voice and review. The kit is `assets/templates/documentary/` (`chapter.html`, `narration.en.json`, `style.json`, `lib/film.js`, `lib/book.css`, `lib/fonts.css` and the fonts).

## The order of work

1. **Research and the script.** The hard part of a documentary is the argument and the storyboard, not the animation. Trace every number and quote to where it was first said: a figure found on Wikipedia goes back to the speech or report it cites, and that is the source to tag (Wikipedia's "low and middle-income" was the WHO's "low-income"). Read what each date counts: the day a virus arrived somewhere is not the day of its first confirmed case. Then write the narration (`content/<book>/chNN/narration.en.json`, [core/sound.md](../core/sound.md#the-narration-file), one beat per paragraph) and a storyboard table (`books/<book>/storyboard.md`: beat, what is said, what we see, which picture), and show both to the user before anything is built.
2. **The folder** ([films.md](films.md#the-folder)). Its `index.html` starts as the picture-book series page, which `new_book.py` copies in its light paper look and without credits: give it the film's colours and fonts and add a credits section listing every picture and recording from `SOURCES.tsv` and `music/SOURCES.tsv` (`pandemic/index.html`'s `<section class="credits">`); a single film is a series of one.
3. **Pictures**: find, record, treat ([films.md](films.md#pictures)). Then the ground, chosen on those pictures before any beat is built: put three or four of them on the kit's sample beat, set each candidate ground in `lib/book.css` in turn, take the same `shot.py --clean` frame of each and show the frames side by side (Foucault's burgundy `#5a0e16` was chosen from four this way). A colour that looks right alone can drown an engraving's ink or make a print's paper glare.
4. **Voice**: `tts.py` or `eleven.py` ([core/sound.md](../core/sound.md#voices)).
5. **Music.** One recording per part of the film, changing at the turns, never abruptly; open with something short and rhythmic so the start is not slow. Find recordings (`commons.py --audio`), bring each to the film's music level with `music.py cut` (−16 LUFS; a track for one part takes that part's seconds as `--length`, from `?lengths`), and give each part its track with `music(file, beats, gain, fade)`, starting around a gain of 0.4 ([core/sound.md](../core/sound.md#music)).
6. **The beats**, built from the kit's helpers and timed to the marks (below).
7. **Review rounds** ([films.md](films.md#review-rounds)), the user's viewing, then `export.py` if the user wants a video ([core/publish.md](../core/publish.md#video-export)).

## Team

The general shape is in [core/team.md](../core/team.md), the director passes in [films.md](films.md#review-rounds). One **strong** agent makes the whole film with the user (research, script and storyboard, voice and `timings.js`, music, pictures, the film's recurring pieces, the beats, its own checks), and a fresh **strong** director reviews it ([films.md](films.md#review-rounds)); *Madness and Civilization* and *The Pandemic* were made this way. A long film can be split by part (a turn of the argument, often one music track), each part's builder given the storyboard rows, the marks to land on, the kit's API (to read, not edit) and the first and last frame of the neighbouring parts; that split has not been tried yet.

## Building the beats

`film.js` holds the helpers, all pure functions of the beat clock:

- `pic()` places a picture with an entrance; `leave()`, `push()` (a slow Ken Burns move), which work on what `pic()`, `traced()` and `doc()` return (they remember where they were put), and `dissolve()` (one picture turning into another in place);
- `key()` big words in the condensed font, `strike()` a line through one, `say()` a quote typed word by word as it is spoken (Chinese and Japanese character by character; the kit's fonts are Latin only, so such a film adds a CJK font to `fonts.css`), `tag()` a small caption, `dateChip()` the year and place at the top left;
- `closeups()` pushes into a print onto each thing as it is named, with a label, and back out to the whole picture when given its `home` (`{ x, y }`); without it the camera stays on the last close-up. A close-up's zoom keeps the view inside the picture only while the picture, at that zoom, is wider than the frame: on a tall picture give a zoom of at least 1600 ÷ its drawn width, or the ground shows at the sides;
- `epigraph()`, `doc()` (an old document), `balloon()`, `dots()`, `water()` and `bob()`, `anim()`, `along()`.

Add the film's own recurring pieces at the end of the book's `film.js` (Foucault's guide peeking up from the bottom edge, the Europe map). The kit's chapter sets `lead: false`: every opening is timed by hand.

A film can stretch the kit where its story asks. *Shooting an Elephant* added a red overprint to `say()` (`mark`), a band to `closeups()`, a `clip()` that plays a `<video>` (`img/moulmein-live.mp4`) on the beat clock, and silhouette puppets after Lotte Reiniger (`lib/puppets.js`). A live `<video>` is the quicker way to a moving shot, but the export seeks frame by frame without waiting for it to decode, so an exported clip can lag a frame where a `frames.py` sheet agrees exactly; check the export and turn the clip into frames if it shows (the comment on `clip()` in that book's `lib/film.js` says so).

Look at your frames every few beats while you build, not only at the end: `shot.py` or `?beat=N&t=S` where a picture lands, a `strip.py` sheet against the beat's storyboard row ([core/review.md](../core/review.md#watch-it-in-motion)). Ask what a viewer sees while each word is said: is the thing named on screen, does a word or label sit on a face, is the screen sparse.

What made the Foucault film work:

- **One idea or element every two to four seconds**, in step with the voice, on a sparse screen: one to three things on the ground.
- **Close-ups on what is named.** When the narration names "the greedy" and "the vain" aboard the ship of fools, the camera goes to each in the woodcut, with the words as a label.
- **A host, used sparingly.** The author as a cut-out guide works at the key points; fifteen appearances were too many and were cut back.
- **Characters get voices** for a line or a laugh, short: the jester's laugh at the end of a section, not over it.
- **The ending gathers the film.** Every era's Fool appears in turn, and the opening epigraph returns.
- **Words on screen are few**: a key word, a quote being read, a year. Everything else is said.

## Interactive moments

A documentary can give the reader a few moments to act where the story turns on a choice or a deed: in *Shooting an Elephant* the reader looks through the rifle's sight and fires, as Orwell did, and the film goes on from the shot. Open `site/shooting-an-elephant/ch01/index.html` and read `fireAsk` before writing one.

- Set `CHAPTER.film = true`, so the chapter stays a film although some beats ask something, and `CHAPTER.questionKeys = false` when the moments have their own controls (the rifle) ([core/engine.md](../core/engine.md#player)).
- The moment is a beat whose `ask` is the chapter's own `done => { … }` rather than a `quiz()`. The engine calls it as the beat starts; once the narration and the beat's tweens are over, `P.waiting` turns true and the page waits. The handler listens on the stage (a click, a key), acts only while `P.waiting`, answers at once (a flash, a bang) and calls `done()` once, after which the next beat plays.
- A reader can step back or replay the beat while the handler still listens. Note `P.gen` when the handler starts and compare it in every listener and timer: once it has changed, that start of the beat is over, so remove the listeners and do nothing (the engine ignores a stale `done()`, but not the handler's own flash or sound).
- While the page waits, the music plays on at 70 %, so choose a track that can carry an open-ended pause.
- `export.py` cannot click: it holds the beat's last picture for its `hold` seconds (`{ ask: fireAsk(1, 'p5b'), hold: 1.5 }` in the fourth slot, 1.5 by default; the engine ignores it), then plays the next beat as if the reader had acted. Whatever the act does on the page (the shot's bang), the next beat also does on its own clock for the video; *Shooting an Elephant* silences that copy when the reader fired.
- Check it as a reader: `?beat=N` stops on the moment; the prompt appears only once the narration ends, a click acts at once and the film goes on, stepping back and replaying mid-wait leaves no second flash or extra shot, and the exported video holds and goes on without a gap.
