# Lessons: from a textbook PDF to animated chapters

Each chapter is a short animated lesson film where the picture carries the explanation, the narration says it, and quick checks and practice happen inside the picture. The maths books (`site/elementary-algebra/`, `site/math-notebook/`) show tier 1, the science book (`site/science/`) tier 2. A new book starts with [intake.md](intake.md).

## Contents

- Project layout
- Pipeline
- Chapter loop
- LaTeX
- Team

## Project layout

What a lesson book adds to the layout in SKILL.md:

```
books/<book>/
  book.pdf, sections.json      source and page map (private)
  pages/chNN/text.md, *.png    extracted reference material (private)
  style.json                  the agreed style every chapter anchors to
  chapters.md                 chapter map and status
  chapters/chNN.md            storyboard, errata, feedback
  images/                     inbox, SOURCES.md, image-requests.md, processing scripts
  review/chNN/                storyboard sheets, strips, check output
site/<book>/
  index.html, unit-art.js      cover + contents, unit sketches (cover.md)
  lib/engine.*, math.js, volume.*, contents.*, units.*   the engine, copied in by engine.py
  lib/book.css                 this book's engine settings and style overrides
  lib/*.js, img/               the book's element library and images (assets.md)
  chNN/index.html, audio/<lang>/   a lesson, its beat MP3s + timings.js
```

## Pipeline

1. **Intake** ([intake.md](intake.md)): find the PDF with the user, split it, say what the book is, agree on one chapter to try and a tier, start the book folder, settle the look the way that tier needs, agree the models and write `style.json` ([core/style.md](../core/style.md)).
   - Split: `uv run --with pymupdf SKILL/scripts/outline.py books/<book>/book.pdf`; use `--level N -o books/<book>/sections.json` at chapter depth. A chapter bookmark that points outside its neighbours is moved to the page holding its title or dropped, with a warning: look at those chapters' pages. Without usable chapter bookmarks, inspect `split_pages.py … --pages 1-12 --out books/<book>/pages` and write the map from its contents (schema: `outline.py --help`). Extract chapter text with `split_pages.py … --sections books/<book>/sections.json --out books/<book>/pages --text-only`.
   - Start the book folder with `new_book.py lesson <book>` ([core/publish.md](../core/publish.md#start-a-book-folder)) before showing the user any frames; build agreed shared components once into the book's library ([assets.md](assets.md)) and list them in `style.json`.
2. **Pilot.** Make the chosen chapter through the chapter loop and deliver it for the user's judgement. Fold their feedback into `style.json` and record the chapter under `approved`.
3. **Remaining chapters and finish**, when the user wants the whole book: write `chapters.md`, produce chapters one after another ([Team](#team)), complete cover text, contents and unit sketches ([cover.md](cover.md)). Deliver the static book folder, its local preview URL and any unresolved issues.

A course book may also want verified citation links, a reviewed question bank or a SCORM package; offer them only when the book calls for them ([courses.md](courses.md)).

## Chapter loop

1. **Read** this chapter's `pages/chNN/text.md`; render pages with `split_pages.py … --only chNN` when diagrams or missing text need images. Choose the ideas, examples and sections to teach.
2. **Beats and narration**: list beats in `chapters/chNN.md` with what each says and which word triggers which action ([authoring.md](authoring.md)). Write `content/<book>/chNN/narration.<lang>.json` and voice it with `tts.py` ([core/sound.md](../core/sound.md#voices)).
3. **Storyboard, layout first**: one to three key moments per beat, placed in the real page without motion and captured into one sheet ([scenes.md](scenes.md#storyboard-layout-first-then-motion), [diagrams.md](diagrams.md)). Whatever the chapter needs beyond the library is drawn or added to the image requests ([assets.md](assets.md#chapter-level-needs-noticed-while-storyboarding)).
4. **Motion**: add the motion, the camera and the questions ([questions.md](questions.md)); API and replay invariants are in [core/engine.md](../core/engine.md).
5. **Delivery pass**: watch it against the storyboard ([core/review.md](../core/review.md)), run the lesson checks ([checks.md](checks.md)), correct, recheck, deliver; report unresolved problems.
6. **Register**: add the chapter to the contents (`units` in `Contents.book` in `index.html`, [cover.md](cover.md)), set the previous chapter's `CHAPTER.next`, update `chapters.md` and `chapters/chNN.md`. Promote new shared decisions and recurring elements to `style.json` and the library. With subagents the coordinator owns this step.

## LaTeX

For formulas that need LaTeX ([core/engine.md](../core/engine.md#latex)), add MathJax (with its licence) to `lib/` and load `../lib/mathjax.js` right after `engine.js` in every chapter:

```sh
python3 SKILL/scripts/engine.py site/<book> --latex   # lib/mathjax.js; later syncs keep it in step
```

## Team

The general shape and the coordinator's job are in [core/team.md](../core/team.md); a lesson splits by step of the chapter loop, chapters one after another.

In the pilot the picture worker stops when the storyboard sheet is ready and replies with it; the coordinator shows it to the user, then continues the same worker with the user's changes to add motion.

1. **Extract — small.** From `pages/chNN/text.md` and the page images it needs, write the source material into `chapters/chNN.md` in the shape of the previous chapter's: concepts in book order with the book's wording and examples, vocabulary, each figure (labels, arrows, purpose), every end-of-chapter question with its answer, and possible problems in the source (flagged, not decided).
2. **Narration — middle.** From chNN.md, [authoring.md](authoring.md), `style.json` and the previous approved chapter (its beat table and narration as the worked example): decide each flagged problem (`## Errata`), choose what to teach for the book's pacing (and say what was dropped), write the beat table (what the picture shows and does, each `[[mark]]` and the action it triggers, where the eye goes, new visual elements needed), all questions and the narration file, then run `tts.py` and confirm every mark is in timings.js. The plan must be concrete enough for a different model to build from.
3. **Picture — strong.** From the plan, `style.json`, the previous approved chapter's page and the library: storyboard layout first, then motion, camera and questions, new shared elements in the library, a quick self-view of the busiest beats and lint. The plan is a plan, not a cage. Storyboard and motion stay in one step, or the next worker would have to read the whole page again. Look at the storyboard sheet yourself when it comes back; problems visible there are cheapest to name now.
4. **Checks — small, report-only**, in parallel with 5: lint, `check.py`, `check_blank.py`, `overlap.py`, `still.py`, `perf.py` in Firefox, and an e2e test adapted from the previous chapter's (the first from `assets/templates/e2e.py`, [checks.md](checks.md#interaction-tests)), in Chromium and Firefox. It reports problems with beat and time and changes only its own test.
5. **Review — middle**, in parallel with 4: watch every beat ([core/review.md](../core/review.md#watch-it-in-motion)) against the storyboard and the approved chapters. It fixes small local problems itself and lists larger ones with beat, time and a suggested fix. Its reply opens with the beats it watched; if some are missing, send it back to finish (continuing a worker is cheaper than starting one).
6. **Rework — strong, only for real problems** left by 4 and 5: a brief listing exactly those, re-checked with strips, `still.py`, lint and e2e in both browsers.
7. **Register — small.** Give it the exact edits: the contents entry, the previous chapter's `CHAPTER.next`, chapter counts on the cover, `chapters.md` and the status line in chNN.md. Then lint and e2e.
