import { PlanningFocusCard } from "@/components/dashboard/planning-focus-card";
import { SectionHeading } from "@/components/dashboard/section-heading";
import { StudyGoalCard } from "@/components/dashboard/study-goal-card";
import { StudySessionForm } from "@/components/dashboard/study-session-form";
import { RankedSubjectRisk, StudySession, SubjectId, SubjectSeed } from "@/lib/types";

interface SessionsScreenProps {
  subjects: SubjectSeed[];
  onAddSession: (input: {
    subjectId: SubjectId;
    minutes: number;
    notes?: string;
  }) => void;
  sessionsToday: StudySession[];
  dailyMinutes: number;
  dailyGoalMinutes: number;
  topRisk: RankedSubjectRisk | null;
  nextExamTitle: string | null;
}

export function SessionsScreen({
  subjects,
  onAddSession,
  sessionsToday,
  dailyMinutes,
  dailyGoalMinutes,
  topRisk,
  nextExamTitle,
}: SessionsScreenProps) {
  return (
    <section className="space-y-6">
      <SectionHeading
        eyebrow="Seanslar"
        title="Çalışmalarını kaydet, ilerlemeni gör"
        description="Tamamladığın çalışma bloklarını buraya ekle. Öncelik sıralaması ve günlük hedef otomatik güncellenir."
      />

      <div className="grid gap-4 xl:grid-cols-[1.06fr_0.94fr]">
        <StudySessionForm
          subjects={subjects}
          onAddSession={onAddSession}
          sessionsToday={sessionsToday}
          embedded
        />

        <div className="grid gap-4">
          <StudyGoalCard
            dailyMinutes={dailyMinutes}
            dailyGoalMinutes={dailyGoalMinutes}
            embedded
          />
          <PlanningFocusCard
            topRisk={topRisk}
            nextExamTitle={nextExamTitle}
            embedded
          />
        </div>
      </div>
    </section>
  );
}
