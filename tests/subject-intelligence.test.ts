import test from "node:test";
import assert from "node:assert/strict";

import { deriveSessionBehaviorHint, deriveStudyMode } from "@/lib/subject-intelligence";
import { StudySession, SubjectSeed } from "@/lib/types";

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

test("deriveSessionBehaviorHint infers problem mode from longer repeated sessions", () => {
  const sessions: StudySession[] = [
    { id: "s1", subjectId: "stats", minutes: 50, createdAt: "2026-04-01T10:00:00.000Z" },
    { id: "s2", subjectId: "stats", minutes: 45, createdAt: "2026-04-02T10:00:00.000Z" },
    { id: "s3", subjectId: "stats", minutes: 60, createdAt: "2026-04-03T10:00:00.000Z" },
  ];

  assert.equal(deriveSessionBehaviorHint(sessions, "stats"), "problem");
});

test("deriveSessionBehaviorHint stays silent when session history is too thin", () => {
  const sessions: StudySession[] = [
    { id: "s1", subjectId: "law", minutes: 15, createdAt: "2026-04-01T10:00:00.000Z" },
    { id: "s2", subjectId: "law", minutes: 20, createdAt: "2026-04-02T10:00:00.000Z" },
  ];

  assert.equal(deriveSessionBehaviorHint(sessions, "law"), null);
});

test("deriveStudyMode uses session behavior as a weak fallback when title and resources are silent", () => {
  const subject = makeSubject("Research Studio", {
    practiceNeed: 2,
    contentLoad: 2,
  });

  assert.equal(deriveStudyMode(subject, [], "memorization"), "memorization");
});
