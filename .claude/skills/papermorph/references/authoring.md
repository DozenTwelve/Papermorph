# Authoring a chapter

## Shape

Chapters have run 5–18 minutes with 5–40 second beats; a long chapter can hold several parts (each a short title beat, lessons, a quick check and a wrap). Let the content determine length and the number of checks/practice sets.

| Beat | Purpose |
| --- | --- |
| `intro` | Title card (unit and chapter number, title, one line of purpose). |
| lesson beats | One idea each, built up in the picture while the narration explains it. |
| `q1`, `q2`, … | A check of already taught content, separated from the next check by a lesson beat. |
| `wrap` | Three or four numbered takeaways. |
| `final1` … | Full-screen practice covering the whole chapter. With several sets, label them like `'Chapter practice, set 1 of 2 · question'` (the engine appends "k of n"). |
| `finish` | Score card (`finishCard`): first-try results for quick checks and practice. |

Beat ids are shared by the page (`BEATS`) and the narration file; a beat with `ask` waits for the answers before moving on.

## Beats

Before writing code, list the beats. For each lesson beat decide what the eye should watch and what changes; why that change is true (the animation is the argument); which words trigger which actions (these become `[[marks]]`); what text appears, beside the thing it names; and what carries over from the previous beat. Then lay out the key moments as pictures (storyboard): [diagrams.md](diagrams.md) and [scenes.md](scenes.md).

- **Open on the subject.** When a beat clears the picture, the new topic appears right away; labels and steps follow the words. Short pauses for thought are fine.
- **One new thing at a time**, and **the same colour means the same thing** across the chapter and, where it fits, the book.
- **Teach the chapter's scope**, choosing sections by idea; note any reordering in `chapters/chNN.md`.

## Narration

`content/<book>/chNN/narration.<lang>.json` (English example):

```json
{ "voice": "en-US-AndrewMultilingualNeural", "rate": "-4%",
  "beats": { "intro": "Chapter five. [[sub]]Subtraction undoes addition.", "...": "..." } }
```

- `[[name]]` goes right before the word an action waits for; `m('name', offset)` in the page returns when that word starts. Names are unique within a beat; a misspelt mark makes the page throw, and a mark that matches no spoken word makes `tts.py` stop.
- Write for the ear: short sentences, one idea each. Say symbols and units in words ("negative seven halves", "meters per second squared"); the picture shows the symbols.
- Match the audience: plain, warm, never childish. Explain why, not only how.
- Question beats get one short line ("Quick check. Find the mean."); the card holds the question.
- `tts.py` writes `<beat>.mp3` and `timings.js` (duration, marks, captions) and caches each finished beat beside the narration JSON: moving `[[marks]]` reuses the cache, and after a failure the same command resumes rather than starting over. It takes a few seconds a beat, so a long chapter can outlast a tool's foreground time limit: run it in the background and wait for it before `lint.py`.
- Engine: `"engine": "edge"` (default, online) or `"kokoro"` (local, Apache 2.0; English word timings; voices such as `am_michael`, `af_heart`, `bm_george`), set at the top of the narration file with `voice` and `rate`. Keep one engine and voice per book.

## Questions

Pick the type that lets the student act on the picture itself whenever possible (click the point, the cell, the step) rather than choosing text.

| Type | Use for |
| --- | --- |
| `choice` | One answer from a few options, each wrong option with its own explanation (from a reviewed item bank: `mcq`, [courses.md](courses.md)) |
| `blanks` | Typed numbers inside an expression; fractions and mixed numbers accepted; `test` judges a whole row (answers in any order) |
| `grid` | Several items, each classified (yes/no, which category, true/false) |
| `tap` / `tapEls` / `pickEls` | Click a point on the number line / a token in an expression / any drawn object |
| `pickPoint` | Choose a grid point on a coordinate plane (math.js) |
| `sorter` | Drag items into regions (the number-set diagram; math.js) |

New types are welcome when the content calls for one; each needs keyboard play (see engine.md).

- Ids: `c-…` for quick checks, `p-…` for practice; the score card adds them up.
- The prompt is rich text ([engine.md](engine.md#traps)).
- Feedback: right → `why` (and an animation via `fx`/`onRight`); wrong → a hint aimed at that mistake; after a wrong try, Show answer.
- Grade meaning: equal values match (6/8 = 3/4) unless the lowest form is asked for; sets and pairs in any order; no denominators of zero; never judge irrationality from finitely many digits.
- The built-in numeric parser uses safe integer numerators and denominators and exact integer products for equality. For answers outside that range, use a subject-specific input and grader rather than allowing rounded values to pass.
- Compose the question beat for its card: the picture the question is about stays visible (for example in the top 60 % with a `BAND` card below, or beside a `{x, y, w, cls: 'side'}` card); `SCREEN` for practice.
- Units in typed answers: write the unit as a word after the box (`{ box: '60' }, ' kilograms'`) so it is not set as a math variable.

## Content rules

- Follow the agreed chapter scope and order. Verify facts, calculations and answers actually used in the finished lesson; correct or replace source errors and note them in `books/<book>/chapters/chNN.md` for the user.
- Check worked examples as the subject, not only as arithmetic (a push on someone standing on the ground is not the net force).
- Use the notation and rounding in `style.json` (`look.notation`). Record new shared decisions there. Group thousands with a no-break space (U+00A0) or the book's comma: a thin space all but vanishes in bold system fonts (150 000 000 read as 150000000).
