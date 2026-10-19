#!/usr/bin/env python3
"""Package a built Papermorph web book (site/<book>/) as a SCORM 1.2 or 2004 zip for an LMS.

    python3 scorm.py site/<book>                          # SCORM 2004 4th edition, completion only -> dist/
    python3 scorm.py site/<book> --version 1.2            # SCORM 1.2, for older LMSs
    python3 scorm.py site/<book> --mastery 80             # also passed/failed at 80 %
    python3 scorm.py site/<book> --title "PSY101: Motivation" --out OUT

The package launches launch.html, which opens one SCORM session and runs the book in a frame.
scorm-bridge.js is added to each book page to report progress. The site folder itself is not changed.

Tracking:
  completion  every chapter's finish card has been reached
  score       first-try answers across all chapters' quick checks and practice (best attempt per chapter), 0-100
  objectives  one per chapter (ch01, ch02, ...) with its own status and score
  --mastery   also report passed/failed against this score once the book is finished
"""
import argparse
import json
import re
import sys
import zipfile
from html import escape
from pathlib import Path
from xml.sax.saxutils import quoteattr

RUNTIME = Path(__file__).resolve().parent.parent / 'assets' / 'scorm'
BRIDGE = 'scorm-bridge.js'
ENGINE_TAG = re.compile(r'(<script src="\.\./lib/engine\.js"></script>)')
CHARSET_TAG = re.compile(r'(<meta charset="utf-8">)', re.I)
# Audio and images are already compressed; zipping them again only costs time.
STORED = {'.mp3', '.m4a', '.ogg', '.mp4', '.webm', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.woff', '.woff2'}


def chapters(site: Path):
    """[{n, title}] for every chapter folder, read from the chapter's CHAPTER constant."""
    out = []
    for d in sorted(site.glob('ch[0-9][0-9]')):
        page = d / 'index.html'
        if not page.is_file():
            continue
        html = page.read_text(encoding='utf-8')
        m = re.search(r'const CHAPTER\s*=\s*\{[^}]*?number:\s*(\d+)[^}]*?title:\s*(["\'])(.*?)(?<!\\)\2', html)
        if not m:
            sys.exit(f'{page}: no CHAPTER constant with number and title')
        out.append({'n': int(m.group(1)), 'title': m.group(3).replace("\\'", "'").replace('\\"', '"')})
    if not out:
        sys.exit(f'{site}: no chapter folders (ch01/index.html, ...)')
    nums = [c['n'] for c in out]
    if len(set(nums)) != len(nums):
        sys.exit(f'{site}: two chapters share a CHAPTER.number: {nums}')
    return out   # numbers need not start at 1: a book may keep its source's numbering (ch09, ch10, ...)


LINK = re.compile(r'''(?:src|href)=["']([^"'#?]+)''')


def outside(site: Path, rel: str, html: str):
    """Relative files a page loads or links to that lie outside the book folder (they won't be in the package)."""
    out = set()
    for ref in LINK.findall(html):
        if re.match(r'^[a-z][a-z0-9+.-]*:|^//|^/', ref, re.I):
            continue   # absolute URLs and site-root paths: not files of this book
        target = (site / rel).parent.joinpath(ref).resolve()
        if site not in target.parents and target != site:
            out.add(ref)
    return out


def progress_key(site: Path):
    """The progressKey the contents page passes to Contents.book(), if any (an older book's own localStorage key)."""
    m = re.search(r'progressKey:\s*(["\'])(.*?)\1', (site / 'index.html').read_text(encoding='utf-8'))
    return m.group(2) if m else None


def book_title(site: Path):
    m = re.search(r'<title>(.*?)</title>', (site / 'index.html').read_text(encoding='utf-8'), re.S)
    return m.group(1).strip() if m else site.name


def with_bridge(rel: str, html: str):
    """The page with scorm-bridge.js added, or None if it isn't a book page."""
    if rel == 'index.html':
        out, k = CHARSET_TAG.subn(rf'\1\n<script src="{BRIDGE}"></script>', html, count=1)
    elif re.fullmatch(r'ch\d\d/index\.html', rel):
        out, k = ENGINE_TAG.subn(rf'\1\n<script src="../{BRIDGE}"></script>', html, count=1)
    else:
        return None
    if k != 1:
        sys.exit(f'{rel}: could not find where to add {BRIDGE} (the page layout may have changed)')
    return out


def manifest(book, title, version, mastery, files):
    ident = re.sub(r'[^A-Za-z0-9_.-]', '-', f'papermorph.{book}')
    t = escape(title)
    file_list = '\n'.join(f'      <file href={quoteattr(f)}/>' for f in files)
    if version == '1.2':
        mastery_xml = f'\n        <adlcp:masteryscore>{mastery}</adlcp:masteryscore>' if mastery is not None else ''
        return f'''<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="{ident}" version="1"
  xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd http://www.imsglobal.org/xsd/imsmd_rootv1p2p1 imsmd_rootv1p2p1.xsd http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations default="org">
    <organization identifier="org">
      <title>{t}</title>
      <item identifier="item_book" identifierref="res_book" isvisible="true">
        <title>{t}</title>{mastery_xml}
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="res_book" type="webcontent" adlcp:scormtype="sco" href="launch.html">
{file_list}
    </resource>
  </resources>
</manifest>
'''
    seq = ''
    if mastery is not None:
        seq = f'''
        <imsss:sequencing>
          <imsss:objectives>
            <imsss:primaryObjective objectiveID="book" satisfiedByMeasure="true">
              <imsss:minNormalizedMeasure>{mastery / 100:.2f}</imsss:minNormalizedMeasure>
            </imsss:primaryObjective>
          </imsss:objectives>
        </imsss:sequencing>'''
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="{ident}" version="1"
  xmlns="http://www.imsglobal.org/xsd/imscp_v1p1"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_v1p3"
  xmlns:adlseq="http://www.adlnet.org/xsd/adlseq_v1p3"
  xmlns:adlnav="http://www.adlnet.org/xsd/adlnav_v1p3"
  xmlns:imsss="http://www.imsglobal.org/xsd/imsss"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsglobal.org/xsd/imscp_v1p1 imscp_v1p1.xsd http://www.adlnet.org/xsd/adlcp_v1p3 adlcp_v1p3.xsd http://www.adlnet.org/xsd/adlseq_v1p3 adlseq_v1p3.xsd http://www.adlnet.org/xsd/adlnav_v1p3 adlnav_v1p3.xsd http://www.imsglobal.org/xsd/imsss imsss_v1p0.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>2004 4th Edition</schemaversion>
  </metadata>
  <organizations default="org">
    <organization identifier="org">
      <title>{t}</title>
      <item identifier="item_book" identifierref="res_book" isvisible="true">
        <title>{t}</title>{seq}
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="res_book" type="webcontent" adlcp:scormType="sco" href="launch.html">
{file_list}
    </resource>
  </resources>
</manifest>
'''


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('book', type=Path, help='the built book, e.g. site/motivation')
    ap.add_argument('--version', choices=['1.2', '2004'], default='2004', help='SCORM version (default 2004 4th edition; 1.2 for older LMSs)')
    ap.add_argument('--mastery', type=int, metavar='PCT', help='passing score 0-100; without it the book reports completed, not passed/failed')
    ap.add_argument('--title', help='title shown in the LMS (default: the book cover <title>)')
    ap.add_argument('--out', type=Path, default=Path('dist'), help='output folder (default dist/)')
    a = ap.parse_args()
    if a.mastery is not None and not 0 <= a.mastery <= 100:
        ap.error('--mastery must be between 0 and 100')

    site = a.book.resolve()
    slug = site.name
    if not (site / 'index.html').is_file():
        sys.exit(f'{site}: no index.html; build the book first')
    chs = chapters(site)
    title = a.title or book_title(site)

    # Everything that goes in the zip: {path in zip: bytes}.
    files = {}
    for f in sorted(site.rglob('*')):
        if not f.is_file():
            continue
        rel = f.relative_to(site).as_posix()
        if rel.startswith('.') or '/.' in rel or rel.endswith(('.bak', '.tmp')) or '.bak-' in rel:
            continue
        data = f.read_bytes()
        if rel.endswith('.html'):
            for ref in sorted(outside(site, rel, data.decode('utf-8'))):
                print(f'warning: {rel} uses {ref}, outside the book folder; it is not in the package', file=sys.stderr)
            patched = with_bridge(rel, data.decode('utf-8'))
            if patched is not None:
                data = patched.encode('utf-8')
        files['book/' + rel] = data
    files['book/' + BRIDGE] = (RUNTIME / BRIDGE).read_bytes()
    files['scorm-host.js'] = (RUNTIME / 'scorm-host.js').read_bytes()
    cfg = {'book': slug, 'title': title, 'version': a.version, 'mastery': a.mastery, 'chapters': chs,
           'progressKey': progress_key(site)}
    launch = (RUNTIME / 'launch.html').read_text(encoding='utf-8')
    config = json.dumps(cfg, ensure_ascii=False).replace('<', chr(92) + 'u003c')   # no '</script>' inside the script
    launch = launch.replace('__TITLE__', escape(title)).replace('__CONFIG__', config)
    files['launch.html'] = launch.encode('utf-8')
    files['imsmanifest.xml'] = manifest(slug, title, a.version, a.mastery,
                                         sorted(k for k in files if k != 'imsmanifest.xml')).encode('utf-8')

    a.out.mkdir(parents=True, exist_ok=True)
    zpath = a.out / f'{slug}-scorm{a.version.replace(".", "")}.zip'
    with zipfile.ZipFile(zpath, 'w') as z:
        # The manifest goes first; some LMS importers look for it at the start of the archive.
        for name in ['imsmanifest.xml'] + sorted(k for k in files if k != 'imsmanifest.xml'):
            kind = zipfile.ZIP_STORED if Path(name).suffix.lower() in STORED else zipfile.ZIP_DEFLATED
            z.writestr(name, files[name], compress_type=kind)
    size = zpath.stat().st_size / 1e6
    print(f'{zpath}  ({size:.1f} MB, SCORM {a.version}, {len(chs)} chapters, '
          f'{"mastery " + str(a.mastery) + "%" if a.mastery is not None else "completion only"})')


if __name__ == '__main__':
    main()
