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
