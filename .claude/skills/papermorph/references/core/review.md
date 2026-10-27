# Seeing your own work, and review rounds

Watch your output in motion and judge it as a viewer would, against the storyboard and the approved chapters; fix what you find, recheck those parts, then deliver for the user's judgement. Serve `site/` with `serve.py` ([core/publish.md](publish.md#local-preview-and-delivery)) and keep the evidence in `books/<book>/review/chNN/`. Each tier adds its own checks: [lessons](../lessons/checks.md), [picture books](../picture-books/stories.md#review-rounds), [films](../films/films.md#review-rounds).

## Contents

- Static checks first
- Watch it in motion
- Frames
- Smoothness
- Review rounds
- The user's notes

## Static checks first

`python3 SKILL/scripts/lint.py site/<book> chNN` takes a second and needs no browser. It finds a global name that clashes with the engine or a library (which stops the page script), beats without timings or MP3, marks the code waits for that the narration lacks, narration edited since `tts.py` ran, and a malformed `style.json`. Run it after every edit. `uv run --with playwright SKILL/scripts/check.py chNN --url …` then opens every beat in Chromium and Firefox and reports page errors, console warnings and each beat's length against its voice (a tween running past the voice lengthens a beat silently).

## Watch it in motion

```sh
uv run --with playwright --with pillow --with numpy SKILL/scripts/strip.py chNN OUT --url http://localhost:8765/<book>/ push/0.25 law3/0.5@w roll:2..4/0.2@o walk:1..5/0.1@o@c
uv run --with playwright --with pillow SKILL/scripts/playlog.py chNN --out OUT --url http://localhost:8765/<book>/
```

- A strip shows one beat at small steps; a sheet of strips is the contact sheet every review works from. `@w` adds a motion WebP; `@o` adds an onion skin, the frames laid over each other with later ones stronger, so spacing reads at a glance: even gaps are even speed, bunched ghosts are easing, a ghost that jumps is a pop. An onion skin reads only within one shot, so give it that shot's range (`roll:2..4`, ends may be marks); `@c` draws a picture book's frames in the set's own framing, so under a pan a planted foot stays one sharp ghost and a sliding one smears.
- Look at each action as a viewer would: does the picture do what the narration says while it is said, does the thing named appear, do props stay in hands, does the camera move with purpose, do labels and numbers agree with the motion? The worst defects in the first films were pictures that contradicted the narration, and they show on a contact sheet at once.
- Watch every beat to its end; problems hide in the beats nobody looked at.
- A strip cannot show that nothing moves: a wave drawn once at a fixed phase looks right in every frame and is dead on screen. `uv run --with playwright --with pillow SKILL/scripts/still.py chNN --url …` lists the stretches of each beat where the stage does not change (in a picture book it first switches off the kit's hand jitter and flicker, so a puppet that only breathes and blinks measures about 1–1.5 and acting 2 and up; the default threshold is 1.5). Some holds are right (a moment to read a result); something that stands for motion should move whenever it is on screen.
- Then watch a few beats live in Firefox with sound, as the user does. An agent that cannot listen runs `playlog.py`: it logs when each sound and caption starts in real playback and shows the stage rebuilt at that moment, so a clack can be checked against the piece landing and a line against the mouth that says it. `--from`/`--to` play only some beats; a lesson stops at its first question.

## Frames

```sh
uv run --with playwright --with pillow SKILL/scripts/shot.py chNN --url http://localhost:8765/<book>/ --out OUT [--cuts] [--clean]
```

`shot.py` captures the open and end frames of every beat as 4-up sheets and reports console errors; full-size `chNN_bII_T.png` files show thin geometry the sheet hides. Look for an empty or unrelated opening, text over drawings or clipped at the edge, a card covering what it asks about, half-faded leftovers, text too small at half size or too much at once, and the same idea in different colours. `--cuts` puts each beat's last frame beside the next one's first, one cut a row: look there for jumps in place, pose, light and screen direction. `--clean` gives the stage alone, without the player.

## Smoothness

`uv run --with playwright SKILL/scripts/perf.py chNN --url …` measures frame times in Firefox, the slowest common browser for these pages (headless Chromium hides paint cost). Look at the worst beats and transitions; the reasons and remedies are in [core/engine.md](engine.md#performance-firefox). Under load the machine is measured, not the page: with six workers exporting, a 16.7 ms beat read 48 to 109 ms. `perf.py` prints the load average and warns above the core count, and `--ref CH:BEAT[@T]` times a known moment in the same run to read a number against. The frame time that decides is taken on a quiet machine.

## Review rounds

After the first cut, before the user watches, an independent director pass: a fresh agent on a strong model, report-only, given contact sheets of every beat and the approved chapters or reference film, knowing nothing of how the beats were built.

- **Reports** are ranked: chapter or scene, beat-clock time, what is wrong as a viewer sees it, a concrete fix. Earlier good reports serve as examples. About half of what a director finds is usually the picture saying something other than the voice.
- **A second round on the exported video** (`export.py`, then the director watches the MP4's frames) finds what the sheets hide; on the shorts it found the most.
- **Check what a director measured** before sending it back as work, and after the fixes look at the new frames yourself: one such look still found a wrong date and a dead frame.
- **Merging**: the coordinator turns the reports into one rework list, taking the director's side where reviewers disagree, and sends the parts back to the workers who made them.
- **Closing**: the next round starts by checking which findings were fixed; a last read-only pass counts them as fixed, partly fixed, not fixed or worse. Two or three rounds made the best episodes. Show the user each fix on a contact sheet as it is made, so a round is quick to check.

The rounds come before the user watches; what the user says then still decides.

## The user's notes

Deliver the chapter URL with `?review` added: the user can press N at any moment to leave a note and Shift+N to copy them all for you, each with the `?beat=N&t=S` that opens that frame.
