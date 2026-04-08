import test from "node:test";
import assert from "node:assert/strict";

import {
  MAX_RESOURCE_FILE_SIZE_BYTES,
  validateResourceFile,
} from "@/lib/resource-validation";

test("resource validation accepts supported course files within the size limit", () => {
  assert.equal(
    validateResourceFile({
      name: "Lozan Baris Konferansi.pdf",
      size: 512_000,
      type: "application/pdf",
    } as File),
    null,
  );
});

test("resource validation rejects oversized files", () => {
  assert.equal(
    validateResourceFile({
      name: "very-large.pdf",
      size: MAX_RESOURCE_FILE_SIZE_BYTES + 1,
      type: "application/pdf",
    } as File),
    "Dosya 25 MB sınırını aşıyor.",
  );
});

test("resource validation rejects unsupported file types", () => {
  assert.equal(
    validateResourceFile({
      name: "notes.exe",
      size: 1024,
      type: "application/octet-stream",
    } as File),
    "Şimdilik sadece PDF, DOC ve DOCX yükleyebilirsin.",
  );
});
