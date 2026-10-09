# ABCDE Skills

**The ABCDE of agent-driven development.**

A six-skill **todo lifecycle** for [Claude Code](https://claude.com/claude-code) and [Codex](https://openai.com/codex/): park a task, sharpen it, build it in isolation, ship it as a reviewed PR, browse the backlog — and, when you'd rather not wait, fork the work to a second agent while you keep designing.

> **A**dd · **B**rainstorm · **C**ode · **D**eliver · **E**xplore · **F**ork

Todos aren't a scratch list here — they're **self-contained spec docs** that a fresh session (human or agent) can pick up cold, carry through an isolated worktree, gate, and land as a PR with the tests and feature specs kept in lockstep.

## The flow

| | Skill | What it does |
|---|---|---|
| **A** | `add-todo` | Parks a task as a self-contained todo doc (`docs/todo/<slug>.md`) with frontmatter (status/priority/effort/tags). Auto-chains to `brainstorm-todo` **only if open questions remain**. |
| **B** | `brainstorm-todo` | Interrogates a just-parked todo's unresolved decisions, folds the answers back into the doc, flips its status to `ready` when it's buildable. |
| **C** | `code-todo` | Builds a todo end-to-end: isolated worktree, a test/spec impact gate, implementation, quality gates, screenshot verification, and a PR — with the todo retired in the finishing commit. |
| **D** | `deliver-todo` | Merges the PR, tags the merge, tears down the worktree/branch, and pulls the base branch current. |
| **E** | `explore-todos` | Lists the parked todos grouped by status and sorted by priority; filter by status/category/priority/tag; optional staleness check against the code. |
| **F** | `fork-todo` | Forks the task under discussion to **another agent to build now** — captures it as a verified spec in a temp file (out of the repo, so it can't become stale backlog), hands over the path, and sets the collision rules so this session can keep designing while it runs. |

### Also included

Skills that aren't steps of the lifecycle and carry no letter:

| Skill | What it does |
|---|---|
| `gaps-todo` | Checks a change for what it forgot to touch: walks the project's cross-cutting rules (staleness, delete cascades, sync, …) and asks whether the new thing follows each one and whether existing features must change because of it; then sibling features, readers of changed data shapes, and the tests/specs that should move with it. Read-only — reports gaps with a recommendation. Runs standalone on a PR, and inside `code-todo` (plan + finished diff) and `deliver-todo` (before the merge). Expects a rules catalog — see CONVENTIONS.md "Cross-cutting rules". |
| `plain-language` | Rewrites the previous answer in plain everyday language with no analogies, then holds that register for the rest of the session. For when a design discussion has drifted into jargon and you want the thread readable again. |

## Install

**Via the [`skills` CLI](https://github.com/vercel-labs/skills)** (project-scoped, or add `-g` for global):

```bash
npx skills add bishtbytes/abcde-skills -a claude-code        # this project
npx skills add bishtbytes/abcde-skills -g -a claude-code     # global (~/.claude/skills)
npx skills add bishtbytes/abcde-skills --list                # preview first
```

**Via the Claude Code plugin marketplace** (same repo, native install):

```
/plugin marketplace add bishtbytes/abcde-skills
/plugin install abcde@abcde-skills
```

Then invoke `/add-todo`, `/code-todo`, etc. (Installed as a plugin, they're namespaced — `/abcde:add-todo`.)

**Via Codex** (installs the five skills into `~/.codex/skills`):

```bash
python3 "${CODEX_HOME:-$HOME/.codex}/skills/.system/skill-installer/scripts/install-skill-from-github.py" \
  --repo bishtbytes/abcde-skills \
  --path skills/add-todo \
  --path skills/brainstorm-todo \
  --path skills/code-todo \
  --path skills/deliver-todo \
  --path skills/explore-todos
```

Start a new Codex turn after installing. Codex invokes the skills from their descriptions; use a natural request such as “park this task” or “implement this todo.”

**Nothing lands in your repo.** The backlog indexer is **bundled with the skills**, so the only things that ever appear in your project are your own todo docs and the generated `docs/todo/INDEX.md`. No script or schema file to copy in.

### One optional step — adopt the conventions

The skills reference a few repo conventions (contract tests, temp-artifacts `zzz/`, branch/PR policy, quality gates) via your repository instructions. Merge them into `AGENTS.md` for Codex or `CLAUDE.md` for Claude Code:

```bash
cat path/to/abcde-skills/CONVENTIONS.md >> AGENTS.md   # then review/trim
```

Skip even that and the skills still function — they just point at conventions your repo may not have documented. See [`CONVENTIONS.md`](./CONVENTIONS.md).

## Prerequisites

### Required

| Requirement | Why | Setup |
|---|---|---|
| **GitHub + `gh`, signed in** | PRs, tags, gists | `brew install gh` → `gh auth login` (repo on GitHub) |
| **A `develop` branch** | worktrees + PRs target it | `git switch -c develop && git push -u origin develop` |
| **The [`capture`](https://github.com/bishtbytes/capture) skill** | `code-todo` screenshots + diagrams | `npx skills add bishtbytes/capture -g -a claude-code` |
| **A JS/TS toolchain** | the `code-todo` gates | `node` + `tsc` / `eslint` / `vitest` |
| **A Unix shell** | `lsof` / `curl` / `trash` | macOS or Linux (Windows → WSL) |

### Optional (degrades gracefully — skipped with a note if absent)

- **Repo scripts** — `scripts/start-dev.sh`, `scripts/debt-report.mjs`, `scripts/knip/ratchet.mjs`.
- **Repo conventions** — `docs/todo/`, `docs/features/`, `docs/diagrams/`, `CONTRACT:` tests, a pre-push hook, `zzz/`.
- **Backlog indexer** — bundled with the skills; nothing to install.

## Adopt the workflow, not just the skills

These skills are **opinionated** — a worktree per feature, todo docs as specs, living feature specs, `CONTRACT:` tests, gates before every push. Details at the top of each `SKILL.md` and in [`CONVENTIONS.md`](./CONVENTIONS.md); if your stack or branch model differs, fork and adapt.

## License

MIT — see [LICENSE](./LICENSE).
