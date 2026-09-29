---
name: fork-todo
description: Use when work decided in THIS conversation should be built by a different agent right now, while you keep talking here. Captures the in-flight task as a self-contained spec written to the OS temp directory (never the repo, never a session scratchpad), prints its absolute path, and hands it to a FRESH SEPARATE SESSION — never a background subagent, never anything running inside this session — with collision rules so both sides can run at once. Triggers on "fork this work", "hand this to another agent", "someone else build this while we keep going", "/fork-todo".
argument-hint: "What to hand off (optional — defaults to the task under discussion)"
---

Take the task this conversation just settled, write it down so it survives
without the conversation, and hand it to **a fresh session that builds it now** —
while this session stays free to keep designing.

This is the **F** in the flow, and it is the odd one out: A–E move a todo through
a lifecycle, F **forks** one sideways.

**The work leaves this session. Always.** The output of this skill is a spec file
and an invocation the user pastes into a *new* session — not a dispatch you
perform. The point is not merely that someone else does the typing; it is that
**this conversation stays clean**, with no build traffic in it. So:

- **Never a background subagent**, and never any other agent running inside this
  session. Those report back *here* — progress, tool output, completion notices —
  which is exactly the interruption the fork exists to avoid. A subagent is not a
  lighter-weight fork; it is the thing a fork is instead of.
- **Never build it here yourself**, however small it looks once the spec is
  written.

If the work genuinely belongs in this session, that is a decision not to fork —
say so and drop the skill, rather than forking it into a subagent.

**Not `add-todo`** — that parks work nobody starts, for cold pickup later. This
dispatches work that begins immediately.
**Not `code-todo`** — that builds it *here*, occupying the session with gates,
screenshots and a PR. This delegates so the session keeps its hands free.

Reach for it when the design is settled but the build is long, and you have more
to discuss than you have patience to wait.

---

## Step 0 — is this actually forkable?

Say so and stop if not:

- **Not settled.** If the approach is still moving, forking multiplies the churn
  — every unresolved question becomes a guess you review later. Offer
  `brainstorm-todo` or `add-todo` instead.
- **Overlaps what this session is still editing.** Two agents writing the same
  files is a merge conflict with extra steps. Either narrow the fork to
  files you'll leave alone, or build it here.
- **Small enough that writing the spec costs more than the work.** A ten-minute
  edit does not need a document and a second agent.

## Step 1 — write the spec

**Write it to the OS temp directory** — `$TMPDIR` if set, else `/tmp` — the same
rule `handoff` follows. A short descriptive kebab-case filename
(`fork-cast-failure-surfacing.md`), and **print the absolute path on its own
line** when you're done, because handing that path over IS the handoff.

Two places it must NOT go, for different reasons:

- **Not the repo.** This file is a channel between two agents, not backlog. Left
  in the tree it gets swept up by someone's `git add -A`, and then it outlives the
  build and reads months later as work still pending. `add-todo` owns
  `docs/todo/`; this does not.
- **Not your session scratchpad**, even when the harness tells you to prefer one
  for temp files. That instruction assumes the file is yours; this file's entire
  purpose is to be read by a *different* process. A scratchpad path is scoped to
  one session, can be cleaned when it ends, and is buried under a
  project-shaped prefix — so it reads as repo-local to the person pasting it and
  can't be relied on to still exist when the other agent opens it. **The OS temp
  directory is the shared ground between two processes; a scratchpad is not.**
  This is the one case where the scratchpad rule is the wrong default.

Keep the same shape as an `add-todo` doc, frontmatter included — it costs
nothing and means the file can be promoted into `docs/todo/` unchanged if the
work turns out to be worth parking instead of building. But write it for an agent
starting **now**, not a reader months out. That changes what has to be in it.

**Write for a reader with zero shared context.** The session that opens this file
has never seen this conversation — no scrollback, no earlier files read, no idea
what "the fix we discussed" refers to. Every pronoun that points at the
conversation instead of at the code is a question that session cannot answer.
Spell out the nouns, and say up front what the task is in one paragraph before
any detail.

**Verify before you write.** Everything load-bearing gets checked against the
code as it is at this moment, and carries `file:line`. A spec built from
conversational memory sends the agent to a function that moved three commits ago,
and it will not know to doubt you. Where a claim came from a subagent or a
summary rather than your own read, either verify it or mark it unverified.

**Say where the work happens.** Repo, branch, worktree path, and whether a dev
server or data is attached to it. If the target is a worktree, say that the main
checkout must not be switched to it.

**Mark decisions SETTLED.** List what was decided and that it is closed. An agent
that re-opens a resolved question burns a cycle and often lands the other side of
it. Where you rejected an alternative for a reason that isn't obvious from the
outcome, record the reason — that is what stops it being re-proposed.

**Say what is NOT broken.** Any behaviour that looks like a bug and is
deliberate, especially one guarded by a comment or a test. Without this, a
thorough agent "fixes" it. Name the guard.

**Name what must survive.** Test ids, CONTRACT tests, public seams, fixtures
other suites lean on. If a rename is unavoidable, say so and say what replaces
it, so the change reads as deliberate rather than as tests quietly vanishing.

**State the finishing line.** Commits only, or commits plus a PR? Which branch?
Which gates must be green before it stops? Ambiguity here is how you get an
unwanted PR — or work that stops one step short.

**The spec IS the approval — the fork runs autonomously.** The user settled the
design before you forked it, so handing over the spec is the go-ahead for the
whole finishing line: build, run the gates, commit, push, open the PR. The fork
does **not** stop to ask before committing or between commits — a mid-run
check-in drags the user back to a session they forked precisely so they would not
have to watch it. So put the guard where it belongs, in the spec, as **hard
stops** rather than checkpoints:

- **What it must never do**, named explicitly — e.g. merge, deploy, touch
  production or a shared service, push to a protected branch, switch the main
  checkout. These are the things worth protecting; a commit on its own branch is
  not one of them.
- **When it stops and asks**: a genuine blocker, a gate it cannot make green
  without changing something the spec marks SETTLED or must-survive, or a
  question the spec does not answer. Everything else it decides and proceeds.

If you find yourself wanting an approval checkpoint mid-build, that is a sign the
spec is not settled enough to fork — resolve it here first rather than
exporting the question.

**Split it.** Independent commits in a stated order, each one landable and
reviewable on its own. It keeps the diff readable and gives you an obvious place
to interrupt.

## Step 2 — hand it to a fresh session

There is no dispatch choice to make. Give the user what they need to start a new
session and paste one prompt into it:

```
cd <worktree-or-repo-path> && claude
```

…and the opening prompt, quoting **the absolute temp path** — the new session
shares no context with this one, so a repo-relative path or "the spec" means
nothing to it. The prompt should say: read that file, the decisions in it are
settled, follow the commit split, and **the spec is pre-approved — build it
through to its finishing line (gates, commits, push, PR) without asking**,
stopping only for the hard stops the spec names. **Never** write "ask before
committing" into a fork prompt: it turns an autonomous fork back into a session
the user has to babysit.

Print both as copyable blocks, and stop there. **You do not start the work, and
you do not spawn anything that does** — no background subagent, no task agent,
no "I'll just kick it off here". The user starts the other session; this one goes
back to talking. If that feels like a step you could save them, re-read why:
anything you launch from here reports back into this conversation, and a clean
conversation is the entire deliverable.

Before you hand it over, **check the target tree is clean** (`git status`) and
say what you found. Starting the other session on uncommitted work risks it
committing someone else's changes inside its own.

## Step 3 — set the collision rules

State them in the conversation *and* in the spec's own Coordination section, or
they don't hold:

1. **This session goes edit-free** on the files the fork owns. Name the paths.
   Discussion continues; edits do not.
2. **New decisions get APPENDED to the spec**, not applied to the code. That is
   the whole trick — the spec is the channel between the two agents, so the
   conversation can keep moving without racing the build.
3. **The agent re-reads the spec before each commit**, since it grew after the
   agent started and nothing tells it that.

## Step 4 — while it runs

Every later decision in this conversation lands in the spec as a **dated
amendment**, and amendments have rules of their own, because a spec that
contradicts itself is worse than no spec:

- **Mark what it supersedes, at the point it applies.** A note at the bottom is
  invisible to an agent reading top-down. Put a pointer in the section being
  replaced.
- **Say when a decision reverses an earlier one** and that it is deliberate. A
  silent contradiction reads as an error, and the agent picks whichever it saw
  last.
- **State consequences withdrawn as well as accepted.** If the new decision
  removes a trade-off the old one accepted, say so — otherwise the constraint
  outlives the reason for it.
- **Mark finished work `✅ ALREADY DONE — do not re-implement`**, with the call
  shape or commit. This is the single most effective line in the file: without
  it, an agent reading a "we should add X" section adds a second X.

Keep the top-of-file status current — what has landed, what is open, which
sections are superseded. That header is what a resuming agent reads first.

The spec is the only channel. Nothing from the forked session arrives here on its
own, and that is by design — don't poll for it, and don't go looking for its
output. Keep designing until the user brings it back.

## Step 5 — when it lands

The other session reports to the user, not to you, so this step starts when they
say it's done — usually by pasting what it did. Then:

- Confirm the finishing line was honoured — the right branch, the agreed stop
  point, gates actually run rather than assumed. Check the repo yourself rather
  than taking the summary's word for it.
- Say plainly anything it changed that the spec didn't anticipate, and any test
  it altered or removed.
- Lift the edit-free rule and say so.
- Leave the spec where it is — it's in temp, so it ages out on its own and can't
  be mistaken later for pending backlog. Nothing to retire.
- If the decisions in it are worth keeping, don't keep the *file* — fold the
  reasoning into the commit messages, or promote it to `docs/todo/` deliberately.
  A superseded spec preserved wholesale is a document that argues with itself.

---

## What this skill is really preventing

Two agents on one codebase fail in a small number of ways, and every rule above
is aimed at one of them:

- The build lands back in this session → the fresh-session rule: no subagents, no
  building it here.
- Both edit the same file → the edit-free rule.
- The fork re-opens a settled decision → SETTLED markers with reasons.
- The fork "fixes" something deliberate → the NOT-broken section.
- New decisions arrive mid-build and are lost → append-only amendments.
- The fork rebuilds something already finished → ✅ ALREADY DONE.
- The spec drifts from the code it describes → verified `file:line`, re-read
  before each commit.

If a fork goes wrong, it is nearly always one of these, and nearly always
because the spec was written from memory instead of from the code — or because
the fork never actually left the session.
