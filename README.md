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

**Today:** Built with Opus 5.5, and tested with other models (see [Models](#models)). No image models, multilingual support, or BGM yet.

## Roadmap

- [x] **Math books:** formulas and diagrams that change step by step, with quizzes. Two books on the shelf.
- [ ] **Physics books:** illustrated scenes, acting characters and camera work. Chapters 9–11 are on the shelf; the new Skill that makes them is being refined.
- [ ] **Picture books:** image models and storyboards for interactive picture books. In local testing.
- [ ] **Humanities documentaries:** history and social science titles.

Along the way, the bookshelf grows and new Skills are released.

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
