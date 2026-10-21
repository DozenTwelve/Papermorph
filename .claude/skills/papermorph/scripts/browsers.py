"""Which Chromium the scripts launch: Playwright's own, or the one $CHROME names.

    from browsers import exe
    b = await p.chromium.launch(**exe())       # or sync_api

Set CHROME to an installed Chrome, Chromium, Brave or Edge where Playwright's own build does not run (some Linux
distributions), e.g. CHROME=/snap/bin/brave. Such a browser also gets the flags a headless page needs there: no
sandbox (containers), a shared-memory fallback, and sound without a click (the books play audio). Unset, nothing
changes, so a review on one machine matches another's.
"""
import os

ARGS = ["--no-sandbox", "--disable-dev-shm-usage", "--autoplay-policy=no-user-gesture-required"]


def exe():
    """kwargs for p.chromium.launch(...): $CHROME with its flags, or {} for Playwright's bundled browser."""
    path = os.environ.get("CHROME")
    return {"executable_path": path, "args": ARGS} if path else {}
