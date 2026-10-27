# Shorts: one point, under three minutes, upright, for a phone feed

A short is a narrated film on the upright 900 × 1600 stage (`<html data-stage="portrait">`, [core/engine.md](../core/engine.md#stage-and-state)) for YouTube Shorts, TikTok, Reels or X: one point in one to three minutes, a new picture every one to three seconds (full-bleed photographs or generated pictures, big words, cut-out figures, a number counting up, a chart, a map), and no questions. It differs from a documentary in pace, picture grammar and where it ends up; the rest is in [films.md](films.md). Watch the worked example, *The Ship* (`site/madness-shorts/ch01/`, the ten-minute documentary recut as a series), before making one.

The kit is `assets/templates/shorts/` (`chapter.html`, `narration.en.json`, `style.json`; `lib/shorts.js`, `book.css`, `icons.js`; fonts from the documentary kit).

## Contents

- What the viewer is doing
- Questions for the user
- From a long film
- The order of work
- The picture

## What the viewer is doing

They are scrolling, and decide in the first second whether to stay; on the platforms' numbers that second is most of the outcome. One episode opened on a generated city picture already moving, under its first line, and 57.8 % stayed past the first chance to swipe; another opened on a still card of text and 12.8 % stayed. A text card reads as a text post, and a line in a script the viewer cannot read is a wall. So the first frame is a picture in motion with the hook spoken over it, and the hook is the point itself, not a preamble ("there's a line that went viral…" spends the second that matters).

After that they stay while each moment gives them something new and the argument keeps moving. Background facts are where a short gets slow: compress them hardest and keep the steps of the argument.

## Questions for the user

The films' intake ([films.md](films.md#intake)): the point, who watches on which platform, the user's outline (a series: its episodes and each one's point), people, sources and disputed claims, voice and music, pictures and budget.

## From a long film

When the user wants an existing film recut as shorts (*Madness and Civilization* became four), its script is the outline, and its checked quotes, found pictures, voice and music carry over. Read its `style.json`, narration and `SOURCES.tsv` before asking anything they answer. The first questions become how many episodes, where the film's turns divide them, and each episode's one point; propose the split and episode 1's outline together, then go on as below. Where a short's habits and the film's differ, ask the user: the documentary's one Fool through the centuries is a recurring figure, which the short's one figure per role would break.

## The order of work

1. **The script, beat by beat, with the user**, in `books/<book>/chNN-script.md`: the agreed outline, a table of beats (narration, one line of what we see, rough length), and each number's and quote's source under it. Show it a few beats at a time and rewrite as they answer.
   - Length: words ÷ the voice's pace (about 2.6 words a second for an ElevenLabs narrator), plus about 1.4 s a beat for the engine's hold after the words (0.6 s) and the camera's tail (0.8 s in the worked example); a twelve-beat script ran 17 s longer than its words. A background beat over about eight seconds will feel slow; shorten it before the voice is paid for. Once voiced, length hides in the sentence pauses: `eleven.py --max-pause 0.3` took one episode from 112 s to 107 s.
   - The narration, with its `[[mark]]`s, goes into `content/<book>/chNN/narration.en.json`; keep the two in step.
2. **The storyboard, then the cast and the pictures.** One line per shot, a shot every one to three seconds, under each beat of the script: that is the list of pictures to make or find; a beat-by-beat plan is too coarse (one director pass asked for three pictures it had missed). Then make or find them ([films.md](films.md#pictures)).
3. **The folder** ([films.md](films.md#the-folder)). The series' own pieces (its cast's sizes in `MEME`, a series card) go in a second file loaded after `shorts.js`. Every episode but a series' last sets `CHAPTER.next`: the end card names the next episode, and the player offers it only when `next` is set.
4. **Voice**: `eleven.py` or `tts.py` at −14 LUFS; wordless beats (a series card, an end card) take `{ dur: 2 }`; check the marks on spoken numbers, which come late when missed (seven in one episode) ([core/sound.md](../core/sound.md#voices)).
5. **Music.** One track under the whole episode, `music(file, undefined, gain, .05)`, changing by easing at a turn of the argument, never by stopping: a dead stop on a rhetorical question felt staged to the user, and so did a classical recording's rests and quiet phrase ends falling into the voice's pauses, which `music.py cut --rests --even` takes out ([core/sound.md](../core/sound.md#music)). A looping track is fine for a first cut. Start `?bgm=` around 0.4.
6. **The beats**, built from the kit and timed to the marks; effects (`sfx.py whoosh bang tick thud`) under the cuts and the stamps. A beat ends at its last tween plus the hold, so the kit's habit of pushing a picture past the voice (`photo(s, …, 0, D + .6)`) lengthens the beat by as much, and two beats with the same voice can differ by what their tweens overrun; `?lengths` prints each beat's voice against its length on screen. Two mirrored beats (two answers treated alike) get the same seconds with `{ minDur }` set to the longer one's length.
7. **Watch it yourself, then the director rounds** ([core/review.md](../core/review.md), [films.md](films.md#review-rounds)). Look at the first frame alone, upright, with the platform's title, caption and buttons in mind: `shot.py chNN --out books/<book>/review/first 0:0.3 --clean --url http://localhost:8765/<book>/` writes the bare 900 × 1600 stage. Measure what a script can: a shot held still too long (`still.py chNN --min 2`), a number landing after it is said, words outside the safe area (`safe.py chNN --query tags`, sampled across every beat; the contact sheets hid nine such words in one episode; `strip.py` and `shot.py` take `--query tags` too, to show the tags the export will). A push too gentle to see (1.0 to 1.08 over six seconds) reads as a dead frame on a phone and a contact sheet alike: on a shot that long, push at least about 15 %, or cut.
8. **The user watches**, you fix, and `export.py` writes the upright MP4 and an `.srt` ([core/publish.md](../core/publish.md#video-export)). On an upright film it shows the source and AI-illustration tags, since the video leaves the page that credits them (`--no-tags` leaves them out). The user uploads it and ticks the platform's AI or synthetic-content box. A video over 25 MiB does not fit Cloudflare Pages; the web page itself is the light version. A series card's still is upright too: `shot.py … --webp 600` writes a 600 × 1067 WebP of the stage.

## The picture

`shorts.js` holds the grammar, every helper a pure function of the beat clock:

- `shot()` a full-frame shot with a hard cut, `whip` (a sideways slide with motion blur) or `swipe` (the next clip rising as in a feed); `photo()` a full-bleed picture with a slow push, centred; `found()` the same for a found photograph, tagged with its source; `wide()` a camera across a landscape picture whose subject is off-centre, never showing an edge; `plate()` a picture placed whole on the ground (sizes from `img/art.js`). A picture whose point is its text (a sign, a headline) goes in whole with `plate()`: an upright crop of a shop sign left "Y. WE / RARY CLOS";
- `word()` big condensed capitals (a word wider than its `maxW`, 660, is set smaller, so it and its stroke stay in the safe area), `label()` and `band()` caps on solid blocks, `marker()` a highlighter sweep, `vlog()` white outlined overlay text, `srcTag()` a source or "AI illustration";
- `meme()` a cut-out figure rising in, `swarm()` one crossing then a crowd of them, `stamp()` a rubber stamp slammed on, `counter()` a number counting up, `priceTag()`, `phoneCard()`, `ico()` and `icons()` (Phosphor, MIT), `bar()`, `clipImg()`;
- its palette (`DARK`, `RED`, `LIGHT`, `MUTED`, …, set in `lib/book.css` as `--dark`, `--red`, …), fonts (`SANS`, `SERIF`) and small tools (`inkW()` text width, `ramp01()`, `seeded()`) are named apart from the documentary kit's `film.js`, so a short can load `film.js` before `shorts.js` when it wants a documentary helper (`pic()`, `say()`, `traced()`);
- `shortsBeat` turns a beat tuple into the engine's beat with every cue `LEAD` (0.22 s) early: a cut that lands on the word itself reads as late.

What made the first shorts work:

- **One idea per shot, one to three seconds a shot**, full bleed; words inside x 50–810, y 130–1290, since the platform draws its title, caption and buttons over the rest.
- **Say it literally.** When the narration describes a mechanism, draw each link as the voice names it. The "everyone is cheap" loop read as a vague circle until it became three people, each handing the next their product and its price, A to B, B to C, C back to A.
- **Numbers move.** A count, a bar growing, a price tag swapped: a number arrives the moment it is said. A big denominator can be drawn literally: "2 in 100,000" as a field of 100,000 dots in one SVG `<pattern>` fill with the two real circles over it, played at 17 ms a frame in both browsers.
- **A series says where it is.** A few seconds after the hook, the series card with this episode lit ("1 · The Ship"), then the argument.
- **The ending points on.** The last beat answers the hook and names the next episode.

Scripts to come: cuts on the music's own beat, and generating music with Lyria.
