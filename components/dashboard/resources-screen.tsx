"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  Loader2,
  MessageSquarePlus,
  Pin,
  PinOff,
  TrendingUp,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/dashboard/section-heading";
import { getExamProximityProfile } from "@/lib/exam-proximity";
import { analyzeSubjectLibrary, formatReadTime } from "@/lib/pdf-engine";
import {
  buildRecommendationFingerprint,
  buildResourceRecommendationFeedbackMap,
  ResourceRecommendationFeedbackProfile,
  logRecommendationShown,
  markRecommendationAccepted,
} from "@/lib/recommendation-events";
import { resolveResourceFile } from "@/lib/resource-db";
import {
  buildResourceUploadInsight,
  getResourceGuidance,
  pickPrimaryResourceGuidance,
} from "@/lib/resource-intelligence";
import { buildSubjectLearningProfile } from "@/lib/subject-learning";
import { deriveSessionBehaviorHint, deriveStudyMode, getStudyIntelligence, StudyIntelligence } from "@/lib/subject-intelligence";
import { useNotes } from "@/hooks/useNotes";
import { useResources } from "@/hooks/useResources";
import {
  buildRecentTopicTrail,
  buildTopicCoverageState,
  pickNextTopicFocus,
  TopicCoverageEntry,
} from "@/lib/topic-focus";
import { getHoursBetween } from "@/lib/time";
import { WorkspaceView } from "@/components/dashboard/workspace-nav";
import {
  ContentTypeHint,
  Exam,
  RankedSubjectRisk,
  RecommendationEvent,
  ResourceItem,
  StudyLaunchDraft,
  StudyNote,
  StudySession,
  SubjectSeed,
} from "@/lib/types";

interface ResourcesScreenProps {
  subjects: SubjectSeed[];
  exams: Exam[];
  riskSnapshot: RankedSubjectRisk[];
  sessions: StudySession[];
  recommendationEvents: RecommendationEvent[];
  now: Date;
  onNavigate: (view: WorkspaceView) => void;
  onQueueStudyLaunch: (draft: StudyLaunchDraft) => void;
}

type SubjectExamMeta =
  | { status: "upcoming"; exam: Exam; hoursUntilExam: number }
  | { status: "completed"; exam: Exam; hoursUntilExam: number }
  | { status: "none"; exam: null; hoursUntilExam: number };

export function ResourcesScreen({
  subjects,
  exams,
  riskSnapshot,
  sessions,
  recommendationEvents,
  now,
  onNavigate,
  onQueueStudyLaunch,
}: ResourcesScreenProps) {
  const [activeSubjectId, setActiveSubjectId] = useState<string>(subjects[0]?.id ?? "");
  const [uploadInsight, setUploadInsight] = useState<{
    headline: string;
    body: string;
    topics: string[];
    launchDraft: StudyLaunchDraft;
  } | null>(null);
  const [preview, setPreview] = useState<{ title: string; url: string } | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [openingResourceId, setOpeningResourceId] = useState<string | null>(null);
  const didInitializeActiveSubjectRef = useRef(false);
  const { resources, isReady, addResource, updateProgress, updatePageCount, removeResource } =
    useResources();
  const { addNote, updateNote, togglePin, deleteNote, notesForSubject } = useNotes();

  const subjectExamMeta = useMemo(() => {
    return new Map<SubjectSeed["id"], SubjectExamMeta>(
      subjects.map((subject): [SubjectSeed["id"], SubjectExamMeta] => {
        const subjectExams = exams
          .filter((exam) => exam.subjectId === subject.id)
          .sort(
            (left, right) =>
              new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime(),
          );
        const upcoming = subjectExams.find(
          (exam) => new Date(exam.scheduledAt).getTime() > now.getTime(),
        );

        if (upcoming) {
          return [
            subject.id,
            {
              status: "upcoming" as const,
              exam: upcoming,
              hoursUntilExam: getHoursBetween(new Date(upcoming.scheduledAt), now),
            },
          ];
        }

        const completed = [...subjectExams]
          .reverse()
          .find((exam) => new Date(exam.scheduledAt).getTime() <= now.getTime());

        if (completed) {
          return [
            subject.id,
            {
              status: "completed" as const,
              exam: completed,
              hoursUntilExam: -1,
            },
          ];
        }

        return [
          subject.id,
          {
            status: "none" as const,
            exam: null,
            hoursUntilExam: Number.POSITIVE_INFINITY,
          },
        ];
      }),
    );
  }, [exams, now, subjects]);
  const sortedSubjects = useMemo(() => {
    const bucket = (subject: SubjectSeed) => {
      const status = subjectExamMeta.get(subject.id)?.status;
      if (status === "upcoming") return 0;
      if (status === "none") return 1;
      return 2;
    };

    return [...subjects].sort((left, right) => {
      const bucketDelta = bucket(left) - bucket(right);
      if (bucketDelta !== 0) return bucketDelta;

      const leftMeta = subjectExamMeta.get(left.id);
      const rightMeta = subjectExamMeta.get(right.id);

      if (leftMeta?.status === "upcoming" && rightMeta?.status === "upcoming") {
        return leftMeta.hoursUntilExam - rightMeta.hoursUntilExam;
      }

      if (leftMeta?.status === "completed" && rightMeta?.status === "completed") {
        return (
          new Date(rightMeta.exam.scheduledAt).getTime() -
          new Date(leftMeta.exam.scheduledAt).getTime()
        );
      }

      return left.title.localeCompare(right.title, "tr");
    });
  }, [subjectExamMeta, subjects]);

  useEffect(() => {
    if (didInitializeActiveSubjectRef.current || sortedSubjects.length === 0) {
      return;
    }

    didInitializeActiveSubjectRef.current = true;
    if (sortedSubjects[0].id !== activeSubjectId) {
      setActiveSubjectId(sortedSubjects[0].id);
    }
  }, [activeSubjectId, sortedSubjects]);

  const activeSubject = subjects.find((s) => s.id === activeSubjectId) ?? null;
  const activeResources = resources.filter((r) => r.subjectId === activeSubjectId);
  const activeRisk = riskSnapshot.find((r) => r.subjectId === activeSubjectId) ?? null;
  const activeExamMeta = subjectExamMeta.get(activeSubjectId);
  const activeHoursUntilExam =
    activeExamMeta?.status === "completed"
      ? -1
      : activeRisk?.hoursUntilExam ?? activeExamMeta?.hoursUntilExam ?? Number.POSITIVE_INFINITY;
  const activeExamTitle = activeExamMeta?.exam?.title ?? activeRisk?.examTitle ?? activeSubject?.title ?? "";
  const recentTopicTrail = buildRecentTopicTrail(sessions, activeSubjectId);
  const topicCoverage = buildTopicCoverageState({
    subjectId: activeSubjectId,
    sessions,
    resources: activeResources,
  });

  // Derive study intelligence from subject seed + PDF content hints
  const contentHints = activeResources
    .map((r) => r.contentHint)
    .filter((h): h is ContentTypeHint => h !== undefined);
  const sessionHint = activeSubject ? deriveSessionBehaviorHint(sessions, activeSubject.id) : null;
  const learningProfile = activeSubject
    ? buildSubjectLearningProfile({
        subjectId: activeSubject.id,
        sessions,
        resources: activeResources,
      })
    : null;
  const studyMode = activeSubject
    ? deriveStudyMode(
        activeSubject,
        contentHints,
        sessionHint,
        learningProfile?.modeHint ?? null,
      )
    : "mixed";
  const intelligence = getStudyIntelligence(studyMode);
  const recommendationFeedbackByResourceId = useMemo(() => {
    if (!activeSubject) return new Map();

    return buildResourceRecommendationFeedbackMap({
      subjectId: activeSubject.id,
      resources: activeResources,
      events: recommendationEvents,
      sessions,
      now,
    });
  }, [activeResources, activeSubject, now, recommendationEvents, sessions]);

  useEffect(() => {
    setUploadInsight(null);
  }, [activeSubjectId]);

  useEffect(() => {
    return () => {
      if (preview?.url) {
        URL.revokeObjectURL(preview.url);
      }
    };
  }, [preview]);

  const handleClosePreview = useCallback(() => {
    setPreview((current) => {
      if (current?.url) {
        URL.revokeObjectURL(current.url);
      }
      return null;
    });
  }, []);

  const handleUpload = useCallback(
    async (subjectId: string, file: File) => {
      const uploaded = await addResource(subjectId, file);

      if (!activeSubject) {
        return;
      }

      const launchDraft: StudyLaunchDraft = {
        subjectId,
        minutes: intelligence.recommendedSessionMinutes,
        topic:
          pickNextTopicFocus(
            buildTopicCoverageState({
              subjectId,
              sessions,
              resources: [...activeResources, uploaded],
            }),
          ) ??
          uploaded.topicHints?.[0],
        source: "resource",
        sourceLabel: uploaded.title,
      };
      const recommendationEvent = logRecommendationShown({
        subjectId: launchDraft.subjectId,
        source: launchDraft.source,
        sourceLabel: launchDraft.sourceLabel,
        topic: launchDraft.topic,
        recommendedMinutes: launchDraft.minutes,
      });

      setUploadInsight({
        ...buildResourceUploadInsight({
          subjectTitle: activeSubject.title,
          resource: uploaded,
          existingResources: activeResources,
          intelligence,
          hoursUntilExam: activeHoursUntilExam,
        }),
        launchDraft: {
          ...launchDraft,
          recommendationId: recommendationEvent.id,
        },
      });
    },
    [activeHoursUntilExam, activeResources, activeSubject, addResource, intelligence, sessions],
  );

  const handleOpenResource = useCallback(async (resource: ResourceItem) => {
    setOpeningResourceId(resource.id);
    setPreviewError(null);

    try {
      const file = await resolveResourceFile(resource);

      if (!file) {
        throw new Error("missing-file");
      }

      const nextUrl = URL.createObjectURL(file);
      setPreview((current) => {
        if (current?.url) {
          URL.revokeObjectURL(current.url);
        }

        return {
          title: resource.title,
          url: nextUrl,
        };
      });
    } catch {
      setPreviewError("Bu PDF şu anda açılamadı. Kaynağı yeniden yüklemeyi deneyebilirsin.");
    } finally {
      setOpeningResourceId(null);
    }
  }, []);

  if (!isReady) {
    return (
      <section className="space-y-6">
        <SectionHeading eyebrow="Kaynaklar" title="Ders kütüphaneleri" description="" />
        <div className="h-48 animate-pulse rounded-[26px] bg-white/[0.04]" />
      </section>
    );
  }

  if (subjects.length === 0) {
    return (
      <section className="space-y-6">
        <SectionHeading
          eyebrow="Kaynaklar"
          title="Ders kütüphaneleri"
          description="Her ders için materyallerini yükle, ilerlemeni takip et."
        />
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <BookOpen className="h-8 w-8 text-slate-500" />
          <p className="text-sm text-slate-400">
            Kütüphaneyi kullanmak için önce onboarding&apos;de en az bir ders ekle.
          </p>
        </Card>
      </section>
    );
  }

  const descriptionByMode = {
    problem: "Problem ve uygulama ağırlıklı derslerde kaynaklarını burada toparla. Ana ilerleme sinyali çalışma bloklarından gelir.",
    conceptual: "Kavramsal yerleşme isteyen derslerde kaynak akışını burada izle.",
    interpretive: "Yorum, karşılaştırma ve tema kurma isteyen derslerde kaynaklarını burada dengele.",
    memorization: "Terim, yapı veya mevzuat yoğun derslerde tekrar kaynaklarını burada topla.",
    mixed: "Kavramı kurup uygulamaya dönen derslerde kaynaklarını burada dengele.",
  };

  const adaptiveSuffix =
    learningProfile?.reason && learningProfile.confidence !== "low"
      ? ` ${learningProfile.reason}`
      : "";

  return (
    <section className="space-y-6">
      <SectionHeading
        eyebrow="Kaynaklar"
        title="Ders kütüphaneleri"
        description={`${descriptionByMode[studyMode]}${adaptiveSuffix}`}
      />

      {/* Subject tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {sortedSubjects.map((subject) => {
          const subjectResources = resources.filter((r) => r.subjectId === subject.id);
          const hasResources = subjectResources.length > 0;
          const risk = riskSnapshot.find((r) => r.subjectId === subject.id);
          const examMeta = subjectExamMeta.get(subject.id);

          return (
            <button
              key={subject.id}
              type="button"
              onClick={() => setActiveSubjectId(subject.id)}
              className={[
                "flex shrink-0 items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm transition",
                activeSubjectId === subject.id
                  ? "border-sky-400/40 bg-sky-400/12 text-white"
                  : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:text-slate-200",
              ].join(" ")}
            >
              <span className="font-medium">{subject.shortLabel}</span>
              <span className="hidden sm:inline text-xs opacity-70">{subject.title}</span>
              {hasResources && <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />}
              {examMeta?.status === "completed" ? (
                <span className="rounded-full border border-emerald-300/20 bg-emerald-300/[0.08] px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-emerald-100">
                  Bitti
                </span>
              ) : risk ? (
                <RiskBadge label={risk.label} />
              ) : null}
            </button>
          );
        })}
      </div>

      {activeSubject && (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          {/* Left: upload + resource list */}
          <div className="space-y-4">
            {activeExamMeta?.status === "completed" ? (
              <Card className="border-emerald-400/15 bg-emerald-400/[0.05] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-emerald-200/80">Sınav bitti</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Bu ders artık aktif çalışma kuyruğunda değil. Kaynaklar sonucu değerlendirmek
                  veya ileride tekrar etmek için burada kalır.
                </p>
              </Card>
            ) : null}

            <UploadZone subjectId={activeSubjectId} onUpload={handleUpload} />

            {uploadInsight ? (
              <Card className="border-emerald-400/15 bg-emerald-400/[0.05] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-emerald-200/80">
                  Yükleme etkisi
                </p>
                <p className="mt-2 text-base font-medium text-white">
                  {uploadInsight.headline}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{uploadInsight.body}</p>
                {uploadInsight.topics.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {uploadInsight.topics.map((topic) => (
                      <span
                        key={topic}
                        className="rounded-full border border-emerald-300/15 bg-emerald-300/[0.08] px-3 py-1.5 text-[11px] text-emerald-100"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                ) : null}
                <Button
                  className="mt-4 gap-2"
                  onClick={() => {
                    if (uploadInsight.launchDraft.recommendationId) {
                      markRecommendationAccepted(uploadInsight.launchDraft.recommendationId);
                    }
                    onQueueStudyLaunch(uploadInsight.launchDraft);
                    onNavigate("sessions");
                  }}
                >
                  Bu kaynakla başla
                </Button>
              </Card>
            ) : null}

            {previewError ? (
              <Card className="border-rose-400/15 bg-rose-400/[0.05] p-4">
                <p className="text-sm leading-6 text-rose-100">{previewError}</p>
              </Card>
            ) : null}

            {activeResources.length > 0 ? (
              <div className="space-y-3">
                {activeResources.map((resource) => (
                  <ResourceCard
                    key={resource.id}
                    resource={resource}
                    intelligence={intelligence}
                    hoursUntilExam={activeHoursUntilExam}
                    referenceTime={now}
                    recommendationFeedback={recommendationFeedbackByResourceId.get(resource.id) ?? null}
                    onUpdateProgress={updateProgress}
                    onUpdatePageCount={updatePageCount}
                    onRemove={removeResource}
                    onOpen={handleOpenResource}
                    isOpening={openingResourceId === resource.id}
                  />
                ))}
              </div>
            ) : (
              <Card className="flex flex-col items-center gap-3 py-10 text-center">
                <FileText className="h-8 w-8 text-slate-600" />
                <div>
                  <p className="text-sm font-medium text-slate-300">
                    {activeSubject.title} için henüz materyal yok
                  </p>
                  <p className="mt-1 text-xs text-slate-500 max-w-xs mx-auto">
                    {intelligence.emptyStateHint}
                  </p>
                </div>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            <AnalysisPanel
              subject={activeSubject}
              resources={activeResources}
              topicCoverage={topicCoverage}
              recentTopics={recentTopicTrail}
              hoursUntilExam={activeHoursUntilExam}
              examTitle={activeExamTitle}
              intelligence={intelligence}
              referenceTime={now}
              recommendationFeedbackByResourceId={recommendationFeedbackByResourceId}
              onNavigate={onNavigate}
              onQueueStudyLaunch={onQueueStudyLaunch}
            />
            <NotesPanel
              notes={notesForSubject(activeSubjectId)}
              onAdd={(content) => addNote({ subjectId: activeSubjectId, content })}
              onUpdate={updateNote}
              onTogglePin={togglePin}
              onDelete={deleteNote}
            />
          </div>
        </div>
      )}

      {preview ? (
        <ResourcePreviewOverlay
          title={preview.title}
          url={preview.url}
          onClose={handleClosePreview}
        />
      ) : null}
    </section>
  );
}

// ─── Upload Zone ──────────────────────────────────────────────────────────────

function UploadZone({
  subjectId,
  onUpload,
}: {
  subjectId: string;
  onUpload: (subjectId: string, file: File) => Promise<unknown>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      // Reset input value immediately so the same file can be re-selected later.
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      setUploading(true);
      setUploadError(null);
      for (const file of Array.from(files)) {
        try {
          await onUpload(subjectId, file);
        } catch (error) {
          setUploadError(
            error instanceof Error
              ? error.message
              : "Dosya şu anda yüklenemedi. Lütfen tekrar dene.",
          );
          break;
        }
      }
      setUploading(false);
    },
    [subjectId, onUpload],
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => {
        if (!uploading) inputRef.current?.click();
      }}
      className={[
        "flex flex-col items-center gap-3 rounded-[26px] border-2 border-dashed p-8 text-center transition",
        uploading ? "cursor-default opacity-60" : "cursor-pointer",
        dragging
          ? "border-sky-400/60 bg-sky-400/8"
          : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]",
      ].join(" ")}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3 text-sky-200">
        <Upload className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-200">
          {uploading ? "Analiz ediliyor..." : "PDF veya doküman yükle"}
        </p>
        <p className="mt-1 text-xs text-slate-500">Sürükle bırak ya da tıkla · PDF, DOC, DOCX</p>
        {uploadError ? (
          <p className="mt-2 text-xs text-rose-300">{uploadError}</p>
        ) : null}
      </div>
    </div>
  );
}

// ─── Resource Card ────────────────────────────────────────────────────────────

function ResourceCard({
  resource,
  intelligence,
  hoursUntilExam,
  referenceTime,
  recommendationFeedback,
  onUpdateProgress,
  onUpdatePageCount,
  onRemove,
  onOpen,
  isOpening,
}: {
  resource: ResourceItem;
  intelligence: StudyIntelligence;
  hoursUntilExam: number;
  referenceTime: Date;
  recommendationFeedback: ResourceRecommendationFeedbackProfile | null;
  onUpdateProgress: (id: string, pages: number) => void;
  onUpdatePageCount: (id: string, pages: number) => void;
  onRemove: (id: string) => Promise<void>;
  onOpen: (resource: ResourceItem) => Promise<void>;
  isOpening: boolean;
}) {
  const progress =
    resource.pageCount > 0 ? Math.round((resource.pagesRead / resource.pageCount) * 100) : 0;
  const remainingPages = Math.max(resource.pageCount - resource.pagesRead, 0);
  const fileSizeKb = Math.round(resource.fileSizeBytes / 1024);
  const guidance = getResourceGuidance(
    resource,
    intelligence,
    hoursUntilExam,
    referenceTime,
    recommendationFeedback,
  );
  const canPreview = resource.type === "pdf" || resource.mimeType === "application/pdf";

  // For problem-heavy subjects, page tracking is secondary — show a softer UI
  const isBlockTrackedMode = intelligence.resourceMetric === "sessions";

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 rounded-xl border border-white/10 bg-white/[0.04] p-2 text-sky-200">
            <FileText className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{resource.title}</p>
            <p className="mt-0.5 text-xs text-slate-500">
              {fileSizeKb > 1024
                ? `${(fileSizeKb / 1024).toFixed(1)} MB`
                : `${fileSizeKb} KB`}
              {resource.type === "pdf" && resource.pageCount > 0 && (
                <> · {resource.pageCount} sayfa</>
              )}
              {resource.contentHint && resource.contentHint !== "unknown" && (
                <> · {resource.contentHint === "formula-heavy" ? "formül yoğun" : resource.contentHint === "prose-heavy" ? "metin ağırlıklı" : "karma içerik"}</>
              )}
            </p>
            <p className="mt-1 text-[11px] leading-5 text-sky-200/85">
              {guidance.badge} · {guidance.summary}
            </p>
            {resource.topicHints && resource.topicHints.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {resource.topicHints.slice(0, 4).map((topic) => (
                  <span
                    key={topic}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] uppercase tracking-[0.08em] text-slate-300"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {canPreview ? (
          <button
            type="button"
            onClick={() => void onOpen(resource)}
            disabled={isOpening}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-xs font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white disabled:cursor-wait disabled:opacity-70"
          >
            {isOpening ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
            Aç
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => onRemove(resource.id)}
          className="shrink-0 text-slate-600 transition hover:text-rose-400"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Page count edit — shown when extraction failed */}
      {resource.pageCount === 0 && (
        <div className="mt-4 flex items-center gap-2 rounded-[16px] border border-amber-300/20 bg-amber-300/6 px-3 py-2">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-300" />
          <p className="text-xs text-amber-200">Sayfa sayısı okunamadı.</p>
          <input
            type="number"
            min={1}
            placeholder="Sayfa"
            className="ml-auto w-20 rounded-xl border border-white/10 bg-black/20 px-2 py-1 text-xs text-white outline-none"
            onBlur={(e) => {
              const v = Number(e.target.value);
              if (v > 0) onUpdatePageCount(resource.id, v);
            }}
          />
        </div>
      )}

      {/* Progress — shown for all modes, but labeled differently */}
      {resource.pageCount > 0 && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-slate-400">
              {isBlockTrackedMode ? "Referans kapsamı" : "İlerleme"}
            </p>
            <p className="text-xs font-medium text-slate-200">
              {resource.pagesRead} / {resource.pageCount} sayfa ({progress}%)
            </p>
          </div>

          <div className="relative">
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/8">
              <div
                className={`h-full rounded-full transition-all duration-300 ${isBlockTrackedMode ? "bg-violet-400" : "bg-sky-400"}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <input
              type="range"
              min={0}
              max={resource.pageCount}
              value={resource.pagesRead}
              onChange={(e) => onUpdateProgress(resource.id, Number(e.target.value))}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </div>

          <div className="flex gap-2">
            {[25, 50, 75, 100].map((pct) => {
              const pages = Math.round((pct / 100) * resource.pageCount);
              return (
                <button
                  key={pct}
                  type="button"
                  onClick={() => onUpdateProgress(resource.id, pages)}
                  className={[
                    "flex-1 rounded-xl border py-1.5 text-[11px] transition",
                    progress >= pct
                      ? isBlockTrackedMode
                        ? "border-violet-400/30 bg-violet-400/10 text-violet-200"
                        : "border-sky-400/30 bg-sky-400/10 text-sky-200"
                      : "border-white/8 text-slate-500 hover:border-white/15 hover:text-slate-300",
                  ].join(" ")}
                >
                  %{pct}
                </button>
              );
            })}
          </div>

          {remainingPages > 0 && !isBlockTrackedMode && (
            <p className="text-xs text-slate-500">
              Kalan: {remainingPages} sayfa · ~{formatReadTime(remainingPages * 2)}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

function ResourcePreviewOverlay({
  title,
  url,
  onClose,
}: {
  title: string;
  url: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="flex h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,14,26,0.98),rgba(5,10,18,0.99))] shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-white/8 px-5 py-4">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">PDF Önizleme</p>
            <p className="mt-1 truncate text-sm font-medium text-white">{title}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" asChild>
              <a href={url} download={title}>
                İndir
              </a>
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} className="gap-1.5">
              <X className="h-4 w-4" />
              Kapat
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 bg-white">
          <iframe
            src={url}
            title={title}
            className="h-full w-full border-0"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Analysis Panel ───────────────────────────────────────────────────────────

function AnalysisPanel({
  subject,
  resources,
  topicCoverage,
  recentTopics,
  hoursUntilExam,
  examTitle,
  intelligence,
  referenceTime,
  recommendationFeedbackByResourceId,
  onNavigate,
  onQueueStudyLaunch,
}: {
  subject: SubjectSeed;
  resources: ResourceItem[];
  topicCoverage: TopicCoverageEntry[];
  recentTopics: string[];
  hoursUntilExam: number;
  examTitle: string;
  intelligence: StudyIntelligence;
  referenceTime: Date;
  recommendationFeedbackByResourceId: Map<string, ResourceRecommendationFeedbackProfile>;
  onNavigate: (view: WorkspaceView) => void;
  onQueueStudyLaunch: (draft: StudyLaunchDraft) => void;
}) {
  const analysis = analyzeSubjectLibrary(resources, hoursUntilExam);
  const primaryResource = pickPrimaryResourceGuidance(
    resources,
    intelligence,
    hoursUntilExam,
    referenceTime,
    recommendationFeedbackByResourceId,
  );
  const nextTopicFocus = pickNextTopicFocus(topicCoverage);
  const [primaryRecommendationId, setPrimaryRecommendationId] = useState<string | null>(null);
  const lastPrimaryRecommendationFingerprintRef = useRef<string | null>(null);
  const proximity = getExamProximityProfile(hoursUntilExam);
  const isCompleted = proximity.stage === "completed";
  const daysUntilExam = Math.max(Math.floor(hoursUntilExam / 24), 0);
  const isBlockTrackedMode = intelligence.resourceMetric === "sessions";
  const primaryLaunchDraft = useMemo<StudyLaunchDraft | null>(() => {
    if (!primaryResource) {
      return null;
    }

    return {
      subjectId: subject.id,
      minutes: intelligence.recommendedSessionMinutes,
      topic:
        nextTopicFocus ??
        primaryResource.resource.topicHints?.[0] ??
        recentTopics[0],
      source: "resource",
      sourceLabel: primaryResource.resource.title,
    };
  }, [intelligence.recommendedSessionMinutes, nextTopicFocus, primaryResource, recentTopics, subject.id]);

  useEffect(() => {
    if (!primaryLaunchDraft) {
      lastPrimaryRecommendationFingerprintRef.current = null;
      setPrimaryRecommendationId(null);
      return;
    }

    const fingerprint = buildRecommendationFingerprint(primaryLaunchDraft);
    if (fingerprint === lastPrimaryRecommendationFingerprintRef.current) {
      return;
    }

    const event = logRecommendationShown({
      subjectId: primaryLaunchDraft.subjectId,
      source: primaryLaunchDraft.source,
      sourceLabel: primaryLaunchDraft.sourceLabel,
      topic: primaryLaunchDraft.topic,
      recommendedMinutes: primaryLaunchDraft.minutes,
    });

    lastPrimaryRecommendationFingerprintRef.current = fingerprint;
    setPrimaryRecommendationId(event.id);
  }, [primaryLaunchDraft]);

  const queueablePrimaryLaunchDraft = useMemo(
    () =>
      primaryLaunchDraft
        ? {
            ...primaryLaunchDraft,
            recommendationId: primaryRecommendationId ?? undefined,
          }
        : null,
    [primaryLaunchDraft, primaryRecommendationId],
  );

  const statusConfig = {
    tamamlandi: { icon: CheckCircle2, label: "Tamamlandı", color: "emerald" },
    yolunda: { icon: TrendingUp, label: "Yolunda", color: "sky" },
    geri: { icon: Clock3, label: "Geri kalındı", color: "amber" },
    kritik: { icon: AlertTriangle, label: "Kritik", color: "rose" },
  } as const;

  const config = statusConfig[analysis.status];
  const Icon = config.icon;

  return (
    <div className="space-y-4">
      {primaryResource ? (
        <Card className="p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">İlk açılacak kaynak</p>
          <div className="mt-3 rounded-[18px] border border-sky-300/15 bg-sky-300/[0.06] p-3.5">
            <p className="text-sm font-medium text-white">{primaryResource.resource.title}</p>
            <p className="mt-1 text-xs text-sky-100/90">
              {primaryResource.guidance.badge}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              {primaryResource.guidance.summary}
            </p>
            {primaryResource.resource.topicHints && primaryResource.resource.topicHints.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {primaryResource.resource.topicHints.slice(0, 4).map((topic) => (
                  <span
                    key={topic}
                    className="rounded-full border border-sky-300/15 bg-sky-300/[0.08] px-2.5 py-1 text-[10px] uppercase tracking-[0.08em] text-sky-100"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            ) : null}
            <p className="mt-2 text-[12px] text-slate-400">
              Önerilen yaklaşım:{" "}
              <span className="font-medium text-slate-200">
                {primaryResource.guidance.actionLabel}
              </span>
            </p>
            {!isCompleted ? (
              <Button
                className="mt-4 gap-2"
                onClick={() => {
                  if (!queueablePrimaryLaunchDraft) {
                    return;
                  }
                  if (queueablePrimaryLaunchDraft.recommendationId) {
                    markRecommendationAccepted(queueablePrimaryLaunchDraft.recommendationId);
                  }
                  onQueueStudyLaunch(queueablePrimaryLaunchDraft);
                  onNavigate("sessions");
                }}
              >
                Bu kaynakla başla
              </Button>
            ) : (
              <Button className="mt-4 gap-2" variant="secondary" onClick={() => onNavigate("schedule")}>
                Sonucu gir
              </Button>
            )}
          </div>
        </Card>
      ) : null}

      {topicCoverage.length > 0 ? (
        <Card className="p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Konu görünümü</p>
          <div className="mt-3 space-y-2">
            {topicCoverage.map((entry) => (
              <div
                key={entry.topic}
                className="flex items-center justify-between gap-3 rounded-[14px] border border-white/8 bg-white/[0.03] px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-slate-200">{entry.topic}</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {entry.sessionCount > 0
                      ? `${entry.sessionCount} blokta geçti`
                      : `${entry.resourceCount} kaynakta görünüyor`}
                  </p>
                </div>
                <span
                  className={[
                    "shrink-0 rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.08em]",
                    entry.status === "weak"
                      ? "border-rose-300/20 bg-rose-300/[0.08] text-rose-100"
                      : entry.status === "open"
                        ? "border-amber-300/20 bg-amber-300/[0.08] text-amber-50"
                        : entry.status === "repeated"
                          ? "border-sky-300/20 bg-sky-300/[0.08] text-sky-100"
                          : entry.status === "covered"
                            ? "border-emerald-300/20 bg-emerald-300/[0.08] text-emerald-100"
                            : "border-white/10 bg-white/[0.04] text-slate-300",
                  ].join(" ")}
                >
                  {entry.status === "weak"
                    ? "Dikkat istiyor"
                    : entry.status === "open"
                      ? "Açık"
                      : entry.status === "repeated"
                        ? "Tekrar istiyor"
                        : entry.status === "covered"
                          ? "Şimdilik oturdu"
                          : "Görüldü"}
                </span>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {recentTopics.length > 0 ? (
        <Card className="p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Son çalışılan konular</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {recentTopics.map((topic) => (
              <span
                key={topic}
                className="rounded-full border border-sky-300/15 bg-sky-300/[0.08] px-3 py-1.5 text-[11px] text-sky-100"
              >
                {topic}
              </span>
            ))}
          </div>
        </Card>
      ) : null}

      {/* Study mode intelligence notice */}
      <Card className="flex items-start gap-3 p-4">
        <BrainCircuit className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />
        <div>
          <p className="text-xs font-medium text-violet-200">{intelligence.sessionLabel}</p>
          <p className="mt-0.5 text-xs leading-5 text-slate-400">{intelligence.analysisNote}</p>
        </div>
      </Card>

      {/* Page analysis card — always shown; secondary for problem-heavy flows */}
      <Card className="p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
            {isBlockTrackedMode ? "Referans materyali" : "Materyal analizi"}
          </p>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-slate-300">
              {proximity.label}
            </span>
            {resources.length > 0 && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium
                ${analysis.status === "tamamlandi" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" :
                  analysis.status === "yolunda" ? "border-sky-400/30 bg-sky-400/10 text-sky-200" :
                  analysis.status === "geri" ? "border-amber-400/30 bg-amber-400/10 text-amber-200" :
                  "border-rose-400/30 bg-rose-400/10 text-rose-200"}`}
              >
                <Icon className="h-3 w-3" />
                {config.label}
              </span>
            )}
          </div>
        </div>

        {resources.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">
            {isBlockTrackedMode
              ? "İstersen yardımcı bir kaynak daha ekleyebilirsin."
              : "Henüz materyal yok. Soldan PDF yükleyip bu ders için ilk kaynaklarını yerleştirebilirsin."}
          </p>
        ) : (
          <>
            {/* Coverage bar */}
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Kapsam</span>
                <span className="text-slate-200">{analysis.coveragePercent}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/8">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isBlockTrackedMode
                      ? "bg-violet-400"
                      : analysis.status === "tamamlandi"
                        ? "bg-emerald-400"
                        : analysis.status === "yolunda"
                          ? "bg-sky-400"
                          : analysis.status === "geri"
                            ? "bg-amber-400"
                            : "bg-rose-400"
                  }`}
                  style={{ width: `${analysis.coveragePercent}%` }}
                />
              </div>
              <p className="text-xs text-slate-500">
                {analysis.readPages} / {analysis.totalPages} sayfa
              </p>
            </div>

            {/* Stats grid */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <StatTile
                label={isBlockTrackedMode ? "Materyal hacmi" : "Toplam okuma"}
                value={formatReadTime(analysis.totalReadMinutes)}
                sub={`${analysis.totalPages} sayfa`}
              />
              <StatTile
                label={isBlockTrackedMode ? "Kalan materyal" : "Kalan okuma"}
                value={formatReadTime(analysis.remainingReadMinutes)}
                sub={`${analysis.remainingPages} sayfa`}
              />
              <StatTile
                label="Sınava kalan"
                value={isCompleted ? "Bitti" : daysUntilExam > 0 ? `${daysUntilExam} gün` : "Bugün"}
                sub={examTitle}
              />
              <StatTile
                label={isBlockTrackedMode ? "Öneri seans" : "Günlük hedef"}
                value={
                  isBlockTrackedMode
                    ? `${intelligence.recommendedSessionMinutes} dk`
                    : analysis.remainingPages > 0 && daysUntilExam > 0
                      ? `${analysis.dailyPagesNeeded} sayfa`
                      : analysis.remainingPages === 0
                        ? "Tamam"
                        : "Bugün"
                }
                sub={isBlockTrackedMode ? intelligence.sessionLabel : "okuma hızı"}
              />
            </div>
          </>
        )}
      </Card>

      {/* Guidance card */}
      {resources.length > 0 && (
        <Card className="p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Bugün nasıl kullanmalı</p>
          <div className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{proximity.summary}</p>
            {isCompleted ? (
              <p>
                <span className="font-semibold text-emerald-300">Bu sınav tamamlandı.</span>{" "}
                Kaynaklar artık yeni çalışma baskısı yaratmıyor; notunu girmek, sonucu değerlendirmek
                veya ileride tekrar etmek için referans olarak kalabilir.
              </p>
            ) : isBlockTrackedMode ? (
              <p>
                {proximity.prefersConsolidation
                  ? "Bu ders için yeni alan açmaktan çok yüksek etkili pratik bloklarında kalmak daha doğru. "
                  : "Bu ders için günde "}
                {!proximity.prefersConsolidation ? (
                  <span className="font-semibold text-violet-300">
                    {intelligence.recommendedSessionMinutes} dk
                  </span>
                ) : null}
                {!proximity.prefersConsolidation ? " uygulama ağırlıklı çalışmak daha doğru olur. " : ""}
                Materyali referans katmanı gibi kullan;
                ilerlemeyi seans loglarından takip et.
              </p>
            ) : proximity.prefersQuickReview ? (
              <p>
                <span className="font-semibold text-emerald-300">Son gün yaklaşmış durumda.</span>{" "}
                Yeni okuma açmaktan çok kısa review ve yüksek etkili başlıklarda kalmak daha doğru olur.
              </p>
            ) : analysis.remainingPages === 0 ? (
              <p>
                <span className="font-semibold text-emerald-300">Tüm materyaller tamamlandı.</span>{" "}
                Kalan süreyi toparlama ve pekiştirme için kullanabilirsin.
              </p>
            ) : proximity.prefersConsolidation ? (
              <p>
                Yeni alan açmaktan çok mevcut materyali toparlamak daha doğru. Kalan süreyi{" "}
                <span className="font-semibold text-violet-300">
                  yüksek etkili başlıklar
                </span>{" "}
                ve kısa tekrar blokları için kullanmak daha iyi karşılık verir.
              </p>
            ) : analysis.status === "kritik" ? (
              <p>
                Kalan materyali rahatça toparlayabilmek için günde{" "}
                <span className="font-semibold text-rose-300">{analysis.dailyPagesNeeded} sayfa</span>{" "}
                ilerlemek gerekiyor. En kritik başlıklara öncelik vermek daha doğru olur.
              </p>
            ) : analysis.status === "geri" ? (
              <p>
                Tempo biraz geride. Günde{" "}
                <span className="font-semibold text-amber-300">{analysis.dailyPagesNeeded} sayfa</span>{" "}
                ile sınava kadar materyali daha dengeli biçimde toparlayabilirsin.
              </p>
            ) : (
              <p>
                Akış sağlıklı görünüyor. Günde{" "}
                <span className="font-semibold text-sky-300">{analysis.dailyPagesNeeded} sayfa</span>{" "}
                ile mevcut ritmi korumak yeterli olur.
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

function NotesPanel({
  notes,
  onAdd,
  onUpdate,
  onTogglePin,
  onDelete,
}: {
  notes: StudyNote[];
  onAdd: (content: string) => void;
  onUpdate: (id: string, content: string) => void;
  onTogglePin: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (!draft.trim()) return;
    onAdd(draft);
    setDraft("");
    textareaRef.current?.focus();
  };

  const saveEdit = () => {
    if (editingId && editDraft.trim()) {
      onUpdate(editingId, editDraft);
    }
    setEditingId(null);
    setEditDraft("");
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Notlar</p>
        {notes.length > 0 ? (
          <span className="text-[11px] tabular-nums text-slate-600">{notes.length}</span>
        ) : null}
      </div>

      <div className="mt-3">
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="Hızlı not ekle..."
          rows={2}
          className="w-full resize-none rounded-[16px] border border-white/10 bg-black/20 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-sky-400/40 focus:bg-black/30"
        />
        {draft.trim() ? (
          <div className="mt-2 flex items-center justify-between">
            <p className="text-[10px] text-slate-600">⌘+Enter ile kaydet</p>
            <button
              type="button"
              onClick={handleSubmit}
              className="inline-flex items-center gap-1.5 rounded-xl border border-sky-400/30 bg-sky-400/10 px-3 py-1.5 text-xs font-medium text-sky-200 transition hover:bg-sky-400/20"
            >
              <MessageSquarePlus className="h-3 w-3" />
              Ekle
            </button>
          </div>
        ) : null}
      </div>

      {notes.length > 0 ? (
        <div className="mt-4 space-y-2">
          {notes.map((note) => (
            <div
              key={note.id}
              className={[
                "group rounded-[16px] border p-3 transition",
                note.pinned
                  ? "border-amber-400/20 bg-amber-400/[0.04]"
                  : "border-white/8 bg-white/[0.02]",
              ].join(" ")}
            >
              {editingId === note.id ? (
                <div>
                  <textarea
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        saveEdit();
                      }
                      if (e.key === "Escape") {
                        setEditingId(null);
                      }
                    }}
                    rows={3}
                    className="w-full resize-none rounded-xl border border-sky-400/30 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                    autoFocus
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={saveEdit}
                      className="rounded-lg border border-sky-400/30 bg-sky-400/10 px-2.5 py-1 text-[11px] text-sky-200 transition hover:bg-sky-400/20"
                    >
                      Kaydet
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="rounded-lg border border-white/8 px-2.5 py-1 text-[11px] text-slate-500 transition hover:text-slate-300"
                    >
                      İptal
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p
                    className="cursor-pointer whitespace-pre-wrap text-sm leading-6 text-slate-300"
                    onClick={() => {
                      setEditingId(note.id);
                      setEditDraft(note.content);
                    }}
                  >
                    {note.content}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-[10px] text-slate-600">
                      {new Date(note.updatedAt).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => onTogglePin(note.id)}
                        className={`rounded-lg p-1.5 transition ${
                          note.pinned
                            ? "text-amber-400 hover:text-amber-300"
                            : "text-slate-600 hover:text-slate-400"
                        }`}
                        title={note.pinned ? "Sabitlemeyi kaldır" : "Sabitle"}
                      >
                        {note.pinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(note.id)}
                        className="rounded-lg p-1.5 text-slate-600 transition hover:text-rose-400"
                        title="Sil"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      ) : null}

      {notes.length === 0 && !draft.trim() ? (
        <p className="mt-3 text-xs leading-5 text-slate-600">
          Çalışırken aklına gelenleri hızlıca buraya not et. Notların bu derse bağlı kalır.
        </p>
      ) : null}
    </Card>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatTile({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-[18px] border border-white/8 bg-black/20 p-3">
      <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1.5 text-lg font-semibold text-white">{value}</p>
      <p className="mt-0.5 truncate text-[11px] text-slate-500">{sub}</p>
    </div>
  );
}

function RiskBadge({ label }: { label: string }) {
  const colorMap: Record<string, string> = {
    Critical: "bg-rose-400",
    High: "bg-amber-400",
    Moderate: "bg-sky-400",
    Low: "bg-emerald-400",
  };
  return <span className={`h-1.5 w-1.5 rounded-full ${colorMap[label] ?? "bg-slate-400"}`} />;
}
