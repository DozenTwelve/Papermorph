#!/usr/bin/env python3
"""Public-domain pictures and music recordings from Wikimedia Commons: search, look, download with a licence check.

    python3 commons.py search "ship of fools engraving" [-n 12]               # OK/XX, size, [licence], title
    python3 commons.py search "La Folia" --audio [-n 15]                       # OK/XX, length, [licence], title | artist
    python3 commons.py preview "File:A.jpg" "File:B.jpg" --out books/<book>/art/preview   # 700 px thumbs, 0.jpg, 1.jpg ...
    python3 commons.py get "File:Title.jpg" bosch.jpg --out books/<book>/art/found [--page 3]
    python3 commons.py get "File:Title.ogg" m1-folia --audio --out books/<book>/music   # the file's extension is added

Only public domain and CC0 are downloaded: the licence (Commons' LicenseShortName) must start with "public domain",
"cc0" or "pd" (PDM-owner counts), else the script refuses. A file with restrictions (trademarked, personality rights)
is downloaded with a WARN: free to copy is not free to show a logo or a living person. Each download writes a row to
the sources log (--sources, default OUT/SOURCES.tsv, with a header row; a new download of the same name replaces its
row): file, Commons title (and page), licence, author (or credit), file page URL, restrictions, credit (often the
holding collection), licence URL, date of the work. Commons serves only standard widths: JPEG, PNG, GIF and
WebP up to 1920 px come as the original, wider ones as a 1920 px rendering; SVG, DjVu and PDF come as a 1920 px
rendering (--page picks a page of a scan), TIFF as the largest standard width it has (1280 px for a 1500 px TIFF).
The name's extension must be the served one (.png for an SVG; leave it off to have it added). Recordings come as the
original file. Previews (small thumbs) skip the licence check: they are for looking, not for the film.

Recordings: a composition can be centuries old while a recording of it is still protected. Commons marks some
1950s-60s recordings (Karajan, Walter) public domain under EU rules; in the US they are protected until 2067, so
avoid them. Safe: recordings their performers released (PDM-owner, CC0), Musopen, and US government band recordings
(US Marine Band, Air Force bands).
"""
import argparse, html, json, os, re, subprocess, sys, urllib.error, urllib.parse, urllib.request

API = "https://commons.wikimedia.org/w/api.php"
UA = {"User-Agent": "papermorph/1.0 (https://github.com/DozenTwelve/Papermorph)"}   # Commons asks for a contact


def api(**p):
    p.update(format="json", action="query")
    return json.load(urllib.request.urlopen(urllib.request.Request(API + "?" + urllib.parse.urlencode(p), headers=UA), timeout=60))


def fetch(url, path, timeout=120):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout) as r:
        data = r.read()   # all of it first: a broken download leaves no half file
    with open(path, "wb") as f:
        f.write(data)


ok = lambda lic: bool(re.match(r"(public domain|cc0|pd)", lic.strip(), re.I))
licence = lambda ii: ii.get("extmetadata", {}).get("LicenseShortName", {}).get("value", "?")
meta = lambda ii, k: ii.get("extmetadata", {}).get(k, {}).get("value", "")
strip = lambda s, n=70: re.sub(r" (?=[,.;:])", "", " ".join(html.unescape(re.sub(r"<[^>]+>", " ", s or "")).split()))[:n]
IMG = dict(prop="imageinfo", iiprop="url|size|extmetadata|mime", iiurlwidth=1920)
AUD = dict(prop="imageinfo", iiprop="url|size|extmetadata|mime|mediatype")
RAW = ("image/jpeg", "image/png", "image/gif", "image/webp")   # served as the original up to 1920 px
VECTOR = ("image/svg+xml", "image/vnd.djvu", "application/pdf")   # rendered at 1920 px whatever their nominal size
HEAD = "file\ttitle\tlicence\tauthor\tsource\trestrictions\tcredit\tlicence url\tdate\n"   # the sources log's columns
NOTE = "(a PD composition is not a PD recording: check the performer and year, see --help)"


def search(q, n, audio):
    d = api(generator="search", gsrsearch=q + (" filetype:audio" if audio else ""), gsrnamespace=6, gsrlimit=n or (15 if audio else 12), **(AUD if audio else IMG))
    pages = [p for p in d.get("query", {}).get("pages", {}).values() if p.get("imageinfo")]
    if not pages:
        print("no results")
    for p in sorted(pages, key=lambda p: p.get("index", 0)):
        ii = p["imageinfo"][0]; lic = licence(ii); tag = "OK" if ok(lic) else "XX"
        if audio:
            print(f"{tag} {ii.get('duration', 0):6.0f}s [{lic}] {p['title']} | {strip(meta(ii, 'Artist'))}")
        else:
            print(f"{tag} {ii['width']}x{ii['height']} [{lic}] {p['title']}{' (' + meta(ii, 'Restrictions') + ')' if meta(ii, 'Restrictions') else ''}")
    if audio:
        print(NOTE, file=sys.stderr)


def get(title, name, out, sources, page, audio):
    params = AUD if audio else dict(IMG, iiurlparam=f"page{page}-1920px") if page else IMG
    p = next(iter(api(titles=title, **params)["query"]["pages"].values()))
    if not p.get("imageinfo"):
        sys.exit(f"no such file: {title}")
    ii = p["imageinfo"][0]; lic = licence(ii); mime = ii.get("mime", "?")
    if not ok(lic):
        sys.exit(f"REJECT licence {lic}")
    if audio and ii.get("mediatype") != "AUDIO":
        sys.exit(f"{title} is {mime}, not a recording")
    if not audio and not (mime in RAW or mime in VECTOR or mime == "image/tiff"):
        sys.exit(f"{title} is {mime}, not a picture" + (" (a recording? add --audio)" if ii.get("mediatype") == "AUDIO" else ""))
    if audio:
        url = ii["url"]
    elif mime in RAW and ii["width"] <= 1920 and not page:
        url = ii["url"]
    elif not ii.get("thumburl"):
        sys.exit(f"Commons gave no rendering of {title}")
    else:   # the API's thumb width is unreliable (a PDF page came at 500 px): ask for 1920 px where it can be drawn
        url = ii["thumburl"]
        if mime in VECTOR:
            url = re.sub(r"/((?:lossy-|lossless-)?page\d+-)?\d+px-(?=[^/]*$)", r"/\g<1>1920px-", url, 1)
    ext = os.path.splitext(urllib.parse.urlparse(url).path)[1].lower().replace(".jpeg", ".jpg")
    base, want = os.path.splitext(name)
    if audio or not want:
        name += ext
    elif want.lower().replace(".jpeg", ".jpg") != ext:
        sys.exit(f"Commons serves {title} as {ext}: name it {base}{ext}")
    rights = meta(ii, "Restrictions")
    if rights:
        print(f"WARN {title} is restricted ({rights}): the licence covers the copyright only; do not show it as a brand or a person's endorsement", file=sys.stderr)
    os.makedirs(out, exist_ok=True)
    path = os.path.join(out, name)
    fetch(url, path, 300 if audio else 120)
    log = sources or os.path.join(out, "SOURCES.tsv")
    rows = [l for l in open(log, encoding="utf-8")] if os.path.exists(log) else []
    rows = [HEAD] + [l for l in rows if l.split("\t", 1)[0] not in (name, "file")]   # a new download of a name replaces its row
    rows.append("\t".join([name, p["title"] + (f" (page {page})" if page else ""), lic,
                           strip(meta(ii, "Artist") or meta(ii, "Credit"), 200) or "?", ii.get("descriptionurl", ""), rights,
                           strip(meta(ii, "Credit"), 200), meta(ii, "LicenseUrl"), strip(meta(ii, "DateTimeOriginal"), 60)]) + "\n")
    with open(log, "w", encoding="utf-8") as f:
        f.writelines(rows)
    if audio:
        print("saved", path, lic, url); print(NOTE, file=sys.stderr)
    else:   # the saved file's own size (ffprobe reads pictures too)
        wh = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=width,height", "-of", "csv=p=0:s=x", path],
                            capture_output=True, text=True).stdout.strip()
        print("saved", path, wh or "?", lic, url)


def preview(titles, out):
    os.makedirs(out, exist_ok=True)
    for i, t in enumerate(titles):
        ii = (next(iter(api(titles=t, prop="imageinfo", iiprop="url|mime", iiurlwidth=700)["query"]["pages"].values())).get("imageinfo") or [{}])[0]
        if not ii.get("thumburl") or not (ii["mime"] in RAW or ii["mime"] in VECTOR or ii["mime"] == "image/tiff"):
            print("no picture:", t, file=sys.stderr); continue
        fn = os.path.join(out, f"{i}.jpg"); fetch(ii["thumburl"], fn); print(fn, t)


ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
sub = ap.add_subparsers(dest="cmd", required=True)
s = sub.add_parser("search"); s.add_argument("query"); s.add_argument("-n", type=int, help="results (12, or 15 with --audio)"); s.add_argument("--audio", action="store_true")
g = sub.add_parser("get"); g.add_argument("title"); g.add_argument("name"); g.add_argument("--out", required=True)
g.add_argument("--sources", help="sources log (default OUT/SOURCES.tsv)"); g.add_argument("--page"); g.add_argument("--audio", action="store_true")
v = sub.add_parser("preview"); v.add_argument("titles", nargs="+"); v.add_argument("--out", required=True)
a = ap.parse_args()
try:
    if a.cmd == "search": search(a.query, a.n, a.audio)
    elif a.cmd == "get": get(a.title, a.name, a.out, a.sources, a.page, a.audio)
    else: preview(a.titles, a.out)
except urllib.error.HTTPError as e:
    sys.exit("Commons rate limited this; retry later" if e.code == 429 else f"HTTP {e.code} {e.reason}: {e.url}")
except (urllib.error.URLError, TimeoutError) as e:
    sys.exit(f"network error: {getattr(e, 'reason', e)}")
