"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarPlus,
  CheckCircle2,
  FileText,
  Loader2,
  Search,
  Target,
  Trash2,
  User,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { rawAnswersToSubjectSeed } from "@/lib/planning-input";
import {
  inferDominantImportLanguage,
  mergeImportSelectionHistory,
  scoreCandidateAgainstImportHistory,
} from "@/lib/import-selection-intelligence";
import {
  inferDepartmentMatchScore,
  inferTitleLanguageHint,
} from "@/lib/profile-options";
import { ExtractedExam, debugExtractExamScheduleFromPdf } from "@/lib/pdf-engine";
import { getExamProximityProfile } from "@/lib/exam-proximity";
import { buildRiskEngineSnapshot } from "@/lib/risk";
import {
  logRecommendationShown,
  markRecommendationAccepted,
} from "@/lib/recommendation-events";
import { buildStudyLaunchDraft, buildStudyRecommendationSentence } from "@/lib/study-recommendation";
import { toSubjectTitleCase } from "@/lib/utils";
import {
  readUserProfile,
  readImportSelectionHistory,
  writeImportSelectionHistory,
  writePlanningConstraints,
  writePlanningExams,
  writePlanningSubjectSeeds,
  writeUserProfile,
} from "@/lib/storage";
import {
  DifficultyCalibrationAnswer,
  Exam,
  PreparednessAnswer,
  ResourceReadinessAnswer,
  StudyLaunchDraft,
  SubjectCalibrationAnswers,
} from "@/lib/types";

interface OnboardingScreenProps {
  onStart: (options?: { launchDraft?: StudyLaunchDraft | null; startView?: "home" | "sessions" }) => void;
  initialName?: string;
}

const slideUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as const },
});

type Step = "name" | "exams" | "calibration" | "goal" | "done";
type CandidateFilter = "all" | "selected" | "unselected";
type CandidateSort = "nearest" | "alpha";

const SETUP_STEPS = [
  {
    id: "name" as const,
    label: "İsim",
    statusLabel: "1. adım",
    hint: "Kısa bir başlangıç",
    description: "İsmini doğrula, sonra doğrudan sınavlarını içe aktar.",
  },
  {
    id: "exams" as const,
    label: "Sınavlar",
    statusLabel: "2. adım",
    hint: "En hızlı yol",
    description: "Önce PDF ile başla. Bulunan derslerden sadece sana ait olanları seç.",
  },
  {
    id: "calibration" as const,
    label: "Dersler",
    statusLabel: "3. adım",
    hint: "Çok kısa",
    description: "Seçtiğin dersler için üç kısa cevap yeterli. Burada uzun form yok.",
  },
  {
    id: "goal" as const,
    label: "Günlük hedef",
    statusLabel: "Son adım",
    hint: "Hemen değişebilir",
    description: "Günlük çalışma hedefini seç. Sonra dashboard içinde yine değiştirebilirsin.",
  },
];

function getPdfUploadErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  if (message.includes("password") || message.includes("encrypted")) {
    return "PDF şifreli görünüyor. Şifresiz bir kopya yükleyebilirsin.";
  }

  if (message.includes("invalid pdf") || message.includes("missing pdf")) {
    return "Bu dosya okunabilir bir PDF gibi görünmüyor.";
  }

  return "PDF şu anda açılamadı. Yükleme sırasında teknik bir sorun oluştu.";
}

interface DraftExam {
  id: string;
  subjectId: string;
  title: string;
  shortLabel: string;
  scheduledAt: string;
  courseCode?: string;
  departmentHint?: string;
  calibration: SubjectCalibrationAnswers;
}

interface PdfExamCandidate extends ExtractedExam {
  id: string;
  selected: boolean;
  profileSignal: number;
}

interface RankedPdfExamCandidate extends PdfExamCandidate {
  selectionSignal: number;
}

interface CompletionRecommendation {
  sentence: string;
  modeLabel: string;
  nextExamLabel: string;
  launchDraft: StudyLaunchDraft | null;
}

const DEFAULT_CALIBRATION: SubjectCalibrationAnswers = {
  difficultyRaw: "orta",
  resourceReadinessRaw: "kismen",
  preparednessRaw: "biraz",
};

function createStableBaseSlug(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function buildShortLabel(title: string, courseCode?: string) {
  if (courseCode) {
    return courseCode.replace(/\s+/g, "").slice(0, 8).toUpperCase();
  }

  return title
    .split(/\s+/)
    .map((word) => word[0] ?? "")
    .join("")
    .slice(0, 6)
    .toUpperCase();
}

function buildDraftExamIdentity(
  title: string,
  scheduledAt: string,
  courseCode?: string,
) {
  const scheduleStamp = scheduledAt.replace(/[-:TZ.]/g, "").slice(0, 12);
  const subjectBase = createStableBaseSlug(courseCode || title) || "exam";

  return `${subjectBase}-${scheduleStamp}`;
}

function buildDraftExam(
  input: Pick<
    ExtractedExam,
    "title" | "scheduledAt" | "courseCode" | "departmentHint"
  >,
): DraftExam {
  const subjectId = buildDraftExamIdentity(
    input.title,
    input.scheduledAt,
    input.courseCode,
  );

  return {
    id: subjectId,
    subjectId,
    title: toSubjectTitleCase(input.title.trim()),
    shortLabel: buildShortLabel(input.title, input.courseCode),
    scheduledAt: input.scheduledAt,
    courseCode: input.courseCode,
    departmentHint: input.departmentHint,
    calibration: { ...DEFAULT_CALIBRATION },
  };
}

function formatOnboardingDate(isoDate: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoDate));
}

function buildProfileSignal(
  profile: ReturnType<typeof readUserProfile>,
  exam: Pick<ExtractedExam, "departmentHint" | "title">,
) {
  if (!profile) return 0;

  const departmentScore = inferDepartmentMatchScore(
    profile.department,
    exam.departmentHint,
  );
  const titleLanguage = inferTitleLanguageHint(exam.title);
  const languageScore =
    titleLanguage === "mixed"
      ? 0
      : profile.knownLanguages.includes(titleLanguage)
        ? 1
        : 0;

  return departmentScore * 2 + languageScore;
}

function buildSelectionContext(profile: ReturnType<typeof readUserProfile>) {
  return {
    university: profile?.university ?? "",
    department: profile?.department ?? "",
  };
}

export function OnboardingScreen({ onStart, initialName }: OnboardingScreenProps) {
  const [step, setStep] = useState<Step>(initialName ? "exams" : "name");
  const [name, setName] = useState(initialName ?? "");
  const [exams, setExams] = useState<DraftExam[]>([]);
  const [examTitle, setExamTitle] = useState("");
  const [examDate, setExamDate] = useState("");
  const [goalHours, setGoalHours] = useState("5");
  const [completionRecommendation, setCompletionRecommendation] =
    useState<CompletionRecommendation | null>(null);
  const [pdfParsing, setPdfParsing] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfExams, setPdfExams] = useState<PdfExamCandidate[]>([]);
  const [totalPdfFound, setTotalPdfFound] = useState(0);
  const [candidateQuery, setCandidateQuery] = useState("");
  const [candidateFilter, setCandidateFilter] = useState<CandidateFilter>("all");
  const [candidateSort, setCandidateSort] = useState<CandidateSort>("nearest");
  const existingProfile = useMemo(() => readUserProfile(), []);
  const importSelectionHistory = useMemo(() => readImportSelectionHistory(), []);
  const selectionContext = useMemo(
    () => buildSelectionContext(existingProfile),
    [existingProfile],
  );
  const activeStepMeta =
    SETUP_STEPS.find((entry) => entry.id === step) ?? SETUP_STEPS[0];

  const handleNameSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setStep("exams");
  };

  const handleAddExam = (e: FormEvent) => {
    e.preventDefault();
    if (!examTitle.trim() || !examDate) return;

    const parsed = new Date(examDate);
    if (Number.isNaN(parsed.getTime())) return;

    const draft = buildDraftExam({
      title: examTitle.trim(),
      scheduledAt: parsed.toISOString(),
    });

    setExams((prev) =>
      prev.some((exam) => exam.subjectId === draft.subjectId) ? prev : [...prev, draft],
    );
    setExamTitle("");
    setExamDate("");
  };

  const handlePdfUpload = async (file: File) => {
    setPdfParsing(true);
    setPdfError(null);
    setPdfExams([]);
    setTotalPdfFound(0);

    console.debug("[onboarding-import] upload started", {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    });

    try {
      const extraction = await debugExtractExamScheduleFromPdf(file);
      const extracted = extraction.exams;

      console.debug("[onboarding-import] extraction result", {
        fileName: file.name,
        pageCount: extraction.debug.pageCount,
        textItemCount: extraction.debug.textItemCount,
        rawRowCount: extraction.debug.totalRows,
        rawCandidateCount: extraction.debug.candidateCount,
        rowsWithDate: extraction.debug.rowsWithDate,
        rowsRejectedNoDate: extraction.debug.rowsRejectedNoDate,
        rowsRejectedNoTitle: extraction.debug.rowsRejectedNoTitle,
        rowsRejectedDuplicate: extraction.debug.rowsRejectedDuplicate,
      });

      if (extracted.length === 0) {
        console.debug("[onboarding-import] fallback triggered", {
          fileName: file.name,
          fallbackReason: "no_usable_candidates",
          postNormalizationCount: 0,
          shouldShowCandidateList: false,
        });
        setPdfError("PDF'ten seçilebilir sınav bulunamadı. İstersen elle ekleyebilirsin.");
      } else {
        const candidates = extracted.map((exam, index) => ({
            ...exam,
            id: `pdf-${buildDraftExamIdentity(exam.title, exam.scheduledAt, exam.courseCode)}-${index}`,
            selected: false,
            profileSignal: buildProfileSignal(existingProfile, exam),
          }));

        console.debug("[onboarding-import] candidate list ready", {
          fileName: file.name,
          postNormalizationCount: candidates.length,
          shouldShowCandidateList: candidates.length > 0,
        });

        setPdfExams(candidates);
        setTotalPdfFound(candidates.length);
      }
    } catch (error) {
      console.error("[onboarding-import] upload failed", {
        fileName: file.name,
        error,
      });
      setPdfError(getPdfUploadErrorMessage(error));
    } finally {
      setPdfParsing(false);
    }
  };

  const selectionMemory = useMemo(
    () =>
      mergeImportSelectionHistory(
        importSelectionHistory,
        [
          ...exams.map((exam) => ({
            title: exam.title,
            courseCode: exam.courseCode,
            departmentHint: exam.departmentHint,
          })),
          ...pdfExams
            .filter((exam) => exam.selected)
            .map((exam) => ({
              title: exam.title,
              courseCode: exam.courseCode,
              departmentHint: exam.departmentHint,
            })),
        ],
        [],
        selectionContext,
      ),
    [exams, importSelectionHistory, pdfExams, selectionContext],
  );
  const dominantSelectionLanguage = useMemo(
    () => inferDominantImportLanguage(selectionMemory),
    [selectionMemory],
  );

  const visiblePdfExams = useMemo<RankedPdfExamCandidate[]>(() => {
    const query = candidateQuery.trim().toLowerCase();

    return [...pdfExams]
      .filter((exam) => {
        if (candidateFilter === "selected" && !exam.selected) return false;
        if (candidateFilter === "unselected" && exam.selected) return false;
        if (!query) return true;

        return [
          exam.title,
          exam.courseCode ?? "",
          buildShortLabel(exam.title, exam.courseCode),
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .map((exam) => ({
        ...exam,
        selectionSignal: scoreCandidateAgainstImportHistory(
          exam,
          selectionMemory,
          selectionContext,
        ),
      }))
      .sort((left, right) => {
        if (candidateSort === "alpha") {
          return left.title.localeCompare(right.title, "tr");
        }

        if (right.selectionSignal !== left.selectionSignal) {
          return right.selectionSignal - left.selectionSignal;
        }

        if (right.profileSignal !== left.profileSignal) {
          return right.profileSignal - left.profileSignal;
        }

        return (
          new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime()
        );
      });
  }, [
    candidateFilter,
    candidateQuery,
    candidateSort,
    pdfExams,
    selectionContext,
    selectionMemory,
  ]);

  const togglePdfExam = (id: string) => {
    setPdfExams((prev) =>
      prev.map((exam) =>
        exam.id === id ? { ...exam, selected: !exam.selected } : exam,
      ),
    );
  };

  const toggleVisibleCandidates = () => {
    const visibleIds = new Set(visiblePdfExams.map((exam) => exam.id));
    const shouldSelectAll = visiblePdfExams.some((exam) => !exam.selected);

    setPdfExams((prev) =>
      prev.map((exam) =>
        visibleIds.has(exam.id) ? { ...exam, selected: shouldSelectAll } : exam,
      ),
    );
  };

  const confirmPdfSelection = () => {
    const selected = pdfExams.filter((exam) => exam.selected);
    if (selected.length === 0) return;

    const drafted = selected.map((exam) =>
      buildDraftExam({
        title: exam.title,
        scheduledAt: exam.scheduledAt,
        courseCode: exam.courseCode,
        departmentHint: exam.departmentHint,
      }),
    );

    setExams((prev) => {
      const existingIds = new Set(prev.map((exam) => exam.subjectId));
      return [
        ...prev,
        ...drafted.filter((exam) => !existingIds.has(exam.subjectId)),
      ];
    });

    const selectedIds = new Set(selected.map((exam) => exam.id));
    setPdfExams((prev) => prev.filter((exam) => !selectedIds.has(exam.id)));
  };

  const handleRemoveExam = (id: string) => {
    setExams((prev) => prev.filter((exam) => exam.id !== id));
  };

  const handleUpdateCalibration = (
    id: string,
    patch: Partial<SubjectCalibrationAnswers>,
  ) => {
    setExams((prev) =>
      prev.map((exam) =>
        exam.id === id
          ? {
              ...exam,
              calibration: {
                ...exam.calibration,
                ...patch,
              },
            }
          : exam,
      ),
    );
  };

  const handleFinish = () => {
    writeUserProfile({
      name: name.trim(),
      setupCompletedAt: new Date().toISOString(),
      language: existingProfile?.language ?? "tr",
      university: existingProfile?.university ?? "",
      department: existingProfile?.department ?? "",
      classYear: existingProfile?.classYear ?? "",
      knownLanguages: existingProfile?.knownLanguages ?? [],
    });

    const planningExams: Exam[] = exams.map((exam) => ({
      id: exam.id,
      subjectId: exam.subjectId,
      title: exam.title,
      shortLabel: exam.shortLabel,
      scheduledAt: exam.scheduledAt,
    }));
    writePlanningExams(planningExams);

    const planningSeeds = exams.map((exam) =>
      rawAnswersToSubjectSeed(exam.calibration, {
        exam: {
          subjectId: exam.subjectId,
          title: exam.title,
          shortLabel: exam.shortLabel,
        },
      }),
    );
    writePlanningSubjectSeeds(planningSeeds);
    writeImportSelectionHistory(
      mergeImportSelectionHistory(
        importSelectionHistory,
        exams,
        pdfExams.map((exam) => ({
          title: exam.title,
          courseCode: exam.courseCode,
          departmentHint: exam.departmentHint,
        })),
        selectionContext,
      ),
    );

    const hours = Math.max(1, Math.min(16, Number(goalHours) || 5));
    const constraints = {
      dailyStudyGoalHours: hours,
      studyDayStartHour: 9,
      standardStudyDayEndHour: 23,
      morningSleepCutoffHour: 2,
      sleepTargetHours: 7,
      wakeBufferMinutes: 80,
    };
    writePlanningConstraints(constraints);

    const initialSnapshot = buildRiskEngineSnapshot([], new Date(), constraints, {
      exams: planningExams,
      subjectSeeds: planningSeeds,
    });
    const initialFocus = initialSnapshot.rankedSubjects[0] ?? null;

    if (initialFocus) {
      const recommendation = buildStudyRecommendationSentence({
        subjectTitle: initialFocus.title,
        hoursUntilExam: initialFocus.hoursUntilExam,
        remainingGoalMinutes: hours * 60,
        riskLabel: initialFocus.label,
        mode: "start",
      });
      const proximity = getExamProximityProfile(initialFocus.hoursUntilExam);
      const launchDraft = buildStudyLaunchDraft({
        subjectId: initialFocus.subjectId,
        subjectTitle: initialFocus.title,
        hoursUntilExam: initialFocus.hoursUntilExam,
        remainingGoalMinutes: hours * 60,
        riskLabel: initialFocus.label,
        source: "onboarding",
        sourceLabel: recommendation.sentence,
      });
      const recommendationEvent = logRecommendationShown({
        subjectId: launchDraft.subjectId,
        source: launchDraft.source,
        sourceLabel: launchDraft.sourceLabel,
        topic: launchDraft.topic,
        recommendedMinutes: launchDraft.minutes,
      });

      setCompletionRecommendation({
        sentence: recommendation.sentence,
        modeLabel: proximity.label,
        nextExamLabel: `${initialFocus.examTitle} · ${formatOnboardingDate(initialFocus.examDate)}`,
        launchDraft: {
          ...launchDraft,
          recommendationId: recommendationEvent.id,
        },
      });
    } else {
      setCompletionRecommendation(null);
    }

    setStep("done");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:py-12">
      <div className="absolute inset-0 bg-[#07060F]" />

      <div
        className="aurora-orb"
        style={{
          width: "90vw",
          height: "90vw",
          maxWidth: 960,
          maxHeight: 960,
          top: "-25%",
          right: "-15%",
          background:
            "radial-gradient(circle at 38% 38%, rgba(124,58,237,0.90), rgba(109,40,217,0.55) 40%, rgba(79,70,229,0.18) 62%, transparent 75%)",
          filter: "blur(60px)",
          animation: "aurora-a 20s ease-in-out infinite",
        }}
      />
      <div
        className="aurora-orb"
        style={{
          width: "70vw",
          height: "70vw",
          maxWidth: 800,
          maxHeight: 800,
          top: "-18%",
          left: "-20%",
          background:
            "radial-gradient(circle at 52% 52%, rgba(37,99,235,0.75), rgba(29,78,216,0.40) 45%, transparent 68%)",
          filter: "blur(68px)",
          animation: "aurora-b 26s ease-in-out infinite",
        }}
      />
      <div
        className="aurora-orb"
        style={{
          width: "80vw",
          height: "65vw",
          maxWidth: 880,
          maxHeight: 720,
          bottom: "-24%",
          left: "50%",
          transform: "translateX(-50%)",
          background:
            "radial-gradient(circle at 50% 38%, rgba(139,92,246,0.65), rgba(124,58,237,0.28) 45%, transparent 68%)",
          filter: "blur(80px)",
          animation: "aurora-c 18s ease-in-out infinite 4s",
        }}
      />
      <div
        className="aurora-orb"
        style={{
          width: "48vw",
          height: "48vw",
          maxWidth: 560,
          maxHeight: 560,
          top: "35%",
          left: "-8%",
          background:
            "radial-gradient(circle, rgba(6,182,212,0.45), rgba(14,165,233,0.18) 50%, transparent 70%)",
          filter: "blur(56px)",
          animation: "aurora-d 23s ease-in-out infinite 8s",
        }}
      />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_70%_at_50%_44%,transparent_25%,rgba(7,6,15,0.55)_100%)]" />
      <div className="aurora-noise" />

      <div className="relative w-full max-w-[680px]">
        <motion.div {...slideUp(0)} className="mb-6 flex justify-center">
          <div className="relative inline-flex items-center gap-2.5 overflow-hidden rounded-full border border-white/[0.12] bg-white/[0.05] px-4 py-2 backdrop-blur-md">
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
            <span className="relative h-1.5 w-1.5 animate-pulse rounded-full bg-sky-400" />
            <span className="relative text-xs font-medium uppercase tracking-[0.24em] text-sky-100/75">
              EXAM ASSIST
            </span>
          </div>
        </motion.div>

        <motion.div {...slideUp(0.06)} className="mb-5 space-y-3">
          <div className="flex items-center justify-center gap-2">
            {SETUP_STEPS.map((currentStep, index) => (
              <div
                key={currentStep.id}
                className={[
                  "h-1.5 rounded-full transition-all duration-400",
                  step === currentStep.id || step === "done"
                    ? "w-8 bg-sky-400"
                    : SETUP_STEPS.findIndex((entry) => entry.id === step) > index
                      ? "w-4 bg-sky-400/60"
                      : "w-4 bg-white/15",
                ].join(" ")}
              />
            ))}
          </div>

          {step !== "done" ? (
            <div className="rounded-[20px] border border-white/[0.10] bg-black/[0.26] px-4 py-3 backdrop-blur-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                    {activeStepMeta.statusLabel}
                  </p>
                  <p className="mt-1 text-sm font-medium text-white">{activeStepMeta.label}</p>
                </div>
                <span className="rounded-full border border-sky-300/15 bg-sky-300/[0.08] px-3 py-1 text-[11px] text-sky-100">
                  {activeStepMeta.hint}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {activeStepMeta.description}
              </p>
            </div>
          ) : null}
        </motion.div>

        <AnimatePresence mode="wait">
          {step === "name" ? (
            <motion.div
              key="name"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
            >
              <h1 className="mb-2.5 text-center text-[2rem] font-semibold leading-[1.12] tracking-[-0.02em] text-white sm:text-[2.2rem]">
                Hoş geldin.
              </h1>
              <p className="mb-6 text-center text-sm leading-[1.7] text-slate-400">
                Sınav döneminde nereden başlayacağını hızlıca netleştiren kişisel çalışma alanın.
              </p>

              <form onSubmit={handleNameSubmit} className="space-y-3">
                <div className="relative">
                  <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Adın ve soyadın"
                    autoFocus
                    className="w-full rounded-2xl border border-white/[0.12] bg-black/[0.38] py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-600 outline-none backdrop-blur-sm transition-all duration-200 focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/20"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!name.trim()}
                  className="group w-full rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_36px_rgba(14,165,233,0.30),inset_0_1px_0_rgba(255,255,255,0.15)] transition-all duration-200 hover:from-sky-300 hover:to-sky-500 hover:shadow-[0_0_52px_rgba(14,165,233,0.44)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span className="flex items-center justify-center gap-2">
                    Devam
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </button>
              </form>

              <p className="mt-5 text-center text-xs text-slate-600">
                Tüm veriler cihazında saklanır
              </p>
            </motion.div>
          ) : null}

          {step === "exams" ? (
            <motion.div
              key="exams"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
            >
              <h1 className="mb-2.5 text-center text-[1.9rem] font-semibold leading-[1.12] tracking-[-0.02em] text-white sm:text-[2.05rem]">
                Sınavlarını içe aktar
              </h1>
              <p className="mb-5 text-center text-sm leading-[1.7] text-slate-400">
                Önce PDF ile başla. Sistem bulduğu dersleri listelesin, sen sadece sana ait olanları seç.
              </p>

              <div className="mb-4">
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-white/[0.15] bg-white/[0.03] px-4 py-3 text-sm text-slate-400 transition-all duration-200 hover:border-sky-400/40 hover:bg-sky-400/[0.04] hover:text-sky-300">
                  {pdfParsing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-sky-400" />
                      PDF okunuyor...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4" />
                      Sınav takvimini PDF&apos;ten içe aktar
                    </>
                  )}
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    disabled={pdfParsing}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handlePdfUpload(file);
                      e.target.value = "";
                    }}
                  />
                </label>
                {pdfError ? (
                  <p className="mt-2 text-center text-xs text-rose-400">{pdfError}</p>
                ) : null}
                <p className="mt-2 text-center text-xs text-slate-500">
                  PDF çalışırsa elle girişe gerek kalmaz.
                </p>
              </div>

              {pdfExams.length > 0 ? (
                <div className="mb-4 rounded-[20px] border border-violet-400/25 bg-violet-400/[0.05] p-3.5">
                  <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-violet-300">
                        PDF&apos;ten {totalPdfFound} aday bulundu
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Sana ait dersleri seç, geri kalanlar listeye eklenmez.
                      </p>
                      {existingProfile?.department || existingProfile?.knownLanguages.length ? (
                        <p className="mt-1 text-[11px] text-slate-500">
                          Profilindeki bölüm ve dil bilgisi, sana daha yakın görünen dersleri sadece üste taşır.
                        </p>
                      ) : null}
                      {selectionMemory.length > 0 ? (
                        <p className="mt-1 text-[11px] text-slate-500">
                          Önceki seçimlerin ve bu turdaki işaretlerin, benzer dersleri sessizce üste taşır.
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={toggleVisibleCandidates}
                      className="text-xs text-violet-300 hover:text-violet-200"
                    >
                      {visiblePdfExams.every((exam) => exam.selected)
                        ? "Görünenleri kaldır"
                        : "Görünenleri seç"}
                    </button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
                    <label className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <input
                        value={candidateQuery}
                        onChange={(e) => setCandidateQuery(e.target.value)}
                        placeholder="Kod veya ders adı ara"
                        className="w-full rounded-2xl border border-white/[0.10] bg-black/[0.30] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-600 outline-none backdrop-blur-sm transition-all duration-200 focus:border-sky-400/40 focus:ring-2 focus:ring-sky-400/15"
                      />
                    </label>

                    <div className="flex rounded-2xl border border-white/[0.10] bg-black/[0.30] p-1">
                      {([
                        ["all", "Tümü"],
                        ["selected", "Seçili"],
                        ["unselected", "Kalan"],
                      ] as const).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setCandidateFilter(value)}
                          className={[
                            "rounded-xl px-3 py-2 text-xs transition",
                            candidateFilter === value
                              ? "bg-white/[0.10] text-white"
                              : "text-slate-500 hover:text-slate-300",
                          ].join(" ")}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    <div className="flex rounded-2xl border border-white/[0.10] bg-black/[0.30] p-1">
                      {([
                        ["nearest", "En yakın"],
                        ["alpha", "A-Z"],
                      ] as const).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setCandidateSort(value)}
                          className={[
                            "rounded-xl px-3 py-2 text-xs transition",
                            candidateSort === value
                              ? "bg-white/[0.10] text-white"
                              : "text-slate-500 hover:text-slate-300",
                          ].join(" ")}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span>{visiblePdfExams.length} aday gösteriliyor</span>
                    <span>{pdfExams.filter((exam) => exam.selected).length} tanesi seçildi</span>
                  </div>

                  <div className="mt-3 max-h-[280px] space-y-1.5 overflow-y-auto pr-1">
                    {visiblePdfExams.map((exam) => (
                      <button
                        key={exam.id}
                        type="button"
                        onClick={() => togglePdfExam(exam.id)}
                        className={[
                          "flex w-full items-center gap-3 rounded-[14px] border px-3 py-2 text-left transition-all duration-150",
                          exam.selected
                            ? "border-violet-400/40 bg-violet-400/[0.10] text-white"
                            : "border-white/[0.08] bg-white/[0.02] text-slate-400 hover:border-white/15 hover:text-slate-300",
                        ].join(" ")}
                      >
                        <div
                          className={[
                            "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition",
                            exam.selected ? "border-violet-400 bg-violet-400" : "border-white/20",
                          ].join(" ")}
                        >
                          {exam.selected ? <CheckCircle2 className="h-3 w-3 text-white" /> : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-medium">{exam.title}</p>
                            {exam.courseCode ? (
                              <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-slate-500">
                                {exam.courseCode}
                              </span>
                            ) : null}
                          </div>
                          <p className="text-xs text-slate-500">
                            {formatOnboardingDate(exam.scheduledAt)}
                          </p>
                          {exam.selectionSignal > 0 ? (
                            <p className="mt-1 text-[11px] text-emerald-200/80">
                              Seçtiklerine daha yakın duruyor
                              {dominantSelectionLanguage !== "mixed" &&
                              inferTitleLanguageHint(exam.title) === dominantSelectionLanguage
                                ? " · dil tonu da benziyor"
                                : ""}
                            </p>
                          ) : null}
                          {exam.profileSignal > 0 ? (
                            <p className="mt-1 text-[11px] text-sky-200/80">
                              Profilinle daha yakın eşleşiyor
                            </p>
                          ) : null}
                        </div>
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    disabled={!pdfExams.some((exam) => exam.selected)}
                    onClick={confirmPdfSelection}
                    className="mt-3 w-full rounded-[14px] bg-violet-500/80 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Seçili dersleri kullan
                  </button>
                </div>
              ) : null}

              <details className="mb-2 rounded-[18px] border border-white/[0.08] bg-black/[0.18] px-4 py-3">
                <summary className="cursor-pointer list-none text-sm text-slate-400 marker:hidden">
                  PDF işe yaramazsa elle ekle
                </summary>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Bu alan yedek yol. Mümkünse önce PDF ile devam et.
                </p>
                <form onSubmit={handleAddExam} className="mt-3 space-y-3">
                  <input
                    type="text"
                    value={examTitle}
                    onChange={(e) => setExamTitle(e.target.value)}
                    placeholder="Sınav adı"
                    className="w-full rounded-2xl border border-white/[0.12] bg-black/[0.38] px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none backdrop-blur-sm transition-all duration-200 focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/20"
                  />
                  <div className="flex gap-2">
                    <input
                      type="datetime-local"
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                      className="flex-1 rounded-2xl border border-white/[0.12] bg-black/[0.38] px-4 py-3 text-sm text-white outline-none backdrop-blur-sm transition-all duration-200 focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/20 [color-scheme:dark]"
                    />
                    <button
                      type="submit"
                      disabled={!examTitle.trim() || !examDate}
                      className="flex items-center gap-1.5 rounded-2xl border border-sky-400/30 bg-sky-400/[0.12] px-4 text-sm font-medium text-sky-200 backdrop-blur-sm transition-all duration-200 hover:border-sky-400/50 hover:bg-sky-400/20 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <CalendarPlus className="h-4 w-4" />
                      Ekle
                    </button>
                  </div>
                </form>
              </details>

              {exams.length > 0 ? (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Seçtiğin dersler
                    </p>
                    <p className="text-xs text-slate-500">{exams.length} ders hazır</p>
                  </div>
                  {exams.map((exam) => (
                    <div
                      key={exam.id}
                      className="rounded-[18px] border border-white/[0.10] bg-black/[0.30] px-4 py-2.5 backdrop-blur-sm"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white">{exam.title}</p>
                          <p className="text-xs text-slate-500">
                            {formatOnboardingDate(exam.scheduledAt)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveExam(exam.id)}
                          className="text-slate-600 transition hover:text-rose-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep("name")}
                  className="rounded-2xl border border-white/[0.10] bg-white/[0.04] px-4 py-3 text-sm text-slate-400 backdrop-blur-sm transition-all duration-200 hover:border-white/20 hover:text-slate-200"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setStep("calibration")}
                  disabled={exams.length === 0}
                  className="group flex-1 rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_36px_rgba(14,165,233,0.30),inset_0_1px_0_rgba(255,255,255,0.15)] transition-all duration-200 hover:from-sky-300 hover:to-sky-500 hover:shadow-[0_0_52px_rgba(14,165,233,0.44)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span className="flex items-center justify-center gap-2">
                    {exams.length > 0 ? `${exams.length} dersi ayarladın · devam et` : "Kalibrasyona geç"}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </button>
              </div>
            </motion.div>
          ) : null}

          {step === "calibration" ? (
            <motion.div
              key="calibration"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
            >
              <h1 className="mb-2.5 text-center text-[1.9rem] font-semibold leading-[1.12] tracking-[-0.02em] text-white sm:text-[2.05rem]">
                Derslerini kısaca tanıt
              </h1>
              <p className="mb-5 text-center text-sm leading-[1.7] text-slate-400">
                Sadece seçtiğin dersler için üç kısa cevap yeterli. Burayı hızlı geçebilirsin.
              </p>

              <div className="space-y-2.5">
                {exams.map((exam) => (
                  <div
                    key={exam.id}
                    className="rounded-[18px] border border-white/[0.10] bg-black/[0.30] px-4 py-3 backdrop-blur-sm"
                  >
                    <div className="mb-2.5">
                      <p className="text-sm font-medium text-white">{exam.title}</p>
                      <p className="text-xs text-slate-500">
                        {formatOnboardingDate(exam.scheduledAt)}
                      </p>
                    </div>

                    <div className="space-y-2.5">
                      <CalibrationRow
                        label="Zorluk"
                        value={exam.calibration.difficultyRaw}
                        options={[
                          ["az", "Kolay"],
                          ["orta", "Orta"],
                          ["zor", "Zor"],
                        ]}
                        onChange={(value) =>
                          handleUpdateCalibration(exam.id, { difficultyRaw: value as DifficultyCalibrationAnswer })
                        }
                      />
                      <CalibrationRow
                        label="Kaynak"
                        value={exam.calibration.resourceReadinessRaw}
                        options={[
                          ["hazir", "Hazır"],
                          ["kismen", "Kısmen"],
                          ["eksik", "Eksik"],
                        ]}
                        onChange={(value) =>
                          handleUpdateCalibration(exam.id, {
                            resourceReadinessRaw: value as ResourceReadinessAnswer,
                          })
                        }
                      />
                      <CalibrationRow
                        label="Hazırlık"
                        value={exam.calibration.preparednessRaw}
                        options={[
                          ["iyi", "İyi"],
                          ["biraz", "Biraz"],
                          ["az", "Az"],
                        ]}
                        onChange={(value) =>
                          handleUpdateCalibration(exam.id, {
                            preparednessRaw: value as PreparednessAnswer,
                          })
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep("exams")}
                  className="rounded-2xl border border-white/[0.10] bg-white/[0.04] px-4 py-3 text-sm text-slate-400 backdrop-blur-sm transition-all duration-200 hover:border-white/20 hover:text-slate-200"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setStep("goal")}
                  className="group flex-1 rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_36px_rgba(14,165,233,0.30),inset_0_1px_0_rgba(255,255,255,0.15)] transition-all duration-200 hover:from-sky-300 hover:to-sky-500 hover:shadow-[0_0_52px_rgba(14,165,233,0.44)] active:scale-[0.98]"
                >
                  <span className="flex items-center justify-center gap-2">
                    Günlük hedefe geç
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </button>
              </div>
            </motion.div>
          ) : null}

          {step === "goal" ? (
            <motion.div
              key="goal"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
            >
              <h1 className="mb-2.5 text-center text-[1.9rem] font-semibold leading-[1.12] tracking-[-0.02em] text-white sm:text-[2.05rem]">
                Günlük hedefin
              </h1>
              <p className="mb-6 text-center text-sm leading-[1.7] text-slate-400">
                Bir günde gerçekçi olarak kaç saat çıkarabiliyorsun? Bunu sonra yine değiştirebilirsin.
              </p>

              <div className="space-y-3">
                <div className="relative">
                  <Target className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="number"
                    min={1}
                    max={16}
                    step={0.5}
                    value={goalHours}
                    onChange={(e) => setGoalHours(e.target.value)}
                    className="w-full rounded-2xl border border-white/[0.12] bg-black/[0.38] py-3 pl-11 pr-4 text-sm text-white outline-none backdrop-blur-sm transition-all duration-200 focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/20"
                  />
                </div>

                <div className="flex gap-2">
                  {[3, 4, 5, 6, 8].map((hours) => (
                    <button
                      key={hours}
                      type="button"
                      onClick={() => setGoalHours(String(hours))}
                      className={[
                        "flex-1 rounded-xl border py-2 text-sm backdrop-blur-sm transition-all duration-200",
                        goalHours === String(hours)
                          ? "border-sky-400/50 bg-sky-400/[0.14] text-sky-200 shadow-[0_0_16px_rgba(14,165,233,0.15)]"
                          : "border-white/[0.10] bg-white/[0.03] text-slate-400 hover:border-white/20 hover:bg-white/[0.06] hover:text-slate-200",
                      ].join(" ")}
                    >
                      {hours}s
                    </button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep("calibration")}
                  className="rounded-2xl border border-white/[0.10] bg-white/[0.04] px-4 py-3 text-sm text-slate-400 backdrop-blur-sm transition-all duration-200 hover:border-white/20 hover:text-slate-200"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleFinish}
                    className="group flex-1 rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_36px_rgba(14,165,233,0.30),inset_0_1px_0_rgba(255,255,255,0.15)] transition-all duration-200 hover:from-sky-300 hover:to-sky-500 hover:shadow-[0_0_52px_rgba(14,165,233,0.44)] active:scale-[0.98]"
                  >
                    <span className="flex items-center justify-center gap-2">
                      Çalışmaya başla
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </button>
                </div>
              </div>
            </motion.div>
          ) : null}

          {step === "done" ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center gap-4 py-8 text-center"
            >
              <div className="relative">
                <div className="absolute inset-0 animate-pulse rounded-full bg-emerald-400/20 blur-xl" />
                <div className="relative rounded-full border border-emerald-400/30 bg-emerald-400/10 p-3.5">
                  <CheckCircle2 className="h-8 w-8 text-emerald-300" />
                </div>
              </div>
              <div>
                <h2 className="text-[1.7rem] font-semibold tracking-[-0.02em] text-white">Hazırsın.</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Kurulum tamamlandı. İstersen ilk bloğu hazır form ile aç, istersen doğrudan çalışma alanına geç.
                </p>
              </div>

              {completionRecommendation ? (
                <div className="w-full max-w-[520px] rounded-[24px] border border-white/[0.10] bg-black/[0.28] px-5 py-4 text-left backdrop-blur-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-sky-300/15 bg-sky-300/[0.08] px-3 py-1 text-[11px] text-sky-100">
                      İlk öneri
                    </span>
                    <span className="rounded-full border border-white/[0.10] px-3 py-1 text-[11px] text-slate-400">
                      {completionRecommendation.modeLabel}
                    </span>
                  </div>
                  <p className="mt-3 text-base font-medium leading-7 text-white">
                    {completionRecommendation.sentence}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    En yakın sınav: {completionRecommendation.nextExamLabel}
                  </p>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => {
                        if (completionRecommendation.launchDraft?.recommendationId) {
                          markRecommendationAccepted(
                            completionRecommendation.launchDraft.recommendationId,
                          );
                        }

                        onStart({
                          launchDraft: completionRecommendation.launchDraft,
                          startView: "sessions",
                        });
                      }}
                      className="group flex-1 rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_0_32px_rgba(14,165,233,0.28),inset_0_1px_0_rgba(255,255,255,0.12)] transition-all duration-200 hover:from-sky-300 hover:to-sky-500 hover:shadow-[0_0_44px_rgba(14,165,233,0.38)] active:scale-[0.98]"
                    >
                      <span className="flex items-center justify-center gap-2">
                        İlk bloğu hazırla
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onStart({ startView: "home" })}
                      className="rounded-2xl border border-white/[0.10] bg-white/[0.04] px-5 py-3 text-sm text-slate-300 backdrop-blur-sm transition-all duration-200 hover:border-white/20 hover:text-white"
                    >
                      Çalışma alanına geç
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onStart({ startView: "home" })}
                  className="rounded-2xl border border-white/[0.10] bg-white/[0.04] px-5 py-3 text-sm text-slate-300 backdrop-blur-sm transition-all duration-200 hover:border-white/20 hover:text-white"
                >
                  Çalışma alanına geç
                </button>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

function CalibrationRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | null;
  options: ReadonlyArray<readonly [string, string]>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <span className="w-20 text-[11px] uppercase tracking-[0.18em] text-slate-500">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {options.map(([optionValue, optionLabel]) => (
          <button
            key={optionValue}
            type="button"
            onClick={() => onChange(optionValue)}
            className={[
              "rounded-full border px-2.5 py-1 text-[11px] transition",
              value === optionValue
                ? "border-sky-400/50 bg-sky-400/15 text-sky-200"
                : "border-white/10 text-slate-500 hover:text-slate-300",
            ].join(" ")}
          >
            {optionLabel}
          </button>
        ))}
      </div>
    </div>
  );
}
