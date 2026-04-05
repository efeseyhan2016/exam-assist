"use client";

import { useCallback, useRef, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  FileText,
  TrendingUp,
  Trash2,
  Upload,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/dashboard/section-heading";
import { analyzeSubjectLibrary, formatReadTime } from "@/lib/pdf-engine";
import {
  getResourceGuidance,
  pickPrimaryResourceGuidance,
} from "@/lib/resource-intelligence";
import { deriveStudyMode, getStudyIntelligence, StudyIntelligence } from "@/lib/subject-intelligence";
import { useResources } from "@/hooks/useResources";
import { ContentTypeHint, RankedSubjectRisk, ResourceItem, SubjectSeed } from "@/lib/types";

interface ResourcesScreenProps {
  subjects: SubjectSeed[];
  riskSnapshot: RankedSubjectRisk[];
}

export function ResourcesScreen({ subjects, riskSnapshot }: ResourcesScreenProps) {
  const [activeSubjectId, setActiveSubjectId] = useState<string>(subjects[0]?.id ?? "");
  const { resources, isReady, addResource, updateProgress, updatePageCount, removeResource } =
    useResources();

  const activeSubject = subjects.find((s) => s.id === activeSubjectId) ?? null;
  const activeResources = resources.filter((r) => r.subjectId === activeSubjectId);
  const activeRisk = riskSnapshot.find((r) => r.subjectId === activeSubjectId) ?? null;

  // Derive study intelligence from subject seed + PDF content hints
  const contentHints = activeResources
    .map((r) => r.contentHint)
    .filter((h): h is ContentTypeHint => h !== undefined);
  const studyMode = activeSubject ? deriveStudyMode(activeSubject, contentHints) : "mixed";
  const intelligence = getStudyIntelligence(studyMode);

  if (!isReady) {
    return (
      <section className="space-y-6">
        <SectionHeading eyebrow="Kaynaklar" title="Ders kütüphaneleri" description="" />
        <div className="h-48 animate-pulse rounded-[26px] bg-white/[0.04]" />
      </section>
    );
  }

  if (subjects.length === 0) {
    return (
      <section className="space-y-6">
        <SectionHeading
          eyebrow="Kaynaklar"
          title="Ders kütüphaneleri"
          description="Her ders için materyallerini yükle, ilerlemeni takip et."
        />
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <BookOpen className="h-8 w-8 text-slate-500" />
          <p className="text-sm text-slate-400">
            Kütüphaneyi kullanmak için önce onboarding&apos;de en az bir ders ekle.
          </p>
        </Card>
      </section>
    );
  }

  const descriptionByMode = {
    practice: "Referans materyallerini yükle. Asıl ilerleme seans loglarınla ölçülür.",
    reading: "PDF ve notlarını yükle, sayfa ilerlemeni kaydet. Motor günlük hedefini hesaplar.",
    mixed: "Materyallerini yükle. Önce oku, ardından soru çözerek pekiştir.",
  };

  return (
    <section className="space-y-6">
      <SectionHeading
        eyebrow="Kaynaklar"
        title="Ders kütüphaneleri"
        description={descriptionByMode[studyMode]}
      />

      {/* Subject tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {subjects.map((subject) => {
          const subjectResources = resources.filter((r) => r.subjectId === subject.id);
          const hasResources = subjectResources.length > 0;
          const risk = riskSnapshot.find((r) => r.subjectId === subject.id);

          return (
            <button
              key={subject.id}
              type="button"
              onClick={() => setActiveSubjectId(subject.id)}
              className={[
                "flex shrink-0 items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm transition",
                activeSubjectId === subject.id
                  ? "border-sky-400/40 bg-sky-400/12 text-white"
                  : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:text-slate-200",
              ].join(" ")}
            >
              <span className="font-medium">{subject.shortLabel}</span>
              <span className="hidden sm:inline text-xs opacity-70">{subject.title}</span>
              {hasResources && <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />}
              {risk && <RiskBadge label={risk.label} />}
            </button>
          );
        })}
      </div>

      {activeSubject && (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          {/* Left: upload + resource list */}
          <div className="space-y-4">
            <UploadZone subjectId={activeSubjectId} onUpload={addResource} />

            {activeResources.length > 0 ? (
              <div className="space-y-3">
                {activeResources.map((resource) => (
                  <ResourceCard
                    key={resource.id}
                    resource={resource}
                    intelligence={intelligence}
                    hoursUntilExam={activeRisk?.hoursUntilExam ?? 0}
                    onUpdateProgress={updateProgress}
                    onUpdatePageCount={updatePageCount}
                    onRemove={removeResource}
                  />
                ))}
              </div>
            ) : (
              <Card className="flex flex-col items-center gap-3 py-10 text-center">
                <FileText className="h-8 w-8 text-slate-600" />
                <div>
                  <p className="text-sm font-medium text-slate-300">
                    {activeSubject.title} için henüz materyal yok
                  </p>
                  <p className="mt-1 text-xs text-slate-500 max-w-xs mx-auto">
                    {intelligence.emptyStateHint}
                  </p>
                </div>
              </Card>
            )}
          </div>

          {/* Right: analysis panel */}
          <AnalysisPanel
            subject={activeSubject}
            resources={activeResources}
            hoursUntilExam={activeRisk?.hoursUntilExam ?? 0}
            examTitle={activeRisk?.examTitle ?? activeSubject.title}
            intelligence={intelligence}
          />
        </div>
      )}
    </section>
  );
}

// ─── Upload Zone ──────────────────────────────────────────────────────────────

function UploadZone({
  subjectId,
  onUpload,
}: {
  subjectId: string;
  onUpload: (subjectId: string, file: File) => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setUploading(true);
      for (const file of Array.from(files)) {
        await onUpload(subjectId, file);
      }
      setUploading(false);
    },
    [subjectId, onUpload],
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
      className={[
        "flex cursor-pointer flex-col items-center gap-3 rounded-[26px] border-2 border-dashed p-8 text-center transition",
        dragging
          ? "border-sky-400/60 bg-sky-400/8"
          : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]",
      ].join(" ")}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3 text-sky-200">
        <Upload className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-200">
          {uploading ? "Analiz ediliyor..." : "PDF veya doküman yükle"}
        </p>
        <p className="mt-1 text-xs text-slate-500">Sürükle bırak ya da tıkla · PDF, DOC, DOCX</p>
      </div>
    </div>
  );
}

// ─── Resource Card ────────────────────────────────────────────────────────────

function ResourceCard({
  resource,
  intelligence,
  hoursUntilExam,
  onUpdateProgress,
  onUpdatePageCount,
  onRemove,
}: {
  resource: ResourceItem;
  intelligence: StudyIntelligence;
  hoursUntilExam: number;
  onUpdateProgress: (id: string, pages: number) => void;
  onUpdatePageCount: (id: string, pages: number) => void;
  onRemove: (id: string) => Promise<void>;
}) {
  const progress =
    resource.pageCount > 0 ? Math.round((resource.pagesRead / resource.pageCount) * 100) : 0;
  const remainingPages = Math.max(resource.pageCount - resource.pagesRead, 0);
  const fileSizeKb = Math.round(resource.fileSizeBytes / 1024);
  const guidance = getResourceGuidance(resource, intelligence, hoursUntilExam);

  // For practice-mode subjects, page tracking is secondary — show a softer UI
  const isPracticeMode = intelligence.resourceMetric === "sessions";

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 rounded-xl border border-white/10 bg-white/[0.04] p-2 text-sky-200">
            <FileText className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{resource.title}</p>
            <p className="mt-0.5 text-xs text-slate-500">
              {fileSizeKb > 1024
                ? `${(fileSizeKb / 1024).toFixed(1)} MB`
                : `${fileSizeKb} KB`}
              {resource.type === "pdf" && resource.pageCount > 0 && (
                <> · {resource.pageCount} sayfa</>
              )}
              {resource.contentHint && resource.contentHint !== "unknown" && (
                <> · {resource.contentHint === "formula-heavy" ? "formül yoğun" : resource.contentHint === "prose-heavy" ? "metin ağırlıklı" : "karma içerik"}</>
              )}
            </p>
            <p className="mt-1 text-[11px] leading-5 text-sky-200/85">
              {guidance.badge} · {guidance.summary}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onRemove(resource.id)}
          className="shrink-0 text-slate-600 transition hover:text-rose-400"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Page count edit — shown when extraction failed */}
      {resource.pageCount === 0 && (
        <div className="mt-4 flex items-center gap-2 rounded-[16px] border border-amber-300/20 bg-amber-300/6 px-3 py-2">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-300" />
          <p className="text-xs text-amber-200">Sayfa sayısı okunamadı.</p>
          <input
            type="number"
            min={1}
            placeholder="Sayfa"
            className="ml-auto w-20 rounded-xl border border-white/10 bg-black/20 px-2 py-1 text-xs text-white outline-none"
            onBlur={(e) => {
              const v = Number(e.target.value);
              if (v > 0) onUpdatePageCount(resource.id, v);
            }}
          />
        </div>
      )}

      {/* Progress — shown for all modes, but labeled differently */}
      {resource.pageCount > 0 && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-slate-400">
              {isPracticeMode ? "Referans kapsamı" : "İlerleme"}
            </p>
            <p className="text-xs font-medium text-slate-200">
              {resource.pagesRead} / {resource.pageCount} sayfa ({progress}%)
            </p>
          </div>

          <div className="relative">
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/8">
              <div
                className={`h-full rounded-full transition-all duration-300 ${isPracticeMode ? "bg-violet-400" : "bg-sky-400"}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <input
              type="range"
              min={0}
              max={resource.pageCount}
              value={resource.pagesRead}
              onChange={(e) => onUpdateProgress(resource.id, Number(e.target.value))}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </div>

          <div className="flex gap-2">
            {[25, 50, 75, 100].map((pct) => {
              const pages = Math.round((pct / 100) * resource.pageCount);
              return (
                <button
                  key={pct}
                  type="button"
                  onClick={() => onUpdateProgress(resource.id, pages)}
                  className={[
                    "flex-1 rounded-xl border py-1.5 text-[11px] transition",
                    progress >= pct
                      ? isPracticeMode
                        ? "border-violet-400/30 bg-violet-400/10 text-violet-200"
                        : "border-sky-400/30 bg-sky-400/10 text-sky-200"
                      : "border-white/8 text-slate-500 hover:border-white/15 hover:text-slate-300",
                  ].join(" ")}
                >
                  %{pct}
                </button>
              );
            })}
          </div>

          {remainingPages > 0 && !isPracticeMode && (
            <p className="text-xs text-slate-500">
              Kalan: {remainingPages} sayfa · ~{formatReadTime(remainingPages * 2)}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

// ─── Analysis Panel ───────────────────────────────────────────────────────────

function AnalysisPanel({
  subject,
  resources,
  hoursUntilExam,
  examTitle,
  intelligence,
}: {
  subject: SubjectSeed;
  resources: ResourceItem[];
  hoursUntilExam: number;
  examTitle: string;
  intelligence: StudyIntelligence;
}) {
  const analysis = analyzeSubjectLibrary(resources, hoursUntilExam);
  const primaryResource = pickPrimaryResourceGuidance(
    resources,
    intelligence,
    hoursUntilExam,
  );
  const daysUntilExam = Math.floor(hoursUntilExam / 24);
  const isPracticeMode = intelligence.resourceMetric === "sessions";

  const statusConfig = {
    tamamlandi: { icon: CheckCircle2, label: "Tamamlandı", color: "emerald" },
    yolunda: { icon: TrendingUp, label: "Yolunda", color: "sky" },
    geri: { icon: Clock3, label: "Geri kalındı", color: "amber" },
    kritik: { icon: AlertTriangle, label: "Kritik", color: "rose" },
  } as const;

  const config = statusConfig[analysis.status];
  const Icon = config.icon;

  return (
    <div className="space-y-4">
      {primaryResource ? (
        <Card className="p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">İlk açılacak kaynak</p>
          <div className="mt-3 rounded-[18px] border border-sky-300/15 bg-sky-300/[0.06] p-3.5">
            <p className="text-sm font-medium text-white">{primaryResource.resource.title}</p>
            <p className="mt-1 text-xs text-sky-100/90">
              {primaryResource.guidance.badge}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              {primaryResource.guidance.summary}
            </p>
            <p className="mt-2 text-[12px] text-slate-400">
              İlk hareket:{" "}
              <span className="font-medium text-slate-200">
                {primaryResource.guidance.actionLabel}
              </span>
            </p>
          </div>
        </Card>
      ) : null}

      {/* Study mode intelligence notice */}
      <Card className="flex items-start gap-3 p-4">
        <BrainCircuit className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />
        <div>
          <p className="text-xs font-medium text-violet-200">{intelligence.sessionLabel}</p>
          <p className="mt-0.5 text-xs leading-5 text-slate-400">{intelligence.analysisNote}</p>
        </div>
      </Card>

      {/* Page analysis card — always shown; secondary for practice */}
      <Card className="p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
            {isPracticeMode ? "Referans materyali" : "Materyal analizi"}
          </p>
          {resources.length > 0 && (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium
              ${analysis.status === "tamamlandi" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" :
                analysis.status === "yolunda" ? "border-sky-400/30 bg-sky-400/10 text-sky-200" :
                analysis.status === "geri" ? "border-amber-400/30 bg-amber-400/10 text-amber-200" :
                "border-rose-400/30 bg-rose-400/10 text-rose-200"}`}
            >
              <Icon className="h-3 w-3" />
              {config.label}
            </span>
          )}
        </div>

        {resources.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">
            {isPracticeMode
              ? "Referans materyal ekleyebilirsin, isteğe bağlı."
              : "Henüz materyal yok. Soldan PDF yükleyerek başla."}
          </p>
        ) : (
          <>
            {/* Coverage bar */}
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Kapsam</span>
                <span className="text-slate-200">{analysis.coveragePercent}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/8">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isPracticeMode
                      ? "bg-violet-400"
                      : analysis.status === "tamamlandi"
                        ? "bg-emerald-400"
                        : analysis.status === "yolunda"
                          ? "bg-sky-400"
                          : analysis.status === "geri"
                            ? "bg-amber-400"
                            : "bg-rose-400"
                  }`}
                  style={{ width: `${analysis.coveragePercent}%` }}
                />
              </div>
              <p className="text-xs text-slate-500">
                {analysis.readPages} / {analysis.totalPages} sayfa
              </p>
            </div>

            {/* Stats grid */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <StatTile
                label={isPracticeMode ? "Materyal hacmi" : "Toplam okuma"}
                value={formatReadTime(analysis.totalReadMinutes)}
                sub={`${analysis.totalPages} sayfa`}
              />
              <StatTile
                label={isPracticeMode ? "Kalan materyal" : "Kalan okuma"}
                value={formatReadTime(analysis.remainingReadMinutes)}
                sub={`${analysis.remainingPages} sayfa`}
              />
              <StatTile
                label="Sınava kalan"
                value={daysUntilExam > 0 ? `${daysUntilExam} gün` : "Bugün"}
                sub={examTitle}
              />
              <StatTile
                label={isPracticeMode ? "Öneri seans" : "Günlük hedef"}
                value={
                  isPracticeMode
                    ? `${intelligence.recommendedSessionMinutes} dk`
                    : analysis.remainingPages > 0 && daysUntilExam > 0
                      ? `${analysis.dailyPagesNeeded} sayfa`
                      : analysis.remainingPages === 0
                        ? "Tamam"
                        : "Bugün"
                }
                sub={isPracticeMode ? intelligence.sessionLabel : "okuma hızı"}
              />
            </div>
          </>
        )}
      </Card>

      {/* Guidance card */}
      {resources.length > 0 && (
        <Card className="p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Yol haritası</p>
          <div className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
            {isPracticeMode ? (
              <p>
                Bu ders için günde{" "}
                <span className="font-semibold text-violet-300">
                  {intelligence.recommendedSessionMinutes} dk
                </span>{" "}
                soru çözmeyi hedefle. Materyali referans olarak kullan; ilerlemeni seans
                loglarından takip et.
              </p>
            ) : analysis.remainingPages === 0 ? (
              <p>
                <span className="font-semibold text-emerald-300">Tüm materyaller tamamlandı.</span>{" "}
                Kalan süreyi tekrara ve pratik sorulara ayır.
              </p>
            ) : analysis.status === "kritik" ? (
              <p>
                Kalan materyali yetiştirebilmek için günde{" "}
                <span className="font-semibold text-rose-300">{analysis.dailyPagesNeeded} sayfa</span>{" "}
                okumalısın. En kritik bölümlere öncelik ver.
              </p>
            ) : analysis.status === "geri" ? (
              <p>
                Tempo biraz düşük. Günde{" "}
                <span className="font-semibold text-amber-300">{analysis.dailyPagesNeeded} sayfa</span>{" "}
                ile sınava kadar tüm materyali tamamlayabilirsin.
              </p>
            ) : (
              <p>
                İyi gidiyorsun. Günde{" "}
                <span className="font-semibold text-sky-300">{analysis.dailyPagesNeeded} sayfa</span>{" "}
                ile mevcut temponu koru.
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatTile({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-[18px] border border-white/8 bg-black/20 p-3">
      <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1.5 text-lg font-semibold text-white">{value}</p>
      <p className="mt-0.5 truncate text-[11px] text-slate-500">{sub}</p>
    </div>
  );
}

function RiskBadge({ label }: { label: string }) {
  const colorMap: Record<string, string> = {
    Critical: "bg-rose-400",
    High: "bg-amber-400",
    Moderate: "bg-sky-400",
    Low: "bg-emerald-400",
  };
  return <span className={`h-1.5 w-1.5 rounded-full ${colorMap[label] ?? "bg-slate-400"}`} />;
}
