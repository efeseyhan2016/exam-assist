import { AcademicEvent, ResourceItem, StudySession, SubjectId } from "@/lib/types";
import { getActiveAcademicEvents } from "@/lib/academic-events";

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

export interface SubjectTopicNode extends TopicCoverageEntry {
  surfaceCount: number;
  activeEventCount: number;
  latestEventAt?: string;
  relatedTopics: string[];
  resourceIds: string[];
  sessionIds: string[];
  academicEventIds: string[];
}

export interface SubjectTopicGraph {
  subjectId: SubjectId;
  nodes: SubjectTopicNode[];
}

const TOPIC_STATUS_PRIORITY: Record<TopicCoverageStatus, number> = {
  weak: 0,
  open: 1,
  repeated: 2,
  seen: 3,
  covered: 4,
};

function normalizeTopic(topic: string) {
  return topic
    .toLocaleLowerCase("tr-TR")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
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
  academicEvents?: AcademicEvent[];
  now?: Date;
  limit?: number;
}) {
  return buildSubjectTopicGraph(input)
    .nodes.map<TopicCoverageEntry>((entry) => ({
      topic: entry.topic,
      status: entry.status,
      sessionCount: entry.sessionCount,
      resourceCount: entry.resourceCount,
      goodCount: entry.goodCount,
      stuckCount: entry.stuckCount,
      lastWorkedAt: entry.lastWorkedAt,
    }))
    .slice(0, input.limit ?? 6);
}

export function buildSubjectTopicGraph(input: {
  subjectId: SubjectId;
  sessions: StudySession[];
  resources: ResourceItem[];
  academicEvents?: AcademicEvent[];
  now?: Date;
  limit?: number;
}): SubjectTopicGraph {
  const now = input.now ?? new Date();
  const scored = new Map<
    string,
    {
      key: string;
      topic: string;
      sessionCount: number;
      resourceCount: number;
      goodCount: number;
      surfaceCount: number;
      stuckCount: number;
      lastWorkedAt?: string;
      latestReflection?: StudySession["reflection"];
      activeEventCount: number;
      latestEventAt?: string;
      relatedTopics: Set<string>;
      resourceIds: Set<string>;
      sessionIds: Set<string>;
      academicEventIds: Set<string>;
    }
  >();

  for (const resource of input.resources) {
    if (resource.subjectId !== input.subjectId) continue;

    const resourceTopics = (resource.topicHints ?? [])
      .map((rawTopic) => rawTopic.trim())
      .filter(Boolean);
    const normalizedResourceTopics = resourceTopics.map((topic) => normalizeTopic(topic));

    for (let index = 0; index < resourceTopics.length; index += 1) {
      const topic = resourceTopics[index];
      const topicKey = normalizedResourceTopics[index];
      if (!topicKey) continue;

      const current = scored.get(topicKey) ?? {
        key: topicKey,
        topic,
        sessionCount: 0,
        resourceCount: 0,
        goodCount: 0,
        surfaceCount: 0,
        stuckCount: 0,
        activeEventCount: 0,
        relatedTopics: new Set<string>(),
        resourceIds: new Set<string>(),
        sessionIds: new Set<string>(),
        academicEventIds: new Set<string>(),
      };

      current.resourceCount += 1;
      current.resourceIds.add(resource.id);
      for (let siblingIndex = 0; siblingIndex < resourceTopics.length; siblingIndex += 1) {
        if (siblingIndex === index) continue;
        const sibling = resourceTopics[siblingIndex];
        if (sibling.trim()) current.relatedTopics.add(sibling.trim());
      }
      scored.set(topicKey, current);
    }
  }

  for (const session of input.sessions) {
    if (session.subjectId !== input.subjectId || !session.topic?.trim()) continue;

    const topic = session.topic.trim();
    const topicKey = normalizeTopic(topic);
    const current = scored.get(topicKey) ?? {
      key: topicKey,
      topic,
      sessionCount: 0,
      resourceCount: 0,
      goodCount: 0,
      surfaceCount: 0,
      stuckCount: 0,
      activeEventCount: 0,
      relatedTopics: new Set<string>(),
      resourceIds: new Set<string>(),
      sessionIds: new Set<string>(),
      academicEventIds: new Set<string>(),
    };

    current.sessionCount += 1;
    current.sessionIds.add(session.id);
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

    scored.set(topicKey, current);
  }

  for (const event of getActiveAcademicEvents(input.academicEvents ?? [], now)) {
    const directSubjectId = event.metadata?.subjectId;
    if (typeof directSubjectId === "string" && directSubjectId !== input.subjectId) {
      continue;
    }
    if (
      directSubjectId === undefined &&
      typeof event.courseId === "string" &&
      event.courseId !== input.subjectId
    ) {
      continue;
    }

    const topicHints = extractAcademicEventTopicHints(event);
    for (const rawTopic of topicHints) {
      const topic = rawTopic.trim();
      const topicKey = normalizeTopic(topic);
      if (!topicKey) continue;

      const current = scored.get(topicKey) ?? {
        key: topicKey,
        topic,
        sessionCount: 0,
        resourceCount: 0,
        goodCount: 0,
        surfaceCount: 0,
        stuckCount: 0,
        activeEventCount: 0,
        relatedTopics: new Set<string>(),
        resourceIds: new Set<string>(),
        sessionIds: new Set<string>(),
        academicEventIds: new Set<string>(),
      };

      current.activeEventCount += 1;
      current.latestEventAt =
        !current.latestEventAt ||
        Date.parse(event.occurredAt) > Date.parse(current.latestEventAt)
          ? event.occurredAt
          : current.latestEventAt;
      current.academicEventIds.add(event.id);
      scored.set(topicKey, current);
    }
  }

  const nodes = [...scored.values()]
    .map<SubjectTopicNode>((entry) => ({
      topic: entry.topic,
      status: inferTopicCoverageStatus(entry),
      sessionCount: entry.sessionCount,
      resourceCount: entry.resourceCount,
      goodCount: entry.goodCount,
      surfaceCount: entry.surfaceCount,
      stuckCount: entry.stuckCount,
      lastWorkedAt: entry.lastWorkedAt,
      activeEventCount: entry.activeEventCount,
      latestEventAt: entry.latestEventAt,
      relatedTopics: [...entry.relatedTopics],
      resourceIds: [...entry.resourceIds],
      sessionIds: [...entry.sessionIds],
      academicEventIds: [...entry.academicEventIds],
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

      if (right.activeEventCount !== left.activeEventCount) {
        return right.activeEventCount - left.activeEventCount;
      }

      return right.sessionCount - left.sessionCount;
    })
    .slice(0, input.limit ?? 6);

  return {
    subjectId: input.subjectId,
    nodes,
  };
}

function extractAcademicEventTopicHints(event: AcademicEvent) {
  const directTopicHint = event.metadata?.topicHint;
  if (typeof directTopicHint === "string" && directTopicHint.trim()) {
    return [directTopicHint.trim()];
  }

  if (event.type === "material_update") {
    const cleaned = event.title.replace(/\seklendi$/i, "").trim();
    return cleaned ? [cleaned] : [];
  }

  return [];
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
