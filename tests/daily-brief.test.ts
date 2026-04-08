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
  assert.equal(brief.recommendation, null);
  assert.equal(brief.modeLabel, "Hazırlanıyor");
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

  assert.equal(brief.modeLabel, "Toparlama");
  assert.match(brief.recommendation ?? "", /tek bir toparlama bloğu/i);
  assert.equal(brief.headline, "Ekonomi bugün öne çıkıyor.");
  assert.match(brief.body, /EKO sınavı yaklaşırken/);
  assert.match(brief.body, /yeni alan açmaktan çok/i);
  assert.deepEqual(
    brief.chips.map((chip) => chip.label),
    ["Ritim", "Ana odak", "Kalan alan", "En yakın"],
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
    activeTopic: "Talep dengesi",
    primaryResource: {
      title: "Final Özeti",
      actionLabel: "Özet üstünden toparla",
      topics: ["Talep dengesi"],
    },
  });

  assert.match(brief.body, /Final Özeti/);
  assert.match(brief.body, /Talep dengesi/);
  assert.match(brief.recommendation ?? "", /tek bir toparlama bloğu ayır/i);
  assert.deepEqual(
    brief.chips.map((chip) => chip.label),
    ["Ritim", "Ana odak", "Kalan alan", "İlk kaynak", "Öne çıkan konu", "Açık konu"],
  );
});

test("daily brief explains when the latest session got stuck and the next block is narrowed", () => {
  const focus = makeRiskSubject("econ", "Ekonomi", 0);
  const brief = buildDailyBrief({
    topRisk: focus,
    homeFocus: {
      subject: focus,
      mode: "continue",
      sessionMinutesToday: 35,
      reason: "İlk bloktan sonra aynı derste kalmak daha doğru görünüyor.",
    },
    upcomingExams: [],
    dailyMinutes: 35,
    dailyGoalMinutes: 120,
    latestReflection: "stuck",
    learningReason: "Konu notları bu derste sende daha iyi karşılık veriyor.",
  });

  assert.match(brief.recommendation ?? "", /dar konu bloğu/i);
  assert.match(brief.body, /takıldın/);
  assert.match(brief.body, /Konu notları bu derste sende daha iyi karşılık veriyor/);
});

test("daily brief can point to a weak or still-open topic", () => {
  const focus = makeRiskSubject("ait", "Atatürk İlkeleri", 0);
  const brief = buildDailyBrief({
    topRisk: focus,
    homeFocus: {
      subject: focus,
      mode: "start",
      sessionMinutesToday: 0,
      reason: "Bu ders bugün daha temiz bir giriş veriyor.",
    },
    upcomingExams: [],
    dailyMinutes: 10,
    dailyGoalMinutes: 120,
    topicCoverage: {
      nextTopic: "Lozan Barış Konferansı",
      weakTopics: ["Lozan Barış Konferansı"],
      openTopics: ["Demokrat Parti Dönemi"],
      coveredCount: 1,
    },
  });

  assert.match(brief.body, /Lozan Barış Konferansı burada biraz daha dikkat istiyor/i);
  assert.ok(brief.chips.some((chip) => chip.label === "Şimdi konu"));
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

  assert.equal(brief.headline, "Tarih odağını koru.");
  assert.match(brief.recommendation ?? "", /toparlama bloğu ayır|bir blok daha ayır/i);
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

  assert.equal(brief.headline, "Hukuk bugün daha doğru odak oluyor.");
  assert.match(brief.recommendation ?? "", /ikinci bir blok ayır/i);
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
  assert.match(brief.recommendation ?? "", /tek bir blok ayır|toparlama bloğu|gözden geçirme/i);
  assert.match(brief.body, /kısa bir toparlama/);
});

test("daily brief stays in semester mode when the nearest exam is still far away", () => {
  const focus = makeRiskSubject("mgmt", "Yönetim", 0);
  const brief = buildDailyBrief({
    topRisk: focus,
    homeFocus: {
      subject: { ...focus, hoursUntilExam: 420 },
      mode: "start",
      sessionMinutesToday: 0,
      reason: "Bu ders haftanın genel ritmi için iyi bir başlangıç veriyor.",
    },
    upcomingExams: [
      {
        id: "exam-1",
        title: "Yönetim Vize",
        shortLabel: "YON",
        scheduledAt: "2026-04-24T09:00:00.000Z",
        countdown: { totalMilliseconds: 420 * 3_600_000 },
      },
    ],
    dailyMinutes: 0,
    dailyGoalMinutes: 90,
  });

  assert.equal(brief.modeLabel, "Dönem modu");
  assert.match(brief.body, /haftayı daha dengeli toplar/i);
});

test("daily brief surfaces the no-log warning for very near exams", () => {
  const focus = {
    ...makeRiskSubject("services", "Services Marketing", 0),
    hoursUntilExam: 11,
    examDate: "2026-04-10T09:00:00.000Z",
  };

  const brief = buildDailyBrief({
    topRisk: focus,
    homeFocus: {
      subject: focus,
      mode: "start",
      sessionMinutesToday: 0,
      reason: "Sınava çok az kaldı ve sistem içinde bu ders için çalışma kaydı görünmüyor. İlk blok burada başlamalı.",
    },
    upcomingExams: [
      {
        id: "exam-1",
        title: "Services Marketing",
        shortLabel: "SRV",
        scheduledAt: "2026-04-10T09:00:00.000Z",
        countdown: { totalMilliseconds: 11 * 3_600_000 },
      },
    ],
    dailyMinutes: 0,
    dailyGoalMinutes: 120,
  });

  assert.match(brief.body, /çalışma kaydı görünmüyor/i);
  assert.match(brief.recommendation ?? "", /dar konu bloğu|kısa bir gözden geçirme/i);
});
