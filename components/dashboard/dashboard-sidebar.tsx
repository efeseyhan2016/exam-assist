import { BrainCircuit, CalendarDays, Clock3, LogOut, MapPin, Target, Trash2 } from "lucide-react";

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
  studyStreak: number;
  profile: PlanningRuntimeProfile;
  onLogout: () => void;
  onReset: () => void;
}

export function DashboardSidebar({
  activeView,
  onSelectView,
  nextExamLabel,
  focusLabel,
  dailyMinutes,
  studyStreak,
  profile,
  onLogout,
  onReset,
}: DashboardSidebarProps) {
  return (
    <Card className="sticky top-4 hidden max-h-[calc(100vh-2rem)] overflow-hidden lg:flex lg:flex-col">
      <div className="flex h-full flex-col overflow-y-auto p-4">
        <div>
          <div className="flex items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
              EXAM ASSIST
            </div>
            {/* Streak badge — always visible at top */}
            <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 ${
              studyStreak > 0
                ? "border-amber-500/25 bg-amber-500/[0.08]"
                : "border-white/8 bg-white/[0.03]"
            }`}>
              <svg viewBox="0 0 16 20" fill="none" className="h-3 w-3 shrink-0" aria-hidden>
                <path d="M8 19C2 16 1 11 2 7C3 5 4 3 6 2C7 1 8 0 8 0C9 1 10 1 11 2C13 4 14 6 14 8C15 13 13 17 8 19Z"
                  fill={studyStreak > 0 ? "#f97316" : "rgba(100,100,120,0.5)"} />
                <path d="M8 15C5 13 5 9 7 7C7.5 6 8 5 8 4C8.5 5 9 6 9.5 7C10.5 9 10.5 13 8 15Z"
                  fill={studyStreak > 0 ? "#fde68a" : "rgba(80,80,100,0.3)"} />
              </svg>
              <span className={`text-[11px] font-semibold tabular-nums ${studyStreak > 0 ? "text-amber-300" : "text-slate-600"}`}>
                {studyStreak}
              </span>
              <span className={`text-[10px] uppercase tracking-[0.12em] ${studyStreak > 0 ? "text-amber-500/70" : "text-slate-700"}`}>
                gün
              </span>
            </div>
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

        <div className="mt-auto space-y-2">
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-2 rounded-[18px] border border-white/8 bg-white/[0.02] px-4 py-3 text-sm text-slate-500 transition hover:border-sky-400/20 hover:bg-sky-400/[0.04] hover:text-sky-300"
          >
            <LogOut className="h-4 w-4" />
            Çıkış Yap
          </button>
          <button
            type="button"
            onClick={onReset}
            className="flex w-full items-center gap-2 rounded-[18px] border border-white/8 bg-white/[0.02] px-4 py-2.5 text-xs text-slate-600 transition hover:border-rose-400/20 hover:bg-rose-400/[0.04] hover:text-rose-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Hesabı sıfırla
          </button>
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
