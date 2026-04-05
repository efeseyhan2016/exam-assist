import test from "node:test";
import assert from "node:assert/strict";

import { buildRecentTopicTrail, getLatestTopicFocus } from "@/lib/topic-focus";
import { StudySession } from "@/lib/types";

function makeSession(
  id: string,
  subjectId: string,
  createdAt: string,
  topic?: string,
): StudySession {
  return {
    id,
    subjectId,
    minutes: 40,
    createdAt,
    topic,
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
