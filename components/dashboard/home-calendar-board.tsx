"use client";

import { useMemo, useState } from "react";
import {
  AlarmClock,
  ArrowRight,
  CalendarRange,
  ListChecks,
  Target,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatMinutesAsHours, getTodayKey } from "@/lib/time";
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

const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function HomeCalendarBoard({
  now,
  items,
  topRisk,
  dailyMinutes,
  dailyGoalMinutes,
  onNavigate,
}: HomeCalendarBoardProps) {
  const nextUpcomingItem = items.find((item) => item.countdownMs > 0) ?? items[0] ?? null;
  const anchorDate = nextUpcomingItem ? new Date(nextUpcomingItem.scheduledAt) : now;
  const monthStart = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
  const monthLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(monthStart);

  const initialSelectedKey = (() => {
    const todayKey = getTodayKey(now);
    if (now.getMonth() === monthStart.getMonth() && now.getFullYear() === monthStart.getFullYear()) {
      return todayKey;
    }

    return nextUpcomingItem ? getTodayKey(new Date(nextUpcomingItem.scheduledAt)) : todayKey;
  })();

  const [selectedDayKey, setSelectedDayKey] = useState(initialSelectedKey);

  const itemsByDay = useMemo(() => {
    return items.reduce<Record<string, typeof items>>((accumulator, item) => {
      const key = getTodayKey(new Date(item.scheduledAt));
      accumulator[key] ??= [];
      accumulator[key].push(item);
      return accumulator;
    }, {});
  }, [items]);

  const selectedItems = itemsByDay[selectedDayKey] ?? [];
  const selectedDate = selectedDayKey
    .split("-")
    .map((value) => Number(value));
  const selectedDateObject = new Date(selectedDate[0], selectedDate[1] - 1, selectedDate[2]);
  const selectedDateLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(selectedDateObject);
  const todayKey = getTodayKey(now);
  const remainingGoalMinutes = Math.max(dailyGoalMinutes - dailyMinutes, 0);
  const eventCount = items.filter(
    (item) =>
      new Date(item.scheduledAt).getMonth() === monthStart.getMonth() &&
      new Date(item.scheduledAt).getFullYear() === monthStart.getFullYear(),
  ).length;
  const deadlineCount = items.filter(
    (item) =>
      item.kind === "deadline" &&
      new Date(item.scheduledAt).getMonth() === monthStart.getMonth() &&
      new Date(item.scheduledAt).getFullYear() === monthStart.getFullYear(),
  ).length;

  const startOffset = (monthStart.getDay() + 6) % 7;
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - startOffset);

  const calendarDays = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    const key = getTodayKey(date);
    const dayItems = itemsByDay[key] ?? [];
    const isCurrentMonth = date.getMonth() === monthStart.getMonth();
    const isToday = key === todayKey;
    const isSelected = key === selectedDayKey;

    return {
      key,
      date,
      dayItems,
      isCurrentMonth,
      isToday,
      isSelected,
    };
  });

  return (
    <Card className="overflow-hidden border-sky-300/12 bg-[linear-gradient(135deg,rgba(8,12,24,0.98),rgba(10,20,34,0.95),rgba(7,17,30,0.98))] p-5 sm:p-6">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_310px]">
        <div className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-slate-400">
                Home calendar
              </p>
              <h3 className="mt-2 text-3xl font-semibold text-white">{monthLabel}</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                The calendar is the main character on Home. It should explain the week through real dates before anything else.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <SummaryChip label="Events" value={`${eventCount}`} />
              <SummaryChip label="Deadlines" value={`${deadlineCount}`} />
              <SummaryChip label="Daily goal" value={formatMinutesAsHours(dailyGoalMinutes)} />
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {weekdayLabels.map((label) => (
              <div
                key={label}
                className="rounded-[18px] border border-white/8 bg-white/[0.04] px-3 py-2 text-center text-[11px] uppercase tracking-[0.18em] text-slate-400"
              >
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day) => (
              <button
                key={day.key}
                type="button"
                onClick={() => setSelectedDayKey(day.key)}
                className={[
                  "min-h-[122px] rounded-[22px] border p-3 text-left transition",
                  day.isSelected
                    ? "border-sky-300/40 bg-[linear-gradient(135deg,rgba(36,99,235,0.24),rgba(8,18,32,0.92))]"
                    : day.isToday
                      ? "border-amber-300/35 bg-amber-300/10"
                      : day.isCurrentMonth
                        ? "border-white/10 bg-black/20 hover:border-white/15 hover:bg-white/[0.04]"
                        : "border-white/5 bg-white/[0.02] text-slate-500",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={[
                      "inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-sm font-semibold",
                      day.isSelected
                        ? "bg-sky-300/15 text-white"
                        : day.isToday
                          ? "bg-amber-300/15 text-amber-50"
                          : "text-white",
                    ].join(" ")}
                  >
                    {day.date.getDate()}
                  </span>
                  {day.isToday ? (
                    <span className="rounded-full border border-amber-300/30 bg-amber-300/12 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-amber-100">
                      Today
                    </span>
                  ) : null}
                </div>

                <div className="mt-3 space-y-2">
                  {day.dayItems.slice(0, 2).map((item) => (
                    <div
                      key={item.id}
                      className={[
                        "rounded-[14px] border px-2.5 py-2 text-[11px] leading-4",
                        item.kind === "exam"
                          ? "border-sky-300/25 bg-sky-300/10 text-sky-50"
                          : "border-amber-300/25 bg-amber-300/10 text-amber-50",
                      ].join(" ")}
                    >
                      <p className="truncate font-medium">{item.shortLabel}</p>
                      <p className="mt-1 opacity-80">
                        {new Intl.DateTimeFormat("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(new Date(item.scheduledAt))}
                      </p>
                    </div>
                  ))}

                  {day.dayItems.length > 2 ? (
                    <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                      +{day.dayItems.length - 2} more
                    </p>
                  ) : null}

                  {day.isToday && topRisk ? (
                    <div className="rounded-[14px] border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-2 text-[11px] leading-4 text-emerald-50">
                      <p className="font-medium">Focus</p>
                      <p className="mt-1 truncate">{topRisk.shortLabel}</p>
                    </div>
                  ) : null}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid content-start gap-4">
          <div className="rounded-[26px] border border-white/10 bg-black/25 p-4">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
              Selected day
            </p>
            <h4 className="mt-2 text-2xl font-semibold text-white">{selectedDateLabel}</h4>

            {selectedItems.length > 0 ? (
              <div className="mt-4 space-y-3">
                {selectedItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[18px] border border-white/10 bg-white/[0.04] p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-white">{item.title}</p>
                      <span
                        className={[
                          "rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.16em]",
                          item.kind === "exam"
                            ? "border-sky-300/25 bg-sky-300/10 text-sky-50"
                            : "border-amber-300/25 bg-amber-300/10 text-amber-50",
                        ].join(" ")}
                      >
                        {item.kind}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-300">
                      {new Intl.DateTimeFormat("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        month: "short",
                        day: "numeric",
                      }).format(new Date(item.scheduledAt))}
                    </p>
                    {item.notes ? (
                      <p className="mt-2 text-sm leading-6 text-slate-300">{item.notes}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-slate-300">
                No fixed exam or deadline is attached to this day yet.
              </p>
            )}
          </div>

          <div className="rounded-[26px] border border-white/10 bg-black/25 p-4">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
              Today loop
            </p>
            <div className="mt-4 space-y-3">
              <ReadoutRow
                icon={AlarmClock}
                label="Next exam"
                value={nextUpcomingItem?.title ?? "No upcoming date"}
              />
              <ReadoutRow
                icon={ListChecks}
                label="Planning focus"
                value={topRisk?.title ?? "No active focus"}
              />
              <ReadoutRow
                icon={Target}
                label="Goal progress"
                value={`${formatMinutesAsHours(dailyMinutes)} / ${formatMinutesAsHours(dailyGoalMinutes)}`}
              />
            </div>

            <div className="mt-4 rounded-[18px] border border-white/10 bg-white/[0.04] p-3">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                Suggested read
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {remainingGoalMinutes > 0
                  ? `${formatMinutesAsHours(remainingGoalMinutes)} still sits on today’s goal. Keep the calendar visible, then put the next block into ${topRisk?.title ?? "the current focus"}.`
                  : "Today’s goal is already met. Any extra study becomes real buffer against the later dates on this calendar."}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <QuickJump
              icon={CalendarRange}
              title="Open Schedule"
              description="Go deeper into calendar maintenance."
              onClick={() => onNavigate("schedule")}
            />
            <QuickJump
              icon={ListChecks}
              title="Open Priorities"
              description="Inspect the full ranked pressure board."
              onClick={() => onNavigate("priorities")}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}

function SummaryChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-white/[0.05] px-3 py-3">
      <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function ReadoutRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof AlarmClock;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[18px] border border-white/10 bg-white/[0.04] px-3 py-3">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/20">
        <Icon className="h-4 w-4 text-slate-200" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">{label}</p>
        <p className="mt-1 text-sm font-medium text-white">{value}</p>
      </div>
    </div>
  );
}

function QuickJump({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: typeof CalendarRange;
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
