import { PlanningFocusCard } from "@/components/dashboard/planning-focus-card";
import { SectionHeading } from "@/components/dashboard/section-heading";
import { StudyGoalCard } from "@/components/dashboard/study-goal-card";
import { StudySessionForm } from "@/components/dashboard/study-session-form";
import { RankedSubjectRisk, StudySession, SubjectId } from "@/lib/types";

interface SessionsScreenProps {
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
        eyebrow="Sessions"
        title="Log finished work and let the planner respond"
        description="This screen is only for today's execution: record a completed study block, keep the daily target in view, and sense-check the current focus."
      />

      <div className="grid gap-4 xl:grid-cols-[1.06fr_0.94fr]">
        <StudySessionForm
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
