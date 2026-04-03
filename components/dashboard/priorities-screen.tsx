import { SectionHeading } from "@/components/dashboard/section-heading";
import { RiskSubjectList } from "@/components/risk/risk-subject-list";
import { RankedSubjectRisk } from "@/lib/types";

interface PrioritiesScreenProps {
  subjects: RankedSubjectRisk[];
}

export function PrioritiesScreen({ subjects }: PrioritiesScreenProps) {
  return (
    <section className="space-y-6">
      <SectionHeading
        eyebrow="Priorities"
        title="See what deserves the next serious block"
        description="The risk board lives on its own screen now, so it can stay readable and believable instead of competing with the rest of the workspace."
      />
      <RiskSubjectList subjects={subjects} />
    </section>
  );
}
