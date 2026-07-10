# ABCDE Skills

A five-skill **todo lifecycle** for [Claude Code](https://claude.com/claude-code): park a task, sharpen it, build it in isolation, ship it as a reviewed PR, and browse the backlog — each stage its own skill.

> **A**dd · **B**rainstorm · **C**ode · **D**eliver · **E**xplore

Todos aren't a scratch list here — they're **self-contained spec docs** that a fresh session (human or agent) can pick up cold, carry through an isolated worktree, gate, and land as a PR with the tests and feature specs kept in lockstep.

## The flow

| | Skill | What it does |
|---|---|---|
| **A** | `add-todo` | Parks a task as a self-contained todo doc (`docs/todo/<slug>.md`) with frontmatter (status/priority/effort/tags). Auto-chains to `brainstorm-todo` **only if open questions remain**. |
| **B** | `brainstorm-todo` | Interrogates a just-parked todo's unresolved decisions, folds the answers back into the doc, flips its status to `ready` when it's buildable. |
| **C** | `code-todo` | Builds a todo end-to-end: isolated worktree, a test/spec impact gate, implementation, quality gates, screenshot verification, and a PR — with the todo retired in the finishing commit. |
| **D** | `deliver-todo` | Merges the PR, tags the merge, tears down the worktree/branch, and pulls the base branch current. |
| **E** | `explore-todos` | Lists the parked todos grouped by status and sorted by priority; filter by status/category/priority/tag; optional staleness check against the code. |

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

## What this assumes (adopt the workflow, not just the skills)

These skills are **opinionated** — they encode a specific shipping discipline, not a generic todo list. Installing them means adopting that workflow. They assume a repo that uses:

- A **`develop` integration branch**, with feature work in **git worktrees** and PRs opened against `develop` (only `main` protected, changed via a `develop → main` release PR).
- A **`docs/todo/`** backlog of frontmatter'd todo docs, and **`docs/features/`** living feature specs kept in lockstep with the code.
- Behavioral **CONTRACT tests** (a `describe("CONTRACT: …")` convention) asserting agreed invariants.
- A JS/TS stack with **quality gates** — a `tsc` ratchet, an import/architecture check, and a test suite — run before a push.
- A gitignored **`zzz/`** scratch dir for verification artifacts (screenshots, etc.).

Where a skill touches a truly repo-local helper (e.g. a `scripts/todo-index.mjs` backlog indexer, or a `docs/todo/README.md` frontmatter schema), it **degrades gracefully** if that file is absent — so the skills work in a plain repo too, just with fewer niceties.

If your stack or branch model differs, fork and adapt — the skills are readable Markdown; the conventions live at the top of each `SKILL.md`.

## Optional: the backlog index

`explore-todos` (and the `INDEX.md` refresh in `add-todo` / `brainstorm-todo`) get richer when your repo has a small, dependency-free indexer — included here so you can drop it straight in:

- **`scripts/todo-index.mjs`** — scans `docs/todo/*.md` frontmatter and either writes a grouped `docs/todo/INDEX.md` or prints a filtered table (`--list status:ready tag:foo …`). **Node builtins only, no `npm install`.**
- **`docs/todo/README.md`** — the frontmatter schema (`status` / `category` / `priority` / `effort` / `tags` / `created`, plus `kind` / `parent` for initiatives).

`npx skills add` installs the **skills**, not these repo files — so copy them into your project once:

```bash
mkdir -p scripts docs/todo
cp path/to/abcde-skills/scripts/todo-index.mjs scripts/
cp path/to/abcde-skills/docs/todo/README.md docs/todo/
node scripts/todo-index.mjs        # writes docs/todo/INDEX.md
```

Optionally wire `node scripts/todo-index.mjs` into a pre-commit hook so `INDEX.md` stays fresh. **Skip this entirely and the skills still work** — they detect the absent script and fall back to reading `docs/todo/*.md` directly.

## License

MIT — see [LICENSE](./LICENSE).
