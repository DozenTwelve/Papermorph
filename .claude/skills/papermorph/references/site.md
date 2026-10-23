# The book: static folder, cover and contents

The book is static: HTML, JS, CSS, MP3. No build step, backend, database or accounts; reading progress lives in the browser (`localStorage`). The runnable output is `site/<book>/`; source material and production notes stay outside it.

## Start a book folder

Set `SKILL` to the installed skill folder. Run once for a new slug; use an existing book's actual files when resuming:

```sh
BOOK_ID=history
BOOK_SITE="site/$BOOK_ID"
BOOK_WORK="books/$BOOK_ID"
mkdir -p "$BOOK_SITE/lib" "$BOOK_SITE/img" "$BOOK_SITE/ch01" "$BOOK_WORK/chapters" "$BOOK_WORK/images/inbox" "content/$BOOK_ID/ch01" "tools/$BOOK_ID"
python3 "$SKILL/scripts/engine.py" "$BOOK_SITE"   # the engine into lib/, plus lib/book.css for this book's settings
cp "$SKILL/assets/templates/book.html" "$BOOK_SITE/index.html"
cp "$SKILL/assets/templates/unit-art.js" "$BOOK_SITE/unit-art.js"
cp "$SKILL/assets/templates/chapter.html" "$BOOK_SITE/ch01/index.html"
cp "$SKILL/assets/templates/narration.en.json" "content/$BOOK_ID/ch01/narration.en.json"
```

### A picture book

Instead of the block above (not after it). The book's `index.html` is the series page; each episode comes from the picture-book kit, and the empty `baked.js` stands in until `bake_puppets.py` has run:

```sh
BOOK_ID=jokes
BOOK_SITE="site/$BOOK_ID"
BOOK_WORK="books/$BOOK_ID"
PB="$SKILL/assets/templates/picture-book"
mkdir -p "$BOOK_SITE/lib" "$BOOK_SITE/img/puppets" "$BOOK_SITE/ch01" "$BOOK_WORK/art" "content/$BOOK_ID/ch01" "tools/$BOOK_ID"
python3 "$SKILL/scripts/engine.py" "$BOOK_SITE"
cp "$PB/series.html" "$BOOK_SITE/index.html"
cp "$PB"/lib/*.js "$BOOK_SITE/lib/"
cp "$PB/chapter.html" "$BOOK_SITE/ch01/index.html"; cp "$PB/scene1.js" "$BOOK_SITE/ch01/"
cp "$PB/sets.js" "$BOOK_WORK/art/"
cp "$PB/narration.en.json" "content/$BOOK_ID/ch01/"
echo 'window.BAKED = {};' > "$BOOK_SITE/img/puppets/baked.js"
```

For a painted look, also `cp "$PB/painted.json" "$BOOK_WORK/art/"` ([painting.md](painting.md)). Then the sound and the pictures, in this order ([sound.md](sound.md), [puppets.md](puppets.md)), with the preview server running on 8765:

```sh
A="$BOOK_SITE/ch01/audio/en"; N="content/$BOOK_ID/ch01/narration.en.json"
uv run --with edge-tts python "$SKILL/scripts/tts.py" "$N" "$A"
python3 "$SKILL/scripts/level.py" "$A"/*.mp3
python3 "$SKILL/scripts/mouths.py" "$N" "$A"
python3 "$SKILL/scripts/join.py" "$A" scene1=s01,s02,s02b,s03 --words "$N"
uv run --with numpy python "$SKILL/scripts/sfx.py" "$BOOK_SITE/ch01/audio/sfx" knock
```

Keep these commands in a script beside the book's notes (`tools/$BOOK_ID/audio.sh`) and rerun it after any change to the narration. As copied, they voice the kit's own sample episode, a check that the folder works; the episode's script then replaces the narration file, and its scenes replace the `join.py` list.

The sets are baked before the scenes are written, the puppets after, since `bake_puppets.py` bakes the poses the chapters ask for; rerun either after a set or a puppet part changes. A painted look paints its sets between `bake_sets.py --ref` and the scenes ([painting.md](painting.md)).

```sh
uv run --with playwright --with pillow python "$SKILL/scripts/bake_sets.py" "$BOOK_WORK/art/sets.js" "$BOOK_SITE"
uv run --with playwright --with pillow python "$SKILL/scripts/bake_puppets.py" "$BOOK_SITE" --url "http://localhost:8765/$BOOK_ID/"
```

### Every book

Use the pilot chapter's number in place of `ch01` when the pilot is not the first chapter. Use the agreed primary language: rename the narration source, load `audio/<lang>/timings.js` (a picture-book chapter also loads `mouths.js` and `shots.js` from that folder), and set `CHAPTER.language` to match (default `en`, it picks the audio folder). A chapter's minutes appear on its title screen (`CHAPTER.minutes`), its contents card and a series card; write the same number in each: the length of its audio (the `dur`s in `timings.js`) plus about 15 s for each question, rounded to whole minutes and never below 1. Set `<html lang>` in `index.html` and every chapter to the same language: the player and the contents page take their interface text from it (English, Russian, Chinese and Japanese are built into the engine; other languages fall back to English until a block is added to the engine's `TRANSLATIONS`). Take `voice` and `rate` for each narration file from `style.json`, and translate the template's own visible text (titles, lede, prompts) before the pilot.

If the book's formulas need LaTeX ([engine.md](engine.md#latex)), add MathJax (with its license) to `lib/`, and load `../lib/mathjax.js` right after `engine.js` in every chapter:

```sh
python3 "$SKILL/scripts/engine.py" "$BOOK_SITE" --latex   # lib/mathjax.js; later syncs keep it in step
```

Each book has its own engine copy (kept in step with `engine.py`, see [engine.md](engine.md)), source materials, narration and optional tests. The engine and cover derive the same progress key from the book's URL folder (or `--progress-key` in `lib/book.css`), so moving a book to another folder resets its readers' progress unless the key is set.

A chapter returns to its book's index. Preserve cover → contents → chapter navigation and the return from contents to cover. The book opens directly at `/<book>/`; it needs no parent index page.

## Cover and contents (`index.html`)

A textbook's cover and contents; a picture book uses its series page instead ([stories.md](stories.md#delivering)).

One page: no hash or `#book` shows the cover, `#references` the reference list, `#contents` or `#chNN` the contents; a lesson's home button returns to `#chNN`, and the card grows into the lesson frame through a view transition.

- Edit the title, kicker, lede, the faint chalk phrases on the cover (a few formulas or lines from the book), and the `<title>`.
- The page's script calls `Contents.book({ start, units, hues })` (from the engine's `lib/contents.js`; the shared styles are `lib/contents.css`):
  - `units`: `[unit title, [[chapter title, minutes], …]]`; chapters are numbered in order from `start` (`{ unit: 1, chapter: 1 }`; a book whose scope starts mid-way, e.g. at unit 3, chapter 9, keeps the original numbers).
  - Add a chapter when its lesson is ready, and set the previous chapter's `CHAPTER.next = '../chNN/'`.
  - A unit's optional third entry `{ unit, chapter, sample: true }` renumbers it and marks it as a sample, left out of the chapter count.
  - To show different numbers than the folders, add `label` to `start` (`{ unit: 1, chapter: 9, label: 1 }` shows ch09 as 1) and set the same `CHAPTER.label` in each lesson, which its title screen and completion card show.
  - A chapter's own third entry `{ chapter }` changes only the number on its card; `{ href, chapter }` links a card to another book's chapter, outside this book's count and progress (`href` on a unit's entry does it for the whole unit).
- `hues`: one colour per unit, cycling.
- A book that cites works gets a `#references` view ([courses.md](courses.md#citations)).
- A book with its own look overrides the tokens of `lib/contents.css` (`--board`, `--chalk`, `--top-bg`, …) in a `<style>` after it, as the template's comment shows; don't copy the stylesheet into the page.

## Unit sketches (`unit-art.js`)

Give each unit a small sketch of its own ideas, drawn in the unit colour, with one gentle topic-related loop. Use the agreed asset approach. Keep the left third light for the title on phones; check the finished contents at 1440 px and 390 px once. Classes and loop examples are in `unit-art.js`; the shared header styles, off-screen pausing and reduced motion live in the engine's `lib/units.css` and `lib/units.js` (`Units.header`, `Units.watch`).

## Guide character

The infinity guide comes with the engine (`mascotEl` in `engine.js`, the cover's in `contents.js`), so a book's copy is replaced at every sync. A custom guide needs a hook in the engine itself; agree it with the user and change the engine at its source.

## Local preview and delivery

Serve the static output over HTTP for audio playback:

```sh
python3 SKILL/scripts/serve.py 8765 site   # no-store, so edits are never hidden by the browser cache
```

Open `http://localhost:8765/<book>/`. Confirm the cover opens the contents, ready chapter links load their lessons, lessons return to the book's contents, and any reference links open their works. Deliver `site/<book>/` with its HTML, scripts, styles and audio, the preview command and entry URL, available chapter count and unresolved issues. Source PDFs, extracted pages, narration drafts and development environments are not part of the static book.

## Languages

Narration and on-screen text are written in one language first. A second language comes after the book is done and approved: keep beat ids and question ids stable, add `narration.<lang>.json` and audio per language, and decide with the user how switching behaves mid-lesson before building it.

## Video export (optional)

`uv run --with playwright --with numpy SKILL/scripts/export.py chNN --url http://localhost:8765/<book>/ --out OUT --link <lesson URL>` renders the beats to `OUT/chNN.mp4` (1080p, 30 fps) plus `OUT/chNN.srt` for upload with it. Frames come from seeking the beat clock and the sound is mixed by the page's own rules (each beat's `pre`, and in a picture book its effects and music), so the video matches the page; question beats are left out and a lesson's video ends on a card pointing to the interactive lesson. It takes about 1.6× the video's length. Video files are large (an episode at 1080p is tens of megabytes, more than a static host such as Cloudflare Pages takes per file): upload them to the video site, not into `site/`.
