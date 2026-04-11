import test from "node:test";
import assert from "node:assert/strict";

import {
  buildResourceUploadInsight,
  buildTaskContentSignal,
  buildSubjectTopicMap,
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

test("problem mode treats question-style resources as the strongest first move", () => {
  const intelligence = getStudyIntelligence("problem");
  const guidance = getResourceGuidance(
    makeResource("r1", "Çıkmış Sorular", { contentHint: "formula-heavy" }),
    intelligence,
    36,
  );

  assert.equal(guidance.badge, "Pratik için güçlü");
  assert.equal(guidance.actionLabel, "Sorularla başla");
});

test("memorization mode highlights summary-style resources when the exam is close", () => {
  const intelligence = getStudyIntelligence("memorization");
  const guidance = getResourceGuidance(
    makeResource("r1", "Final Özeti", { contentHint: "prose-heavy" }),
    intelligence,
    18,
  );

  assert.equal(guidance.badge, "Tekrar için uygun");
  assert.equal(guidance.actionLabel, "Kısa tekrar yap");
});

test("problem mode shifts into review phrasing on the final day", () => {
  const intelligence = getStudyIntelligence("problem");
  const guidance = getResourceGuidance(
    makeResource("r1", "Çıkmış Sorular", { contentHint: "formula-heavy" }),
    intelligence,
    12,
  );

  assert.equal(guidance.actionLabel, "Çıkmış sorularla toparla");
  assert.match(guidance.summary, /kısa ve yoğun bir problem review/i);
});

test("completed exams turn resource guidance into a reference state", () => {
  const intelligence = getStudyIntelligence("memorization");
  const guidance = getResourceGuidance(
    makeResource("r1", "Final Özeti", { contentHint: "prose-heavy" }),
    intelligence,
    -1,
  );

  assert.equal(guidance.badge, "Sınav bitti");
  assert.equal(guidance.actionLabel, "Sonuç sonrası referans");
  assert.match(guidance.summary, /yeni çalışma önerisi değil/i);
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

test("partially progressed conceptual resources stay attractive over already finished ones", () => {
  const intelligence = getStudyIntelligence("conceptual");
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

test("interpretive mode prefers notes and summaries over direct question banks", () => {
  const intelligence = getStudyIntelligence("interpretive");
  const notes = makeResource("notes", "Ders Notları", {
    contentHint: "prose-heavy",
    pagesRead: 8,
  });
  const questions = makeResource("questions", "Quiz Soruları", {
    contentHint: "formula-heavy",
    pagesRead: 0,
  });

  const primary = pickPrimaryResourceGuidance([questions, notes], intelligence, 96);

  assert.ok(primary);
  assert.equal(primary?.resource.id, "notes");
});

test("recently revisited resources get a soft boost when the study fit is otherwise equal", () => {
  const intelligence = getStudyIntelligence("conceptual");
  const untouched = makeResource("fresh", "Hafta 6 Özet", {
    contentHint: "prose-heavy",
    pagesRead: 10,
  });
  const revisited = makeResource("revisited", "Hafta 7 Özet", {
    contentHint: "prose-heavy",
    pagesRead: 10,
    engagementCount: 2,
    revisitCount: 1,
    lastActiveAt: "2026-04-05T09:00:00.000Z",
  });

  const primary = pickPrimaryResourceGuidance(
    [untouched, revisited],
    intelligence,
    96,
    new Date("2026-04-05T12:00:00.000Z"),
  );

  assert.ok(primary);
  assert.equal(primary?.resource.id, "revisited");
});

test("engagement language stays calm when the source is already in active rotation", () => {
  const intelligence = getStudyIntelligence("mixed");
  const guidance = getResourceGuidance(
    makeResource("r1", "Kısa Özet", {
      contentHint: "mixed",
      engagementCount: 1,
      lastActiveAt: "2026-04-05T08:00:00.000Z",
    }),
    intelligence,
    72,
    new Date("2026-04-05T10:00:00.000Z"),
  );

  assert.match(guidance.summary, /yeniden açmak daha kolay olabilir/i);
});

test("memorization-heavy topic PDFs are treated like topic notes instead of generic prose", () => {
  const intelligence = getStudyIntelligence("memorization");
  const guidance = getResourceGuidance(
    makeResource("r1", "Atatürk Dönemi İç Politika", {
      contentHint: "prose-heavy",
      pageCount: 12,
    }),
    intelligence,
    72,
  );

  assert.equal(guidance.badge, "Konu notu için uygun");
  assert.equal(guidance.actionLabel, "Konuyu sıraya koy");
});

test("topic-note style AIT sources outrank generic slides in memorization mode", () => {
  const intelligence = getStudyIntelligence("memorization");
  const topicNotes = makeResource("topic", "Lozan Barış Konferansı ve Barış Antlaşması", {
    contentHint: "prose-heavy",
    pageCount: 10,
  });
  const slides = makeResource("slides", "Hafta 5 Slayt", {
    contentHint: "prose-heavy",
    pageCount: 18,
  });

  const primary = pickPrimaryResourceGuidance([slides, topicNotes], intelligence, 96);

  assert.ok(primary);
  assert.equal(primary?.resource.id, "topic");
});

test("upload insight explains what changed after a new source is added", () => {
  const intelligence = getStudyIntelligence("memorization");
  const insight = buildResourceUploadInsight({
    subjectTitle: "AIT204",
    resource: makeResource("topic", "Lozan Barış Konferansı", {
      contentHint: "prose-heavy",
      topicHints: ["Lozan Barış Konferansı", "Barış Antlaşması"],
      pageCount: 10,
    }),
    existingResources: [],
    intelligence,
    hoursUntilExam: 36,
  });

  assert.match(insight.headline, /AIT204/i);
  assert.match(insight.body, /Lozan Barış Konferansı/i);
  assert.match(insight.body, /ilk mantıklı adım/i);
});

test("subject topic map lifts repeated topic hints above one-off labels", () => {
  const topics = buildSubjectTopicMap([
    makeResource("r1", "Lozan Barış Konferansı", {
      topicHints: ["Lozan Barış Konferansı", "Barış Antlaşması"],
      pagesRead: 10,
      pageCount: 12,
      engagementCount: 2,
    }),
    makeResource("r2", "Lozan Ders Notu", {
      topicHints: ["Lozan Barış Konferansı", "Türk Dış Politikası"],
      pagesRead: 5,
      pageCount: 10,
      engagementCount: 1,
    }),
  ]);

  assert.equal(topics[0], "Lozan Barış Konferansı");
  assert.ok(topics.includes("Barış Antlaşması"));
});

test("task content signal recognizes project-ready source bundles", () => {
  const signal = buildTaskContentSignal({
    taskKind: "project",
    resources: [
      makeResource("outline", "Course Outline"),
      makeResource("brief", "Project Brief"),
      makeResource("case", "Retail Marketing Case Study"),
    ],
  });

  assert.equal(signal.status, "ready");
  assert.match(signal.body, /outline/i);
  assert.match(signal.body, /brief/i);
});

test("task content signal asks for stronger source types when only generic notes exist", () => {
  const signal = buildTaskContentSignal({
    taskKind: "assignment",
    resources: [
      makeResource("notes", "Ders Notları", {
        contentHint: "prose-heavy",
      }),
    ],
  });

  assert.equal(signal.status, "partial");
  assert.match(signal.body, /brief ya da outline/i);
});

test("content-derived resource kind hints override weak titles", () => {
  const signal = buildTaskContentSignal({
    taskKind: "assignment",
    resources: [
      makeResource("r-weak", "document1", {
        resourceKindHint: "brief",
      }),
    ],
  });

  assert.equal(signal.status, "ready");
  assert.match(signal.body, /brief/i);
});
