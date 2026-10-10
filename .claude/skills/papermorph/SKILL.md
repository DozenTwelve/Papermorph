---
name: papermorph
description: Make or edit animated, narrated, interactive web books from reference PDFs. Use for book planning, storyboards, chapter animation and exercises, narration, and cover and contents pages, including "make the next chapter" or "fix this animation". Deliver runnable static book files; bookshelf design, bookshelf registration and hosting are separate tasks.
---

# Papermorph

Make the picture explain the idea through change: rearrange, split, balance, count, compare. Each chapter is one 1600×900 SVG stage plus controls; **beats** pair narration clips with timed actions. Quick checks and final practice happen inside the picture. Templates supply mechanics; choose the visual argument for the content.

Follow the pipeline forward, entering at the requested stage for existing work. User requests override defaults. Default to code/SVG artwork; record any other asset choices in the book's conventions. Re-create explanations, examples and drawings; keep source PDFs, page images and extracted text outside the static output folder and out of version control (`.gitignore`: `*.pdf`, `books/*/pages/`). Deliver a self-contained book folder with a cover, contents, chapters and local preview instructions.

## Project layout

```
books/<book>/
  book.pdf, sections.json      source and page map (private)
  pages/chNN/text.md, *.png    extracted reference material (private)
  BOOK.md                     current scope, conventions, helper index
  chapters.md                 chapter map and status
  chapters/chNN.md            brief storyboard, relevant errata and feedback
content/<book>/chNN/           narration.<lang>.json and TTS cache
tools/<book>/                 targeted tests when needed
site/                          static output; private sources stay outside
  <book>/index.html            cover + contents        (assets/templates/book.html)
  <book>/unit-art.js           unit sketches           (assets/templates/unit-art.js)
  <book>/lib/engine.js, .css   this book's engine copy (assets/engine/)
  <book>/chNN/index.html       a lesson                (assets/templates/chapter.html)
  <book>/chNN/audio/<lang>/    beat MP3s + timings.js
```

`SKILL` means this skill's absolute folder; `<book>` is the book slug, `<lang>` its primary language code. Existing books keep their paths. Needs: `uv`, `ffmpeg`/`ffprobe`, Edge TTS network access and Playwright Chromium (`uv run --with playwright playwright install chromium`). Preview: `python3 -m http.server 8765 -d site`.

## Pipeline

Resolve intake, book map and pilot decisions with the user; reuse answers and approvals already given.

1. **Intake.** Choose a slug; create `books/<book>/BOOK.md` from the template. Record readers, tone, primary language, scope and assets/guide. Ask for missing decisions together, with defaults.
2. **Split.** Run `uv run --with pymupdf SKILL/scripts/outline.py books/<book>/book.pdf`; use `--level N -o books/<book>/sections.json` at chapter depth. For a PDF without usable chapter bookmarks, inspect `split_pages.py … --pages 1-12 --out books/<book>/pages`, then write the map from its contents (schema: `outline.py --help`). Match the map to the contents; extract chapter text with `split_pages.py … --sections books/<book>/sections.json --out books/<book>/pages --text-only`.
3. **Book map.** Read contents and chapter openings; inspect more text where the scope is unclear. Create `chapters.md` with columns `# | Title | Unit | Minutes | Status` (planned, ready, user-approved); put colours and candidate recurring visual models in BOOK.md. Confirm the list and visual approach with the user.
4. **Initialize.** Follow [site.md](references/site.md#start-a-book-folder) to copy the book engine, cover/contents and chapter skeleton before making the pilot.
5. **Pilot.** Make chapter 1 through the chapter loop. Deliver it for the user's review and record approved conventions in BOOK.md. Implement helpers as needed; share one when another chapter uses it.
6. **Remaining chapters and finish.** Produce chapters sequentially (see *Context*). Complete cover text, contents and unit sketches using [site.md](references/site.md). Deliver the static book folder, its entry URL for local preview and any unresolved issues for human review; reuse each chapter's delivery results.

## Chapter loop

1. **Read** this chapter's `pages/chNN/text.md`; render its pages with `split_pages.py … --only chNN` when diagrams or missing text need images. Select the ideas and examples to teach.
2. **Storyboard** in `chapters/chNN.md`: beat list, visual changes, narration triggers and questions. Use [authoring.md](references/authoring.md) for content conventions; verify the examples and answers used in the finished chapter.
3. **Narration**: write `content/<book>/chNN/narration.<lang>.json`, then `uv run --with edge-tts SKILL/scripts/tts.py content/<book>/chNN/narration.<lang>.json site/<book>/chNN/audio/<lang>`.
4. **Beats**: implement the storyboard in `site/<book>/chNN/index.html`; API and replay invariants are in [engine.md](references/engine.md). Use the book's approved look and interactions.
5. **Delivery pass**: follow [review.md](references/review.md) once for loading, opening blanks, overlap/cropping, text density and colour consistency. Correct clear defects locally, recheck the affected part, then deliver; report unresolved problems. The user reviews overall aesthetics, pacing and teaching effectiveness.
6. **Register**: add the ready chapter to `UNITS`, set the previous chapter's `CHAPTER.next`, update its row in `chapters.md` and notes in `chapters/chNN.md`. Promote new shared decisions to BOOK.md. The coordinator owns this step when using subagents.

## Context

- Keep the pilot in the main conversation. Afterwards, use one fresh subagent per chapter sequentially when available; otherwise use the same chapter loop in the current agent with file-based state.
- Brief with chapter number, relevant map row, book/source/output paths, Skill path and current user requests. Pass these instead of full conversation history where the host supports fresh context. Worker reads BOOK.md and its chapter notes, completes steps 1–5, and returns files, delivery result, errata and new helpers/decisions in a few lines. Coordinator registers it.
- Read only the reference needed for the current step. Use the engine API and inspect individual functions when needed; copy assets rather than reading their full source as instructions.
- Keep BOOK.md to current conventions and the helper index. Chapter status, errata and historical feedback stay in their own files; read only relevant entries.
- Write from the storyboard in one pass. Use contact sheets and short command summaries; retain failure details. Run targeted interaction tests when the engine or grading changes, as described in review.md.
