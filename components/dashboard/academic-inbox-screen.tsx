"use client";

import { useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  CheckCheck,
  Clock3,
  Inbox,
  ListChecks,
  Megaphone,
  Sparkles,
  X,
} from "lucide-react";

import { SectionHeading } from "@/components/dashboard/section-heading";
import { WorkspaceView } from "@/components/dashboard/workspace-nav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FloatingFeedbackToast } from "@/components/ui/floating-feedback-toast";
import { useFloatingFeedback } from "@/hooks/useFloatingFeedback";
import { buildAcademicEventDisplay, sortAcademicEvents } from "@/lib/academic-events";
import { cn } from "@/lib/utils";
import { AcademicEvent, AcademicEventType, SubjectSeed } from "@/lib/types";

interface AcademicInboxScreenProps {
  now: Date;
  events: AcademicEvent[];
  subjects: SubjectSeed[];
  onNavigate: (view: WorkspaceView) => void;
  onDismissEvent: (eventId: string) => void;
  onResolveEvent: (eventId: string) => void;
}

export function AcademicInboxScreen({
  now,
  events,
  subjects,
  onNavigate,
  onDismissEvent,
  onResolveEvent,
}: AcademicInboxScreenProps) {
  const { feedback, showFeedback } = useFloatingFeedback(2600);
  const sortedEvents = useMemo(() => sortAcademicEvents(events, now), [events, now]);

  const coursePulse = useMemo(() => {
    const grouped = new Map<
      string,
      {
        courseLabel: string;
        courseTitle: string;
        itemCount: number;
        highCount: number;
        topEvent: AcademicEvent;
      }
    >();

    for (const event of sortedEvents) {
      const display = buildAcademicEventDisplay(event, subjects);
      const subject = display.subjectId
        ? subjects.find((entry) => entry.id === display.subjectId)
        : null;
      const key = display.subjectId ?? display.courseLabel;
      const current = grouped.get(key);

      if (!current) {
        grouped.set(key, {
          courseLabel: display.courseLabel,
          courseTitle: subject?.title ?? display.title,
          itemCount: 1,
          highCount: event.significance === "high" ? 1 : 0,
          topEvent: event,
        });
        continue;
      }

      current.itemCount += 1;
      if (event.significance === "high") {
        current.highCount += 1;
      }
    }

    return [...grouped.values()].sort((left, right) => {
      if (right.highCount !== left.highCount) {
        return right.highCount - left.highCount;
      }

      if (right.itemCount !== left.itemCount) {
        return right.itemCount - left.itemCount;
      }

      return (
        new Date(right.topEvent.occurredAt).getTime() -
        new Date(left.topEvent.occurredAt).getTime()
      );
    });
  }, [sortedEvents, subjects]);

  const handleResolve = (eventId: string) => {
    onResolveEvent(eventId);
    showFeedback({
      label: "Akademik inbox",
      title: "Sinyal çözüldü olarak işaretlendi",
      body: "Bu item artık aktif akıştan düşecek.",
      variant: "success",
    });
  };

  const handleDismiss = (eventId: string) => {
    onDismissEvent(eventId);
    showFeedback({
      label: "Akademik inbox",
      title: "Sinyal sessizce kapatıldı",
      body: "Gerekirse daha sonra yeni bir sinyal olarak yeniden doğabilir.",
      variant: "info",
    });
  };

  return (
    <section className="space-y-6">
      <SectionHeading
        eyebrow="Akademik inbox"
        title="Bu hafta gerçekten ne değişti"
        description="Portal akışı değil; planını etkileyen akademik değişikliklerin sakin ve aksiyon odaklı görünümü."
      />

      {sortedEvents.length === 0 ? (
        <Card className="border border-white/10 bg-white/[0.035] p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-sky-300/18 bg-sky-300/10 text-sky-100">
              <Inbox className="h-5 w-5" />
            </span>
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                Sessiz hafta
              </p>
              <h3 className="text-lg font-semibold text-white">
                Şu an belirgin bir akademik değişiklik görünmüyor
              </h3>
              <p className="max-w-2xl text-sm leading-6 text-slate-300">
                Bu iyi bir şey. Ana planlama katmanı çalışmaya devam ediyor; istersen
                önceliklere ya da kütüphaneye dönüp haftayı elle şekillendirebilirsin.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button type="button" onClick={() => onNavigate("priorities")}>
                  Önceliklere git
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onNavigate("library")}
                >
                  Kütüphaneyi aç
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.95fr)]">
          <div className="space-y-3">
            {sortedEvents.map((event) => {
              const display = buildAcademicEventDisplay(event, subjects);
              const action = getAcademicEventAction(event.type);
              const timeLabel = getAcademicEventTimeLabel(event, now);
              const canCloseEvent = event.provenance !== "system_derived";

              return (
                <Card
                  key={event.id}
                  className="border border-white/10 bg-white/[0.035] p-4 sm:p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/20 text-slate-100">
                          {getAcademicEventIcon(event.type)}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-300">
                          {getAcademicEventEyebrow(event.type)}
                        </span>
                        <span className="rounded-full border border-sky-300/20 bg-sky-300/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-sky-100">
                          {display.courseLabel}
                        </span>
                        <span
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.16em]",
                            event.significance === "high"
                              ? "border-rose-300/18 bg-rose-300/10 text-rose-100"
                              : event.significance === "medium"
                                ? "border-amber-300/18 bg-amber-300/10 text-amber-100"
                                : "border-white/10 bg-white/[0.04] text-slate-300",
                          )}
                        >
                          {event.significance === "high"
                            ? "Yüksek etki"
                            : event.significance === "medium"
                              ? "Bu hafta önemli"
                              : "Hafif sinyal"}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-white">{display.title}</h3>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                          {display.body}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
                        {timeLabel ? (
                          <span className="inline-flex items-center gap-2">
                            <Clock3 className="h-4 w-4 text-slate-500" />
                            {timeLabel}
                          </span>
                        ) : null}
                        <span
                          className={cn(
                            "inline-flex items-center gap-2",
                            event.planningImpact === "strong"
                              ? "text-rose-200"
                              : event.planningImpact === "soft"
                                ? "text-sky-200"
                                : "text-slate-400",
                          )}
                        >
                          <Sparkles className="h-4 w-4" />
                          {event.planningImpact === "strong"
                            ? "Planı güçlü biçimde etkiliyor"
                            : event.planningImpact === "soft"
                              ? "Planı yumuşak biçimde etkiliyor"
                              : "Şimdilik arka planda"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {canCloseEvent ? (
                        <>
                          <Button
                            type="button"
                            variant="ghost"
                            className="gap-2"
                            onClick={() => handleDismiss(event.id)}
                          >
                            <X className="h-4 w-4" />
                            Sessiz kapat
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            className="gap-2"
                            onClick={() => handleResolve(event.id)}
                          >
                            <CheckCheck className="h-4 w-4" />
                            Çözüldü
                          </Button>
                        </>
                      ) : null}
                      <Button
                        type="button"
                        className="gap-2"
                        onClick={() => onNavigate(action.view)}
                      >
                        {action.label}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="space-y-3">
            <Card className="border border-white/10 bg-white/[0.035] p-4 sm:p-5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                Ders nabzı
              </p>
              <h3 className="mt-2 text-lg font-semibold text-white">
                Hangi derslerde hareket var
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Inbox akışının ders bazlı kısa özeti. Hangi derste baskı arttıysa önce o görünür.
              </p>
            </Card>

            {coursePulse.map((pulse) => {
              const action = getAcademicEventAction(pulse.topEvent.type);
              return (
                <Card
                  key={`${pulse.courseLabel}-${pulse.topEvent.id}`}
                  className="border border-white/10 bg-white/[0.035] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-sky-300/20 bg-sky-300/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-sky-100">
                          {pulse.courseLabel}
                        </span>
                        {pulse.highCount > 0 ? (
                          <span className="rounded-full border border-rose-300/18 bg-rose-300/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-rose-100">
                            {pulse.highCount} yüksek sinyal
                          </span>
                        ) : null}
                      </div>
                      <h4 className="text-base font-semibold text-white">
                        {pulse.courseTitle}
                      </h4>
                      <p className="text-sm leading-6 text-slate-300">
                        {pulse.itemCount === 1
                          ? "Bu derste tek ama anlamlı bir değişiklik var."
                          : `Bu derste şu an ${pulse.itemCount} aktif akademik sinyal var.`}
                      </p>
                      <p className="text-sm text-slate-400">
                        {buildAcademicEventDisplay(pulse.topEvent, subjects).body}
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      className="shrink-0 gap-2"
                      onClick={() => onNavigate(action.view)}
                    >
                      {action.label}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <AnimatePresence initial={false}>
        {feedback ? <FloatingFeedbackToast {...feedback} /> : null}
      </AnimatePresence>
    </section>
  );
}

function getAcademicEventEyebrow(type: AcademicEventType) {
  if (type === "assignment_due") return "Teslim";
  if (type === "deadline_change") return "Tarih değişti";
  if (type === "material_update") return "Yeni materyal";
  if (type === "grade_release") return "Sonuç";
  if (type === "announcement") return "Duyuru";
  return "Sınav";
}

function getAcademicEventIcon(type: AcademicEventType) {
  if (type === "material_update") {
    return <BookOpen className="h-4.5 w-4.5" />;
  }

  if (type === "assignment_due" || type === "deadline_change") {
    return <CalendarClock className="h-4.5 w-4.5" />;
  }

  if (type === "grade_release") {
    return <ListChecks className="h-4.5 w-4.5" />;
  }

  if (type === "announcement") {
    return <Megaphone className="h-4.5 w-4.5" />;
  }

  return <Inbox className="h-4.5 w-4.5" />;
}

function getAcademicEventAction(type: AcademicEventType): {
  label: string;
  view: WorkspaceView;
} {
  if (type === "material_update") {
    return { label: "Kütüphaneye git", view: "library" };
  }

  if (type === "assignment_due" || type === "deadline_change") {
    return { label: "Takvimi aç", view: "schedule" };
  }

  if (type === "grade_release") {
    return { label: "Takvime dön", view: "schedule" };
  }

  return { label: "Önceliklere bak", view: "priorities" };
}

function getAcademicEventTimeLabel(event: AcademicEvent, now: Date) {
  if (event.dueAt) {
    const remainingHours =
      (new Date(event.dueAt).getTime() - now.getTime()) / 3_600_000;

    if (remainingHours < 0) {
      const overdueHours = Math.abs(remainingHours);
      if (overdueHours < 24) return "Bugün gecikmiş görünüyor";
      const overdueDays = Math.ceil(overdueHours / 24);
      return `${overdueDays} gündür gecikmiş`;
    }

    if (remainingHours <= 24) {
      return "24 saat içinde";
    }

    const remainingDays = Math.ceil(remainingHours / 24);
    return `${remainingDays} gün kaldı`;
  }

  const ageHours = (now.getTime() - new Date(event.occurredAt).getTime()) / 3_600_000;
  if (ageHours < 24) {
    return "Bugün geldi";
  }

  const ageDays = Math.floor(ageHours / 24);
  return `${ageDays} gün önce`;
}
