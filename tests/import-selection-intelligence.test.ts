import test from "node:test";
import assert from "node:assert/strict";

import {
  buildImportSelectionMemoryEntry,
  inferDominantImportLanguage,
  mergeImportSelectionHistory,
  scoreCandidateAgainstImportHistory,
} from "@/lib/import-selection-intelligence";

test("selection history preserves recent unique subject patterns", () => {
  const history = mergeImportSelectionHistory(
    [],
    [
      {
        title: "Yöneylem Araştırması Bilgisayar Uygulamaları",
        courseCode: "EKMS306",
        departmentHint: "İşletme",
      },
      {
        title: "Yöneylem Araştırması Bilgisayar Uygulamaları",
        courseCode: "EKMS306",
        departmentHint: "İşletme",
      },
      {
        title: "Commercial Law II",
        courseCode: "IIBF306",
        departmentHint: "İşletme",
      },
    ],
  );

  assert.equal(history.length, 2);
  assert.equal(history[0]?.courseCode, "EKMS306");
  assert.equal(history[1]?.courseCode, "IIBF306");
});

test("selection history ranking boosts candidates that resemble chosen exams", () => {
  const history = mergeImportSelectionHistory([], [
    {
      title: "Commercial Law II",
      courseCode: "IIBF306",
      departmentHint: "İşletme",
    },
  ]);

  const strongMatch = scoreCandidateAgainstImportHistory(
    {
      title: "Commercial Law II",
      courseCode: "IIBF306",
      departmentHint: "İşletme",
    },
    history,
  );

  const weakMatch = scoreCandidateAgainstImportHistory(
    {
      title: "Genel Muhasebe",
      courseCode: "MUH101",
      departmentHint: "İktisat",
    },
    history,
  );

  assert.ok(strongMatch > weakMatch);
  assert.ok(strongMatch >= 6);
});

test("selection history stays inert when there is no useful memory yet", () => {
  assert.equal(
    scoreCandidateAgainstImportHistory(
      {
        title: "Genel Muhasebe",
        courseCode: "MUH101",
        departmentHint: "İktisat",
      },
      [],
    ),
    0,
  );
});

test("dominant import language is inferred softly from remembered selections", () => {
  const history = [
    buildImportSelectionMemoryEntry({
      title: "Commercial Law II",
      courseCode: "IIBF306",
    }),
    buildImportSelectionMemoryEntry({
      title: "Computer Applications of Operations Research",
      courseCode: "ECMS306",
    }),
  ];

  assert.equal(inferDominantImportLanguage(history), "en");
});
