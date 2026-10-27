---
name: papermorph
description: Make or edit animated, narrated, interactive web books from reference PDFs, animated picture books (paper-puppet films) from a story, a joke or a fairy tale, narrated documentaries about a book or an idea, built from public-domain pictures, and upright shorts for a phone feed that make one point in under three minutes. Use for book planning, storyboards, chapter animation and exercises, narration, and cover and contents pages, including "make the next chapter", "turn this story into a picture book", "make a documentary about this book", "make a short about this for YouTube Shorts" or "fix this animation". Deliver runnable static book files; bookshelf design, bookshelf registration and hosting are separate tasks.
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
| A textbook PDF (a course book too) | Lessons | [lessons.md](references/lessons/lessons.md) | [intake.md](references/lessons/intake.md) · [authoring.md](references/lessons/authoring.md) · [diagrams.md](references/lessons/diagrams.md) (tier 1) · [scenes.md](references/lessons/scenes.md) (tier 2) · [assets.md](references/lessons/assets.md) · [questions.md](references/lessons/questions.md) · [checks.md](references/lessons/checks.md) · [cover.md](references/lessons/cover.md) · [courses.md](references/lessons/courses.md) (citations, item bank, SCORM: only when the book calls for them) |
| A story, a joke, a fairy tale, or a story book's PDF | Picture books | [stories.md](references/picture-books/stories.md) | [puppets.md](references/picture-books/puppets.md) · [painting.md](references/picture-books/painting.md) (a painted look) |
| A book, an idea or a stretch of history to explain as a narrated film | Films: documentary | [films.md](references/films/films.md) | [documentary.md](references/films/documentary.md) |
| One point to make in under three minutes, upright, for a phone feed (YouTube Shorts, TikTok, Reels), or a long film to recut | Films: shorts | [films.md](references/films/films.md) | [shorts.md](references/films/shorts.md) |

Every tier shares the core:

| File | What it holds |
|---|---|
| [core/style.md](references/core/style.md) | how to ask the user, the models step, `style.json` |
| [core/publish.md](references/core/publish.md) | `new_book.py`, language, minutes, preview and delivery, video export |
| [core/sound.md](references/core/sound.md) | the narration file, voices, levels, effects, music, captions |
| [core/review.md](references/core/review.md) | seeing your own work in motion, frames, smoothness, director rounds |
| [core/team.md](references/core/team.md) | making chapters with subagents, the coordinator, workers in parallel |
| [core/engine.md](references/core/engine.md) | the player and drawing API, timing, camera, performance, traps |

Start with the tier's intake whenever `books/<book>/style.json` does not exist yet; reuse answers and approvals already given. The reference books on https://papermorph.diamonddoge.org/ are the bar: the maths and science books for lessons, *Joke Collection* and *Little Red Riding Hood* for picture books, *Madness and Civilization*, *Shooting an Elephant* (interactive) and *The Pandemic* for documentaries, the *Madness and Civilization* shorts for shorts.

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
| Every book | `new_book.py` start a book folder · `serve.py` preview without caching · `engine.py` sync the engine into books · `tts.py` narration and word times · `level.py` even loudness · `lint.py` static checks · `check.py` page errors, console warnings and beat lengths in Chromium and Firefox · `shot.py` beat screenshots · `strip.py` storyboard sheets and motion strips · `still.py` stretches where nothing moves · `playlog.py` sounds and captions against the picture · `perf.py` Firefox frame times · `export.py` MP4 and `.srt` · `sfx.py` synthesized effects |
| Lessons | `outline.py` and `split_pages.py` page map and chapter text · `check_blank.py` empty openings · `overlap.py` arrows through text · `sprites.py` image processing steps · `refs.py` verified citations · `items.py` question bank · `scorm.py` LMS package |
| Picture books | `mouths.py` mouth shapes · `join.py` one clip per scene · `bake_sets.py` set layers · `bake_puppets.py` puppet bitmaps · `paint.py` / `paint_openai.py` image-model pictures · `painted.py` place them in the book |
| Films | `commons.py` public-domain pictures and recordings with their licences · `prep.py` print, line and full-bleed treatments · `trace.py` drawings that draw themselves on · `video.py` a clip from a still · `frames.py` a clip as treated frames · `geo.py` the map kit's data from Natural Earth · `eleven.py` ElevenLabs narration with word times · `music.py` a track cut to the film, and the bed in the voice's gaps · `safe.py` words outside an upright film's safe area |

`silence.py`, `ledger.py` (the one cost ledger: date, chapter, file, model, what, cost) and `browsers.py` are helpers the others import.

## Context

- Talk with the user from the main conversation: intake, and every sheet and choice of the pilot. When subagents are available, later chapters are made as a team, each step on the model the user chose ([core/team.md](references/core/team.md)); without them, run the same steps in the current agent with file-based state.
- Use the engine API and inspect individual functions when needed; copy kit files rather than reading their full source as instructions.
- Keep `style.json` current and short; chapter status, errata and historical feedback stay in `chapters.md` and `chapters/chNN.md`.
