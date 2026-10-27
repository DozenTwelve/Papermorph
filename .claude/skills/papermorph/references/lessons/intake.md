# Intake: from a PDF to one agreed chapter

A short conversation that ends with one chapter the user agreed to try, a tier, the look and `style.json`. How to ask (choices to click, the user's words kept verbatim), the models step and the file itself are in [core/style.md](../core/style.md); this file is what a textbook needs settled.

When the user brings a story, a joke or a fairy tale instead (or a story book's PDF), it becomes a picture book ([stories.md](../picture-books/stories.md#intake-for-a-story)); a book, an idea or a stretch of history to explain as a film, or one point for a phone feed, goes to [films.md](../films/films.md#intake).

## 1. Welcome and the PDF

Greet briefly as Papermorph. Look for PDFs in the working folder and its subfolders (then the user's Downloads and Desktop if none are found) and ask "Is it this one?", listing up to four candidates. If none are found, offer to search another folder or to take a path. Choose a short slug and place the file at `books/<book>/book.pdf`, a copy or a link.

## 2. What this book is

Run the split ([lessons.md](lessons.md#pipeline)) and read the contents, the preface and the `text.md` of two or three chapter openings across the book. Say in two or three sentences what the book is: subject, readers, how it teaches. Then offer a chapter to try: name two or three candidates with one line each on what they would show, recommending one that is representative rather than the gentlest opening (a light introduction can pass while hiding the hard problems). A section of a long chapter is fine.

If the book is for a course, notice it here: when it cites other works (author–year citations, named studies), offer links from the works named on screen to their sources; when its questions must be reviewed before release, offer an item bank; when it goes into an LMS, mention the SCORM package. None is on by default ([courses.md](courses.md)).

## 3. Tier

Offer the animation tiers as reference points; the books at https://papermorph.diamonddoge.org/ show each of them; link them.

1. **Diagrams that change**: symbols, number lines, graphs and shapes built in code, rearranged as the narration explains (the maths books, `site/elementary-algebra/` and `site/math-notebook/`). The lightest; a smaller model can do most steps.
2. **Illustrated scenes**: characters act out the idea, the camera moves, external images and a storyboard before motion (the science book, `site/science/`). Several times the work of tier 1 per chapter, and the picture step wants a strong model.
3. **Custom**: the user describes what they want; you judge which abilities it needs and say so.

Recommend one from the chapter's content: abstract and procedural ideas fit tier 1 ([diagrams.md](diagrams.md)); physical and narrative ones fit tier 2 ([scenes.md](scenes.md)). Mixing per beat is allowed under any tier.

Then start the book folder (`new_book.py lesson <book>`, [core/publish.md](../core/publish.md#start-a-book-folder)): the look is settled on real frames, so the engine, the chapter page and the voice need to be in place first.

## 4. The look, by tier

**Tier 1** needs few decisions. Propose palette, fonts and the language and voice from the book itself. Then make the chapter's narration and its first one or two beats, laid out at real size ([lessons.md](lessons.md#chapter-loop), steps 2–3), and capture a few key frames with `strip.py`. Show the sheet and ask: go ahead as it is (recommended), or one of two or three concrete changes (calmer, more colour, larger type …). Once agreed, settle the models ([core/style.md](../core/style.md#models)), then write `style.json` and make the chapter.

**Tier 2** has more to settle; ask in rounds:
1. Art and sources: drawn in code, pixel scenes, illustrated, real images; whether web images (with credits) are acceptable. The recurring characters: propose two or three casts that suit the book, each in one line.
2. Shared components: list the things this chapter, and the chapters around it, will draw again and again (in the science book: force arrows, crates, the actors), each with what it must do and how it would be made. Offer them as one multiple-choice question, recommending the ones that recur most, for which to build once for the whole book ([assets.md](assets.md)).
3. The storyboard: lay out the key moments without motion and show the sheet ([scenes.md](scenes.md#storyboard-layout-first-then-motion)). Ask: add motion now (recommended), or a few concrete changes to named frames. Motion comes after the user agrees.

**Custom**: ask what the description leaves open, using the closest tier's rounds and options.

## After the pilot

Deliver the pilot with the choice in [core/style.md](../core/style.md#stylejson). When continuing, write `chapters.md` (a table `| # | Title | Pages | Minutes | Status |`, status planned, ready or user-approved) and go on with the remaining chapters.
