---
name: papermorph
description: Make or edit animated, narrated, interactive web books from reference PDFs, animated picture books (paper-puppet films) from a story, a joke or a fairy tale, narrated documentaries about a book or an idea, built from public-domain pictures, upright shorts for a phone feed that make one point in under three minutes, scroll stories whose picture changes as the reader scrolls, and maps you explore, where a stretch of history plays year by year and the reader clicks the people and places on it. Use for book planning, storyboards, chapter animation and exercises, narration, and cover and contents pages, including "make the next chapter", "turn this story into a picture book", "make a documentary about this book", "make a short about this for YouTube Shorts", "fix this animation" or "make an interactive map of Europe in the 1920s". Deliver runnable static book files; bookshelf design, bookshelf registration and hosting are separate tasks.
---

# Papermorph

Papermorph makes three tiers of book on one engine:

- **Lessons**, from a textbook PDF: each chapter is a short animated lesson film where the picture carries the explanation, the narration says it, and quick checks and practice happen inside the picture.
- **Picture books**, from a story, a joke or a fairy tale: short films of paper puppets in front of sets, drawn in code or painted by an image model, with voices, effects and music.
- **Films**, from a book, an idea or the user's argument: narrated **documentaries** of found public-domain pictures, words and maps moved in step with the voice, and upright **shorts** for a phone feed that make one point in under three minutes.

All are an SVG stage (1600×900, or 900×1600 for a short) plus a player; **beats** pair narration clips with timed actions. Good means **alive** (things act and change with weight and timing), **composed** (each moment reads as one picture, text beside what it names), **true** (motion, labels and numbers agree at every moment) and **smooth** (it plays without stutter, Firefox included).

What the picture should be depends on the book and on the user, so the work starts with a conversation that ends in `style.json`: the user's words, the look they chose, the voices, which model does which step, and later the approved chapters. Every chapter is made against it; how each beat is laid out and choreographed is yours to judge against it and the approved chapters. User requests override defaults. Re-create explanations, examples and drawings; keep source PDFs, page images and extracted text outside the static output folder and out of version control (`.gitignore`: `*.pdf`, `books/*/pages/`). A chapter the Skill made is a first cut: review rounds and the user's viewing come before it is published.

## Which tier

Read the tier's first file, then only what the current step needs. Every file below is linked from here; none needs another to be found.

| The user brings | Tier | Start with | Then, as the step needs |
|---|---|---|---|
| A textbook PDF (a course book too) | Lessons | [lessons.md](references/lessons/lessons.md) | [intake.md](references/lessons/intake.md) · [authoring.md](references/lessons/authoring.md) · [diagrams.md](references/lessons/diagrams.md) (tier 1) · [scenes.md](references/lessons/scenes.md) (tier 2) · [assets.md](references/lessons/assets.md) · [maths.md](references/lessons/maths.md) (math.js, math parts, LaTeX) · [questions.md](references/lessons/questions.md) · [figures.md](references/lessons/figures.md) (figures the reader moves) · [checks.md](references/lessons/checks.md) · [cover.md](references/lessons/cover.md) · [courses.md](references/lessons/courses.md) (citations, item bank, SCORM: only when the book calls for them) |
| A story, a joke, a fairy tale, or a story book's PDF (its own scanned pictures: [stories.md](references/picture-books/stories.md#from-a-scanned-books-own-pictures)) | Picture books | [stories.md](references/picture-books/stories.md) | [puppets.md](references/picture-books/puppets.md) · [painting.md](references/picture-books/painting.md) (a painted look) · [listen-and-find.md](references/picture-books/listen-and-find.md) (a finding game for young children) |
| A book, an idea or a stretch of history to explain as a narrated film | Films: documentary | [films.md](references/films/films.md) | [documentary.md](references/films/documentary.md) |
| One point to make in under three minutes, upright, for a phone feed (YouTube Shorts, TikTok, Reels), or a long film to recut | Films: shorts | [films.md](references/films/films.md) | [shorts.md](references/films/shorts.md) |
| A film's material, or an idea that is mostly maps and numbers, to read at the reader's own pace on a page whose picture changes as it scrolls (a scroll story) | Films: scroll page | [films.md](references/films/films.md) | [scroll.md](references/films/scroll.md) |
| A stretch of history to explore on a map, year by year: borders that change, people who move (one page, its own player, not the engine) | Pages you explore | [explore.md](references/explore/explore.md) | |

Every tier shares the core:

| File | What it holds |
|---|---|
| [core/style.md](references/core/style.md) | how to ask the user, the models step, the paid steps (keys, prices, ledger, balance), `style.json` |
| [core/publish.md](references/core/publish.md) | `new_book.py`, language, minutes, preview and delivery, video export |
| [core/sound.md](references/core/sound.md) | the narration file, voices, levels, effects, music, captions |
| [core/review.md](references/core/review.md) | seeing your own work in motion, frames, smoothness, director rounds |
| [core/team.md](references/core/team.md) | making chapters with subagents, the coordinator, workers in parallel |
| [core/engine.md](references/core/engine.md) | the player and drawing API, timing, camera, performance, traps |

Start with the tier's intake whenever `books/<book>/style.json` does not exist yet; reuse answers and approvals already given.

## Reference books

The reference books are the bar: levels to reach, not formats to copy. Each is the folder `site/<slug>/` of the Papermorph repository (https://github.com/DozenTwelve/Papermorph), served at `https://papermorph.diamonddoge.org/<slug>/`, so its source can be read in a checkout or fetched from either address when the Skill is installed on its own. The tier files name the file in a book worth opening for a given step.

| Tier | Books (slug) |
|---|---|
| Lessons | tier 1: *Elementary Algebra* (`elementary-algebra`), *Math Notebook* (`math-notebook`); tier 2: *Science* (`science`); a light board with dark ink: `physics-notebook` |
| Picture books | *The Little Horse Crosses the River* (`little-horse`) and *Little Red Riding Hood* (`little-red-riding-hood`): all in code, a cast voiced by ElevenLabs, a listen-and-find stop, the newest and the bar; *Joke Collection* (`joke-collection`): painted sets, puppets in code, a series of episodes; *Millions of Cats* (`millions-of-cats`, Wanda Gág, 1928): a scanned book's own pictures lifted into sets and puppets (not on the shelf) |
| Documentaries | *Madness and Civilization* (`madness`, after Foucault, ten minutes), *The Pandemic* (`pandemic`), *Shooting an Elephant* (`shooting-an-elephant`, one the reader acts in) |
| Shorts | the *Madness and Civilization* shorts (`madness-shorts`; episode 1, *The Ship*, is the worked example), *The Pandemic* shorts (`pandemic-shorts`) |

*Tulip Mania* (`tulip-mania`) is a test film made from the Skill alone, with no help beyond these files; the files cite what it ran into.

## Project layout

```
books/<book>/                  private: source, style.json, storyboards, art, review/ (tier files list their own)
content/<book>/chNN/           narration.<lang>.json and the voice cache
tools/<book>/                  tests, audio scripts, evidence
site/<book>/                   the static book (only this is delivered)
  index.html                   cover and contents, or a series page
  lib/                         the engine (synced by engine.py), lib/book.css (this book's settings), the tier's kit, the book's own pieces
  img/                         the book's pictures
  chNN/index.html, audio/<lang>/   a chapter or episode, its beat MP3s and timings.js (films and picture books: audio/sfx/, audio/bgm/)
```

`SKILL` means this skill's absolute folder; `<book>` is the book slug, `<lang>` its primary language code. `new_book.py` starts a book of any tier ([core/publish.md](references/core/publish.md#start-a-book-folder)).

Needs: `uv`, `ffmpeg`/`ffprobe`, Edge TTS network access (or Kokoro, local), github.com for `engine.py` when the repository's `engine/` folder is not at hand, an OpenRouter key only for the paid steps the user chooses (`paint.py`, `eleven.py`, `video.py`; `paint_openai.py` takes an OpenAI key), and Playwright browsers (`uv run --with playwright playwright install chromium firefox`; where Playwright's Chromium does not run, set `CHROME` to an installed Chrome, Chromium, Brave or Edge). Preview: `python3 SKILL/scripts/serve.py 8765 site` (no browser caching).

## Scripts

All in `SKILL/scripts/`; each prints its usage with `--help` when run with the `uv run --with …` its docstring's first lines name (without its packages even `--help` stops on the import).

| For | Scripts |
|---|---|
| Every book | `new_book.py` start a book folder · `serve.py` preview without caching · `engine.py` sync the engine into books · `tts.py` narration and word times · `eleven.py` the same from ElevenLabs (paid) · `level.py` even loudness · `lint.py` static checks · `check.py` page errors, console warnings and beat lengths in Chromium and Firefox · `shot.py` beat screenshots · `strip.py` storyboard sheets and motion strips · `still.py` stretches where nothing moves · `playlog.py` sounds and captions against the picture · `perf.py` Firefox frame times · `export.py` MP4 and `.srt` · `sfx.py` synthesized effects |
| Lessons | `outline.py` and `split_pages.py` page map and chapter text · `check_blank.py` empty openings · `overlap.py` arrows through text · `sprites.py` image processing steps · `refs.py` verified citations · `items.py` question bank · `scorm.py` LMS package |
| Picture books | `mouths.py` mouth shapes · `join.py` one clip per scene · `bake_sets.py` set layers · `bake_puppets.py` puppet bitmaps · `paint.py` / `paint_openai.py` image-model pictures · `painted.py` place them in the book · `lift.py` figures, sets and lettering cut from a scanned book's own pictures · `cutout.py` image-model pictures on a key colour cut into puppet pieces and props |
| Pages you explore | `topo.py` the map's TopoJSON from Natural Earth · `explore.py` checks, shots, Firefox timing and the narration file for an explorable map |
| Films | `commons.py` public-domain pictures and recordings with their licences · `prep.py` print, line and full-bleed treatments · `trace.py` drawings that draw themselves on · `video.py` a clip from a still · `frames.py` a clip as treated frames · `geo.py` the map kit's data from Natural Earth · `music.py` a track cut to the film, the bed in the voice's gaps, and the music, beds and effects against each line · `safe.py` words outside an upright film's safe area |

`silence.py`, `ledger.py` (the one cost ledger: date, chapter, file, model, what, cost) and `browsers.py` are helpers the others import.

## Context

- Talk with the user from the main conversation: intake, and every sheet and choice of the pilot. When subagents are available, chapters are made as a team, each step on the model the user chose, with the main conversation as the pilot's coordinator ([core/team.md](references/core/team.md#the-coordinator) says what that allows); without them, run the same steps in the current agent with file-based state.
- Use the engine API and inspect individual functions when needed; copy kit files rather than reading their full source as instructions.
- Keep `style.json` current and short; chapter status, errata and historical feedback stay in `chapters.md` and `chapters/chNN.md`.
