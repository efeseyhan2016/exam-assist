import { clamp } from "@/lib/time";
import {
  DifficultyCalibrationAnswer,
  Exam,
  PreparednessAnswer,
  ResourceReadinessAnswer,
  SubjectCalibrationAnswers,
  SubjectSeed,
} from "@/lib/types";

export interface RawSubjectCalibrationInput {
  difficultyRaw?: DifficultyCalibrationAnswer | null;
  resourceReadinessRaw?: ResourceReadinessAnswer | null;
  preparednessRaw?: PreparednessAnswer | null;
}

export interface SubjectSetupContext {
  exam: Pick<Exam, "subjectId" | "title" | "shortLabel">;
}

const DEFAULT_PRACTICE_NEED = 2.5;
const DEFAULT_DIFFICULTY = 3.0;
const DEFAULT_RESOURCE_FRICTION = 2.5;
const DEFAULT_RELIEF_FACTOR = 0.25;
const DEFAULT_INITIAL_STUDIED_CREDIT = 0;

const difficultyMap: Record<DifficultyCalibrationAnswer, number> = {
  az: 2.0,
  orta: 3.5,
  zor: 4.8,
};

const resourceFrictionMap: Record<ResourceReadinessAnswer, number> = {
  hazir: 1.2,
  kismen: 2.8,
  eksik: 4.2,
};

const preparednessMap: Record<
  PreparednessAnswer,
  { reliefFactor: number; targetHoursMultiplier: number }
> = {
  iyi: { reliefFactor: 0.75, targetHoursMultiplier: 0.4 },
  biraz: { reliefFactor: 0.35, targetHoursMultiplier: 0.15 },
  az: { reliefFactor: 0.1, targetHoursMultiplier: 0 },
};

export function normalizeCalibrationAnswers(
  rawAnswers: RawSubjectCalibrationInput,
): SubjectCalibrationAnswers {
  return {
    difficultyRaw: rawAnswers.difficultyRaw ?? null,
    resourceReadinessRaw: rawAnswers.resourceReadinessRaw ?? null,
    preparednessRaw: rawAnswers.preparednessRaw ?? null,
  };
}

export function mapDifficulty(raw: DifficultyCalibrationAnswer | null) {
  return raw ? difficultyMap[raw] : DEFAULT_DIFFICULTY;
}

export function mapResourceFriction(raw: ResourceReadinessAnswer | null) {
  return raw ? resourceFrictionMap[raw] : DEFAULT_RESOURCE_FRICTION;
}

export function deriveContentLoad(difficulty: number, resourceFriction: number) {
  return Number(clamp(difficulty * 0.8 + resourceFriction * 0.2, 1, 5).toFixed(2));
}

export function deriveTargetHours(difficulty: number) {
  if (difficulty <= 2.0) {
    return 4.0;
  }
  if (difficulty <= 3.0) {
    return 6.0;
  }
  if (difficulty <= 3.8) {
    return 8.0;
  }
  if (difficulty <= 4.5) {
    return 11.0;
  }
  return 14.0;
}

export function mapPreparedness(
  raw: PreparednessAnswer | null,
  targetHours: number,
) {
  if (!raw) {
    return {
      reliefFactor: DEFAULT_RELIEF_FACTOR,
      initialStudiedCredit: DEFAULT_INITIAL_STUDIED_CREDIT,
    };
  }

  const selected = preparednessMap[raw];

  return {
    reliefFactor: selected.reliefFactor,
    initialStudiedCredit: Number(
      (targetHours * selected.targetHoursMultiplier).toFixed(2),
    ),
  };
}

export function rawAnswersToSubjectSeed(
  rawAnswers: RawSubjectCalibrationInput,
  context: SubjectSetupContext,
): SubjectSeed {
  const calibration = normalizeCalibrationAnswers(rawAnswers);
  const difficulty = mapDifficulty(calibration.difficultyRaw);
  const resourceFriction = mapResourceFriction(calibration.resourceReadinessRaw);
  const targetHours = deriveTargetHours(difficulty);
  const { reliefFactor, initialStudiedCredit } = mapPreparedness(
    calibration.preparednessRaw,
    targetHours,
  );

  return {
    id: context.exam.subjectId,
    title: context.exam.title,
    shortLabel: context.exam.shortLabel,
    contentLoad: deriveContentLoad(difficulty, resourceFriction),
    difficulty,
    practiceNeed: DEFAULT_PRACTICE_NEED,
    resourceFriction,
    reliefFactor,
    targetHours,
    initialStudiedCredit,
    calibration,
  };
}
