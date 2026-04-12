# Agent Decision Log

Use this file only for decisions that should survive multiple Codex/Claude handoffs.

---

## 2026-04-12 — Intelligence Direction

Accepted:
- EXAM ASSIST should strengthen feedback loops before adding new intelligence systems.
- The most valuable next intelligence work is:
  1. adaptive study-mode feedback
  2. daily brief deduplication
  3. engagement decay

Rejected for now:
- adding more title regex as the main path
- visible fake-AI behavior
- broad new signal categories before current loops learn from existing feedback

Reason:
- the current engine is strong but still mostly one-way; it observes and recommends, but learns only weakly from outcomes.

---

## 2026-04-12 — Cross-Agent Protocol

Accepted:
- Codex and Claude should use the file-based protocol under `/Users/vatan/Documents/EXAM ASSIST/AGENT_FEEDBACK/`
- `ACTIVE_HANDOFF.md` is the current shared state
- this log stores longer-lived decisions, not step-by-step status

Reason:
- no live agent-to-agent channel exists here, so the repo needs a stable, low-noise collaboration layer

---

## 2026-04-12 — Resource Feedback Layer

Accepted:
- recommendation outcomes should influence resource ranking, not only focus or priorities
- the first safe slice is exact-resource memory using the recommended resource title within the same subject
- `Home` and `Resources` should share the same resource-feedback map so they do not drift

Deferred:
- topic-level conversion memory
- resource-kind conversion memory

Reason:
- exact-resource memory is narrow enough to stay trustworthy while still giving the engine a real sense of which sources are actually converting into useful study sessions

---

## 2026-04-12 — AI Readiness Principle

Accepted:
- EXAM ASSIST should not depend on AI before its structured academic layers are strong enough
- canonical inputs, provenance, event layers, feedback loops, and ranking memory come before deeper AI interpretation
- future AI should sit on top of the deterministic intelligence spine, not replace it

Reason:
- without those foundations, AI would look impressive but behave inconsistently; with them, AI can be cheaper, more reliable, and easier to constrain

---

## 2026-04-12 — Topic Graph Foundation

Accepted:
- topic coverage should be derived from a reusable subject-topic graph, not only from a flat temporary map
- the first graph edges should come from topic co-occurrence inside the same resource
- graph nodes should carry topic status plus related topics, resource ids, and session ids

Deferred:
- semantic topic relations
- academic-event edges
- cross-course topic relations

Reason:
- this gives the product a durable topic spine now, while keeping the first implementation deterministic and trustworthy

---

## 2026-04-12 — Topic Graph Event Edges

Accepted:
- active academic events should be allowed to create or strengthen topic nodes when they carry trustworthy topic hints
- topic nodes should track academic event ids, active event count, and latest event time
- `Home` and `Resources` should read the same event-enriched topic graph so weekly academic movement feels coherent

Deferred:
- deeper semantic event-topic extraction
- temporal co-occurrence edges from study history
- cross-course topic movement

Reason:
- this lets the graph reflect real academic movement now, without pretending to do deep semantic understanding before the deterministic event layer is ready

---

## 2026-04-12 — Related-Topic Resource Guidance

Accepted:
- exact topic matches should stay the strongest topic signal in resource ranking
- graph-derived `relatedTopics` can still provide a softer lift for resources tied to weak or open nodes
- callers that only need topic coverage can keep using `buildTopicCoverageState(...)`, but it should return full graph-backed nodes so richer downstream intelligence can reuse the same shape

Deferred:
- semantic similarity between topic labels
- cross-subject related-topic lifts

Reason:
- this gives resource guidance a more relational spine without letting loose topic associations overpower exact, trustworthy matches

---

## 2026-04-12 — Long-Term Companion Vision

Accepted:
- EXAM ASSIST should grow beyond showing what matters and gradually handle selected preparation work in the background
- deterministic systems should keep deciding what matters, while AI should execute grounded preparation tasks
- the strongest future premium motion is "you work on X while the system prepares Y"
- good early AI tasks include:
  - source summaries
  - mini question sets
  - quick-review packs
  - case / assignment kickoff structures
  - tomorrow-prep surfaces

Guardrails:
- do not turn the product into a generic AI chat surface
- do not let AI replace prioritization, risk ranking, or event interpretation
- do not cross academic honesty boundaries by silently "doing the coursework" for the user

Reason:
- this keeps the product premium, calm, and differentiated: not a flashy assistant, but a quiet academic co-worker built on top of a trustworthy deterministic spine

---

## 2026-04-12 — Intelligence Quality Scoring Rule

Accepted:
- EXAM ASSIST should use a dedicated 1-to-5 star framework to evaluate intelligence motors
- no half-stars should be used
- no star should be assigned without concrete evidence
- if any intelligence motor is below 4 stars, it becomes a direct improvement target
- weak dimensions should not be averaged away by stronger ones

Important nuance:
- deliberate narrow scope is not the same thing as broken scope
- a small but trustworthy motor should not be penalized just because it is intentionally narrow

Reason:
- this creates a disciplined, evidence-based way to choose the next intelligence micro-pack instead of relying on vague intuition

---

## 2026-04-12 — First Intelligence Scorecard Pass

Accepted:
- the first scorecard pass should start with the highest-impact motors, not the full inventory
- the first six rated motors are:
  - Risk Motoru → 4/5
  - Home Focus → 4/5
  - Daily Brief → 3/5
  - Study Recommendation → 3/5
  - Resource Intelligence → 4/5
  - Topic Focus / Topic Graph → 3/5
- below-4 motors become direct improvement targets in this order:
  1. topic progress / topic-focus layer
  2. daily brief composition
  3. study recommendation depth

Important nuance:
- these ratings are based on the current repo state and current tests, not stale QA examples
- a strong internal foundation can still score 3/5 if it has not yet surfaced enough product value or feedback depth

Reason:
- this turns the new scoring framework into an actual prioritization tool and confirms that the biggest current gap is no longer "raw risk math", but the unfinished topic-progress-to-user-surface layer
