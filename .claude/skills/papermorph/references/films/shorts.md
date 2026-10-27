# Shorts: one point, under three minutes, upright, for a phone feed

A short is a narrated film on the upright 900 × 1600 stage (`<html data-stage="portrait">`, [core/engine.md](../core/engine.md#stage-and-state)), made for YouTube Shorts, TikTok, Reels or X. It makes one point in one to three minutes, with a new picture every one to three seconds: full-bleed photographs or generated pictures, big words, cut-out figures, a number counting up, a chart, a map. What differs from a documentary is the pace, the grammar of the picture and where it ends up; intake, the folder, pictures, maps, voice, team and review are shared in [films.md](films.md). An upright chapter is a film without questions. The worked example is *Madness and Civilization* episode 1, *The Ship* (`site/madness-shorts/ch01/`), the ten-minute documentary recut as a series: watch it before making one, as a level to match, not a format to copy.

The kit is `assets/templates/shorts/` (`chapter.html`, `narration.en.json`, `style.json`; `lib/shorts.js`, `book.css`, `icons.js`; fonts from the documentary kit).

## Contents

- What the viewer is doing
- Questions for the user
- From a long film
- The order of work
- The picture

## What the viewer is doing

They are scrolling. They decide in the first second whether to stay, and on the platforms' numbers that second is most of the outcome: one of our episodes opened on a generated city picture already moving, under its first line, and 57.8 % stayed past the first chance to swipe; another opened on a still card of text and 12.8 % stayed. A text card reads as a text post, and a line in a script the viewer cannot read is a wall. So the first frame is a picture in motion with the hook spoken over it, and the hook is the point itself, not a preamble ("there's a line that went viral…" spends the second that matters).

After that they stay as long as each moment gives them something new and the argument keeps moving. Background facts are where a short gets slow: compress them hardest and keep the steps of the argument.

## Questions for the user

The questions are the films' intake ([films.md](films.md#intake)): the point and who watches on which platform, the user's outline (a series: its episodes and each one's point), people, sources and disputed claims, voice and music, pictures and budget. Writing the script with the user is strong-model work, building beats middle, checks small.

## From a long film

When the user wants a film that already exists recut as shorts (*Madness and Civilization* became four), the argument is there: its script is the outline, and its checked quotes, found pictures, voice and music carry over. The first questions change: how many episodes, where the film's turns divide them, and what each episode's one point is. Propose the split and episode 1's outline together, then go on as below. Read the film's `style.json`, its narration and its `SOURCES.tsv` before asking anything they already answer. Where a short's habits and the film's differ, ask the user: the documentary's one Fool through the centuries is a recurring figure, which the short's one figure per role would break.

## The order of work

1. **The script, beat by beat, with the user.** Keep it in `books/<book>/chNN-script.md`: the agreed outline, a table of beats (the narration, one line of what we see, and its rough length), and each number's and quote's source under it. Show it to the user a few beats at a time and rewrite as they answer.
   - Length: words ÷ the voice's pace (about 2.6 words a second for an ElevenLabs narrator), plus about 1.4 s a beat for the engine's hold after the words (0.6 s) and the camera's tail (0.8 s in the worked example); a twelve-beat script ran 17 s longer than its words. A background beat over about eight seconds is where the short will feel slow; shorten it before the voice is paid for. Once voiced, the length hides in the voice's sentence pauses: `eleven.py --max-pause 0.3` took one episode from 112 s to 107 s.
   - The beats' narration, with `[[mark]]` before each word a picture lands on, goes into `content/<book>/chNN/narration.en.json`; keep the two in step.
2. **The storyboard, then the cast and the pictures.** One line per shot, a shot every one to three seconds, under each beat of the script: that is the list of pictures to make or find, and a beat-by-beat plan is too coarse for it (one director pass asked for three pictures the plan had missed). Then make or find them ([films.md](films.md#pictures)).
3. **The folder** ([films.md](films.md#the-folder)). The series' own pieces (its cast's sizes in `MEME`, a series card) go in a second file loaded after `shorts.js`. Every episode but a series' last sets `CHAPTER.next`: the end card names the next episode, and the player offers it only when `next` is set.
4. **Voice**: `eleven.py` or `tts.py` at −14 LUFS ([core/sound.md](../core/sound.md#voices)). Wordless beats (a series card, an end card) take `{ dur: 2 }` and no line, and the music stays ducked under them. Check the marks on spoken numbers: a number the matcher missed lands late (seven marks in one episode, up to 0.75 s).
5. **Music.** One track for the whole episode under every beat, `music(file, undefined, gain, .05)`. It changes by easing, at a turn of the argument, never by stopping: a dead stop on a rhetorical question felt staged to the user, and so did a classical recording's rests and quiet phrase ends falling into the voice's pauses, which `music.py cut --rests --even` takes out ([core/sound.md](../core/sound.md#music)). A looping track is fine for a first cut. Start `?bgm=` around 0.4, the level the user chose for episode 1.
6. **The beats**, built from the kit and timed to the marks; sound effects (`sfx.py whoosh bang tick thud`) under the cuts and the stamps. A beat ends at its last tween plus the hold, so the kit's habit of pushing a picture past the voice (`photo(s, …, 0, D + .6)`) lengthens the beat by as much: two beats with the same voice can differ by what their tweens overrun. `?lengths` on the page prints each beat's voice against its length on screen. Two mirrored beats (two answers treated alike) get the same seconds with `{ minDur }` set to the longer one's length.
7. **Watch it yourself, then the director rounds** ([core/review.md](../core/review.md), [films.md](films.md#review-rounds)). Look at the first frame on its own, upright as the feed shows it: `shot.py chNN --out books/<book>/review/first 0:0.3 --clean --url http://localhost:8765/<book>/` writes the bare 900 × 1600 stage; look at it with the platform's title, caption and buttons in mind. Measure what a script can: a shot held still too long (`still.py chNN --min 2`), a number that lands after it is said, words outside the safe area (`safe.py chNN --query tags`, sampled across every beat; the contact sheets hid nine such words in one episode; `strip.py` and `shot.py` take `--query tags` too, to see the tags the export will show). A push too gentle to see (1.0 to 1.08 over six seconds) reads as a dead frame on a phone and on a contact sheet alike: on a shot that long, push at least about 15 %, or cut.
8. **The user watches**, you fix, and `export.py` writes a 1080 × 1920 MP4 and an `.srt` ([core/publish.md](../core/publish.md#video-export)). On an upright film it shows the source and AI-illustration tags, since the video leaves the page that credits them (`--no-tags` leaves them out). The user uploads it and ticks the platform's AI or synthetic-content box. A video over 25 MiB does not fit Cloudflare Pages; the web page itself is the light version. A series card's still is upright too: `shot.py … --webp 600` writes a 600 × 1067 WebP of the stage.

## The picture

`shorts.js` holds the grammar, every helper a pure function of the beat clock:

- `shot()` a full-frame shot with a hard cut, `whip` (a sideways slide with motion blur) or `swipe` (the next clip rising as in a feed); `photo()` a full-bleed picture with a slow push, centred; `found()` the same for a found photograph, tagged with its source; `wide()` a camera across a landscape picture whose subject is off-centre, never showing an edge; `plate()` a picture placed whole on the ground (sizes from `img/art.js`). A picture whose point is its text (a sign, a headline) goes in whole with `plate()`: an upright crop of a shop sign left "Y. WE / RARY CLOS";
- `word()` big condensed capitals (a word wider than its `maxW`, 660, is set smaller, so it and its stroke stay in the safe area), `label()` and `band()` caps on solid blocks, `marker()` a highlighter sweep, `vlog()` white outlined overlay text, `srcTag()` a source or "AI illustration";
- `meme()` a cut-out figure rising in, `swarm()` one crossing then a crowd of them, `stamp()` a rubber stamp slammed on, `counter()` a number counting up, `priceTag()`, `phoneCard()`, `ico()` and `icons()` (Phosphor, MIT), `bar()`, `clipImg()`;
- its palette (`DARK`, `RED`, `LIGHT`, `MUTED`, …, set in `lib/book.css` as `--dark`, `--red`, …), fonts (`SANS`, `SERIF`) and small tools (`inkW()` text width, `ramp01()`, `seeded()`) are named apart from the documentary kit's `film.js`, so a short can load `film.js` too when it wants a documentary helper (`pic()`, `say()`, `traced()`): load it before `shorts.js`;
- `shortsBeat` turns a beat tuple into the engine's beat with every cue `LEAD` (0.22 s) early: a cut that lands on the word itself reads as late.

What made the first shorts work:

- **One idea per shot, one to three seconds a shot**, full bleed; words inside x 50–810, y 130–1290, since the platform draws its title, caption and buttons over the rest.
- **Say it literally.** When the narration describes a mechanism, draw each link as the voice names it. The "everyone is cheap" loop read as a vague circle until it became three people, each handing the next their product and its price, A to B, B to C, C back to A.
- **Numbers move.** A count, a bar growing, a price tag swapped: a number on screen arrives the moment it is said. A big denominator can be drawn literally: "2 in 100,000" as a field of 100,000 dots in one SVG `<pattern>` fill with the two real circles over it played at 17 ms a frame in both browsers.
- **A series says where it is.** A few seconds after the hook: the series card with this episode lit ("1 · The Ship"), then the argument.
- **The ending points on.** The last beat answers the hook and names the next episode.

Scripts to come: cuts on the music's own beat, and generating music with Lyria.
