import test from "node:test";
import assert from "node:assert/strict";

import { getGuidanceCopy } from "@/lib/risk-presentation";

test("guidance copy turns internal risk labels into calmer user-facing cues", () => {
  assert.deepEqual(getGuidanceCopy("Critical"), {
    badge: "Hemen başla",
    summary: "Öncelikli ders",
  });
  assert.deepEqual(getGuidanceCopy("High"), {
    badge: "Yakın takipte",
    summary: "Sıradaki öncelik",
  });
  assert.deepEqual(getGuidanceCopy("Moderate"), {
    badge: "Gözle",
    summary: "Bu hafta takip et",
  });
  assert.deepEqual(getGuidanceCopy("Low"), {
    badge: "Sakin",
    summary: "Şimdilik bekleyebilir",
  });
});
