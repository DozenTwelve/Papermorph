# Symbols and diagrams that change

For abstract and procedural ideas (the maths books, `site/elementary-algebra/` and `site/math-notebook/`). The picture explains through change: things are rearranged, split, balanced, counted and compared while the narration says why. The change is the argument, so each move must be one the idea allows.

- **One reading line.** A derivation or a procedure reads in one direction, each step under or beside the last, aligned on what stays the same (the `=` sign, the place values), so the eye never searches for the next step.
- **Arabic books read the page from the right, and their maths from the left.** The stage keeps its left-to-right coordinates in every language ([engine.md](../core/engine.md)), and mathematics reads left to right as in Arabic school books: `3 + 4 = 7`, a number line growing to the right. What is ordered by reading rather than by mathematics starts at the right: a label sits to the right of what it names, a row of steps or pictures begins on the right, a table's first column is the right one. Look at a frame with `strip.py` and read it as an Arabic reader would.
- **Change the thing, don't replace it.** Tokens that combine move together and collapse into the result (`tokens`, `collapse`); a tile pair cancels where it stands; a dot hops along the number line. A fresh line of text is a weaker picture than the old one transforming.
- **Exact where it matters.** Number lines, grids, areas and graphs are to scale; illustrative pictures only need to be clear. Approximations are written as approximations (≈ 4.47…, not = 4.47).
- **Show the common mistake** where one exists (squaring the coefficient too), visibly crossed out, then the right way.
- **Vary the composition with the content.** One centred formula after another feels monotonous; a number line, a table, a picture of the quantity and a worked line each have their own layout.

Storyboard these beats like any other ([scenes.md](scenes.md#storyboard-layout-first-then-motion)). The maths helpers (number lines, tiles, fraction rows, planes, data plots) are in `lib/math.js`, listed in [engine.md](../core/engine.md#drawing).
