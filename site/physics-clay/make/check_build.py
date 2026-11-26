"""Regression checks for the seven clay audit defects; no Blender or production writes.

    uv run --with numpy python3 site/physics-clay/make/check_build.py
    uv run --with playwright python3 .claude/skills/papermorph/scripts/check_clay.py --selftest

The second command covers missing/undecodable images (#4) in a real browser.
"""
import ast, copy, json, os, sys, tempfile, unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / '.claude/skills/papermorph/scripts'))
import claykit as K


def refuse(message):
    raise ValueError(message)


class BuildChecks(unittest.TestCase):
    def test_mock_is_draft_and_selects_only_mock(self):
        tree = ast.parse(Path(__file__).with_name('ch09.py').read_text())
        constants = {n.targets[0].id: ast.literal_eval(n.value) for n in tree.body if isinstance(n, ast.Assign)
                     and isinstance(n.targets[0], ast.Name) and n.targets[0].id in ('ASSETS', 'MOCK_SET')}
        start = next(i for i, n in enumerate(tree.body) if isinstance(n, ast.Assign) and isinstance(n.targets[0], ast.Name) and n.targets[0].id == 'a')
        end = next(i for i, n in enumerate(tree.body) if isinstance(n, ast.Assign) and isinstance(n.targets[0], ast.Name) and n.targets[0].id == 'sc')
        code = compile(ast.Module(body=tree.body[start:end + 1], type_ignores=[]), 'ch09 preflight', 'exec')
        for beat, scene in constants['MOCK_SET'].items():
            for mock in ('A', 'B', 'C'):
                a = SimpleNamespace(set=scene, mock=mock, mockbeat=beat, only='', draft=False, fstop=None)
                calls = []
                kit = SimpleNamespace(arguments=lambda *args, **kwargs: a, die=refuse,
                                      setup=lambda args, name, assets: calls.append((copy.copy(args), name, assets)))
                exec(code, {**constants, 'K': kit, 'ROOT': str(ROOT), 'os': os, '_extra': None})
                saved, name, assets = calls[0]
                self.assertTrue(saved.draft)
                self.assertEqual(saved.only, f'mock_{beat}{mock}')
                self.assertIn(saved.only, assets)
                self.assertEqual(name, scene)
        for scene, beat, only in [('road', 0, ''), ('park', 3, ''), ('road', 3, 'truck')]:
            a = SimpleNamespace(set=scene, mock='B', mockbeat=beat, only=only, draft=False, fstop=None)
            kit.arguments = lambda *args, **kwargs: a
            calls.clear()
            with self.assertRaises(ValueError): exec(code, {**constants, 'K': kit, 'ROOT': str(ROOT), 'os': os, '_extra': None})
            self.assertEqual(calls, [])     # invalid input never reaches setup or shots

    def test_partial_projection_and_light_refused_before_build(self):
        with tempfile.TemporaryDirectory() as tmp:
            a = self.args(tmp)
            a.only = 'truck'
            site = Path(a.site); site.mkdir()
            manifest = K.manifest_text({'sets': {'road': {'spec': K.look_spec(a), 'assets': ['truck', 'road']}}})
            (site / 'clay.js').write_text(manifest)
            with patch.object(K, 'die', refuse):
                for field, value in [('elev', 45), ('sun', 2), ('sun_dir', (0, 0, -1))]:
                    changed = copy.copy(a); setattr(changed, field, value)
                    with self.assertRaisesRegex(ValueError, 'another camera or light'):
                        K.setup(changed, 'road', ['truck', 'road'])
            self.assertEqual((site / 'clay.js').read_text(), manifest)
            self.assertFalse(Path(a.out).exists())

    def test_unknown_only_refused_before_build(self):
        with tempfile.TemporaryDirectory() as tmp, patch.object(K, 'die', refuse):
            for only in ('trcuk', 'truck,trcuk'):
                a = self.args(tmp); a.only = only
                with self.assertRaisesRegex(ValueError, 'trcuk.*not an asset'):
                    K.setup(a, 'road', ['truck', 'road'])
            self.assertEqual(list(Path(tmp).iterdir()), [])

    @staticmethod
    def args(tmp):
        return SimpleNamespace(engine='cycles', elev=30., fstop=.26, sun=5., sun_dir=(1., .22, -.75),
                               sun_size=9., ambient=.5, look='Medium High Contrast', exposure=.3, marks=1.,
                               only='', draft=False, out=str(Path(tmp) / 'raw'), site=str(Path(tmp) / 'site'),
                               samples=48, scale=100, reuse=False)

    def test_shot_reuse_checks_every_pose_and_source(self):
        with tempfile.TemporaryDirectory() as tmp:
            a = self.args(tmp); a.draft = True
            render = SimpleNamespace(filepath='')
            calls, pose = [], [0]
            def write(**kwargs):
                calls.append(render.filepath)
                Path(render.filepath).write_bytes(b'fake render')
            bpy = SimpleNamespace(context=SimpleNamespace(scene=SimpleNamespace(render=render)),
                                  app=SimpleNamespace(version_string='test'), ops=SimpleNamespace(render=SimpleNamespace(render=write)))
            frames = [(0, lambda: pose.__setitem__(0, 0)), (1, lambda: pose.__setitem__(0, 1))]
            with patch.multiple(K, A=a, SET='road', ASSETS=['truck'], ONLY=set(), GROUPS={}, bpy=bpy,
                                die=refuse, aim=lambda *args: None, HOLD=lambda: None,
                                show_groups=lambda *args: [], fingerprint=lambda: str(pose[0]), source_spec=lambda: {'scene': 'same'}):
                run = lambda: K.shot('truck', (0, 0, 20, 10), 0, 0, show=[], frames=frames)
                run(); self.assertEqual(len(calls), 2)
                a.reuse = True
                run(); self.assertEqual(len(calls), 2)
                frames[1] = (1, lambda: pose.__setitem__(0, 99))
                with self.assertRaisesRegex(ValueError, 'poses differ'): run()
                frames[1] = (1, lambda: pose.__setitem__(0, 1))
                with patch.object(K, 'source_spec', lambda: {'scene': 'changed'}):
                    with self.assertRaisesRegex(ValueError, 'source differ'): run()
                a.elev = 45
                with self.assertRaisesRegex(ValueError, 'look differ'): run()
                a.elev = 30
                (Path(a.out) / 'truck/001.png').unlink()
                with self.assertRaisesRegex(ValueError, 'missing 1 raw frames'): run()
                self.assertEqual(len(calls), 2)

    def test_strip_limit_precedes_render_and_raw_writes(self):
        with tempfile.TemporaryDirectory() as tmp:
            a = self.args(tmp); a.scale = 300
            bpy = SimpleNamespace(context=SimpleNamespace(scene=None))
            with patch.multiple(K, A=a, ASSETS=['leaf'], GROUPS={}, bpy=bpy, die=refuse):
                with self.assertRaisesRegex(ValueError, '18192x789.*over WebP'):
                    K.shot('leaf', (0, 0, 379, 263), 0, 0, show=[], frames=[(i, None) for i in range(16)])
            self.assertEqual(list(Path(tmp).iterdir()), [])

    def test_holdout_and_other_bookkeeping(self):
        K.selftest()


if __name__ == '__main__':
    unittest.main(verbosity=2)
