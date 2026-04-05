import test from "node:test";
import assert from "node:assert/strict";

import {
  buildRemoteProfilePayload,
  inferCloudSignupState,
  inferCloudDisplayName,
  mapRemoteProfileRowToLocalProfile,
} from "@/lib/cloud-auth";

test("inferCloudDisplayName prefers metadata name and falls back to email prefix", () => {
  assert.equal(
    inferCloudDisplayName({
      id: "user-1",
      email: "efe@example.com",
      user_metadata: { display_name: "Efe Balcilar" },
    } as never),
    "Efe Balcilar",
  );

  assert.equal(
    inferCloudDisplayName({
      id: "user-2",
      email: "ayse@example.com",
      user_metadata: {},
    } as never),
    "ayse",
  );
});

test("remote profile rows map cleanly into local user profiles only after onboarding completes", () => {
  assert.equal(
    mapRemoteProfileRowToLocalProfile({
      id: "user-1",
      full_name: "Efe Balcilar",
      language: "tr",
      university: "Boğaziçi Üniversitesi",
      department: "İşletme",
      class_year: "3",
      known_languages: ["tr", "en"],
      onboarding_completed_at: null,
    }),
    null,
  );

  assert.deepEqual(
    mapRemoteProfileRowToLocalProfile({
      id: "user-1",
      full_name: "Efe Balcilar",
      language: "tr",
      university: "Boğaziçi Üniversitesi",
      department: "İşletme",
      class_year: "3",
      known_languages: ["tr", "en"],
      onboarding_completed_at: "2026-04-03T10:00:00.000Z",
    }),
    {
      name: "Efe Balcilar",
      setupCompletedAt: "2026-04-03T10:00:00.000Z",
      language: "tr",
      university: "Boğaziçi Üniversitesi",
      department: "İşletme",
      classYear: "3",
      knownLanguages: ["tr", "en"],
    },
  );
});

test("buildRemoteProfilePayload keeps profile fields aligned with the local contract", () => {
  assert.deepEqual(
    buildRemoteProfilePayload("user-1", {
      name: "Efe Balcilar",
      setupCompletedAt: "2026-04-03T10:00:00.000Z",
      language: "tr",
      university: "Boğaziçi Üniversitesi",
      department: "İşletme",
      classYear: "3",
      knownLanguages: ["tr", "en"],
    }),
    {
      id: "user-1",
      full_name: "Efe Balcilar",
      language: "tr",
      university: "Boğaziçi Üniversitesi",
      department: "İşletme",
      class_year: "3",
      known_languages: ["tr", "en"],
      onboarding_completed_at: "2026-04-03T10:00:00.000Z",
    },
  );
});

test("inferCloudSignupState distinguishes real signup outcomes without overclaiming", () => {
  assert.equal(
    inferCloudSignupState({
      session: { user: { id: "user-1" } },
      user: { identities: [{ id: "identity-1" }] },
    }),
    "authenticated",
  );

  assert.equal(
    inferCloudSignupState({
      session: null,
      user: { identities: [] },
    }),
    "existing_account",
  );

  assert.equal(
    inferCloudSignupState({
      session: null,
      user: { identities: [{ id: "identity-1" }] },
    }),
    "confirm_email",
  );
});
