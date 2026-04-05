import { ResourceItem, StudyMode, StudySession, SubjectId } from "@/lib/types";

export interface SubjectLearningProfile {
  modeHint: StudyMode | null;
  confidence: "low" | "medium";
  reason: string | null;
}

function normalizeText(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9çğıöşü\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isQuestionStyleResource(resource: ResourceItem) {
  const normalized = normalizeText(resource.title);
  return (
    resource.contentHint === "formula-heavy" ||
    /soru|quiz|past exam|cikmis|çikmis|deneme|problem set|worksheet|test/i.test(normalized)
  );
}

function isTopicStyleResource(resource: ResourceItem) {
  const normalized = normalizeText(resource.title);
  return (
    resource.contentHint === "prose-heavy" &&
    resource.pageCount >= 6 &&
    /donemi|dönemi|politika|konferans|konferansi|antlasma|antlaşma|savasi|savaşı|iliski|ilişki|tarihi|kuram|yaklasim|yaklaşım|teori|teorisi|devrim|inkilap|inkılap/i.test(
      normalized,
    )
  );
}

function isSummaryStyleResource(resource: ResourceItem) {
  const normalized = normalizeText(resource.title);
  return (
    /ozet|özet|summary|cheat sheet|quick review/i.test(normalized) ||
    /ders notu|lecture note|notlar|notes/i.test(normalized)
  );
}

function getReflectionWeightedMode(session: StudySession): {
  mode: Exclude<StudyMode, "conceptual" | "mixed">;
  delta: number;
} | null {
  if (!session.reflection) {
    return null;
  }

  const mode =
    session.minutes >= 45
      ? "problem"
      : session.minutes <= 25
        ? "memorization"
        : "interpretive";

  const delta =
    session.reflection === "good"
      ? 0.75
      : session.reflection === "surface"
        ? 0.25
        : -0.75;

  return { mode, delta };
}

export function buildSubjectLearningProfile(input: {
  subjectId: SubjectId;
  sessions: StudySession[];
  resources: ResourceItem[];
}): SubjectLearningProfile {
  const subjectSessions = input.sessions.filter((session) => session.subjectId === input.subjectId);
  const activeResources = input.resources.filter((resource) => resource.subjectId === input.subjectId);

  if (subjectSessions.length === 0 && activeResources.length === 0) {
    return {
      modeHint: null,
      confidence: "low",
      reason: null,
    };
  }

  const avgSessionMinutes =
    subjectSessions.length > 0
      ? subjectSessions.reduce((sum, session) => sum + session.minutes, 0) / subjectSessions.length
      : 0;

  const engagedResources = activeResources.filter(
    (resource) =>
      resource.pagesRead > 0 ||
      (resource.engagementCount ?? 0) > 0 ||
      (resource.revisitCount ?? 0) > 0,
  );

  const questionResources = engagedResources.filter(isQuestionStyleResource);
  const topicResources = engagedResources.filter(isTopicStyleResource);
  const summaryResources = engagedResources.filter(isSummaryStyleResource);
  const reflectionScores = subjectSessions.reduce(
    (totals, session) => {
      const weighted = getReflectionWeightedMode(session);
      if (!weighted) {
        return totals;
      }

      totals[weighted.mode] += weighted.delta;
      return totals;
    },
    {
      problem: 0,
      memorization: 0,
      interpretive: 0,
    },
  );
  const goodReflections = subjectSessions.filter((session) => session.reflection === "good").length;
  const stuckReflections = subjectSessions.filter((session) => session.reflection === "stuck").length;

  const problemScore =
    questionResources.length * 2 +
    (avgSessionMinutes >= 45 ? 1.5 : 0) +
    (questionResources.some((resource) => (resource.revisitCount ?? 0) > 0) ? 1 : 0) +
    reflectionScores.problem;

  const memorizationScore =
    summaryResources.length +
    topicResources.length * 1.5 +
    (avgSessionMinutes > 0 && avgSessionMinutes <= 25 ? 1.25 : 0) +
    (topicResources.some((resource) => (resource.revisitCount ?? 0) > 0) ? 0.75 : 0) +
    reflectionScores.memorization;

  const interpretiveScore =
    topicResources.length * 2 +
    (avgSessionMinutes >= 25 && avgSessionMinutes <= 45 ? 1 : 0) +
    (engagedResources.some((resource) => (resource.revisitCount ?? 0) > 1) ? 0.75 : 0) +
    reflectionScores.interpretive;

  const ranked = [
    {
      mode: "problem" as StudyMode,
      score: problemScore,
      reason: "Uygulama ağırlıklı kaynaklara ve uzun bloklara daha sık dönüyorsun.",
    },
    {
      mode: "memorization" as StudyMode,
      score: memorizationScore,
      reason: "Kısa tekrar ve konu notu hattı bu derste daha baskın görünüyor.",
    },
    {
      mode: "interpretive" as StudyMode,
      score: interpretiveScore,
      reason: "Konu notları ve tekrar dönüşleri burada tema-akış çalışmasını öne çıkarıyor.",
    },
  ] satisfies Array<{ mode: StudyMode; score: number; reason: string }>;

  ranked.sort((left, right) => right.score - left.score);

  const top = ranked[0];
  const second = ranked[1];

  if (!top || top.score < 2.5 || top.score - second.score < 0.75) {
    return {
      modeHint: null,
      confidence: "low",
      reason: null,
    };
  }

  const confidence =
    stuckReflections >= 2 && goodReflections <= 1
      ? "low"
      : goodReflections >= 2 && stuckReflections === 0 && top.score >= 3.25
        ? "medium"
        : top.score >= 4
          ? "medium"
          : "low";

  const reason =
    confidence === "medium" && goodReflections >= 2 && stuckReflections === 0
      ? `${top.reason} Son seanslar da bu hattın sende karşılık verdiğini gösteriyor.`
      : top.reason;

  return {
    modeHint: top.mode,
    confidence,
    reason,
  };
}
