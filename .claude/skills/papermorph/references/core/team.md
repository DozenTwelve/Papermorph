# Making a chapter with a team of models

A chapter can be made by a coordinator handing each step to a fresh subagent on the model that suits it. How a tier splits the work is in its own file: lessons by step of the chapter loop ([lessons.md](../lessons/lessons.md#team)), picture books by scene ([stories.md](../picture-books/stories.md#team)), films by part of the film or by episode ([films.md](../films/films.md#team)). Without subagents, run the same steps in the current agent with file-based state.

Why this shape: one agent doing a whole chapter carries an ever larger context through every call, and long idle waits make that context expire and get written again; that, more than the model's price, makes a chapter expensive. Small workers that start from the files they need and finish quickly cost far less, and each step can use the cheapest model that does it well. On a physics book this cost about half as much per minute of narration as one strong agent doing everything, at the same quality.

Each step runs on the model the user chose for it (`models` in `style.json`, [core/style.md](style.md#models)). The defaults are named by strength: **small** (fast and cheap), **middle**, **strong** (the most capable); where `models` is silent, use them and say which model you picked.

## The coordinator

You read SKILL.md, your tier's file and this one, look at the sheets and the workers' replies, and pass work on. You don't write the chapter, read the page code or read workers' transcripts; keeping your own context small is most of the saving.

- For the pilot the coordinator is the main conversation, since the user sees its sheets and choices. The narration and first frames made at intake are where the steps start, not something to redo.
- After the pilot a fresh session is the best coordinator, starting from SKILL.md, the tier's file and `style.json`: a long conversation rereads its whole history at every step, and contact sheets make that history large fast.
- A worker needs little besides this Skill and `style.json`: the user's words, the look, the approved chapters to watch and read, the element library. Its brief adds the chapter, its pages, the step's inputs and outputs, what not to touch, any current user request, the preview URL (start one server for everyone) and a reply of a few lines. Start workers in the background and pass work on as soon as a step returns. Workers don't commit; the coordinator registers the chapter.
- Wherever a step names the previous or approved chapter as its model, a new book's first chapter (or a series' first episode) has none yet: use what the user agreed at intake (the pilot frames or sheet, the storyboard, `style.json`), the Skill's templates and the books on the shelf. The first chapter the user approves becomes the model from then on.
- A brief that only asks a worker to look gets skipped; name the commands to run and ask the reply to say what each showed.
- A shared kit (the episode's helpers, the film's pieces) is read-only for the workers: one that needs more asks the coordinator, so every part gets the fix.
- The chapter must reach the same bar as the book's approved chapters, in the same look, so it sits on the shelf beside them as one book.

## Before delivering

Check the reports against each other (an odd claim is worth one look at the file), confirm lint and the tests pass, and deliver the chapter URL with `?review`. If the user wants the cost and runs Claude Code, it is in the subagent transcripts (`subagents/agent-<id>.jsonl` under the session's folder in `~/.claude/projects/`: usage per assistant message, each message id counted once) plus your own session's usage.

## Workers in parallel

Several episodes or parts made at once each get their own git worktree, branch and preview port (one server per worker, serving its own worktree's `site/`, and that port in every `--url`). What trips them:

- `books/` and `content/` are git-ignored, so a worktree has neither. `lint.py` finds them in the main checkout by itself; for everything else, give the brief's paths into them absolute, and no worker creates them in its worktree.
- A shared file every worker appends to (one `img/SOURCES.md` for six episodes) conflicts at every merge. Give each worker its own (sources per episode, sizes per episode with `prep.py --art chNN-art.js`), joined once after the merge, and keep the shared files read-only for the workers.
- The brief is the only rule book: say each file name and each shared file's rule once, the same in the common brief and in each worker's go. One run named the pictures two different ways in two places, and both forbade and invited edits to the sources file.
- Workers that share one paid balance make their pictures before their voice: `paint.py` stops while an OpenRouter balance is under $1.00, and whoever voices first can lock the others out of pictures.
- Under load the machine is measured, not the page ([core/review.md](review.md#smoothness)): a loudness or timing that one worker reports under load is worth one more measurement before anyone acts on it.
