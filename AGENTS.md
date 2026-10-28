# Working on Papermorph

Papermorph is a Claude Code Skill that turns a textbook PDF, a story or an argument into a narrated, animated web book: lessons, picture books, and films (documentaries and upright shorts). This file is for an agent changing the repository; the Skill's own instructions for making books are in `.claude/skills/papermorph/SKILL.md`.

## What lives where

- `.claude/skills/papermorph/`: the Skill. `SKILL.md` routes by tier and links every reference directly; `references/core/` holds what every tier shares (style, publish, sound, review, team, engine), `references/lessons/`, `references/picture-books/` and `references/films/` what is each tier's own; `scripts/` the tools; `assets/templates/` the kits a new book is copied from (`scripts/new_book.py`).
- `engine/`: the one source of the player and drawing engine. Change it here, then copy it into the books with `python3 .claude/skills/papermorph/scripts/engine.py site`; never edit a book's `lib/engine.*` copy. A book's own settings live in its `lib/book.css`, which the sync leaves alone.
- `site/`: the published books, static files only, with no build step or backend.
- `books/`, `content/` and `tools/` are the maintainers' private working folders and are not in the repository. Don't recreate them in a commit.
- Don't add a copyrighted book, its PDF, or lessons made from one.

## Changing the Skill

The Skill is read by models making books, so what it says has to be true and has to be found. These rules come from what went wrong before:

1. **The docs describe what the kits and scripts actually do.** Change the code and its docs in the same commit, and open a template before describing it. A doc once said a chapter page had map lines commented out that only another kit's page had, and an agent spent a step looking for them.
2. **Reference films and books are built with the kit the Skill ships.** When a reference needed something the kit lacks, move it into the kit, or the reference teaches a path no one else can follow.
3. **Tools say what they could not do.** A label pushed off frame, an unknown region name, a global that clashes with the engine: print it and name it. A silent skip looks like success to the agent running the tool.
4. **Shared files hold only what is shared.** `references/core/` is for every tier, and `references/films/films.md` for both documentaries and shorts. A sentence true of one tier or shape goes in that tier's file.
5. **Each step can get what it needs from the steps before it, and each target comes with the figure to reach it.** A length comes with a words-per-minute figure; a loudness comes with the level to set.

Write Skill guidance as intent, reasons and examples, and give the model ways to see its own output. Avoid lists of bans: they narrow what the model tries, and the owner has turned them down before. Keep each fact in one place and link to it.

## Checks

CI (`.github/workflows/checks.yml`) runs these on every pull request; run them before you push:

- `python3 .github/scripts/check_skill.py` checks links and anchors, that `SKILL.md` links every reference and names every script, that scripts compile, and that flags and paths named in the docs exist.
- `python3 .github/scripts/check_site.py` (needs Node) checks that every book's engine copy matches `engine/`, runs `lint.py` on every book, and runs `node --check` on every script, inline page scripts included.
- `pipx run ruff check --select F,E9 --ignore F401 .claude/skills/papermorph/scripts .github engine` catches undefined names and other pyflakes errors in the Python tools.
- After an engine or page change, serve the site (`python3 .claude/skills/papermorph/scripts/serve.py 8765 site`), play the chapters you touched in a browser, and run `python3 .claude/skills/papermorph/scripts/lint.py site/<book>` and the engine's own checks (`uv run --with playwright engine/check_i18n.py`, `engine/check_latex.py`, `engine/check_tapwords.py`; `engine/check_volume.py` with the site served on 8767).
- After a large change to the Skill, have a fresh agent make a short film with the Skill alone, and sort what it trips on under the rules above. If a problem fits none of them, a rule is missing.
