"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, CalendarPlus, CheckCircle2, Target, Trash2, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { writeUserProfile, writePlanningExams, writePlanningConstraints, writePlanningSubjectSeeds } from "@/lib/storage";
import { Exam, SubjectSeed } from "@/lib/types";

interface OnboardingScreenProps {
  onStart: () => void;
}

const slideUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as const },
});

type Step = "name" | "exams" | "goal" | "done";

interface DraftExam {
  id: string;
  title: string;
  scheduledAt: string;
}

export function OnboardingScreen({ onStart }: OnboardingScreenProps) {
  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState("");
  const [exams, setExams] = useState<DraftExam[]>([]);
  const [examTitle, setExamTitle] = useState("");
  const [examDate, setExamDate] = useState("");
  const [goalHours, setGoalHours] = useState("5");

  const handleNameSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setStep("exams");
  };

  const handleAddExam = (e: FormEvent) => {
    e.preventDefault();
    if (!examTitle.trim() || !examDate) return;
    const id = `exam-${Date.now()}`;
    setExams((prev) => [
      ...prev,
      { id, title: examTitle.trim(), scheduledAt: new Date(examDate).toISOString() },
    ]);
    setExamTitle("");
    setExamDate("");
  };

  const handleRemoveExam = (id: string) => {
    setExams((prev) => prev.filter((e) => e.id !== id));
  };

  const handleFinish = () => {
    // Write user profile
    writeUserProfile({
      name: name.trim(),
      setupCompletedAt: new Date().toISOString(),
      language: "tr",
    });

    // Write exams and auto-generated subject seeds if user entered any
    if (exams.length > 0) {
      const planningExams: Exam[] = exams.map((e) => ({
        id: e.id,
        subjectId: e.id,
        title: e.title,
        shortLabel: e.title.split(" ").map((w) => w[0]).join("").slice(0, 5).toUpperCase(),
        scheduledAt: e.scheduledAt,
      }));
      writePlanningExams(planningExams);

      // Auto-create a subject seed for each exam with neutral defaults
      const planningSeeds: SubjectSeed[] = exams.map((e) => ({
        id: e.id,
        title: e.title,
        shortLabel: e.title.split(" ").map((w) => w[0]).join("").slice(0, 5).toUpperCase(),
        contentLoad: 3,
        difficulty: 3,
        practiceNeed: 3,
        resourceFriction: 2,
        reliefFactor: 0.5,
        targetHours: 10,
        initialStudiedCredit: 0,
      }));
      writePlanningSubjectSeeds(planningSeeds);
    }

    // Write constraints
    const hours = Math.max(1, Math.min(16, Number(goalHours) || 5));
    writePlanningConstraints({
      dailyStudyGoalHours: hours,
      studyDayStartHour: 9,
      standardStudyDayEndHour: 23,
      morningSleepCutoffHour: 2,
      sleepTargetHours: 7,
      wakeBufferMinutes: 80,
    });

    setStep("done");
    setTimeout(onStart, 900);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-16">
      <div className="absolute inset-0 bg-[#080c18]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(56,189,248,0.13),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_80%_90%,rgba(16,185,129,0.08),transparent)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:48px_48px]" />

      <div className="relative w-full max-w-[480px]">
        {/* Badge */}
        <motion.div {...slideUp(0)} className="mb-8 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-400" />
            <span className="text-xs font-medium uppercase tracking-[0.22em] text-sky-100/70">
              EXAM ASSIST
            </span>
          </div>
        </motion.div>

        {/* Step indicator */}
        <motion.div {...slideUp(0.06)} className="mb-6 flex items-center justify-center gap-2">
          {(["name", "exams", "goal"] as const).map((s, i) => (
            <div
              key={s}
              className={[
                "h-1.5 rounded-full transition-all duration-400",
                step === s || step === "done"
                  ? "w-8 bg-sky-400"
                  : (["name", "exams", "goal"].indexOf(step) > i)
                    ? "w-4 bg-sky-400/60"
                    : "w-4 bg-white/15",
              ].join(" ")}
            />
          ))}
        </motion.div>

        <AnimatePresence mode="wait">
          {step === "name" && (
            <motion.div
              key="name"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
            >
              <h1 className="mb-2 text-center text-[2.2rem] font-semibold leading-tight text-white">
                Hoş geldin.
              </h1>
              <p className="mb-8 text-center text-[15px] leading-7 text-slate-400">
                Sınav haftanda seni yönlendirecek kişisel çalışma alanın. Başlamak için adını gir.
              </p>

              <form onSubmit={handleNameSubmit} className="space-y-4">
                <div className="relative">
                  <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Adın ve soyadın"
                    autoFocus
                    className="w-full rounded-2xl border border-white/10 bg-black/20 py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-slate-600 outline-none focus:border-sky-400/40 focus:ring-2 focus:ring-sky-400/20 transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!name.trim()}
                  className="group w-full rounded-2xl bg-sky-500 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_0_32px_rgba(14,165,233,0.28)] transition-all hover:bg-sky-400 hover:shadow-[0_0_48px_rgba(14,165,233,0.42)] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center justify-center gap-2">
                    Devam
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </button>
              </form>

              <p className="mt-4 text-center text-xs text-slate-600">
                Tüm veriler cihazında saklanır. Hesap gerekmez.
              </p>
            </motion.div>
          )}

          {step === "exams" && (
            <motion.div
              key="exams"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
            >
              <h1 className="mb-2 text-center text-[2rem] font-semibold leading-tight text-white">
                Sınavlarını ekle
              </h1>
              <p className="mb-6 text-center text-[14px] leading-7 text-slate-400">
                Öncelik sıralaması sınav tarihlerine göre çalışır. En az bir sınav ekle.
              </p>

              <form onSubmit={handleAddExam} className="space-y-3">
                <input
                  type="text"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  placeholder="Sınav adı (örn. Matematik Final)"
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-sky-400/40 focus:ring-2 focus:ring-sky-400/20 transition"
                />
                <div className="flex gap-2">
                  <input
                    type="datetime-local"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="flex-1 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-sky-400/40 focus:ring-2 focus:ring-sky-400/20 transition [color-scheme:dark]"
                  />
                  <button
                    type="submit"
                    disabled={!examTitle.trim() || !examDate}
                    className="flex items-center gap-1.5 rounded-2xl border border-sky-400/30 bg-sky-400/10 px-4 py-3 text-sm font-medium text-sky-200 transition hover:bg-sky-400/20 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <CalendarPlus className="h-4 w-4" />
                    Ekle
                  </button>
                </div>
              </form>

              {exams.length > 0 && (
                <div className="mt-4 space-y-2">
                  {exams.map((exam) => (
                    <div
                      key={exam.id}
                      className="flex items-center justify-between gap-3 rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{exam.title}</p>
                        <p className="text-xs text-slate-500">
                          {new Intl.DateTimeFormat("tr-TR", {
                            day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
                          }).format(new Date(exam.scheduledAt))}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveExam(exam.id)}
                        className="text-slate-600 hover:text-rose-400 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep("goal")}
                  disabled={exams.length === 0}
                  className="group flex-1 rounded-2xl bg-sky-500 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_0_32px_rgba(14,165,233,0.28)] transition-all hover:bg-sky-400 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center justify-center gap-2">
                    Devam
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep("goal")}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm text-slate-400 transition hover:text-slate-200"
                >
                  Atla
                </button>
              </div>
            </motion.div>
          )}

          {step === "goal" && (
            <motion.div
              key="goal"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
            >
              <h1 className="mb-2 text-center text-[2rem] font-semibold leading-tight text-white">
                Günlük hedefin
              </h1>
              <p className="mb-8 text-center text-[14px] leading-7 text-slate-400">
                Bir günde kaç saat çalışmayı hedefliyorsun? Daha sonra değiştirebilirsin.
              </p>

              <div className="space-y-4">
                <div className="relative">
                  <Target className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="number"
                    min={1}
                    max={16}
                    step={0.5}
                    value={goalHours}
                    onChange={(e) => setGoalHours(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 py-3.5 pl-11 pr-4 text-sm text-white outline-none focus:border-sky-400/40 focus:ring-2 focus:ring-sky-400/20 transition"
                  />
                </div>

                <div className="flex gap-2">
                  {[3, 4, 5, 6, 8].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setGoalHours(String(h))}
                      className={[
                        "flex-1 rounded-xl border py-2.5 text-sm transition",
                        goalHours === String(h)
                          ? "border-sky-400/40 bg-sky-400/12 text-sky-200"
                          : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:text-slate-200",
                      ].join(" ")}
                    >
                      {h}s
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleFinish}
                  className="group w-full rounded-2xl bg-sky-500 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_0_32px_rgba(14,165,233,0.28)] transition-all hover:bg-sky-400 hover:shadow-[0_0_48px_rgba(14,165,233,0.42)] active:scale-[0.98]"
                >
                  <span className="flex items-center justify-center gap-2">
                    Çalışmaya başla
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </button>
              </div>
            </motion.div>
          )}

          {step === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col items-center gap-4 py-8 text-center"
            >
              <CheckCircle2 className="h-12 w-12 text-emerald-400" />
              <div>
                <h2 className="text-2xl font-semibold text-white">Hazırsın.</h2>
                <p className="mt-2 text-sm text-slate-400">Çalışma alanın yükleniyor...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
