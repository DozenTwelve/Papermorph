# Authoring a chapter

## Shape

Chapters have run 5–18 minutes with 5–40 second beats; a long chapter can hold several parts (each a short title beat, lessons, a quick check and a wrap). Let the content set the length and the number of checks and practice sets.

| Beat | Purpose |
| --- | --- |
| `intro` | Title card (unit and chapter number, title, one line of purpose). |
| lesson beats | One idea each, built up in the picture while the narration explains it. |
| `q1`, `q2`, … | A check of already taught content, separated from the next check by a lesson beat. |
| `wrap` | Three or four numbered takeaways. |
| `final1` … | Full-screen practice covering the whole chapter. With several sets, label them like `'Chapter practice · set 1 of 2'` (the engine appends "· question k of n"). |
| `finish` | Score card (`finishCard`): first-try results for quick checks and practice. |

Beat ids are shared by the page (`BEATS`) and the narration file; a beat with `ask` waits for the answers before moving on ([questions.md](questions.md)).

## Beats

List the beats before writing code. For each lesson beat decide what the eye watches and what changes; why that change is true (the animation is the argument); which words trigger which actions (the `[[marks]]`); what text appears, beside the thing it names; and what carries over from the previous beat. Then storyboard the key moments ([diagrams.md](diagrams.md), [scenes.md](scenes.md)).

- **Open on the subject.** When a beat clears the picture, the new topic appears right away; labels and steps follow the words. Short pauses for thought are fine.
- **One new thing at a time**, and **the same colour means the same thing** across the chapter and, where it fits, the book.
- **Teach the chapter's scope**, choosing sections by idea; note any reordering in `chapters/chNN.md`.

## Narration

The file format, `[[marks]]`, writing for the ear and the voice scripts are in [core/sound.md](../core/sound.md#the-narration-file). A lesson adds:

- Explain why, not only how.
- Question beats get one short line ("Quick check. Find the mean."); the card holds the question ([questions.md](questions.md)).

## Content rules

- Follow the agreed chapter scope and order. Verify the facts, calculations and answers the finished lesson uses; correct or replace source errors and note them in `books/<book>/chapters/chNN.md` for the user.
- Check worked examples as the subject, not only as arithmetic (a push on someone standing on the ground is not the net force).
- Use the notation and rounding in `look.notation` of `style.json`, and record new shared decisions there. Group thousands with a no-break space (U+00A0) or the book's comma: a thin space all but vanishes in bold system fonts (150 000 000 read as 150000000).
