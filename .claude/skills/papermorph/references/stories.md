# Picture books: from a story to an episode

A picture book is a short animated film, two to four minutes, told by paper puppets in front of sets. It starts from a story rather than a textbook: a fairy tale, a joke, something that happened to the user, or a story book's PDF. The published examples are on the shelf at https://papermorph.diamonddoge.org/: *Little Red Riding Hood* (everything drawn in code) and *Joke Collection* (painted sets, puppets in code; two episodes, one of them made overnight by a fresh session from the user's bedtime telling).

The craft is in four references: this one (the story and the shots), [puppets.md](puppets.md) (the paper puppets and the stop-motion look), [painting.md](painting.md) (sets and props painted by an image model) and [sound.md](sound.md) (voices, sound effects, music). The engine, the player, previews, checks and the team are the same as for every other book.

## Intake for a story

The same spirit as [intake.md](intake.md): a light conversation, choices to click, the user's words kept verbatim. What to settle, skipping whatever the telling already settles:

1. **The story itself.** Let the user tell it in their own words and keep that telling in `books/<book>/story.md` untouched. Ask what is true and must stay (a real joke has one real punchline), who the people are, where it happens, what language each person speaks.
2. **The look.** Two ways, both with paper puppets ([puppets.md](puppets.md)):
   - *Paper, all in code*: sets and props drawn as SVG paper too. No image cost, plainer, very consistent (Little Red Riding Hood).
   - *Painted world, paper actors* (recommended when an image budget is fine): an image model paints the sets and everything that stays still; the puppets and anything that moves stay in code (Joke Collection, under a dollar of pictures per episode). Ask for a budget ceiling and keep to it ([painting.md](painting.md)).
3. **Language and voices**: the narration language, one voice per character ([sound.md](sound.md)).
4. **A series or one film.** A series shares cast, sets and the series page; each episode is a chapter (`chNN`).

Record the answers in `style.json` (an `illustration` block: the look, the budget, the cast with a line each, the sets) and go on to the script.

## The script comes first

Write the script and a storyboard table (`books/<book>/storyboard.md`: scene, shot, what we see, who says what) and show them to the user before building anything. Changing a story on paper is cheap; once every shot is animated it is expensive, and almost every real failure in these books was a story failure that no amount of animation fixed.

What made the difference, from the books:

- **Set up everything the punchline needs.** The first cut of *Breakfast in the Bathroom* had Bo ask "Wanna go eat breakfast… in the bathroom?" out of nowhere; viewers took it literally. It became a joke once the film first showed his two everyday questions, "Breakfast?" every morning at the stall and "Bathroom?" after every class, and then the morning he overslept and came in starving.
- **Show the motive before the line.** Bo's stomach growls; a bun appears in a thought bubble; he glances at the door and a toilet appears beside it; the two bubbles shove each other and merge. Only then does he speak. The audience is ahead of him, which is where comedy happens.
- **Every event needs a cause the audience has seen.** In *Little Red Riding Hood* the first rescue had a woodcutter from nowhere, Grandma suddenly out of the wardrobe and the wolf flying out of the window "as if Grandma had superpowers" (the user's words). The fix was a chain: the woodcutter chopping wood near the cottage earlier, a cut to Grandma's eye in the wardrobe crack during the questions, the cry for help, Grandma's umbrella on the wolf's head, the woodcutter blocking the door, the window the only way out, and outside, the window still broken.
- **The audience understands what the characters don't.** In *Do You Need a Bag?* the clerk speaks only Japanese and the customer only English: each line is spoken in its own language with subtitles, and a thought bubble shows the mishearing ("…REJI…?" turning into "VEGGIE?"), so the joke works for viewers who speak neither.
- **Keep the user's story.** Tighten the wording, add the small connecting moments a film needs, and list every addition for the user; don't swap their joke for a different one.

## Scenes, shots, cuts

One scene is one beat, with one joined audio clip ([sound.md](sound.md)); cuts inside a scene are timed to its clock. Plan shots the way a film does, because a fixed wide frame for a whole scene plays like a slideshow:

- a wide shot to say where we are, two-shots for conversations, a close-up for whoever speaks, closer and closer as tension rises (the three questions to "Grandma");
- reverse angles: whoever is in close-up has behind them what the other person sees (a separate camera on a matching set, not a zoom of the same one);
- an insert to make a detail readable (a coin on the counter, the clock, a face in a door crack);
- held silences: the beat where nobody speaks is often the joke. Blinks, eyes and a tiny head turn carry it.

Everybody in the shot stays alive and stays there: extras blink and glance about in close-ups too (in an early cut the whole class vanished whenever someone spoke). Between places, cut or use a paper-theatre wipe; at the end, a title card.

## Delivering

Deliver the episode URL with what was made, the final script, the decisions the user should review (every line or moment you added), known problems, and the real cost of pictures. For a series, add the episode to the series page with a still and a line, and set the previous episode's `CHAPTER.next`.
