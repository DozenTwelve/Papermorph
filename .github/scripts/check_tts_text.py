#!/usr/bin/env python3
"""Captions and marks from narration text, without a voice: tts.py's text rules for each script it supports.

    python3 .github/scripts/check_tts_text.py

The spoken words a voice would return are written out by hand here, so the check needs no network and no audio.
"""
import ast
import importlib.util
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("tts", ROOT / ".claude/skills/papermorph/scripts/tts.py")
tts = importlib.util.module_from_spec(spec)
spec.loader.exec_module(tts)

failures = []


def check(name, got, want):
    if got != want:
        failures.append(f"{name}:\n  got  {got!r}\n  want {want!r}")


def words_at(clean, seconds):
    """(time, word) pairs for the text's space-separated words, as a voice's word boundaries would give them."""
    return list(zip(seconds, [w.strip(".?!؟،") for w in clean.split()]))


# Arabic: a question ends with the Arabic question mark (؟), which must close its caption like "?" does.
raw = "مساحة المستطيل تساوي الطول في العرض. ما مساحة [[q]]مستطيل طوله خمسة؟ الجواب [[a]]عشرون."
clean, marks, _ = tts.split_marks(raw)
words = words_at(clean, [0.0, 0.5, 1.0, 1.4, 1.7, 2.0, 3.0, 3.4, 3.8, 4.2, 4.8, 5.6, 6.1])
check("Arabic captions split at ؟", [text for _, text in tts.caption_cues(clean, words)],
      ["مساحة المستطيل تساوي الطول في العرض.", "ما مساحة مستطيل طوله خمسة؟", "الجواب عشرون."])
check("Arabic caption starts", [t for t, _ in tts.caption_cues(clean, words)], [0.0, 3.0, 5.6])
check("Arabic marks land on their words", tts.mark_times(clean, marks, words), {"q": 3.8, "a": 6.1})

# English stays as it was.
clean, marks, _ = tts.split_marks("One idea. Is it [[w]]true? Yes.")
words = words_at(clean, [0.0, 0.4, 1.0, 1.2, 1.4, 2.0])
check("English captions", [text for _, text in tts.caption_cues(clean, words)], ["One idea.", "Is it true?", "Yes."])

# {{shown|spoken}}: the voice gets the spoken form, the captions the shown one, and the marks still land.
clean, marks, shown = tts.split_marks("Call it {{Safety-II|Safety Two}}. [[w]]{{IT|I T}} teams know it.")
check("respelling: the voice reads the spoken form", clean, "Call it Safety Two. I T teams know it.")
words = words_at(clean, [0.0, 0.3, 0.5, 0.9, 1.5, 1.7, 1.9, 2.3, 2.6])
check("respelling: captions show the written form",
      [text for _, text in tts.respell(tts.caption_cues(clean, words), shown)], ["Call it Safety-II.", "IT teams know it."])
check("respelling: marks land on spoken words", tts.mark_times(clean, marks, words), {"w": 1.5})

# A pair respells its own words only: twice is no warning, and the same words said plainly keep their spelling.
clean, marks, shown = tts.split_marks("Then two more. Pick {{2|two}} and {{2|two}}.")
words = words_at(clean, [0.0, 0.3, 0.6, 1.0, 1.3, 1.6, 1.9])
check("respelling: only the pair's own occurrences",
      [text for _, text in tts.respell(tts.caption_cues(clean, words), shown)], ["Then two more.", "Pick 2 and 2."])
# Chinese has no word edges, a backslash in the shown form is kept, and eleven.py's closed-up spaces still match.
clean, _, shown = tts.split_marks("这是{{IT|爱踢}}团队。")
check("respelling: Chinese", [t for _, t in tts.respell(tts.caption_cues(clean, words_at(clean, [0.0])), shown)], ["这是IT团队。"])
check("respelling: a backslash shown as written", tts.respell([[0, "theta."]], tts.split_marks("{{\\theta|theta}}.")[2]),
      [[0, "\\theta."]])
check("respelling: double spaces", tts.respell([[0, "I T teams."]], tts.split_marks("{{IT|I  T}} teams.")[2]), [[0, "IT teams."]])
for bad in ("Say {{IT}} now.", "Say {{IT|[[w]]I T}} now."):   # a stray {{ would be read aloud; a mark inside has no word
    try:
        tts.split_marks(bad)
        failures.append(f"respelling: {bad!r} should stop the voice script")
    except ValueError:
        pass

# A clip that stops early: the voice's last word against the text's, whatever stands around either. A closing quote,
# an ellipsis or the Arabic comma is no difference, vowel marks are none, and a number or Chinese gives no verdict.
for text, spoken, want in [
    ("and then it stopped.", "stopped", None), ("and then it stopped.", "it", "stopped"),
    ("He said \u201cthe end.\u201d", "end.\u201d", None), ("He waited (and waited)\u2026", "waited)\u2026", None),
    ("It ended in 1914.", "1914", None),
    ("ثُمَّ ذَهَبَ إِلَى الْبَيْتِ.", "البيت", None), ("ثم ذهب إلى البيت،", "البيت،", None), ("ثم ذهب إلى البيت.", "ذهب", "البيت"),
    ("这是团队。", "这是", None),
    ("The war began in 1914, and lasted four years.", "1914", "years"), ("In the year 1914.", "fourteen", None),
    ("The final count is twenty-one.", "one", None), ("They joined NATO.", "Nato", None),
]:
    check(f"cut short: {text!r} ending {spoken!r}", tts.cut_short(text, spoken), want)

# export.py's .srt lines (its two text helpers alone: the module itself needs a browser). A right-to-left mark opens an
# Arabic line; in an Arabic film also one that a Latin name opens; an English line is never touched.
source = (ROOT / ".claude/skills/papermorph/scripts/export.py").read_text(encoding="utf-8")
helpers = [n for n in ast.parse(source).body if isinstance(n, ast.FunctionDef) and n.name in ("rtl_letter", "rtl_marked")]
srt = {"unicodedata": unicodedata}
exec(compile(ast.Module(body=helpers, type_ignores=[]), "export.py", "exec"), srt)
check("srt: both helpers found", len(helpers), 2)
check("srt: Arabic line", srt["rtl_marked"]("قال Newton."), "\u200fقال Newton.")
check("srt: Latin-led line in an Arabic film", srt["rtl_marked"]("Newton قال ذلك\nHello.", True), "\u200fNewton قال ذلك\nHello.")
check("srt: Latin-led line in an English film", srt["rtl_marked"]("Newton قال ذلك"), "Newton قال ذلك")
check("srt: English", srt["rtl_marked"]("Chapter 3: 1914."), "Chapter 3: 1914.")
check("srt: an English line quoting one Arabic word, in an Arabic film", srt["rtl_marked"]("The word is كتاب.", True), "The word is كتاب.")

if failures:
    print("\n".join(failures))
    sys.exit(1)
print("tts text rules: ok")
