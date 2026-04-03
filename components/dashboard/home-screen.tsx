import {
  ArrowRight,
  CalendarClock,
  CalendarRange,
  Clock3,
  ListChecks,
  MapPin,
  NotebookPen,
  Sparkles,
} from "lucide-react";

import { CalendarTimelineCard } from "@/components/dashboard/calendar-timeline-card";
import { NextExamHero } from "@/components/dashboard/next-exam-hero";
import { PlanningFocusCard } from "@/components/dashboard/planning-focus-card";
import { ScheduleIntakeCard } from "@/components/dashboard/schedule-intake-card";
import { SectionHeading } from "@/components/dashboard/section-heading";
import { StudyGoalCard } from "@/components/dashboard/study-goal-card";
import { StudySessionForm } from "@/components/dashboard/study-session-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatMinutesAsHours } from "@/lib/time";
import { workspaceProfile } from "@/lib/seed-data";
import { RankedSubjectRisk, ScheduleItem, ScheduleItemKind, StudySession, SubjectId } from "@/lib/types";
import { WorkspaceView } from "@/components/dashboard/workspace-nav";

interface CountdownExam {
  title: string;
  scheduledAt: string;
  countdown: {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  };
}

interface HomeScreenProps {
  now: Date;
  exam: CountdownExam | null;
  topRisk: RankedSubjectRisk | null;
  calendarItems: Array<
    ScheduleItem & {
      countdownMs: number;
    }
  >;
  onAddScheduleItem: (input: {
    title: string;
    scheduledAt: string;
    kind: ScheduleItemKind;
    notes?: string;
  }) => void;
  onAddScheduleItems: (inputs: Array<{
    title: string;
    scheduledAt: string;
    kind: ScheduleItemKind;
    notes?: string;
  }>) => void;
  manualItemsCount: number;
  onAddSession: (input: {
    subjectId: SubjectId;
    minutes: number;
    notes?: string;
  }) => void;
  sessionsToday: StudySession[];
  dailyMinutes: number;
  dailyGoalMinutes: number;
  onNavigate: (view: WorkspaceView) => void;
}

export function HomeScreen({
  now,
  exam,
  topRisk,
  calendarItems,
  onAddScheduleItem,
  onAddScheduleItems,
  manualItemsCount,
  onAddSession,
  sessionsToday,
  dailyMinutes,
  dailyGoalMinutes,
  onNavigate,
}: HomeScreenProps) {
  const fullName = `${workspaceProfile.firstName} ${workspaceProfile.lastName}`;
  const currentTime = new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: workspaceProfile.timezone,
  }).format(now);
  const currentDate = new Intl.DateTimeFormat("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: workspaceProfile.timezone,
  }).format(now);
  const greeting =
    now.getHours() < 12 ? "Gunaydin" : now.getHours() < 18 ? "Iyi gunler" : "Iyi aksamlar";

  return (
    <section className="space-y-6">
      <SectionHeading
        eyebrow="Home"
        title="Your week, at a glance"
        description="Home should feel welcoming first, then immediately useful: calendar input, next exam, current focus, and study execution all stay within easy reach."
      />

      <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
        <Card className="overflow-hidden border-sky-300/12 bg-[linear-gradient(135deg,rgba(8,12,24,0.96),rgba(10,19,34,0.94),rgba(6,15,28,0.96))] p-6 sm:p-7">
          <div className="flex h-full flex-col justify-between gap-6">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-300">
                <Sparkles className="h-3.5 w-3.5 text-sky-200" />
                Home
              </div>

              <div className="space-y-3">
                <h2 className="text-3xl font-semibold leading-tight text-white sm:text-[2.7rem]">
                  {greeting}, {fullName}.
                </h2>
                <p className="max-w-2xl text-base leading-7 text-slate-300">
                  Ankara study workspace. Start by loading the real schedule, keep
                  the next exam visible, and let the planner point to the subject
                  that deserves the next block.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <IntroStat
                icon={MapPin}
                label="Location"
                value={workspaceProfile.city}
                caption="local exam-week context"
              />
              <IntroStat
                icon={Clock3}
                label="Current time"
                value={currentTime}
                caption={currentDate}
              />
              <IntroStat
                icon={CalendarClock}
                label="Next exam"
                value={exam?.title ?? "All complete"}
                caption="stays visible at the top"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <QuickStatus
                label="Today's progress"
                value={formatMinutesAsHours(dailyMinutes)}
              />
              <QuickStatus
                label="Planning focus"
                value={topRisk?.shortLabel ?? "No focus"}
              />
              <QuickStatus
                label="Goal target"
                value={formatMinutesAsHours(dailyGoalMinutes)}
              />
            </div>
          </div>
        </Card>

        <ScheduleIntakeCard
          onAddItem={onAddScheduleItem}
          onAddItems={onAddScheduleItems}
          manualItemsCount={manualItemsCount}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <NextExamHero exam={exam} embedded className="h-full" />
        <PlanningFocusCard
          topRisk={topRisk}
          nextExamTitle={exam?.title ?? null}
          embedded
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.12fr_0.88fr]">
        <CalendarTimelineCard items={calendarItems} />
        <Card className="p-5">
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
            What Home gives you
          </p>
          <h3 className="mt-2 text-xl font-semibold text-white">
            Home should be enough to get started
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Load the calendar, scan the timeline, check the current focus, and log
            the next study block here. Open the other screens only when you want
            the fuller detail view.
          </p>

          <div className="mt-5 grid gap-3">
            <HomeActionButton
              icon={ListChecks}
              title="Open priorities"
              description="See the ranked pressure board."
              onClick={() => onNavigate("priorities")}
            />
            <HomeActionButton
              icon={NotebookPen}
              title="Open sessions"
              description="Stay in the logging workspace longer."
              onClick={() => onNavigate("sessions")}
            />
            <HomeActionButton
              icon={CalendarRange}
              title="Open schedule"
              description="Manage the calendar in a dedicated view."
              onClick={() => onNavigate("schedule")}
            />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.02fr_0.98fr]">
        <StudySessionForm
          onAddSession={onAddSession}
          sessionsToday={sessionsToday}
          embedded
        />

        <div className="grid gap-4">
          <StudyGoalCard
            dailyMinutes={dailyMinutes}
            dailyGoalMinutes={dailyGoalMinutes}
            embedded
          />
          <HomeSummaryCard
            title="Main wedge"
            description="This is the fast control loop: add real dates, understand what is coming, decide what matters most, then record finished study so the ranking can respond."
          />
        </div>
      </div>
    </section>
  );
}

function IntroStat({
  icon: Icon,
  label,
  value,
  caption,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
  caption: string;
}) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/[0.05] p-4">
      <Icon className="h-4 w-4 text-sky-200" />
      <p className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
      <p className="mt-1 text-sm text-slate-300">{caption}</p>
    </div>
  );
}

function QuickStatus({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-black/20 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-2 text-base font-semibold text-white">{value}</p>
    </div>
  );
}

function HomeSummaryCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card className="p-5">
      <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">{title}</p>
      <p className="mt-3 text-base leading-7 text-slate-300">{description}</p>
    </Card>
  );
}

function HomeActionButton({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: typeof ListChecks;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="secondary"
      className="h-auto w-full items-start justify-between rounded-[22px] px-4 py-4 text-left"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/20">
          <Icon className="h-4 w-4 text-slate-200" />
        </span>
        <div>
          <p className="text-sm font-medium text-white">{title}</p>
          <p className="mt-1 text-sm leading-6 text-slate-300">{description}</p>
        </div>
      </div>
      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
    </Button>
  );
}
