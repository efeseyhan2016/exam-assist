import test from "node:test";
import assert from "node:assert/strict";

import {
  buildRecentTopicTrail,
  buildSubjectTopicGraph,
  buildTopicCoverageState,
  getLatestTopicFocus,
  pickNextTopicFocus,
  summarizeTopicCoverage,
} from "@/lib/topic-focus";
import { AcademicEvent, ResourceItem, StudySession } from "@/lib/types";

function makeSession(
  id: string,
  subjectId: string,
  createdAt: string,
  topic?: string,
  reflection?: StudySession["reflection"],
): StudySession {
  return {
    id,
    subjectId,
    minutes: 40,
    createdAt,
    topic,
    reflection,
  };
}

function makeResource(
  id: string,
  subjectId: string,
  topicHints: string[],
): ResourceItem {
  return {
    id,
    subjectId,
    title: `${topicHints[0]} Notları`,
    type: "pdf",
    pageCount: 18,
    pagesRead: 0,
    fileSizeBytes: 1024,
    uploadedAt: "2026-04-06T08:00:00.000Z",
    topicHints,
  };
}

function makeAcademicEvent(
  id: string,
  overrides: Partial<AcademicEvent> = {},
): AcademicEvent {
  return {
    id,
    courseId: "ait",
    type: "material_update",
    title: "Lozan Ders Notu eklendi",
    occurredAt: "2026-04-06T08:00:00.000Z",
    source: "file_import",
    provenance: "student_entered",
    significance: "medium",
    planningImpact: "soft",
    status: "active",
    metadata: {
      subjectId: "ait",
      topicHint: "Lozan",
    },
    ...overrides,
  };
}

test("buildRecentTopicTrail keeps the most recent unique topics for a subject", () => {
  const trail = buildRecentTopicTrail([
    makeSession("s1", "ait", "2026-04-06T10:00:00.000Z", "Lozan"),
    makeSession("s2", "ait", "2026-04-06T12:00:00.000Z", "İnönü Dönemi"),
    makeSession("s3", "ait", "2026-04-06T13:00:00.000Z", "Lozan"),
    makeSession("s4", "econ", "2026-04-06T14:00:00.000Z", "Talep"),
  ], "ait");

  assert.deepEqual(trail, ["Lozan", "İnönü Dönemi"]);
});

test("getLatestTopicFocus returns the most recent topic when one exists", () => {
  const topic = getLatestTopicFocus([
    makeSession("s1", "ait", "2026-04-06T10:00:00.000Z", "Lozan"),
    makeSession("s2", "ait", "2026-04-06T12:00:00.000Z", "Demokrat Parti"),
  ], "ait");

  assert.equal(topic, "Demokrat Parti");
});

test("topic coverage marks untouched topics as open and stuck topics as weak", () => {
  const coverage = buildTopicCoverageState({
    subjectId: "ait",
    resources: [
      makeResource("r1", "ait", ["Lozan", "İnönü Dönemi", "Demokrat Parti"]),
    ],
    sessions: [
      makeSession("s1", "ait", "2026-04-06T10:00:00.000Z", "Lozan", "stuck"),
      makeSession("s2", "ait", "2026-04-06T12:00:00.000Z", "İnönü Dönemi", "good"),
      makeSession("s3", "ait", "2026-04-07T12:00:00.000Z", "İnönü Dönemi", "good"),
    ],
  });

  assert.deepEqual(
    coverage.map((entry) => [entry.topic, entry.status]),
    [
      ["Lozan", "weak"],
      ["Demokrat Parti", "open"],
      ["İnönü Dönemi", "covered"],
    ],
  );
});

test("next topic focus prefers weak topics over untouched topics", () => {
  const coverage = buildTopicCoverageState({
    subjectId: "ait",
    resources: [makeResource("r1", "ait", ["Lozan", "Demokrat Parti"])],
    sessions: [
      makeSession("s1", "ait", "2026-04-06T10:00:00.000Z", "Lozan", "stuck"),
    ],
  });

  assert.equal(pickNextTopicFocus(coverage), "Lozan");
  assert.deepEqual(summarizeTopicCoverage(coverage), {
    nextTopic: "Lozan",
    weakTopics: ["Lozan"],
    openTopics: ["Demokrat Parti"],
    repeatedTopics: [],
    coveredCount: 0,
  });
});

test("subject topic graph links topics that appear together inside the same resource", () => {
  const graph = buildSubjectTopicGraph({
    subjectId: "ait",
    resources: [
      makeResource("r1", "ait", ["Lozan", "İnönü Dönemi", "Demokrat Parti"]),
    ],
    sessions: [
      makeSession("s1", "ait", "2026-04-06T10:00:00.000Z", "Lozan", "stuck"),
    ],
  });

  const lozan = graph.nodes.find((node) => node.topic === "Lozan");
  assert.ok(lozan);
  assert.deepEqual(lozan?.resourceIds, ["r1"]);
  assert.deepEqual(lozan?.sessionIds, ["s1"]);
  assert.ok(lozan?.relatedTopics.includes("İnönü Dönemi"));
  assert.ok(lozan?.relatedTopics.includes("Demokrat Parti"));
});

test("topic graph merges topic keys conservatively while preserving a readable label", () => {
  const graph = buildSubjectTopicGraph({
    subjectId: "ait",
    resources: [
      makeResource("r1", "ait", ["Lozan Barış Konferansı"]),
      makeResource("r2", "ait", ["Lozan  Barış  Konferansı"]),
    ],
    sessions: [],
  });

  assert.equal(graph.nodes.length, 1);
  assert.equal(graph.nodes[0]?.topic, "Lozan Barış Konferansı");
  assert.equal(graph.nodes[0]?.resourceCount, 2);
});

// ─── Temporal co-occurrence tests ────────────────────────────────────────────

test("temporal co-occurrence links topics studied within 3 days of each other", () => {
  const graph = buildSubjectTopicGraph({
    subjectId: "ait",
    resources: [],
    sessions: [
      makeSession("s1", "ait", "2026-04-06T10:00:00.000Z", "Lozan"),
      makeSession("s2", "ait", "2026-04-07T10:00:00.000Z", "İnönü Dönemi"),
    ],
  });

  const lozan = graph.nodes.find((n) => n.topic === "Lozan");
  const inonu = graph.nodes.find((n) => n.topic === "İnönü Dönemi");
  assert.ok(lozan?.relatedTopics.includes("İnönü Dönemi"), "Lozan should link to İnönü Dönemi");
  assert.ok(inonu?.relatedTopics.includes("Lozan"), "İnönü Dönemi should link back to Lozan");
});

test("temporal co-occurrence does not link topics studied more than 3 days apart", () => {
  const graph = buildSubjectTopicGraph({
    subjectId: "ait",
    resources: [],
    sessions: [
      makeSession("s1", "ait", "2026-04-06T10:00:00.000Z", "Lozan"),
      makeSession("s2", "ait", "2026-04-10T10:00:00.000Z", "İnönü Dönemi"), // 4 days apart
    ],
  });

  const lozan = graph.nodes.find((n) => n.topic === "Lozan");
  const inonu = graph.nodes.find((n) => n.topic === "İnönü Dönemi");
  assert.ok(!lozan?.relatedTopics.includes("İnönü Dönemi"), "Lozan should NOT link to İnönü Dönemi");
  assert.ok(!inonu?.relatedTopics.includes("Lozan"), "İnönü Dönemi should NOT link back to Lozan");
});

test("temporal co-occurrence does not create self-edges when the same topic is studied twice", () => {
  const graph = buildSubjectTopicGraph({
    subjectId: "ait",
    resources: [],
    sessions: [
      makeSession("s1", "ait", "2026-04-06T10:00:00.000Z", "Lozan"),
      makeSession("s2", "ait", "2026-04-07T10:00:00.000Z", "Lozan"),
    ],
  });

  const lozan = graph.nodes.find((n) => n.topic === "Lozan");
  assert.ok(lozan, "Lozan node exists");
  assert.equal(lozan?.sessionCount, 2, "two sessions counted");
  assert.deepEqual(lozan?.relatedTopics, [], "no self-edge");
});

test("temporal co-occurrence does not link topics across different subjects", () => {
  const graph = buildSubjectTopicGraph({
    subjectId: "ait",
    resources: [],
    sessions: [
      makeSession("s1", "ait",  "2026-04-06T10:00:00.000Z", "Lozan"),
      makeSession("s2", "econ", "2026-04-06T12:00:00.000Z", "Talep"),
    ],
  });

  const lozan = graph.nodes.find((n) => n.topic === "Lozan");
  assert.ok(lozan, "Lozan node exists");
  assert.deepEqual(lozan?.relatedTopics, [], "no cross-subject link");
});

test("temporal co-occurrence chains correctly: A-B linked, B-C linked, but A-C only if within window", () => {
  // s1 (A) at day 0, s2 (B) at day 2, s3 (C) at day 4 of s1 (day 2 of s2)
  // A↔B: 2 days apart → linked
  // B↔C: 2 days apart → linked
  // A↔C: 4 days apart → NOT linked
  const graph = buildSubjectTopicGraph({
    subjectId: "ait",
    resources: [],
    sessions: [
      makeSession("s1", "ait", "2026-04-06T10:00:00.000Z", "Lozan"),
      makeSession("s2", "ait", "2026-04-08T10:00:00.000Z", "İnönü Dönemi"),
      makeSession("s3", "ait", "2026-04-10T10:00:00.000Z", "Demokrat Parti"),
    ],
  });

  const lozan  = graph.nodes.find((n) => n.topic === "Lozan");
  const inonu  = graph.nodes.find((n) => n.topic === "İnönü Dönemi");
  const dp     = graph.nodes.find((n) => n.topic === "Demokrat Parti");

  assert.ok(lozan?.relatedTopics.includes("İnönü Dönemi"),      "Lozan ↔ İnönü Dönemi (2 days)");
  assert.ok(inonu?.relatedTopics.includes("Lozan"),             "İnönü Dönemi ↔ Lozan (2 days)");
  assert.ok(inonu?.relatedTopics.includes("Demokrat Parti"),    "İnönü Dönemi ↔ Demokrat Parti (2 days)");
  assert.ok(dp?.relatedTopics.includes("İnönü Dönemi"),         "Demokrat Parti ↔ İnönü Dönemi (2 days)");
  assert.ok(!lozan?.relatedTopics.includes("Demokrat Parti"),   "Lozan ✗ Demokrat Parti (4 days)");
  assert.ok(!dp?.relatedTopics.includes("Lozan"),               "Demokrat Parti ✗ Lozan (4 days)");
});

test("temporal co-occurrence and resource co-occurrence both contribute to relatedTopics without conflict", () => {
  // Lozan and İnönü Dönemi appear in the same resource (resource edge)
  // AND are studied within 1 day of each other (temporal edge)
  // The Set should contain both, deduplicated to one entry
  const graph = buildSubjectTopicGraph({
    subjectId: "ait",
    resources: [
      makeResource("r1", "ait", ["Lozan", "İnönü Dönemi"]),
    ],
    sessions: [
      makeSession("s1", "ait", "2026-04-06T10:00:00.000Z", "Lozan"),
      makeSession("s2", "ait", "2026-04-06T14:00:00.000Z", "İnönü Dönemi"),
    ],
  });

  const lozan = graph.nodes.find((n) => n.topic === "Lozan");
  assert.ok(lozan?.relatedTopics.includes("İnönü Dönemi"));
  // Should appear exactly once (Set semantics → deduplicated in array conversion)
  const count = lozan?.relatedTopics.filter((t) => t === "İnönü Dönemi").length ?? 0;
  assert.equal(count, 1, "İnönü Dönemi appears exactly once in relatedTopics");
});

test("exactly 3 days apart is within the co-occurrence window", () => {
  const graph = buildSubjectTopicGraph({
    subjectId: "ait",
    resources: [],
    sessions: [
      makeSession("s1", "ait", "2026-04-06T00:00:00.000Z", "Lozan"),
      makeSession("s2", "ait", "2026-04-09T00:00:00.000Z", "İnönü Dönemi"), // exactly 3.0 days
    ],
  });

  const lozan = graph.nodes.find((n) => n.topic === "Lozan");
  assert.ok(lozan?.relatedTopics.includes("İnönü Dönemi"), "exactly 3 days is within window");
});

test("topic graph can create a topic node from active academic event hints", () => {
  const graph = buildSubjectTopicGraph({
    subjectId: "ait",
    resources: [],
    sessions: [],
    academicEvents: [
      makeAcademicEvent("event-1", {
        title: "Lozan okuma paketi eklendi",
        metadata: {
          subjectId: "ait",
          topicHint: "Lozan Barış Konferansı",
        },
      }),
    ],
    now: new Date("2026-04-06T10:00:00.000Z"),
  });

  assert.equal(graph.nodes.length, 1);
  assert.equal(graph.nodes[0]?.topic, "Lozan Barış Konferansı");
  assert.equal(graph.nodes[0]?.activeEventCount, 1);
  assert.deepEqual(graph.nodes[0]?.academicEventIds, ["event-1"]);
});
