import test from "node:test";
import assert from "node:assert/strict";

import { resolveCanonicalRedirectUrl } from "@/lib/canonical-host";

test("canonical redirect ignores localhost and canonical domain", () => {
  assert.equal(
    resolveCanonicalRedirectUrl(new URL("http://127.0.0.1:3005/?welcome=1")),
    null,
  );

  assert.equal(
    resolveCanonicalRedirectUrl(
      new URL("https://exam-assist.vercel.app/?welcome=1"),
    ),
    null,
  );
});

test("canonical redirect rewrites preview vercel domains onto the main domain", () => {
  assert.equal(
    resolveCanonicalRedirectUrl(
      new URL(
        "https://exam-assist-lfqgd1uwt-efesler99-3782s-projects.vercel.app/path?a=1",
      ),
    ),
    "https://exam-assist.vercel.app/path?a=1",
  );
});
