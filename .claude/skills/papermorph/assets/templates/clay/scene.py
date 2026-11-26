"""scene.py: a clay set for one chapter, rendered in Blender with the Skill's clay kit (claykit.py, clayprops.py).
A worked example to change, not a format: a yard (plate) with a table, a tree and hills under a day sky; a car
(sprite, its shadow caught on the lawn) and its wheel (a strip of 24 angles); you, standing (sprite, placed by the
feet). example.html (beside this file in the Skill) drives the car on the page and turns its wheels by the distance.

    blender --background --factory-startup --python-exit-code 1 --python books/<book>/art/clay/scene.py -- --draft
    blender --background --factory-startup --python-exit-code 1 --python books/<book>/art/clay/scene.py -- [--only car,car_wheel]

--draft writes raw PNGs to --out only (look at them first); without it the WebPs and their manifest go to
site/<book>/img/clay/. Started by new_book.py --clay, --out and --site default to books/<book>/art/clay/raw and
site/<book>/img/clay; run from elsewhere, pass both. The method and the arguments: references/core/clay.md.
"""
import math, os, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
KIT = ''   # new_book.py --clay writes the kit's folder (SKILL/scripts) here; else it is looked for above this file
for k in [KIT] + [str(p / s) for p in HERE.parents for s in ('scripts', '.claude/skills/papermorph/scripts')] + [str(Path.home() / '.claude/skills/papermorph/scripts')]:
    if k and os.path.exists(os.path.join(k, 'claykit.py')): sys.path.insert(0, k); break
else: sys.exit('scene.py: no claykit.py found: set KIT at the top of this file to the Skill\'s scripts folder')
import claykit as K
import clayprops as P
from claykit import group, shot, want

book = HERE.parents[1] if HERE.parts[-2:] == ('art', 'clay') and HERE.parents[2].name == 'books' else None
a = K.arguments(out=str(HERE / 'raw') if book else None, site=str(book.parents[1] / 'site' / book.name / 'img' / 'clay') if book else None)
if a.fstop is None: a.fstop = 0.25           # this set's depth of field: the lane and the table sharp, near grass and far hills soft
K.setup(a, 'yard', ['yard', 'car', 'car_wheel', 'you'])

Y0 = 600.0          # page y of the ground at depth 0 (where the car's lane is)
FOCUS = 0.0         # the depth in focus
LANE, YOU = 0.0, 2.2  # depths: the car's lane, where you stand (behind it, by the table)

group('ground', P.lawn('lawn', -4, 20, -8, 7))
group('scenery', *P.hills([-2, 2, 6, 10, 14, 18], 5.2, 3), *P.tree('tree', 12.5, 3.2, 4),
      *P.table('table', 4.0, 2.6)[0], *P.tufts(-3, 19, -6.5, -1.6, 30, 5))
group('sky', *P.daysky(6.8, -4, 20, 6.0, 4, 101))
croot, body, axles, wheels = P.car_build('car', LANE)
group('car', *body)
for i, objs in enumerate(wheels): group(f'cw{i}', *objs)
root, you = P.person('you', 7.0, YOU)
group('you', *you)

lane = K.px(0, LANE, 0, Y0)[1]                # the page y the car is placed at
meta = {'yard': {'Y0': Y0, 'lane': round(lane, 2), 'you': [round(v, 1) for v in K.px(7.0, YOU, 0, Y0)]}}
if want('yard'): shot('yard', (0, 0, 1600, 900), Y0, FOCUS, show=['ground', 'scenery', 'sky'])
K.bpy.context.view_layer.update()            # the axles' world places, after the car's root moved them
W_ = lambda ax: ax.matrix_world.translation
if want('car'):     # the body over its shadow; the wheels light and shade it but are their own strip
    offs = [[round(W_(ax).x * K.U, 2), round(K.px(0, W_(ax).y, W_(ax).z, Y0)[1] - lane, 2)] for ax in axles]
    shot('car', K.rect_of(body, Y0), Y0, FOCUS, show=['car'], catch=['ground'], unseen=['cw0', 'cw1'], anchor=(0, lane),
         extra={'wheel': 'car_wheel', 'wheels': offs, 'r': P.CW_R * K.U})
if want('car_wheel'):   # the front wheel alone at 24 angles; the body and the ground still light it
    shot('car_wheel', K.rect_of(K.GROUPS['cw0'], Y0, pad=5, shadow=False), Y0, FOCUS, show=['cw0'], unseen=['car', 'ground'],
         frames=K.turn_frames([axles[0]], 24), anchor=K.px(*W_(axles[0]), Y0))
if want('you'): shot('you', K.rect_of(you, Y0, pad=10), Y0, FOCUS, show=['you'], catch=['ground'], anchor=K.px(7.0, YOU, 0, Y0))
K.write_manifest(meta)
