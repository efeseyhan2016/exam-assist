import { readRecommendationEvents, writeRecommendationEvents } from "@/lib/storage";
import { RecommendationEvent, StudyLaunchDraft, StudySession, StudySessionReflection, SubjectId } from "@/lib/types";

const MAX_RECOMMENDATION_EVENTS = 300;
const FEEDBACK_WINDOW_DAYS = 21;
const PENDING_WINDOW_HOURS = 72;

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

export interface RecommendationFeedbackProfile {
  subjectId: SubjectId;
  signal: "neutral" | "pending" | "friction" | "positive";
  focusBoost: number;
  blockMinutesAdjustment: number;
  pendingIntentCount: number;
  stuckConversions: number;
  surfaceConversions: number;
  goodConversions: number;
  focusReason: string | null;
  guidanceReason: string | null;
}

function countReflection(
  sessionsById: Map<string, StudySession>,
  events: RecommendationEvent[],
  reflection: StudySessionReflection,
) {
  return events.filter((event) => {
    if (!event.sessionId) return false;
    return sessionsById.get(event.sessionId)?.reflection === reflection;
  }).length;
}

export function buildRecommendationFeedbackProfile(input: {
  subjectId: SubjectId;
  events?: RecommendationEvent[];
  sessions: StudySession[];
  now?: Date;
}): RecommendationFeedbackProfile {
  const now = input.now ?? new Date();
  const feedbackWindowStart = now.getTime() - FEEDBACK_WINDOW_DAYS * 86_400_000;
  const pendingWindowStart = now.getTime() - PENDING_WINDOW_HOURS * 3_600_000;
  const sessionsById = new Map(input.sessions.map((session) => [session.id, session]));

  const subjectEvents = (input.events ?? readRecommendationEvents())
    .filter((event) => event.subjectId === input.subjectId)
    .filter((event) => Date.parse(event.shownAt) >= feedbackWindowStart)
    .slice(0, 8);

  if (subjectEvents.length === 0) {
    return {
      subjectId: input.subjectId,
      signal: "neutral",
      focusBoost: 0,
      blockMinutesAdjustment: 0,
      pendingIntentCount: 0,
      stuckConversions: 0,
      surfaceConversions: 0,
      goodConversions: 0,
      focusReason: null,
      guidanceReason: null,
    };
  }

  const pendingIntentCount = subjectEvents.filter(
    (event) =>
      !!event.acceptedAt &&
      !event.convertedAt &&
      Date.parse(event.acceptedAt) >= pendingWindowStart,
  ).length;

  const convertedEvents = subjectEvents.filter((event) => !!event.convertedAt && !!event.sessionId);
  const stuckConversions = countReflection(sessionsById, convertedEvents, "stuck");
  const surfaceConversions = countReflection(sessionsById, convertedEvents, "surface");
  const goodConversions = countReflection(sessionsById, convertedEvents, "good");

  if (stuckConversions >= 2 && goodConversions === 0) {
    return {
      subjectId: input.subjectId,
      signal: "friction",
      focusBoost: 0.75,
      blockMinutesAdjustment: -10,
      pendingIntentCount,
      stuckConversions,
      surfaceConversions,
      goodConversions,
      focusReason:
        pendingIntentCount > 0
          ? "Bu ders için açık kalan bir çalışma niyeti var; ama son öneriler daha dar bloklarla daha iyi ilerleyebilir."
          : null,
      guidanceReason:
        "Son öneriler bu derste biraz daraltılınca daha güvenli ilerleyebilir; kısa ve net bloklar daha iyi gelebilir.",
    };
  }

  if (surfaceConversions >= 2 && stuckConversions === 0) {
    return {
      subjectId: input.subjectId,
      signal: "friction",
      focusBoost: pendingIntentCount > 0 ? 1 : 0,
      blockMinutesAdjustment: -5,
      pendingIntentCount,
      stuckConversions,
      surfaceConversions,
      goodConversions,
      focusReason:
        pendingIntentCount > 0
          ? "Bu ders için daha önce açtığın blok bekliyor; ama kısa ve net bir dönüş daha iyi olabilir."
          : null,
      guidanceReason:
        "Son bloklar biraz yüzeyde kaldı; bu derste daha kısa ve net bir dönüş daha iyi karşılık verebilir.",
    };
  }

  if (goodConversions >= 2 && stuckConversions === 0) {
    return {
      subjectId: input.subjectId,
      signal: "positive",
      focusBoost: pendingIntentCount > 0 ? 1.5 : 0.5,
      blockMinutesAdjustment: 5,
      pendingIntentCount,
      stuckConversions,
      surfaceConversions,
      goodConversions,
      focusReason:
        pendingIntentCount > 0
          ? "Bu ders için daha önce açtığın öneri yarım kaldı; son bloklar iyi aktığı için buraya dönmek kolay olabilir."
          : null,
      guidanceReason:
        "Son öneriler bu derste karşılık verdi; biraz daha dolu bir blok kaldırman mümkün görünüyor.",
    };
  }

  if (pendingIntentCount > 0) {
    return {
      subjectId: input.subjectId,
      signal: "pending",
      focusBoost: Math.min(2, pendingIntentCount * 1.25),
      blockMinutesAdjustment: 0,
      pendingIntentCount,
      stuckConversions,
      surfaceConversions,
      goodConversions,
      focusReason:
        "Bu ders için daha önce açtığın bir öneri bekliyor; buraya dönmek akışı toparlamayı kolaylaştırabilir.",
      guidanceReason: null,
    };
  }

  return {
    subjectId: input.subjectId,
    signal: "neutral",
    focusBoost: 0,
    blockMinutesAdjustment: 0,
    pendingIntentCount,
    stuckConversions,
    surfaceConversions,
    goodConversions,
    focusReason: null,
    guidanceReason: null,
  };
}
