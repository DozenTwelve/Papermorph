# Authoring a chapter

## Shape

The algebra book used roughly 5–11 minute chapters and 5–40 second beats. Let the content determine length and the number of checks/practice sets.

| Beat | Purpose |
| --- | --- |
| `intro` | Title card (unit and chapter number, title, one line of purpose). |
| lesson beats | One idea each, built up in the picture while the narration explains it. |
| `q1`, `q2`, … | A check of already taught content, separated from the next check by a lesson beat. |
| `wrap` | Three or four numbered takeaways. |
| `final1` … | Consecutive full-screen practice sets labelled "Chapter practice N of M", covering the whole chapter. |
| `finish` | Score card (`finishCard`): first-try results for quick checks and practice. |

Beat ids are shared by the page (`BEATS`) and the narration file; a beat with `ask` waits for the answers before moving on.

## Storyboard

Before writing code, list the beats. For each lesson beat decide:

- what the eye should watch, and what changes;
- why that change is true (the animation is the argument, not decoration);
- which words trigger which actions (these become `[[marks]]`);
- what text appears on screen: the key formula, rule or label, placed beside the thing it names;
- what is still on screen from the previous beat, and what fades.

Principles that held up over a whole book:

- **Open on the subject.** When a beat clears the picture, the new topic (expression, diagram, question) appears right away; labels and steps then follow the words. The engine moves an opening group forward if nothing appears in the first 0.8 s, but design for it. Normal transitions and short pauses for thought are fine; the picture need not move all the time.
- **One new thing at a time.** Don't introduce several objects, colours and texts at once.
- **Same colour, same meaning** within a chapter (and, where it fits, across the book).
- **Be exact.** Number lines, grids and areas are to scale; a deliberately enlarged drawing says "drawn larger" on screen. Approximations are written as approximations (≈ 4.47…, never = 4.47).
- **Teach the chapter's scope.** If the book jumps ahead or uses something not yet taught, leave it out or say so.
- **Show the common mistake** where one exists (e.g. squaring the coefficient too), visually crossed out, then the right way.

## Narration

`content/<book>/chNN/narration.<lang>.json` (English example):

```json
{ "voice": "en-US-AndrewMultilingualNeural", "rate": "-4%",
  "beats": { "intro": "Chapter five. [[sub]]Subtraction undoes addition.", "...": "..." } }
```

- `[[name]]` goes right before the word an action waits for; `m('name', offset)` in the page returns when that word starts. Names are unique within a beat; a misspelt mark makes the page throw, and a mark that matches no spoken word makes `tts.py` stop.
- Write for the ear: short sentences, one idea each. Say math in words ("negative seven halves", "x squared"); the picture shows the symbols.
- Match the audience: plain, warm, never childish. Explain why, not only how.
- Question beats get one short line ("Quick check. Find the mean."); the card holds the question.
- `tts.py` caches word timings beside the narration JSON; the output folder receives `<beat>.mp3` and `timings.js` (duration, marks, sentence captions). Moving or adding `[[marks]]` reuses the spoken-text cache and recalculates timings. Existing caches made with raw-text keys are reused for an unchanged beat and then upgraded; changing its marks before that upgrade may require one new synthesis.
- Audio is replaced only after synthesis and timing validation succeed, and each completed beat is cached immediately. After a later failure, rerun the same command to reuse completed beats rather than regenerating the chapter.
- Another language: write `narration.<lang>.json` from the template with a voice for that language (`uv run --with edge-tts edge-tts --list-voices`); marks and captions work the same way. Beat ids and mark names stay ASCII.

## Questions

Pick the type that lets the student act on the picture itself whenever possible (click the point, the cell, the step) rather than choosing text.

| Type | Use for |
| --- | --- |
| `choice` | One answer from a few options, each wrong option with its own explanation |
| `blanks` | Typed numbers inside an expression; fractions and mixed numbers accepted; `test` judges a whole row (answers in any order) |
| `grid` | Several items, each classified (yes/no, which category, true/false) |
| `tap` / `tapEls` / `pickEls` | Click a point on the number line / a token in an expression / any drawn object |
| `pickPoint` | Choose a grid point on a coordinate plane |
| `sorter` | Drag items into regions (the number-set diagram) |

New types are welcome when the content calls for one; each needs keyboard play (see engine.md).

- Ids: `c-…` for quick checks, `p-…` for practice; the score card adds them up.
- The prompt is HTML text; put math in it with `$m(...)`.
- Feedback: right → `why` (and an animation via `fx`/`onRight`); wrong → a hint aimed at that mistake; after a wrong try, Show answer.
- Grade meaning: equal values match (6/8 = 3/4) unless the lowest form is asked for; sets and pairs in any order; no denominators of zero; never judge irrationality from finitely many digits.
- The built-in numeric parser uses safe integer numerators and denominators and exact integer products for equality. For answers outside that range, use a subject-specific input and grader rather than allowing rounded values to pass.
- Place cards so they don't cover the object being asked about (`BAND` under a number line, `TOPR` top right, a custom `{x, y, w, cls: 'side'}` beside a figure, `SCREEN` for practice).

## Content rules

- Follow the agreed chapter scope and order. Verify facts, calculations and answers actually used in the finished lesson; correct or replace source errors and note them in `books/<book>/chapters/chNN.md` for the user.
- Use BOOK.md's definitions, notation and rounding conventions. Record new shared decisions there.
