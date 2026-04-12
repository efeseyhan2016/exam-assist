# Agent Feedback Handoff

## Current Goal

Keep EXAM ASSIST's academic intelligence systems coherent across `Home`, `Priorities`, `Inbox`, resource intelligence, and future feedback-loop work.

Current direction:
- strengthen real signal quality before adding new flashy intelligence
- prefer feedback loops over new heuristics
- preserve calm academic clarity while expanding EXAM ASSIST toward a year-round academic operating system
- keep the long-term companion vision in mind: the product should eventually prepare useful academic work in the background, not just rank pressure
- use the repo intelligence scoring framework when deciding which motor deserves the next pass

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
- Topic graph now also builds temporal co-occurrence edges from session history:
  - sessions for the same subject with different topics within 3 days → bidirectional relatedTopics edge
  - strictly deterministic: only clock distance, no semantic inference
  - self-edges and cross-subject links are explicitly blocked
  - temporal edges are merged into the same relatedTopics field as resource-based edges (Set dedup)

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
- subject-domain tests are clean for course-family aliases (MAN, AIT, STA, IST, PSI, etc.)
- course-code alias extraction handles TR-locale I→ı correctly via ASCII toLowerCase
- stuck-session pivot fires correctly before score-threshold guard
- related-topic signal fires for weak + open nodes, stays silent for unrelated topics
- plain TopicCoverageEntry (no relatedTopics) does not trigger related-topic pass
- exact topic match always outscores related-topic match for same node status
- topic graph tests are clean
- graph preserves readable topic labels while merging conservative duplicates
- temporal co-occurrence: within-window links, beyond-window blocked, self-edges blocked, cross-subject blocked, chain transitivity correct, resource+temporal dedup correct, exact boundary (3.0 days) included
- full suite passes: 256 tests, 0 failures (verified this session)

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
- temporal co-occurrence window (3 days) is a fixed constant — no user tuning yet
- temporal edges are additive only; no edge weight or decay is tracked
- long-term AI/background-prep direction is now explicit, but its execution boundary still needs a dedicated product/mimari spec
- intelligence-scoring rule is now explicit: below 4 stars = direct improvement target
- first scorecard pass is now written in `/Users/vatan/Documents/EXAM ASSIST/INTELLIGENCE_SCORECARD.md`
- first high-impact scoring results:
  - Risk Motoru → 4/5
  - Home Focus → 4/5
  - Daily Brief → 3/5
  - Study Recommendation → 3/5
  - Resource Intelligence → 4/5
  - Topic Focus / Topic Graph → 3/5

## Next Recommended Pass

Use the scorecard, not instinct-only prioritization:
- below-4 motors are now the direct targets
- the first three current targets are:
  1. `lib/topic-focus.ts`
  2. `lib/daily-brief.ts`
  3. `lib/study-recommendation.ts`

Suggested order:
1. build the first real topic progress layer on top of `topic-focus.ts`
2. let `daily-brief.ts` read topic progress and graph movement more compositionally
3. let `study-recommendation.ts` react to topic progress instead of mostly risk/time alone
4. only after those, define the first safe AI/background-preparation slice

## Files To Read Next

- `/Users/vatan/Documents/EXAM ASSIST/lib/topic-focus.ts` — current graph structure and exports
- `/Users/vatan/Documents/EXAM ASSIST/lib/daily-brief.ts` — current topic/coverage usage in brief
- `/Users/vatan/Documents/EXAM ASSIST/lib/study-recommendation.ts` — current recommendation limits and reflection handling
- `/Users/vatan/Documents/EXAM ASSIST/INTELLIGENCE_SCORECARD.md` — current evidence-based star ratings

## Notes For The Next Agent

Do not start by adding more regex.
Do not jump straight to AI execution.
First close the below-4 motors with the data the product already has.
Use the scorecard and framework together instead of intuition-only prioritization.
