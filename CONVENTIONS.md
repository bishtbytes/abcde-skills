# Conventions these skills assume

The ABCDE skills reference a handful of repo conventions (e.g. `code-todo` says
*"see the repository instructions' Contract tests section"*). Those live in
**your repo's `AGENTS.md`** for Codex or `CLAUDE.md` for Claude Code. Merge the
sections below into the applicable instruction file once.

Nothing here is JS/TS-specific except where noted — swap in your stack's
equivalent (test runner, type checker, arch/lint check).

---

## Contract tests

A **contract** is a behavior you explicitly agreed on — the kind that, when
silently broken by a neighboring change, reads as a bug. Encode each as a test
whose `describe` name **states the agreement in plain words**, placed **FIRST**
in its test file, asserting through the **public seam** (route / exported
function), never internals:

```
describe("CONTRACT: <the agreement in plain words>", () => { … })
```

`grep -rn "CONTRACT:"` lists every agreement. **Never weaken, skip, or delete a
CONTRACT test without explicit approval in that session** — a red one means the
change breaks an agreement; surface it, don't "fix" the assertion.

## Behavior-changing commits

For a commit that changes **runtime behavior** (not docs/data/comments): in the
**same commit**, update the affected living feature spec (`docs/features/<slug>.md`
— its invariants section when a rule changed) **and** the asserting tests, then
end the commit body with `Spec:` and `Test:` lines naming them (or
`Spec: none — <why>`, itself the signal a spec is missing). Exempt: pure data
edits, one-off migrations, scratch dirs.

## Living feature specs

`docs/features/<slug>.md` are **living** specs kept in lockstep with the code
(distinct from dated, frozen design docs). Each has: what it does / flow /
contracts / key files / known limitations / **invariants** (which list the
CONTRACT tests + their paths). `code-todo`'s Step-1 gate flags which specs a
change touches.

## Temporary artifacts

Verification screenshots, demo media, and captured outputs go under a
**gitignored `zzz/`** dir at the repo root — **never committed**. One-off /
throwaway scripts go in `/tmp`, not `scripts/` (which is for durable tooling).

## Quality gates (before a push)

A push runs, and must stay green: a **type-check ratchet** (no *new* type errors
vs. the base branch), an **import/architecture check** (no new circular/orphan
imports), and the **full test suite**. A new capability is a new module/schema
behind a seam — never a bigger file or a new prefix sibling.

## Branch / PR / worktree policy

- **`develop`** is the integration branch — commit and push to it directly.
- Feature work happens in a **git worktree** off `develop`; open a PR against
  `develop`, then stop (you review/merge).
- **`main`** is protected — it changes only via a `develop → main` release PR you
  review and merge. Never push to / merge / commit `main` directly.

## Commit messages

Plain text, no Conventional-Commits prefix. Subject = short imperative sentence,
capitalized, ≤ ~72 chars; optional prose body when the *why* isn't obvious.
(This is a style choice — adjust to your team's.)
