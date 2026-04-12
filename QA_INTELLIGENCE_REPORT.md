# QA Intelligence Report
**Date:** 2026-04-10  
**Scope:** Full product intelligence test — fresh profile, manual exam add, session logging, priority ranking, cross-surface coherence  
**Environment:** https://exam-assist.vercel.app  
**Test profile:** "Test" · Hacettepe Üniversitesi · İşletme

---

## Test Setup

Profile created via localStorage injection with two subjects and two exams:

| Subject | Exam | Difficulty | Resources | Preparedness | Target |
|---------|------|-----------|-----------|--------------|--------|
| FIN301 Financial Analysis | Apr 12 13:00 (~38h) | Zor | Eksik | Henüz başlamadım | 20h |
| MGT405 Strategic Management | Apr 24 13:00 (~14d) | Rahat | Hazır | İyi | 6h (3h pre-credited) |

---

## Test Results

### ✅ 1. Onboarding / Profile Read

- Sidebar correctly reads name, university, department
- "SIRADAKİ SINAV: FIN301 Financial Analysis" — correct (chronologically next)
- "ÖNCELİKLİ DERS" updates live as priorities shift

---

### ✅ 2. Home Screen — Daily Brief

After adding MAN201 (calendar add), the daily brief was observed:

**Observed output:**
> "FIN301 Financial Analysis bugün öne çıkıyor."  
> Mode label: TOPARLAMA  
> Recommendation: "FIN301 Financial Analysis tarafında bugün 35 dakikalık tek bir toparlama bloğu ayır."  
> Body: "FIN301 Financial Analysis şu an en güçlü ilk adım. Bugün henüz açılmadı; ilk ciddi çalışma odağı için en temiz giriş burada duruyor. FIN301 sınavı yaklaşırken buradan başlamak daha doğru. Bu aşamada yeni alan açmaktan çok eldeki yapıyı toparlamak daha güçlü durur."

**Assessment:** ✅ Clean and coherent. The previous pileup bug (three proximity sentences stacking simultaneously) is fixed. The body reads naturally — one proximity signal, correct focus context. No headline/body mismatch.

---

### ✅ 3. Calendar — Manual Exam Add + Calibration Flow

**Test action:** Added "MAN201 Muhasebe" exam — April 20, 10:00 — Zor / Eksik / Henüz başlamadım

**Observations:**
- Form renders three `<select>` elements for calibration (not toggle buttons as shown in the UI design — minor discrepancy, but functional)
- Labels clearly visible: "DERS ZOR MU?" / "KAYNAKLAR HAZIR MI?" / "ŞU AN DURUMUN?"
- "Takvime ekle" button enabled and functional
- Exam appeared in timeline immediately after submit
- Calibration values saved correctly to `exam-command-center:schedule-items`
- Risk engine responded immediately — a new recommendation event for MAN201 was generated within the same render cycle

**Saved entry:**
```json
{
  "title": "MAN201 Muhasebe",
  "shortLabel": "MM",
  "scheduledAt": "2026-04-20T07:00:00.000Z",
  "kind": "exam",
  "source": "manual",
  "calibration": { "difficultyRaw": "zor", "resourceReadinessRaw": "eksik", "preparednessRaw": "az" }
}
```

**Assessment:** ✅ Core flow works. Calibration data saved and propagated correctly.

---

### ✅ 4. Priorities — Ranking After Calendar Add

Immediately after adding MAN201, priorities updated:

| Rank | Subject | Risk Label | Exam | Notes |
|------|---------|-----------|------|-------|
| #1 | MAN201 Muhasebe | ÖNE AL (Critical) | Apr 20 · 9d | Correct — Zor/Eksik/0h on 14h target |
| #2 | FIN301 Financial Analysis | GÜNDEMDE TUT (Moderate) | Apr 12 · 38h | ⚠️ See Bug #1 below |
| #3 | MGT405 Strategic Management | STABİL (Low) | Apr 24 · 14d | Correct — pre-credited, low difficulty |

Sessions screen nuance message: "Takvimde önce FIN301 Financial Analysis geliyor. Yine de şu an en fazla dikkati MAN201 Muhasebe hak ediyor." — this is honest and useful.

---

### ✅ 5. Session Logging — Priority Update

**Test action:** Logged FIN301 · 45m · İyi geçti

**Observed:**
- Daily studied: 0h → 0.8h ✅
- Daily goal progress: 0% → 38% ✅
- FIN301 remaining hours: 20h → 19.5h ✅ (0.75h credited, displayed rounded)
- Feedback message appeared in session log ✅
- Rankings preserved after session ✅

**Assessment:** ✅ Session logging and priority feedback loop working correctly.

---

### ❌ 6. Resources Screen — Loading State Stuck

**Observed:** The Resources screen consistently renders only the loading skeleton (`!isReady` branch) — heading "Ders kütüphaneleri" + a pulsing placeholder div. No subject tabs, no upload area, no content.

**Root cause:** `useResources()` hook initializes `isReady = false` and sets it to `true` in a `useEffect`. The effect is apparently not completing, leaving the screen in a permanent skeleton state.

`readResources()` itself is safe (reads from `examassist_resources`, returns `[]` if empty) and should not throw. The boolean state traced via React fiber confirms it remains `false`.

**Impact:** The entire Resources feature is non-functional on the current deployment for this profile. PDF upload, topic hint extraction, resource guidance, and the study launch flow from resources are all inaccessible.

**Severity:** High — blocks a named product feature.

**Suggested investigation:** Add error boundary or try/catch around `readResources()` call in the `useEffect` to surface any silent failure, and add a console.error to confirm if the effect is firing at all.

---

### 🔴 Bug #1 — Risk Engine / Proximity Label Contradiction

**Context:** FIN301 has an exam in ~38h. Available study time: ~4h. Remaining study target: 19.25h (after one 45-min session).

**Observed label:** `GÜNDEMDE TUT` (Moderate, score 30–45)  
**Expected label:** `ÖNE AL` (Critical) or at minimum `YAKLAŞAN SINAV` (High)

**Manual score reconstruction (approximate):**

| Component | Formula | Value |
|-----------|---------|-------|
| baseComplexity | 0.3×0.9 + 0.3×0.9 + 0.2×0.85 + 0.2×0.8 | 0.87 |
| urgencyPressure @ 38h | 0.9×e^(–38/18) + 0.55×e^(–38/96) | ~0.48 |
| capacityPressure | clamp(19.25/4, 0, **1.5**) | **1.5** (at ceiling) |
| progressGap | 1 – 0.75/20 | 0.963 |
| resourceGap | 1 – resourceReadinessSignal | ~0.29 |
| sleepPenalty | 0 (not morning exam) | 0 |
| reliefBoost | ~0.066 | 0.066 |
| zeroLogBoost | 0 (hoursStudied > 0 after session) | 0 |

```
rawScore = 12×0.87 + 10×0.48 + 10×1.5 + 8×0.963 + 6×0.29 + 0 – 5×0.066 + 0
         = 10.44 + 4.80 + 15.00 + 7.70 + 1.74 + 0 – 0.33 + 0
         ≈ 39.4  → Moderate
```

**Root cause:** The `calculateCapacityPressure` return value is clamped at `1.5`, regardless of the actual demand/supply ratio. When `remainingTargetHours / effectiveStudyHoursLeft ≈ 4.8`, the cap prevents the score from reflecting the true severity. The `10 × capacityPressure` contribution is floored at 15 whether the ratio is 1.6 or 5.0.

Compounding factor: `urgencyPressure` at 38h contributes only ~4.8 to the score (the exponential decay is calibrated for long-range planning, not the 24–72h crunch window).

**Recommended fix (micro-pack):**

Two targeted changes to `lib/risk.ts`:

**Option A — Raise capacityPressure ceiling:**
```typescript
// Change 1.5 → 3.0 in calculateCapacityPressure
return clamp(singleSubjectPressure + portfolioOverloadPressure, 0, 3.0);
```
Effect on FIN301: score ≈ 10.44 + 4.80 + 30 + 7.70 + 1.74 – 0.33 = **54.35 → High**

**Option B — Add proximity escalator for capacity-maxed exams in the 48h window:**
```typescript
const proximityCapacityBoost =
  hoursUntilExam <= 24 && capacityPressure >= 1.0 ? 30 :
  hoursUntilExam <= 48 && capacityPressure >= 1.5 ? 20 : 0;
```
Effect on FIN301: score ≈ 39.4 + 20 = **59.4 → High** (or bump to 25 for Critical)

**Option C (recommended) — Both, conservatively:**
- Raise cap to 3.0 (catches severe capacity mismatches generally)
- Add a 48h proximity boost of 10 when capacity is at new ceiling

Effect: 54.35 + 10 = **64.35 → Critical** ✅

**Non-goals:** Do not change the label thresholds (30/45/60). Do not touch urgency decay constants. Only adjust the capacity clamp and optionally add a narrow proximity window escalator.

---

### Cross-Surface Coherence Summary

| Surface | What It Shows | Consistent? |
|---------|--------------|-------------|
| Sidebar "SIRADAKİ SINAV" | FIN301 (chronologically next) | ✅ |
| Sidebar "ÖNCELİKLİ DERS" | MAN201 (risk #1 after calendar add) | ✅ |
| Home "YAKLAŞAN SINAVLAR" | FIN301, MGT405 (not MAN201 — schedule-item, different storage) | ⚠️ Minor |
| Home Daily Brief | FIN301 focus, Toparlama mode | ✅ Consistent with proximity |
| Priorities #1 | MAN201 | ✅ |
| Calendar ODAK ÖNERİSİ for FIN301 | "Gündemde tut" | ❌ Bug #1 |
| Sessions ANA ODAK | MAN201 with FIN301 tension note | ✅ Honest |
| Daily goal progress | 38% after 45m session | ✅ |

**One coherence gap worth noting:** The Home daily brief recommends FIN301 (proximity logic: exam in 38h = consolidation mode). The Priorities screen ranks MAN201 #1 (risk engine: harder, less prepared). The Sessions screen acknowledges both: "Takvimde önce FIN301 geliyor. Yine de MAN201 hak ediyor." This is honest but creates user confusion about which signal to follow. A future improvement: unify the daily brief focus with the top priority subject, or make the tension explicit in the brief itself.

---

## Summary

| # | Finding | Severity | Status |
|---|---------|----------|--------|
| 1 | Daily brief body composition — proximity sentence pileup | High | ✅ Fixed (prior commit) |
| 2 | Daily brief body/headline mismatch | High | ✅ Fixed (prior commit) |
| 3 | PDF topic hint — "Hacettepe Üniversitesi" noise | Medium | ✅ Fixed (prior commit) |
| 4 | Resources screen stuck in `!isReady` loading state | High | ❌ Open |
| 5 | Risk label too low for exam-in-38h / capacity-maxed subject | High | ❌ Open |
| 6 | MAN201 (schedule-item) not shown in Home "YAKLAŞAN SINAVLAR" | Low | ⚠️ Expected — architectural separation |
| 7 | Brief focus (FIN301 proximity) vs Priority #1 (MAN201 risk) tension not resolved for user | Medium | ⚠️ Design gap |

---

## Recommended Next Steps

**Micro-pack priority order:**

1. **Risk engine capacity clamp** (`lib/risk.ts`) — raise ceiling from 1.5 to 3.0, optionally add a ≤48h proximity escalator. One file, four lines, high impact.

2. **Resources `useResources` isReady hang** — add error handling in the `useEffect`, confirm whether `readResources()` is throwing silently. One hook, one try/catch.

3. **Brief / priority alignment** — when the top risk subject and the proximity-recommended subject differ, surface the tension explicitly in the daily brief rather than letting it appear contradictory across screens.

---

*Tests ran against commit reflecting the daily-brief and pdf-engine fixes from the previous session.*
