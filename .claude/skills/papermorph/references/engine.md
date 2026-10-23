# The engine (lib/engine.js, lib/engine.css, lib/math.js)

A chapter page loads the engine and its `audio/<lang>/timings.js`, defines `CHAPTER` (including `language` when different from `en`: the audio folder), drawing helpers, `BEATS` and questions, then calls `boot()`. The engine provides the stage, drawing, timeline, question types, guide and player. Use the code's signatures if they differ from this reference. The interface text (buttons, help, cover, finish card) follows `<html lang>`: English, Russian, Chinese and Japanese are in the engine's `TRANSLATIONS`; another language needs a block there.

Every book keeps a copy of the shared engine in `lib/` (`engine.*`, `math.js`, `volume.*`, `contents.*`, `units.*`), so the book runs on its own. The engine is not part of this skill: it lives in the `engine/` folder of the Papermorph repository (or a fork). `python3 SKILL/scripts/engine.py site` copies it into every book from the repository's `engine/` when it is at hand, otherwise from GitHub (`--check` lists copies that differ, `--from DIR|OWNER/REPO@REF` picks the source, by default the latest compatible release, `engine-v2.1`; `@main` takes the newest, a tag or commit pins it, and `engine-v1` is the last engine with the maths helpers inside `engine.js`); a book's copy is not edited by hand. This reference describes `engine-v2.1`; what an older copy lacks is marked *(v2.1)*, and syncing the book brings it. An engine bug is fixed at the source, then synced. The book's own settings and style overrides live in `lib/book.css`, imported by `engine.css` and never overwritten: `--math-font` for numbers and formulas, `--progress-key` when the cover uses a key other than the default.

The maths helpers (number lines, tiles, fraction rows, planes, chance objects, the number-set diagram, `pickPoint`, `sorter`) are in `lib/math.js`. A chapter that uses one loads `<script src="../lib/math.js"></script>` right after `engine.js`: it reads the engine's globals as it loads, so never before it and never `async`. `lint.py` names a chapter that uses one without loading it. Use the helpers that fit; draw the rest in the chapter, and move what several chapters use into the book's element library (`lib/<name>.js`, [assets.md](assets.md)) rather than into the engine copy.

## Stage and state

- The stage is SVG, `viewBox 0 0 1600 900`; animated things live in `#scene`. HTML cards go in `#ui`, in the same coordinates.
- Every animated element carries a state object written to the DOM by `render()`: `x y` (translate), `s` (scale), `r` (rotate, degrees), `o` (opacity), `d` (stroke drawn, 0–1), `a_<attr>` (numeric attribute, e.g. `'a_stroke-width'`), `c_<attr>` (hex colour). Give a key a starting value before tweening it; an `a_`/`c_` key without one starts from the element's attribute.
- Scale and rotation are about the element's own origin: draw around (0,0) and place with `x/y`.
- `S` holds objects shared across beats (`S.panel`, `S.line`, …). `reset()` clears it, so anything a later beat needs must be stored on `S`.
- Palette `COL`: `chalk dim faint task good bad board` plus six hues named `nat whole int rat irr real` (from the algebra book; give them the book's own meanings in `style.json` `look.meaning`, e.g. `const FORCE = COL.…`). Fonts: `UI` (text), `MATH` (serif unless the book's `--math-font` says otherwise).
- **Board colour** *(v2.1)*. The board and ink colours are the palette at the top of `engine.css` (`--page --board --panel --edge --chalk --dim --faint --task --quiz --good --bad`, plus `--on-fill` for text on a coloured button (unset there, so dark) and `--vignette` for the stage's edges, and the shades between them: `--rule --track --track-ask --bar-edge --hover --veil`). A book redefines them in its `lib/book.css` under a plain `:root`; the stage, the cards, the player bar and `COL.chalk … COL.board` all follow, so a light board with dark ink is a few lines of settings (the commented example in `book.css`, shades included). `COL` reads its colours back as `#rrggbb` (colour tweens mix them) and keeps the dark board's own for one that is missing. The six hues stay in JS: a light book picks darker ones in its own `lib/<look>.js` (`Object.assign(COL, { … })`), loaded right after `engine.js` and before `math.js`, which copies the hues as it loads. Check a new palette on a frame with a question card and the captions on (`?beat=N&t=S`), not only on the picture.

## Drawing

| Function | Use |
| --- | --- |
| `G(parent, {x,y,s,r,o})` | group |
| `path(parent, d, attrs, {d:0})` | path; `{d: 0}` makes it ready to be drawn on with `draw()`. A `transform` in `attrs` holds until the state moves the element (`x y s r`), which then owns the transform: to place a shape that also moves, put it in a `G()` |
| `T(parent, str, {x,y,size,fill,font,weight,anchor,o})` | text |
| `cite(parent, key, {str,x,y,size,fill,weight,anchor,o})` | a citation from `REFS` (`../refs.js`, a course option: [courses.md](courses.md)), drawn as an underlined link that opens the source in a new tab and listed on the finish card ([courses.md](courses.md#citations)) |
| `M(parent, parts, {x,y,size,fill,anchor,o,s})` | math with its baseline at y; parts are strings, `F(n,d)` fractions, `R(x, i)` roots (x may be `F(...)`, i the index), `E(exp)` exponents, `TX(tex)` LaTeX (see [LaTeX](#latex)); returns a group with `_w` (width) |
| `mathW(parts, size)` | width of math without drawing it (math.js) |
| `frac(p, top, bot, x, y, t0, opts)` | built-up fraction whose top and bottom are math parts (math.js) |
| `chip(parent, parts, color, {x,y,size})` | pill-shaped token centred on (x,y) |
| `tokens(parent, items, {x,y,size,anchor})` | a row of separately movable math tokens (items: string, parts, or `{t, fill}`); returns the array with `.w .y .size`, each token with `_px` (centre) |
| `collapse(row, i, j, parts, t0)` | box tokens i..j, shrink them into one result, close the gap; returns the new row |
| `eqLine(p, L, R, y, t0, {xEq, sym, note})` | one line of a derivation aligned on its `=` (or `<`, …) with an optional note (math.js) |
| `mathEl(parts, size)`, `rich([...])`, `$m(...parts)`, `$tex(tex)` | inline math in HTML (cards, prompts) |
| `h(tag, cls, kids)` | an HTML element for a card (a table, a list): kids are strings, nodes or `rich(...)`; put it in a prompt or a message as it is |
| `texPart(el, name)` | the part `\class{name}{…}` of a TeX formula inside `el`, for `tw`/`fx` on `c_color` and `o` |
| `panel(t0)` | fade the current scene group and start a new one; call it at the start of a beat that changes the picture |

Topic helpers in `math.js`: number lines (`numberLine`, `move`, `landDot`, `brace`, on the engine's `X(v)`, `Y0`, `tick`, `dot`, `AXIS`), signed tiles (`tile`, `tiles`, `cancelPairs`), algebra tiles (`atile`, `tileRow`, `cancel`, `popIn`, sizes in `TS`), fraction rows (`fracRow`, `reduce`), a decimal point that hops (`pointRow`), a balance (`balance`), inequality graphs (`ray`, `segment`), a coordinate plane (`plane`: `PX/PY`, `dot`, `walk`, `line`, `arrow`, `stair`, `region`, `half`, `fn` for y = f(x); set `P.layer = panel(0)` so marks clear with the beat), scaled axes (`axes`), dot plots (`dataLine`), chance objects (`die`, `coin`, `spinner`, `outline`), area grids (`areaGrid` with `.cell`, `.ring`; `arc`), rectangles (`rect`, `bracketH`), vertical scales (`vAxis`, `thermometer`), the number-set diagram (`RINGS`, `buildVenn`, `regionAt`). Read the function in math.js before first use.

## LaTeX

A book whose formulas need more than `M()` parts (indices, sums, matrices, accents) uses the engine's vendored MathJax: add it with `engine.py <book> --latex` ([site.md](site.md#start-a-book-folder)) and load `<script src="../lib/mathjax.js"></script>` right after `engine.js` (after `math.js` when the chapter loads it) in every chapter.

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
- Tweens: `tw(e, to, t0, dur, ease)`, `prog(q => …, t0, dur, ease)` for custom motion (arcs, counters, live redraws), `show(e, t0, dur, ease)`, `hide`, `draw` (same arguments), `pop`, `pulse`, `stream`. Eases: `io`, `out`, `back`, `lin`, `soft`. Continuous motion and cameras: see below.
- A lesson beat ends after its narration and its last tween, and holds that picture `HOLD` (0.6 s) before the next starts; an `ask` beat waits for `done()`.
- **Opening lead-in**: if a beat calls `panel()` (before 0.5 s) and no element is revealed (faded, scaled or drawn in from nothing) within 0.8 s, `runBeat` moves the opening group (every tween starting within 1.2 s of the first reveal) to start at 0.4 s, so the narration never runs over an empty board. It looks only at reveals: a beat that lays out part of its picture visible at once (axes, empty boxes, a set) and reveals the rest on later words still has that first group pulled to 0.4 s. When those words matter, give the beat `{ lead: false }` in its fourth slot; a camera that shows a picture from the first frame is the same case. To see where a beat's reveals land, put marks on a contact sheet: `strip.py chNN OUT idea:0.4,label,label+0.3,end --sheet storyboard --url http://localhost:8765/<book>/` (a mark plus an offset is the moment the action is timed to).
- **`pre`** in the fourth slot (`{ pre: 1.2 }`) runs the picture that many seconds before the narration starts: an action, then the line. Picture books use it on every scene.
- **The end of a film**: a chapter whose last beat asks nothing (a picture book) is finished when that beat ends: it is marked done and, with `CHAPTER.next`, offers the next chapter (Enter).
- **Seeking replays**: jumping to beat N rebuilds the scene and runs earlier beats instantly. Make `run` deterministic: create objects and schedule tweens through the timeline, with inputs from chapter data and replayed `S` state. Create interactions inside `ask`; use `fx`/`fxp` for answer effects.
- Constants used in a `BEATS` literal are evaluated when it is defined, so define them above `BEATS`. Data used only inside an `ask` closure may sit below.

## World clock and camera

For continuous motion (vehicles, orbits, rolling, scrolling scenery) and camera work. Everything is a pure function of the beat time, so pause, seek and `?beat=N&t=S` show the same frame.

- `clockRun(f, D)` calls `f(t)` on every frame of the beat, `t` in seconds from its start (0..D); the beat's hold after `D` shows `f(D)`. With `clockRun(f, D, { tail: true })` *(v2.1; an older engine ignores `tail`, so the hold stands still)* it keeps calling `f` through the hold, `t` up to the beat's end (`P.end`: the later of the narration and the last tween, plus `HOLD`): use it where motion must never freeze (a film, whose next scene cuts in), and let `f` pose sensibly past `D`. A camera in a beat with a tailed `clockRun` runs on to `P.end` too, so a follow shot keeps up. Write positions as functions of `t` (`x = x0 + v * t`) and share them between objects and the camera; never accumulate per-frame state.
- `const cam = camera(parent, D, { x, y, z, r, box, bg })` makes a view onto a world group. Draw in `cam.world` in world coordinates. The view `{x, y}` is the world point shown at the centre, `z` the zoom (screen px per world px), `r` the roll in degrees. Defaults: full stage, `(800, 450)`, `z` 1 (identity, so stage coordinates still work). With `box: [x, y, w, h]` the camera draws in a framed, clipped box with background `bg` (split screen, picture-in-picture); its default zoom fits the 1600 × 900 world into the box. `cam.el` is the camera's group (fade, pop or hide it; it scales about the box centre).
- Moves, all on the beat clock: `cam.to({x, y, z, r}, t0, dur = 1, ease = soft)` blends only the keys given, from wherever the camera is at `t0`; `cam.cut(view, t0)` is a hard cut (`dur` 0); `cam.shake(amp, t0, dur, hz = 7)` is a subtle, repeatable shake (fades in and out over 0.3 s). Any key may be a function of `t`: that is a follow shot (`cam.to({ x: t => carX(t) }, 2, 1.5)` locks on over 1.5 s; `r: t => spin(t)` rolls with a rotating object). Zoom changes evenly (log scale) and keeps one world point fixed when start and end allow it.
- Parallax: `cam.layer(k, wrap)` returns a group inside the world that moves at `k` × the camera's pan (`k` < 1 far, > 1 near; zoom and roll are not scaled per layer). With `wrap = W` the layer's content repeats every `W` world px: draw one period plus the widest view, and the camera can pan any distance. Keep repeating details (dashes, tiles, trees) on a period that divides `W`, and move followed objects by multiples of `W` when they loop, so the loop is invisible.
- `cam.at(t)` returns the view at `t`; `cam.screen(wx, wy, t)` the screen position of a world point (no shake), for screen-space labels that track an object. `cam.track(label, wx, wy, t)` does that for a text label drawn outside the camera: it follows the point, stays inside the frame (or box), and fades out once the point leaves; fade it in through a wrapper group. Keep tracked labels in the safe frame this way rather than letting them clip at the edge.
- Split screen or picture-in-picture: two cameras with boxes, each with its own copy of the world built by the same function and driven by the same clock functions. Cross-fade between shots by fading one camera's `el` out and another's in.
- Labels drawn in the world scale with the zoom; put text that must stay readable in screen space (the panel) or give world labels a size for the shot's zoom.
- Ease `soft` (cosine in-out) suits camera moves; `io`, `out`, `back`, `lin` or any `p => …` work too.

## Performance (Firefox)

Firefox repaints SVG on the main thread and is the slowest common browser for these pages. Measure in Playwright Firefox as well as Chromium: rAF frame times at beat transitions and during camera moves. Headless Chromium hides paint cost.

- Never put an SVG filter behind animated content (the stage grain is a static CSS texture for this reason). Avoid clip-paths on moving or zooming groups where a box or an image does the job.
- Large shapes under a big camera zoom or roll are expensive: a filled `<circle>` scaled 6× and rotating cost about 200 ms a frame in Firefox, while the same picture as one `<image>` cost about 3 ms. Prefer one image for a big detailed object (a planet, a map), and few elements over many small ones (merge cells into one path per colour, or use an image).
- Write per-frame attributes and text only when they change (`render()` already skips unchanged transform and opacity). Old panels are set to `display: none` after their fade.
- Pixel-art sprites: draw `<image>` with `style="image-rendering: pixelated"` at an integer scale, and pre-scale the file (nearest neighbour) so it stays crisp where the style is ignored.
- Cross-fading two full-screen cameras costs a long frame: fade only the incoming one in over the outgoing one, then hide the old.
- A question card's entrance after a busy scene can hitch; measure it with `perf.py`.

## Questions

```js
quiz(position, [{ id: 'c-mean', prompt: ['Find the mean of ', $m('7, 3, 9'), '.'], build: blanks([...]) }, …], done, 'Quick check')
```

- Positions: `BAND` (bottom band, y 686–886; long content can push it past the stage, so check it), `TOPR` (top right, ≤ 470 high), `RIGHT`, `SCREEN` (full-screen practice; the label names the set in the book's language, and the engine appends k of n when a quiz has several questions), `SORT_SCREEN`, or any `{x, y, w, cls: 'side'}`.
- `choice(options, right, why, wrongWhys[], onRight?)` — number keys.
- `mcq(id, onRight?)` — (course option, [courses.md](courses.md)) a whole quiz entry (`{id, prompt, build: choice(...)}`) from the chapter's item bank: `quiz(TOPR, [mcq('c-attrib'), mcq('c-cause')], done)`. Needs `items.js` (built by `scripts/items.py`) loaded after `engine.js`; an unknown id throws.
- `blanks(rows)` — rows `{parts: [..., {box: '21'}, ...], why, hint?, fx?, test?}`; accepts −5, 3/4, 2 1/4, 0.75 as exact values and, *(v2.1)*, with a currency sign ($60, 5 €) and thousands grouped by spaces of any kind (1 250, as [authoring.md](authoring.md) shows numbers) or, where the decimal sign is a point, by commas (1,250); `{box, lowest: true}` demands lowest terms; `test(values)` judges the whole row (e.g. two factors in either order). `hint` is one message for any wrong value in its row; when different mistakes need their own answers, split the step into rows or ask it as a `choice` with `wrongWhys`. Tab moves between boxes, Enter checks, Esc leaves a box.
- `grid(rows, cols, {multi, text})` — rows `{parts, ans: [keys], why, fx?}`, cols `[[key, label, colour?, hotkey?]]`; with `text: true` parts are rich text (math via `$m`). ↑/↓ change rows.
- `tap(values, right, why, v => wrongWhy, onRight?)` points on the number line; `tapEls(row, idx, right, …)` tokens of a `tokens` row; `pickEls([{el, box: [x,y,w,h], label}], right, …)` any drawn objects; `pickPoint(P, [x,y], why, (x,y) => wrongWhy, onRight?, test?)` grid points (arrows + Enter or click); `sorter(items, trayXY)` drag into the set diagram (keys 1–6). `pickPoint` and `sorter` are in math.js.
- Answer animations run on their own clock: `fx`, `fxp`, `pulseFx`, `shakeFx`, `floatText`, `qlayer()` (a layer cleared with the question). They are finished automatically when the beat is left.
- A new type: `build(body, api)` returns `{ reveal, check?, lock?, key?(e), hint? }` and calls `api.grade(ok, message, {right, total})`. `key` handles its shortcuts (return true when used); `hint` lists the keys under the prompt. Every action needs a key; the help overlay (`?`) lists the global ones.
- Scores: `SCORE[id]` keeps the first try across revisits and step jumps; restarting the chapter clears it. A multi-row question scores one per row. A correct retry changes the feedback, not the first-attempt score.

## Player

Space play/pause, and once the chapter has ended replay *(v2.1)*, ←/→ previous/next beat (Shift+←/→ during a question), Home restart, C captions (a question's narration is captioned too, above its band or beside its corner card, until the narration ends), `<`/`>` speed (0.75–1.5×, remembered), volume (remembered, except muted), F full screen, ? help. Clicking a step segment jumps to that point of the beat (`seekInto(i, frac)`); the next beat's clip preloads while one plays. `seek(i, play)` rebuilds and jumps; `start(i, play)` begins a beat from the current picture. While audio plays, the beat clock follows `audio.currentTime`. `?beat=N&t=S` in the URL opens a frozen frame for review, without captions (N is kept within the chapter's steps); on a question step the answer box takes focus only once Space starts the lesson. With `?review` in the URL, N pauses and asks for a note on the current moment and Shift+N copies the chapter's notes, one line each with the `?beat=N&t=S` that reopens it, so a reviewer can collect notes while watching and hand them over at once. After the end, on the finish card or a film's last frame, Enter opens `CHAPTER.next` (replays when there is none) and R replays.

Progress is saved under `animebook:progress:<book-path>`; the cover and a picture book's series page read the same key. A book can set another key with `--progress-key` in `lib/book.css`; its cover must then read that key. Books served in different folders have separate saved places and completion lists.

Treat saved progress as optional: malformed JSON, `null` or a non-object value starts with empty progress; only an array of positive integer chapter numbers is used for completion.

Keep `<link rel="expect" href="#bar" blocking="render">` in every chapter's head; without it Chromium may paint before the player exists and cancel the page transition from the contents page.

## Traps

- `M()` italicises 1–2 letter lowercase runs (variables) and runs of capitals, but keeps common short English words upright (by, my, an, if, in, is, of, or, …; capitalised: By, If, In, …). In maths write `b​y`, `m​y`, `a​n`, `B​y` to keep them italic. Units inside `M()` turn italic too: write them as words in `T()` text ("meters"). Never put an English sentence in `M()`.
- Prompts, feedback, `grid` text rows and `choice` options are rich text in HTML cards: a string is shown as written (`<` is a character, never markup, so `3 < 5` is safe), math goes in `$m(...)`, and anything richer (a table) is an element made with `h()` and passed as a part.
- `st(e)` is the element's live state, not a copy: a helper that keeps `const s = st(e)`, then `put()`s the element off stage and tweens back to `s.x` tweens to the moved position, and the slide-in never returns. Copy the numbers first (`const { x, y } = st(e)`).
- A `prog` or `clockRun` that redraws only when a key changes (a 12 fps frame number, a step index) must draw from the key's own value (`f / FPS`), not the exact `t` that crossed it: playing, seeking and `?beat=N&t=S` reach the same key at different `t`, and must show the same picture.
- In a JS string, double each TeX backslash (`'\\frac{a}{b}'`) or use `` String.raw`\frac{a}{b}` ``: `'\text'` is a tab followed by "ext".
- Write a formula wholly in TeX, an `eqLine` sign included (`sym: TX('\\le')`): TeX glyphs are smaller and lighter than `M()` text.
- Prefix chapter-specific helpers when their names might collide with engine globals (`rect`, `popIn`, `eqLine`, `slot` from math.js when the chapter loads it; `fit`, `Y0`, `OV`, `HOLD`, `camera`, `soft`, `clockRun`, `retire`, `seeking`, `BOOK`, `bookSetting`, `TX`, `texPart`, …); a redeclaration stops the page script. `lint.py` lists every clash.
- Drag handling: re-parent (append) the element before `setPointerCapture`; moving a node drops its capture.
- A card whose content is too long for `BAND` should become several `blanks` rows in a wider side card.
- When a question beat is continued early, the engine finishes the beat's pending tweens first; don't rely on half-finished fades.
