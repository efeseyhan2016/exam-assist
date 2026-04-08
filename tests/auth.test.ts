import test from "node:test";
import assert from "node:assert/strict";

import { isLocalAuthEnabledForRuntime } from "@/lib/auth";

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
