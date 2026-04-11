import {
  AcademicEvent,
  AcademicEventPlanningImpact,
  AcademicEventProvenance,
  AcademicEventSignificance,
  AcademicEventSource,
  AcademicEventStatus,
  AcademicEventType,
  DifficultyCalibrationAnswer,
  Exam,
  ExamOutcome,
  RecommendationEvent,
  PreparednessAnswer,
  PersistedOnboardingState,
  PersistedCloudStateSnapshot,
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
import { sanitizeTopicHints } from "@/lib/pdf-engine";

export const STORAGE_KEYS = {
  activeScope: "examassist_active_storage_scope",
  legacyScopedMigration: "examassist_legacy_scoped_migration_done",
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
  recommendationEvents: "examassist_recommendation_events",
  examOutcomes: "examassist_exam_outcomes",
  academicEvents: "examassist_academic_events",
} as const;

const SCOPED_STORAGE_KEYS = [
  STORAGE_KEYS.onboarding,
  STORAGE_KEYS.scheduleItems,
  STORAGE_KEYS.studySessions,
  STORAGE_KEYS.userProfile,
  STORAGE_KEYS.exams,
  STORAGE_KEYS.subjectSeeds,
  STORAGE_KEYS.constraints,
  STORAGE_KEYS.resources,
  STORAGE_KEYS.importSelectionHistory,
  STORAGE_KEYS.studyNotes,
  STORAGE_KEYS.recommendationEvents,
  STORAGE_KEYS.examOutcomes,
  STORAGE_KEYS.academicEvents,
] as const;

export const ACADEMIC_EVENTS_CHANGED_EVENT =
  "examassist:academic-events-changed";
export const RECOMMENDATION_EVENTS_CHANGED_EVENT =
  "examassist:recommendation-events-changed";

let cloudSyncSuppressionDepth = 0;

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

function getStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

function dispatchAcademicEventsChanged() {
  if (
    typeof window === "undefined" ||
    typeof window.dispatchEvent !== "function"
  ) {
    return;
  }

  window.dispatchEvent(new Event(ACADEMIC_EVENTS_CHANGED_EVENT));
}

function dispatchRecommendationEventsChanged() {
  if (
    typeof window === "undefined" ||
    typeof window.dispatchEvent !== "function"
  ) {
    return;
  }

  window.dispatchEvent(new Event(RECOMMENDATION_EVENTS_CHANGED_EVENT));
}

function getScopedStorageKey(baseKey: string) {
  const scope = readActiveStorageScope();
  return scope ? `${baseKey}:${scope}` : baseKey;
}

function scheduleCloudStateSync() {
  if (cloudSyncSuppressionDepth > 0 || typeof window === "undefined") {
    return;
  }

  const scope = readActiveStorageScope();
  if (!scope?.startsWith("supabase:")) {
    return;
  }

  void import("@/lib/cloud-state")
    .then((module) => {
      module.scheduleCloudStateSync();
    })
    .catch(() => null);
}

function persistScopedStorageValue(baseKey: string, value: string) {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.setItem(getScopedStorageKey(baseKey), value);
  scheduleCloudStateSync();
}

function removeScopedStorageValue(baseKey: string) {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.removeItem(getScopedStorageKey(baseKey));
  scheduleCloudStateSync();
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

function sanitizeOnboardingState(
  value: unknown,
): PersistedOnboardingState | null {
  if (!isRecord(value) || !isValidDateString(value.completedAt)) {
    return null;
  }

  return {
    completedAt: value.completedAt,
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

function sanitizeScheduleItem(value: unknown): ScheduleItem | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    !isNonEmptyString(value.id) ||
    !isNonEmptyString(value.title) ||
    !isNonEmptyString(value.shortLabel) ||
    !isValidDateString(value.scheduledAt) ||
    !isOneOf(value.kind, ["exam", "deadline", "assignment", "project"]) ||
    !isOneOf(value.source, ["seed", "manual"])
  ) {
    return null;
  }

  const calibration =
    value.calibration === undefined ? null : sanitizeCalibrationAnswers(value.calibration);

  return {
    id: value.id,
    title: value.title,
    shortLabel: value.shortLabel,
    scheduledAt: value.scheduledAt,
    kind: value.kind,
    source: value.source,
    notes: typeof value.notes === "string" && value.notes.trim() ? value.notes.trim() : undefined,
    ...(calibration ? { calibration } : {}),
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

  if (value.topic !== undefined && typeof value.topic !== "string") {
    return null;
  }

  if (value.recommendationId !== undefined && !isNonEmptyString(value.recommendationId)) {
    return null;
  }

  return {
    id: value.id,
    subjectId: value.subjectId,
    minutes: value.minutes,
    createdAt: value.createdAt,
    notes: value.notes?.trim() ? value.notes.trim() : undefined,
    topic: value.topic?.trim() ? value.topic.trim() : undefined,
    reflection,
    recommendationId: value.recommendationId,
  };
}

function sanitizeExamOutcome(value: unknown): ExamOutcome | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    !isNonEmptyString(value.id) ||
    !isNonEmptyString(value.examId) ||
    !isNonEmptyString(value.subjectId) ||
    !isValidDateString(value.createdAt) ||
    !isValidDateString(value.updatedAt)
  ) {
    return null;
  }

  const score = isFiniteNumber(value.score)
    ? Math.max(0, Math.min(100, Number(value.score.toFixed(1))))
    : undefined;

  if (value.notes !== undefined && typeof value.notes !== "string") {
    return null;
  }

  return {
    id: value.id,
    examId: value.examId,
    subjectId: value.subjectId,
    score,
    notes: value.notes?.trim() ? value.notes.trim() : undefined,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

function sanitizeAcademicEvent(value: unknown): AcademicEvent | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    !isNonEmptyString(value.id) ||
    !isNonEmptyString(value.courseId) ||
    !isOneOf<AcademicEventType>(value.type, [
      "exam",
      "assignment_due",
      "material_update",
      "announcement",
      "grade_release",
      "deadline_change",
    ]) ||
    !isNonEmptyString(value.title) ||
    !isValidDateString(value.occurredAt) ||
    !isOneOf<AcademicEventSource>(value.source, [
      "manual",
      "file_import",
      "portal_import",
      "resource_analysis",
      "system_generation",
    ]) ||
    !isOneOf<AcademicEventProvenance>(value.provenance, [
      "official_imported",
      "student_entered",
      "system_derived",
    ]) ||
    !isOneOf<AcademicEventSignificance>(value.significance, ["low", "medium", "high"]) ||
    !isOneOf<AcademicEventPlanningImpact>(value.planningImpact, ["none", "soft", "strong"]) ||
    !isOneOf<AcademicEventStatus>(value.status, ["active", "resolved", "dismissed", "expired"])
  ) {
    return null;
  }

  const metadata = isRecord(value.metadata) ? value.metadata : undefined;

  return {
    id: value.id,
    courseId: value.courseId,
    type: value.type,
    title: value.title,
    summary:
      typeof value.summary === "string" && value.summary.trim()
        ? value.summary.trim()
        : undefined,
    occurredAt: value.occurredAt,
    dueAt: isValidDateString(value.dueAt) ? value.dueAt : undefined,
    source: value.source,
    provenance: value.provenance,
    significance: value.significance,
    planningImpact: value.planningImpact,
    status: value.status,
    metadata,
  };
}

function sanitizeRecommendationEvent(value: unknown): RecommendationEvent | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    !isNonEmptyString(value.id) ||
    !isNonEmptyString(value.subjectId) ||
    !isOneOf(value.source, ["brief", "resource", "onboarding"]) ||
    !isFiniteNumber(value.recommendedMinutes) ||
    value.recommendedMinutes <= 0 ||
    !isValidDateString(value.shownAt)
  ) {
    return null;
  }

  if (value.sourceLabel !== undefined && typeof value.sourceLabel !== "string") {
    return null;
  }

  if (value.topic !== undefined && typeof value.topic !== "string") {
    return null;
  }

  if (value.acceptedAt !== undefined && !isValidDateString(value.acceptedAt)) {
    return null;
  }

  if (value.convertedAt !== undefined && !isValidDateString(value.convertedAt)) {
    return null;
  }

  if (value.sessionId !== undefined && !isNonEmptyString(value.sessionId)) {
    return null;
  }

  return {
    id: value.id,
    subjectId: value.subjectId,
    source: value.source,
    sourceLabel: value.sourceLabel?.trim() ? value.sourceLabel.trim() : undefined,
    topic: value.topic?.trim() ? value.topic.trim() : undefined,
    recommendedMinutes: Math.round(value.recommendedMinutes),
    shownAt: value.shownAt,
    acceptedAt: value.acceptedAt,
    convertedAt: value.convertedAt,
    sessionId: value.sessionId,
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
  const resourceKindHint =
    value.resourceKindHint === undefined || isOneOf(value.resourceKindHint, [
      "questions",
      "summary",
      "slides",
      "notes",
      "topic-notes",
      "outline",
      "brief",
      "case",
      "book",
      "unknown",
    ])
      ? value.resourceKindHint
      : undefined;
  const topicHints = Array.isArray(value.topicHints)
    ? sanitizeTopicHints(
        value.topicHints
          .filter((topic): topic is string => isNonEmptyString(topic))
          .map((topic) => topic.trim()),
      )
    : undefined;
  const storageProvider =
    value.storageProvider === undefined || isOneOf(value.storageProvider, ["local", "supabase"])
      ? value.storageProvider
      : undefined;
  const cloudPath = isNonEmptyString(value.cloudPath) ? value.cloudPath.trim() : undefined;
  const mimeType = isNonEmptyString(value.mimeType) ? value.mimeType.trim() : undefined;

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
    ...(resourceKindHint && resourceKindHint !== "unknown" ? { resourceKindHint } : {}),
    topicHints,
    storageProvider,
    cloudPath,
    mimeType,
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

export function readActiveStorageScope(): string | null {
  const storage = getStorage();

  if (!storage) {
    return null;
  }

  const raw = storage.getItem(STORAGE_KEYS.activeScope);
  return isNonEmptyString(raw) ? raw : null;
}

export function writeActiveStorageScope(scope: string | null) {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  if (!scope) {
    storage.removeItem(STORAGE_KEYS.activeScope);
    return;
  }

  storage.setItem(STORAGE_KEYS.activeScope, scope);
}

export function migrateLegacyStorageIntoScope(scope: string) {
  const storage = getStorage();

  if (!storage || !scope) {
    return;
  }

  if (storage.getItem(STORAGE_KEYS.legacyScopedMigration) === "1") {
    return;
  }

  for (const baseKey of SCOPED_STORAGE_KEYS) {
    const scopedKey = `${baseKey}:${scope}`;
    if (storage.getItem(scopedKey) !== null) {
      continue;
    }

    const legacyValue = storage.getItem(baseKey);
    if (legacyValue !== null) {
      storage.setItem(scopedKey, legacyValue);
    }
  }

  storage.setItem(STORAGE_KEYS.legacyScopedMigration, "1");
}

export function clearScopedStorageScope(scope: string) {
  const storage = getStorage();

  if (!storage || !scope) {
    return;
  }

  for (const baseKey of SCOPED_STORAGE_KEYS) {
    storage.removeItem(`${baseKey}:${scope}`);
  }
}

export function withCloudSyncSuppressed<T>(callback: () => T): T {
  cloudSyncSuppressionDepth += 1;
  try {
    return callback();
  } finally {
    cloudSyncSuppressionDepth = Math.max(0, cloudSyncSuppressionDepth - 1);
  }
}

export function readStudySessions(): StudySession[] {
  const storage = getStorage();

  if (!storage) {
    return [];
  }

  const parsed = parseUnknownJson(storage.getItem(getScopedStorageKey(STORAGE_KEYS.studySessions)));

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .map((session) => sanitizeStudySession(session))
    .filter((session): session is StudySession => session !== null);
}

export function readScheduleItems(): ScheduleItem[] {
  const storage = getStorage();

  if (!storage) {
    return [];
  }

  const parsed = parseUnknownJson(
    storage.getItem(getScopedStorageKey(STORAGE_KEYS.scheduleItems)),
  );

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .map((item) => sanitizeScheduleItem(item))
    .filter((item): item is ScheduleItem => item !== null);
}

export function writeScheduleItems(items: ScheduleItem[]) {
  persistScopedStorageValue(STORAGE_KEYS.scheduleItems, JSON.stringify(items));
}

export function restoreScheduleItem(item: ScheduleItem) {
  const items = readScheduleItems().filter((entry) => entry.id !== item.id);
  const nextItems = [...items, item].sort(
    (left, right) =>
      new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime(),
  );

  writeScheduleItems(nextItems);
}

export function writeStudySessions(sessions: StudySession[]) {
  persistScopedStorageValue(STORAGE_KEYS.studySessions, JSON.stringify(sessions));
}

export function readRecommendationEvents(): RecommendationEvent[] {
  const storage = getStorage();

  if (!storage) {
    return [];
  }

  const parsed = parseUnknownJson(
    storage.getItem(getScopedStorageKey(STORAGE_KEYS.recommendationEvents)),
  );

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .map((event) => sanitizeRecommendationEvent(event))
    .filter((event): event is RecommendationEvent => event !== null);
}

export function writeRecommendationEvents(events: RecommendationEvent[]): void {
  persistScopedStorageValue(STORAGE_KEYS.recommendationEvents, JSON.stringify(events));
  dispatchRecommendationEventsChanged();
}

export function readExamOutcomes(): ExamOutcome[] {
  const storage = getStorage();

  if (!storage) {
    return [];
  }

  const parsed = parseUnknownJson(
    storage.getItem(getScopedStorageKey(STORAGE_KEYS.examOutcomes)),
  );

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .map((outcome) => sanitizeExamOutcome(outcome))
    .filter((outcome): outcome is ExamOutcome => outcome !== null);
}

export function writeExamOutcomes(outcomes: ExamOutcome[]): void {
  persistScopedStorageValue(STORAGE_KEYS.examOutcomes, JSON.stringify(outcomes));
}

export function readAcademicEvents(): AcademicEvent[] {
  const storage = getStorage();

  if (!storage) {
    return [];
  }

  const parsed = parseUnknownJson(
    storage.getItem(getScopedStorageKey(STORAGE_KEYS.academicEvents)),
  );

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .map((event) => sanitizeAcademicEvent(event))
    .filter((event): event is AcademicEvent => event !== null);
}

export function writeAcademicEvents(events: AcademicEvent[]): void {
  persistScopedStorageValue(STORAGE_KEYS.academicEvents, JSON.stringify(events));
  dispatchAcademicEventsChanged();
}

export function upsertAcademicEvent(event: AcademicEvent): void {
  const next = [
    ...readAcademicEvents().filter((entry) => entry.id !== event.id),
    event,
  ].sort(
    (left, right) =>
      new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime(),
  );

  writeAcademicEvents(next);
}

export function removeAcademicEvent(eventId: string): void {
  const next = readAcademicEvents().filter((event) => event.id !== eventId);
  writeAcademicEvents(next);
}

export function readOnboardingState(): PersistedOnboardingState | null {
  const storage = getStorage();

  if (!storage) {
    return null;
  }

  return sanitizeOnboardingState(
    parseUnknownJson(storage.getItem(getScopedStorageKey(STORAGE_KEYS.onboarding))),
  );
}

export function writeOnboardingState(state: PersistedOnboardingState) {
  persistScopedStorageValue(STORAGE_KEYS.onboarding, JSON.stringify(state));
}

export function readUserProfile(): UserProfile | null {
  const storage = getStorage();

  if (!storage) {
    return null;
  }

  return sanitizeUserProfile(
    parseUnknownJson(storage.getItem(getScopedStorageKey(STORAGE_KEYS.userProfile))),
  );
}

export function writeUserProfile(profile: UserProfile) {
  persistScopedStorageValue(STORAGE_KEYS.userProfile, JSON.stringify(profile));
}

export function readPlanningExams(): Exam[] {
  const storage = getStorage();

  if (!storage) {
    return [];
  }

  const parsed = parseUnknownJson(storage.getItem(getScopedStorageKey(STORAGE_KEYS.exams)));

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .map((exam) => sanitizeExam(exam))
    .filter((exam): exam is Exam => exam !== null);
}

export function writePlanningExams(exams: Exam[]) {
  persistScopedStorageValue(STORAGE_KEYS.exams, JSON.stringify(exams));
}

export function removePlanningExam(examId: string) {
  const exams = readPlanningExams();
  const targetExam = exams.find((exam) => exam.id === examId);

  if (!targetExam) {
    return false;
  }

  writePlanningExams(exams.filter((exam) => exam.id !== examId));
  writePlanningSubjectSeeds(
    readPlanningSubjectSeeds().filter((subjectSeed) => subjectSeed.id !== targetExam.subjectId),
  );

  return true;
}

export function restorePlanningExam(exam: Exam, subjectSeed?: SubjectSeed) {
  const nextExams = [...readPlanningExams().filter((entry) => entry.id !== exam.id), exam].sort(
    (left, right) =>
      new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime(),
  );

  writePlanningExams(nextExams);

  if (!subjectSeed) {
    return;
  }

  const nextSubjectSeeds = [
    ...readPlanningSubjectSeeds().filter((entry) => entry.id !== subjectSeed.id),
    subjectSeed,
  ];

  writePlanningSubjectSeeds(nextSubjectSeeds);
}

export function readPlanningSubjectSeeds(): SubjectSeed[] {
  const storage = getStorage();

  if (!storage) {
    return [];
  }

  const parsed = parseUnknownJson(
    storage.getItem(getScopedStorageKey(STORAGE_KEYS.subjectSeeds)),
  );

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .map((subjectSeed) => sanitizeSubjectSeed(subjectSeed))
    .filter((subjectSeed): subjectSeed is SubjectSeed => subjectSeed !== null);
}

export function writePlanningSubjectSeeds(subjectSeeds: SubjectSeed[]) {
  persistScopedStorageValue(STORAGE_KEYS.subjectSeeds, JSON.stringify(subjectSeeds));
}

export function readPlanningConstraints(): StudentConstraints {
  const storage = getStorage();

  if (!storage) {
    return studentConstraints;
  }

  return sanitizeConstraints(
    parseUnknownJson(storage.getItem(getScopedStorageKey(STORAGE_KEYS.constraints))),
  );
}

export function writePlanningConstraints(constraints: StudentConstraints) {
  persistScopedStorageValue(STORAGE_KEYS.constraints, JSON.stringify(constraints));
}

export function readImportSelectionHistory(): ImportSelectionMemoryEntry[] {
  const storage = getStorage();

  if (!storage) {
    return [];
  }

  const parsed = parseUnknownJson(
    storage.getItem(getScopedStorageKey(STORAGE_KEYS.importSelectionHistory)),
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
  persistScopedStorageValue(
    STORAGE_KEYS.importSelectionHistory,
    JSON.stringify(history),
  );
}

export function readResources(): ResourceItem[] {
  const storage = getStorage();

  if (!storage) {
    return [];
  }

  const parsed = parseUnknownJson(storage.getItem(getScopedStorageKey(STORAGE_KEYS.resources)));

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .map((item) => sanitizeResourceItem(item))
    .filter((item): item is ResourceItem => item !== null);
}

export function writeResources(resources: ResourceItem[]): void {
  persistScopedStorageValue(STORAGE_KEYS.resources, JSON.stringify(resources));
}

// ─── Study Notes ─────────────────────────────────────────────────────────────

export function readStudyNotes(): StudyNote[] {
  const storage = getStorage();

  if (!storage) {
    return [];
  }

  const parsed = parseUnknownJson(storage.getItem(getScopedStorageKey(STORAGE_KEYS.studyNotes)));

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .map((note) => sanitizeStudyNote(note))
    .filter((note): note is StudyNote => note !== null);
}

export function writeStudyNotes(notes: StudyNote[]): void {
  persistScopedStorageValue(STORAGE_KEYS.studyNotes, JSON.stringify(notes));
}

export function sanitizeCloudStateSnapshot(
  value: unknown,
): PersistedCloudStateSnapshot | null {
  if (!isRecord(value)) {
    return null;
  }

  const scheduleItems = Array.isArray(value.scheduleItems)
    ? value.scheduleItems
        .map((item) => sanitizeScheduleItem(item))
        .filter((item): item is ScheduleItem => item !== null)
    : [];
  const studySessions = Array.isArray(value.studySessions)
    ? value.studySessions
        .map((session) => sanitizeStudySession(session))
        .filter((session): session is StudySession => session !== null)
    : [];
  const exams = Array.isArray(value.exams)
    ? value.exams
        .map((exam) => sanitizeExam(exam))
        .filter((exam): exam is Exam => exam !== null)
    : [];
  const subjectSeeds = Array.isArray(value.subjectSeeds)
    ? value.subjectSeeds
        .map((seed) => sanitizeSubjectSeed(seed))
        .filter((seed): seed is SubjectSeed => seed !== null)
    : [];
  const resources = Array.isArray(value.resources)
    ? value.resources
        .map((resource) => sanitizeResourceItem(resource))
        .filter((resource): resource is ResourceItem => resource !== null)
    : [];
  const importSelectionHistory = Array.isArray(value.importSelectionHistory)
    ? value.importSelectionHistory
        .map((entry) => sanitizeImportSelectionMemoryEntry(entry))
        .filter((entry): entry is ImportSelectionMemoryEntry => entry !== null)
    : [];
  const studyNotes = Array.isArray(value.studyNotes)
    ? value.studyNotes
        .map((note) => sanitizeStudyNote(note))
        .filter((note): note is StudyNote => note !== null)
    : [];
  const recommendationEvents = Array.isArray(value.recommendationEvents)
    ? value.recommendationEvents
        .map((event) => sanitizeRecommendationEvent(event))
        .filter((event): event is RecommendationEvent => event !== null)
    : [];
  const examOutcomes = Array.isArray(value.examOutcomes)
    ? value.examOutcomes
        .map((outcome) => sanitizeExamOutcome(outcome))
        .filter((outcome): outcome is ExamOutcome => outcome !== null)
    : [];
  const academicEvents = Array.isArray(value.academicEvents)
    ? value.academicEvents
        .map((event) => sanitizeAcademicEvent(event))
        .filter((event): event is AcademicEvent => event !== null)
    : [];

  return {
    onboarding:
      value.onboarding === null || value.onboarding === undefined
        ? null
        : sanitizeOnboardingState(value.onboarding),
    scheduleItems,
    studySessions,
    userProfile:
      value.userProfile === null || value.userProfile === undefined
        ? null
        : sanitizeUserProfile(value.userProfile),
    exams,
    subjectSeeds,
    constraints: sanitizeConstraints(value.constraints),
    resources,
    importSelectionHistory,
    studyNotes,
    recommendationEvents,
    examOutcomes,
    academicEvents,
  };
}

export function hasMeaningfulLocalStateSnapshot(
  snapshot: PersistedCloudStateSnapshot | null,
): boolean {
  if (!snapshot) {
    return false;
  }

  return Boolean(
    snapshot.onboarding ||
      snapshot.userProfile ||
      snapshot.scheduleItems.length ||
      snapshot.studySessions.length ||
      snapshot.exams.length ||
      snapshot.subjectSeeds.length ||
      snapshot.resources.length ||
      snapshot.importSelectionHistory.length ||
      snapshot.studyNotes.length ||
      snapshot.recommendationEvents.length ||
      snapshot.examOutcomes.length ||
      snapshot.academicEvents.length ||
      JSON.stringify(snapshot.constraints) !== JSON.stringify(studentConstraints),
  );
}

export function readLocalStateSnapshot(): PersistedCloudStateSnapshot {
  return {
    onboarding: readOnboardingState(),
    scheduleItems: readScheduleItems(),
    studySessions: readStudySessions(),
    userProfile: readUserProfile(),
    exams: readPlanningExams(),
    subjectSeeds: readPlanningSubjectSeeds(),
    constraints: readPlanningConstraints(),
    resources: readResources(),
    importSelectionHistory: readImportSelectionHistory(),
    studyNotes: readStudyNotes(),
    recommendationEvents: readRecommendationEvents(),
    examOutcomes: readExamOutcomes(),
    academicEvents: readAcademicEvents(),
  };
}

export function replaceLocalStateSnapshot(snapshot: PersistedCloudStateSnapshot | null) {
  const scope = readActiveStorageScope();
  if (!scope) {
    return;
  }

  withCloudSyncSuppressed(() => {
    clearScopedStorageScope(scope);

    if (!snapshot) {
      return;
    }

    if (snapshot.onboarding) {
      writeOnboardingState(snapshot.onboarding);
    } else {
      removeScopedStorageValue(STORAGE_KEYS.onboarding);
    }

    writeScheduleItems(snapshot.scheduleItems);
    writeStudySessions(snapshot.studySessions);

    if (snapshot.userProfile) {
      writeUserProfile(snapshot.userProfile);
    } else {
      removeScopedStorageValue(STORAGE_KEYS.userProfile);
    }

    writePlanningExams(snapshot.exams);
    writePlanningSubjectSeeds(snapshot.subjectSeeds);
    writePlanningConstraints(snapshot.constraints);
    writeResources(snapshot.resources);
    writeImportSelectionHistory(snapshot.importSelectionHistory);
    writeStudyNotes(snapshot.studyNotes);
    writeRecommendationEvents(snapshot.recommendationEvents);
    writeExamOutcomes(snapshot.examOutcomes);
    writeAcademicEvents(snapshot.academicEvents);
  });
}
