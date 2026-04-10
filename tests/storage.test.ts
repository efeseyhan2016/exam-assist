import test from "node:test";
import assert from "node:assert/strict";

import {
  clearScopedStorageScope,
  readExamOutcomes,
  hasMeaningfulLocalStateSnapshot,
  migrateLegacyStorageIntoScope,
  readActiveStorageScope,
  readLocalStateSnapshot,
  readRecommendationEvents,
  STORAGE_KEYS,
  readImportSelectionHistory,
  readPlanningConstraints,
  readPlanningExams,
  readPlanningSubjectSeeds,
  readResources,
  readScheduleItems,
  readStudySessions,
  readStudyNotes,
  readUserProfile,
  replaceLocalStateSnapshot,
  sanitizeCloudStateSnapshot,
  writeImportSelectionHistory,
  writeActiveStorageScope,
  writeExamOutcomes,
  writePlanningConstraints,
  writePlanningExams,
  writePlanningSubjectSeeds,
  writeRecommendationEvents,
  writeResources,
  writeStudySessions,
  writeStudyNotes,
  writeUserProfile,
} from "@/lib/storage";
import { buildImportSelectionMemoryEntry } from "@/lib/import-selection-intelligence";
import { studentConstraints } from "@/lib/seed-data";
import { rawAnswersToSubjectSeed } from "@/lib/planning-input";

class MemoryStorage {
  private store = new Map<string, string>();

  getItem(key: string) {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.store.set(key, value);
  }

  removeItem(key: string) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }
}

function attachWindow(storage: MemoryStorage) {
  Object.defineProperty(globalThis, "window", {
    value: { localStorage: storage },
    configurable: true,
    writable: true,
  });
}

function detachWindow() {
  delete (globalThis as { window?: unknown }).window;
}

test("planning storage keys roundtrip profile, exams, subject seeds, and constraints", () => {
  const storage = new MemoryStorage();
  attachWindow(storage);

  const profile = {
    name: "Efe",
    setupCompletedAt: "2026-04-03T10:00:00.000Z",
    language: "tr" as const,
    university: "Boğaziçi Üniversitesi",
    department: "İşletme",
    classYear: "3" as const,
    knownLanguages: ["tr", "en"],
  };

  const exams = [
    {
      id: "exam-1",
      subjectId: "economics",
      title: "Economics",
      shortLabel: "ECO",
      scheduledAt: "2026-04-12T09:00:00.000Z",
    },
  ];

  const subjectSeeds = [
    rawAnswersToSubjectSeed(
      {
        difficultyRaw: "orta",
        resourceReadinessRaw: "kismen",
        preparednessRaw: "iyi",
      },
      {
        exam: {
          subjectId: "economics",
          title: "Economics",
          shortLabel: "ECO",
        },
      },
    ),
  ];

  const constraints = {
    ...studentConstraints,
    dailyStudyGoalHours: 4,
  };

  writeUserProfile(profile);
  writePlanningExams(exams);
  writePlanningSubjectSeeds(subjectSeeds);
  writePlanningConstraints(constraints);

  assert.deepEqual(readUserProfile(), profile);
  assert.deepEqual(readPlanningExams(), exams);
  assert.deepEqual(readPlanningSubjectSeeds(), subjectSeeds);
  assert.deepEqual(readPlanningConstraints(), constraints);
  assert.equal(storage.getItem(STORAGE_KEYS.userProfile) !== null, true);
  assert.equal(storage.getItem(STORAGE_KEYS.exams) !== null, true);
  assert.equal(storage.getItem(STORAGE_KEYS.subjectSeeds) !== null, true);
  assert.equal(storage.getItem(STORAGE_KEYS.constraints) !== null, true);

  detachWindow();
});

test("scoped storage keeps user data isolated per active account", () => {
  const storage = new MemoryStorage();
  attachWindow(storage);

  writeActiveStorageScope("supabase:user-a");
  writeUserProfile({
    name: "Efe",
    setupCompletedAt: "2026-04-03T10:00:00.000Z",
    language: "tr",
    university: "",
    department: "",
    classYear: "",
    knownLanguages: ["tr"],
  });

  writeActiveStorageScope("supabase:user-b");
  writeUserProfile({
    name: "Ayse",
    setupCompletedAt: "2026-04-04T10:00:00.000Z",
    language: "tr",
    university: "",
    department: "",
    classYear: "",
    knownLanguages: ["tr"],
  });

  assert.equal(readActiveStorageScope(), "supabase:user-b");
  assert.equal(readUserProfile()?.name, "Ayse");

  writeActiveStorageScope("supabase:user-a");
  assert.equal(readUserProfile()?.name, "Efe");

  detachWindow();
});

test("legacy user data migrates once into the first scoped session", () => {
  const storage = new MemoryStorage();
  attachWindow(storage);

  storage.setItem(
    STORAGE_KEYS.userProfile,
    JSON.stringify({
      name: "Legacy Efe",
      setupCompletedAt: "2026-04-03T10:00:00.000Z",
      language: "tr",
      university: "",
      department: "",
      classYear: "",
      knownLanguages: ["tr"],
    }),
  );

  migrateLegacyStorageIntoScope("supabase:user-a");
  writeActiveStorageScope("supabase:user-a");

  assert.equal(readUserProfile()?.name, "Legacy Efe");
  assert.equal(
    storage.getItem(`${STORAGE_KEYS.userProfile}:supabase:user-a`) !== null,
    true,
  );

  detachWindow();
});

test("clearing a scoped account removes only that account's stored planning data", () => {
  const storage = new MemoryStorage();
  attachWindow(storage);

  writeActiveStorageScope("supabase:user-a");
  writeUserProfile({
    name: "Efe",
    setupCompletedAt: "2026-04-03T10:00:00.000Z",
    language: "tr",
    university: "",
    department: "",
    classYear: "",
    knownLanguages: ["tr"],
  });
  writePlanningExams([
    {
      id: "exam-1",
      subjectId: "economics",
      title: "Economics",
      shortLabel: "ECO",
      scheduledAt: "2026-04-12T09:00:00.000Z",
    },
  ]);

  writeActiveStorageScope("supabase:user-b");
  writeUserProfile({
    name: "Ayse",
    setupCompletedAt: "2026-04-04T10:00:00.000Z",
    language: "tr",
    university: "",
    department: "",
    classYear: "",
    knownLanguages: ["tr"],
  });

  clearScopedStorageScope("supabase:user-a");

  writeActiveStorageScope("supabase:user-a");
  assert.equal(readUserProfile(), null);
  assert.deepEqual(readPlanningExams(), []);

  writeActiveStorageScope("supabase:user-b");
  assert.equal(readUserProfile()?.name, "Ayse");

  detachWindow();
});

test("local state snapshots roundtrip through scoped storage", () => {
  const storage = new MemoryStorage();
  attachWindow(storage);

  writeActiveStorageScope("supabase:user-a");
  writeUserProfile({
    name: "Efe",
    setupCompletedAt: "2026-04-03T10:00:00.000Z",
    language: "tr",
    university: "Boğaziçi Üniversitesi",
    department: "İşletme",
    classYear: "3",
    knownLanguages: ["tr", "en"],
  });
  writePlanningExams([
    {
      id: "exam-1",
      subjectId: "economics",
      title: "Economics",
      shortLabel: "ECO",
      scheduledAt: "2026-04-12T09:00:00.000Z",
    },
  ]);
  writeStudySessions([
    {
      id: "session-1",
      subjectId: "economics",
      minutes: 35,
      createdAt: "2026-04-05T09:00:00.000Z",
      topic: "Elasticity",
      reflection: "good",
    },
  ]);

  const snapshot = readLocalStateSnapshot();

  writeActiveStorageScope("supabase:user-b");
  replaceLocalStateSnapshot(snapshot);

  assert.equal(readUserProfile()?.name, "Efe");
  assert.equal(readPlanningExams()[0]?.subjectId, "economics");
  assert.equal(readStudySessions()[0]?.topic, "Elasticity");
  assert.deepEqual(readRecommendationEvents(), []);
  assert.deepEqual(readExamOutcomes(), []);

  detachWindow();
});

test("cloud state snapshots sanitize malformed nested data safely", () => {
  const snapshot = sanitizeCloudStateSnapshot({
    onboarding: { completedAt: "2026-04-03T10:00:00.000Z" },
    scheduleItems: [
      {
        id: "item-1",
        title: "Exam",
        shortLabel: "EX",
        scheduledAt: "2026-04-12T09:00:00.000Z",
        kind: "exam",
        source: "seed",
      },
      {
        id: "broken-item",
        title: "Broken",
        shortLabel: "BAD",
        scheduledAt: "nope",
        kind: "meeting",
        source: "seed",
      },
    ],
    studySessions: [
      {
        id: "session-1",
        subjectId: "economics",
        minutes: 35,
        createdAt: "2026-04-05T09:00:00.000Z",
        reflection: "stuck",
      },
      {
        id: "broken-session",
        subjectId: "economics",
        minutes: "bad",
        createdAt: "2026-04-05T09:00:00.000Z",
      },
    ],
    userProfile: {
      name: "Efe",
      setupCompletedAt: "2026-04-03T10:00:00.000Z",
      language: "tr",
      university: "",
      department: "",
      classYear: "",
      knownLanguages: ["tr", "xx"],
    },
    exams: [
      {
        id: "exam-1",
        subjectId: "economics",
        title: "Economics",
        shortLabel: "ECO",
        scheduledAt: "2026-04-12T09:00:00.000Z",
      },
      {
        id: "broken-exam",
        subjectId: "broken",
        title: "Broken",
        shortLabel: "BAD",
        scheduledAt: "invalid",
      },
    ],
    subjectSeeds: [],
    constraints: { dailyStudyGoalHours: 5 },
    resources: [
      {
        id: "resource-1",
        subjectId: "economics",
        title: "Week 6 Notes",
        type: "pdf",
        pageCount: 20,
        pagesRead: 4,
        fileSizeBytes: 512,
        uploadedAt: "2026-04-05T08:00:00.000Z",
      },
    ],
    importSelectionHistory: [],
    studyNotes: [
      {
        id: "note-1",
        subjectId: "economics",
        content: "Elasticity",
        createdAt: "2026-04-05T09:00:00.000Z",
        updatedAt: "2026-04-05T09:05:00.000Z",
        pinned: true,
      },
    ],
    examOutcomes: [
      {
        id: "outcome-1",
        examId: "exam-1",
        subjectId: "economics",
        score: 82,
        notes: "Zamanı iyi yönettim.",
        createdAt: "2026-04-12T11:30:00.000Z",
        updatedAt: "2026-04-12T11:30:00.000Z",
      },
      {
        id: "broken-outcome",
        examId: "",
        subjectId: "economics",
        score: "bad",
        createdAt: "nope",
        updatedAt: "2026-04-12T11:30:00.000Z",
      },
    ],
  });

  assert.deepEqual(snapshot, {
    onboarding: { completedAt: "2026-04-03T10:00:00.000Z" },
    scheduleItems: [
      {
        id: "item-1",
        title: "Exam",
        shortLabel: "EX",
        scheduledAt: "2026-04-12T09:00:00.000Z",
        kind: "exam",
        source: "seed",
        notes: undefined,
      },
    ],
    studySessions: [
      {
        id: "session-1",
        subjectId: "economics",
        minutes: 35,
        createdAt: "2026-04-05T09:00:00.000Z",
        notes: undefined,
        topic: undefined,
        reflection: "stuck",
        recommendationId: undefined,
      },
    ],
    userProfile: {
      name: "Efe",
      setupCompletedAt: "2026-04-03T10:00:00.000Z",
      language: "tr",
      university: "",
      department: "",
      classYear: "",
      knownLanguages: ["tr"],
    },
    exams: [
      {
        id: "exam-1",
        subjectId: "economics",
        title: "Economics",
        shortLabel: "ECO",
        scheduledAt: "2026-04-12T09:00:00.000Z",
      },
    ],
    subjectSeeds: [],
    constraints: {
      ...studentConstraints,
      dailyStudyGoalHours: 5,
    },
    resources: [
      {
        id: "resource-1",
        subjectId: "economics",
        title: "Week 6 Notes",
        type: "pdf",
        pageCount: 20,
        pagesRead: 4,
        fileSizeBytes: 512,
        uploadedAt: "2026-04-05T08:00:00.000Z",
        contentHint: undefined,
        topicHints: undefined,
        storageProvider: undefined,
        cloudPath: undefined,
        mimeType: undefined,
        lastActiveAt: undefined,
        engagementCount: 0,
        revisitCount: 0,
      },
    ],
    importSelectionHistory: [],
    studyNotes: [
      {
        id: "note-1",
        subjectId: "economics",
        content: "Elasticity",
        createdAt: "2026-04-05T09:00:00.000Z",
        updatedAt: "2026-04-05T09:05:00.000Z",
        pinned: true,
        sessionId: undefined,
      },
    ],
    recommendationEvents: [],
    examOutcomes: [
      {
        id: "outcome-1",
        examId: "exam-1",
        subjectId: "economics",
        score: 82,
        notes: "Zamanı iyi yönettim.",
        createdAt: "2026-04-12T11:30:00.000Z",
        updatedAt: "2026-04-12T11:30:00.000Z",
      },
    ],
  });
});

test("meaningful cloud state detection ignores empty defaults", () => {
  assert.equal(
    hasMeaningfulLocalStateSnapshot({
      onboarding: null,
      scheduleItems: [],
      studySessions: [],
      userProfile: null,
      exams: [],
      subjectSeeds: [],
      constraints: studentConstraints,
      resources: [],
      importSelectionHistory: [],
      studyNotes: [],
      recommendationEvents: [],
      examOutcomes: [],
    }),
    false,
  );

  assert.equal(
    hasMeaningfulLocalStateSnapshot({
      onboarding: null,
      scheduleItems: [],
      studySessions: [],
      userProfile: null,
      exams: [
        {
          id: "exam-1",
          subjectId: "economics",
          title: "Economics",
          shortLabel: "ECO",
          scheduledAt: "2026-04-12T09:00:00.000Z",
        },
      ],
      subjectSeeds: [],
      constraints: studentConstraints,
      resources: [],
      importSelectionHistory: [],
      studyNotes: [],
      recommendationEvents: [],
      examOutcomes: [],
    }),
    true,
  );
});

test("recommendation events roundtrip through scoped storage", () => {
  const storage = new MemoryStorage();
  attachWindow(storage);

  writeActiveStorageScope("supabase:user-a");
  writeRecommendationEvents([
    {
      id: "rec-1",
      subjectId: "ait204",
      source: "brief",
      sourceLabel: "AIT için bugün 30 dakikalık blok ayır.",
      topic: "Lozan Barış Konferansı",
      recommendedMinutes: 30,
      shownAt: "2026-04-09T09:00:00.000Z",
      acceptedAt: "2026-04-09T09:01:00.000Z",
      convertedAt: "2026-04-09T09:35:00.000Z",
      sessionId: "session-1",
    },
  ]);

  assert.deepEqual(readRecommendationEvents(), [
    {
      id: "rec-1",
      subjectId: "ait204",
      source: "brief",
      sourceLabel: "AIT için bugün 30 dakikalık blok ayır.",
      topic: "Lozan Barış Konferansı",
      recommendedMinutes: 30,
      shownAt: "2026-04-09T09:00:00.000Z",
      acceptedAt: "2026-04-09T09:01:00.000Z",
      convertedAt: "2026-04-09T09:35:00.000Z",
      sessionId: "session-1",
    },
  ]);

  detachWindow();
});

test("exam outcomes roundtrip through scoped storage", () => {
  const storage = new MemoryStorage();
  attachWindow(storage);

  writeActiveStorageScope("supabase:user-a");
  writeExamOutcomes([
    {
      id: "outcome-1",
      examId: "exam-1",
      subjectId: "ait204",
      score: 76.5,
      notes: "Lozan tarafı iyiydi, Demokrat Parti daha zayıf kaldı.",
      createdAt: "2026-04-09T13:00:00.000Z",
      updatedAt: "2026-04-09T13:00:00.000Z",
    },
  ]);

  assert.deepEqual(readExamOutcomes(), [
    {
      id: "outcome-1",
      examId: "exam-1",
      subjectId: "ait204",
      score: 76.5,
      notes: "Lozan tarafı iyiydi, Demokrat Parti daha zayıf kaldı.",
      createdAt: "2026-04-09T13:00:00.000Z",
      updatedAt: "2026-04-09T13:00:00.000Z",
    },
  ]);

  detachWindow();
});

test("planning constraints fall back to seeded defaults when storage is empty", () => {
  const storage = new MemoryStorage();
  attachWindow(storage);

  assert.deepEqual(readPlanningConstraints(), studentConstraints);

  detachWindow();
});

test("valid planning reads still return persisted happy-path data", () => {
  const storage = new MemoryStorage();
  attachWindow(storage);

  storage.setItem(
    STORAGE_KEYS.userProfile,
    JSON.stringify({
      name: "Efe Balcılar",
      setupCompletedAt: "2026-04-03T10:00:00.000Z",
      language: "tr",
      university: "İstanbul Teknik Üniversitesi",
      department: "Bilgisayar Mühendisliği",
      classYear: "4",
      knownLanguages: ["tr", "en"],
    }),
  );
  storage.setItem(
    STORAGE_KEYS.exams,
    JSON.stringify([
      {
        id: "exam-1",
        subjectId: "economics",
        title: "Economics",
        shortLabel: "ECO",
        scheduledAt: "2026-04-12T09:00:00.000Z",
      },
    ]),
  );

  assert.equal(readUserProfile()?.name, "Efe Balcılar");
  assert.equal(readUserProfile()?.university, "İstanbul Teknik Üniversitesi");
  assert.equal(readPlanningExams()[0]?.subjectId, "economics");

  detachWindow();
});

test("malformed planning profile and exams fall back safely", () => {
  const storage = new MemoryStorage();
  attachWindow(storage);

  storage.setItem(
    STORAGE_KEYS.userProfile,
    JSON.stringify({
      name: "Efe",
      setupCompletedAt: "not-a-date",
      language: "tr",
    }),
  );
  storage.setItem(
    STORAGE_KEYS.exams,
    JSON.stringify([
      {
        id: "exam-1",
        subjectId: "economics",
        title: "Economics",
        shortLabel: "ECO",
        scheduledAt: "2026-04-12T09:00:00.000Z",
      },
      {
        id: "broken-exam",
        subjectId: "broken",
        title: "Broken",
        shortLabel: "BAD",
        scheduledAt: "not-a-date",
      },
      "not-an-object",
    ]),
  );

  assert.equal(readUserProfile(), null);
  assert.deepEqual(readPlanningExams(), [
    {
      id: "exam-1",
      subjectId: "economics",
      title: "Economics",
      shortLabel: "ECO",
      scheduledAt: "2026-04-12T09:00:00.000Z",
    },
  ]);

  detachWindow();
});

test("schedule items preserve manual exam calibration answers", () => {
  const storage = new MemoryStorage();
  attachWindow(storage);

  storage.setItem(
    STORAGE_KEYS.scheduleItems,
    JSON.stringify([
      {
        id: "manual-exam-1",
        title: "Services Marketing",
        shortLabel: "SRV",
        scheduledAt: "2026-04-12T09:00:00.000Z",
        kind: "exam",
        source: "manual",
        calibration: {
          difficultyRaw: "zor",
          resourceReadinessRaw: "eksik",
          preparednessRaw: "az",
        },
      },
    ]),
  );

  assert.deepEqual(readScheduleItems()[0]?.calibration, {
    difficultyRaw: "zor",
    resourceReadinessRaw: "eksik",
    preparednessRaw: "az",
  });

  detachWindow();
});

test("planning profile and constraints use deterministic field-level fallbacks where appropriate", () => {
  const storage = new MemoryStorage();
  attachWindow(storage);

  storage.setItem(
    STORAGE_KEYS.userProfile,
    JSON.stringify({
      setupCompletedAt: "2026-04-03T10:00:00.000Z",
      language: "en",
      knownLanguages: ["en", "xx", "tr"],
    }),
  );
  storage.setItem(
    STORAGE_KEYS.constraints,
    JSON.stringify({
      dailyStudyGoalHours: 6,
      studyDayStartHour: 8,
      wakeBufferMinutes: -10,
    }),
  );

  assert.deepEqual(readUserProfile(), {
    name: "",
    setupCompletedAt: "2026-04-03T10:00:00.000Z",
    language: "en",
    university: "",
    department: "",
    classYear: "",
    knownLanguages: ["en", "tr"],
  });
  assert.deepEqual(readPlanningConstraints(), {
    ...studentConstraints,
    dailyStudyGoalHours: 6,
    studyDayStartHour: 8,
  });

  detachWindow();
});

test("subject seed validation accepts safe legacy defaults and rejects malformed numeric shapes", () => {
  const storage = new MemoryStorage();
  attachWindow(storage);

  storage.setItem(
    STORAGE_KEYS.subjectSeeds,
    JSON.stringify([
      {
        id: "economics",
        title: "Economics",
        shortLabel: "ECO",
        contentLoad: 3.4,
        difficulty: 3.5,
        practiceNeed: 2.5,
        resourceFriction: 2.8,
        reliefFactor: 0.35,
        targetHours: 8,
      },
      {
        id: "broken",
        title: "Broken",
        shortLabel: "BAD",
        contentLoad: "five",
        difficulty: 10,
        practiceNeed: 2,
        resourceFriction: 1,
        reliefFactor: 0.4,
        targetHours: 8,
        initialStudiedCredit: 2,
        calibration: {
          difficultyRaw: "zor",
          resourceReadinessRaw: "hazir",
          preparednessRaw: "iyi",
        },
      },
    ]),
  );

  assert.deepEqual(readPlanningSubjectSeeds(), [
    {
      id: "economics",
      title: "Economics",
      shortLabel: "ECO",
      contentLoad: 3.4,
      difficulty: 3.5,
      practiceNeed: 2.5,
      resourceFriction: 2.8,
      reliefFactor: 0.35,
      targetHours: 8,
      initialStudiedCredit: 0,
      calibration: {
        difficultyRaw: null,
        resourceReadinessRaw: null,
        preparednessRaw: null,
      },
    },
  ]);

  detachWindow();
});

test("malformed planning constraints recover to seeded defaults", () => {
  const storage = new MemoryStorage();
  attachWindow(storage);

  storage.setItem(
    STORAGE_KEYS.constraints,
    JSON.stringify({
      dailyStudyGoalHours: "five",
      studyDayStartHour: -1,
      standardStudyDayEndHour: 42,
      morningSleepCutoffHour: null,
      sleepTargetHours: 0,
      wakeBufferMinutes: "80",
    }),
  );

  assert.deepEqual(readPlanningConstraints(), studentConstraints);

  detachWindow();
});

test("import selection history roundtrips safely through planning storage", () => {
  const storage = new MemoryStorage();
  attachWindow(storage);

  const history = [
    buildImportSelectionMemoryEntry({
      title: "Commercial Law II",
      courseCode: "IIBF306",
      departmentHint: "İşletme",
    }),
  ];

  writeImportSelectionHistory(history);

  assert.deepEqual(readImportSelectionHistory(), history);
  assert.equal(storage.getItem(STORAGE_KEYS.importSelectionHistory) !== null, true);

  detachWindow();
});

test("malformed import selection history falls back safely", () => {
  const storage = new MemoryStorage();
  attachWindow(storage);

  storage.setItem(
    STORAGE_KEYS.importSelectionHistory,
    JSON.stringify([
      {
        titleFingerprint: "commercial law",
        titleTokens: ["commercial", "law"],
        courseCode: "IIBF306",
        departmentHint: "isletme",
        titleLanguage: "en",
        selectedCount: 2,
        dismissedCount: 1,
        profileUniversity: "bogazici universitesi",
        profileDepartment: "isletme",
      },
      {
        titleFingerprint: 42,
        titleTokens: "bad",
        courseCode: null,
        departmentHint: [],
        titleLanguage: "de",
      },
    ]),
  );

  assert.deepEqual(readImportSelectionHistory(), [
    {
      titleFingerprint: "commercial law",
      titleTokens: ["commercial", "law"],
      courseCode: "IIBF306",
      departmentHint: "isletme",
      titleLanguage: "en",
      selectedCount: 2,
      dismissedCount: 1,
      profileUniversity: "bogazici universitesi",
      profileDepartment: "isletme",
    },
  ]);

  detachWindow();
});

test("legacy import selection history defaults to positive-only memory", () => {
  const storage = new MemoryStorage();
  attachWindow(storage);

  storage.setItem(
    STORAGE_KEYS.importSelectionHistory,
    JSON.stringify([
      {
        titleFingerprint: "commercial law",
        titleTokens: ["commercial", "law"],
        courseCode: "IIBF306",
        departmentHint: "isletme",
        titleLanguage: "en",
      },
    ]),
  );

  assert.deepEqual(readImportSelectionHistory(), [
    {
      titleFingerprint: "commercial law",
      titleTokens: ["commercial", "law"],
      courseCode: "IIBF306",
      departmentHint: "isletme",
      titleLanguage: "en",
      selectedCount: 1,
      dismissedCount: 0,
      profileUniversity: "",
      profileDepartment: "",
    },
  ]);

  detachWindow();
});

test("study notes roundtrip safely through storage", () => {
  const storage = new MemoryStorage();
  attachWindow(storage);

  const notes = [
    {
      id: "note-1",
      subjectId: "economics",
      content: "Elasticity examples to revisit",
      createdAt: "2026-04-05T09:00:00.000Z",
      updatedAt: "2026-04-05T09:15:00.000Z",
      pinned: true,
      sessionId: "session-1",
    },
  ];

  writeStudyNotes(notes);

  assert.deepEqual(readStudyNotes(), notes);
  assert.equal(storage.getItem(STORAGE_KEYS.studyNotes) !== null, true);

  detachWindow();
});

test("study sessions roundtrip with optional reflection", () => {
  const storage = new MemoryStorage();
  attachWindow(storage);

  const sessions = [
    {
      id: "session-1",
      subjectId: "ait",
      minutes: 40,
      createdAt: "2026-04-05T09:00:00.000Z",
      notes: "Lozan kısmını toparladım",
      topic: "Lozan Barış Konferansı",
      reflection: "good" as const,
      recommendationId: undefined,
    },
  ];

  writeStudySessions(sessions);

  assert.deepEqual(readStudySessions(), sessions);

  detachWindow();
});

test("malformed study session reflection falls back safely", () => {
  const storage = new MemoryStorage();
  attachWindow(storage);

  storage.setItem(
    STORAGE_KEYS.studySessions,
    JSON.stringify([
      {
        id: "session-1",
        subjectId: "ait",
        minutes: 35,
        createdAt: "2026-04-05T09:00:00.000Z",
        topic: "  Lozan  ",
        reflection: "great",
        notes: "  Konuları taradım  ",
      },
      {
        id: "broken-session",
        subjectId: "ait",
        minutes: 0,
        createdAt: "invalid-date",
        reflection: "good",
      },
    ]),
  );

  assert.deepEqual(readStudySessions(), [
    {
      id: "session-1",
      subjectId: "ait",
      minutes: 35,
      createdAt: "2026-04-05T09:00:00.000Z",
      topic: "Lozan",
      reflection: undefined,
      notes: "Konuları taradım",
      recommendationId: undefined,
    },
  ]);

  detachWindow();
});

test("malformed study notes fall back safely", () => {
  const storage = new MemoryStorage();
  attachWindow(storage);

  storage.setItem(
    STORAGE_KEYS.studyNotes,
    JSON.stringify([
      {
        id: "note-1",
        subjectId: "economics",
        content: "Elasticity examples to revisit",
        createdAt: "2026-04-05T09:00:00.000Z",
        updatedAt: "2026-04-05T09:15:00.000Z",
        pinned: true,
      },
      {
        id: "broken-note",
        subjectId: "economics",
        content: "",
        createdAt: "invalid-date",
        updatedAt: "2026-04-05T09:15:00.000Z",
        pinned: "yes",
      },
      "not-an-object",
    ]),
  );

  assert.deepEqual(readStudyNotes(), [
    {
      id: "note-1",
      subjectId: "economics",
      content: "Elasticity examples to revisit",
      createdAt: "2026-04-05T09:00:00.000Z",
      updatedAt: "2026-04-05T09:15:00.000Z",
      pinned: true,
      sessionId: undefined,
    },
  ]);

  detachWindow();
});

test("resources preserve optional engagement metadata through storage", () => {
  const storage = new MemoryStorage();
  attachWindow(storage);

  const resources = [
    {
      id: "resource-1",
      subjectId: "economics",
      title: "Hafta 6 Ozet",
      type: "pdf" as const,
      pageCount: 30,
      pagesRead: 12,
      fileSizeBytes: 1024,
      uploadedAt: "2026-04-05T08:00:00.000Z",
      contentHint: "prose-heavy" as const,
      topicHints: ["Talep Dengesi", "Piyasa Yapısı"],
      storageProvider: "supabase" as const,
      cloudPath: "user-a/resource-1/hafta-6-ozet.pdf",
      mimeType: "application/pdf",
      lastActiveAt: "2026-04-05T09:00:00.000Z",
      engagementCount: 2,
      revisitCount: 1,
    },
  ];

  writeResources(resources);

  assert.deepEqual(readResources(), resources);

  detachWindow();
});

test("malformed resource engagement metadata falls back safely", () => {
  const storage = new MemoryStorage();
  attachWindow(storage);

  storage.setItem(
    STORAGE_KEYS.resources,
    JSON.stringify([
      {
        id: "resource-1",
        subjectId: "economics",
        title: "Hafta 6 Ozet",
        type: "pdf",
        pageCount: 30,
        pagesRead: 12,
        fileSizeBytes: 1024,
        uploadedAt: "2026-04-05T08:00:00.000Z",
        contentHint: "prose-heavy",
        topicHints: ["Hacettepe Üniversitesi", "Talep Dengesi", 12, "Piyasa Yapısı", ""],
        storageProvider: "supabase",
        cloudPath: 42,
        mimeType: false,
        lastActiveAt: "invalid-date",
        engagementCount: "two",
        revisitCount: null,
      },
    ]),
  );

  assert.deepEqual(readResources(), [
    {
      id: "resource-1",
      subjectId: "economics",
      title: "Hafta 6 Ozet",
      type: "pdf",
      pageCount: 30,
      pagesRead: 12,
      fileSizeBytes: 1024,
      uploadedAt: "2026-04-05T08:00:00.000Z",
      contentHint: "prose-heavy",
      topicHints: ["Talep Dengesi", "Piyasa Yapısı"],
      storageProvider: "supabase",
      cloudPath: undefined,
      mimeType: undefined,
      lastActiveAt: undefined,
      engagementCount: 0,
      revisitCount: 0,
    },
  ]);

  detachWindow();
});
