# Paper puppets and the stop-motion look

The actors are paper puppets drawn in code: pieces of coloured paper pinned at the joints, moved a little each frame, like a cut-out film shot by hand. A pose is only a set of numbers, so any action the story needs (ducking, swinging an axe, diving through a window, shoving a thought bubble) costs a few lines, never a new drawing, and a puppet looks the same in every shot. The kit is in `assets/templates/picture-book/` (`paper.js`, `cast.js`, `shared.js`, `chapter.html`); `new_book.py picture` copies it into `site/<book>/lib/` and the first episode folder.

Two cast styles are on the shelf, both on `paper.js`: round-headed figures that face us, in the spirit of South Park (*Joke Collection*), built by the kit's `cast.js` (add a character by copying an entry of its `SHAPES`); and jointed storybook figures seen mostly in profile (*Little Red Riding Hood*: the wolf, Grandma, the woodcutter), which a book draws itself, a side and a front set per figure (start from that book's `lib/paper.js` and `lib/cast.js`, under `site/little-red-riding-hood/` in the Papermorph repository). Pick with the user; the first is quicker to build and to act with.

## Contents

- What makes it read as stop motion
- Acting
- Cameras
- Performance
- Seeing your own work

## What makes it read as stop motion

- **Twelve frames a second, on twos.** `stopClock` samples every movement into steps; the slight jerk is the style, not a defect. Big moves still ease in and out across the steps. It draws through the beat's 0.6 s hold after the clip too (`clockRun`'s tail: [core/engine.md](../core/engine.md#world-clock-and-camera)), so a scene's pose functions run to about `D + 0.6` and the frame the next scene cuts from is still alive.
- **The animator's hand.** Each frame nudges every puppet by a tiny random amount (`jit(frame, k)`, the same nudge for the same frame, so pause, seek and `?beat=N&t=S` show exactly what playback shows), and the picture flickers faintly. At full strength it reads as shaking; about a third of a pixel, held for two frames, felt hand-made.
- **Paper you can feel.** Grain, torn edges and a soft drop shadow on every piece (the `#paper` filter), brass pins at the joints, and a soft contact shadow under the feet so a puppet stands on the ground, leaning the way the set's light falls.
- **Replacement, not morphing.** Mouths are swapped shapes timed to the words; a blink is two closed frames; a door opens through a few boards of different widths; a bitten bun is a different picture.

## Acting

- **Nobody freezes.** Whoever speaks lip-syncs; everyone blinks at their own moments, never in unison; listeners' eyes follow the speaker; reactions get a small head turn or a lid drop. A crowd glances about on its own and turns as one only when something happens (a staggered snap, a frame or two apart).
- **Turning round.** A round-headed puppet turns by sliding its face across the head (`look`), as South Park does. A profile puppet turns as a whole-body swap: the side view squashes, the whole front figure shows for the narrowest frames, and it comes out mirrored. A front head on a side body looked wrong every time.
- **Feet don't slide.** A walk keeps the planted foot still while the hip rides over it, and the puppet's x comes from the distance the walk returns (`d`, in the puppet's units, times its scale), never from a separate tween. A profile figure uses the compass step `walk()` (`paper.js`): `d` grows as it goes forward, so one built facing right goes `x0 + d·s` and a mirrored one `x0 − d·s`; its `near`/`far` angles go to the near and far leg as they are. A figure that faces us while crossing the frame side-steps with `spStep()` (`cast.js`): step out, close, both legs leaning outward, `x0 ± d·s` by direction, a step every 2/3 s by default (keep the period a whole number of 1/3 s, so a drawn frame lands on the widest stance and only one foot moves at a time; the template's `scene1.js` walks the kid this way); `walk()`'s angles on a front figure cross the ankles every other step. `spWalk()` is the show's quick shuffle on the spot, for short moves where nobody watches the feet. Runs are on twos with a bigger bob. Check a walk on a strip at 1/12 s: the planted shoe should not move between frames.
- **Hands touch what they hold.** A held prop belongs to the hand's piece (`hold` is the screen-right hand, on `armR`; `holdL` the screen-left one, on `armL`); when something is handed over, both hands meet it. To put a hand on a point, ask the puppet: `aim(pose, 'R', [x, y])` gives the `armR`/`reachR` values for that pose (spread straight into the pose, or tween `arm` and `reach` from rest for a gesture), and `point(pose, 'mouth' | 'chin' | 'capL' | 'capR')` says where that place of the face is in the same pose, so a cup, a scratch or a chin on a hand lands right through a lean, a head tilt or a seat. A held thing hangs from the mitten's centre, so aim at the point less the thing's own offset (a cup's rim above the hand). A hand raised above the chin and in towards the face (a cup at the lips, a hand on the chin, a reach across the head) is drawn in front of the head; an arm raised out to the side (a wave, a cheer) stays behind it, and so does a hand at its own side of the head, so a scratch there wants `armFrontR: true` (or `armFrontL`; `false` keeps a hand behind). `far` above 1.25 means the point is out of reach: lean in, step closer or move the point. Look at a full-size still of the moment the hand arrives.
- **Sitting reads from the knees.** A figure that faces us looks seated only when its thighs come towards us: `sit: H` sits on a seat H units above the feet (up to the shape's `legH − 12`, 34 on the kid; a higher seat counts as that), the lap and knees towards us and the shins down to the ground at the pose's `y`. `sit: true` only hides the legs and the shadow, for a seat whose front comes up to the coat (a desk row). A still beside the standing pose should read sitting without the set.
- **Whatever says where something is follows what is drawn.** A helper a scene asks for a position (`point()`, `aim()`, a board's square, the top of a piece the kit adds) works from the same state the drawing uses this frame, a piece being lifted or carried included, and draw order comes from the pose alone, so a seek to any frame shows what playback showed (compare a playback frame with the same `?beat=N&t=S`).
- **Things behind things.** A counter, a cart, a desk row or a lectern sits on its own layer between puppets, so the person behind shows from the chest up (`paperCam(…, { after, stages })` puts puppet layers between set layers).

## Cameras

`paperCam(parent, set, view)` is one camera on one set: layers slide with parallax, `to`/`cut` move it on the scene's clock, `soft` swaps in the blurred copy of the set for close-ups, `shake(t0, dur, amp = 10)` jolts it (the engine's `cam.shake` takes the amplitude first), `show(layer, on)` swaps a layer (rain and snow versions of the same street). A scene can hold several cameras; cut between places by showing one `cam.root` and hiding the others. Close-ups zoom the same set and blur it, so the speaker stays sharp.

## Performance

Paper filters are expensive live, so every finished piece is baked to a bitmap; only what changes every frame (eyes, mouths, brows, fingers) stays live.

- Sets: `bake_sets.py` (SVG sketches) or `painted.py` (painted pictures).
- Puppet and prop pieces: `bake_puppets.py` seeks every episode to its end, in Chromium and Firefox, so each piece is asked for once, and writes `img/puppets/<hash>.webp` with `baked.js`.
- A series shares one folder for every episode's pieces. `bake_puppets.py` encodes only pieces it has not baked before; `--clean` (after changing the paper filter itself) re-encodes them all and removes only what no episode asks for any more. Leave the folder to it: a hand-written prune once deleted a published episode's pieces.
- Rebake after changing any piece or adding an episode. A piece missing from `baked.js` is baked in the browser and stalls; `shot.py` says how many pieces a chapter still bakes live.
- Full-frame effects that change every frame (the flicker) live outside the SVG, so the picture isn't redrawn each frame.

## Seeing your own work

Use [core/review.md](../core/review.md#watch-it-in-motion)'s tools on an uncached preview (`serve.py`); here, strip times are on the beat clock, so a scene's speech starts at its `pre`, and a joined scene's marks are named `clip.mark` (`strip.py chNN OUT scene1/0.5 --url http://localhost:8765/<book>/`); `scene1:2..5/0.1@o@c` onion-skins one shot with the camera held still, for feet and hands. Look at full-size frames of the key moments (`shot.py`, beats counted from 0 or named), at each scene's last frame beside the next one's first (`shot.py --cuts`), at the sounds against the picture (`playlog.py`), and play the whole episode through once at speed: some faults appear only in continuous playback (a camera layer shown once and never hidden again), not in `?t=` jumps.
