"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, ChevronLeft, ChevronRight, RadioTower } from "lucide-react";

import { Card } from "@/components/ui/card";
import { formatExamDate, formatRelativeDuration } from "@/lib/time";

interface UpcomingExam {
  id: string;
  title: string;
  shortLabel: string;
  scheduledAt: string;
  countdown: {
    totalMilliseconds: number;
  };
}

interface ApproachingExamsDockProps {
  exams: UpcomingExam[];
}

export function ApproachingExamsDock({ exams }: ApproachingExamsDockProps) {
  const upcoming = useMemo(
    () => exams.filter((exam) => exam.countdown.totalMilliseconds > 0),
    [exams],
  );
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [upcoming.length]);

  useEffect(() => {
    if (upcoming.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % upcoming.length);
    }, 5_500);

    return () => window.clearInterval(interval);
  }, [upcoming.length]);

  if (upcoming.length === 0) {
    return (
      <Card className="p-4 sm:p-5">
        <p className="text-sm text-slate-300">Yaklaşan sınav bulunmuyor.</p>
      </Card>
    );
  }

  const activeExam = upcoming[Math.min(activeIndex, upcoming.length - 1)];
  const previous = () =>
    setActiveIndex((current) => (current - 1 + upcoming.length) % upcoming.length);
  const next = () => setActiveIndex((current) => (current + 1) % upcoming.length);

  return (
    <Card className="overflow-hidden border-sky-300/15 bg-[linear-gradient(135deg,rgba(8,12,24,0.96),rgba(10,19,34,0.92),rgba(7,16,30,0.96))] p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-sky-300/20 bg-sky-300/10">
            <RadioTower className="h-5 w-5 text-sky-100" />
          </div>

          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-slate-300">
              <CalendarClock className="h-3.5 w-3.5 text-sky-200" />
              Yaklaşan Sınavlar
            </div>
            <div className="mt-3 flex flex-wrap items-end gap-x-4 gap-y-2">
              <h3 className="truncate text-2xl font-semibold text-white sm:text-3xl">
                {activeExam.title}
              </h3>
              <p className="text-sm text-slate-300">
                {formatExamDate(new Date(activeExam.scheduledAt))}
              </p>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Sınavlar yaklaşma sırasına göre listelenir.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 lg:min-w-[290px] lg:justify-end">
          <button
            type="button"
            onClick={previous}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-200 transition hover:border-white/20 hover:bg-white/[0.08]"
            aria-label="Show previous approaching exam"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="min-w-[150px] rounded-[22px] border border-white/10 bg-black/20 px-4 py-3 text-center">
            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Kalan süre</p>
            <p className="mt-1 text-lg font-semibold text-white">
              {formatRelativeDuration(activeExam.countdown.totalMilliseconds)}
            </p>
          </div>

          <button
            type="button"
            onClick={next}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-200 transition hover:border-white/20 hover:bg-white/[0.08]"
            aria-label="Show next approaching exam"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {upcoming.map((exam, index) => (
          <button
            key={exam.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={[
              "rounded-full border px-3 py-2 text-xs uppercase tracking-[0.16em] transition",
              index === activeIndex
                ? "border-sky-300/30 bg-sky-300/12 text-sky-50"
                : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/15 hover:bg-white/[0.06]",
            ].join(" ")}
          >
            {exam.shortLabel}
          </button>
        ))}
      </div>
    </Card>
  );
}
