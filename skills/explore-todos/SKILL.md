---
name: explore-todos
description: Use when the user wants an overview of the parked todos in the repo — grouped by status (ready / needs-discussion / blocked) and sorted by priority, and filterable by status, category, priority, or tag (reads each todo's frontmatter via scripts/todo-index.mjs). Triggers on "list the todos", "todo buckets", "show todos by category/status/tag", "what's ready to work on", "/explore-todos".
---

List the parked todo docs in the current repo's `docs/todo/` and present them
grouped and filtered by their frontmatter (status / category / priority / tag).
This is a read-only summary — do NOT implement, edit, delete, or push anything.

## Gather (from frontmatter — the source of truth)

Each todo carries a YAML frontmatter block (schema: `docs/todo/README.md`), and
`scripts/todo-index.mjs` reads it. Use the script — do NOT hand-infer categories:

1. **Refresh the committed index** so `docs/todo/INDEX.md` reflects the current
   frontmatter (read-only side effect; regenerates a generated file only):
   ```bash
   node scripts/todo-index.mjs
   ```
2. **Get the view** — full, or filtered by whatever the user asked for. Filters
   are `status:` / `category:` / `priority:` / `tag:` / `kind:` / `parent:`,
   AND-combined:
   ```bash
   node scripts/todo-index.mjs --list                       # everything, grouped
   node scripts/todo-index.mjs --list status:ready          # buildable now
   node scripts/todo-index.mjs --list status:ready tag:short-story
   node scripts/todo-index.mjs --list category:bug priority:high
   node scripts/todo-index.mjs --list kind:index            # just the initiatives
   node scripts/todo-index.mjs --list parent:online-video-architecture-index  # one initiative's children
   ```
   With no filter, `docs/todo/INDEX.md` already holds the full view — the
   **Initiatives** section (each `kind: index` todo with its children nested
   beneath) followed by the grouped-by-status, sorted-by-priority buckets — so you
   can just read + present it.

If the user named a status/tag/category/priority in their request, pass it as a
filter. Otherwise present the full grouped view.

**Fallback (repo hasn't adopted the schema):** if there's no
`scripts/todo-index.mjs` / `docs/todo/README.md`, the todos have no frontmatter —
fall back to listing `docs/todo/*.md` and bucketing each by intent inferred from
its title + status line (UX, tech-debt, feature, spike/discussion, bug, e2e),
and mention that adding frontmatter would make this exact.

## Present

Lead with the total count and the by-status breakdown (ready / needs-discussion
/ blocked). If any **initiatives** exist (`kind: index` todos), present the
**Initiatives** section FIRST — each index todo with its child todos nested
beneath (title · status · priority) — so the multi-todo efforts read as a tree
before the flat buckets. Then the by-status table(s) the script produced —
grouped by status, sorted by priority, one row per todo (priority · effort ·
category · title · tags). Note that index todos are kept OUT of the status
buckets and the open-todo count (they're meta, not buildable work); their
children still appear in the buckets, marked `↳`. If the user asked for a filter,
show just that slice and say what was filtered. Close with any judgment calls
worth flagging (items whose `status` looks stale, e.g. a `ready` doc that reads
as already shipped, an initiative whose children are all done, or anything
mis-tagged). Offer to re-filter or to fix a todo's frontmatter — but take no
destructive action without an explicit go-ahead.

After presenting the listing, **ask the user whether they want a staleness
check** — i.e. verifying each todo against the actual codebase to find any that
are already implemented (in whole or in part) and could be retired. Don't run it
unprompted; it's a heavier pass. Only if the user says yes, go through each
todo, confirm its claimed scope against the current code (read the relevant
files / git history named in the doc), and report which are already done, which
are partially done (with what remains), and which are still genuinely open.
Still take no destructive action — deleting a now-spent doc needs an explicit
go-ahead.

If `docs/todo/` is empty or missing, say so plainly.
