# Narration, voices, effects and music

Voices carry every book and everything else sits under them: in early cuts music and effects buried the lines, and viewers noticed that first. Each tier's own use of sound is in its file (a picture book's mouths and scene clips in [stories.md](../picture-books/stories.md#sound), a film's tracks in [films.md](../films/films.md#voice-and-music)); this file is the shared part.

## Contents

- The narration file
- Voices
- Length from words
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

- `[[name]]` goes right before the word an action waits for; `m('name', offset)` in the page returns when that word starts. Names are unique within a beat; a misspelt mark makes the page throw, and a mark that matches no spoken word stops the voice script.
- Write for the ear: short sentences, one idea each. Say symbols, units and numbers in words ("negative seven halves", "meters per second squared"); the picture shows the symbols. Plain and warm, never childish.
- A wordless beat (a series card, an end card) needs no clip, `timings.js` entry or narration line: `{ dur: 2 }` in its fourth slot ([core/engine.md](engine.md#timing)); `lint.py`, `export.py`, `music.py` and `check.py` take it as silence. A time only the page needs goes in the page, not in `timings.js`, which the next voice run rewrites.

## Voices

- **`tts.py`** (free): `uv run --with edge-tts SKILL/scripts/tts.py <narration.json> site/<book>/chNN/audio/<lang>` writes `<beat>.mp3` and `timings.js` (duration, marks, captions) and caches each finished beat beside the narration file: moving `[[marks]]` reuses the cache, and after a failure the same command resumes. At a few seconds a beat, a long chapter can outlast a tool's foreground time limit: run it in the background and wait for it before `lint.py`.
  - `"engine": "edge"` (default, online) or `"kokoro"` (local, Apache 2.0, English word timings; voices such as `am_michael`, `af_heart`, `bm_george`; `uv run --python 3.12 --with kokoro …`), set at the top of the narration file with `voice` and `rate`. Keep one engine and voice per book (per character in a picture book).
  - Edge's `...MultilingualNeural` voices guess the language sentence by sentence and read a short line such as "No zero, no fractions, no negatives." with a Spanish or Portuguese accent; a book in one language uses a one-language voice of that language (`en-US-AndrewNeural`, as the kits do). The reference lesson books were voiced with `en-US-AndrewMultilingualNeural` and have such lines; their voice is not the one to copy.
  - Arabic: Edge's Saudi voices `ar-SA-HamedNeural` and `ar-SA-ZariyahNeural` (`edge-tts --list-voices` lists other countries'). Their word timings match the text as written, diacritics (إِنَّ), Arabic-Indic digits (٥) and inline maths (x + 3 = 7) included, so `[[marks]]` work as in English, and `؟` ends a caption as `?` does. The service refuses an old `edge-tts` (HTTP 403 at the handshake); `uv run --with edge-tts` takes the current one.
- **`eleven.py`** (ElevenLabs v4 through OpenRouter, paid, an OpenRouter key): the voice the reference films and picture books use. It writes the same clips and `timings.js`; the page cannot tell them apart.
  - Voice and model come from `--voice` and `--model`, else from the narration file's `voice` and `model` (an ElevenLabs voice name such as `george`; the kits' files name an Edge voice).
  - It prints the cost before paying (`--dry` stops there; prices and the shared balance are in [core/style.md](style.md#paid-steps)) and caches paid clips (a rerun costs nothing); `--only beat,beat` makes a fresh, paid take of those beats alone.
  - A sped-up voice (`--tempo 1.1`, or `"tempo"` in the narration file) is sped before levelling and alignment, and stays sped on a rerun. `--max-pause 0.3` shortens its sentence pauses (0.4 to 1.0 s) before the marks are placed.
  - v4 audio tags such as `[cackles]` are acted, not read, and left out of the captions and of `lint.py`'s comparison of narration and page.
  - Every word's heard time also goes in the `.timings.json` beside the narration, as `tts.py` writes it, so a picture book's `mouths.py` and `join.py --words` work on its clips (a cast of ElevenLabs voices: *The Little Horse Crosses the River*); those times need no Edge correction, and both scripts know it.
  - Its word alignment (local faster-whisper) matches Chinese and Japanese character by character, so a mark there can sit before any character. The transcript writes spoken numbers as digits; `eleven.py` matches them back and prints the marks a rerun moved, but check marks on numbers: a missed one lands late (up to 0.75 s).
- **Several voices.** List them under `voices` in the narration file and write each line as `{"speaker": name, "text": …}`; a line without a speaker takes the file's own `voice`, and a speaker missing from `voices` stops the run, naming it. Both scripts do this. Voices need pitches apart (a dog at 113 Hz under a 110 Hz narrator read as the same person).
- Let the user pick a voice by ear from a few short samples in the book's own words: a small narration file of two or three of the book's lines per candidate voice, voiced with `tts.py` (free) or `eleven.py` (paid: `--dry` quotes it first), the clips handed over to play. When the user is away and the agent cannot listen, choose voices whose pitches lie apart (measure the clips' pitch, as [several voices](#voices) need), record the choice as the agent's own in `words` for the user to review, and keep the samples so they can listen later. ElevenLabs' preset voices have no old woman; such a part takes a pitch or tempo treatment of another voice, named as such.
- **A placeholder voice** (Edge until a paid voice is ready) is cheap only if the acting is keyed to words: time every action to a `[[mark]]` or to a word's time, never to seconds counted in a clip, since the paid take puts every word somewhere else ("I am!" took 1.87 s in Edge and 0.9 s in ElevenLabs).

## Length from words

A length the user asks for becomes a word count before the script is written: minutes × 60 × the pace below, less what the tier adds. A script written to the minute is cheaper to cut on paper than after a paid voice run.

| Book | Voice | Words a second | What else adds time |
|---|---|---|---|
| Lesson | Edge `en-US-AndrewNeural` (or the Multilingual voice the reference books use) at −4 % | about 2.4 of voice (reference chapters 2.3–2.7) | `HOLD` (0.6 s) after each beat, about 15 s per question ([core/publish.md](publish.md#every-book)) |
| Picture book | an ElevenLabs cast | about 2.6 of voice (*The Little Horse* 2.62, *Little Red Riding Hood* 2.64) | each scene's `pre`, the holes `join.py` inserts, a listen-and-find stop's wait |
| Documentary | Edge `en-GB-RyanNeural` (the documentary kit's) at −4 % | about 2.4 of finished film, holds and titles included (*Tulip Mania*: 475 words ran 3:19 in 18 beats; 445 words at +4 % ran 3:04) | already counted |
| Short | an ElevenLabs narrator | about 2.6 of voice | about 1.4 s a beat: the hold (0.6 s) and the camera's tail (0.8 s in the worked example) |
| Short | Edge `en-US-AndrewNeural` (the shorts kit's) at +4 % | about 3.2 of voice (128 words in 39.6 s in one test) | the same 1.4 s a beat |

So three minutes of documentary is about 430 words, and a twelve-beat short of 300 words at ElevenLabs' pace runs about 115 + 17 s. A book read nearly whole runs longer than its tier's usual length: *Millions of Cats*' 1,000 words are about 6.5 minutes of voice before any holds. Another voice or rate changes the pace: voice a paragraph of the book and divide.

## Levels

`level.py <clips>` brings clips to one loudness under a limiter without moving a word, and leaves an already level clip, or one under 0.4 s, as it is, so it can be rerun: it keeps the best of its tries and never makes a clip worse than it was, so a second run changes nothing or brings a clip nearer. A clip whose sharp peaks the limiter holds back from the target gets a WARNING with how far off it is. A film's voice goes out at −14 LUFS with its peak under −1.5 dBTP: `eleven.py` levels its clips and prints what it delivered (the service alone gives about −23 LUFS, which sank one episode under its music; `--lufs` for another level, `--no-level` to keep the service's); after `tts.py`, run `level.py --lufs -14 --peak -1.5`. A picture book's scene clips sit at `level.py`'s default −18 LUFS ([stories.md](../picture-books/stories.md#sound)). A lesson has no music to sit over: Edge gives its clips at about −21 LUFS, within a dB of each other, and the reference lesson books play them as they come; run `level.py --lufs -21` only on a clip that stands out (a take from another engine, a quiet re-voice). A film's music is levelled by `music.py cut` ([Music](#music)), and the exported video as a whole by `export.py` ([core/publish.md](publish.md#video-export)). A line that must sit above the rest gets its own target and stays out of the others' list, so a rerun leaves it alone; `--gain` adds again on every run, so it suits a one-off fix.

## Sound effects

Effects and music play in films and picture books; a lesson with questions keeps them silent (a film with interactive moments sets `CHAPTER.film`, [core/engine.md](engine.md#player)), so a lesson's sound ends at its voices and captions.

`sfx.py` synthesizes effects as small MP3s, free and consistent (knock, door, creak, bell, chop, crash, coin, rain, wind, room tone, surf, gulls, crickets, footsteps, a dog, whoosh, bang, tick, thud and more; `--list` names them all). A sound it lacks goes in the book's own `books/<book>/sfx_recipes.py`, passed with `--recipes`: each top-level function without required arguments is a recipe named after it, returning samples at `sfx.SR`, built from sfx's own helpers (details in the script's header). Keep them soft and natural: the first rain, a high hiss, read as scary; pink noise with patter and taps on umbrellas read as rain.

- Place an effect on a beat's clock with the engine's `sfx(beat, t, name, volume)` (in a picture book each scene is a beat): it plays `audio/sfx/<name>.mp3` when the beat's clock passes `t` in normal playback, at half volume under the voices (vol 2 is full); a pause holds it, a seek stops it and the next beat stops it. A seek past `t` fires nothing, and an effect past the beat's end never plays. Effects are fetched and decoded when `sfx()` is called, before the first click; one still loading when it is due plays late, from its start, for up to a second. Cut an effect to its shot: six seconds of rain under a one-second shot spills into the next.
- A bed (wind, room tone, a river, a park's 10 s `birds`) is called once with `{ loop: true }`: `sfx(scene, 0, 'river', .5, { loop: true })` lays the file again every its length less half a second (`BED_OVERLAP`), so a file with soft ends (about 0.3 s) overlaps its seams, and runs to the end of the scene however long it is, through a film's wait for the reader too (a listen-and-find stop); a seek or a late load joins it where it would be. `{ loop: true, to: t }` stops it at `t` on the scene's clock, where the picture cuts somewhere it does not belong (the forest outside, then Grandma's room inside: Little Red Riding Hood's `scene5.js`). Room tone runs under the silences too, where its absence is heard first. A long sound played once (a 6 s thunder roll) goes in `SFX_BED` with its length (`SFX_BED.thunder = 6`), or takes the length as `sfx()`'s fifth argument, so a seek joins it part-way.

## Music

`music(file, beats, gain, fade)` in the chapter page, one call per track, loops a track under the listed beats. Music does not stop dead mid-scene: carry it to the end or fade it, and bring an earlier theme back when the story returns to an earlier place.

- **How it plays.** `beats` is all of them by default; called above `BEATS`, it takes them all when `boot()` runs, and a listed id that `BEATS` lacks is named in a console warning. The track's place is the length of its earlier beats as they really ran plus the clock: a beat under music gives back from its closing hold the time the clock stood still (a clip getting going), so the film keeps the music's time. It ducks to 30 % for the whole beat, voice or not, and rises to 70 % only in the `pre` lead-in of the beats listed in `window.MUSIC_UP_IN_PRE` (`true` for all) and while a film waits for the reader, where it plays on and is not pulled back for the time it ran on; it crossfades over `fade` s (0.8; 0 is a cut, and the next beat's tracks take over after a wait as usual). `window.MUSIC_OFF = { beat: t => true }` fades it out for a moment (a silence that is the joke). A pause holds its level.
- **On phones and slow networks.** Effects and music go through one Web Audio graph started by the reader's first touch, click or key, so ducks, fades and the volume slider reach them on phones too (on iOS the slider does not reach the narration). When a clip loading or buffering holds the clock, the music runs on, then eases back (5 % slower or faster), or jumps back once if it is more than a second out. Safari and every iOS browser stall a media element at each speed change, so there the music keeps the film's speed and is put back by a seek once it is a quarter second out, aimed ahead by the lag it showed after the last one.

- **Where it comes from.** Use tracks the book may redistribute (generated for it, or openly licensed) and credit them. `commons.py --audio` finds public-domain recordings. A composition can be centuries old while its recording is still protected: Commons marks some 1950s–60s recordings public domain under EU rules the US does not follow (protected there until 2067), and `commons.py`'s licence check cannot see this. Prefer recordings their performers released (PDM-owner, CC0), Musopen, or US military bands. The Skill does not generate music; a generated track the user brings is cut like a recording.
- **Cut to the film.** `music.py cut SRC site/<book>/chNN/audio/bgm/NAME.mp3 chNN --url …/<book>/` cuts a recording so its last note lands on the film's end (the last moment it is within 10 LU of its body, so a long decay rings past the end; `--end` sets it by hand) and levels it to −16 LUFS. `--rests` splices out its rests and `--even` evens out its quiet phrase ends (a generated track usually needs it too: its quiet passages fall into the voice's gaps just as a recording's do); `--lift T` raises a hole neither fixes. The cut fits one length: after any change to a beat's length, cut again (`gaps` says "recut"). A film whose video leaves out or shortens beats (`video`) or holds its waits is another length as an MP4 than on the page, and the run prints both: `--video` cuts it for the MP4.
- **Level by ear, check by measure.** Leave `?bgm=` on the page so the user can set the level by ear; start around 0.4: with the ducking to 30 %, a −16 LUFS track then sits about 20 LU under a −14 LUFS voice, the level chosen by ear for the reference shorts. The gain is relative to the track's own loudness, so give both. `music.py gaps chNN --url …` lists the bed's loudness in each voice-free gap and after the last word and marks the holes. It plays the bed as the engine does, over the whole film: every track under its own beats, looping where the film is longer, silent in `MUSIC_OFF` moments (marked as meant, not as holes). It names the beats where a film waits for the reader: the music runs on there, so after a wait the track is further on than measured. `--mp4` measures the export the same way, on the video's timeline. A measurement catches gross errors; the ear decides.

## Captions and other languages

- Captions come from the narration and appear as their words are heard; a beat's last caption clears a second after its narration.
- **Lines in other languages** are spoken by a native voice of their language (Edge has Japanese, Chinese, Korean and more) and subtitled in the book's language: write the beat's `"sub"`, the original and the translation in brackets. The voice script marks such a line (its voice's locale differs from the narration file's language), so the page shows its subtitle even with captions off, the way films subtitle foreign dialogue.
