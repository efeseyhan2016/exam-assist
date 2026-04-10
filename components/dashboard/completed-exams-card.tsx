"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCheck, NotebookPen, Trophy } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatExamDate } from "@/lib/time";
import { ExamOutcome } from "@/lib/types";
import {
  ExamOutcomeDraft,
  buildExamOutcomeDrafts,
  getExamOutcomeStatus,
  indexExamOutcomesByExamId,
} from "@/lib/exam-outcomes";

interface TimelineExam {
  id: string;
  subjectId: string;
  title: string;
  shortLabel: string;
  scheduledAt: string;
  scheduledAtDate: Date;
  countdown: {
    totalMilliseconds: number;
  };
}

interface CompletedExamsCardProps {
  exams: TimelineExam[];
  outcomes: ExamOutcome[];
  onSaveOutcome: (input: {
    examId: string;
    subjectId: string;
    score?: number;
    notes?: string;
  }) => void;
}

export function CompletedExamsCard({
  exams,
  outcomes,
  onSaveOutcome,
}: CompletedExamsCardProps) {
  const outcomesByExamId = useMemo(
    () => indexExamOutcomesByExamId(outcomes),
    [outcomes],
  );
  const [drafts, setDrafts] = useState<Record<string, ExamOutcomeDraft>>({});
  const [dirtyDraftIds, setDirtyDraftIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setDrafts((current) =>
      buildExamOutcomeDrafts(exams, outcomesByExamId, current, {
        dirtyExamIds: dirtyDraftIds,
      }),
    );
  }, [dirtyDraftIds, exams, outcomesByExamId]);

  const recordedCount = outcomes.filter((outcome) => outcome.score !== undefined).length;

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Geçen sınavlar
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-white">
            Biten sınavları kapat
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
            Buraya sonuç notunu ve kısa değerlendirmeni gir. Bu veri daha sonra hangi
            çalışma yaklaşımının işe yaradığını anlamamız için birikmeye başlar.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3 text-emerald-200">
          <Trophy className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300">
          {exams.length} tamamlanan sınav
        </span>
        <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs text-emerald-100">
          {recordedCount} sonuç notu girildi
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {exams.map((exam) => {
          const outcome = outcomesByExamId[exam.id];
          const draft = drafts[exam.id] ?? { score: "", notes: "" };
          const canSave = draft.score.trim().length > 0 || draft.notes.trim().length > 0;

          return (
            <div
              key={exam.id}
              className="rounded-[24px] border border-white/10 bg-black/20 p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-semibold text-white">{exam.title}</p>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-slate-300">
                      {getExamOutcomeStatus(outcome)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-400">
                    {formatExamDate(exam.scheduledAtDate)}
                  </p>
                  {outcome?.updatedAt ? (
                    <p className="mt-1 text-xs text-slate-500">
                      Son güncelleme:{" "}
                      {new Intl.DateTimeFormat("tr-TR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(outcome.updatedAt))}
                    </p>
                  ) : null}
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-right">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                    Sonuç notu
                  </p>
                  <p className="mt-2 text-xl font-semibold text-white">
                    {outcome?.score !== undefined ? outcome.score : "--"}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-[180px_minmax(0,1fr)_auto] lg:items-end">
                <label className="space-y-2">
                  <span className="text-sm text-slate-300">Notu gir</span>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={draft.score}
                    onChange={(event) => {
                      setDirtyDraftIds((current) => new Set(current).add(exam.id));
                      setDrafts((current) => ({
                        ...current,
                        [exam.id]: {
                          ...(current[exam.id] ?? { score: "", notes: "" }),
                          score: event.target.value,
                        },
                      }));
                    }}
                    placeholder="0-100"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm text-slate-300">Kısa değerlendirme</span>
                  <textarea
                    value={draft.notes}
                    onChange={(event) => {
                      setDirtyDraftIds((current) => new Set(current).add(exam.id));
                      setDrafts((current) => ({
                        ...current,
                        [exam.id]: {
                          ...(current[exam.id] ?? { score: "", notes: "" }),
                          notes: event.target.value,
                        },
                      }));
                    }}
                    rows={2}
                    placeholder="Nasıl geçti, nerede zorladı, neyi eksik bıraktı?"
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </label>

                <Button
                  type="button"
                  variant={outcome ? "secondary" : "default"}
                  className="gap-2"
                  disabled={!canSave}
                  onClick={() => {
                    const parsedScore = Number(draft.score);
                    setDirtyDraftIds((current) => {
                      const next = new Set(current);
                      next.delete(exam.id);
                      return next;
                    });
                    onSaveOutcome({
                      examId: exam.id,
                      subjectId: exam.subjectId,
                      score:
                        draft.score.trim().length > 0 && Number.isFinite(parsedScore)
                          ? Math.max(0, Math.min(100, parsedScore))
                          : undefined,
                      notes: draft.notes,
                    });
                  }}
                >
                  {outcome ? <CheckCheck className="h-4 w-4" /> : <NotebookPen className="h-4 w-4" />}
                  {outcome ? "Güncelle" : "Kaydet"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
