---
name: papermorph
description: Make or edit animated, narrated, interactive web books from reference PDFs. Use for book planning, storyboards, chapter animation and exercises, narration, and cover and contents pages, including "make the next chapter" or "fix this animation". Deliver runnable static book files; bookshelf design, bookshelf registration and hosting are separate tasks.
---

# Papermorph

Each chapter is a short animated lesson film: the picture carries the explanation, the narration says it, and quick checks and practice happen inside the picture. Good means **alive** (things act and change with weight and timing), **composed** (each moment reads as one picture, text beside what it names), **true** (motion, labels and numbers agree at every moment) and **smooth** (it plays without stutter, Firefox included). Technically a chapter is one 1600×900 SVG stage plus a player; **beats** pair narration clips with timed actions.

What the picture should be depends on the book and on the user, so the work starts with a conversation ([intake.md](references/intake.md)) that ends in `style.json`, the book's agreed style. Every chapter is made against it. `style.json` fixes the atoms (palette and meanings, fonts, voice, cast, shared components, approved chapters); composition stays free, so how each beat is laid out and choreographed is yours to judge against it and the approved chapters. Then read the reference for the technique in use: [diagrams.md](references/diagrams.md) (symbols and diagrams that change), [scenes.md](references/scenes.md) (illustrated scenes, actors, camera), [assets.md](references/assets.md) (shared components, images, sprites), [authoring.md](references/authoring.md) (chapter shape, narration, questions), [engine.md](references/engine.md), [review.md](references/review.md), [site.md](references/site.md), [team.md](references/team.md) (making chapters with subagents).

Follow the pipeline forward, entering at the requested stage for existing work. User requests override defaults. Re-create explanations, examples and drawings; keep source PDFs, page images and extracted text outside the static output folder and out of version control (`.gitignore`: `*.pdf`, `books/*/pages/`). Deliver a self-contained book folder with a cover, contents, chapters and local preview instructions.

## Project layout

```
books/<book>/
  book.pdf, sections.json      source and page map (private)
  pages/chNN/text.md, *.png    extracted reference material (private)
  refs.json                   cited works with verified DOI/ISBN/URL (scripts/refs.py)
  items/chNN.items.json       optional choice-question bank per chapter (scripts/items.py)
  style.json                  the agreed style every chapter anchors to (assets/templates/style.json)
  chapters.md                 chapter map and status
  chapters/chNN.md            storyboard, errata, feedback
  images/                     inbox, SOURCES.md, image-requests.md, processing scripts
  review/chNN/                storyboard sheets, strips, check output
content/<book>/chNN/           narration.<lang>.json and TTS cache
tools/<book>/                 tests and evidence scripts
site/<book>/                   the static book (only this is delivered)
  index.html, unit-art.js      cover + contents, unit sketches
  refs.js                      the cited works, built by scripts/refs.py
  lib/engine.*, volume.*,      the engine (player, cover/contents, unit headers), copied into the book by
      contents.*, units.*        scripts/engine.py
  lib/book.css                 this book's engine settings and style overrides
  lib/*.js, img/               the book's element library and images
  chNN/index.html, audio/<lang>/   a lesson, its beat MP3s + timings.js
  chNN/items.js                built choice questions (scripts/items.py), when the chapter has a bank
```

`SKILL` means this skill's absolute folder; `<book>` is the book slug, `<lang>` its primary language code. Existing books keep their paths. Needs: `uv`, `ffmpeg`/`ffprobe`, Edge TTS network access (or Kokoro, local: `uv run --python 3.12 --with kokoro`) network access to api.crossref.org and openlibrary.org for references, and Playwright browsers (`uv run --with playwright playwright install chromium firefox`). Preview: `python3 SKILL/scripts/serve.py 8765 site` (no browser caching).

## Pipeline

Start with intake whenever `books/<book>/style.json` does not exist yet; reuse answers and approvals already given.

1. **Split.** Run `uv run --with pymupdf SKILL/scripts/outline.py books/<book>/book.pdf`; use `--level N -o books/<book>/sections.json` at chapter depth. For a PDF without usable chapter bookmarks, inspect `split_pages.py … --pages 1-12 --out books/<book>/pages`, then write the map from its contents (schema: `outline.py --help`). Extract chapter text with `split_pages.py … --sections books/<book>/sections.json --out books/<book>/pages --text-only`.
2. **Intake.** Follow [intake.md](references/intake.md): find the PDF with the user, say what the book is, agree on one chapter to try and a tier, settle the look the way that tier needs, and write `style.json`.
3. **Initialize.** Follow [site.md](references/site.md#start-a-book-folder); build agreed shared components once into the book's library ([assets.md](references/assets.md)) and list them in `style.json`.
4. **Pilot.** Make the chosen chapter through the chapter loop and deliver it for the user's judgement. Fold their feedback into `style.json` and record the chapter under `approved`.
5. **Remaining chapters and finish**, when the user wants the whole book: write `chapters.md`, produce chapters sequentially (see *Context*), complete cover text, contents and unit sketches using [site.md](references/site.md). Deliver the static book folder, its entry URL for local preview and any unresolved issues.

## Chapter loop

1. **Read** this chapter's `pages/chNN/text.md`; render pages with `split_pages.py … --only chNN` when diagrams or missing text need images. Choose the ideas, examples and sections to teach. When the chapter names other works (an author–year, a study, a book), add them to `refs.json` and run `refs.py lookup`, `verify` and `build` ([authoring.md](references/authoring.md#citations)).
2. **Beats and narration**: list beats in `chapters/chNN.md` with what each says and which word triggers which action ([authoring.md](references/authoring.md)). Write `content/<book>/chNN/narration.<lang>.json`, then `uv run --with edge-tts SKILL/scripts/tts.py content/<book>/chNN/narration.<lang>.json site/<book>/chNN/audio/<lang>` (for `"engine": "kokoro"`: `uv run --python 3.12 --with kokoro …`).
3. **Storyboard, layout first**: in the real page, place everything for one to three key moments per beat, real elements at their real sizes, no motion yet. Capture them into one sheet with `strip.py` and give each frame one line: what it says and where the eye goes. That sheet is the storyboard. Note what the chapter needs beyond the library: draw it, or add it to the image requests.
4. **Motion**: add the motion, the camera and the questions (choice questions may come from an item bank via `mcq()`, [authoring.md](references/authoring.md#choice-questions-from-an-item-bank)); API and replay invariants are in [engine.md](references/engine.md).
5. **Delivery pass**: watch your output in motion and judge it as a viewer would, against the storyboard; then run the checks in [review.md](references/review.md). Correct what you find, recheck, deliver; report unresolved problems.
6. **Register**: add the chapter to the contents (`units` in `Contents.book` in `index.html`), set the previous chapter's `CHAPTER.next`, update `chapters.md` and `chapters/chNN.md`. Promote new shared decisions and recurring elements to `style.json` and the library. The coordinator owns this step when using subagents.

## Context

- Keep intake and the pilot in the main conversation. Afterwards, when subagents are available, coordinate each chapter as a team: a fresh worker per step of the chapter loop, each on the cheapest model that does that step well, chapters one after another ([team.md](references/team.md)). Without subagents, run the same loop in the current agent with file-based state.
- A worker needs little besides this Skill and `style.json`: the user's words, the look, the approved chapters to watch and read, the element library. A brief adds the chapter, its pages, the step's inputs and outputs and any current user request. Workers reply in a few lines; the coordinator registers the chapter.
- Read only the reference needed for the current step. Use the engine API and inspect individual functions when needed; copy assets rather than reading their full source as instructions.
- Keep `style.json` current and short. Chapter status, errata and historical feedback stay in `chapters.md` and `chapters/chNN.md`.
