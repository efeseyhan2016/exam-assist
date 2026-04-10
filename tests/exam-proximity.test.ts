import test from "node:test";
import assert from "node:assert/strict";

import { getExamProximityProfile } from "@/lib/exam-proximity";

test("exam proximity profile marks past exams as completed", () => {
  const profile = getExamProximityProfile(-1);

  assert.equal(profile.stage, "completed");
  assert.equal(profile.label, "Bitti");
  assert.equal(profile.prefersConsolidation, true);
  assert.equal(profile.prefersQuickReview, false);
});

test("exam proximity profile stays in semester mode beyond two weeks", () => {
  const profile = getExamProximityProfile(15 * 24);

  assert.equal(profile.stage, "semester");
  assert.equal(profile.label, "Dönem modu");
  assert.equal(profile.narrowsScope, false);
});

test("exam proximity profile shifts through the documented 14/7/3/1 windows", () => {
  assert.equal(getExamProximityProfile(10 * 24).stage, "transition");
  assert.equal(getExamProximityProfile(5 * 24).stage, "exam");
  assert.equal(getExamProximityProfile(36).stage, "review");
  assert.equal(getExamProximityProfile(12).stage, "final");
});

test("review and final windows prefer consolidation over new scope", () => {
  const review = getExamProximityProfile(40);
  const final = getExamProximityProfile(8);

  assert.equal(review.prefersConsolidation, true);
  assert.equal(review.prefersQuickReview, false);
  assert.equal(final.prefersConsolidation, true);
  assert.equal(final.prefersQuickReview, true);
});
