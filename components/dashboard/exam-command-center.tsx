"use client";

import { useEffect, useMemo, useState } from "react";

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
import { readOnboardingState, writeOnboardingState } from "@/lib/storage";
import { ScheduleItem } from "@/lib/types";

type AppGate = "loading" | "auth" | "onboarding" | "dashboard";

export function ExamCommandCenter() {
  const [gate, setGate] = useState<AppGate>("loading");
  const [existingAccount, setExistingAccount] = useState<AuthAccount | null>(null);
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

  useEffect(() => {
    const account = readAuthAccount();
    const session = readAuthSession();
    setExistingAccount(account);

    if (!isSessionValid(account, session)) {
      setGate("auth");
      return;
    }

    // Authenticated — check onboarding
    setGate(readOnboardingState() ? "dashboard" : "onboarding");
  }, []);

  const dailyMinutes = useMemo(
    () => sessionsToday.reduce((total, session) => total + session.minutes, 0),
    [sessionsToday],
  );

  const topRisk = riskSnapshot.rankedSubjects[0] ?? null;
  const studyGoalMinutes = planningRuntime.constraints.dailyStudyGoalHours * 60;

  const handleAuthenticated = () => {
    const account = readAuthAccount();
    setExistingAccount(account);
    setGate(readOnboardingState() ? "dashboard" : "onboarding");
  };

  const handleCompleteOnboarding = () => {
    writeOnboardingState({ completedAt: new Date().toISOString() });
    setGate("dashboard");
    setRuntimeRefreshKey((k) => k + 1);
  };

  const handleProfileSaved = () => {
    setRuntimeRefreshKey((k) => k + 1);
  };

  const handleLogout = () => {
    clearAuthSession();
    setGate("auth");
  };

  const handleReset = () => {
    if (!confirm("Tüm veriler silinecek ve giriş ekranına dönülecek. Emin misin?")) return;
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
              calendarItems={calendarItems}
              onAddScheduleItem={addScheduleItem}
              onAddScheduleItems={addScheduleItems}
              manualItemsCount={manualItemsCount}
              onAddSession={addSession}
              subjects={planningRuntime.subjectSeeds}
              sessionsToday={sessionsToday}
              dailyMinutes={dailyMinutes}
              dailyGoalMinutes={studyGoalMinutes}
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
