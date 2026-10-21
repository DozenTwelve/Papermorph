# Assets: shared components and chapter needs

What a book's pictures are made of comes from its content and the look the user chose, never from a default set. Two levels keep that consistent without making every book look alike.

## Book level: the element library

During intake ([intake.md](intake.md)) the shared components are proposed to the user with how each is made, and their look is agreed. Build each once into the book's library, `site/<book>/lib/<name>.js` (loaded after `engine.js`), drawn around its own origin and placed with `put`, with a short API (`f.set(x, y, len, angle, label)`, `actor.stride('walk', dist)`, `actor.hand()`). List it under `components` in `style.json`: name, file, one line on what it does. A fix to a shared element lifts every chapter at once, so after changing one, compare frames of approved chapters before and after. Keep chapter-specific drawing in the chapter; promote it when a second chapter needs it.

## Chapter level: needs noticed while storyboarding

Laying out a chapter's moments shows what the library lacks: a new prop, a place, a real photograph or map. Draw it in the chapter when code can; otherwise add it to `books/<book>/images/image-requests.md` (what, where it appears, size and view, style, licence needed) for the user or a sourcing pass. Anything that turns out to recur moves into the library.

## Mechanics, whatever the style

- Incoming files go to `books/<book>/images/inbox/` with `SOURCES.md` (origin URL, author, licence). Prefer public-domain or CC0/CC-BY; record attribution for anything that requires it.
- A processing script in `books/<book>/images/` turns them into `site/<book>/img/` (crop, recolour, scale, compress), so every output can be rebuilt; `SKILL/scripts/sprites.py` has the common steps: integer nearest-neighbour scaling, colour mapping, pixel art from text rows, and assembling frames into one sheet with a JSON layout. Credits for the published images go in `site/<book>/img/CREDITS.md`.
- Sprite animation: put a character's frames in one sheet and switch frames by changing a nested `<svg>`'s viewBox; changing an `<image href>` per frame can refetch. Pixel art is drawn at an integer scale with `image-rendering: pixelated` and pre-scaled files.
- One large detailed object (a planet, a map) is cheaper as a single image than as many shapes; see the Firefox notes in [engine.md](engine.md#performance-firefox).

Pictures from an image model (sets and props for picture books, and any other book that agrees a budget) go through `paint.py` and `painted.py`; see [painting.md](painting.md).
