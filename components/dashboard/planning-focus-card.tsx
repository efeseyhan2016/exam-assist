import { AlertTriangle, ArrowRight } from "lucide-react";

import { Card } from "@/components/ui/card";
import { getGuidanceCopy } from "@/lib/risk-presentation";
import { formatApproxHours, formatPlannedHours } from "@/lib/time";
import { RankedSubjectRisk } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PlanningFocusCardProps {
  topRisk: RankedSubjectRisk | null;
  nextExamTitle: string | null;
  embedded?: boolean;
}

export function PlanningFocusCard({
  topRisk,
  nextExamTitle,
  embedded = false,
}: PlanningFocusCardProps) {
  if (!topRisk) {
    return null;
  }

  const differsFromNextExam = nextExamTitle !== null && nextExamTitle !== topRisk.examTitle;

  return (
    <Card className={cn("p-6", embedded && "h-full rounded-[26px] bg-white/[0.035]")}>
      <div className="flex h-full flex-col gap-5">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-300" />
            Öncelikli Ders
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-white">{topRisk.title}</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              {topRisk.explanation}
            </p>
          </div>
        </div>

        {differsFromNextExam ? (
          <p className="text-sm leading-6 text-slate-300">
            Takvimde önce {nextExamTitle} geliyor.
            <span className="mx-2 inline-flex items-center">
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </span>
            Yine de şu an en fazla dikkati {topRisk.title} hak ediyor.
          </p>
        ) : (
          <p className="text-sm leading-6 text-slate-300">
            En yakın sınav ve öncelikli ders örtüşüyor — bir sonraki seans direkt bu derse gidebilir.
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          <MetricTile
            label="Durum"
            value={getGuidanceCopy(topRisk.label).badge}
            caption={getGuidanceCopy(topRisk.label).summary}
          />
          <MetricTile
            label="Kalan çalışma"
            value={formatPlannedHours(topRisk.remainingTargetHours)}
            caption={`hedef ${formatPlannedHours(topRisk.targetHours)} saat`}
          />
          <MetricTile
            label="Müsait süre"
            value={formatApproxHours(topRisk.effectiveStudyHoursLeft)}
            caption="sınava kadar kullanılabilir süre"
          />
        </div>
      </div>
    </Card>
  );
}

function MetricTile({
  label,
  value,
  caption,
}: {
  label: string;
  value: string;
  caption: string;
}) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-sm leading-6 text-slate-300">{caption}</p>
    </div>
  );
}
