import {
  AcademicEvent,
  AcademicEventPlanningImpact,
  AcademicEventSignificance,
  AcademicEventStatus,
  ExamOutcome,
  RankedSubjectRisk,
  ResourceItem,
  ScheduleItem,
  ScheduleItemKind,
  SubjectSeed,
} from "@/lib/types";

const DAY_MS = 24 * 60 * 60 * 1000;

function hoursUntil(dateString: string, now: Date) {
  return (new Date(dateString).getTime() - now.getTime()) / 3_600_000;
}

function readMetadataString(
  metadata: AcademicEvent["metadata"] | undefined,
  key: string,
) {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function buildDefaultSummary(event: AcademicEvent, now: Date) {
  if (event.type === "assignment_due" || event.type === "deadline_change") {
    const scheduleKind = readMetadataString(event.metadata, "scheduleKind") as ScheduleItemKind | null;
    if (event.dueAt) {
      const remainingHours = hoursUntil(event.dueAt, now);
      if (remainingHours < 0) {
        if (scheduleKind === "project") {
          return "Bu proje biraz geride kalmış görünüyor; haftanın odağını etkileyebilir.";
        }
        if (scheduleKind === "assignment") {
          return "Bu ödev biraz geride kalmış görünüyor; haftanın akışını etkileyebilir.";
        }
        return "Bu iş biraz geride kalmış görünüyor; bu haftaki odağı etkileyebilir.";
      }
      if (remainingHours <= 48) {
        if (scheduleKind === "project") {
          return "Bu proje teslimi bu haftaki akışı doğrudan etkileyebilir.";
        }
        if (scheduleKind === "assignment") {
          return "Bu ödev bu haftaki akışı doğrudan etkileyebilir.";
        }
        return "Bu teslim bu haftaki akışı doğrudan etkileyebilir.";
      }
    }

    if (scheduleKind === "project") {
      return "Bu proje için küçük bir çalışma bloğu açmak iyi olabilir.";
    }
    if (scheduleKind === "assignment") {
      return "Bu ödev için kısa bir blok ayırmak iyi olabilir.";
    }
    return "Bu teslim için küçük bir çalışma bloğu açmak iyi olabilir.";
  }

  if (event.type === "material_update") {
    return "Bu kaynakla başlamak, bu haftaki ilk tekrar bloğunu daha net kurabilir.";
  }

  if (event.type === "grade_release") {
    return "Bu sonuç, o dersin şu an ne kadar dikkat istediğini yeniden çerçeveleyebilir.";
  }

  if (event.type === "announcement") {
    return "Bu duyuru, dersin akışını etkileyebilecek bir işaret taşıyor.";
  }

  return "Bu değişiklik planını biraz yeniden şekillendirebilir.";
}

export function deriveAcademicEventStatus(
  event: AcademicEvent,
  now: Date = new Date(),
): AcademicEventStatus {
  if (event.status === "dismissed" || event.status === "resolved") {
    return event.status;
  }

  if (event.type === "material_update") {
    const ageMs = now.getTime() - new Date(event.occurredAt).getTime();
    return ageMs > 14 * DAY_MS ? "expired" : "active";
  }

  if (event.type === "grade_release") {
    const ageMs = now.getTime() - new Date(event.occurredAt).getTime();
    return ageMs > 21 * DAY_MS ? "expired" : "active";
  }

  if (event.dueAt) {
    const overdueMs = now.getTime() - new Date(event.dueAt).getTime();
    return overdueMs > 7 * DAY_MS ? "expired" : "active";
  }

  return "active";
}

export function deriveAcademicEventSignificance(
  event: AcademicEvent,
  now: Date = new Date(),
): AcademicEventSignificance {
  if (event.type === "material_update") {
    const ageMs = now.getTime() - new Date(event.occurredAt).getTime();
    return ageMs <= 3 * DAY_MS ? "medium" : "low";
  }

  if (event.type === "grade_release") {
    const ageMs = now.getTime() - new Date(event.occurredAt).getTime();
    return ageMs <= 7 * DAY_MS ? "medium" : "low";
  }

  if (event.dueAt) {
    const remainingHours = hoursUntil(event.dueAt, now);

    if (remainingHours < 0) {
      return "high";
    }

    if (remainingHours <= 72) {
      return "high";
    }

    if (remainingHours <= 7 * 24) {
      return "medium";
    }
  }

  if (event.type === "announcement" || event.type === "deadline_change") {
    return "medium";
  }

  return "low";
}

export function deriveAcademicEventPlanningImpact(
  event: AcademicEvent,
  now: Date = new Date(),
): AcademicEventPlanningImpact {
  if (event.type === "material_update") {
    return event.significance === "medium" ? "soft" : "none";
  }

  if (event.type === "grade_release") {
    return event.significance === "medium" ? "soft" : "none";
  }

  if (event.dueAt) {
    const remainingHours = hoursUntil(event.dueAt, now);

    if (remainingHours < 0 || remainingHours <= 72) {
      return "strong";
    }

    if (remainingHours <= 7 * 24) {
      return "soft";
    }
  }

  if (event.type === "deadline_change" || event.type === "announcement") {
    return "soft";
  }

  return "none";
}

export function refreshAcademicEvent(
  event: AcademicEvent,
  now: Date = new Date(),
): AcademicEvent {
  const status = deriveAcademicEventStatus(event, now);
  const refreshed: AcademicEvent = {
    ...event,
    status,
  };

  if (status !== "active") {
    return {
      ...refreshed,
      significance: "low",
      planningImpact: "none",
      summary: refreshed.summary ?? buildDefaultSummary(refreshed, now),
    };
  }

  const significance = deriveAcademicEventSignificance(refreshed, now);
  const withSignificance = {
    ...refreshed,
    significance,
  };

  return {
    ...withSignificance,
    planningImpact: deriveAcademicEventPlanningImpact(withSignificance, now),
    summary: withSignificance.summary ?? buildDefaultSummary(withSignificance, now),
  };
}

function significanceWeight(value: AcademicEventSignificance) {
  return value === "high" ? 3 : value === "medium" ? 2 : 1;
}

function planningImpactWeight(value: AcademicEventPlanningImpact) {
  return value === "strong" ? 3 : value === "soft" ? 2 : 1;
}

function timeWeight(event: AcademicEvent, now: Date) {
  if (!event.dueAt) {
    return 0;
  }

  const remainingHours = hoursUntil(event.dueAt, now);
  if (remainingHours < 0) return 10_000 + Math.abs(remainingHours);
  return 10_000 - remainingHours;
}

export function sortAcademicEvents(
  events: AcademicEvent[],
  now: Date = new Date(),
) {
  return [...events].sort((left, right) => {
    const significanceDelta =
      significanceWeight(right.significance) - significanceWeight(left.significance);
    if (significanceDelta !== 0) return significanceDelta;

    const planningDelta =
      planningImpactWeight(right.planningImpact) -
      planningImpactWeight(left.planningImpact);
    if (planningDelta !== 0) return planningDelta;

    const timeDelta = timeWeight(right, now) - timeWeight(left, now);
    if (timeDelta !== 0) return timeDelta;

    return (
      new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime()
    );
  });
}

export function getActiveAcademicEvents(
  events: AcademicEvent[],
  now: Date = new Date(),
) {
  return sortAcademicEvents(
    events
      .map((event) => refreshAcademicEvent(event, now))
      .filter((event) => event.status === "active"),
    now,
  );
}

export function upsertAcademicEventInList(
  events: AcademicEvent[],
  nextEvent: AcademicEvent,
) {
  return sortAcademicEvents(
    [...events.filter((event) => event.id !== nextEvent.id), nextEvent],
    new Date(nextEvent.occurredAt),
  );
}

export function createScheduleTaskAcademicEvent(
  item: ScheduleItem,
  now: Date = new Date(),
): AcademicEvent | null {
  if (item.kind === "exam") {
    return null;
  }

  return refreshAcademicEvent(
    {
      id: `schedule-item:${item.id}`,
      courseId: item.shortLabel,
      type: "assignment_due",
      title: item.title,
      occurredAt: now.toISOString(),
      dueAt: item.scheduledAt,
      source: "manual",
      provenance: "student_entered",
      significance: "medium",
      planningImpact: "soft",
      status: "active",
      summary:
        item.notes?.trim() ||
        buildDefaultSummary(
          {
            id: `schedule-item:${item.id}`,
            courseId: item.shortLabel,
            type: "assignment_due",
            title: item.title,
            occurredAt: now.toISOString(),
            dueAt: item.scheduledAt,
            source: "manual",
            provenance: "student_entered",
            significance: "medium",
            planningImpact: "soft",
            status: "active",
            metadata: {
              scheduleItemId: item.id,
              shortLabel: item.shortLabel,
              title: item.title,
              scheduleKind: item.kind,
            },
          },
          now,
        ),
      metadata: {
        scheduleItemId: item.id,
        shortLabel: item.shortLabel,
        title: item.title,
        scheduleKind: item.kind,
      },
    },
    now,
  );
}

export function createMaterialUpdateAcademicEvent(
  resource: ResourceItem,
  now: Date = new Date(),
): AcademicEvent {
  return refreshAcademicEvent(
    {
      id: `resource-update:${resource.id}`,
      courseId: resource.subjectId,
      type: "material_update",
      title: `${resource.title} eklendi`,
      occurredAt: resource.uploadedAt,
      source: "file_import",
      provenance: "student_entered",
      significance: "medium",
      planningImpact: "soft",
      status: "active",
      summary: "Bu yeni kaynak, bu hafta derse daha rahat başlamanı sağlayabilir.",
      metadata: {
        resourceId: resource.id,
        subjectId: resource.subjectId,
        topicHint: resource.topicHints?.[0],
      },
    },
    now,
  );
}

export function createGradeReleaseAcademicEvent(
  outcome: ExamOutcome,
  context: { subjectTitle?: string; shortLabel?: string } = {},
  now: Date = new Date(),
): AcademicEvent {
  const title = context.subjectTitle
    ? `${context.subjectTitle} sonucu güncellendi`
    : "Yeni sonuç kaydı eklendi";

  return refreshAcademicEvent(
    {
      id: `grade-release:${outcome.id}`,
      courseId: outcome.subjectId,
      type: "grade_release",
      title,
      occurredAt: outcome.updatedAt,
      source: "manual",
      provenance: "student_entered",
      significance: "medium",
      planningImpact: "soft",
      status: "active",
      summary: "Bu sonuç, derse nasıl yaklaşacağını biraz yeniden düşünmene yardım edebilir.",
      metadata: {
        outcomeId: outcome.id,
        subjectId: outcome.subjectId,
        shortLabel: context.shortLabel,
        score: outcome.score,
      },
    },
    now,
  );
}

export function matchAcademicEventSubjectId(
  event: AcademicEvent,
  subjects: SubjectSeed[],
) {
  const directSubjectId = readMetadataString(event.metadata, "subjectId");
  if (directSubjectId && subjects.some((subject) => subject.id === directSubjectId)) {
    return directSubjectId;
  }

  const exactIdMatch = subjects.find((subject) => subject.id === event.courseId);
  if (exactIdMatch) {
    return exactIdMatch.id;
  }

  const shortLabel = readMetadataString(event.metadata, "shortLabel");
  if (shortLabel) {
    const labelMatch = subjects.find(
      (subject) => subject.shortLabel.toLowerCase() === shortLabel.toLowerCase(),
    );
    if (labelMatch) {
      return labelMatch.id;
    }
  }

  const title = readMetadataString(event.metadata, "title") ?? event.title;
  const normalizedTitle = title.toLowerCase();
  const containsMatch = subjects.find(
    (subject) =>
      normalizedTitle.includes(subject.shortLabel.toLowerCase()) ||
      normalizedTitle.includes(subject.title.toLowerCase()),
  );

  return containsMatch?.id ?? null;
}

function getAcademicEventCourseLabel(event: AcademicEvent, subjects: SubjectSeed[]) {
  const subjectId = matchAcademicEventSubjectId(event, subjects);
  if (subjectId) {
    return subjects.find((subject) => subject.id === subjectId)?.shortLabel ?? event.courseId;
  }

  return readMetadataString(event.metadata, "shortLabel") ?? event.courseId;
}

export function buildAcademicEventDisplay(
  event: AcademicEvent,
  subjects: SubjectSeed[],
) {
  const subjectId = matchAcademicEventSubjectId(event, subjects);
  return {
    subjectId,
    courseLabel: getAcademicEventCourseLabel(event, subjects),
    title: event.title,
    body: event.summary ?? buildDefaultSummary(event, new Date()),
    type: event.type,
    significance: event.significance,
    planningImpact: event.planningImpact,
  };
}

export function buildAcademicHomeSignal(
  events: AcademicEvent[],
  subjects: SubjectSeed[],
  now: Date = new Date(),
) {
  const topEvent = getActiveAcademicEvents(events, now).find(
    (event) => event.planningImpact !== "none",
  );

  if (!topEvent) {
    return null;
  }

  const display = buildAcademicEventDisplay(topEvent, subjects);

  return {
    eventId: topEvent.id,
    type: topEvent.type,
    courseLabel: display.courseLabel,
    title: display.title,
    body: display.body,
  };
}

export function buildAcademicPrioritiesSignal(
  events: AcademicEvent[],
  subjects: SubjectSeed[],
  now: Date = new Date(),
) {
  const relevant = getActiveAcademicEvents(events, now).filter(
    (event) => event.planningImpact !== "none",
  );

  if (relevant.length === 0) {
    return null;
  }

  const top = buildAcademicEventDisplay(relevant[0], subjects);

  return {
    title:
      relevant.length === 1
        ? `${top.courseLabel} tarafında yeni akademik sinyal var`
        : `Bu hafta ${relevant.length} akademik değişiklik planı etkiliyor`,
    body: top.body,
  };
}

export function createUpcomingExamAcademicEvent(
  rankedSubject: RankedSubjectRisk,
  now: Date = new Date(),
): AcademicEvent {
  const hoursLeft = rankedSubject.hoursUntilExam;
  const dueAt = rankedSubject.examDate;
  const significance: AcademicEventSignificance =
    hoursLeft <= 72 || rankedSubject.label === "Critical" || rankedSubject.label === "High"
      ? "high"
      : "medium";
  const planningImpact: AcademicEventPlanningImpact =
    significance === "high" ? "strong" : "soft";

  const summary =
    hoursLeft <= 24
      ? "Bu sınav artık çok yakın. Bugünkü odağın doğal olarak burada toplanabilir."
      : hoursLeft <= 72
        ? "Bu sınav bu haftanın ana odaklarından biri gibi görünüyor."
        : "Bu sınav yaklaşıyor; haftayı şekillendiren derslerden biri olmaya başlamış.";

  return refreshAcademicEvent(
    {
      id: `derived-exam:${rankedSubject.subjectId}`,
      courseId: rankedSubject.subjectId,
      type: "exam",
      title: `${rankedSubject.shortLabel} sınavı yaklaşıyor`,
      occurredAt: now.toISOString(),
      dueAt,
      source: "system_generation",
      provenance: "system_derived",
      significance,
      planningImpact,
      status: "active",
      summary,
      metadata: {
        subjectId: rankedSubject.subjectId,
        shortLabel: rankedSubject.shortLabel,
        title: rankedSubject.title,
        examTitle: rankedSubject.examTitle,
      },
    },
    now,
  );
}

export function buildAcademicInboxEvents(
  events: AcademicEvent[],
  rankedSubjects: RankedSubjectRisk[],
  now: Date = new Date(),
) {
  const activeEvents = getActiveAcademicEvents(events, now);
  if (activeEvents.length > 0) {
    return activeEvents;
  }

  return rankedSubjects
    .filter((subject) => subject.hoursUntilExam > 0)
    .slice(0, 3)
    .map((subject) => createUpcomingExamAcademicEvent(subject, now));
}
