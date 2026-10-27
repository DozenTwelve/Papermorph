# Cover, contents and unit sketches

A textbook's `index.html` is its cover and contents; a picture book or a film uses the series page instead.

## Cover and contents (`index.html`)

One page: no hash or `#book` shows the cover, `#references` the reference list, `#contents` or `#chNN` the contents; a lesson's home button returns to `#chNN`, and the card grows into the lesson frame through a view transition. Keep cover → contents → chapter navigation and the return from contents to cover working.

- Edit the title, kicker, lede, the faint chalk phrases on the cover (a few formulas or lines from the book) and the `<title>`.
- The page's script calls `Contents.book({ start, units, hues })` (the engine's `lib/contents.js`; shared styles in `lib/contents.css`):
  - `units`: `[unit title, [[chapter title, minutes], …]]`; chapters are numbered in order from `start` (`{ unit: 1, chapter: 1 }`; a book whose scope starts mid-way, e.g. at unit 3, chapter 9, keeps the original numbers).
  - Add a chapter when its lesson is ready, and set the previous chapter's `CHAPTER.next = '../chNN/'`.
  - A unit's optional third entry `{ unit, chapter, sample: true }` renumbers it and marks it as a sample, left out of the chapter count.
  - To show different numbers than the folders, add `label` to `start` (`{ unit: 1, chapter: 9, label: 1 }` shows ch09 as 1) and set the same `CHAPTER.label` in each lesson, which its title screen and completion card show.
  - A chapter's own third entry `{ chapter }` changes only the number on its card; `{ href, chapter }` links a card to another book's chapter, outside this book's count and progress (`href` on a unit's entry does it for the whole unit).
- `hues`: one colour per unit, cycling.
- A book that cites works gets a `#references` view ([courses.md](courses.md#citations)).
- A book with its own look overrides the tokens of `lib/contents.css` (`--board`, `--chalk`, `--top-bg`, …) in a `<style>` after it, as the template's comment shows, rather than copying the stylesheet into the page.

## Unit sketches (`unit-art.js`)

Give each unit a small sketch of its own ideas in the unit colour, with one gentle topic-related loop, using the agreed asset approach. Keep the left third light for the title on phones; check the finished contents once at 1440 px and 390 px. Classes and loop examples are in `unit-art.js`; the shared header styles, off-screen pausing and reduced motion live in the engine's `lib/units.css` and `lib/units.js` (`Units.header`, `Units.watch`).
