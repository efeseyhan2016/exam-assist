"use client";

import { type FormEvent, useMemo, useState } from "react";
import { BookOpenCheck, NotebookPen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { subjectSeeds } from "@/lib/seed-data";
import { formatMinutesAsHours, formatExamDate } from "@/lib/time";
import { StudySession } from "@/lib/types";
import { cn } from "@/lib/utils";

interface StudySessionFormProps {
  onAddSession: (input: {
    subjectId: (typeof subjectSeeds)[number]["id"];
    minutes: number;
    notes?: string;
  }) => void;
  sessionsToday: StudySession[];
  embedded?: boolean;
  compact?: boolean;
}

const quickMinutes = [30, 45, 60, 90];

export function StudySessionForm({
  onAddSession,
  sessionsToday,
  embedded = false,
  compact = false,
}: StudySessionFormProps) {
  const [subjectId, setSubjectId] = useState<(typeof subjectSeeds)[number]["id"]>(
    "ias",
  );
  const [minutes, setMinutes] = useState("60");
  const [notes, setNotes] = useState("");

  const totalMinutesToday = useMemo(
    () => sessionsToday.reduce((total, session) => total + session.minutes, 0),
    [sessionsToday],
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = Number(minutes);

    if (!Number.isFinite(parsed) || parsed <= 0) {
      return;
    }

    onAddSession({
      subjectId,
      minutes: parsed,
      notes,
    });
    setNotes("");
    setMinutes("60");
  };

  return (
    <Card className={cn(compact ? "p-4 sm:p-5" : "p-6", embedded && "bg-white/[0.03]")}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Manual study log
          </p>
          <h3 className={`mt-2 font-semibold text-white ${compact ? "text-xl" : "text-2xl"}`}>
            {compact ? "Log the next finished block" : "Record a finished session"}
          </h3>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
            {compact
              ? "Home should let you close the loop fast: finish a block, log it, and watch the planner respond."
              : "Finish a session, log it here, and let the ranking react. This is the main action surface for the current day."}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3 text-sky-200">
          <NotebookPen className="h-5 w-5" />
        </div>
      </div>

      <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
        <label className="block space-y-2">
          <span className="text-sm text-slate-300">Subject</span>
          <select
            value={subjectId}
            onChange={(event) =>
              setSubjectId(event.target.value as (typeof subjectSeeds)[number]["id"])
            }
            className="flex h-11 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
          >
            {subjectSeeds.map((subject) => (
              <option key={subject.id} value={subject.id} className="bg-slate-950">
                {subject.title}
              </option>
            ))}
          </select>
        </label>

        <div className="space-y-2">
          <span className="text-sm text-slate-300">Duration</span>
          <Input
            type="number"
            min={15}
            step={5}
            value={minutes}
            onChange={(event) => setMinutes(event.target.value)}
            placeholder="Minutes studied"
          />
          <div className="flex flex-wrap gap-2">
            {quickMinutes.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setMinutes(`${value}`)}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
              >
                {value}m
              </button>
            ))}
          </div>
        </div>

        {!compact ? (
          <label className="block space-y-2">
            <span className="text-sm text-slate-300">Optional note</span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              placeholder="What did you cover?"
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
        ) : null}

        <Button type="submit" className="w-full gap-2">
          <BookOpenCheck className="h-4 w-4" />
          Log session
        </Button>
      </form>

      <div className="mt-5 rounded-[22px] border border-white/10 bg-black/20 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-white">Logged today</p>
          <p className="text-sm text-slate-300">{formatMinutesAsHours(totalMinutesToday)}</p>
        </div>

        <div className="mt-4 space-y-3">
          {sessionsToday.length === 0 ? (
            <p className="text-sm leading-6 text-slate-400">
              No sessions logged yet today. The risk model will respond as soon as the
              first session lands.
            </p>
          ) : (
            sessionsToday.slice(0, compact ? 3 : 4).map((session) => {
              const subject = subjectSeeds.find(
                (item) => item.id === session.subjectId,
              );

              return (
                <div
                  key={session.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-100">
                      {subject?.shortLabel ?? session.subjectId}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatExamDate(new Date(session.createdAt))}
                    </p>
                  </div>
                  <p className="text-sm text-slate-200">{formatMinutesAsHours(session.minutes)}</p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Card>
  );
}
