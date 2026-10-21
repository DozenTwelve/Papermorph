"""Which browser Playwright launches on this machine.

    from browsers import exe
    b = await p.chromium.launch(**exe())       # or sync_api

Order: $CHROME (a path), then the user's default browser when it is
Chromium-family (Playwright cannot drive system Firefox directly), then any
installed Chromium-family browser, then Playwright's bundled browser ({} —
the scripts stay portable). Desktop-file ids are cleaned to browser stems
('brave_brave.desktop', 'google-chrome-stable.desktop'). The args keep a
headless page honest: no sandbox in a container, autoplay without a gesture
(the books play sound).
"""
import os, shutil, subprocess

ARGS = ["--no-sandbox", "--disable-dev-shm-usage", "--autoplay-policy=no-user-gesture-required"]

# stem -> known install paths; PATH is checked after these
PATHS = {
    "brave": ["/opt/brave.com/brave/brave", "/usr/bin/brave-browser"],
    "google-chrome": ["/usr/bin/google-chrome", "/usr/local/bin/google-chrome"],
    "chromium": ["/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/local/bin/chromium"],
    "microsoft-edge": ["/usr/bin/microsoft-edge"],
    "vivaldi": ["/usr/bin/vivaldi"],
    "opera": ["/usr/bin/opera"],
}
ALIASES = {  # extra PATH names per stem
    "brave": ["brave-browser"],
    "chromium": ["chromium-browser", "chrome"],
    "google-chrome": ["google-chrome-stable"],
    "microsoft-edge": ["microsoft-edge-stable"],
    "vivaldi": ["vivaldi-stable"],
}


def _stem(desktop_id):
    s = (desktop_id or "").strip().lower()
    if s.endswith(".desktop"):
        s = s[:-8]
    s = s.split("_")[0]  # snap ids like brave_brave
    for suffix in ("-stable", "-beta", "-dev"):
        if s.endswith(suffix):
            s = s[: -len(suffix)]
    return s


def _find(stem):
    for p in PATHS.get(stem, ()):
        if os.path.exists(p):
            return p
    tries = [shutil.which(stem)] + [shutil.which(a) for a in ALIASES.get(stem, [])]
    return next((w for w in tries if w), None)


def _xdg_default():
    try:
        r = subprocess.run(["xdg-settings", "get", "default-web-browser"],
                           capture_output=True, text=True, timeout=5)
        d = r.stdout.strip() if r.returncode == 0 else ""
    except Exception:
        return None
    if not d:
        return None
    stem = _stem(d)
    return _find(stem) if stem in PATHS else None


def _any_installed():
    for stem in PATHS:
        p = _find(stem)
        if p:
            return p
    return None


def exe():
    """kwargs for p.chromium.launch(...): $CHROME, default, installed, bundled."""
    path = os.environ.get("CHROME") or _xdg_default() or _any_installed()
    return {"executable_path": path, "args": ARGS} if path else {}
