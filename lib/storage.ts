import {
  DifficultyCalibrationAnswer,
  Exam,
  PreparednessAnswer,
  PersistedOnboardingState,
  ResourceItem,
  ResourceReadinessAnswer,
  ScheduleItem,
  StudentConstraints,
  StudyNote,
  StudySessionReflection,
  StudySession,
  SubjectSeed,
  SubjectCalibrationAnswers,
  UserProfile,
  ImportSelectionMemoryEntry,
} from "@/lib/types";
import { studentConstraints } from "@/lib/seed-data";

export const STORAGE_KEYS = {
  onboarding: "exam-command-center:onboarding",
  scheduleItems: "exam-command-center:schedule-items",
  studySessions: "exam-command-center:study-sessions",
  userProfile: "examassist_user_profile",
  exams: "examassist_exams",
  subjectSeeds: "examassist_subject_seeds",
  constraints: "examassist_constraints",
  resources: "examassist_resources",
  importSelectionHistory: "examassist_import_selection_history",
  studyNotes: "examassist_study_notes",
} as const;

function parseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function parseUnknownJson(raw: string | null): unknown {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isValidDateString(value: unknown): value is string {
  return isNonEmptyString(value) && Number.isFinite(Date.parse(value));
}

function isOneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
): value is T {
  return typeof value === "string" && allowed.includes(value as T);
}

function sanitizeUserProfile(value: unknown): UserProfile | null {
  if (!isRecord(value)) {
    return null;
  }

  if (!isValidDateString(value.setupCompletedAt)) {
    return null;
  }

  if (!isOneOf(value.language, ["tr", "en"])) {
    return null;
  }

  const classYear = isOneOf(value.classYear, [
    "",
    "hazirlik",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6+",
    "lisansustu",
  ])
    ? value.classYear
    : "";

  const knownLanguages = Array.isArray(value.knownLanguages)
    ? value.knownLanguages.filter((language): language is UserProfile["knownLanguages"][number] =>
        isOneOf(language, ["tr", "en", "de", "fr", "es", "it", "ar", "ru"]),
      )
    : [];

  return {
    name: typeof value.name === "string" ? value.name : "",
    setupCompletedAt: value.setupCompletedAt,
    language: value.language,
    university: typeof value.university === "string" ? value.university : "",
    department: typeof value.department === "string" ? value.department : "",
    classYear,
    knownLanguages: [...new Set(knownLanguages)],
  };
}

function sanitizeExam(value: unknown): Exam | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    !isNonEmptyString(value.id) ||
    !isNonEmptyString(value.subjectId) ||
    !isNonEmptyString(value.title) ||
    !isNonEmptyString(value.shortLabel) ||
    !isValidDateString(value.scheduledAt)
  ) {
    return null;
  }

  return {
    id: value.id,
    subjectId: value.subjectId,
    title: value.title,
    shortLabel: value.shortLabel,
    scheduledAt: value.scheduledAt,
  };
}

function sanitizeCalibrationAnswers(
  value: unknown,
): SubjectCalibrationAnswers | null {
  if (value === undefined) {
    return {
      difficultyRaw: null,
      resourceReadinessRaw: null,
      preparednessRaw: null,
    };
  }

  if (!isRecord(value)) {
    return null;
  }

  const difficultyRaw = isOneOf<DifficultyCalibrationAnswer>(
    value.difficultyRaw,
    ["az", "orta", "zor"],
  )
    ? value.difficultyRaw
    : null;
  const resourceReadinessRaw = isOneOf<ResourceReadinessAnswer>(
    value.resourceReadinessRaw,
    ["hazir", "kismen", "eksik"],
  )
    ? value.resourceReadinessRaw
    : null;
  const preparednessRaw = isOneOf<PreparednessAnswer>(
    value.preparednessRaw,
    ["iyi", "biraz", "az"],
  )
    ? value.preparednessRaw
    : null;

  return {
    difficultyRaw,
    resourceReadinessRaw,
    preparednessRaw,
  };
}

function sanitizeSubjectSeed(value: unknown): SubjectSeed | null {
  if (!isRecord(value)) {
    return null;
  }

  const calibration = sanitizeCalibrationAnswers(value.calibration);

  if (
    !isNonEmptyString(value.id) ||
    !isNonEmptyString(value.title) ||
    !isNonEmptyString(value.shortLabel) ||
    !isFiniteNumber(value.contentLoad) ||
    !isFiniteNumber(value.difficulty) ||
    !isFiniteNumber(value.practiceNeed) ||
    !isFiniteNumber(value.resourceFriction) ||
    !isFiniteNumber(value.reliefFactor) ||
    !isFiniteNumber(value.targetHours) ||
    value.contentLoad < 0 ||
    value.contentLoad > 5 ||
    value.difficulty < 0 ||
    value.difficulty > 5 ||
    value.practiceNeed < 0 ||
    value.practiceNeed > 5 ||
    value.resourceFriction < 0 ||
    value.resourceFriction > 5 ||
    value.reliefFactor < 0 ||
    value.reliefFactor > 1.5 ||
    value.targetHours <= 0 ||
    calibration === null
  ) {
    return null;
  }

  const initialStudiedCredit = isFiniteNumber(value.initialStudiedCredit)
    ? value.initialStudiedCredit
    : 0;

  if (
    initialStudiedCredit < 0 ||
    initialStudiedCredit > value.targetHours
  ) {
    return null;
  }

  return {
    id: value.id,
    title: value.title,
    shortLabel: value.shortLabel,
    contentLoad: value.contentLoad,
    difficulty: value.difficulty,
    practiceNeed: value.practiceNeed,
    resourceFriction: value.resourceFriction,
    reliefFactor: value.reliefFactor,
    targetHours: value.targetHours,
    initialStudiedCredit,
    calibration,
  };
}

function sanitizeImportSelectionMemoryEntry(
  value: unknown,
): ImportSelectionMemoryEntry | null {
  if (!isRecord(value)) {
    return null;
  }

  const titleTokens = Array.isArray(value.titleTokens)
    ? value.titleTokens.filter((token): token is string => isNonEmptyString(token))
    : [];

  if (
    !isOneOf(value.titleLanguage, ["tr", "en", "mixed"]) ||
    typeof value.titleFingerprint !== "string" ||
    typeof value.courseCode !== "string" ||
    typeof value.departmentHint !== "string"
  ) {
    return null;
  }

  const selectedCount = isFiniteNumber(value.selectedCount)
    ? Math.max(0, Math.round(value.selectedCount))
    : 1;
  const dismissedCount = isFiniteNumber(value.dismissedCount)
    ? Math.max(0, Math.round(value.dismissedCount))
    : 0;

  return {
    titleFingerprint: value.titleFingerprint,
    titleTokens,
    courseCode: value.courseCode,
    departmentHint: value.departmentHint,
    titleLanguage: value.titleLanguage,
    selectedCount,
    dismissedCount,
    profileUniversity:
      typeof value.profileUniversity === "string" ? value.profileUniversity : "",
    profileDepartment:
      typeof value.profileDepartment === "string" ? value.profileDepartment : "",
  };
}

function sanitizeStudyNote(value: unknown): StudyNote | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    !isNonEmptyString(value.id) ||
    !isNonEmptyString(value.subjectId) ||
    !isNonEmptyString(value.content) ||
    !isValidDateString(value.createdAt) ||
    !isValidDateString(value.updatedAt) ||
    typeof value.pinned !== "boolean"
  ) {
    return null;
  }

  if (value.sessionId !== undefined && !isNonEmptyString(value.sessionId)) {
    return null;
  }

  return {
    id: value.id,
    subjectId: value.subjectId,
    content: value.content,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    pinned: value.pinned,
    sessionId: value.sessionId,
  };
}

function sanitizeStudySession(value: unknown): StudySession | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    !isNonEmptyString(value.id) ||
    !isNonEmptyString(value.subjectId) ||
    !isFiniteNumber(value.minutes) ||
    value.minutes <= 0 ||
    !isValidDateString(value.createdAt)
  ) {
    return null;
  }

  const reflection = isOneOf<StudySessionReflection>(value.reflection, [
    "good",
    "surface",
    "stuck",
  ])
    ? value.reflection
    : undefined;

  if (value.notes !== undefined && typeof value.notes !== "string") {
    return null;
  }

  return {
    id: value.id,
    subjectId: value.subjectId,
    minutes: value.minutes,
    createdAt: value.createdAt,
    notes: value.notes?.trim() ? value.notes.trim() : undefined,
    reflection,
  };
}

function sanitizeResourceItem(value: unknown): ResourceItem | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    !isNonEmptyString(value.id) ||
    !isNonEmptyString(value.subjectId) ||
    !isNonEmptyString(value.title) ||
    !isOneOf(value.type, ["pdf", "doc", "other"]) ||
    !isFiniteNumber(value.pageCount) ||
    !isFiniteNumber(value.pagesRead) ||
    !isFiniteNumber(value.fileSizeBytes) ||
    !isValidDateString(value.uploadedAt)
  ) {
    return null;
  }

  if (
    value.pageCount < 0 ||
    value.pagesRead < 0 ||
    value.pagesRead > value.pageCount ||
    value.fileSizeBytes < 0
  ) {
    return null;
  }

  const contentHint =
    value.contentHint === undefined || isOneOf(value.contentHint, [
      "formula-heavy",
      "prose-heavy",
      "mixed",
      "unknown",
    ])
      ? value.contentHint
      : undefined;

  const lastActiveAt = isValidDateString(value.lastActiveAt)
    ? value.lastActiveAt
    : undefined;
  const engagementCount = isFiniteNumber(value.engagementCount)
    ? Math.max(0, Math.round(value.engagementCount))
    : 0;
  const revisitCount = isFiniteNumber(value.revisitCount)
    ? Math.max(0, Math.round(value.revisitCount))
    : 0;

  return {
    id: value.id,
    subjectId: value.subjectId,
    title: value.title,
    type: value.type,
    pageCount: value.pageCount,
    pagesRead: value.pagesRead,
    fileSizeBytes: value.fileSizeBytes,
    uploadedAt: value.uploadedAt,
    contentHint,
    lastActiveAt,
    engagementCount,
    revisitCount,
  };
}

function sanitizeConstraints(value: unknown): StudentConstraints {
  if (!isRecord(value)) {
    return studentConstraints;
  }

  return {
    dailyStudyGoalHours:
      isFiniteNumber(value.dailyStudyGoalHours) &&
      value.dailyStudyGoalHours > 0 &&
      value.dailyStudyGoalHours <= 24
        ? value.dailyStudyGoalHours
        : studentConstraints.dailyStudyGoalHours,
    studyDayStartHour:
      isFiniteNumber(value.studyDayStartHour) &&
      value.studyDayStartHour >= 0 &&
      value.studyDayStartHour <= 23
        ? value.studyDayStartHour
        : studentConstraints.studyDayStartHour,
    standardStudyDayEndHour:
      isFiniteNumber(value.standardStudyDayEndHour) &&
      value.standardStudyDayEndHour >= 0 &&
      value.standardStudyDayEndHour <= 23
        ? value.standardStudyDayEndHour
        : studentConstraints.standardStudyDayEndHour,
    morningSleepCutoffHour:
      isFiniteNumber(value.morningSleepCutoffHour) &&
      value.morningSleepCutoffHour >= 0 &&
      value.morningSleepCutoffHour <= 23
        ? value.morningSleepCutoffHour
        : studentConstraints.morningSleepCutoffHour,
    sleepTargetHours:
      isFiniteNumber(value.sleepTargetHours) &&
      value.sleepTargetHours > 0 &&
      value.sleepTargetHours <= 24
        ? value.sleepTargetHours
        : studentConstraints.sleepTargetHours,
    wakeBufferMinutes:
      isFiniteNumber(value.wakeBufferMinutes) &&
      value.wakeBufferMinutes >= 0 &&
      value.wakeBufferMinutes <= 720
        ? value.wakeBufferMinutes
        : studentConstraints.wakeBufferMinutes,
  };
}

export function readStudySessions(): StudySession[] {
  if (typeof window === "undefined") {
    return [];
  }

  const parsed = parseUnknownJson(window.localStorage.getItem(STORAGE_KEYS.studySessions));

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .map((session) => sanitizeStudySession(session))
    .filter((session): session is StudySession => session !== null);
}

export function readScheduleItems(): ScheduleItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  return parseJson<ScheduleItem[]>(
    window.localStorage.getItem(STORAGE_KEYS.scheduleItems),
    [],
  );
}

export function writeScheduleItems(items: ScheduleItem[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEYS.scheduleItems, JSON.stringify(items));
}

export function writeStudySessions(sessions: StudySession[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    STORAGE_KEYS.studySessions,
    JSON.stringify(sessions),
  );
}

export function readOnboardingState(): PersistedOnboardingState | null {
  if (typeof window === "undefined") {
    return null;
  }

  return parseJson<PersistedOnboardingState | null>(
    window.localStorage.getItem(STORAGE_KEYS.onboarding),
    null,
  );
}

export function writeOnboardingState(state: PersistedOnboardingState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEYS.onboarding, JSON.stringify(state));
}

export function readUserProfile(): UserProfile | null {
  if (typeof window === "undefined") {
    return null;
  }

  return sanitizeUserProfile(
    parseUnknownJson(window.localStorage.getItem(STORAGE_KEYS.userProfile)),
  );
}

export function writeUserProfile(profile: UserProfile) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEYS.userProfile, JSON.stringify(profile));
}

export function readPlanningExams(): Exam[] {
  if (typeof window === "undefined") {
    return [];
  }

  const parsed = parseUnknownJson(window.localStorage.getItem(STORAGE_KEYS.exams));

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .map((exam) => sanitizeExam(exam))
    .filter((exam): exam is Exam => exam !== null);
}

export function writePlanningExams(exams: Exam[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEYS.exams, JSON.stringify(exams));
}

export function readPlanningSubjectSeeds(): SubjectSeed[] {
  if (typeof window === "undefined") {
    return [];
  }

  const parsed = parseUnknownJson(
    window.localStorage.getItem(STORAGE_KEYS.subjectSeeds),
  );

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .map((subjectSeed) => sanitizeSubjectSeed(subjectSeed))
    .filter((subjectSeed): subjectSeed is SubjectSeed => subjectSeed !== null);
}

export function writePlanningSubjectSeeds(subjectSeeds: SubjectSeed[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    STORAGE_KEYS.subjectSeeds,
    JSON.stringify(subjectSeeds),
  );
}

export function readPlanningConstraints(): StudentConstraints {
  if (typeof window === "undefined") {
    return studentConstraints;
  }

  return sanitizeConstraints(
    parseUnknownJson(window.localStorage.getItem(STORAGE_KEYS.constraints)),
  );
}

export function writePlanningConstraints(constraints: StudentConstraints) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    STORAGE_KEYS.constraints,
    JSON.stringify(constraints),
  );
}

export function readImportSelectionHistory(): ImportSelectionMemoryEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  const parsed = parseUnknownJson(
    window.localStorage.getItem(STORAGE_KEYS.importSelectionHistory),
  );

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .map((entry) => sanitizeImportSelectionMemoryEntry(entry))
    .filter((entry): entry is ImportSelectionMemoryEntry => entry !== null);
}

export function writeImportSelectionHistory(
  history: ImportSelectionMemoryEntry[],
) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    STORAGE_KEYS.importSelectionHistory,
    JSON.stringify(history),
  );
}

export function readResources(): ResourceItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  const parsed = parseUnknownJson(window.localStorage.getItem(STORAGE_KEYS.resources));

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .map((item) => sanitizeResourceItem(item))
    .filter((item): item is ResourceItem => item !== null);
}

export function writeResources(resources: ResourceItem[]): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEYS.resources, JSON.stringify(resources));
}

// ─── Study Notes ─────────────────────────────────────────────────────────────

export function readStudyNotes(): StudyNote[] {
  if (typeof window === "undefined") {
    return [];
  }

  const parsed = parseUnknownJson(window.localStorage.getItem(STORAGE_KEYS.studyNotes));

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .map((note) => sanitizeStudyNote(note))
    .filter((note): note is StudyNote => note !== null);
}

export function writeStudyNotes(notes: StudyNote[]): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEYS.studyNotes, JSON.stringify(notes));
}
