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

Use the pilot chapter's number in place of `ch01` when the pilot is not the first chapter. Use the agreed primary language: rename the narration source, load `audio/<lang>/timings.js`, and set `CHAPTER.language` to match (default `en`). Take `voice` and `rate` for each narration file from `style.json`, and translate the template's visible UI text as needed before the pilot.

If the book's formulas need LaTeX ([engine.md](engine.md#latex)), add MathJax (with its license) to `lib/`, and load `../lib/mathjax.js` right after `engine.js` in every chapter:

```sh
python3 "$SKILL/scripts/engine.py" "$BOOK_SITE" --latex   # lib/mathjax.js; later syncs keep it in step
```

Each book has its own engine copy (kept in step with `engine.py`, see [engine.md](engine.md)), source materials, narration and optional tests. The engine and cover derive the same progress key from the book's URL folder. Keep existing books on their current paths; their legacy progress remains intact.

A chapter returns to its book's index. Preserve cover → contents → chapter navigation and the return from contents to cover. The book opens directly at `/<book>/`; it needs no parent index page. Keep existing books' navigation when editing them.

## Cover and contents (`index.html`)

One page: no hash or `#book` shows the cover, `#contents` or `#chNN` the contents; a lesson's home button returns to `#chNN`, and the card grows into the lesson frame through a view transition.

- Edit the title, kicker, lede, the faint chalk phrases on the cover (a few formulas or lines from the book), and the `<title>`.
- `UNITS`: `[unit title, [[chapter title, minutes], …]]`; chapters are numbered in order from `START` (`{ unit: 1, chapter: 1 }`; a book whose scope starts mid-way, e.g. at unit 3, chapter 9, keeps the original numbers). Add a chapter when its lesson is ready; also set the previous chapter's `CHAPTER.next = '../chNN/'`.
- `HUES`: one colour per unit, cycling.

## Unit sketches (`unit-art.js`)

Give each unit a small sketch of its own ideas, drawn in the unit colour, with one gentle topic-related loop. Use the agreed asset approach. Keep the left third light for the title on phones; check the finished contents at 1440 px and 390 px once. Classes and loop examples are in `unit-art.js`; the shared header styles, off-screen pausing and reduced motion live in the engine's `lib/units.css` and `lib/units.js` (`Units.header`, `Units.watch`).

## Guide character

Keep the existing infinity guide by default. For an agreed custom guide, adapt `mascotEl` and the cover drawing together, retaining blink, happy hop and wrong-answer tilt states.

## Local preview and delivery

Serve the static output over HTTP for audio playback:

```sh
python3 SKILL/scripts/serve.py 8765 site   # no-store, so edits are never hidden by the browser cache
```

Open `http://localhost:8765/<book>/`. Confirm the cover opens the contents, ready chapter links load their lessons, and lessons return to the book's contents. Deliver `site/<book>/` with its HTML, scripts, styles and audio, the preview command and entry URL, available chapter count and unresolved issues. Source PDFs, extracted pages, narration drafts and development environments are not part of the static book.

## Languages

Narration and on-screen text are written in one language first. A second language comes after the book is done and approved: keep beat ids and question ids stable, add `narration.<lang>.json` and audio per language, and decide with the user how switching behaves mid-lesson before building it.

## Video export (optional)

`uv run --with playwright SKILL/scripts/export.py chNN --url http://localhost:8765/<book>/ --out OUT --link <lesson URL>` renders the lesson beats to `OUT/chNN.mp4` (1080p, 30 fps) plus `OUT/chNN.srt` for upload with it. Frames come from seeking the beat clock, so the video matches the page exactly; question beats are left out and the video ends on a card pointing to the interactive lesson. It takes about 1.6× the video's length.
