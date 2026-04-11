import { getActiveAcademicEvents, matchAcademicEventSubjectId } from "@/lib/academic-events";
import { buildRecommendationFeedbackProfile } from "@/lib/recommendation-events";
import {
  RiskLabel,
  AcademicEvent,
  RankedSubjectRisk,
  RecommendationEvent,
  StudySession,
  SubjectSeed,
} from "@/lib/types";

function getRiskLabel(score: number): RiskLabel {
  if (score < 30) {
    return "Low";
  }

  if (score < 45) {
    return "Moderate";
  }

  if (score < 60) {
    return "High";
  }

  return "Critical";
}

function readTaskKind(event: AcademicEvent) {
  const raw = event.metadata?.scheduleKind;
  return raw === "project" || raw === "assignment" || raw === "deadline"
    ? raw
    : null;
}

function buildTaskPressureSentence(event: AcademicEvent, now: Date) {
  const taskKind = readTaskKind(event);
  const kindLabel =
    taskKind === "project"
      ? "proje"
      : taskKind === "assignment"
        ? "ödev"
        : "teslim";

  if (!event.dueAt) {
    return `Bu haftaki ${kindLabel} sinyali bu dersi biraz daha yukarı taşıyor.`;
  }

  const hoursUntilDue =
    (new Date(event.dueAt).getTime() - now.getTime()) / 3_600_000;

  if (hoursUntilDue <= 24) {
    return `Yakın ${kindLabel} baskısı bu dersi bugünün önceliklerine daha sert biçimde taşıyor.`;
  }

  if (hoursUntilDue <= 72) {
    return `Yaklaşan ${kindLabel} bu dersin odağını bu hafta belirgin biçimde artırıyor.`;
  }

  return `Bu haftaki ${kindLabel} sinyali bu dersi takipte tutmayı daha önemli hale getiriyor.`;
}

function calculateTaskPressureBoost(event: AcademicEvent, now: Date) {
  let boost = event.planningImpact === "strong" ? 4 : event.planningImpact === "soft" ? 2 : 0.5;

  if (!event.dueAt) {
    return boost;
  }

  const hoursUntilDue =
    (new Date(event.dueAt).getTime() - now.getTime()) / 3_600_000;

  if (hoursUntilDue < 0) {
    boost += 8;
  } else if (hoursUntilDue <= 24) {
    boost += 7;
  } else if (hoursUntilDue <= 72) {
    boost += 5;
  } else if (hoursUntilDue <= 7 * 24) {
    boost += 2.5;
  } else {
    boost += 1;
  }

  if (event.significance === "high") {
    boost += 1.5;
  } else if (event.significance === "medium") {
    boost += 0.75;
  }

  const taskKind = readTaskKind(event);
  if (taskKind === "project") {
    boost += 1;
  }

  return boost;
}

function buildRecommendationPressureSentence(input: {
  focusReason: string | null;
  guidanceReason: string | null;
  pendingIntentCount: number;
  signal: "neutral" | "pending" | "friction" | "positive";
}) {
  if (input.focusReason) {
    return input.focusReason;
  }

  if (input.signal === "friction" && input.guidanceReason) {
    return input.guidanceReason;
  }

  if (input.signal === "positive" && input.pendingIntentCount > 0) {
    return "Daha önce açılan öneri bu derste iyi karşılık verdiği için buraya dönmek daha kolay olabilir.";
  }

  return null;
}

export function buildTaskAwarePriorities(
  rankedSubjects: RankedSubjectRisk[],
  academicEvents: AcademicEvent[],
  subjects: SubjectSeed[],
  now: Date = new Date(),
  options?: {
    recommendationEvents?: RecommendationEvent[];
    sessions?: StudySession[];
  },
) {
  if (rankedSubjects.length === 0 || subjects.length === 0) {
    return rankedSubjects;
  }

  const taskEventBySubjectId = new Map<string, AcademicEvent>();

  if (academicEvents.length > 0) {
    for (const event of getActiveAcademicEvents(academicEvents, now)) {
      if (event.type !== "assignment_due" && event.type !== "deadline_change") {
        continue;
      }

      const subjectId = matchAcademicEventSubjectId(event, subjects);
      if (!subjectId || taskEventBySubjectId.has(subjectId)) {
        continue;
      }

      taskEventBySubjectId.set(subjectId, event);
    }
  }

  const hasRecommendationFeedback = (options?.recommendationEvents?.length ?? 0) > 0;

  if (taskEventBySubjectId.size === 0 && !hasRecommendationFeedback) {
    return rankedSubjects;
  }

  return [...rankedSubjects]
    .map((subject) => {
      const taskEvent = taskEventBySubjectId.get(subject.subjectId);
      const recommendationFeedback = hasRecommendationFeedback
        ? buildRecommendationFeedbackProfile({
            subjectId: subject.subjectId,
            events: options?.recommendationEvents,
            sessions: options?.sessions ?? [],
            now,
          })
        : null;

      if (!taskEvent && !recommendationFeedback?.focusBoost) {
        return subject;
      }

      const boostedScore = Number((
        subject.score +
        (taskEvent ? calculateTaskPressureBoost(taskEvent, now) : 0) +
        (recommendationFeedback?.focusBoost ?? 0)
      ).toFixed(1));
      const taskSentence = taskEvent ? buildTaskPressureSentence(taskEvent, now) : null;
      const recommendationSentence = recommendationFeedback
        ? buildRecommendationPressureSentence(recommendationFeedback)
        : null;
      const explanation = [subject.explanation, taskSentence, recommendationSentence]
        .filter((sentence, index, all) => {
          if (!sentence) return false;
          return all.indexOf(sentence) === index;
        })
        .join(" ");

      return {
        ...subject,
        score: boostedScore,
        label: getRiskLabel(boostedScore),
        explanation,
      };
    })
    .sort((left, right) => {
      if (right.score === left.score) {
        return left.hoursUntilExam - right.hoursUntilExam;
      }

      return right.score - left.score;
    });
}
