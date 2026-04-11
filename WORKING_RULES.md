# EXAM ASSIST Working Rules

## Development Style

This project is built with strict product and engineering discipline.

Rules:
- no vibe coding
- no broad redesign swings
- micro-packs only
- one main problem per step
- review after each step
- preserve strong structure
- refactor weak foundations carefully
- avoid feature sprawl

---

## Micro-Pack Rule

Every implementation step should solve exactly one main problem.

A micro-pack must include:
- exact problem
- scope
- non-goals
- acceptance criteria
- verification steps

A micro-pack should be narrow enough that its result can be judged clearly.

---

## Scope Control

Do not bundle multiple major concerns together.

Bad:
- fix model
- redesign dashboard
- improve onboarding
- add new feature

Good:
- fix remaining-capacity realism only

Bad:
- improve storage, imports, timezone, and validation in one step

Good:
- add runtime validation for stored sessions only

---

## Review Discipline

After each micro-pack:
- inspect what changed
- inspect what remains weak
- decide keep / refactor / defer
- only then move to the next step

Do not stack changes blindly.

---

## Trustworthiness Rules

Do not present:
- heuristic outputs as facts
- estimates as precise measurements
- internal model assumptions as user-facing certainty

Prefer:
- honest wording
- approximate framing where needed
- explainability without fake authority

Trust is more important than pretending to be smart.

---

## Product Rules

Protect the core loop:
1. see what is coming up
2. understand what deserves attention now
3. act / log progress
4. see the system update

Do not let decorative surfaces compete with this loop.

Do not add features that weaken clarity.

---

## Engineering Rules

Always:
- inspect the current implementation first
- identify the exact problem before changing code
- keep scope tight
- state non-goals
- avoid unnecessary rewrites
- verify with build/lint/tests where relevant
- summarize what changed, what remains, and what should wait

---

## Cross-Agent Handoff Rule

If work is being shared between Codex and Claude, use the repo handoff layer:

- `/Users/vatan/Documents/EXAM ASSIST/skills/agent-feedback-loop/SKILL.md`
- `/Users/vatan/Documents/EXAM ASSIST/AGENT_FEEDBACK/ACTIVE_HANDOFF.md`
- `/Users/vatan/Documents/EXAM ASSIST/AGENT_FEEDBACK/DECISION_LOG.md`

Keep the handoff smaller than the problem you received.
Do not leave vague next steps.
Inside EXAM ASSIST this should be treated as the default shared-agent workflow, not a repeated user preference that must be restated each time.

Prefer:
- modular logic
- clear boundaries
- explicit assumptions
- stable data flow
- testable core behavior

---

## Quality Bar

Every step should move the product toward:
- CV-worthy quality
- premium UX
- startup-grade discipline
- trustworthy planning logic
- modular architecture
- strong portfolio presentation

---

## What To Avoid

Avoid:
- broad redesign swings
- fake precision
- decorative complexity
- feature sprawl
- "everything app" drift
- prototype leakage into product behavior
- shallow polish over weak foundations

---

## Decision Standard

When in doubt:
- simplify
- narrow scope
- preserve trust
- improve clarity
- protect the core loop
