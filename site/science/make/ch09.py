"""ch09.py: the clay pictures of Elementary Physics chapter 1 (site/science/ch09, "Motion"), Section 1.

    blender --background --factory-startup --python site/science/make/ch09.py -- --set road [--only truck,car] \
        [--engine cycles] [--device auto|OPTIX|CUDA|METAL|CPU] [--samples 64] [--scale 100] [--fstop 0.2] [--draft]

    --set park   beat 1: the ball's track on the grass (plate `park`, strip `ball`)
    --set road   beats 0, 3, 4, 5: the road (plate `road`, one period that repeats), truck and car (sprites and
                 wheel strips), you and your friend

Paths come from this file's place in the repository; every setting is an argument (claykit.arguments). What each
asset is and why it is exact under the page's own motion is in claykit.py. Finals on a GPU:
    --device OPTIX --samples 256 --scale 200
"""
import bpy, math, os, sys, random
from mathutils import Vector
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import claykit as K
from claykit import clay, box, ball, roll, slab, part, empty, copy, group, shot, lathe_mesh, rbox_mesh

a = K.arguments(lambda ap: ap.add_argument('--set', required=True, choices=['park', 'road']))
ONLY = set(filter(None, a.only.split(',')))
want = lambda n: not ONLY or n in ONLY
if a.fstop is None: a.fstop = {'park': 0.2, 'road': 0.26}[a.set]   # the road holds two lanes and a pavement in its sharp band
sc = K.setup(a)
COS, SIN = math.cos(K.E), math.sin(K.E)
SUN = Vector(a.sun_dir)

# the book's colours as clay (the labels over the picture keep the exact hexes; AgX takes a little saturation off)
C = dict(grass='#2c5e3a', hill='#274a35', road='#3d4744', walk='#74817b', line='#ece8dc', wood='#9a7350', slate='#1c2925',
         tyre='#2e3338', hub='#c3ccd3', glass='#d2e8ff', skin='#f0c3a0', hair='#353b47', jeans='#4878d2', shoe='#3a3f4a',
         you='#ab8ff5', friend='#f59a80', truck='#4a8de0', cargo='#b4d0ff', car='#55c486', trunk='#8a5a3c', leaf='#3f9a52',
         lamp='#c8dcf5', bulb='#ffe9a0', ballw='#f2efe6', balld='#262f2d')


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


def wheel(name, r, w, loc, seed):
    """A wheel on an axle along y: returns the axle empty; turn it with rotation_euler.y (positive rolls to +x)."""
    ax = empty(name + '_axle', loc)
    s = 0.25 * w
    tyre = part(name, lathe_mesh([(-w / 2, 0), (-w / 2, r - s), (-w / 2 + s, r), (w / 2 - s, r), (w / 2, r - s), (w / 2, 0)], 0.035),
                clay('tyre', C['tyre'], rough=0.62, specks=0.5), rot=(math.pi / 2, 0, 0), parent=ax, lump=0.012, dents=2, dent_r=(0.06, 0.1), seed=seed)
    # the lathe's +z is now -y (toward the camera): the hub cap and its marks sit on that face
    hub = part(name + '_hub', lathe_mesh([(0, 0), (0, r * 0.5), (0.05, r * 0.42), (0.06, 0)], 0.03), clay('hub', C['hub'], rough=0.4),
               loc=(0, 0, w / 2 - 0.01), parent=tyre, lump=0.008, dents=0, seed=seed)
    # one bead of the vehicle's own... a cream bead off the centre and a thumb hollow across from it: the turn is seen
    part(name + '_bead', rbox_mesh((r * 0.3, r * 0.3, 0.07), 0.03, 0.02), clay('line', C['line']), loc=(r * 0.68, 0, w / 2 + 0.005), parent=tyre, lump=0.004, dents=0)
    part(name + '_nut', rbox_mesh((r * 0.2, r * 0.2, 0.06), 0.03, 0.02), clay('tyre', C['tyre']), loc=(0.02, 0.01, w / 2 + 0.05), parent=tyre, lump=0.003, dents=0)
    return ax, [tyre] + list(tyre.children)


def turn_frames(axles, n):
    def pose(i):
        def f():
            for ax in axles: ax.rotation_euler = (0, 2 * math.pi * i / n, 0)
        return f
    return [(i, pose(i)) for i in range(n)]


def tree(name, x, y, seed, h=1.0):
    rnd = random.Random(seed)
    objs = [roll(name + '_trunk', (x, y, -0.05), (x + rnd.uniform(-.05, .05), y, 0.85 * h), 0.13, clay('trunk', C['trunk'], rough=0.6), lump=0.02)]
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


def person(role, x, y, pose=0.0, face='cam', seed=0, k=1.1):
    """A small, simple clay figure, 1.2 * k units tall, no face. pose: the stride, -1..1 (0 stands): one leg and the
    other arm forward by that much, as a replacement puppet's next pose. face: 'cam' looks out of the picture (the
    hair sits on the back of the head, away from us), 'right' is a profile walking to +x."""
    root = empty(role, (x, y, 0)); root.scale = (k, k, k)
    shirt = clay(role, C[role], rough=0.5)
    jeans, skin = clay('jeans', C['jeans']), clay('skin', C['skin'], sss=0.2, specks=0.3)
    objs = []
    for side in (-1, 1):
        s = pose * side * 0.34                                      # this leg's swing, radians
        hip = Vector((0, side * 0.11, 0.5)); foot = hip + Vector((math.sin(s) * 0.44, 0, -math.cos(s) * 0.44))
        lift = max(0, -pose * side) * 0.03
        objs.append(roll(f'{role}_leg{side}', hip, foot + Vector((0, 0, lift)), 0.1, jeans, parent=root, seed=seed + side))
        objs.append(ball(f'{role}_shoe{side}', 0.105, clay('shoe', C['shoe']), foot + Vector((0.05 if face == 'right' else 0, -0.04 if face == 'cam' else 0, lift - 0.02)),
                         squash=(1.5, .95, .7) if face == 'right' else (.95, 1.5, .7), parent=root, lump=0.008, dents=0))
        sh = Vector((0, side * 0.25, 0.86)); t = -pose * side * 0.4
        hand = sh + Vector((math.sin(t) * 0.36, side * 0.04, -math.cos(t) * 0.36))
        objs.append(roll(f'{role}_arm{side}', sh, hand, 0.075, shirt, parent=root, seed=seed + 5 + side))
        objs.append(ball(f'{role}_hand{side}', 0.08, skin, hand + Vector((0, 0, -0.03)), parent=root, lump=0.006, dents=0))
    objs.append(part(f'{role}_body', lathe_mesh([(0.42, 0), (0.42, 0.21), (0.6, 0.235), (0.82, 0.21), (0.93, 0.14), (0.96, 0)], 0.035), shirt,
                     scale=(0.92, 1.12, 1), parent=root, lump=0.02, dents=4, dent_r=(.07, .12), seed=seed + 9))
    objs.append(ball(f'{role}_head', 0.215, skin, (0, 0, 1.08), parent=root, lump=0.012, dents=2, dent_r=(.05, .08), seed=seed + 3))
    back = Vector((-0.07, 0, 0)) if face == 'right' else Vector((0, 0.08, 0))
    objs.append(ball(f'{role}_hair', 0.225, clay('hair', C['hair'], rough=0.45), Vector((0, 0, 1.15)) + back, squash=(1.02, 1.02, .74), parent=root, lump=0.02, dents=3, dent_r=(.05, .08), seed=seed + 4))
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
    group('scenery', *hills([-7, -3.6, -0.5, 2.8, 6.2, 9.4, 12.6, 15.8, 19.2, 22.6], 3.3, 2),
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
    scenery = hills([1.5, 4.8, 8.4, 11.6, 15.0, 18.3, 21.8], 5.3, 5, P3) + tufts(0, W, -7.2, -3.6, 30, 9, P3)
    for i, (x, hh) in enumerate([(3.0, 1.0), (19.0, 1.08)]):
        t = tree(f'tree{i}', x, 3.75, 10 + i, hh)
        scenery += t + [copy(o, (o.location.x + dx, o.location.y, o.location.z)) for o in t for dx in P3 if dx]
    lamp = [roll('lamp_pole', (15.0, 3.8, -0.05), (15.02, 3.8, 2.08), 0.055, clay('lamp', C['lamp'], rough=0.4), lump=0.008),
            roll('lamp_arm', (15.02, 3.8, 2.08), (15.42, 3.8, 2.14), 0.05, clay('lamp', C['lamp']), lump=0.006),
            ball('lamp_bulb', 0.09, clay('bulb', C['bulb'], specks=0, emit=1.5), (15.44, 3.8, 2.06), squash=(1.4, 1, .7), lump=0.004, dents=0)]
    scenery += lamp + [copy(o, (o.location.x + dx, o.location.y, o.location.z)) for o in lamp for dx in P3 if dx]
    group('scenery', *scenery)

    # ---- the truck (far lane), its centre at x = 0
    ty = FAR
    blue, cargo, glass = clay('truck', C['truck'], rough=0.48), clay('cargo', C['cargo'], rough=0.5), clay('glass', C['glass'], rough=0.3, specks=0.2)
    tb = [box('t_chassis', (3.4, 1.46, 0.3), clay('truckd', '#3566b4'), (0, ty, 0.29), r=0.1, lump=0.012, dents=2),
          box('t_cargo', (2.2, 1.5, 1.2), cargo, (-0.6, ty, 1.0), r=0.14, d=0.05, lump=0.03, dents=12, seed=2),
          box('t_cab', (0.98, 1.42, 0.92), blue, (1.1, ty, 0.86), r=0.2, d=0.045, lump=0.025, dents=6, seed=3),
          box('t_nose', (0.3, 1.36, 0.42), clay('truckl', '#7fb4ee'), (1.62, ty, 0.6), r=0.1, d=0.04, lump=0.012, dents=1),
          box('t_win', (0.5, 0.06, 0.36), glass, (1.18, ty - 0.71, 1.0), r=0.03, d=0.03, lump=0.006, dents=0),
          box('t_shield', (0.06, 1.1, 0.36), glass, (1.59, ty, 1.03), r=0.03, d=0.03, lump=0.006, dents=0),
          ball('t_lamp', 0.07, clay('bulb', C['bulb'], specks=0, emit=0.6), (1.77, ty - 0.45, 0.62), lump=0.004, dents=0)]
    group('truck', *tb)
    TW_R = 0.31
    taxles, twheels = [], []
    for i, x in enumerate((1.08, -0.62, -1.28)):
        ax, objs = wheel(f'tw{i}', TW_R, 0.26, (x, ty - 0.74, TW_R), seed=i); taxles.append(ax); twheels += objs
        group(f'tw{i}', *objs)
    # ---- your car (near lane)
    cy = NEAR
    green = clay('car', C['car'], rough=0.46)
    cb = [box('c_body', (2.5, 1.26, 0.5), green, (0, cy, 0.42), r=0.2, d=0.045, lump=0.02, dents=7, seed=4),
          box('c_cabin', (1.3, 1.12, 0.52), clay('carl', '#6fd39a'), (-0.12, cy, 0.84), r=0.24, d=0.04, lump=0.02, dents=4, seed=5),
          box('c_win', (0.86, 0.06, 0.27), glass, (-0.12, cy - 0.56, 0.87), r=0.03, d=0.03, lump=0.006, dents=0),
          box('c_shield', (0.06, 0.86, 0.27), glass, (0.535, cy, 0.87), r=0.03, d=0.03, lump=0.006, dents=0),
          ball('c_lamp', 0.07, clay('bulb', C['bulb'], specks=0, emit=0.6), (1.25, cy - 0.38, 0.46), lump=0.004, dents=0)]
    group('car', *cb)
    CW_R = 0.27
    caxles, cwheels = [], []
    for i, x in enumerate((0.76, -0.78)):
        ax, objs = wheel(f'cw{i}', CW_R, 0.24, (x, cy - 0.63, CW_R), seed=7 + i); caxles.append(ax); cwheels += objs
        group(f'cw{i}', *objs)
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
    for role, (root, objs) in people.items():
        if want(role): shot(role, rect_of(objs, Y0, pad=10), Y0, FOCUS, show=[role], catch=['ground'], anchor=(0, lane_y(SIDE, 0.16)))
    K.write_manifest(meta)
