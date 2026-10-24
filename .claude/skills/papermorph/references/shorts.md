# Shorts: one point, under three minutes, upright, for a phone feed

A short is a narrated film on an upright 900 × 1600 stage (`<html data-stage="portrait">`), made for YouTube Shorts, TikTok, Reels or X. It makes one point in one to three minutes, with a new picture every one to three seconds: full-bleed photographs or generated pictures, big words, cut-out figures, a number counting up, a chart, a map. It is a cousin of the [documentary](documentary.md) and shares its voice, pictures, export and review; what differs is the pace, the grammar of the picture and where it ends up. The worked example is episode 1 of *Madness and Civilization* (`site/madness-shorts/ch01/`, *The Ship*), the ten-minute [documentary](documentary.md) on the shelf (`site/madness/`) recut as a series of shorts: watch it before making one, and treat it as a level to match, not a format to copy.

What is its own: the kit `assets/templates/shorts/` (`chapter.html`; `lib/shorts.js`, `book.css`, `icons.js`; fonts from the documentary kit) and the order of work below. It needs an engine with the upright stage ([engine.md](engine.md#stage-and-state)); an upright chapter is a film without questions.

## What the viewer is doing

They are scrolling. They decide in the first second whether to stay, and on the platforms' numbers that second is most of the outcome: one of our episodes opened on a generated city picture already moving, under its first line, and 57.8 % stayed past the first chance to swipe; another opened on a still card of text and 12.8 % stayed. A text card reads as a text post, and a line in a script the viewer cannot read is a wall. So the first frame is a picture in motion with the hook spoken over it, and the hook is the point itself, not a preamble ("there's a line that went viral…" spends the second that matters).

After that they stay as long as each moment gives them something new and the argument keeps moving. Background facts are where a short gets slow: compress them hardest and keep the steps of the argument.

## Questions for the user

The short is the user's argument; the Skill's work is to make it land. Ask, offering choices to click and skipping what the request already settles:

1. **The point.** What should a viewer believe or wonder about at the end? Who is the viewer (an overseas feed, a home audience), and which platform?
2. **The outline.** Ask for the user's outline before writing anything: the hook, the steps, the ending. If there is none, build the outline together; do not invent the argument. A series: its name, the episode's number, and how this episode hands on to the next.
3. **People.** How real people appear: period pictures for the dead, cut-out figures or drawings for the living, never photographs of living people's faces.
4. **Sources.** Which numbers and quotes need a source, and how strict to be about anonymous reports ("according to the Wall Street Journal…").
5. **Voice and music.** The narrator (ElevenLabs v4 through OpenRouter was the accepted voice; Edge TTS is the free option): play short samples and let the user pick. Music: generated (Lyria) or a public-domain recording ([documentary.md](documentary.md#intake) has the licence traps).
6. **Pictures and budget.** Generated pictures, found ones, or both; what each costs per episode (voice about $0.07 a minute; 94 generated pictures at low quality cost $0.84 for one three-episode series).

Then agree the models ([intake.md](intake.md#5-models): writing the script with the user is strong-model work, building beats middle, checks small) and write `style.json` with `tier: "shorts"`, the user's words, the look, the voice, the series and the models.

## The order of work

1. **The script, beat by beat, with the user.** One beat per sentence or two, written into `content/<book>/chNN/narration.en.json` with `[[mark]]` before each word a picture lands on, and beside each beat one line of what we see. Show it to the user a few beats at a time and rewrite as they answer; list each number's source under the script as you go, so the script file reads: the user's outline, the beats, the sources.
2. **The cast and the pictures**, planned from the script: who appears where, one figure per role, so that a figure coming back means something (a callback), not that the cast ran out. Note each picture's prompt or source and cost.
3. **The folder.** `engine.py site/<book>` first (it starts `lib/` with the engine and a default `book.css`), then the kit's `lib/` over it, with the documentary kit's `fonts.css` and `fonts/`; `chNN/index.html` starts from the kit's `chapter.html` (the commands are in [site.md](site.md#a-short)). The film's own pieces (its cast's sizes in `MEME`, a series card, a map) go in a second file loaded after `shorts.js` (*Madness and Civilization*: `lib/madness.js`).
4. **Voice.** `eleven.py` or `tts.py`, one clip per beat plus `timings.js`. Bring every clip to one level with `level.py --lufs -14 --peak -1.5` (one episode came out of the voice service at −23 LUFS and sank under its music). Check the marks on spoken numbers: a transcript that writes "1.4 billion" as digits misplaced two marks by 2.7 s.
5. **Music.** One track for the whole episode under every beat, `music(file, undefined, gain, .05)`. It changes by easing, at a turn of the argument, never by stopping: a dead stop on a rhetorical question felt staged to the user. A track cut to the film's length can end on the last word; a looping one is fine for a first cut. Leave `?bgm=` on the page so the user can set the level by ear; start around 0.4, which with the engine's ducking put the music about 16 LU under a −14 LUFS voice and was the level the user chose. A measurement catches gross errors; the ear decides.
6. **The beats**, built from the kit and timed to the marks; sound effects (`sfx.py whoosh bang tick thud`) under the cuts and the stamps.
7. **Watch it yourself, then a director pass.** Contact sheets of every beat (`strip.py`), the first frame on its own, a phone-sized screenshot with the platform's buttons in mind. A fresh agent on a strong model reviews the sheets against an approved episode without knowing how the beats were built ([documentary.md](documentary.md#review-rounds)); half of what it finds is usually the picture saying something other than the voice.
8. **The user watches**, you fix, and `export.py chNN --url …/<book>/` writes a 1080 × 1920 MP4 and an `.srt` (`--query tags` to show the source and AI-illustration tags). The user uploads it and ticks the platform's AI or synthetic-content box. A video over 25 MiB does not fit Cloudflare Pages; the web page itself is the light version.

## The picture

`shorts.js` holds the grammar, every helper a pure function of the beat clock:

- `shot()` a full-frame shot with a hard cut, `whip` (a sideways slide with motion blur) or `swipe` (the next clip rising as in a feed); `photo()` a full-bleed picture with a slow push;
- `word()` big condensed capitals, `label()` and `band()` caps on solid blocks, `marker()` a highlighter sweep, `vlog()` white outlined overlay text, `tag()` a source or "AI illustration";
- `meme()` a cut-out figure rising in, `swarm()` one crossing then a crowd of them, `stamp()` a rubber stamp slammed on, `counter()` a number counting up, `priceTag()`, `phoneCard()`, `ico()` and `icons()` (Phosphor, MIT), `bar()`, `clipImg()`;
- `shortsBeat` turns a beat tuple into the engine's beat with every cue `LEAD` (0.22 s) early: a cut that lands on the word itself reads as late.

What made the first shorts work:

- **One idea per shot, one to three seconds a shot**, full bleed; words inside x 50–810, y 130–1290, since the platform draws its title, caption and buttons over the rest.
- **Say it literally.** When the narration describes a mechanism, draw each link as the voice names it. The "everyone is cheap" loop read as a vague circle until it became three people, each handing the next their product and its price, A to B, B to C, C back to A.
- **Numbers move.** A count, a bar growing, a price tag swapped: a number on screen arrives the moment it is said.
- **A series says where it is.** A few seconds after the hook: the series card with this episode lit ("1 · The Ship"), then the argument.
- **The ending points on.** The last beat answers the hook and names the next episode.

## Later

Scripts to come: cutting one music track to an episode's timeline (beats on the music's own beat, the end on the last word), generating music with Lyria, and measuring voice against music the way `export.py` mixes them.
