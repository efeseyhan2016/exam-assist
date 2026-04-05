import test from "node:test";
import assert from "node:assert/strict";

import { readAuthFlowNotice, shouldForceWelcome } from "@/lib/entry-flow";

test("shouldForceWelcome only activates for the explicit welcome query", () => {
  assert.equal(shouldForceWelcome("?welcome=1"), true);
  assert.equal(shouldForceWelcome("?welcome=0"), false);
  assert.equal(shouldForceWelcome("?foo=bar"), false);
  assert.equal(shouldForceWelcome(""), false);
});

test("readAuthFlowNotice turns auth callback errors into calm copy", () => {
  assert.equal(
    readAuthFlowNotice(
      "?error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+expired",
    ),
    "E-posta linkinin süresi dolmuş görünüyor. Giriş ekranından tekrar devam edebilirsin.",
  );
  assert.equal(
    readAuthFlowNotice("?error=access_denied"),
    "Bağlantı şu anda tamamlanamadı. Hesabına giriş yaparak devam edebilirsin.",
  );
  assert.equal(readAuthFlowNotice(""), null);
});
