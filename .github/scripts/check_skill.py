#!/usr/bin/env python3
"""Check that the Papermorph Skill's docs agree with its files. Standard library only; run from the repository root:

    python3 .github/scripts/check_skill.py

- every relative link and #anchor in SKILL.md, references/ and the repository's own .md files resolves;
- SKILL.md links every reference file directly, so none is reachable only through another;
- every script in scripts/ is named in SKILL.md, and every script compiles;
- a flag written next to a script (`level.py --lufs -14`) appears in that script's source;
- a `scripts/x.py` or `assets/templates/...` path named in the docs exists.

Prints each problem with its file and exits 1 if there are any.
"""
import re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SKILL = ROOT / '.claude/skills/papermorph'
DOCS = [SKILL / 'SKILL.md', *sorted((SKILL / 'references').rglob('*.md'))]
REPO_DOCS = [p for p in (ROOT / 'README.md', ROOT / 'AGENTS.md', ROOT / 'engine/vendor/mathjax/README.md') if p.exists()]
problems = []


def say(path, msg):
    problems.append(f'{path.relative_to(ROOT)}: {msg}')


def slug(heading):
    h = re.sub(r'[`*_]', '', heading.strip().lower())
    return re.sub(r'[^\w\- ]', '', h).replace(' ', '-')


def anchors(path):
    out, fence = set(), False
    for line in path.read_text().splitlines():
        if line.startswith('```'):
            fence = not fence
        elif not fence and (m := re.match(r'#{1,6} (.*)', line)):
            out.add(slug(m.group(1)))
    return out


def without_fences(text):
    return re.sub(r'```.*?```', '', text, flags=re.S)


def links():
    for doc in DOCS + REPO_DOCS:
        for target in re.findall(r'\]\(([^)\s]+)\)', without_fences(doc.read_text())):
            if re.match(r'[a-z]+:', target):
                continue
            path, _, frag = target.partition('#')
            dest = (doc.parent / path).resolve() if path else doc
            if not dest.exists():
                say(doc, f'link to a missing file: {target}')
            elif frag and dest.suffix == '.md' and frag not in anchors(dest):
                say(doc, f'link to a missing heading: {target}')


def routing():
    text = (SKILL / 'SKILL.md').read_text()
    linked = {(SKILL / t.split('#')[0]).resolve() for t in re.findall(r'\]\((references/[^)#\s]+)', text)}
    for ref in DOCS[1:]:
        if ref.resolve() not in linked:
            say(ref, 'not linked from SKILL.md')
    for script in sorted((SKILL / 'scripts').glob('*.py')):
        if f'`{script.name}`' not in text:
            say(script, 'not named in SKILL.md')
        try:
            compile(script.read_text(), str(script), 'exec')
        except SyntaxError as e:
            say(script, f'does not compile: line {e.lineno}: {e.msg}')


def code_spans(text):
    """Inline code spans, plus each line of a fenced block as one span."""
    spans = []
    for block in re.findall(r'```[^\n]*\n(.*?)```', text, flags=re.S):
        spans += block.splitlines()
    return spans + re.findall(r'`([^`\n]+)`', without_fences(text))


def drift():
    for doc in DOCS:
        for span in code_spans(doc.read_text()):
            for p in re.findall(r'(?:^|[\s"]|SKILL/)(scripts/\w+\.py)', span):
                if not (SKILL / p).exists():
                    say(doc, f'names a missing script: {p}')
            for p in re.findall(r'(assets/templates/[\w./*-]+)', span):
                if not list(SKILL.glob(p.rstrip('/.'))):
                    say(doc, f'names a missing path: {p}')
            for name in re.findall(r'(\w+\.py)\b', span):
                src = SKILL / 'scripts' / name
                if not src.exists():
                    continue
                code = src.read_text()
                # a flag right after this script's name and before the next script or pipe belongs to it
                tail = re.split(r'\b\w+\.py\b|\|', span.split(name, 1)[1])[0]
                for flag in re.findall(r'(?<![\w-])(--[a-z][\w-]*)', tail):
                    if flag != '--help' and flag not in code:
                        say(doc, f'{name} has no {flag}')


def selftest():
    assert slug('Performance (Firefox)') == 'performance-firefox'
    assert slug('Cover and contents (`index.html`)') == 'cover-and-contents-indexhtml'
    assert slug('style.json') == 'stylejson'
    assert code_spans('a `x.py --y` b\n```sh\none\ntwo\n```') == ['one', 'two', 'x.py --y']


if __name__ == '__main__':
    selftest()
    links(); routing(); drift()
    print('\n'.join(problems) or 'ok', f'\n{len(problems)} problems in {len(DOCS) + len(REPO_DOCS)} docs')
    sys.exit(1 if problems else 0)
