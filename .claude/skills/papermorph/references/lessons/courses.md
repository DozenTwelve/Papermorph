# Course options

Three options for course books, usually at a college: verified citation links, a reviewed bank of choice questions, and a SCORM package for an LMS. None is on by default; offer one at intake only when the book calls for it (it cites other works, its questions must be reviewed before release, or it goes into an LMS), and record the choice in `style.json`.

## Citations

Each work named on screen (an author–year, a quoted study, a book title) can link to it, from a verified list, never from memory.

1. **List.** Add each cited work to `books/<book>/refs.json`, taking authors, year and full title from the source book's own reference list (`pages/*/text.md`). The key is `surname-surname-year` (`scheper-hughes-lock-1987`); `cite` is the on-screen label (`python3 SKILL/scripts/refs.py --help` lists the entry fields; a group author such as the World Health Organization is `{"org": "World Health Organization"}`).
2. **Find.** `python3 SKILL/scripts/refs.py lookup books/<book>/refs.json --write`. It accepts a Crossref DOI only when the year, first author and title all match. For books without a DOI it takes the ISBN of the edition from the cited year (Open Library), which links to its WorldCat record. Decide each `NO CONFIDENT MATCH` by hand: the right candidate or a trusted academic page (`url`, e.g. PubMed, JSTOR, ERIC, a university repository); failing both, keep the citation as plain text and note it in the chapter file.
3. **Verify.** `python3 SKILL/scripts/refs.py verify books/<book>/refs.json --write` resolves every DOI or ISBN, checks it against the entry, fills in missing metadata and stamps `verified`. Fix every `FAIL`.
4. **Build.** `python3 SKILL/scripts/refs.py build books/<book>/refs.json site/<book>/refs.js`, and uncomment the `refs.js` line in `index.html` and each chapter: the contents ends with a link to a separate References view that lists every work, and each chapter's finish card lists the sources that chapter cites.
5. **Draw.** `cite(p, key, { x, y, size, fill, anchor, weight, o: 0 })` draws the label as an underlined link and returns it, ready for `show()`/`tw()` like `T`; `str` overrides the label (e.g. `'(1987)'` after a name drawn separately). Text drawn with `T` or written in a card that matches a work's `cite` label (or one of its `match` strings) becomes a link by itself. Clicking a citation opens the source in a new tab and pauses the lesson; faded-out links take no clicks or Tab focus. A work discussed but not drawn goes in `CHAPTER.refs` so the finish card still lists it.

Draw a citation beside the text it supports rather than inside a long sentence, so the link is a separate target at least 24 px high.

## Choice questions from an item bank

A chapter's choice questions can live in an item bank, `books/<book>/items/chNN.items.json`, instead of inline in the page, so they can be linted, reviewed by a person in a sheet and approved before release. The bank follows the JSON schema of the [mcq-item-writer](https://github.com/titulartarantula/mcq-item-writer) skill, which writes and lints items against evidence-based item-writing rules (stem with the problem, one best answer, plausible distractors, feedback on every option). Inline `choice` is still fine for a quick check written on the spot.

For a bank used by a page:

- **Ids** keep the book's prefixes: `c-…` for a quick check, `p-…` for practice (the finish card adds them up by prefix).
- **The card is the screen.** Put the scenario and lead-in in `stem`; no data tables or media (draw the data in the beat and ask about it). Options stay short enough for one line on the card; three options fit a side or band card, four only on a `SCREEN`.
- **Feedback** on every option, two or three sentences. The engine adds "Correct." / "Not quite.", so don't start with a verdict; `items.py` drops one if present.
- **Order.** Options show as authored (no shuffle): spread the right answer's position across the chapter.

Rebuild the page's copy after every bank change rather than editing `items.js` by hand:

```sh
python3 SKILL/scripts/items.py books/<book>/items/chNN.items.json site/<book>/chNN/items.js
```

The chapter loads `<script src="items.js"></script>` right after `engine.js` and asks with `quiz(TOPR, [mcq('c-attrib')], done)` ([questions.md](questions.md)). `items.py` refuses what a card cannot show (multiple-response items, tables, media, no single key) and warns about items not yet marked `approved`.

## SCORM package

For a course in an LMS (Canvas, Moodle, Brightspace, Blackboard), package a built book as one SCORM zip:

```sh
python3 SKILL/scripts/scorm.py site/<book>                    # SCORM 2004 4th edition, completion only -> dist/<book>-scorm2004.zip
python3 SKILL/scripts/scorm.py site/<book> --version 1.2      # older LMSs
python3 SKILL/scripts/scorm.py site/<book> --mastery 80       # also passed/failed at 80 %, once the whole book is finished
```

`site/<book>/` is left unchanged; rebuild the zip after changing the book. The LMS launches `launch.html`, which opens one SCORM session and runs the book in a frame, so moving between chapters keeps the session. The build adds `scorm-bridge.js` to the contents page and after `engine.js` in every chapter; it wraps the engine's `progress()` and `finishCard()`, seeds the book's progress from the LMS on each launch (the LMS is the source of truth) and points folder links (`ch02/`) at `index.html`, which many LMS file servers need.

| | SCORM 1.2 | SCORM 2004 |
|---|---|---|
| Completion: every chapter's finish card reached | `cmi.core.lesson_status` (`passed`/`failed` with `--mastery`) | `cmi.completion_status`, `cmi.success_status` with `--mastery` |
| Progress: chapters finished ÷ chapters | — | `cmi.progress_measure` |
| Score: first-try answers over all quick checks and practice, best attempt per chapter | `cmi.core.score.raw` | `cmi.score.raw`, `cmi.score.scaled` |
| One objective per chapter (`ch01`, …) with status and score | `cmi.objectives.n.*` | `cmi.objectives.n.*` |
| Resume (checkmarks, Continue) | `cmi.suspend_data`, `lesson_location` | `cmi.suspend_data`, `cmi.location` |

A chapter counts as finished when its finish card appears, as in the book; a learner can skip there on the step bar, so use `--mastery` when the grade should depend on the answers. Cards that link to another book's folder (`href` in `units`) leave the package and don't work inside an LMS.

Check a package before handing it over: `uv run --with playwright SKILL/assets/scorm/test/check_scorm.py dist/<book>-scorm2004.zip` opens it in `assets/scorm/test/mock-lms.html` (a stand-in LMS that shows every CMI value), opens a chapter through a folder link, reaches its finish card and checks resume. To click through by hand, unzip the package as `pkg/` next to a copy of `mock-lms.html`, run `python3 SKILL/assets/scorm/test/serve.py <folder> 8781` (no folder URLs, like an LMS) and open `http://localhost:8781/mock-lms.html?pkg=pkg&v=2004&reset`; reload without `&reset` to test resume. Before learners use it, try it on SCORM Cloud (a free account), the usual stand-in for a real LMS. Audio makes up most of a package: check the LMS's upload limit. Canvas grades only the overall result; it doesn't show the per-chapter objectives.

## Checking them

Lint a chapter's item bank with the item writer (`python3 MCQ/scripts/lint_items.py books/<book>/items/chNN.items.json`, where `MCQ` is the mcq-item-writer skill's folder) and fix every error; rebuild `items.js` after any change, then answer one bank question per card position, wrong then right, to see the answered card fit with Continue visible.

For a chapter that cites works, run `python3 SKILL/scripts/refs.py verify books/<book>/refs.json`, and rebuild `refs.js` after any `refs.json` change. Every author–year or work title on screen should be a link whose key is verified; look for links that are missing, unreadable or overlapping other targets, and open one per chapter to confirm it lands on the work.
