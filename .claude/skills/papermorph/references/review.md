# Delivery pass

Serve `site/` with `python3 SKILL/scripts/serve.py 8765 site` (no browser caching, so an engine edit is never hidden by a stale file). Use this pass once per chapter: watch, fix what you find, recheck those parts, then deliver for the user's judgement of aesthetics, pacing and teaching. Offer the chapter URL with `?review` added: the user can press N at any moment to leave a note and Shift+N to copy them all for you, each with the `?beat=N&t=S` that opens that frame. Keep the evidence in `books/<book>/review/chNN/`.

## Watch it in motion

```sh
uv run --with playwright --with pillow --with numpy SKILL/scripts/strip.py chNN OUT --url http://localhost:8765/<book>/ push/0.25 law3/0.5@w roll:2..4/0.2@o walk:1..5/0.1@o@c
uv run --with playwright --with pillow SKILL/scripts/playlog.py chNN --out OUT --url http://localhost:8765/<book>/   # picture books: sounds against picture
```

A strip shows one beat at small steps; `@w` adds a motion WebP; `@o` adds an onion skin, the same frames laid over each other in one picture, later ones stronger, so spacing reads at a glance: even gaps are even speed, bunched ghosts are easing in or out, a ghost that jumps is a pop. An onion skin reads only within one shot, so give it that shot's range (`roll:2..4`, ends may be marks); `@c` draws a picture book's frames in the set's own framing, so under a pan a planted foot stays one sharp ghost and a sliding one smears. Look at each action as a viewer would: do actors perform what the narration says, do props stay on the hands, does the camera move with purpose, does each frame still match the storyboard, do arrows, labels and readouts agree with the motion? Then watch a few beats live in Firefox with sound, which is how the user watches. An agent that cannot listen plays the chapter with `playlog.py` instead: it logs when each sound and caption starts in real playback and shows the stage rebuilt by seeking to that beat time, so a clack can be checked against the piece landing and a line against the mouth that says it (a fault that only continuous playback shows will not be in those frames). `--from`/`--to` play only some beats; a lesson stops at its first question.

Watch every beat to its end, question cards included; problems hide in the beats nobody looked at. A strip is a row of still pictures, so it cannot tell you that nothing is moving: a wave drawn once at a fixed phase looks right in every frame and is dead on screen. `uv run --with playwright --with pillow SKILL/scripts/still.py chNN --url …` lists the stretches of each beat where the stage does not change. In a picture book it switches off the kit's hand jitter and flicker first (a scene's own `jit`, falling snow or a tremble, still counts as motion), so a puppet that only breathes and blinks measures about 1–1.5 and acting 2 and up (its default threshold is 1.5). Some holds are right (a moment to read a result); a wave, a ray of light or an actor that stands for something in motion should be moving whenever it is on screen, because the motion is what it explains.

## Static checks first

`python3 SKILL/scripts/lint.py site/<book> chNN` takes a second and needs no browser: a global name that clashes with the engine or a library (which stops the page script), beats without timings or MP3, marks the code waits for that the narration lacks, narration edited since `tts.py` ran, and a malformed `style.json`. Run it after every edit, before the passes below.

## Frames and openings

```sh
uv run --with playwright --with pillow SKILL/scripts/shot.py chNN --url http://localhost:8765/<book>/ --out OUT
uv run --with playwright --with pillow SKILL/scripts/shot.py chNN --url http://localhost:8765/<book>/ --out OUT --cuts   # picture books
uv run --with playwright SKILL/scripts/check_blank.py site/<book> chNN --url http://localhost:8765/<book>/
uv run --with playwright SKILL/scripts/overlap.py chNN --url http://localhost:8765/<book>/
```

`shot.py` captures open/end frames of every beat as 4-up sheets and reports console errors. Look for an empty or unrelated opening, text over drawings or clipped at the edge, a card covering what it asks about, leftovers half faded, geometry contradicting its values, shapes inside circles or curves crossing the outline (check thin geometry on the full-size `chNN_bII_T.png`, not only the sheet), text too small at half size or too much at once, and the same idea in different colours. `--cuts` puts each beat's last frame beside the next one's first, one cut a row: in a picture book, look there for jumps in place, pose, light and screen direction. `check_blank.py` reports openings empty for more than a second after speech starts. `overlap.py` samples every beat and lists where an arrow runs through text or two texts collide, with times, so you can look at exactly those frames. Both are lesson checks and skip a picture book, whose set is always there and whose words are captions.

## Smoothness

`uv run --with playwright SKILL/scripts/perf.py chNN --url …` measures frame times in Firefox, which repaints SVG on the main thread and is the slowest common browser for these pages; headless Chromium hides paint cost. Look at the worst beats and transitions; the remedies are in [engine.md](engine.md#performance-firefox).

## Interaction tests

Adapt `assets/templates/e2e.py` into `tools/<book>/e2e_chNN.py`: it checks playback, that every beat replays the same frame when seeked, that quiz cards stay readable and on stage at two viewport sizes, and walks the answers, practice and finish card. `ANSWERS` maps each question beat to one step per question: a digit picks a choice, `=a,b` fills the boxes, `#2;1+3` answers a grid (rows split by `;`, each row's columns counted from 1, `+` for several, `#2;;1` a row left empty). Run it in Chromium and with `BROWSER=firefox`. Run existing tests of approved chapters after changing the book's engine or library.

After scoring changes, check a wrong first try stays recorded after revisiting and a restart clears it; after progress changes, check book isolation and missing or malformed stored data. Fix engine bugs at the engine source and copy them to the books with `scripts/engine.py`; book-specific settings stay in each book's `lib/book.css`.

Test details: keyboard first (Enter checks, Esc leaves a box, press Esc before S, R replays on the finish card); a page opened with `?beat=` is not started, so start it before pressing keys; `seek(i, false)` stops before the old panel's fade, so seek playing or evaluate past it; compare text in lower case (CSS uppercases kickers); avoid assertions on totals that grow with the book.
