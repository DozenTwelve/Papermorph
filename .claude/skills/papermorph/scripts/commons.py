#!/usr/bin/env python3
"""Public-domain pictures and music recordings from Wikimedia Commons: search, look, download with a licence check.

    python3 commons.py search "ship of fools engraving" [-n 12]               # OK/XX, size, [licence], title
    python3 commons.py search "La Folia" --audio [-n 15]                       # OK/XX, length, [licence], title | artist
    python3 commons.py preview "File:A.jpg" "File:B.jpg" --out books/<book>/art/preview   # 700 px thumbs, 0.jpg, 1.jpg ...
    python3 commons.py get "File:Title.jpg" bosch.jpg --out books/<book>/art/found [--page 3]
    python3 commons.py get "File:Title.ogg" m1-folia --audio --out books/<book>/music   # the file's extension is added

Only public domain and CC0 are downloaded: the licence (Commons' LicenseShortName) must start with "public domain",
"cc0" or "pd" (PDM-owner counts), else the script refuses. Each download appends a row to the sources log
(--sources, default OUT/SOURCES.tsv): file, Commons title (and page), licence. Pictures wider than 1800 px, TIFF,
DjVu and PDF come as an 1800 px rendering (--page picks a page of a scan); recordings come as the original file.
Previews skip the licence check: they are for looking, not for the film.

Recordings: a composition can be centuries old while a recording of it is still protected. Commons marks some
1950s-60s recordings (Karajan, Walter) public domain under EU rules; in the US they are protected until 2067, so
avoid them. Safe: recordings their performers released (PDM-owner, CC0), Musopen, and US government band recordings
(US Marine Band, Air Force bands).
"""
import argparse, json, os, re, sys, urllib.parse, urllib.request

API = "https://commons.wikimedia.org/w/api.php"
UA = {"User-Agent": "papermorph/1.0 (https://github.com/DozenTwelve/Papermorph)"}   # Commons asks for a contact


def api(**p):
    p.update(format="json", action="query")
    return json.load(urllib.request.urlopen(urllib.request.Request(API + "?" + urllib.parse.urlencode(p), headers=UA), timeout=60))


def fetch(url, path, timeout=120):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout) as r, open(path, "wb") as f:
        f.write(r.read())


ok = lambda lic: bool(re.match(r"(public domain|cc0|pd)", lic.strip(), re.I))
licence = lambda ii: ii.get("extmetadata", {}).get("LicenseShortName", {}).get("value", "?")
strip = lambda s: re.sub(r"<[^>]+>", "", s or "")[:70]
IMG = dict(prop="imageinfo", iiprop="url|size|extmetadata|mime", iiurlwidth=1800)
AUD = dict(prop="imageinfo", iiprop="url|size|extmetadata|mime|mediatype")


def search(q, n, audio):
    d = api(generator="search", gsrsearch=q + (" filetype:audio" if audio else ""), gsrnamespace=6, gsrlimit=n or (15 if audio else 12), **(AUD if audio else IMG))
    for p in sorted(d.get("query", {}).get("pages", {}).values(), key=lambda p: p.get("index", 0)):
        ii = p["imageinfo"][0]; lic = licence(ii); tag = "OK" if ok(lic) else "XX"
        if audio:
            print(f"{tag} {ii.get('duration', 0):6.0f}s [{lic}] {p['title']} | {strip(ii.get('extmetadata', {}).get('Artist', {}).get('value'))}")
        else:
            print(f"{tag} {ii['width']}x{ii['height']} [{lic}] {p['title']}")
    if audio:
        print("(a PD composition is not a PD recording: check the performer and year, see --help)", file=sys.stderr)


def get(title, name, out, sources, page, audio):
    params = AUD if audio else dict(IMG, iiurlparam=f"page{page}-1800px") if page else IMG
    p = next(iter(api(titles=title, **params)["query"]["pages"].values()))
    if "imageinfo" not in p:
        sys.exit(f"no such file: {title}")
    ii = p["imageinfo"][0]; lic = licence(ii)
    if not ok(lic):
        sys.exit(f"REJECT licence {lic}")
    if audio:
        url = ii["url"]; name += os.path.splitext(urllib.parse.urlparse(url).path)[1]
    else:
        url = ii.get("thumburl") if ii["width"] > 1800 else ii["url"]
        if page or ii["mime"] in ("image/tiff", "image/vnd.djvu", "application/pdf"):
            url = ii["thumburl"]
    os.makedirs(out, exist_ok=True)
    path = os.path.join(out, name)
    fetch(url, path, 300 if audio else 120)
    with open(sources or os.path.join(out, "SOURCES.tsv"), "a", encoding="utf-8") as f:
        f.write(f"{name}\t{p['title']}{f' (page {page})' if page else ''}\t{lic}\n")
    print("saved", path, *([] if audio else [ii["width"], ii["height"]]), lic, url)


def preview(titles, out):
    os.makedirs(out, exist_ok=True)
    for i, t in enumerate(titles):
        ii = next(iter(api(titles=t, prop="imageinfo", iiprop="url", iiurlwidth=700)["query"]["pages"].values()))["imageinfo"][0]
        fn = os.path.join(out, f"{i}.jpg"); fetch(ii["thumburl"], fn); print(fn, t)


ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
sub = ap.add_subparsers(dest="cmd", required=True)
s = sub.add_parser("search"); s.add_argument("query"); s.add_argument("-n", type=int, help="results (12, or 15 with --audio)"); s.add_argument("--audio", action="store_true")
g = sub.add_parser("get"); g.add_argument("title"); g.add_argument("name"); g.add_argument("--out", required=True)
g.add_argument("--sources", help="sources log (default OUT/SOURCES.tsv)"); g.add_argument("--page"); g.add_argument("--audio", action="store_true")
v = sub.add_parser("preview"); v.add_argument("titles", nargs="+"); v.add_argument("--out", required=True)
a = ap.parse_args()
if a.cmd == "search": search(a.query, a.n, a.audio)
elif a.cmd == "get": get(a.title, a.name, a.out, a.sources, a.page, a.audio)
else: preview(a.titles, a.out)
