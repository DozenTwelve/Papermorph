# Accessibility

This page says what the books on the shelf do for readers who use a keyboard, captions, a screen reader or reduced motion, and where they fall short. Every lesson, picture book, documentary and short plays in the same player (`engine/`), so most of it holds for all of them.

## In the player

**Keyboard.** Every control has a key, and <kbd>?</kbd> shows the list:

| Key | Does |
|---|---|
| <kbd>Space</kbd> | Play or pause |
| <kbd>←</kbd> <kbd>→</kbd> | Previous or next step (<kbd>Shift</kbd> during a question) |
| <kbd>Home</kbd> | Start over |
| <kbd>C</kbd> | Captions on or off |
| <kbd>&lt;</kbd> <kbd>&gt;</kbd> | Slower or faster |
| <kbd>F</kbd> | Full screen |
| <kbd>1</kbd>–<kbd>6</kbd>, <kbd>T</kbd> <kbd>F</kbd>, <kbd>↑</kbd> <kbd>↓</kbd>, <kbd>Enter</kbd>, <kbd>S</kbd>, <kbd>Esc</kbd> | Answer a question: choose, true or false, move between rows, check, show the answer, leave an answer box |

Letter keys also work on a layout that types other letters, such as Cyrillic: the same physical key does the same thing. The buttons can also be reached with <kbd>Tab</kbd> and show a clear outline when focused.

**Pause, step and speed.** A chapter can be paused anywhere and stepped back and forth one step at a time; the bar under the picture jumps to any step. Speed runs from 0.75× to 1.5×, and the voice and picture stay together at every speed. Questions don't have a time limit: the player stops at each one and waits. In a listen-and-find game nothing is ever called wrong; the picture helps more after each miss.

**Captions.** Captions of the narration are off by default and turn on with <kbd>C</kbd> or the CC button. The choice is remembered, as are speed and progress, in the reader's own browser. Lines spoken in another language are subtitled even with captions off. A chapter exported as an MP4 comes with an `.srt` file.

**Sound.** There is a volume control. If sound can't play, the player says so and the chapter goes on with its on-screen text.

**Screen readers.** The buttons are named in the interface language; play and captions say whether they are on, and the speed button says the speed. Question cards are ordinary page text and buttons, answer boxes are labelled, and right or wrong is announced. In a listen-and-find game each thing to find is a button named with its word.

**Reduced motion.** With the system's reduce-motion setting on, the player stops its own interface animation: cards, answer feedback, the mascot, the cover and page transitions. The contents pages stop theirs. Scroll stories show each step's finished picture, and explorable maps move to a place at once instead of panning.

**Languages.** The player's interface comes in English, Russian, Chinese, Japanese and Arabic, set by the page's language. Arabic reads right to left; the picture and the step bar keep their left-to-right layout so that the arrow keys mean the same in every language. The books on the shelf today all have English interfaces.

**Colour.** On the default dark board the main text has a contrast of about 12:1 and the dimmer text about 6:1. Right and wrong are said in words and marks (✗), not only in colour.

## Known limits

- **The animation itself isn't described.** A chapter's picture is drawn in SVG (or, in scroll stories, a canvas), and a screen reader gets it as one image with the chapter's title. Captions aren't announced as they change. A reader who can't see the screen gets the narration as sound, and misses what the picture shows that the voice doesn't say.
- **Films and picture books lead with sound.** Their meaning is in the voices. Captions cover the narration and dialogue, not music or sound effects.
- **Reduced motion doesn't still the chapter's own animation.** The scenes play as they were made; pause and step through them instead.
- **Each book picks its own colours.** A book can set its own palette, and no tool checks its contrast.
- **Safari and iOS are less tested.** Our automated checks run in Chromium and Firefox. Phones and tablets work, but get less testing than desktop browsers.

## Reporting a barrier

If something on a book page stops you, open a [bug report](https://github.com/DozenTwelve/Papermorph/issues/new?template=bug.yml) with the page, your browser or assistive technology, and what got in the way, or write to [a972848363@gmail.com](mailto:a972848363@gmail.com).
