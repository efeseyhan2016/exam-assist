import {
  exams as seededExams,
  studentConstraints as seededConstraints,
  subjectSeeds as seededSubjectSeeds,
  workspaceProfile,
} from "@/lib/seed-data";
import {
  readPlanningConstraints,
  readPlanningExams,
  readPlanningSubjectSeeds,
  readScheduleItems,
  readUserProfile,
} from "@/lib/storage";
import { rawAnswersToSubjectSeed } from "@/lib/planning-input";
import {
  Exam,
  ScheduleItem,
  StudentConstraints,
  SubjectSeed,
  UserProfile,
} from "@/lib/types";

export interface PlanningRuntimeProfile {
  setupCompletedAt: string;
  fullName: string;
  city: string;
  timezone: string;
  language: "tr" | "en";
  university: string;
  department: string;
  classYear: UserProfile["classYear"];
  knownLanguages: UserProfile["knownLanguages"];
}

export interface PlanningRuntimeInputs {
  exams: Exam[];
  subjectSeeds: SubjectSeed[];
  constraints: StudentConstraints;
  profile: PlanningRuntimeProfile;
}

interface ResolvePlanningRuntimeInput {
  planningExams?: Exam[];
  planningSubjectSeeds?: SubjectSeed[];
  planningConstraints?: StudentConstraints | null;
  planningProfile?: UserProfile | null;
  scheduleItems?: ScheduleItem[];
}

export const SCHEDULE_PLANNING_EXAM_PREFIX = "schedule-exam:";

function getScheduleExamSubjectId(item: ScheduleItem) {
  return `schedule:${item.id}`;
}

export function getScheduleItemIdFromPlanningExamId(examId: string) {
  return examId.startsWith(SCHEDULE_PLANNING_EXAM_PREFIX)
    ? examId.slice(SCHEDULE_PLANNING_EXAM_PREFIX.length)
    : null;
}

export function scheduleItemToPlanningExam(item: ScheduleItem): Exam {
  const subjectId = getScheduleExamSubjectId(item);

  return {
    id: `${SCHEDULE_PLANNING_EXAM_PREFIX}${item.id}`,
    subjectId,
    title: item.title,
    shortLabel: item.shortLabel,
    scheduledAt: item.scheduledAt,
  };
}

export function scheduleItemToSubjectSeed(item: ScheduleItem): SubjectSeed {
  const exam = scheduleItemToPlanningExam(item);

  return rawAnswersToSubjectSeed(item.calibration ?? {}, {
    exam: {
      subjectId: exam.subjectId,
      title: exam.title,
      shortLabel: exam.shortLabel,
    },
  });
}

function mergeScheduleExamsIntoPlanning(
  planningExams: Exam[],
  planningSubjectSeeds: SubjectSeed[],
  scheduleItems: ScheduleItem[] = [],
) {
  const manualExamItems = scheduleItems.filter(
    (item) => item.kind === "exam" && item.source === "manual",
  );
  const existingSubjectIds = new Set(planningSubjectSeeds.map((seed) => seed.id));
  const existingExamIds = new Set(planningExams.map((exam) => exam.id));
  const scheduleExams = manualExamItems
    .map((item) => scheduleItemToPlanningExam(item))
    .filter((exam) => !existingExamIds.has(exam.id));
  const scheduleSubjectSeeds = manualExamItems
    .map((item) => scheduleItemToSubjectSeed(item))
    .filter((seed) => !existingSubjectIds.has(seed.id));

  return {
    exams: [...planningExams, ...scheduleExams].sort(
      (left, right) =>
        new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime(),
    ),
    subjectSeeds: [...planningSubjectSeeds, ...scheduleSubjectSeeds],
  };
}

export function resolvePlanningRuntimeInputs(
  input: ResolvePlanningRuntimeInput = {},
): PlanningRuntimeInputs {
  const hasExplicitPlanningFoundation =
    Boolean(input.planningProfile?.setupCompletedAt) ||
    Boolean(input.planningExams && input.planningExams.length > 0) ||
    Boolean(input.planningSubjectSeeds && input.planningSubjectSeeds.length > 0);
  const foundationExams =
    hasExplicitPlanningFoundation
      ? input.planningExams ?? []
      : seededExams;
  const foundationSubjectSeeds =
    hasExplicitPlanningFoundation
      ? input.planningSubjectSeeds ?? []
      : seededSubjectSeeds;
  const { exams, subjectSeeds } = mergeScheduleExamsIntoPlanning(
    foundationExams,
    foundationSubjectSeeds,
    input.scheduleItems,
  );
  const constraints = input.planningConstraints ?? seededConstraints;
  const fullName =
    input.planningProfile?.name.trim() || `${workspaceProfile.firstName} ${workspaceProfile.lastName}`;

  return {
    exams,
    subjectSeeds,
    constraints,
    profile: {
      setupCompletedAt:
        input.planningProfile?.setupCompletedAt ?? new Date(0).toISOString(),
      fullName,
      city: workspaceProfile.city,
      timezone: workspaceProfile.timezone,
      language: input.planningProfile?.language ?? "tr",
      university: input.planningProfile?.university ?? "",
      department: input.planningProfile?.department ?? "",
      classYear: input.planningProfile?.classYear ?? "",
      knownLanguages: input.planningProfile?.knownLanguages ?? [],
    },
  };
}

export function readPlanningRuntimeInputs(): PlanningRuntimeInputs {
  return resolvePlanningRuntimeInputs({
    planningExams: readPlanningExams(),
    planningSubjectSeeds: readPlanningSubjectSeeds(),
    planningConstraints: readPlanningConstraints(),
    planningProfile: readUserProfile(),
    scheduleItems: readScheduleItems(),
  });
}
