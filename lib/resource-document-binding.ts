import {
  getActiveAcademicEvents,
  matchAcademicEventSubjectId,
} from "@/lib/academic-events";
import {
  AcademicEvent,
  AcademicEventType,
  RankedSubjectRisk,
  ResourceItem,
  ResourceKindHint,
  ScheduleItemKind,
  SubjectId,
  SubjectSeed,
} from "@/lib/types";

// ─── Public Types ─────────────────────────────────────────────────────────────

export type RelevanceReason =
  | "primary_kind"
  | "secondary_kind"
  | "same_subject_only";

export type CoverageStatus = "strong" | "partial" | "missing";

export interface BoundResource {
  resource: ResourceItem;
  /** 0.0–1.0, deterministic, rounded to 2 decimal places */
  relevanceScore: number;
  relevanceReason: RelevanceReason;
}

export interface ResourceBinding {
  eventId: string;
  eventType: AcademicEventType;
  scheduleKind: ScheduleItemKind | null;
  subjectId: SubjectId;
  relevantResources: BoundResource[];
  coverageStatus: CoverageStatus;
  /** Turkish, concise — suitable for a badge or inline label */
  coverageLabel: string;
  /** Turkish, one sentence, actionable */
  coverageBody: string;
}

export interface SubjectCoverage {
  examCoverage: CoverageStatus;
  taskCoverage: CoverageStatus;
  /** Resources that could not be associated with any event */
  ungroupedResources: ResourceItem[];
  bindings: ResourceBinding[];
}

export interface ResourceCoverageReport {
  subjectBindings: Map<SubjectId, SubjectCoverage>;
}

// ─── Private Helpers ──────────────────────────────────────────────────────────

const TITLE_NORMALIZE_RE = /[\u0300-\u036f]/g;
const MULTI_SPACE_RE = /\s+/g;
const NON_WORD_RE = /[^a-z0-9çğıöşü\s]/gi;

function normTitle(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFKD")
    .replace(TITLE_NORMALIZE_RE, "")
    .replace(NON_WORD_RE, " ")
    .replace(MULTI_SPACE_RE, " ")
    .trim();
}

/** Resolves a resource's effective kind. Content-derived hint takes priority. */
function resolveKind(resource: ResourceItem): ResourceKindHint {
  if (resource.resourceKindHint && resource.resourceKindHint !== "unknown") {
    return resource.resourceKindHint;
  }

  const t = normTitle(resource.title);

  if (/outline|syllabus|icerik|içerik|ders plani|ders planı|haftalik plan|haftalık plan/i.test(t)) {
    return "outline";
  }
  if (/brief|assignment brief|rubric|rubrik|yonerge|yönerge|instructions|gorev tanimi|görev tanımı/i.test(t)) {
    return "brief";
  }
  if (/case study|case|vaka|vaka analizi|olay analizi/i.test(t)) {
    return "case";
  }
  if (/soru|quiz|past exam|cikmis|çikmis|deneme|problem set|worksheet|test/i.test(t)) {
    return "questions";
  }
  if (/ozet|özet|summary|cheat sheet|quick review/i.test(t)) {
    return "summary";
  }
  if (/sunum|slides|slayt|presentation/i.test(t)) {
    return "slides";
  }
  if (/ders notu|lecture note|notlar|notes/i.test(t)) {
    return "notes";
  }
  if (/textbook|kitap|chapter|bolum|bölüm|reader/i.test(t)) {
    return "book";
  }

  const wordCount = t.split(" ").filter(Boolean).length;
  const ACADEMIC_TOPIC_RE =
    /donemi|dönemi|politika|konferans|konferansi|antlasma|antlaşma|savasi|savaşı|iliski|ilişki|tarihi|kuram|yaklasim|yaklaşım|teori|teorisi|devrim|inkilap|inkılap/i;
  if (
    resource.type === "pdf" &&
    resource.contentHint === "prose-heavy" &&
    resource.pageCount >= 6 &&
    resource.pageCount <= 40 &&
    wordCount >= 3 &&
    ACADEMIC_TOPIC_RE.test(t)
  ) {
    return "topic-notes";
  }

  return "unknown";
}

/** Reads scheduleKind from event metadata safely. */
function readScheduleKind(event: AcademicEvent): ScheduleItemKind | null {
  const raw = event.metadata?.scheduleKind;
  if (raw === "project" || raw === "assignment" || raw === "deadline" || raw === "exam") {
    return raw;
  }
  return null;
}

// ─── Kind Relevance Tables ────────────────────────────────────────────────────

const TASK_PRIMARY: Record<string, Set<ResourceKindHint>> = {
  assignment: new Set(["brief", "outline"]),
  project:    new Set(["brief", "case", "outline"]),
  deadline:   new Set(["brief", "outline"]),
  default:    new Set(["brief", "outline"]),
};

const TASK_SECONDARY: Set<ResourceKindHint> = new Set([
  "summary", "notes", "topic-notes", "slides",
]);

const EXAM_SCORES: Partial<Record<ResourceKindHint, number>> = {
  questions:    1.0,
  summary:      0.80,
  "topic-notes": 0.80,
  notes:        0.55,
  slides:       0.55,
  brief:        0.25,
  outline:      0.25,
  case:         0.25,
  book:         0.10,
  unknown:      0.10,
};

function getRelevantKindSets(
  eventType: AcademicEventType,
  scheduleKind: ScheduleItemKind | null,
): { primary: Set<ResourceKindHint>; secondary: Set<ResourceKindHint> } {
  if (eventType === "assignment_due" || eventType === "deadline_change") {
    const key = scheduleKind ?? "default";
    const primary = TASK_PRIMARY[key] ?? TASK_PRIMARY.default;
    return { primary, secondary: TASK_SECONDARY };
  }

  if (eventType === "exam") {
    return {
      primary: new Set(["questions", "summary", "topic-notes"] as ResourceKindHint[]),
      secondary: new Set(["notes", "slides"] as ResourceKindHint[]),
    };
  }

  // material_update, announcement, grade_release — same-subject fallback
  return { primary: new Set(), secondary: new Set() };
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

function applyModifiers(base: number, resource: ResourceItem): number {
  let score = base;

  // Progress penalty: nearly-finished resource is less actionable
  if (resource.pageCount > 0) {
    const ratio = resource.pagesRead / resource.pageCount;
    if (ratio >= 0.9) score -= 0.10;
  }

  // Recency boost: actively used resource is more accessible
  if ((resource.engagementCount ?? 0) > 0 || (resource.revisitCount ?? 0) > 0) {
    score += 0.05;
  }

  return Math.round(Math.min(1.0, Math.max(0, score)) * 100) / 100;
}

function scoreResourceForEvent(
  resource: ResourceItem,
  eventType: AcademicEventType,
  scheduleKind: ScheduleItemKind | null,
): { score: number; reason: RelevanceReason } {
  const kind = resolveKind(resource);
  const { primary, secondary } = getRelevantKindSets(eventType, scheduleKind);

  if (eventType === "exam") {
    const base = EXAM_SCORES[kind] ?? 0.10;
    const reason: RelevanceReason =
      base >= 0.75
        ? "primary_kind"
        : base >= 0.40
          ? "secondary_kind"
          : "same_subject_only";
    return { score: applyModifiers(base, resource), reason };
  }

  if (primary.has(kind)) {
    return { score: applyModifiers(1.0, resource), reason: "primary_kind" };
  }

  if (secondary.has(kind)) {
    return { score: applyModifiers(0.55, resource), reason: "secondary_kind" };
  }

  // same-subject fallback — flat score, no modifiers
  return { score: 0.20, reason: "same_subject_only" };
}

// ─── Coverage Derivation ──────────────────────────────────────────────────────

const TASK_LABELS: Record<CoverageStatus, Record<string, string>> = {
  strong: {
    assignment: "Brief ve outline var",
    project:    "Brief, case veya outline var",
    deadline:   "Brief veya outline var",
    default:    "Yön veren kaynak var",
  },
  partial: {
    default: "Kısmi kaynak desteği",
  },
  missing: {
    default: "Kaynak eksik",
  },
};

const TASK_BODIES: Record<CoverageStatus, Record<string, string>> = {
  strong: {
    assignment: "Bu ödev için yön veren kaynaklar mevcut; çalışma bloğuna doğrudan geçilebilir.",
    project:    "Proje için başlangıç zemini sağlayan kaynaklar var; bir outline veya case ile başlamak doğru olur.",
    deadline:   "Bu teslim için çerçeve veren kaynaklar mevcut; plan kurabilirsin.",
    default:    "Bu teslim için çerçeve veren kaynaklar mevcut; plan kurabilirsin.",
  },
  partial: {
    assignment: "Ödev için destek kaynaklar var ama yön veren bir brief ya da outline eklenmesi işi daha netleştirir.",
    project:    "Proje için bazı kaynaklar var; brief, case ya da outline eklenmesi zemini güçlendirir.",
    deadline:   "Bu teslim için bazı kaynaklar görünüyor; brief ya da outline eklersen daha emin adım atarsın.",
    default:    "Bu teslim için bazı kaynaklar görünüyor; brief ya da outline eklersen daha emin adım atarsın.",
  },
  missing: {
    assignment: "Bu ödev için henüz yön veren bir kaynak görünmüyor; brief ya da outline eklemek planı netleştirir.",
    project:    "Bu proje için başlangıç kaynağı yok; brief, case veya outline eklemek işi daha okunaklı kılar.",
    deadline:   "Bu teslim için kaynak sinyali zayıf; kısa bir outline bile planlamayı kolaylaştırır.",
    default:    "Bu teslim için kaynak sinyali zayıf; kısa bir outline bile planlamayı kolaylaştırır.",
  },
};

function deriveCoverage(
  resources: BoundResource[],
  eventType: AcademicEventType,
  scheduleKind: ScheduleItemKind | null,
): { coverageStatus: CoverageStatus; coverageLabel: string; coverageBody: string } {
  const sk = scheduleKind ?? "default";

  if (eventType === "assignment_due" || eventType === "deadline_change") {
    const hasPrimary = resources.some(
      (r) => r.relevanceReason === "primary_kind" && r.relevanceScore >= 0.70,
    );
    const hasSecondary = resources.some(
      (r) => r.relevanceReason === "secondary_kind",
    );

    const coverageStatus: CoverageStatus = hasPrimary
      ? "strong"
      : hasSecondary
        ? "partial"
        : "missing";

    return {
      coverageStatus,
      coverageLabel:
        TASK_LABELS[coverageStatus][sk] ?? TASK_LABELS[coverageStatus].default,
      coverageBody:
        TASK_BODIES[coverageStatus][sk] ?? TASK_BODIES[coverageStatus].default,
    };
  }

  if (eventType === "exam") {
    const hasPrimary = resources.some((r) => r.relevanceScore >= 0.75);
    const hasSecondary = resources.some((r) => r.relevanceScore >= 0.40);

    const coverageStatus: CoverageStatus = hasPrimary
      ? "strong"
      : hasSecondary
        ? "partial"
        : "missing";

    const labels: Record<CoverageStatus, string> = {
      strong:  "Sınav hazırlığı güçlü",
      partial: "Sınav hazırlığı kısmi",
      missing: "Sınav için kaynak yok",
    };
    const bodies: Record<CoverageStatus, string> = {
      strong:  "Sınav için sorular ve özet/konu notu mevcut; önce sorularla başlamak daha verimli olur.",
      partial: "Sınav için bazı kaynaklar var; soru seti veya özet eklenmesi hazırlığı güçlendirir.",
      missing: "Bu sınav için henüz çalışma kaynağı görünmüyor; soru seti veya özet eklemek iyi bir başlangıç olur.",
    };

    return {
      coverageStatus,
      coverageLabel: labels[coverageStatus],
      coverageBody: bodies[coverageStatus],
    };
  }

  // material_update, announcement, grade_release
  const coverageStatus: CoverageStatus = resources.length > 0 ? "partial" : "missing";
  return {
    coverageStatus,
    coverageLabel: coverageStatus === "partial" ? "İlgili kaynaklar var" : "İlgili kaynak yok",
    coverageBody:
      coverageStatus === "partial"
        ? "Bu ders için ilgili kaynaklar mevcut."
        : "Bu ders için henüz kaynak eklenmemiş.",
  };
}

// ─── Public Functions ─────────────────────────────────────────────────────────

/**
 * Bind a single event to the resources most relevant to it.
 * Returns null if the event's subject cannot be resolved.
 */
export function bindEventToResources(
  event: AcademicEvent,
  allResources: ResourceItem[],
  subjects: SubjectSeed[],
): ResourceBinding | null {
  const subjectId = matchAcademicEventSubjectId(event, subjects);
  if (!subjectId) return null;

  const scheduleKind = readScheduleKind(event);
  const subjectResources = allResources.filter((r) => r.subjectId === subjectId);

  let boundResources: BoundResource[];

  // material_update events are explicitly tied to one resource via metadata
  if (event.type === "material_update") {
    const resourceId = event.metadata?.resourceId;
    if (typeof resourceId === "string") {
      const linked = subjectResources.find((r) => r.id === resourceId);
      if (linked) {
        boundResources = [{ resource: linked, relevanceScore: 1.0, relevanceReason: "primary_kind" }];
      } else {
        boundResources = [];
      }
    } else {
      boundResources = [];
    }
  } else {
    boundResources = subjectResources
      .map((resource) => {
        const { score, reason } = scoreResourceForEvent(resource, event.type, scheduleKind);
        return { resource, relevanceScore: score, relevanceReason: reason } satisfies BoundResource;
      })
      .sort((a, b) => {
        if (b.relevanceScore !== a.relevanceScore) return b.relevanceScore - a.relevanceScore;
        // Tiebreak: older uploads first (more established resource)
        return (
          new Date(a.resource.uploadedAt).getTime() -
          new Date(b.resource.uploadedAt).getTime()
        );
      });
  }

  const { coverageStatus, coverageLabel, coverageBody } = deriveCoverage(
    boundResources,
    event.type,
    scheduleKind,
  );

  return {
    eventId: event.id,
    eventType: event.type,
    scheduleKind,
    subjectId,
    relevantResources: boundResources,
    coverageStatus,
    coverageLabel,
    coverageBody,
  };
}

/**
 * Bind all active academic events to their relevant resources.
 * Events with no resolvable subject are silently skipped.
 */
export function bindResourcesToEvents(
  events: AcademicEvent[],
  resources: ResourceItem[],
  subjects: SubjectSeed[],
  now: Date = new Date(),
): ResourceBinding[] {
  return getActiveAcademicEvents(events, now)
    .map((event) => bindEventToResources(event, resources, subjects))
    .filter((binding): binding is ResourceBinding => binding !== null);
}

/**
 * Bind resources to upcoming exams derived from the risk engine.
 * Operates directly on RankedSubjectRisk — no subject matching needed.
 */
export function bindResourcesToExams(
  rankedSubjects: RankedSubjectRisk[],
  resources: ResourceItem[],
): ResourceBinding[] {
  return rankedSubjects.map((subject) => {
    const subjectResources = resources.filter((r) => r.subjectId === subject.subjectId);

    const boundResources: BoundResource[] = subjectResources
      .map((resource) => {
        const kind = resolveKind(resource);
        const base = EXAM_SCORES[kind] ?? 0.10;
        const reason: RelevanceReason =
          base >= 0.75 ? "primary_kind" : base >= 0.40 ? "secondary_kind" : "same_subject_only";
        return {
          resource,
          relevanceScore: applyModifiers(base, resource),
          relevanceReason: reason,
        } satisfies BoundResource;
      })
      .sort((a, b) => {
        if (b.relevanceScore !== a.relevanceScore) return b.relevanceScore - a.relevanceScore;
        return (
          new Date(a.resource.uploadedAt).getTime() -
          new Date(b.resource.uploadedAt).getTime()
        );
      });

    const { coverageStatus, coverageLabel, coverageBody } = deriveCoverage(
      boundResources,
      "exam",
      null,
    );

    return {
      eventId: `exam-risk:${subject.subjectId}`,
      eventType: "exam" as const,
      scheduleKind: null,
      subjectId: subject.subjectId,
      relevantResources: boundResources,
      coverageStatus,
      coverageLabel,
      coverageBody,
    } satisfies ResourceBinding;
  });
}

/**
 * Build a full cross-cutting resource coverage report for all subjects.
 */
export function buildResourceCoverageReport(
  events: AcademicEvent[],
  rankedSubjects: RankedSubjectRisk[],
  resources: ResourceItem[],
  subjects: SubjectSeed[],
  now: Date = new Date(),
): ResourceCoverageReport {
  const taskBindings = bindResourcesToEvents(events, resources, subjects, now).filter(
    (b) => b.eventType === "assignment_due" || b.eventType === "deadline_change",
  );
  const examBindings = bindResourcesToExams(rankedSubjects, resources);

  // Gather all subject IDs that appear in any binding or have resources
  const subjectIds = new Set<SubjectId>([
    ...taskBindings.map((b) => b.subjectId),
    ...examBindings.map((b) => b.subjectId),
    ...resources.map((r) => r.subjectId),
  ]);

  const subjectBindings = new Map<SubjectId, SubjectCoverage>();

  for (const subjectId of subjectIds) {
    const subjectTaskBindings = taskBindings.filter((b) => b.subjectId === subjectId);
    const examBinding = examBindings.find((b) => b.subjectId === subjectId);

    const taskCoverage: CoverageStatus =
      subjectTaskBindings.length === 0
        ? "missing"
        : subjectTaskBindings.some((b) => b.coverageStatus === "strong")
          ? "strong"
          : "partial";

    const examCoverage: CoverageStatus = examBinding?.coverageStatus ?? "missing";

    const allBoundIds = new Set(
      [...subjectTaskBindings, ...(examBinding ? [examBinding] : [])].flatMap((b) =>
        b.relevantResources.map((r) => r.resource.id),
      ),
    );
    const ungroupedResources = resources.filter(
      (r) => r.subjectId === subjectId && !allBoundIds.has(r.id),
    );

    // All bindings for this subject (task + exam)
    const allBindings: ResourceBinding[] = [
      ...subjectTaskBindings,
      ...(examBinding ? [examBinding] : []),
    ];

    subjectBindings.set(subjectId, {
      examCoverage,
      taskCoverage,
      ungroupedResources,
      bindings: allBindings,
    });
  }

  return { subjectBindings };
}
