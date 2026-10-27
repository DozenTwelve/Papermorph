#!/usr/bin/env python3
"""Checks of the published books that need no private folders, network or browser. Run from the repository root:

    python3 .github/scripts/check_site.py

- every book's engine copy matches engine/ (engine.py --check), so no one edited a copy instead of the source;
- lint.py on every book (errors fail; narration is not checked, since content/ is not in the repository);
- node --check on every script: the .js files and each inline <script> of every page, so a syntax error that
  would stop a chapter is caught before it ships.

Needs Python 3 and Node. Exits 1 if any check fails.
"""
import re, subprocess, sys, tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCRIPTS = ROOT / '.claude/skills/papermorph/scripts'
failed = []


def run(label, cmd):
    r = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True)
    if r.returncode:
        failed.append(label)
        print(f'FAIL {label}\n{(r.stdout + r.stderr).strip()}\n')
    return r


def node_check(path, label):
    r = subprocess.run(['node', '--check', str(path)], capture_output=True, text=True)
    if r.returncode:
        failed.append(label)
        print(f'FAIL {label}\n{r.stderr.strip()}\n')


def main():
    run('engine copies', [sys.executable, str(SCRIPTS / 'engine.py'), 'site', '--check'])
    books = sorted(p.parent.parent for p in (ROOT / 'site').glob('*/lib/engine.js'))
    for book in books:
        run(f'lint {book.name}', [sys.executable, str(SCRIPTS / 'lint.py'), str(book.relative_to(ROOT))])

    tracked = subprocess.run(['git', 'ls-files', 'engine', 'site', '.claude/skills/papermorph/assets'],
                             cwd=ROOT, capture_output=True, text=True, check=True).stdout.split()
    js = [f for f in tracked if f.endswith('.js') and 'vendor/' not in f and not f.endswith('mathjax.js')]
    pages = [f for f in tracked if f.endswith('.html')]
    for f in js:
        node_check(ROOT / f, f)
    inline = 0
    with tempfile.TemporaryDirectory() as tmp:
        for f in pages:
            html = (ROOT / f).read_text(errors='replace')
            for i, (attrs, body) in enumerate(re.findall(r'<script(\s[^>]*)?>(.*?)</script>', html, flags=re.S)):
                attrs = attrs or ''
                if 'src=' in attrs or not body.strip() or re.search(r'type=["\']?(?!text/javascript|module)', attrs):
                    continue
                out = Path(tmp) / f'{len(failed)}-{inline}.{"mjs" if "module" in attrs else "js"}'
                out.write_text(body)
                node_check(out, f'{f} <script> #{i + 1}')
                inline += 1
    print(f'{len(books)} books linted, {len(js)} scripts and {inline} inline scripts checked; '
          f'{len(failed)} failed' + (': ' + ', '.join(failed) if failed else ''))
    sys.exit(1 if failed else 0)


if __name__ == '__main__':
    main()
