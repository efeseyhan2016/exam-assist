import test from "node:test";
import assert from "node:assert/strict";

import { buildCloudResourcePath } from "@/lib/cloud-resources";

test("buildCloudResourcePath keeps files scoped under the authenticated user", () => {
  assert.equal(
    buildCloudResourcePath("user-123", "resource-456", "Atatürk Dönemi İç Politika.pdf"),
    "user-123/resource-456/ataturk-donemi-ic-politika.pdf",
  );
});

test("buildCloudResourcePath falls back to a safe filename when the title is noisy", () => {
  assert.equal(
    buildCloudResourcePath("user-123", "resource-456", "   ###   "),
    "user-123/resource-456/resource",
  );
});
