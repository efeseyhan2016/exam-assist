import { CalendarClock, Flag } from "lucide-react";

import { Card } from "@/components/ui/card";
import { formatExamDate, formatRelativeDuration } from "@/lib/time";
import { ScheduleItem } from "@/lib/types";

interface TimelineItem extends ScheduleItem {
  countdownMs: number;
}

interface CalendarTimelineCardProps {
  items: TimelineItem[];
}

export function CalendarTimelineCard({ items }: CalendarTimelineCardProps) {
  const upcoming = items.filter((item) => item.countdownMs > 0);
  const nextItem = upcoming[0] ?? null;

  return (
    <Card className="h-full p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Home calendar
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-white">
            The week anchored on real dates
          </h3>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
            Exams and manual deadlines live in one chronological rail so Home can
            stay grounded in the actual calendar.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3 text-amber-200">
          <CalendarClock className="h-5 w-5" />
        </div>
      </div>

      {nextItem ? (
        <div className="mt-5 rounded-[24px] border border-sky-300/15 bg-[linear-gradient(135deg,rgba(7,10,18,0.92),rgba(12,22,38,0.82),rgba(8,17,31,0.94))] p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
            Next on calendar
          </p>
          <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h4 className="text-2xl font-semibold text-white">{nextItem.title}</h4>
              <p className="mt-1 text-sm text-slate-300">
                {formatExamDate(new Date(nextItem.scheduledAt))}
              </p>
            </div>
            <KindBadge kind={nextItem.kind} />
          </div>
          <p className="mt-3 text-3xl font-semibold text-white">
            {formatRelativeDuration(nextItem.countdownMs)}
          </p>
        </div>
      ) : null}

      <div className="mt-5 space-y-3">
        {items.slice(0, 6).map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-4 rounded-[22px] border border-white/10 bg-black/20 px-4 py-3"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium text-white">{item.title}</p>
                <KindBadge kind={item.kind} compact />
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {formatExamDate(new Date(item.scheduledAt))}
              </p>
            </div>

            <p className="shrink-0 text-sm text-slate-200">
              {item.countdownMs > 0 ? formatRelativeDuration(item.countdownMs) : "passed"}
            </p>
          </div>
        ))}
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
  const className =
    kind === "exam"
      ? "border-sky-300/25 bg-sky-300/10 text-sky-50"
      : "border-amber-300/25 bg-amber-300/10 text-amber-50";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs uppercase tracking-[0.16em] ${className}`}
    >
      {!compact ? <Flag className="h-3 w-3" /> : null}
      {kind}
    </span>
  );
}
