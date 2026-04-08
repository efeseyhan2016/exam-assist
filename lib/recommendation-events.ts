import { readRecommendationEvents, writeRecommendationEvents } from "@/lib/storage";
import { RecommendationEvent, StudyLaunchDraft } from "@/lib/types";

const MAX_RECOMMENDATION_EVENTS = 300;

type RecommendationEventInput = Pick<
  RecommendationEvent,
  "subjectId" | "source" | "recommendedMinutes" | "sourceLabel" | "topic"
>;

function persistRecommendationEvents(events: RecommendationEvent[]) {
  const next = [...events]
    .sort(
      (left, right) =>
        new Date(right.shownAt).getTime() - new Date(left.shownAt).getTime(),
    )
    .slice(0, MAX_RECOMMENDATION_EVENTS);

  writeRecommendationEvents(next);
}

export function buildRecommendationFingerprint(
  input: Pick<
    StudyLaunchDraft,
    "subjectId" | "source" | "minutes" | "topic" | "sourceLabel"
  >,
) {
  return [
    input.subjectId,
    input.source,
    String(input.minutes),
    input.topic ?? "",
    input.sourceLabel ?? "",
  ].join("::");
}

export function logRecommendationShown(
  input: RecommendationEventInput,
  now = new Date(),
): RecommendationEvent {
  const nextEvent: RecommendationEvent = {
    id: crypto.randomUUID(),
    subjectId: input.subjectId,
    source: input.source,
    sourceLabel: input.sourceLabel,
    topic: input.topic,
    recommendedMinutes: input.recommendedMinutes,
    shownAt: now.toISOString(),
  };

  persistRecommendationEvents([nextEvent, ...readRecommendationEvents()]);
  return nextEvent;
}

export function markRecommendationAccepted(
  recommendationId: string,
  now = new Date(),
): void {
  const events = readRecommendationEvents();
  const next = events.map((event) =>
    event.id === recommendationId && !event.acceptedAt
      ? { ...event, acceptedAt: now.toISOString() }
      : event,
  );

  persistRecommendationEvents(next);
}

export function markRecommendationConverted(
  recommendationId: string,
  sessionId: string,
  now = new Date(),
): void {
  const timestamp = now.toISOString();
  const events = readRecommendationEvents();
  const next = events.map((event) =>
    event.id === recommendationId
      ? {
          ...event,
          acceptedAt: event.acceptedAt ?? timestamp,
          convertedAt: timestamp,
          sessionId,
        }
      : event,
  );

  persistRecommendationEvents(next);
}
