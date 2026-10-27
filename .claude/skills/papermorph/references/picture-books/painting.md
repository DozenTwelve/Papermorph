# Painted sets: an image model for everything that stays still

In the painted look one question splits the work: **does it move?** Streets, rooms, walls, shelves, furniture, signs, and props that only move as a whole (a bun, a bottle, an umbrella, a cart, a desk) are painted by an image model. Anything with joints, a face or a change of shape (people, animals, rain and snow, thought bubbles, clock hands) stays a paper puppet in code ([puppets.md](puppets.md)). A painting never has to act and a puppet never has to look like a painting, so neither does the other's job badly. *Joke Collection* paints its episodes this way for well under a dollar each.

## Choosing the look

Paint one set two or three ways at the cheapest quality, stand the puppets in each (composite a frame), and let the user choose. In *Joke Collection* the candidates were flat paper like the puppets, warm gouache, and a richer torn-paper collage with light; the collage won: let the image model carry as much as it can, while everything that can move still moves. Keep the chosen picture as the style reference for every later set and prop, and record the style words in `style.json`.

## Getting the composition you need

Puppets stand at fixed places, counters must hide the right legs, and cuts must match. So draw the set first as a rough SVG sketch in `books/<book>/art/sets.js` and have the model repaint *that picture* in the style of the reference: the layout survives, the look changes. `bake_sets.py books/<book>/art/sets.js site/<book> <set> … --ref books/<book>/art` renders each named set as one frame, `ref-<set>.png` (name the sets, since a set already baked is otherwise skipped; the frame holds every layer of the set, so a layer painted on its own needs its own reference, cropped or sketched as a set of its own). The exact geometry does not survive, so the places puppets and props stand at come from the painted set, not the sketch ([stories.md](stories.md#team) says how to measure them). Once a set is painted, `bake_sets.py` leaves it alone unless you name it. Then:

- **Cut-outs for whatever people stand behind.** A counter, a cart, rows of desks, a lectern: paint each as its own picture on a transparent background and place it as a layer (`painted.py`, `cut`).
- **Variants by editing, not redrawing.** Rain and snow versions of a street, a door open and shut, a bun with a bite: edit the one picture, so a cut between versions changes only that.
- **Leave signs blank.** Image models garble text, Chinese and Japanese worst. Paint the banner, the shop sign, the blackboard empty and let `painted.py` write the words in a real font.
- **Paint wider than the frame.** Shakes and zooms see past the edge; `painted.py` pads full frames by mirroring their edges (`pad`, 60 px at the sides and 34 at top and bottom), enough for a shake but not a pan: a camera that travels further zooms in enough to keep its view inside the picture (a follow shot needed about 1.4×), and when something near an edge (a post box) shows twice in a close-up, `"edge": "stretch"` on that layer pads it with its own outermost pixels instead.

Everything goes through `painted.py` (manifest `books/<book>/art/painted.json`): sets resized to the 1600×900 frame, blurred copies for close-ups, cut-outs placed, words written, props written to `img/props/`. Stand the puppets in a frame and look before going on.

## Cost

The money is the user's, so the user sets a ceiling and sees every cent:

- `paint.py --q` is `low` or `medium` (the default; high is refused). Try `--q low` first: in these books low was often good enough for the final set (about $0.016 a picture with one reference, about $0.026 with the style picture as a second; medium about $0.02–0.03; high cost five times as much and, once used in a film, looked the same).
- `paint.py` reads the OpenRouter key from `~/.config/openrouter/key` or `$OPENROUTER_API_KEY`. Every picture is logged with its cost (`--ledger books/<book>/art/costs.tsv`; `paint.py --total books/<book>/art/costs.tsv` sums it). Before a batch, say how many pictures and what they will cost; after it, report the real balance from the provider (OpenRouter's credits page, or `GET https://openrouter.ai/api/v1/credits` with the key), not an estimate; it can lag a batch by some minutes, so read it again before reporting. OpenRouter refuses any image request while the balance is under one dollar. `paint.py` will not write over an existing picture (it may be an approved, paid one); `--force` replaces it.
- Without an OpenRouter account, `paint_openai.py` calls OpenAI's image API directly with the same arguments and ledger (key in `$OPENAI_API_KEY`, `--env FILE` or `~/.config/papermorph/.env`). OpenAI returns no price, so its ledger lines are estimates: read the real spend from OpenAI's usage page.
- After every batch, put the pictures on one contact sheet and open it for the user (Finder, the browser), even when working on your own, so the user sees each stage.

## Credits and licences

Generated pictures belong in the book; name the model that painted them in the series page's footer. Stock or web images are different: a public site redistributes the files, so only licences that allow redistribution (CC0 and the like) will do, and the look rarely matches the puppets. Painting your own is usually simpler.
