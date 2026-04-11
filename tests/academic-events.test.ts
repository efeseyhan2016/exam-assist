import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAcademicInboxEvents,
  buildAcademicHomeSignal,
  createUpcomingExamAcademicEvent,
  createGradeReleaseAcademicEvent,
  createMaterialUpdateAcademicEvent,
  createScheduleTaskAcademicEvent,
  getActiveAcademicEvents,
  matchAcademicEventSubjectId,
} from "@/lib/academic-events";
import { AcademicEvent, ExamOutcome, ResourceItem, ScheduleItem, SubjectSeed } from "@/lib/types";

const subjects: SubjectSeed[] = [
  {
    id: "man409",
    title: "Retail Marketing Management",
    shortLabel: "MAN409",
    contentLoad: 3,
    difficulty: 3,
    practiceNeed: 2,
    resourceFriction: 2,
    reliefFactor: 0.2,
    targetHours: 8,
    initialStudiedCredit: 0,
    calibration: {
      difficultyRaw: null,
      resourceReadinessRaw: null,
      preparednessRaw: null,
    },
  },
];

test("manual deadline events become high significance near due date", () => {
  const item: ScheduleItem = {
    id: "deadline-1",
    title: "MAN409 case teslimi",
    shortLabel: "MAN409",
    scheduledAt: "2026-04-12T09:00:00.000Z",
    kind: "deadline",
    source: "manual",
  };

  const event = createScheduleTaskAcademicEvent(
    item,
    new Date("2026-04-10T12:00:00.000Z"),
  );

  assert.ok(event);
  assert.equal(event?.significance, "high");
  assert.equal(event?.planningImpact, "strong");
});

test("material update events start as medium significance and soft planning impact", () => {
  const resource: ResourceItem = {
    id: "resource-1",
    subjectId: "man409",
    title: "Week 7 Slides",
    type: "pdf",
    pageCount: 18,
    pagesRead: 0,
    fileSizeBytes: 2048,
    uploadedAt: "2026-04-10T09:00:00.000Z",
    engagementCount: 0,
    revisitCount: 0,
  };

  const event = createMaterialUpdateAcademicEvent(
    resource,
    new Date("2026-04-10T12:00:00.000Z"),
  );

  assert.equal(event.significance, "medium");
  assert.equal(event.planningImpact, "soft");
});

test("grade release events create a soft academic signal", () => {
  const outcome: ExamOutcome = {
    id: "outcome-1",
    examId: "exam-1",
    subjectId: "man409",
    score: 72,
    createdAt: "2026-04-10T09:00:00.000Z",
    updatedAt: "2026-04-10T10:00:00.000Z",
  };

  const event = createGradeReleaseAcademicEvent(outcome, {
    subjectTitle: "Retail Marketing Management",
    shortLabel: "MAN409",
  });

  assert.equal(event.type, "grade_release");
  assert.equal(event.significance, "medium");
  assert.equal(event.planningImpact, "soft");
});

test("academic event subject matching uses metadata and short labels", () => {
  const event: AcademicEvent = {
    id: "event-1",
    courseId: "MAN409",
    type: "assignment_due",
    title: "Retail case teslimi",
    occurredAt: "2026-04-10T10:00:00.000Z",
    dueAt: "2026-04-12T09:00:00.000Z",
    source: "manual",
    provenance: "student_entered",
    significance: "high",
    planningImpact: "strong",
    status: "active",
    metadata: {
      shortLabel: "MAN409",
    },
  };

  assert.equal(matchAcademicEventSubjectId(event, subjects), "man409");
});

test("home signal picks the strongest active academic event", () => {
  const events: AcademicEvent[] = [
    {
      id: "event-material",
      courseId: "man409",
      type: "material_update",
      title: "Week 7 Slides eklendi",
      occurredAt: "2026-04-10T09:00:00.000Z",
      source: "file_import",
      provenance: "student_entered",
      significance: "medium",
      planningImpact: "soft",
      status: "active",
      summary: "Yeni kaynak bu hafta review başlangıcını daha net kurabilir.",
      metadata: { subjectId: "man409" },
    },
    {
      id: "event-deadline",
      courseId: "MAN409",
      type: "assignment_due",
      title: "Case teslimi yarın",
      occurredAt: "2026-04-10T09:30:00.000Z",
      dueAt: "2026-04-11T12:00:00.000Z",
      source: "manual",
      provenance: "student_entered",
      significance: "high",
      planningImpact: "strong",
      status: "active",
      summary: "Bu teslim bu haftaki çalışma baskısını doğrudan etkiliyor.",
      metadata: { shortLabel: "MAN409" },
    },
  ];

  const signal = buildAcademicHomeSignal(
    getActiveAcademicEvents(events, new Date("2026-04-10T12:00:00.000Z")),
    subjects,
    new Date("2026-04-10T12:00:00.000Z"),
  );

  assert.ok(signal);
  assert.equal(signal?.courseLabel, "MAN409");
  assert.equal(signal?.title, "Case teslimi yarın");
});

test("inbox falls back to derived upcoming exam signals when no active academic events exist", () => {
  const events = buildAcademicInboxEvents(
    [],
    [
      {
        subjectId: "man409",
        title: "Retail Marketing Management",
        shortLabel: "MAN409",
        examTitle: "Retail Marketing Final",
        examDate: "2026-04-11T12:00:00.000Z",
        hoursStudied: 0,
        targetHours: 8,
        remainingTargetHours: 8,
        effectiveStudyHoursLeft: 4,
        hoursUntilExam: 24,
        score: 88,
        label: "Critical",
        explanation: "Yakın sınav ve yüksek açık var.",
        breakdown: {
          baseComplexity: 10,
          urgencyPressure: 18,
          capacityPressure: 24,
          portfolioOverloadPressure: 8,
          progressGap: 14,
          resourceGap: 4,
          sleepPenalty: 4,
          reliefBoost: 0,
          resourceReadinessSignal: 1,
        },
      },
    ],
    new Date("2026-04-10T12:00:00.000Z"),
  );

  assert.equal(events.length, 1);
  assert.equal(events[0]?.type, "exam");
  assert.equal(events[0]?.provenance, "system_derived");
  assert.equal(events[0]?.planningImpact, "strong");
});

test("derived upcoming exam event uses calm but strong copy for very near exams", () => {
  const event = createUpcomingExamAcademicEvent(
    {
      subjectId: "man409",
      title: "Retail Marketing Management",
      shortLabel: "MAN409",
      examTitle: "Retail Marketing Final",
      examDate: "2026-04-11T12:00:00.000Z",
      hoursStudied: 0,
      targetHours: 8,
      remainingTargetHours: 8,
      effectiveStudyHoursLeft: 4,
      hoursUntilExam: 12,
      score: 90,
      label: "Critical",
      explanation: "Yakın sınav ve yüksek açık var.",
      breakdown: {
        baseComplexity: 10,
        urgencyPressure: 18,
        capacityPressure: 24,
        portfolioOverloadPressure: 8,
        progressGap: 14,
        resourceGap: 4,
        sleepPenalty: 4,
        reliefBoost: 0,
        resourceReadinessSignal: 1,
      },
    },
    new Date("2026-04-10T12:00:00.000Z"),
  );

  assert.equal(event.type, "exam");
  assert.equal(event.significance, "high");
  assert.match(event.summary ?? "", /çok yakın/i);
});
