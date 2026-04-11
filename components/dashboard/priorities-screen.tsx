import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/dashboard/section-heading";
import { WorkspaceView } from "@/components/dashboard/workspace-nav";
import { RiskSubjectList } from "@/components/risk/risk-subject-list";
import { RankedSubjectRisk } from "@/lib/types";

interface PrioritiesScreenProps {
  subjects: RankedSubjectRisk[];
  academicSignal?: {
    title: string;
    body: string;
  } | null;
  onNavigate?: (view: WorkspaceView) => void;
}

export function PrioritiesScreen({
  subjects,
  academicSignal = null,
  onNavigate,
}: PrioritiesScreenProps) {
  return (
    <section className="space-y-6">
      <SectionHeading
        eyebrow="Öncelikler"
        title="Şu an neye odaklanmalısın"
        description={
          academicSignal
            ? "Sıralama, zaman baskısı ve bu hafta gelen akademik sinyaller birlikte değerlendirilir."
            : "Sıralama, zaman baskısı, kalan çalışma kapasitesi ve sınav tarihlerine göre güncellenir."
        }
      />
      {academicSignal ? (
        <Card className="border border-white/10 bg-white/[0.035] p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                Akademik bağlam
              </p>
              <h3 className="mt-2 text-lg font-semibold text-white">
                {academicSignal.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {academicSignal.body}
              </p>
            </div>
            {onNavigate ? (
              <Button
                type="button"
                variant="ghost"
                className="shrink-0"
                onClick={() => onNavigate("inbox")}
              >
                Inbox&apos;ı aç
              </Button>
            ) : null}
          </div>
        </Card>
      ) : null}
      <RiskSubjectList subjects={subjects} />
    </section>
  );
}
