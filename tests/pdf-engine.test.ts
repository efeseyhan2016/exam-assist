import test from "node:test";
import assert from "node:assert/strict";

import { debugParseRowsIntoExams, deriveTopicHints, parseRowsIntoExams } from "@/lib/pdf-engine";

test("parseRowsIntoExams extracts table-style exam rows with split course code and title cells", () => {
  const rows = [
    ["Ders Kodu", "Ders Adi", "Tarih", "Saat", "Salon"],
    ["RMK202", "Retail Marketing", "08.04.2026", "10:40", "B-201"],
    ["BUS401", "International Accounting Standards", "10.04.2026", "09:30", "C-101"],
  ];

  const exams = parseRowsIntoExams(rows);

  assert.equal(exams.length, 2);
  assert.equal(exams[0]?.courseCode, "RMK202");
  assert.equal(exams[0]?.title, "RMK202 Retail Marketing");
  assert.equal(exams[1]?.courseCode, "BUS401");
  assert.equal(exams[1]?.title, "BUS401 International Accounting Standards");
});

test("parseRowsIntoExams can recover a nearby course title when the dated row is sparse", () => {
  const rows = [
    ["Selected Topics in POM"],
    ["POM301", "07.04.2026", "11:40", "Lab 3"],
  ];

  const exams = parseRowsIntoExams(rows);

  assert.equal(exams.length, 1);
  assert.equal(exams[0]?.courseCode, "POM301");
  assert.equal(exams[0]?.title, "POM301 Selected Topics in POM");
});

test("parseRowsIntoExams handles weekday-plus-parenthesized-month rows from the real exam schedule shape", () => {
  const rows = [
    ["Course Code", "Course", "Instructor", "Date", "Time", "Room"],
    ["4. Grade"],
    ["MAN442", "SELECTED TOPICS IN POM", "CEM MENTEN", "Tuesday (7 Apr)", "11:40-13:30", "LAB B5"],
    ["MAN409", "RETAIL MARKETING MANAGEMENT", "BEYZA ÖZYİĞİT GÜLTEKİN", "Wednesday (8 Apr)", "10:40-12:30", "B8"],
    ["MAN440", "INTERNATIONAL ACCOUNTING STANDARDS", "BURAK PİRGAİP", "Friday (10 Apr)", "10:40-12:30", "K2, K3"],
  ];

  const result = debugParseRowsIntoExams(rows);

  assert.equal(result.debug.rowsWithDate, 3);
  assert.equal(result.debug.candidateCount, 3);
  assert.equal(result.exams[0]?.courseCode, "MAN442");
  assert.equal(result.exams[1]?.courseCode, "MAN409");
  assert.equal(result.exams[2]?.courseCode, "MAN440");
  assert.equal(result.exams[2]?.title, "MAN440 INTERNATIONAL ACCOUNTING STANDARDS");
});

test("parseRowsIntoExams prefers ders adı over bölüm adı when table headers are present", () => {
  const rows = [
    ["Ders Kodu", "Ders Adı", "Bölüm Adı", "Tarih", "Saat", "Salon"],
    ["CSE101", "INTRODUCTION TO PROGRAMMING", "COMPUTER ENGINEERING", "12.04.2026", "09:30", "A1"],
    ["MAT201", "LINEAR ALGEBRA II", "MATHEMATICS", "13.04.2026", "14:00", "B2"],
  ];

  const exams = parseRowsIntoExams(rows);

  assert.equal(exams.length, 2);
  assert.equal(exams[0]?.title, "CSE101 INTRODUCTION TO PROGRAMMING");
  assert.equal(exams[1]?.title, "MAT201 LINEAR ALGEBRA II");
});

test("parseRowsIntoExams does not misread dotted dates as times", () => {
  const rows = [
    ["Ders Kodu", "Ders Adı", "Tarih", "Saat", "Salon"],
    ["ECO301", "ECONOMETRICS", "12.04.2026", "", "C1"],
  ];

  const exams = parseRowsIntoExams(rows);
  const scheduledAt = new Date(exams[0]!.scheduledAt);

  assert.equal(exams.length, 1);
  assert.equal(scheduledAt.getFullYear(), 2026);
  assert.equal(scheduledAt.getMonth(), 3);
  assert.equal(scheduledAt.getDate(), 12);
  assert.equal(scheduledAt.getHours(), 9);
  assert.equal(scheduledAt.getMinutes(), 0);
});

test("deriveTopicHints extracts calm topic labels from course-note titles and headings", () => {
  const topics = deriveTopicHints({
    title: "Lozan Barış Konferansı ve Barış Antlaşması",
    rowTexts: [
      "Lozan Barış Konferansı",
      "Barış Antlaşması",
      "Türkiye'nin dış politika hattı",
    ],
  });

  assert.deepEqual(topics.slice(0, 3), [
    "Lozan Barış Konferansı ve Barış Antlaşması",
    "Lozan Barış Konferansı",
    "Barış Antlaşması",
  ]);
});

test("deriveTopicHints ignores university boilerplate in PDF rows", () => {
  const topics = deriveTopicHints({
    title: "Atatürk Dönemi Türk Dış Politikası",
    rowTexts: [
      "Hacettepe Üniversitesi",
      "İktisadi ve İdari Bilimler Fakültesi",
      "Atatürk Dönemi Türk Dış Politikası",
      "Lozan Barış Konferansı",
      "www.hacettepe.edu.tr",
      "Sayfa 1 / 12",
    ],
  });

  assert.ok(!topics.includes("Hacettepe Üniversitesi"));
  assert.ok(!topics.includes("İktisadi ve İdari Bilimler Fakültesi"));
  assert.ok(topics.includes("Atatürk Dönemi Türk Dış Politikası"));
  assert.ok(topics.includes("Lozan Barış Konferansı"));
});
