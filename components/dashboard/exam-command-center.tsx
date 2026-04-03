"use client";

import { useEffect, useMemo, useState } from "react";

import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { HomeScreen } from "@/components/dashboard/home-screen";
import { OnboardingScreen } from "@/components/onboarding/onboarding-screen";
import { PrioritiesScreen } from "@/components/dashboard/priorities-screen";
import { ScheduleScreen } from "@/components/dashboard/schedule-screen";
import { SessionsScreen } from "@/components/dashboard/sessions-screen";
import { WorkspaceNav, WorkspaceView } from "@/components/dashboard/workspace-nav";
import { useScheduleItems } from "@/hooks/useScheduleItems";
import { Card } from "@/components/ui/card";
import { useExamCountdown } from "@/hooks/useExamCountdown";
import { usePlanningRuntime } from "@/hooks/usePlanningRuntime";
import { useRiskEngine } from "@/hooks/useRiskEngine";
import { useStudySessions } from "@/hooks/useStudySessions";
import { readOnboardingState, writeOnboardingState } from "@/lib/storage";
import { ScheduleItem } from "@/lib/types";

export function ExamCommandCenter() {
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const [activeView, setActiveView] = useState<WorkspaceView>("home");
  const { runtime: planningRuntime, isReady: isPlanningReady } = usePlanningRuntime();
  const { sessions, sessionsToday, addSession, isReady } = useStudySessions();
  const {
    items: manualScheduleItems,
    addItem: addScheduleItem,
    addItems: addScheduleItems,
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
    setOnboardingComplete(Boolean(readOnboardingState()));
  }, []);

  const dailyMinutes = useMemo(
    () => sessionsToday.reduce((total, session) => total + session.minutes, 0),
    [sessionsToday],
  );

  const topRisk = riskSnapshot.rankedSubjects[0] ?? null;
  const studyGoalMinutes = planningRuntime.constraints.dailyStudyGoalHours * 60;

  const handleCompleteOnboarding = () => {
    writeOnboardingState({ completedAt: new Date().toISOString() });
    setOnboardingComplete(true);
  };

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

  if (onboardingComplete === null || !isReady || !isScheduleReady || !isPlanningReady) {
    return <LoadingShell />;
  }

  if (!onboardingComplete) {
    return <OnboardingScreen onStart={handleCompleteOnboarding} />;
  }

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1540px] gap-6 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]">
        <DashboardSidebar
          activeView={activeView}
          onSelectView={setActiveView}
          nextExamLabel={nextExam?.title ?? "Tüm sınavlar tamamlandı"}
          focusLabel={topRisk?.title ?? "Belirleniyor"}
          dailyMinutes={dailyMinutes}
        />

        <div className="space-y-8">
          <Card className="p-3 lg:hidden">
            <WorkspaceNav
              activeView={activeView}
              onSelectView={setActiveView}
              compact
            />
          </Card>

          {activeView === "home" ? (
            <HomeScreen
              now={now}
              exam={nextExam}
              upcomingExams={timeline}
              topRisk={topRisk}
              calendarItems={calendarItems}
              profile={planningRuntime.profile}
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
              onAddSession={addSession}
              sessionsToday={sessionsToday}
              dailyMinutes={dailyMinutes}
              dailyGoalMinutes={studyGoalMinutes}
              topRisk={topRisk}
              nextExamTitle={nextExam?.title ?? null}
            />
          ) : null}

          {activeView === "schedule" ? (
            <ScheduleScreen
              onAddScheduleItem={addScheduleItem}
              onAddScheduleItems={addScheduleItems}
              manualItemsCount={manualItemsCount}
              calendarItems={calendarItems}
              timeline={timeline}
              rankedSubjects={riskSnapshot.rankedSubjects}
            />
          ) : null}
        </div>
      </div>
    </main>
  );
}

function LoadingShell() {
  return (
    <div className="min-h-screen px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <Card className="p-8">
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
            EXAM ASSIST
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-white">
            Yükleniyor...
          </h1>
        </Card>
      </div>
    </div>
  );
}
