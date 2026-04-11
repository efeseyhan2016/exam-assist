# Agent Feedback Handoff

## Current Goal

Keep EXAM ASSIST's academic intelligence systems coherent across `Home`, `Priorities`, `Inbox`, resource intelligence, and future feedback-loop work.

Current direction:
- strengthen real signal quality before adding new flashy intelligence
- prefer feedback loops over new heuristics
- preserve calm academic clarity while expanding EXAM ASSIST toward a year-round academic operating system

## What Changed

- Task-aware priorities are in place: nearby assignment/project pressure can now elevate a subject inside `Priorities`.
- Resource/document parsing now reads document-content signals more seriously:
  - `brief`
  - `outline / syllabus`
  - `questions / past-exam style`
- Resource intelligence can use `resourceKindHint` from content, not only weak titles.
- Study-mode intelligence is now more adaptive:
  - course-code aliases beat vague titles more reliably
  - repeated `stuck` reflections can trigger a soft pivot suggestion instead of staying silent
  - `Home` can surface that pivot reason even when it is still low-confidence
- Daily brief is less repetitive:
  - overlapping topic/resource phrases are deduped
  - support sentences are compacted instead of piling up
- Resource engagement is more honest:
  - old revisited sources lose weight over time
  - fresh activity matters more than stale historical engagement

## What Was Verified

- task-aware priorities pass tests and do not reorder on irrelevant academic events
- document-content signal inference passes targeted tests
- adaptive study-mode tests are clean
- daily brief dedup tests are clean
- engagement decay tests are clean
- full suite, lint, and build were clean at the last Codex pass

## Open Risks / Unknowns

- intelligence systems still collect more feedback than they truly learn from
- study mode is still heuristic-heavy and only lightly adaptive
- daily brief is cleaner now but still template-based rather than fully compositional
- topic-to-resource-to-task binding is stronger than before, but still not fully relational
- recommendation events still do not close the feedback loop strongly enough

## Next Recommended Pass

Build the first real feedback-layer slice:
- use recommendation acceptance/conversion and recent session reflections together
- let accepted-but-unconverted recommendations soften future guidance
- keep scope narrow
- do not expand into fake AI behavior

Suggested order:
1. recommendation-to-session feedback loop
2. engagement decay for topic/resource mapping
3. daily brief composition beyond templates

## Files To Read Next

- `/Users/vatan/Documents/EXAM ASSIST/lib/subject-intelligence.ts`
- `/Users/vatan/Documents/EXAM ASSIST/lib/subject-learning.ts`
- `/Users/vatan/Documents/EXAM ASSIST/lib/daily-brief.ts`
- `/Users/vatan/Documents/EXAM ASSIST/tests/daily-brief.test.ts`
- `/Users/vatan/Documents/EXAM ASSIST/tests/subject-learning.test.ts`

## Notes For The Next Agent

Do not start by adding more regex.
First close the feedback loop with the data the product already has.
