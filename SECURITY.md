# Security policy

## How Papermorph runs

- **The site is static.** The books at [papermorph.diamonddoge.org](https://papermorph.diamonddoge.org/) are plain HTML, CSS, JavaScript, pictures and sound. There is no backend, no account, no data stored on a server, and no third-party scripts. A reader's progress, speed and caption settings stay in their own browser's `localStorage`.
- **The Skill runs on your machine.** Its scripts run locally, with your own API keys for the paid steps (voices, clips, painted sets).

## Reporting a vulnerability

Please report privately, not in a public issue:

1. Use GitHub's private vulnerability reporting: the repository's **Security** tab › **Report a vulnerability**, or [this link](https://github.com/DozenTwelve/Papermorph/security/advisories/new).
2. If that doesn't work for you, write to [a972848363@gmail.com](mailto:a972848363@gmail.com).

Say what is affected, how to reproduce it, and what an attacker could do. We'll reply as soon as we can and tell you when it is fixed.

## Supported versions

The `main` branch and the live site. Fixes go there; older copies of a book or the Skill are not patched.

## Scope

In scope:

- the Skill's scripts (`.claude/skills/papermorph/scripts/`) and kits, for example a script that runs or writes something it shouldn't, or leaks an API key;
- the player and drawing engine (`engine/`);
- the published books (`site/`), for example script injection through a page or a link.

Out of scope:

- the third-party model, voice and image APIs the Skill calls (OpenRouter, OpenAI, ElevenLabs, Edge TTS and others), and the agent that runs the Skill (Claude Code, OpenCode): report those to their providers;
- books other people made with the Skill and host themselves.
