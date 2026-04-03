import { CalendarTimelineCard } from "@/components/dashboard/calendar-timeline-card";
import { ExamCarousel } from "@/components/dashboard/exam-carousel";
import { ScheduleIntakeCard } from "@/components/dashboard/schedule-intake-card";
import { SectionHeading } from "@/components/dashboard/section-heading";
import { RankedSubjectRisk, ScheduleItem, ScheduleItemKind } from "@/lib/types";

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
  }) => void;
  onAddScheduleItems: (inputs: Array<{
    title: string;
    scheduledAt: string;
    kind: ScheduleItemKind;
    notes?: string;
  }>) => void;
  manualItemsCount: number;
  calendarItems: Array<
    ScheduleItem & {
      countdownMs: number;
    }
  >;
  timeline: TimelineExam[];
  rankedSubjects: RankedSubjectRisk[];
}

export function ScheduleScreen({
  onAddScheduleItem,
  onAddScheduleItems,
  manualItemsCount,
  calendarItems,
  timeline,
  rankedSubjects,
}: ScheduleScreenProps) {
  return (
    <section className="space-y-6">
      <SectionHeading
        eyebrow="Takvim"
        title="Sınav ve son tarihlerini buradan yönet"
        description="Tarihleri güncel tutmak, öncelik sıralamasının doğru çalışmasını sağlar."
      />

      <div className="grid gap-4 xl:grid-cols-[0.94fr_1.06fr]">
        <ScheduleIntakeCard
          onAddItem={onAddScheduleItem}
          onAddItems={onAddScheduleItems}
          manualItemsCount={manualItemsCount}
        />
        <CalendarTimelineCard items={calendarItems} />
      </div>

      <ExamCarousel
        timeline={timeline}
        rankedSubjects={rankedSubjects}
        embedded
      />
    </section>
  );
}
