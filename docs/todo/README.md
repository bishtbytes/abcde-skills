# `docs/todo/` — parked work, with metadata

Each `*.md` here is one self-contained todo (see the `add-todo` skill). Every
todo carries a small **YAML frontmatter** block so the whole backlog can be
listed and filtered by status / priority / tag without opening each file — the
fast lookup we used to reach for a separate tool for, kept in-repo instead.

## Frontmatter schema

```yaml
---
status: ready            # ready | needs-discussion | blocked
category: tech-debt      # bug | feature | tech-debt | ux | spike | e2e
priority: medium         # high | medium | low
effort: M                # S | M | L   (rough size)
tags: [short-story, brainstorm]   # freeform area/subsystem tags
created: 2026-07-07       # YYYY-MM-DD
kind: task               # OPTIONAL — task (default) | index
parent: <index-slug>     # OPTIONAL — the index todo this belongs to
---
```

| Field | Meaning | Values |
|---|---|---|
| `status` | Where it sits in the pipeline | `ready` (buildable now), `needs-discussion` (open design questions / spike / investigation), `blocked` (waiting on ops, a provider, or another todo) |
| `category` | What *kind* of work it is | `bug`, `feature`, `tech-debt`, `ux`, `spike`, `e2e` |
| `priority` | What to reach for first | `high`, `medium`, `low` |
| `effort` | Rough size | `S`, `M`, `L` |
| `tags` | What *area* it touches (for filtering) | freeform list, e.g. `[short-story, r2, studio]` |
| `created` | When it was parked | `YYYY-MM-DD` |
| `kind` | Whether this is a normal todo or an **index** grouping several | `task` (default, omit) or `index` |
| `parent` | The index todo this belongs to (child backlink) | an index todo's slug, e.g. `online-video-architecture-index` |

`status` = the *readiness* axis; `category` = the *kind* axis; `tags` = the
*area* axis. Use `blocked` + a note in the body (or a `blocked-by:` line) when a
todo waits on another.

## Index todos (initiatives)

When several todos together achieve one larger work piece, a thin **index todo**
(`kind: index`, named `<initiative>-index.md`) links them — see the `add-todo`
skill. It carries only a goal + a linked, ordered list of its children; the
detail lives in the children, each of which backlinks with `parent:
<index-slug>`. In `INDEX.md` (and `/explore-todos`) index todos are surfaced in
a dedicated **Initiatives** section — each with its children nested beneath — and
are kept OUT of the status buckets and the open-todo count (they're meta, not
buildable work). Children still appear in their status bucket, marked `↳`.

## Listing & filtering

The frontmatter is the single source of truth. `scripts/todo-index.mjs` reads it:

```bash
# Regenerate the browsable INDEX.md (also done automatically on commit)
node scripts/todo-index.mjs

# Filtered lookups (AND-combined): status / category / priority / tag
node scripts/todo-index.mjs --list status:ready
node scripts/todo-index.mjs --list status:ready tag:short-story
node scripts/todo-index.mjs --list category:bug priority:high
```

Or use the **`/explore-todos`** skill, which wraps the same script.

## INDEX.md

[`INDEX.md`](./INDEX.md) is the auto-generated, GitHub-browsable snapshot —
grouped by status, sorted by priority. It's **regenerated automatically** when
any `docs/todo/*.md` is committed (a pre-commit hook), by `add-todo` when a
new todo lands, and whenever `/explore-todos` runs. Don't edit it by hand;
edit the todo's frontmatter and let it regenerate.
