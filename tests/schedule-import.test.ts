import test from "node:test";
import assert from "node:assert/strict";

import {
  choosePdfImportResult,
  inferScheduleItemKindFromText,
  parseScheduleImportFile,
} from "@/lib/schedule-import";

test("inferScheduleItemKindFromText distinguishes exam assignment and project language", () => {
  assert.equal(
    inferScheduleItemKindFromText("MAN409 final exam"),
    "exam",
  );
  assert.equal(
    inferScheduleItemKindFromText("AİT204 ödev teslimi"),
    "assignment",
  );
  assert.equal(
    inferScheduleItemKindFromText("Retail Marketing proje sunumu"),
    "project",
  );
  assert.equal(
    inferScheduleItemKindFromText("case study due date"),
    "project",
  );
});

test("parseScheduleImportFile reads markdown outline style rows and infers kinds", async () => {
  const file = new File(
    [
      [
        "# Course outline",
        "- Retail Marketing proje teslimi 18.04.2026 13:00",
        "- AİT204 ödev teslimi 20.04.2026 23:59",
        "- MAN440 final exam 22.04.2026 10:30",
      ].join("\n"),
    ],
    "outline.md",
    { type: "text/markdown" },
  );

  const result = await parseScheduleImportFile(file);

  assert.equal(result.accepted.length, 3);
  assert.equal(result.accepted[0]?.kind, "project");
  assert.equal(result.accepted[1]?.kind, "assignment");
  assert.equal(result.accepted[2]?.kind, "exam");
});

test("choosePdfImportResult prefers outline parsing when it finds non-exam kinds", () => {
  const result = choosePdfImportResult({
    examAccepted: [
      {
        title: "Retail Marketing Proje",
        scheduledAt: "2026-04-18T10:00:00.000Z",
        kind: "exam",
      },
    ],
    outlineResult: {
      accepted: [
        {
          title: "Retail Marketing Proje",
          scheduledAt: "2026-04-18T10:00:00.000Z",
          kind: "project",
        },
      ],
      rejected: [],
    },
  });

  assert.equal(result.accepted[0]?.kind, "project");
});

test("choosePdfImportResult falls back to exam extraction when outline parsing finds nothing useful", () => {
  const result = choosePdfImportResult({
    examAccepted: [
      {
        title: "MAN440 Final",
        scheduledAt: "2026-04-22T10:30:00.000Z",
        kind: "exam",
      },
    ],
    outlineResult: {
      accepted: [],
      rejected: ["Line 1 could not be imported"],
    },
  });

  assert.equal(result.accepted[0]?.kind, "exam");
});
