# The book folder, preview and export

The book is static: HTML, JS, CSS, MP3, with no build step, backend, database or accounts; reading progress lives in the browser (`localStorage`). The runnable output is `site/<book>/`; source material and production notes stay outside it.

## Start a book folder

Once per new slug, from the folder that holds `site/`, `books/`, `content/` and `tools/`:

```sh
python3 SKILL/scripts/new_book.py lesson|picture|documentary|shorts <book> [--chapter N] [--lang xx] [--maps]
```

It runs `engine.py` into `site/<book>/lib/` (the engine, plus `lib/book.css` for this book's settings), copies the tier's kit and templates (chapter page, cover or series page, sample narration, a picture book's paper kit and `sets.js`, a film's `film.js` or `shorts.js`, and with `--maps` the map kit), makes the working folders and prints the next commands. It refuses a slug whose `site/<book>/` exists; resume an existing book from its own files. Each tier's file says what comes next.

## Every book

- Use the agreed primary language: the narration source is `narration.<lang>.json`, the chapter loads `audio/<lang>/timings.js`, and `CHAPTER.language` matches (default `en`; it picks the audio folder). Set the same `<html lang>` in `index.html` and every chapter: the player and the contents page take their interface text from it (English, Russian, Chinese, Japanese and Arabic are built in, Arabic right to left as [engine.md](engine.md) describes; other languages fall back to English until a block is added to the engine's `TRANSLATIONS`). Take `voice` and `rate` from `style.json`, and translate the template's visible text (titles, lede, prompts) before the pilot.
- A chapter's minutes appear on its title screen (`CHAPTER.minutes`), its contents card and any series card, the same number in each: the length of its audio (the `dur`s in `timings.js`) plus about 15 s per question, rounded to whole minutes and never below 1.
- Each book has its own engine copy, kept in step by `engine.py` ([core/engine.md](engine.md)). The engine and the cover or series page take the progress key from the book's URL folder ([core/engine.md](engine.md#player)), so moving a book resets its readers' progress unless `--progress-key` is set in `lib/book.css`.
- A chapter returns to its book's index; the book opens directly at `/<book>/` and needs no parent index page. Every chapter but the last sets `CHAPTER.next` to the next one.

## Local preview and delivery

Audio playback needs HTTP:

```sh
python3 SKILL/scripts/serve.py 8765 site   # no-store, so edits are never hidden by the browser cache
```

Open `http://localhost:8765/<book>/`. Confirm the index opens its chapters, chapters return to it, and any reference links open their works. Deliver `site/<book>/` (HTML, scripts, styles, audio) with the preview command and entry URL, the available chapter count and unresolved issues; source PDFs, extracted pages, narration drafts and development environments are not part of it. Putting a book on a bookshelf and hosting it are separate tasks.

## Languages

Write narration and on-screen text in one language first. A second language comes after the book is done and approved: keep beat and question ids stable, add `narration.<lang>.json` and audio per language, and agree with the user how switching behaves mid-chapter before building it.

## Video export

```sh
uv run --with playwright --with numpy SKILL/scripts/export.py chNN --url http://localhost:8765/<book>/ --out OUT --link <chapter URL>
```

It renders the beats to `OUT/chNN.mp4` (1080p, or 1080 × 1920 on the upright stage; 30 fps) plus `OUT/chNN.srt` to upload with it. Frames come from seeking the beat clock and the sound is mixed by the page's own rules (each beat's `pre`, effects and music), so the video matches the page.

- A lesson's question beats are left out and its video ends on a card pointing to the interactive lesson. In a film with `CHAPTER.film` they stay: each holds its picture for the beat's `hold` s with the music up at 70 %, as the page plays it while waiting, then the next beat plays as if the reader had acted ([documentary.md](../films/documentary.md#interactive-moments)).
- **`video`** in a beat's fourth slot is read only by `export.py`. `video: false` leaves the beat out; `video: S` ends it S s into its clock, its sound and captions cut there, with no wait. A game that only works on the page goes out this way: *The Little Horse* leaves its river stop out (`video: false`) and keeps the first line of its mill stop, "brought the wheat to the mill.", with `video: PRE8 + 3.6`. The run names the beats it left out and warns about a `findWords` stop that has no `video`, and a film that skips beats gets no "the questions are in the interactive lesson" card.
- **Loudness.** The sound is levelled to `--lufs` integrated (default −16, which video sites and phones play without turning it up much; YouTube plays louder uploads at −14) with its true peak under −1.5 dBTP, by a gain and a limiter as `level.py` levels a clip. The run prints the mix's loudness as the page plays it, after levelling, and of the finished MP4: *The Little Horse*'s first scene measures −19.9 LUFS as mixed and −16.1 LUFS, −1.7 dBTP in the MP4. `--lufs off` keeps the page's mix, turned down as a whole only if it would clip.
- The mix is read from the engine's own lists (`sfx()`, `music()`, `window.MUSIC_OFF`). A page with a sound player of its own (an older book's `const SFX`, `BGM` or `function sfx`) hides that sound from the engine; the run names each such global and says its sound is not in the video.
- `--to BEAT` stops after that beat, for a quick look at the opening scenes (the beats before it stay in, so the music stands where the film has it). Odd sizes are cut to even ones (an upright `--height 720` gives 404 × 720). The video is written beside the old one and renamed when done, so a failed run leaves an earlier `chNN.mp4` alone.
- Frames are shot by `--jobs` browsers at once (default half the CPU threads, at most 8) on the GPU where there is one, and encoded on the first hardware H.264 encoder that works, else libx264; the run prints which. The video is limited-range BT.709 H.264, tagged so (the frames are full-range JPEGs; a full-range MP4 played too bright in browsers, its paper ground off the page's), so a still from it matches the page. An 82 s upright short took 45 s on a 20-thread PC with an NVIDIA card, 1 min 22 s there with no GPU and libx264, and 3 min with one browser; `--height 720 --fps 10` makes a quick check copy.
- Video files are large (tens of megabytes for a 1080p episode, more than a static host such as Cloudflare Pages takes per file): upload them to the video site, not into `site/`.
