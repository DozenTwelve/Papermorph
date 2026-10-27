# Intake: from a PDF to one agreed chapter

A short conversation that ends with one chapter the user agreed to try, a tier, the look and `style.json`. How to ask, the models step and the file itself are in [core/style.md](../core/style.md); this file is what a textbook needs settled.

## 1. Welcome and the PDF

Greet briefly as Papermorph. Look for PDFs in the working folder and its subfolders (then the user's Downloads and Desktop) and ask "Is it this one?", listing up to four candidates; if none turn up, offer to search another folder or take a path. Choose a short slug and place the file at `books/<book>/book.pdf`, a copy or a link.

## 2. What this book is

Run the split ([lessons.md](lessons.md#pipeline)) and read the contents, the preface and the `text.md` of two or three chapter openings across the book. Say in two or three sentences what the book is: subject, readers, how it teaches. Then offer two or three chapters to try, one line each on what they would show, recommending a representative one rather than the gentlest opening (a light introduction can pass while hiding the hard problems). A section of a long chapter is fine.

If the book is for a course, notice it here: a book that cites other works can get links from the works named on screen to their sources; questions that must be reviewed before release, an item bank; a book going into an LMS, the SCORM package. None is on by default ([courses.md](courses.md)).

## 3. Tier

Offer the animation tiers as reference points, linking the books at https://papermorph.diamonddoge.org/ that show each:

1. **Diagrams that change**: symbols, number lines, graphs and shapes built in code, rearranged as the narration explains (the maths books, `site/elementary-algebra/` and `site/math-notebook/`). The lightest; a smaller model can do most steps.
2. **Illustrated scenes**: characters act out the idea, the camera moves, external images and a storyboard before motion (the science book, `site/science/`). Several times the work of tier 1 per chapter, and the picture step wants a strong model.
3. **Custom**: the user describes what they want; you judge which abilities it needs and say so.

Recommend one from the chapter's content: abstract and procedural ideas fit tier 1 ([diagrams.md](diagrams.md)), physical and narrative ones tier 2 ([scenes.md](scenes.md)). Any tier may mix per beat.

Then start the book folder (`new_book.py lesson <book>`, [core/publish.md](../core/publish.md#start-a-book-folder)): the look is settled on real frames, so the engine, the chapter page and the voice must be in place first.

## 4. The look, by tier

**Tier 1** needs few decisions. Propose palette, fonts, language and voice from the book itself. Make the chapter's narration and its first one or two beats at real size ([lessons.md](lessons.md#chapter-loop), steps 2–3) and capture a few key frames with `strip.py`. Show the sheet and ask: go ahead as it is (recommended), or one of two or three concrete changes (calmer, more colour, larger type …). Once agreed, settle the models ([core/style.md](../core/style.md#models)), write `style.json` and make the chapter.

**Tier 2** has more to settle; ask in rounds:
1. Art and sources: drawn in code, pixel scenes, illustrated, real images; whether web images (with credits) are acceptable. For the recurring characters, propose two or three casts that suit the book, one line each.
2. Shared components: list what this chapter and its neighbours will draw again and again (in the science book: force arrows, crates, the actors), each with what it must do and how it would be made. Offer them as one multiple-choice question of which to build once for the whole book, recommending the ones that recur most ([assets.md](assets.md)).
3. The storyboard: lay out the key moments without motion and show the sheet ([scenes.md](scenes.md#storyboard-layout-first-then-motion)). Ask: add motion now (recommended), or a few concrete changes to named frames. Motion comes after the user agrees.

**Custom**: ask what the description leaves open, using the closest tier's rounds and options.

## After the pilot

Deliver the pilot with the choice in [core/style.md](../core/style.md#stylejson). When continuing, write `chapters.md` (a table `| # | Title | Pages | Minutes | Status |`, status planned, ready or user-approved) and go on with the remaining chapters.
