# Paper puppets and the stop-motion look

The actors of a picture book are paper puppets drawn in code: pieces of coloured paper pinned at the joints, moved a little each frame, like a cut-out film shot by hand. Because a pose is only a set of numbers, any action the story needs (ducking, swinging an axe, diving through a window, shoving a thought bubble) costs a few lines, never a new drawing, and a puppet looks the same in every shot. The kit is in `assets/templates/picture-book/` (`paper.js`, `cast.js`, `shared.js`, `chapter.html`); copy it into `site/<book>/lib/` and the episode folder.

Two cast styles are on the shelf, both from the same kit: jointed storybook figures seen mostly in profile (*Little Red Riding Hood*: the wolf, Grandma, the woodcutter) and round-headed figures that face us, in the spirit of South Park (*Joke Collection*). Pick with the user; the second is quicker to build and to act with.

## What makes it read as stop motion

- **Twelve frames a second, on twos.** `stopClock` samples every movement into steps; the slight jerk is the style, not a defect. Big moves still ease in and out across those steps.
- **The animator's hand.** Each frame nudges every puppet by a tiny random amount (`jit(frame, k)`, the same nudge for the same frame, so pause, seek and `?beat=N&t=S` show exactly what playback shows), and the picture flickers faintly. Keep it small: at full strength it read as shaking ("抖动有点太剧烈", the user said); a third of a pixel-ish wobble, held for two frames, felt hand-made.
- **Paper you can feel.** Grain, torn edges and a soft drop shadow on every piece (the `#paper` filter), brass pins at the joints, and a soft contact shadow under the feet so a puppet stands on the ground, leaning the way the set's light falls.
- **Replacement, not morphing.** Mouths are swapped shapes timed to the words; a blink is two closed frames; a door opens through a few boards of different widths; a bun bitten is a different picture.

## Acting

- **Nobody freezes.** Whoever speaks lip-syncs; everyone blinks at their own moments, never in unison; listeners' eyes follow the speaker; reactions get a small head turn or a lid drop. A crowd glances about on its own and turns as one only when something happens (a staggered snap, a frame or two apart).
- **Turning round is a whole-body swap.** A puppet has a complete side set and a complete front set. A turn squashes the side view, swaps to the whole front figure for the narrowest frames and comes out mirrored. A front head on a side body looked wrong every time.
- **Feet don't slide.** Walks use a compass step (`walk()`): the planted foot stays put while the hip swings over it; distance is scale. Runs are on twos with a bigger bob.
- **Hands touch what they hold.** A held prop belongs to the hand's piece; when something is handed over, both hands meet it.
- **Things behind things.** A counter, a cart, a desk row or a lectern sits on its own layer between puppets, so the person behind shows from the chest up (`paperCam(…, { after, stages })` puts puppet layers between set layers).

## Cameras

`paperCam(parent, set, view)` is one camera on one set: layers slide with parallax, `to`/`cut` move it on the scene's clock, `soft` swaps in the blurred copy of the set for close-ups, `shake` jolts it, `show(layer, on)` swaps a layer (rain and snow versions of the same street). Several cameras can live in one scene; cut between places by showing one `cam.root` and hiding the others. Close-ups zoom the same set and blur it, so the speaker stays sharp.

## Performance

Paper filters are expensive live. Every finished piece is baked to a bitmap: sets with `bake_sets.py` (SVG sketches) or `painted.py` (painted pictures), puppet and prop pieces with `bake_puppets.py`, which seeks every episode to its end so each piece is asked for once and writes `img/puppets/<hash>.webp` with `baked.js`. The parts that change every frame (eyes, mouths, brows, fingers) stay live. In a series every episode's pieces share one folder: `bake_puppets.py` adds new pieces and keeps the others, and `--clean` rebakes every episode before replacing them, so leave the folder to it (a hand-written prune once deleted a published episode's pieces; git brought them back). Rebake after changing any piece; a piece missing from `baked.js` is baked in the browser and costs a stall. Full-frame effects that change every frame (the flicker) live outside the SVG so the picture isn't redrawn each frame.

## Seeing your own work

The preview server must not cache (`serve.py`). Look at contact sheets that advance the clock the way playback does (`strip.py chNN OUT scene1/0.5`), at full-size frames at the key moments, at the last frame of each scene beside the first of the next, and play the whole episode through once at speed. Some faults appear only in continuous playback (a camera layer shown once and never hidden again), so don't rely on jumps with `?t=` alone.
