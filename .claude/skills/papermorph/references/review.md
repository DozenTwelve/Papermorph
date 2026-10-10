# Delivery pass

Serve `site/` over HTTP. Use this pass once per chapter; inspect relevant frames, fix clear defects locally and recheck those parts. Deliver for the user's assessment of overall aesthetics, pacing and teaching effectiveness.

## Frames and opening blanks

```sh
uv run --with playwright --with pillow SKILL/scripts/shot.py chNN --url http://localhost:8765/<book>/ --out /tmp/animebook-<book>
uv run --with playwright SKILL/scripts/check_blank.py site/<book> chNN --url http://localhost:8765/<book>/
```

`shot.py` captures open/end frames as 4-up sheets and reports console errors. Read the sheets once; use `shot.py chNN 5:7.5` for a specific transition or correction. Add `--moments mid` when intermediate geometry needs a frame. Run one screenshot browser at a time.

Make a brief judgment of:

- the picture empty or unrelated at `open`;
- text over drawings, labels colliding, anything clipped or off the stage;
- a question card covering the object it asks about;
- leftovers from the previous beat, half faded;
- geometry contradicting the intended values, spacing or area;
- text too small to read at half size, or too much text at once;
- inconsistent colours for the same idea.

The blank check reports openings empty for more than 1 second after speech starts (`LIMIT=0.6` for a stricter pass). Resolve reported openings in the beat. Preserve ordinary transitions and thinking pauses.

Report the delivery result and any unresolved defects in a few lines. A new visual redesign starts with user feedback.

## Targeted interaction tests

For changes to playback, question types or grading, run existing tests that exercise the changed behavior. If needed, adapt `assets/templates/e2e.py` into `tools/<book>/e2e_chNN.py`; set `URL` to the actual chapter URL. In another language, match that language's feedback and finish-card text. For changes to interface text, number formats or letter shortcuts, run `scripts/check_i18n.py` (no server needed); it also compares English pages with `main`. Check the relevant wrong/right feedback, Show answer and continuation, or pause/replay/seek behavior. Shared timing/replay changes warrant the whole book's blank check and existing affected tests; ordinary new chapters use the delivery pass above.

For scoring changes, verify a wrong first attempt stays recorded after leaving and revisiting the question, and that restarting clears it. For progress changes, check book isolation and loading with missing or malformed stored data. Apply common fixes to the affected book engines and the Skill engine/template, preserving book-specific helpers and legacy keys.

Test details: keyboard first, plus mouse for changed drag handling; Enter checks and Esc leaves answer boxes; press Esc before S. Multi-row questions score per row. Use R on the finish card (Enter opens the next chapter). Python's server lacks Range requests, so let audio play naturally instead of setting `audio.currentTime`.
