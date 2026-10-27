# Questions

Prefer a type that lets the student act on the picture itself (click the point, the cell, the step) over choosing text.

| Type | Use for |
| --- | --- |
| `choice` | One answer from a few options, each wrong option with its own explanation (from a reviewed item bank: `mcq`, [courses.md](courses.md)) |
| `blanks` | Typed numbers inside an expression; fractions and mixed numbers accepted; `test` judges a whole row (answers in any order) |
| `grid` | Several items, each classified (yes/no, which category, true/false) |
| `tap` / `tapEls` / `pickEls` | Click a point on the number line / a token in an expression / any drawn object |
| `pickPoint` | Choose a grid point on a coordinate plane (math.js) |
| `sorter` | Drag items into regions (the number-set diagram; math.js) |

New types are welcome when the content calls for one; each needs keyboard play.

## Writing them

- Ids: `c-…` for quick checks, `p-…` for practice; the score card adds them up.
- The prompt is rich text ([core/engine.md](../core/engine.md#traps)).
- Feedback: right → `why` (and an animation via `fx`/`onRight`); wrong → a hint aimed at that mistake; after a wrong try, Show answer.
- Grade meaning: equal values match (6/8 = 3/4) unless the lowest form is asked for; sets and pairs in any order; no denominators of zero; never judge irrationality from finitely many digits.
- The built-in numeric parser compares exact integer products of safe-integer numerators and denominators; for answers outside that range, use a subject-specific input and grader rather than letting rounded values pass.
- Compose the question beat around its card so the picture it asks about stays visible (in the top 60 % above a `BAND` card, or beside a `{x, y, w, cls: 'side'}` card); `SCREEN` for practice.
- Units in typed answers: write the unit as a word after the box (`{ box: '60' }, ' kilograms'`) so it is not set as a math variable.

## API

```js
quiz(position, [{ id: 'c-mean', prompt: ['Find the mean of ', $m('7, 3, 9'), '.'], build: blanks([...]) }, …], done, 'Quick check')
```

- Positions: `BAND` (bottom band, y 686–886; long content can push it past the stage, so check it), `TOPR` (top right, ≤ 470 high), `RIGHT`, `SCREEN` (full-screen practice; the label names the set in the book's language, such as `'Chapter practice · set 1 of 2'`, and the engine appends "· question k of n" when a quiz has several questions), `SORT_SCREEN`, or any `{x, y, w, cls: 'side'}`.
- `choice(options, right, why, wrongWhys[], onRight?)` — number keys.
- `mcq(id, onRight?)` — (course option, [courses.md](courses.md)) a whole quiz entry (`{id, prompt, build: choice(...)}`) from the chapter's item bank: `quiz(TOPR, [mcq('c-attrib'), mcq('c-cause')], done)`. Needs `items.js` (built by `scripts/items.py`) loaded after `engine.js`; an unknown id throws.
- `blanks(rows)` — rows `{parts: [..., {box: '21'}, ...], why, hint?, fx?, test?}`; accepts −5, 3/4, 2 1/4, 0.75 as exact values, also with a currency sign ($60, 5 €) and thousands grouped by spaces of any kind (1 250, as [authoring.md](authoring.md#content-rules) shows numbers) or, where the decimal sign is a point, by commas (1,250); `{box, lowest: true}` demands lowest terms; `test(values)` judges the whole row (e.g. two factors in either order). `hint` is one message for any wrong value in its row; when different mistakes need their own answers, split the step into rows or ask it as a `choice` with `wrongWhys`. Tab moves between boxes, Enter checks, Esc leaves a box.
- `grid(rows, cols, {multi, text})` — rows `{parts, ans: [keys], why, fx?}`, cols `[[key, label, colour?, hotkey?]]`; with `text: true` parts are rich text (math via `$m`). ↑/↓ change rows.
- `tap(values, right, why, v => wrongWhy, onRight?)` points on the number line; `tapEls(row, idx, right, …)` tokens of a `tokens` row; `pickEls([{el, box: [x,y,w,h], label}], right, …)` any drawn objects; `pickPoint(P, [x,y], why, (x,y) => wrongWhy, onRight?, test?)` grid points (arrows + Enter or click); `sorter(items, trayXY)` drag into the set diagram (keys 1–6). `pickPoint` and `sorter` are in math.js.
- Answer animations run on their own clock: `fx`, `fxp`, `pulseFx`, `shakeFx`, `floatText`, `qlayer()` (a layer cleared with the question). They finish automatically when the beat is left.
- A new type: `build(body, api)` returns `{ reveal, check?, lock?, key?(e), hint? }` and calls `api.grade(ok, message, {right, total})`. `key` handles its shortcuts (return true when used); `hint` lists the keys under the prompt. Every action needs a key; the help overlay (`?`) lists the global ones.
- Scores: `SCORE[id]` keeps the first try across revisits and step jumps; restarting the chapter clears it. A multi-row question scores one per row. A correct retry changes the feedback, not the first-attempt score.
