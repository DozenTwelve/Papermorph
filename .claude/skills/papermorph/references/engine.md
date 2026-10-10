# The engine (lib/engine.js, lib/engine.css)

A chapter page loads the engine and its `audio/<lang>/timings.js`, defines `CHAPTER` (including `language` when different from `en`), drawing helpers, `BEATS` and questions, then calls `boot()`. The engine provides the stage, drawing, timeline, question types, guide and player. Use the code's signatures if they differ from this reference.

Many helpers are mathematical because the first book was algebra. Use those that fit, implement new ones in the chapter as needed, and share them in the book's engine when another chapter uses them.

## Stage and state

- The stage is SVG, `viewBox 0 0 1600 900`; animated things live in `#scene`. HTML cards go in `#ui`, in the same coordinates.
- Every animated element carries a state object written to the DOM by `render()`: `x y` (translate), `s` (scale), `r` (rotate, degrees), `o` (opacity), `d` (stroke drawn, 0–1), `a_<attr>` (numeric attribute, e.g. `'a_stroke-width'`), `c_<attr>` (hex colour). Give a key a starting value before tweening it; an `a_`/`c_` key without one starts from the element's attribute.
- Scale and rotation are about the element's own origin: draw around (0,0) and place with `x/y`.
- `S` holds objects shared across beats (`S.panel`, `S.line`, …). `reset()` clears it, so anything a later beat needs must be stored on `S`.
- Palette `COL`: `chalk dim faint task good bad board` plus six hues `nat whole int rat irr real`. Fonts: `UI` (text), `MATH` (serif).

## Drawing

| Function | Use |
| --- | --- |
| `G(parent, {x,y,s,r,o})` | group |
| `path(parent, d, attrs, {d:0})` | path; `{d: 0}` makes it ready to be drawn on with `draw()` |
| `T(parent, str, {x,y,size,fill,font,weight,anchor,o})` | text |
| `M(parent, parts, {x,y,size,fill,anchor,o,s})` | math with its baseline at y; parts are strings, `F(n,d)` fractions, `R(x, i)` roots (x may be `F(...)`, i the index), `E(exp)` exponents, `TX(tex)` LaTeX (see [LaTeX](#latex)); returns a group with `_w` (width) |
| `mathW(parts, size)` | width of math without drawing it |
| `frac(p, top, bot, x, y, t0, opts)` | built-up fraction whose top and bottom are math parts |
| `chip(parent, parts, color, {x,y,size})` | pill-shaped token centred on (x,y) |
| `tokens(parent, items, {x,y,size,anchor})` | a row of separately movable math tokens (items: string, parts, or `{t, fill}`); returns the array with `.w .y .size`, each token with `_px` (centre) |
| `collapse(row, i, j, parts, t0)` | box tokens i..j, shrink them into one result, close the gap; returns the new row |
| `eqLine(p, L, R, y, t0, {xEq, sym, note})` | one line of a derivation aligned on its `=` (or `<`, …) with an optional note |
| `mathEl(parts, size)`, `rich([...])`, `$m(...parts)`, `$tex(tex)` | inline math in HTML (cards, prompts) |
| `texPart(el, name)` | the part `\class{name}{…}` of a TeX formula inside `el`, for `tw`/`fx` on `c_color` and `o` |
| `panel(t0)` | fade the current scene group and start a new one; call it at the start of a beat that changes the picture |

Topic helpers already in the engine: number lines (`numberLine`, `X(v)`, `Y0`, `tick`, `dot`, `move`, `landDot`, `brace`, `AXIS`), signed tiles (`tile`, `tiles`, `cancelPairs`), algebra tiles (`atile`, `tileRow`, `cancel`, `popIn`, sizes in `TS`), fraction rows (`fracRow`, `reduce`), a decimal point that hops (`pointRow`), a balance (`balance`), inequality graphs (`ray`, `segment`), a coordinate plane (`plane`: `PX/PY`, `dot`, `walk`, `line`, `arrow`, `stair`, `region`, `half`, `fn` for y = f(x); set `P.layer = panel(0)` so marks clear with the beat), scaled axes (`axes`), dot plots (`dataLine`), chance objects (`die`, `coin`, `spinner`, `outline`), area grids (`areaGrid` with `.cell`, `.ring`; `arc`), rectangles (`rect`, `bracketH`), vertical scales (`vAxis`, `thermometer`), the number-set diagram (`RINGS`, `buildVenn`, `regionAt`). Read the function in engine.js before first use.

## LaTeX

A book whose formulas need more than `M()` parts (indices, sums, matrices, accents) uses the vendored MathJax: copy it when starting the book ([site.md](site.md#start-a-book-folder)) and load `<script src="../lib/mathjax.js"></script>` right after `engine.js` in every chapter.

- `TX('\\frac{a}{b}')` is a part like `F()`: it works in `M`, `tokens`, `chip`, `eqLine` (also as `sym`), `mathEl`, `blanks` and `grid`; `$tex(tex)` puts one in HTML text. 1 em is `size`; the baseline is at `y`.
- Formulas are set in text style, like `$…$`; write `\displaystyle` for large sums and fractions. Words go in `\text{…}` and use the book's math font.
- Mark a part with `\class{name}{…}` and tween it: `tw(texPart(e, 'name'), { c_color: COL.nat }, m('name'))`, or `show`/`hide` it. Parts change colour and opacity only; to move terms, make each one a token in `tokens()`.
- A TeX error or an unknown macro stops the page with the formula in the message. Every MathJax extension is included; turn on an optional one with `\require{physics}`, no network needed.

## Timing

```js
['idea', 'Short title', (m, D) => {
  const p = panel(0);
  draw(path(p, 'M100 600H1500', { stroke: COL.chalk, 'stroke-width': 3 }, { d: 0 }), .2, .8);
  show(T(p, 'a label', { x: 800, y: 560, o: 0 }), m('label', .3));   // .3 s after the word after [[label]] starts
}, { ask: done => quiz(BAND, [/* questions */], done) }],           // optional: a question beat
```

- `m('name', offset)` is the start time of the word after `[[name]]`; `D` is the clip's length. Use marks for actions tied to speech; scene entrances and transitions can use fixed offsets.
- Tweens: `tw(e, to, t0, dur, ease)`, `prog(q => …, t0, dur, ease)` for custom motion (arcs, counters, live redraws), `show`, `hide`, `draw`, `pop`, `pulse`, `stream`. Eases: `io`, `out`, `back`, `lin`.
- A lesson beat ends after its narration and its last tween, then the next starts; an `ask` beat waits for `done()`.
- **Opening lead-in**: if a beat calls `panel()` (before 0.5 s) and nothing appears within 0.8 s, `runBeat` moves the opening group (every tween starting within 1.2 s of the first reveal) to start at 0.4 s. Opt out with `{ lead: false }` in the beat's fourth slot.
- **Seeking replays**: jumping to beat N rebuilds the scene and runs earlier beats instantly. Make `run` deterministic: create objects and schedule tweens through the timeline, with inputs from chapter data and replayed `S` state. Create interactions inside `ask`; use `fx`/`fxp` for answer effects.
- Constants used in a `BEATS` literal are evaluated when it is defined, so define them above `BEATS`. Data used only inside an `ask` closure may sit below.

## Questions

```js
quiz(position, [{ id: 'c-mean', prompt: ['Find the mean of ', $m('7, 3, 9'), '.'], build: blanks([...]) }, …], done, 'Quick check')
```

- Positions: `BAND` (below a number line, y 686–886), `TOPR` (top right, ≤ 470 high), `RIGHT`, `SCREEN` (full-screen practice; label `'Chapter practice   N of M'`), `SORT_SCREEN`, or any `{x, y, w, cls: 'side'}`.
- `choice(options, right, why, wrongWhys[], onRight?)` — number keys.
- `blanks(rows)` — rows `{parts: [..., {box: '21'}, ...], why, hint?, fx?, test?}`; accepts −5, 3/4, 2 1/4, 0.75 as exact values; `{box, lowest: true}` demands lowest terms; `test(values)` judges the whole row (e.g. two factors in either order). Tab moves between boxes, Enter checks, Esc leaves a box.
- `grid(rows, cols, {multi, text})` — rows `{parts, ans: [keys], why, fx?}`, cols `[[key, label, colour?, hotkey?]]`; with `text: true` parts are rich text (math via `$m`). ↑/↓ change rows.
- `tap(values, right, why, v => wrongWhy, onRight?)` points on the number line; `tapEls(row, idx, right, …)` tokens of a `tokens` row; `pickEls([{el, box: [x,y,w,h], label}], right, …)` any drawn objects; `pickPoint(P, [x,y], why, (x,y) => wrongWhy, onRight?, test?)` grid points (arrows + Enter or click); `sorter(items, trayXY)` drag into the set diagram (keys 1–6).
- Answer animations run on their own clock: `fx`, `fxp`, `pulseFx`, `shakeFx`, `floatText`, `qlayer()` (a layer cleared with the question). They are finished automatically when the beat is left.
- A new type: `build(body, api)` returns `{ reveal, check?, lock?, key?(e), hint? }` and calls `api.grade(ok, message, {right, total})`. `key` handles its shortcuts (return true when used); `hint` lists the keys under the prompt. Every action needs a key; the help overlay (`?`) lists the global ones.
- Scores: `SCORE[id]` keeps the first try across revisits and step jumps; restarting the chapter clears it. A multi-row question scores one per row. A correct retry changes the feedback, not the first-attempt score.

## Player

Space play/pause, ←/→ previous/next beat (Shift+←/→ during a question), Home restart, C captions, F full screen, ? help. `seek(i, play)` rebuilds and jumps; `start(i, play)` begins a beat from the current picture. While audio plays, the beat clock follows `audio.currentTime`. `?beat=N&t=S` in the URL opens a frozen frame for review. The finish card's Enter opens `CHAPTER.next`, R replays.

Progress uses the stable legacy key `animebook:progress:<book-path>` (keep it when renaming the project so existing readers retain their progress); the cover template reads the same key. Books served in different folders have separate saved places and completion lists.

Treat saved progress as optional: malformed JSON, `null` or a non-object value starts with empty progress; only an array of positive integer chapter numbers is used for completion. Preserve each existing book's key when applying engine fixes.

Keep `<link rel="expect" href="#bar" blocking="render">` in every chapter's head; without it Chromium may paint before the player exists and cancel the page transition from the contents page.

## Traps

- `M()` italicises 1–2 letter lowercase runs (variables) and runs of capitals, but keeps common short English words upright (by, my, an, if, in, is, of, or, …; capitalised: By, If, In, …). In maths write `b​y`, `m​y`, `a​n`, `B​y` to keep them italic. Units inside `M()` turn italic too: write them as words in `T()` text ("meters"). Never put an English sentence in `M()`.
- Prompts, `grid` text rows and `choice` options are HTML: plain strings render as text, so wrap math in `$m(...)`.
- In a JS string, double each TeX backslash (`'\\frac{a}{b}'`) or use `` String.raw`\frac{a}{b}` ``: `'\text'` is a tab followed by "ext".
- Write a formula wholly in TeX, an `eqLine` sign included (`sym: TX('\\le')`): TeX glyphs are smaller and lighter than `M()` text.
- Prefix chapter-specific helpers when their names might collide with engine globals (`rect`, `popIn`, `eqLine`, `fit`, `slot`, `Y0`, …); a redeclaration stops the page script.
- Drag handling: re-parent (append) the element before `setPointerCapture`; moving a node drops its capture.
- A card whose content is too long for `BAND` should become several `blanks` rows in a wider side card.
- When a question beat is continued early, the engine finishes the beat's pending tweens first; don't rely on half-finished fades.
