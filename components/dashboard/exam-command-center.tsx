"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Inbox } from "lucide-react";

import { AuthScreen } from "@/components/auth/auth-screen";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { HomeScreen } from "@/components/dashboard/home-screen";
import { AcademicInboxScreen } from "@/components/dashboard/academic-inbox-screen";
import { ProfileScreen } from "@/components/dashboard/profile-screen";
import { OnboardingScreen } from "@/components/onboarding/onboarding-screen";
import { PrioritiesScreen } from "@/components/dashboard/priorities-screen";
import { ResourcesScreen } from "@/components/dashboard/resources-screen";
import { ScheduleScreen } from "@/components/dashboard/schedule-screen";
import { SessionsScreen } from "@/components/dashboard/sessions-screen";
import { WorkspaceNav, WorkspaceView } from "@/components/dashboard/workspace-nav";
import { useAcademicEvents } from "@/hooks/useAcademicEvents";
import { useResources } from "@/hooks/useResources";
import { useScheduleItems } from "@/hooks/useScheduleItems";
import { useExamOutcomes } from "@/hooks/useExamOutcomes";
import { Card } from "@/components/ui/card";
import { useExamCountdown } from "@/hooks/useExamCountdown";
import { usePlanningRuntime } from "@/hooks/usePlanningRuntime";
import { useRiskEngine } from "@/hooks/useRiskEngine";
import { useStudySessions } from "@/hooks/useStudySessions";
import {
  AuthAccount,
  clearAuthSession,
  isSessionValid,
  readAuthAccount,
  readAuthSession,
} from "@/lib/auth";
import {
  primeCloudStateSnapshot,
  readCloudStateSnapshot,
  resolveEffectiveCloudSnapshot,
  syncCloudStateNow,
} from "@/lib/cloud-state";
import {
  readCloudAuthSnapshot,
  signOutCloudAuth,
  subscribeToCloudAuthChanges,
  syncProfileToCloud,
} from "@/lib/cloud-auth";
import { readAuthFlowNotice, shouldForceWelcome } from "@/lib/entry-flow";
import {
  buildAcademicInboxEvents,
  buildAcademicHomeSignal,
  buildAcademicPrioritiesSignal,
} from "@/lib/academic-events";
import { splitExamTimeline } from "@/lib/exam-outcomes";
import { buildHomeFocusRecommendation } from "@/lib/home-focus";
import { bindResourcesToExams } from "@/lib/resource-document-binding";
import { buildTaskAwarePriorities } from "@/lib/task-aware-priorities";
import {
  getScheduleItemIdFromPlanningExamId,
  scheduleItemToPlanningExam,
} from "@/lib/planning-runtime";
import { markRecommendationConverted } from "@/lib/recommendation-events";
import {
  hasMeaningfulLocalStateSnapshot,
  restorePlanningExam,
  removePlanningExam,
  readLocalStateSnapshot,
  readOnboardingState,
  readUserProfile,
  replaceLocalStateSnapshot,
  writeOnboardingState,
  writeUserProfile,
} from "@/lib/storage";
import { isSupabaseEnabled } from "@/lib/supabase/config";
import { Exam, ScheduleItem, StudyLaunchDraft, SubjectId, SubjectSeed } from "@/lib/types";

type AppGate = "loading" | "auth" | "onboarding" | "dashboard";

type DeletedCalendarUndo =
  | { kind: "manual"; item: ScheduleItem; title: string; token: string }
  | { kind: "planning"; exam: Exam; subjectSeed?: SubjectSeed; title: string; token: string };

export function ExamCommandCenter() {
  const cloudEnabled = isSupabaseEnabled();
  const [gate, setGate] = useState<AppGate>("loading");
  const [existingAccount, setExistingAccount] = useState<(AuthAccount & { email?: string }) | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [cloudEntryAccepted, setCloudEntryAccepted] = useState(false);
  const [activeView, setActiveView] = useState<WorkspaceView>("home");
  const [studyLaunchDraft, setStudyLaunchDraft] = useState<StudyLaunchDraft | null>(null);
  const [runtimeRefreshKey, setRuntimeRefreshKey] = useState(0);
  const { runtime: planningRuntime, isReady: isPlanningReady } = usePlanningRuntime(runtimeRefreshKey);
  const {
    sessions,
    sessionsToday,
    addSession,
    deleteSession,
    isReady,
    studyStreak,
  } = useStudySessions(planningRuntime.profile.timezone);
  const {
    items: manualScheduleItems,
    addItem: addScheduleItem,
    addItems: addScheduleItems,
    deleteItem: deleteScheduleItem,
    restoreItem: restoreScheduleItem,
    isReady: isScheduleReady,
    manualItemsCount,
  } = useScheduleItems();
  const { outcomes: examOutcomes, isReady: isExamOutcomesReady, saveOutcome } = useExamOutcomes();
  const {
    activeEvents: academicEvents,
    dismissEvent: dismissAcademicEvent,
    resolveEvent: resolveAcademicEvent,
  } = useAcademicEvents();
  // Read-only resource list for cross-cutting intelligence (binding, coverage).
  // ResourcesScreen manages its own write-capable hook instance independently.
  const { resources } = useResources();

  // Play a soft chime when new inbox events arrive (skip on initial hydration)
  const prevEventCountRef = useRef<number | null>(null);
  useEffect(() => {
    const count = academicEvents.length;
    if (prevEventCountRef.current !== null && count > prevEventCountRef.current) {
      playNotificationChime();
    }
    prevEventCountRef.current = count;
  }, [academicEvents.length]);

  const [pendingUndoDelete, setPendingUndoDelete] = useState<DeletedCalendarUndo | null>(null);

  // Merge manual schedule exams into the planning exam list in the same render
  // cycle they're added, without waiting for runtimeRefreshKey to propagate.
  const allExams = useMemo(() => {
    const planningExamIds = new Set(planningRuntime.exams.map((e) => e.id));
    const pendingScheduleExams = manualScheduleItems
      .filter((item) => item.kind === "exam" && item.source === "manual")
      .map((item) => scheduleItemToPlanningExam(item))
      .filter((exam) => !planningExamIds.has(exam.id));

    if (pendingScheduleExams.length === 0) return planningRuntime.exams;

    return [...planningRuntime.exams, ...pendingScheduleExams].sort(
      (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
    );
  }, [planningRuntime.exams, manualScheduleItems]);

  const { now, nextExam, timeline } = useExamCountdown(allExams);
  const { upcoming: upcomingTimeline } = useMemo(
    () => splitExamTimeline(timeline, now),
    [now, timeline],
  );
  const riskSnapshot = useRiskEngine(sessions, {
    exams: planningRuntime.exams,
    subjectSeeds: planningRuntime.subjectSeeds,
    constraints: planningRuntime.constraints,
  });
  const homeAcademicSignal = useMemo(
    () => buildAcademicHomeSignal(academicEvents, planningRuntime.subjectSeeds, now),
    [academicEvents, now, planningRuntime.subjectSeeds],
  );
  const inboxEvents = useMemo(
    () => buildAcademicInboxEvents(academicEvents, riskSnapshot.rankedSubjects, now),
    [academicEvents, now, riskSnapshot.rankedSubjects],
  );
  const prioritiesAcademicSignal = useMemo(
    () => buildAcademicPrioritiesSignal(academicEvents, planningRuntime.subjectSeeds, now),
    [academicEvents, now, planningRuntime.subjectSeeds],
  );
  const prioritySubjects = useMemo(
    () =>
      buildTaskAwarePriorities(
        riskSnapshot.rankedSubjects,
        academicEvents,
        planningRuntime.subjectSeeds,
        now,
      ),
    [academicEvents, now, planningRuntime.subjectSeeds, riskSnapshot.rankedSubjects],
  );
  const examResourceBindings = useMemo(
    () => bindResourcesToExams(prioritySubjects, resources),
    [prioritySubjects, resources],
  );

  useEffect(() => {
    if (isScheduleReady) {
      setRuntimeRefreshKey((key) => key + 1);
    }
  }, [isScheduleReady, manualScheduleItems]);

  useEffect(() => {
    if (!pendingUndoDelete) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setPendingUndoDelete(null);
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [pendingUndoDelete]);

  const hydrateGateState = useCallback(async () => {
    const forceWelcome =
      typeof window !== "undefined" && shouldForceWelcome(window.location.search);
    const authFlowNotice =
      typeof window !== "undefined" ? readAuthFlowNotice(window.location.search) : null;

    if (forceWelcome || authFlowNotice) {
      if (typeof window !== "undefined") {
        window.history.replaceState({}, "", window.location.pathname);
      }
      if (cloudEnabled) {
        await signOutCloudAuth();
      }
      setExistingAccount(null);
      setCloudEntryAccepted(false);
      setAuthNotice(authFlowNotice);
      setGate("auth");
      return;
    }

    if (cloudEnabled) {
      const snapshot = await readCloudAuthSnapshot();
      const localSnapshot = readLocalStateSnapshot();
      const remoteStateSnapshot = await readCloudStateSnapshot();
      const resolvedState = resolveEffectiveCloudSnapshot({
        remoteSnapshot: remoteStateSnapshot,
        remoteProfile: snapshot.profile,
        onboardingCompletedAt: snapshot.onboardingCompletedAt,
        localSnapshot,
      });

      setExistingAccount(snapshot.account);
      setAuthNotice(null);

      if (!snapshot.account) {
        setCloudEntryAccepted(false);
        setGate("auth");
        return;
      }

      if (!cloudEntryAccepted) {
        setGate("auth");
        return;
      }

      if (resolvedState.source === "remote") {
        replaceLocalStateSnapshot(resolvedState.snapshot);
        primeCloudStateSnapshot(resolvedState.snapshot);
      } else if (resolvedState.source === "local" && hasMeaningfulLocalStateSnapshot(localSnapshot)) {
        await syncCloudStateNow(resolvedState.snapshot);
        primeCloudStateSnapshot(resolvedState.snapshot);
      } else {
        replaceLocalStateSnapshot(null);
        primeCloudStateSnapshot(null);
      }

      if (
        resolvedState.snapshot?.userProfile &&
        !readUserProfile()
      ) {
        writeUserProfile(resolvedState.snapshot.userProfile);
      }

      if (
        resolvedState.snapshot?.onboarding &&
        !readOnboardingState()
      ) {
        writeOnboardingState(resolvedState.snapshot.onboarding);
      }

      const effectiveOnboardingCompletedAt =
        resolvedState.snapshot?.userProfile?.setupCompletedAt ??
        resolvedState.snapshot?.onboarding?.completedAt ??
        snapshot.onboardingCompletedAt;
      const hasPlanningData =
        (resolvedState.snapshot?.exams.length ?? 0) > 0;

      setGate(effectiveOnboardingCompletedAt && hasPlanningData ? "dashboard" : "onboarding");
      return;
    }

    const account = readAuthAccount();
    const session = readAuthSession();
    setExistingAccount(account);
    setAuthNotice(null);

    if (!isSessionValid(account, session)) {
      setGate("auth");
      return;
    }

    setGate(readOnboardingState() ? "dashboard" : "onboarding");
  }, [cloudEnabled, cloudEntryAccepted]);

  useEffect(() => {
    void hydrateGateState();
  }, [hydrateGateState]);

  useEffect(() => {
    if (!cloudEnabled) {
      return;
    }

    return subscribeToCloudAuthChanges(() => {
      void hydrateGateState();
    });
  }, [cloudEnabled, hydrateGateState]);

  const dailyMinutes = useMemo(
    () => sessionsToday.reduce((total, session) => total + session.minutes, 0),
    [sessionsToday],
  );

  const topRisk = riskSnapshot.rankedSubjects[0] ?? null;
  const homeFocus = useMemo(
    () =>
      buildHomeFocusRecommendation(
        riskSnapshot.rankedSubjects,
        sessions,
        sessionsToday,
        now,
        {
          academicEvents,
          subjects: planningRuntime.subjectSeeds,
        },
      ),
    [academicEvents, now, planningRuntime.subjectSeeds, riskSnapshot.rankedSubjects, sessions, sessionsToday],
  );
  const studyGoalMinutes = planningRuntime.constraints.dailyStudyGoalHours * 60;
  const handleSaveExamOutcome = useCallback(
    (input: {
      examId: string;
      subjectId: SubjectId;
      score?: number;
      notes?: string;
    }) => {
      const exam =
        planningRuntime.exams.find((entry) => entry.id === input.examId) ??
        allExams.find((entry) => entry.id === input.examId);

      return saveOutcome({
        ...input,
        subjectTitle: exam?.title,
        shortLabel: exam?.shortLabel,
      });
    },
    [allExams, planningRuntime.exams, saveOutcome],
  );

  const handleAuthenticated = () => {
    setCloudEntryAccepted(true);
    void hydrateGateState();
  };

  const handleCompleteOnboarding = (options?: {
    launchDraft?: StudyLaunchDraft | null;
    startView?: WorkspaceView;
  }) => {
    writeOnboardingState({ completedAt: new Date().toISOString() });
    setStudyLaunchDraft(options?.launchDraft ?? null);
    setActiveView(options?.startView ?? "home");
    setGate("dashboard");
    setRuntimeRefreshKey((k) => k + 1);

    if (cloudEnabled) {
      void syncProfileToCloud(readUserProfile());
    }
  };

  const handleProfileSaved = () => {
    setRuntimeRefreshKey((k) => k + 1);

    if (cloudEnabled) {
      void syncProfileToCloud(readUserProfile());
    }
  };

  const handleLogout = () => {
    if (cloudEnabled) {
      void signOutCloudAuth();
      setExistingAccount(null);
      setCloudEntryAccepted(false);
      setGate("auth");
      return;
    }

    clearAuthSession();
    setGate("auth");
  };

  const handleReset = () => {
    if (!confirm("Tüm veriler silinecek ve giriş ekranına dönülecek. Emin misin?")) return;
    if (cloudEnabled) {
      void signOutCloudAuth();
    }
    setCloudEntryAccepted(false);
    localStorage.clear();
    window.location.reload();
  };

  const handleAddSession = useCallback(
    (input: {
      subjectId: SubjectId;
      minutes: number;
      notes?: string;
      topic?: string;
      reflection?: import("@/lib/types").StudySessionReflection;
      recommendationId?: string;
    }) => {
      const nextSession = addSession(input);
      if (input.recommendationId) {
        markRecommendationConverted(input.recommendationId, nextSession.id);
      }
      setStudyLaunchDraft(null);
    },
    [addSession],
  );

  const handleDeleteCalendarItem = useCallback(
    (item: ScheduleItem & { countdownMs: number }) => {
      if (item.source === "manual") {
        deleteScheduleItem(item.id);
        setPendingUndoDelete({
          kind: "manual",
          item: {
            id: item.id,
            title: item.title,
            shortLabel: item.shortLabel,
            scheduledAt: item.scheduledAt,
            kind: item.kind,
            source: item.source,
            notes: item.notes,
            calibration: item.calibration,
          },
          title: item.title,
          token: `${item.id}:${Date.now()}`,
        });
        return;
      }

      if (item.kind !== "exam") {
        return;
      }

      const exam = planningRuntime.exams.find((entry) => entry.id === item.id);
      const subjectSeed = exam
        ? planningRuntime.subjectSeeds.find((entry) => entry.id === exam.subjectId)
        : undefined;

      if (!exam) {
        return;
      }

      if (removePlanningExam(item.id)) {
        setPendingUndoDelete({
          kind: "planning",
          exam,
          subjectSeed,
          title: item.title,
          token: `${item.id}:${Date.now()}`,
        });
        setRuntimeRefreshKey((key) => key + 1);
      }
    },
    [deleteScheduleItem, planningRuntime.exams, planningRuntime.subjectSeeds],
  );

  const handleUndoCalendarDelete = useCallback(() => {
    if (!pendingUndoDelete) {
      return;
    }

    if (pendingUndoDelete.kind === "manual") {
      restoreScheduleItem(pendingUndoDelete.item);
      setPendingUndoDelete(null);
      return;
    }

    restorePlanningExam(pendingUndoDelete.exam, pendingUndoDelete.subjectSeed);
    setPendingUndoDelete(null);
    setRuntimeRefreshKey((key) => key + 1);
  }, [pendingUndoDelete, restoreScheduleItem]);

  // Keyboard shortcuts: Cmd/Ctrl + 1–5 for navigation
  useEffect(() => {
    if (gate !== "dashboard") return;

    const viewOrder: WorkspaceView[] = ["home", "inbox", "priorities", "sessions", "schedule", "library", "profile"];

    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;

      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= viewOrder.length) {
        e.preventDefault();
        setActiveView(viewOrder[num - 1]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gate]);

  const calendarItems = useMemo(
    () => {
      const manualScheduleItemIds = new Set(
        manualScheduleItems.map((item) => item.id),
      );
      const plannedManualScheduleItemIds = new Set<string>();
      const timelineItems = timeline.flatMap<ScheduleItem>((exam) => {
          const manualScheduleItemId = getScheduleItemIdFromPlanningExamId(exam.id);

          if (manualScheduleItemId) {
            if (!manualScheduleItemIds.has(manualScheduleItemId)) {
              return [];
            }
            plannedManualScheduleItemIds.add(manualScheduleItemId);
          }

          return [{
            id: manualScheduleItemId ?? exam.id,
            title: exam.title,
            shortLabel: exam.shortLabel,
            scheduledAt: exam.scheduledAt,
            kind: "exam",
            source: manualScheduleItemId ? "manual" : "seed",
          }];
        });
      const pendingManualItems = manualScheduleItems.filter(
        (item) =>
          item.kind !== "exam" || !plannedManualScheduleItemIds.has(item.id),
      );

      return [...timelineItems, ...pendingManualItems]
        .map((item) => ({
          ...item,
          countdownMs: Math.max(new Date(item.scheduledAt).getTime() - now.getTime(), 0),
        }))
        .sort(
          (left, right) =>
            new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime(),
        );
    },
    [manualScheduleItems, now, timeline],
  );

  if (gate === "loading" || (gate === "dashboard" && (!isReady || !isScheduleReady || !isPlanningReady || !isExamOutcomesReady))) {
    return <LoadingShell />;
  }

  if (gate === "auth") {
    return (
      <AuthScreen
        existingAccount={existingAccount}
        onAuthenticated={handleAuthenticated}
        initialNotice={authNotice}
      />
    );
  }

  if (gate === "onboarding") {
    return (
      <OnboardingScreen
        onStart={handleCompleteOnboarding}
        initialName={existingAccount?.displayName}
      />
    );
  }

  return (
    <main className="min-h-screen px-3 py-4 sm:px-5 lg:h-screen lg:overflow-hidden lg:px-6">
      <div className="mx-auto grid max-w-[1420px] gap-5 lg:h-[calc(100vh-2rem)] lg:grid-cols-[248px_minmax(0,1fr)] xl:grid-cols-[264px_minmax(0,1fr)]">
        <DashboardSidebar
          activeView={activeView}
          onSelectView={setActiveView}
          nextExamLabel={nextExam?.title ?? "Tüm sınavlar tamamlandı"}
          focusLabel={topRisk?.title ?? "Belirleniyor"}
          dailyMinutes={dailyMinutes}
          studyStreak={studyStreak}
          profile={planningRuntime.profile}
          now={now}
          onLogout={handleLogout}
          onReset={handleReset}
        />

        <div className="space-y-6 lg:min-h-0 lg:overflow-y-auto lg:pr-1">
          {/* Inbox trigger — fixed to top-right of content column */}
          <div className="sticky top-0 z-30 flex items-center justify-end">
            <InboxTrigger
              count={academicEvents.length}
              isActive={activeView === "inbox"}
              onClick={() => setActiveView(activeView === "inbox" ? "home" : "inbox")}
            />
          </div>

          <Card className="p-3 lg:hidden">
            <WorkspaceNav
              activeView={activeView}
              onSelectView={setActiveView}
              compact
            />
            <div className="mt-2 flex gap-2 border-t border-white/8 pt-2">
              <button
                type="button"
                onClick={handleLogout}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2 text-xs text-slate-500 transition hover:text-sky-300"
              >
                Çıkış Yap
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2 text-xs text-slate-600 transition hover:text-rose-400"
              >
                Sıfırla
              </button>
            </div>
          </Card>

          {activeView === "home" ? (
            <HomeScreen
              now={now}
              upcomingExams={upcomingTimeline}
              topRisk={topRisk}
              homeFocus={homeFocus}
              academicSignal={homeAcademicSignal}
              calendarItems={calendarItems}
              onAddSession={handleAddSession}
              subjects={planningRuntime.subjectSeeds}
              sessions={sessions}
              sessionsToday={sessionsToday}
              dailyMinutes={dailyMinutes}
              dailyGoalMinutes={studyGoalMinutes}
              planningExams={planningRuntime.exams}
              planningConstraints={planningRuntime.constraints}
              launchDraft={studyLaunchDraft}
              onQueueStudyLaunch={setStudyLaunchDraft}
              onNavigate={setActiveView}
            />
          ) : null}

          {activeView === "inbox" ? (
            <AcademicInboxScreen
              now={now}
              events={inboxEvents}
              subjects={planningRuntime.subjectSeeds}
              resources={resources}
              onNavigate={setActiveView}
              onDismissEvent={dismissAcademicEvent}
              onResolveEvent={resolveAcademicEvent}
            />
          ) : null}

          {activeView === "priorities" ? (
            <PrioritiesScreen
              subjects={prioritySubjects}
              academicSignal={prioritiesAcademicSignal}
              examResourceBindings={examResourceBindings}
              onNavigate={setActiveView}
            />
          ) : null}

          {activeView === "sessions" ? (
            <SessionsScreen
              subjects={planningRuntime.subjectSeeds}
              onAddSession={handleAddSession}
              onDeleteSession={deleteSession}
              sessions={sessions}
              sessionsToday={sessionsToday}
              dailyMinutes={dailyMinutes}
              dailyGoalMinutes={studyGoalMinutes}
              topRisk={topRisk}
              nextExamTitle={nextExam?.title ?? null}
              studyStreak={studyStreak}
              launchDraft={studyLaunchDraft}
            />
          ) : null}

          {activeView === "schedule" ? (
            <ScheduleScreen
              onAddScheduleItem={addScheduleItem}
              onAddScheduleItems={addScheduleItems}
              onDeleteScheduleItem={handleDeleteCalendarItem}
              manualItemsCount={manualItemsCount}
              calendarItems={calendarItems}
              timeline={timeline}
              rankedSubjects={riskSnapshot.rankedSubjects}
              now={now}
              examOutcomes={examOutcomes}
              onSaveExamOutcome={handleSaveExamOutcome}
              pendingUndoTitle={pendingUndoDelete?.title ?? null}
              pendingUndoToken={pendingUndoDelete?.token ?? null}
              onUndoDelete={handleUndoCalendarDelete}
            />
          ) : null}

          {activeView === "profile" ? (
            <ProfileScreen
              profile={planningRuntime.profile}
              onProfileSaved={handleProfileSaved}
            />
          ) : null}

          {activeView === "library" ? (
            <ResourcesScreen
              subjects={planningRuntime.subjectSeeds}
              exams={planningRuntime.exams}
              riskSnapshot={riskSnapshot.rankedSubjects}
              sessions={sessions}
              now={now}
              onNavigate={setActiveView}
              onQueueStudyLaunch={setStudyLaunchDraft}
            />
          ) : null}
        </div>
      </div>
    </main>
  );
}

// ─── Notification Chime ──────────────────────────────────────────────────────
//
// Synthesised entirely via Web Audio API — no external audio files.
// Apple-style two-tone ascending chime: C6 (1047 Hz) → E6 (1319 Hz).
// Soft sine waves, fast attack, smooth exponential decay. Very low gain (0.13)
// so it never startles. Gracefully no-ops if AudioContext is unavailable.

function playNotificationChime() {
  try {
    const ctx = new AudioContext();

    const notes: Array<{ freq: number; delay: number }> = [
      { freq: 1047, delay: 0 },    // C6 — first strike
      { freq: 1319, delay: 0.11 }, // E6 — ascending resolution
    ];

    notes.forEach(({ freq, delay }) => {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();

      osc.type = "sine";
      osc.frequency.value = freq;
      osc.connect(env);
      env.connect(ctx.destination);

      const t0 = ctx.currentTime + delay;
      env.gain.setValueAtTime(0, t0);
      env.gain.linearRampToValueAtTime(0.13, t0 + 0.012); // ~12 ms attack
      env.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.42); // ~420 ms decay

      osc.start(t0);
      osc.stop(t0 + 0.42);
    });

    // Release the context once both tones are finished
    setTimeout(() => void ctx.close(), 700);
  } catch {
    // AudioContext unavailable (SSR, sandboxed env, etc.) — silently skip
  }
}

// ─── Inbox Trigger ───────────────────────────────────────────────────────────

function InboxTrigger({
  count,
  isActive,
  onClick,
}: {
  count: number;
  isActive: boolean;
  onClick: () => void;
}) {
  const hasEvents = count > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isActive ? "Gelen kutusunu kapat" : "Akademik gelen kutusu"}
      className={[
        "group relative flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-200",
        isActive
          ? "border-sky-300/40 bg-sky-300/12 text-sky-100 shadow-[0_0_16px_rgba(125,211,252,0.15)]"
          : hasEvents
            ? "border-amber-400/25 bg-amber-400/[0.07] text-amber-200 hover:border-amber-400/40 hover:bg-amber-400/[0.12]"
            : "border-white/10 bg-white/[0.04] text-slate-400 hover:border-white/20 hover:bg-white/[0.07] hover:text-slate-200",
      ].join(" ")}
    >
      <Inbox className="h-4 w-4" />

      {/* Notification badge */}
      <AnimatePresence>
        {hasEvents && !isActive ? (
          <motion.span
            key="badge"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 28 }}
            className="absolute -right-1 -top-1 flex min-w-[16px] items-center justify-center rounded-full border border-black/30 bg-amber-400 px-[3px] py-px text-[9px] font-bold leading-none text-black shadow-[0_0_8px_rgba(251,191,36,0.5)]"
          >
            {count > 9 ? "9+" : count}
          </motion.span>
        ) : null}
      </AnimatePresence>

      {/* Ambient pulse ring when events exist and not active */}
      {hasEvents && !isActive ? (
        <span className="pointer-events-none absolute inset-0 animate-ping rounded-full border border-amber-400/30 duration-1000" />
      ) : null}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function LoadingShell() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="flex flex-col items-center gap-5">
        <div className="relative inline-flex items-center gap-2.5 rounded-full border border-white/[0.10] bg-white/[0.04] px-4 py-2">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-400" />
          <span className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">
            EXAM ASSIST
          </span>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-2 w-2 animate-pulse rounded-full bg-sky-400/40"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
