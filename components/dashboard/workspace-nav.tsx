import {
  CalendarRange,
  House,
  ListChecks,
  NotebookPen,
} from "lucide-react";

import { cn } from "@/lib/utils";

export type WorkspaceView = "home" | "priorities" | "sessions" | "schedule";

export const workspaceNavItems = [
  {
    id: "home" as const,
    label: "Home",
    description: "Calendar-first control center",
    icon: House,
  },
  {
    id: "priorities" as const,
    label: "Priorities",
    description: "See what deserves the next block",
    icon: ListChecks,
  },
  {
    id: "sessions" as const,
    label: "Sessions",
    description: "Log study and track today's output",
    icon: NotebookPen,
  },
  {
    id: "schedule" as const,
    label: "Schedule",
    description: "Maintain exams and deadlines",
    icon: CalendarRange,
  },
];

interface WorkspaceNavProps {
  activeView: WorkspaceView;
  onSelectView: (view: WorkspaceView) => void;
  compact?: boolean;
  minimal?: boolean;
}

export function WorkspaceNav({
  activeView,
  onSelectView,
  compact = false,
  minimal = false,
}: WorkspaceNavProps) {
  return (
    <div className={cn(compact ? "grid grid-cols-2 gap-2 sm:grid-cols-4" : "space-y-2")}>
      {workspaceNavItems.map(({ id, label, description, icon: Icon }) => {
        const isActive = id === activeView;

        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelectView(id)}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "w-full rounded-[22px] border text-left transition",
              compact
                ? "px-3 py-3"
                : minimal
                  ? "px-3.5 py-3"
                  : "px-4 py-3.5",
              isActive
                ? "border-sky-300/30 bg-sky-300/10 text-white"
                : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/15 hover:bg-white/[0.05] hover:text-white",
            )}
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "inline-flex h-9 w-9 items-center justify-center rounded-full border",
                  isActive
                    ? "border-sky-300/30 bg-sky-300/12 text-sky-100"
                    : "border-white/10 bg-black/20 text-slate-300",
                )}
              >
                <Icon className="h-4 w-4" />
              </span>

              <div className="min-w-0">
                <p className="text-sm font-medium">{label}</p>
                {!compact && !minimal ? (
                  <p className="mt-0.5 text-xs leading-5 text-slate-400">{description}</p>
                ) : null}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
