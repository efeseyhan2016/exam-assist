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

export function getExamOutcomeStatus(outcome: ExamOutcome | undefined) {
  if (!outcome) {
    return "Bitti";
  }

  if (outcome.score !== undefined) {
    return "Not girildi";
  }

  return "Değerlendirme var";
}
