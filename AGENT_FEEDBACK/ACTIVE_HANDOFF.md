# Agent Feedback Handoff

## Current Goal

Keep EXAM ASSIST's academic intelligence systems coherent across `Home`, `Priorities`, `Inbox`, resource intelligence, and future feedback-loop work.

Current direction:
- strengthen real signal quality before adding new flashy intelligence
- prefer feedback loops over new heuristics
- preserve exam-first clarity while expanding task/project awareness

## What Changed

- Task-aware priorities are in place: nearby assignment/project pressure can now elevate a subject inside `Priorities`.
- Resource/document parsing now reads document-content signals more seriously:
  - `brief`
  - `outline / syllabus`
  - `questions / past-exam style`
- Resource intelligence can use `resourceKindHint` from content, not only weak titles.

## What Was Verified

- task-aware priorities pass tests and do not reorder on irrelevant academic events
- document-content signal inference passes targeted tests
- full suite, lint, and build were clean at the last Codex pass

## Open Risks / Unknowns

- intelligence systems still collect more feedback than they truly learn from
- study mode is still heuristic-heavy and only lightly adaptive
- daily brief can still become repetitive when multiple signals are active
- topic-to-resource-to-task binding is stronger than before, but still not fully relational

## Next Recommended Pass

Build the first real feedback-layer slice:
- use recent session reflections (`good / surface / stuck`) to softly adapt study mode and guidance
- keep scope narrow
- do not expand into fake AI behavior

Suggested order:
1. adaptive study-mode feedback
2. daily brief deduplication
3. engagement decay

## Files To Read Next

- `/Users/vatan/Documents/EXAM ASSIST/lib/subject-intelligence.ts`
- `/Users/vatan/Documents/EXAM ASSIST/lib/subject-learning.ts`
- `/Users/vatan/Documents/EXAM ASSIST/lib/daily-brief.ts`
- `/Users/vatan/Documents/EXAM ASSIST/tests/daily-brief.test.ts`
- `/Users/vatan/Documents/EXAM ASSIST/tests/subject-learning.test.ts`

## Notes For The Next Agent

Do not start by adding more regex.
First close the feedback loop with the data the product already has.
