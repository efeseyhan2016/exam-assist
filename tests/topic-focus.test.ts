import test from "node:test";
import assert from "node:assert/strict";

import {
  buildRecentTopicTrail,
  buildTopicCoverageState,
  getLatestTopicFocus,
  pickNextTopicFocus,
  summarizeTopicCoverage,
} from "@/lib/topic-focus";
import { ResourceItem, StudySession } from "@/lib/types";

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
