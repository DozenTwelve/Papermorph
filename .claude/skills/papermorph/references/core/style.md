# The conversation and style.json

Left to guess what the user wants, an agent's guesses diverge from run to run. So every book starts with a short conversation that ends in `books/<book>/style.json`, the anchor every chapter is made against. It fixes *what* the book looks and sounds like; *how* each moment is animated stays free. Each tier's intake says what to ask ([lessons](../lessons/intake.md), [picture books](../picture-books/stories.md#intake-for-a-story), [films](../films/films.md#intake)); this file covers how to ask, the models step and the file itself.

## Asking

- Many users want to click, not type. Every point where you need the user, from finding the source to approving the finished chapter, is a choice: two to four concrete options drawn from this book, the recommended one first and labelled so, so that accepting every recommendation still makes a good book. Use the structured question tool when there is one (at most four questions a round); otherwise number the options so one digit answers. Their own words are welcome, never required.
- Ask from this book and this chapter, not from a form; skip what the material or earlier answers already settle.
- After each round, say the answers back as decisions in a line or two, then move on.
- Keep what the user says about the look **verbatim** in `words`: later chapters need their taste, not a summary of it. When they only pick options, record the chosen options' wording.
- Keep it light: the user tries one chapter (or episode) first and decides about the rest after seeing it.

## Models

Which model does which step is the user's choice, among the models the host running the Skill can start; a user who wants another provider's models makes the book in that provider's host. The models come after the tier the user chose at intake, as one question the user answers with a click:

- **Recommended**: the tier's column of the table below, the splits that made approved books.
- **Strongest everywhere**: every step on the strong model.
- **Cheaper**: for a lesson, the picture step on the middle model and the rest as recommended; on tier 1 this made two maths chapters that were acceptable but monotonous, and tier 2's picture step wants a strong model ([lessons/intake.md](../lessons/intake.md#3-tier)), so offer it there with that warning. For a picture book, the script on strong, sound on small and every other role on middle. For a film, the builder (a documentary's one agent, a short's worker per episode) on middle, and the fresh director still strong. The tier-2, picture-book and film splits have not been tried yet; say so in the option.
- **Custom**: only then ask one question per `models` key of the tier's template (seven for a lesson, six for a picture book, five for a film; the steps of its team, [core/team.md](team.md)), each offering the host's models, in rounds as [Asking](#asking) allows.

A film's recommended split is already strongest everywhere, so a film offers three options: strongest everywhere (recommended), cheaper and custom. Lessons and picture books offer all four, recommended first and labelled so.

| Step | Lesson (tier 1 and 2) | Picture book | Documentary | Short |
|---|---|---|---|---|
| Extract the chapter (or the story) | small | strong (script and storyboard with the user) | strong: one agent researches, writes the script and storyboard with the user, voices, finds the music and pictures | strong: one worker per episode writes the script with the user (or the coordinator), voices, makes or finds the pictures |
| Narration and beats | middle | strong (voices, the episode kit) | strong (the same agent) | strong (the same worker) |
| Picture: storyboard, motion, questions | strong | middle, one worker per scene | strong (the same agent) | strong (the same worker) |
| Checks | small | small (sound effects too) | strong (the builder runs its own) | strong (the worker runs its own) |
| Review | middle | strong director, middle picture and sound reviewers | strong director, fresh: contact sheets, then the exported MP4 | strong director per episode, fresh, on the exported MP4 |
| Rework | strong | middle, per scene | strong (the builder) | strong (the episode's worker) |
| Register | small | small | strong (the coordinator) | strong (the coordinator) |
| Made this way | physics ch14, at about half the cost of one strong agent | *Joke Collection* episodes 5–6 | *Madness and Civilization*, *The Pandemic* | *Madness and Civilization* shorts 2–4, *The Pandemic* shorts 1–6 |

**small**, **middle** and **strong** stand for the user's current fast, balanced and most capable models. Each option names the actual models, not only their strength: Claude Code starts a subagent on `opus`, `sonnet`, `haiku` or `fable`, so a lesson's recommended option reads "opus for the picture and rework, sonnet for narration and review, haiku for the rest". Where you cannot tell which models the host can start, ask the user once which is their strong, middle and small model. A model the host cannot start is named to the user, not swapped for another.

Every step runs at high reasoning effort unless the user asks for another; effort is not one of the questions.

A host that cannot choose a subagent's model, or has no subagents, runs every step on the conversation's model; one that cannot set a subagent's effort runs it at the host's default. Say so to the user, let `models` record the model that runs, and report what ran at delivery ([core/team.md](team.md#before-delivering)): the conversation's model, and "host default" rather than "high" for effort.

Write into `models` the name the host's launcher takes (in Claude Code, the names above), keyed by step as in the [lesson](../../assets/templates/style.json) or [picture-book](../../assets/templates/picture-book/style.json) template (a picture book's keys name its roles: `script`, `kit`, `scenes`, `sound`, `director`, `reviewers`; a [documentary](../../assets/templates/documentary/style.json)'s and a [short](../../assets/templates/shorts/style.json)'s: `script`, `pictures`, `beats`, `checks`, `director`). The user can change a model at any time; later chapters follow `models` as it stands.

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
