# Picture books: from a story to an episode

A picture book is a short animated film, two to four minutes, told by paper puppets in front of sets. It starts from a story rather than a textbook: a fairy tale, a joke, something that happened to the user, or a story book's PDF. The published examples are on the shelf at https://papermorph.diamonddoge.org/: *Little Red Riding Hood* (everything drawn in code) and *Joke Collection* (painted sets, puppets in code; a series of episodes).

The craft is in four references: this one (the story and the shots), [puppets.md](puppets.md) (the paper puppets and the stop-motion look), [painting.md](painting.md) (sets and props painted by an image model) and [sound.md](sound.md) (voices, sound effects, music). The engine, the player, previews, checks and the team are the same as for every other book.

## Intake for a story

The same spirit as [intake.md](intake.md): a light conversation, choices to click, the user's words kept verbatim. What to settle, skipping whatever the telling already settles:

1. **The story itself.** Let the user tell it in their own words and keep that telling in `books/<book>/story.md` untouched. Ask what is true and must stay (a real joke has one real punchline), who the people are, where it happens, what language each person speaks.
2. **The look** is the user's to choose; there is no house style. Paper puppets moved in code ([puppets.md](puppets.md)) are what has worked best so far, so offer them first, in two ways, and welcome any other idea the user has:
   - *Painted world, paper actors* (recommended when an image budget is fine): an image model paints the sets and everything that stays still; the puppets and anything that moves stay in code (Joke Collection, under a dollar of pictures per episode). Ask for a budget ceiling and keep to it ([painting.md](painting.md)).
   - *Paper, all in code*: sets and props drawn as SVG paper too. No image cost, plainer, very consistent (Little Red Riding Hood).
3. **Language and voices**: the narration language, one voice per character ([sound.md](sound.md)).
4. **A series or one film.** A series shares cast, sets and the series page; each episode is a chapter (`chNN`).

Then agree on the models ([intake.md](intake.md#5-models)) and write `style.json` from [the picture-book example](../assets/templates/picture-book/style.json): `tier: "picture"`, the user's words, the look they chose, a voice for each character, an `illustration` block (the sets, the budget, the cast with a line each), the models, and later the approved episodes. It holds this book's own choices so that its episodes match each other; another book can look entirely different. Then go on to the script.

## The order of work

1. Intake (above), then the script and the storyboard, shown to the user (below).
2. Start the folder ([site.md](site.md#a-picture-book)).
3. Sound: voices, mouth shapes, one joined clip per scene with its word times, sound effects ([sound.md](sound.md)).
4. Sets: sketch them in `sets.js`, bake them, and if the look is painted, paint them from the baked sketches ([painting.md](painting.md)).
5. The cast and the scenes, one script per scene ([puppets.md](puppets.md)); bake the puppet pieces.
6. Review rounds (below), then the user's viewing, then registering the episode.

## The script comes first

Write the script and a storyboard table (`books/<book>/storyboard.md`: scene, shot, what we see, who says what) and show them to the user before building anything. Changing a story on paper is cheap; once every shot is animated it is expensive, and almost every real failure in these books was a story failure that no amount of animation fixed.

What made the difference, from the books:

- **Set up everything the punchline needs.** The first cut of *Breakfast in the Bathroom* had Bo ask "Wanna go eat breakfast… in the bathroom?" out of nowhere; viewers took it literally. It became a joke once the film first showed his two everyday questions, "Breakfast?" every morning at the stall and "Bathroom?" after every class, and then the morning he overslept and came in starving.
- **Show the motive before the line.** Bo's stomach growls; a bun appears in a thought bubble; he glances at the door and a toilet appears beside it; the two bubbles shove each other and merge. Only then does he speak. The audience is ahead of him, which is where comedy happens.
- **Every event needs a cause the audience has seen.** In *Little Red Riding Hood* the first rescue had a woodcutter from nowhere, Grandma suddenly out of the wardrobe and the wolf flying out of the window as if Grandma had superpowers. The fix was a chain: the woodcutter chopping wood near the cottage earlier, a cut to Grandma's eye in the wardrobe crack during the questions, the cry for help, Grandma's umbrella on the wolf's head, the woodcutter blocking the door, the window the only way out, and outside, the window still broken.
- **The audience understands what the characters don't.** In *Do You Need a Bag?* the clerk speaks only Japanese and the customer only English: each line is spoken in its own language with subtitles, and a thought bubble shows the mishearing ("…REJI…?" turning into "VEGGIE?"), so the joke works for viewers who speak neither.
- **Keep the user's story.** Tighten the wording, add the small connecting moments a film needs, and list every addition for the user; don't swap their joke for a different one.

## Scenes, shots, cuts

One scene is one beat, with one joined audio clip ([sound.md](sound.md)); cuts inside a scene are timed to its clock. Plan shots the way a film does, because a fixed wide frame for a whole scene plays like a slideshow:

- a wide shot to say where we are, two-shots for conversations, a close-up for whoever speaks, closer and closer as tension rises (the three questions to "Grandma");
- reverse angles: whoever is in close-up has behind them what the other person sees (a separate camera on a matching set, not a zoom of the same one);
- an insert to make a detail readable (a coin on the counter, the clock, a face in a door crack);
- held silences: the beat where nobody speaks is often the joke. Blinks, eyes and a tiny head turn carry it.

Reviewers of the later episodes kept finding the same few things, all about what the viewer can read. Give every object the joke hangs on an insert of its own; the best episodes ran ten to fourteen shots a half minute. Keep whoever is being spoken to in the shot, since the listener's face is half of the line. Someone following stays far enough behind that the delay itself reads; people pass in front of or behind each other, never through. A face half cut by the frame edge, or a blink on the frame that carries the joke, reads as a mistake.

Everybody in the shot stays alive and stays there: extras blink and glance about in close-ups too (in an early cut the whole class vanished whenever someone spoke). Between places, cut or use a paper-theatre wipe; at the end, a title card.

## Review rounds

A first cut made in one pass looks like a first cut. What lifts an episode is watching it the way a director would, against the episodes the user already approved, and sending scenes back.

- **Director's view**: contact sheets of the whole episode and its cut sheet (`shot.py --cuts`) beside an approved one (a series' first episode: beside its storyboard). Look for story-level causes, not glitches: is every object the joke hangs on given its own shot, is the cause shown before the payoff, are the reactions framed so they read, is the shot density close to the approved episodes', does a silence stay silent? Write a restaging for each scene that needs one: which shots, from where, on which word.
- **Picture and sound**: frame by frame for faces cut by the edge, popping poses, puppets passing through each other; sound for lines cut short, effects out of step, music over a silence.
- Restage the scenes from those notes, then look again; two rounds usually settle it.

With subagents the reviewers run in parallel ([team.md](team.md#picture-books)); alone, do the same rounds yourself, one viewpoint at a time, writing each review down before changing anything.

## Delivering

The episode is a first cut for the user's viewing, not a finished film. Deliver its URL with what was made, the final script, the decisions the user should review (every line or moment you added), known problems, and the real cost of pictures. Once the user approves it, add it to `approved` in `style.json` and to the series page, and set the previous episode's `CHAPTER.next`: when an episode's last scene ends, the player marks it watched and offers the next one.

The series page is the book's `index.html`, made from [series.html](../assets/templates/picture-book/series.html): one card per episode with a still, its title and a line, and a mark on episodes already watched. A still is one frame of the episode saved as a 1400×788 WebP: `shot.py chNN --out books/<book>/review/stills sceneN:S --webp 1400 --name still-chNN --url http://localhost:8765/<book>/` writes it without the player's controls (beside a full-size PNG); copy the WebP to `site/<book>/img/`. The page's header shows `img/cover.webp`, a still too: the first episode's, or a frame the user picks, until the series has a picture of its own.
