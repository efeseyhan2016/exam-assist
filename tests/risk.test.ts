import test from "node:test";
import assert from "node:assert/strict";

import {
  buildRiskEngineSnapshot,
  buildExplanation,
  calculateCapacityPressure,
  calculateCreditedProgressHours,
  calculatePortfolioOverloadPressure,
  estimateResourceReadinessSignal,
} from "@/lib/risk";
import { studentConstraints } from "@/lib/seed-data";

test("multiple subjects no longer each behave as if they own the full remaining horizon", () => {
  const current = {
    subjectId: "subject-a",
    examDate: new Date("2026-04-10T10:00:00"),
    remainingTargetHours: 4,
    effectiveStudyHoursLeft: 5,
  };
  const portfolio = [
    current,
    {
      subjectId: "subject-b",
      examDate: new Date("2026-04-10T10:00:00"),
      remainingTargetHours: 4,
      effectiveStudyHoursLeft: 5,
    },
  ];

  const portfolioOverloadPressure = calculatePortfolioOverloadPressure(
    current,
    portfolio,
  );
  const adjustedCapacityPressure = calculateCapacityPressure(
    current.remainingTargetHours,
    current.effectiveStudyHoursLeft,
    portfolioOverloadPressure,
  );

  assert.equal(portfolioOverloadPressure, 0.6);
  assert.equal(adjustedCapacityPressure, 1.4);
});

test("portfolio overload stays zero when total demand fits inside available capacity", () => {
  const current = {
    subjectId: "subject-a",
    examDate: new Date("2026-04-10T10:00:00"),
    remainingTargetHours: 2,
    effectiveStudyHoursLeft: 10,
  };
  const portfolio = [
    current,
    {
      subjectId: "subject-b",
      examDate: new Date("2026-04-09T10:00:00"),
      remainingTargetHours: 3,
      effectiveStudyHoursLeft: 10,
    },
  ];

  const portfolioOverloadPressure = calculatePortfolioOverloadPressure(
    current,
    portfolio,
  );
  const adjustedCapacityPressure = calculateCapacityPressure(
    current.remainingTargetHours,
    current.effectiveStudyHoursLeft,
    portfolioOverloadPressure,
  );

  assert.equal(portfolioOverloadPressure, 0);
  assert.equal(adjustedCapacityPressure, 0.2);
});

test("single-subject behavior does not regress when there is no competing demand", () => {
  const current = {
    subjectId: "subject-a",
    examDate: new Date("2026-04-10T10:00:00"),
    remainingTargetHours: 7,
    effectiveStudyHoursLeft: 5,
  };

  const portfolioOverloadPressure = calculatePortfolioOverloadPressure(
    current,
    [current],
  );
  const adjustedCapacityPressure = calculateCapacityPressure(
    current.remainingTargetHours,
    current.effectiveStudyHoursLeft,
    portfolioOverloadPressure,
  );

  assert.equal(portfolioOverloadPressure, 0);
  assert.equal(adjustedCapacityPressure, 1.4);
});

test("later horizons pick up overload from additional subjects due by that deadline", () => {
  const earlier = {
    subjectId: "subject-a",
    examDate: new Date("2026-04-08T10:00:00"),
    remainingTargetHours: 2,
    effectiveStudyHoursLeft: 8,
  };
  const later = {
    subjectId: "subject-b",
    examDate: new Date("2026-04-10T10:00:00"),
    remainingTargetHours: 6,
    effectiveStudyHoursLeft: 5,
  };
  const portfolio = [
    earlier,
    later,
    {
      subjectId: "subject-c",
      examDate: new Date("2026-04-10T09:00:00"),
      remainingTargetHours: 2,
      effectiveStudyHoursLeft: 5,
    },
  ];

  assert.equal(calculatePortfolioOverloadPressure(earlier, portfolio), 0);
  assert.equal(calculatePortfolioOverloadPressure(later, portfolio), 0.8);
});

test("preparedness credit reduces initial progress burden without changing logged study hours", () => {
  const snapshot = buildRiskEngineSnapshot(
    [],
    new Date("2026-04-03T12:00:00"),
    studentConstraints,
    {
      exams: [
        {
          id: "exam-econ",
          subjectId: "economics",
          title: "Economics",
          shortLabel: "ECO",
          scheduledAt: "2026-04-12T09:00:00",
        },
      ],
      subjectSeeds: [
        {
          id: "economics",
          title: "Economics",
          shortLabel: "ECO",
          contentLoad: 3,
          difficulty: 4,
          practiceNeed: 2,
          resourceFriction: 2,
          reliefFactor: 0.2,
          targetHours: 10,
          initialStudiedCredit: 2,
          calibration: {
            difficultyRaw: null,
            resourceReadinessRaw: null,
            preparednessRaw: null,
          },
        },
      ],
    },
  );

  const subject = snapshot.rankedSubjects[0];
  assert.equal(subject?.hoursStudied, 0);
  assert.equal(subject?.remainingTargetHours, 8);
  assert.equal(subject?.breakdown.progressGap, 0.8);
});

test("logged study and preparedness credit combine without being conflated", () => {
  const snapshot = buildRiskEngineSnapshot(
    [
      {
        id: "session-1",
        subjectId: "economics",
        minutes: 120,
        createdAt: "2026-04-03T09:00:00",
      },
    ],
    new Date("2026-04-03T12:00:00"),
    studentConstraints,
    {
      exams: [
        {
          id: "exam-econ",
          subjectId: "economics",
          title: "Economics",
          shortLabel: "ECO",
          scheduledAt: "2026-04-12T09:00:00",
        },
      ],
      subjectSeeds: [
        {
          id: "economics",
          title: "Economics",
          shortLabel: "ECO",
          contentLoad: 3,
          difficulty: 4,
          practiceNeed: 2,
          resourceFriction: 2,
          reliefFactor: 0.2,
          targetHours: 10,
          initialStudiedCredit: 1.5,
          calibration: {
            difficultyRaw: null,
            resourceReadinessRaw: null,
            preparednessRaw: null,
          },
        },
      ],
    },
  );

  const subject = snapshot.rankedSubjects[0];
  assert.equal(subject?.hoursStudied, 2);
  assert.equal(subject?.remainingTargetHours, 6.5);
  assert.equal(subject?.breakdown.progressGap, 0.65);
});

test("completed exams drop out of the active risk queue", () => {
  const snapshot = buildRiskEngineSnapshot(
    [],
    new Date("2026-04-09T18:00:00"),
    studentConstraints,
    {
      exams: [
        {
          id: "exam-retail",
          subjectId: "retail",
          title: "Retail Marketing",
          shortLabel: "RET",
          scheduledAt: "2026-04-09T09:00:00",
        },
        {
          id: "exam-ait",
          subjectId: "ait",
          title: "Atatürk İlkeleri",
          shortLabel: "AIT",
          scheduledAt: "2026-04-10T09:00:00",
        },
      ],
      subjectSeeds: [
        {
          id: "retail",
          title: "Retail Marketing",
          shortLabel: "RET",
          contentLoad: 3,
          difficulty: 3,
          practiceNeed: 2,
          resourceFriction: 2,
          reliefFactor: 0.2,
          targetHours: 6,
          initialStudiedCredit: 0,
          calibration: {
            difficultyRaw: null,
            resourceReadinessRaw: null,
            preparednessRaw: null,
          },
        },
        {
          id: "ait",
          title: "Atatürk İlkeleri",
          shortLabel: "AIT",
          contentLoad: 3,
          difficulty: 3,
          practiceNeed: 2,
          resourceFriction: 2,
          reliefFactor: 0.2,
          targetHours: 6,
          initialStudiedCredit: 0,
          calibration: {
            difficultyRaw: null,
            resourceReadinessRaw: null,
            preparednessRaw: null,
          },
        },
      ],
    },
  );

  assert.equal(snapshot.rankedSubjects.length, 1);
  assert.equal(snapshot.rankedSubjects[0]?.subjectId, "ait");
  assert.equal(snapshot.nextExam?.subjectId, "ait");
});

test("zero preparedness credit preserves stable baseline behavior", () => {
  assert.equal(calculateCreditedProgressHours(0, 0, 10), 0);
  assert.equal(calculateCreditedProgressHours(2, 0, 10), 2);
  assert.equal(calculateCreditedProgressHours(12, 0, 10), 10);
});

test("resource readiness signal reflects only known setup-side signals", () => {
  const thinSetup = estimateResourceReadinessSignal({
    id: "economics",
    title: "Economics",
    shortLabel: "ECO",
    contentLoad: 3,
    difficulty: 4,
    practiceNeed: 2,
    resourceFriction: 5,
    reliefFactor: 0,
    targetHours: 10,
    initialStudiedCredit: 0,
    calibration: {
      difficultyRaw: null,
      resourceReadinessRaw: null,
      preparednessRaw: null,
    },
  });
  const readySetup = estimateResourceReadinessSignal({
    id: "economics",
    title: "Economics",
    shortLabel: "ECO",
    contentLoad: 3,
    difficulty: 4,
    practiceNeed: 2,
    resourceFriction: 1,
    reliefFactor: 0.75,
    targetHours: 10,
    initialStudiedCredit: 3,
    calibration: {
      difficultyRaw: null,
      resourceReadinessRaw: null,
      preparednessRaw: null,
    },
  });

  assert.equal(Number(thinSetup.toFixed(2)), 0);
  assert.equal(Number(readySetup.toFixed(2)), 0.83);
  assert.ok(readySetup > thinSetup);
});

test("resource readiness stays stable when only logged study changes", () => {
  const subjectSeed = {
    id: "economics",
    title: "Economics",
    shortLabel: "ECO",
    contentLoad: 3,
    difficulty: 4,
    practiceNeed: 2,
    resourceFriction: 2,
    reliefFactor: 0.2,
    targetHours: 10,
    initialStudiedCredit: 1,
    calibration: {
      difficultyRaw: null,
      resourceReadinessRaw: null,
      preparednessRaw: null,
    },
  };

  const noSessions = buildRiskEngineSnapshot([], new Date("2026-04-03T12:00:00"), studentConstraints, {
    exams: [
      {
        id: "exam-econ",
        subjectId: "economics",
        title: "Economics",
        shortLabel: "ECO",
        scheduledAt: "2026-04-12T09:00:00",
      },
    ],
    subjectSeeds: [subjectSeed],
  });
  const withSessions = buildRiskEngineSnapshot(
    [
      {
        id: "session-1",
        subjectId: "economics",
        minutes: 180,
        createdAt: "2026-04-03T09:00:00",
      },
    ],
    new Date("2026-04-03T12:00:00"),
    studentConstraints,
    {
      exams: [
        {
          id: "exam-econ",
          subjectId: "economics",
          title: "Economics",
          shortLabel: "ECO",
          scheduledAt: "2026-04-12T09:00:00",
        },
      ],
      subjectSeeds: [subjectSeed],
    },
  );

  assert.equal(
    noSessions.rankedSubjects[0]?.breakdown.resourceReadinessSignal,
    withSessions.rankedSubjects[0]?.breakdown.resourceReadinessSignal,
  );
});

test("resource-side cleanup preserves baseline ranking behavior where workload clearly dominates", () => {
  const snapshot = buildRiskEngineSnapshot(
    [],
    new Date("2026-04-03T12:00:00"),
    studentConstraints,
    {
      exams: [
        {
          id: "exam-ias",
          subjectId: "ias",
          title: "International Accounting Standards",
          shortLabel: "IAS",
          scheduledAt: "2026-04-10T10:40:00",
        },
        {
          id: "exam-ait",
          subjectId: "ait",
          title: "AIT",
          shortLabel: "AIT",
          scheduledAt: "2026-04-07T09:40:00",
        },
      ],
      subjectSeeds: [
        {
          id: "ias",
          title: "International Accounting Standards",
          shortLabel: "IAS",
          contentLoad: 5,
          difficulty: 5,
          practiceNeed: 5,
          resourceFriction: 1,
          reliefFactor: 0,
          targetHours: 10.5,
          initialStudiedCredit: 0,
          calibration: {
            difficultyRaw: null,
            resourceReadinessRaw: null,
            preparednessRaw: null,
          },
        },
        {
          id: "ait",
          title: "AIT",
          shortLabel: "AIT",
          contentLoad: 1,
          difficulty: 1,
          practiceNeed: 1,
          resourceFriction: 1,
          reliefFactor: 0.8,
          targetHours: 3,
          initialStudiedCredit: 0,
          calibration: {
            difficultyRaw: null,
            resourceReadinessRaw: null,
            preparednessRaw: null,
          },
        },
      ],
    },
  );

  assert.equal(snapshot.rankedSubjects[0]?.subjectId, "ias");
  assert.equal(snapshot.rankedSubjects[1]?.subjectId, "ait");
});

test("a very near exam with zero logged study jumps ahead of a later heavier exam", () => {
  const snapshot = buildRiskEngineSnapshot(
    [],
    new Date("2026-04-09T22:00:00"),
    studentConstraints,
    {
      exams: [
        {
          id: "exam-ias",
          subjectId: "ias",
          title: "International Accounting Standards",
          shortLabel: "IAS",
          scheduledAt: "2026-04-11T16:00:00",
        },
        {
          id: "exam-services",
          subjectId: "services",
          title: "Services Marketing",
          shortLabel: "SRV",
          scheduledAt: "2026-04-10T09:00:00",
        },
      ],
      subjectSeeds: [
        {
          id: "ias",
          title: "International Accounting Standards",
          shortLabel: "IAS",
          contentLoad: 5,
          difficulty: 5,
          practiceNeed: 5,
          resourceFriction: 1,
          reliefFactor: 0,
          targetHours: 10.5,
          initialStudiedCredit: 0,
          calibration: {
            difficultyRaw: null,
            resourceReadinessRaw: null,
            preparednessRaw: null,
          },
        },
        {
          id: "services",
          title: "Services Marketing",
          shortLabel: "SRV",
          contentLoad: 2,
          difficulty: 2,
          practiceNeed: 2,
          resourceFriction: 1,
          reliefFactor: 0.2,
          targetHours: 4,
          initialStudiedCredit: 0,
          calibration: {
            difficultyRaw: null,
            resourceReadinessRaw: null,
            preparednessRaw: null,
          },
        },
      ],
    },
  );

  assert.equal(snapshot.rankedSubjects[0]?.subjectId, "services");
  assert.ok((snapshot.rankedSubjects[0]?.hoursUntilExam ?? 100) < 12);
});

test("risk score is floored at zero for extremely low pressure subjects", () => {
  const snapshot = buildRiskEngineSnapshot(
    [
      {
        id: "session-1",
        subjectId: "easy",
        minutes: 60,
        createdAt: "2026-04-03T09:00:00",
      },
    ],
    new Date("2026-04-03T12:00:00"),
    studentConstraints,
    {
      exams: [
        {
          id: "exam-easy",
          subjectId: "easy",
          title: "Easy Elective",
          shortLabel: "EASY",
          scheduledAt: "2026-05-30T09:00:00",
        },
      ],
      subjectSeeds: [
        {
          id: "easy",
          title: "Easy Elective",
          shortLabel: "EASY",
          contentLoad: 0,
          difficulty: 0,
          practiceNeed: 0,
          resourceFriction: 0,
          reliefFactor: 2,
          targetHours: 1,
          initialStudiedCredit: 1,
          calibration: {
            difficultyRaw: null,
            resourceReadinessRaw: null,
            preparednessRaw: null,
          },
        },
      ],
    },
  );

  assert.equal(snapshot.rankedSubjects[0]?.score, 0);
  assert.equal(snapshot.rankedSubjects[0]?.label, "Low");
});

test("explanations stay guide-like and avoid raw model terminology", () => {
  const explanation = buildExplanation({
    remainingTargetHours: 8,
    effectiveStudyHoursLeft: 3,
    hoursUntilExam: 20,
    targetHours: 10,
    breakdown: {
      baseComplexity: 4,
      urgencyPressure: 0.9,
      capacityPressure: 1.1,
      portfolioOverloadPressure: 0.4,
      progressGap: 0.7,
      resourceGap: 0.7,
      sleepPenalty: 0.2,
      reliefBoost: 0.1,
      resourceReadinessSignal: 0.3,
    },
  });

  const lowered = explanation.toLowerCase();

  assert.ok(lowered.includes("kısa sürede kapatılması gereken konu yükü fazla"));
  assert.ok(lowered.includes("sınav tarihi yaklaşıyor"));
  assert.ok(!explanation.toLowerCase().includes("score"));
  assert.ok(!explanation.toLowerCase().includes("capacity"));
  assert.ok(!explanation.toLowerCase().includes("resource coverage"));
  assert.ok(!explanation.toLowerCase().includes("time pressure"));
});

test("explanation fallback stays calm and stable when no strong factors are active", () => {
  const explanation = buildExplanation({
    remainingTargetHours: 1,
    effectiveStudyHoursLeft: 10,
    hoursUntilExam: 120,
    targetHours: 4,
    breakdown: {
      baseComplexity: 2,
      urgencyPressure: 0.2,
      capacityPressure: 0.1,
      portfolioOverloadPressure: 0,
      progressGap: 0.2,
      resourceGap: 0.2,
      sleepPenalty: 0,
      reliefBoost: 0.4,
      resourceReadinessSignal: 0.8,
    },
  });

  assert.equal(
    explanation,
    "Şimdilik baskısı düşük, ama takipte tut.",
  );
});
