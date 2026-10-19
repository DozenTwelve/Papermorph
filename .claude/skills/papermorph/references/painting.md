# Painted sets: an image model for everything that stays still

In the painted look, one question splits the work: **does it move?** Streets, rooms, walls, shelves, furniture, signs, and props that only move as a whole (a bun, a bottle, an umbrella, a cart, a desk) are painted by an image model. Anything with joints, a face or a change of shape (people, animals, rain and snow, thought bubbles, clock hands) stays a paper puppet in code ([puppets.md](puppets.md)). A painting never has to act and a puppet never has to look like a painting, so neither does the other's job badly. *Joke Collection* paints its episodes this way for well under a dollar each.

## Choosing the look

Paint one set two or three ways at the cheapest quality, stand the puppets in each (composite a frame), and let the user choose. In *Joke Collection* the candidates were flat paper like the puppets, warm gouache, and a richer torn-paper collage with light; the user chose the collage: "no need to copy South Park 100%; use the image model as far as it goes while what can move, moves". Keep the chosen picture as the style reference for every later set and prop, and record the style words in `style.json`.

## Getting the composition you need

Puppets stand at fixed places, counters must hide the right legs, and cuts must match. The reliable way is to draw the set first as a rough SVG sketch (`bake_sets.py` renders it), then ask the model to repaint *that picture* in the style of the reference: the layout survives, the look changes. Then:

- **Cut-outs for whatever people stand behind.** A counter, a cart, rows of desks, a lectern: paint each as its own picture on a transparent background and place it as a layer (`painted.py`, `cut`).
- **Variants by editing, not redrawing.** Rain and snow versions of a street, a door open and shut, a bun with a bite: edit the one picture, so a cut between versions changes only that.
- **Leave signs blank.** Image models garble text, Chinese and Japanese worst. Paint the banner, the shop sign, the blackboard empty and let `painted.py` write the words on in a real font.
- **Paint wider than the frame.** Camera shakes and zooms see past the edge; `painted.py` pads full frames.

Everything that comes out goes through `painted.py` (manifest `books/<book>/art/painted.json`): sets resized to the 1600×900 frame, blurred copies for close-ups, cut-outs placed, words written, props written to `img/props/`. Stand the puppets in a frame and look before going on.

## Cost

Money is the user's, so the user sets a ceiling and sees every cent:

- `paint.py` takes quality `low` or `medium` only. Try low first: in these books low was often good enough for the final set (about $0.02 a picture; medium about $0.02–0.03; high cost five times as much and, once used in a film, looked the same).
- Every picture is logged with its cost (`--ledger books/<book>/art/costs.tsv`); before a batch, say how many pictures and what they will cost; after it, report the real balance from the provider, not an estimate. OpenRouter refuses any image request when the balance is under one dollar.
- After every batch, put the pictures on one contact sheet and open it for the user (Finder, the browser), even when working on your own: they like to see each stage.

## Credits and licences

Pictures you generate belong in the book; say which model painted them in the series page's footer. Stock or web images are a different matter: a public site redistributes the files, so only licences that allow redistribution (CC0 and the like) will do, and the look rarely matches the puppets. Painting your own is usually simpler.
