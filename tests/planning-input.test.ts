import test from "node:test";
import assert from "node:assert/strict";

import {
  deriveTargetHours,
  mapPreparedness,
  rawAnswersToSubjectSeed,
} from "@/lib/planning-input";

test("rawAnswersToSubjectSeed maps raw calibration answers into normalized subject fields", () => {
  const subject = rawAnswersToSubjectSeed(
    {
      difficultyRaw: "zor",
      resourceReadinessRaw: "eksik",
      preparednessRaw: "biraz",
    },
    {
      exam: {
        subjectId: "managerial-accounting",
        title: "Managerial Accounting",
        shortLabel: "MA",
      },
    },
  );

  assert.equal(subject.id, "managerial-accounting");
  assert.equal(subject.title, "Managerial Accounting");
  assert.equal(subject.shortLabel, "MA");
  assert.equal(subject.difficulty, 4.8);
  assert.equal(subject.resourceFriction, 4.2);
  assert.equal(subject.contentLoad, 4.68);
  assert.equal(subject.practiceNeed, 2.5);
  assert.equal(subject.targetHours, 14);
  assert.equal(subject.reliefFactor, 0.35);
  assert.equal(subject.initialStudiedCredit, 2.1);
  assert.deepEqual(subject.calibration, {
    difficultyRaw: "zor",
    resourceReadinessRaw: "eksik",
    preparednessRaw: "biraz",
  });
});

test("preparedness credit is setup-time credit and scales from targetHours", () => {
  assert.deepEqual(mapPreparedness("iyi", 4), {
    reliefFactor: 0.75,
    initialStudiedCredit: 1.6,
  });

  assert.deepEqual(mapPreparedness("iyi", 14), {
    reliefFactor: 0.75,
    initialStudiedCredit: 5.6,
  });

  assert.deepEqual(mapPreparedness(null, 8), {
    reliefFactor: 0.25,
    initialStudiedCredit: 0,
  });
});

test("subject id always mirrors exam.subjectId as the canonical link key", () => {
  const subject = rawAnswersToSubjectSeed(
    {
      difficultyRaw: "az",
      resourceReadinessRaw: "hazir",
      preparednessRaw: "az",
    },
    {
      exam: {
        subjectId: "operations-research",
        title: "Operations Research",
        shortLabel: "OR",
      },
    },
  );

  assert.equal(subject.id, "operations-research");
});

test("target hour mapping stays on the documented v1 heuristic bands", () => {
  assert.equal(deriveTargetHours(2.0), 4);
  assert.equal(deriveTargetHours(3.0), 6);
  assert.equal(deriveTargetHours(3.8), 8);
  assert.equal(deriveTargetHours(4.5), 11);
  assert.equal(deriveTargetHours(4.8), 14);
});
