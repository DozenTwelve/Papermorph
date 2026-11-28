# Contributing to Papermorph

Thank you for helping. Papermorph is mainly the Skill: the instructions, scripts and kits a model uses to make a book. The books on the shelf are examples of what it makes.

## What is welcome

- Fixes to the Skill (`.claude/skills/papermorph/`): a doc that says something the code doesn't do, a script that fails, a kit that is missing a piece.
- Fixes to the player and drawing engine (`engine/`).
- Fixes to the tools and checks (`.claude/skills/papermorph/scripts/`, `.github/`).
- Reports of where the Skill misled a model: which doc or script, which model, what it did and what would have helped. These are some of the most useful reports we get. Use the [Skill problem](https://github.com/DozenTwelve/Papermorph/issues/new?template=skill.yml) form.
- Bugs in a book page or the player: use the [bug](https://github.com/DozenTwelve/Papermorph/issues/new?template=bug.yml) form.

## What we can't take

- A copyrighted book, its PDF, or lessons, films or pictures made from one. Our own examples use public-domain books and pictures, or ones we draw.
- Requests to make a book. We don't make books on request; the Skill is there so you can make your own ([SKILL.md](.claude/skills/papermorph/SKILL.md)). For publishers, schools and studios, see [the work page](https://papermorph.diamonddoge.org/work/).

Questions go to [Discussions](https://github.com/DozenTwelve/Papermorph/discussions).

## Set up and run the checks

```bash
git clone https://github.com/DozenTwelve/Papermorph.git
cd Papermorph
python3 .claude/skills/papermorph/scripts/serve.py 8765 site   # then open http://localhost:8765/
```

You need Python 3, [uv](https://docs.astral.sh/uv/), ffmpeg, Node, and Playwright's browsers (`uv run --with playwright playwright install chromium firefox`). The checks CI runs on every pull request, and how to run each one, are listed in [AGENTS.md › Checks](AGENTS.md#checks). Run the ones that apply before you open a pull request.

## Changing the engine

The player lives in one place, `engine/`, and every book keeps its own copy in `site/<book>/lib/`. Change `engine/`, then copy it into the books:

```bash
python3 .claude/skills/papermorph/scripts/engine.py site
```

Don't edit a book's `lib/engine.*` copy by hand; CI checks that every copy matches `engine/`. A book's own settings live in its `lib/book.css`, which the sync leaves alone. After an engine change, play the chapters you touched in a browser.

## Changing the Skill

Models read the Skill, so what it says has to be true. Change the code and its docs in the same commit. [AGENTS.md › Changing the Skill](AGENTS.md#changing-the-skill) has the five rules we follow and why.

## Agents

If an agent is making the change, start it with [AGENTS.md](AGENTS.md). It covers where things live, the rules for changing the Skill, and the checks.

## Code of conduct

Everyone taking part follows the [code of conduct](CODE_OF_CONDUCT.md).
