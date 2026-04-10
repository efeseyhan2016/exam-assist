import test from "node:test";
import assert from "node:assert/strict";

import {
  buildExamOutcomeDrafts,
  getExamOutcomeStatus,
  splitExamTimeline,
} from "@/lib/exam-outcomes";

test("splitExamTimeline separates upcoming and completed exams", () => {
  const timeline = [
    {
      id: "exam-1",
      scheduledAt: "2026-04-09T09:00:00.000Z",
      scheduledAtDate: new Date("2026-04-09T09:00:00.000Z"),
    },
    {
      id: "exam-2",
      scheduledAt: "2026-04-10T09:00:00.000Z",
      scheduledAtDate: new Date("2026-04-10T09:00:00.000Z"),
    },
    {
      id: "exam-3",
      scheduledAt: "2026-04-08T09:00:00.000Z",
      scheduledAtDate: new Date("2026-04-08T09:00:00.000Z"),
    },
  ];

  const split = splitExamTimeline(timeline, new Date("2026-04-09T12:00:00.000Z"));

  assert.deepEqual(
    split.upcoming.map((exam) => exam.id),
    ["exam-2"],
  );
  assert.deepEqual(
    split.completed.map((exam) => exam.id),
    ["exam-1", "exam-3"],
  );
});

test("exam outcome status reflects whether a score exists", () => {
  assert.equal(getExamOutcomeStatus(undefined), "Bitti");
  assert.equal(
    getExamOutcomeStatus({
      id: "outcome-1",
      examId: "exam-1",
      subjectId: "economics",
      notes: "Final bölüm zordu.",
      createdAt: "2026-04-09T12:00:00.000Z",
      updatedAt: "2026-04-09T12:00:00.000Z",
    }),
    "Değerlendirme var",
  );
  assert.equal(
    getExamOutcomeStatus({
      id: "outcome-2",
      examId: "exam-2",
      subjectId: "economics",
      score: 88,
      createdAt: "2026-04-09T12:00:00.000Z",
      updatedAt: "2026-04-09T12:00:00.000Z",
    }),
    "Not girildi",
  );
});

test("exam outcome drafts preserve dirty unsaved input across resyncs", () => {
  const drafts = buildExamOutcomeDrafts(
    [{ id: "exam-1" }],
    {},
    { "exam-1": { score: "7", notes: "Zordu" } },
    { dirtyExamIds: new Set(["exam-1"]) },
  );

  assert.deepEqual(drafts, {
    "exam-1": { score: "7", notes: "Zordu" },
  });
});

test("exam outcome drafts initialize from saved outcomes when not dirty", () => {
  const drafts = buildExamOutcomeDrafts(
    [{ id: "exam-1" }],
    {
      "exam-1": {
        id: "outcome-1",
        examId: "exam-1",
        subjectId: "service",
        score: 82.5,
        notes: "İyi geçti",
        createdAt: "2026-04-09T12:00:00.000Z",
        updatedAt: "2026-04-09T12:00:00.000Z",
      },
    },
    { "exam-1": { score: "", notes: "" } },
  );

  assert.deepEqual(drafts, {
    "exam-1": { score: "82.5", notes: "İyi geçti" },
  });
});
