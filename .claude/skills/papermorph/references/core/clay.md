# Clay pictures from Blender

Clay is an optional image method for lessons, picture books and films on the existing engine. Blender photographs a miniature once; the page moves its pieces on the beat clock, with SVG words, arrows and questions over them. Choose it in the style conversation when the subject benefits from tangible objects, soft light and depth. The approved reference is `site/physics-clay/ch09/`; its scene imports this kit, while its physics, layouts and theme stay in that book.

## Start a clay chapter

Run from the folder holding `site/` and `books/`; replace `SKILL` with the installed Skill's absolute folder. Blender is a separate application: `blender --version` should work first. The kit has been rendered with **Blender 5.3.0**, Cycles, Apple M1 Metal. Other versions and GPU backends need a first-shot check, especially AgX looks and Principled BSDF sockets. Blender supplies `bpy`, `bmesh`, `mathutils` and NumPy; ordinary Python with NumPy cannot render a scene.

```sh
python3 SKILL/scripts/new_book.py lesson clay-demo --clay
blender --background --factory-startup --python-exit-code 1 --python books/clay-demo/art/clay/scene.py -- --device auto --samples 48 --draft
```

This creates the tier's normal book, copies `assets/templates/clay/lib/clay.js` into its `lib/`, and puts the worked `scene.py` in `books/clay-demo/art/clay/`. The scene finds the installed scripts through its `KIT` path. If the Skill moves, update that line. For an existing book, copy those same two files, set `KIT`, and pass `--out` and `--site` explicitly unless the scene is at the same `books/<book>/art/clay/` depth.

The example makes a yard plate with a table, tree and hills, a car body sprite, a 24-frame wheel strip and a standing person sprite. Draft writes PNGs and `spec.json` to `books/clay-demo/art/clay/raw/<asset>/` only. Open `yard/000.png`, `car/000.png`, and wheel frames 000, 006, 012 and 018 together: check the light, crop, wheel centre, ground contact and shadow before paying for the final pack. At 48 samples this small example takes roughly a minute or two on the tested M1, with scene construction and the large plate dominating; measure your own first run.

```sh
# Same settings: reuse the inspected draft frames and publish WebPs plus img/clay/clay.js.
blender --background --factory-startup --python-exit-code 1 --python books/clay-demo/art/clay/scene.py -- --device auto --samples 48 --reuse
cp SKILL/assets/templates/clay/example.html site/clay-demo/ch01/clay-example.html
python3 SKILL/scripts/serve.py 8765 site
```

Open `http://localhost:8765/clay-demo/ch01/clay-example.html`. This is a silent seven-second demonstration with the real engine's play, pause and seek controls. Its beat is an example to move into the tier's chapter; the tier's original `index.html` and narration skeleton are still there. Rendering images does not generate narration. Use the tier's normal narration and timing workflow when writing the film.

```sh
uv run --with playwright python3 SKILL/scripts/check_clay.py http://localhost:8765/clay-demo/ch01/clay-example.html --browser firefox
```

The kit consists of `scripts/claykit.py` (geometry, clay, camera, render and pack), `scripts/clayprops.py` (shared props), `scripts/check_clay.py` (browser checks) and `assets/templates/clay/` (scene, loader and example page). Read the scene and the example before replacing their subject; they are executable recipes rather than a new book format.

## Coordinates and the photographed pieces

The camera is orthographic, looking into Blender +y and down by elevation `e` (default 30 degrees). Blender x points right; z points up. `U = 100` page px per Blender unit. Choose `Y0`, the page y of the ground at depth y=0, and a focus depth. `K.px(x, y, z, Y0)` gives:

```text
page x = 100 * x
page y = Y0 - 100 * (z*cos(e) + y*sin(e))
```

For the example's `Y0=600`, Blender origin `(0,0,0)` is page `(0,600)`. At elevation 30 degrees the car wheel centre `(0.76,-0.63,0.27)` is approximately `(76,608.12)`; its radius is 27 page px. A person's feet at `(7,2.2,0)` are `(700,490)`. These are drawing units: a lesson chooses its own px per physical metre independently.

`shot(name, rect, Y0, focus, show=[...])` photographs a page rectangle `(x,y,w,h)`. The manifest keeps its page rectangle, regardless of render density. With `anchor=(ax,ay)`, x/y in the entry become offsets from that anchor; `clImg(p,name,{x:ax,y:ay})` puts it back in exactly that place. A plate has no anchor and keeps absolute page x/y. `K.rect_of(objects,Y0,pad=14,shadow=True,ground=0)` bounds meshes and estimates the directional sun shadow on z=`ground`; choose the actual receiving height for a raised surface. A soft shadow or depth blur may need more padding. `K.union` combines crops over all poses.

Make groups with `K.group(name,*objects)`. Each shot gives those groups roles:

| Role | What the photograph contains |
|---|---|
| `show` | visible objects, their shading and shadows |
| `catch` | a Cycles shadow catcher: the receiving surface becomes transparent except for the object's shadow |
| `unseen` | absent from the camera, but still illuminating, reflecting or shadowing the visible objects |
| `holdout` | cuts its own surface and what lies behind it out of the image, such as water hiding an animal's underwater half |

Groups outside those lists are hidden from rendering. Unknown groups are errors. Holdout restores original mesh materials before each shot, including repeated holdouts; linked copies share material slots, so a mesh shared with a visible group gets a warning. Give independently visible props separate meshes when that warning appears.

A **plate** is the stationary set without its movers. A **sprite** is a mover on transparent film, with its shadow caught on the appropriate surface. A **strip** is N photographs placed in one horizontal WebP; the page selects a frame using a nested SVG viewport. `frames=[(key, callback), ...]` poses each frame from scratch; `K.turn_frames(axles,24)` makes one full turn about y, and `K.swap_frames(pose_sets)` chooses replacement geometry.

Moving a sprite sideways preserves its scale and camera angle. Its shading stays plausible while light, receiving ground, surrounding occluders and distance from the focus plane stay appropriate. Try moving the example car through the tree: it keeps its own photographed shadow and does not receive the tree's shadow. For such an interaction, photograph more poses or split the tree into foreground/background layers. Depth motion changes depth of field; moving the sprite in page y does not recalculate that blur. This method gives controlled compositing, not a live 3D scene.

Turning a photographed sprite freely on the page needs axial camera and lighting symmetry. The physics reference's top views and globe deliberately override the camera to 90 degrees and put the sun along its axis. An ordinary side-lit car should instead use a strip of rendered turning poses. The reference's Earth orbits by repositioning and photographing each frame under the Sun lamp; one side-lit Earth picture moved in a circle would keep the wrong lit side.

## Shared props and animation

`clayprops` keeps the reference book's approved materials and shapes together so later chapters can reuse them:

| Builder | Returns / anchor |
|---|---|
| `person(role,x,y,face='cam',k=1.1,swing=.34,colour=None)` | root plus mesh objects; feet at `(x,y,0)`; shirt from palette `C[role]` or `colour` |
| `car_build(name,y,sx=1,both=False)` | root, body objects, axles, lists of wheel objects; centred at x=0, ground contact at z=0; `sx=-1` faces left |
| `truck_build(y,prefix='t')`, `wheel(name,r,w,loc,seed)` | truck body plus axle/wheel pairs; a wheel returns its axle and objects; rotate axle y positively for rolling right |
| `tree`, `hills`, `tufts`, `daysky` | lists of mesh objects; optional seeded copies/periods for repeating scenery |
| `lawn(name,x0,x1,y0,y1)` | ground mesh, top z=0 |
| `table(name,x,y,w=2.4,d=1.3,h=1.0)` | objects plus top height; put a tabletop prop at that height |
| `house`, `board` | house root/objects; board objects, writable panel rectangle and foot anchor |
| `poses`, `stride_shot`, `stride_length` | replacement people and their strip; stride length calibrated to this person's leg and swing |

Use unique prop names because material creation is cached by name and modelling marks are seeded. Change `clayprops.C` before building for a different palette; a second material of the same name keeps the first one's settings. These figures have no faces or mouth animation. Story performance and voices remain the [picture-book workflow](../picture-books/puppets.md); this prop library supplies bodies and poses.

Choose strip density from visible motion. Twenty-four wheel angles are 15 degrees apart: for a 27 px wheel radius, one frame represents 7.07 px rolled. Thirty-six ball angles are 10 degrees apart. Eight replacement stride poses need `round(distance / stride_length * 8)`, with the distance measured in page px. `stride_length(k,swing)` uses this person's 0.44-unit leg; a different model needs its own measured stride. A fixed animation FPS would slide feet when speed changes.

## Render settings, cache and publishing

Each Blender invocation starts with `--background --factory-startup --python-exit-code 1 --python <scene> -- <scene arguments>`. The exit-code flag makes Python exceptions fail the command. `K.setup(args,set_name,asset_names)` clears the scene and kit caches, prints Blender version/device, validates `--only`, then configures the camera, light and materials. Set the scene's fstop before setup, or use its fallback 0.25. Keep one set per process and write every declared asset before `K.write_manifest(meta)`.

| Arguments | Meaning |
|---|---|
| `--device auto`, `CPU`, `METAL`, `OPTIX`, `CUDA`, `HIP`, `ONEAPI` | auto takes the first available GPU backend in the latter five's order OPTIX, CUDA, HIP, METAL, ONEAPI, otherwise announces CPU; an explicitly unavailable backend is an error |
| `--engine cycles`, `--samples 48` | Cycles supplies the approved shadow catcher path; `eevee` is a look-test/plate alternative and prints that sprite ground shadows are unavailable |
| `--scale 100`, shot `zoom=2` | rendered percentage is `int(scale*zoom)`; at those values a 1600×900 page crop becomes 3200×1800 pixels |
| `--elev`, `--fstop` | view elevation and depth of field; lower fstop makes foreground/background softer |
| `--sun`, `--sun-dir x,y,z`, `--sun-size`, `--ambient` | energy, direction of travel, angular size in degrees, world energy |
| `--look`, `--exposure`, `--marks` | AgX contrast look, exposure and surface-mark strength |
| `--quality 82` | WebP quality; changing only quality is a useful `--reuse` case |
| `--out DIR`, `--site DIR` | private raw PNGs/specs and published WebPs/manifest, respectively |
| `--draft`, `--reuse`, `--only car,car_wheel` | raw only; reuse matching raw frames; select known assets |

`--reuse` compares saved raw specs: crop, density, frame keys/order, every posed scene's shapes/materials/light/camera, samples, Blender version, anchor and scene/kit/prop source hashes. A changed source is conservatively refused even if the change was only a comment. Missing frames or different pixel sizes fail rather than mixing old/new frames. Drop `--reuse` to regenerate; keep historical renders in a different `--out`.

For a partial rerender, the set must first have been fully published by this kit. The manifest records its look arguments and actual camera direction/light. Changed projection or lighting refuses `--only` before publishing; changes to shared set metadata (lanes, anchors) are also refused. Render the whole set into a separate output folder when changing its look. A migrated old manifest has no such record, so first render the whole set. Unrecognised names, including mixed `car,trcuk`, fail and list choices.

Packing goes to `--out/.staged/`; `write_manifest()` validates metadata, then replaces published images and atomically replaces the manifest file. A render/pack error leaves the published files alone; a failure during that final sequence of file replacements is not a directory transaction. For an approved book, **render into a separate `--site` folder, check it, then promote it with a backup**. A failed staging run can be rerun; setup clears leftover `.staged/` on a non-draft run. Separate chapters/workers use separate raw folders and separate image/manifest directories: updating the same manifest concurrently can lose entries. Load one chapter's manifest as `window.CLAY` per page.

Look tests are draft runs. The reference scene's `--mock A|B|C --mockbeat 3|9|10|15` validates the beat/set pair before scene construction, selects just the mock and forces draft even without `--draft`; its production set shots are skipped.

## Cost and pixel budget

The packed strip must fit **16383 px in each dimension** (WebP). The kit checks before rendering that asset's first frame, reports packed size and maximum allowed scale. Example: 16 frames of 379×263 at 300% would be 18192×789, so it refuses; at 200%, 12128×526 fits. Choose fewer frames or lower density when the image is already large; a wider texture also costs decoded memory even if it compresses well.

Logs name page crop, actual packed pixels, single-copy RGBA decoded budget (`width*height*4`), render seconds, bytes and total build/render/pack seconds. A 3600×2200 track is 30.21 MiB decoded; a 7200×4400 version is 120.85 MiB, while the packer's float RGBA array alone is 483.4 MiB. Browser/GPU copies and other buffers add more. The approved ch09's 47 assets total about 1.84 MiB compressed but 163 MiB decoded at their published sizes. Doubling global scale roughly quadruples that pixel budget; per-shot zoom already multiplies it.

Measured on Blender 5.3.0, Apple M1 Metal, 48 samples, `--scale 100` (2026-11-26): the example scene's draft takes 48 s (the 1600×900 yard plate 36 s; car 3 s; 24 wheel frames 5 s; person 2 s), and `--reuse` publishes it in 2 s. The reference ch09's eight sets, 47 assets, take 19½ minutes in all, from 35 s (`train`, one plate) to 6 minutes (`track`, 15 assets, its plate twice as fine); the per-set figures are in `site/physics-clay/make/README.md`. A 1600×900 plate costs 20–55 s, a larger one more (the 2402×1780 road 162 s, the 3600×2200 track 193 s), a small sprite 1–5 s, a strip frame 0.2–6 s by its size. Time the first plate and strip, then multiply by your asset counts. NVIDIA and other GPUs have not been measured here; `--scale 200` with `--samples 256` is a larger, unmeasured job, so time one shot first.

## Page integration and seeing the result

Load engine, manifest, then loader; the manifest derives its image base from its own script URL, so a chapter and a single page can load it from different depths. The loader itself needs no physics helper or road metadata.

```html
<script src="../lib/engine.js"></script>
<script src="../img/clay/clay.js"></script>
<script src="../lib/clay.js"></script>
<!-- define CHAPTER and BEATS, plus the tier's usual timings -->
<script>clayBoot();</script>
```

`clImg(p,name,options)` places a plate/sprite; `clStrip` returns `_frame(integer)`, `_n` and optional `_r`; `clTurn(strip,distance,radius,lead)` selects a rolling frame; `clBoard` returns the writable panel's page rectangle. `clayReady(names)` decodes named assets and rejects with their URL on failure; `clayBoot(names)` waits for it, then calls the engine's `boot()`. Omit names to wait for the whole manifest, as the example does. Boot only through `clayBoot`: it holds clicks and keys while the pictures load, because a Start pressed then would be undone by `boot()`'s first seek (the cover gone, the lesson paused). For a long film, keep manifests small or decode the next beat's named pictures ahead of its transition; the loader does not eagerly prefetch at script load.

All placement and frame selection belong in `clockRun(t => {...}, D)` as pure functions of t, as in `example.html`. Pausing, seeking and replay then reproduce the same pose. Camera movement uses the existing engine's world/screen coordinates and page px; density stays in image pixels. Use the tier's own stage shape and composition: [shorts](../films/shorts.md), [film shots](../films/films.md), [lesson motion](../lessons/scenes.md). The landscape yard example demonstrates the mechanics; compose an upright shot against the shorts kit's 900×1600 stage rather than stretching it.

Run `check_clay.py` in Chromium, Firefox and WebKit (install it with `uv run --with playwright playwright install webkit`). It decodes **every** manifest image and checks dimensions, finite rectangles and positive frame counts; then checks the stage at each beat's beginning/middle/end and compares jumped-to with stepped-to poses. It reports failed HTTP requests and page errors by URL. It does not prove an anchor is the right foot or wheel centre: the book's own check measures that independently against its labels, as `site/physics-clay/make/check_ch09.py` does. It also does not inspect composited occlusion pixels or guarantee frame rate.

```sh
uv run --with numpy python3 SKILL/scripts/claykit.py --selftest
uv run --with playwright python3 SKILL/scripts/check_clay.py --selftest
```

The self-checks exercise repeated holdout restoration, unknown names, partial look changes, cache mismatch, strip limits and deliberately missing/undecodable/wrong-sized images. The reference's build check adds mock isolation and command guard tests. Open browser stills before/during/after each transition, including a close view and a mobile viewport. Watch real play/pause/seek/replay and check Firefox with `perf.py`; decoded memory estimates and Playwright WebKit are not measurements on a phone or real Safari. A reused asset whose pixel diff changes needs explanation and visual inspection before replacing an approved picture.
