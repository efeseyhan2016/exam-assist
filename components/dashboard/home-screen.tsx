"use client";

import { useState } from "react";
import { motion } from "framer-motion";
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

  const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as const },
  });

  return (
    <section className="space-y-4">
      <motion.div {...fadeUp(0)}>
        <SectionHeading
          eyebrow="Ana Ekran"
          title="Sınav haftana genel bakış"
          description="Yaklaşan sınavlarını, bu haftanın planını ve bugünkü önceliklerini burada görürsün."
        />
      </motion.div>

      <motion.div {...fadeUp(0.08)}>
        <ApproachingExamsDock exams={upcomingExams} />
      </motion.div>

      <motion.div {...fadeUp(0.16)}>
        <FocusDirectiveCard topRisk={topRisk} onNavigate={onNavigate} />
      </motion.div>

      <motion.div {...fadeUp(0.24)}>
      <Card className="relative overflow-hidden border-sky-300/10 bg-[linear-gradient(135deg,rgba(8,12,24,0.97),rgba(10,19,34,0.95),rgba(6,15,28,0.97))] p-4 sm:p-5">
        {/* Subtle shimmer */}
        <motion.div
          className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.025] to-transparent"
          animate={{ x: ["-100%", "300%"] }}
          transition={{ duration: 5, repeat: Infinity, repeatDelay: 8, ease: "easeInOut" }}
        />
        <div className="relative flex flex-col gap-3.5 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-2.5">
            <motion.div
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-slate-300"
              animate={{ borderColor: ["rgba(255,255,255,0.10)", "rgba(56,189,248,0.20)", "rgba(255,255,255,0.10)"] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className="h-3 w-3 text-sky-200" />
              {greeting}
            </motion.div>
            <h2 className="bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-[1.9rem] font-semibold leading-tight text-transparent sm:text-[2.15rem]">
              {profile.fullName}.
            </h2>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-3 xl:w-[280px] xl:shrink-0">
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
      </motion.div>

      {/* Calendar + action zone unified block */}
      <motion.div {...fadeUp(0.32)} className="space-y-0">
        <HomeCalendarBoard
          now={now}
          items={calendarItems}
          topRisk={topRisk}
          dailyMinutes={dailyMinutes}
          dailyGoalMinutes={dailyGoalMinutes}
          onNavigate={onNavigate}
        />

        {/* Action zone — visually connected below calendar */}
        <Card className="rounded-t-none border-t-0 bg-[linear-gradient(180deg,rgba(8,14,26,0.96),rgba(6,12,22,0.98))] p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-4 border-b border-white/8 pb-3.5">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Bugün Yap</p>
              <h3 className="mt-1 text-lg font-semibold text-white">
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

          <div className="grid gap-3 xl:grid-cols-2">
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
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-[18px] border border-white/8 bg-white/[0.02] px-3.5 py-2.5">
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
      </motion.div>
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
      <Card className="border-white/8 bg-white/[0.03] p-4">
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

  const isCritical = topRisk.label === "Critical";
  const isHigh = topRisk.label === "High";
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
            <h3 className="text-xl font-semibold text-white sm:text-[1.7rem]">{topRisk.title}</h3>
            <p className="mt-1 text-sm text-slate-400">{topRisk.examTitle}</p>
          </motion.div>

          <div className="grid gap-2.5 sm:grid-cols-3">
            {[
              { icon: Target, label: "Kalan hedef", value: `${formatPlannedHours(topRisk.remainingTargetHours)} saat` },
              { icon: Timer, label: "Sınava kalan", value: formatRelativeDuration(topRisk.hoursUntilExam * 3_600_000) },
              { icon: Clock3, label: "Müsait süre", value: `${formatApproxHours(topRisk.effectiveStudyHoursLeft)} saat` },
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
    <motion.div
      className="rounded-[18px] border border-white/10 bg-white/[0.05] p-3.5"
      whileHover={{ y: -3, borderColor: "rgba(255,255,255,0.18)" }}
      transition={{ duration: 0.2 }}
    >
      <Icon className="h-4 w-4 text-sky-200" />
      <p className="mt-2.5 text-[11px] uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-1.5 text-base font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-300">{caption}</p>
    </motion.div>
  );
}
