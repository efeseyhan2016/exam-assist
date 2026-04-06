import { getExamProximityProfile } from "@/lib/exam-proximity";
import { buildRiskEngineSnapshot } from "@/lib/risk";
import {
  Exam,
  RiskLabel,
  StudentConstraints,
  StudySession,
  StudySessionReflection,
  SubjectSeed,
} from "@/lib/types";

function clampBlockMinutes(value: number) {
  const rounded = Math.round(value / 5) * 5;
  return Math.min(Math.max(rounded, 20), 60);
}

export function getRecommendedStudyBlockMinutes(
  hoursUntilExam: number,
  remainingGoalMinutes: number,
  riskLabel: RiskLabel,
) {
  const proximity = getExamProximityProfile(hoursUntilExam);
  const safeRemaining = Math.max(remainingGoalMinutes, 0);

  if (safeRemaining === 0) {
    return proximity.prefersQuickReview ? 20 : 25;
  }

  if (proximity.prefersQuickReview) {
    return Math.min(30, clampBlockMinutes(Math.min(safeRemaining, 30)));
  }

  if (proximity.prefersConsolidation) {
    return Math.min(35, clampBlockMinutes(Math.min(safeRemaining, 35)));
  }

  if (riskLabel === "Critical" && safeRemaining >= 60) {
    return 60;
  }

  if (riskLabel === "High" && safeRemaining >= 45) {
    return 45;
  }

  if (safeRemaining >= 45) {
    return 45;
  }

  if (safeRemaining >= 30) {
    return 30;
  }

  return clampBlockMinutes(safeRemaining);
}

export function buildStudyRecommendationSentence(input: {
  subjectTitle: string;
  hoursUntilExam: number;
  remainingGoalMinutes: number;
  riskLabel: RiskLabel;
  mode?: "start" | "continue" | "switch";
}) {
  const blockMinutes = getRecommendedStudyBlockMinutes(
    input.hoursUntilExam,
    input.remainingGoalMinutes,
    input.riskLabel,
  );
  const proximity = getExamProximityProfile(input.hoursUntilExam);

  if (proximity.prefersQuickReview) {
    return {
      blockMinutes,
      sentence: `${input.subjectTitle} için bugün ${blockMinutes} dakikalık kısa bir gözden geçirme bloğu ayır.`,
    };
  }

  if (proximity.prefersConsolidation) {
    return {
      blockMinutes,
      sentence: `${input.subjectTitle} tarafında bugün ${blockMinutes} dakikalık tek bir toparlama bloğu ayır.`,
    };
  }

  if (input.mode === "switch") {
    return {
      blockMinutes,
      sentence: `${input.subjectTitle} için bugün ${blockMinutes} dakikalık ikinci bir blok ayır.`,
    };
  }

  if (input.mode === "continue") {
    return {
      blockMinutes,
      sentence: `${input.subjectTitle} için bugün ${blockMinutes} dakikalık bir blok daha ayır.`,
    };
  }

  return {
    blockMinutes,
    sentence: `${input.subjectTitle} için bugün ${blockMinutes} dakikalık tek bir blok ayır.`,
  };
}

export function buildPostSessionFeedback(input: {
  subjectTitle: string;
  previousTopTitle?: string | null;
  reflection?: StudySessionReflection;
  sessions: StudySession[];
  nextSession: StudySession;
  now: Date;
  constraints: StudentConstraints;
  exams: Exam[];
  subjectSeeds: SubjectSeed[];
}) {
  const nextSnapshot = buildRiskEngineSnapshot(
    [...input.sessions, input.nextSession],
    input.now,
    input.constraints,
    {
      exams: input.exams,
      subjectSeeds: input.subjectSeeds,
    },
  );

  return buildSessionFeedbackMessage({
    subjectTitle: input.subjectTitle,
    previousTopTitle: input.previousTopTitle,
    nextTopTitle: nextSnapshot.rankedSubjects[0]?.title ?? null,
    reflection: input.reflection,
  });
}

export function buildSessionFeedbackMessage(input: {
  subjectTitle: string;
  previousTopTitle?: string | null;
  nextTopTitle?: string | null;
  reflection?: StudySessionReflection;
}) {
  if (input.nextTopTitle && input.previousTopTitle && input.nextTopTitle !== input.previousTopTitle) {
    return `${input.subjectTitle} bloğu kaydedildi. Günün doğal odağı şimdi ${input.nextTopTitle} tarafına kayabilir.`;
  }

  if (input.reflection === "stuck") {
    return `${input.subjectTitle} bloğu kaydedildi. Öncelikler güncellendi; bir sonraki turda daha dar bir kaynak seçimi iyi gelebilir.`;
  }

  if (input.reflection === "good") {
    return `${input.subjectTitle} bloğu kaydedildi. Öncelikler güncellendi; bu dersin aciliyeti biraz daha dengeli görünüyor.`;
  }

  if (input.reflection === "surface") {
    return `${input.subjectTitle} bloğu kaydedildi. Öncelikler güncellendi; bir sonraki blokta daha net bir konu seçmek iyi olabilir.`;
  }

  return `${input.subjectTitle} bloğu kaydedildi. Öncelikler güncellendi; yeni sıralamayı burada görebilirsin.`;
}
