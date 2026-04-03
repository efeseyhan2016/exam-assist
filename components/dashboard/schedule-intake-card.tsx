"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { CalendarPlus, FileStack, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  getSupportedScheduleImportExtensions,
  parseScheduleImportFile,
} from "@/lib/schedule-import";
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
  compact?: boolean;
}

export function ScheduleIntakeCard({
  onAddItem,
  onAddItems,
  manualItemsCount,
  compact = false,
}: ScheduleIntakeCardProps) {
  const [title, setTitle] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [kind, setKind] = useState<ScheduleItemKind>("exam");
  const [notes, setNotes] = useState("");
  const [importFeedback, setImportFeedback] = useState<string | null>(null);
  const acceptedExtensions = getSupportedScheduleImportExtensions().join(",");

  const helperText = useMemo(() => {
    if (manualItemsCount === 0) {
      return "Eksik sınav veya son tarihi buradan ekleyebilirsin.";
    }

    return `${manualItemsCount} tarih takvime eklendi.`;
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

    const result = await parseScheduleImportFile(file);

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
    <Card className={`h-full ${compact ? "p-4 sm:p-5" : "p-5 sm:p-6"}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Takvim
          </p>
          <h3 className={`mt-2 font-semibold text-white ${compact ? "text-xl" : "text-2xl"}`}>
            {compact ? "Takvimi hızlı doldur" : "Sınav ve son tarihleri ekle"}
          </h3>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
            {compact
              ? "Takvim dosyası yükle ya da eksik bir tarihi manuel ekle."
              : "Gerçek takvimden başlamak için eksik sınavları veya son tarihleri buradan ekle. Ana zaman çizelgesine hemen yansır."}
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
            <p className="text-sm font-medium text-white">Takvim dosyası yükle</p>
            <p className="mt-1 text-sm leading-6 text-slate-300">
              CSV, JSON, TXT, PDF, Word veya Excel formatında sınav ve tarihleri içe aktar.
            </p>
          </div>
        </div>

        <label className="mt-4 flex cursor-pointer items-center justify-between gap-3 rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 transition hover:border-white/15 hover:bg-black/25">
          <div>
            <p className="text-sm font-medium text-white">Dosya seç</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              .csv, .json, .txt, .pdf, .docx, .xlsx, .xls desteklenir.
            </p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-slate-300">
            Yükle
          </span>
          <input
            type="file"
            accept={acceptedExtensions}
            className="hidden"
            onChange={handleImport}
          />
        </label>

        {importFeedback ? (
          <p className="mt-3 text-sm text-slate-300">{importFeedback}</p>
        ) : null}
      </div>

      <form className={`mt-5 space-y-4 ${compact ? "border-t border-white/8 pt-5" : ""}`} onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-[0.78fr_0.22fr]">
          <label className="block space-y-2">
            <span className="text-sm text-slate-300">Başlık</span>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Dönem sonu sınavı"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-slate-300">Tür</span>
            <select
              value={kind}
              onChange={(event) => setKind(event.target.value as ScheduleItemKind)}
              className="flex h-11 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="exam" className="bg-slate-950">
                Sınav
              </option>
              <option value="deadline" className="bg-slate-950">
                Son tarih
              </option>
            </select>
          </label>
        </div>

        <label className="block space-y-2">
          <span className="text-sm text-slate-300">Tarih ve saat</span>
          <Input
            type="datetime-local"
            value={scheduledAt}
            onChange={(event) => setScheduledAt(event.target.value)}
          />
        </label>

        {!compact ? (
          <label className="block space-y-2">
            <span className="text-sm text-slate-300">Not (isteğe bağlı)</span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              placeholder="Sınav odası, konu kapsamı veya hatırlatma"
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
        ) : null}

        <Button type="submit" className="w-full gap-2">
          <CalendarPlus className="h-4 w-4" />
          Takvime ekle
        </Button>
      </form>

      <div className="mt-5 rounded-[22px] border border-white/10 bg-black/20 p-4">
        <div className="flex items-start gap-3">
          <FileStack className="mt-0.5 h-4 w-4 text-slate-300" />
          <div>
            <p className="text-sm font-medium text-white">Desteklenen formatlar</p>
            <p className="mt-1 text-sm leading-6 text-slate-300">
              {compact
                ? "CSV, JSON, TXT, PDF, DOCX ve Excel desteklenir."
                : "Yerel dosya için yükleme kullan. Manuel giriş hızlı düzeltme ve eksik tarihler içindir."}
            </p>
          </div>
        </div>
        <p className="mt-3 text-sm text-slate-400">{helperText}</p>
      </div>
    </Card>
  );
}
