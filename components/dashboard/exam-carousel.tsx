"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getGuidanceCopy } from "@/lib/risk-presentation";
import {
  formatApproxHours,
  formatExamDate,
  formatPlannedHours,
  formatRelativeDuration,
} from "@/lib/time";
import { RankedSubjectRisk } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ExamCarouselProps {
  timeline: Array<{
    id: string;
    subjectId: string;
    title: string;
    shortLabel: string;
    scheduledAt: string;
    scheduledAtDate: Date;
    countdown: {
      totalMilliseconds: number;
    };
  }>;
  rankedSubjects: RankedSubjectRisk[];
  embedded?: boolean;
}

export function ExamCarousel({
  timeline,
  rankedSubjects,
  embedded = false,
}: ExamCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const activeExam = timeline[activeIndex] ?? null;
  const riskBySubject = useMemo(
    () =>
      Object.fromEntries(
        rankedSubjects.map((subject) => [subject.subjectId, subject]),
      ),
    [rankedSubjects],
  );

  if (!activeExam) {
    return null;
  }

  const activeRisk = riskBySubject[activeExam.subjectId];

  return (
    <Card className={cn("p-5", embedded && "bg-white/[0.025]")}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Takvim
          </p>
          <h3 className="mt-1 text-lg font-semibold text-white">
            Kalan sınavlar
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              setActiveIndex(
                (current) => (current - 1 + timeline.length) % timeline.length,
              )
            }
            aria-label="Önceki sınav"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setActiveIndex((current) => (current + 1) % timeline.length)}
            aria-label="Sonraki sınav"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mt-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeExam.id}
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-300">
                  {activeExam.shortLabel}
                </div>
                <h4 className="text-xl font-semibold text-white">
                  {activeExam.title}
                </h4>
                <p className="text-sm text-slate-300">
                  {formatExamDate(activeExam.scheduledAtDate)}
                </p>
              </div>

              <div className="rounded-[20px] border border-white/10 bg-black/20 px-4 py-3 text-right">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Kalan süre
                </p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {formatRelativeDuration(activeExam.countdown.totalMilliseconds)}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <MetricPill
                label="Odak önerisi"
                value={activeRisk ? getGuidanceCopy(activeRisk.label).badge : "--"}
                tone="sky"
              />
              <MetricPill
                label="Kalan çalışma"
                value={activeRisk ? formatPlannedHours(activeRisk.remainingTargetHours) : "--"}
                tone="amber"
              />
              <MetricPill
                label="Müsait süre"
                value={
                  activeRisk ? formatApproxHours(activeRisk.effectiveStudyHoursLeft) : "--"
                }
                tone="emerald"
              />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {timeline.map((exam, index) => (
          <button
            key={exam.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={`rounded-full border px-3 py-1.5 text-xs transition ${
              index === activeIndex
                ? "border-sky-300/40 bg-sky-300/10 text-white"
                : "border-white/10 bg-white/[0.035] text-slate-300 hover:bg-white/[0.08]"
            }`}
          >
            {exam.shortLabel}
          </button>
        ))}
      </div>
    </Card>
  );
}

function MetricPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "sky" | "amber" | "emerald";
}) {
  const toneClassName =
    tone === "sky"
      ? "from-sky-400/15 to-sky-200/5"
      : tone === "amber"
        ? "from-amber-400/15 to-amber-200/5"
        : "from-emerald-400/15 to-emerald-200/5";

  return (
    <div
      className={`rounded-[18px] border border-white/10 bg-gradient-to-br ${toneClassName} p-4`}
    >
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}
