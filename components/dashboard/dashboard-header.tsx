import { BrainCircuit, CalendarDays } from "lucide-react";

interface DashboardHeaderProps {
  nextExamLabel: string;
  focusLabel: string;
}

export function DashboardHeader({
  nextExamLabel,
  focusLabel,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs uppercase tracking-[0.22em] text-slate-300">
          Local-first
          <span className="h-1 w-1 rounded-full bg-emerald-300" />
          Exam week workspace
        </div>

        <div>
          <h1 className="text-3xl font-semibold text-white sm:text-[2.6rem]">
            Exam Command Center
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
            Home keeps the calendar and the current planning focus visible without
            forcing the whole workspace onto one screen.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:hidden lg:min-w-[420px]">
        <HeaderPill
          icon={CalendarDays}
          label="Next exam"
          value={nextExamLabel}
        />
        <HeaderPill
          icon={BrainCircuit}
          label="Planning focus"
          value={focusLabel}
        />
      </div>
    </div>
  );
}

function HeaderPill({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-black/20 px-4 py-3">
      <Icon className="h-4 w-4 text-slate-200" />
      <p className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
