import test from "node:test";
import assert from "node:assert/strict";

import { calculateUrgencyPressure } from "@/lib/risk";

function hoursFrom(base: Date, hours: number) {
  return new Date(base.getTime() + hours * 3_600_000);
}

test("near exams create higher urgency than farther exams", () => {
  const now = new Date("2026-04-03T12:00:00");

  const inSixHours = calculateUrgencyPressure(now, hoursFrom(now, 6));
  const inOneDay = calculateUrgencyPressure(now, hoursFrom(now, 24));
  const inThreeDays = calculateUrgencyPressure(now, hoursFrom(now, 72));
  const inOneWeek = calculateUrgencyPressure(now, hoursFrom(now, 168));

  assert.ok(inSixHours > inOneDay);
  assert.ok(inOneDay > inThreeDays);
  assert.ok(inThreeDays > inOneWeek);
});

test("urgency changes smoothly across nearby horizons", () => {
  const now = new Date("2026-04-03T12:00:00");

  const inTwentyFourHours = calculateUrgencyPressure(now, hoursFrom(now, 24));
  const inTwentyFiveHours = calculateUrgencyPressure(now, hoursFrom(now, 25));
  const inFortyEightHours = calculateUrgencyPressure(now, hoursFrom(now, 48));
  const inFortyNineHours = calculateUrgencyPressure(now, hoursFrom(now, 49));

  assert.ok(Math.abs(inTwentyFourHours - inTwentyFiveHours) < 0.03);
  assert.ok(Math.abs(inFortyEightHours - inFortyNineHours) < 0.02);
});

test("clustered near-term deadlines retain meaningful urgency across the short horizon", () => {
  const now = new Date("2026-04-03T12:00:00");

  const inOneDay = calculateUrgencyPressure(now, hoursFrom(now, 24));
  const inTwoDays = calculateUrgencyPressure(now, hoursFrom(now, 48));
  const inThreeDays = calculateUrgencyPressure(now, hoursFrom(now, 72));

  assert.ok(inOneDay > 0.6);
  assert.ok(inTwoDays > 0.35);
  assert.ok(inThreeDays > 0.25);
});

test("far-enough exams do not receive exaggerated urgency", () => {
  const now = new Date("2026-04-03T12:00:00");

  const inOneWeek = calculateUrgencyPressure(now, hoursFrom(now, 168));
  const inTwoWeeks = calculateUrgencyPressure(now, hoursFrom(now, 336));

  assert.ok(inOneWeek < 0.12);
  assert.ok(inTwoWeeks < 0.03);
});

test("stable baseline cases stay deterministic", () => {
  const now = new Date("2026-04-03T12:00:00");

  assert.equal(
    Number(calculateUrgencyPressure(now, hoursFrom(now, 0)).toFixed(2)),
    1.45,
  );
  assert.equal(
    Number(calculateUrgencyPressure(now, hoursFrom(now, 72)).toFixed(2)),
    0.28,
  );
});
