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
  readUserProfile,
} from "@/lib/storage";
import { Exam, StudentConstraints, SubjectSeed, UserProfile } from "@/lib/types";

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
}

export function resolvePlanningRuntimeInputs(
  input: ResolvePlanningRuntimeInput = {},
): PlanningRuntimeInputs {
  const exams =
    input.planningExams && input.planningExams.length > 0
      ? input.planningExams
      : seededExams;
  const subjectSeeds =
    input.planningSubjectSeeds && input.planningSubjectSeeds.length > 0
      ? input.planningSubjectSeeds
      : seededSubjectSeeds;
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
  });
}
