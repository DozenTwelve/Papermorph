"""Which browser Playwright launches on this machine.

    from browsers import exe
    b = await p.chromium.launch(**exe())       # or sync_api

Order: $CHROME (a path), then the user's default browser when it is
Chromium-family (Playwright cannot drive system Firefox directly), then any
installed Chromium-family browser, then Playwright's bundled browser ({} —
the scripts stay portable). The args keep a headless page honest: no sandbox
in a container, autoplay without a gesture (the books play sound), audio
behaviour left to the page. Requires Playwright's xdg parts only on Linux.
"""
import os, shutil, subprocess

ARGS = ["--no-sandbox", "--disable-dev-shm-usage", "--autoplay-policy=no-user-gesture-required"]

# desktop-file stem -> known install paths; anything Chromium-family is drivable
KNOWN = {
    "brave": "/opt/brave.com/brave/brave",
    "google-chrome": "/usr/bin/google-chrome",
    "chromium": "/usr/bin/chromium",
    "microsoft-edge": "/usr/bin/microsoft-edge",
    "vivaldi-stable": "/usr/bin/vivaldi",
    "opera": "/usr/bin/opera",
}


def _xdg_default():
    try:
        d = subprocess.run(["xdg-settings", "get", "default-web-browser"],
                           capture_output=True, text=True, timeout=5).stdout.strip().lower()
    except Exception:
        return None
    if not d:
        return None
    for stem, path in KNOWN.items():
        if d.startswith(stem + ".") and os.path.exists(path):
            return path
    return None


def _any_installed():
    for stem, path in KNOWN.items():
        if os.path.exists(path):
            return path
        found = shutil.which(stem.split("-")[0])
        if found:
            return found
    return None


def exe():
    """kwargs for p.chromium.launch(...): $CHROME, default, installed, bundled."""
    path = os.environ.get("CHROME") or _xdg_default() or _any_installed()
    return {"executable_path": path, "args": ARGS} if path else {}
