# Making a chapter with a team of models

A chapter can be made by a coordinator handing each step of the chapter loop to a fresh subagent on the model that suits it; for the pilot the coordinator is the main conversation, which shows the user each sheet and choice.

In the pilot, the narration and first beats made at intake (by the main conversation itself, before the models are agreed) are where steps 2 and 3 start, not something to redo. The picture worker stops when the storyboard sheet is ready and replies with it; the coordinator shows the sheet to the user, then continues the same worker with the user's changes to add motion. The chapter must reach the same bar as the book's approved chapters, in the same look (`style.json`), so it sits on the shelf beside them as one book.

Wherever a step below names the previous or approved chapter as its model, a new book's first chapter (or a series' first episode) has none yet: use what the user agreed at intake (the pilot frames or sheet, the storyboard, `style.json`), the Skill's templates and the books on the shelf. The first chapter the user approves becomes the model from then on.

Why this shape: one agent doing a whole chapter carries an ever larger context through every call, and long idle waits make that context expire and get written again; that, more than the model's price, makes a chapter expensive. Small workers that start from the files they need and finish quickly cost far less, and each step can use the cheapest model that does it well. On a physics book this cost about half as much per minute of narration as one strong agent doing everything, at the same quality.

Each step runs on the model the user chose for it (`models` in `style.json`, agreed at intake: [intake.md](intake.md#5-models)). The defaults below are named by strength: **small** (fast and cheap), **middle**, **strong** (the most capable); where `models` is silent, use them and say which model you picked.

## The coordinator

You read SKILL.md and this file, look at the storyboard sheet and the workers' replies, and pass work on. You don't write the chapter, read the page code or read workers' transcripts; keeping your own context small is most of the saving. After the pilot a fresh session is the best coordinator, starting from SKILL.md, this file and `style.json`: a long conversation rereads its whole history at every step.

Start each worker in the background with a short brief: the chapter and its pages, what to read, what to write, what not to touch, the preview URL (start one server for everyone), and a reply of a few lines. Workers don't commit. Pass work on as soon as a step returns.

## Steps

1. **Extract — small.** From `pages/chNN/text.md` and the page images it needs, write the source material into `chapters/chNN.md` in the shape of the previous chapter's: concepts in book order with the book's wording and examples, vocabulary, each figure (labels, arrows, purpose), every end-of-chapter question with its answer, and a list of possible problems in the source (flagged, not decided).
2. **Narration — middle.** From chNN.md, [authoring.md](authoring.md), `style.json` and the previous approved chapter (its beat table and narration as the worked example): decide each flagged problem (`## Errata`), choose what to teach for the book's pacing (and say what was dropped), write the beat table (what the picture shows and does, each `[[mark]]` naming the word that triggers which action, where the eye goes, new visual elements needed), all questions, the narration file, then run `tts.py` and confirm every mark is in timings.js. The plan has to be concrete enough for a different model to build from.
3. **Picture — strong.** From the plan, `style.json`, the previous approved chapter's page and the book's library: storyboard layout first, then motion, camera and questions, new shared elements in the library, a quick self-view of the busiest beats and lint. The plan is a plan, not a cage. Storyboard and motion stay in one step: split, the next worker would have to read the whole page again.
   - Look at the storyboard sheet yourself when it comes back; problems visible there are cheapest to name now.
4. **Checks — small, report-only**, in parallel with 5: lint, `check_blank.py`, `overlap.py`, `still.py`, `perf.py` in Firefox, and an e2e test adapted from the previous chapter's (the first from `assets/templates/e2e.py`), in Chromium and Firefox. It reports problems with beat and time and changes only its own test.
5. **Review — middle**, in parallel with 4: watch every beat as [review.md](review.md) describes, against the storyboard and the approved chapters. It fixes small local problems itself and lists larger ones with beat, time and a suggested fix. Its reply opens with the beats it watched; if some are missing, send it back to finish (continuing a worker is cheaper than starting one).
6. **Rework — strong, only for real problems** left by 4 and 5: a brief listing exactly those, re-checked with strips, `still.py`, lint and e2e in both browsers.
7. **Register — small.** Give it the exact edits: the contents entry, the previous chapter's `CHAPTER.next`, chapter counts on the cover, `chapters.md` and the status line in chNN.md. Then lint and e2e.

## Before delivering

Check the reports against each other (an odd claim is worth one look at the file), confirm lint and e2e pass, and deliver the chapter URL with `?review`. If the user wants the cost and runs Claude Code, it is in the subagent transcripts (`subagents/agent-<id>.jsonl` under the session's folder in `~/.claude/projects/`: usage per assistant message, each message id counted once) plus your own session's usage.

## Picture books

The same shape, split by scene instead of by step. The **strong** coordinator writes the script with the user and builds what every scene shares: cast, sets and their painting, the episode's helpers, the voices and the joined audio with its word times (`join.py --words`). Then it writes one brief for all scene workers:

- the story in a paragraph, and the user's words that set the bar;
- the episode kit's API, to read and not edit: a scene that needs more from the kit asks the coordinator, so every scene gets the fix;
- each scene's `pre`, its holes and the word times to cut on;
- continuity: who stands where, facing whom, in the first and last frame of every scene, so the cuts match;
- where things are: each set's places for puppets and props, its camera ranges, what comes into view on each pan. A painted set lands some way off its sketch (a bench seat about 30 px), so measure the places on frames of the painted set (`shot.py … --clean` gives the stage alone) and check the table on frames of every set before sending the brief out (a puppet at each place, the camera at each end of its range): in one episode a table written from the sketches put an ear off frame, feet below the ground and a tree trunk hiding the wrong side, and five workers built on it;
- the style, the effects available, how to look at one's own work, and the reply (the shots with their times, the first and last frame, what each check showed).

One **middle** worker per scene, in parallel, writes only its own `sceneN.js`; a **small** worker synthesizes the sound effects from recipes. Before replying, a scene worker runs and reports on these, each with the book's `--url` (the screenshot scripts run with reduced motion, so the workers' browsers can run at once): a strip of its scene, with time ranges and `@o@c` for walks and hands ([review.md](review.md#watch-it-in-motion)); full-size `shot.py` frames of its close-ups and of each moment a hand arrives; `shot.py --cuts sceneN` for its cuts in and out; `playlog.py --from sceneN --to sceneN`, since it cannot listen: is each effect on the frame it belongs to, each line on a moving mouth; and `still.py chNN sceneN`, saying which still stretches are meant. A brief that only asked them to look was skipped by all five workers of one episode; named commands and a reply that reports what they showed get run.

Review comes in rounds ([stories.md](stories.md#review-rounds) says what to look for):

- **Who**: four report-only reviewers watch the episode against the approved ones (a series' first: its storyboard and brief): a director (**strong**) for story, comedy, staging and shots; two picture reviewers (**middle**) splitting the scenes; one (**middle**) for sound and runtime.
- **Reports**: each ranked: scene, beat-clock time, what is wrong as a viewer sees it, a concrete fix. Earlier good reports serve as examples.
- **Merging**: the coordinator turns the reports into one rework list, taking the director's side where reviewers disagree, fixes the kit itself and sends scenes back to their workers.
- **Closing**: the next round starts by checking which findings were fixed; a last read-only pass counts them as fixed, partly fixed, not fixed or worse. Two or three rounds made the best episodes. The rounds come before the user watches, and what the user says then still decides.

A fresh session as coordinator matters even more here: contact sheets are large, and a long conversation rereads them at every step. An episode made in one night from a bedtime telling, before the review rounds existed, took about 22 million tokens, most of them the coordinator rereading its own context.
