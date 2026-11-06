# Figures the reader moves

Some lessons are about how two things depend on each other: the numbers of an equation and its line, a matrix and what it does to the plane, the coefficients of three equations and where their planes cross. Watching it explained is half of it; the other half is the reader taking hold of one and seeing the other follow. A figure the reader moves is one drawing with one state behind it, shown in several linked forms, which the beat moves while the narration explains and which the reader moves with their own hands when a question or a playground hands it over.

*Linear Algebra* (after MIT OCW 18.06, 40 chapters) is the reference: the [book](https://papermorph.diamonddoge.org/linear-algebra/) uses them in most chapters, and its library is served with it, so every file named below can be read at `https://papermorph.diamonddoge.org/linear-algebra/lib/<file>` and every chapter at `…/linear-algebra/chNN/`. These are that book's components, not a kit: a new book writes its own for its own subject (in its `lib/`, as [assets.md](assets.md) describes), with the shape below.

## When a lesson wants one

- The idea is a relationship, and changing one side to see the other is how it is learned: slide a right-hand side and its line slides, the meeting point sliding along the other line (*Linear Algebra* ch02). A single fact, or a picture that only needs looking at, wants an ordinary beat.
- The question's answer is a state of the figure: "make the lines meet at (2, −1), changing only the right sides". Graded by testing the state, it accepts every way of getting there, the drag and the typed number alike.
- The reader will come back to it: a playground beat at the chapter's end, with no score, lets them try what the chapter showed.

Build it when the second chapter needs it, not before: *Linear Algebra*'s `linsys.js` (the 2 × 2 system), `grid2.js` (a 2 × 2 matrix moving the plane), `vecs.js` (vectors and their combinations) and `space3.js` (3D space and the 3 × 3 system, tried out first on a silent page, `sandbox3/`) each grew from one chapter and then served many.

## Its shape

One state object and several drawings of it. In `linsys.js` (header, lines 1–7) the state is six numbers, `v = { a00, a01, a10, a11, b0, b1 }`; the equations, the matrix form and the plane are all drawn from it by one `draw()`, so they can never disagree. Every change, whether from the beat, the reader's drag or a typed key, goes through one function (`edit`, published as `set`) that changes `v` and redraws. Each such component returns the same handful of methods, and the book's questions and playground work with any of them:

| Method | What it does | In `linsys.js` |
|---|---|---|
| `v` | the state | returned at line 365 |
| `to(values, at, dur, ease)` | move the state on the beat clock (a `prog` tween, [core/engine.md](../core/engine.md)) | line 369 |
| `set(values)` | change it at once: the reader's action, an answer shown, a question's start | line 418 |
| `live(on, { only })` | hand it to the reader, or take it back; `only` names the numbers they may change | line 404 |
| `onChange(f)` | call f after every change (a readout elsewhere, a trail) | after `set` |

The book's `play.js` (line 4) says it in one line: a playground works with any component that has `.live(on)`, `.v` and `.set(values)`.

## Inside a beat

A beat builds the figure in its `run`, keeps a handle in `S` for its `ask`, and moves it on narration marks. *Linear Algebra* ch02, beat `slide` (around line 370 of `ch02/index.html`) moves a right-hand side while the narration says so, with a dotted trail of the meeting point:

```js
const sys = S.sys = twoLines(p, [[2, -1], [-1, 2]], [0, 3], { t0: m('sys') - .3 });   // the chapter's wrapper of linsys()
sys.focus(1, m('b1'));                                                               // the second row forward, the first dimmed
const t1 = sys.to({ b1: 6 }, m('b1') + .3, 2.2, io, { trail: true });               // b1 from 3 to 6 on the mark 'b1'
```

The figure is the narration's picture while the beat plays: nothing on it responds to the pointer, so a stray click cannot change what the voice is describing.

## Inside a question

The next beat, `q3` (line 441), builds the same figure and hands it over in its `ask`. `lsTask` (`linsys.js` line 429) turns the figure into a question type for `quiz` ([questions.md](questions.md): a new type's `build(body, api)`): it calls `sys.live(true, { only })`, and returns `check` (test the state, `api.grade`), `reveal` (set the answer), `lock` (`sys.live(false)`, which the engine calls once the question is answered or shown) and `hint` (the keys, listed under the prompt):

```js
['q3', 'Your turn', () => {
  const p = panel(0);
  S.sys = twoLines(p, [[2, -1], [-1, 2]], [0, 3], { readout: false });
}, { ask: done => quiz(CARD, [{
  id: 'c-meet', prompt: ['Make the lines meet at ', $m('(2, −1)'), '. Change only the right sides: drag them sideways, or drag a line.'],
  build: lsTask(S.sys, (v, s) => near(s, 2, -1), 'Right: …', 'Put x = 2 and y = −1 into each left side: …',
    () => S.sys.set({ b0: 5, b1: -4 }), { only: ['b0', 'b1'], trail: true }),
}], done) }],
```

`only` matters: a question about right-hand sides that left the reader free to turn the lines would accept an answer that taught nothing. The card sits beside the figure (`CARD`, `cls: 'side'`), never over it. A playground (`playAsk` in `play.js`, line 15) hands over everything instead, with a pen to draw on the board, *Reset numbers* (back to the state the beat built) and *Continue*; it grades nothing.

## State that must reset

The engine replays: a seek or a step back rebuilds the beat from its `run` and runs earlier beats instantly ([core/engine.md](../core/engine.md#traps)). A figure stays right through that when:

- **It is built in `run`, from fixed values.** The reader's changes live in the component that `run` made, and the next start of the beat makes a new one from the same values, so stepping back to a question starts it fresh. Never write a reader's change into anything `run` reads (an `S` value used to build the figure, a global).
- **The beat moves it only with `to()`**, a tween on the beat clock: playing, seeking and `?beat=N&t=S` give the same frame. A figure that animates on its own timer or `requestAnimationFrame` loop shows something different after a seek.
- **The reader's own view is kept apart from the beat's.** `space3.js` lets the reader turn the 3D view while a question is live or the lesson is paused (lines 357–380); the turn is an offset of its own that the beat's camera never touches, and it eases back to zero when play goes on, so a narration that says "look along x" still sees along x.
- **It is handed over only in the `ask`**, and taken back by `lock`, so a replayed beat never starts live. A handler that acts later (a timer, an animation end) compares `P.gen`, which every start of a beat changes, as `play.js` does (lines 25 and 59).

## Hands, fingers and keys

- **Every action has a key** ([questions.md](questions.md)). In `linsys.js` the numbers get `tabindex` only while live (`live`, line 404); ↑/↓ change the focused one and Enter checks, and its key handler (line 82) stops the event, so the player's ←/→ do not leave the beat. In `space3.js` the view itself is focusable (line 383) and the arrow keys turn it. The `hint` lists the keys under the prompt.
- **A drag on a phone must not scroll the page.** Set `touch-action: none` on what the reader can drag, and only while it is live: `vecs.js` does it for its numbers (line 400, "a finger scrubs the number instead of scrolling the page") and its arrow tips (line 410). Use pointer events with `setPointerCapture`, as `linsys.js` does (lines 68 and 244), so a finger that leaves the hit box keeps dragging.
- **Hit boxes larger than what they show**: a transparent rect around a number, a 24-unit circle under a 10-unit knob (`linsys.js` line 241). On a phone the 1600-wide stage is drawn at a quarter of its size or less, so check what a box measures in CSS pixels there (the engine turns a phone's lesson to full screen across the stage; aim for 40 CSS px).
- **A drag is not a click.** The stage takes a click as play or pause; a drag that turned the view swallows its click (`space3.js` line 400), or the paused lesson goes on under the reader's hand.
- **Keep the drag from selecting text** (`userSelect: 'none'` on the figure's holder, `linsys.js` line 17).

## Testing it

The lesson's e2e test ([checks.md](checks.md#interaction-tests), from `assets/templates/e2e.py`) already checks that every beat seeks to the same frame it plays to, which covers `to()`. A figure the reader moves adds, in Chromium and Firefox:

- **The grader**: an answer step that sets the state from the page (`S.sys.set({ b0: 5, b1: -4 })`) and checks it right; one that sets a wrong state and expects the hint for that mistake.
- **The hands, driven as a reader would**: drag a line through a point with the mouse (`page.mouse.down`, `move` in steps, `up`), the stage point turned into screen pixels with the stage's `getScreenCTM()`; focus a number and press ↑ until it reads the target; then check. *Linear Algebra*'s tests do this for chapters 2 and 3 and for 3D (orbiting by drag and by arrow keys, dragging a plane along its normal).
- **The locks**: a number outside `only` ignores keys and drags; leaving the question and coming back starts from the beat's state; after the answer is shown, nothing moves.
- **A phone**: Playwright's mouse sends mouse events even on a touch page, so it cannot show that a finger's drag scrolls the page instead. Check in the page that what is live has `touch-action: none` (`getComputedStyle(el).touchAction`) and what is locked does not, and try one drag on a real phone before the chapter is published.

Look at it too: a strip of the beat that moves it (`strip.py`), and a few shots with the figure in odd states the reader can reach (lines parallel, a point off the grid), where labels collide or a readout says something false.
