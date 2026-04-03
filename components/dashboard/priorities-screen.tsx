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
        eyebrow="Öncelikler"
        title="Şu an neye odaklanmalısın"
        description="Sıralama, zaman baskısı, kalan çalışma kapasitesi ve sınav tarihlerine göre güncellenir."
      />
      <RiskSubjectList subjects={subjects} />
    </section>
  );
}
