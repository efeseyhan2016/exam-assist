"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CalendarArrowDown } from "lucide-react";

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

      <AnimatePresence initial={false}>
        {pendingUndoTitle && onUndoDelete ? (
          <motion.div
            key={pendingUndoTitle}
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-emerald-300/20 bg-[linear-gradient(135deg,rgba(5,20,13,0.95),rgba(8,42,22,0.88),rgba(6,18,13,0.96))] px-4 py-3.5 shadow-[0_0_40px_rgba(16,185,129,0.12)]"
          >
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-200/70">
                Silindi · 3 sn geri alma penceresi
              </p>
              <p className="mt-1 truncate text-sm text-emerald-50">
                <span className="font-semibold">{pendingUndoTitle}</span> takvimden kaldırıldı.
              </p>
            </div>

            <motion.button
              type="button"
              onClick={onUndoDelete}
              animate={{
                boxShadow: [
                  "0 0 0 rgba(52,211,153,0.0)",
                  "0 0 18px rgba(52,211,153,0.34)",
                  "0 0 0 rgba(52,211,153,0.0)",
                ],
              }}
              transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
              className="rounded-full border border-emerald-200/30 bg-emerald-300/18 px-4 py-2 text-sm font-semibold text-emerald-50 transition hover:border-emerald-100/50 hover:bg-emerald-300/24"
            >
              Undo
            </motion.button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <ExamCarousel timeline={upcomingTimeline} rankedSubjects={rankedSubjects} embedded />

      {completedTimeline.length > 0 ? (
        <CompletedExamsCard
          exams={completedTimeline}
          outcomes={examOutcomes}
          onSaveOutcome={onSaveExamOutcome}
        />
      ) : null}
    </section>
  );
}
