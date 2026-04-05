import test from "node:test";
import assert from "node:assert/strict";

import { buildHomeFocusRecommendation } from "@/lib/home-focus";
import { RankedSubjectRisk, StudySession } from "@/lib/types";

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

test("home focus stays on the top risk when no study behavior exists yet", () => {
  const ranked = [
    makeRiskSubject("economics", "Economics", 0),
    makeRiskSubject("marketing", "Marketing", 1),
  ];

  const recommendation = buildHomeFocusRecommendation(
    ranked,
    [],
    [],
    new Date("2026-04-05T12:00:00.000Z"),
  );

  assert.ok(recommendation);
  assert.equal(recommendation?.subject.subjectId, "economics");
  assert.equal(recommendation?.mode, "start");
});

test("home focus can switch to the next urgent subject when the top risk already consumed today's main block", () => {
  const ranked = [
    makeRiskSubject("economics", "Economics", 0),
    makeRiskSubject("marketing", "Marketing", 1),
    makeRiskSubject("law", "Law", 2),
  ];
  const sessions: StudySession[] = [
    {
      id: "session-1",
      subjectId: "economics",
      minutes: 90,
      createdAt: "2026-04-05T09:00:00.000Z",
    },
  ];

  const recommendation = buildHomeFocusRecommendation(
    ranked,
    sessions,
    sessions,
    new Date("2026-04-05T12:00:00.000Z"),
  );

  assert.ok(recommendation);
  assert.equal(recommendation?.subject.subjectId, "marketing");
  assert.equal(recommendation?.mode, "switch");
});

test("home focus keeps the top risk when today only has a short warm-up session", () => {
  const ranked = [
    makeRiskSubject("economics", "Economics", 0),
    makeRiskSubject("marketing", "Marketing", 1),
  ];
  const sessions: StudySession[] = [
    {
      id: "session-1",
      subjectId: "economics",
      minutes: 25,
      createdAt: "2026-04-05T09:00:00.000Z",
    },
  ];

  const recommendation = buildHomeFocusRecommendation(
    ranked,
    sessions,
    sessions,
    new Date("2026-04-05T12:00:00.000Z"),
  );

  assert.ok(recommendation);
  assert.equal(recommendation?.subject.subjectId, "economics");
  assert.equal(recommendation?.mode, "continue");
});

test("home focus stays inside the top planning pool instead of jumping to far-lower subjects", () => {
  const ranked = [
    makeRiskSubject("economics", "Economics", 0),
    makeRiskSubject("marketing", "Marketing", 1),
    makeRiskSubject("law", "Law", 2),
    makeRiskSubject("history", "History", 3),
  ];
  const sessions: StudySession[] = [
    {
      id: "session-1",
      subjectId: "economics",
      minutes: 120,
      createdAt: "2026-04-05T09:00:00.000Z",
    },
    {
      id: "session-2",
      subjectId: "marketing",
      minutes: 90,
      createdAt: "2026-04-05T11:00:00.000Z",
    },
    {
      id: "session-3",
      subjectId: "law",
      minutes: 60,
      createdAt: "2026-04-05T13:00:00.000Z",
    },
  ];

  const recommendation = buildHomeFocusRecommendation(
    ranked,
    sessions,
    sessions,
    new Date("2026-04-05T15:00:00.000Z"),
  );

  assert.ok(recommendation);
  assert.notEqual(recommendation?.subject.subjectId, "history");
});
