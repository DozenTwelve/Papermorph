#!/usr/bin/env python3
"""Find, verify and publish a book's references as live links (Crossref DOIs first).

    python refs.py lookup books/<book>/refs.json [--write]     # find DOIs (Crossref) or ISBNs (Open Library)
    python refs.py verify books/<book>/refs.json [--write]     # check every link resolves to the cited work
    python refs.py build  books/<book>/refs.json site/<book>/refs.js

refs.json is the book's source list, one entry per cited work (fields after "cite" help matching):
[{"key": "scheper-hughes-lock-1987", "cite": "Scheper-Hughes & Lock (1987)",
  "authors": ["Scheper-Hughes, Nancy", "Lock, Margaret M."], "year": 1987,
  "title": "The mindful body", "type": "article"}, ...]
A group author is {"org": "World Health Organization"} in authors (a plain string is split into family and initials).
"type" is article, book, chapter or web. Optional: container, volume, issue, pages, publisher,
editors, edition ("4th ed."), doi, isbn, nolink (why no reliable record exists), url (a trusted academic page, used only when there is no DOI or ISBN), and
match: other on-screen spellings of the citation (e.g. "Robert Crawford (1980)", "Cobb 1958"); the
engine links any on-screen text equal to cite or a match string (case-insensitive).

lookup searches Crossref for each entry without a doi/isbn/url and accepts a candidate only when
the year (±1), first author's surname and title (≥ 0.85 similar) all match; anything else is
printed for a human decision. Books that Crossref lacks are looked up in Open Library for an ISBN
(linked to its WorldCat record). Never type a DOI from memory: add it only from these results or
from the source's own reference list, then verify.

verify resolves each DOI at Crossref (or doi.org for other registrars), compares year, author and
title, and with --write fills missing metadata and stamps "verified". URL entries must resolve
and sit on a trusted host. build refuses unverified entries and writes refs.js:
window.REFS = {key: {cite, ref (APA 7 reference), url, match?}}, read by the engine and contents page.
Set CROSSREF_MAILTO to join Crossref's polite pool (optional).
"""
import argparse
import datetime
import difflib
import json
import os
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

UA = "papermorph-refs/1.0 (https://github.com/DozenTwelve/Papermorph)"
TRUSTED = ("doi.org", "worldcat.org", "openlibrary.org", "pubmed.ncbi.nlm.nih.gov", "ncbi.nlm.nih.gov",
           "jstor.org", "eric.ed.gov", "arxiv.org", "openalex.org", "archive.org", "loc.gov",
           "philpapers.org", "hathitrust.org", "semanticscholar.org")


def get(url, accept="application/json"):
    mail = os.environ.get("CROSSREF_MAILTO")
    if mail and "api.crossref.org" in url:
        url += ("&" if "?" in url else "?") + "mailto=" + urllib.parse.quote(mail)
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": accept})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                body = r.read()
                return r.status, r.geturl(), body
        except urllib.error.HTTPError as e:
            if e.code in (429, 503) and attempt < 2:
                time.sleep(2 + 3 * attempt)
                continue
            return e.code, url, b""
        except (urllib.error.URLError, TimeoutError) as e:
            if attempt < 2:
                time.sleep(2)
                continue
            get.offline = True
            return 0, url, str(e).encode()
    return 0, url, b""


def norm(s):
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9 ]+", " ", s).split()


def surname(a):
    """Family name of 'Family, Given' / 'Given Family' / Crossref author dict."""
    if isinstance(a, dict):
        return a.get("family") or a.get("name") or a.get("org") or ""
    return a.split(",")[0] if "," in a else a.split()[-1]


def same_name(a, b):
    return "".join(norm(a)) == "".join(norm(b))


def title_sim(a, b):
    lead = lambda s: " ".join(norm(re.split(r"[:?]", s or "")[0]))
    if len(lead(a)) >= 8 and lead(a) == lead(b):
        return 1.0    # same main title; one side omits or reorders the subtitle
    a, b = " ".join(norm(a)), " ".join(norm(b))
    if not a or not b:
        return 0
    short, long_ = sorted((a, b), key=len)
    # A citation often gives only the main title; compare it with the start of the full title.
    return max(difflib.SequenceMatcher(None, a, b).ratio(),
               difflib.SequenceMatcher(None, short, long_[:len(short)]).ratio() if len(short) > 20 else 0)


def cr_year(m):
    for k in ("published-print", "issued", "published-online", "published"):
        dp = (m.get(k) or {}).get("date-parts")
        if dp and dp[0] and dp[0][0]:
            return dp[0][0]
    return None


def cr_title(m):
    t = (m.get("title") or [""])[0]
    sub = (m.get("subtitle") or [""])
    return f"{t}: {sub[0]}" if sub and sub[0] and sub[0].lower() not in t.lower() else t


def match(e, m):
    """Problems comparing entry e with Crossref record m; empty means it is the cited work."""
    out = []
    y = cr_year(m)
    if e.get("year") and y and abs(int(e["year"]) - y) > 1:
        out.append(f"year {y} ≠ {e['year']}")
    if e.get("authors"):
        names = [surname(a) for a in (m.get("author") or m.get("editor") or [])]
        if names and not any(same_name(surname(e["authors"][0]), n) for n in names):
            out.append(f"authors {names[:3]} lack {surname(e['authors'][0])}")
    if e.get("title"):
        s = title_sim(e["title"], cr_title(m))
        if s < .85:
            out.append(f"title '{cr_title(m)}' ({s:.2f})")
    kinds = KINDS.get(e.get("type"))
    if kinds and m.get("type") and m["type"] not in kinds:
        out.append(f"a {m['type']}, not a {e['type']}")   # e.g. a same-titled book chapter for a journal article
    return out


# Crossref record types that can stand for each entry type.
KINDS = {"article": {"journal-article", "proceedings-article", "posted-content"},
         "book": {"book", "monograph", "edited-book", "reference-book"},
         "chapter": {"book-chapter", "book-part", "book-section", "reference-entry"}}


def crossref_work(doi):
    st, _, body = get("https://api.crossref.org/works/" + urllib.parse.quote(doi))
    return json.loads(body)["message"] if st == 200 else None


def fill(e, m):
    """Fill missing metadata from a Crossref record."""
    if not e.get("authors") and m.get("author"):
        e["authors"] = [f"{a.get('family', a.get('name', ''))}, {a.get('given', '')}".strip(", ") for a in m["author"]]
    e.setdefault("title", cr_title(m))
    e.setdefault("year", cr_year(m))
    typ = m.get("type", "")
    e.setdefault("type", "book" if typ in ("book", "monograph", "edited-book") else "chapter" if typ == "book-chapter" else "article")
    if m.get("container-title"):
        e.setdefault("container", m["container-title"][0])
    for k, ck in (("volume", "volume"), ("issue", "issue"), ("pages", "page"), ("publisher", "publisher")):
        if m.get(ck):
            e.setdefault(k, m[ck].replace("-", "–") if k == "pages" else m[ck])


def lookup(entries, write):
    changed = 0
    for e in entries:
        if e.get("doi") or e.get("isbn") or e.get("url") or e.get("nolink"):
            continue
        q = " ".join(str(x) for x in [*(surname(a) for a in e.get("authors", [])[:3]), e.get("year", ""), e.get("title", e.get("cite", ""))])
        st, _, body = get("https://api.crossref.org/works?rows=5&query.bibliographic=" + urllib.parse.quote(q))
        items = json.loads(body)["message"]["items"] if st == 200 else []
        good = [m for m in items if not match(e, m)] if e.get("title") and e.get("authors") and e.get("year") else []
        good.sort(key=lambda m: abs((cr_year(m) or 0) - int(e["year"])))   # the cited year's version first
        if good:
            m = good[0]
            print(f"{e['key']}: doi {m['DOI']}  {cr_title(m)} ({cr_year(m)})")
            if write:
                e["doi"] = m["DOI"].lower()
                fill(e, m)
                changed += 1
            continue
        if e.get("type") in ("book", None) and e.get("title"):
            # The English edition from the cited year, else any English edition with an ISBN.
            au = surname(e["authors"][0]) if e.get("authors") else ""
            hit = None
            for q2 in ([f"language:eng publish_year:{e['year']}"] if e.get("year") else []) + ["language:eng"]:
                st, _, body = get("https://openlibrary.org/search.json?limit=3&fields=key,title,author_name,editions,editions.key,editions.title,"
                                  "editions.isbn,editions.publish_date,editions.publishers&"
                                  + urllib.parse.urlencode({"title": re.split(r"[:?]", e["title"])[0], "author": au, "q": q2}))
                for d in (json.loads(body).get("docs", []) if st == 200 else []):
                    ed = (d.get("editions") or {}).get("docs") or [{}]
                    if (ed[0].get("isbn") and title_sim(e["title"], ed[0].get("title", d.get("title", ""))) >= .85
                            and (not au or any(same_name(au, n.split()[-1]) for n in d.get("author_name", [])))):
                        hit = ed[0]
                        break
                if hit:
                    break
            if hit:
                isbn = next((i for i in hit["isbn"] if len(i) == 13), hit["isbn"][0])
                print(f"{e['key']}: isbn {isbn}  {hit['title']} ({', '.join(hit.get('publishers', [])[:1] + hit.get('publish_date', []))})"
                      + ("" if str(e.get("year")) in " ".join(hit.get("publish_date", [])) else "; edition year differs from the citation"))
                if write:
                    e["isbn"] = isbn
                    if hit.get("publishers"):
                        e.setdefault("publisher", hit["publishers"][0])
                    changed += 1
                continue
        print(f"{e['key']}: NO CONFIDENT MATCH for '{q}'. Candidates:")
        for m in items[:3]:
            print(f"    {m['DOI']}  {cr_title(m)} ({cr_year(m)}) {[surname(a) for a in m.get('author', [])][:3]}  ≠ {'; '.join(match(e, m))}")
        time.sleep(.2)
    return changed


def verify(entries, write):
    bad, today = 0, datetime.date.today().isoformat()
    for e in entries:
        problems, how, get.offline = [], "", False
        if e.get("doi"):
            e["doi"] = re.sub(r"^(https?://(dx\.)?doi\.org/|doi:)", "", e["doi"].strip(), flags=re.I).lower()
            m = crossref_work(e["doi"])
            if m:
                problems, how = match(e, m), "crossref"
                if write and not problems:
                    fill(e, m)
            else:
                st, _, body = get("https://doi.org/api/handles/" + urllib.parse.quote(e["doi"]))
                ok = st == 200 and json.loads(body).get("responseCode") == 1
                problems, how = ([] if ok else ["DOI is not registered"]), "doi.org (not in Crossref; check the landing page by hand)"
        elif e.get("isbn"):
            st, _, body = get(f"https://openlibrary.org/isbn/{e['isbn']}.json")
            if st == 200:
                rec = json.loads(body)
                how = "openlibrary isbn"
                if e.get("title") and title_sim(e["title"], rec.get("title", "") + " " + rec.get("subtitle", "")) < .85:
                    problems.append(f"ISBN is '{rec.get('title')}'")
                if write and not problems and rec.get("publishers"):
                    e.setdefault("publisher", rec["publishers"][0])
            else:
                problems.append(f"ISBN not found in Open Library ({st})")
        elif e.get("url"):
            host = urllib.parse.urlparse(e["url"]).hostname or ""
            if not any(host == t or host.endswith("." + t) for t in TRUSTED) and not re.search(r"\.(edu|gov|ac\.[a-z]{2})$", host):
                problems.append(f"untrusted host {host}; prefer a DOI, ISBN or a TRUSTED host")
            st, final, _ = get(e["url"], accept="text/html,*/*")
            if not 200 <= st < 400:
                problems.append(f"URL returned {st}")
            how = "url"
        elif e.get("nolink"):
            how = "no link: " + e["nolink"]     # searched; no reliable online record (thesis, magazine, talk)
        else:
            problems.append("no doi, isbn or url (run lookup), or set nolink to the reason none exists")
        if get.offline:   # no answer is not a wrong answer: keep the entry as it was
            bad += 1
            print(f"SKIP {e['key']}: network unreachable, nothing changed")
        elif problems:
            bad += 1
            e.pop("verified", None)
            print(f"FAIL {e['key']}: {'; '.join(problems)}")
        else:
            e["verified"] = f"{today} {how}"
            print(f"ok   {e['key']}: {link(e)}  [{how}]")
        time.sleep(.2)
    return bad


def link(e):
    if e.get("doi"):
        return "https://doi.org/" + e["doi"]
    if e.get("isbn"):
        return "https://search.worldcat.org/isbn/" + re.sub(r"[^0-9Xx]", "", e["isbn"])
    return e.get("url")    # None for a nolink entry: listed in references, shown as plain text


SUFFIX = re.compile(r",?\s*\b(Jr|Sr|II|III|IV)\.?\s*$", re.I)


def split_name(a):
    """'Family, Given[, Jr.]', 'Given Family' or {"org": name} -> (family, initials, suffix)."""
    if isinstance(a, dict):   # {"org": "World Health Organization"}: a group author, written as it is
        return a.get("org", "").strip(), "", ""
    suf, a = "", a.strip()
    m = SUFFIX.search(a)
    if m:
        s = m.group(1)
        suf, a = (s.capitalize() + "." if s.lower() in ("jr", "sr") else s.upper()), a[:m.start()]
    if "," in a:
        fam, giv = a.split(",", 1)
    else:
        fam, giv = a.rsplit(" ", 1)[-1], (a.rsplit(" ", 1)[0] if " " in a else "")
    # Ying-yi -> Y.-y.; Jean-Paul -> J.-P.
    inits = " ".join("-".join(x[0] + "." for x in p.split("-") if x)
                     for p in re.split(r"[\s.]+", giv.strip()) if p and p[0].isalpha())
    return fam.strip(), inits, suf


def apa_name(a):
    fam, inits, suf = split_name(a)
    return ", ".join(x for x in (fam, inits, suf) if x)


def apa_editor(a):
    fam, inits, suf = split_name(a)
    return " ".join(x for x in (inits, fam) if x) + (f", {suf}" if suf else "")


def apa_authors(names):
    n = [apa_name(a) for a in names]
    if not n:
        return ""
    if len(n) == 1:
        return n[0]
    if len(n) <= 20:
        return ", ".join(n[:-1]) + ", & " + n[-1]
    return ", ".join(n[:19]) + ", … " + n[-1]


def apa(e):
    au = apa_authors(e.get("authors", []))
    au = au and (au if au.endswith(".") else au + ".")   # a group author or a bare name ends with a full stop too
    yr = f"({e.get('year', 'n.d.')})."
    t = e.get("title", "").rstrip(".")
    end = lambda s: s if s.endswith((".", "?", "!")) else s + "."
    typ = e.get("type", "article")
    if typ == "book":
        parts = [au, yr, end(t + (f" ({e['edition']})" if e.get("edition") else "")), end(e["publisher"]) if e.get("publisher") else ""]
    elif typ == "chapter":
        eds = e.get("editors", [])
        names = [apa_editor(x) for x in eds]
        names = "" if not names else names[0] if len(names) == 1 else " & ".join(names) if len(names) == 2 else ", ".join(names[:-1]) + ", & " + names[-1]
        ed = f"In {names} (Ed{'s' if len(eds) > 1 else ''}.), " if eds else "In "
        pg = f" (pp. {e['pages']})" if e.get("pages") else ""
        parts = [au, yr, end(t), end(f"{ed}{e.get('container', '')}{pg}"), end(e["publisher"]) if e.get("publisher") else ""]
    elif typ == "web":
        parts = [au, yr, end(t), end(e["container"]) if e.get("container") else ""]
    else:
        src = e.get("container", "")
        if e.get("volume"):
            src += f", {e['volume']}" + (f"({e['issue']})" if e.get("issue") else "")
        if e.get("pages"):
            src += f", {e['pages']}"
        parts = [au, yr, end(t), end(src) if src else ""]
    return " ".join(p for p in parts if p)


def build(entries, out, allow):
    missing = [e["key"] for e in entries if not e.get("verified")]
    if missing and not allow:
        sys.exit(f"Unverified: {', '.join(missing)}. Run verify --write first (or --allow-unverified for a draft).")
    keys = [e["key"] for e in entries]
    if len(set(keys)) != len(keys):
        sys.exit("Duplicate keys in refs.json")
    refs = {e["key"]: {"cite": e["cite"], "ref": apa(e), "url": link(e), **({"match": e["match"]} if e.get("match") else {})}
            for e in entries}
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text("// Generated by the papermorph skill's scripts/refs.py from the book's refs.json. Edit that file and rebuild.\n"
                   "window.REFS = " + json.dumps(refs, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")
    print(f"{out}: {len(refs)} references")


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("cmd", choices=["lookup", "verify", "build"])
    ap.add_argument("refs", type=Path)
    ap.add_argument("out", type=Path, nargs="?", help="build: refs.js to write")
    ap.add_argument("--write", action="store_true", help="lookup/verify: save results into refs.json")
    ap.add_argument("--allow-unverified", action="store_true", help="build: draft output with unverified entries")
    a = ap.parse_args()
    entries = json.loads(a.refs.read_text(encoding="utf-8"))
    if a.cmd == "build":
        if not a.out:
            sys.exit("build needs the refs.js path")
        return build(entries, a.out, a.allow_unverified)
    n = lookup(entries, a.write) if a.cmd == "lookup" else verify(entries, a.write)
    if a.write:
        a.refs.write_text(json.dumps(entries, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    if a.cmd == "verify" and n:
        sys.exit(f"{n} reference(s) failed verification")


if __name__ == "__main__":
    main()
