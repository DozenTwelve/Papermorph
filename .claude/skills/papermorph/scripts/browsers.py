"""Which Chromium the scripts launch: Playwright's own, or the one $CHROME names.

    from browsers import answers, exe, firefox
    b = await p.chromium.launch(**exe())       # or sync_api
    b = await p.firefox.launch(**firefox())    # sound plays without a click
    answers(f"{url}{chapter}/")                # before opening it: a wrong server or path stops with a plain message
    missing(pg, errs.append)                   # each file the page asks for and the server lacks, by its URL
    await pg.evaluate(IMAGES_READY)            # before a screenshot: every picture on the stage loaded and decoded

Set CHROME to an installed Chrome, Chromium, Brave or Edge where Playwright's own build does not run (some Linux
distributions), e.g. CHROME=/snap/bin/brave. Such a browser also gets the flags a headless page needs there: no
sandbox (containers), a shared-memory fallback, and sound without a click (the books play audio). Unset, nothing
changes, so a review on one machine matches another's.
"""
import os, sys, urllib.error, urllib.request

ARGS = ["--no-sandbox", "--disable-dev-shm-usage", "--autoplay-policy=no-user-gesture-required"]


def exe():
    """kwargs for p.chromium.launch(...): $CHROME with its flags, or {} for Playwright's bundled browser."""
    path = os.environ.get("CHROME")
    return {"executable_path": path, "args": ARGS} if path else {}


def firefox():
    """kwargs for p.firefox.launch(...): sound plays without a click, as the books need."""
    return {"firefox_user_prefs": {"media.autoplay.default": 0}}


# Chromium's console line for a missing file names no file; missing() names it, so this line is dropped
LOAD_FAILED = "Failed to load resource"
# Waits (up to 5 s) until every picture on the stage is loaded and decoded: a set's <image> on a busy machine would
# otherwise be shot before it is drawn. An SVG <image> has no decode() everywhere, so its file is decoded by an Image
IMAGES_READY = r"""() => Promise.race([new Promise(r => setTimeout(r, 5000)), Promise.all(
  [...document.querySelectorAll('#stage image, #stage img')].map(e => {
    const src = e.currentSrc || e.getAttribute('href') || e.getAttribute('xlink:href');
    if (!src) return;
    const im = new Image(); im.src = new URL(src, document.baseURI).href;
    return im.decode().catch(() => {});
  }))])"""


# A page with no BEATS is not a beat chapter: an explorable map (the explore kit) runs on its own clock, with nothing to seek
NO_BEATS = "typeof BEATS === 'undefined'"
NOT_BEATS = ("{url}: no BEATS, so not a beat chapter{explore}; check.py, shot.py and perf.py seek beats and cannot run on it. "
             "An explorable map is checked with explore.py check, shots and perf (references/explore/explore.md)")


async def not_beats(pg, url):
    """The message for a page with no BEATS, or None for a beat chapter."""
    if not await pg.evaluate(NO_BEATS):
        return None
    explore = await pg.evaluate("!!window.MAP")
    return NOT_BEATS.format(url=url, explore=" (it has window.MAP: an explorable map)" if explore else "")


def missing(pg, sink):
    """Report each request the server answers with 400 or more as 'missing file (404): URL' to sink. check.py and
    shot.py both use it, so a missing file reads the same in both and counts as an error in both."""
    pg.on("response", lambda r: r.status >= 400 and not r.url.endswith("/favicon.ico")
          and sink(f"missing file ({r.status}): {r.url}"))


def answers(url):
    """Stop with a plain message unless url answers 200: another tree's server on the port, or a wrong book path, would
    otherwise surface later as an unrelated page error (ReferenceError: SW is not defined)."""
    try:
        urllib.request.urlopen(url, timeout=10).close()
    except urllib.error.HTTPError as e:
        sys.exit(f"{url} answers {e.code}: is the server on that port serving this book's site? (serve.py PORT site)")
    except OSError as e:
        sys.exit(f"{url} does not answer ({getattr(e, 'reason', e)}): start the preview with serve.py PORT site")
