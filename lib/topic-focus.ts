import { StudySession, SubjectId } from "@/lib/types";

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
