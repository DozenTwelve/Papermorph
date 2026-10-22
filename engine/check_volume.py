#!/usr/bin/env python3
"""Real-audio volume regression for both books and the Skill chapter template.

Serve site on 8767, then: uv run --with playwright engine/check_volume.py
BASE_URL overrides http://127.0.0.1:8767. No files are generated.
"""
import asyncio
import json
import os
from pathlib import Path
from urllib.parse import urlparse

from playwright.async_api import async_playwright

ENGINE = Path(__file__).resolve().parent
SKILL = ENGINE.parent / ".claude/skills/papermorph"
SITE = ENGINE.parent / "site"
BASE = os.environ.get("BASE_URL", "http://127.0.0.1:8767").rstrip("/")


async def template(route):
    name = urlparse(route.request.url).path.split("/__volume_template__/")[1]
    if name == "ch01/":
        await route.fulfill(path=SKILL / "assets/templates/chapter.html")
    elif name.startswith("lib/"):
        await route.fulfill(path=ENGINE / Path(name).name)
    elif name.endswith("timings.js"):
        timing = {"dur": 30, "marks": {"sub": 1, "note": 2, "w1": 3, "w2": 4}, "cues": []}
        await route.fulfill(content_type="text/javascript", body="const TIMINGS = " + json.dumps(
            {key: timing for key in ("intro", "idea", "q1", "wrap", "final1", "finish")}))
    else:
        # Template has no narrated assets; exercise it with an existing, real MP3.
        await route.fulfill(path=SITE / "math-notebook/ch01/audio/en/intro.mp3")


async def check(browser, path):
    page = await browser.new_page(viewport={"width": 1440, "height": 900}, has_touch=True)
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.on("console", lambda message: message.type == "error" and errors.append(message.text))
    page.on("response", lambda response: response.status >= 400 and errors.append(response.url))
    page.on("requestfailed", lambda request: request.failure != "net::ERR_ABORTED" and errors.append(request.url))
    if path.startswith("__volume_template__"):
        await page.route("**/__volume_template__/**", template)
    await page.goto(f"{BASE}/{path}")
    await page.wait_for_function("typeof P !== 'undefined' && P.audio && P.audio.readyState >= 2")
    slider = page.get_by_role("slider", name="Volume", exact=True)
    button = page.get_by_role("button", name="Adjust volume", exact=True)
    assert await slider.count() == 1
    assert await page.evaluate("P.audio.volume") == 1
    assert await page.evaluate("""Math.abs(document.querySelector('.volume').getBoundingClientRect().width -
      document.querySelector('#bHelp').getBoundingClientRect().width) < .1"""), "collapsed volume matches the other circular controls"
    assert await slider.evaluate("e => e.getBoundingClientRect().width === 0")
    await button.hover()
    await page.wait_for_function("document.querySelector('#volume').getBoundingClientRect().width > 80")
    await page.mouse.move(0, 0)
    await page.wait_for_function("document.querySelector('#volume').getBoundingClientRect().width === 0")
    await button.focus()
    await button.press("Tab")
    assert await slider.evaluate("e => e === document.activeElement && e.getBoundingClientRect().width > 80")

    async def volume(value):
        await button.hover()
        await slider.fill(value)

    await volume("0.4")
    assert await page.evaluate("P.audio.volume") == .4
    await page.locator("#cover").click()
    await page.wait_for_function("P.audio.currentTime > .2 && P.t > .1")

    for value in ("0", "0.5", "1"):
        await volume(value)
        assert await page.evaluate("P.audio.volume") == float(value)
        before = await page.evaluate("P.audio.currentTime")
        await page.wait_for_function("P.audio.currentTime > " + str(before + .1))
        await page.locator("#bPlay").click()
        paused = await page.evaluate("P.audio.currentTime")
        await page.wait_for_timeout(200)
        assert await page.evaluate("P.audio.paused && !P.playing")
        assert abs(await page.evaluate("P.audio.currentTime") - paused) < .05
        await volume(f"{1 - float(value):g}")
        assert await page.evaluate("P.audio.volume") == 1 - float(value)
        assert await page.evaluate("P.audio.paused && !P.playing")
        await volume(value)
        await page.locator("#bPlay").click()
        await page.wait_for_function("P.audio.currentTime > " + str(paused + .1))
        await page.locator("#segs button").nth(1).click(position={"x": 1, "y": 4})  # left end: the start of the step
        await page.wait_for_function("P.i === 1 && P.audio.currentTime > .1")
        assert await page.evaluate("P.audio.volume") == float(value)
        # Also cover automatic completion, not just manual seeking.
        await page.evaluate("P.audio.currentTime = P.audio.duration; P.t = P.end")
        await page.wait_for_function("P.i === 2")
        assert await page.evaluate("P.audio.volume") == float(value)
        await page.locator("#bRestart").click()
        await page.wait_for_function("P.i === 0 && P.audio.currentTime > .1")
        assert await page.evaluate("P.audio.volume") == float(value)

    await page.evaluate("window.volumeAudio = P.audio")
    await slider.focus()
    for key, value in (("Home", 0), ("ArrowRight", .05), ("ArrowUp", .1),
                       ("ArrowLeft", .05), ("End", 1), ("ArrowDown", .95)):
        await slider.press(key)
        assert abs(await page.evaluate("P.audio.volume") - value) < .001
        assert await page.evaluate("P.i === 0 && P.playing && P.audio === window.volumeAudio"), "range keys must not navigate, restart or pause"
    await page.evaluate("seek(BEATS.findIndex(b => b.ask), false)")
    # the question focuses its own first box on the next frame; let that happen before the slider takes focus
    await page.evaluate("new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))")
    await slider.focus()
    await slider.press("Home")
    await slider.press("Enter")
    assert await page.evaluate("P.i > 0 && P.audio.volume === 0 && Object.keys(SCORE).length === 0"), "range Enter must not submit a question"
    await page.locator("#bRestart").click()

    for width, height in ((390, 844), (320, 568), (700, 390), (1440, 900)):
        await page.set_viewport_size({"width": width, "height": height})
        await button.hover()
        await page.wait_for_timeout(250)
        assert await page.evaluate("""[...document.querySelectorAll('#bar > *, #volume')].every(e => {
          if (getComputedStyle(e).display === 'none') return true;
          const r = e.getBoundingClientRect();
          return r.x >= 0 && r.y >= 0 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1;
        })"""), f"controls clipped at {width}x{height}"
        if width <= 700:
            bounds = await slider.bounding_box()
            assert bounds["width"] >= 99 and bounds["height"] >= 38
            await slider.click(position={"x": bounds["width"] / 2, "y": bounds["height"] / 2})
            assert .3 < await page.evaluate("P.audio.volume") < .7
    await page.set_viewport_size({"width": 390, "height": 844})
    await page.mouse.move(0, 0)
    await slider.evaluate("e => e.blur()")
    await button.tap()
    assert await slider.evaluate("e => e === document.activeElement && e.getBoundingClientRect().width > 80"), "touch opens the slider"
    await slider.press("Escape")
    await page.mouse.move(0, 0)
    await page.wait_for_function("document.querySelector('#volume').getBoundingClientRect().width === 0")
    assert not errors, errors
    print(f"PASS {path}: hover/focus/touch, real audio, mute/mid/full, pause/resume, steps/restart, keyboard, narrow layout")
    await page.close()


async def main():
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(args=["--autoplay-policy=no-user-gesture-required"])
        for path in ("elementary-algebra/ch01/", "math-notebook/ch01/", "__volume_template__/ch01/"):
            await check(browser, path)
        await browser.close()


if __name__ == "__main__":
    asyncio.run(main())
