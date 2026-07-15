---
name: brainstorm-todo
description: Use right after a todo is parked (by add-todo, or on any existing todo doc) to interrogate and RESOLVE its open questions — the scope choices, undecided options, edge cases, and behavior/contract calls that weren't settled when it was captured. Interviews the user relentlessly to resolve them, folds every answer back INTO the todo doc, flips its status when it becomes buildable, and re-pushes. Triggers on "/brainstorm-todo", "resolve the open questions", "grill me on this todo", and is auto-chained by add-todo when a freshly-parked todo still has unresolved questions. The B in the add → brainstorm → code → deliver flow; it closes gaps in an ALREADY-parked todo.
---

# brainstorm-todo — resolve a parked todo's open questions

A todo captured by `add-todo` is often half-baked on purpose: written fast, with
scope choices, weighed-but-unpicked options, unhandled edge cases, or
behavior/contract calls left open ("Decision NOT yet made", an open-questions
list, "TBD"). This skill closes those gaps by interviewing you, then writes the
resolutions back into the doc so the next reader — or `code-todo` — picks up a
settled spec, not a question pile.

Runs **on one target todo** — the one `add-todo` just wrote (auto-chain), or a
`docs/todo/<slug>.md` you name.

## 1. Read the todo and find the gaps

Read the target `docs/todo/<slug>.md` in full. Enumerate every UNRESOLVED
decision it carries:

- explicit **open questions** / "TBD" / "Decision NOT yet made" lines,
- **options weighed but not chosen** (a list of approaches with no pick),
- **scope ambiguity** — what's in vs. out not fully drawn,
- **behavior / contract calls** left open (what changes for the user; which
  invariant it touches),
- **edge cases / failure modes** the doc names but doesn't answer,
- anything the "Scope & decisions already made" section leaves implicit.

**Guard — nothing to resolve → stop.** If the todo is already fully specified and
buildable (no open questions, scope drawn, decisions made), say so plainly and do
nothing else. Don't invent questions to justify a run.

## 2. Interview to resolve

Interview the user relentlessly about the gaps found — one branch of the decision
tree at a time, resolving dependencies between decisions in order — until every
gap from Step 1 is a settled decision, not a maybe. Two rules:

- **If a question can be answered by exploring the codebase, explore instead of
  asking** — reserve the user's attention for genuine judgment calls.
- Group related questions; don't fire them one-per-message if a batch reads
  cleanly. Surface the trade-offs you see so the user decides from a real menu,
  not a blank prompt.

## 3. Fold the answers back INTO the todo doc

Every resolution updates the SAME `docs/todo/<slug>.md` — this is the deliverable,
not a chat log:

- move settled calls into **Scope & decisions already made** (with the *why*, so
  they aren't re-litigated),
- fill in **Behavior changes** (before → after) and **Affected feature specs &
  contracts** now that they're decided,
- **remove** the open-questions / "Decision NOT yet made" lines they answered (or
  leave a trimmed remainder if something is still genuinely blocked),
- if the todo is now fully specified and buildable, flip its frontmatter
  **`status: needs-discussion` → `ready`**; if a blocker remains, keep the status
  and note what it waits on.

Don't dump the interview transcript — capture the *decisions and rationale*, in
the doc's existing structure.

## 4. Commit + push (same rules as add-todo)

Docs-only change → land it on `develop` immediately so other sessions pick it up:

- Stage with **explicit pathspecs** only: `git add docs/todo/<slug>.md` (add the
  index todo too if you touched a `parent:`). Never `git add -A`. (No generated
  index to stage — the backlog view is printed on demand, not committed.)
- `git push --no-verify origin develop`. If rejected non-fast-forward, pull
  `develop` first (preserving uncommitted work per the repo's git-sync hygiene),
  then re-push.

This **overrides the global "don't push" Push Rule** — todo docs are meant to land
on `develop` right away.

## When auto-chained by add-todo

`add-todo` invokes this automatically **only when the freshly-parked todo still
has open questions** (see its final step). In that case the target is the todo
just written; run Steps 1–4 straight through. If `add-todo` already decided there
were no open questions, this skill isn't invoked at all.
