import {
  CalendarClock,
  Clock3,
  MapPin,
  Sparkles,
} from "lucide-react";

import { HomeCalendarBoard } from "@/components/dashboard/home-calendar-board";
import { ScheduleIntakeCard } from "@/components/dashboard/schedule-intake-card";
import { SectionHeading } from "@/components/dashboard/section-heading";
import { StudySessionForm } from "@/components/dashboard/study-session-form";
import { Card } from "@/components/ui/card";
import { workspaceProfile } from "@/lib/seed-data";
import {
  RankedSubjectRisk,
  ScheduleItem,
  ScheduleItemKind,
  StudySession,
  SubjectId,
} from "@/lib/types";
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
    <section className="space-y-5">
      <SectionHeading
        eyebrow="Home"
        title="Calendar-first command center"
        description="Home should read like a real calendar wall: upcoming dates in the center, today’s meaning on the side, and quick action modules within reach."
      />

      <Card className="overflow-hidden border-sky-300/12 bg-[linear-gradient(135deg,rgba(8,12,24,0.96),rgba(10,19,34,0.94),rgba(6,15,28,0.96))] p-5 sm:p-6">
        <div className="grid gap-4 xl:grid-cols-[1.14fr_0.86fr] xl:items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-300">
              <Sparkles className="h-3.5 w-3.5 text-sky-200" />
              Home
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl font-semibold leading-tight text-white sm:text-[2.5rem]">
                {greeting}, {fullName}.
              </h2>
              <p className="max-w-3xl text-base leading-7 text-slate-300">
                The calendar is now the main wedge. Load the real dates, read the week through the month view, and use the side modules only to support what the calendar is already telling you.
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
              caption="held inside the main month view"
            />
          </div>
        </div>
      </Card>

      <HomeCalendarBoard
        now={now}
        items={calendarItems}
        topRisk={topRisk}
        dailyMinutes={dailyMinutes}
        dailyGoalMinutes={dailyGoalMinutes}
        onNavigate={onNavigate}
      />

      <div className="grid gap-4 xl:grid-cols-[0.94fr_1.06fr]">
        <ScheduleIntakeCard
          onAddItem={onAddScheduleItem}
          onAddItems={onAddScheduleItems}
          manualItemsCount={manualItemsCount}
          compact
        />

        <StudySessionForm
          onAddSession={onAddSession}
          sessionsToday={sessionsToday}
          embedded
          compact
        />
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
