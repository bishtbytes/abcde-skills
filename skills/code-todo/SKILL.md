---
name: code-todo
description: Implement one or more tasks/todos for this repo end-to-end — isolated worktree off develop, implementation, gates, live screenshot verification into zzz/ (OUTPUT_DIR, never git), and a PR against develop with the screenshots attached. Before implementing (EVERY invocation, including a named todo) it presents a test & spec impact assessment across four artifacts — unit/integration (vitest), e2e, the living feature specs in docs/features/, and behavioral contracts — naming which existing ones need updating, where new ones are warranted, or no change (with why); when an e2e run is warranted it ALSO asks up front, at the same gate, for permission to run it as the last step, so every human decision is resolved before any code and the run then proceeds autonomously to completion (implementation, gates, screenshots, the approved e2e, PR) with no further check-ins. Tech-debt cleanup is not part of this skill — it runs as a follow-up PR in deliver-todo. Waits for go-ahead before touching code. Use when the user says "/code-todo", "implement this todo", or hands over a spec/task to build as a PR. When invoked with NO specific todo, first triages docs/todo/ into ready-vs-needs-discussion lists and asks which to build.
---

# code-todo

Build the given task(s) in an isolated worktree and deliver **ONE PR**
against `develop` with visual evidence attached.

**One invocation = one worktree = one branch = one PR — no matter how
many todos were handed over.** Implement each todo as its own commit
(or commit pair) on the same branch so they stay individually
reviewable, but never fan out into a worktree/branch/PR per todo: that
multiplies review load, CI runs, and cleanup, and the user has asked
for a single PR. Only split into separate PRs if the user explicitly
asks for it.

## Stacked PRs (ONLY when the user explicitly asks for it)

When the user asks to tackle several ready todos as a **sequence of stacked /
nested PRs** — each branch cut off the PREVIOUS branch's tip rather than all off
develop — do that instead of one PR. Before any code, present an **up-front plan
table** and get go-ahead on the whole sequence:

| PR | Branch (off) | Todo(s) | e2e? | feature spec? |
|----|--------------|---------|------|---------------|
| 1  | `feat/<a>` ← develop | <todo(s)> | yes/no | update X / new Y / none |
| 2  | `feat/<b>` ← `feat/<a>` | <todo(s)> | … | … |

Rules for the stack:
- **One or more todos per PR.** Group by shared surface; order so foundational /
  same-file work sits LOWER in the stack (higher PRs rebase onto it, so put the
  thing they'd conflict with first).
- **Each branch is cut off the previous branch's tip**, and each PR **targets its
  parent branch** on GitHub (`gh pr create --base <parent-branch>`); only PR 1
  targets `develop`.
- **Every PR still runs the full per-PR flow** — its own Step 1 gate (resolve
  that PR's open questions + e2e/spec impact), implement, gates, screenshots,
  approved e2e, PR. Resolve each PR's human decisions up front in the plan table /
  gate; hold a todo OUT of the auto-stack if it still has an open design question.
- **Warn once about the rebase cascade:** changes requested on a lower PR mean
  rebasing every PR above it.
- Build **top-to-bottom**, reporting as each PR opens. The "one invocation = one
  PR" default above still holds for every NON-stacked invocation.

## The contract: resolve every human decision up front, then run autonomously

The Step 1 go-ahead gate is the ONLY place this skill stops for the user. By the
time the user says go, EVERY decision that needs them must be on the table and
resolved — scope, the test/spec impact across all three artifacts, **AND whether
the work warrants an end-of-run e2e (and if so, permission to run it).** After
go-ahead the run proceeds to completion on its own, following the agreed process
— implementation, gates, screenshots, the approved e2e, and the PR — with NO
further check-ins. The failure this prevents: returning to a session to find the
work shipped but a process step (e.g. the e2e) silently skipped because its
permission was never asked. Ask once, up front; then finish the job.

Tech-debt cleanup is deliberately NOT part of this skill — it runs as a
follow-up PR in **deliver-todo**, scoped to the just-merged feature's touched
files, so this skill stays focused on shipping the feature.

## 0. Triage (only when NO specific todo was named)

If the user handed over a specific todo / spec / task (named a file,
pasted a task, said "implement X"), **skip this step** and go straight
to Step 1 with that task.

If the invocation is bare (`/code-todo` with no target), do NOT
start a worktree yet. First scan the backlog and get the user to pick
the batch:

1. **List the backlog via `explore-todos`.** Invoke the `explore-todos` skill to
   get every parked todo grouped by status and sorted by priority — don't
   re-scan `docs/todo/` by hand here, reuse that skill. Its grouped output is
   your candidate set. Read the docs behind the ones you'll recommend, not just
   the titles, so you can judge readiness.
2. **Layer a build-readiness judgment** on that listing — sort the candidates:
   - **Ready (no discussion needed)** — scope is settled, decisions are
     already made in the doc, it's self-contained, and it's small-to-
     moderate. These can be built as-is.
   - **Needs discussion / not ready** — anything that is an explicit
     discussion doc, has open design questions, is a large/standalone
     refactor or migration better as its own PR, or is e2e/test work
     (a todo whose deliverable *is* an e2e/spec — heavier, usually its
     own PR). Note the *reason* it's held back.
3. **Present both lists** — one line per todo (slug + a few-word what +
   for held-back items, why). Recommend a concrete "ready" batch
   (lean small; a 6-item batch is already a chunky PR).
4. **Recommend a batch — don't touch code yet.** Present both lists with a
   concrete recommendation, but DON'T take a separate "which items" confirm
   here. The single begin-confirmation — scope **and** the test & spec impact
   (unit/integration + e2e + feature specs) — happens next in **Step 1**, the
   go-ahead gate.

Carry the recommended (or user-adjusted) items into **Step 1** — the test-impact
+ go-ahead gate — which is where the user confirms the scope and starts the run
(one worktree, one PR — the batch rule above still holds).

## 1. Test & spec impact + go-ahead (EVERY invocation — before any code)

This is the single gate that BEGINS implementation, and it runs whether the
todo was handed over directly or picked in Step 0 — **including a named todo,
which would otherwise run straight through with no checkpoint.**

For each todo in scope, work out what it does across FOUR artifacts that must
stay in lockstep with the code — the two test layers, the living feature
specs, and the behavioral contracts — and classify each. The reasoning is
shared: a behavior change silently breaks a green suite (or silently outdates
a feature spec, or silently voids an agreement) unless you name the affected
artifact up front, and new behavior ships untested / undocumented unless you
decide to cover it now.

### Unit / integration (vitest)

Grep the touched modules / routes for their existing `*.test.ts(x)` coverage,
then classify:

- **Updates existing unit/integration tests** — the todo changes behavior a
  current test asserts (a function's return, a component's render, an API
  route's response shape, a mock's expected call). Name the test file(s) and
  the specific assertion(s) that must change. *This is the case that silently
  breaks a green suite* — e.g. retiring `draftPromptWithClaude` broke its seam
  test in `gen-providers.test.ts`.
- **Warrants new unit/integration tests** — the todo adds pure logic, a new
  module, or a new behavior branch not yet covered; say what to add and where
  (a new `*.test.ts` beside the unit, or a route smoke test).
- **No unit/integration change** — a pure refactor with behavior unchanged that
  existing tests still cover, or config/docs only. Say WHY, so "no tests" is a
  recorded decision, not an oversight.

### E2E

Grep `e2e/` for the surfaces / testids / flows the todo touches, then classify:

- **Updates an existing e2e** — the todo changes behavior a current spec
  asserts (a UI string, a flow, a count, a gating rule, a bubble). Name the
  spec(s) (`e2e/*.spec.ts`) and the specific assertion(s) that will have to
  change. *This is the case that silently breaks a green suite* — e.g. a
  feature that changes the cast-images bubble breaks `studio-flow.spec.ts`.
- **Warrants a new / extended e2e** — the todo adds a user-facing flow not yet
  covered; propose a new spec or an extension, and say which.
- **No e2e change** — internal / non-UI, or UI but adequately unit-covered.
  Say WHY, so "no e2e" is a recorded decision, not an oversight.

**When an e2e run is warranted ("Updates an existing e2e" or "Warrants a new /
extended e2e"), ask for permission to run it as the last step NOW — fold that
ask into this same go-ahead.** Don't defer the e2e permission to the end of the
run: resolving it here is the whole point — the run is autonomous after
go-ahead, so an unasked end-step silently drops (the exact gap this skill
exists to close). If the classification is "No e2e change," say so and no e2e
runs — no ask needed.

### Feature specs (`docs/features/`)

`docs/features/<slug>.md` are **living** specs that must track the code (see
`docs/features/README.md`; distinct from the dated, frozen design docs in
`docs/superpowers/specs/`). Work out which documented feature(s) the todo
touches and classify:

- **Updates an existing feature spec** — the todo changes a feature already
  documented in `docs/features/<slug>.md` (its flow, contract, key files,
  limitations, or invariants). Name the spec(s) and which sections shift. *This
  is the case that silently outdates a living doc* — e.g. changing the
  brainstorm op contract outdates `studio-chat.md`.
- **Warrants a new feature spec** — the todo adds or substantially reshapes a
  feature that has no living spec yet; propose `docs/features/<new-slug>.md`.
- **No feature-spec change** — the touched area has no spec and doesn't merit
  one (internal plumbing, a tiny fix), or the change is invisible at the
  feature-doc altitude. Say WHY.

### Contracts (behavioral invariants)

A **contract** is a behavior the user explicitly agreed on ("identity edits
always take effect on regenerate"), protected by a **CONTRACT test** — a test
whose `describe` name states the agreement in plain words, placed FIRST in its
test file (see the repo CLAUDE.md "Contract tests" section for the convention).
Read the `invariants` section of each feature spec named in the assessment
above, then classify:

- **Could break an existing contract** — list every contract the todo's
  surface could plausibly affect; for each, name the CONTRACT test that
  protects it, or flag it **unprotected** and add writing that test to the
  todo's scope. *This is the case that voids an agreement silently* — a
  feature's own additions are naturally tested, but the behavior it takes
  AWAY from a neighboring feature is what nobody's test covers.
- **Establishes a new contract** — the todo's decisions include a "must
  always / must never" rule. State it in plain words; scope then includes the
  decision-named CONTRACT test AND a line in the feature spec's invariants
  section (they cross-link: spec lists the contract + its test path).
- **No contract impact** — say WHY (pure refactor behind green contract tests,
  UI copy, docs/data only).

**Present ALL FOUR assessments — plus, for a bare invocation, the batch you're
about to build, and (when an e2e run is warranted) the up-front ask to run it as
the last step — and WAIT for the user's go-ahead before touching code.** Their
go-ahead authorizes the WHOLE run including the approved e2e; don't start the
worktree or implementation until they confirm, and don't stop to re-ask
afterwards.

Scope note: this step only DECIDES the work. The unit/integration tests, the
CONTRACT tests, and the feature-spec writes/updates identified here happen
**during implementation** (Step 3); the tests then run inline in **Step 4
(Gates)**. Author/update the e2e
spec during implementation too; the e2e itself RUNS as the **LAST** step (Step 6)
when it was approved up front in this gate — autonomously, no second ask. This
skill already works in its own isolated worktree (own port, own working tree),
so the e2e's spawned dev server + file churn can't touch the user's running app
or in-flight work.

## 2. Worktree (brief)

Branch off `develop` into a worktree so the user's running dev server
and uncommitted work are untouched (pick one slug covering the batch,
e.g. `todo-sweep`):

```bash
git worktree add .worktrees/<slug> -b feat/<slug> develop
```

**Rename the session to this run's slug (do this first).** Derive a session
name from the todo/task — **≤ 4 words, all lowercase, hyphen-joined** (reuse the
same `<slug>` you picked for the worktree/branch, e.g. `edit-frames-interactions`).
Then rename the current Claude Code session to it: **attempt `/rename <slug>`
directly; if your harness can't invoke a built-in slash command (the common
case — the model has no tool for built-ins and plain output text isn't
executed), fall back to printing the exact line for the user to run:**

```
/rename <slug>
```

This is best-effort — it auto-renames on any harness that lets the model emit
the command, and otherwise surfaces a one-tap line. Don't block the run on it;
proceed regardless of which path fired.

Inside the worktree, `./scripts/start-dev.sh` is the self-healing
preflight + dev server (installs deps, copies `.env.local`, fixes the
`public/<store>` symlinks).

**Port selection — for EVERY Next dev server this skill spawns** (the Step 2
review server AND the Step 6 e2e): **never use 3333 / 3366 / 3399** (the
user's own dev servers live there). Pick the first FREE TCP port in the
**11000–12000** range: start at 11000 and increment by 1, skipping any in use —
`lsof -iTCP:<port> -sTCP:LISTEN` printing nothing means free. Pass the chosen
port as `SITE_PORT=<port>`; that single env var overrides both the dev script's
default and the e2e config's default (3366), so the whole run stays in the safe
range.

**NEVER kill a process on an already-in-use port — not ever.** A busy port means
something else (the user's own dev server, another run, an unrelated service) is
running there; killing it can destroy their work or state. The rule is
**skip-and-increment only**: if a port is in use, move to the next one. You free
ONLY the review server you yourself started, and ONLY at closure (via
`deliver-todo`, by its recorded port) — never a port you found already occupied.

### Start the persistent review server (project-specific — only if `scripts/start-dev.sh` exists)

Right after the worktree exists, start the project's dev server ONCE, in the
**background**, and leave it running for the whole run: the screenshot step (5)
reuses it, and the user can review the change live in the worktree after the PR
opens. `deliver-todo` kills it at closure. **Guard:** do this ONLY if
`scripts/start-dev.sh` exists — projects without it skip the step entirely, so
the skill stays portable. Steps:

1. Pick a free **review port** per **Port selection** above.
2. Start it detached so it survives the turn (Bash `run_in_background`, or
   `nohup … &`): `SITE_PORT=<port> ./scripts/start-dev.sh`. The script also does
   the deps-install + symlink preflight, so this doubles as worktree setup.
3. **Record the port for teardown** — write it to the **gitignored**
   `zzz/dev-server.json` IN THE WORKTREE (e.g. `{"port":<port>}`). `deliver-todo`
   reads it to find + kill the server, usually in a LATER, different session — so
   in-memory PIDs are useless; the file is the cross-session handle. Use `zzz/`
   (gitignored) so it never trips the worktree-clean check, and so it dies with
   the worktree.
4. Wait until it answers (`curl -sf localhost:<port>` succeeds, or the port
   listens), then proceed.

The review server is SEPARATE from the e2e server (Step 6): the e2e needs
`E2E_MOCK=1` and is started + torn down by Playwright on its OWN free port — pick
a DIFFERENT port for it. Kill the review server ONLY at `deliver-todo`.

## 3. Implement

Implement the task(s) per the spec/todo. Follow repo CLAUDE.md
(commit format, no temporary artifacts in git).

**Retire the todo file in the same commit that finishes it.** A todo's
`docs/todo/<slug>.md` is its spec — once its work is implemented,
`git rm docs/todo/<slug>.md` in the SAME (final) commit that completes
that work, so the todo and its implementation land together and
`docs/todo/` never carries already-shipped items (the stale-todo
problem). Rules:

- **One commit per todo** (the batch norm) → that commit removes its own
  todo file.
- **A todo split across several commits** → only the LAST commit removes
  the file.
- **Partially done** → leave the file; trim it to the remaining scope
  instead of deleting.
- **Discussion/spike notes you didn't implement** stay untouched.

**Write/update the feature spec(s) identified in Step 1** (`docs/features/`),
in the same branch. These are living docs — keep them current with the code:

- **Updating** an existing `docs/features/<slug>.md` → reconcile the affected
  sections against what you just built (flow, contract, key files, limitations,
  invariants); refresh the **Last updated** stamp (today's date + the short
  commit). Don't rewrite prose that's still accurate — it's a refresh, not a
  redo.
- **Creating** a new one → write it from what you built, in the structure the
  other specs use (What it does / flow / contracts / key files / known
  limitations / invariants), with a "living feature spec" banner + Last-updated
  stamp, and add a one-line entry to `docs/features/README.md`.
- Use plain `path` references (no churning line numbers) and `[[todo-slug]]`
  links to related todos. Verify the paths resolve.
- A new spec's `invariants` section must not be left out — "none yet" is a
  valid entry; absence isn't.

**Write the CONTRACT tests identified in Step 1** per the repo convention
(repo CLAUDE.md "Contract tests"): `describe("CONTRACT: <the agreement in
plain words>", …)`, placed FIRST in the test file (right after mocks/imports/
fixtures, before any other describe), asserting through the public seam. Add
each contract to its feature spec's invariants section with the test path.

## 4. Gates (always, before any PR)

- `tsc --noEmit` — compare error count/diff against `develop`
  (pre-existing errors exist; YOUR delta must be 0 new).
- `eslint` on every touched file.
- `vitest run` — full suite green; write/update the unit + integration tests
  identified in **Step 1** (new logic gets new tests; changed behavior gets its
  assertions updated). A new uncovered behavior shipping without the test Step 1
  called for is a miss — not "deferred".

## 5. Screenshot verification → OUTPUT_DIR (`zzz/`)

If the change is verifiable visually, capture screenshots of every
relevant state (before/after, in-progress, failure) against the
**persistent review server already running from Step 2** (reuse its
recorded port — don't spawn a second). If Step 2 was skipped (no
`scripts/start-dev.sh`), start one now on a free port. Drive the UI with
Playwright from the capture skill's node_modules:

```bash
NODE_PATH="$HOME/.claude/skills/capture/node_modules" node <script>.cjs
```

**OUTPUT_DIR rule:** all screenshots and other temporary artifacts go
under the repo-root `zzz/` directory (gitignored) — e.g.
`zzz/screenshots/<topic>/` in the MAIN checkout so they survive
worktree teardown. NEVER commit them (see CLAUDE.md "Temporary
Artifacts").

Revert any content side-effects the live test left in the worktree
(story.json edits, `*-status.json` files) before committing, and stop
the dev server when done.

## 6. E2E run — the last verification (only when approved in Step 1)

If Step 1 classified the work as warranting an e2e and the user approved running
it at the go-ahead gate, run it now — the **LAST** step before the PR, after
every cheap gate (Step 4) and the screenshots (Step 5) are green. This runs
**autonomously** (the permission was obtained up front); do NOT stop to re-ask.

- **Run in THIS worktree, on a free port** (see **Port selection** in Step 2 —
  pick the first free port in 11000–12000; never 3333 / 3366 / 3399). It already
  has its own working tree, so the spawned `next dev` + browser can't disrupt the
  user's main checkout or their in-flight work. `SITE_PORT=<port> pnpm test:e2e`
  (the env var overrides the e2e config's 3366 default).
- **Update a deliberately-changed spec's assertions BEFORE running** — a red
  spec from an intended behavior change is a spec to update, not a bug.
- If it fails on a real regression, fix and re-run until green. Capture the
  **per-spec** result (passed / flake-retried-then-passed / failing trace) for
  the PR-body status table (Step 7).
- **"No e2e change"** (Step 1) → skip this step entirely.
- **User declined the e2e at the gate** → skip the RUN, but still author/update
  the spec (Step 3) so the coverage lands with the change, and note in the PR
  that the e2e was authored but, by request, not run.

## 7. ONE PR against develop — with screenshots attached

A multi-todo batch still produces a single PR; its body gets one
section per todo (what/why + that todo's screenshots + which commits).

```bash
git push -u origin feat/<slug>
gh pr create --base develop --head feat/<slug> --title "…" --body "…"
```

**Attaching images (required whenever screenshots exist):** this repo
is PRIVATE, so `raw.githubusercontent.com` links do NOT render in PR
bodies (GitHub's camo proxy can't read private repos). Host the
images on a secret gist instead — gist raw URLs serve proper image
content-types and render fine:

```bash
# 1. Create a secret gist (text seed file required). gh gist create CANNOT
#    take binaries ("binary file not supported") — seed with text, push PNGs
#    via git in step 2.
echo "PR #<n> screenshots" > /tmp/README.md
gh gist create /tmp/README.md --desc "<repo> PR #<n> screenshots"   # → prints the gist URL; the <gist-id> is its last path segment

# 2. Push the images into the gist via git (gists are git repos; the
#    API is text-only, git push handles binaries). Run THIS BLOCK with the
#    sandbox DISABLED (dangerouslyDisableSandbox: true) — a sandboxed
#    `git clone`/`git init` fails with "failed to change group ID: operation
#    not permitted". Clone over HTTPS (no auth needed to clone your own secret
#    gist); do NOT use git@gist.github.com (SSH to the gist host is usually
#    unauthorized even when the repo remote's SSH works). Use `git -C <dir>`,
#    not `cd`. Inline the <gist-id> LITERALLY in each command — storing a
#    digit-leading hex id in a zsh var trips "bad math expression".
git clone https://gist.github.com/<gist-id>.git /tmp/gist-pr<n>
cp zzz/screenshots/<topic>/*.png /tmp/gist-pr<n>/
git -C /tmp/gist-pr<n> add -A
git -C /tmp/gist-pr<n> commit -m "PR <n> screenshots"
git -C /tmp/gist-pr<n> -c "credential.helper=!gh auth git-credential" push origin HEAD

# 3. Embed in the PR body (filename URL always serves the latest rev, so
#    re-pushing a file updates the embed in place). Allow a few seconds of
#    propagation, then verify each serves an image before relying on it:
#    curl -sI <raw-url> | grep -iE "HTTP/|content-type"  → expect 200 image/png
# ![label](https://gist.githubusercontent.com/<user>/<gist-id>/raw/<filename>)
```

Always include in the PR body:
- the key visual artifact itself (e.g. a generated thumbnail/render)
  as the hero image,
- the verification states (in-progress, final, failure) — tables of
  2–3 images per row read well,
- the **Step-1 assessment table** — one row per todo × the four artifacts
  (unit/integration, e2e, feature spec, contracts), each cell the
  classification + its one-line why, INCLUDING the "no change because …"
  reasons. This is the durable record of what was deliberately tested,
  documented, and skipped — months later the PR itself answers "why is
  there no e2e for this?",
- gates summary (tsc delta vs develop, vitest count, eslint),
- the e2e result, per Step 6 — when a run happened, as a **`## E2E` status
  table**: one row per spec (`<spec>.spec.ts` → ✅/❌ + a short note, e.g. which
  run passed / flake retries / orthogonal-failure reason). When no run happened,
  a one-liner instead (`authored-but-not-run` or `not-warranted`, with why).

Note: secret-gist raw URLs are unlisted but public to anyone holding
the URL — fine for UI screenshots, don't put secrets in them.

Tech-debt cleanup does NOT happen here. It's a follow-up PR opened by
**deliver-todo** after this feature merges, scoped to this feature's touched
files. Keep this PR purely the feature.

## 8. Stop

Leave the worktree + branch in place — the user reviews and merges
the PR on GitHub, then asks for cleanup (`/worktree-end` or manual
`git worktree remove`). **Leave the Step-2 review server RUNNING** so the
user can review the change live in the worktree; `deliver-todo` kills it
(via the recorded `zzz/dev-server.json` port) as part of closure. Report the
review URL (`http://localhost:<review-port>`) so the user can open it.
