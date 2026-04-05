import { DAY, formatMinutesAsHours } from "@/lib/time";
import { RankedSubjectRisk, StudySession } from "@/lib/types";

export interface HomeFocusRecommendation {
  subject: RankedSubjectRisk;
  mode: "start" | "continue" | "switch";
  sessionMinutesToday: number;
  reason: string;
}

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

export function buildHomeFocusRecommendation(
  rankedSubjects: RankedSubjectRisk[],
  sessions: StudySession[],
  sessionsToday: StudySession[],
  now: Date,
): HomeFocusRecommendation | null {
  const candidates = rankedSubjects.slice(0, 3);
  if (candidates.length === 0) {
    return null;
  }

  const recentWindowStart = now.getTime() - 3 * DAY;
  const topRisk = candidates[0];

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

    return {
      subject,
      sessionMinutesToday,
      score,
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
      reason: `${topRisk.title} için bugün ${formatMinutesAsHours(topRiskMinutesToday)} ayırdın. Şimdi ${best.subject.title} tarafına geçmek haftayı daha dengeli toplar.`,
    };
  }

  if (best.sessionMinutesToday === 0) {
    return {
      subject: best.subject,
      mode: "start",
      sessionMinutesToday: 0,
      reason: "Bugün henüz açılmadı; ilk ciddi çalışma odağı için en temiz giriş burada duruyor.",
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
