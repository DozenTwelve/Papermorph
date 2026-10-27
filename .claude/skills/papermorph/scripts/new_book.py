#!/usr/bin/env python3
"""Start a book folder: the engine, the kit's files and the working folders, for one kind of book.

    python3 new_book.py lesson history                 # a textbook: cover and contents, ch01 from the lesson template
    python3 new_book.py picture jokes                  # a picture book: series page, paper kit, scene1, sets.js
    python3 new_book.py documentary film               # a documentary: film.js kit, series page for the credits
    python3 new_book.py shorts short --maps            # upright shorts, here with the map kit (documentaries take --maps too)
    python3 new_book.py lesson stats --chapter 9 --lang ja --root ~/work

Run it from the folder that holds site/, books/, content/ and tools/ (or pass --root). It refuses a book that
already has a site/<book>/ folder, so it never overwrites work; resume an existing book from its own files.
When a step fails (engine.py without network or a local engine/), the new site/<book>/ is removed, so a rerun works.
The engine comes from engine.py (the repository's engine/ when at hand, else the latest compatible release).
It copies and creates files only; the voice, effects and baking steps it prints come next.
"""
import argparse, shutil, subprocess, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
T = HERE.parent / 'assets' / 'templates'
PB, DK, SK, MK = T / 'picture-book', T / 'documentary', T / 'shorts', T / 'maps'


def copy(src: Path, dst: Path):
    dst.parent.mkdir(parents=True, exist_ok=True)
    if src.is_dir():
        shutil.copytree(src, dst, dirs_exist_ok=True)
    else:
        shutil.copy2(src, dst)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('kind', choices=['lesson', 'picture', 'documentary', 'shorts'])
    ap.add_argument('book', help='the book slug, e.g. history')
    ap.add_argument('--chapter', type=int, default=1, help='the pilot chapter number (default 1)')
    ap.add_argument('--lang', default='en', help="the narration language code (default en); the template's text stays English until translated")
    ap.add_argument('--maps', action='store_true', help='add the map kit (documentaries and shorts)')
    ap.add_argument('--root', default='.', help='folder holding site/, books/, content/, tools/ (default .)')
    a = ap.parse_args()

    root = Path(a.root).expanduser().resolve()
    ch = f'ch{a.chapter:02d}'
    site, work, content = root / 'site' / a.book, root / 'books' / a.book, root / 'content' / a.book / ch
    if site.exists():
        sys.exit(f'{site} exists: resume from its own files, or choose another slug')
    if a.maps and a.kind not in ('documentary', 'shorts'):
        sys.exit('--maps is for documentaries and shorts')
    try:
        start(a, root, ch, site, work, content)
    except BaseException:
        shutil.rmtree(site, ignore_errors=True)   # a half-made site/<book>/ would block the rerun
        raise


def start(a, root, ch, site, work, content):
    for d in (site / 'lib', site / 'img', site / ch, content, root / 'tools' / a.book):
        d.mkdir(parents=True, exist_ok=True)
    # engine.py first: it refuses a lib/ that already holds files but no engine
    if subprocess.run([sys.executable, str(HERE / 'engine.py'), str(site)]).returncode:
        sys.exit(f'engine.py failed; {site} removed, rerun once the engine is reachable')
    narration = content / f'narration.{a.lang}.json'

    if a.kind == 'lesson':
        for d in ('chapters', 'images/inbox'):
            (work / d).mkdir(parents=True, exist_ok=True)
        copy(T / 'book.html', site / 'index.html')
        copy(T / 'unit-art.js', site / 'unit-art.js')
        copy(T / 'chapter.html', site / ch / 'index.html')
        copy(T / 'narration.en.json', narration)
    elif a.kind == 'picture':
        (site / 'img' / 'puppets').mkdir(parents=True, exist_ok=True)
        (work / 'art').mkdir(parents=True, exist_ok=True)
        copy(PB / 'series.html', site / 'index.html')
        for f in (PB / 'lib').glob('*.js'):
            copy(f, site / 'lib' / f.name)
        copy(PB / 'chapter.html', site / ch / 'index.html')
        copy(PB / 'scene1.js', site / ch / 'scene1.js')
        copy(PB / 'sets.js', work / 'art' / 'sets.js')
        copy(PB / 'painted.json', work / 'art' / 'painted.json')
        copy(PB / 'narration.en.json', narration)
        (site / 'img' / 'puppets' / 'baked.js').write_text('window.BAKED = {};\n')   # until bake_puppets.py runs
    else:
        (work / 'art' / ('found' if a.kind == 'documentary' else '')).mkdir(parents=True, exist_ok=True)
        kit = DK if a.kind == 'documentary' else SK
        copy(kit / 'lib', site / 'lib')   # over engine.py's lib/, its book.css replacing the default
        if a.kind == 'shorts':
            copy(DK / 'lib' / 'fonts.css', site / 'lib' / 'fonts.css')
            copy(DK / 'lib' / 'fonts', site / 'lib' / 'fonts')
            (site / ch / 'audio' / 'sfx').mkdir(parents=True, exist_ok=True)
        else:
            copy(PB / 'series.html', site / 'index.html')   # a single film is a series of one
        copy(kit / 'chapter.html', site / ch / 'index.html')
        copy(kit / 'narration.en.json', narration)
        (site / 'img' / 'art.js').write_text('window.ART = {};\n')   # prep.py fills it
        if a.maps:
            for f in (MK / 'lib').glob('*.js'):
                copy(f, site / 'lib' / f.name)

    S, A = HERE, site / ch / 'audio' / a.lang
    print(f'\n{a.kind} book started: {site.relative_to(root)}/ (pilot {ch}); next:')
    print(f'  uv run --with edge-tts python3 {S}/tts.py {narration.relative_to(root)} {A.relative_to(root)}')
    if a.kind == 'picture':
        print(f'  then level.py, mouths.py, join.py and sfx.py in tools/{a.book}/audio.sh; bake_sets.py, scenes, bake_puppets.py')
    if a.kind == 'shorts':
        print(f'  uv run --with numpy python3 {S}/sfx.py {(site / ch / "audio" / "sfx").relative_to(root)} whoosh bang tick thud')
    if a.maps:
        print(f'  uv run --with pillow python3 {S}/geo.py {(site / "img").relative_to(root)} --globe {(site / "lib").relative_to(root)}')
    print(f'  python3 {S}/serve.py 8765 site   # then open http://localhost:8765/{a.book}/{ch}/')


if __name__ == '__main__':
    main()
