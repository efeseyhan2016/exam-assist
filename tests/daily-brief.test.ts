import test from "node:test";
import assert from "node:assert/strict";

import { buildDailyBrief } from "@/lib/daily-brief";
import { RankedSubjectRisk } from "@/lib/types";

function makeRiskSubject(
  subjectId: string,
  title: string,
  index: number,
): RankedSubjectRisk {
  return {
    subjectId,
    title,
    shortLabel: title.slice(0, 3).toUpperCase(),
    examTitle: `${title} Vize`,
    examDate: "2026-04-12T09:00:00.000Z",
    hoursStudied: 0,
    targetHours: 8,
    remainingTargetHours: 6 - index,
    effectiveStudyHoursLeft: 10 - index,
    hoursUntilExam: 48 + index * 8,
    score: 10 - index,
    label: index === 0 ? "High" : "Moderate",
    explanation: "test",
    breakdown: {
      baseComplexity: 3,
      urgencyPressure: 0.8,
      capacityPressure: 0.6,
      portfolioOverloadPressure: 0.4,
      progressGap: 0.7,
      resourceGap: 0.5,
      sleepPenalty: 0,
      reliefBoost: 0.1,
      resourceReadinessSignal: 0.4,
    },
  };
}

test("daily brief falls back calmly when planning data is not ready", () => {
  const brief = buildDailyBrief({
    topRisk: null,
    homeFocus: null,
    upcomingExams: [],
    dailyMinutes: 0,
    dailyGoalMinutes: 120,
  });

  assert.equal(brief.headline, "Bugünün kısa planı birazdan netleşecek.");
  assert.equal(brief.chips.length, 0);
});

test("daily brief suggests starting with the focus subject when no session exists yet", () => {
  const focus = makeRiskSubject("econ", "Ekonomi", 0);
  const brief = buildDailyBrief({
    topRisk: focus,
    homeFocus: {
      subject: focus,
      mode: "start",
      sessionMinutesToday: 0,
      reason: "Bu ders daha temiz bir giriş veriyor.",
    },
    upcomingExams: [
      {
        id: "exam-1",
        title: "Ekonomi Vize",
        shortLabel: "EKO",
        scheduledAt: "2026-04-07T09:00:00.000Z",
        countdown: { totalMilliseconds: 36 * 3_600_000 },
      },
    ],
    dailyMinutes: 20,
    dailyGoalMinutes: 120,
  });

  assert.equal(brief.headline, "Ekonomi ile başla.");
  assert.match(brief.body, /Ekonomi Vize yaklaşırken/);
  assert.deepEqual(
    brief.chips.map((chip) => chip.label),
    ["İlk blok", "Kalan hedef", "En yakın"],
  );
});

test("daily brief includes a primary resource hint when a strong source exists", () => {
  const focus = makeRiskSubject("econ", "Ekonomi", 0);
  const brief = buildDailyBrief({
    topRisk: focus,
    homeFocus: {
      subject: focus,
      mode: "start",
      sessionMinutesToday: 0,
      reason: "Bu ders daha temiz bir giriş veriyor.",
    },
    upcomingExams: [],
    dailyMinutes: 20,
    dailyGoalMinutes: 120,
    primaryResource: {
      title: "Final Özeti",
      actionLabel: "Kısa tekrar yap",
    },
  });

  assert.match(brief.body, /Final Özeti/);
  assert.deepEqual(
    brief.chips.map((chip) => chip.label),
    ["İlk blok", "Kalan hedef", "İlk kaynak"],
  );
});

test("daily brief reflects continue mode when the user should stay on the same subject", () => {
  const focus = makeRiskSubject("hist", "Tarih", 0);
  const brief = buildDailyBrief({
    topRisk: focus,
    homeFocus: {
      subject: focus,
      mode: "continue",
      sessionMinutesToday: 30,
      reason: "Kısa bir giriş yaptın.",
    },
    upcomingExams: [],
    dailyMinutes: 45,
    dailyGoalMinutes: 150,
  });

  assert.equal(brief.headline, "Tarih ile devam et.");
  assert.match(brief.body, /Kısa bir giriş yaptın/);
});

test("daily brief reflects switch mode when the next block should move elsewhere", () => {
  const topRisk = makeRiskSubject("econ", "Ekonomi", 0);
  const focus = makeRiskSubject("law", "Hukuk", 1);
  const brief = buildDailyBrief({
    topRisk,
    homeFocus: {
      subject: focus,
      mode: "switch",
      sessionMinutesToday: 95,
      reason: "İlk derse bugünün ana bloğu ayrıldı.",
    },
    upcomingExams: [],
    dailyMinutes: 100,
    dailyGoalMinutes: 180,
  });

  assert.equal(brief.headline, "Hukuk ile yön değiştir.");
  assert.match(brief.body, /İlk derse bugünün ana bloğu ayrıldı/);
});

test("daily brief softens into repeat mode when the daily goal is already complete", () => {
  const focus = makeRiskSubject("chem", "Kimya", 0);
  const brief = buildDailyBrief({
    topRisk: focus,
    homeFocus: {
      subject: focus,
      mode: "continue",
      sessionMinutesToday: 90,
      reason: "Bugün burada iyi ilerledin.",
    },
    upcomingExams: [],
    dailyMinutes: 150,
    dailyGoalMinutes: 120,
  });

  assert.equal(brief.headline, "Bugünkü hedef kapanmış görünüyor.");
  assert.match(brief.body, /kısa bir tekrar/);
});
