import test from "node:test";
import assert from "node:assert/strict";

import { getGuidanceCopy } from "@/lib/risk-presentation";

test("guidance copy turns internal risk labels into calmer user-facing cues", () => {
  assert.deepEqual(getGuidanceCopy("Critical"), {
    badge: "Öne al",
    summary: "Bugün ilk sırada",
  });
  assert.deepEqual(getGuidanceCopy("High"), {
    badge: "Yakın takip",
    summary: "Gündemin üstünde",
  });
  assert.deepEqual(getGuidanceCopy("Moderate"), {
    badge: "Gündemde tut",
    summary: "Bu hafta izlemeye değer",
  });
  assert.deepEqual(getGuidanceCopy("Low"), {
    badge: "Stabil",
    summary: "Şimdilik alan açıyor",
  });
});
