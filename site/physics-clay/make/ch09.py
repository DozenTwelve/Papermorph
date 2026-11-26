"""ch09.py: the clay pictures of Elementary Physics chapter 1, "Motion", clay edition (site/physics-clay/ch09), made with
the Skill's clay kit (.claude/skills/papermorph/scripts/claykit.py, clayprops.py; the method: references/core/clay.md).

    blender --background --factory-startup --python-exit-code 1 --python site/physics-clay/make/ch09.py -- --set road \
        [--only truck,car] [--engine cycles] [--device auto|OPTIX|CUDA|METAL|CPU] [--samples 64] [--scale 100] [--fstop 0.2] [--draft]

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
                 street, the round track, the neighbourhood round one square block, the flower bed; the car, a walker and a bee from above

    --mock A|B|C --mockbeat 3|9|10|15   a look test of one beat's whole frame (a draft: raw PNG only, nothing else shot)

Paths come from this file's place in the repository (raw frames to books/science-clay/render, pictures to
img/clay); every setting is an argument (claykit.arguments). Finals on a GPU: --device OPTIX --samples 256 --scale 200
"""
import bpy, math, os, sys, random
import numpy as np
from mathutils import noise
from mathutils import Vector
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..'))
sys.path.insert(0, os.path.join(ROOT, '.claude', 'skills', 'papermorph', 'scripts'))   # the Skill's clay kit
import claykit as K
import clayprops as Props
from claykit import clay, box, ball, roll, slab, part, empty, copy, group, shot, lathe_mesh, rbox_mesh, moved, ribbon, rect_of, union, turn_frames, want
from clayprops import daysky, wheel, window, car_build, tree, hills, tufts, person, gable, house, poses, stride_shot, CW_R, TW_R

# every picture each set writes: --only is checked against it before anything is built
ASSETS = {'park': ['park', 'ball', 'ball_shadow'],
          'road': ['road', 'truck', 'truck_wheel', 'car', 'car_wheel', 'car_l', 'car_y', 'light', 'you', 'friend'],
          'table': ['table', 'leaf', 'sun', 'earth', 'walk'],
          'globe': ['space', 'globe', 'globe_cap'],
          'train': ['train'],
          'track': ['track', 'runner', 'you_jog_r', 'you_jog_l', 'flag_t', 'flag_v', 'finish', 'cloud', 'pedal',
                    'slate_s', 'slate_l', 'chalk_w', 'chalk_t', 'card', 'practice'],
          'pool': ['pool', 'dolphin', 'walrus'],
          'top': ['corner', 'loop', 'hood', 'bed', 'car_top', 'walker_top', 'bee']}
MOCK_SET = {3: 'road', 9: 'road', 10: 'track', 15: 'track'}   # the look tests at the end: beat -> its set


def _extra(ap):
    ap.add_argument('--set', required=True, choices=list(ASSETS))
    ap.add_argument('--mock', default='', choices=['', 'A', 'B', 'C'], help='a look test of the upper frame for one beat, a draft that renders nothing else: A (the set\'s painted back wall), B (+ a chalkboard), C (+ a wooden sign; a paper card on beat 15)')
    ap.add_argument('--mockbeat', type=int, default=0, help='3, 9 (road set) or 10, 15 (track set)')


a = K.arguments(_extra, out=os.path.join(ROOT, 'books', 'science-clay', 'render'), site=os.path.join(ROOT, 'site', 'physics-clay', 'img', 'clay'))
if a.fstop is None: a.fstop = {'park': 0.2, 'road': 0.26, 'table': 0.22, 'globe': 0.8, 'train': 0.3, 'track': 0.22, 'pool': 0.3, 'top': 1.2}[a.set]   # the road holds two lanes and a pavement in its sharp band
assets = ASSETS[a.set]
if a.mock:   # a look test: checked first, then the set is built but only the mock is shot, as a draft
    if MOCK_SET.get(a.mockbeat) != a.set:
        K.die(f'--mock {a.mock} --mockbeat {a.mockbeat}: the mock beats are ' + ', '.join(f'{b} (--set {s_})' for b, s_ in MOCK_SET.items()))
    if a.only: K.die('--mock renders the mock alone: drop --only')
    a.draft = True; a.only = f'mock_{a.mockbeat}{a.mock}'; assets = assets + [a.only]
sc = K.setup(a, a.set, assets)
COS, SIN = math.cos(K.E), math.sin(K.E)
C = Props.C   # the book's colours as clay: clayprops' palette is this book's


# ================================================================ park: the ball's track (beat 1)
if a.set == 'park':
    # Page layout kept from the pixel beat: 0 m at x = 200, 120 px a metre, the ball (radius 40) centred on y = 560.
    TOP, R = 0.16, 0.4
    Y0 = 560 + K.U * (TOP + R) * COS       # the ground at depth 0, so the ball's centre lands on 560
    FOCUS = 0.0
    xm = lambda v: 2.0 + 1.2 * v
    g = clay('grass', C['grass'], rough=0.6, feat=1.5, stipple=0.5, prints=0.3, specks=0.4)
    ground = [slab('grass', -9, 25, -10, 5.9, 0.0, g, thick=0.3, d=0.14, wobble=0.0, lump=0.02),
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
    group('sky', *daysky(5.6, -9, 25, 10.5, 7, 101))
    if want('park'): shot('park', (-200, -420, 2000, 1420), Y0, FOCUS, show=['ground', 'scenery', 'sky'])
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
        ground += [slab('grass', dx, dx + W, -9.5, 7.9, 0.0, clay('grass', C['grass'], rough=0.6, feat=1.5, stipple=0.5, prints=0.3, specks=0.4, period=W), thick=0.3, d=0.14, wobble=0, lump=0.02, period=W),
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
    group('sky', *daysky(7.6, -W, 2 * W, 13.5, 5, 102, period=W, copies=P3))

    # ---- the truck (far lane), its centre at x = 0
    ty = FAR
    tb, twh = Props.truck_build(ty)
    group('truck', *tb)
    taxles, twheels = [], []
    for i, (ax, objs) in enumerate(twh):
        taxles.append(ax); twheels += objs
        group(f'tw{i}', *objs)
    # ---- your car (near lane), and the same car facing left, and turning round (a U-turn, 8 steps of 22.5 degrees)
    cy = NEAR
    croot, cb, caxles, cw = car_build('car', cy)
    group('car', *cb)
    for i, objs in enumerate(cw): group(f'cw{i}', *objs)
    lroot, lb, laxles, lw = car_build('car_l', cy, sx=-1)
    group('car_l', *lb)
    group('car_l_wheels', *[o for objs in lw for o in objs])   # in a group, so every other shot leaves them out
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
        shot('road', (0, -760, W * K.U + 2, 1780), Y0, FOCUS, show=['ground', 'scenery', 'sky'], extra={'W': W * K.U})
    N = 24
    bpy.context.view_layer.update()          # axles parented to a car: their world place is matrix_world, after an update
    W_ = lambda ax: ax.matrix_world.translation
    for name, body, axles, wh, yc, r in (('truck', tb, taxles, ['tw0', 'tw1', 'tw2'], ty, TW_R), ('car', cb, caxles, ['cw0', 'cw1'], cy, CW_R)):
        if want(name):
            offs = [[round(v, 2) for v in (W_(ax).x * K.U, K.px(0, W_(ax).y, W_(ax).z, Y0)[1] - lane_y(yc))] for ax in axles]
            shot(name, rect_of(body, Y0), Y0, FOCUS, show=[name], catch=['ground'], unseen=wh, anchor=(0, lane_y(yc)),
                 extra={'wheel': name + '_wheel', 'wheels': offs, 'r': r * K.U})
        if want(name + '_wheel'):   # the front wheel alone, turning; the body and the ground still light and shade it
            ax = axles[0]
            objs = K.GROUPS[wh[0]]
            shot(name + '_wheel', rect_of(objs, Y0, pad=5, shadow=False), Y0, FOCUS, show=[wh[0]], unseen=[name, 'ground'], frames=turn_frames([ax], N),
                 anchor=K.px(*W_(ax), Y0))
    if want('car_l'):
        bpy.context.view_layer.update()      # the mirrored root's transform reaches the axles only after an update
        offs = [[round(v, 2) for v in (ax.matrix_world.translation.x * K.U, K.px(0, ax.matrix_world.translation.y, ax.matrix_world.translation.z, Y0)[1] - lane_y(cy))] for ax in laxles]
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


# ================================================================ table: motion is everywhere (beat 2)
if a.set == 'table':
    Y0 = 600.0                         # page y of the lawn at depth 0
    FOCUS = 0.0
    BOOK, ORB, WALK = (3.0, 0.1), (8.0, 0.6), (10.9, -0.4)    # station centres (x, depth); the walk starts at 1090 px
    grass = clay('grass', C['grass'], rough=0.6, feat=1.5, stipple=0.5, prints=0.3, specks=0.4)
    ground = [slab('lawn', -2, 18, -8, 6.9, 0.0, grass, thick=0.3, d=0.14, wobble=0, lump=0.02),
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
    group('sky', *daysky(6.6, -2, 18, 5.5, 4, 103))
    if want('table'): shot('table', (-10, 0, 1620, 900), Y0, FOCUS, show=['ground', 'scenery', 'book', 'sky'], unseen=['sun'])
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
    ground = [slab('lawn', -2, 18, -7, 7.5, 0.0, grass, thick=0.3, d=0.14, wobble=0, lump=0.02),
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
    group('sky', *daysky(7.2, -2, 18, 4.0, 3, 104))
    if want('train'): shot('train', (0, 0, 1600, 900), Y0, FOCUS, show=['ground', 'scenery', 'train', 'maya', 'leo', 'sky'])
    K.write_manifest(meta)


STEP = Props.stride_length    # px a whole stride cycle covers (two steps)

# ================================================================ track: speed and velocity on a running track
if a.set == 'track':
    Y0 = 645.0                       # the track's top (z 0.06) at depth 0 lands on page y 640, as the pixel beats' TY
    FOCUS = 0.0
    TOPZ = 0.06
    grass = clay('grass', C['grass'], rough=0.6, feat=1.5, stipple=0.5, prints=0.3, specks=0.4)
    ground = [slab('lawn', -4, 21, -8, 7.3, 0.0, grass, thick=0.3, d=0.14, wobble=0, lump=0.02),
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
    group('sky', *daysky(7.0, -4, 21, 8.0, 6, 105))
    if want('track'): shot('track', (-100, -200, 1800, 1100), Y0, FOCUS, show=['ground', 'scenery', 'sky'], zoom=2)
    PROPS = True
    if want('runner'): stride_shot('runner', runner, Y0, FOCUS, at, zoom=2)
    if want('you_jog_r'): stride_shot('you_jog_r', jog_r, Y0, FOCUS, at)
    if want('you_jog_l'): stride_shot('you_jog_l', jog_l, Y0, FOCUS, at)
    for nm, (fl, fx) in flags.items():
        if want(nm): shot(nm, rect_of(fl, Y0, pad=8), Y0, FOCUS, show=[nm], catch=['ground'], anchor=(fx * K.U, at[1]))
    if want('finish'): shot('finish', rect_of(fin, Y0, pad=10), Y0, FOCUS, show=['finish'], catch=['ground'], anchor=(FX * K.U, at[1]), zoom=2)
    if want('cloud'): shot('cloud', rect_of(cl, Y0, pad=6, shadow=False), Y0, (30, 0, 5), show=['cloud'], anchor=K.px(30, 0, 5, Y0))
    if want('pedal'): shot('pedal', rect_of(pd, Y0, pad=6, shadow=False), Y0, (40, 0, 5.3), show=['pedal'], anchor=K.px(40, 0, 5.0, Y0))
    # ---- props for text (beats 1, 5, 8, 10-13, 15, 17, 21, 24, 28, 29-31): built aside at x 60.., standing at depth 0
    # on a patch of ground that only catches their shadow; the page stands them on the grass behind a road or a track
    pg_ = slab('propground', 40, 120, -3, 3, 0.0, grass, thick=0.3, d=0.3, wobble=0, lump=0.0)
    group('propground', pg_)
    wood, slate = clay('wood', '#8a5a3c', rough=0.6, feat=0.8), clay('slate', '#223029', rough=0.85, feat=1.2, specks=0.3, marks=0.6, stipple=0.3, spec=0.05)

    board = lambda name, x, w, h, leg, kind='chalk': Props.board(name, x, w, h, leg, Y0, wood, slate, kind)
    BOARDS = [('chalk_w', 60, 13.4, 2.9, 0.45, 'chalk'), ('chalk_t', 80, 13.4, 4.2, 0.4, 'chalk'), ('card', 100, 15.0, 5.0, 0.4, 'card')]
    # small chalk slates for coloured labels on the sky (the page stretches the nearest one to the label's width)
    for nm, bx_, w_ in (('slate_s', 110, 2.6), ('slate_l', 116, 5.4)):
        sl = [box(nm, (w_, 0.08, 0.62), slate, (bx_, 0, 3.0), r=0.06, d=0.04, lump=0.006, dents=0)]
        for j, (dx, dz, ww, hh) in enumerate([(0, 0.31, w_ + 0.1, 0.05), (0, -0.31, w_ + 0.1, 0.05), (w_ / 2, 0, 0.05, 0.67), (-w_ / 2, 0, 0.05, 0.67)]):
            sl.append(box(f'{nm}_rim{j}', (ww, 0.1, hh), wood, (bx_ + dx, -0.02, 3.0 + dz), r=0.02, d=0.02, lump=0.002, dents=0))
        group(nm, *sl)
        if want(nm): shot(nm, rect_of(sl, Y0, pad=4, shadow=False), Y0, (bx_, 0, 3.0), show=[nm], anchor=K.px(bx_, 0, 3.0, Y0), zoom=1.5)
    for nm, bx_, w_, h_, leg_, kind in BOARDS:
        objs, panel_, a0 = board(nm, bx_, w_, h_, leg_, kind)
        if want(nm): shot(nm, rect_of(objs, Y0, pad=12), Y0, (bx_, 0, leg_ + h_ / 2), show=[nm], catch=['propground'], anchor=a0, extra={'panel': panel_})
    if want('practice'):   # the practice and finish cards stand on a big chalkboard in the set (a plate)
        pobjs, _, _ = board('bigboard', 8.0, 14.8, 8.6, 0.2, 'chalk')
        for o in pobjs: o.location.y -= 3.0
        shot('practice', (0, 0, 1600, 900), Y0, FOCUS, show=['ground', 'scenery', 'sky', 'bigboard'])
    K.write_manifest(meta)

# ================================================================ pool: the dolphin and the walrus (beat 14)
if a.set == 'pool':
    Y0 = 420.0                        # the whole stage: far deck at the top, the water from y 210 to 560, near deck under the card
    FOCUS = 0.6
    DL, WL, RL = 2.2, -1.2, 0.5       # the dolphin's lane (far), the walrus's (near), the rope between them: depths
    water = [slab('water', -1.5, 17.5, -2.8, 4.2, 0.0, clay('water', '#2f6f9e', rough=0.22, feat=1.8, specks=0, marks=0.5, sss=0.1), thick=0.4, d=0.1, wobble=0, lump=0.012)]
    tile = clay('tile', '#6f8288', rough=0.6, feat=0.8)
    cope = clay('cope', '#d8d2c4', rough=0.55, feat=0.8)
    deck = [slab('deck_far', -1.5, 17.5, 4.5, 9.8, 0.14, tile, thick=0.3, d=0.12, wobble=0.0, lump=0.006, seed=3),
            slab('deck_near', -1.5, 17.5, -10.5, -3.1, 0.14, tile, thick=0.3, d=0.12, wobble=0.0, lump=0.006, seed=4),
            slab('cope_far', -1.5, 17.5, 4.2, 4.55, 0.18, cope, thick=0.3, d=0.06, wobble=0.015, lump=0.004, seed=5),
            slab('cope_near', -1.5, 17.5, -3.15, -2.8, 0.18, cope, thick=0.3, d=0.06, wobble=0.015, lump=0.004, seed=6)]
    for k_, y in enumerate((DL, WL)):   # dark lane lines on the pool floor, seen through the water
        deck.append(slab(f'laneline{k_}', -1.5, 17.5, y - 0.07, y + 0.07, 0.006, clay('laneline', '#245a84', specks=0, marks=0.2), thick=0.02, d=0.06, wobble=0.01, lump=0.002, seed=40 + k_))
    rope = [ball(f'bead{i}', 0.07, clay('rope' + str(i % 2), ['#f05a46', '#ece8dc'][i % 2], specks=0), (-1.4 + 0.2 * i, RL, 0.02), squash=(1.2, 1, .8), lump=0, dents=0) for i in range(95)]
    group('water', *water); group('deck', *deck, *rope)

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
    for objs, ly in ((dol, DL), (wal, WL)):   # half as big again: the swimmers fill their lanes
        c_ = Vector((2.0, ly, 0))
        for o in objs: o.location = c_ + (o.location - c_) * 1.5; o.scale = o.scale * 1.5
    for nm, objs, ly, L_ in (('dol', dol, DL, 1.5), ('wal', wal, WL, 1.15)):
        for i in range(12):   # a wake: pale beads round the waterline
            t = 2 * math.pi * i / 12
            objs.append(ball(f'{nm}_wake{i}', 0.07, clay('wake', '#d5e7f0', specks=0, rough=0.4), (2.0 + L_ * math.cos(t), ly + 0.48 * math.sin(t), 0.01), squash=(1.6, 1, .35), lump=0, dents=0))
    group('dolphin', *dol); group('walrus', *wal)
    lane = lambda y: K.px(2.0, y, 0, Y0)
    meta = {'pool': {'Y0': Y0, 'dolphin': [round(v, 1) for v in lane(DL)], 'walrus': [round(v, 1) for v in lane(WL)], 'far': round(K.px(0, 4.4, 0.18, Y0)[1], 1)}}
    if want('pool'): shot('pool', (0, 0, 1600, 900), Y0, FOCUS, show=['water', 'deck'])
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
    # the neighbourhood (beat 20): one square block, 390 px a side (the walker's path), a street all round it, more
    # houses beyond; the whole stage, the question card over its foot
    X0, X1, Y0b, Y1 = 605, 995, 70, 460
    walk = clay('walk', C['walk'], rough=0.58, feat=1.4, spec=0.1)
    hood = [lawn('lawn_h', -40, -40, 1640, 940)]
    def ring(o, r=90, n=8):   # the street round the block: a rectangle with rounded corners (a sharp corner folds the band)
        cs = [(X1 + o - r, Y0b - o + r, -90), (X1 + o - r, Y1 + o - r, 0), (X0 - o + r, Y1 + o - r, 90), (X0 - o + r, Y0b - o + r, 180)]
        return [(cx + r * math.cos(math.radians(a0 + 90 * k / n)), cy + r * math.sin(math.radians(a0 + 90 * k / n))) for cx, cy, a0 in cs for k in range(n + 1)]
    hood += road('hood_road', ring(132), closed=True)
    (bx0, by1), (bx1, by0) = B(X0 - 60, Y0b - 60), B(X1 + 60, Y1 + 60)
    hood.append(slab('pave', bx0, bx1, by0, by1, 0.05, walk, thick=0.1, d=0.08, wobble=0.02, lump=0.006, seed=8))
    (ix0, iy1), (ix1, iy0) = B(X0 + 48, Y0b + 48), B(X1 - 48, Y1 - 48)
    hood.append(slab('inner', ix0, ix1, iy0, iy1, 0.1, grass, thick=0.1, d=0.1, wobble=0.02, lump=0.01, seed=9))
    cols = ['#a65d4b', '#6f86b8', '#c9905a', '#8f7bb8']
    for i, (x, y) in enumerate([(670, 125), (840, 125), (670, 245), (840, 245)]): hood += roofhouse(f'bhouse{i}', x, y, 95, 85, cols[i])
    for i, (x, y) in enumerate([(60, 70), (250, 70), (90, 300), (260, 330), (60, 560), (1290, 70), (1440, 160), (1300, 330), (1450, 470), (1300, 600)]):
        hood += roofhouse(f'nhouse{i}', x, y, 110, 90, cols[i % 4])
    for i, (x, y) in enumerate([(200, 230), (420, 130), (1200, 250), (1180, 520), (420, 560), (180, 470), (1520, 330), (760, 800), (980, 760)]):
        hood.append(bush(f'htree{i}', x, y, 34 + 8 * (i % 3)))
    for o in hood: o.location.y -= 90
    group('hood', *hood)
    # the flower bed (beat 27): the whole stage, flowers in clumps, a few stones, clear round the bee's circle
    rnd = random.Random(41)
    bed = [lawn('lawn_m', -40, -40, 1640, 940)]
    for cl in range(26):
        cx_, cy_ = rnd.uniform(30, 1570), rnd.uniform(30, 870)
        c = rnd.choice(['#f4a48c', '#ece8dc', '#f3c95c', '#bba8ee', '#e8a0c8'])
        for i in range(rnd.randint(3, 7)):
            x, y = cx_ + rnd.uniform(-60, 60), cy_ + rnd.uniform(-45, 45)
            if abs(math.hypot(x - 800, y - 300) - 190) < 55: continue          # the bee's path stays clear
            for j in range(5):
                t = 2 * math.pi * j / 5
                bed.append(ball(f'pet{cl}_{i}_{j}', 0.085, clay('petal' + c, c, specks=0, spec=0.1), (*B(x + 10 * math.cos(t), y + 10 * math.sin(t)), 0.08), squash=(1, 1, .4), lump=0, dents=0))
            bed.append(ball(f'eye{cl}_{i}', 0.055, clay('fcentre', '#f6c445', specks=0), (*B(x, y), 0.11), squash=(1, 1, .5), lump=0, dents=0))
    for i in range(8):
        x, y = rnd.uniform(40, 1560), rnd.uniform(40, 860)
        if abs(math.hypot(x - 800, y - 300) - 190) < 70: continue
        bed.append(ball(f'stone{i}', rnd.uniform(.12, .2), clay('stone', '#8e968f', rough=0.6), (*B(x, y), 0.05), squash=(1.3, 1, .5), lump=0.01, dents=1, dent_r=(.04, .06)))
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
    # the bee from above: a yellow body with three wide black bands, a black head, two small pale wings set back on
    # the shoulders so the bands stay in sight
    yel, blk = clay('beey', '#f6c445', rough=0.45, spec=0.15), clay('beeb', '#1f2624', rough=0.45, spec=0.15)
    bee = [ball('bee_body', 0.3, yel, (80, 0, 0.5), squash=(1.5, 1, .9), lump=0.008, dents=0),
           ball('bee_head', 0.18, blk, (80.47, 0, 0.52), lump=0.004, dents=0),
           ball('bee_sting', 0.06, blk, (79.52, 0, 0.5), squash=(1.6, 1, 1), lump=0, dents=0)]
    for j, dx in enumerate((-0.27, -0.05, 0.17)): bee.append(ball(f'bee_band{j}', 0.312, blk, (80 + dx, 0, 0.5), squash=(.24, .96, .88), lump=0, dents=0))
    for j, sy in enumerate((-1, 1)): bee.append(ball(f'bee_wing{j}', 0.17, clay('wing', '#cde0ea', rough=0.25, specks=0, sss=0.3, spec=0.3), (80.2, sy * 0.3, 0.85), squash=(.62, 1.15, .1), rot=(0, 0, sy * 0.45), lump=0, dents=0))
    group('bee', *bee)
    meta = {'top': {'car': 0.58, 'note': 'sprites face east at rotation 0; the page turns them'}}
    if want('corner'): shot('corner', (-200, -200, 2000, 1300), Y0, (0, 0, 0), show=['corner'])
    if want('loop'): shot('loop', (3000, 0, 1600, 900), Y0, (30, 0, 0), show=['loop'], extra={'x': 0, 'y': 0})
    if want('hood'): shot('hood', (0, 9000, 1600, 900), Y0, (0, -90, 0), show=['hood'], extra={'y': 0})
    if want('bed'): shot('bed', (0, 6000, 1600, 900), Y0, (0, -60, 0), show=['bed'], extra={'y': 0})
    if want('car_top'): shot('car_top', (6000 - 150, -150, 300, 300), Y0, (60, 0, 0), show=['car_top'], anchor=(6000, 0), zoom=2)
    if want('walker_top'): shot('walker_top', (7000 - 45, -45, 90, 90), Y0, (70, 0, 0), show=['walker_top'], anchor=(7000, 0), zoom=3)
    if want('bee'): shot('bee', (8000 - 70, -70, 140, 140), Y0, (80, 0, 0), show=['bee'], anchor=(8000, 0), zoom=3)
    K.write_manifest(meta)


# ================================================================ look test: the whole frame as one set (not shipped)
# The upper frame was the page's flat board. Here the set gets a painted back wall behind its hills, and, under the
# text of a beat, a prop standing on the table: a chalkboard (B) or a wooden sign (C; on the summary, a paper card
# pinned to a board). Rendered as the whole frame the beat's camera sees, to books/ (a draft).
MOCK = {   # beat: (camera x, y, zoom), the screen rectangle the prop must hold (x0, y0, x1, y1), the prop's depth
    3: ((800, 450, 1.0), (60, 55, 730, 190), 4.45),
    9: ((800, 285, 0.9), (300, 30, 1300, 352), 4.45),
    10: ((800, 450, 1.0), (270, 22, 1580, 330), 3.7),
    15: ((800, 300, 1.0), (96, 40, 1504, 470), 3.7),
}
if a.mock:
    (cx, cy, zz), (sx0, sy0, sx1, sy1), yb = MOCK[a.mockbeat]
    sw = lambda sx, sy: (cx + (sx - 800) / zz, cy + (sy - 450) / zz)          # a screen point in the set's page world
    Zof = lambda wy, d: (Y0 - wy - K.U * d * SIN) / (K.U * COS)               # height in the set of a page y at depth d
    mock = []
    # the painted back wall: a dusk sky brushed on board, deep at the top, misty near the hills
    WD = 7.6 if a.set == 'road' else 7.0
    me = rbox_mesh((70, 0.3, 14), 0.1, 0.16)
    n_ = len(me.vertices)
    co = np.empty(n_ * 3, 'f'); me.vertices.foreach_get('co', co); co = co.reshape(n_, 3)
    t = np.clip((co[:, 2] + 7) / 9.0, 0, 1)
    streak = np.array([noise.noise(Vector((v[0] * 0.25, 0, v[2] * 1.4))) for v in co], 'f')
    lo, mid, hi, cl = (np.array(K.srgb(h)[:3], 'f') for h in ('#7f98a2', '#2f4d66', '#15223a', '#a3b6bd'))
    u_ = np.clip(t * 2.2, 0, 1)[:, None]; v_ = np.clip((t - 0.45) / 0.55, 0, 1)[:, None]
    col = (lo * (1 - u_) + mid * u_) * (1 - v_) + hi * v_            # a warm glow above the hills, deep blue overhead
    k_ = np.clip((streak - 0.25) * 2.5, 0, 0.45) * (1 - t)[:, None].ravel()
    col = col * (1 - k_)[:, None] + cl * k_[:, None]
    ca = me.color_attributes.new('col', 'FLOAT_COLOR', 'POINT'); ca.data.foreach_set('color', np.hstack([col, np.ones((n_, 1), 'f')]).ravel())
    mock.append(slab('mockground', -10, 40, 4.0, WD + 0.2, 0.0, clay('grass', C['grass'], rough=0.6, feat=1.5, stipple=0.5, prints=0.3, specks=0.4), thick=0.3, d=0.2, wobble=0, lump=0.02))   # the table runs on to the wall
    mock.append(part('backwall', me, clay('backwall', '#ffffff', rough=0.8, vcol=True, specks=0.2, marks=0.7, spec=0.1), (10, WD, 7.0 - 0.1), lump=0.02, dents=0))
    (wx0, wy0), (wx1, wy1) = sw(sx0, sy0), sw(sx1, sy1)
    X0_, X1_, Z1_, Z0_ = wx0 / K.U, wx1 / K.U, Zof(wy0, yb), Zof(wy1, yb)
    W_, H_, XC = X1_ - X0_, Z1_ - Z0_, (X0_ + X1_) / 2
    wood = clay('wood', '#7a5236', rough=0.6, feat=0.8)
    legs = lambda: [roll(f'leg{j}', (x, yb + 0.05, Z0_ + 0.1), (x + dx, yb + 0.55, -0.05), 0.07, wood, lump=0.008)
                    for j, (x, dx) in enumerate(((X0_ + 0.35, -0.12), (X1_ - 0.35, 0.12)))]
    if a.mock == 'B':      # a chalkboard in a wooden frame, on two legs leaning back
        mock += [box('slate', (W_, 0.12, H_), clay('slate', '#223029', rough=0.85, feat=1.2, specks=0.3, marks=0.6, stipple=0.3, spec=0.05), (XC, yb, Z0_ + H_ / 2), r=0.03, d=0.06, lump=0.006, dents=3, dent_r=(.2, .4))]
        for j, (dx, dz, w_, h_) in enumerate([(0, H_ / 2, W_ + 0.24, 0.14), (0, -H_ / 2, W_ + 0.24, 0.14), (W_ / 2, 0, 0.14, H_ + 0.24), (-W_ / 2, 0, 0.14, H_ + 0.24)]):
            mock.append(box(f'frame{j}', (w_, 0.18, h_), wood, (XC + dx, yb - 0.03, Z0_ + H_ / 2 + dz), r=0.05, d=0.04, lump=0.008, dents=2))
        mock.append(box('ledge', (W_ * 0.9, 0.22, 0.06), wood, (XC, yb - 0.12, Z0_ - 0.02), r=0.02, d=0.04, lump=0.004, dents=0))
        mock += legs()
    elif a.mock == 'C' and a.mockbeat == 15:   # a paper card pinned to a wooden board
        mock.append(box('board', (W_, 0.14, H_), clay('boardw', '#5b3f2b', rough=0.6, feat=0.8), (XC, yb, Z0_ + H_ / 2), r=0.06, d=0.06, lump=0.012, dents=5, dent_r=(.2, .4)))
        mock.append(box('card', (W_ - 0.36, 0.03, H_ - 0.34), clay('paper', '#efe6d2', rough=0.75, specks=0.15, marks=0.4, sss=0.1), (XC, yb - 0.09, Z0_ + H_ / 2), r=0.015, d=0.05, lump=0.006, dents=0))
        for j, (dx, dz) in enumerate([(-1, 1), (1, 1), (-1, -1), (1, -1)]):
            mock.append(ball(f'pin{j}', 0.07, clay('pin', '#e05a46', specks=0), (XC + dx * (W_ / 2 - 0.3), yb - 0.13, Z0_ + H_ / 2 + dz * (H_ / 2 - 0.28)), lump=0, dents=0))
        mock += legs()
    elif a.mock == 'C':    # a sign of wooden planks on two posts
        n_pl = max(2, round(H_ / 0.55)); hp = H_ / n_pl
        for j in range(n_pl):
            mock.append(box(f'plank{j}', (W_, 0.12, hp - 0.05), clay('plank' + str(j % 3), ['#6b4a33', '#74503a', '#614230'][j % 3], rough=0.6, feat=0.7, prints=0.4),
                            (XC, yb, Z0_ + hp * (j + 0.5)), r=0.04, d=0.05, lump=0.01, dents=3, dent_r=(.15, .3), seed=50 + j))
        mock += [roll(f'post{j}', (x, yb + 0.12, -0.05), (x, yb + 0.12, Z1_ + 0.15), 0.1, wood, lump=0.01) for j, x in enumerate((X0_ + 0.5, X1_ - 0.5))]
    group('mock', *mock)
    keep = ['ground', 'scenery', 'mock']
    shot(f'mock_{a.mockbeat}{a.mock}', (cx - 800 / zz, cy - 450 / zz, 1600 / zz, 900 / zz), Y0, FOCUS, show=keep, zoom=zz)
