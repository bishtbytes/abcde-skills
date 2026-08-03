---
name: brainstorm-todo
description: Use right after a todo is parked (by add-todo, or on any existing todo doc) to interrogate and RESOLVE its open questions — the scope choices, undecided options, edge cases, and behavior/contract calls that weren't settled when it was captured. Interviews the user relentlessly to resolve them, folds every answer back INTO the todo doc, then puts the resolved doc in front of a five-advisor council that reads it from five different angles and reports what's still missing — nothing is marked ready until that council clears it. Triggers on "/brainstorm-todo", "resolve the open questions", "grill me on this todo", "council this todo", and is auto-chained by add-todo when a freshly-parked todo still has unresolved questions. The B in the add → brainstorm → code → deliver flow; it closes gaps in an ALREADY-parked todo.
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

**Guard — nothing to resolve → skip to Step 4.** If the todo is already fully
specified and buildable (no open questions, scope drawn, decisions made), say so
plainly and skip the interview. Don't invent questions to justify a run — but
don't stop either: the council in Step 4 still runs, because it is the gate on
`ready` and "one reader found nothing" is exactly the judgment it exists to
check.

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
  leave a trimmed remainder if something is still genuinely blocked).

Don't dump the interview transcript — capture the *decisions and rationale*, in
the doc's existing structure.

**Do NOT flip the status here.** However complete the doc now looks, `ready` is
Step 4's call, not this step's.

## 4. Council review — the gate before `ready`

Nothing gets marked `ready` on one reader's judgment. Before the flip, the
resolved doc goes in front of five advisors who each read it from a different
angle, review each other's findings, and report what's still missing. Adapted
from Karpathy's LLM Council — the peer-review round is the part that matters.

Run it on the doc **as it stands after Step 3** — resolved, and implicitly
claiming to be buildable. That claim is what the council exists to contradict.
Running it any earlier is wasted: a freshly parked todo already announces its own
gaps, so the advisors would just re-list what's written on the page.

### 4a. Convene — five advisors, spawned in parallel

Spawn all five at once (one Agent call each, same message — sequential spawning
wastes time and lets one advisor's framing bleed into the next). Each gets the
full todo doc, the repo context it points at (`CLAUDE.md`, the specs and files it
names), and its own angle. Tell each one to lean **fully** into that angle and not
hedge or try to be balanced — the other four cover what it isn't covering, and
the balancing happens in 4c.

- **The Contrarian** — assumes the spec is not buildable as written and goes
  looking for the proof. Which step falls apart, which case is unhandled, where a
  builder gets stuck with no answer in the doc.
- **The First Principles Thinker** — ignores how the doc frames things and asks
  what problem this actually solves. Is this the right build, or a fix aimed at a
  symptom? Sometimes the most valuable finding is "the todo is solving the wrong
  thing."
- **The Expansionist** — hunts for what got scoped out that shouldn't have been.
  The miss that isn't a bug: a decision to leave something out that the doc never
  justified, or a half-feature that ships confusing.
- **The Outsider** — has zero context about this repo, this feature, or the
  conversation that produced the doc. Reacts only to what's on the page. Catches
  the curse of knowledge — everything obvious to the author and unexplained to
  the person who picks this up cold in three months.
- **The Executor** — only asks whether someone could start on this Monday
  morning. What is the literal first step, and does the doc actually supply it?

Each returns 150–300 words. No preamble, straight into the findings.

### 4b. Peer review — five reviewers, spawned in parallel

Collect the five responses and relabel them **A–E, shuffled** so the letters don't
track the order above. The anonymity is the whole point: a reviewer who knows who
said what defers to the angle it likes instead of judging the substance.

Spawn five reviewers. Each sees the todo doc and all five anonymized responses,
and answers three questions in under 200 words, referring to responses by letter:

1. Which response identifies the most important gap, and why?
2. Which response is weakest — which of its "gaps" is invented, already answered
   by the doc, or plainly out of scope?
3. What did all five miss?

**Question 2 is load-bearing.** It is what keeps this step honest with Step 1's
guard: a council with five advisors told to find problems will find problems.
Question 2 is how the invented ones get killed before they reach the user.

### 4c. Chairman — gaps, not answers

One final agent gets everything, de-anonymized: the doc, the five advisor
responses labelled with who said what, and the five peer reviews.

It does **not** produce a recommendation. This skill's contract is that *the user
decides*; the council's job is to find what is still undecided. A chairman that
answers its own questions turns brainstorm-todo into a rubber stamp.

Its output:

- **Blocking gaps** — what must be settled before this can be `ready`. State each
  as a decision the user has to make, with the real options and the trade-off
  between them. Not "consider error handling" — "on a partial failure, does it
  retry, skip, or abort the batch?"
- **Non-blocking notes** — worth knowing, doesn't hold up the flip. Fold into the
  doc as context, or drop.
- **Cleared** — the angles that came back with nothing real. Name them
  explicitly. A council that reports only problems is indistinguishable from one
  that was never run.

### 4d. Resolve, then flip

- **Blocking gaps → back to Step 2.** Interview on them, fold the answers in per
  Step 3.
- **Then re-run the council once, and stop.** Two rounds, hard cap. A third round
  is the council arguing with itself, not finding gaps.
- **No blocking gaps → flip** the frontmatter **`status: needs-discussion` →
  `ready`**.
- **A blocking gap that can't be resolved** (waiting on something external) keeps
  the status where it is; note in the doc what it waits on.

Report the verdict in chat — blocking, non-blocking, cleared. Don't write the
advisor responses or the reviews into the doc; they're scaffolding. Only the
*resolutions* land, via Step 3.

## 5. Commit + push (same rules as add-todo)

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
just written; run Steps 1–5 straight through. If `add-todo` already decided there
were no open questions, this skill isn't invoked at all — and no todo reaches
`ready` without Step 4, since that flip only ever happens inside this skill.
