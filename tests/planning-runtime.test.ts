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

test("manual schedule exams are folded into planning risk inputs with calibration", () => {
  const runtime = resolvePlanningRuntimeInputs({
    planningExams: [],
    planningSubjectSeeds: [],
    planningConstraints: studentConstraints,
    planningProfile: null,
    scheduleItems: [
      {
        id: "manual-services",
        title: "Services Marketing",
        shortLabel: "SRV",
        scheduledAt: "2026-04-10T09:00:00.000Z",
        kind: "exam",
        source: "manual",
        calibration: {
          difficultyRaw: "zor",
          resourceReadinessRaw: "eksik",
          preparednessRaw: "az",
        },
      },
      {
        id: "manual-deadline",
        title: "Proje teslimi",
        shortLabel: "PRJ",
        scheduledAt: "2026-04-11T09:00:00.000Z",
        kind: "deadline",
        source: "manual",
      },
    ],
  });

  const manualExam = runtime.exams.find(
    (exam) => exam.id === "schedule-exam:manual-services",
  );
  const manualSeed = runtime.subjectSeeds.find(
    (seed) => seed.id === "schedule:manual-services",
  );

  assert.equal(manualExam?.subjectId, "schedule:manual-services");
  assert.equal(manualExam?.title, "Services Marketing");
  assert.equal(manualSeed?.difficulty, 4.8);
  assert.equal(manualSeed?.resourceFriction, 4.2);
  assert.deepEqual(manualSeed?.calibration, {
    difficultyRaw: "zor",
    resourceReadinessRaw: "eksik",
    preparednessRaw: "az",
  });
  assert.equal(
    runtime.exams.some((exam) => exam.id === "schedule-exam:manual-deadline"),
    false,
  );
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

test("explicitly empty user planning data stays empty instead of falling back to seeds", () => {
  const runtime = resolvePlanningRuntimeInputs({
    planningExams: [],
    planningSubjectSeeds: [],
    planningConstraints: studentConstraints,
    planningProfile: {
      name: "Efe Balcılar",
      setupCompletedAt: "2026-04-03T10:00:00.000Z",
      language: "tr",
      university: "",
      department: "",
      classYear: "",
      knownLanguages: ["tr"],
    },
  });

  assert.deepEqual(runtime.exams, []);
  assert.deepEqual(runtime.subjectSeeds, []);
  assert.equal(runtime.profile.fullName, "Efe Balcılar");
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
