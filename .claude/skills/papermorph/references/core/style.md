# The conversation and style.json

Left to guess what the user wants, an agent's guesses diverge from run to run. So every book starts with a short conversation that ends in `books/<book>/style.json`, the anchor every chapter is made against. It fixes *what* the book looks and sounds like; *how* each moment is animated stays free. Each tier's intake says what to ask ([lessons](../lessons/intake.md), [picture books](../picture-books/stories.md#intake-for-a-story), [films](../films/films.md#intake)); this file covers how to ask, the models step and the file itself.

## Asking

- Many users want to click, not type. Every point where you need the user, from finding the source to approving the finished chapter, is a choice: two to four concrete options drawn from this book, the recommended one first and labelled so, so that accepting every recommendation still makes a good book. Use the structured question tool when there is one (at most four questions a round); otherwise number the options so one digit answers. Their own words are welcome, never required.
- Ask from this book and this chapter, not from a form; skip what the material or earlier answers already settle.
- After each round, say the answers back as decisions in a line or two, then move on.
- Keep what the user says about the look **verbatim** in `words`: later chapters need their taste, not a summary of it. When they only pick options, record the chosen options' wording.
- Keep it light: the user tries one chapter (or episode) first and decides about the rest after seeing it.

## Models

Which model does which step is the user's choice; users run the Skill with different models and providers, and a book can mix them. Show the tier's defaults as one table, one row per step of its team ([core/team.md](team.md)), and ask: keep it (recommended), or change some rows. Any model the user names is fine.

| Step | Lesson, tier 1 | Lesson, tier 2 | Picture book | Documentary | Short |
|---|---|---|---|---|---|
| Extract the chapter (or the story) | small | small | strong (script and storyboard with the user) | strong (research, script and storyboard with the user; then voice and music) | strong (script and storyboard with the user; then voice and music) |
| Narration and beats | middle | middle | strong (voices, the episode kit) | middle (pictures found and treated) | middle (pictures generated or found) |
| Picture: storyboard, motion, questions | middle | strong | middle, one worker per scene | middle, one worker per part of the film | middle (the beats) |
| Checks | small | small | small (sound effects too) | small | small |
| Review | middle | middle | strong director, middle picture and sound reviewers | strong director | strong director |
| Rework | strong | strong | middle, per scene | middle, per part | middle |
| Register | small | small | small | small | small |

**small**, **middle** and **strong** stand for the user's current fast, balanced and most capable models; write the actual names into `models`, keyed by step as in the [lesson](../../assets/templates/style.json) or [picture-book](../../assets/templates/picture-book/style.json) template (a picture book's keys name its roles: `script`, `kit`, `scenes`, `sound`, `director`, `reviewers`; a [documentary](../../assets/templates/documentary/style.json)'s and a [short](../../assets/templates/shorts/style.json)'s: `script`, `pictures`, `beats`, `checks`, `director`). Without subagents one agent does every step on its own model, and the table only records that. The user can change a row at any time; later chapters follow the table as it stands.

## style.json

Start from the tier's template: [lessons](../../assets/templates/style.json), or the kit's own `style.json` for a picture book, a documentary or a short. Blocks are grouped by ability, not by tier; a tier is just which blocks are present:

| Block | What it holds | Present in |
|---|---|---|
| `schema`, `tier`, `book` | schema version; `1`, `2`, `"custom"`, `"picture"`, `"documentary"` or `"shorts"`; title, slug, language, readers, pilot chapter | all |
| `words` | the user's own words about the look, verbatim, with later feedback that changed the bar | all |
| `look` | palette, what each colour means, text and maths fonts, notation and rounding | all |
| `voice` | TTS engine (`edge`; `kokoro` when Edge is unavailable or local audio is wanted; `eleven`, paid, for a film: [core/sound.md](sound.md#voices)), voice, rate | all |
| `pacing` | minutes per chapter, where checks and practice go | all |
| `engine` | engine source and version used to build the book | all |
| `scenes` | art style, cast, how storyboards are reviewed | lessons, tier 2 |
| `components` | shared elements: name, file, what each does | lessons, tier 2 (tier 1 when the book has some) |
| `images` | where images may come from, credit rules | lessons, tier 2 |
| `models` | the model for each step, as agreed above | all |
| `illustration` | a picture book's look, budget, cast and sets ([stories.md](../picture-books/stories.md#intake-for-a-story)) | picture books |
| `angle` | the one thing a viewer leaves with, and what must be in the film | documentaries |
| `music` | the music and where it came from | documentaries, shorts |
| `platform`, `source`, `series`, `sources` | the feed and export size; where the argument comes from (the user's outline or a long film); the series' name and each episode's point; how strict to be about sources ([shorts.md](../films/shorts.md#questions-for-the-user)) | shorts |
| `courses` | the course options chosen ([courses.md](../lessons/courses.md)) | when chosen |
| `approved` | chapters the user approved and what each shows well | filled as chapters are approved |

Leave out blocks the tier does not use; a reader that meets an unknown block reads it as plain intent. Increase `schema` only when an existing field changes meaning. Keep the file current and short: chapter status, errata and historical feedback go in `chapters.md` and `chapters/chNN.md`.

Deliver the pilot with a choice: approve and make the rest (recommended when it is good), approve and stop here, or one of two or three concrete changes you would make yourself. Fold the answer and any feedback into `words` and the affected block, and add an approved chapter to `approved`. Approved chapters are the strongest anchor: later chapters watch and read them as worked examples.
