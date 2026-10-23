#!/usr/bin/env python3
"""Fast static checks of a book's chapters, no browser: run before the delivery pass and after any edit.

    python3 lint.py site/<book>                 # every chapter
    python3 lint.py site/<book> ch12 ch13       # some chapters
    python3 lint.py site/<book> --content content/<book> --brief books/<book>

Errors (exit status 1):
  global    a top-level name in the chapter or a lib file it loads is also declared by the engine or another of
            its scripts; a second const/let/class stops the page script, a second function silently replaces one
  math      the chapter uses a maths helper from lib/math.js but does not load it after engine.js
  beat      a beat id has no entry in audio/<lang>/timings.js or no MP3
  mark      m('name') is not a mark of any beat
  stale     the narration's text or [[marks]] differ from timings.js: run tts.py again
  style     style.json is not valid JSON or lacks schema, tier, book, words, look or voice
Warnings: a beat's m('name') not among that beat's own marks (beats built by shared helpers can mislead this);
  no beats recognised in a chapter; no narration file to check against.
--content defaults to content/<book> (content/ for the first book's legacy layout), --brief to books/<book>.
"""
import argparse, json, re, sys
from pathlib import Path

DECL = re.compile(r'(?<![\w$.])(?:async\s+)?(function\*?|const|let|var|class)\s+([A-Za-z_$][\w$]*)')
SRC = re.compile(r'<script\s+src="([^"]+)"')
INLINE = re.compile(r'<script>(.*?)</script>', re.S)
BEAT = re.compile(r"\[\s*'(\w+)'\s*,\s*(['\"`])(?:\\.|(?!\2).)*\2\s*,\s*(?:\(\s*(?:m\b|\))|m\s*=>)")   # ['id', 'title', (m, D) =>
MCALL = re.compile(r"(?<![\w$.])m\(\s*'(\w+)'\s*[,)]")
MARK = re.compile(r'\[\[(\w+)\]\]')
ENGINE_FILES = {'engine.js', 'math.js', 'volume.js', 'contents.js', 'units.js'}
LOCAL = re.compile(r'[,(]\s*([A-Za-z_$][\w$]*)\s*=(?![=>])')   # a, name = … or (p, name = 1): declared in a list
PARAMS = re.compile(r'function\s*[\w$]*\s*\(([^)]*)\)|\(([^()]*)\)\s*=>|([A-Za-z_$][\w$]*)\s*=>')   # parameters
METHOD = re.compile(r'^\s*([A-Za-z_$][\w$]*)\s*\([^()]*\)\s*\{', re.M)   # name(a, b) { … } in an object
DESTRUCT = re.compile(r'(?:const|let|var)\s*([\[{][^;]*?[\]}])\s*(?:=|of\b|in\b)')   # const {a, b: c, d = 1} = …, for (const [x, y] of …)
DKEY = re.compile(r'[A-Za-z_$][\w$]*\s*:|=[^,\]}]*')   # in a pattern, a key (b: c declares c) and a default (= 1) declare nothing
USE = re.compile(r'(?<![\w$.])([A-Za-z_$][\w$]*)(?![\w$])(?!\s*:)')   # a name, not a property or an object key


def depth0(text):
    """The code with strings, templates, comments and regex literals blanked, and a mask of brace depth 0."""
    out, top, depth, i, n = list(text), [False] * len(text), 0, 0, len(text)
    stack = []   # open template literals: brace depth at each ${
    prev = ''    # last significant character, to tell a regex from a division
    def blank(a, b):
        for k in range(a, b):
            if out[k] != '\n':
                out[k] = ' '
    while i < n:
        c = text[i]
        if c in '\'"':
            j = i + 1
            while j < n and text[j] != c and text[j] != '\n':
                j += 2 if text[j] == '\\' else 1
            blank(i + 1, j); i = j + 1; prev = 'a'; continue
        if c == '`' or (c == '}' and stack and stack[-1] == depth):
            if c == '}':
                stack.pop()
            j = i + 1
            while j < n and text[j] != '`' and not (text[j] == '$' and text[j + 1:j + 2] == '{'):
                j += 2 if text[j] == '\\' else 1
            blank(i + 1, j)
            if j < n and text[j] == '$':
                stack.append(depth); i = j + 2; prev = '('; continue
            i = j + 1; prev = 'a'; continue
        if c == '/' and text[i + 1:i + 2] == '/':
            j = text.find('\n', i); j = n if j < 0 else j
            blank(i, j); i = j; continue
        if c == '/' and text[i + 1:i + 2] == '*':
            j = text.find('*/', i + 2); j = n if j < 0 else j + 2
            blank(i, j); i = j; continue
        if c == '/' and (prev in '(,=:[!&|?{};+-*%<>~^' or prev == ''):
            j, cls = i + 1, False
            while j < n and text[j] != '\n' and (text[j] != '/' or cls):
                if text[j] == '\\': j += 1
                elif text[j] == '[': cls = True
                elif text[j] == ']': cls = False
                j += 1
            blank(i + 1, j); i = j + 1; prev = 'a'; continue
        if c in '{([':
            depth += 1
        elif c in '})]':
            depth -= 1
        top[i] = depth == 0
        if not c.isspace():
            prev = 'a' if (c.isalnum() or c in '_$') else c
            if c.isalpha():   # keywords after which a slash starts a regex
                w = re.match(r'[A-Za-z]+', text[i:]).group(0)
                if w in ('return', 'typeof', 'case', 'in', 'of', 'new', 'delete', 'void', 'throw', 'else', 'do'):
                    prev = '('
                top[i:i + len(w)] = [depth == 0] * len(w)
                i += len(w); continue
        i += 1
    return ''.join(out), top


def decls(text):
    """Top-level declarations of a script: name, kind and line."""
    code, top = depth0(text)
    return [(m.group(2), m.group(1), code.count('\n', 0, m.start()) + 1)
            for m in DECL.finditer(code) if top[m.start()]]


def timings(path):
    t = path.read_text(encoding='utf-8')
    T = json.loads(t[t.index('{'):t.rindex('}') + 1])
    shots = path.with_name('shots.js')   # join.py's joined scenes: TIMINGS.scene = {...};
    if shots.exists():
        for m in re.finditer(r'^TIMINGS\.(\w+) = (\{.*\});$', shots.read_text(encoding='utf-8'), re.M):
            T[m.group(1)] = json.loads(m.group(2))
    return T


def words(s):
    return re.sub(r'[^\w]+', ' ', MARK.sub('', s)).lower().split()


def lint_chapter(ch, content, out):
    err = lambda kind, msg: out.append(('E', kind, f'{ch.name}: {msg}'))
    warn = lambda kind, msg: out.append(('W', kind, f'{ch.name}: {msg}'))
    html = re.sub(r'<!--.*?-->', '', (ch / 'index.html').read_text(encoding='utf-8'), flags=re.S)   # a commented-out <script> loads nothing
    inline = '\n'.join(INLINE.findall(html))
    # globals: every script the page loads, in order
    seen, own = {}, [inline]   # own: the chapter's code and the book's scripts, not the engine's
    for src in SRC.findall(html) + ['(chapter)']:
        if src == '(chapter)':
            text, name = inline, 'chapter'
        else:
            f = (ch / src).resolve()
            if f.suffix != '.js' or not f.exists() or f.name in ('timings.js', 'mathjax.js'):   # MathJax declares no globals
                continue
            text, name = f.read_text(encoding='utf-8'), f.name
            if f.parent.name != 'lib' or f.name not in ENGINE_FILES:
                own.append(text)
        for ident, kind, line in decls(text):
            if ident in seen:
                first, k0 = seen[ident]
                what = 'replaces' if kind.startswith('function') and k0.startswith('function') else 'redeclares'
                err('global', f'{name}:{line} {what} {ident} from {first}')
            else:
                seen[ident] = (name, kind)
    # maths helpers used without math.js (they left engine.js after the engine-v1 tag)
    math = (ch / '../lib/math.js').resolve()
    loaded = {Path(s).name for s in SRC.findall(html)}
    if 'engine.js' in loaded and 'math.js' not in loaded and math.exists():
        names = {d[0] for d in decls(math.read_text(encoding='utf-8'))} - set(seen)
        code = [depth0(text)[0] for text in own]
        local = {m.group(2) for c in code for m in DECL.finditer(c)} | {n for c in code for n in LOCAL.findall(c)}
        local |= {n for c in code for n in METHOD.findall(c)}
        local |= {n for c in code for d in DESTRUCT.findall(c) for n in re.findall(r'[A-Za-z_$][\w$]*', DKEY.sub(' ', d))}
        local |= {n for c in code for p in PARAMS.findall(c) for n in re.findall(r'[A-Za-z_$][\w$]*', ''.join(p))}
        used = sorted({w for c in code for w in USE.findall(c)} & names - local)
        if used:
            err('math', f"uses {', '.join(used)} from lib/math.js: load ../lib/math.js right after engine.js")
    # beats, audio, marks
    lang = (re.search(r"language:\s*'(\w+)'", inline) or [None, 'en'])[1]
    tpath = ch / 'audio' / lang / 'timings.js'
    if not tpath.exists():
        return err('beat', f'no audio/{lang}/timings.js')
    T = timings(tpath)
    starts = [(m.start(), m.group(1)) for m in BEAT.finditer(inline)]
    ids = [b for _, b in starts]
    if not ids:
        warn('beat', "no beats recognised (expected ['id', 'title', (m, D) => …]); marks were not checked")
    for b in ids:
        if b not in T:
            err('beat', f'beat {b} has no timings')
        elif not (ch / 'audio' / lang / f'{b}.mp3').exists():
            err('beat', f'beat {b} has no MP3')
    every = {k for v in T.values() for k in v.get('marks', {})}
    for i, (pos, b) in enumerate(starts):
        body = inline[pos:starts[i + 1][0] if i + 1 < len(starts) else len(inline)]
        for k in sorted(set(MCALL.findall(body))):
            if k not in every:
                err('mark', f"m('{k}') in beat {b} is not a mark of any beat")
            elif b in T and k not in T[b].get('marks', {}):
                warn('mark', f"m('{k}') in beat {b} is not one of its marks")
    # narration against the generated audio
    nar = content / ch.name / f'narration.{lang}.json'
    if nar.exists():
        N = json.loads(nar.read_text(encoding='utf-8-sig')).get('beats', {})
        for b, text in N.items():
            if isinstance(text, dict):   # a beat with a speaker; its caption is the subtitle when it has one
                text = text.get('sub') or text['text']
            if b not in T:
                err('stale', f'narration beat {b} has no timings')
                continue
            if set(MARK.findall(text)) != set(T[b].get('marks', {})):
                err('stale', f'beat {b}: narration marks differ from timings.js')
            cues = ' '.join(c[1] for c in T[b].get('cues', []))
            if cues and words(text) != words(cues):
                err('stale', f'beat {b}: narration text differs from the generated audio')
    else:
        warn('stale', f'no narration at {nar}: narration not checked (pass --content)')


def lint_style(brief, out):
    p = brief / 'style.json'
    if not p.exists():
        return
    try:
        s = json.loads(p.read_text(encoding='utf-8'))
    except ValueError as e:
        return out.append(('E', 'style', f'style.json: {e}'))
    missing = [k for k in ('schema', 'tier', 'book', 'words', 'look', 'voice') if k not in s]
    if missing:
        out.append(('E', 'style', f'style.json lacks {", ".join(missing)}'))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('book', type=Path, help='the book folder in site/')
    ap.add_argument('chapters', nargs='*', help='chNN (default: all)')
    ap.add_argument('--content', type=Path)
    ap.add_argument('--brief', type=Path)
    a = ap.parse_args()
    root, slug = a.book.resolve().parent.parent, a.book.resolve().name
    content = a.content or next((c for c in (root / 'content' / slug, root / 'content') if c.is_dir()), root / 'content' / slug)
    chs = [a.book / c for c in a.chapters] if a.chapters else sorted(a.book.glob('ch[0-9]*'))
    out = []
    for ch in chs:
        if (ch / 'index.html').exists():
            lint_chapter(ch, content, out)
    lint_style(a.brief or root / 'books' / slug, out)
    for level, kind, msg in out:
        print(f'{"error" if level == "E" else "warn "} {kind:6} {msg}')
    n = sum(level == 'E' for level, _, _ in out)
    print(f'{len(chs)} chapters: {n} errors, {len(out) - n} warnings')
    sys.exit(1 if n else 0)


if __name__ == '__main__':
    main()
