import test from "node:test";
import assert from "node:assert/strict";

import {
  getResourceGuidance,
  pickPrimaryResourceGuidance,
} from "@/lib/resource-intelligence";
import { getStudyIntelligence } from "@/lib/subject-intelligence";
import { ResourceItem } from "@/lib/types";

function makeResource(
  id: string,
  title: string,
  overrides: Partial<ResourceItem> = {},
): ResourceItem {
  return {
    id,
    subjectId: "economics",
    title,
    type: "pdf",
    pageCount: 40,
    pagesRead: 0,
    fileSizeBytes: 1024 * 500,
    uploadedAt: "2026-04-05T12:00:00.000Z",
    contentHint: "unknown",
    ...overrides,
  };
}

test("practice mode treats question-style resources as the strongest first move", () => {
  const intelligence = getStudyIntelligence("practice");
  const guidance = getResourceGuidance(
    makeResource("r1", "Çıkmış Sorular", { contentHint: "formula-heavy" }),
    intelligence,
    36,
  );

  assert.equal(guidance.badge, "Pratik hattına uygun");
  assert.equal(guidance.actionLabel, "Pratik hattını aç");
});

test("reading mode highlights summary-style resources when the exam is close", () => {
  const intelligence = getStudyIntelligence("reading");
  const guidance = getResourceGuidance(
    makeResource("r1", "Final Özeti", { contentHint: "prose-heavy" }),
    intelligence,
    18,
  );

  assert.equal(guidance.badge, "Tekrar için uygun");
  assert.equal(guidance.actionLabel, "Özet üstünden toparla");
});

test("mixed mode prefers a summary before a question bank as the first source", () => {
  const intelligence = getStudyIntelligence("mixed");
  const summary = makeResource("summary", "Hafta 6 Özet", {
    contentHint: "mixed",
    pagesRead: 4,
  });
  const questions = makeResource("questions", "Quiz Soruları", {
    contentHint: "formula-heavy",
    pagesRead: 0,
  });

  const primary = pickPrimaryResourceGuidance(
    [questions, summary],
    intelligence,
    72,
  );

  assert.ok(primary);
  assert.equal(primary?.resource.id, "summary");
});

test("partially progressed reading resources stay attractive over already finished ones", () => {
  const intelligence = getStudyIntelligence("reading");
  const finished = makeResource("done", "Ders Notu 1", {
    contentHint: "prose-heavy",
    pagesRead: 40,
  });
  const inFlight = makeResource("active", "Ders Notu 2", {
    contentHint: "prose-heavy",
    pagesRead: 12,
  });

  const primary = pickPrimaryResourceGuidance(
    [finished, inFlight],
    intelligence,
    120,
  );

  assert.ok(primary);
  assert.equal(primary?.resource.id, "active");
});
