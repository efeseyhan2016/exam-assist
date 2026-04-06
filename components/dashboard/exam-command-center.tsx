"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { AuthScreen } from "@/components/auth/auth-screen";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { HomeScreen } from "@/components/dashboard/home-screen";
import { ProfileScreen } from "@/components/dashboard/profile-screen";
import { OnboardingScreen } from "@/components/onboarding/onboarding-screen";
import { PrioritiesScreen } from "@/components/dashboard/priorities-screen";
import { ResourcesScreen } from "@/components/dashboard/resources-screen";
import { ScheduleScreen } from "@/components/dashboard/schedule-screen";
import { SessionsScreen } from "@/components/dashboard/sessions-screen";
import { WorkspaceNav, WorkspaceView } from "@/components/dashboard/workspace-nav";
import { useScheduleItems } from "@/hooks/useScheduleItems";
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
import { buildHomeFocusRecommendation } from "@/lib/home-focus";
import {
  hasMeaningfulLocalStateSnapshot,
  readLocalStateSnapshot,
  readOnboardingState,
  replaceLocalStateSnapshot,
  readUserProfile,
  writeOnboardingState,
  writeUserProfile,
} from "@/lib/storage";
import { isSupabaseEnabled } from "@/lib/supabase/config";
import { ScheduleItem } from "@/lib/types";

type AppGate = "loading" | "auth" | "onboarding" | "dashboard";

export function ExamCommandCenter() {
  const cloudEnabled = isSupabaseEnabled();
  const [gate, setGate] = useState<AppGate>("loading");
  const [existingAccount, setExistingAccount] = useState<(AuthAccount & { email?: string }) | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [cloudEntryAccepted, setCloudEntryAccepted] = useState(false);
  const [activeView, setActiveView] = useState<WorkspaceView>("home");
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
    isReady: isScheduleReady,
    manualItemsCount,
  } = useScheduleItems();
  const { now, nextExam, timeline } = useExamCountdown(planningRuntime.exams);
  const riskSnapshot = useRiskEngine(sessions, {
    exams: planningRuntime.exams,
    subjectSeeds: planningRuntime.subjectSeeds,
    constraints: planningRuntime.constraints,
  });

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
      ),
    [now, riskSnapshot.rankedSubjects, sessions, sessionsToday],
  );
  const studyGoalMinutes = planningRuntime.constraints.dailyStudyGoalHours * 60;

  const handleAuthenticated = () => {
    setCloudEntryAccepted(true);
    void hydrateGateState();
  };

  const handleCompleteOnboarding = () => {
    writeOnboardingState({ completedAt: new Date().toISOString() });
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

  // Keyboard shortcuts: Cmd/Ctrl + 1–5 for navigation
  useEffect(() => {
    if (gate !== "dashboard") return;

    const viewOrder: WorkspaceView[] = ["home", "priorities", "sessions", "schedule", "library", "profile"];

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
    () =>
      [
        ...timeline.map<ScheduleItem>((exam) => ({
          id: exam.id,
          title: exam.title,
          shortLabel: exam.shortLabel,
          scheduledAt: exam.scheduledAt,
          kind: "exam",
          source: "seed",
        })),
        ...manualScheduleItems,
      ]
        .map((item) => ({
          ...item,
          countdownMs: Math.max(new Date(item.scheduledAt).getTime() - now.getTime(), 0),
        }))
        .sort(
          (left, right) =>
            new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime(),
        ),
    [manualScheduleItems, now, timeline],
  );

  if (gate === "loading" || (gate === "dashboard" && (!isReady || !isScheduleReady || !isPlanningReady))) {
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
              upcomingExams={timeline}
              topRisk={topRisk}
              homeFocus={homeFocus}
              calendarItems={calendarItems}
              onAddScheduleItem={addScheduleItem}
              onAddScheduleItems={addScheduleItems}
              manualItemsCount={manualItemsCount}
              onAddSession={addSession}
              subjects={planningRuntime.subjectSeeds}
              sessions={sessions}
              sessionsToday={sessionsToday}
              dailyMinutes={dailyMinutes}
              dailyGoalMinutes={studyGoalMinutes}
              planningExams={planningRuntime.exams}
              planningConstraints={planningRuntime.constraints}
              onNavigate={setActiveView}
            />
          ) : null}

          {activeView === "priorities" ? (
            <PrioritiesScreen subjects={riskSnapshot.rankedSubjects} />
          ) : null}

          {activeView === "sessions" ? (
            <SessionsScreen
              subjects={planningRuntime.subjectSeeds}
              onAddSession={addSession}
              onDeleteSession={deleteSession}
              sessions={sessions}
              sessionsToday={sessionsToday}
              dailyMinutes={dailyMinutes}
              dailyGoalMinutes={studyGoalMinutes}
              topRisk={topRisk}
              nextExamTitle={nextExam?.title ?? null}
              studyStreak={studyStreak}
            />
          ) : null}

          {activeView === "schedule" ? (
            <ScheduleScreen
              onAddScheduleItem={addScheduleItem}
              onAddScheduleItems={addScheduleItems}
              onDeleteScheduleItem={deleteScheduleItem}
              manualItemsCount={manualItemsCount}
              calendarItems={calendarItems}
              timeline={timeline}
              rankedSubjects={riskSnapshot.rankedSubjects}
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
              riskSnapshot={riskSnapshot.rankedSubjects}
              sessions={sessions}
            />
          ) : null}
        </div>
      </div>
    </main>
  );
}

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
