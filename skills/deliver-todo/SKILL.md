---
name: deliver-todo
description: Use when a feature branch's work is done and the user wants it merged to develop via its PR, then tagged (pr-<NUM>-<slug>, marking when the PR merged and what it was about) and the worktree + branch fully cleaned up (local AND origin) and local develop pulled. The closer counterpart to code-todo. After the merge it also offers (only on an explicit yes) a follow-up tech-debt PR that chips at the debt on the just-merged feature's touched files — this is the one place tech-debt cleanup runs, now removed from code-todo. Triggers on "/deliver-todo", "close this out", "finish and clean up", "merge and clean up the branch". DISTINCT from worktree-end, which does a LOCAL ff-merge with no PR, no origin-branch delete, and no develop pull.
argument-hint: "(optional) the branch/PR to close — defaults to the current worktree's branch"
---

# deliver-todo — merge the PR to develop, then clean up

Closes out an code-todo-style feature: push any local commits, merge the
branch's PR into `develop` (no squash), kill the persistent review dev server
`code-todo` left running in the worktree, and tear down the worktree +
branch on local and origin, leaving local `develop` current. Lists the commits
that landed, then — optionally, and only if you say yes — opens a follow-up
**tech-debt PR** that chips at the debt on the files the merged feature touched.

## Iron prerequisite (the safety guard)

**Never delete a branch whose commits aren't on `origin/develop`.** Cleanup only
runs once the work is provably merged. The skill MERGES the PR to get it there;
it does NOT delete unmerged work. If it can't confirm the merge, it STOPS.

`main` is protected — this skill only ever targets `develop`. Never run it from,
or delete, `develop`/`main`.

## Procedure

1. **Identify the target.** `branch = git rev-parse --abbrev-ref HEAD` (or the
   passed arg); `wt = current worktree path`; base = `develop`. If `branch` is
   `develop`/`main` → STOP ("nothing to close — run this from the feature
   worktree"). Note the main checkout path (`git worktree list`, the non-bare
   non-`.worktrees`/`.claude/worktrees` entry).

2. **Push unpushed commits.** `git push -u origin <branch>`. This runs the
   pre-push hook (full suite). If it FAILS → STOP and report (don't merge with
   red gates). Capture the pushed commit list for the final summary.

3. **Get the work onto develop (merge the PR):**
   - `gh pr view <branch> --json number,state,mergeable,mergeStateStatus`.
   - **Spec-sync nudge** (only when the repo has `docs/features/`; otherwise
     skip silently, keeping the skill portable). From the PR's touched paths
     (`gh pr diff <#> --name-only`), check whether any code file falls in an
     area a `docs/features/` spec documents (map areas → specs via
     `docs/features/README.md`'s index) while the diff touches NO
     `docs/features/` file. If so, ASK before merging: "code changed in a
     documented feature area (`<spec>.md`) but the spec wasn't touched —
     intended?" Yes → proceed; no → hold the merge so the spec can land on
     the branch first. A nudge, never a hard block — and skip the ask when
     the PR is docs-only or already MERGED.
   - **OPEN + mergeable** → `gh pr merge <#> --merge` (merge commit — **no
     squash, no rebase**).
   - **OPEN + not mergeable** (conflicts / failing checks / changes requested) →
     STOP, report why (don't merge, don't clean up).
   - **MERGED** → proceed.
   - **No PR**: if `git merge-base --is-ancestor <branch> origin/develop` (after
     `git fetch origin develop`) → already on develop, proceed; else → STOP
     ("no PR and not on develop — nothing safe to close").

   **Tag the merge.** Once the work is on develop (any path above), record it
   with an annotated, pushed tag — a durable marker of when each PR landed and
   what it was about. Name: `pr-<NUM>-<slug>`, where `<NUM>` is the PR number and
   `<slug>` is the branch with its `type/` prefix stripped
   (`feat/unify-audio-hash` → `unify-audio-hash`). Tag the **merge commit**, not
   whatever HEAD happens to be:
   ```bash
   num=$(gh pr view <branch> --json number -q .number 2>/dev/null)
   if [ -n "$num" ]; then
     title=$(gh pr view <branch> --json title -q .title)
     sha=$(gh pr view <branch> --json mergeCommit -q .mergeCommit.oid)
     slug=${branch#*/}                       # strip feat//fix/ prefix; no slash in tags
     tag="pr-$num-$slug"
     # idempotent: skip the create if it already exists (re-run / already-MERGED path)
     git -C <main> rev-parse -q --verify "refs/tags/$tag" >/dev/null \
       || git -C <main> tag -a "$tag" "$sha" -m "PR #$num: $title

Merged to develop on $(date +%F)
$sha"
     git -C <main> push origin "$tag"        # tolerate "already exists"
   fi
   ```
   The annotated tag carries its own date, so later you get newest-first merge
   history with `git tag --sort=-creatordate -l 'pr-*'` and titles with
   `git tag -n10 -l 'pr-*'`. This is a non-blocking nicety: the No-PR
   already-on-develop path (no number) is skipped by the guard, and a tag/push
   failure must be logged and shrugged off — never let it block the cleanup in
   steps 4–9. Leave the milestone `v*` tags alone; they're a separate axis.

4. **SAFETY GUARD — re-verify before any deletion.** `git fetch origin develop`
   then `git merge-base --is-ancestor <branch> origin/develop`. If it returns
   non-zero → ABORT (commits not on develop; never delete). Everything below is
   gated on this passing.

5. **Worktree cleanliness + kill the review server.** First, kill the persistent
   dev server `code-todo` left running in the worktree (it records the port
   in `<wt>/zzz/dev-server.json`). Kill by PORT — robust against `next dev`
   forking a child PID, and tolerant of a missing file / already-dead server / no
   server at all (projects without `scripts/start-dev.sh` never started one):
   ```bash
   port=$(node -e "process.stdout.write(String(require('<wt>/zzz/dev-server.json').port||''))" 2>/dev/null)
   [ -n "$port" ] && lsof -tiTCP:$port -sTCP:LISTEN | xargs -r kill
   ```
   Then `git status --short` in the worktree — if there are real
   uncommitted/modified TRACKED files or non-ignored untracked files → STOP /
   confirm with the user before removing (gitignored `node_modules`, `zzz/` etc.
   are fine to discard).

6. **Exit + remove the worktree.** If the session is IN the worktree:
   `ExitWorktree` with `keep` (returns to the main checkout). Then
   `git -C <main> worktree remove --force <wt>`. Tolerate "already removed".

7. **Delete the branch — local + origin.**
   - `git -C <main> branch -D <branch>` (`-D`: it's merged via the PR, which may
     not be in the *local* develop's history yet).
   - `git -C <main> push origin --delete <branch>` — tolerate "remote ref does
     not exist" (GitHub auto-deletes on merge for some repos).

8. **Pull develop (FF-only).** `git -C <main> fetch origin develop`. Then:
   - If the main checkout is **on** `develop`: if its tree is dirty,
     `git stash push --include-untracked` first (preserve user work), then
     `git -C <main> merge --ff-only origin/develop`, then `git stash pop`.
     `fetch origin develop:develop` REFUSES while develop is checked out — don't
     use it in this case.
   - Else (develop not checked out anywhere): `git -C <main> fetch origin
     develop:develop` (fast-forwards the local ref).

9. **Report the work summary.** List the commits that landed on develop from this
   branch (the pushed set from step 2, or `git log --oneline <merge-base>..<tip>`)
   so the user sees exactly what shipped. Confirm: PR # merged, worktree removed,
   branch gone (local + origin), local develop at `<sha>`.

## 10. Tech-debt follow-up PR (optional — always ask first)

Tech-debt cleanup lives HERE, not in code-todo: now that the feature is
merged, chip at the debt on the **files this feature just touched**
(Clean-as-You-Code), as a separate follow-up PR. This is gated on an explicit
user "yes" — never spawn or branch without it. The close in steps 1–9 has already
succeeded; this is a bonus, so a decline costs nothing.

1. **Find the candidates.** Derive the just-merged feature's touched files from
   the merged range (`git -C <main> diff --name-only <merge-base>..<merged-tip>`
   — the commits are on develop even though the branch is gone). Then, **only if
   the repo ships the scanner** (`scripts/debt-report.mjs`; skip this whole phase
   silently if absent, so the skill stays portable), rank that surface:
   ```bash
   node scripts/debt-report.mjs --paths <touched files> --top 10 --json
   ```
   It scores each file/folder by hotspot (severity × recent churn) against the
   betterer baselines (file-size / complexity / layer-boundary) AND — when knip is
   wired — each file's unused exports/types, so "delete N unused exports" shows up
   as a ranked increment on the touched surface.

   **Whole-repo dead-code delta (only if `scripts/knip/ratchet.mjs` ships; skip
   silently otherwise).** Touched-file ranking above is blind to the commonest
   dead code a feature creates: an export goes dead because the feature deleted
   its *last consumer* in a DIFFERENT file. Catch it by running the ratchet
   whole-repo from `<main>` on develop now that the merge has landed:
   ```bash
   node scripts/knip/ratchet.mjs --check   # fails + lists NEW dead exports/types vs baseline
   ```
   Any entries it prints are symbols this feature orphaned *anywhere* in the tree
   — fold them into the proposal below as their own increment ("this PR left
   `<name>` dead in `<file>` — delete"). (A plain `node scripts/knip/ratchet.mjs`
   run also auto-lowers the baseline when the feature REMOVED dead code — commit
   the lowered `scripts/knip/baseline.json` with the tech-debt PR.)

2. **Judge the touched surface against the refactoring rubric (subagent).** The
   scanner in step 1 sees SIZE + churn only; it can't see DESIGN debt — a 300-line
   function doing six things, logic tangled with I/O, a god-object prop bag, a
   deeply-nested closure buried in the render. So spawn ONE subagent to READ the
   touched code files and judge them against the rubric below, returning concrete,
   principle-cited findings. This is the signal for **WHAT** to fix; the scanner
   only ranks **WHERE** it hurts. Skip only when no code files were touched.

   Hand the subagent the touched-file list + this rubric verbatim, and require
   **structured findings**, most-severe first — each:
   `{ file, principle, severity (high|med|low), what (the smell + its exact
   location, e.g. the function/block name + line), fix (the concrete extraction /
   split), residual (projected file size + what's still oversized after) }`.

   **Refactoring rubric — universal, no framework/repo specifics** (judge every
   file against these; the subagent cites only the ones a file actually violates):
   - **Single responsibility** — a unit has ONE reason to change; a function or
     module doing N unrelated things is N units in a trenchcoat → split.
   - **Size is the pointer, not the disease** — a long function / oversized file is
     usually several responsibilities fused. Name the specific offending
     function/block and the seam, never just "the file is big".
   - **Functional core, imperative shell** — pure logic (decisions, data-shaping,
     formatting) lives in pure, testable functions, separated from I/O (network,
     disk, DB, DOM, framework lifecycle).
   - **Cohesion & coupling** — things that change together belong together; a wide
     parameter list or a god-object threaded everywhere is a missing abstraction.
   - **Dependency direction** — dependencies point one way (toward stable / lower
     layers); lower layers never reach up into higher ones.
   - **Readable control flow** — early returns over deep nesting; no logic-bearing
     closures buried inside other expressions (callbacks, IIFEs, template/JSX).
   - **Name honestly; don't repeat** — names state intent; duplicated knowledge
     gets one home (within reason — a little duplication beats a wrong abstraction).
   - **Handle failure at the seams** — errors handled at boundaries, not swallowed
     mid-logic.
   - **A new capability is a new module behind a seam** — never a bigger file or a
     new prefix-sibling bolted onto an already-large unit.

3. **Propose a bounded batch and ASK.** Cross the judge's findings (WHAT) with the
   scanner's hotspot rank (WHERE) and present the top 1–3 increments — each:
   - **naming the specific unit** to extract (the function / closure / block /
     inline data structure), NOT "a cohesive cluster" — e.g. *"extract the 300-line
     `renderRow` closure into `ChecklistRow`"*, not *"extract something from
     OutlineChecklist"*;
   - stating the **projected residual** — the file's size + any unit still over
     target AFTER the slice (*"→ 253 lines, no unit >400 left"*). A slice that
     leaves the file's LARGEST unit / worst smell in place is **not** the primary
     increment — never propose extracting a peripheral, already-clean chunk to
     dodge the hard one (that's the trap: it moves lines without removing the debt);
   - behavior-preserving (a `git mv` / extract / split / simplify) — the next
     coherent slice toward the target structure, NOT "fully fix it".

   Then STOP and ask whether to build it. Nothing in scope / no code touched / user
   declines → say so; you're done.

4. **Build it (only on yes).** Build in an **isolated worktree off develop**
   (like code-todo — isolation; never build in the main checkout, whose running
   dev server / uncommitted work you'd otherwise risk), set up via
   `./scripts/start-dev.sh`:
   ```bash
   git worktree add .worktrees/<slug>-techdebt -b feat/<slug>-techdebt develop
   # … apply each increment: behavior-preserving git mv / extract / simplify,
   #    ONE reviewable slice per file/folder, no logic changes riding along …
   ```
   Gates from the worktree: the live push gates (tsc ratchet + `pnpm arch` +
   `vitest run`).

   **`.betterer.results` is the ONE depth-sensitive artifact — the sole reason
   this step ever wanted the main checkout.** `pnpm betterer` serializes
   cwd-relative paths, so regenerating it from a deeper worktree dir MANGLES the
   file (symptom: `/`-in-strings rewritten to stacked `../../..`, depth = cwd
   depth) and CI / the main checkout then won't match it (the worktree-depth
   trap). The build itself is depth-agnostic (result KEYS are project-root
   relative), so only the regen is fenced to the main checkout:
   - **First run `pnpm betterer:ci` from the MAIN checkout on develop.** If it's
     already **red / broken** (alpha CLI erroring, or an already-corrupted
     baseline), do NOT regenerate: ship the refactor from the worktree, note in
     the PR that betterer was skipped, and if the baseline is corrupted, flag
     fixing it as its own task.
   - If it's **green** and you're lowering it, run that **single** `pnpm betterer`
     + commit the `.betterer.results` **from the main checkout** (never a
     worktree — the depth trap), then confirm `pnpm betterer:ci` green. betterer
     is not a pre-push gate, so this hand-verify is the only check on it.

5. **Open the PR + clean up.** From the worktree,
   `git push -u origin feat/<slug>-techdebt`, then
   `gh pr create --base develop --title "Tech debt: <what>"` with a body listing
   each increment (+ the betterer baseline drop when one happened, else the
   one-line reason it was skipped). Leave the worktree in place for review
   (remove it after the PR merges). The user reviews/merges; stop here (don't
   auto-merge this one).

## Defaults & guards

- **No squash, no rebase** — always a merge commit.
- **Tag every merge** `pr-<NUM>-<slug>`, annotated + pushed, at the merge commit
  (step 3). Non-blocking — never let a tag failure stop the cleanup.
- **Only develop.** Never push to / merge / delete `main`.
- **Idempotent** — every step tolerates already-done state (worktree gone, branch
  gone on origin, develop already current).
- **Abort over surgery** — if any step's prerequisite isn't met (red gates,
  unmergeable PR, commits not on develop, dirty worktree), STOP and report
  rather than force through.

## Not this skill

- Use **worktree-end** instead when you want a *local* `--ff-only` merge into the
  base with no PR, no origin-branch delete, and no develop pull.
- **code-todo** is the opener (worktree → build → PR); this is its closer.
