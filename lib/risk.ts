import { exams, subjectSeeds } from "@/lib/seed-data";
import {
  clamp,
  estimateEffectiveStudyHoursLeft,
  formatRelativeDuration,
  formatStudyHours,
  getHoursBetween,
  isMorningExam,
  sumHoursForSubject,
} from "@/lib/time";
import {
  Exam,
  RankedSubjectRisk,
  RiskEngineSnapshot,
  StudentConstraints,
  StudySession,
  SubjectSeed,
} from "@/lib/types";

function getExamBySubject(subjectId: SubjectSeed["id"]) {
  return exams.find((exam) => exam.subjectId === subjectId) ?? null;
}

function calculateBaseComplexity(subject: SubjectSeed) {
  return (
    0.3 * subject.contentLoad +
    0.3 * subject.difficulty +
    0.2 * subject.practiceNeed +
    0.2 * subject.resourceFriction
  );
}

function calculateUrgencyPressure(now: Date, examDate: Date) {
  const hoursUntilExam = getHoursBetween(examDate, now);
  return clamp((72 - hoursUntilExam) / 48, 0, 1.5);
}

function estimateResourceCompletionRate(
  subject: SubjectSeed,
  hoursStudied: number,
  progressGap: number,
) {
  const studiedRatio = clamp(hoursStudied / subject.targetHours, 0, 1);
  const frictionHeadwind = 1 - (subject.resourceFriction - 1) / 8;

  return clamp(
    studiedRatio * 0.72 + frictionHeadwind * 0.18 + subject.reliefFactor * 0.1 - progressGap * 0.08,
    0,
    1,
  );
}

function calculateSleepPenalty(
  examDate: Date,
  constraints: StudentConstraints,
) {
  if (!isMorningExam(examDate)) {
    return 0;
  }

  const dayBeforeExam = new Date(
    examDate.getFullYear(),
    examDate.getMonth(),
    examDate.getDate() - 1,
  );
  const bedtime = new Date(
    dayBeforeExam.getFullYear(),
    dayBeforeExam.getMonth(),
    dayBeforeExam.getDate() + 1,
    constraints.morningSleepCutoffHour,
    0,
    0,
    0,
  );
  const wakeTime = new Date(
    examDate.getTime() - constraints.wakeBufferMinutes * 60_000,
  );
  const achievableSleepHours = Math.max(
    (wakeTime.getTime() - bedtime.getTime()) / 3_600_000,
    0,
  );

  return clamp(
    (constraints.sleepTargetHours - achievableSleepHours) /
      constraints.sleepTargetHours,
    0,
    1,
  );
}

function calculateReliefBoost(subject: SubjectSeed, progressGap: number) {
  return clamp(subject.reliefFactor * (1 - progressGap * 0.35), 0, 1.2);
}

function getRiskLabel(score: number) {
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

function buildExplanation(
  risk: Pick<
    RankedSubjectRisk,
    | "remainingTargetHours"
    | "effectiveStudyHoursLeft"
    | "hoursUntilExam"
    | "breakdown"
    | "targetHours"
  >,
) {
  const reasons: Array<{ weight: number; text: string }> = [];

  if (risk.breakdown.capacityPressure > 0.75) {
    reasons.push({
      weight: risk.breakdown.capacityPressure,
      text: `${formatStudyHours(risk.remainingTargetHours)} still sits against only ${formatStudyHours(risk.effectiveStudyHoursLeft)} of realistic study capacity`,
    });
  }

  if (risk.breakdown.urgencyPressure > 0.65) {
    reasons.push({
      weight: risk.breakdown.urgencyPressure,
      text: `the exam is inside ${formatRelativeDuration(
        risk.hoursUntilExam * 3_600_000,
      )}`,
    });
  }

  if (risk.breakdown.progressGap > 0.6) {
    reasons.push({
      weight: risk.breakdown.progressGap,
      text: `progress is still well short of the ${formatStudyHours(
        risk.targetHours,
      )} target`,
    });
  }

  if (risk.breakdown.resourceGap > 0.6) {
    reasons.push({
      weight: risk.breakdown.resourceGap,
      text: "resource coverage still looks thin relative to the workload",
    });
  }

  if (risk.breakdown.sleepPenalty > 0.08) {
    reasons.push({
      weight: risk.breakdown.sleepPenalty,
      text: "the morning-exam sleep window is compressed",
    });
  }

  if (risk.breakdown.baseComplexity > 3.25) {
    reasons.push({
      weight: risk.breakdown.baseComplexity / 5,
      text: "the underlying content stack is heavy even before time pressure hits",
    });
  }

  const topReasons = reasons
    .sort((left, right) => right.weight - left.weight)
    .slice(0, 2)
    .map((reason) => reason.text);

  return topReasons.length > 0
    ? topReasons.join(", ")
    : "the score is mostly stable because workload and timing are both manageable";
}

function buildRankedSubjectRisk(
  subject: SubjectSeed,
  exam: Exam,
  sessions: StudySession[],
  now: Date,
  constraints: StudentConstraints,
) {
  const examDate = new Date(exam.scheduledAt);
  const hoursStudied = sumHoursForSubject(sessions, subject.id);
  const remainingTargetHours = Math.max(subject.targetHours - hoursStudied, 0);
  const effectiveStudyHoursLeft = estimateEffectiveStudyHoursLeft(
    now,
    examDate,
    constraints,
  );
  const hoursUntilExam = getHoursBetween(examDate, now);
  const progressGap = clamp(1 - hoursStudied / subject.targetHours, 0, 1);
  const resourceCompletionRate = estimateResourceCompletionRate(
    subject,
    hoursStudied,
    progressGap,
  );
  const resourceGap = clamp(1 - resourceCompletionRate, 0, 1);
  const capacityPressure = clamp(
    remainingTargetHours / Math.max(effectiveStudyHoursLeft, 0.1),
    0,
    1.5,
  );
  const urgencyPressure = calculateUrgencyPressure(now, examDate);
  const baseComplexity = calculateBaseComplexity(subject);
  const sleepPenalty = calculateSleepPenalty(examDate, constraints);
  const reliefBoost = calculateReliefBoost(subject, progressGap);
  const score =
    12 * baseComplexity +
    10 * urgencyPressure +
    10 * capacityPressure +
    8 * progressGap +
    6 * resourceGap +
    6 * sleepPenalty -
    5 * reliefBoost;

  const ranked: RankedSubjectRisk = {
    subjectId: subject.id,
    title: subject.title,
    shortLabel: subject.shortLabel,
    examTitle: exam.title,
    examDate: exam.scheduledAt,
    hoursStudied: Number(hoursStudied.toFixed(2)),
    targetHours: subject.targetHours,
    remainingTargetHours: Number(remainingTargetHours.toFixed(2)),
    effectiveStudyHoursLeft: Number(effectiveStudyHoursLeft.toFixed(2)),
    hoursUntilExam: Number(hoursUntilExam.toFixed(2)),
    score: Number(score.toFixed(1)),
    label: getRiskLabel(score),
    explanation: "",
    breakdown: {
      baseComplexity: Number(baseComplexity.toFixed(2)),
      urgencyPressure: Number(urgencyPressure.toFixed(2)),
      capacityPressure: Number(capacityPressure.toFixed(2)),
      progressGap: Number(progressGap.toFixed(2)),
      resourceGap: Number(resourceGap.toFixed(2)),
      sleepPenalty: Number(sleepPenalty.toFixed(2)),
      reliefBoost: Number(reliefBoost.toFixed(2)),
      resourceCompletionRate: Number(resourceCompletionRate.toFixed(2)),
    },
  };

  ranked.explanation = buildExplanation(ranked);

  return ranked;
}

export function buildRiskEngineSnapshot(
  sessions: StudySession[],
  now: Date,
  constraints: StudentConstraints,
) {
  const rankedSubjects = subjectSeeds
    .map((subject) => {
      const exam = getExamBySubject(subject.id);

      if (!exam) {
        return null;
      }

      return buildRankedSubjectRisk(subject, exam, sessions, now, constraints);
    })
    .filter((subject): subject is RankedSubjectRisk => Boolean(subject))
    .sort((left, right) => {
      if (right.score === left.score) {
        return left.hoursUntilExam - right.hoursUntilExam;
      }

      return right.score - left.score;
    });

  const nextExam =
    [...exams]
      .filter((exam) => new Date(exam.scheduledAt).getTime() > now.getTime())
      .sort(
        (left, right) =>
          new Date(left.scheduledAt).getTime() -
          new Date(right.scheduledAt).getTime(),
      )[0] ?? null;

  return {
    calculatedAt: now.toISOString(),
    rankedSubjects,
    nextExam,
    totalRemainingTargetHours: Number(
      rankedSubjects
        .reduce((total, subject) => total + subject.remainingTargetHours, 0)
        .toFixed(1),
    ),
  } satisfies RiskEngineSnapshot;
}
