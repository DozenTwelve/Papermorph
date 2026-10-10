#!/usr/bin/env python3
"""LaTeX regression for the Skill engine: TX() formulas drawn by the vendored MathJax.

    uv run --with playwright .claude/skills/papermorph/scripts/check_latex.py

No server is needed: the check answers every request itself with the Skill's engine, chapter template,
vendored MathJax, a real MP3 from an existing book and the test chapter below. The template chapter,
which has no TX, is compared with the engine at BASE_REF (default main) so that its output stays
identical; set BASE_REF to another commit, or to an empty string to skip that comparison.
No files are generated.
"""
import asyncio
import json
import os
import subprocess
from pathlib import Path
from urllib.parse import urlparse

from playwright.async_api import async_playwright

SKILL = Path(__file__).resolve().parents[1]
ROOT = SKILL.parents[2]
SITE = ROOT / "site"
ORIGIN = "http://papermorph.test"
BASE_REF = os.environ.get("BASE_REF", "main")
ENGINE = SKILL / "assets/engine/engine.js"
MATHJAX = SKILL / "assets/vendor/mathjax/tex-svg-full.js"
TEMPLATE = SKILL / "assets/templates/chapter.html"


def timings(beats, marks):
    timing = {"dur": 6, "marks": marks, "cues": []}
    return "const TIMINGS = " + json.dumps({beat: timing for beat in beats})


TEMPLATE_TIMINGS = timings(("intro", "idea", "q1", "wrap", "final1", "finish"), {"sub": 1, "note": 2, "w1": 3, "w2": 4})
TEST_TIMINGS = timings(("stage", "rows", "q1", "q2", "finish"), {"b": 1, "c": 1.5})

HEAD = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>LaTeX check</title>
<link rel="stylesheet" href="../lib/engine.css">
<link rel="expect" href="#bar" blocking="render">
</head>
<body>
<script src="../lib/engine.js"></script>
"""

# Every place that takes math parts gets a TX formula. The script between MathJax and the chapter counts conversions.
TEST_CHAPTER = HEAD + r"""<script src="../lib/mathjax.js"></script>
<script>
const texCalls = [], convert = MathJax.tex2svg;
MathJax.tex2svg = (tex, options) => { texCalls.push(tex); return convert(tex, options); };
</script>
<script src="audio/en/timings.js"></script>
<script>
'use strict';
const CHAPTER = { number: 1, title: 'LaTeX check', minutes: 1, language: 'en' };
const MATRIX = '\\left(\\begin{array}{c|c} a & b \\\\ \\hline c & d \\end{array}\\right)';
const BEATS = [
  ['stage', 'Formulas on the stage', (m) => {
    const p = panel(0);
    S.x = M(p, [TX('x')], { x: 120, y: 120, size: 48, anchor: 'start' });
    S.anchors = ['start', 'middle', 'end'].map((anchor, i) => M(p, [TX('\\frac{a}{b}+1')], { x: 800, y: 120 + i * 90, size: 40, anchor }));
    S.words = M(p, [TX('\\text{Привет, мир}+x')], { x: 120, y: 420, size: 48, anchor: 'start' });
    S.matrix = M(p, [TX(MATRIX)], { x: 1300, y: 420, size: 40 });
    S.mixed = M(p, ['f(x) = ', TX('\\sqrt{x}'), ' + ', F(1, 2)], { x: 800, y: 560, size: 44 });
    S.physics = M(p, [TX('\\require{physics}\\abs{x}')], { x: 1300, y: 600, size: 40 });
    S.parts = M(p, [TX('a^2 + \\class{b}{b^2} = c^2')], { x: 500, y: 760, size: 56, o: 0 });
    show(S.parts, .2);
    tw(texPart(S.parts, 'b'), { c_color: COL.nat }, m('b'));
    S.fading = M(p, [TX('\\class{gone}{2 +} x')], { x: 1100, y: 760, size: 56 });
    hide(texPart(S.fading, 'gone'), m('c'));
  }],
  ['rows', 'Rows, chips and fractions', (m) => {
    const p = panel(0);
    S.row = tokens(p, [[TX('\\dfrac{1}{2}')], '+', [TX('\\dfrac{1}{2}')]], { x: 800, y: 150, size: 48, anchor: 'middle' });
    S.collapsed = collapse(S.row, 0, 2, [TX('1')], m('c'));
    S.box = [...p.querySelectorAll(':scope > rect')].pop();
    S.eq = eqLine(p, TX('2x + 3'), TX('7'), 330, .2, { sym: TX('\\le') });
    S.chip = chip(p, [TX('\\dfrac{3}{4}')], COL.rat, { x: 300, y: 520 });
    S.chipPlain = chip(p, ['3'], COL.nat, { x: 500, y: 520 });
    S.frac = frac(p, [TX('x^2')], [TX('y_i')], 800, 520, .2, { anchor: 'middle' });
    S.sumWidth = [mathW([TX('\\sum_{i=1}^n x_i')], 40), M(p, [TX('\\sum_{i=1}^n x_i')], { x: 1200, y: 520, size: 40 })._w];
  }],
  ['q1', 'Typed answer', () => { panel(0); }, { ask: done => quiz(TOPR, [{
    id: 'c-norm', prompt: ['Find ', $tex('\\|x\\|_2'), ' for ', $tex('x = \\begin{pmatrix}3\\\\4\\end{pmatrix}'), '.'],
    build: blanks([{ parts: [TX('\\|x\\|_2'), ' = ', { box: '5' }], why: ['Because ', $tex('\\sqrt{9+16}=5'), '.'] }]),
  }], done) }],
  ['q2', 'Classify', () => { panel(0); }, { ask: done => quiz(SCREEN, [{
    id: 'p-sums', prompt: ['Is each statement true?'],
    build: grid([{ parts: [TX('\\int_0^1 x\\,dx = \\tfrac{1}{2}')], ans: ['t'], why: 'The area of a triangle.' },
                 { parts: [TX('\\sum_{i=1}^{3} i = 5')], ans: ['f'], why: 'It is 6.' }], TF),
  }], done, 'Chapter practice   1 of 1') }],
  ['finish', 'Finished', () => { panel(0); }, { ask: finishCard }],
].map(([id, title, run, extra]) => ({ id, title, run, ...extra }));
boot();
</script>
</body>
</html>
"""

TYPO_PAGE = HEAD + r"""<script src="../lib/mathjax.js"></script>
<script>M(scene, [TX('\\fracc{a}{b}')]);</script>
</body></html>
"""

NO_MATHJAX_PAGE = HEAD + r"""<script>M(scene, [TX('x')]);</script>
</body></html>
"""


def at_base_ref(path):
    """The file as committed at BASE_REF, or None when the comparison is skipped."""
    if not BASE_REF:
        return None
    relative = path.relative_to(ROOT).as_posix()
    result = subprocess.run(["git", "show", f"{BASE_REF}:{relative}"], cwd=ROOT, capture_output=True)
    return result.stdout.decode("utf-8") if result.returncode == 0 else None


BASE_ENGINE = at_base_ref(ENGINE)
PAGES = {"base": TEMPLATE.read_text(encoding="utf-8"), "plain": TEMPLATE.read_text(encoding="utf-8"),
         "tex": TEST_CHAPTER, "typo": TYPO_PAGE, "nomathjax": NO_MATHJAX_PAGE}


async def answer(route):
    variant, _, rest = urlparse(route.request.url).path.split("/__latex__/")[1].partition("/")
    if rest == "ch01/":
        await route.fulfill(content_type="text/html; charset=utf-8", body=PAGES[variant].encode("utf-8"))
    elif rest == "lib/engine.js":
        if variant == "base":
            await route.fulfill(content_type="text/javascript", body=BASE_ENGINE)
        else:
            await route.fulfill(path=ENGINE)
    elif rest == "lib/engine.css":
        await route.fulfill(path=SKILL / "assets/engine/engine.css")
    elif rest == "lib/mathjax.js":
        await route.fulfill(path=MATHJAX)
    elif rest.endswith("timings.js"):
        await route.fulfill(content_type="text/javascript", body=TEST_TIMINGS if variant == "tex" else TEMPLATE_TIMINGS)
    elif rest.startswith("ch01/audio/en/") and rest.endswith(".mp3"):
        # The pages have no narrated assets; exercise them with an existing, real MP3.
        await route.fulfill(path=SITE / "math-notebook/ch01/audio/en/intro.mp3")
    else:
        await route.fulfill(status=404, body="")


async def open_page(browser, variant, errors, requests):
    page = await browser.new_page(viewport={"width": 1440, "height": 900})
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.on("console", lambda message: message.type == "error" and errors.append(message.text))
    page.on("response", lambda response: response.status >= 400 and errors.append(f"HTTP {response.status} {response.url}"))
    page.on("request", lambda request: requests.append(request.url))
    await page.route("**/*", answer)
    await page.goto(f"{ORIGIN}/__latex__/{variant}/ch01/")
    return page


async def snapshots(page):
    """The player's first frame, then the scene and cards of every beat, played to its end."""
    shots = [await page.evaluate("document.getElementById('frame').outerHTML")]
    for i in range(await page.evaluate("BEATS.length")):
        shots.append(await page.evaluate("""i => { seek(i, false); evalTo(Infinity);
          return document.getElementById('scene').innerHTML + document.getElementById('ui').innerHTML; }""", i))
    return shots


async def check_template_unchanged(browser):
    if not BASE_ENGINE:
        print(f"SKIP template identity: engine not found at BASE_REF={BASE_REF!r}")
        return
    errors, requests, shots = [], [], {}
    for variant in ("base", "plain"):
        page = await open_page(browser, variant, errors, requests)
        await page.wait_for_function("typeof P !== 'undefined' && P.audio")
        shots[variant] = await snapshots(page)
        await page.close()
    assert not errors, errors
    for i, (old, new) in enumerate(zip(shots["base"], shots["plain"])):
        assert old.replace("/__latex__/base/", "/__latex__/plain/") == new, f"template output changed ({'first frame' if i == 0 else f'beat {i - 1}'})"
    print(f"PASS template without TX: identical to {BASE_REF} on the first frame and {len(shots['plain']) - 1} beats")


STAGE = r"""() => {
  seek(0, false); evalTo(Infinity);
  const R = {}, k = 48 / 1000, [, top, width, height] = texGraphic('x').viewBox;
  const box = S.x.getBBox();
  R.baseline = [box.y, box.y + box.height, top * k, (top + height) * k];
  R.width = [S.x._w, width * k];
  R.anchors = S.anchors.map(e => { const b = e.getBBox(); return [b.x, b.x + b.width, e._w]; });
  const texts = S.words.querySelectorAll('text');
  const group = texts[0].closest('g[data-mml-node="mtext"]'), next = group.nextElementSibling;
  const shift = el => +(/translate\(([-\d.]+)/.exec(el.getAttribute('transform') || '') || [0, 0])[1];
  R.words = [texts.length, getComputedStyle(texts[0]).fontFamily, shift(next) - shift(group) - texts[0].getBBox().width];
  const line = S.matrix.querySelector('line[data-line]');
  R.matrixLine = line && getComputedStyle(line).strokeWidth;
  R.styles = document.querySelectorAll('#MJX-SVG-styles').length;
  R.partColor = texPart(S.parts, 'b').getAttribute('color');
  R.fadedOpacity = texPart(S.fading, 'gone').getAttribute('opacity');
  try { texPart(S.parts, 'nope'); R.unknownPart = 'no error'; } catch (error) { R.unknownPart = error.message; }
  R.mixed = S.mixed._w;
  return R;
}"""

ROWS = r"""() => {
  seek(1, false);   // t = 0: the tokens are untouched and the collapse box is placed
  const rect = el => { const b = el.getBoundingClientRect(); return [b.left, b.top, b.right, b.bottom]; };
  const plainM = S.chipPlain.children[1];
  return {
    tokens: S.row.map(rect), box: rect(S.box),
    chip: [rect(S.chip._rect), rect(S.chip.children[1])],
    chipPlain: [S.chipPlain._rect.getAttribute('height'), String(34 * 1.45), plainM.getAttribute('transform'), `translate(0,${34 * .3}) rotate(0) scale(1)`],
    eq: S.eq.querySelectorAll('[data-mml-node="math"]').length,
    frac: S.frac.g.querySelectorAll('[data-mml-node="math"]').length,
    sumWidth: S.sumWidth,
  };
}"""

# Inline math in the cards: the drawing stays inside its viewBox; in running text its baseline is the text's.
INLINE = r"""() => [...document.querySelectorAll('#ui svg.m')].map(svg => {
  const [, y, , h] = svg.getAttribute('viewBox').split(' ').map(Number), b = svg.firstElementChild.getBBox();
  const r = svg.getBoundingClientRect(), scale = r.height / h;
  let gap = null;
  if (svg.closest('.prompt')) {
    const probe = document.createElement('span');
    probe.style.cssText = 'display:inline-block;width:0;height:0';
    svg.after(probe);
    gap = r.top - y * scale - probe.getBoundingClientRect().bottom;
    probe.remove();
  }
  return { inside: b.y >= y - .5 && b.y + b.height <= y + h + .5, gap, tex: !!svg.querySelector('[data-mml-node="math"]') };
})"""


def close(a, b, tolerance):
    return abs(a - b) <= tolerance


async def check_tex_chapter(browser):
    errors, requests = [], []
    page = await open_page(browser, "tex", errors, requests)
    await page.wait_for_function("typeof P !== 'undefined' && P.audio")

    stage = await page.evaluate(STAGE)
    top, bottom, want_top, want_bottom = stage["baseline"]
    assert close(top, want_top, .5) and close(bottom, want_bottom, .5), f"TX baseline: {stage['baseline']}"
    assert close(*stage["width"], .01), f"TX width: {stage['width']}"
    (s0, s1, w), (m0, m1, _), (e0, e1, _) = stage["anchors"]
    assert s0 >= -.5 and s1 <= w + 2, f"anchor start: {stage['anchors'][0]}"
    assert close(m0, s0 - w / 2, .5) and close(e0, s0 - w, .5), f"anchors: {stage['anchors']}"
    count, font, gap = stage["words"]
    assert count == 1 and "STIX Two Text" in font, f"\\text{{}} drawn as {count} text nodes in {font}"
    assert 210 <= gap <= 235, f"gap after \\text{{}}: {gap} (MathJax units, medium space 222)"
    assert stage["matrixLine"] == "70px", f"array rule width {stage['matrixLine']}"
    assert stage["styles"] == 1, f"{stage['styles']} MathJax stylesheets"
    assert stage["partColor"] == "#f4a48c" and stage["fadedOpacity"] == "0", f"texPart tweens: {stage['partColor']}, {stage['fadedOpacity']}"
    assert "nope" in stage["unknownPart"], stage["unknownPart"]
    assert stage["mixed"] > 0
    print("PASS stage: baseline, width, anchors, \\text{} in the book font, array rules, \\class parts, mixed parts, \\require")

    rows = await page.evaluate(ROWS)
    box = rows["box"]
    assert all(box[1] <= t[1] and box[3] >= t[3] for t in rows["tokens"]), f"collapse box {box} vs tokens {rows['tokens']}"
    pill, formula = rows["chip"]
    assert pill[1] <= formula[1] and pill[3] >= formula[3], f"chip {pill} vs formula {formula}"
    height, want_height, transform, want_transform = rows["chipPlain"]
    assert height == want_height and transform == want_transform, f"chip without TX changed: {rows['chipPlain']}"
    assert rows["eq"] == 3 and rows["frac"] == 2, f"eqLine {rows['eq']}, frac {rows['frac']}"
    assert close(*rows["sumWidth"], .01), f"mathW {rows['sumWidth']}"
    print("PASS rows: tokens and collapse, eqLine with a TeX sign, chips, frac, mathW")

    await page.evaluate("seek(2, false)")
    inline = await page.evaluate(INLINE)
    assert inline and all(i["inside"] for i in inline), f"inline math clipped: {inline}"
    assert all(i["tex"] for i in inline) and all(i["gap"] is None or abs(i["gap"]) <= 1.5 for i in inline), f"inline baselines: {inline}"
    await page.locator(".box").fill("5")
    await page.locator(".box").press("Enter")
    assert await page.locator(".fb.ok").count() == 1, "blanks with a TeX row did not accept 5"
    await page.evaluate("seek(3, false)")
    inline = await page.evaluate(INLINE)
    assert len(inline) == 2 and all(i["inside"] for i in inline), f"grid rows: {inline}"
    print("PASS cards: $tex prompts on the text baseline, blanks and grid rows, nothing clipped")

    for i in range(await page.evaluate("BEATS.length")):
        first, second = [await page.evaluate("i => { seek(i, false); evalTo(Infinity); return document.getElementById('scene').innerHTML; }", i) for _ in range(2)]
        assert first == second, f"seek({i}) is not repeatable"
    calls = await page.evaluate("[texCalls.length, new Set(texCalls).size]")
    assert calls[0] == calls[1], f"tex2svg ran {calls[0]} times for {calls[1]} formulas"
    assert await page.evaluate("document.querySelectorAll('#MJX-SVG-styles').length") == 1
    print(f"PASS replay: every beat repeatable, {calls[1]} formulas converted once each")

    assert not errors, errors
    allowed = {"ch01/", "lib/engine.js", "lib/engine.css", "lib/mathjax.js", "ch01/audio/en/timings.js"}
    stray = [u for u in requests if not u.startswith(f"{ORIGIN}/__latex__/tex/")
             or (u.split("/__latex__/tex/")[1] not in allowed and not u.endswith(".mp3"))]
    assert not stray, f"unexpected requests: {stray}"
    print("PASS network: only the page's own files")
    await page.close()


async def check_errors(browser):
    for variant, expected in (("typo", "\\fracc"), ("nomathjax", "needs lib/mathjax.js")):
        errors, requests = [], []
        page = await open_page(browser, variant, errors, requests)
        await page.wait_for_timeout(300)
        assert any(expected in e for e in errors), f"{variant}: expected an error with {expected!r}, got {errors}"
        await page.close()
    print("PASS errors: a TeX typo and a missing lib/mathjax.js stop the page with the formula named")


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        await check_template_unchanged(browser)
        await check_tex_chapter(browser)
        await check_errors(browser)
        await browser.close()


if __name__ == "__main__":
    asyncio.run(main())
