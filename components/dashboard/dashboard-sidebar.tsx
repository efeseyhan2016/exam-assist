import { BrainCircuit, CalendarDays, Clock3, MapPin, Target } from "lucide-react";

import { Card } from "@/components/ui/card";
import { formatMinutesAsHours } from "@/lib/time";
import { PlanningRuntimeProfile } from "@/lib/planning-runtime";
import { WorkspaceNav, WorkspaceView } from "@/components/dashboard/workspace-nav";

interface DashboardSidebarProps {
  activeView: WorkspaceView;
  onSelectView: (view: WorkspaceView) => void;
  nextExamLabel: string;
  focusLabel: string;
  dailyMinutes: number;
  profile: PlanningRuntimeProfile;
}

export function DashboardSidebar({
  activeView,
  onSelectView,
  nextExamLabel,
  focusLabel,
  dailyMinutes,
  profile,
}: DashboardSidebarProps) {
  return (
    <Card className="sticky top-4 hidden max-h-[calc(100vh-2rem)] overflow-hidden lg:flex lg:flex-col">
      <div className="flex h-full flex-col overflow-y-auto p-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
            EXAM ASSIST
          </div>
          <h2 className="mt-3 text-xl font-semibold text-white">
            {profile.fullName.split(" ")[0]}&apos;nin çalışma alanı
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Sınavlarını, önceliklerini ve çalışma seanslarını buradan yönet.
          </p>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
          <CompactSignal icon={MapPin} label="Konum" value={profile.city} />
          <CompactSignal icon={Clock3} label="Mod" value="Yerel depolama" />
        </div>

        <div className="mt-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
            Gezin
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
            Anlık durum
          </p>
          <div className="mt-4 space-y-3">
            <SnapshotRow icon={CalendarDays} label="Sıradaki sınav" value={nextExamLabel} />
            <SnapshotRow icon={Target} label="Bugün çalışılan" value={formatMinutesAsHours(dailyMinutes)} />
            <SnapshotRow icon={BrainCircuit} label="Öncelikli ders" value={focusLabel} />
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
