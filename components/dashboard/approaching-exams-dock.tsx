"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
      <Card className="p-3.5 sm:p-4">
        <p className="text-sm text-slate-300">Yaklaşan sınav bulunmuyor.</p>
      </Card>
    );
  }

  const activeExam = upcoming[Math.min(activeIndex, upcoming.length - 1)];
  const previous = () =>
    setActiveIndex((current) => (current - 1 + upcoming.length) % upcoming.length);
  const next = () => setActiveIndex((current) => (current + 1) % upcoming.length);

  const isUrgent = activeExam.countdown.totalMilliseconds < 48 * 3_600_000; // < 2 days

  return (
    <Card className="relative overflow-hidden border-sky-300/15 bg-[linear-gradient(135deg,rgba(8,12,24,0.96),rgba(10,19,34,0.92),rgba(7,16,30,0.96))] p-3.5 sm:p-4">
      {/* Urgent pulse glow */}
      {isUrgent && (
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          style={{ boxShadow: "inset 0 0 50px 0 rgba(251,113,133,0.15)" }}
        />
      )}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <motion.div
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-sky-300/20 bg-sky-300/10"
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
              <RadioTower className="h-4.5 w-4.5 text-sky-100" />
          </motion.div>

          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-300">
              <CalendarClock className="h-3 w-3 text-sky-200" />
              Yaklaşan Sınavlar
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeExam.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="mt-3"
              >
                <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
                  <h3 className="truncate text-xl font-semibold text-white sm:text-[1.7rem]">
                    {activeExam.title}
                  </h3>
                  <p className="text-sm text-slate-400">
                    {formatExamDate(new Date(activeExam.scheduledAt))}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center gap-2.5 lg:min-w-[260px] lg:justify-end">
          <motion.button
            type="button"
            onClick={previous}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-200 transition hover:border-white/20 hover:bg-white/[0.08]"
            aria-label="Show previous approaching exam"
          >
            <ChevronLeft className="h-4 w-4" />
          </motion.button>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeExam.id + "-countdown"}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.25 }}
              className={[
                "min-w-[132px] rounded-[18px] border px-3.5 py-2.5 text-center",
                isUrgent
                  ? "border-rose-400/25 bg-rose-400/[0.07]"
                  : "border-white/10 bg-black/20",
              ].join(" ")}
            >
              <p className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Kalan süre</p>
              <p className={["mt-1 text-base font-semibold", isUrgent ? "text-rose-300" : "text-white"].join(" ")}>
                {formatRelativeDuration(activeExam.countdown.totalMilliseconds)}
              </p>
            </motion.div>
          </AnimatePresence>

          <motion.button
            type="button"
            onClick={next}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-200 transition hover:border-white/20 hover:bg-white/[0.08]"
            aria-label="Show next approaching exam"
          >
            <ChevronRight className="h-4 w-4" />
          </motion.button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {upcoming.map((exam, index) => (
          <motion.button
            key={exam.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className={[
              "rounded-full border px-2.5 py-1.5 text-[11px] uppercase tracking-[0.14em] transition",
              index === activeIndex
                ? "border-sky-300/35 bg-sky-300/14 text-sky-50 shadow-[0_0_12px_rgba(56,189,248,0.15)]"
                : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/18 hover:text-slate-200",
            ].join(" ")}
          >
            {exam.shortLabel}
          </motion.button>
        ))}
      </div>
    </Card>
  );
}
