import { exams as seededExams, subjectSeeds as seededSubjectSeeds } from "@/lib/seed-data";
import {
  clamp,
  estimateEffectiveStudyHoursLeft,
  formatRelativeDuration,
  formatStudyHours,
  getHoursBetween,
  isMorningExam,
  sumHoursForSubject,
  sumSessionsForToday,
} from "@/lib/time";
import {
  Exam,
  RankedSubjectRisk,
  RiskEngineSnapshot,
  StudentConstraints,
  StudySession,
  SubjectSeed,
} from "@/lib/types";

interface PreparedRiskInput {
  subject: SubjectSeed;
  exam: Exam;
  examDate: Date;
  hoursStudied: number;
  creditedProgressHours: number;
  remainingTargetHours: number;
  effectiveStudyHoursLeft: number;
  hoursUntilExam: number;
}

interface CapacityCandidate {
  subjectId: SubjectSeed["id"];
  examDate: Date;
  remainingTargetHours: number;
  effectiveStudyHoursLeft: number;
}

function getExamBySubject(
  subjectId: SubjectSeed["id"],
  exams: Exam[],
) {
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

export function calculateCreditedProgressHours(
  hoursStudied: number,
  initialStudiedCredit: number,
  targetHours: number,
) {
  return clamp(hoursStudied + initialStudiedCredit, 0, targetHours);
}

const IMMEDIATE_URGENCY_WEIGHT = 0.9;
const IMMEDIATE_URGENCY_DECAY_HOURS = 18;
const PLANNING_URGENCY_WEIGHT = 0.55;
const PLANNING_URGENCY_DECAY_HOURS = 96;

export function calculateUrgencyPressure(now: Date, examDate: Date) {
  const hoursUntilExam = getHoursBetween(examDate, now);
  const immediatePressure =
    IMMEDIATE_URGENCY_WEIGHT *
    Math.exp(-hoursUntilExam / IMMEDIATE_URGENCY_DECAY_HOURS);
  const planningPressure =
    PLANNING_URGENCY_WEIGHT *
    Math.exp(-hoursUntilExam / PLANNING_URGENCY_DECAY_HOURS);

  return clamp(immediatePressure + planningPressure, 0, 1.5);
}

export function estimateResourceReadinessSignal(
  subject: SubjectSeed,
) {
  const frictionEase = clamp(1 - (subject.resourceFriction - 1) / 4, 0, 1);
  const preparednessSupport = clamp(subject.initialStudiedCredit / subject.targetHours, 0, 1);
  const reliefSupport = clamp(subject.reliefFactor, 0, 1);

  return clamp(
    frictionEase * 0.7 + preparednessSupport * 0.2 + reliefSupport * 0.1,
    0,
    1,
  );
}

export function calculatePortfolioOverloadPressure(
  current: CapacityCandidate,
  portfolio: CapacityCandidate[],
) {
  const supply = Math.max(current.effectiveStudyHoursLeft, 0.1);
  const totalDemandByDeadline = portfolio
    .filter((candidate) => candidate.examDate.getTime() <= current.examDate.getTime())
    .reduce((total, candidate) => total + candidate.remainingTargetHours, 0);
  const portfolioExcess = Math.max(totalDemandByDeadline - supply, 0);
  const ownExcess = Math.max(current.remainingTargetHours - supply, 0);
  const sharedOverloadHours = Math.max(portfolioExcess - ownExcess, 0);

  return clamp(sharedOverloadHours / supply, 0, 1);
}

export function calculateCapacityPressure(
  remainingTargetHours: number,
  effectiveStudyHoursLeft: number,
  portfolioOverloadPressure = 0,
) {
  const singleSubjectPressure =
    remainingTargetHours / Math.max(effectiveStudyHoursLeft, 0.1);

  return clamp(singleSubjectPressure + portfolioOverloadPressure, 0, 1.5);
}

const SLEEP_PRESSURE_LOOKAHEAD_HOURS = 30;

export function calculateSleepPenalty(
  now: Date,
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
  const basePenalty = clamp(
    (constraints.sleepTargetHours - achievableSleepHours) /
      constraints.sleepTargetHours,
    0,
    1,
  );
  const hoursUntilBedtime = getHoursBetween(bedtime, now);
  const proximityFactor =
    now.getTime() >= bedtime.getTime()
      ? 1
      : clamp(
          (SLEEP_PRESSURE_LOOKAHEAD_HOURS - hoursUntilBedtime) /
            SLEEP_PRESSURE_LOOKAHEAD_HOURS,
          0,
          1,
        );

  return clamp(basePenalty * proximityFactor, 0, 1);
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

export function buildExplanation(
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
      text: `there is still a lot to cover in a short window`,
    });
  }

  if (risk.breakdown.urgencyPressure > 0.65) {
    reasons.push({
      weight: risk.breakdown.urgencyPressure,
      text: `the exam is now getting close`,
    });
  }

  if (risk.breakdown.progressGap > 0.6) {
    reasons.push({
      weight: risk.breakdown.progressGap,
      text: `you have not had much time with this subject yet`,
    });
  }

  if (risk.breakdown.resourceGap > 0.6) {
    reasons.push({
      weight: risk.breakdown.resourceGap,
      text: "it may take a little longer than usual to settle into this one",
    });
  }

  if (risk.breakdown.sleepPenalty > 0.08) {
    reasons.push({
      weight: risk.breakdown.sleepPenalty,
      text: "the night before this exam may feel tighter than usual",
    });
  }

  if (risk.breakdown.baseComplexity > 3.25) {
    reasons.push({
      weight: risk.breakdown.baseComplexity / 5,
      text: "this subject is heavier than the rest of the week",
    });
  }

  const topReasons = reasons
    .sort((left, right) => right.weight - left.weight)
    .slice(0, 2)
    .map((reason) => reason.text);

  return topReasons.length > 0
    ? `${topReasons.join(". ")}.`
    : "This one can stay in view, but it does not need the next block yet.";
}

function prepareRiskInput(
  subject: SubjectSeed,
  exam: Exam,
  sessions: StudySession[],
  now: Date,
  constraints: StudentConstraints,
): PreparedRiskInput {
  const examDate = new Date(exam.scheduledAt);
  const hoursStudied = sumHoursForSubject(sessions, subject.id);
  const consumedStudyMinutesToday = sumSessionsForToday(sessions, now);
  const creditedProgressHours = calculateCreditedProgressHours(
    hoursStudied,
    subject.initialStudiedCredit,
    subject.targetHours,
  );
  const remainingTargetHours = Math.max(
    subject.targetHours - creditedProgressHours,
    0,
  );
  const effectiveStudyHoursLeft = estimateEffectiveStudyHoursLeft(
    now,
    examDate,
    constraints,
    consumedStudyMinutesToday,
  );
  const hoursUntilExam = getHoursBetween(examDate, now);

  return {
    subject,
    exam,
    examDate,
    hoursStudied,
    creditedProgressHours,
    remainingTargetHours,
    effectiveStudyHoursLeft,
    hoursUntilExam,
  };
}

function buildRankedSubjectRisk(
  prepared: PreparedRiskInput,
  portfolio: PreparedRiskInput[],
  now: Date,
  constraints: StudentConstraints,
) {
  const {
    subject,
    exam,
    examDate,
    hoursStudied,
    creditedProgressHours,
    remainingTargetHours,
    effectiveStudyHoursLeft,
    hoursUntilExam,
  } = prepared;
  const progressGap = clamp(1 - creditedProgressHours / subject.targetHours, 0, 1);
  const resourceReadinessSignal = estimateResourceReadinessSignal(subject);
  const resourceGap = clamp(1 - resourceReadinessSignal, 0, 1);
  const portfolioOverloadPressure = calculatePortfolioOverloadPressure(
    {
      subjectId: subject.id,
      examDate,
      remainingTargetHours,
      effectiveStudyHoursLeft,
    },
    portfolio.map((candidate) => ({
      subjectId: candidate.subject.id,
      examDate: candidate.examDate,
      remainingTargetHours: candidate.remainingTargetHours,
      effectiveStudyHoursLeft: candidate.effectiveStudyHoursLeft,
    })),
  );
  const capacityPressure = calculateCapacityPressure(
    remainingTargetHours,
    effectiveStudyHoursLeft,
    portfolioOverloadPressure,
  );
  const urgencyPressure = calculateUrgencyPressure(now, examDate);
  const baseComplexity = calculateBaseComplexity(subject);
  const sleepPenalty = calculateSleepPenalty(now, examDate, constraints);
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
      portfolioOverloadPressure: Number(portfolioOverloadPressure.toFixed(2)),
      progressGap: Number(progressGap.toFixed(2)),
      resourceGap: Number(resourceGap.toFixed(2)),
      sleepPenalty: Number(sleepPenalty.toFixed(2)),
      reliefBoost: Number(reliefBoost.toFixed(2)),
      resourceReadinessSignal: Number(resourceReadinessSignal.toFixed(2)),
    },
  };

  ranked.explanation = buildExplanation(ranked);

  return ranked;
}

export function buildRiskEngineSnapshot(
  sessions: StudySession[],
  now: Date,
  constraints: StudentConstraints,
  options?: {
    exams?: Exam[];
    subjectSeeds?: SubjectSeed[];
  },
) {
  const exams = options?.exams ?? seededExams;
  const subjectSeeds = options?.subjectSeeds ?? seededSubjectSeeds;
  const preparedSubjects = subjectSeeds
    .map((subject) => {
      const exam = getExamBySubject(subject.id, exams);

      if (!exam) {
        return null;
      }

      return prepareRiskInput(subject, exam, sessions, now, constraints);
    })
    .filter((subject): subject is PreparedRiskInput => Boolean(subject));

  const rankedSubjects = preparedSubjects
    .map((prepared) =>
      buildRankedSubjectRisk(prepared, preparedSubjects, now, constraints),
    )
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
