import { getExamProximityProfile } from "@/lib/exam-proximity";
import { buildRiskEngineSnapshot } from "@/lib/risk";
import {
  Exam,
  RiskLabel,
  StudyLaunchDraft,
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
  lastReflection?: StudySessionReflection,
  recommendationAdjustment = 0,
) {
  const proximity = getExamProximityProfile(hoursUntilExam);
  const safeRemaining = Math.max(remainingGoalMinutes, 0);
  let base: number;

  if (safeRemaining === 0) {
    base = proximity.prefersQuickReview ? 20 : 25;
  } else if (proximity.prefersQuickReview) {
    base = Math.min(30, clampBlockMinutes(Math.min(safeRemaining, 30)));
  } else if (proximity.prefersConsolidation) {
    base = Math.min(35, clampBlockMinutes(Math.min(safeRemaining, 35)));
  } else if (riskLabel === "Critical" && safeRemaining >= 60) {
    base = 60;
  } else if (riskLabel === "High" && safeRemaining >= 45) {
    base = 45;
  } else if (safeRemaining >= 45) {
    base = 45;
  } else if (safeRemaining >= 30) {
    base = 30;
  } else {
    base = clampBlockMinutes(safeRemaining);
  }

  if (lastReflection === "stuck") {
    return Math.min(base, 30);
  }

  if (lastReflection === "surface") {
    return Math.min(base, 35);
  }

  return clampBlockMinutes(base + recommendationAdjustment);
}

export function buildStudyRecommendationSentence(input: {
  subjectTitle: string;
  hoursUntilExam: number;
  remainingGoalMinutes: number;
  riskLabel: RiskLabel;
  mode?: "start" | "continue" | "switch";
  lastReflection?: StudySessionReflection;
  recommendationAdjustment?: number;
}) {
  const blockMinutes = getRecommendedStudyBlockMinutes(
    input.hoursUntilExam,
    input.remainingGoalMinutes,
    input.riskLabel,
    input.lastReflection,
    input.recommendationAdjustment,
  );
  const proximity = getExamProximityProfile(input.hoursUntilExam);

  if (input.lastReflection === "stuck") {
    return {
      blockMinutes,
      sentence: `${input.subjectTitle} için bugün ${blockMinutes} dakikalık tek bir dar konu bloğu ayır.`,
    };
  }

  if (input.lastReflection === "surface") {
    return {
      blockMinutes,
      sentence: `${input.subjectTitle} için bugün ${blockMinutes} dakikalık daha net bir konu bloğu ayır.`,
    };
  }

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

export function buildStudyLaunchDraft(input: {
  subjectId: string;
  subjectTitle: string;
  hoursUntilExam: number;
  remainingGoalMinutes: number;
  riskLabel: RiskLabel;
  mode?: "start" | "continue" | "switch";
  topic?: string;
  source: StudyLaunchDraft["source"];
  sourceLabel?: string;
  lastReflection?: StudySessionReflection;
  recommendationAdjustment?: number;
}): StudyLaunchDraft {
  const recommendation = buildStudyRecommendationSentence({
    subjectTitle: input.subjectTitle,
    hoursUntilExam: input.hoursUntilExam,
    remainingGoalMinutes: input.remainingGoalMinutes,
    riskLabel: input.riskLabel,
    mode: input.mode,
    lastReflection: input.lastReflection,
    recommendationAdjustment: input.recommendationAdjustment,
  });

  return {
    subjectId: input.subjectId,
    minutes: recommendation.blockMinutes,
    topic: input.topic,
    source: input.source,
    sourceLabel: input.sourceLabel ?? recommendation.sentence,
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
