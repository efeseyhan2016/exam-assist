"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { CalendarPlus, FileStack, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { parseScheduleImportFile } from "@/lib/schedule-import";
import { ScheduleItemKind } from "@/lib/types";

interface ScheduleIntakeCardProps {
  onAddItem: (input: {
    title: string;
    scheduledAt: string;
    kind: ScheduleItemKind;
    notes?: string;
  }) => void;
  onAddItems?: (
    inputs: Array<{
      title: string;
      scheduledAt: string;
      kind: ScheduleItemKind;
      notes?: string;
    }>,
  ) => void;
  manualItemsCount: number;
}

export function ScheduleIntakeCard({
  onAddItem,
  onAddItems,
  manualItemsCount,
}: ScheduleIntakeCardProps) {
  const [title, setTitle] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [kind, setKind] = useState<ScheduleItemKind>("exam");
  const [notes, setNotes] = useState("");
  const [importFeedback, setImportFeedback] = useState<string | null>(null);

  const helperText = useMemo(() => {
    if (manualItemsCount === 0) {
      return "Start by adding the next missing exam or project deadline.";
    }

    return `${manualItemsCount} manual item${manualItemsCount === 1 ? "" : "s"} already added to the calendar.`;
  }, [manualItemsCount]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!title.trim() || !scheduledAt) {
      return;
    }

    onAddItem({
      title,
      scheduledAt: new Date(scheduledAt).toISOString(),
      kind,
      notes,
    });

    setTitle("");
    setScheduledAt("");
    setKind("exam");
    setNotes("");
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !onAddItems) {
      return;
    }

    const raw = await file.text();
    const result = parseScheduleImportFile(file.name, raw);

    if (result.accepted.length > 0) {
      onAddItems(result.accepted);
    }

    if (result.accepted.length === 0 && result.rejected.length > 0) {
      setImportFeedback(result.rejected[0]);
    } else if (result.rejected.length > 0) {
      setImportFeedback(
        `${result.accepted.length} item${result.accepted.length === 1 ? "" : "s"} imported, ${result.rejected.length} skipped`,
      );
    } else {
      setImportFeedback(
        `${result.accepted.length} item${result.accepted.length === 1 ? "" : "s"} imported into the calendar`,
      );
    }

    event.target.value = "";
  };

  return (
    <Card className="h-full p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Schedule intake
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-white">
            Add exams and deadlines to Home
          </h3>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
            Home should start from the real calendar. Add missing exams or project
            deadlines here and they will appear in the main timeline immediately.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3 text-sky-200">
          <CalendarPlus className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-5 rounded-[22px] border border-sky-300/18 bg-sky-300/6 p-4">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-sky-300/18 bg-sky-300/10">
            <Upload className="h-4 w-4 text-sky-100" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white">Upload a calendar file</p>
            <p className="mt-1 text-sm leading-6 text-slate-300">
              Import exams or deadlines from a local CSV, JSON, or TXT file so
              Home starts from real dates immediately.
            </p>
          </div>
        </div>

        <label className="mt-4 flex cursor-pointer items-center justify-between gap-3 rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 transition hover:border-white/15 hover:bg-black/25">
          <div>
            <p className="text-sm font-medium text-white">Choose schedule file</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              Accepts `.csv`, `.json`, `.txt` for now. PDF import is not wired yet.
            </p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-slate-300">
            Upload
          </span>
          <input
            type="file"
            accept=".csv,.json,.txt"
            className="hidden"
            onChange={handleImport}
          />
        </label>

        {importFeedback ? (
          <p className="mt-3 text-sm text-slate-300">{importFeedback}</p>
        ) : null}
      </div>

      <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-[0.78fr_0.22fr]">
          <label className="block space-y-2">
            <span className="text-sm text-slate-300">Title</span>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Retail case presentation"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-slate-300">Type</span>
            <select
              value={kind}
              onChange={(event) => setKind(event.target.value as ScheduleItemKind)}
              className="flex h-11 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="exam" className="bg-slate-950">
                Exam
              </option>
              <option value="deadline" className="bg-slate-950">
                Deadline
              </option>
            </select>
          </label>
        </div>

        <label className="block space-y-2">
          <span className="text-sm text-slate-300">Date and time</span>
          <Input
            type="datetime-local"
            value={scheduledAt}
            onChange={(event) => setScheduledAt(event.target.value)}
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm text-slate-300">Optional note</span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            placeholder="Submission room, chapter scope, or reminder"
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>

        <Button type="submit" className="w-full gap-2">
          <CalendarPlus className="h-4 w-4" />
          Add to Home calendar
        </Button>
      </form>

      <div className="mt-5 rounded-[22px] border border-white/10 bg-black/20 p-4">
        <div className="flex items-start gap-3">
          <FileStack className="mt-0.5 h-4 w-4 text-slate-300" />
          <div>
            <p className="text-sm font-medium text-white">Import path</p>
            <p className="mt-1 text-sm leading-6 text-slate-300">
              Use upload for local CSV, JSON, or TXT schedule files. Manual entry is
              here for quick corrections and missing dates. PDF reading is still not
              wired in yet.
            </p>
          </div>
        </div>
        <p className="mt-3 text-sm text-slate-400">{helperText}</p>
      </div>
    </Card>
  );
}
