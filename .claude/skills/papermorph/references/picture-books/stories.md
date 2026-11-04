# Picture books: from a story to an episode

A picture book is a two-to-four-minute animated film of paper puppets in front of sets, made from a story: a fairy tale, a joke, something that happened to the user, or a story book's PDF. On the shelf at https://papermorph.diamonddoge.org/: *The Little Horse Crosses the River* and *Little Red Riding Hood* (everything drawn in code, a cast voiced by ElevenLabs, a listen-and-find stop; the newest and the bar) and *Joke Collection* (painted sets, puppets in code; a series of episodes).

This file covers the story, the shots, the sound and the team; [puppets.md](puppets.md) the paper puppets and the stop-motion look; [painting.md](painting.md) sets and props painted by an image model. The engine, player, checks, voices and music are shared with every book ([core/sound.md](../core/sound.md), [core/review.md](../core/review.md), [core/engine.md](../core/engine.md)).

## Contents

- Intake for a story
- The order of work
- The book folder
- The script comes first
- Scenes, shots, cuts
- Sound
- Listen and find
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
uv run --with numpy python "$SKILL/scripts/sfx.py" "site/$BOOK/ch01/audio/sfx" knock chime room
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

- **Mouths** follow the words: `mouths.py` turns each line's word timings into mouth shapes (a Chinese or Japanese line opens and shuts once per character), and `lips(q, scene, pre, line…)` picks the frame's shape. Edge's word times run about a tenth of a second ahead of the sound (`eleven.py`'s are heard times and stay put); `mouths.py` and `join.py` move Edge's mouths and captions that much later and shut the mouth where the clip's sound stops, so a lip flap that leads or trails the voice is worth reporting.
- **One clip per scene.** `join.py` joins a scene's lines into one clip with short pauses, and inserts silence where the action needs room (`line@T+S`: S seconds of silence T seconds into the line, after a word's sound has ended rather than where the next word begins) or after the last line (`name:S`, a stare or a tag). Gaps for a held stare, a fly landing, a class turning round belong here, not in rushed animation. `--words` writes every word's time in the scene clip beside the narration, for scene authors to time actions against (the beat clock adds the scene's `pre`).
- **One script for the whole sound**, `tools/<book>/audio.sh`, rerun after any change: lines replaced by hand, `mouths.py`, level fixes, `join.py` with its holes, caption edits. Join arguments typed only in a terminal have had to be read back out of `shots.js`.
- **Levels.** `level.py` runs right after `tts.py` and before `join.py`, at its default −18 LUFS ([core/sound.md](../core/sound.md#levels)); `eleven.py` levels to a film's −14 unless told, so a cast voiced there takes `--lufs -18` (*The Little Horse*'s `audio.sh`). The line the joke hangs on must not be the quietest; one that must sit above the rest (a quiet old man's punchline) gets its own target (`level.py o1.mp3 --lufs -15`) and stays out of the others' list.
- **Sounds a voice makes.** A speaking animal (a dog's "Woof!") came out best as an Edge voice shouting the word, trimmed and normalized; synthesized barks lost to it. A whispered "Shh." is shaped pink noise, not Edge's voiced "shh-uh". Write such a clip over the line's MP3 and set its `dur` in `timings.js` before joining.
- **Effects and music** go on the scene clock (`sfx(scene, t, …)`, `music(…, [scene ids], …)`). When silence is the joke, `window.MUSIC_OFF = { scene: t => … }` fades the music out for the stare.
- **Captions** are on at a reader's first visit (`chapter.html` does this); after that the reader's own choice is remembered. A caption ends at the first real pause after its words; a hole inside a sentence keeps it up. When that gives words away before they are said (a punchline after a pause), split the caption at the hole in `shots.js` and hold a punchline's caption into the silence after it; do it in the audio script after `join.py`, so a rerun keeps it.

## Listen and find

A picture book for young children learning a language can stop and play a finding game in the picture: the character asks for one thing at a time ("Can you find the bird? Touch it!"), the child touches it, and it hops, shows **bird** in big letters and says it. *The Little Horse Crosses the River* stops twice (by the river, at the mill), *Little Red Riding Hood* once (in the meadow, after the wolf has gone). It suits a story read to children of about four to seven who are learning the words; each stop is a pause in the film, so one or two per episode, at a moment where the story rests, never inside a joke's timing. Offer it when the user's readers are young language learners; most picture books have none.

**The words.** Three or four things to ask for, and every other thing the child can see in that picture listed too, because a child taps what catches the eye: six to eight concrete nouns in all, things the child probably half knows (tree, flower, basket, bird, butterfly, sun). Each should be a whole thing drawn clearly apart from the others, so the child finds it and the word plainly belongs to it; a part too small to find (a coat's button) or an idea (*quiet*) has nothing to point at. The word is the whole lesson: no translation, no sentence beyond the ask. The beat's narration is one line in the narrator's voice that tells the child what to do ("Help her look! Listen, and touch what she asks for."); then the character speaks.

**The beat.** It is an `ask` beat with `findWords(things, asks, done)` as its ask, so the chapter is a film with a question: `film: true` in `CHAPTER` keeps its music and effects, and `questionKeys: false` keeps a lesson's question keys out of the help ([core/engine.md](../core/engine.md#player)); the kit's `chapter.html` has both. The scene fills the things each time it builds the picture; `g` is what the child taps: a puppet's `g`, a `prop()`, or, for something painted into a baked set, a transparent shape laid over it (a rectangle, or a path traced round an odd outline such as a winding path or a pond). The asks are in order, the last one found leads on (Little Horse's last ask is the ox, and the next scene opens on "There's Uncle Ox!"):

```js
let MEADOW = [];   // the things, filled by scene4w
function scene4w(p, D) {
  const cam = paperCam(p, 'meadow');
  const tree = mk('rect', { x: 90, y: 120, width: 260, height: 560, fill: 'transparent' }, cam.stage);   // painted into the set
  const basket = prop(cam.stage, BASKET), red = kidPuppet(cam.stage, { coat: '#c94a3c' });
  MEADOW = [{ g: basket, word: 'basket', side: 'right' }, { g: tree, word: 'tree' }, { g: red.g, word: 'Red Riding Hood', clip: 'q-me', talk: true }];
  stopClock(D, (q, f) => {
    cam.apply(q, f);
    tf(basket, 'translate(640 700)');
    // in the game (q > D) she says the lines findWords gives her, and blinks only between them
    red.pose({ x: 900, y: 800, mouth: q > D ? findMouth() : 'X', shut: !FIND.saying && q % 4 > 3.85 }, f);
  });
}
// in BEATS:
const FIND_MEADOW = [{ word: 'tree', clip: 'q-tree' }, { word: 'basket', clip: 'q-basket' }];
['scene4w', 'In the meadow', (m, D) => scene4w(panel(0), D), { lead: false, pre: PRE4W, ask: done => findWords(MEADOW, FIND_MEADOW, done), video: false }],
```

Once the narration is over the character asks for the first thing. Every thing answers a tap, with a hit box at least 120 px square (a child's finger on a phone; smaller boxes lie on top of bigger ones) that follows its thing every frame, so a target may be a puppet that walks or a bird that flies. A wrong thing hops, shows its word and says its own name, then the short ask comes again ("Where's the bird?"); nothing is ever called wrong. Each miss helps more: at the second the thing asked for shakes, from the third paper stars circle it; a tap on nothing leaves a ripple, and two of those count as a miss. A tap anywhere inside the asked thing's box finds it, even where a smaller thing lies on top. With no tap for 5 s it shakes, and if nobody finds it in 20 s the character says "Look! There it is!" and it counts as found, so a child who never taps is never stuck. A found thing hops, shows its word, says it and chimes; after the last one comes the praise and the film goes on by itself. A new tap cuts off whatever was being said, so lines never pile up. Tab or ← → reach the things from the keyboard and Enter or Space taps; Enter otherwise skips the stop. Where the word would cover something the child should see, give the thing a side: `{ g: basket, word: 'basket', side: 'right' }` (or `'left'`, `'above'`, `'below'`). A book with its own early-reader typeface sets `--word-font` in `lib/book.css`.

**The character acts it.** While the page waits, the scene's `stopClock` runs on past the beat's end (q > D), so pose everyone as a function of `q` that keeps living there: a breath, a blink every few seconds, a bird pecking along a branch. While the character speaks, `FIND.saying` names the clip and `findMouth()` gives its mouth for this frame; turn the eyes to the child while it asks, to `FIND.target` (the thing asked for) while it waits, and to `findSaw()` (the thing just found, for a moment after). A scene can do more with a found thing by watching `FIND.found`: Red's flower flies into her bouquet, and any flower in the meadow counts as the flower, because the scene wraps the one the child touches into the single `g` it gave `findWords` (`site/little-red-riding-hood/ch01/scene4w.js`). The hop and the shake are the CSS `translate` property, which adds to the transform the scene sets every frame; a thing the scene moves through a parent can copy it (`getComputedStyle(g).translate`, as the mill's wheel does in Little Horse's `scene8.js`).

**The clips** are plain narration entries, voiced with the rest (`tts.py` or `eleven.py`), each played alone and left out of `join.py`'s list; run `level.py` on them with the other clips. The things' names in the narrator's voice: `"w-bird": "bird"` makes `audio/<lang>/w-bird.mp3` (a thing's clip is `'w-' + its word`, lower case, spaces as hyphens; `clip:` names another). In the character's voice: each ask (`clip:` of the ask, "Can you find the bird? Touch it!"), its short ask again (`r-bird`, "Where's the bird?"; `again:` names another), the praise (`q-done`, "You found them all!"), the give-up line (`q-there`, "Look! There it is!"), and the character's own answer when tapped (`q-me`, "That's me!", with `talk: true`, so the mouth moves). `findWords(things, asks, done, { end, there })` names other praise and give-up clips (Little Horse's river stop ends on `q-uncle`). The character's lines are captioned from their timings when captions are on, so their entries need cues as every clip's do. The chime is `audio/sfx/chime.mp3` (`sfx.py chime`).

**The video.** `export.py` cannot tap, and a game is no fun to watch: give the stop's beat `video: false`, or `video: S` to keep its lead-in line and cut there, and the video goes straight on to the next scene ([core/publish.md](../core/publish.md#video-export)).

**Check it** as a child would. `?beat=N` opens the beat; play its narration and wait: nothing is tappable until it ends. Then play the game in the browser by mouse and by keys: a wrong thing, nothing, the right thing; miss three times and watch the help grow; wait out a give-up. Does every word sit beside its thing and not over it, does every clip sound, does the character's mouth move with its lines and its eyes go where they should, does the film go on after the praise? Seek out of the beat in the middle of a line and back: no box, word or caption may stay behind. `lint.py` names a clip that is missing, and the page warns in the console about a thing with no word, an element that is not on the stage or not in the picture, a clip that will not load and a side it does not know, which `check.py` lists.

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

The series page is the book's `index.html`, made from [series.html](../../assets/templates/picture-book/series.html): its hero picture and Watch button open the first episode (both work without scripting); with one episode that is the whole page, with two or more a list below shows each episode's still, title, line and a mark on episodes already watched. The hero's `img/cover.webp` is not shown again, so once there is a list, give episode 1 a different frame as its still. A still is one frame saved as a 1400×788 WebP: `shot.py chNN --out books/<book>/review/stills sceneN:S --webp 1400 --name still-chNN --url http://localhost:8765/<book>/` writes it without the player's controls (beside a full-size PNG); copy the WebP to `site/<book>/img/`. The page's header shows `img/cover.webp`, a still too: the first episode's, or a frame the user picks, until the series has a picture of its own.
