---
name: gaps-todo
description: Check a change for GAPS — places it should have affected but didn't. Walks the project's cross-cutting rules (staleness, delete cascades, sync, generation gates, …) asking for each whether the NEW thing follows the rule and whether the change alters the rule for EXISTING features; then checks sibling features of the same kind, every reader of a changed data shape, the tests/specs/contracts that should move in lockstep, and the promised scope. Read-only: reports each finding as gap or fine-because, with a recommendation, and never fixes on its own. Runs standalone on a PR or branch ("/gaps-todo 1072", "/gaps-todo"), and is called by code-todo (on the plan before coding, and on the finished diff before the PR) and by deliver-todo (before the merge). Triggers on "/gaps-todo", "check this PR for gaps", "did we miss anything", "what else does this change affect".
---

# gaps-todo — what did this change forget to touch?

A feature's own code gets built. What gets missed is the OTHER feature that had
to change because of it: a new image kind that never learned the staleness rule,
or a new staleness rule that existing image kinds should now follow too. Tests
don't catch it (nobody wrote one for the place nobody thought of), and the
review doesn't either (the diff only shows what was touched). This skill looks
at what was NOT touched and asks whether it should have been.

**Read-only.** It never edits code, never runs generation, never comments on the
PR unless asked. It reports; the caller (or the user) decides.

## 1. The target

| Invoked as | Target |
|---|---|
| `/gaps-todo <PR#>` | `gh pr diff <#>` + `gh pr view <#> --json title,body,headRefName,files` |
| `/gaps-todo <branch>` / bare in a feature worktree | that branch's open PR if one exists, else `git diff develop...HEAD` |
| bare on `develop` with no PR | ask which PR or branch — never guess |
| from **code-todo Step 1** (plan mode) | the PLANNED change: the todo + the approach agreed so far. There is no diff yet, so reason from the plan |
| from **code-todo Step 4** / **deliver-todo** (diff mode) | the branch's finished diff + PR body |

Also load the **intent**: the PR body, and the todo it implements if any (a todo
retired in the diff: `git show <base>:docs/todo/<slug>.md`; or one the PR body
names). Intent is what the change promised; the diff is what it did.

## 2. Change facts

Before checking anything, write down — briefly, for yourself — what the change
actually is, as facts the rules can match against:

- **New things:** a new kind of asset / entity / registry, field, route, op,
  build step, job type, file, setting.
- **Changed rules:** a behavior that now works differently (what goes stale,
  what a delete removes, what blocks generation, what costs credits, what
  syncs, …).
- **Changed shapes:** a field gains values, one thing becomes several, a derived
  value becomes stored (or the reverse), a meaning shifts, a key is renamed.
- **Removed things.**

## 3. Walk the cross-cutting rules (the core check)

Load the project's **rules catalog**: the path named in the repository instructions'
(`AGENTS.md` / `CLAUDE.md`) "Cross-cutting rules" section, else `docs/features/cross-cutting-rules.md`. Each
rule lists its triggers, the siblings that already follow it, where it is
defined, and its classic miss.

For **every rule whose trigger matches a change fact**, answer both questions,
with evidence:

- **Q1 — does the new thing follow the rule?** e.g. the change adds a new kind
  of reference image: does it go stale when its inputs change, does a delete
  take it, does it sync, is it priced? Evidence = the file:line where it does,
  or the missing place where it should.
- **Q2 — does the change alter the rule for what already exists?** e.g. the
  change makes the global style an input to staleness: do the EXISTING
  reference kinds (the rule's siblings) now need to follow that too? Grep the
  siblings the rule lists; for each one the diff did not touch, say whether it
  must change.

A rule whose triggers don't match gets one line ("not triggered"). Never skip a
triggered rule because the change "obviously" doesn't affect it — say why.

**No catalog?** Say so in the report, derive the rules from the specs'
invariant sections (`docs/features/*.md`) and the `CONTRACT:` tests
(`grep -rn 'describe("CONTRACT:'`) for this run, and offer to create the
catalog afterwards.

## 4. Siblings of the same kind

Independent of the catalog: find the features that are the same KIND of thing
as what the change touched (another registry next to the one changed, another
build step, another image kind, another panel row) and ask whether the new
behavior belongs on them too — or breaks an assumption they rely on. Find them
by structure (`ls` the parent dir, the module next door, the other entries in
the same switch / union / registry list). A behavior that lands on one sibling
and not its twins needs a stated reason, or it is a gap.

## 5. Readers of a changed shape (ripple)

For every changed shape, grep every reader and editor of the OLD shape — types,
resolvers, routes, studio controls, chat ops, chips and labels, counts — and
give each a verdict: **updated** (in the diff), **still correct** (say why), or
**gap**. The classic miss: one full body became front / back / side, and the
frame's "Cast in this frame" picker still offered only portrait / full body —
no test or spec pointed at that modal.

## 6. Lockstep artifacts and scope

- **Tests:** new behavior has a test; changed behavior's assertions moved.
- **Contracts:** a rule the user agreed on has a `CONTRACT:` test; no CONTRACT
  test was weakened or deleted without the user's say-so.
- **Specs:** every `docs/features/` spec covering a touched area was updated —
  its invariants when a rule changed; the commit carries `Spec:` / `Test:`
  lines.
- **The rest, when the repo has them:** the REST `.http` collection for a
  changed route, the e2e spec for a changed user flow, a diagram whose picture
  the change falsifies.
- **Scope:** every item the todo or PR body promised is in the diff, or is
  listed under the PR's "Not done" section with the user's OK.

## 7. Verify before reporting

Every gap must survive a second look: open the cited place and confirm it
really does the old thing and really is reached. Drop anything you can't point
at — a vague "might also need updating" is noise, and noise trains people to
skip this report. For a large change, fan out one subagent per rule group and
verify their findings yourself before reporting.

## 8. Report

Lead with the count, then the gaps, most serious first. Each gap:

- **What's missing** — in plain words, one sentence.
- **Where** — the file:line link of the untouched place.
- **Why it matters** — the concrete wrong outcome (the user sees X, data Y is
  lost, Z gets charged twice).
- **Recommend:** **fix in this PR** or **follow-up todo**, and why.

Recommend **fix in this PR** when the gap gives wrong behavior on a path the
change ships (wrong data, lost work, wrong spend, a broken contract, a control
that now lies). Recommend **follow-up** when the shipped path is right and the
gap is an edge that can't happen yet, a sibling the change doesn't reach today,
or polish.

Then one compact list of what was checked and found **fine**, each with its
because — so the user can see the rule was considered, not forgotten. Keep it
short; no file dumps.

## 9. What happens next (depends on who called)

- **Standalone:** ask, per gap or as a batch, whether to fix it in this PR or
  park it as a follow-up todo (`add-todo`) — stating your recommendation. Do
  nothing until they answer.
- **code-todo, plan mode (Step 1):** every gap becomes a scope item at the
  go-ahead gate — build it, or put it to the user as "not this run" with a
  destination. Nothing is silently left out.
- **code-todo, diff mode (Step 4):** a gap inside the agreed scope gets fixed
  before the PR. One outside it goes in the PR body under `## Gaps` with its
  recommendation, and is parked as a todo.
- **deliver-todo (before merge):** put the choice to the user — **merge now and
  take the gaps as a follow-up**, or **fix them on this branch first** — with
  your recommendation and its reason. Merge only on their answer.

## 10. Keep the catalog learning

When a gap is found that the catalog didn't prompt for — here, or reported by
the user after a merge — add the rule (or sharpen its trigger / siblings /
classic miss) in the catalog, in the same fix. A miss that doesn't change the
catalog will be missed again.
