import test from "node:test";
import assert from "node:assert/strict";

import { studentConstraints } from "@/lib/seed-data";
import {
  estimateEffectiveStudyHoursLeft,
  getGreetingForDate,
  getTodayKeyInTimeZone,
  sumSessionsForToday,
} from "@/lib/time";
import { StudySession } from "@/lib/types";

test("remaining capacity decreases when study time has already been logged today", () => {
  const now = new Date("2026-04-03T12:00:00");
  const examDate = new Date("2026-04-04T12:00:00");

  const withoutLoggedTime = estimateEffectiveStudyHoursLeft(
    now,
    examDate,
    studentConstraints,
  );
  const withThreeHoursLogged = estimateEffectiveStudyHoursLeft(
    now,
    examDate,
    studentConstraints,
    180,
  );

  assert.equal(withoutLoggedTime, 6.67);
  assert.equal(withThreeHoursLogged, 3.67);
});

test("exam-day remaining capacity stays sane and respects already-consumed study time", () => {
  const now = new Date("2026-04-03T09:00:00");
  const examDate = new Date("2026-04-03T18:00:00");

  const withoutLoggedTime = estimateEffectiveStudyHoursLeft(
    now,
    examDate,
    studentConstraints,
  );
  const withOneHourLogged = estimateEffectiveStudyHoursLeft(
    now,
    examDate,
    studentConstraints,
    240,
  );

  assert.equal(withoutLoggedTime, 5);
  assert.equal(withOneHourLogged, 1);
});

test("when today's study goal is already exhausted, only future-day capacity remains", () => {
  const now = new Date("2026-04-03T12:00:00");
  const examDate = new Date("2026-04-05T15:00:00");

  const capacity = estimateEffectiveStudyHoursLeft(
    now,
    examDate,
    studentConstraints,
    300,
  );

  assert.equal(capacity, 9.67);
});

test("sumSessionsForToday ignores future timestamps on the same calendar day", () => {
  const reference = new Date("2026-04-03T12:00:00");
  const sessions: StudySession[] = [
    {
      id: "session-1",
      subjectId: "economics",
      minutes: 90,
      createdAt: "2026-04-03T08:00:00",
    },
    {
      id: "session-2",
      subjectId: "economics",
      minutes: 45,
      createdAt: "2026-04-03T15:00:00",
    },
    {
      id: "session-3",
      subjectId: "economics",
      minutes: 30,
      createdAt: "2026-04-02T15:00:00",
    },
  ];

  assert.equal(sumSessionsForToday(sessions, reference), 90);
});

test("timezone-aware day key follows the runtime timezone instead of local machine date", () => {
  const date = new Date("2026-04-05T21:30:00.000Z");

  assert.equal(getTodayKeyInTimeZone(date, "Europe/Istanbul"), "2026-04-06");
  assert.equal(getTodayKeyInTimeZone(date, "UTC"), "2026-04-05");
});

test("greeting changes by hour without showing the clock", () => {
  assert.equal(
    getGreetingForDate(new Date("2026-04-05T06:00:00.000Z"), "Europe/Istanbul"),
    "Günaydın",
  );
  assert.equal(
    getGreetingForDate(new Date("2026-04-05T11:00:00.000Z"), "Europe/Istanbul"),
    "İyi günler",
  );
  assert.equal(
    getGreetingForDate(new Date("2026-04-05T17:30:00.000Z"), "Europe/Istanbul"),
    "İyi akşamlar",
  );
});
