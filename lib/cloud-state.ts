"use client";

import {
  hasMeaningfulLocalStateSnapshot,
  readActiveStorageScope,
  readLocalStateSnapshot,
  sanitizeCloudStateSnapshot,
} from "@/lib/storage";
import { studentConstraints } from "@/lib/seed-data";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { PersistedCloudStateSnapshot, UserProfile } from "@/lib/types";

interface RemoteUserStateRow {
  user_id: string;
  state: unknown;
  created_at?: string;
  updated_at?: string;
}

const USER_STATE_COLUMNS = "user_id, state, created_at, updated_at";
const SYNC_DEBOUNCE_MS = 350;

let pendingSyncTimer: number | null = null;
let lastSyncedSignature: string | null = null;

async function readAuthenticatedCloudUserId() {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.user?.id ?? null;
}

function scopeForCloudUser(userId: string) {
  return `supabase:${userId}`;
}

function mergeSnapshotWithRemoteProfile(
  snapshot: PersistedCloudStateSnapshot | null,
  profile: UserProfile | null,
  onboardingCompletedAt: string | null,
): PersistedCloudStateSnapshot | null {
  if (!snapshot && !profile && !onboardingCompletedAt) {
    return null;
  }

  return {
    onboarding:
      onboardingCompletedAt !== null
        ? { completedAt: onboardingCompletedAt }
        : snapshot?.onboarding ?? null,
    scheduleItems: snapshot?.scheduleItems ?? [],
    studySessions: snapshot?.studySessions ?? [],
    userProfile: profile ?? snapshot?.userProfile ?? null,
    exams: snapshot?.exams ?? [],
    subjectSeeds: snapshot?.subjectSeeds ?? [],
    constraints: snapshot?.constraints ?? studentConstraints,
    resources: snapshot?.resources ?? [],
    importSelectionHistory: snapshot?.importSelectionHistory ?? [],
    studyNotes: snapshot?.studyNotes ?? [],
    recommendationEvents: snapshot?.recommendationEvents ?? [],
    examOutcomes: snapshot?.examOutcomes ?? [],
    academicEvents: snapshot?.academicEvents ?? [],
  };
}

export function primeCloudStateSnapshot(snapshot: PersistedCloudStateSnapshot | null) {
  lastSyncedSignature = snapshot ? JSON.stringify(snapshot) : null;
}

export async function readCloudStateSnapshot(): Promise<PersistedCloudStateSnapshot | null> {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    return null;
  }

  const userId = await readAuthenticatedCloudUserId();

  if (!userId) {
    return null;
  }

  const { data, error } = await supabase
    .from("user_state")
    .select(USER_STATE_COLUMNS)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.debug("[cloud-state] snapshot fetch skipped", { userId, error });
    return null;
  }

  return sanitizeCloudStateSnapshot((data as RemoteUserStateRow | null)?.state ?? null);
}

export async function syncCloudStateNow(
  snapshotOverride?: PersistedCloudStateSnapshot | null,
): Promise<boolean> {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    return false;
  }

  const userId = await readAuthenticatedCloudUserId();

  if (!userId) {
    return false;
  }

  if (readActiveStorageScope() !== scopeForCloudUser(userId)) {
    return false;
  }

  const snapshot = snapshotOverride ?? readLocalStateSnapshot();

  if (!hasMeaningfulLocalStateSnapshot(snapshot)) {
    return true;
  }

  const signature = JSON.stringify(snapshot);
  if (signature === lastSyncedSignature) {
    return true;
  }

  const { error } = await supabase.from("user_state").upsert(
    {
      user_id: userId,
      state: snapshot,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    console.debug("[cloud-state] snapshot sync skipped", { userId, error });
    return false;
  }

  lastSyncedSignature = signature;
  return true;
}

export function scheduleCloudStateSync() {
  if (typeof window === "undefined") {
    return;
  }

  if (pendingSyncTimer !== null) {
    window.clearTimeout(pendingSyncTimer);
  }

  pendingSyncTimer = window.setTimeout(() => {
    pendingSyncTimer = null;
    void syncCloudStateNow();
  }, SYNC_DEBOUNCE_MS);
}

export function resolveEffectiveCloudSnapshot(input: {
  remoteSnapshot: PersistedCloudStateSnapshot | null;
  remoteProfile: UserProfile | null;
  onboardingCompletedAt: string | null;
  localSnapshot: PersistedCloudStateSnapshot | null;
}) {
  if (input.remoteSnapshot) {
    const mergedRemoteSnapshot = mergeSnapshotWithRemoteProfile(
      input.remoteSnapshot,
      input.remoteProfile,
      input.onboardingCompletedAt,
    );

    return {
      source: "remote" as const,
      snapshot: mergedRemoteSnapshot,
    };
  }

  if (hasMeaningfulLocalStateSnapshot(input.localSnapshot)) {
    const mergedLocalSnapshot = mergeSnapshotWithRemoteProfile(
      input.localSnapshot,
      input.remoteProfile,
      input.onboardingCompletedAt,
    );

    return {
      source: "local" as const,
      snapshot: mergedLocalSnapshot,
    };
  }

  const mergedRemoteShell = mergeSnapshotWithRemoteProfile(
    null,
    input.remoteProfile,
    input.onboardingCompletedAt,
  );

  if (mergedRemoteShell) {
    return {
      source: "remote" as const,
      snapshot: mergedRemoteShell,
    };
  }

  return {
    source: "empty" as const,
    snapshot: null,
  };
}
