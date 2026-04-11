import { DAY, formatMinutesAsHours } from "@/lib/time";
import { getActiveAcademicEvents, matchAcademicEventSubjectId } from "@/lib/academic-events";
import { buildRecommendationFeedbackProfile } from "@/lib/recommendation-events";
import { AcademicEvent, RecommendationEvent, RankedSubjectRisk, StudySession, SubjectSeed } from "@/lib/types";

export interface HomeFocusRecommendation {
  subject: RankedSubjectRisk;
  mode: "start" | "continue" | "switch";
  sessionMinutesToday: number;
  reason: string;
}

const IMMEDIATE_NO_LOG_WINDOW_HOURS = 18;

function sumMinutesForSubject(
  sessions: StudySession[],
  subjectId: string,
  predicate?: (session: StudySession) => boolean,
) {
  return sessions
    .filter(
      (session) =>
        session.subjectId === subjectId && (predicate ? predicate(session) : true),
    )
    .reduce((total, session) => total + session.minutes, 0);
}

function readTaskKind(event: AcademicEvent) {
  const raw = event.metadata?.scheduleKind;
  return raw === "project" || raw === "assignment" || raw === "deadline"
    ? raw
    : null;
}

function buildTaskReason(event: AcademicEvent, subjectTitle: string) {
  const taskKind = readTaskKind(event);
  const kindLabel =
    taskKind === "project"
      ? "proje"
      : taskKind === "assignment"
        ? "ödev"
        : "teslim";

  return `${subjectTitle} tarafındaki ${kindLabel} bu hafta daha görünür hale geldi; bugünkü odağı burada kurmak daha güvenli duruyor.`;
}

function calculateTaskPressureBoost(event: AcademicEvent, now: Date) {
  if (!event.dueAt) {
    return event.planningImpact === "strong" ? 4 : 2;
  }

  const hoursUntilDue =
    (new Date(event.dueAt).getTime() - now.getTime()) / 3_600_000;

  if (hoursUntilDue <= 24) {
    return 9;
  }

  if (hoursUntilDue <= 72) {
    return 6;
  }

  if (hoursUntilDue <= 7 * 24) {
    return 3.5;
  }

  return 1.5;
}

export function buildHomeFocusRecommendation(
  rankedSubjects: RankedSubjectRisk[],
  sessions: StudySession[],
  sessionsToday: StudySession[],
  now: Date,
  options?: {
    academicEvents?: AcademicEvent[];
    recommendationEvents?: RecommendationEvent[];
    subjects?: SubjectSeed[];
  },
): HomeFocusRecommendation | null {
  const immediateNoLogSubject = rankedSubjects
    .filter((subject) => subject.hoursUntilExam <= IMMEDIATE_NO_LOG_WINDOW_HOURS)
    .sort((left, right) => left.hoursUntilExam - right.hoursUntilExam)
    .find((subject) => sumMinutesForSubject(sessions, subject.subjectId) === 0);

  if (immediateNoLogSubject) {
    return {
      subject: immediateNoLogSubject,
      mode: "start",
      sessionMinutesToday: 0,
      reason: "Sınava çok az kaldı ve sistem içinde bu ders için çalışma kaydı görünmüyor. İlk blok burada başlamalı.",
    };
  }

  const candidates = rankedSubjects.slice(0, 3);
  if (candidates.length === 0) {
    return null;
  }

  const recentWindowStart = now.getTime() - 3 * DAY;
  const topRisk = candidates[0];
  const taskEventBySubjectId = new Map<string, AcademicEvent>();

  if (options?.academicEvents?.length && options.subjects?.length) {
    for (const event of getActiveAcademicEvents(options.academicEvents, now)) {
      if (
        event.type !== "assignment_due" &&
        event.type !== "deadline_change"
      ) {
        continue;
      }

      const subjectId = matchAcademicEventSubjectId(event, options.subjects);
      if (!subjectId || taskEventBySubjectId.has(subjectId)) {
        continue;
      }

      taskEventBySubjectId.set(subjectId, event);
    }
  }

  const scored = candidates.map((subject, index) => {
    const sessionMinutesToday = sumMinutesForSubject(
      sessionsToday,
      subject.subjectId,
    );
    const recentMinutes = sumMinutesForSubject(
      sessions,
      subject.subjectId,
      (session) => new Date(session.createdAt).getTime() >= recentWindowStart,
    );

    let score = 18 - index * 4;

    if (sessionMinutesToday === 0) {
      score += 3;
    } else if (sessionMinutesToday >= 90) {
      score -= 5;
    } else if (sessionMinutesToday >= 60) {
      score -= 3;
    } else if (sessionMinutesToday >= 30) {
      score -= 1;
    } else {
      score += 0.5;
    }

    if (recentMinutes === 0) {
      score += 1.5;
    }

    if (index === 0 && sessionMinutesToday < 45) {
      score += 1;
    }

    if (
      index > 0 &&
      sumMinutesForSubject(sessionsToday, topRisk.subjectId) >= 60 &&
      sessionMinutesToday === 0
    ) {
      score += 1;
    }

    const taskEvent = taskEventBySubjectId.get(subject.subjectId) ?? null;
    const recommendationFeedback = buildRecommendationFeedbackProfile({
      subjectId: subject.subjectId,
      events: options?.recommendationEvents,
      sessions,
      now,
    });
    if (taskEvent) {
      score += calculateTaskPressureBoost(taskEvent, now);

      if (sessionMinutesToday === 0) {
        score += 1.5;
      }
    }

    score += recommendationFeedback.focusBoost;

    return {
      subject,
      sessionMinutesToday,
      score,
      taskEvent,
      recommendationFeedback,
    };
  });

  const best = scored.reduce((currentBest, entry) =>
    entry.score > currentBest.score ? entry : currentBest,
  );

  const topRiskMinutesToday = sumMinutesForSubject(
    sessionsToday,
    topRisk.subjectId,
  );

  if (
    best.subject.subjectId !== topRisk.subjectId &&
    topRiskMinutesToday >= 60 &&
    best.sessionMinutesToday === 0
  ) {
    return {
      subject: best.subject,
      mode: "switch",
      sessionMinutesToday: 0,
      reason: best.taskEvent
        ? buildTaskReason(best.taskEvent, best.subject.title)
        : best.recommendationFeedback.focusReason
          ? best.recommendationFeedback.focusReason
        : `${topRisk.title} için bugün ${formatMinutesAsHours(topRiskMinutesToday)} ayırdın. Şimdi ${best.subject.title} tarafına geçmek haftayı daha dengeli toplar.`,
    };
  }

  if (best.sessionMinutesToday === 0) {
    return {
      subject: best.subject,
      mode: "start",
      sessionMinutesToday: 0,
      reason: best.taskEvent
        ? buildTaskReason(best.taskEvent, best.subject.title)
        : best.recommendationFeedback.focusReason
          ? best.recommendationFeedback.focusReason
        : "Bugün henüz açılmadı; ilk ciddi çalışma odağı için en temiz giriş burada duruyor.",
    };
  }

  if (best.sessionMinutesToday < 45) {
    return {
      subject: best.subject,
      mode: "continue",
      sessionMinutesToday: best.sessionMinutesToday,
      reason: "Bugün kısa bir giriş yaptın; bir blok daha bu dersin çerçevesini daha net kurar.",
    };
  }

  return {
    subject: best.subject,
    mode: "continue",
    sessionMinutesToday: best.sessionMinutesToday,
    reason: "Bugünkü akış burada devam edebilir. Aynı derste biraz daha derinleşmek daha doğru görünüyor.",
  };
}
