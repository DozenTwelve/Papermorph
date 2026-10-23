# Intake: from a PDF to one agreed chapter

A cold agent with only a PDF has no idea what the user wants, and its guesses diverge from run to run. Intake closes that gap through a short conversation and writes the outcome to `books/<book>/style.json`, the anchor every chapter is made against. The schema fixes *what* the book looks and sounds like; *how* each moment is animated stays free.

The conversation should feel light: the user tries one chapter first and decides about the rest of the book after seeing it.

## Asking

- Many users want to click, not type. Every point where you need the user, from finding the PDF to approving the finished chapter, is a choice: two to four concrete options drawn from this book, the recommended one first and labelled so, so that accepting every recommendation still makes a good book. Use the structured question tool when there is one (at most four questions a round); otherwise number the options so a single digit answers. Their own words are always welcome, never required.
- Questions come from this book and this chapter, not from a form. Skip what the material or earlier answers already settle.
- After each round, say the answers back as decisions in one or two lines, then move on.
- Keep what the user says about the look **verbatim** in `words`; later chapters need their taste, not a summary of it. When they only pick options, record the chosen options' wording.

## 1. Welcome and the PDF

Greet briefly as Papermorph. Look for PDFs in the working folder and its subfolders (then the user's Downloads and Desktop if none are found) and ask "Is it this one?", listing up to four candidates. If none are found, offer to search another folder or to take a path. Choose a short slug and place the file at `books/<book>/book.pdf`, a copy or a link.

When the user brings a story, a joke or a fairy tale instead (or a story book's PDF), it becomes a picture book: go to [stories.md](stories.md), which has its own short intake, and come back here for the models (§5) and `style.json` (§6).

## 2. What this book is

Run the split ([SKILL.md](../SKILL.md#pipeline)) and read the contents, the preface and the `text.md` of two or three chapter openings across the book. Say in two or three sentences what the book is: subject, readers, how it teaches. Then offer a chapter to try: name two or three candidates with one line each on what they would show, recommending one that is representative rather than the gentlest opening (a light introduction can pass while hiding the hard problems). A section of a long chapter is fine.

If the book is for a course, notice it here: when it cites other works (author–year citations, named studies), offer links from the works named on screen to their sources; when its questions must be reviewed before release, offer an item bank; when it goes into an LMS, mention the SCORM package. None is on by default ([courses.md](courses.md)).

## 3. Tier

Offer the animation tiers as reference points; the books at https://papermorph.diamonddoge.org/ show each of them (and the picture books); link them.

1. **Diagrams that change**: symbols, number lines, graphs and shapes built in code, rearranged as the narration explains (the maths books). The lightest; a smaller model can do most steps.
2. **Illustrated scenes**: characters act out the idea, the camera moves, external images and a storyboard before motion (the science book). Several times the work of tier 1 per chapter, and the picture step wants a strong model.
3. **Custom**: the user describes what they want; you judge which abilities it needs and say so.

Recommend one from the chapter's content: abstract and procedural ideas fit tier 1 ([diagrams.md](diagrams.md)); physical and narrative ones fit tier 2 ([scenes.md](scenes.md)). Mixing per beat is allowed under any tier.

Then start the book folder ([site.md](site.md#start-a-book-folder)): the look is settled on real frames, so the engine, the chapter page and the voice need to be in place first.

## 4. The look, by tier

**Tier 1** needs few decisions. Propose palette, fonts and the language and voice from the book itself. Then make the chapter's narration and its first one or two beats, laid out at real size ([SKILL.md](../SKILL.md#chapter-loop), steps 2–3), and capture a few key frames with `strip.py`. Show the sheet and ask: go ahead as it is (recommended), or one of two or three concrete changes (calmer, more colour, larger type …). Once agreed, settle the models (§5), then write `style.json` and make the chapter.

**Tier 2** has more to settle; ask in rounds:
1. Art and sources: drawn in code, pixel scenes, illustrated, real images; whether web images (with credits) are acceptable. The recurring characters: propose two or three casts that suit the book, each in one line.
2. Shared components: list the things this chapter, and the chapters around it, will draw again and again (in the science book: force arrows, crates, the actors), each with what it must do and how it would be made. Offer them as one multiple-choice question, recommending the ones that recur most, for which to build once for the whole book ([assets.md](assets.md)).
3. The storyboard: lay out the key moments without motion and show the sheet ([scenes.md](scenes.md#storyboard-layout-first-then-motion)). Ask: add motion now (recommended), or a few concrete changes to named frames. Motion comes after the user agrees.

**Custom**: ask what the description leaves open, using the closest tier's rounds and options.

## 5. Models

Which model does which step is the user's choice. Users run the Skill with different models and providers, and a book can mix them. Show the defaults for the chosen tier as one table, one row per step in [team.md](team.md#steps), and ask: keep it (recommended), or change some rows. Any model the user names is fine.

| Step | Tier 1 | Tier 2 | Picture book |
|---|---|---|---|
| Extract the chapter (or the story) | small | small | strong (script and storyboard with the user) |
| Narration and beats | middle | middle | strong (voices, the episode kit) |
| Picture: storyboard, motion, questions | middle | strong | middle, one worker per scene |
| Checks | small | small | small (sound effects too) |
| Review | middle | middle | strong director, middle picture and sound reviewers |
| Rework | strong | strong | middle, per scene |
| Register | small | small | small |

**small**, **middle** and **strong** stand for the user's current fast, balanced and most capable models; write the actual model names into `models`, keyed by step as in the [course](../assets/templates/style.json) or [picture-book](../assets/templates/picture-book/style.json) template (a picture book's keys name its roles: `script`, `kit`, `scenes`, `sound`, `director`, `reviewers`). Without subagents one agent does every step on its own model, and the table only records that. The user can change a row at any time; later chapters follow the table as it stands.

## 6. style.json

Start from [the template](../assets/templates/style.json). Blocks are grouped by ability, not by tier; a tier is just which blocks are present:

| Block | What it holds | Present in |
|---|---|---|
| `schema`, `tier`, `book` | schema version; `1`, `2`, `"custom"` or `"picture"`; title, slug, language, readers, pilot chapter | all |
| `words` | the user's own words about the look, verbatim, with later feedback that changed the bar | all |
| `look` | palette, what each colour means, text and maths fonts, notation and rounding | all |
| `voice` | TTS engine (`edge`, or `kokoro` when Edge is unavailable or local audio is wanted), voice, rate | all |
| `pacing` | minutes per chapter, where checks and practice go | all |
| `engine` | engine source and version used to build the book | all |
| `scenes` | art style, cast, how storyboards are reviewed | tier 2 |
| `components` | shared elements: name, file, what each does | tier 2, tier 1 when the book has some |
| `images` | where images may come from, credit rules | tier 2 |
| `models` | the model for each step, as agreed in §5 | all |
| `illustration` | a picture book's look, budget, cast and sets ([stories.md](stories.md#intake-for-a-story)) | picture books |
| `courses` | the course options chosen ([courses.md](courses.md)) | when chosen |
| `approved` | chapters the user approved and what each shows well | filled as chapters are approved |

Leave out blocks the tier does not use. New kinds of book add their own blocks beside these; a reader that meets a block it does not know reads it as plain intent. Increase `schema` only when an existing field changes meaning.

Deliver the pilot with a choice: approve and make the rest of the book (recommended when it is good), approve and stop here, or one of two or three concrete changes you would make yourself. Fold the answer and any feedback into `words` and the affected block, and add an approved chapter to `approved`. Approved chapters are the strongest anchor: later chapters watch and read them as worked examples.

When continuing, write `chapters.md` (a table `| # | Title | Pages | Minutes | Status |`, status planned, ready or user-approved) and go on with the remaining chapters.
