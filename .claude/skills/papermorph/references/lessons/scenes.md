# Illustrated scenes

For physical, spatial and narrative ideas: people and things act out the idea, the camera shows what matters, and the words live inside the picture (the science book, `site/science/`).

## Each moment is one picture

The subject comes first, large and where the eye lands; text is part of the picture and appears beside what it names, as it is said. A title row, a picture somewhere else and notes in a column feel fragmented even when every piece is correct.

Worked example, the push in the science book's chapter 10:
- *Before*: a small pusher and cart at the bottom left, the sentence at the top centre, the word "push" floating far from both, and an arrow above the cart rather than on it. Every piece was right; nothing read as one picture.
- *After*: the actor three times larger with the cart against her hands; the force arrow starts at the hands and runs through the cart, labelled "push · 6 N" on the arrow; the sentence just above the actor. The eye goes actor, arrow, words.

Vary the composition with the content (a close-up, a wide shot, a split screen, a view from above); a chapter of the same frame over and over felt monotonous. Light atmosphere is welcome: favour objects and moves that carry the idea, and trim a bystander, dense scenery or a flourish that competes with it.

## Storyboard: layout first, then motion

1. With narration and beats written, place everything for one to three key moments per beat in the real page: real elements at their real sizes, positions written as the moment's values, no tweens yet.
2. Capture those moments into one sheet (`strip.py chNN OUT force:push,dir net:add … --sheet storyboard --url http://localhost:8765/<book>/`; times may be marks). Write one line per frame in `chapters/chNN.md`: what it says and where the eye goes. That sheet is the storyboard; composition is cheapest to change now.
3. In the pilot the user reviews the sheet before motion is added; in later chapters it is your own check, kept as evidence in `books/<book>/review/chNN/`.
4. Add motion and camera so the picture passes through those compositions, then compare finished frames with the sheet.

## Actors and actions

When the narration says someone pushes, throws or jumps, they perform it with weight and timing, and what they handle moves with them. A figure sliding across the ground like a statue reads as a still picture, and viewers notice at once.
- Drive gait frames from the distance travelled, so the feet keep pace with the ground.
- Keep contact as a shared position: the prop follows the current frame's hand position; a ball is caught, held and released through it.
- Time poses to narration marks (wind-up before "kick", contact on it), and derive motion constants from the marks when an action must land on a word.
- When a sprite set has too few poses, draw frames from a simple skeleton rather than going without the action ([assets.md](assets.md)).

## The camera tells the story

Establish the scene, push in at the moment of contact, pull back for the result, follow a moving subject, switch views (side to top, split screen) to reveal structure. One purposeful move per beat is usually enough. Labels that must stay readable live in screen space and track their object (`cam.track`, [engine.md](../core/engine.md#world-clock-and-camera)).

## True at every moment

Motion, arrows, labels and numbers state the same thing at the same moment. A force is drawn while it acts and disappears when contact ends; an accelerating object keeps accelerating while its label says so, so size the demonstration to the narration rather than clamping it at the frame edge; readouts come from the same function of time as the motion. Scale realism is not needed; clarity is.

Still frames hide frozen actors and drifting timing, so watch each action in motion ([review.md](../core/review.md#watch-it-in-motion)).
