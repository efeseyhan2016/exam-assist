import test from "node:test";
import assert from "node:assert/strict";

import {
  resolvePlanningRuntimeInputs,
} from "@/lib/planning-runtime";
import { studentConstraints, subjectSeeds, exams } from "@/lib/seed-data";
import { buildRiskEngineSnapshot } from "@/lib/risk";

test("planning runtime inputs prefer planning foundation data when present", () => {
  const planningExams = [
    {
      id: "exam-econ",
      subjectId: "economics",
      title: "Economics",
      shortLabel: "ECO",
      scheduledAt: "2026-04-12T09:00:00",
    },
  ];
  const planningSubjectSeeds = [
    {
      id: "economics",
      title: "Economics",
      shortLabel: "ECO",
      contentLoad: 3,
      difficulty: 4,
      practiceNeed: 2,
      resourceFriction: 2,
      reliefFactor: 0.2,
      targetHours: 9,
      initialStudiedCredit: 1,
      calibration: {
        difficultyRaw: null,
        resourceReadinessRaw: null,
        preparednessRaw: null,
      },
    },
  ];
  const planningConstraints = {
    ...studentConstraints,
    dailyStudyGoalHours: 4,
  };
  const planningProfile = {
    name: "Efe Balcılar",
    setupCompletedAt: "2026-04-03T10:00:00.000Z",
    language: "tr" as const,
    university: "Orta Doğu Teknik Üniversitesi",
    department: "İşletme",
    classYear: "3" as const,
    knownLanguages: ["tr", "en"],
  };

  const runtime = resolvePlanningRuntimeInputs({
    planningExams,
    planningSubjectSeeds,
    planningConstraints,
    planningProfile,
  });

  assert.deepEqual(runtime.exams, planningExams);
  assert.deepEqual(runtime.subjectSeeds, planningSubjectSeeds);
  assert.deepEqual(runtime.constraints, planningConstraints);
  assert.equal(runtime.profile.fullName, "Efe Balcılar");
  assert.equal(runtime.profile.university, "Orta Doğu Teknik Üniversitesi");
  assert.equal(runtime.profile.department, "İşletme");
  assert.deepEqual(runtime.profile.knownLanguages, ["tr", "en"]);
});

test("planning runtime falls back to seeded values when planning data is absent", () => {
  const runtime = resolvePlanningRuntimeInputs({
    planningExams: [],
    planningSubjectSeeds: [],
    planningConstraints: null,
    planningProfile: null,
  });

  assert.deepEqual(runtime.exams, exams);
  assert.deepEqual(runtime.subjectSeeds, subjectSeeds);
  assert.deepEqual(runtime.constraints, studentConstraints);
  assert.equal(runtime.profile.fullName, "Efe Balcılar");
  assert.equal(runtime.profile.university, "");
  assert.equal(runtime.profile.department, "");
  assert.deepEqual(runtime.profile.knownLanguages, []);
});

test("risk snapshot can run against provided runtime inputs instead of only seeded inputs", () => {
  const customExams = [
    {
      id: "exam-econ",
      subjectId: "economics",
      title: "Economics",
      shortLabel: "ECO",
      scheduledAt: "2026-04-12T09:00:00",
    },
  ];
  const customSubjectSeeds = [
    {
      id: "economics",
      title: "Economics",
      shortLabel: "ECO",
      contentLoad: 3,
      difficulty: 4,
      practiceNeed: 2,
      resourceFriction: 2,
      reliefFactor: 0.2,
      targetHours: 9,
      initialStudiedCredit: 0,
      calibration: {
        difficultyRaw: null,
        resourceReadinessRaw: null,
        preparednessRaw: null,
      },
    },
  ];

  const snapshot = buildRiskEngineSnapshot(
    [],
    new Date("2026-04-03T12:00:00"),
    studentConstraints,
    {
      exams: customExams,
      subjectSeeds: customSubjectSeeds,
    },
  );

  assert.equal(snapshot.rankedSubjects.length, 1);
  assert.equal(snapshot.rankedSubjects[0]?.subjectId, "economics");
  assert.equal(snapshot.nextExam?.subjectId, "economics");
});
