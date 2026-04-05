"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Clock3, Trash2 } from "lucide-react";

import { PlanningFocusCard } from "@/components/dashboard/planning-focus-card";
import { SectionHeading } from "@/components/dashboard/section-heading";
import { StudyGoalCard } from "@/components/dashboard/study-goal-card";
import { StudySessionForm } from "@/components/dashboard/study-session-form";
import { Card } from "@/components/ui/card";
import { StudyStreakFlame } from "@/components/ui/study-streak-flame";
import { formatMinutesAsHours } from "@/lib/time";
import { RankedSubjectRisk, StudySession, SubjectId, SubjectSeed } from "@/lib/types";

interface SessionsScreenProps {
  subjects: SubjectSeed[];
  onAddSession: (input: { subjectId: SubjectId; minutes: number; notes?: string }) => void;
  onDeleteSession: (id: string) => void;
  sessions: StudySession[];
  sessionsToday: StudySession[];
  dailyMinutes: number;
  dailyGoalMinutes: number;
  topRisk: RankedSubjectRisk | null;
  nextExamTitle: string | null;
  studyStreak: number;
}

export function SessionsScreen({
  subjects,
  onAddSession,
  onDeleteSession,
  sessions,
  sessionsToday,
  dailyMinutes,
  dailyGoalMinutes,
  topRisk,
  nextExamTitle,
  studyStreak,
}: SessionsScreenProps) {
  const subjectMap = Object.fromEntries(subjects.map((s) => [s.id, s.title]));
  const recentSessions = [...sessions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20);

  return (
    <section className="space-y-6">
      <SectionHeading
        eyebrow="Seanslar"
        title="Çalışmalarını kaydet, ilerlemeni gör"
        description="Tamamladığın çalışma bloklarını buraya ekle. Öncelik sıralaması ve günlük hedef otomatik güncellenir."
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_0.88fr]">
        <StudySessionForm
          subjects={subjects}
          onAddSession={onAddSession}
          sessionsToday={sessionsToday}
          embedded
        />

        <div className="grid gap-4">
          <StudyGoalCard
            dailyMinutes={dailyMinutes}
            dailyGoalMinutes={dailyGoalMinutes}
            embedded
          />
          <PlanningFocusCard
            topRisk={topRisk}
            nextExamTitle={nextExamTitle}
            embedded
          />

          {/* Study streak — flame lives here */}
          <Card className="flex items-center justify-between gap-4 px-5 py-4">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Çalışma serisi</p>
              <p className="mt-1 text-sm leading-snug text-slate-300">
                {studyStreak > 0
                  ? `${studyStreak} gün üst üste çalıştın.`
                  : "Bugün bir seans ekle ve seriyi başlat."}
              </p>
            </div>
            <StudyStreakFlame streak={studyStreak} size="compact" className="shrink-0" />
          </Card>
        </div>
      </div>

      {/* Session log */}
      {recentSessions.length > 0 && (
        <Card className="p-5 sm:p-6">
          <p className="mb-4 text-xs uppercase tracking-[0.2em] text-slate-400">Seans Geçmişi</p>
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {recentSessions.map((session) => (
                <motion.div
                  key={session.id}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -16, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.22 }}
                  className="flex items-center justify-between gap-4 rounded-[16px] border border-white/[0.07] bg-white/[0.02] px-4 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-400/10">
                      <Clock3 className="h-3.5 w-3.5 text-sky-300" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">
                        {subjectMap[session.subjectId] ?? session.subjectId}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatMinutesAsHours(session.minutes)} · {new Intl.DateTimeFormat("tr-TR", {
                          day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                        }).format(new Date(session.createdAt))}
                        {session.notes && ` · ${session.notes}`}
                      </p>
                    </div>
                  </div>
                  <motion.button
                    type="button"
                    onClick={() => onDeleteSession(session.id)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="shrink-0 text-slate-600 transition hover:text-rose-400"
                    title="Seansı sil"
                  >
                    <Trash2 className="h-4 w-4" />
                  </motion.button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </Card>
      )}
    </section>
  );
}
