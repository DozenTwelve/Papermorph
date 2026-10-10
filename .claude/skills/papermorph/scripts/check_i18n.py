#!/usr/bin/env python3
"""Interface-language regression for the Skill engine and the cover/contents template.

    uv run --with playwright .claude/skills/papermorph/scripts/check_i18n.py

No server is needed: the check answers every request itself with the Skill's chapter and book
templates, its engine and a real MP3 from an existing book. English pages are compared with the
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

SKILL = Path(__file__).resolve().parents[1]
ROOT = SKILL.parents[2]
SITE = ROOT / "site"
BASE = os.environ.get("BASE_URL", "http://127.0.0.1:8767").rstrip("/")
BASE_REF = os.environ.get("BASE_REF", "main")
ENGINE = SKILL / "assets/engine/engine.js"
TEMPLATES = SKILL / "assets/templates"
TIMING = {"dur": 30, "marks": {"sub": 1, "note": 2, "w1": 3, "w2": 4}, "cues": []}
TIMINGS = "const TIMINGS = " + json.dumps({beat: TIMING for beat in ("intro", "idea", "q1", "wrap", "final1", "finish")})
# Page variants: (html lang, engine and book template from BASE_REF instead of the working tree).
VARIANTS = {"base": ("en", True), "en": ("en", False), "ru": ("ru", False), "de": ("de", False)}


def at_base_ref(path):
    """The file as committed at BASE_REF, or None when the comparison is skipped."""
    if not BASE_REF:
        return None
    relative = path.relative_to(ROOT).as_posix()
    result = subprocess.run(["git", "show", f"{BASE_REF}:{relative}"], cwd=ROOT, capture_output=True)
    return result.stdout.decode("utf-8") if result.returncode == 0 else None


BASE_FILES = {"engine": at_base_ref(ENGINE), "book": at_base_ref(TEMPLATES / "book.html")}


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
    elif rest == "lib/engine.js":
        if from_base:
            await route.fulfill(content_type="text/javascript", body=BASE_FILES["engine"])
        else:
            await route.fulfill(path=ENGINE)
    elif rest == "lib/engine.css":
        await route.fulfill(path=SKILL / "assets/engine/engine.css")
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
    shots.append(await page.evaluate("document.getElementById('ui').innerHTML"))
    await page.evaluate("seek(BEATS.length - 1, false)")
    await page.wait_for_timeout(600)
    shots.append(await page.evaluate("document.getElementById('ui').innerHTML"))
    return shots


async def check_english_unchanged(browser, errors):
    if not all(BASE_FILES.values()):
        print(f"SKIP English identity: engine or book template not found at BASE_REF={BASE_REF!r}")
        return
    before = await open_lesson(browser, "base", errors)
    after = await open_lesson(browser, "en", errors)
    names = ("player markup", "quick check", "wrong-answer feedback", "finish card")
    for name, old, new in zip(names, await lesson_snapshot(before), await lesson_snapshot(after)):
        assert old.replace("/__i18n__/base/", "/__i18n__/en/") == new, f"English {name} changed"   # links carry the page's own path
    assert await after.evaluate("rat('0,75') === null && num(2.5) === '2.5' && num(-3) === '−3'"), "English numbers changed"
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
    assert await text(".card .kicker") == "Проверь себя   1 из 3"
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
    assert await text("#meta") == "1 глава · 1 раздел · со звуком"
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


async def main():
    errors = []
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(args=["--autoplay-policy=no-user-gesture-required"])
        await check_english_unchanged(browser, errors)
        await check_russian_lesson(browser, errors)
        await check_other_language(browser, errors)
        await check_russian_book(browser, errors)
        await browser.close()
    assert not errors, errors
    print("PASS no page errors, console errors or failed requests")


if __name__ == "__main__":
    asyncio.run(main())
