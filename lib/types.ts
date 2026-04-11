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
export type StudySessionReflection = "good" | "surface" | "stuck";

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
  topic?: string;
  reflection?: StudySessionReflection;
  recommendationId?: string;
}

export interface ExamOutcome {
  id: string;
  examId: string;
  subjectId: SubjectId;
  score?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type AcademicEventType =
  | "exam"
  | "assignment_due"
  | "material_update"
  | "announcement"
  | "grade_release"
  | "deadline_change";

export type AcademicEventSource =
  | "manual"
  | "file_import"
  | "portal_import"
  | "resource_analysis"
  | "system_generation";

export type AcademicEventProvenance =
  | "official_imported"
  | "student_entered"
  | "system_derived";

export type AcademicEventSignificance = "low" | "medium" | "high";
export type AcademicEventPlanningImpact = "none" | "soft" | "strong";
export type AcademicEventStatus = "active" | "resolved" | "dismissed" | "expired";

export interface AcademicEvent {
  id: string;
  courseId: string;
  type: AcademicEventType;
  title: string;
  summary?: string;
  occurredAt: string;
  dueAt?: string;
  source: AcademicEventSource;
  provenance: AcademicEventProvenance;
  significance: AcademicEventSignificance;
  planningImpact: AcademicEventPlanningImpact;
  status: AcademicEventStatus;
  metadata?: Record<string, unknown>;
}

export interface StudyLaunchDraft {
  subjectId: SubjectId;
  minutes: number;
  topic?: string;
  source: "brief" | "resource" | "onboarding";
  sourceLabel?: string;
  recommendationId?: string;
}

export interface RecommendationEvent {
  id: string;
  subjectId: SubjectId;
  source: StudyLaunchDraft["source"];
  sourceLabel?: string;
  topic?: string;
  recommendedMinutes: number;
  shownAt: string;
  acceptedAt?: string;
  convertedAt?: string;
  sessionId?: string;
}

export interface StudyNote {
  id: string;
  subjectId: SubjectId;
  content: string;
  createdAt: string;
  updatedAt: string;
  pinned: boolean;
  /** Optional link to a study session — enables "session-attached notes" */
  sessionId?: string;
}

export interface PersistedOnboardingState {
  completedAt: string;
}

export interface PersistedCloudStateSnapshot {
  onboarding: PersistedOnboardingState | null;
  scheduleItems: ScheduleItem[];
  studySessions: StudySession[];
  userProfile: UserProfile | null;
  exams: Exam[];
  subjectSeeds: SubjectSeed[];
  constraints: StudentConstraints;
  resources: ResourceItem[];
  importSelectionHistory: ImportSelectionMemoryEntry[];
  studyNotes: StudyNote[];
  recommendationEvents: RecommendationEvent[];
  examOutcomes: ExamOutcome[];
  academicEvents: AcademicEvent[];
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

export type ScheduleItemKind = "exam" | "deadline" | "assignment" | "project";

export interface ScheduleItem {
  id: string;
  title: string;
  shortLabel: string;
  scheduledAt: string;
  kind: ScheduleItemKind;
  source: "seed" | "manual";
  notes?: string;
  calibration?: SubjectCalibrationAnswers;
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
export type ResourceKindHint =
  | "questions"
  | "summary"
  | "slides"
  | "notes"
  | "topic-notes"
  | "outline"
  | "brief"
  | "case"
  | "book"
  | "unknown";

export type StudyMode =
  | "problem"
  | "conceptual"
  | "interpretive"
  | "memorization"
  | "mixed";
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
  resourceKindHint?: ResourceKindHint;
  topicHints?: string[];
  storageProvider?: "local" | "supabase";
  cloudPath?: string;
  mimeType?: string;
  lastActiveAt?: string;
  engagementCount?: number;
  revisitCount?: number;
}
