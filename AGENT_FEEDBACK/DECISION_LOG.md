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
