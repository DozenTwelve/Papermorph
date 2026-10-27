#!/usr/bin/env python3
"""Copy the Papermorph engine into books, or check that their copies match.

    python3 engine.py site/history                 # one book
    python3 engine.py site                         # every book in site/ (each folder with lib/engine.js)
    python3 engine.py site --check                 # report copies that differ; exit status 1 if any
    python3 engine.py site --from ../my-engine     # a local engine folder (a fork, or one being fixed)
    python3 engine.py site --from you/fork@main    # engine/ of a GitHub repo at a tag, branch or commit
    python3 engine.py site/stats --latex           # also MathJax, for a book whose chapters use TX()

The engine is not part of this skill: it is the engine/ folder of a repository, versioned by tags (engine-v2,
engine-v2.1, ...; a new major number means books may need a change), and anyone may fork it. Without --from, the
engine/ folder here or above the target is used (a checkout of that repository), otherwise DEFAULT, the latest release
compatible with this Skill (its docs and the picture-book kit); the source used is printed.
Each book keeps a full copy in lib/, so it runs on its own; fix the engine at its source and sync, never edit the
copies. lib/book.css holds the book's own settings and overrides; it is created from the default and never
overwritten. MathJax (engine/vendor/mathjax) goes only into books that ask for it with --latex; after that, a book
with lib/mathjax.js keeps it in step like the rest.
"""
import argparse, filecmp, io, shutil, sys, tarfile, tempfile, urllib.request
from pathlib import Path

DEFAULT = 'DozenTwelve/Papermorph@engine-v2.7'   # follows the latest compatible release
OWN = 'book.css'
LATEX = {'vendor/mathjax/tex-svg-full.js': 'mathjax.js', 'vendor/mathjax/LICENSE': 'mathjax-LICENSE.txt'}


def fetch(spec: str) -> Path:
    repo, _, ref = spec.partition('@')
    url = f'https://codeload.github.com/{repo}/tar.gz/{ref or "main"}'
    try:
        data = urllib.request.urlopen(url, timeout=60).read()
    except OSError as e:
        sys.exit(f'cannot download {url}: {e}')
    out = Path(tempfile.mkdtemp(prefix='papermorph-engine-'))
    with tarfile.open(fileobj=io.BytesIO(data)) as tar:
        for m in tar.getmembers():
            parts = m.name.split('/')
            if m.isfile() and len(parts) >= 3 and parts[1] == 'engine':   # <repo>-<ref>/engine/<path>
                dst = out.joinpath(*parts[2:])
                dst.parent.mkdir(parents=True, exist_ok=True)
                dst.write_bytes(tar.extractfile(m).read())
    if not (out / 'engine.js').exists():
        sys.exit(f'{spec} has no engine/engine.js')
    return out


def source(spec, target):
    if spec is None:   # the repository's engine/: here, or above the books
        local = [d / 'engine' for d in (Path.cwd(), *target.resolve().parents) if (d / 'engine' / 'engine.js').exists()]
        spec = str(local[0]) if local else DEFAULT
        print(f'engine source: {spec}', file=sys.stderr)
    path = Path(spec)
    if path.is_dir():
        if not (path / 'engine.js').exists():
            sys.exit(f'{path} has no engine.js')
        return path
    return fetch(spec)


def books(target: Path):
    if (target / 'lib' / 'engine.js').exists():
        return [target]
    found = sorted(p.parent.parent for p in target.glob('*/lib/engine.js'))
    if not found and (target / 'lib').is_dir() and any((target / 'lib').iterdir()):   # e.g. site/ with the bookshelf's lib/, before any book exists (an empty lib/ is a new book's)
        sys.exit(f'{target}/lib has no engine.js and no book folder below it has one: pass the book folder itself')
    return found or [target]   # or a new book


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('target', type=Path, help='a book folder, or a folder of books')
    ap.add_argument('--from', dest='src', metavar='DIR|OWNER/REPO@REF', help=f'engine source (default ./engine, else {DEFAULT})')
    ap.add_argument('--check', action='store_true', help='only report differing copies')
    ap.add_argument('--latex', action='store_true', help='also copy MathJax, for TX() formulas')
    a = ap.parse_args()
    engine = source(a.src, a.target)
    shared = sorted(p for p in engine.iterdir() if p.suffix in ('.js', '.css') and p.name != OWN)
    stale = []
    for book in books(a.target):
        lib = book / 'lib'
        pairs = [(src, lib / src.name) for src in shared]
        if a.latex or (lib / 'mathjax.js').exists():
            pairs += [(engine / src, lib / dst) for src, dst in LATEX.items()]
        for src, dst in pairs:
            if dst.exists() and filecmp.cmp(src, dst, shallow=False):
                continue
            stale.append(dst)
            if not a.check:
                lib.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(src, dst)
        if not (lib / OWN).exists():
            stale.append(lib / OWN)
            if not a.check:
                shutil.copyfile(engine / OWN, lib / OWN)
    verb = 'differs' if a.check else 'updated'
    for p in stale:
        print(f'{verb}: {p}')
    if not stale:
        print('all engine copies match' if a.check else 'nothing to update')
    sys.exit(1 if a.check and stale else 0)


if __name__ == '__main__':
    main()
