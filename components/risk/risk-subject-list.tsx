"use client";

import { AlertTriangle, ArrowDownToLine, Gauge, Timer } from "lucide-react";
import { motion } from "framer-motion";

import { Card } from "@/components/ui/card";
import { getGuidanceCopy } from "@/lib/risk-presentation";
import {
  formatApproxHours,
  formatExamDate,
  formatPlannedHours,
  formatRelativeDuration,
} from "@/lib/time";
import { RankedSubjectRisk } from "@/lib/types";

interface RiskSubjectListProps {
  subjects: RankedSubjectRisk[];
}

export function RiskSubjectList({ subjects }: RiskSubjectListProps) {
  if (subjects.length === 0) {
    return null;
  }

  const [leadSubject, ...rest] = subjects;
  const nextUp = rest.slice(0, 3);
  const laterQueue = rest.slice(3);

  return (
    <div className="space-y-4">
      <Card id="lead-priority" className="overflow-hidden p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4 border-b border-white/8 pb-5">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
              Birinci Öncelik
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-white">
              Şu an için en net adım
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Şu an en çok dikkat isteyen ders bu.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3 text-amber-200">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-6">
          <LeadRiskCard subject={leadSubject} />
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.92fr]">
        <Card className="overflow-hidden p-5">
          <div className="border-b border-white/8 pb-4">
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
              Sıradakiler
            </p>
            <h4 className="mt-2 text-xl font-semibold text-white">
              Bunları da yakın tut
            </h4>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Birinci öncelikten sonra dikkat isteyen dersler.
            </p>
          </div>

          <div className="mt-4 grid gap-3">
            {nextUp.map((subject, index) => (
              <PriorityListItem
                key={subject.subjectId}
                subject={subject}
                rank={index + 2}
              />
            ))}
          </div>
        </Card>

        {laterQueue.length > 0 ? (
          <Card className="overflow-hidden p-5">
            <div className="border-b border-white/8 pb-4">
              <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
                Bekleme Sırası
              </p>
              <h4 className="mt-2 text-xl font-semibold text-white">
                Henüz baskısı düşük dersler
              </h4>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Şimdilik rahat, ama takipte tut.
              </p>
            </div>

            <div className="mt-4 grid gap-3">
              {laterQueue.map((subject, index) => (
                <PriorityListItem
                  key={subject.subjectId}
                  subject={subject}
                  rank={index + nextUp.length + 2}
                  compact
                />
              ))}
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

function LeadRiskCard({ subject }: { subject: RankedSubjectRisk }) {
  const guidance = getGuidanceCopy(subject.label, { rank: 1 });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-[28px] border border-white/10 bg-[linear-gradient(140deg,rgba(18,22,36,0.95),rgba(18,24,39,0.9),rgba(12,18,26,0.96))] p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-full border border-white/10 bg-black/20 px-2 text-sm font-semibold text-slate-200">
              #1
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                Hemen odaklan
              </p>
              <h4 className="mt-1 text-2xl font-semibold text-white">
                {subject.title}
              </h4>
              <p className="mt-1 text-sm text-slate-400">
                {subject.examTitle} · {formatExamDate(new Date(subject.examDate))}
              </p>
            </div>
          </div>

          <p className="max-w-3xl text-sm leading-6 text-slate-300">
            {subject.explanation}
          </p>
        </div>

        <div className="text-right">
          <RiskBadge label={subject.label} />
          <p className="mt-3 text-lg font-semibold text-white">
            {guidance.summary}
          </p>
          <p className="text-sm text-slate-400">bugünkü çalışma odağında bu ders öne çıkıyor</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <FactorCard
          icon={ArrowDownToLine}
          label="Kalan alan"
          value={`${formatPlannedHours(subject.remainingTargetHours)} / ${formatPlannedHours(subject.targetHours)}`}
          caption={`${formatPlannedHours(subject.hoursStudied)} çalışıldı`}
        />
        <FactorCard
          icon={Gauge}
          label="Kullanılabilir süre"
          value={formatApproxHours(subject.effectiveStudyHoursLeft)}
          caption="sınava kadar tahmini çalışma süresi"
        />
        <FactorCard
          icon={Timer}
          label="Sınava kalan"
          value={formatRelativeDuration(subject.hoursUntilExam * 3_600_000)}
          caption={`${subject.examTitle} son tarihi`}
        />
      </div>
    </motion.div>
  );
}

function PriorityListItem({
  subject,
  rank,
  compact = false,
}: {
  subject: RankedSubjectRisk;
  rank: number;
  compact?: boolean;
}) {
  const guidance = getGuidanceCopy(subject.label, { rank });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, delay: rank * 0.03 }}
      className="rounded-[22px] border border-white/10 bg-white/[0.035] p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full border border-white/10 bg-black/20 text-xs font-semibold text-slate-200">
              #{rank}
            </span>
            <p className="truncate text-lg font-semibold text-white">{subject.title}</p>
          </div>
          <p className="mt-2 text-sm text-slate-400">
            {formatExamDate(new Date(subject.examDate))}
          </p>
        </div>

        <div className="text-right">
          <RiskBadge label={subject.label} />
          <p className="mt-2 text-sm font-medium text-slate-300">
            {guidance.summary}
          </p>
        </div>
      </div>

      <div className={`mt-4 grid gap-3 ${compact ? "" : "md:grid-cols-3"}`}>
        <CompactMetric
          label="Kalan çalışma"
          value={formatPlannedHours(subject.remainingTargetHours)}
        />
        <CompactMetric
          label="Müsait süre"
          value={formatApproxHours(subject.effectiveStudyHoursLeft)}
        />
        <CompactMetric
          label="Sınava kalan"
          value={formatRelativeDuration(subject.hoursUntilExam * 3_600_000)}
        />
      </div>
    </motion.div>
  );
}

function CompactMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[18px] border border-white/8 bg-black/20 px-3 py-2.5">
      <span className="text-xs uppercase tracking-[0.16em] text-slate-400">{label}</span>
      <span className="text-sm font-medium text-white">{value}</span>
    </div>
  );
}

function RiskBadge({ label }: { label: RankedSubjectRisk["label"] }) {
  const guidance = getGuidanceCopy(label);
  const className =
    label === "Critical"
      ? "border-rose-400/25 bg-rose-400/10 text-rose-100"
      : label === "High"
        ? "border-amber-300/25 bg-amber-300/10 text-amber-50"
        : label === "Moderate"
          ? "border-sky-300/25 bg-sky-300/10 text-sky-50"
          : "border-emerald-300/25 bg-emerald-300/10 text-emerald-50";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs uppercase tracking-[0.18em] ${className}`}
    >
      {guidance.badge}
    </span>
  );
}

function FactorCard({
  icon: Icon,
  label,
  value,
  caption,
}: {
  icon: typeof AlertTriangle;
  label: string;
  value: string;
  caption: string;
}) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-black/20 p-4">
      <Icon className="h-4 w-4 text-slate-200" />
      <p className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
      <p className="mt-1 text-sm leading-6 text-slate-300">{caption}</p>
    </div>
  );
}
