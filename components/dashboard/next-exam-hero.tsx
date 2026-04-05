"use client";

import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";

import { Card } from "@/components/ui/card";
import { formatExamDate } from "@/lib/time";
import { cn } from "@/lib/utils";

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

interface NextExamHeroProps {
  exam: CountdownExam | null;
  embedded?: boolean;
  className?: string;
}

export function NextExamHero({
  exam,
  embedded = false,
  className,
}: NextExamHeroProps) {
  if (!exam) {
    return (
      <Card className={cn("p-6", className)}>
        <p className="text-sm text-muted-foreground">Tüm sınavlar tamamlandı.</p>
      </Card>
    );
  }

  const segments = [
    { label: "Gün", value: exam.countdown.days },
    { label: "Saat", value: exam.countdown.hours },
    { label: "Dakika", value: exam.countdown.minutes },
    { label: "Saniye", value: exam.countdown.seconds },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className={className}
    >
      <Card
        className={cn(
          "relative overflow-hidden border-sky-300/15 bg-[linear-gradient(135deg,rgba(7,10,18,0.9),rgba(12,22,38,0.74),rgba(8,17,31,0.92))] p-6 sm:p-7",
          embedded &&
            "h-full rounded-[26px] bg-[linear-gradient(135deg,rgba(9,14,24,0.95),rgba(14,28,44,0.85),rgba(8,22,31,0.96))]",
        )}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.14),transparent_28%)]" />
        <div className="relative space-y-5">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.22em] text-slate-300">
              <Sparkles className="h-3.5 w-3.5 text-sky-200" />
              Sıradaki sınav
            </div>

            <div>
              <h2 className="text-3xl font-semibold text-white sm:text-[2.5rem]">
                {exam.title}
              </h2>
              <p className="mt-2 text-sm text-slate-300">
                {formatExamDate(new Date(exam.scheduledAt))}
              </p>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Bu tarihi yakın tut. Haftanın temposunu belirleyen ilk sınav bu.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {segments.map((segment) => (
                <motion.div
                  key={segment.label}
                  layout
                  className="rounded-[22px] border border-white/10 bg-white/[0.055] p-4"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    {segment.label}
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-white">
                    {`${segment.value}`.padStart(2, "0")}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
