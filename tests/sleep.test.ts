import test from "node:test";
import assert from "node:assert/strict";

import { studentConstraints } from "@/lib/seed-data";
import { calculateSleepPenalty } from "@/lib/risk";

test("morning exams closer to the relevant night receive more sleep pressure than distant ones", () => {
  const examDate = new Date("2026-04-05T09:40:00");

  const distant = calculateSleepPenalty(
    new Date("2026-04-03T12:00:00"),
    examDate,
    studentConstraints,
  );
  const closer = calculateSleepPenalty(
    new Date("2026-04-04T12:00:00"),
    examDate,
    studentConstraints,
  );
  const sameNight = calculateSleepPenalty(
    new Date("2026-04-05T01:00:00"),
    examDate,
    studentConstraints,
  );

  assert.ok(distant < closer);
  assert.ok(closer < sameNight);
});

test("non-morning exams do not receive sleep pressure", () => {
  const penalty = calculateSleepPenalty(
    new Date("2026-04-05T01:00:00"),
    new Date("2026-04-05T13:40:00"),
    studentConstraints,
  );

  assert.equal(penalty, 0);
});

test("sleep pressure stays bounded and stable", () => {
  const examDate = new Date("2026-04-05T09:40:00");

  const values = [
    calculateSleepPenalty(new Date("2026-04-03T12:00:00"), examDate, studentConstraints),
    calculateSleepPenalty(new Date("2026-04-04T20:00:00"), examDate, studentConstraints),
    calculateSleepPenalty(new Date("2026-04-05T03:00:00"), examDate, studentConstraints),
  ];

  values.forEach((value) => {
    assert.ok(value >= 0);
    assert.ok(value <= 1);
  });
});

test("baseline behavior stays deterministic around the pre-exam night", () => {
  const examDate = new Date("2026-04-05T09:40:00");

  assert.equal(
    Number(
      calculateSleepPenalty(
        new Date("2026-04-03T12:00:00"),
        examDate,
        studentConstraints,
      ).toFixed(2),
    ),
    0,
  );
  assert.equal(
    Number(
      calculateSleepPenalty(
        new Date("2026-04-04T12:00:00"),
        examDate,
        studentConstraints,
      ).toFixed(2),
    ),
    0.05,
  );
  assert.equal(
    Number(
      calculateSleepPenalty(
        new Date("2026-04-05T01:00:00"),
        examDate,
        studentConstraints,
      ).toFixed(2),
    ),
    0.09,
  );
});

test("already-correct simple case remains zero for non-morning exams even when close", () => {
  const penalty = calculateSleepPenalty(
    new Date("2026-04-05T08:00:00"),
    new Date("2026-04-05T15:00:00"),
    studentConstraints,
  );

  assert.equal(penalty, 0);
});
