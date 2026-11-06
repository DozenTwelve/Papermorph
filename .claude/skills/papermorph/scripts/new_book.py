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
It copies and creates files only; the voice, effects and baking steps it prints come next. It also copies the tier's
style.json template into books/<book>/ (kept if one is there), the file the style conversation fills (core/style.md).
A picture book's or a documentary's series page shows img/cover.webp, which no step makes on its own: the output
says how (a shot.py still).
"""
import argparse, shlex, shutil, subprocess, sys
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
    ap.add_argument('--lang', default='en', help="the book's language code (default en): it names the narration file, the audio folder, <html lang> and CHAPTER.language; the template's text and voice stay English until translated")
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
    style = work / 'style.json'   # the tier's template, the start of the style conversation (core/style.md)
    if not style.exists():
        copy({'lesson': T, 'picture': PB, 'documentary': DK, 'shorts': SK}[a.kind] / 'style.json', style)

    if a.kind == 'lesson':
        for d in ('chapters', 'images/inbox'):
            (work / d).mkdir(parents=True, exist_ok=True)
        copy(T / 'book.html', site / 'index.html')
        copy(T / 'unit-art.js', site / 'unit-art.js')
        copy(T / 'chapter.html', site / ch / 'index.html')
        copy(T / 'narration.en.json', narration)
    elif a.kind == 'picture':
        for d in (site / 'img' / 'puppets', work / 'art', site / ch / 'audio' / 'sfx'):
            d.mkdir(parents=True, exist_ok=True)
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

    if a.lang != 'en':   # the pages name the book's language: <html lang>, CHAPTER.language and the audio/<lang>/ paths
        for f in (site / 'index.html', *(site / ch).glob('*.*')):
            if f.is_file() and f.suffix in ('.html', '.js'):
                s = f.read_text(encoding='utf-8')
                f.write_text(s.replace('lang="en"', f'lang="{a.lang}"').replace("language: 'en'", f"language: '{a.lang}'")
                             .replace('audio/en/', f'audio/{a.lang}/'), encoding='utf-8')

    q = lambda p: shlex.quote(str(p.relative_to(root) if p.is_relative_to(root) else p))   # a path with spaces still pastes
    S, A = q(HERE), site / ch / 'audio' / a.lang
    print(f'\n{a.kind} book started: {q(site)}/ (pilot {ch}), style.json template in {q(style)}; next:')
    print(f'  uv run --with edge-tts python3 {S}/tts.py {q(narration)} {q(A)}')
    if a.kind == 'picture':
        print(f'  uv run --with numpy python3 {S}/sfx.py {q(site / ch / "audio" / "sfx")} knock chime room   # the template scene\'s knock, the find stop\'s chime, the room-tone bed')
        print(f'  then level.py, mouths.py, join.py in tools/{a.book}/audio.sh; bake_sets.py, scenes, bake_puppets.py')
    if a.kind == 'shorts':
        print(f'  uv run --with numpy python3 {S}/sfx.py {q(site / ch / "audio" / "sfx")} whoosh bang tick thud')
    if a.maps:
        print(f'  uv run --with pillow python3 {S}/geo.py {q(site / "img")} --globe {q(site / "lib")}')
    print(f'  python3 {S}/serve.py 8765 site   # then open http://localhost:8765/{a.book}/{ch}/')
    if a.kind in ('picture', 'documentary'):   # the series page's header picture: no step makes it on its own
        print(f'  later, the series page\'s img/cover.webp (hidden until it exists): uv run --with playwright --with pillow '
              f'python {S}/shot.py {ch} --out {q(work / "review" / "stills")} BEAT:SECONDS --webp 1400 --name cover '
              f'--url http://localhost:8765/{a.book}/, copied to {q(site / "img")}/')


if __name__ == '__main__':
    main()
