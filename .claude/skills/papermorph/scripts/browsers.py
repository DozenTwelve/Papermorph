"""Which Chromium the scripts launch: Playwright's own, or the one $CHROME names.

    from browsers import exe
    b = await p.chromium.launch(**exe())       # or sync_api
    answers(f"{url}{chapter}/")                # before opening it: a wrong server or path stops with a plain message

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


def answers(url):
    """Stop with a plain message unless url answers 200: another tree's server on the port, or a wrong book path, would
    otherwise surface later as an unrelated page error (ReferenceError: SW is not defined)."""
    try:
        urllib.request.urlopen(url, timeout=10).close()
    except urllib.error.HTTPError as e:
        sys.exit(f"{url} answers {e.code}: is the server on that port serving this book's site? (serve.py PORT site)")
    except OSError as e:
        sys.exit(f"{url} does not answer ({getattr(e, 'reason', e)}): start the preview with serve.py PORT site")
