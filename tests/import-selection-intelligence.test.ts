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
    [],
    { university: "Boğaziçi Üniversitesi", department: "İşletme" },
  );

  assert.equal(history.length, 2);
  assert.equal(history[0]?.courseCode, "EKMS306");
  assert.equal(history[1]?.courseCode, "IIBF306");
  assert.equal(history[0]?.selectedCount, 2);
  assert.equal(history[0]?.dismissedCount, 0);
  assert.equal(history[0]?.profileDepartment, "isletme");
});

test("selection history ranking boosts candidates that resemble chosen exams", () => {
  const history = mergeImportSelectionHistory(
    [],
    [
      {
        title: "Commercial Law II",
        courseCode: "IIBF306",
        departmentHint: "İşletme",
      },
    ],
    [],
    { university: "Boğaziçi Üniversitesi", department: "İşletme" },
  );

  const strongMatch = scoreCandidateAgainstImportHistory(
    {
      title: "Commercial Law II",
      courseCode: "IIBF306",
      departmentHint: "İşletme",
    },
    history,
    { university: "Boğaziçi Üniversitesi", department: "İşletme" },
  );

  const weakMatch = scoreCandidateAgainstImportHistory(
    {
      title: "Genel Muhasebe",
      courseCode: "MUH101",
      departmentHint: "İktisat",
    },
    history,
    { university: "Boğaziçi Üniversitesi", department: "İşletme" },
  );

  assert.ok(strongMatch > weakMatch);
  assert.ok(strongMatch >= 6);
});

test("dismissed patterns only weakly demote similar candidates instead of hiding them", () => {
  const history = mergeImportSelectionHistory(
    [],
    [],
    [
      {
        title: "Commercial Law II",
        courseCode: "IIBF306",
        departmentHint: "İşletme",
      },
    ],
    { university: "Boğaziçi Üniversitesi", department: "İşletme" },
  );

  const score = scoreCandidateAgainstImportHistory(
    {
      title: "Commercial Law II",
      courseCode: "IIBF306",
      departmentHint: "İşletme",
    },
    history,
    { university: "Boğaziçi Üniversitesi", department: "İşletme" },
  );

  assert.ok(score < 0);
  assert.ok(score > -3);
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
      { university: "Boğaziçi Üniversitesi", department: "İşletme" },
    ),
    0,
  );
});

test("matching profile context strengthens otherwise similar remembered patterns", () => {
  const history = mergeImportSelectionHistory(
    [],
    [
      {
        title: "Commercial Law II",
        courseCode: "IIBF306",
        departmentHint: "İşletme",
      },
    ],
    [],
    { university: "Boğaziçi Üniversitesi", department: "İşletme" },
  );

  const sameContext = scoreCandidateAgainstImportHistory(
    {
      title: "Commercial Law II",
      courseCode: "IIBF306",
      departmentHint: "İşletme",
    },
    history,
    { university: "Boğaziçi Üniversitesi", department: "İşletme" },
  );

  const differentContext = scoreCandidateAgainstImportHistory(
    {
      title: "Commercial Law II",
      courseCode: "IIBF306",
      departmentHint: "İşletme",
    },
    history,
    { university: "Yıldız Teknik Üniversitesi", department: "Makine Mühendisliği" },
  );

  assert.ok(sameContext > differentContext);
});

test("dominant import language is inferred softly from remembered selections", () => {
  const history = [
    buildImportSelectionMemoryEntry({
      title: "Commercial Law II",
      courseCode: "IIBF306",
      departmentHint: "İşletme",
    }),
    buildImportSelectionMemoryEntry({
      title: "Computer Applications of Operations Research",
      courseCode: "ECMS306",
      departmentHint: "İşletme",
    }),
  ];

  assert.equal(inferDominantImportLanguage(history), "en");
});
