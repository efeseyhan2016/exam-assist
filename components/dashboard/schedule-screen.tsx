"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CalendarArrowDown, RotateCcw } from "lucide-react";

import { CalendarTimelineCard } from "@/components/dashboard/calendar-timeline-card";
import { CompletedExamsCard } from "@/components/dashboard/completed-exams-card";
import { ExamCarousel } from "@/components/dashboard/exam-carousel";
import { ScheduleIntakeCard } from "@/components/dashboard/schedule-intake-card";
import { SectionHeading } from "@/components/dashboard/section-heading";
import { splitExamTimeline } from "@/lib/exam-outcomes";
import { downloadIcs } from "@/lib/ics-export";
import {
  ExamOutcome,
  RankedSubjectRisk,
  ScheduleItem,
  ScheduleItemKind,
  SubjectCalibrationAnswers,
} from "@/lib/types";

interface TimelineExam {
  id: string;
  subjectId: string;
  title: string;
  shortLabel: string;
  scheduledAt: string;
  scheduledAtDate: Date;
  countdown: {
    totalMilliseconds: number;
  };
}

interface ScheduleScreenProps {
  onAddScheduleItem: (input: {
    title: string;
    scheduledAt: string;
    kind: ScheduleItemKind;
    notes?: string;
    calibration?: SubjectCalibrationAnswers;
  }) => void;
  onAddScheduleItems: (inputs: Array<{
    title: string;
    scheduledAt: string;
    kind: ScheduleItemKind;
    notes?: string;
    calibration?: SubjectCalibrationAnswers;
  }>) => void;
  onDeleteScheduleItem: (item: ScheduleItem & { countdownMs: number }) => void;
  manualItemsCount: number;
  calendarItems: Array<
    ScheduleItem & {
      countdownMs: number;
    }
  >;
  timeline: TimelineExam[];
  rankedSubjects: RankedSubjectRisk[];
  now: Date;
  examOutcomes: ExamOutcome[];
  onSaveExamOutcome: (input: {
    examId: string;
    subjectId: string;
    score?: number;
    notes?: string;
  }) => void;
  pendingUndoTitle?: string | null;
  pendingUndoToken?: string | null;
  onUndoDelete?: () => void;
}

export function ScheduleScreen({
  onAddScheduleItem,
  onAddScheduleItems,
  onDeleteScheduleItem,
  manualItemsCount,
  calendarItems,
  timeline,
  rankedSubjects,
  now,
  examOutcomes,
  onSaveExamOutcome,
  pendingUndoTitle,
  pendingUndoToken,
  onUndoDelete,
}: ScheduleScreenProps) {
  const { upcoming: upcomingTimeline, completed: completedTimeline } = splitExamTimeline(
    timeline,
    now,
  );

  const handleExportIcs = () => {
    const exams = timeline.map((exam) => ({
      id: exam.id,
      title: exam.title,
      scheduledAt: exam.scheduledAt,
    }));
    downloadIcs(exams);
  };

  return (
    <section className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <SectionHeading
          eyebrow="Takvim"
          title="Sınav ve son tarihlerini buradan yönet"
          description="Tarihleri güncel tutmak, öncelik sıralamasının doğru çalışmasını sağlar."
        />

        {timeline.length > 0 && (
          <button
            type="button"
            onClick={handleExportIcs}
            className="mt-1 flex shrink-0 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
            title="Sınav tarihlerini Apple Takvim veya Google Calendar'a aktar"
          >
            <CalendarArrowDown className="h-3.5 w-3.5" />
            .ics olarak aktar
          </button>
        )}
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[0.94fr_1.06fr]">
        <ScheduleIntakeCard
          onAddItem={onAddScheduleItem}
          onAddItems={onAddScheduleItems}
          manualItemsCount={manualItemsCount}
        />
        <CalendarTimelineCard items={calendarItems} onDeleteItem={onDeleteScheduleItem} />
      </div>

      <ExamCarousel timeline={upcomingTimeline} rankedSubjects={rankedSubjects} embedded />

      {completedTimeline.length > 0 ? (
        <CompletedExamsCard
          exams={completedTimeline}
          outcomes={examOutcomes}
          onSaveOutcome={onSaveExamOutcome}
        />
      ) : null}

      <AnimatePresence initial={false}>
        {pendingUndoTitle && pendingUndoToken && onUndoDelete ? (
          <FloatingUndoToast
            key={pendingUndoToken}
            title={pendingUndoTitle}
            onUndo={onUndoDelete}
          />
        ) : null}
      </AnimatePresence>
    </section>
  );
}

function FloatingUndoToast({
  title,
  onUndo,
}: {
  title: string;
  onUndo: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.96 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="fixed left-4 right-4 top-4 z-[70] sm:left-auto sm:right-6 sm:top-6 sm:w-[380px]"
    >
      <div className="overflow-hidden rounded-[26px] border border-emerald-300/20 bg-[linear-gradient(135deg,rgba(4,18,13,0.97),rgba(7,36,21,0.92),rgba(6,15,11,0.98))] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.35),0_0_30px_rgba(16,185,129,0.12)] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-200/70">
              Takvimden kaldırıldı
            </p>
            <p className="mt-1 truncate text-sm text-emerald-50">
              <span className="font-semibold">{title}</span> geri alınabilir.
            </p>
          </div>

          <motion.button
            type="button"
            onClick={onUndo}
            animate={{
              boxShadow: [
                "0 0 0 rgba(74,222,128,0.0)",
                "0 0 18px rgba(74,222,128,0.32)",
                "0 0 0 rgba(74,222,128,0.0)",
              ],
            }}
            transition={{ duration: 1.05, repeat: Infinity, ease: "easeInOut" }}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-200/30 bg-emerald-300/16 pl-2 pr-4 py-2 text-sm font-semibold text-emerald-50 transition hover:border-emerald-100/50 hover:bg-emerald-300/22"
          >
            <UndoCountdownRing />
            Geri al
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

function UndoCountdownRing() {
  return (
    <div className="relative h-8 w-8 shrink-0">
      <svg className="h-8 w-8 -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
        <circle
          cx="18"
          cy="18"
          r="15.5"
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="2.5"
        />
        <motion.circle
          cx="18"
          cy="18"
          r="15.5"
          fill="none"
          stroke="rgba(110,231,183,0.95)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="97.4"
          strokeDashoffset="0"
          initial={{ strokeDashoffset: 0 }}
          animate={{ strokeDashoffset: 97.4 }}
          transition={{ duration: 3, ease: "linear" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center rounded-full bg-emerald-300/10">
        <RotateCcw className="h-3.5 w-3.5 text-emerald-100" />
      </div>
    </div>
  );
}
