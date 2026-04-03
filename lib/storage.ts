import { PersistedOnboardingState, ScheduleItem, StudySession } from "@/lib/types";

export const STORAGE_KEYS = {
  onboarding: "exam-command-center:onboarding",
  scheduleItems: "exam-command-center:schedule-items",
  studySessions: "exam-command-center:study-sessions",
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

export function readStudySessions(): StudySession[] {
  if (typeof window === "undefined") {
    return [];
  }

  return parseJson<StudySession[]>(
    window.localStorage.getItem(STORAGE_KEYS.studySessions),
    [],
  );
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
