# Maths on the stage: math.js, math parts and LaTeX

The engine's drawing API is in [core/engine.md](../core/engine.md); this file is the part only a lesson uses: setting mathematics, the topic helpers in `lib/math.js`, and LaTeX through MathJax.

## Contents

- Loading math.js
- Colours that mean something
- Math parts
- Topic helpers
- LaTeX
- Traps

## Loading math.js

The maths helpers (number lines, tiles, fraction rows, planes, chance objects, the number-set diagram, `pickPoint`, `sorter`) are in `lib/math.js`. A chapter that uses one loads `<script src="../lib/math.js"></script>` right after `engine.js` (it reads the engine's globals as it loads, so never before it and never `async`). `lint.py` names a chapter that uses one without loading it. Use the helpers that fit; draw the rest in the chapter, and move what several chapters use into the book's element library (`lib/<name>.js`, [assets.md](assets.md)) rather than into the engine copy.

## Colours that mean something

Besides its board colours, `COL` has six hues named `nat whole int rat irr real`, after the number sets the first algebra book coloured them by. Give them the book's own meanings in `style.json` `look.meaning` and name them in the chapter (`const FORCE = COL.int`), so the same colour means the same thing across the book ([authoring.md](authoring.md#beats)). The hues stay in JS: a light book picks darker ones in its own `lib/<look>.js` (`Object.assign(COL, { … })`), loaded right after `engine.js` and before `math.js`, which copies the hues as it loads ([core/engine.md](../core/engine.md#stage-and-state) has the board colours).

## Math parts

| Function | Use |
| --- | --- |
| `M(parent, parts, {x,y,size,fill,anchor,o,s})` | math with its baseline at y; parts are strings, `F(n,d)` fractions, `R(x, i)` roots (x may be `F(...)`, i the index), `E(exp)` exponents, `TX(tex)` LaTeX (see [LaTeX](#latex)); returns a group with `_w` (width). The font is `MATH` (serif unless the book's `--math-font` in `lib/book.css` says otherwise) |
| `mathW(parts, size)` | width of math without drawing it (math.js) |
| `frac(p, top, bot, x, y, t0, opts)` | built-up fraction whose top and bottom are math parts (math.js) |
| `chip(parent, parts, color, {x,y,size})` | pill-shaped token centred on (x,y) |
| `tokens(parent, items, {x,y,size,anchor})` | a row of separately movable math tokens (items: string, parts, or `{t, fill}`); returns the array with `.w .y .size`, each token with `_px` (centre) |
| `collapse(row, i, j, parts, t0)` | box tokens i..j, shrink them into one result, close the gap; returns the new row |
| `eqLine(p, L, R, y, t0, {xEq, sym, note})` | one line of a derivation aligned on its `=` (or `<`, …) with an optional note (math.js) |
| `mathEl(parts, size)`, `rich([...])`, `$m(...parts)`, `$tex(tex)` | inline math in HTML (cards, prompts) |
| `h(tag, cls, kids)` | an HTML element for a card (a table, a list): kids are strings, nodes or `rich(...)`; put it in a prompt or a message as it is |
| `texPart(el, name)` | the part `\class{name}{…}` of a TeX formula inside `el`, for `tw`/`fx` on `c_color` and `o` |

## Topic helpers

In `math.js`: number lines (`numberLine`, `move`, `landDot`, `brace`, on the engine's `X(v)`, `Y0`, `tick`, `dot`, `AXIS`), signed tiles (`tile`, `tiles`, `cancelPairs`), algebra tiles (`atile`, `tileRow`, `cancel`, `popIn`, sizes in `TS`), fraction rows (`fracRow`, `reduce`), a decimal point that hops (`pointRow`), a balance (`balance`), inequality graphs (`ray`, `segment`), a coordinate plane (`plane`: `PX/PY`, `dot`, `walk`, `line`, `arrow`, `stair`, `region`, `half`, `fn` for y = f(x); set `P.layer = panel(0)` so marks clear with the beat), scaled axes (`axes`), dot plots (`dataLine`), chance objects (`die`, `coin`, `spinner`, `outline`), area grids (`areaGrid` with `.cell`, `.ring`; `arc`), rectangles (`rect`, `bracketH`), vertical scales (`vAxis`, `thermometer`), the number-set diagram (`RINGS`, `buildVenn`, `regionAt`). Read a function in math.js before first use. A chapter that loads math.js cannot declare its names again (`rect`, `popIn`, `eqLine`, `slot`): prefix the chapter's own helpers ([core/engine.md](../core/engine.md#traps)).

## LaTeX

A book whose formulas need more than `M()` parts (indices, sums, matrices, accents) uses the engine's vendored MathJax. Add it, with its licence, to the book's `lib/`:

```sh
python3 SKILL/scripts/engine.py site/<book> --latex   # lib/mathjax.js; later syncs keep it in step
```

and load `<script src="../lib/mathjax.js"></script>` in every chapter, right after `engine.js` (after `math.js` when the chapter loads it).

- `TX('\\frac{a}{b}')` is a part like `F()`: it works in `M`, `tokens`, `chip`, `eqLine` (also as `sym`), `mathEl`, `blanks` and `grid`; `$tex(tex)` puts one in HTML text. 1 em is `size`; the baseline is at `y`.
- Formulas are set in text style, like `$…$`; write `\displaystyle` for large sums and fractions. Words go in `\text{…}` and use the book's math font.
- Mark a part with `\class{name}{…}` and tween it: `tw(texPart(e, 'name'), { c_color: COL.nat }, m('name'))`, or `show`/`hide` it. Parts change colour and opacity only; to move terms, make each one a token in `tokens()`.
- A TeX error or an unknown macro stops the page with the formula in the message. Every MathJax extension is included; turn on an optional one with `\require{physics}`, no network needed.

## Traps

- `M()` italicises 1–2 letter lowercase runs (variables) and runs of capitals, but keeps common short English words upright (by, my, an, if, in, is, of, or, …; capitalised: By, If, In, …). In maths write `b​y`, `m​y`, `a​n`, `B​y` to keep them italic. Units inside `M()` turn italic too: write them as words in `T()` text ("meters"). Never put an English sentence in `M()`.
- In a JS string, double each TeX backslash (`'\\frac{a}{b}'`) or use `` String.raw`\frac{a}{b}` ``: `'\text'` is a tab followed by "ext".
- Write a formula wholly in TeX, an `eqLine` sign included (`sym: TX('\\le')`): TeX glyphs are smaller and lighter than `M()` text.
