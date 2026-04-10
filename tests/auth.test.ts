import test from "node:test";
import assert from "node:assert/strict";

import {
  hashPin,
  isLocalAuthEnabledForRuntime,
  readAuthSession,
  verifyPin,
} from "@/lib/auth";

test("legacy local auth is disabled in production when Supabase is active", () => {
  assert.equal(
    isLocalAuthEnabledForRuntime({
      nodeEnv: "production",
      supabaseEnabled: true,
    }),
    false,
  );
});

test("legacy local auth remains available outside the production cloud path", () => {
  assert.equal(
    isLocalAuthEnabledForRuntime({
      nodeEnv: "development",
      supabaseEnabled: true,
    }),
    true,
  );

  assert.equal(
    isLocalAuthEnabledForRuntime({
      nodeEnv: "production",
      supabaseEnabled: false,
    }),
    true,
  );
});

test("account-scoped PIN hashes differ for the same PIN", async () => {
  const firstHash = await hashPin("1234", "account-a");
  const secondHash = await hashPin("1234", "account-b");

  assert.notEqual(firstHash, secondHash);
  assert.equal(await verifyPin("1234", firstHash, "account-a"), true);
  assert.equal(await verifyPin("1234", firstHash, "account-b"), false);
});

test("legacy PIN hashes still verify for existing local accounts", async () => {
  const legacyHash = await hashPin("1234");

  assert.equal(await verifyPin("1234", legacyHash, "account-a"), true);
});

test("legacy sessions without expiresAt keep the original 30-day window", () => {
  const session = {
    accountId: "account-a",
    loggedInAt: "2026-04-01T10:00:00.000Z",
  };
  const storage = new Map([["examassist_auth_session", JSON.stringify(session)]]);

  Object.defineProperty(globalThis, "window", {
    value: {
      localStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
      },
    },
    configurable: true,
  });

  try {
    assert.deepEqual(readAuthSession(), {
      ...session,
      expiresAt: "2026-05-01T10:00:00.000Z",
    });
  } finally {
    delete (globalThis as { window?: unknown }).window;
  }
});
