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
            Planning focus
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
            {nextExamTitle} comes first on the calendar.
            <span className="mx-2 inline-flex items-center">
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </span>
            {topRisk.title} still needs the clearest attention next.
          </p>
        ) : (
          <p className="text-sm leading-6 text-slate-300">
            The closest deadline and the planning focus are aligned, so the next
            session can go directly into this subject.
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          <MetricTile
            label="Guidance"
            value={getGuidanceCopy(topRisk.label).badge}
            caption={getGuidanceCopy(topRisk.label).summary}
          />
          <MetricTile
            label="Work remaining"
            value={formatPlannedHours(topRisk.remainingTargetHours)}
            caption={`target ${formatPlannedHours(topRisk.targetHours)}`}
          />
          <MetricTile
            label="Study window"
            value={formatApproxHours(topRisk.effectiveStudyHoursLeft)}
            caption="usable time left before exam"
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
