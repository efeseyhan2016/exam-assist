import test from "node:test";
import assert from "node:assert/strict";

import { buildTaskAwarePriorities } from "@/lib/task-aware-priorities";
import { AcademicEvent, RankedSubjectRisk, SubjectSeed } from "@/lib/types";

function makeRiskSubject(
  subjectId: string,
  title: string,
  score: number,
  hoursUntilExam: number,
): RankedSubjectRisk {
  return {
    subjectId,
    title,
    shortLabel: title.slice(0, 3).toUpperCase(),
    examTitle: `${title} Final`,
    examDate: "2026-04-15T09:00:00.000Z",
    hoursStudied: 1,
    targetHours: 8,
    remainingTargetHours: 5,
    effectiveStudyHoursLeft: 10,
    hoursUntilExam,
    score,
    label: score >= 60 ? "Critical" : score >= 45 ? "High" : score >= 30 ? "Moderate" : "Low",
    explanation: "Sınav tarihi yaklaşıyor.",
    breakdown: {
      baseComplexity: 3,
      urgencyPressure: 0.8,
      capacityPressure: 0.7,
      portfolioOverloadPressure: 0.2,
      progressGap: 0.6,
      resourceGap: 0.4,
      sleepPenalty: 0,
      reliefBoost: 0.1,
      resourceReadinessSignal: 0.6,
    },
  };
}

const subjects: SubjectSeed[] = [
  {
    id: "economics",
    title: "Economics",
    shortLabel: "ECO",
    contentLoad: 3,
    difficulty: 3,
    practiceNeed: 2,
    resourceFriction: 2,
    reliefFactor: 0.2,
    targetHours: 8,
    initialStudiedCredit: 0,
    calibration: {
      difficultyRaw: null,
      resourceReadinessRaw: null,
      preparednessRaw: null,
    },
  },
  {
    id: "marketing",
    title: "Marketing",
    shortLabel: "MAR",
    contentLoad: 3,
    difficulty: 3,
    practiceNeed: 2,
    resourceFriction: 2,
    reliefFactor: 0.2,
    targetHours: 8,
    initialStudiedCredit: 0,
    calibration: {
      difficultyRaw: null,
      resourceReadinessRaw: null,
      preparednessRaw: null,
    },
  },
];

test("task-aware priorities can elevate a near project above the default top exam risk", () => {
  const ranked = [
    makeRiskSubject("economics", "Economics", 48, 72),
    makeRiskSubject("marketing", "Marketing", 44, 96),
  ];
  const academicEvents: AcademicEvent[] = [
    {
      id: "project-1",
      courseId: "marketing",
      type: "assignment_due",
      title: "Marketing proje teslimi",
      occurredAt: "2026-04-10T09:00:00.000Z",
      dueAt: "2026-04-11T12:00:00.000Z",
      source: "manual",
      provenance: "student_entered",
      significance: "high",
      planningImpact: "strong",
      status: "active",
      metadata: {
        subjectId: "marketing",
        shortLabel: "MAR",
        scheduleKind: "project",
      },
    },
  ];

  const reordered = buildTaskAwarePriorities(
    ranked,
    academicEvents,
    subjects,
    new Date("2026-04-10T12:00:00.000Z"),
  );

  assert.equal(reordered[0]?.subjectId, "marketing");
  assert.match(reordered[0]?.explanation ?? "", /proje/i);
  assert.ok((reordered[0]?.score ?? 0) > ranked[1].score);
});

test("task-aware priorities leave the order alone when no matching active task signal exists", () => {
  const ranked = [
    makeRiskSubject("economics", "Economics", 52, 48),
    makeRiskSubject("marketing", "Marketing", 43, 96),
  ];
  const academicEvents: AcademicEvent[] = [
    {
      id: "announcement-1",
      courseId: "marketing",
      type: "announcement",
      title: "Duyuru",
      occurredAt: "2026-04-10T09:00:00.000Z",
      source: "manual",
      provenance: "student_entered",
      significance: "medium",
      planningImpact: "soft",
      status: "active",
    },
  ];

  const reordered = buildTaskAwarePriorities(
    ranked,
    academicEvents,
    subjects,
    new Date("2026-04-10T12:00:00.000Z"),
  );

  assert.deepEqual(
    reordered.map((subject) => subject.subjectId),
    ranked.map((subject) => subject.subjectId),
  );
});
