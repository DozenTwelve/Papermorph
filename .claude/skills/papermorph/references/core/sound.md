# Narration, voices, effects and music

Voices carry every book; everything else sits under them. In early cuts the music and effects were loud enough that the lines got lost, and that was the first thing viewers noticed. How each tier uses sound is in its own file (a picture book's mouths and scene clips in [stories.md](../picture-books/stories.md#sound), a film's tracks in [films.md](../films/films.md#voice-and-music)); this file is the shared part.

## Contents

- The narration file
- Voices
- Levels
- Sound effects
- Music
- Captions and other languages

## The narration file

`content/<book>/chNN/narration.<lang>.json`, one entry per beat (each kit has a sample):

```json
{ "voice": "en-US-AndrewNeural", "rate": "-4%",
  "beats": { "intro": "Chapter five. [[sub]]Subtraction undoes addition.", "...": "..." } }
```

- `[[name]]` goes right before the word an action waits for; `m('name', offset)` in the page returns when that word starts. Names are unique within a beat; a misspelt mark makes the page throw, and a mark that matches no spoken word makes the voice script stop.
- Write for the ear: short sentences, one idea each. Say symbols, units and numbers in words ("negative seven halves", "meters per second squared"); the picture shows the symbols. Match the audience: plain, warm, never childish.
- A wordless beat (a series card, an end card) needs no clip, no `timings.js` entry and no narration line: `{ dur: 2 }` in its fourth slot ([core/engine.md](engine.md#timing)); `lint.py`, `export.py`, `music.py` and `check.py` take it as silence. A time only the page needs goes in the page, not in `timings.js`, which the next voice run rewrites.

## Voices

- **`tts.py`** (free): `uv run --with edge-tts SKILL/scripts/tts.py <narration.json> site/<book>/chNN/audio/<lang>` writes `<beat>.mp3` and `timings.js` (duration, marks, captions) and caches each finished beat beside the narration file: moving `[[marks]]` reuses the cache, and after a failure the same command resumes. It takes a few seconds a beat, so a long chapter can outlast a tool's foreground time limit: run it in the background and wait for it before `lint.py`.
  - `"engine": "edge"` (default, online) or `"kokoro"` (local, Apache 2.0, English word timings; voices such as `am_michael`, `af_heart`, `bm_george`; `uv run --python 3.12 --with kokoro …`), set at the top of the narration file with `voice` and `rate`. Keep one engine and voice per book (per character in a picture book).
  - Edge's `...MultilingualNeural` voices guess the language sentence by sentence and read a short line such as "No zero, no fractions, no negatives." with a Spanish or Portuguese accent; a book in one language uses a one-language voice of that language.
- **`eleven.py`** (ElevenLabs v4 through OpenRouter, paid, an OpenRouter key): the voice the user chose for the films. It writes the same clips and `timings.js`; the page cannot tell them apart.
  - It takes the voice and model from `--voice` and `--model`, else from the narration file's `voice` and `model` (an ElevenLabs voice name such as `george`; the kits' files name an Edge voice).
  - It prints the cost before paying (`--dry` stops there; about $0.07 a minute, quote it), keeps paid clips cached (a rerun costs nothing), and `--only beat,beat` makes a fresh, paid take of those beats alone.
  - A voice sped up (`--tempo 1.1`, or `"tempo"` in the narration file) is sped before levelling and alignment, and stays sped on a rerun. `--max-pause 0.3` shortens its sentence pauses (0.4 to 1.0 s) before the marks are placed.
  - v4 audio tags such as `[cackles]` are acted, not read, and left out of the captions and of `lint.py`'s comparison of narration and page.
  - Its word alignment (local faster-whisper) assumes words split by spaces, so a Chinese or Japanese film needs `tts.py` for now. The transcript writes spoken numbers as digits; `eleven.py` matches them back and prints the marks a rerun moved, but check marks on numbers, since a missed one lands late (up to 0.75 s).
- **Several voices.** List them under `voices` in the narration file and write each line as `{"speaker": name, "text": …}`; a line without a speaker takes the file's own `voice`, and a speaker missing from `voices` stops the run, naming it. Both scripts do this. Voices need pitches apart (a dog at 113 Hz under a 110 Hz narrator read as the same person).
- Let the user pick a voice by ear: play a few short samples in the book's own words.

## Levels

`level.py <clips>` brings clips to one loudness under a limiter without moving a word, and leaves an already level clip, or one under 0.4 s, as it is, so it can be rerun. A film's voice goes out at −14 LUFS with its peak under −1.5 dBTP: `eleven.py` levels its clips and prints what it delivered (the service alone gives about −23 LUFS, which sank one episode under its music; `--lufs` for another level, `--no-level` to keep the service's); after `tts.py`, run `level.py --lufs -14 --peak -1.5`. A picture book's scene clips sit at `level.py`'s default −18 LUFS ([stories.md](../picture-books/stories.md#sound)). A line that must sit above the rest gets its own target and stays out of the others' list, so a rerun leaves it alone; `--gain` adds again on every run, so it suits a one-off fix.

## Sound effects

`sfx.py` synthesizes effects as small MP3s, free and consistent (knock, door, creak, bell, chop, crash, coin, rain, wind, room tone, surf, gulls, crickets, footsteps, a dog, whoosh, bang, tick, thud and more; `--list` names them all). A sound the list lacks goes in the book's own `books/<book>/sfx_recipes.py`, passed with `--recipes`: each top-level function without required arguments is a recipe named after it, returning samples at `sfx.SR`, built from sfx's own helpers (the script's header has the details). Keep them soft and natural: the first rain was a high hiss and read as scary; pink noise with patter and taps on umbrellas read as rain.

- Place an effect on a beat's clock with the engine's `sfx(beat, t, name, volume)` (in a picture book each scene is a beat); it plays at half volume under the voices (vol 2 is full), a pause holds it and the next beat stops it. Cut an effect to its shot: a six-second rain under a one-second shot spills into the next.
- A long bed (wind, room tone, the 10 s `birds` of a park) is listed in `SFX_BED` with its length (`SFX_BED.birds = 10`), so a seek into the middle joins it part-way; a bed that loops overlaps its seams by about half a second; room tone runs under the silences too, where its absence is heard first.

## Music

`music(file, beats, gain, fade)` in the chapter page, one call per track ([core/engine.md](engine.md#player) has the mechanics): it ducks to 30 % for the whole of every beat, voice or not, rises to 70 % in the `pre` lead-in of the beats in `window.MUSIC_UP_IN_PRE`, crossfades over `fade` seconds (0.8; 0 is a cut), and `window.MUSIC_OFF = { beat: t => … }` fades it out for a moment. Music does not stop dead mid-scene: carry it to the end or fade it, and bring an earlier theme back when the story returns to an earlier place.

- **Where it comes from.** Use tracks the book may redistribute (generated for the book, or openly licensed) and credit them. `commons.py --audio` finds public-domain recordings. A composition can be centuries old while its recording is still protected: Commons marks some 1950s–60s recordings public domain under EU rules that the US does not follow (protected there until 2067), and `commons.py`'s licence check cannot see this. Prefer recordings their performers released (PDM-owner, CC0), Musopen, or US military bands. Generated music (Lyria) is made outside the Skill for now.
- **Cut to the film.** `music.py cut SRC site/<book>/chNN/audio/bgm/NAME.mp3 chNN --url …/<book>/` cuts a recording so its last note lands on the film's end (the last moment it is within 10 LU of its body, so a long decay rings past the end; `--end` sets it by hand) and levels it to −16 LUFS. `--rests` splices out its rests and `--even` evens out its quiet phrase ends (a generated track usually needs it too: its quiet passages fall into the voice's gaps just as a recording's do), `--lift T` raises a hole neither fixes. The cut is made for one length: after any change to a beat's length, cut again (`gaps` says "recut").
- **Level by ear, check by measure.** Leave `?bgm=` on the page so the user can set the level by ear; start around 0.4: with the ducking to 30 %, a track at −16 LUFS sits about 20 LU under a −14 LUFS voice, the level the user chose for the first short. The gain is relative to the track's own loudness, so give both. `music.py gaps chNN --url …` lists the bed's loudness in each voice-free gap and after the last word and marks the holes; `--mp4` measures the export the same way. A measurement catches gross errors; the ear decides.

## Captions and other languages

- Captions come from the narration and appear when their words are heard. A beat's last caption clears a second after its narration.
- **Lines in other languages** are spoken in their own language by a native voice (Edge has Japanese, Chinese, Korean and more) and subtitled in the book's language: write the beat's `"sub"`, the original and the translation in brackets. The voice script marks such a line (its voice's locale differs from the narration file's language), so the page shows its subtitle even with captions off, the way films subtitle foreign dialogue.
