# Clay pictures for the science book (Blender)

Chapter 1 (`ch09/`), Section 1 (beats 0-8) is drawn as a clay tabletop miniature rendered in Blender. Beats 9-31 and
chapters 10-19 still use the pixel set (`lib/figures.js`, `img/*.png`); nothing they load was changed.

## How the pictures stay exact

The page never plays a rendered sequence. Blender renders **plates** (a set without its movers), **sprites** (one
mover on a transparent film with its shadow, from a shadow catcher) and **strips** (a wheel, a ball, a turning page,
an orbiting Earth, a walking figure at N angles or poses side by side). The page moves them on the beat clock as it
moved the pixel figures, and the labels stay SVG over them. The camera is orthographic and never turns, so a sprite
moved sideways is the frame Blender would render with the thing there (`claykit.py`). The globe (beat 6) is seen and
lit along its axis, so its picture turned by the page is exact at any angle. Pause, seek, replay and `?beat=N&t=S`
give the same picture, and `check_ch09.py` measures it.

| beat | how |
|---|---|
| 0 intro, 3 roadside, 4 incar, 5 rule, 8 wrap | `road` plate (one 2400 px period that repeats) + `truck`, `car` sprites with `*_wheel` strips (24 angles) + `you`, `friend` |
| 1 position | `park` plate + `ball` strip (36 angles, chosen by distance rolled) over `ball_shadow` |
| 2 everywhere | `table` plate + `leaf` strip (16 angles of the page), `sun` sprite, `earth` strip (24 positions on the orbit, lit side toward the Sun), `walk` strip (8 replacement poses chosen by distance walked) |
| 6 earth | `space` still under the camera + `globe` (its soft shadow on the table included, feathered round) + `globe_cap` (the top, 3x finer, for the close ground views) |
| 7 q1 | `train` plate (static) |

## Render

```
blender --background --factory-startup --python site/science/make/ch09.py -- --set road|park|table|globe|train \
    [--only road,truck] [--samples 48] [--scale 100] [--engine cycles] [--device auto|OPTIX|METAL|CPU] [--draft]
uv run --with playwright site/science/make/check_ch09.py [--browser firefox]   # with the site served on 8831
```

`--draft` writes PNGs to `books/science-clay/render/` only; otherwise the WebP goes to `img/clay/` and its size and
anchor into `img/clay/clay.js`. `--reuse` packs existing frames again (a new `--quality`). Every look setting is an
argument (`claykit.arguments`: `--elev`, `--fstop`, `--sun`, `--sun-dir`, `--sun-size`, `--ambient`, `--look`,
`--exposure`, `--marks`, `--quality`).

Cost on the M1 (Metal, 48 samples, 1600 px stage): all five sets ~6 min (road plate 42 s, ball strip 44 s, page
strip 52 s, globe 12 s at 2x, cap 13 s at 3x). On the RTX 4070: `--device OPTIX --samples 256 --scale 200` for
high-density screens (sizes roughly x3.5); time one set first.

`look/`: contact sheets of each step (pixel against clay, incar, Section 1 and the director's fixes).
