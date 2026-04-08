"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { BookOpenCheck, NotebookPen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useResources } from "@/hooks/useResources";
import { formatMinutesAsHours, formatExamDate } from "@/lib/time";
import { StudyLaunchDraft, StudySession, StudySessionReflection, SubjectSeed } from "@/lib/types";
import { cn } from "@/lib/utils";

interface StudySessionFormProps {
  subjects: SubjectSeed[];
  onAddSession: (input: {
    subjectId: string;
    minutes: number;
    notes?: string;
    topic?: string;
    reflection?: StudySessionReflection;
  }) => void;
  sessionsToday: StudySession[];
  embedded?: boolean;
  compact?: boolean;
  launchDraft?: StudyLaunchDraft | null;
}

const quickMinutes = [30, 45, 60, 90];
const reflectionOptions: Array<{ value: StudySessionReflection; label: string }> = [
  { value: "good", label: "İyi geçti" },
  { value: "surface", label: "Yüzeyde kaldı" },
  { value: "stuck", label: "Takıldım" },
];

export function StudySessionForm({
  subjects,
  onAddSession,
  sessionsToday,
  embedded = false,
  compact = false,
  launchDraft = null,
}: StudySessionFormProps) {
  const { resources } = useResources();
  const [subjectId, setSubjectId] = useState<string>(
    subjects[0]?.id ?? "",
  );
  const [minutes, setMinutes] = useState("60");
  const [notes, setNotes] = useState("");
  const [topic, setTopic] = useState("");
  const [reflection, setReflection] = useState<StudySessionReflection | undefined>(undefined);
  const topicOptions = useMemo(
    () =>
      [...new Set(
        resources
          .filter((resource) => resource.subjectId === subjectId)
          .flatMap((resource) => resource.topicHints ?? []),
      )].slice(0, 8),
    [resources, subjectId],
  );

  const totalMinutesToday = useMemo(
    () => sessionsToday.reduce((total, session) => total + session.minutes, 0),
    [sessionsToday],
  );

  useEffect(() => {
    if (!launchDraft) {
      return;
    }

    setSubjectId(launchDraft.subjectId);
    setMinutes(String(launchDraft.minutes));
    setTopic(launchDraft.topic ?? "");
    setNotes("");
    setReflection(undefined);
  }, [launchDraft]);

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
      topic,
      reflection,
    });
    setNotes("");
    setMinutes("60");
    setTopic("");
    setReflection(undefined);
  };

  return (
    <Card className={cn(compact ? "p-4 sm:p-5" : "p-6", embedded && "bg-white/[0.03]")}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Çalışma Seansı
          </p>
          <h3 className={`mt-2 font-semibold text-white ${compact ? "text-xl" : "text-2xl"}`}>
            {compact ? "Tamamlanan bloğu kaydet" : "Çalışma seansı ekle"}
          </h3>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
            {compact
              ? "Bitirdiğin bloğu kaydet, öncelik sıralaması otomatik güncellenir."
              : "Seansı bitir, buraya kaydet ve sıralamanın tepkisini izle. Günün ana eylem alanı burasıdır."}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3 text-sky-200">
          <NotebookPen className="h-5 w-5" />
        </div>
      </div>

      <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
        {launchDraft ? (
          <div className="rounded-[18px] border border-sky-400/20 bg-sky-400/8 px-3.5 py-3 text-sm text-slate-200">
            <p className="font-medium text-white">Öneri hazır</p>
            <p className="mt-1 leading-6 text-slate-300">
              {launchDraft.minutes} dakikalık blok formda hazır.
              {launchDraft.topic ? ` Konu: ${launchDraft.topic}.` : ""}
              {launchDraft.sourceLabel ? ` Çıkış noktası: ${launchDraft.sourceLabel}.` : ""}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              İstersen dersi, süreyi veya konuyu buradan değiştirebilirsin.
            </p>
          </div>
        ) : null}

        <label className="block space-y-2">
          <span className="text-sm text-slate-300">Ders</span>
          <select
            value={subjectId}
            onChange={(event) => {
              setSubjectId(event.target.value);
              setTopic("");
            }}
            className="flex h-11 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
          >
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id} className="bg-slate-950">
                {subject.title}
              </option>
            ))}
          </select>
        </label>

        <div className="space-y-2">
          <span className="text-sm text-slate-300">Süre</span>
          <Input
            type="number"
            min={15}
            step={5}
            value={minutes}
            onChange={(event) => setMinutes(event.target.value)}
            placeholder="Dakika"
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

        <div className="space-y-2">
          <span className="text-sm text-slate-300">Nasıl geçti? (isteğe bağlı)</span>
          <div className="flex flex-wrap gap-2">
            {reflectionOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  setReflection((current) => (current === option.value ? undefined : option.value))
                }
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs transition",
                  reflection === option.value
                    ? "border-sky-400/30 bg-sky-400/10 text-sky-200"
                    : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {topicOptions.length > 0 ? (
          <label className="block space-y-2">
            <span className="text-sm text-slate-300">Konu (isteğe bağlı)</span>
            <select
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              className="flex h-11 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="" className="bg-slate-950">
                Konu seçmeden kaydet
              </option>
              {topicOptions.map((option) => (
                <option key={option} value={option} className="bg-slate-950">
                  {option}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {!compact ? (
          <label className="block space-y-2">
            <span className="text-sm text-slate-300">Not (isteğe bağlı)</span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              placeholder="Ne çalıştın?"
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
        ) : null}

        <Button type="submit" className="w-full gap-2">
          <BookOpenCheck className="h-4 w-4" />
          Seansı kaydet
        </Button>
      </form>

      <div className="mt-5 rounded-[22px] border border-white/10 bg-black/20 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-white">Bugün çalışılan</p>
          <p className="text-sm text-slate-300">{formatMinutesAsHours(totalMinutesToday)}</p>
        </div>

        <div className="mt-4 space-y-3">
          {sessionsToday.length === 0 ? (
            <p className="text-sm leading-6 text-slate-400">
              Bugün henüz seans eklenmedi. İlk seans eklendiğinde öncelik sıralaması güncellenir.
            </p>
          ) : (
            sessionsToday.slice(0, compact ? 3 : 4).map((session) => {
              const subject = subjects.find(
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
                    {session.topic ? (
                      <p className="mt-1 text-[11px] text-sky-200/80">{session.topic}</p>
                    ) : null}
                    {session.reflection ? (
                      <p className="mt-1 text-[11px] text-slate-500">
                        {session.reflection === "good"
                          ? "İyi geçti"
                          : session.reflection === "surface"
                            ? "Yüzeyde kaldı"
                            : "Takıldım"}
                      </p>
                    ) : null}
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
