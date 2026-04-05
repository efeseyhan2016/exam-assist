"use client";

import { useMemo, useState } from "react";
import { AlarmClock, ArrowRight, ListChecks, Target } from "lucide-react";

import { Card } from "@/components/ui/card";
import { addDays, formatExamDate, formatMinutesAsHours, getTodayKey } from "@/lib/time";
import { RankedSubjectRisk, ScheduleItem } from "@/lib/types";
import { WorkspaceView } from "@/components/dashboard/workspace-nav";

interface HomeCalendarBoardProps {
  now: Date;
  items: Array<
    ScheduleItem & {
      countdownMs: number;
    }
  >;
  topRisk: RankedSubjectRisk | null;
  dailyMinutes: number;
  dailyGoalMinutes: number;
  onNavigate: (view: WorkspaceView) => void;
}

export function HomeCalendarBoard({
  now,
  items,
  topRisk,
  dailyMinutes,
  dailyGoalMinutes,
  onNavigate,
}: HomeCalendarBoardProps) {
  const today = useMemo(
    () => new Date(now.getFullYear(), now.getMonth(), now.getDate()),
    [now],
  );
  const todayKey = getTodayKey(today);
  const [selectedDayKey, setSelectedDayKey] = useState(todayKey);

  const itemsByDay = useMemo(() => {
    return items.reduce<Record<string, typeof items>>((acc, item) => {
      const key = getTodayKey(new Date(item.scheduledAt));
      acc[key] ??= [];
      acc[key].push(item);
      return acc;
    }, {});
  }, [items]);

  const weekDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const date = addDays(today, i);
        const key = getTodayKey(date);
        return {
          key,
          date,
          dayItems: itemsByDay[key] ?? [],
          isToday: key === todayKey,
          isSelected: key === selectedDayKey,
        };
      }),
    [itemsByDay, selectedDayKey, today, todayKey],
  );

  const selectedItems = itemsByDay[selectedDayKey] ?? [];
  const selectedDate = selectedDayKey.split("-").map(Number);
  const selectedDateObject = new Date(selectedDate[0], selectedDate[1] - 1, selectedDate[2]);
  const selectedDateLabel = new Intl.DateTimeFormat("tr-TR", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(selectedDateObject);

  const weekRangeLabel = `${new Intl.DateTimeFormat("tr-TR", { month: "short", day: "numeric" }).format(today)} – ${new Intl.DateTimeFormat("tr-TR", { month: "short", day: "numeric" }).format(addDays(today, 6))}`;
  const nextUpcomingItem = items.find((item) => item.countdownMs > 0) ?? null;
  const remainingGoalMinutes = Math.max(dailyGoalMinutes - dailyMinutes, 0);
  const goalPct = dailyGoalMinutes > 0 ? Math.min((dailyMinutes / dailyGoalMinutes) * 100, 100) : 0;

  return (
    <Card className="overflow-hidden rounded-b-none border-b-0 border-sky-300/12 bg-[linear-gradient(160deg,rgba(8,12,24,0.99),rgba(9,17,32,0.97),rgba(7,14,28,0.99))] p-4 sm:p-5">
      {/* Header */}
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Haftalık Görünüm</p>
          <h3 className="mt-1 text-xl font-semibold text-white">{weekRangeLabel}</h3>
        </div>
        <button
          type="button"
          onClick={() => onNavigate("schedule")}
          className="flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-slate-200"
        >
          Takvime git <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Compact day strip */}
      <div className="grid grid-cols-7 gap-1.5">
        {weekDays.map((day) => {
          const weekdayLabel = new Intl.DateTimeFormat("tr-TR", { weekday: "short" }).format(day.date);
          const hasExam = day.dayItems.some((i) => i.kind === "exam");
          const hasDeadline = day.dayItems.some((i) => i.kind === "deadline");

          return (
            <button
              key={day.key}
              type="button"
              onClick={() => setSelectedDayKey(day.key)}
              className={[
                "flex flex-col items-center gap-1 rounded-[16px] border py-2.5 transition",
                day.isSelected
                  ? "border-sky-400/40 bg-sky-400/12 shadow-[0_0_20px_rgba(56,189,248,0.08)]"
                  : day.isToday
                    ? "border-amber-300/30 bg-amber-300/8"
                    : "border-white/8 bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.06]",
              ].join(" ")}
            >
              <span className={[
                "text-[10px] font-medium uppercase tracking-[0.14em]",
                day.isSelected ? "text-sky-300" : day.isToday ? "text-amber-300" : "text-slate-500",
              ].join(" ")}>
                {weekdayLabel}
              </span>

              <span className={[
                "text-lg font-semibold leading-none",
                day.isSelected ? "text-white" : day.isToday ? "text-amber-100" : "text-slate-300",
              ].join(" ")}>
                {day.date.getDate()}
              </span>

              {/* Event indicators */}
              <div className="flex items-center gap-1 h-2">
                {hasExam && (
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                )}
                {hasDeadline && (
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                )}
                {!hasExam && !hasDeadline && (
                  <span className="h-1.5 w-1.5 rounded-full bg-transparent" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-2.5 flex items-center gap-3">
        <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <span className="h-1.5 w-1.5 rounded-full bg-sky-400" /> Sınav
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Son tarih
        </span>
      </div>

      {/* Detail + Status row */}
      <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_250px]">

        {/* Selected day detail */}
        <div className="rounded-[18px] border border-white/10 bg-black/20 p-3.5">
          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Seçili Gün</p>
          <h4 className="mt-1 text-base font-semibold text-white capitalize">{selectedDateLabel}</h4>

          {selectedItems.length > 0 ? (
            <div className="mt-3 space-y-2">
              {selectedItems.map((item) => (
                <div
                  key={item.id}
                  className={[
                    "flex items-start justify-between gap-3 rounded-[14px] border px-3.5 py-2.5",
                    item.kind === "exam"
                      ? "border-sky-300/20 bg-sky-300/8"
                      : "border-amber-300/20 bg-amber-300/8",
                  ].join(" ")}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{item.title}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {formatExamDate(new Date(item.scheduledAt))}
                    </p>
                  </div>
                  <span className={[
                    "shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-[0.16em]",
                    item.kind === "exam"
                      ? "border-sky-300/25 text-sky-200"
                      : "border-amber-300/25 text-amber-200",
                  ].join(" ")}>
                    {item.kind === "exam" ? "Sınav" : "Son tarih"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Bu gün için sınav veya son tarih yok — çalışma seansı için müsait.
            </p>
          )}
        </div>

        {/* Today status */}
        <div className="rounded-[18px] border border-white/10 bg-black/20 p-3.5">
          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Bugünkü Durum</p>

          {/* Progress bar */}
          <div className="mt-2.5">
            <div className="mb-1.5 flex items-center justify-between text-xs text-slate-400">
              <span>Günlük hedef</span>
              <span className={goalPct >= 100 ? "text-emerald-400" : "text-slate-300"}>
                {formatMinutesAsHours(dailyMinutes)} / {formatMinutesAsHours(dailyGoalMinutes)}
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/8 overflow-hidden">
              <div
                className={[
                  "h-full rounded-full transition-all duration-500",
                  goalPct >= 100 ? "bg-emerald-400" : "bg-sky-400",
                ].join(" ")}
                style={{ width: `${goalPct}%` }}
              />
            </div>
          </div>

          <div className="mt-3.5 space-y-2">
            <StatusRow
              icon={AlarmClock}
              label="Sıradaki sınav"
              value={nextUpcomingItem?.title ?? "Sınav yok"}
            />
            <StatusRow
              icon={ListChecks}
              label="Ana odak"
              value={topRisk?.title ?? "Belirleniyor"}
            />
            <StatusRow
              icon={Target}
              label="Kalan alan"
              value={remainingGoalMinutes > 0
                ? `${formatMinutesAsHours(remainingGoalMinutes)} daha`
                : "Hedefe ulaşıldı"}
            />
          </div>

          <button
            type="button"
            onClick={() => onNavigate("priorities")}
            className="mt-3.5 flex w-full items-center justify-between rounded-[14px] border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-slate-300 transition hover:border-white/15 hover:text-white"
          >
            <span>Öncelikleri gör</span>
            <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
          </button>
        </div>
      </div>
    </Card>
  );
}

function StatusRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof AlarmClock;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[12px] border border-white/8 bg-white/[0.03] px-3 py-2">
      <div className="flex items-center gap-2 min-w-0">
        <Icon className="h-3.5 w-3.5 shrink-0 text-slate-500" />
        <p className="text-xs uppercase tracking-[0.14em] text-slate-500 shrink-0">{label}</p>
      </div>
      <p className="text-xs font-medium text-slate-200 text-right truncate">{value}</p>
    </div>
  );
}
