"use client";

import type { AuthChangeEvent, User } from "@supabase/supabase-js";

import type { AuthAccount } from "@/lib/auth";
import {
  clearScopedStorageScope,
  writeActiveStorageScope,
} from "@/lib/storage";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { isSupabaseEnabled } from "@/lib/supabase/config";
import type { UserProfile } from "@/lib/types";

const PROFILE_COLUMNS =
  "id, full_name, language, university, department, class_year, known_languages, onboarding_completed_at, created_at, updated_at";

export interface CloudAuthAccount extends AuthAccount {
  email: string;
}

interface RemoteProfileRow {
  id: string;
  full_name: string;
  language: UserProfile["language"];
  university: string;
  department: string;
  class_year: UserProfile["classYear"];
  known_languages: UserProfile["knownLanguages"];
  onboarding_completed_at: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CloudAuthSnapshot {
  account: CloudAuthAccount | null;
  onboardingCompletedAt: string | null;
  profile: UserProfile | null;
  userId: string | null;
}

export type CloudSignupState = "authenticated" | "confirm_email" | "existing_account";

export function inferCloudDisplayName(user: Pick<User, "email" | "user_metadata" | "id">) {
  const metadataName = user.user_metadata?.display_name;
  if (typeof metadataName === "string" && metadataName.trim()) {
    return metadataName.trim();
  }

  if (typeof user.email === "string" && user.email.includes("@")) {
    return user.email.split("@")[0];
  }

  return `kullanici-${user.id.slice(0, 6)}`;
}

export function mapRemoteProfileRowToLocalProfile(
  row: RemoteProfileRow | null,
): UserProfile | null {
  if (!row?.onboarding_completed_at) {
    return null;
  }

  return {
    name: row.full_name,
    setupCompletedAt: row.onboarding_completed_at,
    language: row.language,
    university: row.university,
    department: row.department,
    classYear: row.class_year,
    knownLanguages: row.known_languages,
  };
}

export function buildRemoteProfilePayload(
  userId: string,
  profile: UserProfile,
): RemoteProfileRow {
  return {
    id: userId,
    full_name: profile.name,
    language: profile.language,
    university: profile.university,
    department: profile.department,
    class_year: profile.classYear,
    known_languages: profile.knownLanguages,
    onboarding_completed_at: profile.setupCompletedAt || null,
  };
}

export function inferCloudSignupState(payload: {
  session: { user?: { id: string } | null } | null;
  user?: { identities?: Array<unknown> | null } | null;
}): CloudSignupState {
  if (payload.session?.user?.id) {
    return "authenticated";
  }

  if (Array.isArray(payload.user?.identities) && payload.user.identities.length === 0) {
    return "existing_account";
  }

  return "confirm_email";
}

function cloudScopeForUser(userId: string) {
  return `supabase:${userId}`;
}

function mapCloudAuthError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "E-posta veya şifre hatalı.";
  }

  if (normalized.includes("email not confirmed")) {
    return "E-postanı doğruladıktan sonra giriş yapabilirsin.";
  }

  if (normalized.includes("already registered")) {
    return "Bu e-posta ile zaten bir hesap var.";
  }

  if (normalized.includes("password should be at least")) {
    return "Şifre en az 6 karakter olmalı.";
  }

  return "Hesap işlemi şu anda tamamlanamadı. Lütfen tekrar dene.";
}

async function fetchRemoteProfile(userId: string) {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.debug("[cloud-auth] profile fetch skipped", { userId, error });
    return null;
  }

  return data as RemoteProfileRow | null;
}

export async function readCloudAuthSnapshot(): Promise<CloudAuthSnapshot> {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    return {
      account: null,
      onboardingCompletedAt: null,
      profile: null,
      userId: null,
    };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    writeActiveStorageScope(null);
    return {
      account: null,
      onboardingCompletedAt: null,
      profile: null,
      userId: null,
    };
  }

  const { user } = session;
  const scope = cloudScopeForUser(user.id);
  writeActiveStorageScope(scope);

  const remoteProfile = await fetchRemoteProfile(user.id);

  if (!remoteProfile?.onboarding_completed_at) {
    clearScopedStorageScope(scope);
  }

  return {
    account: {
      id: user.id,
      displayName: inferCloudDisplayName(user),
      email: user.email ?? "",
      pin: null,
      createdAt: user.created_at ?? new Date().toISOString(),
    },
    onboardingCompletedAt: remoteProfile?.onboarding_completed_at ?? null,
    profile: mapRemoteProfileRowToLocalProfile(remoteProfile),
    userId: user.id,
  };
}

export async function signUpWithCloudAuth(input: {
  name: string;
  email: string;
  password: string;
}) {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    throw new Error("Supabase henüz yapılandırılmadı.");
  }

  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        display_name: input.name,
      },
    },
  });

  if (error) {
    throw new Error(mapCloudAuthError(error.message));
  }

  if (data.session?.user) {
    const scope = cloudScopeForUser(data.session.user.id);
    writeActiveStorageScope(scope);
  }

  return {
    signupState: inferCloudSignupState({
      session: data.session,
      user: data.user,
    }),
  };
}

export async function signInWithCloudAuth(input: {
  email: string;
  password: string;
}) {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    throw new Error("Supabase henüz yapılandırılmadı.");
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  if (error) {
    throw new Error(mapCloudAuthError(error.message));
  }

  if (data.user) {
    const scope = cloudScopeForUser(data.user.id);
    writeActiveStorageScope(scope);
  }
}

export async function signOutCloudAuth() {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    return;
  }

  await supabase.auth.signOut();
  writeActiveStorageScope(null);
}

export async function syncProfileToCloud(profile: UserProfile | null) {
  if (!profile || !isSupabaseEnabled()) {
    return false;
  }

  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    return false;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const payload = buildRemoteProfilePayload(user.id, profile);
  const { error } = await supabase.from("profiles").upsert(payload, {
    onConflict: "id",
  });

  if (error) {
    console.debug("[cloud-auth] profile sync skipped", { userId: user.id, error });
    return false;
  }

  const metadataName = user.user_metadata?.display_name;
  if (metadataName !== profile.name) {
    await supabase.auth.updateUser({
      data: {
        display_name: profile.name,
      },
    });
  }

  return true;
}

export function subscribeToCloudAuthChanges(
  callback: (event: AuthChangeEvent) => void,
) {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    return () => {};
  }

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event) => {
    callback(event);
  });

  return () => subscription.unsubscribe();
}
