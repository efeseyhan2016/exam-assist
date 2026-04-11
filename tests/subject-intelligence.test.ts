import test from "node:test";
import assert from "node:assert/strict";

import { deriveSessionBehaviorHint, deriveStudyMode, deriveSubjectDomain } from "@/lib/subject-intelligence";
import { StudySession, SubjectSeed } from "@/lib/types";

function makeSubject(title: string, overrides: Partial<SubjectSeed> = {}): SubjectSeed {
  return {
    id: title.toLowerCase().replace(/\s+/g, "-"),
    title,
    shortLabel: title.slice(0, 3).toUpperCase(),
    contentLoad: 3,
    difficulty: 3,
    practiceNeed: 2.5,
    resourceFriction: 2,
    reliefFactor: 1,
    targetHours: 8,
    initialStudiedCredit: 0,
    calibration: {
      difficultyRaw: null,
      resourceReadinessRaw: null,
      preparednessRaw: null,
    },
    ...overrides,
  };
}

test("deriveStudyMode classifies quantitative university courses as problem-oriented", () => {
  assert.equal(deriveStudyMode(makeSubject("Calculus II")), "problem");
});

test("deriveStudyMode classifies law-heavy courses as memorization-oriented", () => {
  assert.equal(deriveStudyMode(makeSubject("Ticaret Hukuku II")), "memorization");
});

test("deriveStudyMode classifies economics-style courses as interpretive", () => {
  assert.equal(deriveStudyMode(makeSubject("Makroekonomi")), "interpretive");
});

test("deriveStudyMode classifies biology-style courses as conceptual", () => {
  assert.equal(deriveStudyMode(makeSubject("Hücre Biyolojisi")), "conceptual");
});

test("deriveStudyMode stays conservative when title and content hints disagree strongly", () => {
  const mode = deriveStudyMode(
    makeSubject("Türk İnkılap Tarihi"),
    ["formula-heavy"],
  );

  assert.equal(mode, "mixed");
});

test("deriveSessionBehaviorHint infers problem mode from longer repeated sessions", () => {
  const sessions: StudySession[] = [
    { id: "s1", subjectId: "stats", minutes: 50, createdAt: "2026-04-01T10:00:00.000Z" },
    { id: "s2", subjectId: "stats", minutes: 45, createdAt: "2026-04-02T10:00:00.000Z" },
    { id: "s3", subjectId: "stats", minutes: 60, createdAt: "2026-04-03T10:00:00.000Z" },
  ];

  assert.equal(deriveSessionBehaviorHint(sessions, "stats"), "problem");
});

test("deriveSessionBehaviorHint stays silent when session history is too thin", () => {
  const sessions: StudySession[] = [
    { id: "s1", subjectId: "law", minutes: 15, createdAt: "2026-04-01T10:00:00.000Z" },
    { id: "s2", subjectId: "law", minutes: 20, createdAt: "2026-04-02T10:00:00.000Z" },
  ];

  assert.equal(deriveSessionBehaviorHint(sessions, "law"), null);
});

test("deriveStudyMode uses session behavior as a weak fallback when title and resources are silent", () => {
  const subject = makeSubject("Research Studio", {
    practiceNeed: 2,
    contentLoad: 2,
  });

  assert.equal(deriveStudyMode(subject, [], "memorization"), "memorization");
});

// ─── Course code alias tests ──────────────────────────────────────────────────

test("course code alias MAN → interpretive overrides vague title", () => {
  const subject = makeSubject("Hizmet Kalitesi", { shortLabel: "MAN426" });
  assert.equal(deriveStudyMode(subject), "interpretive");
});

test("course code alias AIT → memorization even when title has no clear pattern", () => {
  // Generic title that doesn't match any pattern set — alias is the only signal
  const subject = makeSubject("Genel Akademik Çalışma", { shortLabel: "AIT101" });
  assert.equal(deriveStudyMode(subject), "memorization");
});

test("course code alias STA → problem (digits stripped correctly)", () => {
  // Neutral title on purpose: this test is about shortLabel parsing, not title matching.
  const subject = makeSubject("Akademik Modül", { shortLabel: "STA301" });
  assert.equal(deriveStudyMode(subject), "problem");
});

test("course code alias IST → problem via normalized İ→i diacritic stripping", () => {
  // Neutral title on purpose: this test is about dotted-I normalization in the code prefix.
  const subject = makeSubject("Temel Çalışma Atölyesi", { shortLabel: "İST203" });
  assert.equal(deriveStudyMode(subject), "problem");
});

test("course code alias PSI → interpretive", () => {
  const subject = makeSubject("Kişilik Psikolojisi", { shortLabel: "PSI310" });
  assert.equal(deriveStudyMode(subject), "interpretive");
});

test("alias takes priority over title pattern when both are present", () => {
  // "Muhasebe Tarihi" would match PROBLEM_PATTERNS (muhasebe) but alias AIT → memorization
  const subject = makeSubject("Muhasebe ve Vergi Tarihi", { shortLabel: "AIT102" });
  assert.equal(deriveStudyMode(subject), "memorization");
});

test("unknown code prefix falls through to title pattern matching", () => {
  // Prefix "xyz" not in alias table → falls through to title pattern
  const subject = makeSubject("Calculus III", { shortLabel: "XYZ201" });
  assert.equal(deriveStudyMode(subject), "problem");
});

test("no shortLabel falls through to title pattern matching", () => {
  const subject = makeSubject("Organik Kimya", { shortLabel: "" });
  assert.equal(deriveStudyMode(subject), "problem");
});

test("deriveSubjectDomain understands AIT as a history-family course", () => {
  const subject = makeSubject("Genel Akademik Çalışma", { shortLabel: "AIT204" });
  assert.equal(deriveSubjectDomain(subject), "history");
});

test("deriveSubjectDomain understands MAN as a business-family course", () => {
  const subject = makeSubject("Hizmet Kalitesi", { shortLabel: "MAN426" });
  assert.equal(deriveSubjectDomain(subject), "business");
});
