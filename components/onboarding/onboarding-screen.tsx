"use client";

import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, CalendarDays, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

import { exams, workspaceProfile } from "@/lib/seed-data";
import { getCountdownParts } from "@/lib/time";

interface OnboardingScreenProps {
  onStart: () => void;
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] },
});

export function OnboardingScreen({ onStart }: OnboardingScreenProps) {
  const firstExam = [...exams].sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  )[0];
  const firstExamDate = new Date(firstExam.scheduledAt);

  const [countdown, setCountdown] = useState(() =>
    getCountdownParts(firstExamDate, new Date()),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getCountdownParts(firstExamDate, new Date()));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const guides = [
    {
      icon: CalendarDays,
      title: "Yaklaşan sınavlarını gör",
      description: "Hangi sınav ne zaman olduğunu ve ne kadar süre kaldığını her an görürsün.",
    },
    {
      icon: TrendingUp,
      title: "Önceliğini belirle",
      description: "Hangi derse önce odaklanman gerektiğini sistem sana söyler.",
    },
    {
      icon: BookOpen,
      title: "Çalışmalarını kaydet",
      description: "Her çalışma seansını kaydet, ilerlemeyi takip et.",
    },
  ];

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-16">
      {/* Ambient background layers */}
      <div className="absolute inset-0 bg-[#080c18]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(56,189,248,0.13),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_80%_90%,rgba(16,185,129,0.08),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_30%_at_20%_80%,rgba(99,102,241,0.07),transparent)]" />

      {/* Subtle grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:48px_48px]" />

      <div className="relative w-full max-w-[460px]">
        {/* Badge */}
        <motion.div {...fadeUp(0)} className="mb-8 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-400" />
            <span className="text-xs font-medium uppercase tracking-[0.22em] text-sky-100/70">
              EXAM ASSIST
            </span>
          </div>
        </motion.div>

        {/* Greeting */}
        <motion.div {...fadeUp(0.08)} className="mb-3 text-center">
          <h1 className="text-[2.6rem] font-semibold leading-[1.1] tracking-tight text-white">
            Hoş geldin,{" "}
            <span className="bg-gradient-to-r from-sky-300 to-indigo-300 bg-clip-text text-transparent">
              {workspaceProfile.firstName}.
            </span>
          </h1>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          {...fadeUp(0.14)}
          className="mb-8 text-center text-[15px] leading-7 text-slate-400"
        >
          Sınav haftanda seni yönlendirecek bir yer. Ne üzerinde çalışman gerektiğini,
          önceliğini ve zamanını burada göreceksin.
        </motion.p>

        {/* Countdown card */}
        <motion.div {...fadeUp(0.2)} className="mb-6">
          <div className="relative overflow-hidden rounded-2xl border border-sky-400/15 bg-[linear-gradient(135deg,rgba(7,12,26,0.9),rgba(10,20,38,0.85))] p-5">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-400/40 to-transparent" />
            <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-sky-500/5 blur-2xl" />

            <p className="mb-1 text-xs uppercase tracking-[0.2em] text-slate-500">
              İlk sınava kalan süre — {firstExam.title}
            </p>

            <div className="flex items-end gap-1">
              <CountdownUnit value={countdown.days} label="gün" />
              <span className="mb-3 text-2xl font-light text-slate-600">:</span>
              <CountdownUnit value={countdown.hours} label="saat" />
              <span className="mb-3 text-2xl font-light text-slate-600">:</span>
              <CountdownUnit value={countdown.minutes} label="dak" />
              <span className="mb-3 text-2xl font-light text-slate-600">:</span>
              <CountdownUnit value={countdown.seconds} label="sn" />
            </div>
          </div>
        </motion.div>

        {/* Guide items */}
        <motion.div {...fadeUp(0.28)} className="mb-8 space-y-2.5">
          {guides.map((guide, i) => (
            <motion.div
              key={guide.title}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.34 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-start gap-3.5 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3.5 backdrop-blur-sm"
            >
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05]">
                <guide.icon className="h-3.5 w-3.5 text-sky-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{guide.title}</p>
                <p className="mt-0.5 text-xs leading-5 text-slate-500">{guide.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div {...fadeUp(0.58)}>
          <button
            onClick={onStart}
            className="group relative w-full overflow-hidden rounded-2xl bg-sky-500 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_0_32px_rgba(14,165,233,0.28)] transition-all duration-300 hover:bg-sky-400 hover:shadow-[0_0_48px_rgba(14,165,233,0.42)] active:scale-[0.98]"
          >
            <span className="relative flex items-center justify-center gap-2">
              Çalışmaya başla
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </span>
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          </button>

          <p className="mt-4 text-center text-xs text-slate-600">
            Tüm veriler cihazında saklanır. Hesap gerekmez.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="min-w-[2.2ch] text-center text-3xl font-semibold tabular-nums text-white">
        {String(value).padStart(2, "0")}
      </span>
      <span className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-slate-600">
        {label}
      </span>
    </div>
  );
}
