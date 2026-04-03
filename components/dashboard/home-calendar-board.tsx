"use client";

import { useMemo, useState } from "react";
import { AlarmClock, ArrowRight, CalendarRange, ListChecks, Target } from "lucide-react";

import { Button } from "@/components/ui/button";
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
    return items.reduce<Record<string, typeof items>>((accumulator, item) => {
      const key = getTodayKey(new Date(item.scheduledAt));
      accumulator[key] ??= [];
      accumulator[key].push(item);
      return accumulator;
    }, {});
  }, [items]);

  const weekDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const date = addDays(today, index);
        const key = getTodayKey(date);
        const dayItems = itemsByDay[key] ?? [];

        return {
          key,
          date,
          dayItems,
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
  const weekRangeLabel = `${new Intl.DateTimeFormat("tr-TR", {
    month: "short",
    day: "numeric",
  }).format(today)} - ${new Intl.DateTimeFormat("tr-TR", {
    month: "short",
    day: "numeric",
  }).format(addDays(today, 6))}`;
  const eventCount = weekDays.reduce((total, day) => total + day.dayItems.length, 0);
  const deadlineCount = weekDays.reduce(
    (total, day) => total + day.dayItems.filter((item) => item.kind === "deadline").length,
    0,
  );
  const nextUpcomingItem = items.find((item) => item.countdownMs > 0) ?? null;
  const remainingGoalMinutes = Math.max(dailyGoalMinutes - dailyMinutes, 0);

  return (
    <Card className="overflow-hidden border-sky-300/12 bg-[linear-gradient(135deg,rgba(8,12,24,0.98),rgba(10,20,34,0.95),rgba(7,17,30,0.98))] p-5 sm:p-6">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-slate-400">
              Haftalık Görünüm
            </p>
            <h3 className="mt-2 text-3xl font-semibold text-white">{weekRangeLabel}</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Bu haftaki sınav ve son tarihlerini görürsün. Bir güne tıklayarak detayları incele.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <SummaryChip label="Bu hafta" value={`${eventCount} etkinlik`} />
              <SummaryChip label="Son tarihler" value={`${deadlineCount}`} />
              <SummaryChip label="Günlük hedef" value={formatMinutesAsHours(dailyGoalMinutes)} />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
            {weekDays.map((day) => {
              const weekdayLabel = new Intl.DateTimeFormat("tr-TR", {
                weekday: "short",
              }).format(day.date);

              return (
                <button
                  key={day.key}
                  type="button"
                  onClick={() => setSelectedDayKey(day.key)}
                  className={[
                    "min-h-[152px] rounded-[24px] border p-3 text-left transition",
                    day.isSelected
                      ? "border-sky-300/40 bg-[linear-gradient(135deg,rgba(36,99,235,0.22),rgba(8,18,32,0.92))]"
                      : day.isToday
                        ? "border-amber-300/35 bg-amber-300/10"
                        : "border-white/10 bg-black/20 hover:border-white/15 hover:bg-white/[0.04]",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                        {weekdayLabel}
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-white">{day.date.getDate()}</p>
                    </div>
                    {day.isToday ? (
                      <span className="rounded-full border border-amber-300/30 bg-amber-300/12 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-amber-100">
                        Bugün
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-4 space-y-2">
                    {day.dayItems.length === 0 ? (
                      <div className="rounded-[16px] border border-dashed border-white/10 px-3 py-3 text-[11px] leading-5 text-slate-500">
                        Etkinlik yok
                      </div>
                    ) : (
                      day.dayItems.slice(0, 3).map((item) => (
                        <div
                          key={item.id}
                          className={[
                            "rounded-[16px] border px-3 py-2 text-[11px] leading-4",
                            item.kind === "exam"
                              ? "border-sky-300/25 bg-sky-300/10 text-sky-50"
                              : "border-amber-300/25 bg-amber-300/10 text-amber-50",
                          ].join(" ")}
                        >
                          <p className="truncate font-medium">{item.shortLabel}</p>
                          <p className="mt-1 opacity-80">
                            {new Intl.DateTimeFormat("tr-TR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            }).format(new Date(item.scheduledAt))}
                          </p>
                        </div>
                      ))
                    )}

                    {day.dayItems.length > 3 ? (
                      <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                        +{day.dayItems.length - 3} daha
                      </p>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid content-start gap-4">
          <div className="rounded-[26px] border border-white/10 bg-black/25 p-4">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
              Seçili Gün
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
                        {item.kind === "exam" ? "Sınav" : "Son tarih"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-300">
                      {formatExamDate(new Date(item.scheduledAt))}
                    </p>
                    {item.notes ? (
                      <p className="mt-2 text-sm leading-6 text-slate-300">{item.notes}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-slate-300">
                Bu gün için planlanmış sınav veya son tarih yok. Çalışma seansı için müsait.
              </p>
            )}
          </div>

          <div className="rounded-[26px] border border-white/10 bg-black/25 p-4">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
              Bugünkü Durum
            </p>
            <div className="mt-4 space-y-3">
              <ReadoutRow
                icon={AlarmClock}
                label="Sıradaki sınav"
                value={nextUpcomingItem?.title ?? "Sınav yok"}
              />
              <ReadoutRow
                icon={ListChecks}
                label="Öncelikli ders"
                value={topRisk?.title ?? "Belirleniyor"}
              />
              <ReadoutRow
                icon={Target}
                label="Bugünkü ilerleme"
                value={`${formatMinutesAsHours(dailyMinutes)} / ${formatMinutesAsHours(dailyGoalMinutes)}`}
              />
            </div>

            <div className="mt-4 rounded-[18px] border border-white/10 bg-white/[0.04] p-3">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                Öneri
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {remainingGoalMinutes > 0
                  ? `Bugün için ${formatMinutesAsHours(remainingGoalMinutes)} daha kaldı. ${topRisk?.title ? `${topRisk.title} dersine odaklanmak iyi olabilir.` : "Öncelik listene bakabilirsin."}`
                  : "Bugünkü hedefe ulaştın. Biraz nefes alabilir ya da yarın için hazırlanmaya başlayabilirsin."}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <QuickJump
              icon={CalendarRange}
              title="Takvim'e git"
              description="Tüm sınav ve tarihleri yönet."
              onClick={() => onNavigate("schedule")}
            />
            <QuickJump
              icon={ListChecks}
              title="Öncelikler'e git"
              description="Hangi derse odaklanman gerektiğini gör."
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
      <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
    </Button>
  );
}
