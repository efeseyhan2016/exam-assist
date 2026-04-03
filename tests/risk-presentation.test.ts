import test from "node:test";
import assert from "node:assert/strict";

import { getGuidanceCopy } from "@/lib/risk-presentation";

test("guidance copy turns internal risk labels into calmer user-facing cues", () => {
  assert.deepEqual(getGuidanceCopy("Critical"), {
    badge: "Start now",
    summary: "Best next block",
  });
  assert.deepEqual(getGuidanceCopy("High"), {
    badge: "Keep close",
    summary: "Likely next",
  });
  assert.deepEqual(getGuidanceCopy("Moderate"), {
    badge: "In view",
    summary: "Watch this week",
  });
  assert.deepEqual(getGuidanceCopy("Low"), {
    badge: "Stable",
    summary: "Can wait a little",
  });
});
