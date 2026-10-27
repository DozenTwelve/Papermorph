# Picture books: from a story to an episode

A picture book is a two-to-four-minute animated film of paper puppets in front of sets, made from a story: a fairy tale, a joke, something that happened to the user, or a story book's PDF. On the shelf at https://papermorph.diamonddoge.org/: *Little Red Riding Hood* (everything drawn in code) and *Joke Collection* (painted sets, puppets in code; a series of episodes).

This file covers the story, the shots, the sound and the team; [puppets.md](puppets.md) the paper puppets and the stop-motion look; [painting.md](painting.md) sets and props painted by an image model. The engine, player, checks, voices and music are shared with every book ([core/sound.md](../core/sound.md), [core/review.md](../core/review.md), [core/engine.md](../core/engine.md)).

## Contents

- Intake for a story
- The order of work
- The book folder
- The script comes first
- Scenes, shots, cuts
- Sound
- Team
- Review rounds
- Delivering

## Intake for a story

Ask as [core/style.md](../core/style.md#asking) says, skipping whatever the telling already settles:

1. **The story itself.** Let the user tell it in their own words and keep that telling untouched in `books/<book>/story.md`. Ask what is true and must stay (a real joke has one real punchline), who the people are, where it happens, what language each person speaks.
2. **The look** is the user's choice; there is no house style. Paper puppets moved in code ([puppets.md](puppets.md)) have worked best so far, so offer them first, in two ways, and welcome any other idea:
   - *Painted world, paper actors* (recommended when an image budget is fine): an image model paints the sets and everything that stays still; the puppets and anything that moves stay in code (Joke Collection, under a dollar of pictures per episode). Ask for a budget ceiling and keep to it ([painting.md](painting.md)).
   - *Paper, all in code*: sets and props drawn as SVG paper too. No image cost, plainer, very consistent (Little Red Riding Hood).
3. **Language and voices**: the narration language, one voice per character ([core/sound.md](../core/sound.md#voices)).
4. **A series or one film.** A series shares cast, sets and the series page; each episode is a chapter (`chNN`).

Then agree on the models ([core/style.md](../core/style.md#models)) and write `style.json` from [the picture-book example](../../assets/templates/picture-book/style.json): `tier: "picture"`, the user's words, the look, a voice per character, an `illustration` block (the sets, the budget, the cast with a line each), the models, and later the approved episodes. It holds this book's choices so its episodes match each other; another book can look entirely different.

## The order of work

1. Intake, then the script and storyboard, shown to the user.
2. Start the folder.
3. Sound: voices, mouth shapes, one joined clip per scene with its word times, sound effects ([Sound](#sound)).
4. Sets: sketch them in `sets.js`, bake them, and for a painted look paint them from the baked sketches ([painting.md](painting.md)).
5. The cast and the scenes, one script per scene ([puppets.md](puppets.md)); bake the puppet pieces.
6. Review rounds, then the user's viewing, then registering the episode.

## The book folder

`books/<book>/` holds `story.md` (the user's telling, verbatim), `storyboard.md` and `art/` (`sets.js` with the set sketches, generated pictures, `painted.json`, `costs.tsv`). `site/<book>/lib/` holds the paper kit (`paper.js`, `cast.js`, `shared.js` from `assets/templates/picture-book/`) beside the engine, and `img/` the baked sets, props and puppet pieces; each episode `chNN/` has one script per scene and `audio/<lang>/`, `audio/sfx/`, `audio/bgm/`. The book's `index.html` is the series page.

`python3 SKILL/scripts/new_book.py picture <book>` makes it ([core/publish.md](../core/publish.md#start-a-book-folder)): the series page, the kit, `ch01/` with the sample `scene1.js`, `sets.js` and `painted.json` in `books/<book>/art/` (the second only for a painted look), and an empty `img/puppets/baked.js` that stands in until `bake_puppets.py` has run. Then the sound and the pictures, in this order, with the preview server on 8765:

```sh
BOOK=jokes; A="site/$BOOK/ch01/audio/en"; N="content/$BOOK/ch01/narration.en.json"
uv run --with edge-tts python "$SKILL/scripts/tts.py" "$N" "$A"
python3 "$SKILL/scripts/level.py" "$A"/*.mp3
python3 "$SKILL/scripts/mouths.py" "$N" "$A"
python3 "$SKILL/scripts/join.py" "$A" scene1=s01,s02,s02b,s03 --words "$N"
uv run --with numpy python "$SKILL/scripts/sfx.py" "site/$BOOK/ch01/audio/sfx" knock
```

Keep these commands in `tools/<book>/audio.sh` and rerun it after any narration change ([Sound](#sound)). As copied they voice the kit's sample episode, a check that the folder works; the episode's script then replaces the narration file, and its scenes the `join.py` list.

Sets are baked before the scenes are written, puppets after, since `bake_puppets.py` bakes the poses the chapters ask for; rerun either after a set or puppet part changes. A painted look paints its sets between `bake_sets.py --ref` and the scenes ([painting.md](painting.md)).

```sh
uv run --with playwright --with pillow python "$SKILL/scripts/bake_sets.py" "books/$BOOK/art/sets.js" "site/$BOOK"
uv run --with playwright --with pillow python "$SKILL/scripts/bake_puppets.py" "site/$BOOK" --url "http://localhost:8765/$BOOK/"
```

## The script comes first

Write the script and a storyboard table (`books/<book>/storyboard.md`: scene, shot, what we see, who says what) and show them to the user before building anything. A story is cheap to change on paper and expensive once animated, and almost every real failure in these books was a story failure no animation fixed.

What made the difference:

- **Set up everything the punchline needs.** In the first cut of *Breakfast in the Bathroom*, Bo's "Wanna go eat breakfast… in the bathroom?" came out of nowhere and viewers took it literally. It became a joke once the film first showed his two everyday questions, "Breakfast?" every morning at the stall and "Bathroom?" after every class, then the morning he overslept and came in starving.
- **Show the motive before the line.** Bo's stomach growls; a bun appears in a thought bubble; he glances at the door and a toilet appears beside it; the two bubbles shove each other and merge. Only then does he speak. The audience is ahead of him, which is where comedy happens.
- **Every event needs a cause the audience has seen.** The first rescue in *Little Red Riding Hood* had a woodcutter from nowhere, Grandma suddenly out of the wardrobe and the wolf flying out of the window as if Grandma had superpowers. The fix was a chain: the woodcutter chopping wood near the cottage earlier, a cut to Grandma's eye in the wardrobe crack during the questions, the cry for help, Grandma's umbrella on the wolf's head, the woodcutter blocking the door, the window the only way out, and outside, the window still broken.
- **The audience understands what the characters don't.** In *Do You Need a Bag?* the clerk speaks only Japanese and the customer only English: each line is spoken in its own language with subtitles, and a thought bubble shows the mishearing ("…REJI…?" turning into "VEGGIE?"), so the joke works for viewers who speak neither.
- **Keep the user's story.** Tighten the wording, add the small connecting moments a film needs, and list every addition for the user; don't swap their joke for another.

## Scenes, shots, cuts

One scene is one beat with one joined audio clip ([Sound](#sound)); cuts inside a scene are timed to its clock. Plan shots as a film does, because a fixed wide frame for a whole scene plays like a slideshow:

- a wide shot to say where we are, two-shots for conversations, a close-up for whoever speaks, closer and closer as tension rises (the three questions to "Grandma");
- reverse angles: whoever is in close-up has behind them what the other person sees (a separate camera on a matching set, not a zoom of the same one);
- an insert to make a detail readable (a coin on the counter, the clock, a face in a door crack);
- held silences: the beat where nobody speaks is often the joke. Blinks, eyes and a tiny head turn carry it.

Reviewers of the later episodes kept finding the same few things, all about what the viewer can read. Give every object the joke hangs on its own insert; the best episodes ran ten to fourteen shots a half minute. Keep whoever is spoken to in the shot: the listener's face is half the line. Someone following stays far enough behind that the delay itself reads; people pass in front of or behind each other, never through. A face half cut by the frame edge, or a blink on the frame that carries the joke, reads as a mistake.

Everybody in the shot stays alive and stays there: extras blink and glance about in close-ups too (an early cut lost the whole class whenever someone spoke). Between places, cut or use a paper-theatre wipe; at the end, a title card.

## Sound

Voices, levels, effects and music work as in [core/sound.md](../core/sound.md); a picture book adds a cast that speaks on screen and one clip per scene.

- **Mouths** follow the words: `mouths.py` turns each line's word timings into mouth shapes (a Chinese or Japanese line opens and shuts once per character), and `lips(q, scene, pre, line…)` picks the frame's shape. Edge's word times run about a tenth of a second ahead of the sound; `mouths.py` and `join.py` move mouths and captions that much later and shut the mouth where the clip's sound stops, so a lip flap that leads or trails the voice is worth reporting.
- **One clip per scene.** `join.py` joins a scene's lines into one clip with short pauses, and inserts silence where the action needs room (`line@T+S`: S seconds of silence T seconds into the line, after a word's sound has ended rather than where the next word begins) or after the last line (`name:S`, a stare or a tag). Gaps for a held stare, a fly landing, a class turning round belong here, not in rushed animation. `--words` writes every word's time in the scene clip beside the narration, for scene authors to time actions against (the beat clock adds the scene's `pre`).
- **One script for the whole sound**, `tools/<book>/audio.sh`, rerun after any change: lines replaced by hand, `mouths.py`, level fixes, `join.py` with its holes, caption edits. Join arguments typed only in a terminal have had to be read back out of `shots.js`.
- **Levels.** `level.py` runs right after `tts.py` and before `join.py`, at its default −18 LUFS ([core/sound.md](../core/sound.md#levels)). The line the joke hangs on must not be the quietest; one that must sit above the rest (a quiet old man's punchline) gets its own target (`level.py o1.mp3 --lufs -15`) and stays out of the others' list.
- **Sounds a voice makes.** A speaking animal (a dog's "Woof!") came out best as an Edge voice shouting the word, trimmed and normalized; synthesized barks lost to it. A whispered "Shh." is shaped pink noise, not Edge's voiced "shh-uh". Write such a clip over the line's MP3 and set its `dur` in `timings.js` before joining.
- **Effects and music** go on the scene clock (`sfx(scene, t, …)`, `music(…, [scene ids], …)`). When silence is the joke, `window.MUSIC_OFF = { scene: t => … }` fades the music out for the stare.
- **Captions** are on at a reader's first visit (`chapter.html` does this); after that the reader's own choice is remembered. A caption ends at the first real pause after its words; a hole inside a sentence keeps it up. When that gives words away before they are said (a punchline after a pause), split the caption at the hole in `shots.js` and hold a punchline's caption into the silence after it; do it in the audio script after `join.py`, so a rerun keeps it.

## Team

[core/team.md](../core/team.md)'s shape, split by scene instead of by step. The **strong** coordinator writes the script with the user and builds what every scene shares: cast, sets and their painting, the episode's helpers, the voices and the joined audio with its word times (`join.py --words`). Then it writes one brief for all scene workers:

- the story in a paragraph, and the user's words that set the bar;
- the episode kit's API, to read and not edit;
- each scene's `pre`, its holes and the word times to cut on;
- continuity: who stands where, facing whom, in the first and last frame of every scene, so the cuts match;
- where things are: each set's places for puppets and props, its camera ranges, what each pan brings into view. A painted set lands some way off its sketch (a bench seat about 30 px), so measure the places on frames of the painted set (`shot.py … --clean` gives the stage alone) and check the table on frames of every set before sending the brief (a puppet at each place, the camera at each end of its range): a table written from the sketches once put an ear off frame and feet below the ground, and five workers built on it;
- the style, the effects available, how to look at one's own work, and the reply (the shots with their times, the first and last frame, what each check showed).

One **middle** worker per scene, in parallel, writes only its own `sceneN.js`; a **small** worker synthesizes the sound effects from recipes. Before replying, a scene worker runs and reports on these, each with the book's `--url` (the screenshot scripts run with reduced motion, so the workers' browsers can run at once): a strip of its scene, with time ranges and `@o@c` for walks and hands ([core/review.md](../core/review.md#watch-it-in-motion)); full-size `shot.py` frames of its close-ups and of each moment a hand arrives; `shot.py --cuts sceneN` for its cuts in and out; `playlog.py --from sceneN --to sceneN`, since it cannot listen: is each effect on its frame, each line on a moving mouth; and `still.py chNN sceneN`, saying which still stretches are meant.

Four reviewers, report-only, in the rounds below: a **strong** director for story, comedy, staging and shots; two **middle** picture reviewers splitting the scenes; one **middle** for sound and runtime. The coordinator merges their reports ([core/review.md](../core/review.md#review-rounds)), fixes the kit itself and sends scenes back to their workers. A fresh coordinator session matters even more here: contact sheets are large, and an episode made in one long conversation spent most of its 22 million tokens rereading them.

## Review rounds

A first cut made in one pass looks like one. What lifts an episode is watching it as a director would, against the episodes the user already approved, and sending scenes back ([core/review.md](../core/review.md#review-rounds) has how rounds run).

- **Director's view**: contact sheets of the whole episode and its cut sheet (`shot.py --cuts`) beside an approved one (a series' first episode: beside its storyboard). Look for story-level causes, not glitches: does every object the joke hangs on get its own shot, is the cause shown before the payoff, are the reactions framed so they read, is the shot density close to the approved episodes', does a silence stay silent? Write a restaging for each scene that needs one: which shots, from where, on which word.
- **Picture and sound**: frame by frame for faces cut by the edge, popping poses, puppets passing through each other; sound for lines cut short, effects out of step, music over a silence.
- Restage the scenes from those notes, then look again; two rounds usually settle it.

Alone, run the same rounds yourself, one viewpoint at a time, writing each review down before changing anything.

## Delivering

The episode is a first cut for the user's viewing, not a finished film. Deliver its URL with what was made, the final script, the decisions the user should review (every line or moment you added), known problems, and the real cost of pictures. Once the user approves it, add it to `approved` in `style.json` and to the series page, and set the previous episode's `CHAPTER.next`: when an episode's last scene ends, the player marks it watched and offers the next one.

The series page is the book's `index.html`, made from [series.html](../../assets/templates/picture-book/series.html): one card per episode with a still, its title and a line, and a mark on episodes already watched. A still is one frame saved as a 1400×788 WebP: `shot.py chNN --out books/<book>/review/stills sceneN:S --webp 1400 --name still-chNN --url http://localhost:8765/<book>/` writes it without the player's controls (beside a full-size PNG); copy the WebP to `site/<book>/img/`. The page's header shows `img/cover.webp`, a still too: the first episode's, or a frame the user picks, until the series has a picture of its own.
