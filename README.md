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
PDF -> Book plan -> Storyboards -> Narration -> Animation & quizzes -> Web book
```

**Today:** Opus 5.5 only. Books in English or Russian; no image models or BGM yet.

**Planned:** Image models and storyboarding for interactive picture books and humanities documentaries.

**Milestones:** Expand the bookshelf—from STEM textbooks to picture books and social science titles—and release new Skills.

## Get started

Install in your project directory:

```bash
npx skills add DozenTwelve/Papermorph --skill papermorph --agent claude-code
```

In Claude Code with Opus 5.5, run:

```text
/papermorph Turn /path/to/book.pdf into
an animated interactive web book.

Target readers: [your audience].
Start with one English chapter for review.
```

## Try the examples locally

```bash
git clone https://github.com/DozenTwelve/Papermorph.git
cd Papermorph
python3 -m http.server 8765 -d site
```

Open [localhost:8765](http://localhost:8765/)

[MIT License](LICENSE)
