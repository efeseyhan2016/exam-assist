import {
  CalendarClock,
  Clock3,
  MapPin,
  Sparkles,
} from "lucide-react";

import { ApproachingExamsDock } from "@/components/dashboard/approaching-exams-dock";
import { HomeCalendarBoard } from "@/components/dashboard/home-calendar-board";
import { ScheduleIntakeCard } from "@/components/dashboard/schedule-intake-card";
import { SectionHeading } from "@/components/dashboard/section-heading";
import { StudySessionForm } from "@/components/dashboard/study-session-form";
import { Card } from "@/components/ui/card";
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
  profile: {
    fullName: string;
    city: string;
    timezone: string;
  };
  sessionsToday: StudySession[];
  dailyMinutes: number;
  dailyGoalMinutes: number;
  onNavigate: (view: WorkspaceView) => void;
}

export function HomeScreen({
  now,
  exam,
  upcomingExams,
  topRisk,
  calendarItems,
  onAddScheduleItem,
  onAddScheduleItems,
  manualItemsCount,
  onAddSession,
  profile,
  sessionsToday,
  dailyMinutes,
  dailyGoalMinutes,
  onNavigate,
}: HomeScreenProps) {
  const currentTime = new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: profile.timezone,
  }).format(now);
  const currentDate = new Intl.DateTimeFormat("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: profile.timezone,
  }).format(now);
  const greeting =
    now.getHours() < 12 ? "Günaydın" : now.getHours() < 18 ? "İyi günler" : "İyi akşamlar";

  return (
    <section className="space-y-5">
      <SectionHeading
        eyebrow="Ana Ekran"
        title="Sınav haftana genel bakış"
        description="Yaklaşan sınavlarını, bu haftanın planını ve bugünkü önceliklerini burada görürsün."
      />

      <ApproachingExamsDock exams={upcomingExams} />

      <Card className="overflow-hidden border-sky-300/12 bg-[linear-gradient(135deg,rgba(8,12,24,0.96),rgba(10,19,34,0.94),rgba(6,15,28,0.96))] p-5 sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-300">
              <Sparkles className="h-3.5 w-3.5 text-sky-200" />
              Ana Ekran
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl font-semibold leading-tight text-white sm:text-[2.5rem]">
                {greeting}, {profile.fullName}.
              </h2>
              <p className="max-w-3xl text-base leading-7 text-slate-300">
                Yaklaşan sınavların ve bu haftanın planı aşağıda. Öncelikli ders ve çalışma seansın için yan paneli kullanabilirsin.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:w-[300px] xl:shrink-0">
            <IntroStat
              icon={MapPin}
              label="Konum"
              value={profile.city}
              caption="çalışma ortamın"
            />
            <IntroStat
              icon={Clock3}
              label="Şu an"
              value={currentTime}
              caption={currentDate}
            />
            <IntroStat
              icon={CalendarClock}
              label="Sıradaki sınav"
              value={exam?.title ?? "Tüm sınavlar tamamlandı"}
              caption="takvimde görünür"
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

      <div className="grid gap-4 xl:grid-cols-2">
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
