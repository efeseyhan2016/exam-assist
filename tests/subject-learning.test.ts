import test from "node:test";
import assert from "node:assert/strict";

import { buildSubjectLearningProfile } from "@/lib/subject-learning";
import { ResourceItem, StudySession } from "@/lib/types";

function makeSession(
  id: string,
  subjectId: string,
  minutes: number,
): StudySession {
  return {
    id,
    subjectId,
    minutes,
    createdAt: "2026-04-06T10:00:00.000Z",
  };
}

function makeResource(
  id: string,
  title: string,
  overrides: Partial<ResourceItem> = {},
): ResourceItem {
  return {
    id,
    subjectId: "ait",
    title,
    type: "pdf",
    pageCount: 12,
    pagesRead: 6,
    fileSizeBytes: 1024,
    uploadedAt: "2026-04-06T09:00:00.000Z",
    contentHint: "prose-heavy",
    engagementCount: 1,
    revisitCount: 0,
    ...overrides,
  };
}

test("subject learning profile infers problem mode from repeated question resources and long sessions", () => {
  const profile = buildSubjectLearningProfile({
    subjectId: "stats",
    sessions: [
      makeSession("s1", "stats", 55),
      makeSession("s2", "stats", 50),
      makeSession("s3", "stats", 45),
    ],
    resources: [
      makeResource("r1", "Çıkmış Sorular", {
        subjectId: "stats",
        contentHint: "formula-heavy",
        revisitCount: 1,
      }),
    ],
  });

  assert.equal(profile.modeHint, "problem");
});

test("subject learning profile infers memorization mode from short sessions and summary-heavy notes", () => {
  const profile = buildSubjectLearningProfile({
    subjectId: "ait",
    sessions: [
      makeSession("s1", "ait", 20),
      makeSession("s2", "ait", 15),
      makeSession("s3", "ait", 25),
    ],
    resources: [
      makeResource("r1", "Atatürk Dönemi İç Politika", {
        revisitCount: 1,
      }),
      makeResource("r2", "Final Özeti", {
        pageCount: 8,
      }),
    ],
  });

  assert.equal(profile.modeHint, "memorization");
});

test("subject learning profile stays quiet when behavior does not form a clear pattern yet", () => {
  const profile = buildSubjectLearningProfile({
    subjectId: "generic",
    sessions: [makeSession("s1", "generic", 35)],
    resources: [
      makeResource("r1", "Week 5 Reader", {
        subjectId: "generic",
        contentHint: "unknown",
        pagesRead: 0,
        engagementCount: 0,
      }),
    ],
  });

  assert.equal(profile.modeHint, null);
});

test("good reflections can strengthen a borderline memorization pattern into a usable hint", () => {
  const profile = buildSubjectLearningProfile({
    subjectId: "ait",
    sessions: [
      { ...makeSession("s1", "ait", 20), reflection: "good" },
      { ...makeSession("s2", "ait", 20), reflection: "good" },
      { ...makeSession("s3", "ait", 25), reflection: "good" },
    ],
    resources: [
      makeResource("r1", "Final Özeti", {
        pageCount: 8,
        pagesRead: 3,
      }),
    ],
  });

  assert.equal(profile.modeHint, "memorization");
  assert.equal(profile.confidence, "medium");
});

test("repeated stuck reflections on a clear problem pattern pivot to interpretive", () => {
  const profile = buildSubjectLearningProfile({
    subjectId: "stats",
    sessions: [
      { ...makeSession("s1", "stats", 55), reflection: "stuck" },
      { ...makeSession("s2", "stats", 50), reflection: "stuck" },
      { ...makeSession("s3", "stats", 45), reflection: "stuck" },
    ],
    resources: [
      makeResource("r1", "Çıkmış Sorular", {
        subjectId: "stats",
        contentHint: "formula-heavy",
      }),
    ],
  });

  assert.equal(profile.modeHint, "interpretive");
  assert.equal(profile.confidence, "low");
  assert.equal(profile.isPivot, true);
  assert.ok(profile.reason !== null);
});

test("repeated stuck reflections on a memorization pattern pivot to interpretive", () => {
  const profile = buildSubjectLearningProfile({
    subjectId: "ait",
    sessions: [
      { ...makeSession("s1", "ait", 18), reflection: "stuck" },
      { ...makeSession("s2", "ait", 20), reflection: "stuck" },
      { ...makeSession("s3", "ait", 22), reflection: "surface" },
    ],
    resources: [
      makeResource("r1", "Final Özeti", { pageCount: 8 }),
      makeResource("r2", "Atatürk Dönemi İç Politika", { revisitCount: 1 }),
    ],
  });

  assert.equal(profile.modeHint, "interpretive");
  assert.equal(profile.isPivot, true);
});

test("stuck reflections with at least 2 good reflections do not trigger pivot", () => {
  const profile = buildSubjectLearningProfile({
    subjectId: "stats",
    sessions: [
      { ...makeSession("s1", "stats", 55), reflection: "stuck" },
      { ...makeSession("s2", "stats", 50), reflection: "good" },
      { ...makeSession("s3", "stats", 50), reflection: "good" },
    ],
    resources: [
      makeResource("r1", "Çıkmış Sorular", {
        subjectId: "stats",
        contentHint: "formula-heavy",
        revisitCount: 1,
      }),
    ],
  });

  assert.equal(profile.isPivot, false);
});

test("no sessions and no resources yields null mode with isPivot false", () => {
  const profile = buildSubjectLearningProfile({
    subjectId: "empty",
    sessions: [],
    resources: [],
  });

  assert.equal(profile.modeHint, null);
  assert.equal(profile.isPivot, false);
});
