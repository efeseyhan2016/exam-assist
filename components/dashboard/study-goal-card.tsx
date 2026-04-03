"use client";

import { Target, TimerReset } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatMinutesAsHours } from "@/lib/time";
import { cn } from "@/lib/utils";

interface StudyGoalCardProps {
  dailyMinutes: number;
  dailyGoalMinutes: number;
  embedded?: boolean;
}

export function StudyGoalCard({
  dailyMinutes,
  dailyGoalMinutes,
  embedded = false,
}: StudyGoalCardProps) {
  const progress = Math.min((dailyMinutes / dailyGoalMinutes) * 100, 100);
  const remaining = Math.max(dailyGoalMinutes - dailyMinutes, 0);

  return (
    <Card className={cn("p-6", embedded && "bg-white/[0.03]")}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Daily target
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-white">
            5-hour study goal
          </h3>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3 text-sky-200">
          <Target className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-4xl font-semibold text-white">
              {formatMinutesAsHours(dailyMinutes)}
            </p>
            <p className="mt-1 text-sm text-slate-300">
              logged today across all subjects
            </p>
          </div>
          <p className="text-sm text-slate-300">{progress.toFixed(0)}%</p>
        </div>
        <Progress value={progress} />
      </div>

      <div className="mt-5 flex items-center gap-3 rounded-[22px] border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
        <TimerReset className="h-4 w-4 text-emerald-300" />
        {remaining > 0
          ? `${formatMinutesAsHours(remaining)} still needed to hit today’s goal`
          : "Goal met. Any extra time becomes real buffer for the later exams."}
      </div>
    </Card>
  );
}
