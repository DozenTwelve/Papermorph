"""Which browser Playwright launches on this machine.

    from browsers import exe
    b = await p.chromium.launch(**exe())       # or sync_api

Order: $CHROME (a configured path), then the user's default browser when it is
Chromium-family (resolved from its .desktop Exec — Playwright cannot drive
system Firefox directly), then any installed Chromium-family browser found on
PATH, then Playwright's bundled browser ({} — the scripts stay portable).
Desktop-file ids are cleaned and aliased to browser stems
('brave_brave.desktop', 'brave-browser.desktop', 'google-chrome-stable.desktop').
The args keep a headless page honest: no sandbox in a container, autoplay
without a gesture (the books play sound).
"""
import os, shutil, subprocess

ARGS = ["--no-sandbox", "--disable-dev-shm-usage", "--autoplay-policy=no-user-gesture-required"]

# canonical stem -> login-shell command names, in preference order; nothing is
# looked up outside PATH except through the user's own default-browser setting
STEMS = {
    "brave": ["brave", "brave-browser"],
    "google-chrome": ["google-chrome", "google-chrome-stable"],
    "microsoft-edge": ["microsoft-edge", "microsoft-edge-stable"],
    "chromium": ["chromium", "chromium-browser", "chrome"],
    "vivaldi": ["vivaldi", "vivaldi-stable"],
    "opera": ["opera"],
}
# desktop-file stem -> canonical stem ('chromium-browser' releases, 'chrome' third parties)
CANON = {name: stem for stem, names in STEMS.items() for name in names if name != stem}


def _stem(desktop_id):
    s = (desktop_id or "").strip().lower()
    if s.endswith(".desktop"):
        s = s[:-8]
    s = s.split("_")[0]  # snap ids like brave_brave
    for suffix in ("-stable", "-beta", "-dev"):
        if s.endswith(suffix):
            s = s[: -len(suffix)]
    return CANON.get(s, s)


def _which(stem):
    "shutil.which for the stem itself, then its alias names."
    names = [stem] + STEMS.get(stem, [])[1:]
    return next((w for w in (shutil.which(n) for n in names) if w), None)


def _desktop_exec(desktop_id):
    "The program command from the user's .desktop file, or '' (paths from it are the user's own configuration)."
    try:
        dirs = [os.path.expanduser("~/.local/share/applications")] + \
               os.environ.get("XDG_DATA_DIRS", "/usr/local/share:/usr/share").split(":")
        for d in dirs:
            f = os.path.join(d.strip(), "applications", desktop_id)
            if os.path.isfile(f):
                with open(f, encoding="utf-8", errors="replace") as fh:
                    for line in fh:
                        if line.startswith("Exec="):
                            words = line[5:].strip().split()
                            words = [w for w in words if not w.startswith("%")]
                            return words[0].strip('"') if words else ""
    except Exception:
        pass
    return ""


def _xdg_default():
    try:
        r = subprocess.run(["xdg-settings", "get", "default-web-browser"],
                           capture_output=True, text=True, timeout=5)
        d = r.stdout.strip() if r.returncode == 0 else ""
    except Exception:
        return None
    if not d or _stem(d) not in STEMS:
        return None
    # the desktop id is the user's configuration: its Exec may carry an absolute path
    e = _desktop_exec(d)
    if e and (os.path.isfile(e) and os.access(e, os.X_OK) or shutil.which(os.path.basename(e))):
        return e
    return _which(_stem(d))


def _any_installed():
    for stem in STEMS:
        p = _which(stem)
        if p:
            return p
    return None


def exe():
    """kwargs for p.chromium.launch(...): $CHROME, default, installed, bundled."""
    path = os.environ.get("CHROME") or _xdg_default() or _any_installed()
    return {"executable_path": path, "args": ARGS} if path else {}
