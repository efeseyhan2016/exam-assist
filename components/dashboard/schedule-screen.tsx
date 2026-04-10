"use client";

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
  onDeleteScheduleItem: (id: string) => void;
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

      <div className="grid gap-4 xl:grid-cols-[0.94fr_1.06fr]">
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
    </section>
  );
}
