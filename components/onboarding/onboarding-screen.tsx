"use client";

import { ArrowRight, CalendarClock, CheckCircle2, Target } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { exams, studentConstraints } from "@/lib/seed-data";
import { formatExamDate, formatRelativeDuration } from "@/lib/time";

interface OnboardingScreenProps {
  onStart: () => void;
}

export function OnboardingScreen({ onStart }: OnboardingScreenProps) {
  const sortedExams = [...exams].sort(
    (left, right) =>
      new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime(),
  );

  const firstExam = sortedExams[0];
  const firstExamDate = new Date(firstExam.scheduledAt);
  const now = new Date();

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="absolute inset-0 bg-mesh-radial opacity-90" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.1),transparent_24%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.24),rgba(2,6,23,0.72))]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1180px] items-center">
        <div className="grid w-full gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="space-y-5"
          >
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.24em] text-sky-100/80">
                Welcome
                <span className="h-1 w-1 rounded-full bg-sky-300" />
                Exam Command Center
              </div>

              <div className="space-y-3">
                <h1 className="max-w-2xl text-4xl font-semibold leading-[1.02] text-white sm:text-[3.6rem] xl:text-[4rem]">
                  A simple home for your exam week.
                </h1>
                <p className="max-w-xl text-[15px] leading-7 text-slate-300">
                  Start from the calendar, understand the week at a glance, and
                  move into the workspace without friction.
                </p>
              </div>
            </div>

            <div className="grid gap-2.5">
              <WelcomeRow text="The next exam stays visible at the top." />
              <WelcomeRow text="Home keeps exams and deadlines in one clean timeline." />
              <WelcomeRow text="Priorities and study logging live on their own screens." />
            </div>

            <div className="flex flex-wrap gap-3">
              <MiniSignal
                icon={CalendarClock}
                label="Next exam"
                value={firstExam.title}
              />
              <MiniSignal
                icon={Target}
                label="Daily goal"
                value={`${studentConstraints.dailyStudyGoalHours}h`}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.06, ease: "easeOut" }}
            className="xl:pl-1"
          >
            <Card className="relative overflow-hidden border-white/12 bg-slate-950/60 p-5 sm:p-6">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />

              <div className="space-y-5">
                <div>
                  <p className="text-sm uppercase tracking-[0.22em] text-slate-400">
                    Ready to begin
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
                    {firstExam.title}
                  </h2>
                  <p className="mt-2 text-sm text-slate-300">
                    {formatExamDate(firstExamDate)}
                  </p>
                </div>

                <div className="rounded-[22px] border border-sky-300/15 bg-[linear-gradient(135deg,rgba(7,10,18,0.92),rgba(12,22,38,0.82),rgba(8,17,31,0.94))] p-4 sm:p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    Time until first exam
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
                    {formatRelativeDuration(firstExamDate.getTime() - now.getTime())}
                  </p>
                </div>

                <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
                  <p className="text-sm font-medium text-white">Inside the workspace</p>
                  <div className="mt-3 space-y-2 text-sm text-slate-300">
                    <p>Home keeps the calendar, next exam, and daily execution together.</p>
                    <p>Priorities, Sessions, and Schedule open only when you need more detail.</p>
                  </div>
                </div>

                <Button onClick={onStart} size="lg" className="w-full gap-2">
                  Enter workspace
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function WelcomeRow({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-[22px] border border-white/10 bg-black/20 px-4 py-4">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
      <p className="text-sm leading-6 text-slate-300">{text}</p>
    </div>
  );
}

function MiniSignal({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarClock;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-sky-200" />
        <span className="text-xs uppercase tracking-[0.16em] text-slate-400">{label}</span>
      </div>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
