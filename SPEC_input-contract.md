# Input Contract: First-Run Setup Flow
**EXAM ASSIST — v1 Planning Input Contract**
Status: Draft
Date: 2026-04-03
Depends on: SPEC_setup-flow.md, lib/types.ts, lib/risk.ts

---

## 1. Purpose

### What this document is

This document defines the exact contract between the user-facing setup questions and the internal planning fields that power the risk engine. It is the bridge layer between what the user experiences and what the system computes.

It is not a UI spec (see SPEC_setup-flow.md, which defines the student-facing setup experience).
It is not a risk model spec (see lib/risk.ts).
It is the connective tissue between the two.

### Why it matters

The current product runs entirely on hardcoded seed data. `lib/risk.ts` imports directly from `lib/seed-data.ts`. `lib/seed-data.ts` contains hardcoded SubjectSeed objects with fixed numeric values for difficulty, resourceFriction, reliefFactor, targetHours, and others. No real user has ever fed their actual situation into the planning engine.

This contract defines exactly what replaces those hardcoded seeds once the real setup flow exists. Without this contract, the implementation of the setup flow and the planning engine remain disconnected — changes to one break the other silently.

### Why it matters for hidden intelligence architecture

The mapping layer is where hidden intelligence is enforced. The user answers "Bu ders zor mu?" and taps "Zor." The system maps that to `difficulty: 4.8`. This translation must be defined precisely and kept in one place so it can be tested, audited, and adjusted without touching user-facing copy or engine logic.

---

## 2. Input Categories

### Category A — User Profile Inputs
Information about the person using the product. Collected once at setup. Persisted globally.

### Category B — Exam Inputs
Structured academic calendar data. One record per exam. Collected at setup. Editable from the Schedule screen at any time.

### Category C — Subject Calibration Inputs
Per-subject planning signals collected as simple 3-point selections during setup. These are the primary replacement for the hardcoded SubjectSeed values. Editable from the plan screen.

### Category D — Study Capacity Inputs
The student's daily availability. A single value collected at setup. Editable from settings.

### Category E — Inferred / System-Generated Values
Values computed by the system from Categories A–D. Never asked directly. Never shown in raw form to the user. Recalculated as needed from raw stored answers.

### Category F — Runtime-Computed Values
Values computed fresh at runtime from stored data. Never persisted. These are the outputs of the risk engine, not inputs to it.

### Category G — Postponed Values
Fields that improve plan quality but are not needed for a useful first plan. These are explicitly deferred to later phases. Placeholders are noted so the type system can accommodate them without immediate breaking changes.

---

## 3. Field-by-Field Contract

### Category A — User Profile

---

**`user.name`**
- Type: `string`
- Source: Asked directly (Screen 1 of setup)
- Required: No (optional — default: empty string)
- Default if skipped: empty string; product uses generic greeting
- Editable later: Yes — Settings screen
- Persists to: `examassist_user_profile` (localStorage)
- Notes: Display-only. Never passed to the planning engine. Used only for personalization in headings and welcome copy.

---

**`user.setupCompletedAt`**
- Type: `string` (ISO 8601)
- Source: System-generated when user completes setup flow
- Required: Yes — marks onboarding as done
- Default if skipped: n/a (not skippable; generated automatically)
- Editable later: No
- Persists to: `examassist_user_profile` (localStorage)
- Notes: Replaces the current `PersistedOnboardingState.completedAt` which is the only thing persisted today.

---

**`user.language`**
- Type: `"tr" | "en"`
- Source: Defaulted — browser locale checked first, then `"tr"` as fallback
- Required: No
- Default if skipped: `"tr"`
- Editable later: Yes — Settings screen
- Persists to: `examassist_user_profile` (localStorage)
- Notes: v1 only uses Turkish. This field is captured and stored now so it can be used in v2 without a migration. Not surfaced in setup UI.

---

### Category B — Exam Inputs

Each exam is one record. The user may add 1–8 exams during setup. The existing `Exam` type in `lib/types.ts` is close to the right shape for this category. The main required change is loosening `SubjectId` so real user-created subjects can exist. What also changes is how these records are created (from real user input instead of seed data).

---

**`exam.id`**
- Type: `string` (UUID v4)
- Source: System-generated on record creation
- Required: Yes (auto-generated)
- Default if skipped: n/a
- Editable later: No
- Persists to: `examassist_exams` (localStorage)

---

**`exam.title`**
- Type: `string`
- Source: Asked directly (Screen 2 — subject name field)
- Required: Yes
- Default if skipped: n/a (user must provide at least one)
- Editable later: Yes — Schedule screen
- Persists to: `examassist_exams` (localStorage)
- Notes: This is the display name. It is also the source for shortLabel derivation (see below).

---

**`exam.shortLabel`**
- Type: `string` (max 6 characters, uppercase)
- Source: Inferred from `exam.title` at creation time
- Derivation logic: take first word of title; if ≤ 6 chars, uppercase it; if longer, take first 3 chars + first letter of second word if present; always uppercase
- Examples: "International Accounting Standards" → "IAS", "Retail Marketing" → "RETAIL", "Quality Management" → "QUALIT"
- Required: Yes (auto-generated)
- Editable later: No (v1); Yes — subject detail screen (v2)
- Persists to: `examassist_exams` (localStorage)

---

**`exam.scheduledAt`**
- Type: `string` (ISO 8601, includes time and assumed local timezone)
- Source: Asked directly (Screen 2 — date + time picker)
- Required: Yes — this is the single most important planning input
- Default if skipped: n/a (required field; subject cannot be added without a date)
- Editable later: Yes — Schedule screen
- Persists to: `examassist_exams` (localStorage)
- Notes: Timezone handling: store in local ISO string at setup time. A future micro-pack should add explicit timezone awareness. v1 assumes local system timezone.

---

**`exam.subjectId`**
- Type: `SubjectId` (currently a union of hardcoded string literals in lib/types.ts)
- Source: System-generated at creation time
- Required: Yes (auto-generated)
- **IMPORTANT v1 breaking change note:** The current `SubjectId` type is a hardcoded union: `"ias" | "retail-marketing" | "service-marketing" | "quality-management" | "ait" | "pom"`. This must be loosened to `string` to support arbitrary user subjects. This is a required type change for the setup flow to work.
- Editable later: No
- Persists to: `examassist_exams` (localStorage)
- Notes: `exam.subjectId` is the canonical link key between the exam record and its subject calibration record. It must match exactly one `subject.id`. This relationship is a single-source-of-truth rule, not a convenience.

---

### Category C — Subject Calibration Inputs

This is the most important category to define precisely. Three user-facing questions map to multiple internal fields. Each question's 3-point answer is stored as a raw enum value, then normalized to numeric internal values through the mapping layer (see Section 4).

All subject calibration data is stored under a new key: `examassist_subject_seeds`. This replaces the hardcoded `subjectSeeds` array in `lib/seed-data.ts`.

---

**`subject.id`**
- Type: `string` (matches `exam.subjectId`)
- Source: System-generated (same ID used in the exam record)
- Required: Yes
- Persists to: `examassist_subject_seeds` (localStorage)
- Notes: `subject.id` must be copied directly from `exam.subjectId`. The subject record does not invent its own identifier. If the two drift, the planning engine becomes untrustworthy.

---

**`subject.title`**
- Type: `string`
- Source: Copied from `exam.title` at subject record creation
- Required: Yes
- Editable later: Via exam title edit on Schedule screen (cascades to subject record)
- Persists to: `examassist_subject_seeds` (localStorage)

---

**`subject.shortLabel`**
- Type: `string`
- Source: Copied from `exam.shortLabel`
- Required: Yes
- Persists to: `examassist_subject_seeds` (localStorage)

---

**`subject.difficulty`** ← maps from calibration Question 1
- Type: `number` (1.0–5.0, two decimal places)
- Source: Inferred from raw answer `calibration.difficultyRaw`
- Mapping: see Section 4
- Required: No — defaults to 3.0 (mid-range) if skipped
- Editable later: Yes — plan screen quick-edit (re-answers the question)
- Persists to: `examassist_subject_seeds` (localStorage)

---

**`subject.contentLoad`** ← derived from difficulty + resourceFriction
- Type: `number` (1.0–5.0)
- Source: Inferred — computed from difficulty and resourceFriction
- Formula: `clamp(difficulty * 0.80 + resourceFriction * 0.20, 1.0, 5.0)`
- Required: n/a (always computed)
- Editable later: No (computed — edits flow from difficulty and resourceFriction changes)
- Persists to: `examassist_subject_seeds` (localStorage)
- Notes: Recomputed and re-stored whenever difficulty or resourceFriction is updated. This is a v1 heuristic, not a scientific measurement.

---

**`subject.practiceNeed`** ← defaulted in v1
- Type: `number` (1.0–5.0)
- Source: Defaulted to `2.5` in v1
- Required: n/a
- Editable later: Via subject detail screen (v2)
- Persists to: `examassist_subject_seeds` (localStorage)
- Notes: Deferred to v2 when study type input (memorization / numerical / open-book) is added. The default of 2.5 is a conservative v1 heuristic, not a truth claim.

---

**`subject.resourceFriction`** ← maps from calibration Question 2
- Type: `number` (1.0–5.0)
- Source: Inferred from raw answer `calibration.resourceReadinessRaw`
- Mapping: see Section 4
- Required: No — defaults to `2.5` if skipped
- Editable later: Yes — plan screen quick-edit
- Persists to: `examassist_subject_seeds` (localStorage)

---

**`subject.reliefFactor`** ← maps from calibration Question 3
- Type: `number` (0.0–1.0)
- Source: Inferred from raw answer `calibration.preparednessRaw`
- Mapping: see Section 4
- Required: No — defaults to `0.25` if skipped
- Editable later: Yes — plan screen quick-edit
- Persists to: `examassist_subject_seeds` (localStorage)
- Notes: A high reliefFactor reduces the subject's risk score. This reflects genuine preparedness signals (familiarity with material, confidence, open-book format signals).

---

**`subject.targetHours`** ← inferred from difficulty
- Type: `number` (hours, one decimal place)
- Source: Inferred from `subject.difficulty` using a lookup
- Mapping:
  - difficulty ≤ 2.0 → `4.0h`
  - difficulty ≤ 3.0 → `6.0h`
  - difficulty ≤ 3.8 → `8.0h`
  - difficulty ≤ 4.5 → `11.0h`
  - difficulty > 4.5 → `14.0h`
- Required: n/a (always computed from difficulty)
- Editable later: Yes — subject detail screen (v2); not editable in v1
- Persists to: `examassist_subject_seeds` (localStorage)
- Notes: This is a directionally honest v1 estimate. It is tunable and should not be treated as a scientific truth. In v2, targetHours can be adjusted by the user from the subject detail screen.

---

**`subject.initialStudiedCredit`** ← inferred from calibration Question 3
- Type: `number` (hours)
- Source: Inferred from `calibration.preparednessRaw`
- This field is **NEW** — it does not exist in the current SubjectSeed type
- Purpose: When a user says they already feel "İyi" (well prepared), the system should not treat them as having 0 progress. This is a setup-time preparedness credit added for the initial plan only. It is not real logged study time.
- Mapping: see Section 4
- Required: No — defaults to `0` if preparedness is skipped
- Editable later: Implicitly — as the user logs real sessions, `initialStudiedCredit` becomes less significant. It should be phased out automatically once `hoursStudied` exceeds it.
- Persists to: `examassist_subject_seeds` (localStorage)
- Notes: This is the cleanest way to handle the "progressGap is always 1.0 for a new user" problem without asking the user for a fake hours estimate. It should always be described internally as a preparedness credit, never as actual study history.

---

### Category D — Study Capacity Inputs

---

**`constraints.dailyStudyGoalHours`**
- Type: `number` (0.5 step increments, range 1.0–10.0)
- Source: Asked directly (Screen 4 — visual picker)
- Required: No — defaults to `4.0` if skipped
- Default reasoning: 4 hours is a conservative realistic figure for a typical student. Defaulting to 5+ would overestimate capacity and produce an over-optimistic plan.
- Editable later: Yes — Sessions screen (visible daily goal), Settings
- Persists to: `examassist_constraints` (localStorage)

---

**`constraints.studyDayStartHour`**
- Type: `number` (hour, 0–23)
- Source: Defaulted to `9`
- Required: No
- Editable later: Yes — Settings (advanced)
- Persists to: `examassist_constraints` (localStorage)
- Notes: Not surfaced during setup. Part of the hidden intelligence layer.

---

**`constraints.standardStudyDayEndHour`**
- Type: `number` (hour, 0–23)
- Source: Defaulted to `23`
- Required: No
- Editable later: Yes — Settings (advanced)
- Persists to: `examassist_constraints` (localStorage)

---

**`constraints.morningSleepCutoffHour`**
- Type: `number` (hour, 0–23)
- Source: Defaulted to `23`
- Required: No
- Editable later: Yes — Settings (advanced)
- Persists to: `examassist_constraints` (localStorage)

---

**`constraints.sleepTargetHours`**
- Type: `number` (hours)
- Source: Defaulted to `7.0`
- Required: No
- Editable later: Yes — Settings (advanced)
- Persists to: `examassist_constraints` (localStorage)

---

**`constraints.wakeBufferMinutes`**
- Type: `number` (minutes)
- Source: Defaulted to `90`
- Required: No
- Editable later: Yes — Settings (advanced)
- Persists to: `examassist_constraints` (localStorage)

---

### Category E — Runtime-Computed Values

These are computed by the risk engine at runtime from stored inputs. They are never stored and never shown in raw form to the user.

They should also be treated as live estimates built on v1 heuristics and tunable defaults, not immutable truths.

| Computed field | Computed from | Used for |
|---|---|---|
| `progressGap` | `(targetHours - (hoursStudied + initialStudiedCredit)) / targetHours`, clamped [0,1] | Risk score component; note that `initialStudiedCredit` is setup-time preparedness credit, not logged study |
| `effectiveStudyHoursLeft` | `dailyStudyGoalHours × days remaining × efficiency factor` | Capacity pressure calculation |
| `capacityPressure` | `remainingTargetHours / effectiveStudyHoursLeft` | Risk score component |
| `urgencyPressure` | `clamp((72 - hoursUntilExam) / 48, 0, 1.5)` | Risk score component |
| `baseComplexity` | `0.3×contentLoad + 0.3×difficulty + 0.2×practiceNeed + 0.2×resourceFriction` | Risk score component |
| `sleepPenalty` | exam time × sleep constraint defaults | Risk score component |
| `reliefBoost` | `reliefFactor × (1 - progressGap × 0.35)` | Risk score reduction |
| `score` | Full weighted formula | Ranking |
| `label` | Score thresholds | "Low" / "Moderate" / "High" / "Critical" |
| `explanation` | Score breakdown → language translation layer | Human-readable plan copy |

---

### Category F — Postponed Values (v2+)

These fields improve plan quality meaningfully but create setup friction that outweighs their early benefit. Do not include in v1.

| Field | Internal name | Deferred to | Reason for deferral |
|---|---|---|---|
| Study type | `subject.studyType` | v2 | Adds cognitive load at setup; 2.5 default for practiceNeed is sufficient for v1 |
| Open-book flag | `subject.openBook` | v2 | Meaningfully affects reliefFactor but setup is not the right moment to ask |
| Daily schedule window | `constraints.studyDayStartHour/EndHour` | Settings (available now) | Not visible in setup; defaults are functional |
| Grade target | `subject.gradeTarget` | v3 | Not relevant to priority ranking |
| Exam type | `exam.type` (midterm/final) | v2 | Informational only in v1 |
| Assignment deadlines | Separate deadline type | v2 | Non-exam deadlines need separate data model |
| Past performance | `subject.historicalGrade` | v3 | Requires trust before users disclose this accurately |

---

## 4. Mapping Layer

The mapping layer is the exact translation table between raw user answers and internal numeric planning fields. This layer must be implemented as a pure function: `rawAnswersToSubjectSeed(answers, examDate, now)`. It must be independently testable with no UI dependency.

These mappings are v1 heuristics and tunable defaults. They are meant to produce a directionally useful first plan, not to claim scientific precision.

### Question 1 → `subject.difficulty`

User-facing question: "Bu ders sana ne kadar zor geliyor?"
Raw answer type: `"az" | "orta" | "zor"`

| Raw answer | Internal `difficulty` value |
|---|---|
| `"az"` | `2.0` |
| `"orta"` | `3.5` |
| `"zor"` | `4.8` |
| skipped | `3.0` (conservative mid) |

Design note: The scale does not use the full 1–5 range. The floor is 2.0 (not 1.0) because no exam that a student is taking deserves a "trivial" difficulty weight. The ceiling is 4.8 (not 5.0) to preserve room for future tuning without system ceiling collisions. These values are v1 defaults, not scientific facts.

---

### Question 2 → `subject.resourceFriction`

User-facing question: "Ders materyallerin ne kadar hazır?"
Raw answer type: `"hazir" | "kismen" | "eksik"`

| Raw answer | Internal `resourceFriction` value |
|---|---|
| `"hazir"` | `1.2` |
| `"kismen"` | `2.8` |
| `"eksik"` | `4.2` |
| skipped | `2.5` (mid-range default) |

Design note: `resourceFriction` appears in `baseComplexity` and `resourceGap` calculations. A value of 1.2 for "ready" means resources still add some friction (no subject is frictionless), while 4.2 for "missing" creates meaningful pressure without maxing out the model. These are v1 calibration defaults, not empirical constants.

---

### Question 3 → `subject.reliefFactor` + `subject.initialStudiedCredit`

User-facing question: "Bu ders için şu an ne kadar hazır hissediyorsun?"
Raw answer type: `"iyi" | "biraz" | "az"`

| Raw answer | `reliefFactor` | `initialStudiedCredit` |
|---|---|---|
| `"iyi"` | `0.75` | `targetHours × 0.40` |
| `"biraz"` | `0.35` | `targetHours × 0.15` |
| `"az"` | `0.10` | `0` |
| skipped | `0.25` | `0` |

Design note: `initialStudiedCredit` is computed as a fraction of `targetHours` so it scales correctly across subjects of different difficulty levels. A student who feels "İyi" about a 4h subject gets 1.6h credited; about a 14h subject, 5.6h. This is intentional — the signal "I feel prepared" is more meaningful relative to how much preparation is required. Again, this is setup-time preparedness credit, not logged study.

`reliefFactor` feeds into `reliefBoost` in the risk score formula, which has a -5 weight. This directly reduces the pressure score for subjects where the student already has a comfortable footing.

---

### Question 4 (global) → `constraints.dailyStudyGoalHours`

User-facing question: "Günde kaç saat çalışabilirsin?"
Raw answer type: `number` (from picker or custom input)

Direct mapping: `constraints.dailyStudyGoalHours = pickedValue`
No translation needed. The picked value is the internal value.

---

### Derived field: `subject.contentLoad`

Not asked. Computed immediately after questions 1 and 2 are answered.

`contentLoad = clamp(difficulty × 0.80 + resourceFriction × 0.20, 1.0, 5.0)`

This formula weights difficulty more heavily than resource friction because content volume is more tightly correlated with inherent subject difficulty than with whether the student has the textbook ready.

---

### Derived field: `subject.targetHours`

Not asked. Computed from difficulty after question 1.

| `difficulty` range | `targetHours` |
|---|---|
| ≤ 2.0 | `4.0` |
| 2.1 – 3.0 | `6.0` |
| 3.1 – 3.8 | `8.0` |
| 3.9 – 4.5 | `11.0` |
| > 4.5 | `14.0` |

These are directionally honest estimates for a typical Turkish university exam context. They are not claimed to be precise. They are v1 heuristics and should be labeled internally as estimates and treated accordingly.

---

## 5. Persistence Model

### Storage keys (localStorage)

The v1 setup flow requires four storage keys. Two already exist in partial form. Two are new.

---

**`examassist_user_profile`** — NEW (replaces current `PersistedOnboardingState`)

```
{
  name: string,
  setupCompletedAt: string,    // ISO 8601
  language: "tr" | "en"
}
```

What is stored: raw user profile answers + setup completion timestamp.
What is NOT stored: anything derived from this data.

---

**`examassist_exams`** — EXISTS (currently seeded; will become user-populated)

```
Exam[] — existing shape is mostly reusable; `SubjectId` must be loosened
```

What is stored: exam records created from user input during setup, plus any added later via Schedule screen or file import.
Change required: the `SubjectId` type inside `Exam` must change from a hardcoded union to `string`.
Source-of-truth rule: `exam.subjectId` is the canonical identity key. The subject record must mirror it exactly rather than inventing a second identifier.

---

**`examassist_subject_seeds`** — NEW (replaces hardcoded `subjectSeeds` in seed-data.ts)

```
SubjectSeed[] — existing type, with two additions:
  + initialStudiedCredit: number
  + calibration: {
      difficultyRaw: "az" | "orta" | "zor" | null,
      resourceReadinessRaw: "hazir" | "kismen" | "eksik" | null,
      preparednessRaw: "iyi" | "biraz" | "az" | null
    }
```

What is stored: both the raw answers AND the normalized numeric fields.

Why store both? Because if the mapping formula changes (e.g., "Zor" is remapped from 4.8 to 5.0), we can re-derive the normalized numeric fields from the stored raw answers without asking the user again. Raw answers are the source of truth; normalized fields are the derived cache.

The `calibration` sub-object is the raw answer store. The top-level numeric fields (`difficulty`, `resourceFriction`, `reliefFactor`, `targetHours`, `contentLoad`, `initialStudiedCredit`) are the normalized derived fields.

---

**`examassist_constraints`** — NEW (replaces hardcoded `studentConstraints` in seed-data.ts)

```
StudentConstraints — existing shape is reusable for v1 defaults
```

What is stored: the complete constraints object, with user-set `dailyStudyGoalHours` and system defaults for all other fields.
What is NOT stored: computed values derived from constraints (these are always runtime).

---

**`examassist_sessions`** — EXISTS — current shape is acceptable for v1

**`examassist_schedule_items`** — EXISTS — current shape is acceptable for v1

---

### What must NOT be persisted

The following must never be written to localStorage:

- Risk scores or pressure numbers (`score: 67`)
- `progressGap`, `capacityPressure`, `urgencyPressure` — these are runtime calculations
- `effectiveStudyHoursLeft` — runtime
- `explanation` strings — runtime (these are generated from live data, not stored copy)
- `RiskEngineSnapshot` — this is a runtime output object, not a stored state object

The reason: persisting derived values creates stale-state bugs. If the user logs a new session and the score does not update because the old score is cached in storage, the plan becomes untrustworthy. All planning calculations must happen live from raw stored inputs.

---

## 6. Editability Rules

### From the Plan screen (immediate post-setup editing)

The plan screen is the primary editing surface for subject calibration. A lightweight edit affordance on each subject card opens a re-answer view showing the three calibration questions. Changes take effect immediately and trigger a live plan recalculation.

Editable from the plan screen:
- `calibration.difficultyRaw` (and derived `difficulty`, `contentLoad`, `targetHours`)
- `calibration.resourceReadinessRaw` (and derived `resourceFriction`, `contentLoad`)
- `calibration.preparednessRaw` (and derived `reliefFactor`, `initialStudiedCredit`)

NOT editable from the plan screen:
- Exam date or time (goes through Schedule screen)
- Daily hours (goes through Sessions daily target or Settings)

---

### From the Schedule screen

The Schedule screen is the canonical home for academic calendar data.

Editable from the Schedule screen:
- `exam.title`
- `exam.scheduledAt` (date and time)
- Adding new exams
- Removing exams (with confirmation)

When an exam is edited or removed, the corresponding subject seed record should update accordingly (cascade: exam title change → subject title + shortLabel update).

---

### From Settings

Settings is the right place for global constraints and profile data that the user rarely needs to change.

Editable from Settings:
- `user.name`
- `user.language`
- `constraints.dailyStudyGoalHours`
- `constraints.studyDayStartHour`
- `constraints.standardStudyDayEndHour`
- `constraints.morningSleepCutoffHour`
- `constraints.sleepTargetHours`
- `constraints.wakeBufferMinutes`

---

### From a future Subject Detail screen (v2)

This screen does not exist in v1 but should be designed for.

Editable from Subject Detail (v2):
- `subject.targetHours` (override the inferred value)
- `subject.practiceNeed`
- `subject.shortLabel`
- `exam.type` (midterm / final / assignment)

---

## 7. v1 Boundaries

### Fields needed in v1 (implement now)

| Field | Category |
|---|---|
| `user.name` | Profile |
| `user.setupCompletedAt` | Profile |
| `user.language` | Profile |
| `exam.id`, `exam.title`, `exam.shortLabel`, `exam.scheduledAt`, `exam.subjectId` | Exam |
| `subject.id`, `subject.title`, `subject.shortLabel` | Subject |
| `subject.difficulty` | Subject Calibration |
| `subject.contentLoad` | Subject Calibration |
| `subject.practiceNeed` (default 2.5) | Subject Calibration |
| `subject.resourceFriction` | Subject Calibration |
| `subject.reliefFactor` | Subject Calibration |
| `subject.targetHours` | Subject Calibration |
| `subject.initialStudiedCredit` | Subject Calibration |
| `calibration.difficultyRaw` | Raw answer store |
| `calibration.resourceReadinessRaw` | Raw answer store |
| `calibration.preparednessRaw` | Raw answer store |
| `constraints.dailyStudyGoalHours` | Capacity |
| All `constraints.*` defaults | Capacity |

### Fields to defer (do not implement at setup)

| Field | Reason |
|---|---|
| `subject.studyType` | Adds screen; 2.5 practiceNeed default is sufficient |
| `subject.openBook` | Can be inferred from studyType in v2 |
| `subject.targetHours` (user-editable) | Inferred value works for v1; expose override in v2 |
| `exam.type` (midterm/final) | Informational only; no v1 engine impact |
| Assignment deadline records | Need separate data model |
| `user.gradeTarget` | Not relevant to priority ranking |
| `subject.historicalGrade` | Phase 3 feature |

### Fields that are dangerous to ask too early

These fields would hurt the setup experience if introduced at the first-run flow:

**Sleep schedule.** Asking "Kaçta yatıyorsun?" feels invasive before the product has earned trust. The sleep penalty for morning exams uses `morningSleepCutoffHour` and `sleepTargetHours` but the defaults produce a reasonable result. This should only surface in settings if the user goes looking.

**Study type taxonomy.** "Bu ders ezber mi, sayısal mı, açık kitap mı?" — this is the right question eventually, but it adds a cognitive step that does not return enough value to justify the friction at setup. The practiceNeed default of 2.5 covers this until v2.

**Target grade.** "Bu dersten kaç almak istiyorsun?" — this question sounds relevant but produces unreliable input. Students routinely overstate grade targets, especially at setup. The engine does not use grade targets in v1. Ask only when the feature can actually use the answer.

**Hours per subject.** "Bu ders için kaç saat ayırmayı planlıyorsun?" — this sounds specific but it frontloads a planning judgment the engine should make, not the user. The user answering this early produces anchoring bias and undermines the planning value of the product.

---

## 8. Recommendation

### The cleanest v1 input contract

**Two storage models.** Replace the current hardcoded seed data with two new localStorage objects: `examassist_subject_seeds` (per-subject calibration) and `examassist_constraints` (global study capacity). Everything else in the existing storage layer stays unchanged.

**One type change.** Change `SubjectId` from a hardcoded union to `string`. This is the only type-level breaking change required. The rest of the existing types remain valid.

**One new field on SubjectSeed.** Add `initialStudiedCredit: number` and `calibration: { difficultyRaw, resourceReadinessRaw, preparednessRaw }`. The `calibration` object stores raw answers so the mapping can be re-run if formulas change. The numeric fields store the normalized output.

**One pure mapping function.** `rawAnswersToSubjectSeed(calibration, examDate, now)` — takes raw answers and produces a complete SubjectSeed including all derived values. This is the entire hidden intelligence translation layer. It should be the first thing tested.

**One constraint object.** Replace the hardcoded `studentConstraints` export in seed-data.ts with a read from `examassist_constraints`. Defaults are set at setup if the key is absent.

**The risk engine needs zero changes.** If the input contract is implemented correctly, `lib/risk.ts` will receive properly shaped `SubjectSeed[]` and `StudentConstraints` objects from real user data instead of hardcoded seeds. No changes to the engine formula are required to support the setup flow.

---

### Final checklist before implementation

- [ ] `SubjectId` type changed from union to `string`
- [ ] `SubjectSeed` type extended with `initialStudiedCredit` and `calibration` sub-object
- [ ] `rawAnswersToSubjectSeed()` mapping function defined, exported, and unit-tested
- [ ] `examassist_subject_seeds` storage key read/write implemented in `lib/storage.ts`
- [ ] `examassist_constraints` storage key read/write implemented in `lib/storage.ts`
- [ ] `examassist_user_profile` storage key read/write implemented in `lib/storage.ts`
- [ ] `lib/risk.ts` updated to read from storage instead of importing from `seed-data.ts`
- [ ] Setup flow (see SPEC_setup-flow.md) wired to this contract's write path
- [ ] Plan screen edit affordance wired to this contract's update path
- [ ] No computed values (scores, gaps, pressures) written to localStorage anywhere

---

*This document defines v1 only. v2 extensions (study type, open-book flag, subject detail screen, assignment deadlines) should be specced separately when the v1 contract is stable and in production.*
