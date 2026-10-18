# Making a chapter with a team of models

After the pilot, a chapter can be made by a coordinator handing each step of the chapter loop to a fresh subagent on the model that suits it. The chapter must reach the same bar as the book's approved chapters, in the same look (`style.json`), so it sits on the shelf beside them as one book.

Why this shape: one agent doing a whole chapter carries an ever larger context through every call, and long idle waits make that context expire and get written again; that, more than the model's price, makes a chapter expensive. Small workers that start from the files they need and finish quickly cost far less, and each step can use the cheapest model that does it well. On a physics book this cost about half as much per minute of narration as one strong agent doing everything, at the same quality.

Models below are named by tier: **small** (fast and cheap; Haiku today), **middle** (Sonnet today), **strong** (Opus today). Pass the tier's current model to the subagent.

## The coordinator

You read SKILL.md and this file, look at the storyboard sheet and the workers' replies, and pass work on. You don't write the chapter, read the page code or read workers' transcripts; keeping your own context small is most of the saving. A fresh session is the best coordinator: a long conversation rereads its whole history at every step.

Start each worker in the background with a short brief: the chapter and its pages, what to read, what to write, what not to touch, the preview URL (start one server for everyone), and a reply of a few lines. Workers don't commit. Pass work on as soon as a step returns.

## Steps

1. **Extract — small.** From `pages/chNN/text.md` and the page images it needs, write the source material into `chapters/chNN.md` in the shape of the previous chapter's: concepts in book order with the book's wording and examples, vocabulary, each figure (labels, arrows, purpose), every end-of-chapter question with its answer, and a list of possible problems in the source (flagged, not decided).
2. **Narration — middle.** From chNN.md, [authoring.md](authoring.md), `style.json` and the previous approved chapter (its beat table and narration as the worked example): decide each flagged problem (`## Errata`), choose what to teach for the book's pacing (and say what was dropped), write the beat table (what the picture shows and does, each `[[mark]]` naming the word that triggers which action, where the eye goes, new visual elements needed), all questions, the narration file, then run `tts.py` and confirm every mark is in timings.js. The plan has to be concrete enough for a different model to build from.
3. **Picture — strong.** From the plan, `style.json`, the previous approved chapter's page and the book's library: storyboard layout first, then motion, camera and questions, new shared elements in the library, a quick self-view of the busiest beats and lint. The plan is a plan, not a cage. Storyboard and motion stay in one step: split, the next worker would have to read the whole page again.
   - Look at the storyboard sheet yourself when it comes back; problems visible there are cheapest to name now.
4. **Checks — small, report-only**, in parallel with 5: lint, `check_blank.py`, `overlap.py`, `still.py`, `perf.py` in Firefox, and an e2e test adapted from the previous chapter's, in Chromium and Firefox. It reports problems with beat and time and changes only its own test.
5. **Review — middle**, in parallel with 4: watch every beat as [review.md](review.md) describes, against the storyboard and the approved chapters. It fixes small local problems itself and lists larger ones with beat, time and a suggested fix. Its reply opens with the beats it watched; if some are missing, send it back to finish (continuing a worker is cheaper than starting one).
6. **Rework — strong, only for real problems** left by 4 and 5: a brief listing exactly those, re-checked with strips, `still.py`, lint and e2e in both browsers.
7. **Register — small.** Give it the exact edits: the contents entry, the previous chapter's `CHAPTER.next`, cover or shelf counts, `chapters.md` and the status line in chNN.md. Then lint and e2e.

## Before delivering

Check the reports against each other (an odd claim is worth one look at the file), confirm lint and e2e pass, and deliver the chapter URL with `?review`. If the user wants the cost, it is in the subagent transcripts (`subagents/agent-<id>.jsonl` under the session's folder in `~/.claude/projects/`: usage per assistant message, each message id counted once) plus your own session's usage.
