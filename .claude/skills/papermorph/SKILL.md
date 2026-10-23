---
name: papermorph
description: Make or edit animated, narrated, interactive web books from reference PDFs, and animated picture books (paper-puppet films) from a story, a joke or a fairy tale. Use for book planning, storyboards, chapter animation and exercises, narration, and cover and contents pages, including "make the next chapter", "turn this story into a picture book" or "fix this animation". Deliver runnable static book files; bookshelf design, bookshelf registration and hosting are separate tasks.
---

# Papermorph

Papermorph makes two kinds of book on one machine:

- **Lessons**, from a textbook PDF: each chapter is a short animated lesson film where the picture carries the explanation, the narration says it, and quick checks and practice happen inside the picture.
- **Picture books**, from a story, a joke or a fairy tale: short films of paper puppets in front of sets, drawn in code or painted by an image model, with voices, effects and music.

Both are a 1600×900 SVG stage plus a player; **beats** pair narration clips with timed actions. Good means **alive** (things act and change with weight and timing), **composed** (each moment reads as one picture, text beside what it names), **true** (motion, labels and numbers agree at every moment) and **smooth** (it plays without stutter, Firefox included).

What the picture should be depends on the book and on the user, so the work starts with a conversation that ends in `style.json`: the user's words, the look they chose, the voices, which model does which step, and later the approved chapters. Every chapter is made against it; how each beat is laid out and choreographed is yours to judge against it and the approved chapters. User requests override defaults. Re-create explanations, examples and drawings; keep source PDFs, page images and extracted text outside the static output folder and out of version control (`.gitignore`: `*.pdf`, `books/*/pages/`). Deliver a self-contained book folder with local preview instructions.

## Which path

| The user brings | Path | Read |
|---|---|---|
| A textbook PDF | [Lessons](#lessons) | [intake.md](references/intake.md), then [diagrams.md](references/diagrams.md) (tier 1) or [scenes.md](references/scenes.md) (tier 2), [authoring.md](references/authoring.md), [assets.md](references/assets.md), [review.md](references/review.md) |
| A story, a joke, a fairy tale, or a story book's PDF | [Picture books](#picture-books) | [stories.md](references/stories.md), [puppets.md](references/puppets.md), [sound.md](references/sound.md), [painting.md](references/painting.md) for a painted look |
| A course book (cites works, reviewed questions, an LMS) | Lessons plus options | [courses.md](references/courses.md), only when the book calls for them |

Both paths share [site.md](references/site.md) (the book folder, cover or series page, preview, video export), [engine.md](references/engine.md) (the player and drawing API), [team.md](references/team.md) (making chapters with subagents) and the models step of [intake.md](references/intake.md#5-models). Read only the reference the current step needs.

## Project layout

```
books/<book>/
  book.pdf, sections.json      source and page map (private)
  pages/chNN/text.md, *.png    extracted reference material (private)
  style.json                  the agreed style every chapter anchors to (assets/templates/style.json)
  chapters.md                 chapter map and status
  chapters/chNN.md            storyboard, errata, feedback
  images/                     inbox, SOURCES.md, image-requests.md, processing scripts
  review/chNN/                storyboard sheets, strips, check output
content/<book>/chNN/           narration.<lang>.json and TTS cache
tools/<book>/                 tests and evidence scripts
site/<book>/                   the static book (only this is delivered)
  index.html, unit-art.js      cover + contents, unit sketches
  lib/engine.*, math.js,       the engine (player, maths helpers, cover/contents, unit headers), copied into
      volume.*, contents.*,      the book by scripts/engine.py
      units.*
  lib/book.css                 this book's engine settings and style overrides
  lib/*.js, img/               the book's element library and images
  chNN/index.html, audio/<lang>/   a lesson, its beat MP3s + timings.js
```

A picture book adds `books/<book>/story.md` (the user's telling, verbatim), `storyboard.md` and `art/` (`sets.js` with the set sketches, generated pictures, `painted.json`, `costs.tsv`); its `site/<book>/lib/` holds the paper kit (`paper.js`, `cast.js`, `shared.js` from `assets/templates/picture-book/`, which needs engine-v2.1 or later) and `img/` the baked sets, props and puppet pieces; each episode `chNN/` has one script per scene and `audio/<lang>/`, `audio/sfx/`, `audio/bgm/`.

`SKILL` means this skill's absolute folder; `<book>` is the book slug, `<lang>` its primary language code. Needs: `uv`, `ffmpeg`/`ffprobe`, Edge TTS network access (or Kokoro, local: `uv run --python 3.12 --with kokoro`), github.com for `engine.py` when the repository's `engine/` folder is not at hand, and Playwright browsers (`uv run --with playwright playwright install chromium firefox`; where Playwright's Chromium does not run, set `CHROME` to an installed Chrome, Chromium, Brave or Edge). Preview: `python3 SKILL/scripts/serve.py 8765 site` (no browser caching).

## Lessons

### Pipeline

Start with intake whenever `books/<book>/style.json` does not exist yet; reuse answers and approvals already given.

1. **Intake** ([intake.md](references/intake.md)), a short conversation: find the PDF with the user (a story goes to [stories.md](references/stories.md)), split it, say what the book is, agree on one chapter to try and a tier, start the book folder, settle the look the way that tier needs, agree which model does which step, and write `style.json`.
   - Split: `uv run --with pymupdf SKILL/scripts/outline.py books/<book>/book.pdf`; use `--level N -o books/<book>/sections.json` at chapter depth. A chapter bookmark that points outside its neighbours is moved to the page holding its title or dropped, with a warning: look at those chapters' pages. For a PDF without usable chapter bookmarks, inspect `split_pages.py … --pages 1-12 --out books/<book>/pages`, then write the map from its contents (schema: `outline.py --help`). Extract chapter text with `split_pages.py … --sections books/<book>/sections.json --out books/<book>/pages --text-only`.
   - Start the book folder with [site.md](references/site.md#start-a-book-folder) before showing the user any frames; build agreed shared components once into the book's library ([assets.md](references/assets.md)) and list them in `style.json`.
2. **Pilot.** Make the chosen chapter through the chapter loop and deliver it for the user's judgement. Fold their feedback into `style.json` and record the chapter under `approved`.
3. **Remaining chapters and finish**, when the user wants the whole book: write `chapters.md`, produce chapters sequentially (see *Context*), complete cover text, contents and unit sketches using [site.md](references/site.md). Deliver the static book folder, its entry URL for local preview and any unresolved issues.

A course book may also want verified citation links, a reviewed question bank or a SCORM package for an LMS; offer them only when the book calls for them ([courses.md](references/courses.md)).

### Chapter loop

1. **Read** this chapter's `pages/chNN/text.md`; render pages with `split_pages.py … --only chNN` when diagrams or missing text need images. Choose the ideas, examples and sections to teach.
2. **Beats and narration**: list beats in `chapters/chNN.md` with what each says and which word triggers which action ([authoring.md](references/authoring.md)). Write `content/<book>/chNN/narration.<lang>.json`, then `uv run --with edge-tts SKILL/scripts/tts.py content/<book>/chNN/narration.<lang>.json site/<book>/chNN/audio/<lang>` (for `"engine": "kokoro"`: `uv run --python 3.12 --with kokoro …`).
3. **Storyboard, layout first**: in the real page, place everything for one to three key moments per beat, real elements at their real sizes, no motion yet. Capture them into one sheet with `strip.py` and give each frame one line: what it says and where the eye goes. That sheet is the storyboard. Note what the chapter needs beyond the library: draw it, or add it to the image requests.
4. **Motion**: add the motion, the camera and the questions; API and replay invariants are in [engine.md](references/engine.md).
5. **Delivery pass**: watch your output in motion and judge it as a viewer would, against the storyboard; then run the checks in [review.md](references/review.md). Correct what you find, recheck, deliver; report unresolved problems.
6. **Register**: add the chapter to the contents (`units` in `Contents.book` in `index.html`), set the previous chapter's `CHAPTER.next`, update `chapters.md` and `chapters/chNN.md`. Promote new shared decisions and recurring elements to `style.json` and the library. The coordinator owns this step when using subagents.

## Picture books

Start with the story intake in [stories.md](references/stories.md#intake-for-a-story) whenever `books/<book>/style.json` does not exist yet; agree the models ([intake.md](references/intake.md#5-models)) and write `style.json`. Then follow [the order of work](references/stories.md#the-order-of-work): the script and storyboard shown to the user before anything is built, the book folder ([site.md](references/site.md#a-picture-book)), sound, sets, scenes, [review rounds](references/stories.md#review-rounds), and the user's viewing of the first cut. Each episode is a chapter (`chNN`); a series shares its cast, sets and series page.

## Scripts

All in `SKILL/scripts/`; each prints its usage with `--help` (run it with the `uv run --with …` its docstring names).

| For | Scripts |
|---|---|
| Every book | `serve.py` preview without caching · `engine.py` sync the engine into books · `tts.py` narration and word times · `lint.py` static checks · `shot.py` beat screenshots · `strip.py` storyboard sheets and motion strips · `still.py` stretches where nothing moves · `perf.py` Firefox frame times · `export.py` MP4 and `.srt` |
| Lessons | `outline.py` and `split_pages.py` page map and chapter text · `check_blank.py` empty openings · `overlap.py` arrows through text · `sprites.py` image processing steps |
| Picture books | `mouths.py` mouth shapes · `level.py` even loudness · `join.py` one clip per scene · `sfx.py` synthesized effects · `playlog.py` sounds and captions against the picture · `bake_sets.py` set layers · `bake_puppets.py` puppet bitmaps · `paint.py` / `paint_openai.py` image-model pictures · `painted.py` place them in the book |
| Course options | `refs.py` verified citations · `items.py` question bank · `scorm.py` LMS package |

`silence.py`, `ledger.py` and `browsers.py` are helpers the others import.

## Context

- Talk with the user from the main conversation: intake, and every sheet and choice of the pilot. When subagents are available, chapters are made as a team: a fresh worker per step of the chapter loop, each on the model the user chose for that step (`models` in `style.json`), chapters one after another; a picture book splits by scene instead. The main conversation coordinates the pilot, since the user sees its sheets; later chapters are best coordinated from a fresh session ([team.md](references/team.md)). Without subagents, run the same loop in the current agent with file-based state.
- A worker needs little besides this Skill and `style.json`: the user's words, the look, the approved chapters to watch and read, the element library. A brief adds the chapter, its pages, the step's inputs and outputs and any current user request. Workers reply in a few lines; the coordinator registers the chapter.
- Use the engine API and inspect individual functions when needed; copy assets rather than reading their full source as instructions.
- Keep `style.json` current and short. Chapter status, errata and historical feedback stay in `chapters.md` and `chapters/chNN.md`.
