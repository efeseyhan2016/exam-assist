export type SubjectId =
  | "ias"
  | "retail-marketing"
  | "service-marketing"
  | "quality-management"
  | "ait"
  | "pom";

export type RiskLabel = "Low" | "Moderate" | "High" | "Critical";

export interface Exam {
  id: string;
  subjectId: SubjectId;
  title: string;
  shortLabel: string;
  scheduledAt: string;
}

export interface SubjectSeed {
  id: SubjectId;
  title: string;
  shortLabel: string;
  contentLoad: number;
  difficulty: number;
  practiceNeed: number;
  resourceFriction: number;
  reliefFactor: number;
  targetHours: number;
}

export interface StudentConstraints {
  dailyStudyGoalHours: number;
  studyDayStartHour: number;
  standardStudyDayEndHour: number;
  morningSleepCutoffHour: number;
  sleepTargetHours: number;
  wakeBufferMinutes: number;
}

export interface StudySession {
  id: string;
  subjectId: SubjectId;
  minutes: number;
  createdAt: string;
  notes?: string;
}

export interface PersistedOnboardingState {
  completedAt: string;
}

export type ScheduleItemKind = "exam" | "deadline";

export interface ScheduleItem {
  id: string;
  title: string;
  shortLabel: string;
  scheduledAt: string;
  kind: ScheduleItemKind;
  source: "seed" | "manual";
  notes?: string;
}

export interface RiskBreakdown {
  baseComplexity: number;
  urgencyPressure: number;
  capacityPressure: number;
  progressGap: number;
  resourceGap: number;
  sleepPenalty: number;
  reliefBoost: number;
  resourceCompletionRate: number;
}

export interface RankedSubjectRisk {
  subjectId: SubjectId;
  title: string;
  shortLabel: string;
  examTitle: string;
  examDate: string;
  hoursStudied: number;
  targetHours: number;
  remainingTargetHours: number;
  effectiveStudyHoursLeft: number;
  hoursUntilExam: number;
  score: number;
  label: RiskLabel;
  explanation: string;
  breakdown: RiskBreakdown;
}

export interface RiskEngineSnapshot {
  calculatedAt: string;
  rankedSubjects: RankedSubjectRisk[];
  nextExam: Exam | null;
  totalRemainingTargetHours: number;
}
