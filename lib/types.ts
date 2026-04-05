export type SubjectId = string;

export type DifficultyCalibrationAnswer = "az" | "orta" | "zor";
export type ResourceReadinessAnswer = "hazir" | "kismen" | "eksik";
export type PreparednessAnswer = "iyi" | "biraz" | "az";
export type TitleLanguageHint = "tr" | "en" | "mixed";

export interface SubjectCalibrationAnswers {
  difficultyRaw: DifficultyCalibrationAnswer | null;
  resourceReadinessRaw: ResourceReadinessAnswer | null;
  preparednessRaw: PreparednessAnswer | null;
}

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
  initialStudiedCredit: number;
  calibration: SubjectCalibrationAnswers;
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

export interface UserProfile {
  name: string;
  setupCompletedAt: string;
  language: "tr" | "en";
  university: string;
  department: string;
  classYear: "" | "hazirlik" | "1" | "2" | "3" | "4" | "5" | "6+" | "lisansustu";
  knownLanguages: Array<
    "tr" | "en" | "de" | "fr" | "es" | "it" | "ar" | "ru"
  >;
}

export interface ImportSelectionMemoryEntry {
  titleFingerprint: string;
  titleTokens: string[];
  courseCode: string;
  departmentHint: string;
  titleLanguage: TitleLanguageHint;
  selectedCount: number;
  dismissedCount: number;
  profileUniversity: string;
  profileDepartment: string;
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
  portfolioOverloadPressure: number;
  progressGap: number;
  resourceGap: number;
  sleepPenalty: number;
  reliefBoost: number;
  resourceReadinessSignal: number;
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

export type ResourceFileType = "pdf" | "doc" | "other";

export type StudyMode = "practice" | "reading" | "mixed";
export type ContentTypeHint = "formula-heavy" | "prose-heavy" | "mixed" | "unknown";

export interface ResourceItem {
  id: string;
  subjectId: SubjectId;
  title: string;
  type: ResourceFileType;
  pageCount: number;
  pagesRead: number;
  fileSizeBytes: number;
  uploadedAt: string;
  contentHint?: ContentTypeHint;
}
