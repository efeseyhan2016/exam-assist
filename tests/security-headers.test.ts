import test from "node:test";
import assert from "node:assert/strict";

import { buildContentSecurityPolicy } from "@/lib/security-headers";

test("content security policy includes the browser hardening directives we rely on", () => {
  const csp = buildContentSecurityPolicy({
    nodeEnv: "production",
    supabaseUrl: "https://spzppzsjqfwdsggaxvgn.supabase.co",
  });

  assert.match(csp, /default-src 'self'/);
  assert.match(csp, /object-src 'none'/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(csp, /worker-src 'self' blob:/);
  assert.match(csp, /frame-src 'self' blob:/);
  assert.match(csp, /connect-src .*https:\/\/spzppzsjqfwdsggaxvgn\.supabase\.co/);
  assert.doesNotMatch(csp, /unsafe-eval/);
});

test("development CSP keeps eval enabled for Next dev while staying scoped", () => {
  const csp = buildContentSecurityPolicy({ nodeEnv: "development" });

  assert.match(csp, /script-src 'self' 'unsafe-inline' 'unsafe-eval'/);
  assert.match(csp, /connect-src .*wss:\/\/\*\.supabase\.co/);
});
