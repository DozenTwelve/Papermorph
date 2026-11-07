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

Everything goes through `painted.py` (manifest `books/<book>/art/painted.json`, which `new_book.py picture <book> --painted` starts from the kit's sample): sets resized to the 1600×900 frame, blurred copies for close-ups, cut-outs placed, words written, props written to `img/props/`. Stand the puppets in a frame and look before going on.

## Cost

The key, the prices, the ledger and the balance rules are in [core/style.md](../core/style.md#paid-steps). A set painted from its sketch takes the sketch as a reference (about $0.016 at low quality), and the style picture as a second reference keeps every set in one look (about $0.026).

- After every batch, put the pictures on one contact sheet and open it for the user (Finder, the browser), even when working on your own, so the user sees each stage.

## A hole in a scanned page

When a figure is lifted off a drawn background (*Millions of Cats*), `lift.py`'s `fill` inpaints its place from the surroundings: a smudge, fine for a small hole, visible where the figure moves off its spot or a chair rocks. An image model can draw what the book would have shown there, and `lift.py`'s `patch` pastes it in through the hole's polygon, so the rest of the page stays the book's own pixels. There is no script for the steps between; a short one with Pillow and OpenCV does them:

1. **Crop** the page image round the hole and smudge the hole first, as the set's `fill` does (`cv2.inpaint` through the hole's polygon, `INPAINT_TELEA`), so it has no outline; don't paint the hole flat grey: the grey is the figure's silhouette, and in 7 of 13 crops the model drew the figure back into it (hatched legs where the man's legs were, the rocking chairs).
2. **Paint** the crop with `paint.py OUT.png "<prompt>" crop.png --q low` and the crop alone as the reference (given the crop and the whole page, it once returned the whole page). A prompt that worked: "Repaint this black ink lithograph exactly as it is, in the artist's pen-and-ink style; redraw the blurred patches so they continue what is around them; nothing new stands in them."
3. **Fit** the painted crop to the page before pasting: the model redraws the whole crop and its lines drift (a wall 20–140 px over). Align it to the page's lines outside the hole (OpenCV's `findTransformECC` with an affine motion) and refuse a fit that runs off.
4. **Paste** it into a page-sized `patch` picture that holds, outside the hole, exactly what the set shows there (paper where an `erase` meets the hole, the page elsewhere): `lift.py` softens the patch's edge by 3 px, and anything else at the edge comes in as a hairline or a halo.
5. **Look** at one sheet per hole (page | hole | painted and fitted | pasted), then at the rebuilt set itself, at the hole's edge. A set lifted again rewrites its layers, and a layer over a patched hole takes the patch.

*Millions of Cats* painted 13 holes this way with 21 pictures at low quality, for $0.43.

## Credits and licences

Generated pictures belong in the book; name the model that painted them in the series page's footer. Stock or web images are different: a public site redistributes the files, so only licences that allow redistribution (CC0 and the like) will do, and the look rarely matches the puppets. Painting your own is usually simpler.
