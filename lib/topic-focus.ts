import { ResourceItem, StudySession, SubjectId } from "@/lib/types";

export type TopicCoverageStatus =
  | "open"
  | "seen"
  | "repeated"
  | "weak"
  | "covered";

export interface TopicCoverageEntry {
  topic: string;
  status: TopicCoverageStatus;
  sessionCount: number;
  resourceCount: number;
  goodCount: number;
  stuckCount: number;
  lastWorkedAt?: string;
}

const TOPIC_STATUS_PRIORITY: Record<TopicCoverageStatus, number> = {
  weak: 0,
  open: 1,
  repeated: 2,
  seen: 3,
  covered: 4,
};

function normalizeTopic(topic: string) {
  return topic.trim();
}

function inferTopicCoverageStatus(input: {
  sessionCount: number;
  goodCount: number;
  surfaceCount: number;
  stuckCount: number;
  latestReflection?: StudySession["reflection"];
}): TopicCoverageStatus {
  if (input.sessionCount === 0) {
    return "open";
  }

  if (
    input.latestReflection === "stuck" ||
    (input.stuckCount >= 1 && input.goodCount === 0)
  ) {
    return "weak";
  }

  if (
    input.sessionCount >= 3 ||
    (input.sessionCount >= 2 &&
      input.goodCount >= 1 &&
      input.latestReflection !== "surface")
  ) {
    return "covered";
  }

  if (input.sessionCount >= 2 || input.surfaceCount >= 1) {
    return "repeated";
  }

  return "seen";
}

export function buildRecentTopicTrail(
  sessions: StudySession[],
  subjectId: SubjectId,
  limit = 3,
) {
  const recentTopics = sessions
    .filter((session) => session.subjectId === subjectId && session.topic)
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
    .map((session) => session.topic?.trim())
    .filter((topic): topic is string => Boolean(topic));

  return [...new Set(recentTopics)].slice(0, limit);
}

export function getLatestTopicFocus(
  sessions: StudySession[],
  subjectId: SubjectId,
) {
  return buildRecentTopicTrail(sessions, subjectId, 1)[0] ?? null;
}

export function buildTopicCoverageState(input: {
  subjectId: SubjectId;
  sessions: StudySession[];
  resources: ResourceItem[];
  limit?: number;
}) {
  const scored = new Map<
    string,
    {
      topic: string;
      sessionCount: number;
      resourceCount: number;
      goodCount: number;
      surfaceCount: number;
      stuckCount: number;
      lastWorkedAt?: string;
      latestReflection?: StudySession["reflection"];
    }
  >();

  for (const resource of input.resources) {
    if (resource.subjectId !== input.subjectId) continue;

    for (const rawTopic of resource.topicHints ?? []) {
      const topic = normalizeTopic(rawTopic);
      if (!topic) continue;

      const current = scored.get(topic) ?? {
        topic,
        sessionCount: 0,
        resourceCount: 0,
        goodCount: 0,
        surfaceCount: 0,
        stuckCount: 0,
      };

      current.resourceCount += 1;
      scored.set(topic, current);
    }
  }

  for (const session of input.sessions) {
    if (session.subjectId !== input.subjectId || !session.topic?.trim()) continue;

    const topic = normalizeTopic(session.topic);
    const current = scored.get(topic) ?? {
      topic,
      sessionCount: 0,
      resourceCount: 0,
      goodCount: 0,
      surfaceCount: 0,
      stuckCount: 0,
    };

    current.sessionCount += 1;
    current.lastWorkedAt =
      !current.lastWorkedAt ||
      Date.parse(session.createdAt) > Date.parse(current.lastWorkedAt)
        ? session.createdAt
        : current.lastWorkedAt;
    current.latestReflection =
      !current.lastWorkedAt || current.lastWorkedAt === session.createdAt
        ? session.reflection
        : current.latestReflection;

    if (session.reflection === "good") current.goodCount += 1;
    if (session.reflection === "surface") current.surfaceCount += 1;
    if (session.reflection === "stuck") current.stuckCount += 1;

    scored.set(topic, current);
  }

  return [...scored.values()]
    .map<TopicCoverageEntry>((entry) => ({
      topic: entry.topic,
      status: inferTopicCoverageStatus(entry),
      sessionCount: entry.sessionCount,
      resourceCount: entry.resourceCount,
      goodCount: entry.goodCount,
      stuckCount: entry.stuckCount,
      lastWorkedAt: entry.lastWorkedAt,
    }))
    .sort((left, right) => {
      const priorityDelta =
        TOPIC_STATUS_PRIORITY[left.status] - TOPIC_STATUS_PRIORITY[right.status];
      if (priorityDelta !== 0) {
        return priorityDelta;
      }

      const leftWorkedAt = left.lastWorkedAt ? Date.parse(left.lastWorkedAt) : 0;
      const rightWorkedAt = right.lastWorkedAt ? Date.parse(right.lastWorkedAt) : 0;
      if (rightWorkedAt !== leftWorkedAt) {
        return rightWorkedAt - leftWorkedAt;
      }

      if (right.resourceCount !== left.resourceCount) {
        return right.resourceCount - left.resourceCount;
      }

      return right.sessionCount - left.sessionCount;
    })
    .slice(0, input.limit ?? 6);
}

export function pickNextTopicFocus(coverage: TopicCoverageEntry[]) {
  return (
    coverage.find((entry) => entry.status === "weak")?.topic ??
    coverage.find((entry) => entry.status === "open")?.topic ??
    coverage.find((entry) => entry.status === "seen")?.topic ??
    coverage.find((entry) => entry.status === "repeated")?.topic ??
    coverage[0]?.topic ??
    null
  );
}

export function summarizeTopicCoverage(coverage: TopicCoverageEntry[]) {
  return {
    nextTopic: pickNextTopicFocus(coverage),
    weakTopics: coverage.filter((entry) => entry.status === "weak").map((entry) => entry.topic),
    openTopics: coverage.filter((entry) => entry.status === "open").map((entry) => entry.topic),
    repeatedTopics: coverage
      .filter((entry) => entry.status === "repeated")
      .map((entry) => entry.topic),
    coveredCount: coverage.filter((entry) => entry.status === "covered").length,
  };
}
