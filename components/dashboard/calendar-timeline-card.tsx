"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CalendarClock, Flag, Trash2 } from "lucide-react";

import { Card } from "@/components/ui/card";
import { formatExamDate, formatRelativeDuration } from "@/lib/time";
import { ScheduleItem } from "@/lib/types";

interface TimelineItem extends ScheduleItem {
  countdownMs: number;
}

interface CalendarTimelineCardProps {
  items: TimelineItem[];
  compact?: boolean;
  onDeleteItem?: (item: TimelineItem) => void;
}

export function CalendarTimelineCard({
  items,
  compact = false,
  onDeleteItem,
}: CalendarTimelineCardProps) {
  const upcoming = items.filter((item) => item.countdownMs > 0);
  const completedCount = items.filter((item) => item.countdownMs <= 0).length;
  const nextItem = upcoming[0] ?? null;
  const visibleItems = compact ? items.slice(0, 4) : items;

  return (
    <Card className={compact ? "p-4 sm:p-5" : "p-5 sm:p-6"}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Takvim
          </p>
          <h3 className={`mt-2 font-semibold text-white ${compact ? "text-xl" : "text-2xl"}`}>
            {compact ? "Haftayı şekillendiren tarihler" : "Tarihlere kilitli hafta"}
          </h3>
          {!compact ? (
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
              Sınavlar, ödevler, projeler ve eklediğin diğer tarihler tek bir kronolojik rayda görünür.
              Ana ekran her zaman gerçek takvime dayalı kalır.
            </p>
          ) : (
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
              Sonraki gerçek tarihleri kaydırmaya gerek kalmadan takip et.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3 text-amber-200">
          <CalendarClock className="h-5 w-5" />
        </div>
      </div>

      {nextItem ? (
        <div className={`mt-5 rounded-[24px] border border-sky-300/15 bg-[linear-gradient(135deg,rgba(7,10,18,0.92),rgba(12,22,38,0.82),rgba(8,17,31,0.94))] ${compact ? "p-4" : "p-5"}`}>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
            Takvimde sıradaki
          </p>
          <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h4 className={`${compact ? "text-xl" : "text-2xl"} font-semibold text-white`}>
                {nextItem.title}
              </h4>
              <p className="mt-1 text-sm text-slate-300">
                {formatExamDate(new Date(nextItem.scheduledAt))}
              </p>
            </div>
            <KindBadge kind={nextItem.kind} />
          </div>
          <p className={`mt-3 font-semibold text-white ${compact ? "text-2xl" : "text-3xl"}`}>
            {formatRelativeDuration(nextItem.countdownMs)}
          </p>
        </div>
      ) : null}

      {!compact && items.length > 0 ? (
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300">
            {items.length} toplam kayıt
          </span>
          {completedCount > 0 ? (
            <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs text-emerald-100">
              {completedCount} geçen tarih
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="mt-5 space-y-2">
        <AnimatePresence initial={false}>
          {visibleItems.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -12, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-between gap-4 rounded-[22px] border border-white/10 bg-black/20 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-white">{item.title}</p>
                  <KindBadge kind={item.kind} compact />
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {formatExamDate(new Date(item.scheduledAt))}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <p className="text-sm text-slate-300">
                  {item.countdownMs > 0 ? formatRelativeDuration(item.countdownMs) : "Geçti"}
                </p>
                {onDeleteItem && (item.source === "manual" || item.kind === "exam") && (
                  <motion.button
                    type="button"
                    onClick={() => onDeleteItem(item)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="text-slate-600 transition hover:text-rose-400"
                    title="Sil"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </motion.button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Card>
  );
}

function KindBadge({
  kind,
  compact = false,
}: {
  kind: ScheduleItem["kind"];
  compact?: boolean;
}) {
  const meta =
    kind === "exam"
      ? {
          className: "border-sky-300/25 bg-sky-300/10 text-sky-50",
          label: "Sınav",
        }
      : kind === "project"
        ? {
            className: "border-fuchsia-300/25 bg-fuchsia-300/10 text-fuchsia-50",
            label: "Proje",
          }
        : kind === "assignment"
          ? {
              className: "border-emerald-300/25 bg-emerald-300/10 text-emerald-50",
              label: "Ödev",
            }
          : {
              className: "border-amber-300/25 bg-amber-300/10 text-amber-50",
              label: "Son tarih",
            };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs uppercase tracking-[0.16em] ${meta.className}`}
    >
      {!compact ? <Flag className="h-3 w-3" /> : null}
      {meta.label}
    </span>
  );
}
