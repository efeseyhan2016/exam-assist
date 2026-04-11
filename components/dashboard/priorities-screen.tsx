import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/dashboard/section-heading";
import { WorkspaceView } from "@/components/dashboard/workspace-nav";
import { RiskSubjectList } from "@/components/risk/risk-subject-list";
import { ResourceBinding } from "@/lib/resource-document-binding";
import { cn } from "@/lib/utils";
import { RankedSubjectRisk } from "@/lib/types";

interface PrioritiesScreenProps {
  subjects: RankedSubjectRisk[];
  academicSignal?: {
    title: string;
    body: string;
  } | null;
  examResourceBindings?: ResourceBinding[];
  onNavigate?: (view: WorkspaceView) => void;
}

export function PrioritiesScreen({
  subjects,
  academicSignal = null,
  examResourceBindings = [],
  onNavigate,
}: PrioritiesScreenProps) {
  // Build a lookup: subjectId → binding
  const bindingBySubject = new Map(
    examResourceBindings.map((b) => [b.subjectId, b]),
  );

  // Show coverage panel only when there's meaningful signal
  const coverageEntries = subjects
    .map((s) => ({ subject: s, binding: bindingBySubject.get(s.subjectId) }))
    .filter((entry) => entry.binding && entry.binding.coverageStatus !== "strong");

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

      {coverageEntries.length > 0 ? (
        <Card className="border border-white/10 bg-white/[0.035] p-4 sm:p-5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
            Sınav kaynak durumu
          </p>
          <h3 className="mt-2 text-base font-semibold text-white">
            Bazı derslerin sınav hazırlık kaynakları eksik
          </h3>
          <div className="mt-3 space-y-2">
            {coverageEntries.map(({ subject, binding }) =>
              binding ? (
                <div
                  key={subject.subjectId}
                  className={cn(
                    "flex items-start gap-3 rounded-2xl border px-3.5 py-2.5",
                    binding.coverageStatus === "partial"
                      ? "border-amber-300/15 bg-amber-300/[0.05]"
                      : "border-white/8 bg-white/[0.03]",
                  )}
                >
                  <span
                    className={cn(
                      "mt-1 h-1.5 w-1.5 shrink-0 rounded-full",
                      binding.coverageStatus === "partial"
                        ? "bg-amber-400"
                        : "bg-slate-500",
                    )}
                  />
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-300">
                      {subject.shortLabel} · {binding.coverageLabel}
                    </p>
                    <p className="mt-0.5 text-sm leading-5 text-slate-400">
                      {binding.coverageBody}
                    </p>
                  </div>
                </div>
              ) : null,
            )}
          </div>
          {onNavigate ? (
            <div className="mt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onNavigate("library")}
              >
                Kütüphaneyi aç
              </Button>
            </div>
          ) : null}
        </Card>
      ) : null}
    </section>
  );
}
