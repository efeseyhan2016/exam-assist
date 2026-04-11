"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { CalendarPlus, CheckCircle2, ChevronDown, FileStack, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  getSupportedScheduleImportExtensions,
  inferScheduleItemKindFromText,
  parseScheduleImportFile,
} from "@/lib/schedule-import";
import {
  DifficultyCalibrationAnswer,
  PreparednessAnswer,
  ResourceReadinessAnswer,
  ScheduleItemKind,
  SubjectCalibrationAnswers,
} from "@/lib/types";

interface ScheduleIntakeCardProps {
  onAddItem: (input: {
    title: string;
    scheduledAt: string;
    kind: ScheduleItemKind;
    notes?: string;
    calibration?: SubjectCalibrationAnswers;
  }) => void;
  onAddItems?: (
    inputs: Array<{
      title: string;
      scheduledAt: string;
      kind: ScheduleItemKind;
      notes?: string;
      calibration?: SubjectCalibrationAnswers;
    }>,
  ) => void;
  manualItemsCount: number;
  compact?: boolean;
}

interface ImportedCandidate {
  id: string;
  title: string;
  scheduledAt: string;
  kind: ScheduleItemKind;
  notes?: string;
  selected: boolean;
}

const difficultyLabels: Record<DifficultyCalibrationAnswer, string> = {
  az: "Rahat",
  orta: "Orta",
  zor: "Zor",
};

const resourceLabels: Record<ResourceReadinessAnswer, string> = {
  hazir: "Hazır",
  kismen: "Kısmen",
  eksik: "Eksik",
};

const preparednessLabels: Record<PreparednessAnswer, string> = {
  iyi: "İyi",
  biraz: "Biraz baktım",
  az: "Henüz başlamadım",
};

const kindLabels: Record<ScheduleItemKind, string> = {
  exam: "Sınav",
  deadline: "Son tarih",
  assignment: "Ödev",
  project: "Proje",
};

function buildImportedCandidateId(
  item: { title: string; scheduledAt: string; kind: ScheduleItemKind },
  index: number,
) {
  const base = `${item.title}-${item.scheduledAt}-${item.kind}-${index}`
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return base || `import-${index}`;
}

function formatImportDate(isoDate: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoDate));
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
  const [difficultyRaw, setDifficultyRaw] =
    useState<DifficultyCalibrationAnswer>("orta");
  const [resourceReadinessRaw, setResourceReadinessRaw] =
    useState<ResourceReadinessAnswer>("kismen");
  const [preparednessRaw, setPreparednessRaw] =
    useState<PreparednessAnswer>("az");
  const [importFeedback, setImportFeedback] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importCandidates, setImportCandidates] = useState<ImportedCandidate[]>([]);
  const [importRejected, setImportRejected] = useState<string[]>([]);
  const [manualExpanded, setManualExpanded] = useState(compact);
  const [calibrationExpanded, setCalibrationExpanded] = useState(!compact);
  const [kindTouched, setKindTouched] = useState(false);
  const acceptedExtensions = getSupportedScheduleImportExtensions().join(",");

  const helperText = useMemo(() => {
    if (manualItemsCount === 0) {
      return "Eksik sınav, ödev, proje ya da önemli tarihi buradan ekleyebilirsin.";
    }

    return `${manualItemsCount} tarih takvime eklendi.`;
  }, [manualItemsCount]);

  const selectedImportCount = importCandidates.filter((candidate) => candidate.selected).length;
  const calibrationSummary = `${difficultyLabels[difficultyRaw]} · ${resourceLabels[resourceReadinessRaw]} · ${preparednessLabels[preparednessRaw]}`;

  const handleTitleChange = (nextTitle: string) => {
    setTitle(nextTitle);
    if (!kindTouched) {
      const inferredKind = inferScheduleItemKindFromText(nextTitle);
      setKind(inferredKind);
      setCalibrationExpanded(inferredKind === "exam");
    }
  };

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
      calibration:
        kind === "exam"
          ? {
              difficultyRaw,
              resourceReadinessRaw,
              preparednessRaw,
            }
          : undefined,
    });

    setTitle("");
    setScheduledAt("");
    setKind("exam");
    setKindTouched(false);
    setNotes("");
    setDifficultyRaw("orta");
    setResourceReadinessRaw("kismen");
    setPreparednessRaw("az");
    setCalibrationExpanded(!compact);
    setImportFeedback(
      kind === "exam"
        ? "Sınav takvime eklendi ve öncelik sistemine bağlandı."
        : `${kindLabels[kind]} takvime eklendi.`,
    );
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !onAddItems) {
      return;
    }

    setImporting(true);
    setImportFeedback(null);

    try {
      const result = await parseScheduleImportFile(file);

      setImportRejected(result.rejected);

      if (result.accepted.length === 0) {
        setImportCandidates([]);
        setImportFeedback(result.rejected[0] ?? "Dosyada seçilebilir tarih bulunamadı.");
        return;
      }

      setImportCandidates(
        result.accepted.map((item, index) => ({
          ...item,
          id: buildImportedCandidateId(item, index),
          selected: false,
        })),
      );
      setImportFeedback(
      `${result.accepted.length} aday bulundu. Sana ait olanları seçip ekleyebilirsin; türleri de gözden geçirmeni öneririm.`,
      );
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  };

  const toggleImportedCandidate = (id: string) => {
    setImportCandidates((prev) =>
      prev.map((candidate) =>
        candidate.id === id ? { ...candidate, selected: !candidate.selected } : candidate,
      ),
    );
  };

  const toggleAllImportedCandidates = () => {
    const shouldSelectAll = importCandidates.some((candidate) => !candidate.selected);
    setImportCandidates((prev) =>
      prev.map((candidate) => ({ ...candidate, selected: shouldSelectAll })),
    );
  };

  const handleImportSelectionConfirm = () => {
    const selectedCandidates = importCandidates.filter((candidate) => candidate.selected);
    if (selectedCandidates.length === 0 || !onAddItems) {
      return;
    }

    onAddItems(
      selectedCandidates.map(({ id: _id, selected: _selected, ...item }) => item),
    );
    const selectedIds = new Set(selectedCandidates.map((candidate) => candidate.id));
    setImportCandidates((prev) => prev.filter((candidate) => !selectedIds.has(candidate.id)));
    setImportFeedback(
      `${selectedCandidates.length} tarih takvime eklendi ve çalışma akışına bağlandı.`,
    );
  };

  return (
    <Card className={compact ? "p-4 sm:p-5" : "p-5 sm:p-6"}>
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
            {importing ? "Okunuyor" : "Yükle"}
          </span>
          <input
            type="file"
            accept={acceptedExtensions}
            className="hidden"
            disabled={importing}
            onChange={handleImport}
          />
        </label>

        {importFeedback ? (
          <p className="mt-3 text-sm text-slate-300">{importFeedback}</p>
        ) : null}

        {importCandidates.length > 0 ? (
          <div className="mt-4 rounded-[18px] border border-violet-400/18 bg-violet-400/[0.05] p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-violet-200">İçe aktarılan adaylar</p>
                <p className="mt-1 text-sm text-slate-300">
                  Onboarding gibi, sadece sana ait olanları seçip ekle.
                </p>
              </div>
              <button
                type="button"
                onClick={toggleAllImportedCandidates}
                className="text-xs text-violet-200 transition hover:text-white"
              >
                {importCandidates.every((candidate) => candidate.selected) ? "Tümünü kaldır" : "Tümünü seç"}
              </button>
            </div>

            <div className="mt-3 max-h-[250px] space-y-1.5 overflow-y-auto pr-1">
              {importCandidates.map((candidate) => (
                <button
                  key={candidate.id}
                  type="button"
                  onClick={() => toggleImportedCandidate(candidate.id)}
                  className={[
                    "flex w-full items-center gap-3 rounded-[14px] border px-3 py-2 text-left transition-all duration-150",
                    candidate.selected
                      ? "border-violet-400/40 bg-violet-400/[0.10] text-white"
                      : "border-white/[0.08] bg-white/[0.02] text-slate-400 hover:border-white/15 hover:text-slate-300",
                  ].join(" ")}
                >
                  <div
                    className={[
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition",
                      candidate.selected ? "border-violet-400 bg-violet-400" : "border-white/20",
                    ].join(" ")}
                  >
                    {candidate.selected ? <CheckCircle2 className="h-3 w-3 text-white" /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">{candidate.title}</p>
                      <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-slate-500">
                        {kindLabels[candidate.kind]}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{formatImportDate(candidate.scheduledAt)}</p>
                  </div>
                </button>
              ))}
            </div>

            {importRejected.length > 0 ? (
              <p className="mt-3 text-xs text-slate-400">
                {importRejected.length} satır kullanılamadı, sadece okunabilen adaylar listelendi.
              </p>
            ) : null}

            <div className="mt-3 flex gap-2">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setImportCandidates([]);
                  setImportRejected([]);
                  setImportFeedback("İçe aktarma listesi kapatıldı.");
                }}
              >
                Vazgeç
              </Button>
              <Button
                type="button"
                className="flex-[1.4]"
                disabled={selectedImportCount === 0}
                onClick={handleImportSelectionConfirm}
              >
                Seçili olanları ekle
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <div className={`mt-5 ${compact ? "border-t border-white/8 pt-5" : ""}`}>
        <button
          type="button"
          onClick={() => setManualExpanded((current) => !current)}
          className="flex w-full items-center justify-between gap-3 rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-left transition hover:border-white/15 hover:bg-black/25"
        >
          <div>
            <p className="text-sm font-medium text-white">Eksik tarihi manuel ekle</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              Tek bir sınavı, ödevi, projeyi ya da son tarihi hızlıca ekle. Sınavsa öncelik profili de buradan bağlanır.
            </p>
          </div>
          <ChevronDown
            className={[
              "h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200",
              manualExpanded ? "rotate-180" : "",
            ].join(" ")}
          />
        </button>

        {manualExpanded ? (
          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-[0.78fr_0.22fr]">
              <label className="block space-y-2">
                <span className="text-sm text-slate-300">Başlık</span>
                <Input
                  value={title}
                  onChange={(event) => handleTitleChange(event.target.value)}
                  placeholder="Örn. Retail Marketing proje teslimi"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm text-slate-300">Tür</span>
                <select
                  value={kind}
                  onChange={(event) => {
                    const nextKind = event.target.value as ScheduleItemKind;
                    setKindTouched(true);
                    setKind(nextKind);
                    setCalibrationExpanded(nextKind === "exam");
                  }}
                  className="flex h-11 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="exam" className="bg-slate-950">
                    Sınav
                  </option>
                  <option value="deadline" className="bg-slate-950">
                    Son tarih
                  </option>
                  <option value="assignment" className="bg-slate-950">
                    Ödev
                  </option>
                  <option value="project" className="bg-slate-950">
                    Proje
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
                  placeholder="Sınav odası, teslim formatı, konu kapsamı veya kısa hatırlatma"
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                />
              </label>
            ) : null}

            {kind === "exam" ? (
              <div className="rounded-[22px] border border-sky-300/14 bg-sky-300/[0.05] p-4">
                <button
                  type="button"
                  onClick={() => setCalibrationExpanded((current) => !current)}
                  className="flex w-full items-start justify-between gap-3 text-left"
                >
                  <div>
                    <p className="text-sm font-medium text-white">Öncelik profili</p>
                    <p className="mt-1 max-w-xl text-sm leading-6 text-slate-300">
                      Bu sınav home ve öncelikler ekranına doğru ağırlıkla düşsün diye üç kısa cevap.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs uppercase tracking-[0.16em] text-slate-300">
                      {calibrationSummary}
                    </span>
                    <ChevronDown
                      className={[
                        "mt-1 h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200",
                        calibrationExpanded ? "rotate-180" : "",
                      ].join(" ")}
                    />
                  </div>
                </button>

                {calibrationExpanded ? (
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <label className="space-y-2">
                      <span className="text-xs uppercase tracking-[0.16em] text-slate-400">
                        Ders zor mu?
                      </span>
                      <select
                        value={difficultyRaw}
                        onChange={(event) =>
                          setDifficultyRaw(event.target.value as DifficultyCalibrationAnswer)
                        }
                        className="flex h-11 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="az" className="bg-slate-950">Rahat</option>
                        <option value="orta" className="bg-slate-950">Orta</option>
                        <option value="zor" className="bg-slate-950">Zor</option>
                      </select>
                    </label>

                    <label className="space-y-2">
                      <span className="text-xs uppercase tracking-[0.16em] text-slate-400">
                        Kaynaklar hazır mı?
                      </span>
                      <select
                        value={resourceReadinessRaw}
                        onChange={(event) =>
                          setResourceReadinessRaw(event.target.value as ResourceReadinessAnswer)
                        }
                        className="flex h-11 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="hazir" className="bg-slate-950">Hazır</option>
                        <option value="kismen" className="bg-slate-950">Kısmen</option>
                        <option value="eksik" className="bg-slate-950">Eksik</option>
                      </select>
                    </label>

                    <label className="space-y-2">
                      <span className="text-xs uppercase tracking-[0.16em] text-slate-400">
                        Şu an durumun?
                      </span>
                      <select
                        value={preparednessRaw}
                        onChange={(event) =>
                          setPreparednessRaw(event.target.value as PreparednessAnswer)
                        }
                        className="flex h-11 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="iyi" className="bg-slate-950">İyi</option>
                        <option value="biraz" className="bg-slate-950">Biraz baktım</option>
                        <option value="az" className="bg-slate-950">Henüz başlamadım</option>
                      </select>
                    </label>
                  </div>
                ) : null}
              </div>
            ) : null}

            <Button type="submit" className="w-full gap-2">
              <CalendarPlus className="h-4 w-4" />
              Tarihi ekle
            </Button>
          </form>
        ) : null}
      </div>

      <div className="mt-5 rounded-[22px] border border-white/10 bg-black/20 p-4">
        <div className="flex items-start gap-3">
          <FileStack className="mt-0.5 h-4 w-4 text-slate-300" />
          <div>
            <p className="text-sm font-medium text-white">Desteklenen formatlar</p>
            <p className="mt-1 text-sm leading-6 text-slate-300">
              {compact
                ? "CSV, JSON, TXT, MD, PDF, DOCX ve Excel desteklenir."
                : "Yerel dosya için yükleme kullan. Outline benzeri metin listeleri için TXT, MD ve DOCX de okunabilir."}
            </p>
          </div>
        </div>
        <p className="mt-3 text-sm text-slate-400">{helperText}</p>
      </div>
    </Card>
  );
}
