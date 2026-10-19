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
- The page's script calls `Contents.book({ start, units, hues })` (from the engine's `lib/contents.js`; the shared styles are `lib/contents.css`). `units`: `[unit title, [[chapter title, minutes], …]]`; chapters are numbered in order from `start` (`{ unit: 1, chapter: 1 }`; a book whose scope starts mid-way, e.g. at unit 3, chapter 9, keeps the original numbers). Add a chapter when its lesson is ready; also set the previous chapter's `CHAPTER.next = '../chNN/'`. An optional third entry `{ unit, chapter, sample: true }` renumbers a unit and marks it as a sample, left out of the chapter count. To show different numbers than the folders, add `label` to `start` (`{ unit: 1, chapter: 9, label: 1 }` shows ch09 as 1) and set the same `CHAPTER.label` in each lesson, which its title screen and completion card show. A chapter's own third entry `{ chapter }` changes only the number on its card; `{ href, chapter }` links a card to another book's chapter, outside this book's count and progress (`href` on a unit's entry does it for the whole unit).
- `hues`: one colour per unit, cycling.
- A book with its own look overrides the tokens of `lib/contents.css` (`--board`, `--chalk`, `--top-bg`, …) in a `<style>` after it, as the template's comment shows; don't copy the stylesheet into the page.

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

## SCORM package (optional)

For a course in an LMS (Canvas/Quercus, Moodle, Brightspace, Blackboard), package a built book as one SCORM zip:

```sh
python3 SKILL/scripts/scorm.py site/<book>                    # SCORM 2004 4th edition, completion only -> dist/<book>-scorm2004.zip
python3 SKILL/scripts/scorm.py site/<book> --version 1.2      # older LMSs
python3 SKILL/scripts/scorm.py site/<book> --mastery 80       # also passed/failed at 80 %, once the whole book is finished
```

`site/<book>/` is not changed; rebuild the zip after changing the book. The LMS launches `launch.html`, which opens one SCORM session and runs the book in a frame, so moving between chapters keeps the session. The build adds `scorm-bridge.js` to the contents page and after `engine.js` in every chapter; it wraps the engine's `progress()` and `finishCard()`, seeds the book's progress from the LMS on each launch (the LMS is the source of truth) and points folder links (`ch02/`) at `index.html`, which many LMS file servers need.

| | SCORM 1.2 | SCORM 2004 |
|---|---|---|
| Completion: every chapter's finish card reached | `cmi.core.lesson_status` (`passed`/`failed` with `--mastery`) | `cmi.completion_status`, `cmi.success_status` with `--mastery` |
| Progress: chapters finished ÷ chapters | — | `cmi.progress_measure` |
| Score: first-try answers over all quick checks and practice, best attempt per chapter | `cmi.core.score.raw` | `cmi.score.raw`, `cmi.score.scaled` |
| One objective per chapter (`ch01`, …) with status and score | `cmi.objectives.n.*` | `cmi.objectives.n.*` |
| Resume (checkmarks, Continue) | `cmi.suspend_data`, `lesson_location` | `cmi.suspend_data`, `cmi.location` |

A chapter counts as finished when its finish card appears, as in the book; a learner can skip there on the step bar, so use `--mastery` when the grade should depend on the answers. Cards that link to another book's folder (`href` in `units`) leave the package and don't work inside an LMS.

Check a package before handing it over: `uv run --with playwright SKILL/assets/scorm/test/check_scorm.py dist/<book>-scorm2004.zip` opens it in `assets/scorm/test/mock-lms.html` (a stand-in LMS that shows every CMI value), opens a chapter through a folder link, reaches its finish card and checks resume. To click through by hand, unzip the package as `pkg/` next to a copy of `mock-lms.html`, run `python3 SKILL/assets/scorm/test/serve.py <folder> 8781` (no folder URLs, like an LMS) and open `http://localhost:8781/mock-lms.html?pkg=pkg&v=2004&reset`; reload without `&reset` to test resume. Before learners use it, upload it to SCORM Cloud (a free account), the usual test of a real LMS. Audio makes up most of a package: check the LMS's upload limit. Canvas grades only the overall result; it doesn't show the per-chapter objectives.
