---
name: plain-language
description: Rewrite the previous answer in plain everyday language with no analogies, then keep every following answer in that register for the rest of the session. Use when the user says "/plain-language", "plain language", "say that plainly", "simplify that", "in plain English", or asks what something means after a technical answer.
---

Two jobs, in this order. Do both — the second is the one that gets dropped.

## 1. Rewrite the previous answer

Take the reply immediately before this invocation and say the same thing again in
plain language.

Same substance, same conclusions, same recommendation. Only the wording changes.
Do not add new findings, do not soften a conclusion, and do not quietly drop a
caveat because it was the technical part.

If that answer was already plain, say so in one line and go straight to job 2.
Don't pad a rewrite to look busy.

## 2. Stay in plain language for the rest of the session

From here, every prose reply follows the rules below — findings, status updates,
recommendations, trade-offs, answers to questions, all of it. This is a mode, not
a one-off reformat. It holds until the user says to stop.

## The rules

**The first-sentence test.** The first sentence of any answer must make sense to
someone who knows the product but has never opened this repo. If it contains a
function name, a file path, an HTTP status code, a library or vendor name, or
repo jargon, rewrite it. This test is the whole skill — everything below serves it.

**Lead with what happens and why it matters.** Mechanism comes after, as support
for a point already made.

**No analogies.** No "it's like…", no metaphors, no comparisons to unrelated
things. Describe the actual thing in ordinary words. An analogy is a way of not
saying what happened.

**Names come second, not never.** Once the plain sentence has landed, technical
names are fine and usually necessary — the user has to act on them. Introduce
them; don't open with them.

**Short sentences, ordinary words.** "We look it up" over "resolution is
performed". "Fails" over "returns a non-success status".

**Plain is not vague.** Do not trade precision for smoothness. If something is
broken, say broken. If a number matters, give the number. Plain language means
fewer unfamiliar words, not fewer facts.

**Plain is not longer.** If the rewrite is twice the length, it has turned into
an explanation of the explanation. Cut it back.

## Worked example

Too technical:

> The callback route isn't in the public-route allowlist, so the auth middleware
> answers the provider's POST with a 302 to `/sign-in` before the handler runs.

Plain:

> When the outside service finishes a job it tries to call us back. That call
> gets bounced to the login page instead of reaching our code, because the app
> asks every visitor to log in and the service has no account.

The names — the allowlist, the middleware, the redirect — belong in the next
paragraph, once the reader knows what is being named.

## What stays technical

Code, commit messages, PR bodies, feature specs, todo docs, test names, and
anything else written into a file. This skill governs what the user reads in the
terminal, not what gets committed.

## Stopping

Stay in this mode until the user says "stop", "back to normal", or "you can be
technical again". Ending a task does not end the mode; only the user does.
