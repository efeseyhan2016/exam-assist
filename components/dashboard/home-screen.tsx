"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Clock3,
  ListChecks,
  Target,
  Timer,
  Upload,
} from "lucide-react";

import { ApproachingExamsDock } from "@/components/dashboard/approaching-exams-dock";
import { HomeCalendarBoard } from "@/components/dashboard/home-calendar-board";
import { StudySessionForm } from "@/components/dashboard/study-session-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FloatingFeedbackToast } from "@/components/ui/floating-feedback-toast";
import { useFloatingFeedback } from "@/hooks/useFloatingFeedback";
import { useResources } from "@/hooks/useResources";
import { buildDailyBrief } from "@/lib/daily-brief";
import { HomeFocusRecommendation } from "@/lib/home-focus";
import {
  buildRecommendationFingerprint,
  logRecommendationShown,
  markRecommendationAccepted,
} from "@/lib/recommendation-events";
import { getGuidanceCopy } from "@/lib/risk-presentation";
import { buildResourceUploadInsight, pickPrimaryResourceGuidance } from "@/lib/resource-intelligence";
import { buildSubjectLearningProfile } from "@/lib/subject-learning";
import { buildPostSessionFeedback, buildStudyLaunchDraft } from "@/lib/study-recommendation";
import { deriveSessionBehaviorHint, deriveStudyMode, getStudyIntelligence } from "@/lib/subject-intelligence";
import {
  buildTopicCoverageState,
  getLatestTopicFocus,
  pickNextTopicFocus,
  summarizeTopicCoverage,
} from "@/lib/topic-focus";
import {
  formatMinutesAsHours,
  formatPlannedHours,
  formatRelativeDuration,
} from "@/lib/time";
import {
  ContentTypeHint,
  Exam,
  RankedSubjectRisk,
  ScheduleItem,
  StudyLaunchDraft,
  StudentConstraints,
  StudySession,
  SubjectId,
  SubjectSeed,
} from "@/lib/types";
import { WorkspaceView } from "@/components/dashboard/workspace-nav";

interface HomeScreenProps {
  now: Date;
  upcomingExams: Array<{
    id: string;
    title: string;
    shortLabel: string;
    scheduledAt: string;
    countdown: {
      totalMilliseconds: number;
    };
  }>;
  topRisk: RankedSubjectRisk | null;
  homeFocus: HomeFocusRecommendation | null;
  calendarItems: Array<
    ScheduleItem & {
      countdownMs: number;
    }
  >;
  onAddSession: (input: {
    subjectId: SubjectId;
    minutes: number;
    notes?: string;
    topic?: string;
    reflection?: import("@/lib/types").StudySessionReflection;
    recommendationId?: string;
  }) => void;
  subjects: SubjectSeed[];
  sessions: StudySession[];
  sessionsToday: StudySession[];
  dailyMinutes: number;
  dailyGoalMinutes: number;
  planningExams: Exam[];
  planningConstraints: StudentConstraints;
  launchDraft: StudyLaunchDraft | null;
  onQueueStudyLaunch: (draft: StudyLaunchDraft) => void;
  onNavigate: (view: WorkspaceView) => void;
}

export function HomeScreen({
  now,
  upcomingExams,
  topRisk,
  homeFocus,
  calendarItems,
  onAddSession,
  subjects,
  sessions,
  sessionsToday,
  dailyMinutes,
  dailyGoalMinutes,
  planningExams,
  planningConstraints,
  launchDraft,
  onQueueStudyLaunch,
  onNavigate,
}: HomeScreenProps) {
  const [resourceUploadFeedback, setResourceUploadFeedback] = useState<{
    headline: string;
    body: string;
    topics: string[];
    launchDraft: StudyLaunchDraft;
  } | null>(null);
  const [homeRecommendationId, setHomeRecommendationId] = useState<string | null>(null);
  const actionZoneRef = useRef<HTMLDivElement | null>(null);
  const lastHomeRecommendationFingerprintRef = useRef<string | null>(null);
  const { feedback, showFeedback, clearFeedback } = useFloatingFeedback(2800);
  const { resources, addResource } = useResources();
  const focusSubjectId = homeFocus?.subject.subjectId ?? null;
  const focusSubjectResources = useMemo(() => {
    if (!homeFocus) return [];
    return resources.filter(
      (resource) => resource.subjectId === homeFocus.subject.subjectId,
    );
  }, [homeFocus, resources]);
  const latestFocusReflection = useMemo(() => {
    if (!homeFocus) return null;

    return [...sessions]
      .filter((session) => session.subjectId === homeFocus.subject.subjectId && session.reflection)
      .sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      )[0]?.reflection ?? null;
  }, [homeFocus, sessions]);
  const focusLearningProfile = useMemo(() => {
    if (!homeFocus) return null;

    return buildSubjectLearningProfile({
      subjectId: homeFocus.subject.subjectId,
      sessions,
      resources: focusSubjectResources,
    });
  }, [focusSubjectResources, homeFocus, sessions]);
  const focusTopicCoverage = useMemo(() => {
    if (!homeFocus) return [];

    return buildTopicCoverageState({
      subjectId: homeFocus.subject.subjectId,
      sessions,
      resources: focusSubjectResources,
    });
  }, [focusSubjectResources, homeFocus, sessions]);
  const focusTopicSummary = useMemo(
    () => summarizeTopicCoverage(focusTopicCoverage),
    [focusTopicCoverage],
  );
  const focusStudyIntelligence = useMemo(() => {
    if (!homeFocus) return null;

    const activeSubject = subjects.find((subject) => subject.id === homeFocus.subject.subjectId);
    if (!activeSubject) return null;

    const contentHints = focusSubjectResources
      .map((resource) => resource.contentHint)
      .filter((hint): hint is ContentTypeHint => hint !== undefined);
    const sessionHint = deriveSessionBehaviorHint(sessions, homeFocus.subject.subjectId);
    const studyMode = deriveStudyMode(
      activeSubject,
      contentHints,
      sessionHint,
      focusLearningProfile?.modeHint ?? null,
    );

    return getStudyIntelligence(studyMode);
  }, [focusLearningProfile?.modeHint, focusSubjectResources, homeFocus, sessions, subjects]);
  const primaryFocusResource = useMemo(() => {
    if (!homeFocus) return null;
    if (!focusStudyIntelligence || focusSubjectResources.length === 0) return null;
    return pickPrimaryResourceGuidance(
      focusSubjectResources,
      focusStudyIntelligence,
      homeFocus.subject.hoursUntilExam,
      now,
    );
  }, [focusStudyIntelligence, focusSubjectResources, homeFocus, now]);
  const dailyBrief = buildDailyBrief({
    topRisk,
    homeFocus,
    upcomingExams,
    dailyMinutes,
    dailyGoalMinutes,
    activeTopic:
      homeFocus ? getLatestTopicFocus(sessions, homeFocus.subject.subjectId) : null,
    primaryResource: primaryFocusResource
      ? {
          title: primaryFocusResource.resource.title,
          actionLabel: primaryFocusResource.guidance.actionLabel,
          topics: primaryFocusResource.resource.topicHints,
        }
      : null,
    topicCoverage: focusTopicSummary,
    latestReflection: latestFocusReflection,
    learningReason:
      focusLearningProfile?.confidence === "medium" ? focusLearningProfile.reason : null,
  });
  const homeLaunchDraft = useMemo<StudyLaunchDraft | null>(() => {
    if (!homeFocus || dailyBrief.recommendedMinutes === null) {
      return null;
    }

    return buildStudyLaunchDraft({
      subjectId: homeFocus.subject.subjectId,
      subjectTitle: homeFocus.subject.title,
      hoursUntilExam: homeFocus.subject.hoursUntilExam,
      remainingGoalMinutes: dailyGoalMinutes - dailyMinutes,
      riskLabel: homeFocus.subject.label,
      mode: homeFocus.mode,
      lastReflection: latestFocusReflection ?? undefined,
      topic:
        pickNextTopicFocus(focusTopicCoverage) ??
        getLatestTopicFocus(sessions, homeFocus.subject.subjectId) ??
        primaryFocusResource?.resource.topicHints?.[0],
      source: "brief",
      sourceLabel: dailyBrief.headline,
    });
  }, [
    dailyBrief.headline,
    dailyBrief.recommendedMinutes,
    dailyGoalMinutes,
    dailyMinutes,
    focusTopicCoverage,
    latestFocusReflection,
    homeFocus,
    primaryFocusResource,
    sessions,
  ]);

  useEffect(() => {
    if (!homeLaunchDraft) {
      lastHomeRecommendationFingerprintRef.current = null;
      setHomeRecommendationId(null);
      return;
    }

    const fingerprint = buildRecommendationFingerprint(homeLaunchDraft);
    if (fingerprint === lastHomeRecommendationFingerprintRef.current) {
      return;
    }

    const event = logRecommendationShown({
      subjectId: homeLaunchDraft.subjectId,
      source: homeLaunchDraft.source,
      sourceLabel: homeLaunchDraft.sourceLabel,
      topic: homeLaunchDraft.topic,
      recommendedMinutes: homeLaunchDraft.minutes,
    });

    lastHomeRecommendationFingerprintRef.current = fingerprint;
    setHomeRecommendationId(event.id);
  }, [homeLaunchDraft]);

  useEffect(() => {
    setResourceUploadFeedback(null);
  }, [focusSubjectId]);

  const queueableHomeLaunchDraft = useMemo(
    () =>
      homeLaunchDraft
        ? {
            ...homeLaunchDraft,
            recommendationId: homeRecommendationId ?? undefined,
          }
        : null,
    [homeLaunchDraft, homeRecommendationId],
  );

  const handleAddSession = (input: {
    subjectId: SubjectId;
    minutes: number;
    notes?: string;
    topic?: string;
    reflection?: import("@/lib/types").StudySessionReflection;
    recommendationId?: string;
  }) => {
    onAddSession(input);
    const subjectTitle =
      subjects.find((subject) => subject.id === input.subjectId)?.title ?? input.subjectId;
    const feedback = buildPostSessionFeedback({
      subjectTitle,
      previousTopTitle: topRisk?.title ?? null,
      reflection: input.reflection,
      sessions,
      nextSession: {
        id: `temp-${Date.now()}`,
        subjectId: input.subjectId,
        minutes: input.minutes,
        createdAt: new Date().toISOString(),
        notes: input.notes,
        topic: input.topic,
        reflection: input.reflection,
      },
      now: new Date(),
      constraints: planningConstraints,
      exams: planningExams,
      subjectSeeds: subjects,
    });

    showFeedback({
      variant: "success",
      label: "Seans kaydedildi",
      title: subjectTitle,
      body: feedback,
      actionLabel: "Öncelikler",
      onAction: () => {
        clearFeedback();
        onNavigate("priorities");
      },
      countdownMs: 2600,
    });
  };
  const handleHomeResourceUpload = async (file: File) => {
    if (!homeFocus || !focusStudyIntelligence) {
      throw new Error("Önce bir odak dersi oluşmalı.");
    }

    const focusSubject = subjects.find((subject) => subject.id === homeFocus.subject.subjectId);
    if (!focusSubject) {
      throw new Error("Bu ders için kaynak şu anda eklenemedi.");
    }

    const uploaded = await addResource(focusSubject.id, file);
    const nextCoverage = buildTopicCoverageState({
      subjectId: focusSubject.id,
      sessions,
      resources: [...focusSubjectResources, uploaded],
    });
    const launchDraft: StudyLaunchDraft = {
      subjectId: focusSubject.id,
      minutes: focusStudyIntelligence.recommendedSessionMinutes,
      topic:
        pickNextTopicFocus(nextCoverage) ??
        uploaded.topicHints?.[0] ??
        getLatestTopicFocus(sessions, focusSubject.id),
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

    const uploadInsight = buildResourceUploadInsight({
      subjectTitle: focusSubject.title,
      resource: uploaded,
      existingResources: focusSubjectResources,
      intelligence: focusStudyIntelligence,
      hoursUntilExam: homeFocus.subject.hoursUntilExam,
    });

    const nextLaunchDraft = {
      ...launchDraft,
      recommendationId: recommendationEvent.id,
    };

    setResourceUploadFeedback({
      ...uploadInsight,
      launchDraft: {
        ...nextLaunchDraft,
      },
    });

    showFeedback({
      variant: "info",
      label: "Kaynak eklendi",
      title: uploadInsight.headline,
      body: uploadInsight.body,
      actionLabel: "Bu kaynakla başla",
      onAction: () => {
        clearFeedback();
        if (nextLaunchDraft.recommendationId) {
          markRecommendationAccepted(nextLaunchDraft.recommendationId);
        }
        onQueueStudyLaunch(nextLaunchDraft);
        onNavigate("sessions");
      },
      countdownMs: 3200,
    });
  };

  const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as const },
  });

  return (
    <section className="space-y-4 xl:max-w-[1040px] 2xl:max-w-[1120px]">
      <motion.div {...fadeUp(0)}>
        <div className="space-y-3 px-1">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Ana Ekran</p>
            <h2 className="mt-1 text-[1.35rem] font-semibold text-white sm:text-[1.5rem]">
              Bu hafta için hızlı görünüm
            </h2>
            <p className="mt-1 max-w-xl text-sm leading-5 text-slate-400">
              Yaklaşan sınavları, haftalık takvimi ve bugünkü hareket alanını tek bakışta gör.
            </p>
          </div>

          <ApproachingExamsDock exams={upcomingExams} />

          <DailyBriefCard
            brief={dailyBrief}
          onLaunch={
              queueableHomeLaunchDraft
                ? () => {
                    if (queueableHomeLaunchDraft.recommendationId) {
                      markRecommendationAccepted(queueableHomeLaunchDraft.recommendationId);
                    }
                    onQueueStudyLaunch(queueableHomeLaunchDraft);
                    actionZoneRef.current?.scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    });
                  }
                : undefined
            }
          />

          <FocusDirectiveCard
            topRisk={topRisk}
            homeFocus={homeFocus}
            onNavigate={onNavigate}
          />
        </div>
      </motion.div>

      <motion.div
        {...fadeUp(0.08)}
        className="space-y-3"
      >
        <HomeCalendarBoard
          now={now}
          items={calendarItems}
          topRisk={topRisk}
          dailyMinutes={dailyMinutes}
          dailyGoalMinutes={dailyGoalMinutes}
          onNavigate={onNavigate}
        />

        <Card
          ref={actionZoneRef}
          className="bg-[linear-gradient(180deg,rgba(8,14,26,0.96),rgba(6,12,22,0.98))] p-4 sm:p-5"
        >
          <div className="mb-4 flex items-center justify-between gap-4 border-b border-white/8 pb-3.5">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Bugün Yap</p>
              <h3 className="mt-1 text-lg font-semibold text-white">
                Kaynak ekle veya seans kaydet
              </h3>
            </div>

          </div>

          <div className="grid gap-3 xl:grid-cols-2">
            <HomeResourceIntakeCard
              subjectTitle={homeFocus?.subject.title ?? null}
              quickUploadEnabled={Boolean(homeFocus && focusStudyIntelligence)}
              onUpload={handleHomeResourceUpload}
              uploadFeedback={resourceUploadFeedback}
              onOpenLibrary={() => onNavigate("library")}
              onLaunch={() => {
                if (!resourceUploadFeedback) return;
                if (resourceUploadFeedback.launchDraft.recommendationId) {
                  markRecommendationAccepted(resourceUploadFeedback.launchDraft.recommendationId);
                }
                onQueueStudyLaunch(resourceUploadFeedback.launchDraft);
                onNavigate("sessions");
              }}
            />
            <StudySessionForm
              subjects={subjects}
              onAddSession={handleAddSession}
              sessionsToday={sessionsToday}
              embedded
              compact
              launchDraft={launchDraft}
            />
          </div>

          {/* Guide nudge */}
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-[18px] border border-white/8 bg-white/[0.02] px-3.5 py-2.5">
            <ListChecks className="h-4 w-4 shrink-0 text-sky-300" />
            <p className="text-sm text-slate-400">
              Seans ekledikten sonra öncelik sıralaması otomatik güncellenir.
            </p>
            <button
              type="button"
              onClick={() => onNavigate("schedule")}
              className="text-sm text-slate-300 hover:text-white"
            >
              Takvime git
            </button>
            <button
              type="button"
              onClick={() => onNavigate("priorities")}
              className="ml-auto flex items-center gap-1 text-sm text-sky-300 hover:text-sky-200"
            >
              Öncelikleri gör <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </Card>
      </motion.div>

      <AnimatePresence initial={false}>
        {feedback ? <FloatingFeedbackToast {...feedback} /> : null}
      </AnimatePresence>
    </section>
  );
}

function HomeResourceIntakeCard({
  subjectTitle,
  quickUploadEnabled,
  onUpload,
  uploadFeedback,
  onOpenLibrary,
  onLaunch,
}: {
  subjectTitle: string | null;
  quickUploadEnabled: boolean;
  onUpload: (file: File) => Promise<void>;
  uploadFeedback: {
    headline: string;
    body: string;
    topics: string[];
  } | null;
  onOpenLibrary: () => void;
  onLaunch: () => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      const file = files?.[0];
      if (!file) return;

      setUploading(true);
      setUploadError(null);

      try {
        await onUpload(file);
      } catch (error) {
        setUploadError(
          error instanceof Error
            ? error.message
            : "Kaynak şu anda eklenemedi. Lütfen tekrar dene.",
        );
      } finally {
        setUploading(false);
      }
    },
    [onUpload],
  );

  return (
    <Card className="h-full p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Kaynak</p>
          <h3 className="mt-2 text-xl font-semibold text-white">Bugünkü derse kaynak ekle</h3>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
            {quickUploadEnabled && subjectTitle ? (
              <>
                Özellikle <span className="font-medium text-white">{subjectTitle}</span> için bir
                PDF ya da doküman eklemek, ilk çalışma bloğunu daha net kurar.
              </>
            ) : (
              <>
                Şu an aktif bir sınav odağı görünmüyor. Ders bazlı kaynak eklemek istersen bunu
                doğrudan kütüphane ekranından yapman daha doğru olur.
              </>
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3 text-sky-200">
          <BookOpen className="h-5 w-5" />
        </div>
      </div>

      <div
        onClick={() => {
          if (quickUploadEnabled) {
            inputRef.current?.click();
          }
        }}
        className={`mt-5 flex flex-col items-center gap-3 rounded-[22px] border border-dashed p-5 text-center transition ${
          quickUploadEnabled
            ? "cursor-pointer border-sky-300/18 bg-sky-300/6 hover:border-sky-300/35 hover:bg-sky-300/8"
            : "cursor-default border-white/10 bg-white/[0.02] opacity-80"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          disabled={!quickUploadEnabled}
          onChange={(event) => {
            void handleFiles(event.target.files);
            event.target.value = "";
          }}
        />
        <span
          className={`inline-flex h-11 w-11 items-center justify-center rounded-full border ${
            quickUploadEnabled
              ? "border-sky-300/18 bg-sky-300/10"
              : "border-white/10 bg-white/[0.04]"
          }`}
        >
          <Upload className={`h-4 w-4 ${quickUploadEnabled ? "text-sky-100" : "text-slate-400"}`} />
        </span>
        <div>
          <p className="text-sm font-medium text-white">
            {quickUploadEnabled
              ? uploading
                ? "Analiz ediliyor..."
                : "PDF veya doküman yükle"
              : "Hızlı yükleme şu an kapalı"}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            {quickUploadEnabled
              ? "PDF, DOC, DOCX · tek tıkla ekle"
              : "Aktif odak oluşunca bu alan tekrar hızlı yükleme için açılır."}
          </p>
          {uploadError ? <p className="mt-2 text-xs text-rose-300">{uploadError}</p> : null}
        </div>
      </div>

      {!quickUploadEnabled ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3">
          <p className="text-sm text-slate-300">
            Kaynakları yine ekleyebilirsin, ama bunu ders bazlı olarak kütüphaneden yapmak daha temiz.
          </p>
          <Button variant="secondary" className="ml-auto gap-2" onClick={onOpenLibrary}>
            Kütüphaneye git
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      ) : null}

      <div className="mt-5 rounded-[22px] border border-white/10 bg-black/20 p-4">
        <div className="flex items-start gap-3">
          <ListChecks className="mt-0.5 h-4 w-4 text-slate-300" />
          <div>
            <p className="text-sm font-medium text-white">Neden burada?</p>
            <p className="mt-1 text-sm leading-6 text-slate-300">
              Takvim eklemek çoğunlukla tek seferlik bir kurulum. Kaynak eklemek ise bugünkü
              çalışmayı gerçekten başlatır.
            </p>
          </div>
        </div>
      </div>

      {uploadFeedback ? (
        <div className="mt-4 rounded-[22px] border border-emerald-400/15 bg-emerald-400/[0.05] p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-emerald-200/80">Yükleme etkisi</p>
          <p className="mt-2 text-base font-medium text-white">{uploadFeedback.headline}</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">{uploadFeedback.body}</p>
          {uploadFeedback.topics.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {uploadFeedback.topics.map((topic) => (
                <span
                  key={topic}
                  className="rounded-full border border-emerald-300/15 bg-emerald-300/[0.08] px-3 py-1.5 text-[11px] text-emerald-100"
                >
                  {topic}
                </span>
              ))}
            </div>
          ) : null}
          <Button className="mt-4 gap-2" onClick={onLaunch}>
            Bu kaynakla başla
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      ) : null}
    </Card>
  );
}

function DailyBriefCard({
  brief,
  onLaunch,
}: {
  brief: ReturnType<typeof buildDailyBrief>;
  onLaunch?: () => void;
}) {
  return (
    <Card className="border-white/8 bg-[linear-gradient(135deg,rgba(9,16,30,0.96),rgba(12,20,36,0.92))] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-sky-200/80">
            Günlük brief
          </p>
          <h3 className="mt-1 text-base font-semibold text-white">{brief.headline}</h3>
        </div>
        <div className="rounded-full border border-sky-300/18 bg-sky-300/8 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-sky-100/80">
          {brief.modeLabel}
        </div>
      </div>

      {brief.recommendation ? (
        <p className="mt-2 text-lg font-medium leading-7 text-white">{brief.recommendation}</p>
      ) : null}

      <p className="mt-2 text-sm leading-6 text-slate-300">{brief.body}</p>

      {brief.chips.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {brief.chips.map((chip) => (
            <div
              key={chip.label}
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5"
            >
              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">{chip.label}</p>
              <p className="mt-0.5 text-sm font-medium text-white">{chip.value}</p>
            </div>
          ))}
        </div>
      ) : null}

      {onLaunch ? (
        <Button className="mt-4 w-full gap-2 sm:w-auto" onClick={onLaunch}>
          Bu blokla başla
          <ArrowRight className="h-4 w-4" />
        </Button>
      ) : null}
    </Card>
  );
}

function FocusDirectiveCard({
  topRisk,
  homeFocus,
  onNavigate,
}: {
  topRisk: RankedSubjectRisk | null;
  homeFocus: HomeFocusRecommendation | null;
  onNavigate: (view: WorkspaceView) => void;
}) {
  if (!topRisk || !homeFocus) {
    return (
      <Card className="border-white/8 bg-white/[0.03] p-4">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Şu An Odaklan</p>
        <p className="mt-2 text-base text-slate-300">
          Sınav ve ders bilgileri eklendikten sonra öncelik sıralaması burada görünecek.
        </p>
      </Card>
    );
  }

  const focusSubject = homeFocus.subject;
  const guidance = getGuidanceCopy(focusSubject.label);
  const urgencyColor =
    focusSubject.label === "Critical"
      ? "border-rose-400/25 bg-[linear-gradient(135deg,rgba(20,8,12,0.98),rgba(24,10,16,0.96))]"
      : focusSubject.label === "High"
        ? "border-amber-300/25 bg-[linear-gradient(135deg,rgba(20,16,6,0.98),rgba(24,18,8,0.96))]"
        : "border-sky-300/18 bg-[linear-gradient(135deg,rgba(8,14,24,0.98),rgba(10,18,30,0.96))]";

  const badgeColor =
    focusSubject.label === "Critical"
      ? "border-rose-400/30 bg-rose-400/12 text-rose-100"
      : focusSubject.label === "High"
        ? "border-amber-300/30 bg-amber-300/12 text-amber-50"
        : "border-sky-300/25 bg-sky-300/10 text-sky-50";

  const isCritical = focusSubject.label === "Critical";
  const isHigh = focusSubject.label === "High";
  const glowColor = isCritical
    ? "rgba(251,113,133,0.22)"
    : isHigh
      ? "rgba(252,211,77,0.16)"
      : "rgba(56,189,248,0.14)";

  return (
    <Card className={`relative overflow-hidden ${urgencyColor} p-4 sm:p-5`}>
      {/* Pulse glow behind card — critical/high only */}
      {(isCritical || isHigh) && (
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          style={{ boxShadow: `inset 0 0 60px 0 ${glowColor}` }}
        />
      )}

      {/* Shimmer sweep */}
      <motion.div
        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.04] to-transparent"
        animate={{ x: ["-100%", "250%"] }}
        transition={{ duration: 4, repeat: Infinity, repeatDelay: 6, ease: "easeInOut" }}
      />

      <div className="relative flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Şu An Odaklan</p>
            <motion.span
              className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] ${badgeColor}`}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              {guidance.badge}
            </motion.span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            <h3 className="text-xl font-semibold text-white sm:text-[1.7rem]">
              {focusSubject.title}
            </h3>
            <p className="mt-1 text-sm text-slate-400">{focusSubject.examTitle}</p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              {homeFocus.reason}
            </p>
            {focusSubject.subjectId !== topRisk.subjectId ? (
              <p className="mt-1 text-[12px] text-slate-500">
                Genel listede {topRisk.title} üstte dursa da, bugünkü çalışma yaklaşımı için{" "}
                {focusSubject.title} daha doğru bir giriş veriyor.
              </p>
            ) : null}
          </motion.div>

          <div className="grid gap-2.5 sm:grid-cols-3">
            {[
              {
                icon: Clock3,
                label: "Bugün bu derste",
                value: formatMinutesAsHours(homeFocus.sessionMinutesToday),
              },
              {
                icon: Target,
                label: "Kalan alan",
                value: `${formatPlannedHours(focusSubject.remainingTargetHours)} saat`,
              },
              {
                icon: Timer,
                label: "Sınava kalan",
                value: formatRelativeDuration(focusSubject.hoursUntilExam * 3_600_000),
              },
            ].map((metric, i) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              >
                <FocusMetric icon={metric.icon} label={metric.label} value={metric.value} />
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          className="flex flex-col gap-2.5 xl:min-w-[188px] xl:items-end"
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          <Button
            className="w-full gap-2 xl:w-auto"
            onClick={() => onNavigate("sessions")}
          >
            {homeFocus.mode === "switch" ? "Sıradaki bloğu kaydet" : "Seans ekle"}
            <ArrowRight className="h-4 w-4" />
          </Button>
          <button
            type="button"
            className="text-sm text-slate-400 underline-offset-4 hover:text-slate-300 hover:underline"
            onClick={() => onNavigate("priorities")}
          >
            Tüm öncelikleri gör
          </button>
        </motion.div>
      </div>
    </Card>
  );
}

function FocusMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Target;
  label: string;
  value: string;
}) {
  return (
    <motion.div
      className="rounded-[16px] border border-white/10 bg-black/20 px-3.5 py-2.5"
      whileHover={{ y: -2, borderColor: "rgba(255,255,255,0.2)", boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}
      transition={{ duration: 0.18 }}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-slate-400" />
        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{label}</p>
      </div>
      <p className="mt-1.5 text-base font-semibold text-white">{value}</p>
    </motion.div>
  );
}
