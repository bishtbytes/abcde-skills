---
name: add-todo
description: Use when parking a task or future work as a self-contained todo doc in the repo for later cold pickup. Triggers on "park this", "add to todo", "save this for later", "/add-todo".
---

Write a self-contained todo document capturing a parked task or future work so
it can be picked up cold later — no conversation context required. Save it into
`docs/todo/` in the current repo (create the dir if missing; fall back to the
nearest `docs/` dir). This is the opposite of a session handoff: it lives in the
codebase and a reader with zero context months later should be able to start.

Name the file with a descriptive kebab-case slug (e.g.
`beat-to-frame-rename-migration.md`).

## Frontmatter (required — it's what makes the backlog listable)

Begin the doc with a YAML frontmatter block so it can be listed/filtered by
status, priority, and tag without opening it (the block below **is** the schema —
fields + allowed values):

```yaml
---
status: ready            # ready | needs-discussion | blocked
category: feature        # bug | feature | tech-debt | ux | spike | e2e
priority: medium         # high | medium | low
effort: M                # S | M | L  (rough size)
tags: [short-story, r2]  # freeform area/subsystem tags
created: <YYYY-MM-DD>     # today's date
kind: task               # OPTIONAL — task (default) | index  (see "Index todos")
parent: <index-slug>     # OPTIONAL — the index todo this belongs to (backlink)
---
```

Choose values from the task itself: `status` is `needs-discussion` for a
discussion/spike opener with no decided direction, `blocked` when it waits on ops
/ a provider / another todo, else `ready`. Infer `category`, `priority`, `effort`
and a couple of area `tags` from the work; default `priority: medium` when
genuinely unsure. Use the real current date for `created` — do NOT hardcode a
stale one. Omit `kind` (defaults to `task`) and `parent` unless the todo is part
of an indexed initiative (see **Index todos** below).

Then the body — make it self-contained. Cover, scaled to the task:
- **Problem / why** — what and why, in a sentence or two.
- **Scope & decisions already made** — what's in, what's out, and any choice
  the user already settled (so it isn't re-litigated).
- **Behavior changes** — what user-visible or contract behavior will be
  DIFFERENT after this ships, stated as before → after ("today attaching a
  photo locks the face; after, identity edits always win"). "None (pure
  refactor / internal)" is a valid answer — say it explicitly.
- **Affected feature specs & contracts** — name the `docs/features/<slug>.md`
  file(s) this touches and quote any contract/invariant the work brushes
  against (their `invariants` sections). If no spec covers the area, note
  "no spec — consider creating one".
- **Constraints & risks** — the non-obvious traps (data contracts, back-compat,
  ordering).
- **File / area inventory** — concrete paths and a re-runnable search command,
  since counts drift.
- **Sequencing & verification** — the order to do it in and how to know it's done.

Do not duplicate content already in other artifacts (specs, plans, PRDs,
commits) — reference them by path. Capture decisions and rationale, not the chat
transcript. Match the format of existing docs in the target dir.

## Index todos (grouping a multi-todo initiative)

When several todos together achieve one larger work piece (an epic / initiative),
create a thin **index todo** that links them — a table of contents with a little
glue, NOT another detailed doc. Reach for it when work spans multiple todos, or
when a new todo clearly belongs to an initiative that already has an index.

An index todo:

- Is marked **`kind: index`** in frontmatter (regular todos are `kind: task`, the
  default) — that marker is what lets the backlog tooling tell an index apart
  from a normal todo. Its other frontmatter (`status` / `priority` / `tags` /
  `created`) describes the initiative as a whole; `category` / `effort` are
  optional on an index. It carries **no `parent`** (an index is the top).
- Is named **`<initiative>-index.md`** (e.g. `online-video-architecture-index.md`)
  — obvious at a glance.
- Holds ONLY: a 1–2 sentence **goal**, and a **linked, ordered list of the child
  todos** — each `[[child-slug]]` + a one-line what + its status — plus overall
  status at a glance. **Nothing else** — no Problem / Scope / Behavior / Inventory
  / Sequencing sections; that detail lives in the children. If you're tempted to
  explain a child in the index, that text belongs in the child, not here.

Each child todo **backlinks** with `parent: <index-slug>` in its frontmatter, so
a reader of the child sees the bigger picture and the tooling can group them.

**Create vs update.** No index yet for the initiative → create the index todo and
set `parent:` on each child. Index already exists → just append the new child's
`[[link]]` to the index's list (keep it thin) and set the new child's `parent:`.
Editing an index todo, or adding a `parent:` backlink to a child, is a docs-only
change — commit + push it the same way as any todo (below), staging **every**
touched doc (the index + any child whose `parent:` you set) with explicit
pathspecs.

Commit the doc, then **push it immediately** — this **overrides the global
"don't push" Push Rule**, because todo docs are meant to land on `develop` right
away so other sessions and checkouts pick them up. Two hard rules:

- **Only the todo doc(s) — nothing else.** Stage with explicit pathspecs
  (`git add docs/todo/<slug>.md`); for an indexed initiative add the index todo
  and any child whose `parent:` you set (`git add docs/todo/<initiative>-index.md
  docs/todo/<child>.md`). Never `git add -A` / `git commit -a`. The working tree
  often carries unrelated in-progress edits (authoring files, logs) that must NOT
  ride along. (There's no generated index to stage — the backlog view is printed
  on demand, not a committed file.)
- **`git push --no-verify origin develop`** — it's a docs-only change, so skip
  the pre-push gates. (`develop` is the integration branch; a direct push is
  allowed by repo policy.) If the push is rejected as non-fast-forward (someone
  pushed meanwhile), pull `develop` first — preserving any uncommitted work per
  the repo's git-sync hygiene — then re-push.

If the user passed arguments, treat them as the task title/focus and tailor the
doc accordingly.

## After writing: ALWAYS run the gap check (chain to brainstorm-todo)

**Do NOT gate this on your own "looks complete" judgment.** The author of a
freshly-parked todo is the worst judge of whether it's actually done — a
self-assessment right after writing reliably misses the vague spots ("a TTL",
"somehow", "optionally"), the hand-waved failure modes, and the implicit scope
calls. A *fresh adversarial re-read* catches what the vibe-check glosses, so make
the check unconditional.

Once the doc is written **and pushed**, ALWAYS hand off to the `brainstorm-todo`
skill on the just-written todo — announce "Parked — running the brainstorm gap
check" and invoke it. brainstorm-todo does the fresh re-read: it enumerates every
loosely-specified or implicit decision (not just lines you explicitly flagged
"open"), resolves what it can by exploring the codebase, and interviews the user
only on the genuine judgment calls. Its own guard handles the already-complete
case — if the fresh pass truly finds nothing, it says so and stops (it will not
invent questions). So:

- **Hidden gaps (the common case)** → brainstorm finds them, fills what the code
  answers, asks the user only the real calls, folds resolutions back in, flips
  `status` to `ready`, re-pushes.
- **Genuinely complete** → brainstorm re-reads, finds nothing, stops cheaply.

The check ALWAYS runs; the *interview* only happens when there's something real.
(The one exception: if the user has explicitly said to defer a question — "leave
that for now" — honor that; the fresh pass still runs, but you don't press the
deferred call.) This is the A→B hand-off in the add → brainstorm → code → deliver
flow.
