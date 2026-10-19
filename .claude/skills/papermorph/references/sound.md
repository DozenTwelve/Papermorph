# Sound for picture books

Voices carry the story; everything else sits under them. In early cuts the music and effects were loud enough that the lines got lost ("说话的声音听不见"), and that was the first thing the user noticed.

## Voices

- **One voice per character.** List them under `voices` in `narration.<lang>.json` and write each line as `{"speaker": name, "text": …}`; `tts.py` synthesizes every line (Edge voices, with rate and pitch: children were adult voices sped up and pitched up). The narrator is a voice too.
- **Lines in other languages** are spoken in their own language by a native voice (Edge has Japanese, Chinese, Korean and more) and subtitled in the book's language. The caption shows both: the original and the translation in brackets.
- **Mouths** follow the words: `mouths.py` turns each line's word timings into mouth shapes, and `lips(q, scene, pre, line…)` picks the shape for the frame.
- **One clip per scene.** `join.py` joins a scene's lines into one audio clip with short pauses, and inserts silence where the action needs room (`line@T+S`: S seconds of silence T seconds into the line). Gaps for a held stare, a fly landing, a class turning round belong here, not in rushed animation. Changing a line means `tts.py`, `mouths.py` and `join.py` again.

## Sound effects

`sfx.py` synthesizes effects (knock, door, bell, chop, bang, bonk, thud, crash, coin, beep, rain, crickets and more) as small MP3s, free and consistent. Keep them soft and natural: the first rain was a high hiss and read as scary; pink noise with patter and taps on umbrellas read as rain. An effect is placed on the scene clock with `sfx(scene, t, name, volume)` and plays at half volume under the voices; it stops when playback pauses. Cut an effect to its shot: a six-second rain under a one-second shot spills into the next.

## Music

Music is optional and goes under everything: about 70 % of its own level, ducking to 30 % while anyone speaks, fading in and out over most of a second. Give a scene silence when silence is the joke. Don't let music stop dead in the middle of a scene; carry it to the end or fade it, and bring an earlier theme back when the story returns to an earlier place. Use tracks the book may redistribute (generated for the book, or openly licensed) and credit them.

## Captions

Picture books turn captions on at a reader's first visit (`chapter.html` does this); the reader's own choice is remembered after that.
