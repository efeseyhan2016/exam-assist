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
- Recommendation tracking now forms a first real feedback loop:
  - recommendation events are reactive, not passive storage only
  - pending accepted recommendations can gently pull a subject back into `Home`
  - repeated stuck conversions narrow later block suggestions
  - repeated good conversions can slightly relax block size
- `Priorities` now also reads that loop:
  - pending recommendation intent can gently lift a subject in ranking
  - recommendation friction can appear in the explanation layer
  - `Home` and `Priorities` now share the same feedback spine
- Resource ranking now also reads recommendation outcomes:
  - exact resource titles can gain or lose weight from recent conversion history
  - good resource conversions can lift a source above otherwise equal peers
  - repeated stuck conversions can soften guidance and slightly demote that source
  - `Home` and `Resources` now share the same resource-feedback map
- Resource ranking now also reads topic-level relevance:
  - resources can be lifted when they touch currently open or weak topics
  - topic-level recommendation history can softly help related resources even when the exact title differs
  - already-covered topics get only a small weight instead of dominating the next recommendation
- Subject understanding now has a clearer domain layer:
  - course aliases like `AIT` can now be treated as history-family signals
  - course aliases like `MAN` can now be treated as business-family signals
- Topic graph foundation now exists:
  - topic nodes now keep related topics, resource ids, and session ids
  - topics that appear together in the same resource are linked
  - topic coverage now derives from that graph instead of a flat ad-hoc map
- Topic graph now also reads active academic-event edges:
  - material and other event hints can create or strengthen topic nodes
  - topic nodes now carry academic event ids, active event count, and latest event time
  - `Home` and `Resources` now see topic movement not only from sessions/resources, but also from current academic change
- Resource suggestions now read graph-level related-topic links:
  - exact topic matches still win
  - but resources can now get a softer lift when they touch topics related to a weak or open node
  - this makes recommendation quality less brittle than exact topic equality alone

## What Was Verified

- task-aware priorities pass tests and do not reorder on irrelevant academic events
- document-content signal inference passes targeted tests
- adaptive study-mode tests are clean
- daily brief dedup tests are clean
- engagement decay tests are clean
- recommendation feedback profile tests are clean
- home focus reacts to pending recommendation intent
- priorities ranking reacts to pending recommendation intent
- resource recommendation feedback stays resource-specific
- historically successful resources can outrank equivalent peers
- repeated stuck resource conversions soften later guidance
- topic-level recommendation history can reward related resources
- resources that directly touch open topics can outrank generic materials
- subject-domain tests are clean for course-family aliases
- topic graph tests are clean
- graph preserves readable topic labels while merging conservative duplicates
- full suite, lint, and build were clean at the last Codex pass

## Open Risks / Unknowns

- intelligence systems still collect more feedback than they truly learn from
- study mode is still heuristic-heavy and only lightly adaptive
- daily brief is cleaner now but still template-based rather than fully compositional
- topic-to-resource-to-task binding is stronger than before, but still not fully relational
- recommendation events now influence focus, block size, priorities ranking, and resource ranking
- subject-domain understanding is still coarse and taxonomy-based, not semantic
- topic matching still depends on extracted topic hints rather than deep document understanding
- graph edges currently come from shared resource membership plus active academic-event hints; they are not yet true semantic relations
- related-topic ranking is still conservative and depends on graph edges that may be sparse for thin subjects

## Next Recommended Pass

Build the first real feedback-layer slice:
- deepen subject-topic understanding beyond aliases and extracted hints
- prefer topic-linked sources that historically convert better for that subject and mode
- keep scope narrow
- do not expand into fake AI behavior

Suggested order:
1. enrich subject-topic graph with temporal co-occurrence beyond shared resources
2. use topic graph movement more directly inside `Home` and `Inbox`
3. daily brief composition beyond templates

## Files To Read Next

- `/Users/vatan/Documents/EXAM ASSIST/lib/subject-intelligence.ts`
- `/Users/vatan/Documents/EXAM ASSIST/lib/subject-learning.ts`
- `/Users/vatan/Documents/EXAM ASSIST/lib/daily-brief.ts`
- `/Users/vatan/Documents/EXAM ASSIST/lib/recommendation-events.ts`
- `/Users/vatan/Documents/EXAM ASSIST/lib/resource-intelligence.ts`
- `/Users/vatan/Documents/EXAM ASSIST/lib/topic-focus.ts`
- `/Users/vatan/Documents/EXAM ASSIST/tests/resource-intelligence.test.ts`

## Notes For The Next Agent

Do not start by adding more regex.
First close the feedback loop with the data the product already has.
