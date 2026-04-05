"use client";

import { useCallback, useRef, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  FileText,
  MessageSquarePlus,
  Pin,
  PinOff,
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
import { deriveSessionBehaviorHint, deriveStudyMode, getStudyIntelligence, StudyIntelligence } from "@/lib/subject-intelligence";
import { useNotes } from "@/hooks/useNotes";
import { useResources } from "@/hooks/useResources";
import { ContentTypeHint, RankedSubjectRisk, ResourceItem, StudyNote, StudySession, SubjectSeed } from "@/lib/types";

interface ResourcesScreenProps {
  subjects: SubjectSeed[];
  riskSnapshot: RankedSubjectRisk[];
  sessions: StudySession[];
}

export function ResourcesScreen({ subjects, riskSnapshot, sessions }: ResourcesScreenProps) {
  const [activeSubjectId, setActiveSubjectId] = useState<string>(subjects[0]?.id ?? "");
  const { resources, isReady, addResource, updateProgress, updatePageCount, removeResource } =
    useResources();
  const { addNote, updateNote, togglePin, deleteNote, notesForSubject } = useNotes();

  const activeSubject = subjects.find((s) => s.id === activeSubjectId) ?? null;
  const activeResources = resources.filter((r) => r.subjectId === activeSubjectId);
  const activeRisk = riskSnapshot.find((r) => r.subjectId === activeSubjectId) ?? null;

  // Derive study intelligence from subject seed + PDF content hints
  const contentHints = activeResources
    .map((r) => r.contentHint)
    .filter((h): h is ContentTypeHint => h !== undefined);
  const sessionHint = activeSubject ? deriveSessionBehaviorHint(sessions, activeSubject.id) : null;
  const studyMode = activeSubject ? deriveStudyMode(activeSubject, contentHints, sessionHint) : "mixed";
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
    problem: "Problem ve uygulama ağırlıklı derslerde kaynaklarını burada toparla. Ana ilerleme sinyali çalışma bloklarından gelir.",
    conceptual: "Kavramsal yerleşme isteyen derslerde kaynak akışını burada izle.",
    interpretive: "Yorum, karşılaştırma ve tema kurma isteyen derslerde kaynaklarını burada dengele.",
    memorization: "Terim, yapı veya mevzuat yoğun derslerde tekrar hattını burada topla.",
    mixed: "Kavramı kurup uygulamaya dönen derslerde kaynaklarını burada dengele.",
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

          <div className="space-y-4">
            <AnalysisPanel
              subject={activeSubject}
              resources={activeResources}
              hoursUntilExam={activeRisk?.hoursUntilExam ?? 0}
              examTitle={activeRisk?.examTitle ?? activeSubject.title}
              intelligence={intelligence}
            />
            <NotesPanel
              notes={notesForSubject(activeSubjectId)}
              onAdd={(content) => addNote({ subjectId: activeSubjectId, content })}
              onUpdate={updateNote}
              onTogglePin={togglePin}
              onDelete={deleteNote}
            />
          </div>
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

  // For problem-heavy subjects, page tracking is secondary — show a softer UI
  const isBlockTrackedMode = intelligence.resourceMetric === "sessions";

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
              {isBlockTrackedMode ? "Referans kapsamı" : "İlerleme"}
            </p>
            <p className="text-xs font-medium text-slate-200">
              {resource.pagesRead} / {resource.pageCount} sayfa ({progress}%)
            </p>
          </div>

          <div className="relative">
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/8">
              <div
                className={`h-full rounded-full transition-all duration-300 ${isBlockTrackedMode ? "bg-violet-400" : "bg-sky-400"}`}
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
                      ? isBlockTrackedMode
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

          {remainingPages > 0 && !isBlockTrackedMode && (
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
  const isBlockTrackedMode = intelligence.resourceMetric === "sessions";

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
              Önerilen yaklaşım:{" "}
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

      {/* Page analysis card — always shown; secondary for problem-heavy flows */}
      <Card className="p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
            {isBlockTrackedMode ? "Referans materyali" : "Materyal analizi"}
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
            {isBlockTrackedMode
              ? "İstersen referans materyal ekleyebilirsin."
              : "Henüz materyal yok. Soldan PDF yükleyip bu dersin kaynak hattını kurabilirsin."}
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
                    isBlockTrackedMode
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
                label={isBlockTrackedMode ? "Materyal hacmi" : "Toplam okuma"}
                value={formatReadTime(analysis.totalReadMinutes)}
                sub={`${analysis.totalPages} sayfa`}
              />
              <StatTile
                label={isBlockTrackedMode ? "Kalan materyal" : "Kalan okuma"}
                value={formatReadTime(analysis.remainingReadMinutes)}
                sub={`${analysis.remainingPages} sayfa`}
              />
              <StatTile
                label="Sınava kalan"
                value={daysUntilExam > 0 ? `${daysUntilExam} gün` : "Bugün"}
                sub={examTitle}
              />
              <StatTile
                label={isBlockTrackedMode ? "Öneri seans" : "Günlük hedef"}
                value={
                  isBlockTrackedMode
                    ? `${intelligence.recommendedSessionMinutes} dk`
                    : analysis.remainingPages > 0 && daysUntilExam > 0
                      ? `${analysis.dailyPagesNeeded} sayfa`
                      : analysis.remainingPages === 0
                        ? "Tamam"
                        : "Bugün"
                }
                sub={isBlockTrackedMode ? intelligence.sessionLabel : "okuma hızı"}
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
            {isBlockTrackedMode ? (
              <p>
                Bu ders için günde{" "}
                <span className="font-semibold text-violet-300">
                  {intelligence.recommendedSessionMinutes} dk
                </span>{" "}
                uygulama ağırlıklı çalışmak daha doğru olur. Materyali referans katmanı gibi kullan;
                ilerlemeyi seans loglarından takip et.
              </p>
            ) : analysis.remainingPages === 0 ? (
              <p>
                <span className="font-semibold text-emerald-300">Tüm materyaller tamamlandı.</span>{" "}
                Kalan süreyi toparlama ve pekiştirme için kullanabilirsin.
              </p>
            ) : analysis.status === "kritik" ? (
              <p>
                Kalan materyali rahatça toparlayabilmek için günde{" "}
                <span className="font-semibold text-rose-300">{analysis.dailyPagesNeeded} sayfa</span>{" "}
                ilerlemek gerekiyor. En kritik başlıklara öncelik vermek daha doğru olur.
              </p>
            ) : analysis.status === "geri" ? (
              <p>
                Tempo biraz geride. Günde{" "}
                <span className="font-semibold text-amber-300">{analysis.dailyPagesNeeded} sayfa</span>{" "}
                ile sınava kadar materyali daha dengeli biçimde toparlayabilirsin.
              </p>
            ) : (
              <p>
                Akış sağlıklı görünüyor. Günde{" "}
                <span className="font-semibold text-sky-300">{analysis.dailyPagesNeeded} sayfa</span>{" "}
                ile mevcut ritmi korumak yeterli olur.
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

function NotesPanel({
  notes,
  onAdd,
  onUpdate,
  onTogglePin,
  onDelete,
}: {
  notes: StudyNote[];
  onAdd: (content: string) => void;
  onUpdate: (id: string, content: string) => void;
  onTogglePin: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (!draft.trim()) return;
    onAdd(draft);
    setDraft("");
    textareaRef.current?.focus();
  };

  const saveEdit = () => {
    if (editingId && editDraft.trim()) {
      onUpdate(editingId, editDraft);
    }
    setEditingId(null);
    setEditDraft("");
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Notlar</p>
        {notes.length > 0 ? (
          <span className="text-[11px] tabular-nums text-slate-600">{notes.length}</span>
        ) : null}
      </div>

      <div className="mt-3">
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="Hızlı not ekle..."
          rows={2}
          className="w-full resize-none rounded-[16px] border border-white/10 bg-black/20 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-sky-400/40 focus:bg-black/30"
        />
        {draft.trim() ? (
          <div className="mt-2 flex items-center justify-between">
            <p className="text-[10px] text-slate-600">⌘+Enter ile kaydet</p>
            <button
              type="button"
              onClick={handleSubmit}
              className="inline-flex items-center gap-1.5 rounded-xl border border-sky-400/30 bg-sky-400/10 px-3 py-1.5 text-xs font-medium text-sky-200 transition hover:bg-sky-400/20"
            >
              <MessageSquarePlus className="h-3 w-3" />
              Ekle
            </button>
          </div>
        ) : null}
      </div>

      {notes.length > 0 ? (
        <div className="mt-4 space-y-2">
          {notes.map((note) => (
            <div
              key={note.id}
              className={[
                "group rounded-[16px] border p-3 transition",
                note.pinned
                  ? "border-amber-400/20 bg-amber-400/[0.04]"
                  : "border-white/8 bg-white/[0.02]",
              ].join(" ")}
            >
              {editingId === note.id ? (
                <div>
                  <textarea
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        saveEdit();
                      }
                      if (e.key === "Escape") {
                        setEditingId(null);
                      }
                    }}
                    rows={3}
                    className="w-full resize-none rounded-xl border border-sky-400/30 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                    autoFocus
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={saveEdit}
                      className="rounded-lg border border-sky-400/30 bg-sky-400/10 px-2.5 py-1 text-[11px] text-sky-200 transition hover:bg-sky-400/20"
                    >
                      Kaydet
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="rounded-lg border border-white/8 px-2.5 py-1 text-[11px] text-slate-500 transition hover:text-slate-300"
                    >
                      İptal
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p
                    className="cursor-pointer whitespace-pre-wrap text-sm leading-6 text-slate-300"
                    onClick={() => {
                      setEditingId(note.id);
                      setEditDraft(note.content);
                    }}
                  >
                    {note.content}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-[10px] text-slate-600">
                      {new Date(note.updatedAt).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => onTogglePin(note.id)}
                        className={`rounded-lg p-1.5 transition ${
                          note.pinned
                            ? "text-amber-400 hover:text-amber-300"
                            : "text-slate-600 hover:text-slate-400"
                        }`}
                        title={note.pinned ? "Sabitlemeyi kaldır" : "Sabitle"}
                      >
                        {note.pinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(note.id)}
                        className="rounded-lg p-1.5 text-slate-600 transition hover:text-rose-400"
                        title="Sil"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      ) : null}

      {notes.length === 0 && !draft.trim() ? (
        <p className="mt-3 text-xs leading-5 text-slate-600">
          Çalışırken aklına gelenleri hızlıca buraya not et. Notların bu derse bağlı kalır.
        </p>
      ) : null}
    </Card>
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
