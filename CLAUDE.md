# CLAUDE.md

## Project
EXAM ASSIST

EXAM ASSIST is a premium, friendly, personalized, local-first academic command center designed to help students manage demanding academic periods across courses, deadlines, materials, exams, and longer-term academic progress.

Longer-term, EXAM ASSIST should evolve into a calm academic companion that can do selected preparation work in the background for the student, not just rank what matters.

This project is intended to be:
- CV-worthy
- premium
- startup-grade
- trustworthy
- calm and product-minded

This project is **not**:
- a quick prototype
- a vibe-coded side project
- a flashy but shallow dashboard
- an unfocused everything app

---

## Core Product Idea

EXAM ASSIST helps users:
- understand what is coming up
- understand what deserves attention now
- organize study flow, coursework, resources, deadlines, exams, and broader academic progress
- reduce confusion and mental overload during intense study periods

The product should help users move through stressful academic periods with more clarity and control.
Over time it should become the kind of product that can quietly say:

- sen en önemli işe dön
- ben bir sonraki yararlı hazırlığı senin için hazırlayayım

---

## Core Product Loop

1. see what is coming up
2. understand what deserves attention now
3. log progress / study / tasks
4. see priorities update
5. continue with more clarity

---

## Product Anchors

Emotional anchor:
- visible academic pressure
- approaching deadlines, exams, and academic changes
- a clear sense of what is becoming important

Planning anchor:
- priorities
- risk-ranked subject board
- realistic study focus

The product should protect both anchors:
- the emotional anchor tells the user what is becoming important
- the planning anchor tells the user what deserves attention now

Future execution anchor:
- background preparation
- grounded AI execution on top of deterministic academic context

---

## Working Standard

- no vibe coding
- no broad redesign swings
- micro-packs only
- one main problem per step
- review after each step
- preserve what is structurally strong
- refactor weak foundations carefully
- do not add features just to make the app feel bigger
- prefer trustworthy logic over fake precision
- prefer disciplined simplification over decorative complexity
- keep future AI work grounded, quiet, and genuinely useful
- prefer "prepare useful work" over "chat about everything"

---

## Engineering Rules

Always:
- inspect the current implementation first
- identify the exact problem before changing code
- keep scope tight
- state non-goals explicitly
- avoid unnecessary rewrites
- verify with build/lint/tests where relevant
- summarize exactly what changed, what remains, and what should wait

---

## Agent Collaboration

For EXAM ASSIST, this is the default collaboration rule.

If you are collaborating with Codex through this repository, do not wait for the user to repeat the protocol. Use the file-based handoff system by default:

- skill: `/Users/vatan/Documents/EXAM ASSIST/skills/agent-feedback-loop/SKILL.md`
- active handoff: `/Users/vatan/Documents/EXAM ASSIST/AGENT_FEEDBACK/ACTIVE_HANDOFF.md`
- durable decisions: `/Users/vatan/Documents/EXAM ASSIST/AGENT_FEEDBACK/DECISION_LOG.md`
- startup prompt: `/Users/vatan/Documents/EXAM ASSIST/AGENT_FEEDBACK/CLAUDE_START_PROMPT.md`

Keep handoffs compact, evidence-based, and scoped to the next real pass.
This rule is project-specific to EXAM ASSIST and should not be treated as a global instruction outside this repository.

When evaluating intelligence systems, use the repo scoring framework:
- `/Users/vatan/Documents/EXAM ASSIST/INTELLIGENCE_SCORING_FRAMEWORK.md`

Working rule:
- intelligence motors are rated from 1 to 5 stars
- no half-stars
- no score without evidence
- if a motor is below 4 stars, it becomes a direct improvement target
- do not confuse deliberate narrow scope with broken scope

Do not:
- introduce broad product changes without justification
- make the app more complex just to make it look advanced
- present heuristic outputs as if they are scientifically exact
- let decorative UI compete with core utility
- quietly expand scope

---

## Product Priorities

Prioritize:
1. onboarding clarity
2. navigation clarity
3. priorities / planning logic
4. academic events, schedule, and deadlines
5. study logging
6. resources / PDF handling
7. tasks / assignments / projects
8. grounded background-preparation surfaces

Secondary for later:
- grade history
- daily briefings
- AI assistance
- tomorrow-prep and sleep-aware guidance
- broader academic depth

Explicitly late / secondary:
- collaboration
- social/group study
- voice chat
- screen sharing
- "everything app" expansion

Do not let EXAM ASSIST lose focus.

---

## UX / Tone Rules

The product should feel:
- premium
- calm
- clear
- friendly
- organized
- trustworthy
- quietly capable

The product should not feel:
- cluttered
- gimmicky
- noisy
- overbuilt
- fake-smart
- prototype-like
- like a generic AI wrapper

User-facing language should be:
- calm
- clear
- helpful
- friendly
- premium

Turkish is the primary language for now.
Turkish and English support are planned.

---

## Current Known Weaknesses

Known areas needing careful improvement:
- model integrity / risk credibility
- remaining-capacity realism
- shared-capacity realism
- sleep and urgency logic
- storage/data integrity
- under-tested core logic
- some architecture layered from rapid iteration

These issues should be improved through small, reviewable micro-packs only.

---

## Current Product Shape

The current product already includes:
- onboarding
- app shell with sidebar navigation
- Home screen
- approaching academic pressure / next important surfaces
- calendar direction
- study logging
- local persistence
- priorities / risk-ranked subject board
- schedule intake/import

The current product should be improved carefully, not treated as a blank slate.

---

## Final Instruction

Treat EXAM ASSIST as a serious product in progress, not a flashy experiment.

Build strong foundations first.
Protect clarity, priority, guidance, trust, and product discipline.

When AI enters:
- it should operate on grounded academic context
- it should transform materials into useful outputs
- it should not replace deterministic prioritization
- it should not quietly cross academic honesty boundaries
