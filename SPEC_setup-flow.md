# Product Spec: First-Run Setup Flow
**EXAM ASSIST — v1 Setup Experience**
Status: Draft
Date: 2026-04-03
Author: Product

---

## 1. Goal of the Setup Flow

This spec covers the **user-facing setup experience** only: what the student sees, answers, and feels. The system-facing structure behind those answers lives in [SPEC_input-contract.md](./SPEC_input-contract.md).

### What it must accomplish

The setup flow has one job: collect the minimum planning inputs needed to produce a first plan that feels genuinely specific to this user's situation — and deliver that plan before the user loses confidence in the product.

It must do this without exposing any planning model internals. The user should experience it as getting organized, not as configuring a system.

Specifically, the setup must:

- Optionally capture the user's name so the product can feel personal from the first screen without making setup feel blocked
- Capture every exam with its date and time
- Capture a quick calibration for each subject (difficulty, resource readiness, current prep level)
- Capture daily study availability
- Produce an initial priority ranking from these inputs before the user reaches the main workspace

### What success looks like

The user arrives at the first plan screen within 4 minutes of starting. The plan shows a subject order that they recognize as reasonable given their actual situation. They are able to see why the top subject is first without the product explaining model logic. They feel oriented — not overwhelmed. The first thing they want to do is interact with the plan, not correct it wholesale.

The first plan does not need to be perfect. It must feel directionally right, immediately usable, and easy to correct.

Success signal: the user begins using the workspace (logging a session or reading the home screen) within 5 minutes of setup ending.

### What failure looks like

The user abandons during setup. The first plan looks like it could apply to any student and not specifically to them. The user immediately overrides the top recommendation because it contradicts something obvious about their situation. The flow takes longer than 6 minutes. The user reaches the workspace and does not know what to do next.

Critical failure: the user has 3 exams in 4 days and the first plan tells them to study the exam that is 10 days away first. This destroys trust before the product has earned any.

---

## 2. Product Rules

### Hidden math vs. visible simplicity

The planning engine runs entirely below the surface. No scores, no percentages, no coefficient terms, no labels like "urgency" or "capacity pressure" appear anywhere during setup or in the first plan. The engine's complexity is a foundation, not a feature. The user never sees it directly.

Every piece of information the user provides is mapped internally to planning parameters. The mapping is the product's responsibility, not the user's.

### User effort limits

- No single question in the setup flow should take more than 5 seconds to answer.
- The total number of questions requiring real judgment is capped at 7 across the entire flow.
- Subject name and exam date are the only required fields. Everything else has a sensible default so the user can always continue without answering.
- Setup must never feel like a form. It should feel like a short conversation.
- The product may capture several internal fields, but the student should feel like they only made a few fast, low-pressure decisions.

### Trust and editability

The first plan is a starting point, not a verdict. The user must be able to edit any subject's calibration immediately after the plan appears — from the plan screen itself, not from a buried settings menu. Corrections should feel lightweight, not like a re-do of the entire setup.

Immediate editability is a trust mechanism, not just a convenience. The product earns credibility by making the first plan easy to tune on the spot.

The product should never present an estimate as a fact. If the plan is based on assumptions, certain parts of the plan can quietly indicate this without exposing model language. Example: "Bu dersi daha önce hiç çalışmadığını varsaydık — istersen bunu güncelleyebilirsin."

### Setup friction limits

- No blocking steps. If the user skips calibration for a subject, the system uses conservative defaults.
- No account creation required. The product is local-first — setup data lives locally from the first screen.
- No file uploads required. Schedule import is offered but never mandatory.
- No multi-select grids, no drag-and-drop reordering, no sliders with numeric labels.

### Time to first plan

The user must see a generated plan within 4 minutes of clicking "Başla" on the welcome screen. If the user has 6 subjects, this constraint requires the calibration step to be fast enough across all subjects. Per-subject calibration must take no longer than 30 seconds total.

---

## 3. Minimum Input Set

The planning engine (lib/risk.ts) requires specific parameters to produce a meaningful risk ranking. These map to the SubjectSeed and StudentConstraints types. Below is every parameter the engine needs, classified by how it is collected.

This is the system's internal rigor behind a setup flow that must still feel light. The student should never experience this as "many inputs."

### Asked directly from the user

| What the user experiences | What the system captures internally |
|---|---|
| "Adın ne?" (optional) | user.name (display only, personalization) |
| Subject name (free text) | subject.title, subject.shortLabel (auto-generated) |
| Exam date and time (date picker) | exam.scheduledAt |
| "Bu ders sana ne kadar zor geliyor?" — 3-point scale: Az / Orta / Zor | subject.difficulty → mapped to 2.0 / 3.5 / 4.8 |
| "Bu dersin kaynakları elinde ne kadar hazır?" — 3-point scale: Hazır / Kısmen / Eksik | subject.resourceFriction → mapped to 1.2 / 2.8 / 4.2 |
| "Bu ders için ne kadar hazır hissediyorsun?" — 3-point scale: İyi / Biraz / Az | subject.reliefFactor + progressGap baseline → mapped to (0.8, 0.2) / (0.4, 0.5) / (0.1, 0.85) |
| "Günde kaç saat çalışabilirsin?" — picker: 2h / 3h / 4h / 5h / 6h / custom | constraints.dailyStudyGoalHours |

Total direct questions per subject: 3 (difficulty, resource readiness, current preparedness).
Total direct questions global: 1 required + 1 optional (daily hours required, name optional).
Maximum total remains small in practice because only subject name and exam date are truly mandatory.

For a student with 4 subjects, this is 17 total inputs. Each takes under 5 seconds. Total input time: under 90 seconds.

### Inferred by the system — never asked

| Parameter | How it is derived |
|---|---|
| subject.contentLoad | difficulty × 0.85 + resourceFriction × 0.15, clamped to [1, 5] |
| subject.practiceNeed | defaults to 2.5 (mid-range); overridden later if user adds study type context |
| subject.targetHours | difficulty-based formula × days until exam, conservative floor of 4h, ceiling of 16h |
| Time pressure (urgency) | calculated from exam.scheduledAt and current date — fully automatic |
| Sleep penalty | derived from exam time (morning vs. afternoon) × system defaults |
| effectiveStudyHoursLeft | derived from dailyStudyGoalHours × days remaining, minus sleep/morning buffers |
| constraints.studyDayStartHour | defaults to 9:00 |
| constraints.standardStudyDayEndHour | defaults to 23:00 |
| constraints.morningSleepCutoffHour | defaults to 23:00 |
| constraints.sleepTargetHours | defaults to 7.0 |
| constraints.wakeBufferMinutes | defaults to 90 |

### Postponed — not collected during setup

These inputs improve plan quality but are not needed for a useful first plan. They are deferred to post-setup refinement or later product phases.

- Study type (memorization / numerical / open-book) — deferred to subject detail editing
- Grade targets or score expectations — deferred to a future product phase
- Past exam performance or historical grades — deferred to Phase 3 per roadmap
- Assignment or project deadlines (non-exam) — deferred to Phase 2
- Specific topic breakdown or syllabus coverage — deferred to resource/library feature
- Sleep constraints or preferred work rhythm (beyond defaults) — available as editable settings post-setup

---

## 4. Setup Flow Structure

The flow consists of 4 collection screens plus 1 payoff screen. Each screen has a single clear purpose and a single primary action.

---

### Screen 1 — Welcome

**Purpose:** Orient the user. Establish the product's character in the first 10 seconds. Optionally collect the user's name for personalization.

**What the user sees:**

A calm, full-screen welcome with dark background. The product name appears in the upper area without a logo lockup. Below it, one warm headline — something like:

> "Sınav dönemini birlikte düzenleyelim."

A short subtitle under it:

> "Birkaç soruyu cevaplayarak başlayalım. İki dakika içinde ilk planın hazır olacak."

A single text input: "Adın ne?" — minimal styling, auto-focused, clearly optional.

A primary button: "Başla →"

No feature list. No capability matrix. No screenshots of the product. Nothing that makes this feel like a product tour.

**What the user does:** Optionally types their first name (or a nickname) and presses "Başla".

**What the system captures internally:** user.name (used for personalization throughout the workspace).

**Why this screen exists:** A named welcome can help the product feel personal, but the simplest possible start matters more than personalization. This screen must not create the feeling that the user needs to "fill something out" before the product begins helping.

---

### Screen 2 — Exams

**Purpose:** Collect the academic structure. This is the most critical screen in the entire setup flow because exam dates are the foundation of every planning calculation.

**What the user sees:**

A calm heading:

> "Sınavların hangi tarihlerde?"

A short subtext:

> "Her sınav için ders adını ve tarihini ekle. Sonradan değiştirebilirsin."

Below: a list that starts empty. An "Sınav ekle" button adds a new row. Each row contains:
- A text field for the subject name (placeholder: "Ders adı")
- A date + time picker for the exam (compact, no calendar wall)
- A remove icon on the right

As subjects are added, they appear in a clean vertical list with subtle entry animation.

When at least one exam is entered, the primary button activates: "Devam →"

An optional secondary action at the bottom: "Takvim dosyası yükle" — for users who want to import from a file. This is offered but never required.

**What the user does:** Adds between 1 and 8 exams with name and date. Proceeds when done.

**What the system captures internally:** An array of exam objects, each with title, scheduledAt (ISO string), and a generated id. Short labels are automatically generated from the subject name (first word or first 3 characters, uppercased).

**Why this screen exists:** Without exam dates, the system cannot calculate time pressure, urgency, or any meaningful ranking. This is the non-negotiable input.

---

### Screen 3 — Quick Calibration

**Purpose:** Collect per-subject calibration so the plan reflects the actual difficulty of each subject, not just time pressure alone.

**Design principle:** This screen must not feel like a form. The user should feel like they are answering a few quick gut-check questions, not filling out a subject profile.

**What the user sees:**

The screen shows one subject at a time. At the top: a small indicator showing progress through subjects — e.g., dots or "1 / 4" in very small text.

The subject name appears as a calm heading:

> [Subject name]

Below it, three quick questions in sequence. Each question presents 3 pill-style options. The user taps one and immediately moves to the next question.

Question 1 — Difficulty:
> "Bu ders sana ne kadar zor geliyor?"
> [ Az ] [ Orta ] [ Zor ]

Question 2 — Resource readiness:
> "Ders materyallerin ne kadar hazır?"
> [ Hazır ] [ Kısmen ] [ Eksik ]

Question 3 — Current preparedness:
> "Bu ders için şu an ne kadar hazır hissediyorsun?"
> [ İyi ] [ Biraz ] [ Az ]

After the third answer for a subject, the screen smoothly transitions to the next subject. When all subjects are calibrated, the primary button appears: "Devam →"

A "Şimdilik atla" option is always visible but de-emphasized. Skipping a subject applies conservative defaults and protects momentum.

**What the user does:** For each subject, taps 3 pill choices. Each choice is immediate — no confirmation needed.

**What the system captures internally:** Per subject: difficulty (numeric), resourceFriction (numeric), and a combined reliefFactor + progressGap baseline — all mapped from the 3-point selections.

**Why this screen exists:** Without calibration, all subjects would be treated as equal difficulty with equal resource access. A 4-credit quantitative course and a 2-credit essay course would generate identical weights if the model only has time data. Calibration is the signal that makes the plan specific.

---

### Screen 4 — Your Time

**Purpose:** Capture daily study availability so the plan is grounded in realistic capacity — not an aspirational number.

**What the user sees:**

A calm heading:

> "Günde kaç saat çalışabilirsin?"

A short subtext — honest, not motivational:

> "Ortalama, gerçekçi bir rakam yeterli. Sonradan ayarlayabilirsin."

A visual picker with common values: 2h — 3h — 4h — 5h — 6h
A "Diğer" option opens a simple number input for custom values.

The selected value is highlighted. Default pre-selection: 4h (conservative middle).

Primary button: "Planı Oluştur →"

**What the user does:** Selects their realistic daily study capacity. Presses "Planı Oluştur".

**What the system captures internally:** constraints.dailyStudyGoalHours. All other StudentConstraints use the defaults defined in the Minimum Input Set section.

**Why this screen exists:** Daily capacity is the denominator for every time-pressure calculation. A student with 6 hours per day and one with 2 hours per day face fundamentally different situations even with identical exam schedules. This single input dramatically improves plan accuracy.

---

### Screen 5 — Plan Ready (Payoff)

This screen is the payoff. It is described in full detail in Section 6.

---

## 5. UX Interaction Style

### Control types

The flow uses exactly three input types:

**Free text** — used only for the user's name and subject names. Both are short fields. The name field is optional and must never feel blocking.

**Date + time picker** — used for exam scheduling. Should be a compact native-style picker, not a full calendar wall. The user needs to set a date and a time. The interaction should feel like filling in a meeting invite, not configuring a database.

**Pill selections** — used for all calibration questions. Three options per question, displayed horizontally as tappable labels. Tapping one immediately advances to the next question — no "confirm" step. Selected state is visually distinct (filled background, not just a border change). These must feel like instant gut-check decisions, not evaluations.

### What should feel lightweight

Every calibration choice. The user should not feel pressure to answer "correctly." The product should communicate — through design, not through copy — that these are starting estimates that can be adjusted later. This is achieved through the pill format (low commitment, high speed), the de-emphasized "skip" option, and the absence of any progress metric that implies scoring.

Transitions between subjects in Screen 3 should be smooth and fast. The user should feel like they are moving through subjects quickly, not grinding through a form.

### What should never feel like a boring form

The setup flow is not a data entry task. It is an onboarding experience. Every screen should have one clear focal point, generous whitespace, and copy that sounds like a calm product — not a help text.

Never: a grid of inputs for all subjects at once.
Never: a "next" button that does nothing visible for a moment.
Never: a loading spinner between setup screens.
Never: validation errors in red for optional fields.

### How to keep the flow premium and calm

Restrained motion — only entry animations, no decorative motion.

Dark background throughout, matching the main workspace so the transition into the app feels continuous, not like a jump.

Copy tone throughout: calm, polite, direct. No exclamation points. No "You're doing great!" No "Almost there!" These patterns feel hollow in a study product.

Progress should be visible but understated. Dots at the top indicating screen position, not a percentage counter.

The product should never feel like it is rushing the user. There is no countdown timer, no "complete setup to unlock features" pressure.

---

## 6. Output / Payoff

When the user presses "Planı Oluştur" on Screen 4, the system runs the risk engine with the collected inputs and produces the initial ranking. This should take under 1 second locally.

### What the user sees

The plan screen appears with a calm transition. It does not look like a report. It looks like the main workspace — because it IS the main workspace, now populated with the user's data for the first time.

The layout mirrors the production Priorities screen but with a welcome overlay or banner that signals: this is your first plan. Something like:

> "[Ad], planın hazır. İstediğin zaman buradan çalışmaya başlayabilirsin."

Below this, the priority board appears:

**Lead Priority** — the subject the model has ranked highest. Displayed with its name, exam date, and a one-sentence explanation in calm Turkish human language. Examples of good explanations:

- "Sınavı bu hafta içinde ve hazırlık henüz tam değil."
- "Bu ders biraz daha zaman istiyor ve tarih yaklaşıyor."
- "Kaynaklar eksik olduğu için biraz erken başlamak iyi olabilir."

No scores. No numeric pressure values. No "risk: critical" labels.

**Next up** — the next 2–3 subjects in descending priority. Each shown with subject name, exam date, and the label: HIGH / MODERATE / LOW. These labels are acceptable because they are relative qualifiers, not model internals.

**Later** — remaining subjects displayed more quietly, with less visual prominence.

On the right side, or below on smaller screens: a Today card. Simple content:

- Next exam: [subject name] — [days remaining]
- Suggested focus for today: [top-ranked subject]
- Daily goal: [Xh]
- Logged today: 0h

### What should be immediately editable

Every subject card has a discreet edit icon. Pressing it opens a lightweight inline edit that shows the three calibration questions (difficulty, resources, preparedness) and lets the user change their answers. The ranking updates immediately when they save.

This immediate editability is part of the payoff. The user should feel that the first plan is meant to be shaped, not obeyed. If they disagree with the starting order, the product should make correction feel natural and fast.

The daily hours goal has an edit affordance directly on the Today card.

Exam dates are editable from the Schedule screen (accessible via sidebar), not from the plan screen directly — to keep the plan screen focused.

### What the first plan must NOT include

- A numeric pressure score or urgency score of any kind
- Any phrase that includes the words "risk," "coefficient," "capacity pressure," "urgency," or "optimization"
- A bar chart or radar chart of subject scores
- A suggested hour-by-hour schedule (this is too precise for a first plan)
- A deadline countdown for every subject simultaneously (too much pressure all at once)

---

## 7. Risks

### What would make this setup too heavy

Asking the user to evaluate more than 3 attributes per subject. Introducing a 5-point scale for any question instead of a 3-point one. Requiring the user to assign target hours manually. Showing all subjects on Screen 3 simultaneously in a grid. Adding an "advanced options" section visible during setup. Requiring a schedule file import before generating the plan. Adding a "study type" question (memorization / numerical / open-book) during setup rather than deferring it.

Any of these would push setup time past 6 minutes and would make the flow feel like configuration rather than onboarding.

### What would make this setup too shallow

Collecting only subject names and exam dates, with no calibration. This produces a plan based purely on time proximity — whichever exam is soonest is ranked highest. A student with a very difficult exam next month and an easy exam next week would get a plan that ignores the difficulty gap entirely. They would rightly not trust it.

The plan must feel specific to the user's actual situation, not just their calendar.

### What would make the first plan untrustworthy

Showing a recommended subject that contradicts something the user just entered. For example: the user said IAS is their hardest subject and they feel unprepared — but IAS appears third in the ranking because its exam is 6 days away and another subject's exam is 4 days away. If the difference in time pressure is small and the difficulty gap is large, the ranking should reflect this. The model must be calibrated so that obvious cases produce obvious rankings.

Showing a confidence level that implies false precision. "Estimated pressure: 67.4" is worse than no number at all.

Showing language that sounds like it was generated by a model rather than written by a product. "Progress is still well short of the 11h target, resource coverage still looks thin relative to the workload" should never appear in the UI. This is the current production weakness most visible to the user.

### What would create drop-off

Setup taking more than 6 minutes. A loading spinner that lasts more than 2 seconds. A screen that looks like a settings panel. Any moment where the user does not know what to do next. A first plan that looks blank or empty because calibration was skipped. More than 5 screens before the payoff.

---

## 8. Recommendation

### The recommended setup flow for EXAM ASSIST v1

**4 screens + 1 payoff. Target time: under 4 minutes for a student with 4–5 subjects.**

---

**Screen 1 — Welcome** (30 seconds)
One headline. One name field. One button.
Purpose: personal first contact and name capture.
Copy direction: "Sınav dönemini birlikte düzenleyelim."

---

**Screen 2 — Exams** (60–90 seconds)
Dynamic list. Add subjects + dates. File import optional but surfaced.
Purpose: collect the academic calendar.
Copy direction: "Sınavların hangi tarihlerde?"

---

**Screen 3 — Quick Calibration** (60–90 seconds for 4 subjects)
One subject at a time. Three pill choices each. Instant progression.
Purpose: make the plan specific, not generic.
Copy direction: No screen headline needed — subject name is the heading. Questions are the content.

---

**Screen 4 — Your Time** (15 seconds)
Single visual picker. Conservative default pre-selected.
Purpose: ground the plan in realistic daily capacity.
Copy direction: "Günde kaç saat çalışabilirsin?"

---

**Screen 5 — Plan Ready** (immediate)
Main workspace, populated. Warm one-line welcome. Priority board visible. No loading state.
Purpose: deliver the payoff and open the product loop.
Copy direction: "[Ad], planın hazır. İstediğin zaman buradan başlayabilirsin."

---

### What this flow defers (and why)

Study type (memorization vs. numerical vs. open-book) — defers to per-subject editing post-setup. Adds value but increases calibration time by ~30%.

Assignment and project deadlines — defers to Phase 2. Not needed for exam-week planning core.

Language selection — defers to Settings. Turkish is the default; no need to add a screen for this in v1.

Advanced constraints (sleep schedule, work hours, commute) — defers to Settings. Default values are conservative and functional.

Grade targets — defers to Phase 3. Not relevant to the first plan.

---

### What must be true when this spec is implemented

1. A student with 5 exams in the next 10 days can complete setup in under 4 minutes.
2. The first plan ranks subjects in an order that a reasonable student would agree is sensible given what they entered.
3. No model-internal language appears anywhere in the setup flow or the first plan.
4. Every input captured during setup persists to localStorage immediately and is not lost on browser refresh.
5. The user can edit any subject's calibration from the plan screen without re-running the entire setup.
6. The setup flow is skippable at any point — a user who skips calibration still reaches a functional (if less accurate) first plan.
7. The first plan is directionally right, immediately usable, and obviously easy to correct.

---

*This spec covers the v1 first-run setup flow only. It does not cover re-onboarding flows, returning user states, or multi-device sync. Those are deferred per the roadmap.*
