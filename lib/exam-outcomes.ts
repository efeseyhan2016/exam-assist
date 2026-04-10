import { ExamOutcome } from "@/lib/types";

interface TimelineExamLike {
  id: string;
  scheduledAt: string;
  scheduledAtDate?: Date;
}

function resolveScheduledDate(exam: TimelineExamLike) {
  return exam.scheduledAtDate ?? new Date(exam.scheduledAt);
}

export function splitExamTimeline<T extends TimelineExamLike>(
  timeline: T[],
  now: Date,
) {
  const upcoming: T[] = [];
  const completed: T[] = [];

  for (const exam of timeline) {
    if (resolveScheduledDate(exam).getTime() > now.getTime()) {
      upcoming.push(exam);
    } else {
      completed.push(exam);
    }
  }

  return {
    upcoming: [...upcoming].sort(
      (left, right) =>
        resolveScheduledDate(left).getTime() - resolveScheduledDate(right).getTime(),
    ),
    completed: [...completed].sort(
      (left, right) =>
        resolveScheduledDate(right).getTime() - resolveScheduledDate(left).getTime(),
    ),
  };
}

export function indexExamOutcomesByExamId(outcomes: ExamOutcome[]) {
  return Object.fromEntries(outcomes.map((outcome) => [outcome.examId, outcome]));
}

export interface ExamOutcomeDraft {
  score: string;
  notes: string;
}

interface BuildExamOutcomeDraftsOptions {
  dirtyExamIds?: ReadonlySet<string>;
}

function createDraftFromOutcome(outcome: ExamOutcome | undefined): ExamOutcomeDraft {
  return {
    score: outcome?.score !== undefined ? String(outcome.score) : "",
    notes: outcome?.notes ?? "",
  };
}

export function buildExamOutcomeDrafts<T extends { id: string }>(
  exams: T[],
  outcomesByExamId: Record<string, ExamOutcome | undefined>,
  currentDrafts: Record<string, ExamOutcomeDraft> = {},
  options: BuildExamOutcomeDraftsOptions = {},
) {
  return Object.fromEntries(
    exams.map((exam) => {
      const outcome = outcomesByExamId[exam.id];
      const existingDraft = currentDrafts[exam.id];
      const shouldPreserveDraft =
        existingDraft !== undefined && options.dirtyExamIds?.has(exam.id);

      return [
        exam.id,
        shouldPreserveDraft
          ? existingDraft
          : outcome
            ? createDraftFromOutcome(outcome)
            : existingDraft ?? createDraftFromOutcome(outcome),
      ];
    }),
  );
}

export function getExamOutcomeStatus(outcome: ExamOutcome | undefined) {
  if (!outcome) {
    return "Bitti";
  }

  if (outcome.score !== undefined) {
    return "Not girildi";
  }

  return "Değerlendirme var";
}
