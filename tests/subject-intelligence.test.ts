import test from "node:test";
import assert from "node:assert/strict";

import { deriveStudyMode } from "@/lib/subject-intelligence";
import { SubjectSeed } from "@/lib/types";

function makeSubject(title: string, overrides: Partial<SubjectSeed> = {}): SubjectSeed {
  return {
    id: title.toLowerCase().replace(/\s+/g, "-"),
    title,
    shortLabel: title.slice(0, 3).toUpperCase(),
    contentLoad: 3,
    difficulty: 3,
    practiceNeed: 2.5,
    resourceFriction: 2,
    reliefFactor: 1,
    targetHours: 8,
    initialStudiedCredit: 0,
    calibration: {
      difficultyRaw: null,
      resourceReadinessRaw: null,
      preparednessRaw: null,
    },
    ...overrides,
  };
}

test("deriveStudyMode classifies quantitative university courses as problem-oriented", () => {
  assert.equal(deriveStudyMode(makeSubject("Calculus II")), "problem");
});

test("deriveStudyMode classifies law-heavy courses as memorization-oriented", () => {
  assert.equal(deriveStudyMode(makeSubject("Ticaret Hukuku II")), "memorization");
});

test("deriveStudyMode classifies economics-style courses as interpretive", () => {
  assert.equal(deriveStudyMode(makeSubject("Makroekonomi")), "interpretive");
});

test("deriveStudyMode classifies biology-style courses as conceptual", () => {
  assert.equal(deriveStudyMode(makeSubject("Hücre Biyolojisi")), "conceptual");
});

test("deriveStudyMode stays conservative when title and content hints disagree strongly", () => {
  const mode = deriveStudyMode(
    makeSubject("Türk İnkılap Tarihi"),
    ["formula-heavy"],
  );

  assert.equal(mode, "mixed");
});
