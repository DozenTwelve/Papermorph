"""clayprops.py: clay props for claykit scenes, shared by every book: people, cars, a truck, wheels, trees, hills,
grass, a day sky, houses, boards that hold text, a table, a lawn. Imported by a scene script running in Blender
(blender ... --python scene.py), never run on its own; the method is in references/core/clay.md.

Each builder makes its objects at toy size (1 unit = 100 page px) and returns them (and the parts a shot needs: an
axle to turn, a panel to write in); the scene puts them in groups and shoots them. Colours come from C, the palette
the physics clay book was approved in; a book changes them before building (clayprops.C.update(car='#e05a46')).
Names matter: a part's marks are seeded by its name, and a material is made once per name (claykit.clay), so the
same name gives the same look in every set; two different props need two names.

Origins: person() stands on its feet at (x, y, 0), facing the camera or in profile; car_build() and truck_build()
stand on their wheels, centred on x = 0, along +x; wheel() turns about its axle (rotation_euler.y, positive rolls
to +x); board() and table() stand on the ground at depth y.
"""
import math, random
import numpy as np
import claykit as K
from claykit import clay, box, ball, roll, slab, part, empty, copy, group, shot, lathe_mesh, rbox_mesh, moved
import bpy, bmesh
from mathutils import Vector

# the palette (the labels over a picture keep their exact hexes; AgX takes a little saturation off)
C = dict(grass='#2c5e3a', hill='#274a35', road='#3d4744', walk='#74817b', line='#ece8dc', wood='#9a7350', slate='#1c2925',
         tyre='#2e3338', hub='#c3ccd3', glass='#d2e8ff', skin='#f0c3a0', hair='#353b47', jeans='#4878d2', shoe='#3a3f4a',
         you='#ab8ff5', friend='#f59a80', truck='#4a8de0', cargo='#b4d0ff', car='#55c486', trunk='#8a5a3c', leaf='#3f9a52',
         lamp='#8597ad', bulb='#ffe9a0', ballw='#f2efe6', balld='#262f2d', dark='#1d2a35', shine='#b9d2e4',
         maya='#f3c95c', leo='#f59a80', runner='#4fb3a6')
LEG = 0.44          # person(): hip to foot, units; a stride's length follows from it (stride_length)
CW_R = 0.27         # car_build()'s wheel radius, units
TW_R = 0.31         # truck_build()'s


def grass(period=0.0, spec=0.45):
    """The lawn's clay: dabbed all over with a stiff brush."""
    return clay('grass', C['grass'], rough=0.6, feat=1.5, stipple=0.5, prints=0.3, specks=0.4, period=period, spec=spec)


def lawn(name, x0, x1, y0, y1, period=0.0):
    """Ground: a sheet of grass clay from x0 to x1, depth y0 to y1, its top at z = 0 (period: it repeats along x)."""
    return slab(name, x0, x1, y0, y1, 0.0, grass(period), thick=0.3, d=0.14, wobble=0, lump=0.02, period=period)


def daysky(WD, x0, x1, zmax, n, seed, period=0.0, copies=(0,)):
    """The set's back wall painted as a bright day sky (deep blue overhead, pale over the hills), and clay clouds in
    front of it. It stands at depth WD, behind the hills, and is lit by the set's sun like everything else; a touch of
    its own glow keeps it a sky rather than a grey wall. With a period the paint and the clouds repeat (the road)."""
    me = rbox_mesh((x1 - x0, 0.3, zmax), 0.08, 0.22)
    n_ = len(me.vertices)
    co = np.empty(n_ * 3, 'f'); me.vertices.foreach_get('co', co); co = co.reshape(n_, 3)
    t = np.clip(co[:, 2] / zmax + 0.5, 0, 1)[:, None]
    lo, mid, hi = (np.array(K.srgb(h)[:3], 'f') for h in ('#d8ebf4', '#93c4e8', '#4a8bd3'))
    u_ = np.clip(t / 0.22, 0, 1); v_ = np.clip((t - 0.22) / 0.5, 0, 1)
    col = (lo * (1 - u_) + mid * u_) * (1 - v_) + hi * v_
    ca = me.color_attributes.new('col', 'FLOAT_COLOR', 'POINT'); ca.data.foreach_set('color', np.hstack([col, np.ones((n_, 1), 'f')]).ravel())
    out = [part(f'sky{seed}', me, clay('sky', '#ffffff', rough=0.85, vcol=True, specks=0, marks=0.25, spec=0.05, emit=0.45, period=period),
                ((x0 + x1) / 2, WD, zmax / 2), lump=0.0, dents=0)]
    rnd = random.Random(seed)
    cmat = clay('cloud', '#f6f9fb', rough=0.75, sss=0.25, specks=0, marks=0.5, spec=0.1, emit=0.12)
    span = (period or (x1 - x0))
    for i in range(n):
        cx, cz, k = (x0 if not period else 0) + rnd.uniform(0.04, 0.96) * span, rnd.uniform(0.3, 0.85) * zmax, rnd.uniform(0.6, 1.3)
        parts_ = [moved(rbox_mesh((2 * r, 2 * r, 2 * r), r, 0.05), dx=dx, dz=dz) for dx, dz, r in
                  [(-0.7 * k, 0, 0.45 * k), (0, 0.2 * k, 0.62 * k), (0.68 * k, 0.04 * k, 0.48 * k), (0.3 * k, -0.12 * k, 0.4 * k), (-0.3 * k, -0.1 * k, 0.42 * k)]]
        me_c = K.fuse(parts_, voxel=0.04)
        for v in me_c.vertices: v.co.y *= 0.45; v.co.z = max(v.co.z, -0.2 * k)    # flattened toward us, a flat-ish underside
        c = part(f'cloud{seed}_{i}', me_c, cmat, (cx, WD - 0.8, cz), lump=0.03, dents=3, dent_r=(.12, .25), seed=seed + i)
        out += [c] + [copy(c, (cx + dx, WD - 0.8, cz)) for dx in copies if dx]
    return out


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


def truck_build(ty, prefix='t'):
    """The blue box truck, its centre at (0, ty): chassis, cargo box, cab, nose, windscreen, a lamp and a side window,
    on three wheels. Returns (body objects, [(axle, wheel objects)] front to back); its wheel radius is TW_R."""
    blue, cargo = clay('truck', C['truck'], rough=0.48), clay('cargo', C['cargo'], rough=0.5)
    dark, shine = clay('dark', C['dark'], rough=0.12, specks=0, marks=0.4), clay('shine', C['shine'], rough=0.3, specks=0, marks=0.2)
    p = prefix
    tb = [box(f'{p}_chassis', (3.4, 1.46, 0.3), clay('truckd', '#3566b4'), (0, ty, 0.29), r=0.1, lump=0.012, dents=2),
          box(f'{p}_cargo', (2.2, 1.5, 1.2), cargo, (-0.6, ty, 1.0), r=0.14, d=0.05, lump=0.03, dents=12, seed=2),
          box(f'{p}_cab', (0.98, 1.42, 0.92), blue, (1.1, ty, 0.86), r=0.2, d=0.045, lump=0.025, dents=6, seed=3),
          box(f'{p}_nose', (0.3, 1.36, 0.42), clay('truckl', '#7fb4ee'), (1.62, ty, 0.6), r=0.1, d=0.04, lump=0.012, dents=1),
          box(f'{p}_shield', (0.06, 1.12, 0.4), dark, (1.6, ty, 1.04), r=0.04, d=0.03, lump=0.005, dents=0),
          ball(f'{p}_lamp', 0.07, clay('bulb', C['bulb'], specks=0, emit=0.6), (1.77, ty - 0.45, 0.62), lump=0.004, dents=0)]
    tb += window(f'{p}_win', 0.56, 0.4, (1.14, ty - 0.715, 1.02), dark, shine)
    wheels = [wheel(f'{p}w{i}', TW_R, 0.26, (x, ty - 0.74, TW_R), seed=i) for i, x in enumerate((1.08, -0.62, -1.28))]
    return tb, wheels


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


def person(role, x, y, pose=0.0, face='cam', seed=0, k=1.1, swing=0.34, tail=False, colour=None):
    """A small, simple clay figure standing on its feet at (x, y, 0), 1.2 * k units tall, no face (so no mouth to
    sync: a figure that speaks is told by the narration and its pose). pose: the stride, -1..1 (0 stands): one leg and
    the other arm forward by that much, as a replacement puppet's next pose (poses()). face: 'cam' looks out of the
    picture (the hair sits on the back of the head, away from us), 'right' / 'left' a profile walking that way.
    The shirt is C[role] (or colour); seed 0 takes it from the role, so the same person looks the same in every set."""
    if colour is None and role not in C: raise KeyError(f'person({role!r}): no colour C[{role!r}]; pass colour=\'#rrggbb\' or add it to C')
    root = empty(role, (x, y, 0)); root.scale = (k, k, k)
    shirt = clay(role, colour or C[role], rough=0.5)
    seed = seed or sum(map(ord, role))
    jeans, skin = clay('jeans', C['jeans']), clay('skin', C['skin'], sss=0.2, specks=0.3)
    objs = []
    for side in (-1, 1):
        s = pose * side * swing                                     # this leg's swing, radians
        hip = Vector((0, side * 0.11, 0.5)); foot = hip + Vector((math.sin(s) * LEG, 0, -math.cos(s) * LEG))
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


def poses(role, n, face, k, swing, tail=False, z=0.0):
    """n replacement poses of a stride (pose = sin of the phase), one group each; returns their object lists."""
    out = []
    for i in range(n):
        root, objs = person(role, 0, 0, pose=math.sin(2 * math.pi * i / n), face=face, k=k, swing=swing, tail=tail)
        root.location.z = z
        group(f'{role}_{face}{i}', *objs); out.append(objs)
    return out


def stride_shot(name, sets, Y0, focus, anchor, catch=('ground',), zoom=1):
    """One strip of the poses() sets, frame i showing pose i, framed round all of them."""
    groups = [g for g in K.GROUPS if any(K.GROUPS[g] is objs or K.GROUPS[g] == objs for objs in sets)]
    shot(name, K.union([K.rect_of(objs, Y0, pad=10) for objs in sets]), Y0, focus, show=groups, catch=list(catch),
         frames=K.swap_frames(sets), anchor=anchor, zoom=zoom)


def stride_length(k, swing):
    """Page px a whole stride cycle of person(k=k, swing=swing) covers (two steps): the page picks pose
    round(distance / stride_length * n) % n, so the feet keep pace with the ground. Another figure: measure its own."""
    return 4 * LEG * k * math.sin(swing) * K.U


def board(name, x, w, h, leg, Y0, wood, slate, kind='chalk'):
    """A chalkboard (or, kind='card', a paper card pinned to a wooden board) w wide and h high at depth 0, its bottom
    edge leg above the ground, on two short splayed feet; in group `name`. Returns its objects, its panel's page
    rectangle from the anchor [x0, y0, x1, y1] (where the page writes its text: claykit's loader, clBoard) and the
    anchor (its foot on the ground)."""
    zc = leg + h / 2
    if kind == 'chalk':
        objs = [box(name + '_slate', (w, 0.12, h), slate, (x, 0, zc), r=0.03, d=0.06, lump=0.006, dents=0)]
        for j, (dx, dz, w_, h_) in enumerate([(0, h / 2, w + 0.26, 0.15), (0, -h / 2, w + 0.26, 0.15), (w / 2, 0, 0.15, h + 0.26), (-w / 2, 0, 0.15, h + 0.26)]):
            objs.append(box(f'{name}_frame{j}', (w_, 0.18, h_), wood, (x + dx, -0.03, zc + dz), r=0.05, d=0.04, lump=0.008, dents=2))
        objs.append(box(name + '_ledge', (w * 0.9, 0.24, 0.06), wood, (x, -0.13, leg - 0.02), r=0.02, d=0.04, lump=0.004, dents=0))
    else:
        objs = [box(name + '_board', (w, 0.14, h), clay('boardw', '#5b3f2b', rough=0.6, feat=0.8), (x, 0, zc), r=0.06, d=0.06, lump=0.012, dents=5, dent_r=(.2, .4)),
                box(name + '_paper', (w - 0.36, 0.03, h - 0.34), clay('paper', '#efe6d2', rough=0.75, specks=0.15, marks=0.4, sss=0.1), (x, -0.09, zc), r=0.015, d=0.05, lump=0.006, dents=0)]
        for j, (dx, dz) in enumerate([(-1, 1), (1, 1), (-1, -1), (1, -1)]):
            objs.append(ball(f'{name}_pin{j}', 0.07, clay('pin', '#e05a46', specks=0), (x + dx * (w / 2 - 0.3), -0.13, zc + dz * (h / 2 - 0.28)), lump=0, dents=0))
    for j, (fx, dx) in enumerate(((x - w / 2 + 0.4, -0.1), (x + w / 2 - 0.4, 0.1))):
        objs.append(roll(f'{name}_foot{j}', (fx, 0.0, leg + 0.1), (fx + dx, 0.35, -0.02), 0.07, wood, lump=0.006))
    group(name, *objs)
    a0 = K.px(x, 0, 0, Y0); tl, br = K.px(x - w / 2, -0.07, leg + h, Y0), K.px(x + w / 2, -0.07, leg, Y0)
    return objs, [round(tl[0] - a0[0], 1), round(tl[1] - a0[1], 1), round(br[0] - a0[0], 1), round(br[1] - a0[1], 1)], a0


def table(name, x, y, w=2.4, d=1.3, h=1.0, wood=None):
    """A small wooden table standing on the ground at (x, y): a thick top w by d, its top face at z = h, on four
    rolled legs. Returns its objects and the top's height (where a prop on it stands)."""
    wood = wood or clay('tablewood', '#8a6a4c', rough=0.55, feat=0.8)
    objs = [box(name + '_top', (w, d, 0.14), wood, (x, y, h - 0.07), r=0.05, d=0.05, lump=0.01, dents=4, dent_r=(.1, .2))]
    for j, (sx, sy) in enumerate([(-1, -1), (1, -1), (-1, 1), (1, 1)]):
        lx, ly = x + sx * (w / 2 - 0.18), y + sy * (d / 2 - 0.16)
        objs.append(roll(f'{name}_leg{j}', (lx, ly, 0.02), (lx + sx * 0.03, ly, h - 0.12), 0.07, wood, lump=0.008, seed=j))
    return objs, h
