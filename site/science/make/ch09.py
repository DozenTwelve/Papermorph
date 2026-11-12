"""ch09.py: the clay pictures of Elementary Physics chapter 1 (site/science/ch09, "Motion"), Section 1.

    blender --background --factory-startup --python site/science/make/ch09.py -- --set road [--only truck,car] \
        [--engine cycles] [--device auto|OPTIX|CUDA|METAL|CPU] [--samples 64] [--scale 100] [--fstop 0.2] [--draft]

    --set park   beat 1: the ball's track on the grass (plate `park`, strip `ball`)
    --set road   beats 0, 3, 4, 5, 8: the road (plate `road`, one period that repeats), truck and car (sprites and
                 wheel strips), you and your friend
    --set table  beat 2: a lawn with a notebook (page strip), an orrery (Sun sprite, Earth strip by orbit angle) and
                 a path (you walking: 8 replacement poses)
    --set globe  beat 6: a clay globe seen from straight above its North Pole, on a dark table (plate `space`,
                 sprites `globe` and `globe_cap`, the cap three times finer for the close ground views)
    --set train  beat 7: the carriage, Maya and the bottle inside, Leo on the platform (plate `train`)
    --set track  beats 10, 11, 13, 17: a running track (plate `track`, twice as fine for the push-in of beat 13), the
                 runner (8 running poses), you jogging right and left, flags, the finish banner; also a cloud and a
                 pedal used elsewhere
    --set pool   beat 14: the pool, a dolphin and a walrus (their underwater halves cut by the water)
    --set top    beats 19, 20, 23, 26, 27: seen and lit straight down (so a turned sprite stays exact): the corner
                 street, the round track, the square block, the flower bed; the car, a walker and a bee from above

Paths come from this file's place in the repository; every setting is an argument (claykit.arguments). What each
asset is and why it is exact under the page's own motion is in claykit.py. Finals on a GPU:
    --device OPTIX --samples 256 --scale 200
"""
import bpy, bmesh, math, os, sys, random
import numpy as np
from mathutils import noise
from mathutils import Vector
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import claykit as K
from claykit import clay, box, ball, roll, slab, part, empty, copy, group, shot, lathe_mesh, rbox_mesh, moved, ribbon

a = K.arguments(lambda ap: ap.add_argument('--set', required=True, choices=['park', 'road', 'table', 'globe', 'train', 'track', 'pool', 'top']))
ONLY = set(filter(None, a.only.split(',')))
want = lambda n: not ONLY or n in ONLY
if a.fstop is None: a.fstop = {'park': 0.2, 'road': 0.26, 'table': 0.22, 'globe': 0.8, 'train': 0.3, 'track': 0.22, 'pool': 0.3, 'top': 1.2}[a.set]   # the road holds two lanes and a pavement in its sharp band
sc = K.setup(a)
COS, SIN = math.cos(K.E), math.sin(K.E)
SUN = Vector(a.sun_dir)

# the book's colours as clay (the labels over the picture keep the exact hexes; AgX takes a little saturation off)
C = dict(grass='#2c5e3a', hill='#274a35', road='#3d4744', walk='#74817b', line='#ece8dc', wood='#9a7350', slate='#1c2925',
         tyre='#2e3338', hub='#c3ccd3', glass='#d2e8ff', skin='#f0c3a0', hair='#353b47', jeans='#4878d2', shoe='#3a3f4a',
         you='#ab8ff5', friend='#f59a80', truck='#4a8de0', cargo='#b4d0ff', car='#55c486', trunk='#8a5a3c', leaf='#3f9a52',
         lamp='#8597ad', bulb='#ffe9a0', ballw='#f2efe6', balld='#262f2d', dark='#1d2a35', shine='#b9d2e4',
         maya='#f3c95c', leo='#f59a80', runner='#4fb3a6')


def rect_of(objs, Y0, pad=14, shadow=True):
    """The page rectangle that holds the objects, and their shadows on the ground when shadow is set."""
    xs, ys = [], []
    bpy.context.view_layer.update()
    for o in objs:
        if o.type != 'MESH': continue
        for c in o.bound_box:
            p = o.matrix_world @ Vector(c)
            pts = [p]
            if shadow and SUN.z < 0: pts.append(p - SUN * (p.z / SUN.z))     # where the corner's shadow lands on z = 0
            for q in pts:
                x, y = K.px(q.x, q.y, q.z, Y0); xs.append(x); ys.append(y)
    x0, y0 = math.floor(min(xs) - pad), math.floor(min(ys) - pad)
    return x0, y0, math.ceil(max(xs) + pad) - x0, math.ceil(max(ys) + pad) - y0


def union(rects):
    x0 = min(r[0] for r in rects); y0 = min(r[1] for r in rects)
    return x0, y0, max(r[0] + r[2] for r in rects) - x0, max(r[1] + r[3] for r in rects) - y0


def wheel(name, r, w, loc, seed, side=-1):
    """A wheel on an axle along y: returns the axle empty; turn it with rotation_euler.y (positive rolls to +x)."""
    ax = empty(name + '_axle', loc)
    s = 0.25 * w
    tyre = part(name, lathe_mesh([(-w / 2, 0), (-w / 2, r - s), (-w / 2 + s, r), (w / 2 - s, r), (w / 2, r - s), (w / 2, 0)], 0.035),
                clay('tyre', C['tyre'], rough=0.62, specks=0.5), rot=(-side * math.pi / 2, 0, 0), parent=ax, lump=0.012, dents=2, dent_r=(0.06, 0.1), seed=seed)
    # the lathe's +z is now -y (toward the camera): the hub cap and its marks sit on that face
    part(name + '_hub', lathe_mesh([(0, 0), (0, r * 0.5), (0.05, r * 0.42), (0.06, 0)], 0.03), clay('hub', C['hub'], rough=0.4),
               loc=(0, 0, w / 2 - 0.01), parent=tyre, lump=0.008, dents=0, seed=seed)
    # a cream bead off the centre and a dark nut at it: the turn is seen
    part(name + '_bead', rbox_mesh((r * 0.3, r * 0.3, 0.07), 0.03, 0.02), clay('line', C['line']), loc=(r * 0.68, 0, w / 2 + 0.005), parent=tyre, lump=0.004, dents=0)
    part(name + '_nut', rbox_mesh((r * 0.2, r * 0.2, 0.06), 0.03, 0.02), clay('tyre', C['tyre']), loc=(0.02, 0.01, w / 2 + 0.05), parent=tyre, lump=0.003, dents=0)
    return ax, [tyre] + list(tyre.children)


def turn_frames(axles, n):
    def pose(i):
        def f():
            for ax in axles: ax.rotation_euler = (0, 2 * math.pi * i / n, 0)
        return f
    return [(i, pose(i)) for i in range(n)]


def window(name, w, h, loc, glass, shine, lean=0.0, parent=None):
    """A toy window on a face toward the camera (-y): dark glass, a soft pale streak at its upper left."""
    x, y, z = loc
    return [box(name, (w, 0.06, h), glass, (x, y, z), r=0.05, d=0.03, lump=0.004, dents=0, parent=parent),
            box(name + '_shine', (0.07, 0.03, h * 0.62), shine, (x - w * 0.24, y - 0.035, z + h * 0.06), r=0.025, d=0.02, lump=0.003, dents=0, rot=(0, 0.45 + lean, 0), parent=parent)]


def car_build(name, y, sx=1, wheels=True, both=False):
    """Your green car, its centre at (0, y): body and cabin pressed into one piece (a voxel remesh), the glasshouse
    narrowing to the roof, dark side windows, windscreen and rear window. sx = -1 builds it facing left (mirrored:
    windows and wheels stay on the side toward the camera). both: windows and wheels on the far side too (a car that
    turns round, or is seen from above). Returns (root, body objects, axles, wheel objects)."""
    root = empty(name, (0, y, 0)); root.scale = (sx, 1, 1)
    green = clay('car', C['car'], rough=0.46)
    dark, shine = clay('dark', C['dark'], rough=0.12, specks=0, marks=0.4), clay('shine', C['shine'], rough=0.3, specks=0, marks=0.2)
    shell = K.fuse([moved(rbox_mesh((2.5, 1.26, 0.5), 0.2, 0.045), dz=0.42),
                    moved(rbox_mesh((1.36, 1.04, 0.66), 0.2, 0.04), dx=-0.12, dz=0.88, taper=(0.55, 1.21, 0.2))], voxel=0.025)
    body = [part(name + '_shell', shell, green, parent=root, lump=0.02, dents=9, dent_r=(.1, .2), seed=4),
            box(name + '_shield', (0.06, 0.8, 0.36), dark, (0.5, 0, 0.95), r=0.03, d=0.03, lump=0.004, dents=0, rot=(0, -0.38, 0), parent=root),
            box(name + '_rear', (0.06, 0.8, 0.3), dark, (-0.75, 0, 0.95), r=0.03, d=0.03, lump=0.004, dents=0, rot=(0, 0.38, 0), parent=root),
            ball(name + '_lamp', 0.07, clay('bulb', C['bulb'], specks=0, emit=0.6), (1.25, -0.38, 0.46), lump=0.004, dents=0, parent=root)]
    body += window(name + '_w0', 0.46, 0.34, (0.16, -0.5, 0.9), dark, shine, parent=root) + window(name + '_w1', 0.46, 0.34, (-0.42, -0.5, 0.9), dark, shine, parent=root)
    if both:
        for j, x in enumerate((0.16, -0.42)):
            body.append(box(f'{name}_v{j}', (0.46, 0.06, 0.34), dark, (x, 0.5, 0.9), r=0.05, d=0.03, lump=0.004, dents=0, parent=root))
    axles, wobjs = [], []
    if wheels:
        for i, x in enumerate((0.76, -0.78)):
            ax, objs = wheel(f'{name}_wh{i}', CW_R, 0.24, (x, -0.63, CW_R), seed=7 + i); ax.parent = root
            axles.append(ax); wobjs.append(objs)
            if both:
                ax2, objs2 = wheel(f'{name}_wb{i}', CW_R, 0.24, (x, 0.63, CW_R), seed=9 + i, side=1); ax2.parent = root
                wobjs.append(objs2)
    return root, body, axles, wobjs


CW_R = 0.27


def tree(name, x, y, seed, h=1.0):
    rnd = random.Random(seed)
    objs = [roll(name + '_trunk', (x, y, -0.05), (x + rnd.uniform(-.05, .05), y, 0.85 * h), 0.13 * min(h, 1), clay('trunk', C['trunk'], rough=0.6), lump=0.02)]
    for i, (dx, dz, r) in enumerate([(-.32, 1.25, .46), (.3, 1.2, .5), (0, 1.62, .5), (-.05, 1.3, .52)]):
        objs.append(ball(f'{name}_leaf{i}', r * h, clay('leaf', C['leaf'], rough=0.55), (x + dx * h, y + (.12 if i == 3 else -.05 * i), dz * h),
                         squash=(1, .9, .88), lump=0.05, dents=7, seed=seed + i))
    return objs


def hills(xs, y, seed, x_copies=(0,)):
    rnd = random.Random(seed); objs = []
    for i, x in enumerate(xs):
        r = rnd.uniform(1.5, 2.3)
        o = ball(f'hill{i}', r, clay('hill', C['hill'], rough=0.6, feat=2.0), (x, y + rnd.uniform(0, .5), -0.2),
                 squash=(1, .55, rnd.uniform(.34, .5)), d=0.12, lump=0.09, lump_size=1.2, dents=5, dent_r=(.3, .5), seed=seed + i)
        objs.append(o)
        objs += [copy(o, (x + dx, o.location.y, o.location.z)) for dx in x_copies if dx]
    return objs


def tufts(x0, x1, y0, y1, n, seed, x_copies=(0,)):
    """Pinched grass and a few flower beads on the near ground: out of focus, they give the depth away."""
    rnd = random.Random(seed); objs = []
    for i in range(n):
        x, y = rnd.uniform(x0, x1), rnd.uniform(y0, y1)
        if rnd.random() < 0.3:
            o = ball(f'bead{i}', rnd.uniform(.07, .11), clay('bead' + str(i % 3), ['#f3c95c', '#e8a0c8', '#ece8dc'][i % 3], specks=0), (x, y, .07), lump=0.01, dents=0, seed=i)
        else:
            h = rnd.uniform(.16, .3)
            o = part(f'tuft{i}', lathe_mesh([(0, .11), (h * .5, .08), (h, 0)], 0.04), clay('tuft', '#3f7a4c', specks=0), (x, y, 0), lump=0.02, dents=0, seed=i)
        objs.append(o)
        objs += [copy(o, (x + dx, y, o.location.z)) for dx in x_copies if dx]
    return objs


def person(role, x, y, pose=0.0, face='cam', seed=0, k=1.1, swing=0.34, tail=False):
    # (seed 0: from the role, so the same person looks the same in every set)
    """A small, simple clay figure, 1.2 * k units tall, no face. pose: the stride, -1..1 (0 stands): one leg and the
    other arm forward by that much, as a replacement puppet's next pose. face: 'cam' looks out of the picture (the
    hair sits on the back of the head, away from us), 'right' is a profile walking to +x."""
    root = empty(role, (x, y, 0)); root.scale = (k, k, k)
    shirt = clay(role, C[role], rough=0.5)
    seed = seed or sum(map(ord, role))
    jeans, skin = clay('jeans', C['jeans']), clay('skin', C['skin'], sss=0.2, specks=0.3)
    objs = []
    for side in (-1, 1):
        s = pose * side * swing                                     # this leg's swing, radians
        hip = Vector((0, side * 0.11, 0.5)); foot = hip + Vector((math.sin(s) * 0.44, 0, -math.cos(s) * 0.44))
        lift = max(0, -pose * side) * 0.03
        objs.append(roll(f'{role}_leg{side}', hip, foot + Vector((0, 0, lift)), 0.1, jeans, parent=root, seed=seed + side))
        side_on = face in ('right', 'left')
        objs.append(ball(f'{role}_shoe{side}', 0.105, clay('shoe', C['shoe']), foot + Vector((0.05 if side_on else 0, -0.04 if face == 'cam' else 0, lift - 0.02)),
                         squash=(1.5, .95, .7) if side_on else (.95, 1.5, .7), parent=root, lump=0.008, dents=0))
        sh = Vector((0, side * 0.25, 0.86)); t = -pose * side * swing * 1.2
        hand = sh + Vector((math.sin(t) * 0.36, side * 0.04, -math.cos(t) * 0.36))
        objs.append(roll(f'{role}_arm{side}', sh, hand, 0.075, shirt, parent=root, seed=seed + 5 + side))
        objs.append(ball(f'{role}_hand{side}', 0.08, skin, hand + Vector((0, 0, -0.03)), parent=root, lump=0.006, dents=0))
    objs.append(part(f'{role}_body', lathe_mesh([(0.42, 0), (0.42, 0.21), (0.6, 0.235), (0.82, 0.21), (0.93, 0.14), (0.96, 0)], 0.035), shirt,
                     scale=(0.92, 1.12, 1), parent=root, lump=0.02, dents=4, dent_r=(.07, .12), seed=seed + 9))
    objs.append(ball(f'{role}_head', 0.215, skin, (0, 0, 1.08), parent=root, lump=0.012, dents=2, dent_r=(.05, .08), seed=seed + 3))
    back = Vector((-0.07, 0, 0)) if face in ('right', 'left') else Vector((0, 0.08, 0))
    objs.append(ball(f'{role}_hair', 0.225, clay('hair', C['hair'], rough=0.45), Vector((0, 0, 1.15)) + back, squash=(1.02, 1.02, .74), parent=root, lump=0.02, dents=3, dent_r=(.05, .08), seed=seed + 4))
    if tail: objs.append(ball(f'{role}_tail', 0.1, clay('hair', C['hair'], rough=0.45), (-0.24, 0, 1.12), squash=(1.3, .8, .8), parent=root, lump=0.01, dents=0))
    if face == 'left': root.rotation_euler = (0, 0, math.pi)     # a profile walking to -x: the right-facing figure turned round
    return root, objs


# ================================================================ park: the ball's track (beat 1)
if a.set == 'park':
    # Page layout kept from the pixel beat: 0 m at x = 200, 120 px a metre, the ball (radius 40) centred on y = 560.
    TOP, R = 0.16, 0.4
    Y0 = 560 + K.U * (TOP + R) * COS       # the ground at depth 0, so the ball's centre lands on 560
    FOCUS = 0.0
    xm = lambda v: 2.0 + 1.2 * v
    g = clay('grass', C['grass'], rough=0.6, feat=1.5, stipple=0.5, prints=0.3, specks=0.4)
    ground = [slab('grass', -9, 25, -10, 3.4, 0.0, g, thick=0.3, d=0.14, wobble=0.0, lump=0.02),
              slab('strip', 1.45, 15.5, -1.5, -0.44, 0.06, clay('slate', C['slate'], rough=0.55, feat=1.4, specks=0.4), thick=0.1, d=0.07, wobble=0.025, lump=0.006, seed=3),
              slab('track', 1.68, 14.32, -0.36, 0.36, TOP, clay('wood', C['wood'], rough=0.55, feat=1.3), thick=0.2, d=0.05, wobble=0.02, lump=0.008, seed=5)]
    rnd = random.Random(4)
    for v in range(11):   # a cream stick pressed in at every metre
        ground.append(roll(f'tick{v}', (xm(v) + rnd.uniform(-.008, .008), -0.47, 0.075), (xm(v) + rnd.uniform(-.012, .012), -0.68, 0.075), 0.026,
                           clay('line', C['line'], specks=0.3), lump=0.004, seed=v))
    group('ground', *ground)
    group('scenery', *hills([-7, -3.6, -0.5, 2.8, 6.2, 9.4, 12.6, 15.8, 19.2, 22.6], 3.7, 2),
          *tree('treeA', -2.0, 1.9, 1), *tree('treeB', 18.2, 2.1, 2, h=1.08),
          *tufts(-8, 24, -6.5, -2.4, 46, 7))
    bx = empty('ballx', (xm(4.5), 0, TOP + R))
    b = ball('ball', R, clay('ballw', C['ballw'], rough=0.42, specks=0.4, sss=0.15), parent=bx, lump=0.012, dents=3, dent_r=(.1, .16), seed=1)
    spots = [b]
    phi = (1 + 5 ** .5) / 2
    for i, v in enumerate([(0, s1, s2 * phi) for s1 in (-1, 1) for s2 in (-1, 1)] + [(s1, s2 * phi, 0) for s1 in (-1, 1) for s2 in (-1, 1)] + [(s2 * phi, 0, s1) for s1 in (-1, 1) for s2 in (-1, 1)]):
        n = Vector(v).normalized()
        p = part(f'spot{i}', rbox_mesh((0.24, 0.24, 0.06), 0.03, 0.03), clay('balld', C['balld'], rough=0.45, specks=0.3), loc=n * (R - 0.012),
                 rot=n.to_track_quat('Z', 'Y').to_euler(), parent=b, lump=0.006, dents=0, seed=i)
        spots.append(p)
    group('ball', *spots)
    b.rotation_euler = (0.3, 0, 0.5)   # a start turn so no patch faces the camera square on
    if want('park'): shot('park', (-200, 260, 2000, 740), Y0, FOCUS, show=['ground', 'scenery'])
    at = K.px(bx.location.x, 0, TOP + R, Y0)
    if want('ball'):          # the ball alone at 36 angles (the ground still lights it from below)
        shot('ball', rect_of(spots, Y0, pad=6, shadow=False), Y0, FOCUS, show=['ball'], unseen=['ground'], frames=turn_frames([bx], 36), anchor=at, extra={'r': R * K.U})
    if want('ball_shadow'):   # its shadow on the track and the grass does not turn: one picture, under the ball
        shot('ball_shadow', rect_of(spots, Y0, pad=12), Y0, FOCUS, show=[], catch=['ground'], unseen=['ball'], anchor=at)
    K.write_manifest({'U': K.U, 'elev': a.elev, 'park': {'Y0': round(Y0, 2)}})

# ================================================================ road (beats 0, 3, 4, 5)
if a.set == 'road':
    W = 24.0                          # the plate's period: 2400 page px
    Y0 = 613.0                        # page y of the ground at depth 0; the far kerb is at 478 as in the pixel beats, the near one at 768
    FOCUS = 0.0                       # the depth in focus: between the lanes
    FAR, NEAR = 1.3, -1.8             # lane centres: the truck's and the car's; apart enough that the car's roof clears the truck's wheels
    SIDE = 3.05                       # where people stand on the far pavement
    P3 = (-W, 0, W)
    # ---- ground: every piece is one period long and repeats, marks included
    ground = []
    for dx in P3:
        ground += [slab('grass', dx, dx + W, -9.5, 5.4, 0.0, clay('grass', C['grass'], rough=0.6, feat=1.5, stipple=0.5, prints=0.3, specks=0.4, period=W), thick=0.3, d=0.14, wobble=0, lump=0.02, period=W),
                   slab('road', dx, dx + W, -3.1, 2.7, 0.07, clay('road', C['road'], rough=0.5, feat=1.6, period=W, specks=0.6), thick=0.16, d=0.08, wobble=0.035, lump=0.008, period=W, seed=1),
                   slab('walk', dx, dx + W, 2.62, 4.1, 0.16, clay('walk', C['walk'], rough=0.58, feat=1.4, period=W), thick=0.2, d=0.08, wobble=0.03, lump=0.008, period=W, seed=2)]
        for k, y in enumerate((-2.84, 2.42)):
            ground.append(slab(f'edge{k}', dx, dx + W, y - 0.045, y + 0.045, 0.1, clay('line', C['line'], period=W, specks=0.3), thick=0.05, d=0.04, wobble=0.014, lump=0.004, period=W, seed=5 + k))
    rnd = random.Random(3)
    for i in range(15):               # the centre dashes: fifteen little cream strips, none quite straight
        x = 1.6 * i + rnd.uniform(-.03, .03); t = rnd.uniform(-.025, .025)
        d = slab(f'dash{i}', -0.36, 0.36, -0.045, 0.045, 0.1, clay('line', C['line'], specks=0.3), thick=0.05, d=0.04, wobble=0.008, lump=0.004, seed=20 + i)
        d.location = (x + 0.36, -0.2 + rnd.uniform(-.015, .015), 0); d.rotation_euler = (0, 0, t)
        ground += [d] + [copy(d, (d.location.x + dx, d.location.y, 0)) for dx in P3 if dx]
    group('ground', *ground)
    # ---- scenery on the far side: trees at 300 and 1900, a lamp at 1500 (no tree behind a person at 760 or 1100)
    scenery = hills([1.5, 4.8, 8.4, 11.6, 15.0, 18.3, 21.8], 5.7, 5, P3) + tufts(0, W, -7.2, -3.6, 30, 9, P3)
    for i, (x, hh) in enumerate([(3.0, 1.0), (19.0, 1.08)]):
        t = tree(f'tree{i}', x, 3.75, 10 + i, hh)
        scenery += t + [copy(o, (o.location.x + dx, o.location.y, o.location.z)) for o in t for dx in P3 if dx]
    lm = clay('lamp', C['lamp'], rough=0.5)
    lamp = [ball('lamp_foot', 0.2, lm, (15.0, 3.8, 0.1), squash=(1, 1, .55), lump=0.02, dents=2, dent_r=(.06, .1)),
            roll('lamp_pole', (15.0, 3.8, 0.1), (15.03, 3.8, 1.95), 0.1, lm, lump=0.014),
            roll('lamp_arm', (15.03, 3.8, 1.95), (15.42, 3.8, 2.08), 0.085, lm, lump=0.01),
            ball('lamp_head', 0.2, lm, (15.5, 3.8, 2.06), squash=(1.25, 1, .6), lump=0.014, dents=2, dent_r=(.05, .08)),
            ball('lamp_bulb', 0.13, clay('bulb', C['bulb'], specks=0, emit=1.2), (15.52, 3.8, 1.97), squash=(1.2, 1, .55), lump=0.006, dents=0)]
    scenery += lamp + [copy(o, (o.location.x + dx, o.location.y, o.location.z)) for o in lamp for dx in P3 if dx]
    group('scenery', *scenery)

    # ---- the truck (far lane), its centre at x = 0
    ty = FAR
    blue, cargo = clay('truck', C['truck'], rough=0.48), clay('cargo', C['cargo'], rough=0.5)
    dark, shine = clay('dark', C['dark'], rough=0.12, specks=0, marks=0.4), clay('shine', C['shine'], rough=0.3, specks=0, marks=0.2)
    tb = [box('t_chassis', (3.4, 1.46, 0.3), clay('truckd', '#3566b4'), (0, ty, 0.29), r=0.1, lump=0.012, dents=2),
          box('t_cargo', (2.2, 1.5, 1.2), cargo, (-0.6, ty, 1.0), r=0.14, d=0.05, lump=0.03, dents=12, seed=2),
          box('t_cab', (0.98, 1.42, 0.92), blue, (1.1, ty, 0.86), r=0.2, d=0.045, lump=0.025, dents=6, seed=3),
          box('t_nose', (0.3, 1.36, 0.42), clay('truckl', '#7fb4ee'), (1.62, ty, 0.6), r=0.1, d=0.04, lump=0.012, dents=1),
          box('t_shield', (0.06, 1.12, 0.4), dark, (1.6, ty, 1.04), r=0.04, d=0.03, lump=0.005, dents=0),
          ball('t_lamp', 0.07, clay('bulb', C['bulb'], specks=0, emit=0.6), (1.77, ty - 0.45, 0.62), lump=0.004, dents=0)]
    tb += window('t_win', 0.56, 0.4, (1.14, ty - 0.715, 1.02), dark, shine)
    group('truck', *tb)
    TW_R = 0.31
    taxles, twheels = [], []
    for i, x in enumerate((1.08, -0.62, -1.28)):
        ax, objs = wheel(f'tw{i}', TW_R, 0.26, (x, ty - 0.74, TW_R), seed=i); taxles.append(ax); twheels += objs
        group(f'tw{i}', *objs)
    # ---- your car (near lane), and the same car facing left, and turning round (a U-turn, 8 steps of 22.5 degrees)
    cy = NEAR
    croot, cb, caxles, cw = car_build('car', cy)
    group('car', *cb)
    for i, objs in enumerate(cw): group(f'cw{i}', *objs)
    lroot, lb, laxles, lw = car_build('car_l', cy, sx=-1)
    group('car_l', *lb)
    yroot, yb, _, yw = car_build('car_y', cy, both=True)
    group('car_y', *yb, *[o for objs in yw for o in objs])
    # ---- the traffic light on the far pavement (frames: red, green) and the pedals of beat 25
    pole = clay('pole', '#4a524f', rough=0.5)
    light = [roll('tl_pole', (0, SIDE, 0.1), (0, SIDE, 1.7), 0.09, pole, lump=0.01),
             box('tl_box', (0.32, 0.26, 0.82), clay('tlbox', '#2e3436', rough=0.5), (0, SIDE, 2.0), r=0.08, d=0.03, lump=0.01, dents=2)]
    red_on, red_off = clay('redon', '#f05a46', specks=0, emit=2.0), clay('redoff', '#5a2a24', specks=0)
    grn_on, grn_off = clay('grnon', '#5fd27a', specks=0, emit=2.0), clay('grnoff', '#24452c', specks=0)
    lamp_r = ball('tl_red', 0.1, red_on, (0, SIDE - 0.14, 2.22), squash=(1, .5, 1), lump=0.003, dents=0)
    lamp_g = ball('tl_grn', 0.1, grn_off, (0, SIDE - 0.14, 1.78), squash=(1, .5, 1), lump=0.003, dents=0)
    group('light', *light, lamp_r, lamp_g)

    def lights(i):
        def f():
            lamp_r.data.materials[0] = red_on if i == 0 else red_off
            lamp_g.data.materials[0] = grn_off if i == 0 else grn_on
        return f
    # ---- people on the far pavement
    people = {}
    for role, seed in (('you', 1), ('friend', 2)):
        root, objs = person(role, 0, SIDE, seed=seed); group(role, *objs); people[role] = (root, objs)

    lane_y = lambda y, z=0.07: K.px(0, y, z, Y0)[1]
    meta = {'U': K.U, 'elev': a.elev, 'road': {'W': W * K.U, 'Y0': Y0, 'far': round(lane_y(FAR), 2), 'near': round(lane_y(NEAR), 2), 'side': round(lane_y(SIDE, 0.16), 2)}}
    if want('road'):   # two px wider than the period: the copies overlap, so no hairline shows between them
        shot('road', (0, 240, W * K.U + 2, 780), Y0, FOCUS, show=['ground', 'scenery'], extra={'W': W * K.U})
    N = 24
    for name, body, axles, wh, yc, r in (('truck', tb, taxles, ['tw0', 'tw1', 'tw2'], ty, TW_R), ('car', cb, caxles, ['cw0', 'cw1'], cy, CW_R)):
        if want(name):
            offs = [[round(v, 2) for v in (ax.location.x * K.U, K.px(0, ax.location.y, ax.location.z, Y0)[1] - lane_y(yc))] for ax in axles]
            shot(name, rect_of(body, Y0), Y0, FOCUS, show=[name], catch=['ground'], unseen=wh, anchor=(0, lane_y(yc)),
                 extra={'wheel': name + '_wheel', 'wheels': offs, 'r': r * K.U})
        if want(name + '_wheel'):   # the front wheel alone, turning; the body and the ground still light and shade it
            ax = axles[0]
            objs = K.GROUPS[wh[0]]
            shot(name + '_wheel', rect_of(objs, Y0, pad=5, shadow=False), Y0, FOCUS, show=[wh[0]], unseen=[name, 'ground'], frames=turn_frames([ax], N),
                 anchor=K.px(ax.location.x, ax.location.y, ax.location.z, Y0))
    if want('car_l'):
        bpy.context.view_layer.update()      # the mirrored root's transform reaches the axles only after an update
        offs = [[round(v, 2) for v in (ax.matrix_world.translation.x * K.U, K.px(0, ax.matrix_world.translation.y, ax.matrix_world.translation.z, Y0)[1] - lane_y(cy))] for ax in laxles]
        hide = [o for objs in lw for o in objs]
        group('car_l_wheels', *hide)
        shot('car_l', rect_of(lb, Y0), Y0, FOCUS, show=['car_l'], catch=['ground'], unseen=['car_l_wheels'], anchor=(0, lane_y(cy)),
             extra={'wheel': 'car_wheel', 'wheels': offs, 'r': CW_R * K.U})
    if want('car_y'):
        NY = 8                       # 9 poses over the 0.7 s turn: about 12 a second
        turn = lambda i: (lambda: setattr(yroot, 'rotation_euler', (0, 0, math.pi * i / NY)))   # counterclockwise from above: the nose swings away from us
        rs = []
        for i in range(NY + 1): turn(i)(); rs.append(rect_of(yb + [o for objs in yw for o in objs], Y0))
        shot('car_y', union(rs), Y0, FOCUS, show=['car_y'], catch=['ground'], frames=[(i, turn(i)) for i in range(NY + 1)], anchor=(0, lane_y(cy)))
    if want('light'):
        shot('light', rect_of(K.GROUPS['light'], Y0, pad=10), Y0, FOCUS, show=['light'], catch=['ground'], frames=[(0, lights(0)), (1, lights(1))], anchor=(0, lane_y(SIDE, 0.16)))
    for role, (root, objs) in people.items():
        if want(role): shot(role, rect_of(objs, Y0, pad=10), Y0, FOCUS, show=[role], catch=['ground'], anchor=(0, lane_y(SIDE, 0.16)))
    K.write_manifest(meta)


def gable(w, depth, h, d=0.025):
    """A gable roof: a triangle w wide and h high (its foot at z = 0), depth deep along y, rounded a little by finish()."""
    bm = bmesh.new()
    ny = max(2, round(depth / d))
    tri = [(-w / 2, 0), (0, h), (w / 2, 0)]
    rings = []
    for j in range(ny + 1):
        y = -depth / 2 + depth * j / ny
        ring = []
        for (x0, z0), (x1, z1) in zip(tri, tri[1:] + tri[:1]):
            k = max(1, round(math.hypot(x1 - x0, z1 - z0) / d))
            ring += [bm.verts.new((x0 + (x1 - x0) * i / k, y, z0 + (z1 - z0) * i / k)) for i in range(k)]
        rings.append(ring)
    m = len(rings[0])
    for a_, c_ in zip(rings, rings[1:]):
        for i in range(m): bm.faces.new((a_[i], a_[(i + 1) % m], c_[(i + 1) % m], c_[i]))
    bm.faces.new(rings[0][::-1]); bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new('gable'); bm.to_mesh(me); bm.free()
    return me


def house(name, k=1.0):
    """A small clay house standing up z, front -y: walls, a roof that overhangs, a door, a lit window."""
    root = empty(name)
    objs = [box(name + '_walls', (0.4 * k, 0.3 * k, 0.3 * k), clay('wall', '#e8d9b8', rough=0.55), (0, 0, 0.15 * k), r=0.04 * k, d=0.025, lump=0.006, dents=2, dent_r=(.03, .05), parent=root),
            part(name + '_roof', gable(0.5 * k, 0.36 * k, 0.2 * k), clay('roof', '#a65d4b', rough=0.55), (0, 0, 0.29 * k), parent=root, lump=0.005, dents=2, dent_r=(.03, .05)),
            box(name + '_door', (0.08 * k, 0.03, 0.14 * k), clay('doorc', '#5a3b2a'), (-0.08 * k, -0.15 * k, 0.07 * k), r=0.01, d=0.015, lump=0.002, dents=0, parent=root),
            box(name + '_win', (0.09 * k, 0.03, 0.08 * k), clay('bulb', C['bulb'], specks=0, emit=0.5), (0.09 * k, -0.15 * k, 0.17 * k), r=0.01, d=0.015, lump=0.002, dents=0, parent=root)]
    return root, objs


# ================================================================ table: motion is everywhere (beat 2)
if a.set == 'table':
    Y0 = 600.0                         # page y of the lawn at depth 0
    FOCUS = 0.0
    BOOK, ORB, WALK = (3.0, 0.1), (8.0, 0.6), (10.9, -0.4)    # station centres (x, depth); the walk starts at 1090 px
    grass = clay('grass', C['grass'], rough=0.6, feat=1.5, stipple=0.5, prints=0.3, specks=0.4)
    ground = [slab('lawn', -2, 18, -8, 4.6, 0.0, grass, thick=0.3, d=0.14, wobble=0, lump=0.02),
              slab('blanket', 1.6, 4.4, -0.95, 1.15, 0.05, clay('blanket', '#c9706a', rough=0.6, feat=1.2), thick=0.08, d=0.06, wobble=0.04, lump=0.006, seed=2),
              slab('path', 10.2, 16.6, -0.85, 0.05, 0.05, clay('walk', C['walk'], rough=0.58, feat=1.4), thick=0.08, d=0.07, wobble=0.04, lump=0.006, seed=3)]
    mat = ball('mat', 2.25, clay('space', '#22324f', rough=0.55, specks=0.8, feat=1.2), (ORB[0], ORB[1], -0.02), squash=(1, 1, 0.04), d=0.08, lump=0.01, dents=0)   # a dent would go through a mat this thin
    ground.append(mat)
    RO = 1.65                          # the orbit's radius
    for i in range(36):                # the orbit pressed into the mat: cream beads
        t = 2 * math.pi * i / 36
        ground.append(ball(f'orbit{i}', 0.035, clay('line', C['line'], specks=0), (ORB[0] + RO * math.cos(t), ORB[1] + RO * math.sin(t), 0.075), squash=(1, 1, .5), lump=0, dents=0))
    group('ground', *ground)
    group('scenery', *hills([-1.5, 2.0, 5.5, 9.0, 12.5, 16.0], 4.6, 3), *tree('treeA', 0.6, 3.0, 4), *tree('treeB', 15.4, 3.2, 5, h=1.1),
          *tufts(-1, 17, -6.5, -1.4, 34, 8))
    # the notebook: a cover, two pages bowed to the spine, ruled in blue; a third page turns on the spine
    bx, by = BOOK
    cream = clay('page', '#f4f1e8', rough=0.6, specks=0.2, marks=0.6)
    book = [box('cover', (2.3, 1.62, 0.1), clay('coverc', '#a65d4b', rough=0.55), (bx, by, 0.12), r=0.04, d=0.04, lump=0.006, dents=3, dent_r=(.08, .14))]
    for side in (-1, 1):
        book.append(box(f'pages{side}', (1.04, 1.46, 0.08), cream, (bx + side * 0.56, by, 0.2), r=0.03, d=0.035, lump=0.004, dents=1, rot=(0, side * 0.05, 0)))
        for j in range(6): book.append(roll(f'rule{side}{j}', (bx + side * 0.56 - 0.4, by - 0.55 + 0.21 * j, 0.25 + 0.0), (bx + side * 0.56 + 0.4, by - 0.55 + 0.21 * j, 0.25), 0.012, clay('rule', '#86c9e8', specks=0), lump=0))
    BK = 1.35                          # the notebook, larger: scaled about the point under its spine
    for o in book: o.location = Vector((bx, by, 0)) + (o.location - Vector((bx, by, 0))) * BK; o.scale = o.scale * BK
    group('book', *book)
    hinge = empty('hinge', (bx, by, 0.25 * BK)); hinge.scale = (BK, BK, BK)
    leaf = [box('leaf', (1.02, 1.42, 0.035), cream, (0.53, 0, 0.02), r=0.015, d=0.03, lump=0.003, dents=1, parent=hinge)]
    leaf += [roll(f'lrule{j}', (0.13, -0.53 + 0.21 * j, 0.042), (0.93, -0.53 + 0.21 * j, 0.042), 0.011, clay('rule', '#86c9e8', specks=0), lump=0, parent=hinge) for j in range(6)]
    group('leaf', *leaf)
    NP = 16
    turn = lambda i: (lambda: setattr(hinge, 'rotation_euler', (0, -math.pi * i / (NP - 1), 0)))
    # the orrery: a clay Sun on a short stand, a lamp inside it; the Earth on the mat, its lit side to the Sun
    ox, oy = ORB
    sun_light = bpy.data.objects.new('sunlamp', bpy.data.lights.new('sunlamp', 'POINT')); sc.collection.objects.link(sun_light)
    sun_light.data.energy = 40; sun_light.data.shadow_soft_size = 0.2; sun_light.data.color = (1, .85, .6)
    sun_light.location = (ox, oy, 0.85)
    sun = [roll('stand', (ox, oy, 0.05), (ox, oy, 0.5), 0.08, clay('lamp', C['lamp'], rough=0.5), lump=0.01),
           ball('sunball', 0.42, clay('sun', '#f6b832', rough=0.5, specks=0, emit=0.5, marks=0.8), (ox, oy, 0.85), lump=0.02, dents=4, dent_r=(.06, .1))]
    for i in range(10):                # flame beads round the Sun's rim, as a child would press them on
        t = 2 * math.pi * i / 10
        sun.append(ball(f'flame{i}', 0.09, clay('flame', '#f08a3a', specks=0, emit=0.4), (ox + 0.48 * math.cos(t), oy - 0.1, 0.85 + 0.48 * math.sin(t)), squash=(1, .7, 1), lump=0.004, dents=0))
    for o in sun[1:]: o.visible_shadow = False   # the lamp sits inside them
    group('sun', *sun)
    RE = 0.24
    earth = empty('earth', (ox, oy - RO, RE + 0.06))
    eb = [ball('earthball', RE, clay('sea', '#3f7fb0', rough=0.45, specks=0), parent=earth, lump=0.008, dents=1, dent_r=(.04, .06))]
    for j, (u, v) in enumerate([(0.3, 0.5), (2.2, -0.2), (4.0, 0.7), (5.1, -0.5)]):
        n = Vector((math.cos(u) * math.cos(v), math.sin(u) * math.cos(v), math.sin(v)))
        eb.append(ball(f'land{j}', 0.1, clay('land', '#4ea05a', rough=0.55, specks=0), n * (RE - 0.02), squash=(1, 1, .45), rot=n.to_track_quat('Z', 'Y').to_euler(), parent=earth, lump=0.006, dents=0))
    group('earth', *eb)
    NE = 24

    def orbit(i):
        def f():
            th = -math.pi / 2 + 2 * math.pi * i / NE      # counterclockwise seen from above, from the front of the orbit
            earth.location = (ox + RO * math.cos(th), oy + RO * math.sin(th), RE + 0.06)
            ex, ey = K.px(earth.location.x, earth.location.y, earth.location.z, Y0)
            K.aim((ex - ER_[0], ey - ER_[1], ER_[2], ER_[3]), Y0, FOCUS)
        return f
    ER_ = (60, 52, 130, 92)            # the Earth's frame: from its centre, left and up, then size
    # you, walking: eight replacement poses of the stride, in profile to the right
    walkers = []
    for i in range(8):
        root, objs = person('you', WALK[0], WALK[1], pose=math.sin(2 * math.pi * i / 8), face='right', k=1.0)
        group(f'walk{i}', *objs); walkers.append(objs)

    def stride(i):
        def f():
            for j, objs in enumerate(walkers):
                for o in objs: o.hide_render = j != i
        return f
    STEP = 2 * 2 * 0.44 * math.sin(0.34) * K.U   # px a whole stride cycle (two steps) covers: frame = distance / STEP * 8

    at_book = K.px(bx, by, 0.25 * BK, Y0)
    meta = {'table': {'Y0': Y0, 'book': [round(v, 1) for v in at_book], 'sun': [round(v, 1) for v in K.px(ox, oy, 0.85, Y0)],
                      'orbit': [round(v, 1) for v in K.px(ox, oy, RE + 0.06, Y0)] + [RO * K.U, RO * K.U * math.sin(K.E)],
                      'walk': [round(v, 1) for v in K.px(WALK[0], WALK[1], 0.05, Y0)], 'step': round(STEP, 2)}}
    if want('table'): shot('table', (-10, 230, 1620, 670), Y0, FOCUS, show=['ground', 'scenery', 'book'], unseen=['sun'])
    if want('leaf'):
        rs = []
        for i in (0, NP // 2, NP - 1): turn(i)(); rs.append(rect_of(leaf, Y0, pad=10))
        shot('leaf', union(rs), Y0, FOCUS, show=['leaf'], catch=['book', 'ground'], frames=[(i, turn(i)) for i in range(NP)], anchor=at_book)
    if want('sun'): shot('sun', rect_of(sun, Y0, pad=16), Y0, FOCUS, show=['sun'], catch=['ground'])
    if want('earth'):
        orbit(0)()
        e0 = K.px(*earth.location, Y0)
        shot('earth', (e0[0] - ER_[0], e0[1] - ER_[1], ER_[2], ER_[3]), Y0, FOCUS, show=['earth'], catch=['ground'], unseen=['sun'],
             frames=[(i, orbit(i)) for i in range(NE)], anchor=e0)
    if want('walk'):
        rs = []
        for objs in walkers: rs.append(rect_of(objs, Y0, pad=10))
        shot('walk', union(rs), Y0, FOCUS, show=[f'walk{i}' for i in range(8)], catch=['ground'], frames=[(i, stride(i)) for i in range(8)],
             anchor=K.px(WALK[0], WALK[1], 0.05, Y0))
    K.write_manifest(meta)

# ================================================================ globe: Earth from above the North Pole (beat 6)
if a.set == 'globe':
    # Straight down, the light along the axis too (claykit --sun-dir is overridden): every point of the rim is lit
    # alike, so the page may turn the globe's picture and it stays the frame Blender would render at that angle.
    K.elevation(90)
    sun = bpy.data.objects['sun']; sun.rotation_euler = (0, 0, 0); sun.data.angle = math.radians(28)
    EX, EY, R = 4.3, 0.0, 2.0          # page (430, 450), radius 200 px, as the page's EX, EY, ER
    Y0 = 450.0
    table = [slab('table', -3, 21, -10, 8, -R, clay('space', '#121a2e', rough=0.85, feat=1.6, specks=0.5, marks=0.6, spec=0.05), thick=0.3, d=0.16, wobble=0, lump=0.02)]
    rnd = random.Random(12)
    for i in range(70):                # stars: cream beads pressed into the dark table
        x, y = rnd.uniform(-2.5, 20.5), rnd.uniform(-7.5, 7.5)
        if math.hypot(x - EX, y - EY) < R + 0.6: continue
        table.append(ball(f'star{i}', rnd.uniform(0.025, 0.06), clay('star', '#ece8dc', specks=0, emit=0.4), (x, y, -R + 0.01), squash=(1, 1, .5), lump=0, dents=0))
    group('table', *table)
    # the land is the sea ball itself raised a little and coloured (a patty pressed flat on top would stand off the
    # rim as a plate seen edge on): continents as caps round a few centres, edges broken by noise, ice at the pole
    me = rbox_mesh((2 * R, 2 * R, 2 * R), R, 0.045)
    n_ = len(me.vertices)
    co = np.empty(n_ * 3, 'f'); me.vertices.foreach_get('co', co); co = co.reshape(n_, 3)
    nrm = co / np.linalg.norm(co, axis=1)[:, None]
    blobs = [(90, 2, 34), (62, 18, 16), (122, 14, 15), (205, 10, 22), (240, 28, 13), (330, 8, 20), (20, 32, 12), (160, 36, 11)]
    wob = np.array([noise.noise(Vector(v) * 2.2) + 0.5 * noise.noise(Vector(v) * 5.0 + Vector((7, 3, 1))) for v in nrm], 'f')
    landm = np.zeros(n_, 'f')
    for lon, lat, rad in blobs:
        u, v = math.radians(lon), math.radians(lat)
        c_ = np.array([math.cos(u) * math.cos(v), math.sin(u) * math.cos(v), math.sin(v)], 'f')
        ang = np.degrees(np.arccos(np.clip(nrm @ c_, -1, 1)))
        landm = np.maximum(landm, np.clip((rad + 9 * wob - ang) / 3.0, 0, 1))
    icem = np.clip((np.degrees(np.arcsin(np.clip(nrm[:, 2], -1, 1))) - 70 + 6 * wob) / 2.5, 0, 1)
    up = np.maximum(landm, icem)
    me.vertices.foreach_set('co', (co + nrm * (0.07 * up)[:, None]).ravel())
    sea_c, land_c, ice_c = (np.array(K.srgb(h)[:3], 'f') for h in ('#3f7fb0', '#4ea05a', '#eef2f0'))
    col = sea_c * (1 - landm)[:, None] + land_c * landm[:, None]
    col = col * (1 - icem)[:, None] + ice_c * icem[:, None]
    ca = me.color_attributes.new('col', 'FLOAT_COLOR', 'POINT')
    ca.data.foreach_set('color', np.hstack([col, np.ones((n_, 1), 'f')]).ravel())
    g = [part('globe', me, clay('globe', '#ffffff', rough=0.5, specks=0.3, feat=0.8, vcol=True), (EX, EY, 0), lump=0.02, dents=12, dent_r=(.2, .4))]
    group('globe', *g)
    # on the rim at the top: a house, a tree and you, drawn larger, standing out from the ground (local up = outward)

    def on_rim(objs, root, deg, lift=0.0):
        phi = math.radians(90 + deg)
        root.location = (EX + (R + lift) * math.cos(phi), EY + (R + lift) * math.sin(phi), 0)
        root.rotation_euler = (-math.pi / 2, 0, phi - math.pi / 2)   # z (up) to outward, -y (front) to the camera
        return objs
    hroot, hobjs = house('house', k=1.3)
    troot = empty('treeroot'); tobjs = tree('tree', 0, 0, 3, h=0.36)
    for o in tobjs: o.parent = troot
    yroot, yobjs = person('you', 0, 0, k=0.3)
    rim = on_rim(hobjs, hroot, 11.5, 0.05) + on_rim(tobjs, troot, -8, 0.05) + on_rim(yobjs, yroot, 0, 0.06)
    group('rim', *rim)
    centre = (EX * K.U, Y0)
    meta = {'globe': {'c': list(centre), 'R': R * K.U}}
    # the table alone (the page shows it still, in screen space: a picture turned and scaled every frame is slow in
    # Firefox); the globe carries its own soft shadow on the table (round, so it turns with it unchanged)
    if want('space'): shot('space', (0, 0, 1600, 900), Y0, (EX, EY, -R), show=['table'])
    if want('globe'): shot('globe', (430 - 280, 450 - 280, 560, 560), Y0, (EX, EY, 0), show=['globe', 'rim'], catch=['table'], anchor=centre, zoom=2, round_=(250, 278))
    if want('globe_cap'): shot('globe_cap', (430 - 210, 450 - 290, 420, 300), Y0, (EX, EY, 0), show=['globe', 'rim'], anchor=centre, zoom=3)
    K.write_manifest(meta)

# ================================================================ train: the quick check (beat 7)
if a.set == 'train':
    Y0 = 520.0
    FOCUS = -0.3
    X0, X1, ZB, ZT = 1.4, 11.4, 0.4, 3.0         # the carriage: x from 140 to 1140 px, body from ZB to ZT
    DY = 0.75                                     # half its depth: the near wall at -DY
    lil, lil2, dark2 = clay('train', '#a996e6', rough=0.5), clay('trainl', '#cdbff5', rough=0.5), clay('traind', '#7f6cc0', rough=0.5)
    inside = clay('inside', '#6b5a4a', rough=0.6)
    grass = clay('grass', C['grass'], rough=0.6, feat=1.5, stipple=0.5, prints=0.3, specks=0.4)
    ground = [slab('lawn', -2, 18, -7, 5, 0.0, grass, thick=0.3, d=0.14, wobble=0, lump=0.02),
              slab('ballast', -2, 18, -1.05, 1.05, 0.06, clay('ballast', '#5b5048', rough=0.7, feat=0.8, specks=0.8), thick=0.12, d=0.07, wobble=0.04, lump=0.012, seed=4)]
    for i in range(27): ground.append(box(f'sleeper{i}', (0.2, 1.7, 0.08), clay('sleeper', '#4a3d31', rough=0.6), (-1.6 + 0.72 * i, 0, 0.1), r=0.03, d=0.04, lump=0.005, dents=0))
    for k_, y in enumerate((-0.55, 0.55)): ground.append(roll(f'rail{k_}', (-2, y, 0.17), (18, y, 0.17), 0.045, clay('rail', '#a7aca9', rough=0.35, specks=0), lump=0.003))
    # the platform ahead of the carriage, its edge painted yellow
    ground += [box('platform', (3.9, 2.4, 0.95), clay('plat', '#6b7470', rough=0.6, feat=1.3), (14.25, 2.05, 0.47), r=0.08, d=0.06, lump=0.012, dents=5, dent_r=(.1, .2)),
               box('edge', (3.9, 0.16, 0.05), clay('edgey', '#f3c95c', specks=0), (14.25, 0.93, 0.96), r=0.02, d=0.03, lump=0.003, dents=0)]
    group('ground', *ground)
    group('scenery', *hills([-1.0, 2.6, 6.2, 9.8, 13.4, 17.0], 5.0, 7), *tufts(-1, 17, -6, -1.6, 30, 11))
    L = X1 - X0; xc = (X0 + X1) / 2
    wins = [X0 + 1.15 + 1.75 * k_ for k_ in range(5)]      # window centres; the door is at the right end
    WW, WZ0, WZ1 = 1.25, 1.55, 2.55
    body = [box('floor', (L, 2 * DY, 0.2), dark2, (xc, 0, ZB + 0.45), r=0.05, d=0.06, lump=0.01, dents=2),
            box('far', (L, 0.14, ZT - ZB), inside, (xc, DY - 0.07, (ZB + ZT) / 2), r=0.05, d=0.06, lump=0.01, dents=4),
            box('roof', (L + 0.1, 2 * DY + 0.16, 0.24), lil2, (xc, 0, ZT + 0.06), r=0.11, d=0.05, lump=0.015, dents=8, dent_r=(.12, .2)),
            box('lower', (L, 0.16, WZ0 - ZB), lil, (xc, -DY + 0.08, (ZB + WZ0) / 2), r=0.08, d=0.05, lump=0.015, dents=8, dent_r=(.12, .22)),
            box('upper', (L, 0.16, ZT - WZ1), lil, (xc, -DY + 0.08, (WZ1 + ZT) / 2), r=0.06, d=0.05, lump=0.012, dents=4),
            box('band', (L, 0.06, 0.1), lil2, (xc, -DY - 0.01, WZ0 - 0.18), r=0.03, d=0.04, lump=0.004, dents=0)]
    for side in (X0, X1): body.append(box(f'end{side}', (0.16, 2 * DY, ZT - ZB), lil, (side, 0, (ZB + ZT) / 2), r=0.06, d=0.05, lump=0.012, dents=2))
    edges = [X0] + [w_ + s_ * WW / 2 for w_ in wins for s_ in (-1, 1)] + [X1]
    for j in range(0, len(edges), 2):
        if edges[j + 1] - edges[j] > 0.05: body.append(box(f'pillar{j}', (edges[j + 1] - edges[j] + 0.04, 0.16, WZ1 - WZ0 + 0.04), lil, ((edges[j] + edges[j + 1]) / 2, -DY + 0.08, (WZ0 + WZ1) / 2), r=0.05, d=0.04, lump=0.01, dents=1))
    body.append(box('door', (0.6, 0.06, 2.0), dark2, (X1 - 0.6, -DY - 0.02, ZB + 1.1), r=0.06, d=0.04, lump=0.008, dents=2))
    for bx_ in (X0 + 1.6, X1 - 1.6):                # bogies
        body.append(box(f'bogie{bx_}', (1.9, 1.3, 0.32), clay('bogie', '#3b4744', rough=0.6), (bx_, 0, 0.42), r=0.08, d=0.05, lump=0.01, dents=2))
        for dx in (-0.55, 0.55): body.append(ball(f'wh{bx_}{dx}', 0.24, clay('tyre', C['tyre'], rough=0.6), (bx_ + dx, -0.62, 0.32), squash=(1, .4, 1), lump=0.006, dents=0))
    for k_, w_ in enumerate(wins):                  # a seat back behind every window
        body.append(box(f'seat{k_}', (0.8, 0.16, 0.7), clay('seat', '#4f6fb0', rough=0.6), (w_ + 0.15, 0.35, 1.25), r=0.07, d=0.04, lump=0.008, dents=1))
    group('train', *body)
    lamp = bpy.data.objects.new('cabin', bpy.data.lights.new('cabin', 'AREA')); sc.collection.objects.link(lamp)
    lamp.data.energy = 120; lamp.data.size = L * 0.8; lamp.data.color = (1, .92, .8); lamp.location = (xc, 0, ZT - 0.2)
    # Maya sits by the third window; the bottle stands on the sill table in front of her
    mw = wins[2]
    mroot, mobjs = person('maya', mw - 0.15, -0.3, k=0.92); mroot.location.z = 0.95
    sill = box('sill', (0.9, 0.34, 0.06), clay('table', '#8a6a4c', rough=0.55), (mw + 0.1, -0.46, WZ0 + 0.03), r=0.02, d=0.03, lump=0.004, dents=1)
    bot = [part('bottle', lathe_mesh([(0, 0), (0, 0.08), (0.24, 0.08), (0.28, 0.05), (0.3, 0)], 0.02), clay('bottle', '#86c9e8', rough=0.25, specks=0, sss=0.3), (mw + 0.36, -0.46, WZ0 + 0.06), lump=0.004, dents=0),
           part('cap', lathe_mesh([(0, 0), (0, 0.045), (0.07, 0.045), (0.07, 0)], 0.015), clay('capc', '#3d6fbf', specks=0), (mw + 0.36, -0.46, WZ0 + 0.36), lump=0.002, dents=0)]
    group('maya', *mobjs, sill, *bot)
    lroot, lobjs = person('leo', 14.3, 1.8, k=1.1); lroot.location.z = 0.95
    group('leo', *lobjs)
    P = lambda x, y, z: [round(v, 1) for v in K.px(x, y, z, Y0)]
    meta = {'train': {'maya': P(mw - 0.15, -0.3, 0.95 + 1.3 * 0.92), 'bottle': P(mw + 0.36, -0.46, WZ0 + 0.42), 'leo': P(14.3, 1.8, 0.95 + 1.36 * 1.1),
                      'top': P(X0, -DY, ZT + 0.2), 'nose': P(X1, -DY, ZT)}}
    if want('train'): shot('train', (0, 120, 1600, 470), Y0, FOCUS, show=['ground', 'scenery', 'train', 'maya', 'leo'])
    K.write_manifest(meta)


def poses(role, n, face, k, swing, tail=False, z=0.0):
    """n replacement poses of a stride (pose = sin of the phase), one group each; returns their object lists."""
    out = []
    for i in range(n):
        root, objs = person(role, 0, 0, pose=math.sin(2 * math.pi * i / n), face=face, k=k, swing=swing, tail=tail)
        root.location.z = z
        group(f'{role}_{face}{i}', *objs); out.append(objs)
    return out


def stride_shot(name, sets, Y0, focus, anchor, catch=('ground',), zoom=1):
    def pick(i):
        def f():
            for j, objs in enumerate(sets):
                for o in objs: o.hide_render = j != i
        return f
    groups = [g for g in K.GROUPS if any(K.GROUPS[g] is objs or K.GROUPS[g] == objs for objs in sets)]
    shot(name, union([rect_of(objs, Y0, pad=10) for objs in sets]), Y0, focus, show=groups, catch=list(catch),
         frames=[(i, pick(i)) for i in range(len(sets))], anchor=anchor, zoom=zoom)


STEP = lambda k, swing: 4 * 0.44 * k * math.sin(swing) * K.U    # px a whole stride cycle covers (two steps)

# ================================================================ track: speed and velocity on a running track
if a.set == 'track':
    Y0 = 645.0                       # the track's top (z 0.06) at depth 0 lands on page y 640, as the pixel beats' TY
    FOCUS = 0.0
    TOPZ = 0.06
    grass = clay('grass', C['grass'], rough=0.6, feat=1.5, stipple=0.5, prints=0.3, specks=0.4)
    ground = [slab('lawn', -4, 21, -8, 6, 0.0, grass, thick=0.3, d=0.14, wobble=0, lump=0.02),
              slab('track', -3, 20, -1.0, 1.0, TOPZ, clay('trackc', '#b9654c', rough=0.65, feat=0.9, stipple=0.4, specks=0.3), thick=0.12, d=0.07, wobble=0.04, lump=0.006, seed=6)]
    for k_, y in enumerate((-0.92, 0.0, 0.92)):
        ground.append(slab(f'lane{k_}', -3, 20, y - 0.035, y + 0.035, TOPZ + 0.025, clay('line', C['line'], specks=0.2), thick=0.04, d=0.04, wobble=0.012, lump=0.003, seed=30 + k_))
    group('ground', *ground)
    group('scenery', *hills([-3.0, 0.4, 3.8, 7.2, 10.6, 14.0, 17.4, 20.8], 5.2, 13), *tree('treeA', -1.2, 3.0, 21), *tree('treeB', 8.6, 3.6, 22, h=0.9),
          *tree('treeC', 17.2, 3.2, 23, h=1.1), *tufts(-3, 20, -7, -1.6, 46, 24))
    at = (0, Y0 - K.U * TOPZ * COS)
    runner = poses('runner', 8, 'right', 1.1, 0.55, tail=True, z=TOPZ)
    jog_r = poses('you', 8, 'right', 1.1, 0.45, z=TOPZ)
    jog_l = poses('you', 8, 'left', 1.1, 0.45, z=TOPZ)
    # flags: a cream stick with a clay flag of the meaning's colour (time blue, velocity yellow)
    flags = {}
    for nm, col in (('flag_t', '#86c9e8'), ('flag_v', '#f3c95c')):
        fx = 4.0 if nm == 'flag_t' else 6.0
        fl = [roll(nm + '_pole', (fx, 0, TOPZ), (fx, 0, TOPZ + 0.78), 0.028, clay('line', C['line'], specks=0.2), lump=0.003),
              box(nm + '_cloth', (0.26, 0.04, 0.16), clay(nm, col, specks=0), (fx + 0.15, 0, TOPZ + 0.68), r=0.03, d=0.02, lump=0.004, dents=1)]
        group(nm, *fl); flags[nm] = (fl, fx)
    # the finish: a checked strip across the track, and a post at the near edge with a checked flag toward us
    FX = 10.0
    fin = [roll('fpost', (FX, -1.12, TOPZ), (FX, -1.12, TOPZ + 1.7), 0.05, clay('line', C['line'], specks=0.2), lump=0.005)]
    for j in range(13):
        for r_ in range(2):
            col = '#ece8dc' if (j + r_) % 2 else '#262f2d'
            fin.append(box(f'strip{j}{r_}', (0.08, 0.15, 0.02), clay('chk' + col, col, specks=0), (FX - 0.04 + 0.08 * r_, -0.975 + 0.15 * j + 0.075, TOPZ + 0.01), r=0.008, d=0.02, lump=0.001, dents=0))
    for j in range(5):
        for r_ in range(3):
            col = '#ece8dc' if (j + r_) % 2 else '#262f2d'
            fin.append(box(f'flag{j}{r_}', (0.11, 0.03, 0.11), clay('chk' + col, col, specks=0), (FX + 0.06 + 0.11 * j, -1.12, TOPZ + 1.6 - 0.11 * r_), r=0.012, d=0.02, lump=0.002, dents=0))
    group('finish', *fin)
    # a cloud (beat 6's sky) and a pedal (beat 25), shot alone
    cl = [ball(f'cloud{i}', r_, clay('cloud', '#f4f6f4', rough=0.7, specks=0, sss=0.2), (30 + dx, 0, 5 + dz), lump=0.02, dents=3, dent_r=(.06, .12))
          for i, (dx, dz, r_) in enumerate([(-0.45, 0, 0.32), (0, 0.14, 0.42), (0.42, 0.02, 0.34), (0.15, -0.1, 0.3), (-0.2, -0.12, 0.28)])]
    group('cloud', *cl)
    pd = [box('pedal', (0.42, 0.12, 0.62), clay('pedalc', '#59625e', rough=0.55), (40, 0, 5.3), r=0.08, d=0.03, lump=0.01, dents=2)]
    for j in range(4): pd.append(box(f'ridge{j}', (0.34, 0.05, 0.05), clay('ridge', '#3b4442', specks=0), (40, -0.07, 5.08 + 0.14 * j), r=0.02, d=0.015, lump=0.002, dents=0))
    group('pedal', *pd)
    meta = {'track': {'Y0': Y0, 'top': round(at[1], 2), 'run': round(STEP(1.1, 0.55), 2), 'jog': round(STEP(1.1, 0.45), 2)}}
    if want('track'): shot('track', (-100, 300, 1800, 600), Y0, FOCUS, show=['ground', 'scenery'], zoom=2)
    if want('runner'): stride_shot('runner', runner, Y0, FOCUS, at, zoom=2)
    if want('you_jog_r'): stride_shot('you_jog_r', jog_r, Y0, FOCUS, at)
    if want('you_jog_l'): stride_shot('you_jog_l', jog_l, Y0, FOCUS, at)
    for nm, (fl, fx) in flags.items():
        if want(nm): shot(nm, rect_of(fl, Y0, pad=8), Y0, FOCUS, show=[nm], catch=['ground'], anchor=(fx * K.U, at[1]))
    if want('finish'): shot('finish', rect_of(fin, Y0, pad=10), Y0, FOCUS, show=['finish'], catch=['ground'], anchor=(FX * K.U, at[1]), zoom=2)
    if want('cloud'): shot('cloud', rect_of(cl, Y0, pad=6, shadow=False), Y0, (30, 0, 5), show=['cloud'], anchor=K.px(30, 0, 5, Y0))
    if want('pedal'): shot('pedal', rect_of(pd, Y0, pad=6, shadow=False), Y0, (40, 0, 5.3), show=['pedal'], anchor=K.px(40, 0, 5.0, Y0))
    K.write_manifest(meta)

# ================================================================ pool: the dolphin and the walrus (beat 14)
if a.set == 'pool':
    Y0 = 300.0
    FOCUS = 0.0
    DL, WL = 1.2, -1.2                # the dolphin's lane (far) and the walrus's (near), depths
    water = [slab('water', -1.5, 17.5, -2.4, 2.6, 0.0, clay('water', '#2f6f9e', rough=0.22, feat=1.8, specks=0, marks=0.5, sss=0.1), thick=0.4, d=0.1, wobble=0, lump=0.012)]
    tile = clay('tile', '#d8d2c4', rough=0.55, feat=0.8)
    deck = [slab('deck_far', -1.5, 17.5, 2.6, 5.5, 0.14, tile, thick=0.3, d=0.1, wobble=0.02, lump=0.006, seed=3),
            slab('deck_near', -1.5, 17.5, -5.0, -2.4, 0.14, tile, thick=0.3, d=0.1, wobble=0.02, lump=0.006, seed=4)]
    rope = [ball(f'bead{i}', 0.06, clay('rope' + str(i % 2), ['#f05a46', '#ece8dc'][i % 2], specks=0), (-1.4 + 0.2 * i, 0.0, 0.02), squash=(1.2, 1, .8), lump=0, dents=0) for i in range(95)]
    group('water', *water); group('deck', *deck, *rope)
    group('scenery', *hills([-1.0, 2.6, 6.2, 9.8, 13.4, 17.0], 7.2, 31))

    grey, belly = clay('dolphin', '#7d9bb2', rough=0.35, sss=0.1), clay('belly', '#c9d6de', rough=0.4)
    dz = 0.04
    dol = [part('d_body', K.fuse([moved(rbox_mesh((1.5, 0.42, 0.42), 0.21, 0.03), dz=dz),
                                  moved(rbox_mesh((0.36, 0.16, 0.16), 0.08, 0.02), dx=0.86, dz=dz - 0.04),        # the beak
                                  moved(rbox_mesh((0.6, 0.24, 0.26), 0.12, 0.025), dx=-0.88, dz=dz)], voxel=0.02),   # the tail stock
                grey, (2.0, DL, 0), lump=0.012, dents=4, dent_r=(.05, .09)),
           part('d_fin', lathe_mesh([(0, 0.16), (0.12, 0.09), (0.3, 0.0)], 0.02), grey, (1.95, DL, dz + 0.17), rot=(0, -0.35, 0), scale=(1.1, 0.35, 1), lump=0.006, dents=0),
           ball('d_fluke0', 0.17, grey, (2.0 - 1.22, DL - 0.12, dz + 0.05), squash=(1, 1.4, .25), lump=0.004, dents=0),
           ball('d_fluke1', 0.17, grey, (2.0 - 1.22, DL + 0.12, dz + 0.05), squash=(1, 1.4, .25), lump=0.004, dents=0),
           ball('d_eye', 0.03, clay('eye', '#1d2a35', specks=0), (2.0 + 0.6, DL - 0.18, dz + 0.1), lump=0, dents=0)]
    brown = clay('walrus', '#8a6248', rough=0.5, sss=0.1)
    wal = [part('w_body', K.fuse([moved(rbox_mesh((1.15, 0.8, 0.62), 0.3, 0.035), dz=0.08),
                                  moved(rbox_mesh((0.5, 0.48, 0.44), 0.2, 0.03), dx=0.66, dz=0.22)], voxel=0.025),
                brown, (2.0, WL, 0), lump=0.02, dents=6, dent_r=(.06, .12)),
           ball('w_muzzle', 0.15, clay('muzzle', '#c9a487', rough=0.55), (2.0 + 0.9, WL - 0.08, 0.2), squash=(1, 1.3, .8), lump=0.006, dents=0),
           roll('w_tusk0', (2.0 + 0.94, WL - 0.16, 0.14), (2.0 + 0.98, WL - 0.2, -0.12), 0.025, clay('tusk', '#f2ead8', specks=0), lump=0),
           roll('w_tusk1', (2.0 + 0.94, WL + 0.02, 0.14), (2.0 + 0.98, WL + 0.04, -0.12), 0.025, clay('tusk', '#f2ead8', specks=0), lump=0),
           ball('w_eye', 0.03, clay('eye', '#1d2a35', specks=0), (2.0 + 0.8, WL - 0.2, 0.36), lump=0, dents=0),
           ball('w_flip', 0.16, brown, (2.0 + 0.2, WL - 0.42, 0.06), squash=(1.3, .5, .3), lump=0.004, dents=0)]
    for nm, objs, ly, L_ in (('dol', dol, DL, 1.0), ('wal', wal, WL, 0.75)):
        for i in range(12):   # a wake: pale beads round the waterline
            t = 2 * math.pi * i / 12
            objs.append(ball(f'{nm}_wake{i}', 0.05, clay('wake', '#d5e7f0', specks=0, rough=0.4), (2.0 + L_ * math.cos(t), ly + 0.32 * math.sin(t), 0.01), squash=(1.6, 1, .35), lump=0, dents=0))
    group('dolphin', *dol); group('walrus', *wal)
    lane = lambda y: K.px(2.0, y, 0, Y0)
    meta = {'pool': {'Y0': Y0, 'dolphin': [round(v, 1) for v in lane(DL)], 'walrus': [round(v, 1) for v in lane(WL)]}}
    if want('pool'): shot('pool', (0, 100, 1600, 380), Y0, FOCUS, show=['water', 'deck', 'scenery'])
    if want('dolphin'): shot('dolphin', rect_of(dol, Y0, pad=10), Y0, FOCUS, show=['dolphin'], holdout=['water'], anchor=lane(DL))
    if want('walrus'): shot('walrus', rect_of(wal, Y0, pad=10), Y0, FOCUS, show=['walrus'], holdout=['water'], anchor=lane(WL))
    K.write_manifest(meta)

# ================================================================ top: seen and lit straight down
if a.set == 'top':
    K.elevation(90)
    sun = bpy.data.objects['sun']; sun.rotation_euler = (0, 0, 0); sun.data.angle = math.radians(18)
    Y0 = 0.0                                          # page (x, y) is Blender (x / 100, -y / 100)
    B = lambda x, y: (x / K.U, -y / K.U)
    grass = clay('grass', C['grass'], rough=0.6, feat=1.5, stipple=0.5, prints=0.3, specks=0.4, spec=0.1)
    roadc, line = clay('road', C['road'], rough=0.55, feat=1.6, specks=0.6, spec=0.1), clay('line', C['line'], specks=0.3, spec=0.1)

    def lawn(name, x0, y0, x1, y1):
        (bx0, by1), (bx1, by0) = B(x0, y0), B(x1, y1)
        return slab(name, bx0, bx1, by0, by1, 0.0, grass, thick=0.3, d=0.14, wobble=0, lump=0.02)

    def road(name, pts, closed=False):
        P = [B(*p_) for p_ in pts]
        objs = [ribbon(name, P, 0.65, 0.04, roadc, closed=closed)]
        # the centre dashes: 40 px on, 40 off, along the line
        Q = [Vector((x, y, 0)) for x, y in P] + ([Vector((*P[0], 0))] if closed else [])
        acc, on, i = 0.0, True, 0
        for a_, b_ in zip(Q, Q[1:]):
            L_ = (b_ - a_).length; u = 0.0
            while u < L_:
                step = min(0.4 - acc, L_ - u)
                if on and step > 0.02:
                    p0, p1 = a_.lerp(b_, u / L_), a_.lerp(b_, (u + step) / L_)
                    objs.append(ribbon(f'{name}_dash{i}', [p0.xy, p1.xy], 0.035, 0.1, line, lump=0.002, seed=i)); i += 1
                acc += step; u += step
                if acc >= 0.4 - 1e-6: acc, on = 0.0, not on
        return objs

    def roofhouse(name, x, y, w, h, col='#a65d4b'):
        cx, cy_ = B(x + w / 2, y + h / 2)
        return [box(name, (w / K.U, h / K.U, 0.5), clay('wall', '#e8d9b8', rough=0.55), (cx, cy_, 0.25), r=0.06, d=0.05, lump=0.01, dents=3),
                part(name + '_roof', gable(w / K.U * 1.08, h / K.U * 1.06, 0.36), clay('roofc' + col, col, rough=0.55), (cx, cy_, 0.5), lump=0.01, dents=4, dent_r=(.1, .2))]

    def bush(name, x, y, r_):
        return ball(name, r_ / K.U, clay('leaf', C['leaf'], rough=0.55), (*B(x, y), 0.15), squash=(1, 1, .7), lump=0.03, dents=5, dent_r=(.08, .15))
    # the corner street (beats 19 and 26): the route of overheadStreet in the page
    arc = [(850 + 250 * math.sin(t), 370 + 250 * math.cos(t)) for t in (math.pi / 2 * i / 24 for i in range(25))]
    corner = [lawn('lawn_c', -200, -200, 1800, 1100)] + road('route', [(-300, 620)] + arc + [(1100, -400)])
    for i, (x, y) in enumerate([(180, 260), (420, 260), (660, 260)]): corner += roofhouse(f'house{i}', x, y, 150, 120)
    for i, (x, y) in enumerate([(1320, 560), (1250, 760), (60, 860)]): corner.append(bush(f'tree{i}', x + 32, y + 32, 44))
    group('corner', *corner)
    # the round track (beat 23's third box): a ring road round (800, 450), radius 300
    ring = [(800 + 300 * math.cos(t), 450 + 300 * math.sin(t)) for t in (2 * math.pi * i / 96 for i in range(96))]
    loop = [lawn('lawn_l', 0, 0, 1600, 900)] + road('ring', ring, closed=True) + [bush('lbush0', 800, 450, 70), bush('lbush1', 740, 400, 40), bush('lbush2', 860, 500, 46)]
    for o in loop: o.location.x += 30                  # built aside, so the sets do not overlap
    group('loop', *loop)
    # the square block (beat 20): a pavement round a lawn with three houses
    X0, X1, Y0b, Y1 = 520, 1080, 110, 390
    walk = clay('walk', C['walk'], rough=0.58, feat=1.4, spec=0.1)
    (bx0, by1), (bx1, by0) = B(X0 - 50, Y0b - 50), B(X1 + 50, Y1 + 50)
    block = [lawn('lawn_b', X0 - 100, Y0b - 100, X1 + 100, Y1 + 100), slab('pave', bx0, bx1, by0, by1, 0.05, walk, thick=0.1, d=0.08, wobble=0.02, lump=0.006, seed=8)]
    (ix0, iy1), (ix1, iy0) = B(X0 + 30, Y0b + 30), B(X1 - 30, Y1 - 30)
    block.append(slab('inner', ix0, ix1, iy0, iy1, 0.1, grass, thick=0.1, d=0.1, wobble=0.02, lump=0.01, seed=9))
    for i, (x, y) in enumerate([(X0 + 80, Y0b + 70), (X0 + 250, Y0b + 70), (X0 + 420, Y0b + 130)]): block += roofhouse(f'bhouse{i}', x, y, 110, 90, ['#a65d4b', '#6f86b8', '#c9905a'][i])
    for o in block: o.location.y -= 30
    group('block', *block)
    # the flower bed (beat 27)
    rnd = random.Random(41)
    bed = [lawn('lawn_m', -40, 30, 1640, 480)]
    for i in range(46):
        x, y = rnd.uniform(0, 1600), rnd.uniform(60, 450)
        if math.hypot(x - 800, y - 270) < 110: continue
        c = rnd.choice(['#f4a48c', '#ece8dc', '#f3c95c', '#bba8ee', '#e8a0c8'])
        for j in range(5):
            t = 2 * math.pi * j / 5
            bed.append(ball(f'pet{i}_{j}', 0.075, clay('petal' + c, c, specks=0, spec=0.1), (*B(x + 9 * math.cos(t), y + 9 * math.sin(t)), 0.08), squash=(1, 1, .4), lump=0, dents=0))
        bed.append(ball(f'eye{i}', 0.05, clay('fcentre', '#f6c445', specks=0), (*B(x, y), 0.11), squash=(1, 1, .5), lump=0, dents=0))
    for o in bed: o.location.y -= 60
    group('bed', *bed)
    # sprites, all at the origin facing east (+x), turned by the page
    croot, cbody, _, cwh = car_build('car_t', 0, both=True)
    croot.location = (60, 0, 0)
    group('car_top', *cbody, *[o for objs in cwh for o in objs])
    shirt, skin, hair = clay('you', C['you'], rough=0.5, spec=0.15), clay('skin', C['skin'], sss=0.2, specks=0.3, spec=0.15), clay('hair', C['hair'], rough=0.45, spec=0.15)
    walker = [ball('wk_body', 0.22, shirt, (70, 0, 0.8), squash=(.7, 1.15, .6), lump=0.01, dents=2, dent_r=(.04, .07)),
              ball('wk_armL', 0.08, shirt, (70.03, -0.27, 0.72), squash=(1.4, 1, 1), lump=0.004, dents=0),
              ball('wk_armR', 0.08, shirt, (69.97, 0.27, 0.72), squash=(1.4, 1, 1), lump=0.004, dents=0),
              ball('wk_head', 0.15, skin, (70.02, 0, 1.05), lump=0.006, dents=0),
              ball('wk_hair', 0.155, hair, (69.97, 0, 1.1), squash=(1, 1, .7), lump=0.008, dents=1),
              ball('wk_shoeL', 0.07, clay('shoe', C['shoe']), (70.2, -0.1, 0.05), squash=(1.5, .9, .6), lump=0, dents=0),
              ball('wk_shoeR', 0.07, clay('shoe', C['shoe']), (70.08, 0.1, 0.05), squash=(1.5, .9, .6), lump=0, dents=0)]
    group('walker_top', *walker)
    yel, blk = clay('beey', '#f6c445', rough=0.45, spec=0.15), clay('beeb', '#262f2d', rough=0.45, spec=0.15)
    bee = [ball('bee_body', 0.3, yel, (80, 0, 0.5), squash=(1.45, 1, .9), lump=0.01, dents=1, dent_r=(.04, .06)),
           ball('bee_head', 0.17, blk, (80.42, 0, 0.52), lump=0.004, dents=0)]
    for j, dx in enumerate((-0.12, 0.08, 0.28)): bee.append(ball(f'bee_band{j}', 0.31, blk, (80 + dx - 0.05, 0, 0.5), squash=(.12, .95, .87), lump=0, dents=0))
    for j, sy in enumerate((-1, 1)): bee.append(ball(f'bee_wing{j}', 0.24, clay('wing', '#e4f0f6', rough=0.3, specks=0, sss=0.3, spec=0.2), (80.02, sy * 0.3, 0.82), squash=(.75, 1.25, .12), rot=(0, 0, sy * -0.35), lump=0, dents=0))
    group('bee', *bee)
    meta = {'top': {'car': 0.58, 'note': 'sprites face east at rotation 0; the page turns them'}}
    if want('corner'): shot('corner', (-200, -200, 2000, 1300), Y0, (0, 0, 0), show=['corner'])
    if want('loop'): shot('loop', (3000, 0, 1600, 900), Y0, (30, 0, 0), show=['loop'], extra={'x': 0, 'y': 0})
    if want('block'): shot('block', (420, 10 + 3000, 760, 480), Y0, (0, -30, 0), show=['block'], extra={'y': 10})
    if want('bed'): shot('bed', (-40, 30 + 6000, 1680, 450), Y0, (0, -60, 0), show=['bed'], extra={'y': 30})
    if want('car_top'): shot('car_top', (6000 - 150, -150, 300, 300), Y0, (60, 0, 0), show=['car_top'], anchor=(6000, 0), zoom=2)
    if want('walker_top'): shot('walker_top', (7000 - 45, -45, 90, 90), Y0, (70, 0, 0), show=['walker_top'], anchor=(7000, 0), zoom=2)
    if want('bee'): shot('bee', (8000 - 70, -70, 140, 140), Y0, (80, 0, 0), show=['bee'], anchor=(8000, 0), zoom=2)
    K.write_manifest(meta)
