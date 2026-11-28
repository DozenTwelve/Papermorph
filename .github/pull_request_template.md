## What changed and why

<!-- A few sentences. Link the issue if there is one. -->

## Checks

<!-- The CI checks are listed in AGENTS.md › Checks. Tick the ones you ran. -->

- [ ] `python3 .github/scripts/check_skill.py`
- [ ] `python3 .github/scripts/check_site.py`
- [ ] Sound tools: `level.py --selftest`, `music.py --selftest`, `sfx.py --selftest`
- [ ] `prep.py --selftest`, `new_book.py --selftest`
- [ ] `claykit.py --selftest`, `site/physics-clay/make/check_build.py`
- [ ] `pipx run ruff check --select F,E9 --ignore F401 .claude/skills/papermorph/scripts .github engine`

## For this kind of change

- [ ] Skill change: the docs that describe it are changed in the same commit.
- [ ] Engine change: books synced with `python3 .claude/skills/papermorph/scripts/engine.py site`, and the chapters touched played in a browser.
- [ ] Page change: screenshots below.
- [ ] No copyrighted book, PDF, or lessons, films or pictures made from one.

## Screenshots

<!-- For page or player changes. -->
