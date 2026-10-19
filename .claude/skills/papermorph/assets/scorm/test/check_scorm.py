#!/usr/bin/env python3
"""End-to-end check of a SCORM package in the mock LMS, in a headless browser.

    uv run --with playwright SKILL/assets/scorm/test/check_scorm.py dist/<book>-scorm2004.zip
    uv run --with playwright SKILL/assets/scorm/test/check_scorm.py dist/<book>-scorm12.zip

No server is needed: the check answers every request itself from the zip and mock-lms.html, and, as many LMS file
servers do, returns 404 for folder URLs. It checks that the session opens, that a chapter card opens its lesson
(folder links rewritten), that reaching the finish card reports the chapter to the LMS, and that a reload with
the book's localStorage cleared resumes with the chapter's checkmark. No files are generated.
"""
import asyncio
import json
import sys
import zipfile
from pathlib import Path
from urllib.parse import urlparse, unquote

from playwright.async_api import async_playwright

HERE = Path(__file__).resolve().parent
ORIGIN = "http://lms.papermorph.test"


async def main(zpath):
    z = zipfile.ZipFile(zpath)
    names = set(z.namelist())
    version = "1.2" if "adlcp_rootv1p2" in z.read("imsmanifest.xml").decode() else "2004"
    cfg = json.loads(z.read("launch.html").decode().split("PAPERMORPH_SCORM_CONFIG = ", 1)[1].split(";\n", 1)[0])
    first = cfg["chapters"][0]["n"]
    errors = []

    async def answer(route):
        path = unquote(urlparse(route.request.url).path)
        if path == "/mock-lms.html":
            return await route.fulfill(path=HERE / "mock-lms.html")
        name = path.removeprefix("/pkg/")
        if path.startswith("/pkg/") and name in names:
            kind = {".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".mp3": "audio/mpeg",
                    ".json": "application/json", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml"}
            return await route.fulfill(body=z.read(name), content_type=kind.get(Path(name).suffix, "application/octet-stream"))
        await route.fulfill(status=404, body="")   # folder URLs included, as on many LMS file servers

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(args=["--autoplay-policy=no-user-gesture-required"])
        page = await browser.new_page(viewport={"width": 1600, "height": 960})
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.on("console", lambda m: m.type == "error" and not m.text.startswith("Failed to load resource") and errors.append(m.text))
        page.on("response", lambda r: r.status >= 400 and not r.url.endswith("/favicon.ico") and errors.append(f"{r.status} {r.url}"))
        await page.route(f"{ORIGIN}/**", answer)
        await page.goto(f"{ORIGIN}/mock-lms.html?pkg=pkg&v={version}&reset")

        book = lambda: page.frame_locator("#sco").frame_locator("#book")
        await book().locator(".ch").first.wait_for(state="attached")
        log = await page.evaluate("LOG.join('\\n')")
        assert ("Initialize(\"\") -> true" in log) or ("LMSInitialize(\"\") -> true" in log), "the session did not open"
        print(f"PASS SCORM {version}: session opened, contents shown")

        await book().locator("#cover .btn.go").click()   # "Open the book", as a learner does
        await book().locator(f"#ch{first:02d}").click()
        lesson = page.frame(url=lambda u: f"/ch{first:02d}/index.html" in u)
        for _ in range(100):
            lesson = page.frame(url=lambda u: f"/ch{first:02d}/index.html" in u)
            if lesson and await lesson.evaluate("typeof P === 'object' && typeof BEATS === 'object'"):
                break
            await page.wait_for_timeout(100)
        assert lesson, "the chapter card did not open its lesson (folder link not rewritten?)"
        print(f"PASS chapter {first} opened through a folder link")

        await lesson.click("#cover")
        await lesson.evaluate("seek(BEATS.length - 1, false)")
        await page.wait_for_timeout(800)
        cmi = await page.evaluate("CMI")
        state = json.loads(cmi.get("cmi.suspend_data", "{}") or "{}")
        assert first in state.get("done", []), f"finish not reported: suspend_data {cmi.get('cmi.suspend_data')!r}"
        status = "cmi.objectives.0.completion_status" if version == "2004" else "cmi.objectives.0.status"
        assert cmi.get(status) == "completed", f"objective 0: {cmi.get(status)!r}"
        print(f"PASS finish card reported: suspend_data {cmi['cmi.suspend_data']}, objective 0 completed")

        # Resume must come from the LMS alone, as on another device: clear the book's localStorage first.
        await page.evaluate("document.getElementById('sco').contentWindow.document.getElementById('book').contentWindow.localStorage.clear()")
        await page.goto(f"{ORIGIN}/mock-lms.html?pkg=pkg&v={version}")
        await book().locator(f"#ch{first:02d}.done").wait_for(state="attached", timeout=10000)
        print("PASS resume: the chapter's checkmark is back after a reload")
        await browser.close()
    assert not errors, errors
    print("PASS no page errors")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    asyncio.run(main(sys.argv[1]))
