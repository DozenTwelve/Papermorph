<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="img/readme/logo_light.png">
    <source media="(prefers-color-scheme: light)" srcset="img/readme/logo.png">
    <img src="img/readme/logo.png" alt="Papermorph" width="600">
  </picture>
</p>

<p align="center">
  <strong>A Skill that turns PDFs into animated interactive web books.</strong>
</p>

You've seen Opus 5.5 one-shot videos.
This Skill takes it further: books you can explore, listen to, and interact with.

<p align="center">
  <a href="https://papermorph.diamonddoge.org/">Explore the live bookshelf →</a>
  ·
  <a href=".claude/skills/papermorph/SKILL.md">Use the Skill</a>
</p>

<p align="center">
  <a href="img/readme/papermorph-preview.mp4">
    <img src="img/readme/papermorph-preview.gif" alt="Real demo: bookshelf, animated lessons, and interactive quizzes" width="900">
  </a>
  <br>
  <a href="img/readme/papermorph-preview.mp4">Watch the full 75-second demo with narration</a>
</p>

```text
PDF -> A short conversation (style.json) -> Storyboards -> Narration -> Animation & quizzes -> Web book
```

The Skill starts by asking: it finds your PDF, says what the book is, suggests a chapter to try and an animation tier, and offers options at every step, so you can just pick the recommended one. Your choices are saved in `style.json`, the style every later chapter is made against.

**Today:** Built with Opus 5.5, and tested with other models (see [Models](#models)). No image models, multilingual support, or BGM yet.

## Roadmap

- [x] **Math books:** formulas and diagrams that change step by step, with quizzes. Two books on the shelf.
- [ ] **Physics books:** illustrated scenes, acting characters and camera work. Chapters 9–12 are on the shelf; chapter 12 was made by the new Skill.
- [x] **Picture books:** short films of paper puppets from a story, a joke or a fairy tale; sets drawn in code or painted by an image model. *Little Red Riding Hood* and *Joke Collection* are on the shelf.
- [ ] **Humanities documentaries:** history and social science titles.

Along the way, the bookshelf grows and new Skills are released.

## Get started

Install in your project directory:

```bash
npx skills add DozenTwelve/Papermorph --skill papermorph --agent claude-code
```

In Claude Code with Opus 5.5, run:

```text
/papermorph
```

It looks for the PDF in your project, then asks the rest. Diagrams that change (tier 1) suit maths and other abstract topics; illustrated scenes (tier 2) suit physics and stories. For a picture book, bring a story instead of a PDF. Documentaries are coming.

Before you review a chapter, `scripts/lint.py` catches broken names, missing audio and stale narration in under a second.

## Player and engine

Every book plays in the same player: speed control (`<` `>`), click anywhere on a step to jump there, captions, keyboard shortcuts, and progress saved per book.

The player engine lives in [`engine/`](engine), apart from the Skill, so a fix reaches every book without touching the Skill. Fork it if you like, and point the Skill at your fork:

```bash
python3 .claude/skills/papermorph/scripts/engine.py site --from you/your-fork@main
```

## Export to video

Any chapter can be rendered to MP4 (1080p) with an `.srt` for YouTube or Bilibili:

```bash
uv run --with playwright .claude/skills/papermorph/scripts/export.py ch12 \
  --url http://localhost:8765/science/ --link https://papermorph.diamonddoge.org/science/ch12/
```

Frames come straight from the lesson clock, so the video matches the page. Quizzes stay in the interactive version; the video ends by pointing there.

## Models

The Skill is not tied to one model. Books on the shelf show the results:

- **Opus 5.5:** most of the books, including the physics chapters.
- **GPT-6.1-Sol:** runs the Skill well. See *Elementary Mathematics*, chapters 4–20.
- **Sonnet 5.5:** works, with some rough edges. See *Elementary Mathematics*, chapters 21–22.

## Official alternative

Claude now offers official animated explainers ([Claude Motion](https://claude.com/resources/articles/dashboards-and-motion), in beta), which overlap with much of what this Skill does. For token efficiency, the official tool may be the better choice.

I will still finish Papermorph along its roadmap. Building it is worth it to me.

## Contributing

Fixes to the Skill and the player are welcome. Please do not open pull requests that add a book, its PDF, or generated lessons, audio or videos: those raise copyright issues.

## Try the examples locally

```bash
git clone https://github.com/DozenTwelve/Papermorph.git
cd Papermorph
python3 -m http.server 8765 -d site
```

Open [localhost:8765](http://localhost:8765/)

[MIT License](LICENSE)
