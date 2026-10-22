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
- `tts.py` writes `<beat>.mp3` and `timings.js` (duration, marks, captions) and caches each finished beat beside the narration JSON: moving `[[marks]]` reuses the cache, and after a failure the same command resumes rather than starting over.
- Engine: `"engine": "edge"` (default, online) or `"kokoro"` (local, Apache 2.0; English word timings; voices such as `am_michael`, `af_heart`, `bm_george`), set at the top of the narration file with `voice` and `rate`. Keep one engine and voice per book.

## Questions

Pick the type that lets the student act on the picture itself whenever possible (click the point, the cell, the step) rather than choosing text.

| Type | Use for |
| --- | --- |
| `choice` / `mcq` | One answer from a few options, each wrong option with its own explanation; `mcq(id)` takes it from the chapter's item bank |
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
- Compose the question beat for its card: the picture the question is about stays visible (for example in the top 60 % with a `BAND` card below, or beside a `{x, y, w, cls: 'side'}` card); `SCREEN` for practice.
- Units in typed answers: write the unit as a word after the box (`{ box: '60' }, ' kilograms'`) so it is not set as a math variable.

### Choice questions from an item bank

A chapter's choice questions can live in a reviewed item bank, `books/<book>/items/chNN.items.json`, instead of inline in the page, so they can be linted, reviewed by a person in a sheet, and approved before release. The bank follows the JSON schema of the [mcq-item-writer](https://github.com/titulartarantula/mcq-item-writer) skill, which writes and lints items against evidence-based item-writing rules (stem with the problem, one best answer, plausible distractors, feedback on every option). Inline `choice` stays fine for a quick check written on the spot.

For a bank used by a page:

- **Ids** keep the book's prefixes: `c-…` for a quick check, `p-…` for practice (the finish card adds them up by prefix).
- **The card is the screen.** Put the scenario and lead-in in `stem`; no data tables or media (draw the data in the beat and ask about it). Options stay short enough for one line on the card; three options fit a side or band card, four only on a `SCREEN`.
- **Feedback** on every option, two or three sentences. The engine adds "Correct." / "Not quite.", so don't start with a verdict; `items.py` drops one if present.
- **Order.** Options show as authored (no shuffle): spread the right answer's position across the chapter.

Build the page's copy after every bank change, and never edit `items.js` by hand:

```sh
python3 SKILL/scripts/items.py books/<book>/items/chNN.items.json site/<book>/chNN/items.js
```

The chapter loads `<script src="items.js"></script>` right after `engine.js` and asks with `quiz(TOPR, [mcq('c-attrib')], done)` (engine.md). `items.py` refuses what a card cannot show (multiple-response items, tables, media, no single key) and warns about items not yet marked `approved`.

## Content rules

- Follow the agreed chapter scope and order. Verify facts, calculations and answers actually used in the finished lesson; correct or replace source errors and note them in `books/<book>/chapters/chNN.md` for the user.
- Check worked examples as the subject, not only as arithmetic (a push on someone standing on the ground is not the net force).
- Use the notation and rounding in `style.json` (`look.notation`). Record new shared decisions there.

## Citations

An option for books that name other works (an author–year, a quoted study, a book title), usually academic ones; offer it at intake, not by default. Each such work on screen can be a live link to it. Links come from a verified list, never from memory.

1. **List.** Add each cited work to `books/<book>/refs.json`, taking authors, year and full title from the source book's own reference list (`pages/*/text.md`). The key is `surname-surname-year` (`scheper-hughes-lock-1987`); `cite` is the on-screen label (`python3 SKILL/scripts/refs.py --help` lists the entry fields).
2. **Find.** `python3 SKILL/scripts/refs.py lookup books/<book>/refs.json --write`. It accepts a Crossref DOI only when the year, first author and title all match. For books without a DOI it takes the ISBN of the edition from the cited year (Open Library), which links to its WorldCat record. Decide each `NO CONFIDENT MATCH` by hand: pick the right candidate or a trusted academic page (`url`, e.g. PubMed, JSTOR, ERIC, a university repository). If none exists, keep the citation as plain text and note it in the chapter file.
3. **Verify.** `python3 SKILL/scripts/refs.py verify books/<book>/refs.json --write` resolves every DOI or ISBN, checks it against the entry, fills in missing metadata and stamps `verified`. Fix every `FAIL`.
4. **Build.** `python3 SKILL/scripts/refs.py build books/<book>/refs.json site/<book>/refs.js`, and uncomment the `refs.js` line in `index.html` and each chapter: the contents ends with a link to a separate References view that lists every work, and each chapter's finish card lists the sources that chapter cites.
5. **Draw.** `cite(p, key, { x, y, size, fill, anchor, weight, o: 0 })` draws the label as an underlined link and returns it, ready for `show()`/`tw()` like `T`; `str` overrides the label (e.g. `'(1987)'` after a name drawn separately). Text drawn with `T` or written in a card that matches a work's `cite` label (or one of its `match` strings) becomes a link by itself. Clicking a citation opens the source in a new tab and pauses the lesson; faded-out links take no clicks or Tab focus. A work discussed but not drawn goes in `CHAPTER.refs` so the finish card still lists it.

Draw a citation next to the text it supports rather than inside a long sentence, so the link is a separate target of at least 24 px text height.
