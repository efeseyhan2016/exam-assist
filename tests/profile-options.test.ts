import test from "node:test";
import assert from "node:assert/strict";

import {
  canonicalizeDepartmentName,
  canonicalizeUniversityName,
  inferDepartmentMatchScore,
  inferTitleLanguageHint,
} from "@/lib/profile-options";

test("canonicalizeUniversityName resolves common Turkish university aliases", () => {
  assert.equal(canonicalizeUniversityName("odtü"), "Orta Doğu Teknik Üniversitesi");
  assert.equal(canonicalizeUniversityName("İTÜ"), "İstanbul Teknik Üniversitesi");
});

test("canonicalizeDepartmentName resolves common department aliases", () => {
  assert.equal(canonicalizeDepartmentName("YBS"), "Yönetim Bilişim Sistemleri");
  assert.equal(canonicalizeDepartmentName("business"), "İşletme");
});

test("inferDepartmentMatchScore stays weak but detects compatible aliases", () => {
  assert.equal(inferDepartmentMatchScore("İktisat", "EKO (NÖ)"), 3);
  assert.equal(
    inferDepartmentMatchScore("Yönetim Bilişim Sistemleri", "Yönetim Bilişim Sistemleri"),
    3,
  );
});

test("inferTitleLanguageHint only returns a simple soft hint", () => {
  assert.equal(inferTitleLanguageHint("Commercial Law II"), "en");
  assert.equal(inferTitleLanguageHint("Ticaret Hukuku II"), "tr");
  assert.equal(inferTitleLanguageHint("MAT101"), "mixed");
});
