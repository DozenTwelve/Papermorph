#!/usr/bin/env python3
"""Interface-language regression for the engine and the Skill's cover/contents template.

    uv run --with playwright engine/check_i18n.py

No server is needed: the check answers every request itself with the Skill's chapter and book
templates, this engine and a real MP3 from an existing book. English pages are compared with the
engine and template at BASE_REF (default main) so that English output stays identical; set
BASE_REF to another commit, or to an empty string to skip that comparison. No files are generated.
"""
import asyncio
import json
import os
import subprocess
from pathlib import Path
from urllib.parse import urlparse

from playwright.async_api import async_playwright

ENGINE_DIR = Path(__file__).resolve().parent
ROOT = ENGINE_DIR.parent
SKILL = ROOT / ".claude/skills/papermorph"
SITE = ROOT / "site"
BASE = os.environ.get("BASE_URL", "http://127.0.0.1:8767").rstrip("/")
BASE_REF = os.environ.get("BASE_REF", "main")
TEMPLATES = SKILL / "assets/templates"
TIMING = {"dur": 30, "marks": {"sub": 1, "note": 2, "w1": 3, "w2": 4}, "cues": []}
TIMINGS = "const TIMINGS = " + json.dumps({beat: TIMING for beat in ("intro", "idea", "q1", "wrap", "final1", "finish")})
# Page variants: (html lang, engine and book template from BASE_REF instead of the working tree).
VARIANTS = {"base": ("en", True), "en": ("en", False), "ru": ("ru", False), "zh": ("zh", False), "ja": ("ja", False), "de": ("de", False),
            "ar": ("ar", False)}


def at_base_ref(path):
    """The file as committed at BASE_REF, or None when the comparison is skipped."""
    if not BASE_REF:
        return None
    relative = path.relative_to(ROOT).as_posix()
    result = subprocess.run(["git", "show", f"{BASE_REF}:{relative}"], cwd=ROOT, capture_output=True)
    return result.stdout.decode("utf-8") if result.returncode == 0 else None


ENGINE_FILES = ("engine.js", "engine.css", "volume.js", "volume.css", "book.css", "units.js", "units.css", "contents.js", "contents.css")


def engine_at_base_ref(name):
    """An engine file at BASE_REF; one added since then is taken from the working tree (the base template does not load it)."""
    if not BASE_REF:
        return None
    path = ENGINE_DIR / name
    return at_base_ref(path) or (path.read_text(encoding="utf-8") if path.exists() else "")


BASE_FILES = {"book": at_base_ref(TEMPLATES / "book.html"), **{name: engine_at_base_ref(name) for name in ENGINE_FILES}}


def with_language(html, language):
    return html.replace('<html lang="en">', f'<html lang="{language}">', 1)


async def answer(route):
    variant, _, rest = urlparse(route.request.url).path.split("/__i18n__/")[1].partition("/")
    language, from_base = VARIANTS[variant]
    if rest == "ch01/":
        html = (TEMPLATES / "chapter.html").read_text(encoding="utf-8")
        await route.fulfill(content_type="text/html", body=with_language(html, language))
    elif rest == "":
        html = BASE_FILES["book"] if from_base else (TEMPLATES / "book.html").read_text(encoding="utf-8")
        await route.fulfill(content_type="text/html", body=with_language(html, language))
    elif rest == "unit-art.js":
        await route.fulfill(path=TEMPLATES / "unit-art.js")
    elif rest.startswith("lib/") and rest[4:] in ENGINE_FILES:
        name = rest[4:]
        if from_base:
            kind = "text/javascript" if name.endswith(".js") else "text/css"
            await route.fulfill(content_type=kind, body=BASE_FILES[name])
        else:
            await route.fulfill(path=ENGINE_DIR / name)
    elif rest.endswith("timings.js"):
        await route.fulfill(content_type="text/javascript", body=TIMINGS)
    else:
        # The template has no narrated assets; exercise it with an existing, real MP3.
        await route.fulfill(path=SITE / "math-notebook/ch01/audio/en/intro.mp3")


async def open_page(browser, path, errors):
    page = await browser.new_page(viewport={"width": 1440, "height": 900})
    page.on("pageerror", lambda error: errors.append(f"{path}: {error}"))
    page.on("console", lambda message: message.type == "error" and errors.append(f"{path}: {message.text}"))
    page.on("response", lambda response: response.status >= 400 and errors.append(response.url))
    page.on("requestfailed", lambda request: request.failure != "net::ERR_ABORTED" and errors.append(request.url))
    await page.route("**/__i18n__/**", answer)
    await page.goto(f"{BASE}/__i18n__/{path}")
    return page


async def open_lesson(browser, variant, errors):
    page = await open_page(browser, f"{variant}/ch01/", errors)
    await page.wait_for_function("typeof P !== 'undefined' && P.audio")
    return page


async def press(page, key, code):
    """A keydown as a layout produces it: key is the typed character, code the physical key."""
    await page.evaluate("([key, code]) => document.dispatchEvent(new KeyboardEvent('keydown', { key, code, bubbles: true }))", [key, code])
    await page.wait_for_timeout(60)


async def lesson_snapshot(page):
    """Player markup, then the quick check before and after a wrong answer, then the finish card."""
    shots = [await page.evaluate("document.getElementById('frame').outerHTML")]
    await page.evaluate("seek(2, false)")
    await page.wait_for_timeout(200)
    shots.append(await page.evaluate("document.getElementById('ui').innerHTML"))
    await page.locator(".box").fill("6")
    await page.locator(".box").press("Enter")
    await page.wait_for_timeout(200)   # the band card refits to the feedback on the next frame
    shots.append(await page.evaluate("document.getElementById('ui').innerHTML"))
    await page.evaluate("seek(BEATS.length - 1, false)")
    await page.wait_for_timeout(600)
    shots.append(await page.evaluate("document.getElementById('ui').innerHTML"))
    return shots


async def check_english_unchanged(browser, errors):
    if not BASE_REF:
        print("SKIP English identity: BASE_REF is empty")
        return
    # a base that cannot be read would leave English unguarded while the check passes, so it fails instead
    assert BASE_FILES["book"] is not None, (f"English identity: the book template is not at BASE_REF={BASE_REF!r} "
                                            "(set BASE_REF to a commit that has it, or to an empty string to skip)")
    before = await open_lesson(browser, "base", errors)
    after = await open_lesson(browser, "en", errors)
    names = ("player markup", "quick check", "wrong-answer feedback", "finish card")
    for name, old, new in zip(names, await lesson_snapshot(before), await lesson_snapshot(after)):
        assert old.replace("/__i18n__/base/", "/__i18n__/en/") == new, f"English {name} changed"   # links carry the page's own path
    assert await after.evaluate("rat('0,75') === null && num(2.5) === '2.5' && num(-3) === '−3'"), "English numbers changed"
    # In a left-to-right book a text reads by its first letter alone, and T() sets exactly the string it was given
    assert await after.evaluate("""!isRTL('Newton قانون') && isRTL('قانون Newton')
      && T(document.getElementById('stage'), 'Newton قانون', { o: 0 }).textContent === 'Newton قانون'"""), "English stage text changed"
    await before.close()
    await after.close()

    marks = "e => [e.innerText, getComputedStyle(e, '::before').content, getComputedStyle(e, '::after').content].join('|')"
    texts = []
    for variant in ("base", "en"):
        page = await open_page(browser, f"{variant}/", errors)
        await page.evaluate(f"localStorage.setItem('animebook:progress:/__i18n__/{variant}/', JSON.stringify({{ done: [1], last: 1 }}))")
        await page.reload()
        texts.append([await page.evaluate("document.body.innerText"), await page.locator(".ch").first.evaluate(marks),
                      await page.locator(".home").get_attribute("aria-label")])
        await page.close()
    assert texts[0] == texts[1], f"English cover/contents changed:\n{texts[0]}\n{texts[1]}"
    print(f"PASS English unchanged against {BASE_REF}: player, quick check, feedback, finish card, cover and contents")


async def check_russian_lesson(browser, errors):
    page = await open_lesson(browser, "ru", errors)
    text = lambda selector: page.locator(selector).first.text_content()   # as written, before CSS case and spacing
    assert await text("#coverK") == "Глава 1"
    assert "Начать урок" in await text("#cover .go")
    assert await text("#coverMeta") == "Около 8 минут, со звуком и проверками."
    assert "Пробел — начать" in await text("#cover small")
    assert await page.locator("#help h2").text_content() == "Горячие клавиши"
    assert await page.locator(".paused-mark").text_content() == "Пауза. Нажмите пробел или щёлкните, чтобы продолжить."
    for role, name in (("button", "Настроить громкость"), ("slider", "Громкость"), ("button", "Субтитры (C)"),
                       ("button", "Пуск или пауза (пробел)"), ("link", "Все главы"), ("button", "Перейти к шагу 3: Quick check")):
        assert await page.get_by_role(role, name=name, exact=True).count() == 1, f"no {role} named {name!r}"
    assert await page.get_attribute("#stage", "aria-label") == "Анимация урока: CHAPTER TITLE"

    # Plural forms, fallbacks and numbers.
    assert await page.evaluate("""[1, 3, 8, 21].map(n => translate('aboutMinutes', { n })).join('|')""") == (
        "Около 1 минуты, со звуком и проверками.|Около 3 минут, со звуком и проверками.|"
        "Около 8 минут, со звуком и проверками.|Около 21 минуты, со звуком и проверками.")
    assert await page.evaluate("[1, 3, 5].map(n => translate('stepsLeftOfZero', { n })).join('|')") == (
        "1 шаг влево от 0|3 шага влево от 0|5 шагов влево от 0")
    assert await page.evaluate("translate('noSuchKey') === 'noSuchKey'")
    assert await page.evaluate("num(2.5) === '2,5' && num(-3) === '−3' && num(-0.5) === '−0,5'")
    assert await page.evaluate("rat('0,75').join() === '75,100' && rat('0.75').join() === '75,100' && rat('−2 1/4').join() === '-9,4'")
    assert await page.evaluate("rat('1,000,5') === null && rat('3,') === null")
    assert await page.evaluate("""isShortcut({ key: 'а', code: 'KeyF' }, 'f') && isShortcut({ key: 'F', code: 'KeyF' }, 'f')
      && !isShortcut({ key: 'a', code: 'KeyF' }, 'f') && !isShortcut({ key: '1', code: 'Digit1' }, 'f')"""), "layout-independent letters"

    # Global shortcuts typed on a Russian layout.
    await page.locator("#cover").click()
    await page.wait_for_function("P.started && P.audio.currentTime > .1")
    for key in ("с", "с"):
        before = await page.get_attribute("#bCC", "aria-pressed")
        await press(page, key, "KeyC")
        assert await page.get_attribute("#bCC", "aria-pressed") != before, "С toggles captions"
    await page.evaluate("document.documentElement.requestFullscreen = () => (window.fullScreenRequested = true, Promise.resolve())")
    await press(page, "а", "KeyF")
    assert await page.evaluate("window.fullScreenRequested === true"), "А opens full screen"
    await press(page, "ю", "Period")
    assert await text("#bSpeed") == "1.25×", "Ю (the > key) plays faster"
    await press(page, "б", "Comma")
    assert await text("#bSpeed") == "1×", "Б (the < key) plays slower"
    assert await page.get_attribute("#bSpeed", "aria-label") == "Скорость воспроизведения (< и >) 1×"   # the speed is in the label

    # The template's quick check: labels, hint, wrong answer, Show answer by Ы.
    await page.evaluate("seek(2, false)")
    await page.wait_for_timeout(200)
    assert await text(".card .kicker") == "Проверь себя"
    assert "введите число" in await text(".card .keys") and (await text(".card .keys")).startswith("Клавиши:")
    assert "Проверить" in await text(".card .acts")
    await page.locator(".box").fill("6")
    await page.locator(".box").press("Enter")
    assert (await text(".card .fb")).startswith("Не совсем.")
    await page.locator(".box").press("Escape")
    await press(page, "ы", "KeyS")
    assert (await text(".card .fb")).startswith("Ответ:"), "Ы shows the answer"
    assert "Продолжить" in await text(".card .acts")

    # Decimal comma in an answer box, True/False keys on a Russian layout, row messages.
    await page.evaluate("""clearCards(); quiz(SCREEN, [
      { id: 'x-dec', prompt: ['Три четверти десятичной дробью'], build: blanks([{ parts: ['3/4 = ', { box: '0.75' }], why: 'ок' }]) },
      { id: 'x-tf', prompt: ['Верно ли?'], build: grid([{ parts: ['5 > 3'], ans: ['t'], why: 'ок' }], TF, { multi: false }) },
      { id: 'x-rows', prompt: ['Две строки'], build: grid([{ parts: ['1'], ans: ['t'], why: 'а' }, { parts: ['2'], ans: ['f'], why: 'б' }], TF, { multi: false }) },
    ], () => { window.quizDone = true; })""")
    await page.wait_for_timeout(100)
    assert "вводите числа вида 0,75" in await text(".card .keys")
    assert await text(".card .kicker") == "Проверь себя  ·  вопрос 1 из 3"
    await page.locator(".box").fill("0,75")
    await page.locator(".box").press("Enter")
    assert (await text(".card .fb")).startswith("Верно."), "0,75 is accepted"
    await page.keyboard.press("Enter")
    assert "Верно" in await text(".card .opts") and "Неверно" in await text(".card .opts")
    await press(page, "е", "KeyT")
    assert await page.locator(".card .opt").nth(0).get_attribute("aria-pressed") == "true", "Е picks True"
    await page.keyboard.press("Enter")
    assert (await text(".card .fb")).startswith("Верно.")
    await page.keyboard.press("Enter")
    await press(page, "е", "KeyT")
    await press(page, "е", "KeyT")
    await page.keyboard.press("Enter")
    assert (await text(".card .fb")).startswith("Не совсем. Верно 1 из 2. Исправьте строки с ✗ и проверьте снова.")
    await press(page, "ы", "KeyS")
    assert await text(".card .fb") == "Ответ: правильные варианты отмечены."

    # Finish card with a first try recorded, and R on a Russian layout.
    await page.evaluate("seek(BEATS.length - 1, false)")
    await page.wait_for_timeout(200)
    card = await text(".card")
    for line in ("Глава 1 пройдена", "Проверь себя: 0 из 1 верно с первой попытки.", "Практика по главе: не выполнялось.",
                 "Все главы", "Смотреть снова"):
        assert line in card, f"finish card lacks {line!r}"
    await press(page, "к", "KeyR")
    await page.wait_for_function("P.i === 0")
    print("PASS Russian lesson: cover, help, bar labels, plurals, numbers, keys on a Russian layout, questions, finish card")
    await page.close()


async def check_other_language(browser, errors):
    page = await open_lesson(browser, "de", errors)
    assert await page.locator("#coverK").text_content() == "Chapter 1"
    assert await page.evaluate("translate('startLesson') === 'Start lesson' && num(2.5) === '2.5'")
    print("PASS unknown language falls back to English")
    await page.close()


async def check_russian_book(browser, errors):
    page = await open_page(browser, "ru/", errors)
    text = lambda selector: page.locator(selector).first.text_content()   # as written, before CSS case and spacing
    assert (await text("#cover .btn.go")).startswith("Открыть книгу")
    assert await text("#meta") == "1 глава, 1 раздел, со звуком"
    assert await text("#prog") == "1 глава"
    assert await text(".unit h2 span") == "Раздел 1"
    assert await text(".ch small") == "8 мин"
    assert await page.locator(".home").get_attribute("aria-label") == "К обложке"
    await page.evaluate("localStorage.setItem('animebook:progress:/__i18n__/ru/', JSON.stringify({ done: [1], last: 1 }))")
    await page.reload()
    assert await text("#prog") == "Пройдено 1 из 1"
    assert await text("#resume") == "Продолжить · Глава 1"
    marks = await page.locator(".ch").first.evaluate(
        "e => [getComputedStyle(e.querySelector('small'), '::before').content, getComputedStyle(e.querySelector('small'), '::after').content]")
    assert marks == ['"✓ Пройдено · "', '" · Открыта последней"'], marks
    print("PASS Russian cover and contents: buttons, plurals, progress, finished and last-opened marks")
    await page.close()


async def check_cjk(browser, errors):
    expect = {
        "zh": ("第 1 章", "开始上课", "打开这本书", "1 章，1 个单元，有配音", "第 1 单元", "8 分钟"),
        "ja": ("第1章", "授業を始める", "本を開く", "1章、1単元、音声つき", "単元 1", "8分"),
    }
    for language, (chapter, start, open_book, meta, unit, minutes) in expect.items():
        page = await open_lesson(browser, language, errors)
        assert await page.locator("#coverK").text_content() == chapter
        assert await page.evaluate(f"translate('startLesson') === '{start}' && num(2.5) === '2.5'")
        await page.close()
        page = await open_page(browser, f"{language}/", errors)
        text = lambda selector: page.locator(selector).first.text_content()
        assert (await text("#cover .btn.go")).startswith(open_book)
        assert await text("#meta") == meta, await text("#meta")
        assert await text(".unit h2 span") == unit
        assert await text(".ch small") == minutes
        await page.close()
    print("PASS Chinese and Japanese lesson cover and book contents")


async def check_arabic_lesson(browser, errors):
    page = await open_lesson(browser, "ar", errors)
    text = lambda selector: page.locator(selector).first.text_content()
    style = lambda selector, prop: page.locator(selector).first.evaluate(f"e => getComputedStyle(e).{prop}")
    # Text reads right to left; the drawing and the timeline keep their left-to-right geometry, so ← is still "back".
    assert await page.evaluate("document.documentElement.dir") == "rtl"
    assert await style("#stage", "direction") == "ltr"
    assert await style("#bar", "direction") == "ltr"
    # Each stage text reads in the order of its own first letter, and its anchor keeps the stage's geometry: an Arabic
    # line with a Latin name keeps its word order and its stop at the left end; 'end' is still its right end.
    stage = await page.evaluate("""(() => {
      const g = mk('g', {}, document.getElementById('stage')), out = {};
      for (const [k, s, anchor] of [['law', 'قانون Newton الأول', 'end'], ['stop', 'عندي 5 تفاحات.', 'start'], ['en', 'Chapter 3.', 'start'],
        ['name', 'Newton قال ذلك', 'start'], ['maths', 'F = ma', 'start']]) {
        const t = T(g, s, { x: 800, y: 400, size: 40, anchor }), b = t.getBBox(), at = j => t.getStartPositionOfChar(j).x;
        const set = t.textContent;   // what T() put on the stage: s, or s behind a right-to-left mark
        out[k] = { left: b.x, right: b.x + b.width, first: at(0), last: at(set.length - 1), n: set.includes('N') ? at(set.indexOf('N')) : null, set };
      }
      g.remove();
      return out;
    })()""")
    assert stage["law"]["first"] > stage["law"]["n"] and abs(stage["law"]["right"]) < 1.5, f"Arabic stage text out of order: {stage['law']}"
    assert stage["stop"]["last"] < stage["stop"]["first"] and abs(stage["stop"]["left"]) < 1.5, f"Arabic stop misplaced: {stage['stop']}"
    assert stage["en"]["first"] < stage["en"]["last"] and abs(stage["en"]["left"]) < 1.5, f"English stage text changed: {stage['en']}"
    # In a right-to-left book an Arabic line that opens with a Latin name is still an Arabic line: the name stands at the
    # right, where the line starts, and its left end stays where a 'start' anchor puts it. Maths alone is left as it is.
    name = stage["name"]
    assert name["set"] == "\u200fNewton قال ذلك" and name["n"] > name["last"] and abs(name["left"]) < 1.5, f"Latin-led Arabic line: {name}"
    assert stage["maths"]["set"] == "F = ma" and stage["maths"]["first"] < stage["maths"]["last"], f"maths changed: {stage['maths']}"
    assert await page.evaluate("isRTL('3 تفاحات') && isRTL('Newton قانون') && !isRTL('2024') && !isRTL('F = ma')")
    assert await page.evaluate("rtlText('قانون Newton') === 'قانون Newton' && rtlText('F = ma') === 'F = ma'")
    # An English sentence quoting one Arabic word, and maths with an Arabic-Indic digit, stay left to right; a string
    # already marked is not marked twice
    assert await page.evaluate("!isRTL('The word for cat is قط in Arabic.') && !isRTL('x = ٣') && isRTL('DNA هو الحمض النووي')"), "Latin-led line misread"
    assert await page.evaluate("rtlText(rtlText('Newton قال ذلك')) === '\\u200fNewton قال ذلك'"), "marked twice"
    # stream() shows a letter at its first step, the mark riding with it (on a page of its own: evalTo runs its tweens)
    typing = await open_lesson(browser, "ar", errors)
    first = await typing.evaluate("""['Newton قال ذلك', String.fromCharCode(0x200E) + 'Newton قال ذلك'].map(s => {
      const t = T(document.getElementById('stage'), ''); stream(t, s, 0, 1);
      for (let k = 1; k <= 100 && !t.textContent; k++) evalTo(k / 100);   // the first step that shows anything
      return t.textContent; })""")
    await typing.close()
    assert first == ["‏N", "‎N"], f"stream: the first step shows {first!r}"
    # The author's own mark decides where the count misses
    assert await page.evaluate("""!isRTL('Sir Isaac Newton عالم إنجليزي.') && isRTL('\\u200fSir Isaac Newton عالم إنجليزي.')
      && !isRTL('\\u200eNewton قال ذلك') && rtlText('\\u200eNewton قال ذلك') === '\\u200eNewton قال ذلك'"""), "a direction mark ignored"
    # The documentary kit's say(): the browser orders an Arabic line, so a Latin name of two words keeps its own order
    # between the Arabic words, a Latin-led line still starts at the right, and each word waits for its turn.
    film = TEMPLATES / "documentary/lib/film.js"
    await page.add_script_tag(content=film.read_text(encoding="utf-8"))
    said = await page.evaluate("""(() => {
      const g = mk('g', {}, document.getElementById('stage')), out = {};
      for (const [k, s] of [['mixed', 'قال Isaac Newton ذلك.'], ['led', 'Newton قال ذلك']]) {
        const t = say(g, [s], 800, 300, 0, 1).querySelector('text'), set = t.textContent, at = c => set.includes(c) ? t.getStartPositionOfChar(set.indexOf(c)).x : null;
        out[k] = { left: t.getBBox().x, q: at('ق'), i: at('I'), n: at('N'), dh: at('ذ'), words: t.querySelectorAll('tspan').length,
          hidden: [...t.querySelectorAll('tspan')].every(e => e.getAttribute('fill-opacity') === '0') };
      }
      const en = say(g, ['One two'], 800, 500, 0, 1);
      out.en = { texts: en.querySelectorAll('text').length, tspans: en.querySelectorAll('tspan').length, italic: en.querySelector('text').getAttribute('font-style') };
      g.remove();
      return out;
    })()""")
    m, led = said["mixed"], said["led"]
    assert m["dh"] < m["i"] < m["n"] < m["q"] and m["words"] == 4 and m["hidden"] and abs(m["left"]) < 1.5, f"say(): Arabic line out of order: {m}"
    assert led["n"] > led["q"] > led["dh"] and abs(led["left"]) < 1.5, f"say(): Latin-led Arabic line: {led}"
    assert said["en"] == {"texts": 2, "tspans": 0, "italic": "italic"}, f"say(): English line changed: {said['en']}"
    # Answers typed on an Arabic keyboard: Arabic-Indic digits, ٫ and ٬
    assert await page.evaluate("[rat('٣'), rat('٠٫٧٥'), rat('۱۲'), rat('١٬٠٠٠'), rat('١،٠٠٠'), rat('١،٠٠٠،٠٠٠'), rat('١،٥'), rat('٣،٧٥'), rat('$١،٠٠٠'), rat('1،000$'), rat('١،٠٠٠٫٥'), rat('-1،000.5')].join('|') === '3,1|75,100|12,1|1000,1|1000,1|1000000,1|15,10|375,100|1000,1|1000,1|10005,10|-10005,10'"), "rat('١،٠٠٠٫٥') and kin"
    assert await page.evaluate("translate('theEnd') === 'النهاية'")
    assert await text("#coverK") == "الفصل 1"
    assert "ابدأ الدرس" in await text("#cover .go")
    assert await text("#coverMeta") == "نحو 8 دقائق، مع الصوت وأسئلة قصيرة."
    assert await page.locator("#help h2").text_content() == "اختصارات لوحة المفاتيح"
    # Arabic has one, two, few (3–10), many (11–99) and other (100+).
    assert await page.evaluate("[1, 2, 3, 11, 100].map(n => translate('aboutMinutes', { n })).join('|')") == (
        "نحو دقيقة، مع الصوت وأسئلة قصيرة.|نحو دقيقتين، مع الصوت وأسئلة قصيرة.|نحو 3 دقائق، مع الصوت وأسئلة قصيرة.|"
        "نحو 11 دقيقة، مع الصوت وأسئلة قصيرة.|نحو 100 دقيقة، مع الصوت وأسئلة قصيرة.")
    assert await page.evaluate("num(2.5) === '2.5' && num(-3) === '−3'"), "Arabic lessons write digits as 0–9 with a point"
    assert await page.get_by_role("button", name="الترجمة النصية (C)", exact=True).count() == 1

    # C on an Arabic layout types ؤ.
    await page.locator("#cover").click()
    await page.wait_for_function("P.started && P.audio.currentTime > .1")
    before = await page.get_attribute("#bCC", "aria-pressed")
    await press(page, "ؤ", "KeyC")
    assert await page.get_attribute("#bCC", "aria-pressed") != before, "ؤ toggles captions"

    # A question card reads from the right: its accent edge is on the right.
    await page.evaluate("seek(2, false)")
    await page.wait_for_timeout(200)
    assert await text(".card .kicker") == "تحقّق سريع"
    assert await style(".card", "direction") == "rtl"
    assert await style(".card", "borderRightWidth") == "7px" and await style(".card", "borderLeftWidth") != "7px"
    # Mathematics reads left to right inside Arabic text: "3 + 4 = [box]", the box after the expression, on its right.
    assert await page.evaluate("""(() => { const m = document.querySelector('.card .bline svg.m').getBoundingClientRect(),
      b = document.querySelector('.card .bline .box').getBoundingClientRect(); return b.left >= m.right - 1; })()"""), "equation flipped"
    assert await style(".card svg.m", "direction") == "ltr"
    # The bar's step label reads as the bar does: "3 / 6", not "6 / 3".
    assert await style("#stepName", "direction") == "ltr"
    await page.locator(".box").fill("6")
    await page.locator(".box").press("Enter")
    assert (await text(".card .fb")).startswith("ليس تماماً.")

    await page.evaluate("seek(BEATS.length - 1, false)")
    await page.wait_for_timeout(200)
    card = await text(".card")
    for line in ("اكتمل الفصل 1", "شاهد مرة أخرى", "كل الفصول"):
        assert line in card, f"finish card lacks {line!r}"
    print("PASS Arabic lesson: right-to-left text over a left-to-right stage, plurals, keys on an Arabic layout, questions")
    await page.close()


async def check_arabic_book(browser, errors):
    page = await open_page(browser, "ar/", errors)
    text = lambda selector: page.locator(selector).first.text_content()
    assert await page.evaluate("document.documentElement.dir") == "rtl"
    assert (await text("#cover .btn.go")).startswith("افتح الكتاب")
    # Its arrow points the way the page reads: to the left.
    assert await page.locator("#cover .btn.go svg").evaluate("e => getComputedStyle(e).transform") == "matrix(-1, 0, 0, 1, 0, 0)"
    assert await text("#meta") == "فصل واحد، وحدة واحدة، مع الصوت", await text("#meta")
    assert await text("#prog") == "فصل واحد"
    assert await text(".unit h2 span") == "الوحدة 1"
    assert await text(".ch small") == "8 دقائق"
    await page.evaluate("localStorage.setItem('animebook:progress:/__i18n__/ar/', JSON.stringify({ done: [1], last: 1 }))")
    await page.reload()
    assert await text("#prog") == "اكتمل 1 من 1"
    assert await text("#resume") == "تابع · الفصل 1"
    print("PASS Arabic cover and contents: right to left, plurals, progress")
    await page.close()


async def check_arabic_maths(browser, errors):
    """An expression inside a right-to-left line keeps its left-to-right order: on the stage, in a card, in a caption."""
    page = await open_lesson(browser, "ar", errors)
    # ltrMaths(): what is isolated (shown here between ⟦ and ⟧) and what is left to the sentence
    cases = {
        "لو 5 + x = 7 يبقى x = 2": "لو ⟦5 + x = 7⟧ يبقى ⟦x = 2⟧",
        "اطرح: 7 - 2 = 5.": "اطرح: ⟦7 - 2 = 5⟧.",
        "10 = x": "⟦10 = x⟧",
        "قيمة (x + 2) × 3 = 15 صح": "قيمة ⟦(x + 2) × 3 = 15⟧ صح",
        "جرّب (x = 5 مثلا) كده": "جرّب (⟦x = 5⟧ مثلا) كده",   # a bracket whose partner is outside stays outside
        "x = 5، y = 6": "⟦x = 5⟧، ⟦y = 6⟧",
        "7 − 2 صح": "⟦7 − 2⟧ صح",
        "الناتج = 7 + 2": "الناتج = ⟦7 + 2⟧",             # an Arabic word across a sign does not hold it
        "السرعة = 100 ÷ 2": "السرعة = ⟦100 ÷ 2⟧",
        "و5 + 2 = 7": "و⟦5 + 2 = 7⟧",                      # 'and' joined to the number
        "- x = 5": "- ⟦x = 5⟧",                            # a list item
        "المسافة 5 km + 3 km كبيرة": "المسافة ⟦5 km + 3 km⟧ كبيرة",   # a number carries its unit
        "لو 5 + x = 7 cm": "لو ⟦5 + x = 7 cm⟧",
        "و 3،5 + 1 = 4،5 صح": "و ⟦3،5 + 1 = 4،5⟧ صح",      # the Arabic comma as a decimal sign
        # left alone: a range and a date; an Arabic name across a sign; other Latin text, a number or a sign beside it
        "الحرب 1914 - 1918 طويلة": None, "7 - 2 صح": None, "يوم 5/3/2024 كان": None, "صفحة 10-12": None,
        "س + ٣ = ٧ معادلة": None, "٣ + ٤ = س": None, "س + 3 = 7 معادلة": None,
        "و ٥ + ٢ = ٧ صح": None,                          # Arabic-Indic digits alone read from the right with the sentence
        "The answer: 5 + 2 = 7.": None, "الجواب: The sum 5 + 2 = 7": None,   # after Latin words: already left to right
        "\u200f5 + 2 = 7": None, "الوقت 10:5 + 3": None, "x = 5:30 وقت": None,
        "افتح https://x.com/?a=1 الآن": None, "اكتب obj.x = 5 هنا": None, "قيمةx = 5": None,
        "اكتب print(x) عشان": None, "السعر ١٬٥٠٠ جنيه، والخصم ٢٥٪": None, "C++ لغة و x => y سهم": None,
    }
    got = await page.evaluate("cs => cs.map(c => ltrMaths(c).replaceAll(String.fromCharCode(0x2066), '⟦').replaceAll(String.fromCharCode(0x2069), '⟧'))", list(cases))
    for (text, want), have in zip(cases.items(), got):
        assert have == (want or text), f"ltrMaths({text!r}) is {have!r}"
    assert await page.evaluate("['لو 5 + x = 7', 'x = ٣ معادلة'].every(c => ltrMaths(ltrMaths(c)) === ltrMaths(c) && rtlText(rtlText(c)) === rtlText(c))"), "isolated twice"
    # The stage: 5 is left of x, x left of 7, and the whole expression left of the Arabic word that opens the line
    at = await page.evaluate("""(() => {
      const t = T(document.getElementById('stage'), 'لو 5 + x = 7 يبقى', { x: 800, y: 300 }), set = t.textContent, x = c => t.getStartPositionOfChar(set.indexOf(c)).x;
      const out = { five: x('5'), x: x('x'), seven: x('7'), lam: x('ل'), maths: rtlText('F = ma') === 'F = ma' && T(document.getElementById('stage'), '5 + x = 7').textContent === '5 + x = 7' };
      t.remove();
      return out; })()""")
    assert at["five"] < at["x"] < at["seven"] < at["lam"], f"stage: the expression is out of order: {at}"
    assert at["maths"], "a line that is only maths changed"
    # A card: the options 'x = 10' and '10 = x' no longer look alike, and a reason keeps its sum in order
    card = await page.evaluate("""(() => {
      const left = (str, a, b) => {
        const p = document.createElement('p'); p.append(rich([str])); document.getElementById('ui').append(p);
        const node = p.querySelector('span').firstChild, text = node.data, r = document.createRange();
        const at = c => { const i = text.indexOf(c); r.setStart(node, i); r.setEnd(node, i + 1); return r.getBoundingClientRect().left; };
        const out = at(a) < at(b);
        p.remove();
        return out; };
      return [left('10 = x', '1', 'x'), left('x = 10', 'x', '1'), left('الصندوق جواه 5، و 5 + 2 = 7.', '+', '='), left('و 9 - x = 4 صح', '9', 'x')]; })()""")
    assert card == [True, True, True, True], f"card: an expression is out of order: {card}"
    # Card texts outside rich(): a question's kicker, a table's column buttons, the chapter title on the cover and the finish card
    texts = await page.evaluate("""(() => {
      const LRI = String.fromCharCode(0x2066), out = {};
      quiz(BAND, [{ id: 'k', prompt: ['سؤال'], build: grid([{ parts: ['3'], ans: ['a'] }], [['a', '10 = x'], ['b', 'x = 10']], { multi: false }) }], () => {}, 'لو 5 + x = 7');
      const card = document.querySelector('#ui .card');
      out.kicker = card.querySelector('.kicker').textContent.includes(LRI);
      out.cols = [...card.querySelectorAll('button.opt')].map(b => b.textContent.includes(LRI));
      clearCards();
      CHAPTER.title = 'حل 5 + x = 7';
      finishCard(() => {}); out.finish = [...document.querySelectorAll('#ui .prompt')].some(e => e.textContent.includes(LRI + '5 + x = 7'));
      clearCards();
      return out; })()""")
    assert texts == {"kicker": True, "cols": [True, True], "finish": True}, f"card texts outside rich(): {texts}"
    # stream(): the isolate's marks are invisible, so each ride with a letter: no step of the typing shows nothing new
    steps = await page.evaluate("""(() => {
      const t = T(document.getElementById('stage'), ''), seen = [];
      stream(t, 'و x = ٣ صح' + String.fromCharCode(0x200F), 0, 1);   // a mark at the end rides with the last letter
      for (let k = 0; k <= 400; k++) { evalTo(k / 400); if (t.textContent !== seen.at(-1)) seen.push(t.textContent); }
      const visible = s => [...s].filter(c => ![0x200E, 0x200F, 0x2066, 0x2069].includes(c.codePointAt(0))).length;
      t.remove();
      return seen.map(visible); })()""")
    assert steps == list(range(steps[0], steps[0] + len(steps))) and steps[-1] == len("و x = ٣ صح") and len(steps) == steps[-1] - steps[0] + 1, f"stream: a step shows nothing new: {steps}"
    # The documentary kit's say(): an isolated expression is one word, so its isolate opens and closes in one <tspan>
    await page.add_script_tag(content=(TEMPLATES / "documentary/lib/film.js").read_text(encoding="utf-8"))
    said = await page.evaluate("""(() => { const g = mk('g', {}, document.getElementById('stage'));
      const ts = [...say(g, ['احسب 5 + x = 7 الآن'], 800, 300, 0, 1).querySelectorAll('tspan')].map(e => e.textContent); g.remove(); return ts; })()""")
    assert said == ["احسب", "⁦5 + x = 7⁩", "الآن"], f"say(): {said!r}"
    # A caption reads from the right too
    await page.evaluate("TIMINGS.idea.cues = [[0, 'لو 5 + x = 7 يبقى x = 2']]; setCaptions(true, false); hideCover(); seek(1, false)")
    await page.wait_for_function("document.getElementById('caption').textContent")
    caption = await page.evaluate("document.getElementById('caption').textContent.replaceAll(String.fromCharCode(0x2066), '⟦').replaceAll(String.fromCharCode(0x2069), '⟧')")
    assert caption == "لو ⟦5 + x = 7⟧ يبقى ⟦x = 2⟧", f"caption: {caption!r}"
    await page.close()
    # An English page is untouched: its cards and captions set the string as written
    page = await open_lesson(browser, "en", errors)
    assert await page.evaluate("['10 = x', '(5 + 2 = 7)', 'كتاب: 5 + x = 7'].every(c => ltrMaths(c) !== c && rich([c]).textContent === c && T(document.getElementById('stage'), c).textContent === c)"), "English text changed"
    await page.evaluate("TIMINGS.idea.cues = [[0, '5 + x = 7.']]; setCaptions(true, false); hideCover(); seek(1, false)")
    await page.wait_for_function("document.getElementById('caption').textContent")
    assert await page.evaluate("document.getElementById('caption').textContent") == "5 + x = 7.", "English caption changed"
    await page.close()
    print("PASS Arabic maths: an expression inside a right-to-left line keeps its order on the stage, in cards and in captions")


async def main():
    errors = []
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(args=["--autoplay-policy=no-user-gesture-required"])
        await check_english_unchanged(browser, errors)
        await check_russian_lesson(browser, errors)
        await check_other_language(browser, errors)
        await check_russian_book(browser, errors)
        await check_cjk(browser, errors)
        await check_arabic_lesson(browser, errors)
        await check_arabic_book(browser, errors)
        await check_arabic_maths(browser, errors)
        await browser.close()
    assert not errors, errors
    print("PASS no page errors, console errors or failed requests")


if __name__ == "__main__":
    asyncio.run(main())
