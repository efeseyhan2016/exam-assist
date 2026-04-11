import test from "node:test";
import assert from "node:assert/strict";

import {
  bindEventToResources,
  bindResourcesToEvents,
  bindResourcesToExams,
  buildResourceCoverageReport,
} from "@/lib/resource-document-binding";
import { AcademicEvent, RankedSubjectRisk, ResourceItem, SubjectSeed } from "@/lib/types";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const SUBJECT: SubjectSeed = {
  id: "man426",
  title: "Hizmet Kalitesi",
  shortLabel: "MAN426",
  contentLoad: 3,
  difficulty: 3,
  practiceNeed: 2,
  resourceFriction: 1,
  reliefFactor: 0,
  targetHours: 20,
  initialStudiedCredit: 0,
  calibration: { difficultyRaw: null, resourceReadinessRaw: null, preparednessRaw: null },
};

function makeEvent(overrides: Partial<AcademicEvent> = {}): AcademicEvent {
  return {
    id: "ev-1",
    courseId: "man426",
    type: "assignment_due",
    title: "SERVQUAL Ödevi",
    occurredAt: new Date("2026-04-10T10:00:00Z").toISOString(),
    dueAt: new Date("2026-04-14T23:59:00Z").toISOString(),
    source: "manual",
    provenance: "student_entered",
    significance: "high",
    planningImpact: "strong",
    status: "active",
    metadata: { scheduleKind: "assignment", subjectId: "man426" },
    ...overrides,
  };
}

function makeResource(overrides: Partial<ResourceItem> = {}): ResourceItem {
  return {
    id: "res-1",
    subjectId: "man426",
    title: "document1",
    type: "pdf",
    pageCount: 10,
    pagesRead: 0,
    fileSizeBytes: 50_000,
    uploadedAt: new Date("2026-04-09T10:00:00Z").toISOString(),
    ...overrides,
  };
}

function makeRankedSubject(overrides: Partial<RankedSubjectRisk> = {}): RankedSubjectRisk {
  return {
    subjectId: "man426",
    title: "Hizmet Kalitesi",
    shortLabel: "MAN426",
    examTitle: "Final",
    examDate: new Date("2026-05-01T09:00:00Z").toISOString(),
    hoursStudied: 5,
    targetHours: 20,
    remainingTargetHours: 15,
    effectiveStudyHoursLeft: 30,
    hoursUntilExam: 400,
    score: 55,
    label: "High",
    explanation: "Yeterli çalışma yok.",
    breakdown: {
      baseComplexity: 0,
      urgencyPressure: 0,
      capacityPressure: 0,
      portfolioOverloadPressure: 0,
      progressGap: 0,
      resourceGap: 0,
      sleepPenalty: 0,
      reliefBoost: 0,
      resourceReadinessSignal: 0,
    },
    ...overrides,
  };
}

// ─── bindEventToResources ─────────────────────────────────────────────────────

test("assignment event with content-derived brief resource → strong coverage", () => {
  const event = makeEvent();
  const resource = makeResource({ resourceKindHint: "brief" });
  const binding = bindEventToResources(event, [resource], [SUBJECT]);

  assert.ok(binding !== null);
  assert.equal(binding.coverageStatus, "strong");
  assert.equal(binding.relevantResources[0].relevanceReason, "primary_kind");
  assert.ok(binding.relevantResources[0].relevanceScore >= 0.70);
});

test("assignment event with only notes resource → partial coverage", () => {
  const event = makeEvent();
  const resource = makeResource({ resourceKindHint: "notes" });
  const binding = bindEventToResources(event, [resource], [SUBJECT]);

  assert.ok(binding !== null);
  assert.equal(binding.coverageStatus, "partial");
  assert.equal(binding.relevantResources[0].relevanceReason, "secondary_kind");
});

test("assignment event with no resources → missing coverage", () => {
  const event = makeEvent();
  const binding = bindEventToResources(event, [], [SUBJECT]);

  assert.ok(binding !== null);
  assert.equal(binding.coverageStatus, "missing");
  assert.equal(binding.relevantResources.length, 0);
});

test("project event with case resource → strong coverage, primary_kind", () => {
  const event = makeEvent({
    metadata: { scheduleKind: "project", subjectId: "man426" },
  });
  const resource = makeResource({ resourceKindHint: "case" });
  const binding = bindEventToResources(event, [resource], [SUBJECT]);

  assert.ok(binding !== null);
  assert.equal(binding.coverageStatus, "strong");
  assert.equal(binding.relevantResources[0].relevanceReason, "primary_kind");
});

test("returns null when event subject cannot be resolved", () => {
  const event = makeEvent({ courseId: "NONEXISTENT", metadata: {} });
  const binding = bindEventToResources(event, [makeResource()], [SUBJECT]);
  assert.equal(binding, null);
});

// ─── Content-derived vs title-derived kind ────────────────────────────────────

test("resourceKindHint takes priority over weak title", () => {
  const event = makeEvent();
  // Title says nothing useful, but content scanning found "brief"
  const resource = makeResource({ title: "scan001", resourceKindHint: "brief" });
  const binding = bindEventToResources(event, [resource], [SUBJECT]);

  assert.ok(binding !== null);
  assert.equal(binding.coverageStatus, "strong");
  assert.equal(binding.relevantResources[0].relevanceReason, "primary_kind");
});

test("title-derived kind used as fallback when no resourceKindHint", () => {
  const event = makeEvent();
  const resource = makeResource({ title: "MAN426 Assignment Brief", resourceKindHint: undefined });
  const binding = bindEventToResources(event, [resource], [SUBJECT]);

  assert.ok(binding !== null);
  assert.equal(binding.coverageStatus, "strong");
});

// ─── Score modifiers ──────────────────────────────────────────────────────────

test("nearly-finished resource gets a slight score penalty", () => {
  const event = makeEvent();
  const fresh = makeResource({ resourceKindHint: "brief", pagesRead: 0, pageCount: 10 });
  const done = makeResource({
    id: "res-done",
    resourceKindHint: "brief",
    pagesRead: 9,
    pageCount: 10,
  });

  const bindingFresh = bindEventToResources(event, [fresh], [SUBJECT]);
  const bindingDone = bindEventToResources(event, [done], [SUBJECT]);

  assert.ok(bindingFresh !== null && bindingDone !== null);
  assert.ok(
    bindingFresh.relevantResources[0].relevanceScore >
      bindingDone.relevantResources[0].relevanceScore,
  );
});

test("recently engaged resource gets a small score boost", () => {
  const event = makeEvent();
  const cold = makeResource({ resourceKindHint: "notes", engagementCount: 0 });
  const warm = makeResource({ id: "res-warm", resourceKindHint: "notes", engagementCount: 3 });

  const bindingCold = bindEventToResources(event, [cold], [SUBJECT]);
  const bindingWarm = bindEventToResources(event, [warm], [SUBJECT]);

  assert.ok(bindingCold !== null && bindingWarm !== null);
  assert.ok(
    bindingWarm.relevantResources[0].relevanceScore >
      bindingCold.relevantResources[0].relevanceScore,
  );
});

// ─── Exam binding ─────────────────────────────────────────────────────────────

test("exam binding: questions resource scores highest", () => {
  const subject = makeRankedSubject();
  const resources = [
    makeResource({ id: "r-q", resourceKindHint: "questions" }),
    makeResource({ id: "r-s", resourceKindHint: "summary" }),
    makeResource({ id: "r-n", resourceKindHint: "notes" }),
  ];

  const [binding] = bindResourcesToExams([subject], resources);

  assert.ok(binding !== null);
  assert.equal(binding.relevantResources[0].resource.id, "r-q");
  assert.equal(binding.relevantResources[0].relevanceReason, "primary_kind");
  assert.equal(binding.coverageStatus, "strong");
});

test("exam binding: only brief resource → missing coverage (below exam threshold)", () => {
  const subject = makeRankedSubject();
  const resources = [makeResource({ resourceKindHint: "brief" })];

  const [binding] = bindResourcesToExams([subject], resources);

  assert.ok(binding !== null);
  // brief scores 0.25 for exam — below the 0.40 secondary threshold → missing
  assert.equal(binding.coverageStatus, "missing");
  assert.equal(binding.relevantResources[0].relevanceReason, "same_subject_only");
});

test("exam binding: no resources → missing coverage", () => {
  const subject = makeRankedSubject();
  const [binding] = bindResourcesToExams([subject], []);

  assert.equal(binding.coverageStatus, "missing");
  assert.equal(binding.relevantResources.length, 0);
});

// ─── material_update event ────────────────────────────────────────────────────

test("material_update event binds exactly the referenced resource", () => {
  const event = makeEvent({
    type: "material_update",
    metadata: { resourceId: "res-specific", subjectId: "man426" },
  });
  const linked = makeResource({ id: "res-specific" });
  const other = makeResource({ id: "res-other" });

  const binding = bindEventToResources(event, [linked, other], [SUBJECT]);

  assert.ok(binding !== null);
  assert.equal(binding.relevantResources.length, 1);
  assert.equal(binding.relevantResources[0].resource.id, "res-specific");
  assert.equal(binding.relevantResources[0].relevanceScore, 1.0);
});

// ─── bindResourcesToEvents (active filter) ────────────────────────────────────

test("dismissed events are excluded from bindings", () => {
  const dismissed = makeEvent({ status: "dismissed" });
  const bindings = bindResourcesToEvents(
    [dismissed],
    [makeResource({ resourceKindHint: "brief" })],
    [SUBJECT],
  );
  assert.equal(bindings.length, 0);
});

test("active events produce bindings", () => {
  const active = makeEvent({ status: "active" });
  const bindings = bindResourcesToEvents(
    [active],
    [makeResource({ resourceKindHint: "brief" })],
    [SUBJECT],
  );
  assert.equal(bindings.length, 1);
});

// ─── buildResourceCoverageReport ──────────────────────────────────────────────

test("coverage report tracks both task and exam coverage per subject", () => {
  const event = makeEvent();
  const subject = makeRankedSubject();
  const resources = [
    makeResource({ id: "r-brief", resourceKindHint: "brief" }),
    makeResource({ id: "r-questions", resourceKindHint: "questions" }),
  ];

  const report = buildResourceCoverageReport([event], [subject], resources, [SUBJECT]);
  const coverage = report.subjectBindings.get("man426");

  assert.ok(coverage !== undefined);
  assert.equal(coverage.taskCoverage, "strong");
  assert.equal(coverage.examCoverage, "strong");
});

test("ungrouped resources are those not matched to any binding", () => {
  // No events — all resources are ungrouped in task; exam binding will match them
  const subject = makeRankedSubject();
  const resources = [makeResource({ id: "r-loose", resourceKindHint: "book" })];

  const report = buildResourceCoverageReport([], [subject], resources, [SUBJECT]);
  const coverage = report.subjectBindings.get("man426");

  assert.ok(coverage !== undefined);
  // book scores low for exam but is included in exam binding, so not ungrouped
  assert.equal(coverage.ungroupedResources.length, 0);
});

test("coverage report includes subjects with resources but no events", () => {
  const resources = [makeResource({ subjectId: "eco301", id: "r-eco" })];
  const report = buildResourceCoverageReport([], [], resources, [SUBJECT]);

  assert.ok(report.subjectBindings.has("eco301"));
  const coverage = report.subjectBindings.get("eco301")!;
  assert.equal(coverage.examCoverage, "missing");
  assert.equal(coverage.taskCoverage, "missing");
});

// ─── Score determinism ────────────────────────────────────────────────────────

test("scores are rounded to exactly 2 decimal places", () => {
  const event = makeEvent();
  const resource = makeResource({ resourceKindHint: "notes", engagementCount: 1 });
  const binding = bindEventToResources(event, [resource], [SUBJECT]);

  assert.ok(binding !== null);
  const score = binding.relevantResources[0].relevanceScore;
  assert.equal(score, Math.round(score * 100) / 100);
});

test("same inputs always produce identical scores", () => {
  const event = makeEvent();
  const resource = makeResource({ resourceKindHint: "summary", engagementCount: 2 });

  const b1 = bindEventToResources(event, [resource], [SUBJECT]);
  const b2 = bindEventToResources(event, [resource], [SUBJECT]);

  assert.ok(b1 !== null && b2 !== null);
  assert.equal(
    b1.relevantResources[0].relevanceScore,
    b2.relevantResources[0].relevanceScore,
  );
});

// ─── Turkish copy ─────────────────────────────────────────────────────────────

test("strong assignment coverage label is in Turkish", () => {
  const event = makeEvent();
  const resource = makeResource({ resourceKindHint: "brief" });
  const binding = bindEventToResources(event, [resource], [SUBJECT]);

  assert.ok(binding !== null);
  assert.equal(binding.coverageLabel, "Brief ve outline var");
});

test("missing exam coverage label is in Turkish", () => {
  const subject = makeRankedSubject();
  const [binding] = bindResourcesToExams([subject], []);
  assert.equal(binding.coverageLabel, "Sınav için kaynak yok");
});

test("strong project coverage label mentions case", () => {
  const event = makeEvent({ metadata: { scheduleKind: "project", subjectId: "man426" } });
  const resource = makeResource({ resourceKindHint: "case" });
  const binding = bindEventToResources(event, [resource], [SUBJECT]);

  assert.ok(binding !== null);
  assert.equal(binding.coverageLabel, "Brief, case veya outline var");
});
