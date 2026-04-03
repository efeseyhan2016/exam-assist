"use client";

import { useState } from "react";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  ListChecks,
  MapPin,
  Sparkles,
  Target,
  Timer,
} from "lucide-react";

import { ApproachingExamsDock } from "@/components/dashboard/approaching-exams-dock";
import { HomeCalendarBoard } from "@/components/dashboard/home-calendar-board";
import { ScheduleIntakeCard } from "@/components/dashboard/schedule-intake-card";
import { SectionHeading } from "@/components/dashboard/section-heading";
import { StudySessionForm } from "@/components/dashboard/study-session-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getGuidanceCopy } from "@/lib/risk-presentation";
import { formatApproxHours, formatPlannedHours, formatRelativeDuration } from "@/lib/time";
import {
  RankedSubjectRisk,
  ScheduleItem,
  ScheduleItemKind,
  StudySession,
  SubjectId,
  SubjectSeed,
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
  subjects: SubjectSeed[];
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
  subjects,
  profile,
  sessionsToday,
  dailyMinutes,
  dailyGoalMinutes,
  onNavigate,
}: HomeScreenProps) {
  const [lastSessionAdded, setLastSessionAdded] = useState(false);
  const [lastItemAdded, setLastItemAdded] = useState(false);

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

  const handleAddSession = (input: { subjectId: SubjectId; minutes: number; notes?: string }) => {
    onAddSession(input);
    setLastSessionAdded(true);
    setTimeout(() => {
      setLastSessionAdded(false);
      onNavigate("priorities");
    }, 1500);
  };

  const handleAddScheduleItem = (input: {
    title: string;
    scheduledAt: string;
    kind: ScheduleItemKind;
    notes?: string;
  }) => {
    onAddScheduleItem(input);
    setLastItemAdded(true);
    setTimeout(() => {
      setLastItemAdded(false);
      onNavigate("schedule");
    }, 1500);
  };

  return (
    <section className="space-y-5">
      <SectionHeading
        eyebrow="Ana Ekran"
        title="Sınav haftana genel bakış"
        description="Yaklaşan sınavlarını, bu haftanın planını ve bugünkü önceliklerini burada görürsün."
      />

      <ApproachingExamsDock exams={upcomingExams} />

      <FocusDirectiveCard topRisk={topRisk} onNavigate={onNavigate} />

      <Card className="overflow-hidden border-sky-300/12 bg-[linear-gradient(135deg,rgba(8,12,24,0.96),rgba(10,19,34,0.94),rgba(6,15,28,0.96))] p-5 sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-300">
              <Sparkles className="h-3.5 w-3.5 text-sky-200" />
              {greeting}
            </div>
            <h2 className="text-3xl font-semibold leading-tight text-white sm:text-[2.5rem]">
              {profile.fullName}.
            </h2>
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

      {/* Calendar + action zone unified block */}
      <div className="space-y-0">
        <HomeCalendarBoard
          now={now}
          items={calendarItems}
          topRisk={topRisk}
          dailyMinutes={dailyMinutes}
          dailyGoalMinutes={dailyGoalMinutes}
          onNavigate={onNavigate}
        />

        {/* Action zone — visually connected below calendar */}
        <Card className="rounded-t-none border-t-0 bg-[linear-gradient(180deg,rgba(8,14,26,0.96),rgba(6,12,22,0.98))] p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-4 border-b border-white/8 pb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Bugün Yap</p>
              <h3 className="mt-1 text-xl font-semibold text-white">
                Takvimi güncelle veya seans kaydet
              </h3>
            </div>

            {/* Follow-up toast */}
            {(lastSessionAdded || lastItemAdded) && (
              <div className="flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-100">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {lastSessionAdded
                  ? "Kaydedildi — öncelikler ekranına yönlendiriliyorsun..."
                  : "Takvime eklendi — takvim ekranına yönlendiriliyorsun..."}
              </div>
            )}
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <ScheduleIntakeCard
              onAddItem={handleAddScheduleItem}
              onAddItems={(inputs) => {
                onAddScheduleItems(inputs);
                setLastItemAdded(true);
                setTimeout(() => {
                  setLastItemAdded(false);
                  onNavigate("schedule");
                }, 1500);
              }}
              manualItemsCount={manualItemsCount}
              compact
            />
            <StudySessionForm
              subjects={subjects}
              onAddSession={handleAddSession}
              sessionsToday={sessionsToday}
              embedded
              compact
            />
          </div>

          {/* Guide nudge */}
          <div className="mt-5 flex flex-wrap items-center gap-3 rounded-[22px] border border-white/8 bg-white/[0.02] px-4 py-3">
            <ListChecks className="h-4 w-4 shrink-0 text-sky-300" />
            <p className="text-sm text-slate-400">
              Seans ekledikten sonra öncelik sıralaması otomatik güncellenir.
            </p>
            <button
              type="button"
              onClick={() => onNavigate("priorities")}
              className="ml-auto flex items-center gap-1 text-sm text-sky-300 hover:text-sky-200"
            >
              Öncelikleri gör <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </Card>
      </div>
    </section>
  );
}

function FocusDirectiveCard({
  topRisk,
  onNavigate,
}: {
  topRisk: RankedSubjectRisk | null;
  onNavigate: (view: WorkspaceView) => void;
}) {
  if (!topRisk) {
    return (
      <Card className="border-white/8 bg-white/[0.03] p-5">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Şu An Odaklan</p>
        <p className="mt-2 text-base text-slate-300">
          Sınav ve ders bilgileri eklendikten sonra öncelik sıralaması burada görünecek.
        </p>
      </Card>
    );
  }

  const guidance = getGuidanceCopy(topRisk.label);
  const urgencyColor =
    topRisk.label === "Critical"
      ? "border-rose-400/25 bg-[linear-gradient(135deg,rgba(20,8,12,0.98),rgba(24,10,16,0.96))]"
      : topRisk.label === "High"
        ? "border-amber-300/25 bg-[linear-gradient(135deg,rgba(20,16,6,0.98),rgba(24,18,8,0.96))]"
        : "border-sky-300/18 bg-[linear-gradient(135deg,rgba(8,14,24,0.98),rgba(10,18,30,0.96))]";

  const badgeColor =
    topRisk.label === "Critical"
      ? "border-rose-400/30 bg-rose-400/12 text-rose-100"
      : topRisk.label === "High"
        ? "border-amber-300/30 bg-amber-300/12 text-amber-50"
        : "border-sky-300/25 bg-sky-300/10 text-sky-50";

  return (
    <Card className={`overflow-hidden ${urgencyColor} p-5 sm:p-6`}>
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <p className="text-sm uppercase tracking-[0.22em] text-slate-400">Şu An Odaklan</p>
            <span className={`inline-flex rounded-full border px-3 py-1 text-xs uppercase tracking-[0.18em] ${badgeColor}`}>
              {guidance.badge}
            </span>
          </div>

          <div>
            <h3 className="text-2xl font-semibold text-white sm:text-3xl">{topRisk.title}</h3>
            <p className="mt-1 text-sm text-slate-400">{topRisk.examTitle}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <FocusMetric
              icon={Target}
              label="Kalan hedef"
              value={`${formatPlannedHours(topRisk.remainingTargetHours)} saat`}
            />
            <FocusMetric
              icon={Timer}
              label="Sınava kalan"
              value={formatRelativeDuration(topRisk.hoursUntilExam * 3_600_000)}
            />
            <FocusMetric
              icon={Clock3}
              label="Müsait süre"
              value={`${formatApproxHours(topRisk.effectiveStudyHoursLeft)} saat`}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 xl:min-w-[200px] xl:items-end">
          <Button
            className="w-full gap-2 xl:w-auto"
            onClick={() => onNavigate("sessions")}
          >
            Seans ekle
            <ArrowRight className="h-4 w-4" />
          </Button>
          <button
            type="button"
            className="text-sm text-slate-400 underline-offset-4 hover:text-slate-300 hover:underline"
            onClick={() => onNavigate("priorities")}
          >
            Tüm öncelikleri gör
          </button>
        </div>
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
    <div className="rounded-[18px] border border-white/10 bg-black/20 px-4 py-3">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-slate-400" />
        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{label}</p>
      </div>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
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
