import { BrainCircuit, CalendarDays, Clock3, MapPin, Target } from "lucide-react";

import { Card } from "@/components/ui/card";
import { formatMinutesAsHours } from "@/lib/time";
import { workspaceProfile } from "@/lib/seed-data";
import { WorkspaceNav, WorkspaceView } from "@/components/dashboard/workspace-nav";

interface DashboardSidebarProps {
  activeView: WorkspaceView;
  onSelectView: (view: WorkspaceView) => void;
  nextExamLabel: string;
  focusLabel: string;
  dailyMinutes: number;
}

export function DashboardSidebar({
  activeView,
  onSelectView,
  nextExamLabel,
  focusLabel,
  dailyMinutes,
}: DashboardSidebarProps) {
  return (
    <Card className="sticky top-4 hidden max-h-[calc(100vh-2rem)] overflow-hidden lg:flex lg:flex-col">
      <div className="flex h-full flex-col overflow-y-auto p-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-slate-300">
          Local-first
          <span className="h-1 w-1 rounded-full bg-emerald-300" />
          Pack 1
        </div>
          <h2 className="mt-3 text-xl font-semibold text-white">
            {workspaceProfile.firstName}&apos;s workspace
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Home is the control center. The other screens only open deeper detail.
          </p>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
          <CompactSignal icon={MapPin} label="Location" value={workspaceProfile.city} />
          <CompactSignal icon={Clock3} label="Mode" value="Local-first" />
        </div>

        <div className="mt-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
            Navigate
          </p>
          <div className="mt-3">
            <WorkspaceNav
              activeView={activeView}
              onSelectView={onSelectView}
              minimal
            />
          </div>
        </div>

        <div className="mt-5 rounded-[22px] border border-white/8 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
            Current snapshot
          </p>
          <div className="mt-4 space-y-3">
            <SnapshotRow icon={CalendarDays} label="Next exam" value={nextExamLabel} />
            <SnapshotRow icon={Target} label="Logged today" value={formatMinutesAsHours(dailyMinutes)} />
            <SnapshotRow icon={BrainCircuit} label="Planning focus" value={focusLabel} />
          </div>
        </div>
      </div>
    </Card>
  );
}

function CompactSignal({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[18px] border border-white/8 bg-black/20 px-3 py-3">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-sky-200" />
        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">{label}</p>
      </div>
      <p className="mt-2 text-sm font-medium text-white">{value}</p>
    </div>
  );
}

function SnapshotRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[18px] border border-white/8 bg-white/[0.03] px-3 py-3">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/20">
        <Icon className="h-4 w-4 text-slate-200" />
      </span>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{label}</p>
        <p className="mt-1 truncate text-sm font-medium text-white">{value}</p>
      </div>
    </div>
  );
}
